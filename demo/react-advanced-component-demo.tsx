// React高级组件架构示例 - 展示复杂的依赖关系和优化机会
import React, { useState, useEffect, useMemo, useCallback, useContext, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// 全局状态上下文
const ThemeContext = React.createContext();
const UserContext = React.createContext();

// 用户管理Hook - 展示Hook依赖分析
function useUserManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // 问题：依赖数组包含太多项
    useEffect(() => {
        fetchUsers();
    }, [users, loading, error, setUsers, setLoading]); // 过多依赖
    
    // 问题：没有使用useCallback缓存函数
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/users');
            const userData = await response.json();
            setUsers(userData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // 问题：useMemo依赖可能不必要
    const sortedUsers = useMemo(() => {
        return users.sort((a, b) => a.name.localeCompare(b.name));
    }, [users, loading, error]); // error和loading不影响排序
    
    return { users: sortedUsers, loading, error, fetchUsers };
}

// 问题：组件未使用React.memo优化
function UserCard({ user, onEdit, onDelete, theme }) {
    // 问题：内联样式对象导致重渲染
    const cardStyle = {
        backgroundColor: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333',
        padding: '16px',
        margin: '8px',
        borderRadius: '8px'
    };
    
    return (
        <div style={cardStyle}> {/* 每次渲染都创建新对象 */}
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <div>
                {/* 问题：内联箭头函数导致子组件重渲染 */}
                <button onClick={() => onEdit(user.id)}>编辑</button>
                <button onClick={() => onDelete(user.id)}>删除</button>
            </div>
        </div>
    );
}

// 问题：大型组件，复杂度高
function UserManagementDashboard({ department, filters, permissions }) {
    const { users, loading, error, fetchUsers } = useUserManager();
    const theme = useContext(ThemeContext);
    const currentUser = useContext(UserContext);
    const navigate = useNavigate();
    
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    // 问题：useEffect依赖分析 - 可能导致无限循环
    useEffect(() => {
        if (department && filters) {
            fetchUsers();
        }
    }, [department, filters, fetchUsers]); // fetchUsers会导致重新渲染
    
    // 问题：复杂的计算没有优化
    const filteredAndSortedUsers = users
        .filter(user => {
            if (filterBy === 'all') return true;
            if (filterBy === 'active') return user.status === 'active';
            if (filterBy === 'inactive') return user.status === 'inactive';
            return true;
        })
        .filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.name.localeCompare(b.name);
                case 'email': return a.email.localeCompare(b.email);
                case 'date': return new Date(b.createdAt) - new Date(a.createdAt);
                default: return 0;
            }
        });
    
    // 问题：函数没有缓存
    const handleUserEdit = (userId) => {
        const user = users.find(u => u.id === userId);
        setEditingUser(user);
        setShowModal(true);
    };
    
    const handleUserDelete = async (userId) => {
        if (window.confirm('确定要删除此用户吗？')) {
            try {
                await fetch(`/api/users/${userId}`, { method: 'DELETE' });
                fetchUsers(); // 重新获取数据
            } catch (err) {
                console.error('删除用户失败:', err);
            }
        }
    };
    
    const handleBulkAction = (action) => {
        if (selectedUsers.length === 0) {
            alert('请先选择用户');
            return;
        }
        
        switch (action) {
            case 'delete':
                if (window.confirm(`确定要删除 ${selectedUsers.length} 个用户吗？`)) {
                    // 批量删除逻辑
                    Promise.all(
                        selectedUsers.map(userId => 
                            fetch(`/api/users/${userId}`, { method: 'DELETE' })
                        )
                    ).then(() => {
                        setSelectedUsers([]);
                        fetchUsers();
                    });
                }
                break;
            case 'export':
                // 导出逻辑
                const selectedUserData = users.filter(u => selectedUsers.includes(u.id));
                const csvContent = convertToCSV(selectedUserData);
                downloadCSV(csvContent, 'selected_users.csv');
                break;
            default:
                break;
        }
    };
    
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div>加载中...</div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div style={{ color: 'red', padding: '20px' }}>
                错误: {error}
                <button onClick={() => fetchUsers()}>重试</button>
            </div>
        );
    }
    
    return (
        <div className={`user-dashboard ${theme}`}>
            <header className="dashboard-header">
                <h1>用户管理仪表板</h1>
                <div className="user-stats">
                    <span>总用户: {users.length}</span>
                    <span>已选择: {selectedUsers.length}</span>
                    <span>部门: {department}</span>
                </div>
            </header>
            
            <div className="dashboard-controls">
                <input
                    type="text"
                    placeholder="搜索用户..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px', marginRight: '10px' }}
                />
                
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '8px', marginRight: '10px' }}
                >
                    <option value="name">按姓名排序</option>
                    <option value="email">按邮箱排序</option>
                    <option value="date">按创建时间排序</option>
                </select>
                
                <select 
                    value={filterBy} 
                    onChange={(e) => setFilterBy(e.target.value)}
                    style={{ padding: '8px', marginRight: '10px' }}
                >
                    <option value="all">全部用户</option>
                    <option value="active">活跃用户</option>
                    <option value="inactive">非活跃用户</option>
                </select>
                
                <div className="bulk-actions">
                    <button 
                        onClick={() => handleBulkAction('delete')}
                        disabled={selectedUsers.length === 0}
                        style={{ 
                            backgroundColor: selectedUsers.length > 0 ? '#dc3545' : '#ccc',
                            color: 'white',
                            padding: '8px 16px',
                            marginRight: '8px'
                        }}
                    >
                        批量删除
                    </button>
                    <button 
                        onClick={() => handleBulkAction('export')}
                        disabled={selectedUsers.length === 0}
                        style={{ 
                            backgroundColor: selectedUsers.length > 0 ? '#28a745' : '#ccc',
                            color: 'white',
                            padding: '8px 16px'
                        }}
                    >
                        导出选中
                    </button>
                </div>
            </div>
            
            <div className="user-grid">
                {/* 问题：大型列表渲染，没有虚拟化 */}
                {filteredAndSortedUsers.map(user => (
                    <div key={user.id} className="user-card-wrapper">
                        <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                            }}
                        />
                        <UserCard
                            user={user}
                            onEdit={handleUserEdit}
                            onDelete={handleUserDelete}
                            theme={theme}
                        />
                    </div>
                ))}
            </div>
            
            {showModal && editingUser && (
                <UserEditModal
                    user={editingUser}
                    onSave={(updatedUser) => {
                        // 保存用户更新
                        fetch(`/api/users/${updatedUser.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updatedUser)
                        }).then(() => {
                            setShowModal(false);
                            setEditingUser(null);
                            fetchUsers();
                        });
                    }}
                    onCancel={() => {
                        setShowModal(false);
                        setEditingUser(null);
                    }}
                />
            )}
            
            <div className="dashboard-footer">
                <p>用户权限: {permissions.join(', ')}</p>
                <p>当前用户: {currentUser?.name}</p>
            </div>
        </div>
    );
}

// 简单的模态框组件
function UserEditModal({ user, onSave, onCancel }) {
    const [formData, setFormData] = useState({ ...user });
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                minWidth: '400px'
            }}>
                <h3>编辑用户</h3>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="姓名"
                    style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="邮箱"
                    style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />
                <div>
                    <button onClick={() => onSave(formData)}>保存</button>
                    <button onClick={onCancel} style={{ marginLeft: '10px' }}>取消</button>
                </div>
            </div>
        </div>
    );
}

// 辅助函数
function convertToCSV(data) {
    // CSV转换逻辑
    const headers = ['ID', '姓名', '邮箱', '状态'];
    const csvRows = [headers.join(',')];
    
    data.forEach(user => {
        const row = [user.id, user.name, user.email, user.status];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// 主应用组件
function App() {
    const [theme, setTheme] = useState('light');
    const [currentUser, setCurrentUser] = useState({ id: 1, name: '管理员' });
    
    return (
        <ThemeContext.Provider value={theme}>
            <UserContext.Provider value={currentUser}>
                <Router>
                    <div className="app">
                        <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
                            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                                切换主题
                            </button>
                        </nav>
                        
                        <Routes>
                            <Route path="/" element={
                                <UserManagementDashboard 
                                    department="技术部"
                                    filters={{ status: 'active' }}
                                    permissions={['read', 'write', 'delete']}
                                />
                            } />
                        </Routes>
                    </div>
                </Router>
            </UserContext.Provider>
        </ThemeContext.Provider>
    );
}

export default App;
