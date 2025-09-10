import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { createStore, combineReducers } from 'redux';
import { Provider, useSelector, useDispatch } from 'react-redux';

// ===========================================
// 架构模式：高阶组件 (HOC)
// ===========================================
const withAuth = (WrappedComponent) => {
    return (props) => {
        const isAuthenticated = true; // 模拟认证状态
        
        if (!isAuthenticated) {
            return <Navigate to="/login" />;
        }
        
        return <WrappedComponent {...props} />;
    };
};

// ===========================================
// 架构模式：渲染属性 (Render Props)
// ===========================================
class DataProvider extends React.Component {
    state = {
        data: null,
        loading: true,
        error: null
    };

    async componentDidMount() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            this.setState({ data, loading: false });
        } catch (error) {
            this.setState({ error, loading: false });
        }
    }

    render() {
        return this.props.children(this.state);
    }
}

// ===========================================
// 架构模式：复合组件 (Compound Components)
// ===========================================
const Modal = ({ children, isOpen, onClose }) => {
    if (!isOpen) return null;
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

Modal.Header = ({ children }) => <div className="modal-header">{children}</div>;
Modal.Body = ({ children }) => <div className="modal-body">{children}</div>;
Modal.Footer = ({ children }) => <div className="modal-footer">{children}</div>;

// ===========================================
// 状态管理：Redux Store
// ===========================================
const userReducer = (state = { users: [], loading: false }, action) => {
    switch (action.type) {
        case 'FETCH_USERS_START':
            return { ...state, loading: true };
        case 'FETCH_USERS_SUCCESS':
            return { ...state, users: action.payload, loading: false };
        case 'ADD_USER':
            return { ...state, users: [...state.users, action.payload] };
        default:
            return state;
    }
};

const appReducer = combineReducers({
    user: userReducer
});

const store = createStore(appReducer);

// ===========================================
// 状态管理：Context API
// ===========================================
const ThemeContext = React.createContext();
const UserContext = React.createContext();

const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    
    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);
    
    const value = useMemo(() => ({
        theme,
        toggleTheme
    }), [theme, toggleTheme]);
    
    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// ===========================================
// 渲染优化：React.memo
// ===========================================
const UserCard = memo(({ user, onEdit, onDelete }) => {
    console.log('UserCard 渲染:', user.name);
    
    return (
        <div className="user-card">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <div className="user-actions">
                <button onClick={() => onEdit(user.id)}>编辑</button>
                <button onClick={() => onDelete(user.id)}>删除</button>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // 自定义比较函数
    return prevProps.user.id === nextProps.user.id && 
           prevProps.user.name === nextProps.user.name &&
           prevProps.user.email === nextProps.user.email;
});

// ===========================================
// 渲染优化：useMemo 和 useCallback
// ===========================================
const UserList = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');
    
    // 性能优化：使用 useMemo 缓存计算结果
    const filteredAndSortedUsers = useMemo(() => {
        console.log('重新计算用户列表');
        return users
            .filter(user => user.name.toLowerCase().includes(filter.toLowerCase()))
            .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
    }, [users, filter, sortBy]);
    
    // 性能优化：使用 useCallback 缓存函数
    const handleEdit = useCallback((userId) => {
        console.log('编辑用户:', userId);
        // 编辑逻辑
    }, []);
    
    const handleDelete = useCallback((userId) => {
        setUsers(prev => prev.filter(user => user.id !== userId));
    }, []);
    
    const handleAddUser = useCallback(() => {
        const newUser = {
            id: Date.now(),
            name: `用户${users.length + 1}`,
            email: `user${users.length + 1}@example.com`
        };
        setUsers(prev => [...prev, newUser]);
    }, [users.length]);
    
    return (
        <div className="user-list">
            <div className="controls">
                <input
                    type="text"
                    placeholder="搜索用户..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">按姓名排序</option>
                    <option value="email">按邮箱排序</option>
                </select>
                <button onClick={handleAddUser}>添加用户</button>
            </div>
            
            <div className="user-grid">
                {filteredAndSortedUsers.map(user => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
};

// ===========================================
// 代码分割：懒加载组件
// ===========================================
const Dashboard = lazy(() => import('./Dashboard'));
const Profile = lazy(() => import('./Profile'));
const Settings = lazy(() => import('./Settings'));

// 模拟懒加载组件
const LazyDashboard = () => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                default: () => (
                    <div>
                        <h2>仪表板</h2>
                        <p>这是一个懒加载的仪表板组件</p>
                    </div>
                )
            });
        }, 1000);
    });
};

