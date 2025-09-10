// React Hook 高级演示 - 展示现代React Hook模式和最佳实践
import React, { 
    useState, 
    useEffect, 
    useContext, 
    useReducer, 
    useCallback, 
    useMemo, 
    useRef, 
    useLayoutEffect,
    useImperativeHandle,
    forwardRef,
    createContext,
    memo,
    lazy,
    Suspense
} from 'react';
import { createPortal } from 'react-dom';

// ================== 上下文和Provider模式 ==================

interface AppState {
    user: User | null;
    theme: 'light' | 'dark';
    loading: boolean;
    error: string | null;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
}

// 创建应用上下文
const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | null>(null);

// 定义Action类型
type AppAction = 
    | { type: 'SET_USER'; payload: User | null }
    | { type: 'SET_THEME'; payload: 'light' | 'dark' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET_STATE' };

// Reducer函数
const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload, error: null };
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'RESET_STATE':
            return {
                user: null,
                theme: 'light',
                loading: false,
                error: null
            };
        default:
            return state;
    }
};

// ================== 自定义Hook：应用状态管理 ==================

export const useAppState = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppState must be used within AppProvider');
    }
    return context;
};

// ================== 自定义Hook：API请求管理 ==================

interface UseApiOptions<T> {
    initialData?: T;
    immediate?: boolean;
    deps?: React.DependencyList;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
}

interface UseApiReturn<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    reset: () => void;
}

export const useApi = <T>(
    apiCall: () => Promise<T>,
    options: UseApiOptions<T> = {}
): UseApiReturn<T> => {
    const { initialData = null, immediate = true, deps = [], onSuccess, onError } = options;
    
    const [data, setData] = useState<T | null>(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    // 使用useRef跟踪最新的回调函数
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    
    useEffect(() => {
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
    });
    
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiCall();
            setData(result);
            onSuccessRef.current?.(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            onErrorRef.current?.(error);
        } finally {
            setLoading(false);
        }
    }, [apiCall]);
    
    const reset = useCallback(() => {
        setData(initialData);
        setError(null);
        setLoading(false);
    }, [initialData]);
    
    useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, [immediate, fetchData, ...deps]);
    
    return { data, loading, error, refetch: fetchData, reset };
};

// ================== 自定义Hook：本地存储 ==================

export const useLocalStorage = <T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
    // 从localStorage获取初始值
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });
    
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        try {
            // 支持函数式更新
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);
    
    return [storedValue, setValue];
};

// ================== 自定义Hook：防抖 ==================

export const useDebounce = <T>(value: T, delay: number): T => {
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
};

// ================== 自定义Hook：节流 ==================

export const useThrottle = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T => {
    const lastRun = useRef<number>(Date.now());
    
    return useCallback((...args: Parameters<T>) => {
        if (Date.now() - lastRun.current >= delay) {
            callback(...args);
            lastRun.current = Date.now();
        }
    }, [callback, delay]) as T;
};

// ================== 自定义Hook：窗口尺寸 ==================

interface WindowSize {
    width: number;
    height: number;
}

export const useWindowSize = (): WindowSize => {
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    return windowSize;
};

// ================== 自定义Hook：在线状态 ==================

export const useOnlineStatus = (): boolean => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    return isOnline;
};

// ================== 自定义Hook：表单管理 ==================

