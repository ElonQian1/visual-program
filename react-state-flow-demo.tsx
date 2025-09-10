/**
 * React状态流分析演示
 * 复杂的状态管理场景，用于测试ReactStateFlowAnalyzer
 */

import React, { useState, useEffect, useContext, useMemo, useCallback, createContext } from 'react';
// import { useSelector, useDispatch } from 'react-redux';

// Mock Redux hooks for demo
const useSelector = (selector: any) => selector({ user: {}, notifications: [], preferences: {} });
const useDispatch = () => (action: any) => console.log('Dispatch:', action);

// 全局状态Context
const AppContext = createContext({});
const UserContext = createContext({});
const ThemeContext = createContext({});

// 复杂组件状态管理
const ComplexStateComponent: React.FC = () => {
    // 多个useState Hook
    const [userList, setUserList] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [pageNumber, setPageNumber] = useState(1);
    const [filters, setFilters] = useState({
        role: 'all',
        department: '',
        status: 'active'
    });

    // Context使用
    const appState = useContext(AppContext);
    const userState = useContext(UserContext);
    const themeState = useContext(ThemeContext);

    // Redux状态
    const globalUser = useSelector((state: any) => state.user);
    const notifications = useSelector((state: any) => state.notifications);
    const preferences = useSelector((state: any) => state.preferences);
    const dispatch = useDispatch();

    // 复杂的计算状态
    const filteredUsers = useMemo(() => {
        return userList
            .filter(user => 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                (filters.role === 'all' || user.role === filters.role) &&
                (filters.department === '' || user.department === filters.department) &&
                user.status === filters.status
            )
            .sort((a, b) => {
                if (sortOrder === 'asc') {
                    return a.name.localeCompare(b.name);
                }
                return b.name.localeCompare(a.name);
            });
    }, [userList, searchQuery, filters, sortOrder]);

    const userStats = useMemo(() => {
        return {
            total: userList.length,
            active: userList.filter(u => u.status === 'active').length,
            inactive: userList.filter(u => u.status === 'inactive').length,
            departments: [...new Set(userList.map(u => u.department))].length
        };
    }, [userList]);

    // 多个useCallback优化
    const handleUserSelect = useCallback((user: User) => {
        setSelectedUser(user);
        dispatch({ type: 'SELECT_USER', payload: user });
    }, [dispatch]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPageNumber(1); // 重置分页
    }, []);

    const handleFilterChange = useCallback((newFilters: typeof filters) => {
        setFilters(newFilters);
        setPageNumber(1);
    }, []);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        
        try {
            const response = await fetch('/api/users');
            const users = await response.json();
            setUserList(users);
        } catch (error) {
            setErrorMessage('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 复杂的useEffect依赖
    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        if (selectedUser) {
            // 频繁的状态更新 - 性能问题
            const interval = setInterval(() => {
                setSelectedUser(prev => prev ? { ...prev, lastSeen: Date.now() } : null);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        // 多个状态更新在同一个effect中
        if (searchQuery) {
            setIsLoading(true);
            const timer = setTimeout(() => {
                setIsLoading(false);
                // 这里可能触发重渲染链
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    // 渲染中的状态更新 - 反模式
    if (userList.length === 0 && !isLoading) {
        // 不应该在render中更新状态
        // setErrorMessage('No users found');
    }

    return (
        <div>
            <SearchBar onSearch={handleSearch} />
            <FilterPanel filters={filters} onChange={handleFilterChange} />
            <UserList 
                users={filteredUsers}
                selectedUser={selectedUser}
                onUserSelect={handleUserSelect}
                isLoading={isLoading}
            />
            <UserStats stats={userStats} />
            {errorMessage && <ErrorMessage message={errorMessage} />}
        </div>
    );
};

// 状态提升示例
const ParentComponent: React.FC = () => {
    const [sharedState, setSharedState] = useState({
        theme: 'light',
        language: 'en',
        sidebarOpen: false
    });

    // 这个状态被多个子组件使用，可能需要Context
    const [appData, setAppData] = useState({
        user: null,
        settings: {},
        cache: new Map()
    });

    return (
        <AppContext.Provider value={{ sharedState, setSharedState }}>
            <Header />
            <Sidebar isOpen={sharedState.sidebarOpen} />
            <MainContent appData={appData} setAppData={setAppData} />
            <Footer />
        </AppContext.Provider>
    );
};

// 不必要的重渲染示例
const InefficienceComponent: React.FC = () => {
    const [count, setCount] = useState(0);
    const [items, setItems] = useState<any[]>([]);

    // 没有依赖数组 - 每次渲染都会创建新函数
    const expensiveCalculation = () => {
        return items.reduce((sum, item) => sum + item.value, 0);
    };

    // 应该使用useMemo但没有使用
    const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));

    // 在渲染过程中的副作用
    if (count > 10) {
        // 这会导致无限循环
        // setCount(0);
    }

    return (
        <div>
            <button onClick={() => setCount(count + 1)}>
                Count: {count}
            </button>
            <div>Total: {expensiveCalculation()}</div>
            <ItemList items={sortedItems} />
        </div>
    );
};

// 类型定义
interface User {
    id: string;
    name: string;
    role: string;
    department: string;
    status: 'active' | 'inactive';
    lastSeen?: number;
}

// 组件定义（简化）
const SearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => null;
const FilterPanel: React.FC<{ filters: any; onChange: (filters: any) => void }> = () => null;
const UserList: React.FC<any> = () => null;
const UserStats: React.FC<{ stats: any }> = () => null;
const ErrorMessage: React.FC<{ message: string }> = () => null;
const Header: React.FC = () => null;
const Sidebar: React.FC<{ isOpen: boolean }> = () => null;
const MainContent: React.FC<{ appData: any; setAppData: any }> = () => null;
const Footer: React.FC = () => null;
const ItemList: React.FC<{ items: any[] }> = () => null;

export default ComplexStateComponent;
