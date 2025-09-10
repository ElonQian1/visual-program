// Rust高级系统架构示例 - 展示复杂的系统设计和分析机会
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Duration;
use tokio::sync::mpsc;
use serde::{Deserialize, Serialize};

// 模块结构分析 - 展示模块化设计
pub mod user_service {
    pub mod models;
    pub mod repository;
    pub mod handlers;
}

pub mod auth_service {
    pub mod jwt;
    pub mod middleware;
}

pub mod notification_service {
    pub mod email;
    pub mod sms;
}

// 错误处理分析 - 展示不同的错误处理模式
#[derive(Debug)]
pub enum UserServiceError {
    DatabaseError(String),
    ValidationError(String),
    NotFound(String),
    Unauthorized,
    InternalError,
}

impl std::fmt::Display for UserServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            UserServiceError::DatabaseError(msg) => write!(f, "数据库错误: {}", msg),
            UserServiceError::ValidationError(msg) => write!(f, "验证错误: {}", msg),
            UserServiceError::NotFound(msg) => write!(f, "未找到: {}", msg),
            UserServiceError::Unauthorized => write!(f, "未授权"),
            UserServiceError::InternalError => write!(f, "内部错误"),
        }
    }
}

impl std::error::Error for UserServiceError {}

// 数据模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: u64,
    pub username: String,
    pub email: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub is_active: bool,
}

#[derive(Debug)]
pub struct UserRepository {
    // 问题：没有使用连接池
    pub database_url: String,
    // 问题：缺少事务支持
    pub connection: Option<std::sync::Mutex<()>>, // 占位符
}

impl UserRepository {
    pub fn new(database_url: String) -> Self {
        Self {
            database_url,
            connection: None,
        }
    }
    
    // 问题：SQL注入风险 - 字符串拼接构建查询
    pub fn find_user_by_id(&self, id: u64) -> Result<Option<User>, UserServiceError> {
        let query = format!("SELECT * FROM users WHERE id = {}", id); // SQL注入风险
        
        // 模拟数据库查询
        if id == 0 {
            return Err(UserServiceError::DatabaseError("无效ID".to_string()));
        }
        
        // 问题：硬编码的测试数据
        if id == 1 {
            return Ok(Some(User {
                id: 1,
                username: "admin".to_string(),
                email: "admin@example.com".to_string(),
                created_at: chrono::Utc::now(),
                is_active: true,
            }));
        }
        
        Ok(None)
    }
    
    // 问题：没有使用参数化查询
    pub fn create_user(&self, username: &str, email: &str) -> Result<User, UserServiceError> {
        // 问题：基础的验证逻辑
        if username.is_empty() || email.is_empty() {
            return Err(UserServiceError::ValidationError("用户名和邮箱不能为空".to_string()));
        }
        
        // 问题：没有事务支持
        let user = User {
            id: rand::random::<u64>(),
            username: username.to_string(),
            email: email.to_string(),
            created_at: chrono::Utc::now(),
            is_active: true,
        };
        
        Ok(user)
    }
    
    // 问题：批量操作没有优化
    pub fn get_all_users(&self) -> Result<Vec<User>, UserServiceError> {
        // 模拟大量数据查询 - 可能导致内存问题
        let mut users = Vec::new();
        for i in 1..=10000 {  // 大量数据
            users.push(User {
                id: i,
                username: format!("user_{}", i),
                email: format!("user_{}@example.com", i),
                created_at: chrono::Utc::now(),
                is_active: i % 2 == 0,
            });
        }
        
        Ok(users)
    }
}

// 服务层 - 展示业务逻辑和并发处理
pub struct UserService {
    repository: Arc<UserRepository>,
    // 问题：过度使用Mutex，可能导致锁竞争
    cache: Arc<Mutex<HashMap<u64, User>>>,
    // 问题：没有使用更高效的并发数据结构
    active_sessions: Arc<Mutex<HashMap<String, u64>>>,
}

