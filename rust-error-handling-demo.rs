// Rust错误处理示例文件
// 用于测试错误处理分析器的功能

use std::fs::File;
use std::io::{self, Read, Write};
use std::error::Error;
use std::fmt;
use thiserror::Error;
use anyhow::{Result, Context};
use log::{info, error, warn, debug};
use tracing::{instrument, span, Level};
use serde::{Deserialize, Serialize};

// 自定义错误类型示例
#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Connection failed: {source}")]
    ConnectionFailed { source: io::Error },
    
    #[error("Query failed: {query}")]
    QueryFailed { query: String },
    
    #[error("Transaction rolled back")]
    TransactionRolledBack,
}

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Invalid request: {message}")]
    InvalidRequest { message: String },
    
    #[error("Authentication failed")]
    AuthenticationFailed,
    
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[error("Internal server error")]
    InternalError(#[from] DatabaseError),
}

// Result模式使用示例
pub fn read_config_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// Option模式使用示例
pub fn find_user_by_id(id: u32) -> Option<User> {
    // 模拟数据库查询
    if id == 1 {
        Some(User {
            id,
            name: "John Doe".to_string(),
            email: "john@example.com".to_string(),
        })
    } else {
        None
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: u32,
    pub name: String,
    pub email: String,
}

// 错误传播示例
pub fn process_user_request(user_id: u32) -> Result<String, ApiError> {
    info!("Processing request for user {}", user_id);
    
    let user = find_user_by_id(user_id)
        .ok_or_else(|| ApiError::InvalidRequest {
            message: format!("User {} not found", user_id)
        })?;
    
    let config = read_config_file("config.toml")
        .context("Failed to read configuration")?;
    
    // 模拟数据库操作
    let db_result = simulate_database_operation(&user)
        .map_err(|e| {
            error!("Database operation failed for user {}: {:?}", user_id, e);
            ApiError::InternalError(e)
        })?;
    
    info!("Successfully processed request for user {}", user_id);
    Ok(db_result)
}

// 模拟数据库操作
fn simulate_database_operation(user: &User) -> Result<String, DatabaseError> {
    // 模拟连接错误
    if user.id == 999 {
        return Err(DatabaseError::ConnectionFailed {
            source: io::Error::new(io::ErrorKind::ConnectionRefused, "Database unavailable")
        });
    }
    
    // 模拟查询错误
    if user.name.is_empty() {
        return Err(DatabaseError::QueryFailed {
            query: format!("SELECT * FROM users WHERE id = {}", user.id)
        });
    }
    
    debug!("Database operation successful for user: {}", user.name);
    Ok(format!("Processed user: {}", user.name))
}

// 不良的错误处理示例 (使用unwrap)
pub fn bad_error_handling_example() {
    let file = File::open("nonexistent.txt").unwrap(); // 潜在的panic!
    let mut contents = String::new();
    file.read_to_string(&mut contents).expect("Failed to read file"); // 另一个潜在的panic!
}

// 改进的错误处理示例
pub fn good_error_handling_example() -> Result<String, Box<dyn Error>> {
    let mut file = File::open("config.txt")
        .map_err(|e| {
            error!("Failed to open config file: {}", e);
            e
        })?;
    
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| {
            error!("Failed to read config file: {}", e);
            e
        })?;
    
    info!("Successfully read config file");
    Ok(contents)
}

// 使用tracing进行结构化日志记录
#[instrument(level = "info", skip(data))]
pub async fn process_data_with_tracing(data: &[u8]) -> Result<Vec<u8>, ProcessingError> {
    let _span = span!(Level::INFO, "data_processing", size = data.len());
    
    info!("Starting data processing");
    
    if data.is_empty() {
        warn!("Empty data received");
        return Err(ProcessingError::EmptyData);
    }
    
    if data.len() > 1024 * 1024 {
        error!("Data too large: {} bytes", data.len());
        return Err(ProcessingError::DataTooLarge { size: data.len() });
    }
    
    // 模拟处理
    let mut result = Vec::with_capacity(data.len());
    for &byte in data {
        result.push(byte.wrapping_add(1));
    }
    
    info!("Data processing completed successfully");
    Ok(result)
}

#[derive(Error, Debug)]
pub enum ProcessingError {
    #[error("Empty data provided")]
    EmptyData,
    
    #[error("Data too large: {size} bytes")]
    DataTooLarge { size: usize },
    
    #[error("Processing failed: {reason}")]
    ProcessingFailed { reason: String },
}

