// 微服务架构演示 - 用户服务
use actix_web::{web, App, HttpServer, Result, HttpResponse};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Pool, Postgres};
use tokio::sync::Mutex;
use std::sync::Arc;

#[derive(Serialize, Deserialize)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
}

// 微服务: 用户管理服务
pub struct UserService {
    db_pool: Arc<PgPool>,
    cache: Arc<Mutex<std::collections::HashMap<i32, User>>>,
}

impl UserService {
    pub fn new(db_pool: PgPool) -> Self {
        Self {
            db_pool: Arc::new(db_pool),
            cache: Arc::new(Mutex::new(std::collections::HashMap::new())),
        }
    }

    // 数据库查询: 获取用户
    pub async fn get_user(&self, id: i32) -> Result<Option<User>, sqlx::Error> {
        // 检查缓存
        {
            let cache = self.cache.lock().await;
            if let Some(user) = cache.get(&id) {
                return Ok(Some(user.clone()));
            }
        }

        // 数据库查询 - 可能的性能问题
        let user = sqlx::query_as!(
            User,
            "SELECT id, name, email FROM users WHERE id = $1",
            id
        )
        .fetch_optional(self.db_pool.as_ref())
        .await?;

        // 更新缓存
        if let Some(user) = &user {
            let mut cache = self.cache.lock().await;
            cache.insert(id, user.clone());
        }

        Ok(user)
    }

    // 并发优化: 批量获取用户 (解决N+1问题)
    pub async fn get_users_batch(&self, ids: Vec<i32>) -> Result<Vec<User>, sqlx::Error> {
        sqlx::query_as!(
            User,
            "SELECT id, name, email FROM users WHERE id = ANY($1)",
            &ids
        )
        .fetch_all(self.db_pool.as_ref())
        .await
    }
}

// API端点
async fn get_user_handler(
    path: web::Path<i32>,
    service: web::Data<UserService>,
) -> Result<HttpResponse> {
    match service.get_user(*path).await {
        Ok(Some(user)) => Ok(HttpResponse::Ok().json(user)),
        Ok(None) => Ok(HttpResponse::NotFound().json("User not found")),
        Err(_) => Ok(HttpResponse::InternalServerError().json("Database error")),
    }
}

// 线程池配置
async fn configure_thread_pool() -> tokio::runtime::Runtime {
    tokio::runtime::Builder::new_multi_thread()
        .worker_threads(8)
        .enable_all()
        .build()
        .expect("Failed to build runtime")
}

// 安全中间件
async fn auth_middleware(req: actix_web::HttpRequest) -> Result<HttpResponse> {
    if let Some(token) = req.headers().get("Authorization") {
        // JWT验证逻辑
        Ok(HttpResponse::Ok().finish())
    } else {
        Ok(HttpResponse::Unauthorized().json("Missing authorization"))
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 数据库连接池
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let user_service = UserService::new(pool);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(user_service.clone()))
            .route("/users/{id}", web::get().to(get_user_handler))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
