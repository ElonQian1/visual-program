// 高级Rust微服务架构演示
// 这个文件展示了复杂的微服务架构、数据库优化和并发模式

use axum::{extract::State, http::StatusCode, response::Json, routing::{get, post}, Router};
use diesel::{prelude::*, pg::PgConnection, r2d2::{ConnectionManager, Pool}};
use serde::{Deserialize, Serialize};
use tokio::{sync::{mpsc, Mutex}, time::{sleep, Duration}};
use tracing::{info, warn, error, instrument};
use redis::Client as RedisClient;
use std::{collections::HashMap, sync::Arc};
use rayon::prelude::*;

// 数据库连接池配置
type DbPool = Pool<ConnectionManager<PgConnection>>;

// 微服务应用状态
#[derive(Clone)]
pub struct AppState {
    db_pool: DbPool,
    redis_client: RedisClient,
    message_sender: mpsc::Sender<BackgroundTask>,
    metrics_collector: Arc<Mutex<MetricsCollector>>,
}

// 用户管理微服务
#[derive(Debug, Serialize, Deserialize, Queryable, Insertable)]
#[diesel(table_name = users)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub created_at: chrono::NaiveDateTime,
    pub is_active: bool,
}

// 订单管理微服务
#[derive(Debug, Serialize, Deserialize, Queryable, Insertable)]
#[diesel(table_name = orders)]
pub struct Order {
    pub id: i32,
    pub user_id: i32,
    pub product_id: i32,
    pub quantity: i32,
    pub total_amount: rust_decimal::Decimal,
    pub status: String,
    pub created_at: chrono::NaiveDateTime,
}

// 产品目录微服务
#[derive(Debug, Serialize, Deserialize, Queryable, Insertable)]
#[diesel(table_name = products)]
pub struct Product {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub price: rust_decimal::Decimal,
    pub stock_quantity: i32,
    pub category_id: i32,
}

// ============= 微服务API端点 =============

// 用户管理API
#[instrument(skip(state))]
async fn create_user(
    State(state): State<AppState>,
    Json(user): Json<CreateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    info!("创建新用户: {}", user.username);
    
    // 输入验证
    if user.username.is_empty() || user.email.is_empty() {
        warn!("用户输入验证失败");
        return Err(StatusCode::BAD_REQUEST);
    }
    
    // 数据库操作 - 可能的N+1问题
    let mut conn = state.db_pool.get().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // 检查用户名是否存在 - 使用索引优化
    let existing_user = users::table
        .filter(users::username.eq(&user.username))
        .first::<User>(&mut conn)
        .optional()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    if existing_user.is_some() {
        return Err(StatusCode::CONFLICT);
    }
    
    // 插入新用户 - 可以批量优化
    let new_user = diesel::insert_into(users::table)
        .values(&user)
        .get_result::<User>(&mut conn)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // 缓存用户信息
    let _ = cache_user_info(&state.redis_client, &new_user).await;
    
    // 发送异步任务
    let _ = state.message_sender.send(BackgroundTask::SendWelcomeEmail(new_user.id)).await;
    
    Ok(Json(new_user))
}

#[instrument(skip(state))]
async fn get_user_orders(
    State(state): State<AppState>,
    axum::extract::Path(user_id): axum::extract::Path<i32>,
) -> Result<Json<Vec<OrderWithProduct>>, StatusCode> {
    info!("获取用户订单: {}", user_id);
    
    let mut conn = state.db_pool.get().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // 复杂查询 - 可能需要优化
    let orders_with_products = orders::table
        .inner_join(products::table.on(orders::product_id.eq(products::id)))
        .filter(orders::user_id.eq(user_id))
        .select((
            orders::id,
            orders::user_id,
            orders::quantity,
            orders::total_amount,
            orders::status,
            orders::created_at,
            products::name,
            products::price,
        ))
        .load::<OrderWithProduct>(&mut conn)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(orders_with_products))
}

