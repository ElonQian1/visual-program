// Rust高级性能分析演示文件
// 用于测试系统性能监控、内存分析、并发优化等功能

use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::{Duration, Instant};

// 存在性能问题的大型结构体
#[derive(Debug, Clone)]
pub struct LargeDataStructure {
    pub id: u64,
    pub name: String,
    pub data: Vec<u8>,
    pub metadata: HashMap<String, String>,
    pub nested_data: Vec<NestedData>,
    pub cache: HashMap<String, CachedValue>,
}

#[derive(Debug, Clone)]
pub struct NestedData {
    pub field1: String,
    pub field2: Vec<i32>,
    pub field3: HashMap<u32, String>,
}

#[derive(Debug, Clone)]
pub struct CachedValue {
    pub value: String,
    pub timestamp: u64,
    pub access_count: u32,
}

// 可能存在内存泄漏的全局状态
static mut GLOBAL_CACHE: Option<HashMap<String, String>> = None;
static mut COUNTER: u64 = 0;

// 性能问题示例：过度使用clone()
impl LargeDataStructure {
    pub fn new(id: u64, name: String) -> Self {
        Self {
            id,
            name: name.clone(), // 不必要的clone
            data: Vec::new(),
            metadata: HashMap::new(),
            nested_data: Vec::new(),
            cache: HashMap::new(),
        }
    }
    
    // 性能问题：函数过长且复杂度高
    pub fn process_data(&mut self, input: &[u8]) -> Result<Vec<u8>, String> {
        let start = Instant::now();
        
        // 第一阶段：数据预处理
        let mut preprocessed = Vec::with_capacity(input.len());
        for byte in input {
            if *byte > 127 {
                preprocessed.push(*byte - 128);
            } else {
                preprocessed.push(*byte);
            }
        }
        
        // 第二阶段：复杂计算
        let mut result = Vec::new();
        for i in 0..preprocessed.len() {
            let mut temp = preprocessed[i];
            
            // 嵌套循环导致O(n²)复杂度
            for j in 0..preprocessed.len() {
                if i != j {
                    temp = temp.wrapping_add(preprocessed[j] / (j as u8 + 1));
                }
            }
            
            // 更多复杂计算
            for k in 0..10 {
                temp = temp.wrapping_mul(k as u8 + 1);
                temp = temp.wrapping_add(self.id as u8);
                
                // 不必要的字符串操作
                let temp_str = format!("temp_{}_{}_{}", i, j, k);
                self.metadata.insert(temp_str.clone(), temp.to_string()); // clone可以避免
                
                // 频繁的内存分配
                let mut temp_vec = Vec::new();
                for l in 0..100 {
                    temp_vec.push(l * temp as i32);
                }
                
                // 不必要的排序
                temp_vec.sort();
                temp = temp_vec.iter().sum::<i32>() as u8;
            }
            
            result.push(temp);
        }
        
        // 第三阶段：后处理
        let mut final_result = Vec::new();
        for (i, &value) in result.iter().enumerate() {
            let processed = self.apply_complex_transformation(value, i)?;
            final_result.push(processed);
            
            // 更新缓存（可能导致内存增长）
            let cache_key = format!("processed_{}_{}", i, value);
            self.cache.insert(cache_key.clone(), CachedValue {
                value: processed.to_string(),
                timestamp: start.elapsed().as_millis() as u64,
                access_count: 1,
            });
        }
        
        // 第四阶段：验证和清理
        self.validate_results(&final_result)?;
        self.cleanup_old_cache();
        
        // 更新全局计数器（线程不安全）
        unsafe {
            COUNTER += 1;
        }
        
        Ok(final_result)
    }
    
    // 另一个复杂函数
    fn apply_complex_transformation(&self, value: u8, index: usize) -> Result<u8, String> {
        let mut result = value;
        
        // 复杂的条件逻辑
        if index % 2 == 0 {
            if value > 100 {
                if self.id % 2 == 0 {
                    result = result.wrapping_mul(2);
                    if result > 200 {
                        result = 255;
                    } else if result < 50 {
                        result = 0;
                    } else {
                        result = result.wrapping_add(10);
                    }
                } else {
                    result = result.wrapping_div(2);
                    if result == 0 {
                        result = 1;
                    }
                }
            } else {
                result = result.wrapping_add(index as u8);
            }
        } else {
            if value < 50 {
                result = result.wrapping_mul(3);
                if self.name.len() > 10 {
                    result = result.wrapping_add(self.name.len() as u8);
                }
            } else {
                result = result.wrapping_sub(index as u8);
                if result == 0 {
                    return Err("Result became zero".to_string());
                }
            }
        }
        
        // 不必要的字符串操作
        let debug_info = format!("Transformed {} at index {} to {}", value, index, result);
        println!("{}", debug_info); // 大量的控制台输出影响性能
        
        Ok(result)
    }
    
    fn validate_results(&self, results: &[u8]) -> Result<(), String> {
        if results.is_empty() {
            return Err("Empty results".to_string());
        }
        
        // 过度验证
        for (i, &value) in results.iter().enumerate() {
            if value == 0 && i % 10 == 0 {
                return Err(format!("Invalid zero value at index {}", i));
            }
        }
        
        Ok(())
    }
    
    fn cleanup_old_cache(&mut self) {
        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        // 性能问题：在每次调用时都进行完整清理
        let mut to_remove = Vec::new();
        for (key, cached_value) in &self.cache {
            if current_time - cached_value.timestamp > 60000 { // 1分钟
                to_remove.push(key.clone()); // 不必要的clone
            }
        }
        
        for key in to_remove {
            self.cache.remove(&key);
        }
    }
}