interface UseFormOptions<T> {
    initialValues: T;
    onSubmit: (values: T) => void | Promise<void>;
    validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormReturn<T> {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    touched: Partial<Record<keyof T, boolean>>;
    isSubmitting: boolean;
    handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBlur: (field: keyof T) => () => void;
    handleSubmit: (e: React.FormEvent) => void;
    setFieldValue: (field: keyof T, value: any) => void;
    setFieldError: (field: keyof T, error: string) => void;
    resetForm: () => void;
}

export const useForm = <T extends Record<string, any>>(
    options: UseFormOptions<T>
): UseFormReturn<T> => {
    const { initialValues, onSubmit, validate } = options;
    
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleChange = useCallback(
        (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            setValues(prev => ({ ...prev, [field]: value }));
            
            // 清除错误
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: undefined }));
            }
        },
        [errors]
    );
    
    const handleBlur = useCallback((field: keyof T) => () => {
        setTouched(prev => ({ ...prev, [field]: true }));
        
        // 验证单个字段
        if (validate) {
            const fieldErrors = validate(values);
            if (fieldErrors[field]) {
                setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
            }
        }
    }, [validate, values]);
    
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // 验证所有字段
        if (validate) {
            const formErrors = validate(values);
            setErrors(formErrors);
            
            if (Object.keys(formErrors).length > 0) {
                setIsSubmitting(false);
                return;
            }
        }
        
        try {
            await onSubmit(values);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [onSubmit, validate, values]);
    
    const setFieldValue = useCallback((field: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [field]: value }));
    }, []);
    
    const setFieldError = useCallback((field: keyof T, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);
    
    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);
    
    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        setFieldError,
        resetForm,
    };
};

// ================== 高级组件：带ref转发的输入组件 ==================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', ...props }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);
        
        // 使用useImperativeHandle自定义ref的方法
        useImperativeHandle(ref, () => ({
            ...inputRef.current!,
            focus: () => inputRef.current?.focus(),
            blur: () => inputRef.current?.blur(),
            select: () => inputRef.current?.select(),
        }));
        
        return (
            <div className={`input-group ${className}`}>
                {label && (
                    <label className="input-label">
                        {label}
                    </label>
                )}
                <input
                    ref={inputRef}
                    className={`input ${error ? 'input-error' : ''}`}
                    {...props}
                />
                {error && <span className="input-error-text">{error}</span>}
                {helperText && !error && (
                    <span className="input-helper-text">{helperText}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

// ================== 高级组件：模态框Portal ==================

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    
    // 使用useLayoutEffect处理焦点管理
    useLayoutEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            modalRef.current?.focus();
        } else {
            previousFocusRef.current?.focus();
        }
    }, [isOpen]);
    
    // 键盘事件处理
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;
    
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={modalRef}
                className="modal"
                onClick={e => e.stopPropagation()}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {title && (
                    <header className="modal-header">
                        <h2 id="modal-title">{title}</h2>
                        <button
                            className="modal-close"
                            onClick={onClose}
                            aria-label="关闭模态框"
                        >
                            ×
                        </button>
                    </header>
                )}
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

// ================== 高级组件：虚拟滚动列表 ==================

interface VirtualListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
}

export const VirtualList = <T,>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
}: VirtualListProps<T>) => {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    const visibleItems = useMemo(() => {
        return items.slice(startIndex, endIndex).map((item, index) => ({
            item,
            index: startIndex + index,
        }));
    }, [items, startIndex, endIndex]);
    
    const totalHeight = items.length * itemHeight;
    
    const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, 16); // 60fps
    
    return (
        <div
            ref={containerRef}
            className="virtual-list"
            style={{ height: containerHeight, overflow: 'auto' }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map(({ item, index }) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            top: index * itemHeight,
                            height: itemHeight,
                            width: '100%',
                        }}
                    >
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ================== 主应用提供器 ==================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, {
        user: null,
        theme: 'light',
        loading: false,
        error: null,
    });
    
    // 从localStorage恢复主题设置
    const [savedTheme] = useLocalStorage<'light' | 'dark'>('app-theme', 'light');
    
    useEffect(() => {
        dispatch({ type: 'SET_THEME', payload: savedTheme });
    }, [savedTheme]);
    
    // 主题切换效果
    useLayoutEffect(() => {
        document.documentElement.setAttribute('data-theme', state.theme);
    }, [state.theme]);
    
    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

// ================== 示例使用组件 ==================

const LazyComponent = lazy(() => import('./LazyComponent'));

