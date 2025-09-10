import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 用户数据接口
interface User {
  id: number;
  name: string;
  email: string;
}

// 用户管理组件
export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<User[]>('/api/users');
      setUsers(response.data);
    } catch (err) {
      setError('获取用户列表失败');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // 创建新用户
  const createUser = async (userData: Omit<User, 'id'>) => {
    try {
      const response = await axios.post<User>('/api/users', userData);
      setUsers(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError('创建用户失败');
      throw err;
    }
  };

  // 更新用户信息
  const updateUser = async (id: number, userData: Partial<User>) => {
    try {
      const response = await axios.put<User>(`/api/users/${id}`, userData);
      setUsers(prev => prev.map(user => 
        user.id === id ? response.data : user
      ));
      return response.data;
    } catch (err) {
      setError('更新用户失败');
      throw err;
    }
  };

  // 删除用户
  const deleteUser = async (id: number) => {
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      setError('删除用户失败');
      throw err;
    }
  };

  // 组件挂载时获取用户列表
  useEffect(() => {
    fetchUsers();
  }, []);

  // 渲染加载状态
  if (loading) {
    return <div className="loading">正在加载用户列表...</div>;
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="error">
        <p>错误: {error}</p>
        <button onClick={fetchUsers}>重试</button>
      </div>
    );
  }

  // 渲染用户列表
  return (
    <div className="user-manager">
      <h2>用户管理</h2>
      
      <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-item">
            <h3>{user.name}</h3>
            <p>邮箱: {user.email}</p>
            <div className="actions">
              <button onClick={() => updateUser(user.id, { name: '新名称' })}>
                编辑
              </button>
              <button onClick={() => deleteUser(user.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="add-user" 
        onClick={() => createUser({ name: '新用户', email: 'new@example.com' })}
      >
        添加用户
      </button>
    </div>
  );
}
