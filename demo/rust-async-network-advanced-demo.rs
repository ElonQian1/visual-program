// Rust异步网络演示文件 - 展示现代异步编程和网络处理模式
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use hyper::{Body, Request, Response, Server};
use hyper::service::{make_service_fn, service_fn};
use hyper::{Method, StatusCode};
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock, mpsc, oneshot, broadcast};
use tokio::time::{timeout, Duration, sleep};
use futures::{stream, StreamExt, SinkExt};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use tracing::{info, error, warn, debug, instrument};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    pub status: String,
    pub data: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct ConnectionPool {
    connections: Arc<RwLock<Vec<TcpStream>>>,
    max_size: usize,
    timeout: Duration,
}

impl ConnectionPool {
    pub fn new(max_size: usize, timeout: Duration) -> Self {
        Self {
            connections: Arc::new(RwLock::new(Vec::new())),
            max_size,
            timeout,
        }
    }

    pub async fn get_connection(&self) -> Result<TcpStream> {
        let mut connections = self.connections.write().await;
        if let Some(conn) = connections.pop() {
            Ok(conn)
        } else {
            // 创建新连接
            let conn = TcpStream::connect("127.0.0.1:8080")
                .await
                .context("Failed to create new connection")?;
            Ok(conn)
        }
    }

    pub async fn return_connection(&self, stream: TcpStream) -> Result<()> {
        let mut connections = self.connections.write().await;
        if connections.len() < self.max_size {
            connections.push(stream);
        }
        Ok(())
    }
}

// 异步HTTP服务器
pub struct AsyncWebServer {
    addr: SocketAddr,
    pool: Arc<ConnectionPool>,
    shutdown_tx: Option<oneshot::Sender<()>>,
}

impl AsyncWebServer {
    pub fn new(addr: SocketAddr) -> Self {
        let pool = Arc::new(ConnectionPool::new(100, Duration::from_secs(30)));
        Self {
            addr,
            pool,
            shutdown_tx: None,
        }
    }

    #[instrument(skip(self))]
    pub async fn start(&mut self) -> Result<()> {
        let (shutdown_tx, shutdown_rx) = oneshot::channel();
        self.shutdown_tx = Some(shutdown_tx);

        let pool = Arc::clone(&self.pool);
        
        let make_svc = make_service_fn(move |_conn| {
            let pool = Arc::clone(&pool);
            async move {
                Ok::<_, Infallible>(service_fn(move |req| {
                    let pool = Arc::clone(&pool);
                    async move {
                        handle_request(req, pool).await
                    }
                }))
            }
        });

        let server = Server::bind(&self.addr)
            .serve(make_svc)
            .with_graceful_shutdown(async {
                shutdown_rx.await.ok();
                info!("Server shutting down gracefully");
            });

        info!("Server starting on {}", self.addr);
        
        if let Err(e) = server.await {
            error!("Server error: {}", e);
            return Err(e.into());
        }

        Ok(())
    }

    pub async fn shutdown(&mut self) -> Result<()> {
        if let Some(tx) = self.shutdown_tx.take() {
            tx.send(()).map_err(|_| anyhow::anyhow!("Failed to send shutdown signal"))?;
        }
        Ok(())
    }
}

#[instrument(skip(pool))]
async fn handle_request(
    req: Request<Body>,
    pool: Arc<ConnectionPool>,
) -> Result<Response<Body>, Infallible> {
    let response = match (req.method(), req.uri().path()) {
        (&Method::GET, "/health") => {
            Response::builder()
                .status(StatusCode::OK)
                .body(Body::from("OK"))
                .unwrap()
        }
        (&Method::GET, "/api/data") => {
            match fetch_data_with_timeout().await {
                Ok(data) => {
                    let api_response = ApiResponse {
                        status: "success".to_string(),
                        data,
                        timestamp: chrono::Utc::now(),
                    };
                    Response::builder()
                        .status(StatusCode::OK)
                        .header("content-type", "application/json")
                        .body(Body::from(serde_json::to_string(&api_response).unwrap()))
                        .unwrap()
                }
                Err(e) => {
                    error!("Failed to fetch data: {}", e);
                    Response::builder()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(Body::from("Internal Server Error"))
                        .unwrap()
                }
            }
        }
        (&Method::POST, "/api/process") => {
            // 异步处理POST请求
            match process_async_request(req, pool).await {
                Ok(response) => response,
                Err(e) => {
                    error!("Failed to process request: {}", e);
                    Response::builder()
                        .status(StatusCode::BAD_REQUEST)
                        .body(Body::from("Bad Request"))
                        .unwrap()
                }
            }
        }
        _ => {
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("Not Found"))
                .unwrap()
        }
    };

    Ok(response)
}

