import React, { useState, useEffect, useContext, useReducer, useMemo, useCallback } from 'react';
import { createContext } from 'react';

// Redux状态模式
interface AppState {
    user: { id: number; name: string; email: string } | null;
    theme: 'light' | 'dark';
    notifications: Notification[];
    loading: boolean;
}

type AppAction = 
    | { type: 'SET_USER'; payload: AppState['user'] }
    | { type: 'SET_THEME'; payload: AppState['theme'] }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'SET_LOADING'; payload: boolean };

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [...state.notifications, action.payload] };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
};

// Context模式
const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | null>(null);

// 父子组件通信模式
interface UserCardProps {
    user: AppState['user'];
    onEdit: (user: AppState['user']) => void;
    onDelete: (userId: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
    const handleEdit = useCallback(() => {
        if (user) {
            onEdit({ ...user, name: user.name + ' (edited)' });
        }
    }, [user, onEdit]);

    return (
        <div className="user-card">
            {user && (
                <>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <button onClick={handleEdit}>编辑</button>
                    <button onClick={() => onDelete(user.id)}>删除</button>
                </>
            )}
        </div>
    );
};

// 数据绑定模式
interface FormData {
    name: string;
    email: string;
    age: number;
}

const UserForm: React.FC<{ onSubmit: (data: FormData) => void }> = ({ onSubmit }) => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        age: 0
    });

    // 双向数据绑定
    const handleInputChange = (field: keyof FormData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = field === 'age' ? parseInt(e.target.value) : e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 计算属性
    const isValid = useMemo(() => {
        return formData.name.length > 0 && 
               formData.email.includes('@') && 
               formData.age > 0;
    }, [formData]);

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            if (isValid) {
                onSubmit(formData);
            }
        }}>
            <input
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="姓名"
            />
            <input
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="邮箱"
            />
            <input
                type="number"
                value={formData.age}
                onChange={handleInputChange('age')}
                placeholder="年龄"
            />
            <button type="submit" disabled={!isValid}>
                提交
            </button>
        </form>
    );
};

// 兄弟组件通信
const NotificationCenter: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('NotificationCenter must be used within AppContext');

    const { state, dispatch } = context;

    const addNotification = useCallback((message: string) => {
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
                id: Date.now(),
                message,
                timestamp: new Date()
            }
        });
    }, [dispatch]);

    return (
        <div className="notification-center">
            <button onClick={() => addNotification('新通知')}>
                添加通知
            </button>
            <div className="notifications">
                {state.notifications.map(notif => (
                    <div key={notif.id} className="notification">
                        {notif.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

// 主应用组件
const App: React.FC = () => {
    const [state, dispatch] = useReducer(appReducer, {
        user: null,
        theme: 'light',
        notifications: [],
        loading: false
    });

    // 性能优化 - 防抖
    const debouncedThemeChange = useCallback(
        debounce((theme: AppState['theme']) => {
            dispatch({ type: 'SET_THEME', payload: theme });
        }, 300),
        [dispatch]
    );

    // 副作用管理
    useEffect(() => {
        const loadUser = async () => {
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                const user = await fetchUser();
                dispatch({ type: 'SET_USER', payload: user });
            } catch (error) {
                console.error('Failed to load user:', error);
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        loadUser();
    }, []);

    const handleUserEdit = useCallback((user: AppState['user']) => {
        dispatch({ type: 'SET_USER', payload: user });
    }, [dispatch]);

    const handleUserDelete = useCallback((userId: number) => {
        dispatch({ type: 'SET_USER', payload: null });
    }, [dispatch]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            <div className={`app theme-${state.theme}`}>
                <header>
                    <button onClick={() => debouncedThemeChange(
                        state.theme === 'light' ? 'dark' : 'light'
                    )}>
                        切换主题
                    </button>
                </header>
                
                {state.loading ? (
                    <div>加载中...</div>
                ) : (
                    <>
                        <UserCard
                            user={state.user}
                            onEdit={handleUserEdit}
                            onDelete={handleUserDelete}
                        />
                        <UserForm onSubmit={(data) => {
                            dispatch({ 
                                type: 'SET_USER', 
                                payload: { 
                                    id: Date.now(), 
                                    name: data.name, 
                                    email: data.email 
                                } 
                            });
                        }} />
                        <NotificationCenter />
                    </>
                )}
            </div>
        </AppContext.Provider>
    );
};

// 工具函数
function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

async function fetchUser(): Promise<AppState['user']> {
    // 模拟API调用
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: 1,
                name: '张三',
                email: 'zhangsan@example.com'
            });
        }, 1000);
    });
}

interface Notification {
    id: number;
    message: string;
    timestamp: Date;
}

export default App;