// 产品搜索API - 高性能要求
#[instrument(skip(state))]
async fn search_products(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<SearchParams>,
) -> Result<Json<SearchResults>, StatusCode> {
    info!("搜索产品: {:?}", params);
    
    // 缓存检查
    if let Ok(cached_results) = get_cached_search(&state.redis_client, &params).await {
        return Ok(Json(cached_results));
    }
    
    let mut conn = state.db_pool.get().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // 复杂搜索查询 - 需要全文索引
    let mut query = products::table.into_boxed();
    
    if let Some(ref name) = params.name {
        query = query.filter(products::name.ilike(format!("%{}%", name)));
    }
    
    if let Some(min_price) = params.min_price {
        query = query.filter(products::price.ge(min_price));
    }
    
    if let Some(max_price) = params.max_price {
        query = query.filter(products::price.le(max_price));
    }
    
    let products = query
        .limit(params.limit.unwrap_or(50))
        .offset(params.offset.unwrap_or(0))
        .load::<Product>(&mut conn)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let results = SearchResults {
        products,
        total_count: products.len() as i64, // 这里应该是实际的总数查询
        page: params.offset.unwrap_or(0) / params.limit.unwrap_or(50),
    };
    
    // 异步缓存结果
    tokio::spawn(async move {
        let _ = cache_search_results(&state.redis_client, &params, &results).await;
    });
    
    Ok(Json(results))
}

// ============= 后台任务处理 =============

#[derive(Debug, Clone)]
pub enum BackgroundTask {
    SendWelcomeEmail(i32),
    ProcessPayment(i32),
    UpdateInventory(i32, i32),
    GenerateReport(String),
    CleanupExpiredSessions,
}

// 后台工作者 - 使用异步处理
async fn background_worker(mut receiver: mpsc::Receiver<BackgroundTask>, state: AppState) {
    info!("启动后台工作者");
    
    while let Some(task) = receiver.recv().await {
        match task {
            BackgroundTask::SendWelcomeEmail(user_id) => {
                process_welcome_email(user_id, &state).await;
            }
            BackgroundTask::ProcessPayment(order_id) => {
                process_payment(order_id, &state).await;
            }
            BackgroundTask::UpdateInventory(product_id, quantity) => {
                update_inventory(product_id, quantity, &state).await;
            }
            BackgroundTask::GenerateReport(report_type) => {
                generate_report(report_type, &state).await;
            }
            BackgroundTask::CleanupExpiredSessions => {
                cleanup_expired_sessions(&state).await;
            }
        }
    }
}

// ============= 数据库优化示例 =============

// 批量插入优化
async fn bulk_create_orders(
    state: &AppState,
    orders: Vec<CreateOrderRequest>,
) -> Result<Vec<Order>, diesel::result::Error> {
    let mut conn = state.db_pool.get().unwrap();
    
    // 批量插入而不是循环单个插入
    diesel::insert_into(orders::table)
        .values(&orders)
        .get_results::<Order>(&mut conn)
}

// 连接池优化配置
fn create_db_pool() -> DbPool {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    
    // 优化的连接池配置
    Pool::builder()
        .max_size(20)           // 最大连接数
        .min_idle(Some(5))      // 最小空闲连接
        .idle_timeout(Some(Duration::from_secs(600)))  // 空闲超时
        .connection_timeout(Duration::from_secs(30))   // 连接超时
        .build(manager)
        .expect("Failed to create pool")
}

// 查询优化 - 使用预加载避免N+1
async fn get_users_with_order_counts(state: &AppState) -> Result<Vec<UserWithOrderCount>, diesel::result::Error> {
    let mut conn = state.db_pool.get().unwrap();
    
    // 使用JOIN和聚合避免N+1问题
    users::table
        .left_join(orders::table)
        .group_by(users::id)
        .select((
            users::id,
            users::username,
            users::email,
            diesel::dsl::count(orders::id),
        ))
        .load::<UserWithOrderCount>(&mut conn)
}

// ============= 并发优化示例 =============

// 线程池配置
lazy_static::lazy_static! {
    static ref COMPUTE_POOL: rayon::ThreadPool = rayon::ThreadPoolBuilder::new()
        .num_threads(8)
        .thread_name(|index| format!("compute-worker-{}", index))
        .build()
        .unwrap();
}

// CPU密集型任务的并行处理
async fn process_large_dataset(data: Vec<DataItem>) -> Vec<ProcessedItem> {
    // 使用Rayon进行并行处理
    let (sender, receiver) = tokio::sync::oneshot::channel();
    
    COMPUTE_POOL.spawn(move || {
        let processed: Vec<ProcessedItem> = data
            .par_iter()  // 并行迭代器
            .map(|item| process_data_item(item))
            .collect();
        
        let _ = sender.send(processed);
    });
    
    receiver.await.unwrap_or_default()
}

