// 🦀 演示Rust代码分析功能
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: u32,
    pub username: String,
    pub email: String,
    pub created_at: u64,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserRepository {
    users: HashMap<u32, User>,
    next_id: u32,
}

impl UserRepository {
    pub fn new() -> Self {
        Self {
            users: HashMap::new(),
            next_id: 1,
        }
    }
    
    // 这个函数有一些代码坏味道，用于测试AI分析
    pub fn create_user(&mut self, username: String, email: String) -> Result<User, String> {
        // 魔术数字 - AI应该检测到
        if username.len() < 3 {
            return Err("Username too short".to_string());
        }
        
        // 深度嵌套 - AI应该建议重构
        if !email.contains('@') {
            if !email.contains('.') {
                return Err("Invalid email format".to_string());
            } else {
                if email.len() < 5 {
                    return Err("Email too short".to_string());
                } else {
                    if email.starts_with('@') || email.ends_with('@') {
                        return Err("Invalid email format".to_string());
                    } else {
                        // 继续处理...
                    }
                }
            }
        }
        
        // 检查重复用户名 - 这里有性能问题，应该用索引
        for (_, user) in &self.users {
            if user.username == username {
                return Err("Username already exists".to_string());
            }
        }
        
        // 检查重复邮箱 - 又一个性能问题
        for (_, user) in &self.users {
            if user.email == email {
                return Err("Email already exists".to_string());
            }
        }
        
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap() // 使用unwrap() - AI应该建议避免
            .as_secs();
        
        let user = User {
            id: self.next_id,
            username: username.clone(), // 不必要的clone - AI应该检测到
            email: email.clone(), // 不必要的clone
            created_at: current_time,
            is_active: true,
        };
        
        self.users.insert(self.next_id, user.clone()); // 又一个不必要的clone
        self.next_id += 1;
        
        Ok(user)
    }
    
    // 这个函数过长，应该拆分
    pub fn update_user(&mut self, id: u32, username: Option<String>, email: Option<String>) -> Result<User, String> {
        match self.users.get_mut(&id) {
            Some(user) => {
                if let Some(new_username) = username {
                    // 重复的验证逻辑 - AI应该检测到重复
                    if new_username.len() < 3 {
                        return Err("Username too short".to_string());
                    }
                    
                    // 重复的唯一性检查
                    for (existing_id, existing_user) in &self.users {
                        if *existing_id != id && existing_user.username == new_username {
                            return Err("Username already exists".to_string());
                        }
                    }
                    
                    user.username = new_username;
                }
                
                if let Some(new_email) = email {
                    // 重复的邮箱验证逻辑
                    if !new_email.contains('@') {
                        return Err("Invalid email format".to_string());
                    }
                    
                    // 重复的唯一性检查
                    for (existing_id, existing_user) in &self.users {
                        if *existing_id != id && existing_user.email == new_email {
                            return Err("Email already exists".to_string());
                        }
                    }
                    
                    user.email = new_email;
                }
                
                Ok(user.clone()) // 不必要的clone
            }
            None => Err("User not found".to_string()),
        }
    }
    
    pub fn get_user(&self, id: u32) -> Option<&User> {
        self.users.get(&id)
    }
    
    pub fn delete_user(&mut self, id: u32) -> Result<(), String> {
        match self.users.remove(&id) {
            Some(_) => Ok(()),
            None => Err("User not found".to_string()),
        }
    }
    
    pub fn list_users(&self) -> Vec<&User> {
        self.users.values().collect()
    }
    
    // 这个函数有复杂的逻辑，应该简化
    pub fn search_users(&self, query: &str) -> Vec<&User> {
        let mut results = Vec::new();
        let query_lower = query.to_lowercase();
        
        for (_, user) in &self.users {
            // 复杂的搜索逻辑
            if user.username.to_lowercase().contains(&query_lower) {
                if !results.iter().any(|u| u.id == user.id) {
                    results.push(user);
                }
            } else if user.email.to_lowercase().contains(&query_lower) {
                if !results.iter().any(|u| u.id == user.id) {
                    results.push(user);
                }
            } else {
                // 模糊匹配逻辑
                let username_words: Vec<&str> = user.username.split_whitespace().collect();
                for word in username_words {
                    if word.to_lowercase().starts_with(&query_lower) {
                        if !results.iter().any(|u| u.id == user.id) {
                            results.push(user);
                            break;
                        }
                    }
                }
            }
        }
        
        results
    }
}

// 一些辅助函数，也有改进空间
pub fn validate_email(email: &str) -> bool {
    // 简单的邮箱验证，可以改进
    email.contains('@') && email.contains('.') && email.len() > 5
}

pub fn validate_username(username: &str) -> bool {
    // 简单的用户名验证
    username.len() >= 3 && username.len() <= 20
}

// 这个函数名不够描述性
pub fn do_stuff(data: &str) -> String {
    // 魔术数字
    if data.len() > 100 {
        data[..100].to_string()
    } else {
        data.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_user() {
        let mut repo = UserRepository::new();
        let result = repo.create_user("testuser".to_string(), "test@example.com".to_string());
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_duplicate_username() {
        let mut repo = UserRepository::new();
        repo.create_user("testuser".to_string(), "test1@example.com".to_string()).unwrap();
        let result = repo.create_user("testuser".to_string(), "test2@example.com".to_string());
        assert!(result.is_err());
    }
    
    // 可以添加更多测试...
}
