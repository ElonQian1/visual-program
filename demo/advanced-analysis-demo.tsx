// 高级分析功能演示文件
// 用于测试React实时性能监控、系统性能分析、代码质量检测等功能

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import { debounce } from 'lodash'; // 移除lodash依赖，用自定义实现

// 这是一个复杂的React组件，包含各种可分析的模式
interface UserProfile {
    id: number;
    name: string;
    email: string;
    preferences: {
        theme: 'light' | 'dark';
        notifications: boolean;
        language: string;
    };
    activities: Activity[];
}

interface Activity {
    id: string;
    type: 'login' | 'purchase' | 'view' | 'comment';
    timestamp: Date;
    metadata: Record<string, any>;
}

// 一个可能存在性能问题的大型组件
const ComplexUserDashboard: React.FC = () => {
    // 过多的state（可触发状态管理优化建议）
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedActivityType, setSelectedActivityType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'type'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isEditMode, setIsEditMode] = useState(false);
    const [tempUserData, setTempUserData] = useState<Partial<UserProfile>>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Refs for performance optimization opportunities
    const searchInputRef = useRef<HTMLInputElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const renderCountRef = useRef(0);

    // 多个useEffect（可触发Hook优化建议）
    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserActivities(user.id);
        }
    }, [user]);

    useEffect(() => {
        filterActivities();
    }, [activities, searchTerm, selectedActivityType]);

    useEffect(() => {
        sortActivities();
    }, [filteredActivities, sortBy, sortOrder]);

    useEffect(() => {
        // 性能监控：计算渲染次数
        renderCountRef.current += 1;
        console.log(`Component rendered ${renderCountRef.current} times`);
    });

    useEffect(() => {
        // 可能导致内存泄漏的事件监听器
        const handleResize = () => {
            // 一些复杂的计算
            const tableWidth = tableRef.current?.offsetWidth || 0;
            console.log('Table width:', tableWidth);
        };

        window.addEventListener('resize', handleResize);
        
        // 注意：这里故意不清理事件监听器以展示内存泄漏检测
        // return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 昂贵的计算（可能需要优化）
    const expensiveCalculation = (activities: Activity[]) => {
        // 模拟复杂计算
        let result = 0;
        for (let i = 0; i < activities.length; i++) {
            for (let j = 0; j < 1000; j++) {
                result += Math.random() * activities[i].id.length;
            }
        }
        return result;
    };

    // 没有正确使用useMemo的昂贵计算
    const statisticsData = expensiveCalculation(activities);

    // 应该使用useCallback但没有使用
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1);
    };

    // 过度使用useCallback（不必要的优化）
    const handleClick = useCallback(() => {
        console.log('Button clicked');
    }, []);

    const handleSort = useCallback((field: 'date' | 'type') => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    }, [sortBy]);

    // 防抖搜索（正确的优化示例）
    const debouncedSearch = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (term: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                handleSearch(term);
            }, 300);
        };
    }, []);

    // 异步数据获取函数
    const fetchUserData = async () => {
        setLoading(true);
        try {
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            const userData: UserProfile = {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                preferences: {
                    theme: 'light',
                    notifications: true,
                    language: 'en'
                },
                activities: []
            };
            setUser(userData);
        } catch (err) {
            setError('Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserActivities = async (userId: number) => {
        try {
            // 模拟API调用
            const activitiesData: Activity[] = Array.from({ length: 100 }, (_, i) => ({
                id: `activity-${i}`,
                type: ['login', 'purchase', 'view', 'comment'][Math.floor(Math.random() * 4)] as Activity['type'],
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                metadata: { index: i }
            }));
            setActivities(activitiesData);
        } catch (err) {
            setError('Failed to fetch activities');
        }
    };

    // 过度复杂的过滤逻辑（可以拆分为更小的函数）
    const filterActivities = () => {
        let filtered = activities;
        
        if (searchTerm) {
            filtered = filtered.filter(activity => 
                activity.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                activity.metadata.index.toString().includes(searchTerm)
            );
        }
        
        if (selectedActivityType !== 'all') {
            filtered = filtered.filter(activity => activity.type === selectedActivityType);
        }
        
        setFilteredActivities(filtered);
    };

    const sortActivities = () => {
        const sorted = [...filteredActivities].sort((a, b) => {
            if (sortBy === 'date') {
                const comparison = a.timestamp.getTime() - b.timestamp.getTime();
                return sortOrder === 'asc' ? comparison : -comparison;
            } else {
                const comparison = a.type.localeCompare(b.type);
                return sortOrder === 'asc' ? comparison : -comparison;
            }
        });
        
        setFilteredActivities(sorted);
    };

    // 没有错误边界处理的组件渲染
    const renderUserProfile = () => {
        if (!user) return null;
        
        return (
            <div className="user-profile">
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <div className="preferences">
                    <p>Theme: {user.preferences.theme}</p>
                    <p>Notifications: {user.preferences.notifications ? 'On' : 'Off'}</p>
                    <p>Language: {user.preferences.language}</p>
                </div>
            </div>
        );
    };

    // 大型的渲染函数（应该拆分为更小的组件）
    const renderActivitiesTable = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
        
        return (
            <div className="activities-section">
                <div className="activities-header">
                    <h3>User Activities</h3>
                    <div className="activities-controls">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search activities..."
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                        <select 
                            value={selectedActivityType}
                            onChange={(e) => setSelectedActivityType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="login">Login</option>
                            <option value="purchase">Purchase</option>
                            <option value="view">View</option>
                            <option value="comment">Comment</option>
                        </select>
                    </div>
                </div>
                
                <table ref={tableRef} className="activities-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('type')}>
                                Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('date')}>
                                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedActivities.map(activity => (
                            <tr key={activity.id}>
                                <td>{activity.type}</td>
                                <td>{activity.timestamp.toLocaleDateString()}</td>
                                <td>{activity.id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="pagination">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {Math.ceil(filteredActivities.length / itemsPerPage)}</span>
                    <button 
                        disabled={currentPage >= Math.ceil(filteredActivities.length / itemsPerPage)}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="loading">Loading user dashboard...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    // 主渲染逻辑过于复杂，应该拆分
    return (
        <div className="user-dashboard">
            <header className="dashboard-header">
                <h1>User Dashboard</h1>
                <div className="stats">
                    <span>Total Activities: {activities.length}</span>
                    <span>Filtered: {filteredActivities.length}</span>
                    <span>Statistics: {statisticsData.toFixed(2)}</span>
                </div>
                <button onClick={handleClick}>Action Button</button>
            </header>
            
            <main className="dashboard-content">
                {renderUserProfile()}
                {renderActivitiesTable()}
            </main>
            
            <footer className="dashboard-footer">
                <p>Dashboard rendered {renderCountRef.current} times</p>
            </footer>
        </div>
    );
};

// 另一个组件展示不同的模式
const OptimizedCounter: React.FC = () => {
    const [count, setCount] = useState(0);
    
    // 正确使用useCallback
    const increment = useCallback(() => {
        setCount(prev => prev + 1);
    }, []);
    
    // 正确使用useMemo
    const expensiveValue = useMemo(() => {
        console.log('Computing expensive value...');
        return count * 2;
    }, [count]);
    
    return (
        <div>
            <p>Count: {count}</p>
            <p>Expensive Value: {expensiveValue}</p>
            <button onClick={increment}>Increment</button>
        </div>
    );
};

// 组件存在问题的示例
const ProblematicComponent: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    
    // 问题1: 在每次渲染时创建新对象
    const options = {
        sortBy: 'name',
        order: 'asc'
    };
    
    const fetchData = async () => {
        // 异步操作
        try {
            const response = await fetch('/api/data');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    
    // 问题2: 没有依赖数组的useEffect
    useEffect(() => {
        fetchData();
    });
    
    // 问题3: 在渲染过程中进行副作用操作
    if (data.length === 0) {
        console.log('Data is empty, should fetch data in useEffect instead');
    }
    
    return (
        <div>
            {data.map((item, index) => (
                // 问题4: 使用index作为key
                <div key={index}>
                    {JSON.stringify(item)}
                </div>
            ))}
        </div>
    );
};

export { ComplexUserDashboard, OptimizedCounter, ProblematicComponent };
