// 高级Rust生态系统演示文件
// 展示宏、生命周期、并发、性能和安全分析

use std::sync::{Arc, Mutex, mpsc};
use std::thread;
use std::collections::HashMap;
use tokio::sync::{oneshot, broadcast};
use criterion::{black_box, criterion_group, criterion_main, Criterion};

// 生命周期和宏演示
macro_rules! create_validator {
    ($name:ident, $type:ty) => {
        pub fn $name<'a>(data: &'a $type) -> &'a $type {
            if data.is_empty() {
                panic!("数据不能为空");
            }
            data
        }
    };
}

create_validator!(validate_string, String);
create_validator!(validate_vec, Vec<i32>);

// 派生宏演示
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct User<'a> {
    name: &'a str,
    age: u32,
    active: bool,
}

// 并发演示 - 通道
pub async fn channel_demo() -> Result<(), Box<dyn std::error::Error>> {
    // MPSC 通道
    let (tx, rx) = mpsc::channel::<String>();
    let (oneshot_tx, oneshot_rx) = oneshot::channel::<i32>();
    let (broadcast_tx, mut broadcast_rx) = broadcast::channel::<u64>(16);

    // 线程生成
    let handle1 = tokio::spawn(async move {
        tx.send("Hello from async task".to_string()).unwrap();
        oneshot_tx.send(42).unwrap();
    });

    let handle2 = thread::spawn(move || {
        broadcast_tx.send(123).unwrap();
    });

    // 并发等待
    tokio::try_join!(handle1)?;
    handle2.join().unwrap();

    Ok(())
}

// 互斥锁和原子操作演示
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

static COUNTER: AtomicU64 = AtomicU64::new(0);
static RUNNING: AtomicBool = AtomicBool::new(true);

pub fn mutex_demo() {
    let data = Arc::new(Mutex::new(HashMap::<String, i32>::new()));
    let mut handles = vec![];

    for i in 0..10 {
        let data_clone = Arc::clone(&data);
        let handle = thread::spawn(move || {
            let mut map = data_clone.lock().unwrap();
            map.insert(format!("key_{}", i), i);
            COUNTER.fetch_add(1, Ordering::SeqCst);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
    
    RUNNING.store(false, Ordering::SeqCst);
}

// 性能分析演示
pub fn performance_demo() {
    // 内存分配
    let boxed_data = Box::new(vec![1, 2, 3, 4, 5]);
    let mut dynamic_vec = Vec::new(); // 应该使用 Vec::with_capacity
    let mut map = HashMap::new(); // 应该使用 HashMap::with_capacity

    // 不必要的克隆
    let original = String::from("test");
    let cloned = original.clone(); // 可能不必要
    process_string(cloned);

    // 迭代器优化机会
    let numbers = vec![1, 2, 3, 4, 5];
    let _results: Vec<i32> = numbers
        .iter()
        .map(|x| x * 2)
        .map(|x| x + 1) // 可以合并map调用
        .filter(|&x| x > 5)
        .collect(); // 考虑避免collect

    // 更好的迭代器链
    let _optimized: Vec<i32> = numbers
        .iter()
        .filter_map(|&x| {
            let doubled = x * 2 + 1;
            if doubled > 5 { Some(doubled) } else { None }
        })
        .collect();
}

fn process_string(s: String) {
    println!("{}", s);
}

// 基准测试
fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        n => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("fib 20", |b| b.iter(|| fibonacci(black_box(20))));
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);

// 安全分析演示
pub unsafe fn unsafe_demo() {
    // 裸指针操作
    let mut x = 5;
    let raw_ptr = &mut x as *mut i32;
    let const_ptr = &x as *const i32;

    // SAFETY: 我们知道指针有效，因为它来自有效的引用
    unsafe {
        *raw_ptr = 10;
        let value = *const_ptr;
        println!("Value: {}", value);
    }

    // 内存操作
    let layout = std::alloc::Layout::new::<i32>();
    unsafe {
        let ptr = std::alloc::alloc(layout);
        if !ptr.is_null() {
            *(ptr as *mut i32) = 42;
            std::alloc::dealloc(ptr, layout);
        }
    }
}

// 不安全函数
/// # Safety
/// 调用者必须确保指针有效且对齐
pub unsafe fn unsafe_function(ptr: *mut i32) -> i32 {
    // 前置条件：ptr 必须指向有效的i32值
    *ptr
}

// FFI 演示
extern "C" {
    fn abs(input: i32) -> i32;
    fn strlen(s: *const i8) -> usize;
}

pub fn ffi_demo() {
    unsafe {
        let result = abs(-42);
        println!("Absolute value: {}", result);
    }
}

// 类型转换演示
pub fn transmute_demo() {
    let x: u32 = 42;
    unsafe {
        // SAFETY: u32 和 i32 有相同的大小和表示
        let y: i32 = std::mem::transmute(x);
        println!("Transmuted: {}", y);
    }
}

// 异步任务演示
pub async fn async_task_demo() {
    // 普通异步任务
    let task1 = tokio::spawn(async {
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        "任务1完成"
    });

    // 阻塞任务
    let task2 = tokio::task::spawn_blocking(|| {
        thread::sleep(std::time::Duration::from_millis(100));
        "阻塞任务完成"
    });

    // 选择等待
    tokio::select! {
        result1 = task1 => println!("{}", result1.unwrap()),
        result2 = task2 => println!("{}", result2.unwrap()),
    }
}

// 生命周期约束演示
pub fn lifetime_demo<'a, 'b: 'a>(long: &'b str, short: &'a str) -> &'a str {
    if long.len() > short.len() {
        short
    } else {
        short
    }
}

// 宏规则演示
macro_rules! hash_map {
    ($($key:expr => $value:expr),* $(,)?) => {
        {
            let mut map = HashMap::new();
            $(
                map.insert($key, $value);
            )*
            map
        }
    };
}

pub fn macro_usage_demo() {
    let config = hash_map! {
        "host" => "localhost",
        "port" => "8080",
        "debug" => "true",
    };
    
    println!("配置: {:?}", config);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User {
            name: "张三",
            age: 30,
            active: true,
        };
        assert_eq!(user.name, "张三");
    }

    #[tokio::test]
    async fn test_async_function() {
        let result = channel_demo().await;
        assert!(result.is_ok());
    }

    #[bench]
    fn bench_fibonacci(b: &mut test::Bencher) {
        b.iter(|| fibonacci(black_box(10)));
    }
}
