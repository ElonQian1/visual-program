use std::collections::HashMap;
use serde::{Deserialize, Serialize};

// 用户数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: u32,
    pub name: String,
    pub email: String,
    pub age: Option<u32>,
}

// 用户管理器
pub struct UserManager {
    users: HashMap<u32, User>,
    next_id: u32,
}

impl UserManager {
    // 创建新的用户管理器
    pub fn new() -> Self {
        Self {
            users: HashMap::new(),
            next_id: 1,
        }
    }

    // 添加用户
    pub fn add_user(&mut self, name: String, email: String, age: Option<u32>) -> Result<&User, String> {
        // 验证邮箱格式
        if !email.contains('@') {
            return Err("无效的邮箱地址".to_string());
        }

        // 检查邮箱是否已存在
        if self.users.values().any(|user| user.email == email) {
            return Err("邮箱地址已存在".to_string());
        }

        let user = User {
            id: self.next_id,
            name,
            email,
            age,
        };

        self.users.insert(self.next_id, user);
        let added_user = self.users.get(&self.next_id).unwrap();
        self.next_id += 1;

        Ok(added_user)
    }

    // 获取用户
    pub fn get_user(&self, id: u32) -> Option<&User> {
        self.users.get(&id)
    }

    // 获取所有用户
    pub fn get_all_users(&self) -> Vec<&User> {
        self.users.values().collect()
    }

    // 更新用户信息
    pub fn update_user(&mut self, id: u32, name: Option<String>, email: Option<String>, age: Option<u32>) -> Result<&User, String> {
        let user = self.users.get_mut(&id).ok_or("用户不存在")?;

        if let Some(new_name) = name {
            user.name = new_name;
        }

        if let Some(new_email) = email {
            // 验证邮箱格式
            if !new_email.contains('@') {
                return Err("无效的邮箱地址".to_string());
            }
            
            // 检查邮箱是否已被其他用户使用
            if self.users.values().any(|u| u.id != id && u.email == new_email) {
                return Err("邮箱地址已存在".to_string());
            }
            
            user.email = new_email;
        }

        if let Some(new_age) = age {
            user.age = Some(new_age);
        }

        Ok(self.users.get(&id).unwrap())
    }

    // 删除用户
    pub fn delete_user(&mut self, id: u32) -> Result<User, String> {
        self.users.remove(&id).ok_or("用户不存在".to_string())
    }

    // 按名称搜索用户
    pub fn search_users_by_name(&self, query: &str) -> Vec<&User> {
        self.users
            .values()
            .filter(|user| user.name.to_lowercase().contains(&query.to_lowercase()))
            .collect()
    }

    // 获取用户数量
    pub fn count(&self) -> usize {
        self.users.len()
    }

    // 清空所有用户
    pub fn clear(&mut self) {
        self.users.clear();
        self.next_id = 1;
    }
}

// 默认实现
impl Default for UserManager {
    fn default() -> Self {
        Self::new()
    }
}

// 用户统计信息
#[derive(Debug, Serialize)]
pub struct UserStats {
    pub total_users: usize,
    pub average_age: Option<f64>,
    pub oldest_user: Option<User>,
    pub youngest_user: Option<User>,
}

impl UserManager {
    // 获取用户统计信息
    pub fn get_stats(&self) -> UserStats {
        let users: Vec<&User> = self.users.values().collect();
        
        let total_users = users.len();
        
        let ages: Vec<u32> = users
            .iter()
            .filter_map(|user| user.age)
            .collect();
        
        let average_age = if ages.is_empty() {
            None
        } else {
            Some(ages.iter().sum::<u32>() as f64 / ages.len() as f64)
        };
        
        let oldest_user = users
            .iter()
            .filter(|user| user.age.is_some())
            .max_by_key(|user| user.age.unwrap())
            .map(|user| (*user).clone());
        
        let youngest_user = users
            .iter()
            .filter(|user| user.age.is_some())
            .min_by_key(|user| user.age.unwrap())
            .map(|user| (*user).clone());
        
        UserStats {
            total_users,
            average_age,
            oldest_user,
            youngest_user,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_user() {
        let mut manager = UserManager::new();
        let result = manager.add_user("张三".to_string(), "zhangsan@example.com".to_string(), Some(25));
        assert!(result.is_ok());
        assert_eq!(manager.count(), 1);
    }

    #[test]
    fn test_invalid_email() {
        let mut manager = UserManager::new();
        let result = manager.add_user("张三".to_string(), "invalid-email".to_string(), Some(25));
        assert!(result.is_err());
    }

    #[test]
    fn test_duplicate_email() {
        let mut manager = UserManager::new();
        manager.add_user("张三".to_string(), "test@example.com".to_string(), Some(25)).unwrap();
        let result = manager.add_user("李四".to_string(), "test@example.com".to_string(), Some(30));
        assert!(result.is_err());
    }
}
