use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::time::{sleep, Duration};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct UserService {
    users: Arc<Mutex<HashMap<u64, User>>>,
    cache: Arc<Mutex<HashMap<u64, (User, std::time::Instant)>>>,
}

impl UserService {
    pub fn new() -> Self {
        Self {
            users: Arc::new(Mutex::new(HashMap::new())),
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn create_user(&self, name: String, email: String) -> Result<User, String> {
        // 模拟数据库延迟
        sleep(Duration::from_millis(100)).await;

        let user = User {
            id: self.generate_id().await,
            name,
            email,
            created_at: chrono::Utc::now(),
        };

        // 存储到"数据库"
        {
            let mut users = self.users.lock().map_err(|_| "Lock error")?;
            users.insert(user.id, user.clone());
        }

        // 清理缓存
        self.invalidate_cache(user.id).await;

        Ok(user)
    }

    pub async fn get_user(&self, user_id: u64) -> Result<Option<User>, String> {
        // 先检查缓存
        if let Some(cached_user) = self.get_from_cache(user_id).await {
            return Ok(Some(cached_user));
        }

        // 模拟数据库查询延迟
        sleep(Duration::from_millis(50)).await;

        let users = self.users.lock().map_err(|_| "Lock error")?;
        let user = users.get(&user_id).cloned();

        // 更新缓存
        if let Some(ref user) = user {
            self.update_cache(user_id, user.clone()).await;
        }

        Ok(user)
    }

    pub async fn update_user(&self, user_id: u64, name: Option<String>, email: Option<String>) -> Result<User, String> {
        sleep(Duration::from_millis(75)).await;

        let mut users = self.users.lock().map_err(|_| "Lock error")?;
        
        if let Some(user) = users.get_mut(&user_id) {
            if let Some(new_name) = name {
                user.name = new_name;
            }
            if let Some(new_email) = email {
                user.email = new_email;
            }

            let updated_user = user.clone();
            drop(users); // 释放锁

            // 更新缓存
            self.update_cache(user_id, updated_user.clone()).await;

            Ok(updated_user)
        } else {
            Err("User not found".to_string())
        }
    }

    pub async fn delete_user(&self, user_id: u64) -> Result<bool, String> {
        sleep(Duration::from_millis(25)).await;

        let mut users = self.users.lock().map_err(|_| "Lock error")?;
        let existed = users.remove(&user_id).is_some();
        drop(users);

        // 清理缓存
        self.invalidate_cache(user_id).await;

        Ok(existed)
    }

    pub async fn list_users(&self, limit: Option<usize>) -> Result<Vec<User>, String> {
        sleep(Duration::from_millis(200)).await;

        let users = self.users.lock().map_err(|_| "Lock error")?;
        let mut user_list: Vec<User> = users.values().cloned().collect();
        
        // 按创建时间排序
        user_list.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        if let Some(limit) = limit {
            user_list.truncate(limit);
        }

        Ok(user_list)
    }

    // 私有辅助方法
    async fn generate_id(&self) -> u64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
    }

    async fn get_from_cache(&self, user_id: u64) -> Option<User> {
        let cache = self.cache.lock().ok()?;
        if let Some((user, timestamp)) = cache.get(&user_id) {
            // 缓存有效期5分钟
            if timestamp.elapsed() < Duration::from_secs(300) {
                return Some(user.clone());
            }
        }
        None
    }

    async fn update_cache(&self, user_id: u64, user: User) {
        if let Ok(mut cache) = self.cache.lock() {
            cache.insert(user_id, (user, std::time::Instant::now()));
        }
    }

    async fn invalidate_cache(&self, user_id: u64) {
        if let Ok(mut cache) = self.cache.lock() {
            cache.remove(&user_id);
        }
    }
}

// Web API handlers
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};

#[derive(Deserialize)]
pub struct CreateUserRequest {
    name: String,
    email: String,
}

#[derive(Deserialize)]
pub struct UpdateUserRequest {
    name: Option<String>,
    email: Option<String>,
}

#[derive(Deserialize)]
pub struct ListUsersQuery {
    limit: Option<usize>,
}

pub async fn create_user_handler(
    State(service): State<UserService>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    match service.create_user(payload.name, payload.email).await {
        Ok(user) => Ok(Json(user)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_user_handler(
    State(service): State<UserService>,
    Path(user_id): Path<u64>,
) -> Result<Json<User>, StatusCode> {
    match service.get_user(user_id).await {
        Ok(Some(user)) => Ok(Json(user)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn update_user_handler(
    State(service): State<UserService>,
    Path(user_id): Path<u64>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    match service.update_user(user_id, payload.name, payload.email).await {
        Ok(user) => Ok(Json(user)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn delete_user_handler(
    State(service): State<UserService>,
    Path(user_id): Path<u64>,
) -> Result<StatusCode, StatusCode> {
    match service.delete_user(user_id).await {
        Ok(true) => Ok(StatusCode::NO_CONTENT),
        Ok(false) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn list_users_handler(
    State(service): State<UserService>,
    Query(params): Query<ListUsersQuery>,
) -> Result<Json<Vec<User>>, StatusCode> {
    match service.list_users(params.limit).await {
        Ok(users) => Ok(Json(users)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub fn create_user_router() -> Router {
    let service = UserService::new();
    
    Router::new()
        .route("/users", get(list_users_handler))
        .route("/users", post(create_user_handler))
        .route("/users/:id", get(get_user_handler))
        .route("/users/:id", put(update_user_handler))
        .route("/users/:id", delete(delete_user_handler))
        .with_state(service)
}
