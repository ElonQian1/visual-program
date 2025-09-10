use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use std::thread;
use std::sync::mpsc::{self, Sender, Receiver};

// ===========================================
// 架构模式：依赖注入容器
// ===========================================
pub trait Repository<T> {
    fn find_by_id(&self, id: u32) -> Option<T>;
    fn save(&mut self, entity: T) -> Result<u32, String>;
    fn delete(&mut self, id: u32) -> Result<(), String>;
}

pub trait Service<T> {
    fn process(&self, data: T) -> Result<T, String>;
}

pub struct ServiceContainer {
    services: HashMap<String, Box<dyn std::any::Any + Send + Sync>>,
}

impl ServiceContainer {
    pub fn new() -> Self {
        Self {
            services: HashMap::new(),
        }
    }

    pub fn register<T: 'static + Send + Sync>(&mut self, name: &str, service: T) {
        self.services.insert(name.to_string(), Box::new(service));
    }

    pub fn resolve<T: 'static>(&self, name: &str) -> Option<&T> {
        self.services.get(name)?.downcast_ref::<T>()
    }
}

// ===========================================
// 架构模式：工厂模式
// ===========================================
pub trait DatabaseConnection {
    fn execute_query(&self, query: &str) -> Result<Vec<String>, String>;
    fn begin_transaction(&self) -> Result<(), String>;
    fn commit_transaction(&self) -> Result<(), String>;
    fn rollback_transaction(&self) -> Result<(), String>;
}

pub struct PostgresConnection {
    connection_string: String,
}

impl DatabaseConnection for PostgresConnection {
    fn execute_query(&self, query: &str) -> Result<Vec<String>, String> {
        println!("执行 PostgreSQL 查询: {}", query);
        Ok(vec!["结果1".to_string(), "结果2".to_string()])
    }

    fn begin_transaction(&self) -> Result<(), String> {
        println!("开始 PostgreSQL 事务");
        Ok(())
    }

    fn commit_transaction(&self) -> Result<(), String> {
        println!("提交 PostgreSQL 事务");
        Ok(())
    }

    fn rollback_transaction(&self) -> Result<(), String> {
        println!("回滚 PostgreSQL 事务");
        Ok(())
    }
}

pub struct MySqlConnection {
    connection_string: String,
}

impl DatabaseConnection for MySqlConnection {
    fn execute_query(&self, query: &str) -> Result<Vec<String>, String> {
        println!("执行 MySQL 查询: {}", query);
        Ok(vec!["结果A".to_string(), "结果B".to_string()])
    }

    fn begin_transaction(&self) -> Result<(), String> {
        println!("开始 MySQL 事务");
        Ok(())
    }

    fn commit_transaction(&self) -> Result<(), String> {
        println!("提交 MySQL 事务");
        Ok(())
    }

    fn rollback_transaction(&self) -> Result<(), String> {
        println!("回滚 MySQL 事务");
        Ok(())
    }
}

pub struct DatabaseFactory;

impl DatabaseFactory {
    pub fn create_connection(db_type: &str, connection_string: String) -> Box<dyn DatabaseConnection> {
        match db_type {
            "postgres" => Box::new(PostgresConnection { connection_string }),
            "mysql" => Box::new(MySqlConnection { connection_string }),
            _ => panic!("不支持的数据库类型: {}", db_type),
        }
    }
}

// ===========================================
// 系统设计：模块化架构
// ===========================================
pub mod user_module {
    use super::*;

    #[derive(Debug, Clone)]
    pub struct User {
        pub id: u32,
        pub username: String,
        pub email: String,
        pub created_at: std::time::SystemTime,
    }

    pub struct UserRepository {
        db: Arc<dyn DatabaseConnection + Send + Sync>,
        cache: Arc<Mutex<HashMap<u32, User>>>,
    }