#[instrument]
async fn fetch_data_with_timeout() -> Result<serde_json::Value> {
    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()?;

    let future = async {
        let response = client
            .get("https://api.example.com/data")
            .header("User-Agent", "RustAsyncDemo/1.0")
            .send()
            .await?;

        if response.status().is_success() {
            let data: serde_json::Value = response.json().await?;
            Ok(data)
        } else {
            Err(anyhow::anyhow!("API request failed with status: {}", response.status()))
        }
    };

    timeout(Duration::from_secs(5), future)
        .await
        .context("Request timed out")?
}

#[instrument(skip(req, pool))]
async fn process_async_request(
    mut req: Request<Body>,
    pool: Arc<ConnectionPool>,
) -> Result<Response<Body>> {
    // 读取请求体
    let body_bytes = hyper::body::to_bytes(req.body_mut()).await?;
    let body_str = String::from_utf8(body_bytes.to_vec())?;
    
    // 异步处理任务
    let (tx, mut rx) = mpsc::channel(100);
    
    // 启动多个异步处理任务
    for i in 0..5 {
        let tx = tx.clone();
        let body = body_str.clone();
        let pool = Arc::clone(&pool);
        
        tokio::spawn(async move {
            let result = process_chunk(i, &body, pool).await;
            if let Err(e) = tx.send(result).await {
                error!("Failed to send result: {}", e);
            }
        });
    }
    
    drop(tx); // 关闭发送端
    
    // 收集结果
    let mut results = Vec::new();
    while let Some(result) = rx.recv().await {
        match result {
            Ok(data) => results.push(data),
            Err(e) => warn!("Task failed: {}", e),
        }
    }
    
    let response_data = serde_json::json!({
        "processed_chunks": results.len(),
        "results": results
    });
    
    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("content-type", "application/json")
        .body(Body::from(response_data.to_string()))?)
}

#[instrument(skip(pool))]
async fn process_chunk(
    chunk_id: usize,
    data: &str,
    pool: Arc<ConnectionPool>,
) -> Result<serde_json::Value> {
    // 模拟异步处理
    sleep(Duration::from_millis(100)).await;
    
    // 可能需要数据库连接或其他资源
    let _connection = pool.get_connection().await?;
    
    // 处理数据
    let processed = format!("Processed chunk {} with {} bytes", chunk_id, data.len());
    
    Ok(serde_json::json!({
        "chunk_id": chunk_id,
        "processed_data": processed,
        "timestamp": chrono::Utc::now()
    }))
}

// 异步TCP服务器
pub struct AsyncTcpServer {
    listener: TcpListener,
    shutdown_rx: Option<broadcast::Receiver<()>>,
}

impl AsyncTcpServer {
    pub async fn new(addr: &str) -> Result<Self> {
        let listener = TcpListener::bind(addr).await
            .context("Failed to bind TCP listener")?;
        
        Ok(Self {
            listener,
            shutdown_rx: None,
        })
    }

    #[instrument(skip(self))]
    pub async fn run(&mut self, mut shutdown_rx: broadcast::Receiver<()>) -> Result<()> {
        info!("TCP server listening on {}", self.listener.local_addr()?);
        
        loop {
            tokio::select! {
                // 接受新连接
                result = self.listener.accept() => {
                    match result {
                        Ok((stream, addr)) => {
                            info!("New connection from {}", addr);
                            let shutdown_rx = shutdown_rx.resubscribe();
                            tokio::spawn(async move {
                                if let Err(e) = handle_tcp_connection(stream, shutdown_rx).await {
                                    error!("Connection error: {}", e);
                                }
                            });
                        }
                        Err(e) => {
                            error!("Failed to accept connection: {}", e);
                        }
                    }
                }
                // 监听关闭信号
                _ = shutdown_rx.recv() => {
                    info!("TCP server shutting down");
                    break;
                }
            }
        }
        
        Ok(())
    }
}

