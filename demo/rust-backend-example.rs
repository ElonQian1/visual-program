use actix_web::{web, App, HttpServer, HttpResponse, Result, middleware::Logger};
use diesel::prelude::*;
use redis::Client;
use serde::{Deserialize, Serialize};
use tokio;

// 用户模型
#[derive(Queryable, Serialize, Deserialize)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub password: String, // 安全问题：明文密码
}

// API路由处理器
#[actix_web::get("/users")]
async fn get_users() -> Result<HttpResponse> {
    // 性能问题：同步文件IO
    let data = std::fs::read_to_string("users.json")?;
    
    // 安全问题：SQL注入风险
    let query = format!("SELECT * FROM users WHERE active = {}", true);
    
    Ok(HttpResponse::Ok().json("users"))
}

#[actix_web::post("/users")]
async fn create_user(user_data: web::Json<User>) -> Result<HttpResponse> {
    // 性能问题：低效字符串拼接
    let mut response = String::new();
    response.push_str("Created user: ");
    response.push_str(&user_data.username);
    
    Ok(HttpResponse::Created().json(response))
}

// 数据库连接（缺少连接池）
fn establish_connection() -> PgConnection {
    let database_url = "postgresql://user:password@localhost/myapp"; // 安全问题：硬编码密钥
    PgConnection::establish(&database_url)
        .expect("Error connecting to database")
}

// 配置和健康检查
#[actix_web::get("/health")]
async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json("OK"))
}

// 主函数
#[tokio::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    
    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .service(get_users)
            .service(create_user)
            .service(health_check)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

// 微服务特性测试
mod config {
    use serde::Deserialize;
    
    #[derive(Deserialize)]
    pub struct Config {
        pub database_url: String,
        pub redis_url: String,
        pub jwt_secret: String,
    }
}

// 指标收集
use prometheus::{Counter, register_counter};

lazy_static::lazy_static! {
    static ref HTTP_REQUESTS: Counter = register_counter!(
        "http_requests_total", 
        "Total number of HTTP requests"
    ).unwrap();
}

// unsafe代码示例
unsafe fn dangerous_operation() {
    let raw_ptr = 0x12345678 as *const i32;
    let value = *raw_ptr; // 危险操作
}

// 异步处理示例
async fn process_async_task() {
    // 正确的异步文件操作
    let content = tokio::fs::read_to_string("config.toml").await.unwrap();
    println!("Config: {}", content);
}

// Redis缓存集成
async fn get_cached_data(key: &str) -> redis::RedisResult<String> {
    let client = redis::Client::open("redis://127.0.0.1/")?;
    let mut con = client.get_connection()?;
    redis::cmd("GET").arg(key).query(&mut con)
}