// 异步任务并发处理
async fn process_multiple_requests(requests: Vec<ApiRequest>) -> Vec<ApiResponse> {
    // 限制并发数量
    let semaphore = Arc::new(tokio::sync::Semaphore::new(10));
    
    let tasks: Vec<_> = requests
        .into_iter()
        .map(|request| {
            let semaphore = semaphore.clone();
            tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();
                process_api_request(request).await
            })
        })
        .collect();
    
    // 等待所有任务完成
    let mut results = Vec::new();
    for task in tasks {
        if let Ok(result) = task.await {
            results.push(result);
        }
    }
    
    results
}

// 锁争用优化 - 使用Arc<Mutex>的替代方案
pub struct MetricsCollector {
    request_count: std::sync::atomic::AtomicU64,
    error_count: std::sync::atomic::AtomicU64,
    response_times: parking_lot::RwLock<Vec<u64>>,
}

impl MetricsCollector {
    pub fn new() -> Self {
        Self {
            request_count: std::sync::atomic::AtomicU64::new(0),
            error_count: std::sync::atomic::AtomicU64::new(0),
            response_times: parking_lot::RwLock::new(Vec::new()),
        }
    }
    
    pub fn increment_requests(&self) {
        self.request_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }
    
    pub fn increment_errors(&self) {
        self.error_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    }
    
    pub fn record_response_time(&self, time_ms: u64) {
        let mut times = self.response_times.write();
        times.push(time_ms);
        
        // 保持最近1000条记录
        if times.len() > 1000 {
            times.drain(..500);
        }
    }
}

// ============= 缓存层实现 =============

async fn cache_user_info(redis_client: &RedisClient, user: &User) -> Result<(), redis::RedisError> {
    let mut conn = redis_client.get_async_connection().await?;
    let key = format!("user:{}", user.id);
    let value = serde_json::to_string(user).unwrap();
    
    redis::cmd("SETEX")
        .arg(&key)
        .arg(3600) // 1小时TTL
        .arg(value)
        .query_async(&mut conn)
        .await
}

async fn get_cached_search(
    redis_client: &RedisClient,
    params: &SearchParams,
) -> Result<SearchResults, redis::RedisError> {
    let mut conn = redis_client.get_async_connection().await?;
    let key = format!("search:{}", serde_json::to_string(params).unwrap());
    
    let cached: String = redis::cmd("GET")
        .arg(&key)
        .query_async(&mut conn)
        .await?;
    
    serde_json::from_str(&cached).map_err(|_| redis::RedisError::from((redis::ErrorKind::TypeError, "Invalid JSON")))
}

// ============= 微服务间通信 =============

// HTTP客户端 - 服务间调用
async fn call_payment_service(order_id: i32, amount: rust_decimal::Decimal) -> Result<PaymentResponse, reqwest::Error> {
    let client = reqwest::Client::new();
    let payment_service_url = std::env::var("PAYMENT_SERVICE_URL").unwrap_or_else(|_| "http://payment-service:8080".to_string());
    
    let request = PaymentRequest {
        order_id,
        amount,
        currency: "USD".to_string(),
    };
    
    client
        .post(&format!("{}/payments", payment_service_url))
        .json(&request)
        .send()
        .await?
        .json::<PaymentResponse>()
        .await
}

// gRPC客户端示例
async fn call_inventory_service(product_id: i32, quantity: i32) -> Result<InventoryResponse, Box<dyn std::error::Error>> {
    // 这里应该是实际的gRPC客户端代码
    // let mut client = InventoryServiceClient::connect("http://inventory-service:50051").await?;
    // let request = tonic::Request::new(UpdateInventoryRequest { product_id, quantity });
    // let response = client.update_inventory(request).await?;
    // Ok(response.into_inner())
    
    // 模拟实现
    Ok(InventoryResponse {
        success: true,
        new_quantity: quantity,
    })
}

// ============= 监控和可观测性 =============

// 分布式追踪
#[instrument(name = "order_processing", skip(state))]
async fn process_order_workflow(order: CreateOrderRequest, state: AppState) -> Result<Order, ProcessingError> {
    let span = tracing::Span::current();
    span.record("order.user_id", &order.user_id);
    span.record("order.product_id", &order.product_id);
    
    // 1. 验证库存
    let inventory_span = tracing::info_span!("check_inventory");
    let _enter = inventory_span.enter();
    
    let inventory_result = call_inventory_service(order.product_id, order.quantity).await
        .map_err(|e| ProcessingError::InventoryCheck(e.to_string()))?;
    
    if !inventory_result.success {
        return Err(ProcessingError::InsufficientStock);
    }
    
    drop(_enter);
    
    // 2. 处理支付
    let payment_span = tracing::info_span!("process_payment");
    let _enter = payment_span.enter();
    
    let payment_result = call_payment_service(order.id, order.total_amount).await
        .map_err(|e| ProcessingError::PaymentFailed(e.to_string()))?;
    
    if !payment_result.success {
        return Err(ProcessingError::PaymentDeclined);
    }
    
    drop(_enter);
    
    // 3. 创建订单
    let mut conn = state.db_pool.get().unwrap();
    let created_order = diesel::insert_into(orders::table)
        .values(&order)
        .get_result::<Order>(&mut conn)
        .map_err(|e| ProcessingError::DatabaseError(e.to_string()))?;
    
    // 4. 发送确认邮件
    let _ = state.message_sender.send(BackgroundTask::SendWelcomeEmail(order.user_id)).await;
    
    info!("订单处理完成: {}", created_order.id);
    Ok(created_order)
}

