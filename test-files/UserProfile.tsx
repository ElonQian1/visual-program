import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
    userId: string;
    onUserUpdate?: (user: User) => void;
}

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUserUpdate }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // 获取用户数据
    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/users/${userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }
            
            const userData = await response.json();
            setUser(userData);
            
            if (onUserUpdate) {
                onUserUpdate(userData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [userId, onUserUpdate]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleEditProfile = () => {
        navigate(`/profile/${userId}/edit`);
    };

    const handleRefresh = () => {
        fetchUser();
    };

    if (loading) {
        return <div className="loading">Loading user profile...</div>;
    }

    if (error) {
        return (
            <div className="error">
                <p>Error: {error}</p>
                <button onClick={handleRefresh}>Retry</button>
            </div>
        );
    }

    if (!user) {
        return <div className="not-found">User not found</div>;
    }

    return (
        <div className="user-profile">
            <div className="user-avatar">
                {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                ) : (
                    <div className="avatar-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            
            <div className="user-info">
                <h2>{user.name}</h2>
                <p className="email">{user.email}</p>
                
                <div className="actions">
                    <button onClick={handleEditProfile} className="edit-btn">
                        Edit Profile
                    </button>
                    <button onClick={handleRefresh} className="refresh-btn">
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
