use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use std::thread;
use std::time::Duration;
use std::fs::File;
use std::io::{Read, Write};

// 性能优化机会示例

// 1. 内存分配优化机会
fn inefficient_vector_usage() -> Vec<String> {
    // 问题：没有预分配容量
    let mut result = Vec::new();
    
    for i in 0..10000 {
        // 问题：频繁的字符串分配
        let item = format!("Item {}", i);
        result.push(item);
    }
    
    // 问题：不必要的克隆
    let cloned_result = result.clone();
    cloned_result
}

// 2. 计算优化机会
fn complex_computation(data: &[i32]) -> i32 {
    let mut result = 0;
    
    // 问题：嵌套循环，O(n²)复杂度
    for i in 0..data.len() {
        for j in 0..data.len() {
            if i != j {
                result += data[i] * data[j];
            }
        }
    }
    
    // 问题：重复计算
    let average = data.iter().sum::<i32>() / data.len() as i32;
    let variance = data.iter()
        .map(|x| (x - average).pow(2))
        .sum::<i32>() / data.len() as i32;
    
    result + variance
}

// 3. I/O操作优化机会
fn file_processing() -> Result<String, Box<dyn std::error::Error>> {
    // 问题：同步I/O操作
    let mut file = File::open("large_file.txt")?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    
    // 问题：多次文件写入
    for i in 0..100 {
        let mut output = File::create(format!("output_{}.txt", i))?;
        output.write_all(contents.as_bytes())?;
    }
    
    Ok(contents)
}

// 4. 并发优化机会
fn concurrent_processing(data: Vec<i32>) -> Vec<i32> {
    let mut results = Vec::new();
    
    // 问题：串行处理，可以并行化
    for chunk in data.chunks(100) {
        let processed: Vec<i32> = chunk.iter()
            .map(|x| expensive_computation(*x))
            .collect();
        results.extend(processed);
    }
    
    results
}

fn expensive_computation(x: i32) -> i32 {
    // 模拟昂贵的计算
    thread::sleep(Duration::from_millis(1));
    x * x + 42
}

// 5. 锁优化机会
struct SharedData {
    counter: Arc<Mutex<i32>>,
    data: Arc<RwLock<HashMap<String, i32>>>,
}