// 健康检查端点
async fn health_check(State(state): State<AppState>) -> Result<Json<HealthStatus>, StatusCode> {
    let mut health = HealthStatus {
        status: "healthy".to_string(),
        database: check_database_health(&state.db_pool).await,
        redis: check_redis_health(&state.redis_client).await,
        external_services: HashMap::new(),
    };
    
    // 检查外部服务
    health.external_services.insert(
        "payment_service".to_string(),
        check_service_health("http://payment-service:8080/health").await,
    );
    
    health.external_services.insert(
        "inventory_service".to_string(),
        check_service_health("http://inventory-service:8080/health").await,
    );
    
    // 如果任何服务不健康，返回503
    if !health.database || !health.redis || health.external_services.values().any(|&v| !v) {
        health.status = "unhealthy".to_string();
        return Err(StatusCode::SERVICE_UNAVAILABLE);
    }
    
    Ok(Json(health))
}

// ============= 主应用和路由配置 =============

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 初始化追踪
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(true)
        .with_level(true)
        .init();
    
    info!("启动微服务应用");
    
    // 创建数据库连接池
    let db_pool = create_db_pool();
    
    // 创建Redis客户端
    let redis_client = RedisClient::open("redis://redis:6379")?;
    
    // 创建消息通道
    let (message_sender, message_receiver) = mpsc::channel::<BackgroundTask>(1000);
    
    // 创建指标收集器
    let metrics_collector = Arc::new(Mutex::new(MetricsCollector::new()));
    
    // 应用状态
    let state = AppState {
        db_pool,
        redis_client,
        message_sender,
        metrics_collector,
    };
    
    // 启动后台工作者
    let background_state = state.clone();
    tokio::spawn(async move {
        background_worker(message_receiver, background_state).await;
    });
    
    // 定期清理任务
    let cleanup_state = state.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(300)); // 5分钟
        loop {
            interval.tick().await;
            let _ = cleanup_state.message_sender.send(BackgroundTask::CleanupExpiredSessions).await;
        }
    });
    
    // 创建路由
    let app = Router::new()
        // 用户管理
        .route("/users", post(create_user))
        .route("/users/:id/orders", get(get_user_orders))
        // 产品管理
        .route("/products/search", get(search_products))
        // 健康检查
        .route("/health", get(health_check))
        // 指标端点
        .route("/metrics", get(get_metrics))
        .with_state(state);
    
    // 启动服务器
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    info!("服务器启动在 http://0.0.0.0:8080");
    
    axum::serve(listener, app).await?;
    
    Ok(())
}

