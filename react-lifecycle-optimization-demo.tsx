// React生命周期优化演示文件
// 用于测试React生命周期优化分析器的功能

import React, { 
    useState, 
    useEffect, 
    useCallback, 
    useMemo, 
    useRef, 
    useContext, 
    useReducer,
    useLayoutEffect,
    useImperativeHandle,
    forwardRef,
    memo,
    Component,
    PureComponent
} from 'react';
import { createContext } from 'react';

// ===== 类组件示例 =====

// 传统类组件（需要迁移到Hooks）
class LegacyClassComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count: 0,
            data: null,
            loading: false
        };
        
        // 潜在问题：没有正确绑定this
        this.handleClick = this.handleClick.bind(this);
    }
    
    // 生命周期方法使用
    componentDidMount() {
        // 问题：没有清理的副作用
        this.timer = setInterval(() => {
            this.setState(prevState => ({ count: prevState.count + 1 }));
        }, 1000);
        
        // 问题：没有错误处理的网络请求
        fetch('/api/data')
            .then(response => response.json())
            .then(data => this.setState({ data, loading: false }))
            .catch(error => console.error(error));
            
        // 问题：直接DOM操作
        document.title = 'Legacy Component Mounted';
    }
    
    componentDidUpdate(prevProps, prevState) {
        // 问题：可能导致无限循环的状态更新
        if (this.props.autoUpdate && prevProps.autoUpdate !== this.props.autoUpdate) {
            this.setState({ count: this.state.count + 1 });
        }
        
        // 问题：没有依赖检查的副作用
        if (prevState.count !== this.state.count) {
            document.title = `Count: ${this.state.count}`;
        }
    }
    
    // 问题：没有实现componentWillUnmount清理
    
    handleClick() {
        // 问题：直接状态变更
        this.state.count += 1;
        this.forceUpdate();
    }
    
    render() {
        // 问题：在render中创建对象和函数
        const styles = {
            container: { padding: '20px' },
            button: { backgroundColor: this.state.count > 10 ? 'red' : 'blue' }
        };
        
        return (
            <div style={styles.container}>
                <h2>Legacy Class Component</h2>
                <p>Count: {this.state.count}</p>
                <button 
                    style={styles.button}
                    onClick={() => this.handleClick()} // 问题：每次渲染创建新函数
                >
                    Click me
                </button>
                {this.state.loading && <div>Loading...</div>}
                {this.state.data && <pre>{JSON.stringify(this.state.data, null, 2)}</pre>}
            </div>
        );
    }
}

// 优化后的PureComponent
class OptimizedPureComponent extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            count: 0,
            data: null,
            loading: true
        };
        
        // 正确绑定方法
        this.handleIncrement = this.handleIncrement.bind(this);
        this.handleDecrement = this.handleDecrement.bind(this);
    }
    
    componentDidMount() {
        this.mounted = true;
        this.loadData();
    }
    
    componentWillUnmount() {
        this.mounted = false;
        if (this.abortController) {
            this.abortController.abort();
        }
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    
    async loadData() {
        try {
            this.abortController = new AbortController();
            const response = await fetch('/api/data', {
                signal: this.abortController.signal
            });
            const data = await response.json();
            
            if (this.mounted) {
                this.setState({ data, loading: false });
            }
        } catch (error) {
            if (error.name !== 'AbortError' && this.mounted) {
                this.setState({ loading: false });
                console.error('Failed to load data:', error);
            }
        }
    }
    
    handleIncrement() {
        this.setState(prevState => ({ count: prevState.count + 1 }));
    }
    
    handleDecrement() {
        this.setState(prevState => ({ count: prevState.count - 1 }));
    }
    
    render() {
        const { count, data, loading } = this.state;
        
        return (
            <div className="optimized-component">
                <h2>Optimized Pure Component</h2>
                <div>Count: {count}</div>
                <button onClick={this.handleIncrement}>+</button>
                <button onClick={this.handleDecrement}>-</button>
                {loading ? (
                    <div>Loading...</div>
                ) : data ? (
                    <div>Data loaded: {data.message}</div>
                ) : (
                    <div>No data</div>
                )}
            </div>
        );
    }
}

// ===== 函数组件和Hooks示例 =====

// 创建Context
const ThemeContext = createContext('light');
const UserContext = createContext(null);

