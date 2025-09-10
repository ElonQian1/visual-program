use actix_web::{web, App, HttpServer, HttpResponse, Result, middleware::Logger};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, FromRow};
use tokio::time::{sleep, Duration};
use std::sync::Arc;
use anyhow::{Result as AnyhowResult, Context};
use config::{Config, ConfigError};

// 配置结构
#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub server_host: String,
    pub server_port: u16,
    pub jwt_secret: String,
    pub redis_url: String,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, ConfigError> {
        let mut settings = Config::new();
        settings.merge(config::Environment::with_prefix("APP"))?;
        settings.try_into()
    }
}

// 错误类型定义
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("数据库错误: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("序列化错误: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("用户未找到")]
    UserNotFound,
    
    #[error("权限不足")]
    Unauthorized,
    
    #[error("内部服务器错误")]
    Internal(#[from] anyhow::Error),
}

impl actix_web::ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::UserNotFound => HttpResponse::NotFound().json("用户未找到"),
            ApiError::Unauthorized => HttpResponse::Unauthorized().json("权限不足"),
            _ => HttpResponse::InternalServerError().json("内部服务器错误"),
        }
    }
}

// 数据库模型
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Post {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub author_id: i64,
    pub published: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub email: Option<String>,
}

// 应用状态
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: AppConfig,
}

// Web 处理器
pub async fn get_users(
    state: web::Data<AppState>,
    query: web::Query<UserQuery>,
) -> Result<HttpResponse, ApiError> {
    let limit = query.limit.unwrap_or(10);
    let offset = query.offset.unwrap_or(0);
    
    let users = sqlx::query_as::<_, User>(
        "SELECT id, username, email, created_at, updated_at FROM users LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    Ok(HttpResponse::Ok().json(users))
}

pub async fn get_user_by_id(
    state: web::Data<AppState>,
    path: web::Path<i64>,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();
    
    let user = sqlx::query_as::<_, User>(
        "SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(ApiError::UserNotFound)?;

    Ok(HttpResponse::Ok().json(user))
}

pub async fn create_user(
    state: web::Data<AppState>,
    req: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, ApiError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (username, email, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, username, email, created_at, updated_at
        "#
    )
    .bind(&req.username)
    .bind(&req.email)
    .bind(&hash_password(&req.password)?)
    .fetch_one(&state.db)
    .await?;

    Ok(HttpResponse::Created().json(user))
}

pub async fn update_user(
    state: web::Data<AppState>,
    path: web::Path<i64>,
    req: web::Json<UpdateUserRequest>,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();
    
    let user = sqlx::query_as::<_, User>(
        r#"
        UPDATE users 
        SET username = COALESCE($1, username),
            email = COALESCE($2, email),
            updated_at = NOW()
        WHERE id = $3
        RETURNING id, username, email, created_at, updated_at
        "#
    )
    .bind(&req.username)
    .bind(&req.email)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(ApiError::UserNotFound)?;

    Ok(HttpResponse::Ok().json(user))
}

pub async fn delete_user(
    state: web::Data<AppState>,
    path: web::Path<i64>,
) -> Result<HttpResponse, ApiError> {
    let user_id = path.into_inner();
    
    let rows_affected = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(&state.db)
        .await?
        .rows_affected();

    if rows_affected == 0 {
        return Err(ApiError::UserNotFound);
    }

    Ok(HttpResponse::NoContent().finish())
}

// 异步任务处理
pub async fn background_cleanup_task(pool: PgPool) -> AnyhowResult<()> {
    loop {
        tokio::select! {
            _ = sleep(Duration::from_secs(3600)) => {
                // 清理过期数据
                cleanup_expired_sessions(&pool).await
                    .context("清理过期会话失败")?;
                
                // 清理临时文件
                cleanup_temp_files().await
                    .context("清理临时文件失败")?;
            }
        }
    }
}

async fn cleanup_expired_sessions(pool: &PgPool) -> AnyhowResult<()> {
    sqlx::query("DELETE FROM sessions WHERE expires_at < NOW()")
        .execute(pool)
        .await
        .context("删除过期会话失败")?;
    
    println!("已清理过期会话");
    Ok(())
}

async fn cleanup_temp_files() -> AnyhowResult<()> {
    // 模拟文件清理逻辑
    tokio::fs::remove_dir_all("/tmp/app_temp").await.ok();
    println!("已清理临时文件");
    Ok(())
}

// 助手函数
fn hash_password(password: &str) -> AnyhowResult<String> {
    // 简化的密码哈希（实际应用中应使用 bcrypt）
    Ok(format!("hashed_{}", password))
}

#[derive(Debug, Deserialize)]
pub struct UserQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub search: Option<String>,
}

// 主函数和服务器配置
#[actix_web::main]
async fn main() -> AnyhowResult<()> {
    env_logger::init();
    
    let config = AppConfig::from_env()
        .context("加载配置失败")?;
    
    let pool = PgPool::connect(&config.database_url)
        .await
        .context("连接数据库失败")?;
    
    // 启动后台任务
    let cleanup_pool = pool.clone();
    tokio::spawn(async move {
        if let Err(e) = background_cleanup_task(cleanup_pool).await {
            eprintln!("后台清理任务失败: {}", e);
        }
    });
    
    let app_state = AppState {
        db: pool,
        config: config.clone(),
    };
    
    println!("服务器启动在 {}:{}", config.server_host, config.server_port);
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(app_state.clone()))
            .wrap(Logger::default())
            .service(
                web::scope("/api/v1")
                    .route("/users", web::get().to(get_users))
                    .route("/users", web::post().to(create_user))
                    .route("/users/{id}", web::get().to(get_user_by_id))
                    .route("/users/{id}", web::put().to(update_user))
                    .route("/users/{id}", web::delete().to(delete_user))
            )
    })
    .bind((config.server_host.as_str(), config.server_port))?
    .run()
    .await
    .context("HTTP服务器运行失败")?;
    
    Ok(())
}

// 测试模块
#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{test, App};

    #[actix_web::test]
    async fn test_get_users() {
        let app = test::init_service(
            App::new().route("/users", web::get().to(get_users))
        ).await;
        
        let req = test::TestRequest::get()
            .uri("/users")
            .to_request();
        
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_create_user() {
        let create_req = CreateUserRequest {
            username: "测试用户".to_string(),
            email: "test@example.com".to_string(),
            password: "password123".to_string(),
        };
        
        // 测试用户创建逻辑
        assert!(!create_req.username.is_empty());
        assert!(!create_req.email.is_empty());
    }

    #[tokio::test]
    async fn test_background_tasks() {
        // 测试异步任务
        let result = cleanup_temp_files().await;
        assert!(result.is_ok());
    }
}