// ============= 数据结构定义 =============

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    pub user_id: i32,
    pub product_id: i32,
    pub quantity: i32,
    pub total_amount: rust_decimal::Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchParams {
    pub name: Option<String>,
    pub min_price: Option<rust_decimal::Decimal>,
    pub max_price: Option<rust_decimal::Decimal>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResults {
    pub products: Vec<Product>,
    pub total_count: i64,
    pub page: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderWithProduct {
    pub id: i32,
    pub user_id: i32,
    pub quantity: i32,
    pub total_amount: rust_decimal::Decimal,
    pub status: String,
    pub created_at: chrono::NaiveDateTime,
    pub product_name: String,
    pub product_price: rust_decimal::Decimal,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserWithOrderCount {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub order_count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentRequest {
    pub order_id: i32,
    pub amount: rust_decimal::Decimal,
    pub currency: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaymentResponse {
    pub success: bool,
    pub transaction_id: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryResponse {
    pub success: bool,
    pub new_quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthStatus {
    pub status: String,
    pub database: bool,
    pub redis: bool,
    pub external_services: HashMap<String, bool>,
}

#[derive(Debug, thiserror::Error)]
pub enum ProcessingError {
    #[error("库存检查失败: {0}")]
    InventoryCheck(String),
    #[error("库存不足")]
    InsufficientStock,
    #[error("支付处理失败: {0}")]
    PaymentFailed(String),
    #[error("支付被拒绝")]
    PaymentDeclined,
    #[error("数据库错误: {0}")]
    DatabaseError(String),
}

// 模拟数据结构
pub struct DataItem {
    pub id: i32,
    pub data: Vec<u8>,
}

pub struct ProcessedItem {
    pub id: i32,
    pub result: String,
}

pub struct ApiRequest {
    pub id: i32,
    pub payload: String,
}

pub struct ApiResponse {
    pub id: i32,
    pub response: String,
}

// ============= 辅助函数 =============

async fn process_welcome_email(user_id: i32, state: &AppState) {
    info!("发送欢迎邮件给用户: {}", user_id);
    // 模拟邮件发送
    sleep(Duration::from_millis(100)).await;
}

async fn process_payment(order_id: i32, state: &AppState) {
    info!("处理订单支付: {}", order_id);
    // 模拟支付处理
    sleep(Duration::from_millis(200)).await;
}

async fn update_inventory(product_id: i32, quantity: i32, state: &AppState) {
    info!("更新产品库存: {} 数量: {}", product_id, quantity);
    // 模拟库存更新
    sleep(Duration::from_millis(50)).await;
}

async fn generate_report(report_type: String, state: &AppState) {
    info!("生成报告: {}", report_type);
    // 模拟报告生成
    sleep(Duration::from_secs(5)).await;
}

async fn cleanup_expired_sessions(state: &AppState) {
    info!("清理过期会话");
    // 模拟清理操作
    sleep(Duration::from_millis(500)).await;
}

fn process_data_item(item: &DataItem) -> ProcessedItem {
    // 模拟CPU密集型处理
    let result = format!("processed_{}", item.id);
    ProcessedItem {
        id: item.id,
        result,
    }
}

async fn process_api_request(request: ApiRequest) -> ApiResponse {
    // 模拟API请求处理
    sleep(Duration::from_millis(100)).await;
    ApiResponse {
        id: request.id,
        response: format!("response_for_{}", request.payload),
    }
}

async fn cache_search_results(
    redis_client: &RedisClient,
    params: &SearchParams,
    results: &SearchResults,
) -> Result<(), redis::RedisError> {
    let mut conn = redis_client.get_async_connection().await?;
    let key = format!("search:{}", serde_json::to_string(params).unwrap());
    let value = serde_json::to_string(results).unwrap();
    
    redis::cmd("SETEX")
        .arg(&key)
        .arg(300) // 5分钟TTL
        .arg(value)
        .query_async(&mut conn)
        .await
}

async fn check_database_health(db_pool: &DbPool) -> bool {
    db_pool.get().is_ok()
}

async fn check_redis_health(redis_client: &RedisClient) -> bool {
    redis_client.get_async_connection().await.is_ok()
}

async fn check_service_health(url: &str) -> bool {
    reqwest::Client::new()
        .get(url)
        .timeout(Duration::from_secs(5))
        .send()
        .await
        .map(|resp| resp.status().is_success())
        .unwrap_or(false)
}

async fn get_metrics(State(state): State<AppState>) -> Json<serde_json::Value> {
    let metrics = state.metrics_collector.lock().await;
    Json(serde_json::json!({
        "requests": metrics.request_count.load(std::sync::atomic::Ordering::Relaxed),
        "errors": metrics.error_count.load(std::sync::atomic::Ordering::Relaxed),
        "avg_response_time": {
            let times = metrics.response_times.read();
            if times.is_empty() {
                0.0
            } else {
                times.iter().sum::<u64>() as f64 / times.len() as f64
            }
        }
    }))
}

// Diesel表定义（简化）
mod schema {
    use diesel::table;
    
    table! {
        users (id) {
            id -> Int4,
            username -> Varchar,
            email -> Varchar,
            created_at -> Timestamp,
            is_active -> Bool,
        }
    }
    
    table! {
        orders (id) {
            id -> Int4,
            user_id -> Int4,
            product_id -> Int4,
            quantity -> Int4,
            total_amount -> Numeric,
            status -> Varchar,
            created_at -> Timestamp,
        }
    }
    
    table! {
        products (id) {
            id -> Int4,
            name -> Varchar,
            description -> Nullable<Text>,
            price -> Numeric,
            stock_quantity -> Int4,
            category_id -> Int4,
        }
    }
}

use schema::*;