// 问题示例：没有优化的函数组件
function ProblematicFunctionComponent({ items, onItemClick }) {
    const [count, setCount] = useState(0);
    const [filter, setFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    
    // 问题：没有依赖数组的useEffect
    useEffect(() => {
        console.log('Component rendered');
    });
    
    // 问题：缺少依赖项的useEffect
    useEffect(() => {
        document.title = `Count: ${count}`;
    }, []); // 缺少count依赖
    
    // 问题：没有清理的useEffect
    useEffect(() => {
        const timer = setInterval(() => {
            setCount(prev => prev + 1);
        }, 1000);
        // 没有返回清理函数
    }, []);
    
    // 问题：每次渲染都创建新函数
    const handleItemClick = (item) => {
        onItemClick(item);
        setCount(count + 1); // 问题：闭包陷阱
    };
    
    // 问题：每次渲染都执行复杂计算
    const expensiveCalculation = () => {
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += i;
        }
        return result;
    };
    
    const calculatedValue = expensiveCalculation();
    
    // 问题：每次渲染都过滤和排序
    const filteredItems = items
        .filter(item => item.name.includes(filter))
        .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    
    return (
        <div>
            <h3>Problematic Component</h3>
            <p>Count: {count}</p>
            <p>Calculated Value: {calculatedValue}</p>
            <input 
                type="text" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter items..."
            />
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                Toggle Sort Order
            </button>
            <ul>
                {filteredItems.map(item => (
                    <li key={item.id} onClick={() => handleItemClick(item)}>
                        {item.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// 优化后的函数组件
const OptimizedFunctionComponent = memo(function OptimizedFunctionComponent({ 
    items, 
    onItemClick 
}) {
    const [count, setCount] = useState(0);
    const [filter, setFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const mountedRef = useRef(true);
    
    // 正确的useEffect使用
    useEffect(() => {
        document.title = `Count: ${count}`;
    }, [count]);
    
    // 带清理的useEffect
    useEffect(() => {
        const timer = setInterval(() => {
            if (mountedRef.current) {
                setCount(prev => prev + 1);
            }
        }, 1000);
        
        return () => {
            clearInterval(timer);
        };
    }, []);
    
    // 组件卸载时的清理
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);
    
    // 使用useCallback优化事件处理函数
    const handleItemClick = useCallback((item) => {
        onItemClick(item);
        setCount(prev => prev + 1);
    }, [onItemClick]);
    
    const handleFilterChange = useCallback((e) => {
        setFilter(e.target.value);
    }, []);
    
    const toggleSortOrder = useCallback(() => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    }, []);
    
    // 使用useMemo优化复杂计算
    const expensiveCalculation = useMemo(() => {
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += i;
        }
        return result;
    }, [count]); // 只在count变化时重新计算
    
    // 使用useMemo优化过滤和排序
    const filteredAndSortedItems = useMemo(() => {
        return items
            .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
            .sort((a, b) => {
                const comparison = a.name.localeCompare(b.name);
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [items, filter, sortOrder]);
    
    // 使用useMemo优化渲染列表
    const itemList = useMemo(() => {
        return filteredAndSortedItems.map(item => (
            <OptimizedListItem 
                key={item.id} 
                item={item} 
                onClick={handleItemClick}
            />
        ));
    }, [filteredAndSortedItems, handleItemClick]);
    
    return (
        <div>
            <h3>Optimized Component</h3>
            <p>Count: {count}</p>
            <p>Calculated Value: {expensiveCalculation}</p>
            <input 
                type="text" 
                value={filter} 
                onChange={handleFilterChange}
                placeholder="Filter items..."
            />
            <button onClick={toggleSortOrder}>
                Sort: {sortOrder.toUpperCase()}
            </button>
            <ul>
                {itemList}
            </ul>
        </div>
    );
});

// 优化的列表项组件
const OptimizedListItem = memo(function OptimizedListItem({ item, onClick }) {
    const handleClick = useCallback(() => {
        onClick(item);
    }, [item, onClick]);
    
    return (
        <li onClick={handleClick} className="list-item">
            {item.name}
        </li>
    );
});

// ===== 自定义Hooks示例 =====

// 问题示例：没有优化的自定义Hook
function useProblematicCounter(initialValue = 0) {
    const [count, setCount] = useState(initialValue);
    
    // 问题：没有清理的副作用
    useEffect(() => {
        const timer = setInterval(() => {
            setCount(count + 1); // 问题：闭包陷阱
        }, 1000);
    }, []);
    
    // 问题：每次调用都创建新函数
    const increment = () => setCount(count + 1);
    const decrement = () => setCount(count - 1);
    const reset = () => setCount(initialValue);
    
    return { count, increment, decrement, reset };
}

// 优化后的自定义Hook
function useOptimizedCounter(initialValue = 0, autoIncrement = false) {
    const [count, setCount] = useState(initialValue);
    const intervalRef = useRef(null);
    
    // 优化的自动递增
    useEffect(() => {
        if (autoIncrement) {
            intervalRef.current = setInterval(() => {
                setCount(prev => prev + 1);
            }, 1000);
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoIncrement]);
    
    // 使用useCallback优化函数
    const increment = useCallback(() => {
        setCount(prev => prev + 1);
    }, []);
    
    const decrement = useCallback(() => {
        setCount(prev => prev - 1);
    }, []);
    
    const reset = useCallback(() => {
        setCount(initialValue);
    }, [initialValue]);
    
    const setCustomValue = useCallback((value) => {
        setCount(typeof value === 'function' ? value : () => value);
    }, []);
    
    return { 
        count, 
        increment, 
        decrement, 
        reset, 
        setCustomValue,
        isAutoIncrementing: autoIncrement && intervalRef.current !== null
    };
}

// 复杂状态管理的自定义Hook
function useComplexState(initialState) {
    const [state, dispatch] = useReducer((prevState, action) => {
        switch (action.type) {
            case 'SET_FIELD':
                return { ...prevState, [action.field]: action.value };
            case 'RESET':
                return initialState;
            case 'MERGE':
                return { ...prevState, ...action.payload };
            default:
                return prevState;
        }
    }, initialState);
    
    const setField = useCallback((field, value) => {
        dispatch({ type: 'SET_FIELD', field, value });
    }, []);
    
    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);
    
    const merge = useCallback((payload) => {
        dispatch({ type: 'MERGE', payload });
    }, []);
    
    return { state, setField, reset, merge };
}

// ===== 高级Hooks使用示例 =====

// 使用useLayoutEffect进行DOM测量
function useElementSize() {
    const [size, setSize] = useState({ width: 0, height: 0 });
    const elementRef = useRef(null);
    
    useLayoutEffect(() => {
        const updateSize = () => {
            if (elementRef.current) {
                const { offsetWidth, offsetHeight } = elementRef.current;
                setSize({ width: offsetWidth, height: offsetHeight });
            }
        };
        
        updateSize();
        
        const resizeObserver = new ResizeObserver(updateSize);
        if (elementRef.current) {
            resizeObserver.observe(elementRef.current);
        }
        
        return () => {
            resizeObserver.disconnect();
        };
    }, []);
    
    return [elementRef, size];
}

// 使用useImperativeHandle的forwarded ref组件
const CustomInput = forwardRef(function CustomInput(props, ref) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);
    
    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        },
        getValue: () => value,
        setValue: (newValue) => setValue(newValue),
        clear: () => setValue('')
    }), [value]);
    
    const handleChange = useCallback((e) => {
        setValue(e.target.value);
        props.onChange?.(e.target.value);
    }, [props.onChange]);
    
    return (
        <input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            {...props}
        />
    );
});

// ===== 主应用组件 =====

function App() {
    const theme = useContext(ThemeContext);
    const [items] = useState([
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Cherry' },
        { id: 4, name: 'Date' },
        { id: 5, name: 'Elderberry' }
    ]);
    
    const { count, increment, decrement } = useOptimizedCounter(0, true);
    const [elementRef, size] = useElementSize();
    const customInputRef = useRef(null);
    
    const handleItemClick = useCallback((item) => {
        console.log('Item clicked:', item);
        customInputRef.current?.setValue(item.name);
    }, []);
    
    const handleInputFocus = useCallback(() => {
        customInputRef.current?.focus();
    }, []);
    
    return (
        <div ref={elementRef} className={`app theme-${theme}`}>
            <h1>React Lifecycle Optimization Demo</h1>
            <p>Element size: {size.width} x {size.height}</p>
            
            <div className="counter-section">
                <h2>Counter: {count}</h2>
                <button onClick={increment}>+</button>
                <button onClick={decrement}>-</button>
            </div>
            
            <div className="input-section">
                <CustomInput 
                    ref={customInputRef}
                    placeholder="Custom input"
                    onChange={(value) => console.log('Input changed:', value)}
                />
                <button onClick={handleInputFocus}>Focus Input</button>
            </div>
            
            <div className="components-section">
                <ProblematicFunctionComponent 
                    items={items} 
                    onItemClick={handleItemClick}
                />
                
                <OptimizedFunctionComponent 
                    items={items} 
                    onItemClick={handleItemClick}
                />
                
                <LegacyClassComponent autoUpdate={count > 5} />
                <OptimizedPureComponent />
            </div>
        </div>
    );
}

// Provider包装器
function AppWithProviders() {
    return (
        <ThemeContext.Provider value="dark">
            <UserContext.Provider value={{ name: 'John Doe', role: 'admin' }}>
                <App />
            </UserContext.Provider>
        </ThemeContext.Provider>
    );
}

export default AppWithProviders;

// ===== 错误边界示例 =====

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // 这里可以发送错误报告到监控服务
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong.</h2>
                    <p>{this.state.error?.message}</p>
                    <button onClick={() => this.setState({ hasError: false, error: null })}>
                        Try again
                    </button>
                </div>
            );
        }
        
        return this.props.children;
    }
}

// 导出带错误边界的应用
export function SafeApp() {
    return (
        <ErrorBoundary>
            <AppWithProviders />
        </ErrorBoundary>
    );
}
