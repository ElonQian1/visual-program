// Rust内存安全和性能深度分析演示文件
// 这个文件包含各种内存安全和性能问题，用于测试Rust内存安全性能分析器

use std::collections::HashMap;
use std::sync::{Arc, Mutex, Weak, RwLock};
use std::thread;
use std::rc::Rc;
use std::cell::RefCell;
use std::mem;
use std::ptr;

// 1. 内存安全问题演示

/// unsafe块使用
fn unsafe_memory_operations() {
    let mut data = vec![1, 2, 3, 4, 5];
    
    // 高风险：原始指针操作
    unsafe {
        let ptr = data.as_mut_ptr();
        *ptr.offset(10) = 42; // 可能导致缓冲区溢出
    }
    
    // 严重风险：transmute使用
    unsafe {
        let x: u32 = 42;
        let y: f32 = std::mem::transmute(x); // 危险的类型转换
        println!("Transmuted: {}", y);
    }
    
    // 中等风险：手动内存管理
    unsafe {
        let layout = std::alloc::Layout::new::<i32>();
        let ptr = std::alloc::alloc(layout) as *mut i32;
        *ptr = 42;
        std::alloc::dealloc(ptr as *mut u8, layout);
        // 潜在的double-free风险
    }
}

/// 原始指针使用
fn raw_pointer_usage() {
    let x = 42;
    let raw_ptr: *const i32 = &x;
    let mut_raw_ptr: *mut i32 = &x as *const i32 as *mut i32;
    
    unsafe {
        println!("Raw pointer value: {}", *raw_ptr);
        // *mut_raw_ptr = 100; // 未定义行为：修改不可变数据
    }
}

/// 可能的内存泄漏模式
fn potential_memory_leak() {
    // Rc循环引用导致内存泄漏
    let parent = Rc::new(RefCell::new(Node {
        parent: None,
        children: Vec::new(),
    }));
    
    let child = Rc::new(RefCell::new(Node {
        parent: Some(parent.clone()), // 这里应该使用Weak
        children: Vec::new(),
    }));
    
    parent.borrow_mut().children.push(child.clone());
    // 循环引用：parent -> child -> parent
}

struct Node {
    parent: Option<Rc<RefCell<Node>>>, // 应该使用Weak<RefCell<Node>>
    children: Vec<Rc<RefCell<Node>>>,
}

// 2. 性能瓶颈演示

/// 频繁的clone操作
fn excessive_cloning() {
    let large_vec = vec![0; 10000];
    let large_string = "very long string".repeat(1000);
    let large_hashmap: HashMap<String, Vec<i32>> = HashMap::new();
    
    // 高影响：大型数据结构的clone
    for i in 0..100 {
        let cloned_vec = large_vec.clone(); // 昂贵的内存复制
        let cloned_string = large_string.clone(); // 大字符串复制
        let cloned_map = large_hashmap.clone(); // HashMap复制
        
        process_data(cloned_vec, cloned_string, cloned_map);
    }
}

fn process_data(vec: Vec<i32>, string: String, map: HashMap<String, Vec<i32>>) {
    // 处理数据
}

/// 低效的字符串连接
fn inefficient_string_concatenation() {
    let mut result = String::new();
    
    // 高影响：字符串连接导致多次内存重新分配
    for i in 0..1000 {
        result.push_str(&format!("Item {}: {}\n", i, i * i));
    }
    
    // 更好的做法：预分配容量
    // let mut result = String::with_capacity(estimated_size);
}

/// 循环中的装箱开销
fn boxing_in_loop() {
    let mut boxed_items: Vec<Box<i32>> = Vec::new();
    
    // 中等影响：循环中频繁装箱
    for i in 0..10000 {
        let boxed = Box::new(i); // 每次都进行堆分配
        boxed_items.push(boxed);
    }
}