impl SharedData {
    fn new() -> Self {
        Self {
            counter: Arc::new(Mutex::new(0)),
            data: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    // 问题：锁竞争
    fn increment_counter(&self) {
        let mut counter = self.counter.lock().unwrap();
        *counter += 1;
        // 长时间持有锁
        thread::sleep(Duration::from_millis(10));
    }
    
    // 问题：频繁的锁获取
    fn process_data(&self, keys: &[String]) {
        for key in keys {
            let data = self.data.read().unwrap();
            if let Some(value) = data.get(key) {
                // 处理数据
                println!("Value: {}", value);
            }
            // 锁在每次迭代中都被释放和重新获取
        }
    }
}

// 6. 错误处理优化机会
fn risky_operations() {
    // 问题：使用unwrap()
    let data = vec![1, 2, 3, 4, 5];
    let first = data.get(0).unwrap();
    
    // 问题：使用expect()但错误信息不详细
    let last = data.get(100).expect("Failed to get element");
    
    // 问题：panic!
    if data.len() < 10 {
        panic!("Data too small");
    }
    
    // 问题：直接索引访问
    let middle = data[data.len() / 2];
    
    // 问题：unimplemented!
    let result = match data.len() {
        0 => 0,
        1 => data[0],
        _ => unimplemented!("Multiple elements not supported"),
    };
}

// 7. 生命周期和借用优化机会
fn lifetime_issues() {
    let mut data = vec![1, 2, 3, 4, 5];
    
    // 问题：不必要的可变借用
    let mut_ref = &mut data;
    println!("Length: {}", mut_ref.len());
    
    // 问题：过长的生命周期
    let long_lived_ref = &data[0];
    
    // 修改数据
    data.push(6);
    
    // 问题：Clone用于避免借用检查器
    let owned_data = data.clone();
    process_owned_data(owned_data);
}

fn process_owned_data(data: Vec<i32>) {
    // 处理数据
}

// 8. 模块架构问题
pub mod utilities {
    // 问题：模块内聚性低
    pub fn string_helper() {}
    pub fn math_helper() {}
    pub fn file_helper() {}
    pub fn network_helper() {}
}

// 问题：紧耦合
pub fn tightly_coupled_function() {
    utilities::string_helper();
    utilities::math_helper();
    utilities::file_helper();
}

// 9. Trait设计问题
trait GenericTrait {
    // 问题：trait过于泛化
    fn do_something(&self);
    fn do_something_else(&self);
    fn calculate(&self, x: i32) -> i32;
    fn format(&self) -> String;
}

// 10. 依赖问题（示例）
// 问题：使用重量级依赖进行简单操作
// extern crate serde_json; // 只用于简单的JSON解析
// extern crate tokio; // 只用于简单的异步操作

// 11. 编译优化机会
#[inline(never)] // 问题：不应该阻止内联的小函数
fn small_function(x: i32) -> i32 {
    x + 1
}

// 问题：未使用#[inline]的热路径函数
fn hot_path_function(data: &[i32]) -> i32 {
    data.iter().sum()
}

// 12. 算法效率问题
fn inefficient_search(haystack: &[String], needle: &str) -> Option<usize> {
    // 问题：线性搜索排序数组
    for (i, item) in haystack.iter().enumerate() {
        if item == needle {
            return Some(i);
        }
    }
    None
}

// 13. 字符串处理优化机会
fn string_processing(inputs: &[&str]) -> String {
    let mut result = String::new();
    
    // 问题：频繁的字符串连接
    for input in inputs {
        result = result + input + " ";
    }
    
    // 问题：不必要的分配
    let trimmed = result.trim().to_string();
    
    trimmed
}

// 14. 数据结构选择问题
fn data_structure_inefficiency() {
    // 问题：使用Vec进行频繁的中间插入
    let mut data = Vec::new();
    for i in 0..1000 {
        data.insert(0, i); // O(n)操作
    }
    
    // 问题：使用HashMap存储小量有序数据
    let mut small_map = HashMap::new();
    small_map.insert("a", 1);
    small_map.insert("b", 2);
    small_map.insert("c", 3);
}

// 15. 异步优化机会
async fn async_operations() {
    // 问题：串行异步操作
    let result1 = fetch_data("url1").await;
    let result2 = fetch_data("url2").await;
    let result3 = fetch_data("url3").await;
    
    // 这些可以并行执行
}

async fn fetch_data(url: &str) -> String {
    // 模拟网络请求延迟
    tokio::time::sleep(Duration::from_millis(100)).await;
    format!("Data from {}", url)
}

// 16. 内存使用模式问题
fn memory_patterns() {
    // 问题：创建大量临时对象
    let results: Vec<String> = (0..10000)
        .map(|i| {
            let temp = format!("temp_{}", i);
            let processed = temp.to_uppercase();
            processed
        })
        .collect();
    
    // 问题：保留大量数据在内存中
    let mut cache: HashMap<String, Vec<u8>> = HashMap::new();
    for i in 0..1000 {
        let key = format!("key_{}", i);
        let value = vec![0u8; 1024 * 1024]; // 1MB
        cache.insert(key, value);
    }
}

// 主函数
fn main() {
    println!("Running Rust deep optimization analysis demo...");
    
    // 各种优化机会的示例调用
    let _ = inefficient_vector_usage();
    let _ = complex_computation(&[1, 2, 3, 4, 5]);
    let _ = file_processing();
    let _ = concurrent_processing(vec![1, 2, 3, 4, 5]);
    
    let shared = SharedData::new();
    shared.increment_counter();
    
    risky_operations();
    lifetime_issues();
    tightly_coupled_function();
    
    let _ = inefficient_search(&["a".to_string(), "b".to_string()], "c");
    let _ = string_processing(&["hello", "world"]);
    
    data_structure_inefficiency();
    memory_patterns();
    
    println!("Demo completed. Check analysis results for optimization suggestions.");
}
