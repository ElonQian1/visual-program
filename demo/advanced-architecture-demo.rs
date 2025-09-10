/**
 * Rust高级架构分析演示文件
 * 包含各种架构模式、性能问题、安全性问题和最佳实践案例
 */

use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Duration;
use tokio::sync::mpsc;
use serde::{Deserialize, Serialize};

// ====== 所有权模式演示 ======

// 1. 智能指针模式
#[derive(Debug, Clone)]
pub struct SharedData {
    data: Arc<RwLock<HashMap<String, i32>>>,
}

impl SharedData {
    pub fn new() -> Self {
        Self {
            data: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    pub fn insert(&self, key: String, value: i32) -> Result<(), Box<dyn std::error::Error>> {
        let mut data = self.data.write()?;
        data.insert(key, value);
        Ok(())
    }
    
    pub fn get(&self, key: &str) -> Result<Option<i32>, Box<dyn std::error::Error>> {
        let data = self.data.read()?;
        Ok(data.get(key).copied())
    }
}

// 2. 生命周期管理模式
pub struct DataProcessor<'a> {
    data: &'a [u8],
    config: &'a ProcessorConfig,
}

pub struct ProcessorConfig {
    chunk_size: usize,
    parallel: bool,
}

impl<'a> DataProcessor<'a> {
    pub fn new(data: &'a [u8], config: &'a ProcessorConfig) -> Self {
        Self { data, config }
    }
    
    pub fn process(&self) -> Vec<u8> {
        if self.config.parallel {
            self.process_parallel()
        } else {
            self.process_sequential()
        }
    }
    
    fn process_parallel(&self) -> Vec<u8> {
        // 并行处理逻辑
        self.data.chunks(self.config.chunk_size)
            .map(|chunk| chunk.iter().map(|&b| b.wrapping_add(1)).collect::<Vec<u8>>())
            .flatten()
            .collect()
    }
    
    fn process_sequential(&self) -> Vec<u8> {
        self.data.iter().map(|&b| b.wrapping_add(1)).collect()
    }
}

// ====== Trait模式演示 ======

// 1. 策略模式通过trait实现
pub trait CompressionStrategy {
    fn compress(&self, data: &[u8]) -> Vec<u8>;
    fn decompress(&self, data: &[u8]) -> Result<Vec<u8>, String>;
}

pub struct GzipCompression;
pub struct LzmaCompression;

impl CompressionStrategy for GzipCompression {
    fn compress(&self, data: &[u8]) -> Vec<u8> {
        // 模拟GZIP压缩
        data.iter().map(|&b| b ^ 0xAA).collect()
    }
    
    fn decompress(&self, data: &[u8]) -> Result<Vec<u8>, String> {
        Ok(data.iter().map(|&b| b ^ 0xAA).collect())
    }
}

impl CompressionStrategy for LzmaCompression {
    fn compress(&self, data: &[u8]) -> Vec<u8> {
        // 模拟LZMA压缩
        data.iter().map(|&b| b.wrapping_add(1)).collect()
    }
    
    fn decompress(&self, data: &[u8]) -> Result<Vec<u8>, String> {
        Ok(data.iter().map(|&b| b.wrapping_sub(1)).collect())
    }
}

// 2. 工厂模式
pub struct CompressionFactory;

impl CompressionFactory {
    pub fn create_compressor(algo: &str) -> Box<dyn CompressionStrategy> {
        match algo {
            "gzip" => Box::new(GzipCompression),
            "lzma" => Box::new(LzmaCompression),
            _ => Box::new(GzipCompression), // 默认使用gzip
        }
    }
}

// ====== 枚举模式演示 ======

#[derive(Debug, Serialize, Deserialize)]
pub enum ProcessingResult {
    Success { data: Vec<u8>, duration: u64 },
    Error { message: String, code: i32 },
    Timeout { elapsed: u64 },
}

#[derive(Debug)]
pub enum Command {
    Start { config: ProcessorConfig },
    Stop,
    Pause { duration: Duration },
    Resume,
    Status,
}

// ====== 异步模式演示 ======

// 1. Actor模式
pub struct DataActor {
    receiver: mpsc::Receiver<Command>,
    data: HashMap<String, Vec<u8>>,
}

impl DataActor {
    pub fn new(receiver: mpsc::Receiver<Command>) -> Self {
        Self {
            receiver,
            data: HashMap::new(),
        }
    }
    
    pub async fn run(&mut self) {
        while let Some(command) = self.receiver.recv().await {
            match command {
                Command::Start { config } => {
                    println!("Starting with config: {:?}", config);
                }
                Command::Stop => {
                    println!("Stopping actor");
                    break;
                }
                Command::Pause { duration } => {
                    tokio::time::sleep(duration).await;
                }
                Command::Status => {
                    println!("Actor status: {} items", self.data.len());
                }
                _ => {}
            }
        }
    }
}

// 2. 异步任务管理
pub struct TaskManager {
    tasks: Vec<tokio::task::JoinHandle<ProcessingResult>>,
}

impl TaskManager {
    pub fn new() -> Self {
        Self { tasks: Vec::new() }
    }
    
    pub fn spawn_task<F>(&mut self, future: F)
    where
        F: std::future::Future<Output = ProcessingResult> + Send + 'static,
    {
        let handle = tokio::spawn(future);
        self.tasks.push(handle);
    }
    