/// 低效的迭代器使用
fn inefficient_iterator_usage() {
    let data: Vec<i32> = (0..10000).collect();
    
    // 可优化：不必要的collect()
    let result: Vec<i32> = data
        .iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * 2)
        .collect(); // 创建中间集合
    
    // 然后立即迭代
    for item in result.iter() {
        println!("{}", item);
    }
    
    // 更好的做法：直接处理而不收集
    // data.iter()
    //     .filter(|&&x| x % 2 == 0)
    //     .map(|&x| x * 2)
    //     .for_each(|x| println!("{}", x));
}

// 3. 生命周期优化演示

/// 多个生命周期参数
fn multiple_lifetimes<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    // 如果两个参数总是有相同的生命周期，可以统一
    if x.len() > y.len() { x } else { x } // 总是返回第一个参数
}

/// 可以简化的生命周期
fn complex_lifetime_function<'a>(
    input: &'a str,
    _other: &'a str, // 如果不在返回值中使用，生命周期可能不必要
) -> &'a str {
    input
}

// 4. 借用检查器相关问题

/// 借用检查器问题
fn borrowing_issues() {
    let mut data = vec![1, 2, 3, 4, 5];
    
    // 借用检查器问题：同时存在可变和不可变借用
    let first = &data[0]; // 不可变借用
    // data.push(6); // 这会导致编译错误：可变借用与不可变借用同时存在
    
    println!("First element: {}", first);
    
    // 移动语义问题
    let owned_data = data;
    // println!("{:?}", data); // 编译错误：data已被移动
    println!("{:?}", owned_data);
}

/// 可变引用与不可变引用冲突
fn mutable_immutable_conflict() {
    let mut map = HashMap::new();
    map.insert("key1", 1);
    map.insert("key2", 2);
    
    // 问题：在循环中同时需要读取和修改
    for (key, value) in &map {
        if *value > 1 {
            // map.insert("new_key", *value); // 编译错误：不能在迭代时修改
        }
    }
}

// 5. 分配器优化演示

/// Vec预分配机会
fn vec_preallocation_opportunities() {
    // 问题：没有预分配容量
    let mut numbers = Vec::new();
    
    // 频繁push导致多次内存重新分配
    for i in 0..10000 {
        numbers.push(i);
        numbers.push(i * 2);
        numbers.push(i * 3);
    }
    
    // 更好的做法：
    // let mut numbers = Vec::with_capacity(30000);
}

/// String容量优化
fn string_capacity_optimization() {
    // 问题：没有预分配容量
    let mut result = String::new();
    
    // 多次字符串操作导致内存重新分配
    for i in 0..1000 {
        result.push_str("Hello ");
        result.push_str(&i.to_string());
        result.push_str(" World\n");
    }
    
    // 更好的做法：
    // let mut result = String::with_capacity(estimated_size);
}

/// HashMap容量优化
fn hashmap_capacity_optimization() {
    // 问题：没有预分配容量
    let mut cache = HashMap::new();
    
    // 大量插入导致多次重新散列
    for i in 0..10000 {
        cache.insert(format!("key_{}", i), i * i);
    }
    
    // 更好的做法：
    // let mut cache = HashMap::with_capacity(10000);
}

// 6. 算法复杂度问题

/// O(n²)算法复杂度
fn quadratic_complexity() {
    let data = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // O(n²)算法：嵌套循环
    for i in 0..data.len() {
        for j in 0..data.len() {
            if i != j && data[i] == data[j] {
                println!("Found duplicate: {}", data[i]);
            }
        }
    }
    
    // 更好的做法：使用HashSet，O(n)
    // let mut seen = HashSet::new();
    // for item in &data {
    //     if !seen.insert(item) {
    //         println!("Found duplicate: {}", item);
    //     }
    // }
}

/// 热路径函数优化
#[inline(never)] // 应该考虑内联
fn hot_path_function(x: i32, y: i32) -> i32 {
    x + y // 简单操作，应该内联
}

fn performance_critical_loop() {
    let mut sum = 0;
    for i in 0..1000000 {
        sum += hot_path_function(i, i + 1); // 频繁调用，应该内联
    }
    println!("Sum: {}", sum);
}

// 7. 错误处理安全问题

