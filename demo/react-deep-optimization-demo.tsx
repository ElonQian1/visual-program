import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import './LargeComponent.css';

// 大型组件 - 适合代码分割
const LargeComponent = React.memo(() => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [page, setPage] = useState(1);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [preferences, setPreferences] = useState({});
    const [cache, setCache] = useState(new Map());
    const [metadata, setMetadata] = useState({});
    const [notifications, setNotifications] = useState([]);
    
    const dispatch = useDispatch();
    const user = useSelector(state => state.user);
    const settings = useSelector(state => state.settings);

    // 昂贵的计算 - 需要优化
    const processedData = useMemo(() => {
        return data
            .filter(item => item.name.includes(filter))
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
                return 0;
            })
            .slice((page - 1) * 20, page * 20)
            .map(item => ({
                ...item,
                processed: true,
                timestamp: Date.now()
            }));
    }, [data, filter, sortBy, page]);

    // 多个useEffect - 可能需要合并优化
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchUserPreferences();
    }, [user.id]);

    useEffect(() => {
        updateAnalytics(page);
    }, [page]);

    useEffect(() => {
        const interval = setInterval(() => {
            refreshData();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        validateData();
    }, [data]);

    // 潜在的异步操作优化点
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/data');
            setData(response.data);
            
            // 串行请求 - 可以并行优化
            const metadata = await axios.get('/api/metadata');
            setMetadata(metadata.data);
            
            const preferences = await axios.get(`/api/users/${user.id}/preferences`);
            setPreferences(preferences.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // 缺少useCallback优化的函数
    const handleItemClick = (item) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(item.id)) {
            newSelected.delete(item.id);
        } else {
            newSelected.add(item.id);
        }
        setSelectedItems(newSelected);
        
        // 复杂的计算逻辑
        const relatedItems = data.filter(d => d.category === item.category);
        const score = relatedItems.reduce((acc, curr) => acc + curr.score, 0);
        dispatch({ type: 'UPDATE_SCORE', payload: score });
    };

    const handleSort = (newSortBy) => {
        setSortBy(newSortBy);
        // 直接DOM操作 - 不推荐
        document.getElementById('data-table').scrollTop = 0;
    };

    const handleFilter = (event) => {
        const value = event.target.value;
        setFilter(value);
        setPage(1);
        
        // 昂贵的操作放在主线程
        const matches = data.filter(item => 
            item.name.toLowerCase().includes(value.toLowerCase()) ||
            item.description.toLowerCase().includes(value.toLowerCase()) ||
            item.tags.some(tag => tag.toLowerCase().includes(value.toLowerCase()))
        );
        
        // 不必要的状态更新
        setCache(new Map(cache.set(value, matches)));
    };

    // 内联函数 - 性能问题
    const renderItem = (item) => (
        <div 
            key={item.id} 
            className="item"
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => setMetadata({...metadata, hovering: item.id})}
            style={{ 
                backgroundColor: selectedItems.has(item.id) ? '#e3f2fd' : 'white',
                border: item.priority === 'high' ? '2px solid red' : '1px solid #ccc'
            }}
        >
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="item-actions">
                <button onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'DELETE_ITEM', payload: item.id });
                }}>
                    删除
                </button>
                <button onClick={(e) => {
                    e.stopPropagation();
                    // 复杂的内联逻辑
                    const newItem = {
                        ...item,
                        id: Math.random().toString(36),
                        createdAt: new Date().toISOString(),
                        clonedFrom: item.id
                    };
                    setData([...data, newItem]);
                }}>
                    克隆
                </button>
            </div>
        </div>
    );

    const fetchUserPreferences = async () => {
        // 重复的API调用逻辑
        try {
            const response = await axios.get(`/api/users/${user.id}/preferences`);
            setPreferences(response.data);
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const refreshData = async () => {
        // 没有防抖的频繁请求
        const response = await axios.get('/api/data/refresh');
        setData(response.data);
    };

    const updateAnalytics = (currentPage) => {
        // 发送分析数据
        axios.post('/api/analytics', {
            page: currentPage,
            timestamp: Date.now(),
            userId: user.id
        });
    };

    const validateData = () => {
        // 昂贵的数据验证
        data.forEach(item => {
            if (!item.id || !item.name) {
                console.warn('Invalid item:', item);
            }
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>加载中...</p>
            </div>
        );
    }

    return (
        <div className="large-component">
            <header className="component-header">
                <h1>数据管理界面</h1>
                <div className="controls">
                    <input
                        type="text"
                        placeholder="搜索..."
                        value={filter}
                        onChange={handleFilter}
                        className="search-input"
                    />
                    <select 
                        value={sortBy} 
                        onChange={(e) => handleSort(e.target.value)}
                        className="sort-select"
                    >
                        <option value="name">按名称排序</option>
                        <option value="date">按日期排序</option>
                        <option value="priority">按优先级排序</option>
                    </select>
                </div>
            </header>

            <div className="stats-bar">
                <span>总计: {data.length}</span>
                <span>已选择: {selectedItems.size}</span>
                <span>当前页: {page}</span>
            </div>

            <div id="data-table" className="data-container">
                {processedData.map(renderItem)}
            </div>

            <div className="pagination">
                <button 
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                >
                    上一页
                </button>
                <span>第 {page} 页</span>
                <button 
                    disabled={processedData.length < 20}
                    onClick={() => setPage(page + 1)}
                >
                    下一页
                </button>
            </div>

            <div className="notifications">
                {notifications.map((notification, index) => (
                    <div key={index} className="notification">
                        {notification.message}
                    </div>
                ))}
            </div>
        </div>
    );
});

// 另一个大型组件
const DataVisualization = () => {
    const [chartData, setChartData] = useState([]);
    const [chartType, setChartType] = useState('bar');
    
    useEffect(() => {
        // 昂贵的数据处理
        const processChartData = () => {
            const processed = chartData.map(item => ({
                ...item,
                calculated: item.value * 1.2,
                formatted: new Intl.NumberFormat().format(item.value)
            }));
            return processed;
        };
        
        const result = processChartData();
        // 直接修改状态而不是使用函数式更新
        setChartData(result);
    }, [chartData]); // 错误的依赖项

    return (
        <div className="data-visualization">
            <h2>数据可视化</h2>
            {/* 大量的JSX内容 */}
        </div>
    );
};

// 导出组件 - 未使用React.lazy
export default LargeComponent;
