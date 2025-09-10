/**
 * Rust并发安全分析演示
 * 复杂的并发编程场景，用于测试RustConcurrencySafetyAnalyzer
 */

use std::sync::{Arc, Mutex, RwLock, Condvar};
use std::thread;
use std::time::Duration;
use std::collections::HashMap;
use tokio::sync::{mpsc, Semaphore};
use tokio::time::sleep;
use std::sync::atomic::{AtomicUsize, Ordering};

// 全局静态变量 - 潜在的并发安全问题
static mut GLOBAL_COUNTER: usize = 0;
static ATOMIC_COUNTER: AtomicUsize = AtomicUsize::new(0);

// 共享数据结构
#[derive(Debug, Clone)]
struct UserData {
    id: u32,
    name: String,
    balance: f64,
    last_activity: std::time::SystemTime,
}

// 线程安全的缓存
type SafeCache = Arc<RwLock<HashMap<u32, UserData>>>;
type UnsafeCache = Arc<Mutex<HashMap<u32, UserData>>>;

// 复杂的并发模式演示
struct ConcurrencyDemo {
    user_cache: SafeCache,
    request_limiter: Arc<Semaphore>,
    active_connections: Arc<AtomicUsize>,
    shutdown_signal: Arc<Condvar>,
    shutdown_mutex: Arc<Mutex<bool>>,
}

impl ConcurrencyDemo {
    fn new() -> Self {
        Self {
            user_cache: Arc::new(RwLock::new(HashMap::new())),
            request_limiter: Arc::new(Semaphore::new(100)),
            active_connections: Arc::new(AtomicUsize::new(0)),
            shutdown_signal: Arc::new(Condvar::new()),
            shutdown_mutex: Arc::new(Mutex::new(false)),
        }
    }

    // 手动线程管理 - 可能有死锁风险
    fn spawn_worker_threads(&self) {
        let cache = Arc::clone(&self.user_cache);
        let limiter = Arc::clone(&self.request_limiter);
        let counter = Arc::clone(&self.active_connections);

        // 多个线程同时访问共享资源
        for i in 0..10 {
            let cache_clone = Arc::clone(&cache);
            let limiter_clone = Arc::clone(&limiter);
            let counter_clone = Arc::clone(&counter);

            thread::spawn(move || {
                loop {
                    // 获取许可
                    let _permit = limiter_clone.try_acquire();
                    
                    // 原子操作
                    counter_clone.fetch_add(1, Ordering::SeqCst);

                    // 读锁操作
                    {
                        let cache_read = cache_clone.read().unwrap();
                        if let Some(user) = cache_read.get(&(i as u32)) {
                            println!("Found user: {:?}", user);
                        }
                    }

                    // 写锁操作 - 潜在的读写锁升级问题
                    {
                        let mut cache_write = cache_clone.write().unwrap();
                        cache_write.insert(i as u32, UserData {
                            id: i as u32,
                            name: format!("User {}", i),
                            balance: 100.0 + i as f64,
                            last_activity: std::time::SystemTime::now(),
                        });
                    }

                    counter_clone.fetch_sub(1, Ordering::SeqCst);
                    thread::sleep(Duration::from_millis(100));
                }
            });
        }
    }

    // Async/await 模式
    async fn async_operations(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let (tx, mut rx) = mpsc::channel::<UserData>(32);

        // 异步任务生产者
        let producer = async {
            for i in 0..100 {
                let user = UserData {
                    id: i,
                    name: format!("AsyncUser {}", i),
                    balance: 1000.0,
                    last_activity: std::time::SystemTime::now(),
                };

                if tx.send(user).await.is_err() {
                    break;
                }

                // 模拟工作负载
                sleep(Duration::from_millis(10)).await;
            }
        };

        // 异步任务消费者
        let cache = Arc::clone(&self.user_cache);
        let consumer = async move {
            while let Some(user) = rx.recv().await {
                // 在异步上下文中使用同步锁 - 潜在问题
                let mut cache_write = cache.write().unwrap();
                cache_write.insert(user.id, user);
                
                // 在持有锁的情况下进行异步操作 - 危险
                // sleep(Duration::from_millis(1)).await; // 这会导致问题
            }
        };

        // 并发执行
        tokio::try_join!(producer, consumer)?;
        Ok(())
    }

    // 潜在的死锁场景
    fn deadlock_prone_operations(&self) {
        let cache1 = Arc::clone(&self.user_cache);
        let cache2 = Arc::clone(&self.user_cache);

        let handle1 = thread::spawn(move || {
            // 线程1: 先获取cache1的写锁，再尝试获取cache2的读锁
            let _write_lock1 = cache1.write().unwrap();
            thread::sleep(Duration::from_millis(10));
            let _read_lock2 = cache2.read().unwrap();
        });

        let handle2 = thread::spawn(move || {
            // 线程2: 先获取cache2的写锁，再尝试获取cache1的读锁
            let _write_lock2 = cache2.write().unwrap();
            thread::sleep(Duration::from_millis(10));
            let _read_lock1 = cache1.read().unwrap();
        });

        // 等待线程完成 - 可能会死锁
        let _ = handle1.join();
        let _ = handle2.join();
    }