/// Panic风险
fn panic_risks() {
    let data = vec![1, 2, 3];
    
    // 高风险：可能panic
    let value = data[10]; // 索引越界
    let parsed: i32 = "not_a_number".parse().unwrap(); // 解析失败
    let division_result = 10 / 0; // 除零
    
    println!("{}, {}, {}", value, parsed, division_result);
}

/// 错误传播优化
fn error_propagation() -> Result<i32, Box<dyn std::error::Error>> {
    let file_content = std::fs::read_to_string("config.txt")?;
    let number: i32 = file_content.trim().parse()?;
    let result = number.checked_mul(2).ok_or("Integer overflow")?;
    Ok(result)
}

// 8. I/O操作优化

/// 同步I/O操作（应该异步化）
fn synchronous_io_operations() {
    // 阻塞操作：文件读取
    let content1 = std::fs::read_to_string("file1.txt").unwrap_or_default();
    let content2 = std::fs::read_to_string("file2.txt").unwrap_or_default(); 
    let content3 = std::fs::read_to_string("file3.txt").unwrap_or_default();
    
    // 网络请求（如果使用同步HTTP客户端）
    // let response1 = blocking_http_get("http://api1.com/data");
    // let response2 = blocking_http_get("http://api2.com/data");
    
    println!("Read {} bytes total", content1.len() + content2.len() + content3.len());
}

// 9. 并发优化机会

/// 可以并行化的计算
fn parallelizable_computation() {
    let data: Vec<i32> = (0..1000000).collect();
    
    // 串行处理
    let mut results = Vec::new();
    for chunk in data.chunks(1000) {
        let sum: i32 = chunk.iter().sum();
        results.push(sum);
    }
    
    // 可以使用rayon并行处理：
    // use rayon::prelude::*;
    // let results: Vec<i32> = data
    //     .par_chunks(1000)
    //     .map(|chunk| chunk.iter().sum())
    //     .collect();
}

/// 锁优化机会
fn lock_optimization_opportunities() {
    let shared_data = Arc::new(Mutex::new(HashMap::<String, i32>::new()));
    let mut handles = vec![];
    
    // 频繁锁争用
    for i in 0..10 {
        let data = shared_data.clone();
        let handle = thread::spawn(move || {
            for j in 0..1000 {
                let mut map = data.lock().unwrap();
                map.insert(format!("key_{}_{}", i, j), i * j);
                // 锁持有时间过长
                thread::sleep(std::time::Duration::from_millis(1));
            }
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    // 更好的做法：
    // 1. 使用RwLock进行读写分离
    // 2. 减少锁的粒度
    // 3. 使用无锁数据结构
}

// 主函数演示
fn main() {
    println!("Rust内存安全和性能分析演示");
    
    // 1. 内存安全问题
    println!("1. 内存安全问题演示");
    unsafe_memory_operations();
    raw_pointer_usage();
    potential_memory_leak();
    
    // 2. 性能瓶颈
    println!("2. 性能瓶颈演示");
    excessive_cloning();
    inefficient_string_concatenation();
    boxing_in_loop();
    inefficient_iterator_usage();
    
    // 3. 借用检查器问题
    println!("3. 借用检查器相关问题");
    borrowing_issues();
    mutable_immutable_conflict();
    
    // 4. 分配器优化
    println!("4. 分配器优化机会");
    vec_preallocation_opportunities();
    string_capacity_optimization();
    hashmap_capacity_optimization();
    
    // 5. 算法复杂度
    println!("5. 算法复杂度问题");
    quadratic_complexity();
    performance_critical_loop();
    
    // 6. 错误处理
    println!("6. 错误处理安全");
    // panic_risks(); // 注释掉避免panic
    match error_propagation() {
        Ok(value) => println!("Success: {}", value),
        Err(e) => println!("Error: {}", e),
    }
    
    // 7. I/O操作
    println!("7. I/O操作优化");
    synchronous_io_operations();
    
    // 8. 并发优化
    println!("8. 并发优化机会");
    parallelizable_computation();
    lock_optimization_opportunities();
    
    println!("演示完成！");
}