    impl UserRepository {
        pub fn new(db: Arc<dyn DatabaseConnection + Send + Sync>) -> Self {
            Self {
                db,
                cache: Arc::new(Mutex::new(HashMap::new())),
            }
        }
    }

    impl Repository<User> for UserRepository {
        fn find_by_id(&self, id: u32) -> Option<User> {
            // 首先检查缓存
            if let Ok(cache) = self.cache.lock() {
                if let Some(user) = cache.get(&id) {
                    println!("从缓存中获取用户: {}", id);
                    return Some(user.clone());
                }
            }

            // 从数据库查询
            let query = format!("SELECT * FROM users WHERE id = {}", id);
            match self.db.execute_query(&query) {
                Ok(results) => {
                    if !results.is_empty() {
                        let user = User {
                            id,
                            username: format!("user_{}", id),
                            email: format!("user{}@example.com", id),
                            created_at: std::time::SystemTime::now(),
                        };
                        
                        // 更新缓存
                        if let Ok(mut cache) = self.cache.lock() {
                            cache.insert(id, user.clone());
                        }
                        
                        Some(user)
                    } else {
                        None
                    }
                }
                Err(e) => {
                    println!("数据库查询错误: {}", e);
                    None
                }
            }
        }

        fn save(&mut self, entity: User) -> Result<u32, String> {
            let query = format!(
                "INSERT INTO users (username, email) VALUES ('{}', '{}')",
                entity.username, entity.email
            );
            
            self.db.execute_query(&query)?;
            
            // 更新缓存
            if let Ok(mut cache) = self.cache.lock() {
                cache.insert(entity.id, entity);
            }
            
            Ok(entity.id)
        }

        fn delete(&mut self, id: u32) -> Result<(), String> {
            let query = format!("DELETE FROM users WHERE id = {}", id);
            self.db.execute_query(&query)?;
            
            // 从缓存中移除
            if let Ok(mut cache) = self.cache.lock() {
                cache.remove(&id);
            }
            
            Ok(())
        }
    }

    pub struct UserService {
        repository: Arc<Mutex<UserRepository>>,
        notification_sender: Sender<String>,
    }

    impl UserService {
        pub fn new(repository: Arc<Mutex<UserRepository>>, notification_sender: Sender<String>) -> Self {
            Self {
                repository,
                notification_sender,
            }
        }

        pub fn create_user(&self, username: String, email: String) -> Result<u32, String> {
            let user = User {
                id: rand::random::<u32>(),
                username,
                email,
                created_at: std::time::SystemTime::now(),
            };

            let user_id = if let Ok(mut repo) = self.repository.lock() {
                repo.save(user)?
            } else {
                return Err("无法获取仓库锁".to_string());
            };

            // 发送通知
            let _ = self.notification_sender.send(format!("用户 {} 已创建", user_id));

            Ok(user_id)
        }

        pub fn get_user(&self, id: u32) -> Option<User> {
            if let Ok(repo) = self.repository.lock() {
                repo.find_by_id(id)
            } else {
                None
            }
        }
    }
}

// ===========================================
// 分布式系统：消息队列
// ===========================================
pub mod messaging {
    use super::*;

    #[derive(Debug, Clone)]
    pub struct Message {
        pub id: String,
        pub topic: String,
        pub payload: Vec<u8>,
        pub timestamp: Instant,
        pub retry_count: u32,
    }

    pub trait MessageBroker {
        fn publish(&self, topic: &str, payload: Vec<u8>) -> Result<String, String>;
        fn subscribe(&self, topic: &str) -> Result<Receiver<Message>, String>;
        fn acknowledge(&self, message_id: &str) -> Result<(), String>;
    }

    pub struct InMemoryBroker {
        topics: Arc<Mutex<HashMap<String, Vec<Sender<Message>>>>>,
        messages: Arc<Mutex<HashMap<String, Message>>>,
    }