// 并发问题示例
pub struct ConcurrentProcessor {
    data: Arc<Mutex<Vec<LargeDataStructure>>>,
    results: Arc<RwLock<HashMap<u64, Vec<u8>>>>,
    worker_count: usize,
}

impl ConcurrentProcessor {
    pub fn new(worker_count: usize) -> Self {
        Self {
            data: Arc::new(Mutex::new(Vec::new())),
            results: Arc::new(RwLock::new(HashMap::new())),
            worker_count,
        }
    }
    
    // 潜在的死锁风险
    pub fn process_all(&self) -> Result<(), String> {
        let mut handles = Vec::new();
        
        for worker_id in 0..self.worker_count {
            let data = Arc::clone(&self.data);
            let results = Arc::clone(&self.results);
            
            let handle = thread::spawn(move || {
                // 长时间持有锁可能导致性能问题
                let mut data_guard = data.lock().unwrap();
                
                for item in data_guard.iter_mut() {
                    if item.id % worker_id as u64 == 0 {
                        // 模拟处理时间
                        thread::sleep(Duration::from_millis(10));
                        
                        let processed = item.process_data(&item.data.clone()).unwrap();
                        
                        // 在持有一个锁的情况下获取另一个锁（潜在死锁）
                        let mut results_guard = results.write().unwrap();
                        results_guard.insert(item.id, processed);
                        drop(results_guard);
                    }
                }
                
                drop(data_guard);
            });
            
            handles.push(handle);
        }
        
        // 等待所有线程完成
        for handle in handles {
            handle.join().map_err(|_| "Thread panicked")?;
        }
        
        Ok(())
    }
    
    // 不正确的共享状态访问
    pub fn get_stats(&self) -> (usize, usize) {
        let data_len = self.data.lock().unwrap().len();
        
        // 这里可能发生竞态条件
        thread::sleep(Duration::from_millis(1));
        
        let results_len = self.results.read().unwrap().len();
        
        (data_len, results_len)
    }
}

// 内存管理问题示例
pub struct MemoryIntensiveProcessor {
    buffers: Vec<Vec<u8>>,
    cache: HashMap<String, Box<[u8]>>,
}

impl MemoryIntensiveProcessor {
    pub fn new() -> Self {
        Self {
            buffers: Vec::new(),
            cache: HashMap::new(),
        }
    }
    
    // 内存分配问题
    pub fn process_large_dataset(&mut self, size: usize) -> Vec<u8> {
        // 过度内存分配
        for i in 0..size {
            let mut buffer = vec![0u8; 1024 * 1024]; // 1MB per iteration
            
            // 不必要的填充操作
            for j in 0..buffer.len() {
                buffer[j] = (i + j) as u8;
            }
            
            self.buffers.push(buffer);
            
            // 缓存也会持续增长
            let cache_key = format!("buffer_{}", i);
            let cache_data = vec![i as u8; 1024].into_boxed_slice();
            self.cache.insert(cache_key, cache_data);
        }
        
        // 返回最后一个buffer的副本
        self.buffers.last().unwrap().clone() // 大量内存复制
    }
    
    // 忘记清理资源
    pub fn cleanup(&mut self) {
        // 只清理buffers，忘记清理cache
        self.buffers.clear();
        // self.cache.clear(); // 忘记清理
    }
}

// 错误处理问题示例
pub fn risky_operations() -> Result<String, Box<dyn std::error::Error>> {
    // 过度使用unwrap()
    let data = std::fs::read_to_string("config.txt").unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&data).unwrap();
    
    let name = parsed["name"].as_str().unwrap();
    let age = parsed["age"].as_u64().unwrap();
    
    // 不安全的类型转换
    let age_i32 = age as i32;
    if age_i32 < 0 {
        panic!("Invalid age"); // 使用panic!而不是返回错误
    }
    
    Ok(format!("Name: {}, Age: {}", name, age_i32))
}

// 编译器优化机会示例
pub fn optimization_opportunities() {
    // 循环可以向量化
    let mut data = vec![0i32; 1000];
    for i in 0..data.len() {
        data[i] = i as i32 * 2;
    }
    
    // 分支预测问题
    let mut sum = 0;
    for &value in &data {
        if value % 2 == 0 { // 高度可预测的分支
            sum += value;
        } else {
            sum -= value;
        }
    }
    
    // 不必要的堆分配
    let temp_string = format!("Sum: {}", sum);
    println!("{}", temp_string);
    
    // 可以内联的简单函数调用
    for i in 0..100 {
        let result = simple_calculation(i);
        println!("Result: {}", result);
    }
}

fn simple_calculation(x: i32) -> i32 {
    x * 2 + 1
}

// 异步编程问题示例
pub async fn async_processing_issues() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let mut results = Vec::new();
    
    // 顺序执行异步操作（应该并发执行）
    for i in 0..10 {
        let result = expensive_async_operation(i).await?;
        results.push(result);
    }
    
    Ok(results)
}

async fn expensive_async_operation(id: i32) -> Result<String, Box<dyn std::error::Error>> {
    // 模拟网络请求
    tokio::time::sleep(Duration::from_millis(100)).await;
    Ok(format!("Result for {}", id))
}

// 更好的异步实现示例
pub async fn optimized_async_processing() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let mut tasks = Vec::new();
    
    // 并发执行异步操作
    for i in 0..10 {
        tasks.push(expensive_async_operation(i));
    }
    
    // 等待所有任务完成
    let results = futures::future::try_join_all(tasks).await?;
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_large_data_structure() {
        let mut data = LargeDataStructure::new(1, "test".to_string());
        let input = vec![1, 2, 3, 4, 5];
        let result = data.process_data(&input);
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_async_processing() {
        let result = async_processing_issues().await;
        assert!(result.is_ok());
    }
}
