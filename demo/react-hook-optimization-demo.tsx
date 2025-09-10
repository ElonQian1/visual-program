// React Hook优化分析演示文件
// 这个文件包含各种Hook使用模式，用于测试React Hook优化分析器

import React, { useState, useEffect, useCallback, useMemo, useContext, useReducer, useRef } from 'react';

// 1. Hook依赖问题演示
const BadDependenciesComponent: React.FC = () => {
    const [count, setCount] = useState(0);
    const [name, setName] = useState('');
    const [users, setUsers] = useState<User[]>([]);

    // 缺少依赖项的useEffect
    useEffect(() => {
        console.log(`Count is ${count}, name is ${name}`);
        // 缺少name依赖
    }, [count]);

    // 不必要的依赖项
    useEffect(() => {
        setCount(prev => prev + 1);
        // count在依赖数组中是不必要的
    }, [count]);

    // 空依赖数组的useMemo
    const expensiveValue = useMemo(() => {
        return count * 2; // 使用了count但依赖数组为空
    }, []);

    return <div>{expensiveValue}</div>;
};

// 2. 自定义Hook机会演示
const FetchDataComponent1: React.FC = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/users');
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return <div>{loading ? 'Loading...' : JSON.stringify(data)}</div>;
};

const FetchDataComponent2: React.FC = () => {
    const [posts, setPosts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/posts');
                const result = await response.json();
                setPosts(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return <div>{loading ? 'Loading...' : JSON.stringify(posts)}</div>;
};

// 3. Hook性能问题演示
const PerformanceIssuesComponent: React.FC = () => {
    const [count, setCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout>();

    // 在useEffect中使用setInterval的问题
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCount(count + 1); // 闭包问题：总是使用初始的count值
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [count]); // 这会导致频繁重新设置定时器

    // 过度使用useCallback
    const handleClick = useCallback(() => {
        console.log('clicked');
    }, []); // 简单函数不需要记忆化

    // useMemo用于空对象
    const emptyObject = useMemo(() => ({}), []);

    return (
        <div>
            <div>Count: {count}</div>
            <button onClick={handleClick}>Click</button>
        </div>
    );
};

// 4. Hook命名规范问题
const BadNamingComponent: React.FC = () => {
    // 自定义Hook应该以use开头
    const getUserData = () => {
        const [user, setUser] = useState(null);
        return { user, setUser };
    };

    const dataHook = () => {
        const [data, setData] = useState([]);
        return { data, setData };
    };

    const { user } = getUserData();
    const { data } = dataHook();

    return <div>{JSON.stringify({ user, data })}</div>;
};

// 5. 表单处理模式（可以抽象为useForm）
const FormComponent1: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: '' }));
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        
        if (!email) newErrors.email = 'Email is required';
        if (!password) newErrors.password = 'Password is required';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        
        setErrors(newErrors);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
            />
            <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
            />
            <button type="submit">Submit</button>
        </form>
    );
};

const FormComponent2: React.FC = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFirstName(e.target.value);
        if (errors.firstName) {
            setErrors(prev => ({ ...prev, firstName: '' }));
        }
    };

    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLastName(e.target.value);
        if (errors.lastName) {
            setErrors(prev => ({ ...prev, lastName: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        
        if (!firstName) newErrors.firstName = 'First name is required';
        if (!lastName) newErrors.lastName = 'Last name is required';
        
        setErrors(newErrors);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={firstName}
                onChange={handleFirstNameChange}
                placeholder="First Name"
            />
            <input
                type="text"
                value={lastName}
                onChange={handleLastNameChange}
                placeholder="Last Name"
            />
            <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
            />
            <button type="submit">Submit</button>
        </form>
    );
};

// 6. Hook调用顺序问题
const ConditionalHooksComponent: React.FC<{ shouldShowExtra: boolean }> = ({ shouldShowExtra }) => {
    const [basicState, setBasicState] = useState('basic');

    // 错误：条件性调用Hook
    if (shouldShowExtra) {
        const [extraState, setExtraState] = useState('extra'); // 这是错误的
    }

    // 错误：循环中调用Hook
    for (let i = 0; i < 3; i++) {
        const [loopState, setLoopState] = useState(i); // 这是错误的
    }

    useEffect(() => {
        console.log('Effect runs');
    }, [basicState]);

    return <div>{basicState}</div>;
};

// 7. 复杂状态逻辑（应该使用useReducer）
const ComplexStateComponent: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    const handleFetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSortChange = (newSortBy: string) => {
        if (sortBy === newSortBy) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    return (
        <div>
            <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter users..."
            />
            <button onClick={handleFetchUsers} disabled={loading}>
                {loading ? 'Loading...' : 'Fetch Users'}
            </button>
            {error && <div className="error">{error}</div>}
            <div>Selected: {selectedUsers.length} users</div>
        </div>
    );
};

// 8. 派生状态问题
const DerivedStateComponent: React.FC = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [fullName, setFullName] = useState(''); // 派生状态

    // 错误：使用useEffect同步派生状态
    useEffect(() => {
        setFullName(`${firstName} ${lastName}`);
    }, [firstName, lastName]);

    // 正确的做法应该是使用useMemo
    // const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);

    return (
        <div>
            <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
            />
            <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
            />
            <div>Full Name: {fullName}</div>
        </div>
    );
};

// 类型定义
interface User {
    id: string;
    name: string;
    email: string;
}

// 主导出组件
const ReactHookOptimizationDemo: React.FC = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>React Hook优化分析演示</h1>
            
            <section>
                <h2>1. Hook依赖问题</h2>
                <BadDependenciesComponent />
            </section>

            <section>
                <h2>2. 可以抽象为自定义Hook的重复逻辑</h2>
                <FetchDataComponent1 />
                <FetchDataComponent2 />
            </section>

            <section>
                <h2>3. Hook性能问题</h2>
                <PerformanceIssuesComponent />
            </section>

            <section>
                <h2>4. Hook命名规范问题</h2>
                <BadNamingComponent />
            </section>

            <section>
                <h2>5. 表单处理模式（可抽象为useForm）</h2>
                <FormComponent1 />
                <FormComponent2 />
            </section>

            <section>
                <h2>6. Hook调用顺序问题</h2>
                <ConditionalHooksComponent shouldShowExtra={true} />
            </section>

            <section>
                <h2>7. 复杂状态逻辑（应使用useReducer）</h2>
                <ComplexStateComponent />
            </section>

            <section>
                <h2>8. 派生状态问题</h2>
                <DerivedStateComponent />
            </section>
        </div>
    );
};

export default ReactHookOptimizationDemo;