    impl InMemoryBroker {
        pub fn new() -> Self {
            Self {
                topics: Arc::new(Mutex::new(HashMap::new())),
                messages: Arc::new(Mutex::new(HashMap::new())),
            }
        }
    }

    impl MessageBroker for InMemoryBroker {
        fn publish(&self, topic: &str, payload: Vec<u8>) -> Result<String, String> {
            let message_id = uuid::Uuid::new_v4().to_string();
            let message = Message {
                id: message_id.clone(),
                topic: topic.to_string(),
                payload,
                timestamp: Instant::now(),
                retry_count: 0,
            };

            // 存储消息
            if let Ok(mut messages) = self.messages.lock() {
                messages.insert(message_id.clone(), message.clone());
            }

            // 发送给订阅者
            if let Ok(topics) = self.topics.lock() {
                if let Some(subscribers) = topics.get(topic) {
                    for sender in subscribers {
                        let _ = sender.send(message.clone());
                    }
                }
            }

            Ok(message_id)
        }

        fn subscribe(&self, topic: &str) -> Result<Receiver<Message>, String> {
            let (sender, receiver) = mpsc::channel();
            
            if let Ok(mut topics) = self.topics.lock() {
                topics.entry(topic.to_string())
                    .or_insert_with(Vec::new)
                    .push(sender);
            }

            Ok(receiver)
        }

        fn acknowledge(&self, message_id: &str) -> Result<(), String> {
            if let Ok(mut messages) = self.messages.lock() {
                messages.remove(message_id);
            }
            Ok(())
        }
    }

    // 消息处理器
    pub struct MessageProcessor {
        broker: Arc<dyn MessageBroker + Send + Sync>,
        workers: Vec<thread::JoinHandle<()>>,
    }

    impl MessageProcessor {
        pub fn new(broker: Arc<dyn MessageBroker + Send + Sync>, worker_count: usize) -> Self {
            let mut workers = Vec::new();
            
            for i in 0..worker_count {
                let broker_clone = Arc::clone(&broker);
                let worker = thread::spawn(move || {
                    let receiver = broker_clone.subscribe("user_events").unwrap();
                    
                    loop {
                        match receiver.recv() {
                            Ok(message) => {
                                println!("Worker {} 处理消息: {:?}", i, message);
                                
                                // 模拟处理时间
                                thread::sleep(Duration::from_millis(100));
                                
                                // 确认消息
                                let _ = broker_clone.acknowledge(&message.id);
                            }
                            Err(_) => break,
                        }
                    }
                });
                
                workers.push(worker);
            }

            Self { broker, workers }
        }
    }
}

// ===========================================
// 资源管理：连接池
// ===========================================
pub mod connection_pool {
    use super::*;

    pub struct ConnectionPool<T> {
        connections: Arc<Mutex<Vec<T>>>,
        max_size: usize,
        current_size: Arc<Mutex<usize>>,
        factory: Box<dyn Fn() -> T + Send + Sync>,
    }

    impl<T> ConnectionPool<T> 
    where 
        T: Send + 'static 
    {
        pub fn new<F>(max_size: usize, factory: F) -> Self 
        where 
            F: Fn() -> T + Send + Sync + 'static
        {
            Self {
                connections: Arc::new(Mutex::new(Vec::new())),
                max_size,
                current_size: Arc::new(Mutex::new(0)),
                factory: Box::new(factory),
            }
        }

        pub fn get_connection(&self) -> Result<PooledConnection<T>, String> {
            // 尝试从池中获取连接
            if let Ok(mut connections) = self.connections.lock() {
                if let Some(conn) = connections.pop() {
                    return Ok(PooledConnection::new(conn, Arc::clone(&self.connections)));
                }
            }

            // 如果池为空，创建新连接
            if let Ok(mut size) = self.current_size.lock() {
                if *size < self.max_size {
                    let conn = (self.factory)();
                    *size += 1;
                    return Ok(PooledConnection::new(conn, Arc::clone(&self.connections)));
                }
            }

            Err("连接池已满".to_string())
        }
    }