export const ExampleApp: React.FC = () => {
    const { state, dispatch } = useAppState();
    const windowSize = useWindowSize();
    const isOnline = useOnlineStatus();
    const inputRef = useRef<HTMLInputElement>(null);
    
    // API调用示例
    const { data: users, loading: usersLoading, error: usersError, refetch } = useApi(
        async () => {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json();
        },
        {
            immediate: true,
            onSuccess: (users) => {
                console.log('Users loaded:', users);
            },
            onError: (error) => {
                dispatch({ type: 'SET_ERROR', payload: error.message });
            },
        }
    );
    
    // 表单管理示例
    const form = useForm({
        initialValues: {
            name: '',
            email: '',
            message: '',
        },
        onSubmit: async (values) => {
            console.log('Form submitted:', values);
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
        validate: (values) => {
            const errors: any = {};
            if (!values.name) errors.name = '姓名是必填项';
            if (!values.email) errors.email = '邮箱是必填项';
            else if (!/\S+@\S+\.\S+/.test(values.email)) {
                errors.email = '邮箱格式不正确';
            }
            return errors;
        },
    });
    
    // 防抖搜索
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    useEffect(() => {
        if (debouncedSearchTerm) {
            console.log('Searching for:', debouncedSearchTerm);
            // 执行搜索
        }
    }, [debouncedSearchTerm]);
    
    // 模态框状态
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // 焦点管理
    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);
    
    return (
        <div className="example-app">
            <header className="app-header">
                <h1>React Hook 高级演示</h1>
                <div className="app-status">
                    <span>窗口尺寸: {windowSize.width}x{windowSize.height}</span>
                    <span>在线状态: {isOnline ? '在线' : '离线'}</span>
                    <span>主题: {state.theme}</span>
                </div>
                <button
                    onClick={() => dispatch({ 
                        type: 'SET_THEME', 
                        payload: state.theme === 'light' ? 'dark' : 'light' 
                    })}
                >
                    切换主题
                </button>
            </header>
            
            <main className="app-main">
                {/* 搜索示例 */}
                <section className="search-section">
                    <Input
                        ref={inputRef}
                        label="搜索"
                        placeholder="输入搜索关键词..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={focusInput}>聚焦输入框</button>
                </section>
                
                {/* 表单示例 */}
                <section className="form-section">
                    <h2>联系表单</h2>
                    <form onSubmit={form.handleSubmit}>
                        <Input
                            label="姓名"
                            value={form.values.name}
                            onChange={form.handleChange('name')}
                            onBlur={form.handleBlur('name')}
                            error={form.touched.name ? form.errors.name : undefined}
                        />
                        <Input
                            label="邮箱"
                            type="email"
                            value={form.values.email}
                            onChange={form.handleChange('email')}
                            onBlur={form.handleBlur('email')}
                            error={form.touched.email ? form.errors.email : undefined}
                        />
                        <textarea
                            placeholder="留言内容"
                            value={form.values.message}
                            onChange={(e) => form.setFieldValue('message', e.target.value)}
                        />
                        <button type="submit" disabled={form.isSubmitting}>
                            {form.isSubmitting ? '提交中...' : '提交'}
                        </button>
                    </form>
                </section>
                
                {/* API数据展示 */}
                <section className="users-section">
                    <h2>用户列表</h2>
                    {usersLoading && <div>加载中...</div>}
                    {usersError && <div>错误: {usersError.message}</div>}
                    {users && (
                        <VirtualList
                            items={users}
                            itemHeight={50}
                            containerHeight={300}
                            renderItem={(user: any, index) => (
                                <div key={user.id} className="user-item">
                                    {user.name} - {user.email}
                                </div>
                            )}
                        />
                    )}
                    <button onClick={refetch}>刷新数据</button>
                </section>
                
                {/* 模态框示例 */}
                <section className="modal-section">
                    <button onClick={() => setIsModalOpen(true)}>
                        打开模态框
                    </button>
                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title="示例模态框"
                    >
                        <p>这是一个使用Portal和高级Hook的模态框示例。</p>
                        <button onClick={() => setIsModalOpen(false)}>
                            关闭
                        </button>
                    </Modal>
                </section>
                
                {/* 懒加载组件 */}
                <section className="lazy-section">
                    <h2>懒加载组件</h2>
                    <Suspense fallback={<div>加载组件中...</div>}>
                        <LazyComponent />
                    </Suspense>
                </section>
            </main>
        </div>
    );
};

// 应用根组件
export const App: React.FC = () => {
    return (
        <AppProvider>
            <ExampleApp />
        </AppProvider>
    );
};

export default App;