#[instrument(skip(stream, shutdown_rx))]
async fn handle_tcp_connection(
    mut stream: TcpStream,
    mut shutdown_rx: broadcast::Receiver<()>,
) -> Result<()> {
    let mut buffer = [0; 1024];
    
    loop {
        tokio::select! {
            // 读取数据
            result = stream.read(&mut buffer) => {
                match result {
                    Ok(0) => {
                        debug!("Connection closed by client");
                        break;
                    }
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buffer[..n]);
                        debug!("Received: {}", data.trim());
                        
                        // 异步处理数据
                        let response = process_tcp_data(&data).await?;
                        
                        // 发送响应
                        stream.write_all(response.as_bytes()).await?;
                        stream.flush().await?;
                    }
                    Err(e) => {
                        error!("Failed to read from stream: {}", e);
                        break;
                    }
                }
            }
            // 监听关闭信号
            _ = shutdown_rx.recv() => {
                info!("Connection shutting down");
                break;
            }
        }
    }
    
    Ok(())
}

#[instrument]
async fn process_tcp_data(data: &str) -> Result<String> {
    // 模拟异步数据处理
    sleep(Duration::from_millis(50)).await;
    
    let processed = data.trim().to_uppercase();
    Ok(format!("ECHO: {}\n", processed))
}

// 异步流处理
pub struct AsyncStreamProcessor {
    input_rx: mpsc::Receiver<Vec<u8>>,
    output_tx: mpsc::Sender<String>,
}

impl AsyncStreamProcessor {
    pub fn new(
        input_rx: mpsc::Receiver<Vec<u8>>,
        output_tx: mpsc::Sender<String>,
    ) -> Self {
        Self { input_rx, output_tx }
    }

    #[instrument(skip(self))]
    pub async fn process_stream(&mut self) -> Result<()> {
        // 创建异步流
        let stream = stream::unfold(&mut self.input_rx, |rx| async move {
            rx.recv().await.map(|data| (data, rx))
        });

        // 并行处理流数据
        stream
            .for_each_concurrent(10, |data| async {
                match self.process_data_chunk(data).await {
                    Ok(result) => {
                        if let Err(e) = self.output_tx.send(result).await {
                            error!("Failed to send processed result: {}", e);
                        }
                    }
                    Err(e) => {
                        error!("Failed to process data chunk: {}", e);
                    }
                }
            })
            .await;

        Ok(())
    }

    #[instrument(skip(self))]
    async fn process_data_chunk(&self, data: Vec<u8>) -> Result<String> {
        // 模拟CPU密集型任务，使用spawn_blocking
        let processed = tokio::task::spawn_blocking(move || {
            // 模拟复杂计算
            let sum: u64 = data.iter().map(|&b| b as u64).sum();
            format!("Processed {} bytes, checksum: {}", data.len(), sum)
        }).await?;

        Ok(processed)
    }
}