impl UserService {
    pub fn new(repository: UserRepository) -> Self {
        Self {
            repository: Arc::new(repository),
            cache: Arc::new(Mutex::new(HashMap::new())),
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    // 问题：异步函数但使用了阻塞操作
    pub async fn get_user(&self, id: u64) -> Result<Option<User>, UserServiceError> {
        // 检查缓存
        {
            let cache = self.cache.lock().unwrap(); // 问题：可能panic
            if let Some(user) = cache.get(&id) {
                return Ok(Some(user.clone())); // 问题：不必要的clone
            }
        }
        
        // 从数据库获取
        let user = self.repository.find_user_by_id(id)?;
        
        // 更新缓存
        if let Some(ref user_data) = user {
            let mut cache = self.cache.lock().unwrap();
            cache.insert(id, user_data.clone()); // 问题：又一次clone
        }
        
        Ok(user)
    }
    
    // 问题：没有使用连接池，每次都建立新连接
    pub async fn create_user_with_validation(&self, username: &str, email: &str) -> Result<User, UserServiceError> {
        // 问题：串行验证，可以并行化
        self.validate_username(username).await?;
        self.validate_email(email).await?;
        
        let user = self.repository.create_user(username, email)?;
        
        // 问题：没有事务，如果后续步骤失败会导致数据不一致
        self.send_welcome_email(&user).await?;
        self.create_user_profile(&user).await?;
        
        Ok(user)
    }
    
    async fn validate_username(&self, username: &str) -> Result<(), UserServiceError> {
        // 模拟网络请求验证
        tokio::time::sleep(Duration::from_millis(100)).await;
        
        if username.len() < 3 {
            return Err(UserServiceError::ValidationError("用户名太短".to_string()));
        }
        
        Ok(())
    }
    
    async fn validate_email(&self, email: &str) -> Result<(), UserServiceError> {
        // 模拟网络请求验证
        tokio::time::sleep(Duration::from_millis(100)).await;
        
        if !email.contains('@') {
            return Err(UserServiceError::ValidationError("邮箱格式无效".to_string()));
        }
        
        Ok(())
    }
    
    async fn send_welcome_email(&self, user: &User) -> Result<(), UserServiceError> {
        // 问题：没有错误重试机制
        println!("发送欢迎邮件给: {}", user.email);
        Ok(())
    }
    
    async fn create_user_profile(&self, user: &User) -> Result<(), UserServiceError> {
        // 问题：可能失败但没有回滚机制
        println!("创建用户资料: {}", user.username);
        Ok(())
    }
}

// Web API层 - 展示HTTP处理和路由设计
use warp::{Filter, Reply};

pub struct ApiServer {
    user_service: Arc<UserService>,
    // 问题：全局状态管理不当
    request_count: Arc<Mutex<u64>>,
}

impl ApiServer {
    pub fn new(user_service: UserService) -> Self {
        Self {
            user_service: Arc::new(user_service),
            request_count: Arc::new(Mutex::new(0)),
        }
    }
    
    // API路由定义
    pub fn routes(&self) -> impl Filter<Extract = impl Reply, Error = warp::Rejection> + Clone {
        let user_service = self.user_service.clone();
        let request_count = self.request_count.clone();
        
        // GET /users/:id
        let get_user = warp::path!("users" / u64)
            .and(warp::get())
            .and(warp::any().map(move || user_service.clone()))
            .and(warp::any().map(move || request_count.clone()))
            .and_then(Self::get_user_handler);
        
        // POST /users
        let create_user = warp::path("users")
            .and(warp::post())
            .and(warp::body::json())
            .and(warp::any().map(move || user_service.clone()))
            .and_then(Self::create_user_handler);
        
        // GET /health - 健康检查端点
        let health = warp::path("health")
            .and(warp::get())
            .and_then(Self::health_check);
        
        get_user.or(create_user).or(health)
    }
    
    async fn get_user_handler(
        id: u64,
        user_service: Arc<UserService>,
        request_count: Arc<Mutex<u64>>,
    ) -> Result<impl Reply, warp::Rejection> {
        // 问题：每个请求都要获取锁
        {
            let mut count = request_count.lock().unwrap();
            *count += 1;
        }
        
        match user_service.get_user(id).await {
            Ok(Some(user)) => Ok(warp::reply::json(&user)),
            Ok(None) => Ok(warp::reply::json(&serde_json::json!({
                "error": "用户未找到"
            }))),
            Err(e) => {
                eprintln!("获取用户错误: {}", e);
                Ok(warp::reply::json(&serde_json::json!({
                    "error": "内部服务器错误"
                })))
            }
        }
    }
    
    async fn create_user_handler(
        create_request: CreateUserRequest,
        user_service: Arc<UserService>,
    ) -> Result<impl Reply, warp::Rejection> {
        match user_service.create_user_with_validation(&create_request.username, &create_request.email).await {
            Ok(user) => Ok(warp::reply::json(&user)),
            Err(e) => Ok(warp::reply::json(&serde_json::json!({
                "error": e.to_string()
            })))
        }
    }
    
    async fn health_check() -> Result<impl Reply, warp::Rejection> {
        Ok(warp::reply::json(&serde_json::json!({
            "status": "healthy",
            "timestamp": chrono::Utc::now()
        })))
    }
}

#[derive(Deserialize)]
struct CreateUserRequest {
    username: String,
    email: String,
}

// 后台任务处理 - 展示并发和异步处理
pub struct BackgroundTaskProcessor {
    // 问题：使用了标准库的channel而不是更高效的tokio channel
    task_sender: std::sync::mpsc::Sender<BackgroundTask>,
    worker_handles: Vec<thread::JoinHandle<()>>,
}

#[derive(Debug)]
pub enum BackgroundTask {
    SendEmail { to: String, subject: String, body: String },
    ProcessImage { user_id: u64, image_path: String },
    GenerateReport { report_type: String, params: HashMap<String, String> },
}

impl BackgroundTaskProcessor {
    pub fn new(worker_count: usize) -> Self {
        let (sender, receiver) = std::sync::mpsc::channel();
        let receiver = Arc::new(Mutex::new(receiver));
        
        let mut worker_handles = Vec::new();
        
        for worker_id in 0..worker_count {
            let receiver = receiver.clone();
            
            let handle = thread::spawn(move || {
                loop {
                    let task = {
                        let receiver = receiver.lock().unwrap();
                        receiver.recv()
                    };
                    
                    match task {
                        Ok(task) => {
                            // 问题：没有错误处理和重试机制
                            Self::process_task(worker_id, task);
                        }
                        Err(_) => {
                            println!("Worker {} 退出", worker_id);
                            break;
                        }
                    }
                }
            });
            
            worker_handles.push(handle);
        }
        
        Self {
            task_sender: sender,
            worker_handles,
        }
    }
    
    pub fn submit_task(&self, task: BackgroundTask) -> Result<(), std::sync::mpsc::SendError<BackgroundTask>> {
        self.task_sender.send(task)
    }
    
    fn process_task(worker_id: usize, task: BackgroundTask) {
        println!("Worker {} 处理任务: {:?}", worker_id, task);
        
        match task {
            BackgroundTask::SendEmail { to, subject, body } => {
                // 问题：阻塞IO操作
                thread::sleep(Duration::from_secs(1));
                println!("邮件发送完成: {} -> {}", subject, to);
            }
            BackgroundTask::ProcessImage { user_id, image_path } => {
                // 问题：CPU密集型任务没有使用rayon等并行库
                thread::sleep(Duration::from_secs(2));
                println!("图片处理完成: {} (用户: {})", image_path, user_id);
            }
            BackgroundTask::GenerateReport { report_type, params } => {
                // 问题：大量内存分配没有优化
                thread::sleep(Duration::from_secs(3));
                println!("报告生成完成: {} (参数: {:?})", report_type, params);
            }
        }
    }
}

// 缓存层 - 展示内存管理和性能优化机会
pub struct CacheManager<K, V> 
where 
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    // 问题：简单的HashMap缓存，没有LRU或TTL
    cache: Arc<RwLock<HashMap<K, V>>>,
    max_size: usize,
}

impl<K, V> CacheManager<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    pub fn new(max_size: usize) -> Self {
        Self {
            cache: Arc::new(RwLock::new(HashMap::new())),
            max_size,
        }
    }
    
