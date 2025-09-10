use std::collections::{HashMap, BTreeMap, VecDeque};
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, Instant};
use std::thread;
use std::fs::File;
use std::io::{Read, Write, BufReader, BufWriter};
use std::net::{TcpListener, TcpStream};

// 内存性能分析演示
#[derive(Debug, Clone)]
pub struct User {
    id: u64,
    name: String,
    email: String,
    profile: UserProfile,
}

#[derive(Debug, Clone)]
pub struct UserProfile {
    avatar: Vec<u8>,  // 可能很大的数据
    preferences: HashMap<String, String>,
    history: Vec<String>,
}

// 性能问题：频繁的克隆操作
pub fn inefficient_user_processing(users: &[User]) -> Vec<User> {
    let mut processed_users = Vec::new();
    
    for user in users {
        // 问题：不必要的克隆
        let mut cloned_user = user.clone();
        
        // 每次循环都克隆整个profile
        let profile_copy = cloned_user.profile.clone();
        
        // 字符串频繁分配
        cloned_user.name = format!("Processed_{}", cloned_user.name);
        
        processed_users.push(cloned_user);
    }
    
    processed_users
}

// 优化版本：减少不必要的分配
pub fn efficient_user_processing(users: &[User]) -> Vec<User> {
    users.iter().map(|user| {
        User {
            id: user.id,
            name: format!("Processed_{}", user.name),  // 只在需要时分配
            email: user.email.clone(),  // 必要的克隆
            profile: user.profile.clone(),  // 可以考虑使用 Cow 或 Arc
        }
    }).collect()
}

// CPU性能分析：算法复杂度问题
pub fn inefficient_search(data: &[i32], targets: &[i32]) -> Vec<bool> {
    let mut results = Vec::new();
    
    // O(n²) 复杂度
    for target in targets {
        let mut found = false;
        for item in data {
            if item == target {
                found = true;
                break;
            }
        }
        results.push(found);
    }
    
    results
}

// 优化版本：使用HashMap预处理
pub fn efficient_search(data: &[i32], targets: &[i32]) -> Vec<bool> {
    // O(n) 预处理
    let data_set: std::collections::HashSet<_> = data.iter().collect();
    
    // O(m) 查询，总复杂度 O(n + m)
    targets.iter().map(|target| data_set.contains(target)).collect()
}

// I/O性能分析
pub struct FileProcessor;

impl FileProcessor {
    // 问题：小缓冲区，频繁系统调用
    pub fn inefficient_file_copy(src: &str, dst: &str) -> std::io::Result<()> {
        let mut src_file = File::open(src)?;
        let mut dst_file = File::create(dst)?;
        
        let mut buffer = [0; 1024];  // 小缓冲区
        
        loop {
            let bytes_read = src_file.read(&mut buffer)?;
            if bytes_read == 0 { break; }
            dst_file.write_all(&buffer[..bytes_read])?;
        }
        
        Ok(())
    }
    
    // 优化版本：使用缓冲读写器
    pub fn efficient_file_copy(src: &str, dst: &str) -> std::io::Result<()> {
        let src_file = File::open(src)?;
        let dst_file = File::create(dst)?;
        
        let mut reader = BufReader::with_capacity(64 * 1024, src_file);  // 64KB缓冲区
        let mut writer = BufWriter::with_capacity(64 * 1024, dst_file);
        
        std::io::copy(&mut reader, &mut writer)?;
        Ok(())
    }
}

// 网络性能分析
pub struct NetworkServer {
    connections: Arc<Mutex<Vec<TcpStream>>>,
}

impl NetworkServer {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(Mutex::new(Vec::new())),
        }
    }
    
    // 问题：同步I/O阻塞
    pub fn synchronous_server(&self, addr: &str) -> std::io::Result<()> {
        let listener = TcpListener::bind(addr)?;
        
        for stream in listener.incoming() {
            match stream {
                Ok(mut stream) => {
                    // 同步处理，阻塞其他连接
                    let mut buffer = [0; 1024];
                    stream.read(&mut buffer)?;
                    stream.write_all(b"HTTP/1.1 200 OK\r\n\r\nHello World")?;
                }
                Err(_) => {}
            }
        }
        
        Ok(())
    }
}

// 并发性能分析
pub struct ConcurrentProcessor {
    data: Arc<RwLock<HashMap<String, i32>>>,
}