const LazyProfile = () => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                default: () => (
                    <div>
                        <h2>用户资料</h2>
                        <p>这是一个懒加载的用户资料组件</p>
                    </div>
                )
            });
        }, 800);
    });
};

// ===========================================
// 组件层次结构：主应用
// ===========================================
const Navigation = memo(() => {
    return (
        <nav className="navigation">
            <Link to="/">首页</Link>
            <Link to="/users">用户管理</Link>
            <Link to="/dashboard">仪表板</Link>
            <Link to="/profile">个人资料</Link>
            <Link to="/settings">设置</Link>
        </nav>
    );
});

const ErrorBoundary = class extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary 捕获错误:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>出现了错误</h2>
                    <p>{this.state.error?.message}</p>
                    <button onClick={() => this.setState({ hasError: false, error: null })}>
                        重试
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
};

// ===========================================
// 性能监控：自定义Hook
// ===========================================
const usePerformanceMonitor = (componentName) => {
    useEffect(() => {
        const startTime = performance.now();
        
        return () => {
            const endTime = performance.now();
            console.log(`${componentName} 渲染时间: ${endTime - startTime}ms`);
        };
    });
};

// ===========================================
// 主应用组件
// ===========================================
const App = () => {
    usePerformanceMonitor('App');
    
    return (
        <Provider store={store}>
            <ThemeProvider>
                <Router>
                    <ErrorBoundary>
                        <div className="app">
                            <header className="app-header">
                                <h1>React 架构演示</h1>
                                <Navigation />
                            </header>
                            
                            <main className="app-main">
                                <Suspense fallback={<div>正在加载...</div>}>
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/users" element={<UserList />} />
                                        <Route path="/dashboard" element={<Dashboard />} />
                                        <Route path="/profile" element={<Profile />} />
                                        <Route path="/settings" element={<Settings />} />
                                    </Routes>
                                </Suspense>
                            </main>
                            
                            <footer className="app-footer">
                                <p>&copy; 2024 React 架构演示应用</p>
                            </footer>
                        </div>
                    </ErrorBoundary>
                </Router>
            </ThemeProvider>
        </Provider>
    );
};

// ===========================================
// 首页组件
// ===========================================
const Home = () => {
    const { theme, toggleTheme } = React.useContext(ThemeContext);
    const [modalOpen, setModalOpen] = useState(false);
    
    usePerformanceMonitor('Home');
    
    return (
        <div className={`home ${theme}`}>
            <h2>欢迎来到架构演示</h2>
            <p>这个应用展示了多种React架构模式和性能优化技术。</p>
            
            <div className="features">
                <div className="feature-card">
                    <h3>🏗️ 架构模式</h3>
                    <ul>
                        <li>高阶组件 (HOC)</li>
                        <li>渲染属性 (Render Props)</li>
                        <li>复合组件 (Compound Components)</li>
                        <li>提供者模式 (Provider Pattern)</li>
                    </ul>
                </div>
                
                <div className="feature-card">
                    <h3>🔄 状态管理</h3>
                    <ul>
                        <li>Redux 全局状态</li>
                        <li>Context API</li>
                        <li>本地组件状态</li>
                        <li>状态提升</li>
                    </ul>
                </div>
                
                <div className="feature-card">
                    <h3>⚡ 性能优化</h3>
                    <ul>
                        <li>React.memo</li>
                        <li>useMemo 和 useCallback</li>
                        <li>代码分割和懒加载</li>
                        <li>错误边界</li>
                    </ul>
                </div>
            </div>
            
            <div className="actions">
                <button onClick={toggleTheme}>
                    切换主题 (当前: {theme})
                </button>
                <button onClick={() => setModalOpen(true)}>
                    打开模态框
                </button>
            </div>
            
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <Modal.Header>
                    <h3>复合组件演示</h3>
                </Modal.Header>
                <Modal.Body>
                    <p>这是一个使用复合组件模式构建的模态框。</p>
                    <DataProvider>
                        {({ data, loading, error }) => {
                            if (loading) return <p>正在加载数据...</p>;
                            if (error) return <p>加载失败: {error.message}</p>;
                            return <p>数据已加载</p>;
                        }}
                    </DataProvider>
                </Modal.Body>
                <Modal.Footer>
                    <button onClick={() => setModalOpen(false)}>关闭</button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default App;