    pub fn get(&self, key: &K) -> Option<V> {
        let cache = self.cache.read().unwrap();
        cache.get(key).cloned() // 问题：每次获取都要clone
    }
    
    pub fn set(&self, key: K, value: V) {
        let mut cache = self.cache.write().unwrap();
        
        // 问题：简单的容量检查，没有智能淘汰策略
        if cache.len() >= self.max_size {
            // 随机删除一个元素 - 不是最优策略
            if let Some(first_key) = cache.keys().next().cloned() {
                cache.remove(&first_key);
            }
        }
        
        cache.insert(key, value);
    }
}

// 配置管理 - 展示配置和环境变量处理
pub struct AppConfig {
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String, // 问题：敏感信息可能硬编码
    pub worker_count: usize,
    pub cache_size: usize,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://localhost/myapp".to_string()),
            redis_url: std::env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            // 问题：硬编码的JWT密钥
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "super_secret_key_123".to_string()),
            worker_count: std::env::var("WORKER_COUNT")
                .unwrap_or_else(|_| "4".to_string())
                .parse()?,
            cache_size: std::env::var("CACHE_SIZE")
                .unwrap_or_else(|_| "1000".to_string())
                .parse()?,
        })
    }
}

// 主应用程序 - 展示应用初始化和生命周期管理
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 初始化日志
    env_logger::init();
    
    // 加载配置
    let config = AppConfig::from_env()?;
    
    // 初始化数据库
    let repository = UserRepository::new(config.database_url.clone());
    let user_service = UserService::new(repository);
    
    // 初始化后台任务处理器
    let task_processor = BackgroundTaskProcessor::new(config.worker_count);
    
    // 提交一些测试任务
    task_processor.submit_task(BackgroundTask::SendEmail {
        to: "user@example.com".to_string(),
        subject: "欢迎".to_string(),
        body: "欢迎使用我们的服务！".to_string(),
    })?;
    
    // 初始化缓存
    let cache: CacheManager<String, String> = CacheManager::new(config.cache_size);
    cache.set("test_key".to_string(), "test_value".to_string());
    
    // 初始化API服务器
    let api_server = ApiServer::new(user_service);
    let routes = api_server.routes();
    
    println!("服务器启动在 http://localhost:3030");
    
    // 启动服务器
    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;
    
    Ok(())
}

// 问题：没有实现优雅关闭
// 问题：没有监控和指标收集
// 问题：错误处理可以更完善
// 问题：测试覆盖率需要提高

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_user_creation() {
        let repo = UserRepository::new("test://localhost".to_string());
        let result = repo.create_user("testuser", "test@example.com");
        
        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.username, "testuser");
        assert_eq!(user.email, "test@example.com");
    }
    
    #[tokio::test]
    async fn test_user_service() {
        let repo = UserRepository::new("test://localhost".to_string());
        let service = UserService::new(repo);
        
        let result = service.get_user(1).await;
        assert!(result.is_ok());
    }
    
    // 问题：测试覆盖率不足，缺少边界情况测试
    // 问题：没有集成测试
    // 问题：没有性能测试
}