    pub struct PooledConnection<T> {
        connection: Option<T>,
        pool: Arc<Mutex<Vec<T>>>,
    }

    impl<T> PooledConnection<T> {
        fn new(connection: T, pool: Arc<Mutex<Vec<T>>>) -> Self {
            Self {
                connection: Some(connection),
                pool,
            }
        }

        pub fn as_ref(&self) -> Option<&T> {
            self.connection.as_ref()
        }

        pub fn as_mut(&mut self) -> Option<&mut T> {
            self.connection.as_mut()
        }
    }

    impl<T> Drop for PooledConnection<T> {
        fn drop(&mut self) {
            if let Some(conn) = self.connection.take() {
                if let Ok(mut pool) = self.pool.lock() {
                    pool.push(conn);
                }
            }
        }
    }
}

// ===========================================
// 资源管理：内存管理
// ===========================================
pub mod memory_management {
    use super::*;

    pub struct ObjectPool<T> {
        objects: Arc<Mutex<Vec<T>>>,
        factory: Box<dyn Fn() -> T + Send + Sync>,
        reset: Box<dyn Fn(&mut T) + Send + Sync>,
    }

    impl<T> ObjectPool<T>
    where
        T: Send + 'static
    {
        pub fn new<F, R>(factory: F, reset: R) -> Self
        where
            F: Fn() -> T + Send + Sync + 'static,
            R: Fn(&mut T) + Send + Sync + 'static,
        {
            Self {
                objects: Arc::new(Mutex::new(Vec::new())),
                factory: Box::new(factory),
                reset: Box::new(reset),
            }
        }

        pub fn get(&self) -> PooledObject<T> {
            let object = if let Ok(mut objects) = self.objects.lock() {
                objects.pop().unwrap_or_else(|| (self.factory)())
            } else {
                (self.factory)()
            };

            PooledObject::new(object, Arc::clone(&self.objects), &self.reset)
        }
    }

    pub struct PooledObject<T> {
        object: Option<T>,
        pool: Arc<Mutex<Vec<T>>>,
        reset_fn: *const dyn Fn(&mut T),
    }

    impl<T> PooledObject<T> {
        fn new(
            mut object: T, 
            pool: Arc<Mutex<Vec<T>>>, 
            reset_fn: &dyn Fn(&mut T)
        ) -> Self {
            reset_fn(&mut object);
            Self {
                object: Some(object),
                pool,
                reset_fn: reset_fn as *const dyn Fn(&mut T),
            }
        }

        pub fn as_ref(&self) -> Option<&T> {
            self.object.as_ref()
        }

        pub fn as_mut(&mut self) -> Option<&mut T> {
            self.object.as_mut()
        }
    }

    impl<T> Drop for PooledObject<T> {
        fn drop(&mut self) {
            if let Some(mut object) = self.object.take() {
                unsafe {
                    (*self.reset_fn)(&mut object);
                }
                if let Ok(mut pool) = self.pool.lock() {
                    pool.push(object);
                }
            }
        }
    }

    // 自定义分配器
    pub struct CustomAllocator {
        allocated: Arc<Mutex<usize>>,
        max_allocation: usize,
    }

    impl CustomAllocator {
        pub fn new(max_allocation: usize) -> Self {
            Self {
                allocated: Arc::new(Mutex::new(0)),
                max_allocation,
            }
        }

        pub fn allocate(&self, size: usize) -> Result<Vec<u8>, String> {
            if let Ok(mut allocated) = self.allocated.lock() {
                if *allocated + size > self.max_allocation {
                    return Err("超出最大分配限制".to_string());
                }
                *allocated += size;
                Ok(vec![0; size])
            } else {
                Err("无法获取分配器锁".to_string())
            }
        }

        pub fn deallocate(&self, size: usize) {
            if let Ok(mut allocated) = self.allocated.lock() {
                *allocated = allocated.saturating_sub(size);
            }
        }