impl ConcurrentProcessor {
    pub fn new() -> Self {
        Self {
            data: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    // 问题：锁争用
    pub fn inefficient_concurrent_processing(&self, operations: Vec<String>) {
        let handles: Vec<_> = operations.into_iter().map(|op| {
            let data = Arc::clone(&self.data);
            thread::spawn(move || {
                // 每个操作都获取写锁，导致串行化
                let mut map = data.write().unwrap();
                map.insert(op.clone(), op.len() as i32);
                
                // 模拟计算工作
                thread::sleep(Duration::from_millis(10));
            })
        }).collect();
        
        for handle in handles {
            handle.join().unwrap();
        }
    }
    
    // 优化版本：批量操作减少锁争用
    pub fn efficient_concurrent_processing(&self, operations: Vec<String>) {
        const BATCH_SIZE: usize = 10;
        let batches: Vec<_> = operations.chunks(BATCH_SIZE).collect();
        
        let handles: Vec<_> = batches.into_iter().map(|batch| {
            let data = Arc::clone(&self.data);
            let batch = batch.to_vec();
            
            thread::spawn(move || {
                // 批量计算
                let mut updates = HashMap::new();
                for op in batch {
                    updates.insert(op.clone(), op.len() as i32);
                    thread::sleep(Duration::from_millis(1));
                }
                
                // 一次性更新
                let mut map = data.write().unwrap();
                map.extend(updates);
            })
        }).collect();
        
        for handle in handles {
            handle.join().unwrap();
        }
    }
}

// 编译时优化分析
#[inline(always)]
pub fn hot_function(x: i32, y: i32) -> i32 {
    // 简单计算，适合内联
    x * x + y * y
}

#[inline(never)]
pub fn cold_function(data: &[u8]) -> String {
    // 复杂操作，不适合内联
    data.iter().map(|&b| format!("{:02x}", b)).collect::<Vec<_>>().join("")
}

// 智能指针性能分析
pub struct SmartPointerDemo {
    // 可能过度使用Rc
    shared_data: std::rc::Rc<RefCell<Vec<i32>>>,
    // 适当使用Arc
    thread_safe_data: Arc<RwLock<Vec<i32>>>,
}

use std::cell::RefCell;

impl SmartPointerDemo {
    pub fn new() -> Self {
        Self {
            shared_data: std::rc::Rc::new(RefCell::new(vec![1, 2, 3, 4, 5])),
            thread_safe_data: Arc::new(RwLock::new(vec![1, 2, 3, 4, 5])),
        }
    }
    
    // 问题：不必要的引用计数开销
    pub fn unnecessary_rc_usage(&self) {
        let data_clone = self.shared_data.clone();  // 引用计数+1
        let borrowed = data_clone.borrow();
        println!("Data length: {}", borrowed.len());
        // data_clone在这里被丢弃，引用计数-1
    }
    
    // 优化：直接借用
    pub fn efficient_access(&self) {
        let borrowed = self.shared_data.borrow();
        println!("Data length: {}", borrowed.len());
    }
}

// 零分配操作演示
pub struct ZeroAllocDemo;

impl ZeroAllocDemo {
    // 问题：每次调用都分配
    pub fn allocating_string_processing(input: &str) -> String {
        let mut result = String::new();  // 分配
        for c in input.chars() {
            if c.is_alphanumeric() {
                result.push(c);  // 可能重新分配
            }
        }
        result
    }
    
    // 优化：预分配容量
    pub fn pre_allocated_processing(input: &str) -> String {
        let mut result = String::with_capacity(input.len());  // 预分配
        for c in input.chars() {
            if c.is_alphanumeric() {
                result.push(c);  // 不会重新分配
            }
        }
        result
    }
    
    // 更优化：使用迭代器避免分配
    pub fn iterator_processing(input: &str) -> impl Iterator<Item = char> + '_ {
        input.chars().filter(|c| c.is_alphanumeric())
    }
}

// 性能基准测试示例
#[cfg(test)]
mod benches {
    use super::*;
    use std::time::Instant;
    
    #[test]
    fn benchmark_search_algorithms() {
        let data: Vec<i32> = (0..10000).collect();
        let targets: Vec<i32> = (5000..5100).collect();
        
        // 测试低效算法
        let start = Instant::now();
        let _result1 = inefficient_search(&data, &targets);
        let duration1 = start.elapsed();
        
        // 测试高效算法
        let start = Instant::now();
        let _result2 = efficient_search(&data, &targets);
        let duration2 = start.elapsed();
        
        println!("Inefficient search: {:?}", duration1);
        println!("Efficient search: {:?}", duration2);
        println!("Speedup: {:.2}x", duration1.as_nanos() as f64 / duration2.as_nanos() as f64);
    }
    
    #[test]
    fn benchmark_memory_usage() {
        let users: Vec<User> = (0..1000).map(|i| User {
            id: i,
            name: format!("User{}", i),
            email: format!("user{}@example.com", i),
            profile: UserProfile {
                avatar: vec![0; 1024],  // 1KB avatar
                preferences: HashMap::new(),
                history: Vec::new(),
            },
        }).collect();
        
        // 测试内存分配模式
        let start = Instant::now();
        let _result1 = inefficient_user_processing(&users);
        let duration1 = start.elapsed();
        
        let start = Instant::now();
        let _result2 = efficient_user_processing(&users);
        let duration2 = start.elapsed();
        
        println!("Inefficient processing: {:?}", duration1);
        println!("Efficient processing: {:?}", duration2);
    }
}

// 主函数演示各种性能场景
fn main() {
    println!("Rust性能分析演示");
    
    // 内存分析演示
    let users = vec![
        User {
            id: 1,
            name: "Alice".to_string(),
            email: "alice@example.com".to_string(),
            profile: UserProfile {
                avatar: vec![0; 512],
                preferences: HashMap::new(),
                history: vec!["login".to_string(), "view_profile".to_string()],
            },
        }
    ];
    
    let _processed = efficient_user_processing(&users);
    
    // CPU分析演示
    let data: Vec<i32> = (0..1000).collect();
    let targets: Vec<i32> = vec![100, 200, 300];
    let _results = efficient_search(&data, &targets);
    
    // 并发分析演示
    let processor = ConcurrentProcessor::new();
    let operations: Vec<String> = (0..100).map(|i| format!("operation_{}", i)).collect();
    processor.efficient_concurrent_processing(operations);
    
    // 智能指针演示
    let demo = SmartPointerDemo::new();
    demo.efficient_access();
    
    // 零分配演示
    let input = "Hello, World! 123";
    let _result = ZeroAllocDemo::pre_allocated_processing(input);
    
    println!("性能分析演示完成");
}
