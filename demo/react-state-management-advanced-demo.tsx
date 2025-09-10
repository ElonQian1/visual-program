import React, { useState, useEffect, useCallback, useMemo, useContext, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { atom, useRecoilState } from 'recoil';
import { create } from 'zustand';

// Redux Store 示例
interface AppState {
    user: {
        id: string;
        name: string;
        preferences: UserPreferences;
    };
    theme: 'light' | 'dark';
    notifications: Notification[];
}

interface UserPreferences {
    language: string;
    timezone: string;
    notifications: boolean;
}

// Context API 示例
const ThemeContext = React.createContext<{
    theme: string;
    toggleTheme: () => void;
}>({
    theme: 'light',
    toggleTheme: () => {}
});

// Zustand Store 示例
interface CounterStore {
    count: number;
    increment: () => void;
    decrement: () => void;
    reset: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 })
}));

// Recoil Atom 示例
const todoListState = atom({
    key: 'todoListState',
    default: []
});

const filterState = atom({
    key: 'filterState',
    default: 'all'
});

// 自定义Hooks示例
function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue] as const;
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// 复杂状态管理组件
interface TodoState {
    todos: Todo[];
    filter: string;
    isLoading: boolean;
    error: string | null;
}

interface Todo {
    id: string;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
}

type TodoAction = 
    | { type: 'ADD_TODO'; payload: Omit<Todo, 'id'> }
    | { type: 'TOGGLE_TODO'; payload: string }
    | { type: 'DELETE_TODO'; payload: string }
    | { type: 'SET_FILTER'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
    switch (action.type) {
        case 'ADD_TODO':
            return {
                ...state,
                todos: [...state.todos, { ...action.payload, id: Date.now().toString() }]
            };
        case 'TOGGLE_TODO':
            return {
                ...state,
                todos: state.todos.map(todo => 
                    todo.id === action.payload 
                        ? { ...todo, completed: !todo.completed }
                        : todo
                )
            };
        case 'DELETE_TODO':
            return {
                ...state,
                todos: state.todos.filter(todo => todo.id !== action.payload)
            };
        case 'SET_FILTER':
            return { ...state, filter: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

// 主组件：展示多种状态管理模式
const AdvancedStateManagementDemo: React.FC = () => {
    // useState 钩子
    const [localState, setLocalState] = useState<string>('');
    const [items, setItems] = useState<string[]>([]);
    
    // useReducer 钩子
    const [todoState, dispatch] = useReducer(todoReducer, {
        todos: [],
        filter: 'all',
        isLoading: false,
        error: null
    });

    // Redux 状态
    const reduxUser = useSelector((state: AppState) => state.user);
    const reduxTheme = useSelector((state: AppState) => state.theme);
    const reduxDispatch = useDispatch();

    // Context API
    const themeContext = useContext(ThemeContext);

    // Zustand 状态
    const { count, increment, decrement, reset } = useCounterStore();

    // Recoil 状态
    const [todoList, setTodoList] = useRecoilState(todoListState);
    const [filter, setFilter] = useRecoilState(filterState);

    // 自定义Hooks
    const [savedData, setSavedData] = useLocalStorage('demo-data', '');
    const debouncedSearch = useDebounce(localState, 500);

    // 复杂的派生状态
    const filteredTodos = useMemo(() => {
        return todoState.todos.filter(todo => {
            switch (todoState.filter) {
                case 'completed':
                    return todo.completed;
                case 'active':
                    return !todo.completed;
                default:
                    return true;
            }
        });
    }, [todoState.todos, todoState.filter]);

    // 性能优化的回调
    const handleAddTodo = useCallback((text: string) => {
        if (text.trim()) {
            dispatch({
                type: 'ADD_TODO',
                payload: {
                    text: text.trim(),
                    completed: false,
                    priority: 'medium',
                    createdAt: new Date()
                }
            });
        }
    }, []);

    const handleToggleTodo = useCallback((id: string) => {
        dispatch({ type: 'TOGGLE_TODO', payload: id });
    }, []);

    // 副作用管理
    useEffect(() => {
        console.log('组件挂载，初始化数据');
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // 模拟异步数据加载
        const timer = setTimeout(() => {
            dispatch({ type: 'SET_LOADING', payload: false });
        }, 1000);

        return () => {
            console.log('清理定时器');
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (debouncedSearch) {
            console.log('执行搜索:', debouncedSearch);
            // 执行搜索逻辑
        }
    }, [debouncedSearch]);

    // 错误边界处理
    useEffect(() => {
        const handleError = (error: ErrorEvent) => {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        };

        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    // 复杂的状态同步逻辑
    useEffect(() => {
        if (todoState.todos.length > 0) {
            setSavedData(JSON.stringify(todoState.todos));
        }
    }, [todoState.todos, setSavedData]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        handleAddTodo(localState);
        setLocalState('');
    }, [localState, handleAddTodo]);

    if (todoState.isLoading) {
        return <div>加载中...</div>;
    }

    return (
        <div className="advanced-state-demo">
            <h1>高级状态管理演示</h1>
            
            {/* 本地状态管理 */}
            <section>
                <h2>本地状态 (useState)</h2>
                <form onSubmit={handleSubmit}>
                    <input 
                        value={localState}
                        onChange={(e) => setLocalState(e.target.value)}
                        placeholder="输入待办事项"
                    />
                    <button type="submit">添加</button>
                </form>
            </section>

            {/* useReducer 状态 */}
            <section>
                <h2>复杂状态 (useReducer)</h2>
                <div>
                    <button onClick={() => dispatch({ type: 'SET_FILTER', payload: 'all' })}>
                        全部 ({todoState.todos.length})
                    </button>
                    <button onClick={() => dispatch({ type: 'SET_FILTER', payload: 'active' })}>
                        未完成 ({todoState.todos.filter(t => !t.completed).length})
                    </button>
                    <button onClick={() => dispatch({ type: 'SET_FILTER', payload: 'completed' })}>
                        已完成 ({todoState.todos.filter(t => t.completed).length})
                    </button>
                </div>
                <ul>
                    {filteredTodos.map(todo => (
                        <li key={todo.id}>
                            <span 
                                style={{ 
                                    textDecoration: todo.completed ? 'line-through' : 'none',
                                    cursor: 'pointer' 
                                }}
                                onClick={() => handleToggleTodo(todo.id)}
                            >
                                {todo.text} ({todo.priority})
                            </span>
                            <button onClick={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}>
                                删除
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Zustand 状态 */}
            <section>
                <h2>Zustand 计数器</h2>
                <p>计数: {count}</p>
                <button onClick={increment}>+1</button>
                <button onClick={decrement}>-1</button>
                <button onClick={reset}>重置</button>
            </section>

            {/* Context 状态 */}
            <section>
                <h2>Context API</h2>
                <p>当前主题: {themeContext.theme}</p>
                <button onClick={themeContext.toggleTheme}>
                    切换主题
                </button>
            </section>

            {/* 自定义Hook状态 */}
            <section>
                <h2>自定义Hooks</h2>
                <p>本地存储数据: {savedData}</p>
                <p>防抖搜索: {debouncedSearch}</p>
            </section>

            {/* 错误显示 */}
            {todoState.error && (
                <div style={{ color: 'red' }}>
                    错误: {todoState.error}
                    <button onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}>
                        清除错误
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdvancedStateManagementDemo;