// 主要的异步运行时配置
#[tokio::main]
async fn main() -> Result<()> {
    // 初始化日志
    tracing_subscriber::fmt::init();

    // 创建Tokio运行时配置
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .enable_all()
        .build()?;

    // 在运行时中执行异步任务
    rt.block_on(async {
        // 创建广播通道用于优雅关闭
        let (shutdown_tx, _) = broadcast::channel(1);

        // 启动HTTP服务器
        let mut web_server = AsyncWebServer::new("127.0.0.1:3000".parse()?);
        let web_handle = tokio::spawn(async move {
            if let Err(e) = web_server.start().await {
                error!("Web server error: {}", e);
            }
        });

        // 启动TCP服务器
        let mut tcp_server = AsyncTcpServer::new("127.0.0.1:3001").await?;
        let shutdown_rx = shutdown_tx.subscribe();
        let tcp_handle = tokio::spawn(async move {
            if let Err(e) = tcp_server.run(shutdown_rx).await {
                error!("TCP server error: {}", e);
            }
        });

        // 启动流处理器
        let (input_tx, input_rx) = mpsc::channel(1000);
        let (output_tx, mut output_rx) = mpsc::channel(1000);
        let mut processor = AsyncStreamProcessor::new(input_rx, output_tx);
        
        let stream_handle = tokio::spawn(async move {
            if let Err(e) = processor.process_stream().await {
                error!("Stream processor error: {}", e);
            }
        });

        // 模拟发送数据到流处理器
        let data_sender = tokio::spawn(async move {
            for i in 0..100 {
                let data = vec![i; 100]; // 模拟数据
                if input_tx.send(data).await.is_err() {
                    break;
                }
                sleep(Duration::from_millis(10)).await;
            }
        });

        // 监听处理结果
        let result_handler = tokio::spawn(async move {
            while let Some(result) = output_rx.recv().await {
                info!("Processed result: {}", result);
            }
        });

        // 等待Ctrl+C信号
        tokio::signal::ctrl_c().await?;
        info!("Received shutdown signal");

        // 发送关闭信号
        if let Err(e) = shutdown_tx.send(()) {
            warn!("Failed to send shutdown signal: {}", e);
        }

        // 等待所有任务完成（设置超时）
        let timeout_duration = Duration::from_secs(10);
        
        let _ = timeout(
            timeout_duration,
            futures::future::join_all(vec![
                web_handle,
                tcp_handle,
                stream_handle,
                data_sender,
                result_handler,
            ])
        ).await;

        info!("All services shut down");
        Ok::<(), anyhow::Error>(())
    })?;

    Ok(())
}

// 异步错误处理示例
#[derive(Debug, thiserror::Error)]
pub enum AsyncNetworkError {
    #[error("Connection timeout: {0}")]
    Timeout(#[from] tokio::time::error::Elapsed),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("HTTP error: {0}")]
    Http(#[from] hyper::Error),
    
    #[error("Request error: {0}")]
    Request(#[from] reqwest::Error),
    
    #[error("Custom error: {message}")]
    Custom { message: String },
}

impl AsyncNetworkError {
    pub fn custom(message: impl Into<String>) -> Self {
        Self::Custom {
            message: message.into(),
        }
    }
}

// 异步重试机制
pub async fn retry_with_backoff<F, Fut, T, E>(
    mut operation: F,
    max_retries: usize,
    initial_delay: Duration,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
    E: std::fmt::Debug,
{
    let mut retries = 0;
    let mut delay = initial_delay;

    loop {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) if retries >= max_retries => return Err(e),
            Err(e) => {
                warn!("Operation failed (attempt {}): {:?}", retries + 1, e);
                sleep(delay).await;
                retries += 1;
                delay *= 2; // 指数退避
            }
        }
    }
}

// 异步熔断器
pub struct AsyncCircuitBreaker {
    failure_count: Arc<Mutex<usize>>,
    failure_threshold: usize,
    timeout: Duration,
    last_failure_time: Arc<Mutex<Option<std::time::Instant>>>,
}

impl AsyncCircuitBreaker {
    pub fn new(failure_threshold: usize, timeout: Duration) -> Self {
        Self {
            failure_count: Arc::new(Mutex::new(0)),
            failure_threshold,
            timeout,
            last_failure_time: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn call<F, Fut, T, E>(&self, operation: F) -> Result<T, AsyncNetworkError>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<T, E>>,
        E: std::fmt::Debug,
    {
        // 检查熔断器状态
        let failure_count = *self.failure_count.lock().await;
        let last_failure = *self.last_failure_time.lock().await;

        if failure_count >= self.failure_threshold {
            if let Some(last_time) = last_failure {
                if last_time.elapsed() < self.timeout {
                    return Err(AsyncNetworkError::custom("Circuit breaker is open"));
                } else {
                    // 重置熔断器
                    *self.failure_count.lock().await = 0;
                    *self.last_failure_time.lock().await = None;
                }
            }
        }

        // 执行操作
        match operation().await {
            Ok(result) => {
                // 成功，重置计数器
                *self.failure_count.lock().await = 0;
                *self.last_failure_time.lock().await = None;
                Ok(result)
            }
            Err(e) => {
                // 失败，增加计数器
                let mut count = self.failure_count.lock().await;
                *count += 1;
                *self.last_failure_time.lock().await = Some(std::time::Instant::now());
                Err(AsyncNetworkError::custom(format!("Operation failed: {:?}", e)))
            }
        }
    }
}
