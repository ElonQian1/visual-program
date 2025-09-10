import React, { useState, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { createSlice } from '@reduxjs/toolkit';

// Context 示例
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

// Redux Store 示例
const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    loading: false
  },
  reducers: {
    setUser: (state, action) => {
      state.profile = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

// API 调用示例
const useUserAPI = () => {
  const fetchUser = async (id: string) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  };

  const updateUser = async (userData: any) => {
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  };

  return { fetchUser, updateUser };
};

// 表单组件示例
const UserProfileForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      age: 0
    }
  });

  const onSubmit = (data: any) => {
    console.log('提交表单数据:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        {...register('name', { required: '姓名必填' })}
        placeholder="姓名"
      />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input 
        {...register('email', { 
          required: '邮箱必填',
          pattern: {
            value: /^\S+@\S+$/i,
            message: '邮箱格式无效'
          }
        })}
        placeholder="邮箱"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit">保存</button>
    </form>
  );
};

// 路由组件示例
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const user = useSelector((state: any) => state.user.profile);
  
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => fetch(`/api/users/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id
  });

  return (
    <div className={`dashboard theme-${theme}`}>
      <h1>仪表板</h1>
      {isLoading ? <div>加载中...</div> : <div>欢迎, {userData?.name}</div>}
      <button onClick={() => navigate('/profile')}>编辑资料</button>
    </div>
  );
};

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { updateUser } = useUserAPI();
  
  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      dispatch(userSlice.actions.setUser(data));
    }
  });

  return (
    <div>
      <h1>用户资料</h1>
      <UserProfileForm />
    </div>
  );
};

// 主应用组件
const App: React.FC = () => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        <div className="app">
          <nav>
            <button onClick={toggleTheme}>切换主题</button>
          </nav>
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users/:id" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
};

export default App;