    pub async fn wait_all(&mut self) -> Vec<ProcessingResult> {
        let mut results = Vec::new();
        for handle in self.tasks.drain(..) {
            match handle.await {
                Ok(result) => results.push(result),
                Err(e) => results.push(ProcessingResult::Error {
                    message: format!("Task failed: {}", e),
                    code: -1,
                }),
            }
        }
        results
    }
}

// ====== 宏模式演示 ======

// 声明式宏
macro_rules! create_processor {
    ($name:ident, $process_fn:expr) => {
        pub struct $name;
        
        impl $name {
            pub fn process(&self, data: &[u8]) -> Vec<u8> {
                $process_fn(data)
            }
        }
    };
}

create_processor!(UpperCaseProcessor, |data: &[u8]| {
    data.iter().map(|&b| if b >= b'a' && b <= b'z' { b - 32 } else { b }).collect()
});

create_processor!(ReverseProcessor, |data: &[u8]| {
    data.iter().rev().copied().collect()
});

// 程序式宏
use proc_macro::TokenStream;

// ====== 性能问题演示 ======

// 问题1：不必要的克隆
pub fn inefficient_string_processing(strings: Vec<String>) -> Vec<String> {
    let mut result = Vec::new();
    for s in strings {
        // 问题：不必要的克隆
        let cloned = s.clone();
        result.push(cloned.to_uppercase());
    }
    result
}

// 问题2：分配过多内存
pub fn memory_intensive_function() -> Vec<Vec<i32>> {
    let mut result = Vec::new();
    for i in 0..1000 {
        // 问题：每次都创建新的Vec
        let mut inner = Vec::new();
        for j in 0..1000 {
            inner.push(i * j);
        }
        result.push(inner);
    }
    result
}

// 问题3：锁竞争
pub fn lock_contention_example() {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for _ in 0..10 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            for _ in 0..1000 {
                // 问题：高频锁竞争
                let mut num = data.lock().unwrap();
                *num += 1;
                // 锁持有时间过长
                thread::sleep(Duration::from_millis(1));
            }
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
}

// ====== 安全性问题演示 ======

// 问题1：未检查的unsafe代码
pub unsafe fn unsafe_memory_access(ptr: *mut u8, len: usize) -> Vec<u8> {
    // 问题：没有检查指针有效性
    let slice = std::slice::from_raw_parts(ptr, len);
    slice.to_vec()
}

// 问题2：潜在的整数溢出
pub fn potential_overflow(a: u32, b: u32) -> u32 {
    // 问题：可能溢出
    a + b
}

// 问题3：未处理的panic
pub fn may_panic(index: usize, vec: &Vec<i32>) -> i32 {
    // 问题：可能panic
    vec[index]
}

// ====== 优化示例 ======

// 优化1：避免不必要的克隆
pub fn efficient_string_processing(strings: Vec<String>) -> Vec<String> {
    strings.into_iter()
        .map(|s| s.to_uppercase())
        .collect()
}

// 优化2：预分配内存
pub fn memory_efficient_function() -> Vec<Vec<i32>> {
    let mut result = Vec::with_capacity(1000);
    for i in 0..1000 {
        let mut inner = Vec::with_capacity(1000);
        for j in 0..1000 {
            inner.push(i * j);
        }
        result.push(inner);
    }
    result
}

// 优化3：减少锁竞争
pub fn lock_optimized_example() {
    let data = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for _ in 0..10 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            let mut local_sum = 0;
            for _ in 0..1000 {
                // 优化：本地累积，减少锁竞争
                local_sum += 1;
            }
            // 只在最后更新共享状态
            let mut num = data.lock().unwrap();
            *num += local_sum;
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
}

// ====== 主程序 ======
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Rust高级架构分析演示");
    
    // 测试共享数据
    let shared_data = SharedData::new();
    shared_data.insert("key1".to_string(), 42)?;
    println!("Shared data: {:?}", shared_data.get("key1")?);
    
    // 测试数据处理器
    let config = ProcessorConfig {
        chunk_size: 4,
        parallel: true,
    };
    let data = b"Hello, World!";
    let processor = DataProcessor::new(data, &config);
    let result = processor.process();
    println!("Processed data length: {}", result.len());
    
    // 测试压缩策略
    let compressor = CompressionFactory::create_compressor("gzip");
    let compressed = compressor.compress(data);
    println!("Compressed data length: {}", compressed.len());
    
    // 测试异步Actor
    let (sender, receiver) = mpsc::channel(32);
    let mut actor = DataActor::new(receiver);
    
    tokio::spawn(async move {
        actor.run().await;
    });
    
    sender.send(Command::Status).await?;
    sender.send(Command::Stop).await?;
    
    // 测试任务管理器
    let mut task_manager = TaskManager::new();
    
    task_manager.spawn_task(async {
        tokio::time::sleep(Duration::from_millis(100)).await;
        ProcessingResult::Success {
            data: vec![1, 2, 3],
            duration: 100,
        }
    });
    
    let results = task_manager.wait_all().await;
    println!("Task results: {:?}", results);
    
    // 测试宏生成的处理器
    let upper_processor = UpperCaseProcessor;
    let processed = upper_processor.process(b"hello");
    println!("Upper case: {:?}", String::from_utf8_lossy(&processed));
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_shared_data() {
        let shared = SharedData::new();
        shared.insert("test".to_string(), 123).unwrap();
        assert_eq!(shared.get("test").unwrap(), Some(123));
    }
    
    #[test]
    fn test_compression() {
        let gzip = GzipCompression;
        let data = b"test data";
        let compressed = gzip.compress(data);
        let decompressed = gzip.decompress(&compressed).unwrap();
        assert_eq!(data, decompressed.as_slice());
    }
    
    #[tokio::test]
    async fn test_task_manager() {
        let mut manager = TaskManager::new();
        manager.spawn_task(async {
            ProcessingResult::Success {
                data: vec![1, 2, 3],
                duration: 0,
            }
        });
        
        let results = manager.wait_all().await;
        assert_eq!(results.len(), 1);
    }
}
