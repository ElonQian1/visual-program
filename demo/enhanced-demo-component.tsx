// 🎯 演示增强代码生成功能
import React, { useState, useEffect, useCallback } from 'react';

interface UserProfileProps {
    userId: string;
    displayName: string;
    avatar?: string;
    isOnline: boolean;
    onUserClick?: (userId: string) => void;
}

interface UserData {
    id: string;
    name: string;
    email: string;
    lastActive: Date;
}

// 这个组件有一些代码坏味道，用于测试AI分析功能
export const UserProfile: React.FC<UserProfileProps> = ({ 
    userId, 
    displayName, 
    avatar, 
    isOnline, 
    onUserClick 
}) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // 这里有一个魔术数字 - AI应该检测到
    const CACHE_DURATION = 300000; // 5分钟
    
    // 这个函数过长 - AI应该建议重构
    const fetchUserData = useCallback(async () => {
        if (!userId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // 模拟API调用
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            const data = await response.json();
            
            // 数据验证
            if (!data.id || !data.name || !data.email) {
                throw new Error('Invalid user data received');
            }
            
            // 数据转换
            const transformedData: UserData = {
                id: data.id,
                name: data.name,
                email: data.email,
                lastActive: new Date(data.lastActive)
            };
            
            setUserData(transformedData);
            
            // 缓存数据
            localStorage.setItem(`user_${userId}`, JSON.stringify({
                data: transformedData,
                timestamp: Date.now()
            }));
            
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            
            // 尝试从缓存加载
            try {
                const cached = localStorage.getItem(`user_${userId}`);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setUserData(data);
                        setError(null);
                    }
                }
            } catch (cacheError) {
                console.error('Cache error:', cacheError);
            }
        } finally {
            setLoading(false);
        }
    }, [userId, CACHE_DURATION]);
    
    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);
    
    // 深度嵌套的条件渲染 - AI应该检测到复杂度过高
    const handleClick = () => {
        if (onUserClick) {
            if (userData) {
                if (userData.id) {
                    if (isOnline) {
                        onUserClick(userData.id);
                    } else {
                        console.log('User is offline');
                    }
                } else {
                    console.error('No user ID available');
                }
            } else {
                console.error('No user data available');
            }
        }
    };
    
    // 重复的样式对象 - AI应该检测到重复
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
    };
    
    const avatarStyle = {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        marginRight: '12px',
        backgroundColor: '#ddd'
    };
    
    const nameStyle = {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#333'
    };
    
    const statusStyle = {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: isOnline ? '#4caf50' : '#999'
    };
    
    if (loading) {
        return (
            <div style={containerStyle}>
                <div style={avatarStyle}></div>
                <div>
                    <div style={nameStyle}>Loading...</div>
                    <div style={statusStyle}>Fetching user data...</div>
                </div>
            </div>
        );
    }
    
    if (error && !userData) {
        return (
            <div style={{...containerStyle, backgroundColor: '#ffe6e6'}}>
                <div style={avatarStyle}></div>
                <div>
                    <div style={{...nameStyle, color: '#d32f2f'}}>Error</div>
                    <div style={{...statusStyle, color: '#d32f2f'}}>{error}</div>
                </div>
            </div>
        );
    }
    
    return (
        <div 
            style={containerStyle}
            onClick={handleClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8e8e8';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
        >
            {avatar ? (
                <img 
                    src={avatar} 
                    alt={displayName}
                    style={avatarStyle}
                />
            ) : (
                <div style={avatarStyle}>
                    {displayName.charAt(0).toUpperCase()}
                </div>
            )}
            
            <div style={{ flex: 1 }}>
                <div style={nameStyle}>{displayName}</div>
                <div style={statusStyle}>
                    <span 
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isOnline ? '#4caf50' : '#999',
                            marginRight: '6px'
                        }}
                    />
                    {isOnline ? 'Online' : 'Offline'}
                    {userData && (
                        <span style={{ marginLeft: '8px' }}>
                            Last active: {userData.lastActive.toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