    // 数据竞争示例
    fn race_condition_example(&self) {
        let shared_data = Arc::new(Mutex::new(0i32));

        let mut handles = vec![];

        for _ in 0..10 {
            let data = Arc::clone(&shared_data);
            let handle = thread::spawn(move || {
                for _ in 0..1000 {
                    // 检查然后操作的竞态条件
                    let current = {
                        let guard = data.lock().unwrap();
                        *guard
                    };
                    // 在这里可能发生竞态条件
                    if current < 5000 {
                        let mut guard = data.lock().unwrap();
                        *guard += 1;
                    }
                }
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap();
        }
    }

    // unsafe代码块使用
    unsafe fn unsafe_operations(&self) {
        // 原始指针操作
        let mut x = 42;
        let raw_ptr = &mut x as *mut i32;
        *raw_ptr = 100;

        // 静态可变变量访问
        GLOBAL_COUNTER += 1;

        // 内存transmute
        let bytes: [u8; 4] = std::mem::transmute(x);
        println!("Bytes: {:?}", bytes);

        // 未检查的数组访问
        let arr = [1, 2, 3, 4, 5];
        let ptr = arr.as_ptr();
        let value = *ptr.offset(10); // 可能越界
        println!("Unsafe value: {}", value);
    }

    // Channel通信模式
    async fn channel_communication(&self) {
        let (tx, mut rx) = mpsc::channel::<String>(100);

        // 多个发送者
        for i in 0..5 {
            let sender = tx.clone();
            tokio::spawn(async move {
                for j in 0..10 {
                    if sender.send(format!("Message {}-{}", i, j)).await.is_err() {
                        break;
                    }
                    sleep(Duration::from_millis(50)).await;
                }
            });
        }

        // 单个接收者
        tokio::spawn(async move {
            while let Some(message) = rx.recv().await {
                println!("Received: {}", message);
                // 处理消息
                sleep(Duration::from_millis(10)).await;
            }
        });
    }

    // Rayon并行处理
    fn parallel_processing(&self) {
        use rayon::prelude::*;

        let data: Vec<i32> = (0..1000000).collect();

        // 并行迭代处理
        let result: i32 = data
            .par_iter()
            .map(|&x| x * x)
            .filter(|&x| x % 2 == 0)
            .sum();

        println!("Parallel sum: {}", result);

        // 并行排序
        let mut numbers: Vec<i32> = (0..100000).rev().collect();
        numbers.par_sort();
    }

    // 生命周期和借用检查示例
    fn lifetime_examples<'a>(&'a self, input: &'a str) -> &'a str {
        // 复杂的生命周期
        let cache = self.user_cache.read().unwrap();
        
        // 这里有潜在的生命周期问题
        if cache.is_empty() {
            "empty"
        } else {
            input // 返回输入的引用
        }
    }

    // 错误处理模式
    fn error_handling_patterns(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // 多层错误传播
        let cache = self.user_cache.write()
            .map_err(|_| "Failed to acquire write lock")?;

        // 自定义错误类型
        #[derive(Debug)]
        struct CustomError(String);
        impl std::fmt::Display for CustomError {
            fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                write!(f, "{}", self.0)
            }
        }
        impl std::error::Error for CustomError {}

        if cache.len() > 1000 {
            return Err(Box::new(CustomError("Cache too large".to_string())));
        }

        Ok(())
    }

    // 内存管理示例
    fn memory_management_examples(&self) {
        // 引用计数
        let shared_string = std::rc::Rc::new("Hello World".to_string());
        let weak_ref = std::rc::Rc::downgrade(&shared_string);

        // 线程安全的引用计数
        let thread_safe_string = Arc::new("Thread Safe".to_string());
        let weak_thread_ref = Arc::downgrade(&thread_safe_string);

        // Box智能指针
        let boxed_data = Box::new(vec![1, 2, 3, 4, 5]);
        let leaked_data = Box::leak(boxed_data); // 内存泄漏

        // 循环引用的风险
        use std::rc::{Rc, Weak};
        use std::cell::RefCell;

        #[derive(Debug)]
        struct Node {
            value: i32,
            children: RefCell<Vec<Rc<Node>>>,
            parent: RefCell<Weak<Node>>,
        }
    }

    // 异步错误处理
    async fn async_error_handling(&self) -> Result<(), tokio::task::JoinError> {
        let tasks = vec![
            tokio::spawn(async { panic!("Task 1 panicked") }),
            tokio::spawn(async { Ok::<(), &str>(()) }),
            tokio::spawn(async { Err("Task 3 failed") }),
        ];

        // 等待所有任务完成 - 某些可能失败
        for task in tasks {
            match task.await {
                Ok(Ok(())) => println!("Task completed successfully"),
                Ok(Err(e)) => println!("Task failed: {}", e),
                Err(e) => println!("Task panicked: {}", e),
            }
        }

        Ok(())
    }
}

// 主函数演示
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let demo = ConcurrencyDemo::new();

    // 启动工作线程
    demo.spawn_worker_threads();

    // 异步操作
    demo.async_operations().await?;

    // 并行处理
    demo.parallel_processing();

    // Channel通信
    demo.channel_communication().await;

    // 潜在的死锁和竞态条件（谨慎运行）
    // demo.deadlock_prone_operations();
    // demo.race_condition_example();

    // 错误处理
    if let Err(e) = demo.error_handling_patterns() {
        println!("Error: {}", e);
    }

    // 异步错误处理
    demo.async_error_handling().await?;

    // 内存管理
    demo.memory_management_examples();

    // unsafe操作（需要谨慎）
    unsafe {
        demo.unsafe_operations();
    }

    println!("Concurrency demo completed");
    Ok(())
}
