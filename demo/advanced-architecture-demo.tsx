/**
 * React高级架构分析演示文件
 * 包含各种架构模式、性能问题和最佳实践案例
 */

import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { createContext, useContext, useReducer } from 'react';

// ====== 架构模式演示 ======

// 1. 复合组件模式
interface TabsContextType {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

const Tabs = ({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className="tabs">{children}</div>
        </TabsContext.Provider>
    );
};

const TabList = ({ children }: { children: React.ReactNode }) => (
    <div className="tab-list">{children}</div>
);

const Tab = ({ value, children }: { value: string; children: React.ReactNode }) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error('Tab must be used within Tabs');
    
    return (
        <button
            className={`tab ${context.activeTab === value ? 'active' : ''}`}
            onClick={() => context.setActiveTab(value)}
        >
            {children}
        </button>
    );
};

// 2. 高阶组件模式
const withLoading = <P extends object>(Component: React.ComponentType<P>) => {
    return (props: P & { isLoading?: boolean }) => {
        if (props.isLoading) {
            return <div>Loading...</div>;
        }
        return <Component {...props} />;
    };
};

// 3. 渲染属性模式
interface MouseTrackerProps {
    children: (position: { x: number; y: number }) => React.ReactNode;
}

const MouseTracker: React.FC<MouseTrackerProps> = ({ children }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);
    
    return <>{children(position)}</>;
};

// ====== 性能问题演示 ======

// 问题1：缺少memo优化的重渲染问题
const ExpensiveComponent = ({ data }: { data: any[] }) => {
    // 昂贵的计算，但没有使用useMemo
    const processedData = data.map(item => {
        // 模拟复杂计算
        let result = 0;
        for (let i = 0; i < 1000; i++) {
            result += item.value * Math.random();
        }
        return { ...item, processed: result };
    });
    
    return (
        <div>
            {processedData.map(item => (
                <div key={item.id}>{item.processed}</div>
            ))}
        </div>
    );
};

// 问题2：内联对象导致的重渲染
const ProblematicParent = () => {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <ExpensiveComponent data={[{ id: 1, value: 10 }]} /> {/* 内联对象 */}
            <button onClick={() => setCount(count + 1)}>Count: {count}</button>
        </div>
    );
};

// ====== 最佳实践违规演示 ======

// 违规1：在渲染中直接调用函数
const BadPracticeComponent = () => {
    const [items, setItems] = useState<string[]>([]);
    
    // 应该使用useCallback
    const handleAddItem = () => {
        setItems([...items, `Item ${items.length + 1}`]);
    };
    
    return (
        <div>
            {items.map((item, index) => (
                // 违规：使用索引作为key
                <div key={index}>{item}</div>
            ))}
            <button onClick={handleAddItem}>Add Item</button>
        </div>
    );
};

// 违规2：副作用直接在渲染中执行
const AnotherBadComponent = ({ userId }: { userId: string }) => {
    const [userData, setUserData] = useState(null);
    
    // 违规：应该在useEffect中执行
    if (userId && !userData) {
        fetch(`/api/users/${userId}`)
            .then(res => res.json())
            .then(setUserData);
    }
    
    return <div>{userData ? 'User loaded' : 'Loading...'}</div>;
};

// ====== 优化示例 ======

// 优化后的组件
const OptimizedExpensiveComponent = memo(({ data }: { data: any[] }) => {
    const processedData = useMemo(() => {
        return data.map(item => {
            let result = 0;
            for (let i = 0; i < 1000; i++) {
                result += item.value * Math.random();
            }
            return { ...item, processed: result };
        });
    }, [data]);
    
    return (
        <div>
            {processedData.map(item => (
                <div key={item.id}>{item.processed}</div>
            ))}
        </div>
    );
});

// 优化后的父组件
const OptimizedParent = () => {
    const [count, setCount] = useState(0);
    
    // 使用useMemo防止重新创建对象
    const data = useMemo(() => [{ id: 1, value: 10 }], []);
    
    return (
        <div>
            <OptimizedExpensiveComponent data={data} />
            <button onClick={() => setCount(count + 1)}>Count: {count}</button>
        </div>
    );
};

// ====== 状态管理模式 ======

// 使用useReducer的复杂状态管理
interface AppState {
    user: { id: string; name: string } | null;
    posts: any[];
    loading: boolean;
    error: string | null;
}

type AppAction = 
    | { type: 'SET_USER'; payload: AppState['user'] }
    | { type: 'SET_POSTS'; payload: any[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string };

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'SET_POSTS':
            return { ...state, posts: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

// ====== 代码分割演示 ======

// 懒加载组件
const LazyComponent = lazy(() => import('./LazyLoadedComponent'));

const AppWithCodeSplitting = () => {
    return (
        <div>
            <Suspense fallback={<div>Loading lazy component...</div>}>
                <LazyComponent />
            </Suspense>
        </div>
    );
};

// ====== 主应用组件 ======
const AdvancedArchitectureDemo = () => {
    const [state, dispatch] = useReducer(appReducer, {
        user: null,
        posts: [],
        loading: false,
        error: null
    });
    
    const loadUser = useCallback(async (userId: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await fetch(`/api/users/${userId}`);
            const user = await response.json();
            dispatch({ type: 'SET_USER', payload: user });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load user' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);
    
    return (
        <div className="app">
            <h1>高级架构分析演示</h1>
            
            {/* 复合组件模式 */}
            <Tabs defaultTab="tab1">
                <TabList>
                    <Tab value="tab1">Tab 1</Tab>
                    <Tab value="tab2">Tab 2</Tab>
                </TabList>
            </Tabs>
            
            {/* 渲染属性模式 */}
            <MouseTracker>
                {({ x, y }) => <div>Mouse at ({x}, {y})</div>}
            </MouseTracker>
            
            {/* 性能问题示例 */}
            <ProblematicParent />
            
            {/* 优化示例 */}
            <OptimizedParent />
            
            {/* 最佳实践违规 */}
            <BadPracticeComponent />
            
            {/* 代码分割 */}
            <AppWithCodeSplitting />
        </div>
    );
};

export default AdvancedArchitectureDemo;
