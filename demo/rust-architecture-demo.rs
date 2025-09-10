// Rust高级架构模式演示
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use async_trait::async_trait;

// Repository模式演示
#[async_trait]
trait UserRepository {
    async fn find_by_id(&self, id: u32) -> Result<Option<User>, DatabaseError>;
    async fn save(&self, user: &User) -> Result<(), DatabaseError>;
}

// Actor模式演示
struct UserActor {
    state: HashMap<u32, User>,
}

impl UserActor {
    fn new() -> Self {
        Self {
            state: HashMap::new(),
        }
    }
    
    async fn handle_message(&mut self, msg: UserMessage) -> UserResponse {
        match msg {
            UserMessage::GetUser { id } => {
                UserResponse::User(self.state.get(&id).cloned())
            }
            UserMessage::UpdateUser { user } => {
                self.state.insert(user.id, user);
                UserResponse::Success
            }
        }
    }
}

// Command模式演示
trait Command {
    fn execute(&self) -> Result<(), CommandError>;
}

struct CreateUserCommand {
    user_data: UserData,
    repository: Arc<dyn UserRepository + Send + Sync>,
}

impl Command for CreateUserCommand {
    fn execute(&self) -> Result<(), CommandError> {
        // 执行用户创建逻辑
        Ok(())
    }
}

// Observer模式演示
trait Observer<T> {
    fn notify(&self, event: &T);
}

struct EventBus<T> {
    observers: Vec<Box<dyn Observer<T> + Send + Sync>>,
}

impl<T> EventBus<T> {
    fn new() -> Self {
        Self {
            observers: Vec::new(),
        }
    }
    
    fn subscribe(&mut self, observer: Box<dyn Observer<T> + Send + Sync>) {
        self.observers.push(observer);
    }
    
    fn publish(&self, event: &T) {
        for observer in &self.observers {
            observer.notify(event);
        }
    }
}

// Factory/Builder模式演示
struct DatabaseConnectionBuilder {
    host: Option<String>,
    port: Option<u16>,
    database: Option<String>,
    pool_size: Option<u32>,
}

impl DatabaseConnectionBuilder {
    fn new() -> Self {
        Self {
            host: None,
            port: None,
            database: None,
            pool_size: None,
        }
    }
    
    fn host(mut self, host: String) -> Self {
        self.host = Some(host);
        self
    }
    
    fn port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }
    
    fn build(self) -> Result<DatabaseConnection, BuildError> {
        let host = self.host.ok_or(BuildError::MissingHost)?;
        let port = self.port.unwrap_or(5432);
        
        Ok(DatabaseConnection::new(host, port))
    }
}

// 单例模式演示 (使用lazy_static)
use lazy_static::lazy_static;

lazy_static! {
    static ref CONFIG: Arc<Mutex<AppConfig>> = Arc::new(Mutex::new(AppConfig::default()));
}

// 微服务架构演示
struct ApiGateway {
    services: HashMap<String, ServiceEndpoint>,
    load_balancer: LoadBalancer,
}

impl ApiGateway {
    fn route_request(&self, path: &str) -> Option<&ServiceEndpoint> {
        self.services.get(path)
    }
}

// 事件驱动架构演示
#[derive(Debug, Clone)]
enum UserEvent {
    UserCreated { id: u32, email: String },
    UserUpdated { id: u32, changes: Vec<String> },
    UserDeleted { id: u32 },
}

struct EventStore {
    events: Arc<RwLock<Vec<UserEvent>>>,
}

impl EventStore {
    async fn append_event(&self, event: UserEvent) {
        let mut events = self.events.write().await;
        events.push(event);
    }
    
    async fn replay_events(&self) -> Vec<UserEvent> {
        self.events.read().await.clone()
    }
}

// CQRS模式演示
struct UserCommandHandler {
    event_store: Arc<EventStore>,
}

impl UserCommandHandler {
    async fn handle_create_user(&self, cmd: CreateUserCommand) -> Result<(), CommandError> {
        // 验证命令
        // 创建事件
        let event = UserEvent::UserCreated {
            id: 1,
            email: "user@example.com".to_string(),
        };
        
        self.event_store.append_event(event).await;
        Ok(())
    }
}

struct UserQueryHandler {
    read_model: Arc<RwLock<HashMap<u32, UserView>>>,
}

impl UserQueryHandler {
    async fn get_user(&self, id: u32) -> Option<UserView> {
        let read_model = self.read_model.read().await;
        read_model.get(&id).cloned()
    }
}

// 分布式系统 - Raft共识算法示例
struct RaftNode {
    id: u32,
    term: u64,
    voted_for: Option<u32>,
    log: Vec<LogEntry>,
    state: NodeState,
}

enum NodeState {
    Follower,
    Candidate,
    Leader,
}

// 资源管理 - 内存池示例
struct ObjectPool<T> {
    objects: Arc<Mutex<Vec<T>>>,
    factory: Box<dyn Fn() -> T + Send + Sync>,
}

impl<T> ObjectPool<T> {
    fn acquire(&self) -> Option<T> {
        let mut objects = self.objects.lock().unwrap();
        objects.pop()
    }
    
    fn release(&self, obj: T) {
        let mut objects = self.objects.lock().unwrap();
        objects.push(obj);
    }
}

// 并行计算优化示例
use rayon::prelude::*;

fn parallel_processing(data: Vec<u32>) -> Vec<u32> {
    data.par_iter()
        .map(|&x| expensive_calculation(x))
        .collect()
}

fn expensive_calculation(n: u32) -> u32 {
    // 模拟CPU密集型计算
    (0..n).sum()
}

// 异步I/O优化
async fn batch_database_operations(queries: Vec<DatabaseQuery>) -> Vec<QueryResult> {
    use futures::future::join_all;
    
    let futures: Vec<_> = queries.into_iter()
        .map(|query| execute_query_async(query))
        .collect();
    
    join_all(futures).await
}

// 类型定义
#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

#[derive(Debug)]
struct UserData {
    name: String,
    email: String,
}

#[derive(Debug)]
enum UserMessage {
    GetUser { id: u32 },
    UpdateUser { user: User },
}

#[derive(Debug)]
enum UserResponse {
    User(Option<User>),
    Success,
}

#[derive(Debug)]
struct DatabaseError;

#[derive(Debug)]
struct CommandError;

#[derive(Debug)]
enum BuildError {
    MissingHost,
}

#[derive(Debug)]
struct DatabaseConnection;

impl DatabaseConnection {
    fn new(host: String, port: u16) -> Self {
        Self {}
    }
}

#[derive(Debug, Default)]
struct AppConfig {
    database_url: String,
    api_port: u16,
}

struct ServiceEndpoint {
    url: String,
    health_check: String,
}

struct LoadBalancer;

#[derive(Debug, Clone)]
struct UserView {
    id: u32,
    name: String,
    email: String,
    last_updated: String,
}

struct LogEntry {
    term: u64,
    data: Vec<u8>,
}

struct DatabaseQuery;
struct QueryResult;

async fn execute_query_async(query: DatabaseQuery) -> QueryResult {
    QueryResult
}