// 韧性模式示例: 重试机制
pub async fn retry_with_backoff<T, E, F, Fut>(
    mut operation: F,
    max_retries: usize,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
    E: fmt::Debug,
{
    let mut retry_count = 0;
    
    loop {
        match operation().await {
            Ok(result) => {
                if retry_count > 0 {
                    info!("Operation succeeded after {} retries", retry_count);
                }
                return Ok(result);
            }
            Err(e) => {
                retry_count += 1;
                if retry_count > max_retries {
                    error!("Operation failed after {} retries: {:?}", max_retries, e);
                    return Err(e);
                }
                
                let delay = std::time::Duration::from_millis(100 * retry_count as u64);
                warn!("Operation failed, retrying in {:?}: {:?}", delay, e);
                tokio::time::sleep(delay).await;
            }
        }
    }
}

// 熔断器模式示例
pub struct CircuitBreaker {
    failure_count: std::sync::atomic::AtomicUsize,
    last_failure: std::sync::Mutex<Option<std::time::Instant>>,
    failure_threshold: usize,
    timeout: std::time::Duration,
}

impl CircuitBreaker {
    pub fn new(failure_threshold: usize, timeout: std::time::Duration) -> Self {
        Self {
            failure_count: std::sync::atomic::AtomicUsize::new(0),
            last_failure: std::sync::Mutex::new(None),
            failure_threshold,
            timeout,
        }
    }
    
    pub async fn call<T, E, F, Fut>(&self, operation: F) -> Result<T, CircuitBreakerError<E>>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<T, E>>,
    {
        // 检查熔断器状态
        if self.is_open() {
            return Err(CircuitBreakerError::CircuitOpen);
        }
        
        match operation().await {
            Ok(result) => {
                self.on_success();
                Ok(result)
            }
            Err(e) => {
                self.on_failure();
                Err(CircuitBreakerError::OperationFailed(e))
            }
        }
    }
    
    fn is_open(&self) -> bool {
        let failure_count = self.failure_count.load(std::sync::atomic::Ordering::Relaxed);
        if failure_count < self.failure_threshold {
            return false;
        }
        
        if let Ok(last_failure) = self.last_failure.lock() {
            if let Some(last_failure_time) = *last_failure {
                return last_failure_time.elapsed() < self.timeout;
            }
        }
        
        false
    }
    
    fn on_success(&self) {
        self.failure_count.store(0, std::sync::atomic::Ordering::Relaxed);
    }
    
    fn on_failure(&self) {
        self.failure_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        if let Ok(mut last_failure) = self.last_failure.lock() {
            *last_failure = Some(std::time::Instant::now());
        }
    }
}

#[derive(Error, Debug)]
pub enum CircuitBreakerError<E> {
    #[error("Circuit breaker is open")]
    CircuitOpen,
    
    #[error("Operation failed: {0:?}")]
    OperationFailed(E),
}

// 主函数示例
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // 初始化日志
    env_logger::init();
    
    // 初始化tracing
    tracing_subscriber::fmt::init();
    
    info!("Application started");
    
    // 测试各种错误处理模式
    match process_user_request(1).await {
        Ok(result) => info!("User request processed: {}", result),
        Err(e) => error!("Failed to process user request: {}", e),
    }
    
    // 测试数据处理
    let test_data = b"Hello, world!";
    match process_data_with_tracing(test_data).await {
        Ok(processed) => info!("Data processed successfully: {} bytes", processed.len()),
        Err(e) => error!("Data processing failed: {}", e),
    }
    
    // 测试重试机制
    let retry_operation = || async {
        // 模拟可能失败的操作
        if rand::random::<bool>() {
            Ok("Success!")
        } else {
            Err("Temporary failure")
        }
    };
    
    match retry_with_backoff(retry_operation, 3).await {
        Ok(result) => info!("Retry operation succeeded: {}", result),
        Err(e) => error!("Retry operation failed: {}", e),
    }
    
    info!("Application finished");
    Ok(())
}

// 测试模块
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_find_user_by_id() {
        assert!(find_user_by_id(1).is_some());
        assert!(find_user_by_id(999).is_none());
    }
    
    #[tokio::test]
    async fn test_process_data_with_tracing() {
        let data = b"test data";
        let result = process_data_with_tracing(data).await;
        assert!(result.is_ok());
        
        let empty_data = b"";
        let result = process_data_with_tracing(empty_data).await;
        assert!(matches!(result, Err(ProcessingError::EmptyData)));
    }
    
    #[test]
    fn test_circuit_breaker() {
        let cb = CircuitBreaker::new(3, std::time::Duration::from_secs(60));
        
        // 测试成功的操作
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let result = cb.call(|| async { Ok::<&str, &str>("success") }).await;
            assert!(result.is_ok());
        });
    }
}