        pub fn get_allocated(&self) -> usize {
            self.allocated.lock().unwrap_or_default()
        }
    }
}

// ===========================================
// 主系统：系统架构集成
// ===========================================
pub struct SystemArchitecture {
    service_container: ServiceContainer,
    database_factory: DatabaseFactory,
    message_broker: Arc<dyn messaging::MessageBroker + Send + Sync>,
    connection_pool: connection_pool::ConnectionPool<Box<dyn DatabaseConnection>>,
    custom_allocator: memory_management::CustomAllocator,
}

impl SystemArchitecture {
    pub fn new() -> Self {
        let service_container = ServiceContainer::new();
        let database_factory = DatabaseFactory;
        let message_broker = Arc::new(messaging::InMemoryBroker::new());
        
        let connection_pool = connection_pool::ConnectionPool::new(10, || {
            DatabaseFactory::create_connection("postgres", "localhost:5432".to_string())
        });
        
        let custom_allocator = memory_management::CustomAllocator::new(1024 * 1024 * 100); // 100MB

        Self {
            service_container,
            database_factory,
            message_broker,
            connection_pool,
            custom_allocator,
        }
    }

    pub fn initialize(&mut self) -> Result<(), String> {
        println!("初始化系统架构...");
        
        // 注册服务
        let db_connection = Arc::new(PostgresConnection {
            connection_string: "postgres://localhost:5432/mydb".to_string(),
        });
        
        let user_repo = Arc::new(Mutex::new(
            user_module::UserRepository::new(db_connection)
        ));
        
        let (tx, rx) = mpsc::channel();
        let user_service = user_module::UserService::new(user_repo, tx);
        
        self.service_container.register("user_service", user_service);
        
        // 启动消息处理器
        let _processor = messaging::MessageProcessor::new(
            Arc::clone(&self.message_broker), 
            4
        );
        
        println!("系统架构初始化完成");
        Ok(())
    }

    pub fn get_metrics(&self) -> SystemMetrics {
        SystemMetrics {
            allocated_memory: self.custom_allocator.get_allocated(),
            active_connections: 0, // 实际实现中需要跟踪
            message_queue_size: 0, // 实际实现中需要跟踪
            uptime: Duration::from_secs(0), // 实际实现中需要跟踪
        }
    }
}

#[derive(Debug)]
pub struct SystemMetrics {
    pub allocated_memory: usize,
    pub active_connections: usize,
    pub message_queue_size: usize,
    pub uptime: Duration,
}

// ===========================================
// 示例用法和测试
// ===========================================
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_architecture() {
        let mut system = SystemArchitecture::new();
        assert!(system.initialize().is_ok());
        
        let metrics = system.get_metrics();
        println!("系统指标: {:?}", metrics);
    }

    #[test]
    fn test_dependency_injection() {
        let mut container = ServiceContainer::new();
        container.register("test_service", String::from("测试服务"));
        
        let service = container.resolve::<String>("test_service");
        assert!(service.is_some());
        assert_eq!(service.unwrap(), "测试服务");
    }

    #[test]
    fn test_database_factory() {
        let postgres_conn = DatabaseFactory::create_connection(
            "postgres", 
            "localhost:5432".to_string()
        );
        
        let result = postgres_conn.execute_query("SELECT 1");
        assert!(result.is_ok());
    }
}

fn main() {
    println!("启动 Rust 系统架构演示...");
    
    let mut system = SystemArchitecture::new();
    if let Err(e) = system.initialize() {
        eprintln!("系统初始化失败: {}", e);
        return;
    }
    
    // 模拟系统运行
    loop {
        let metrics = system.get_metrics();
        println!("当前系统状态: {:?}", metrics);
        
        thread::sleep(Duration::from_secs(5));
        break; // 在实际应用中这里不会break
    }
    
    println!("系统架构演示完成");
}
