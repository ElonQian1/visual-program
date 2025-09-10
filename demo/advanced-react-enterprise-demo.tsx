// 高级React企业级应用演示
// 这个文件展示了复杂的React架构、性能优化和最佳实践

import React, { 
    useState, 
    useEffect, 
    useCallback, 
    useMemo, 
    useContext, 
    createContext,
    Suspense,
    lazy,
    memo,
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
    useRef
} from 'react';
import { 
    BrowserRouter as Router, 
    Routes, 
    Route, 
    Navigate, 
    useNavigate, 
    useLocation,
    useParams 
} from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ErrorBoundary } from 'react-error-boundary';
import { Helmet } from 'react-helmet-async';
import { toast, ToastContainer } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { debounce, throttle } from 'lodash-es';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// ============= 类型定义 =============

interface User {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'manager' | 'user';
    avatar?: string;
    lastLogin?: string;
    isActive: boolean;
    permissions: string[];
}

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    images: string[];
    createdAt: string;
    updatedAt: string;
}

interface Order {
    id: number;
    userId: number;
    products: OrderItem[];
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: string;
    shippingAddress: Address;
}

interface OrderItem {
    productId: number;
    quantity: number;
    price: number;
    product: Product;
}

interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}

interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============= 全局状态管理 (Redux Toolkit) =============

// 用户状态切片
const userSlice = createSlice({
    name: 'user',
    initialState: {
        currentUser: null as User | null,
        isAuthenticated: false,
        loading: false,
        error: null as string | null,
    },
    reducers: {
        setUser: (state, action) => {
            state.currentUser = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.isAuthenticated = false;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

// 异步登录操作
export const loginUser = createAsyncThunk(
    'user/login',
    async (credentials: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            
            if (!response.ok) {
                throw new Error('登录失败');
            }
            
            const data = await response.json();
            localStorage.setItem('token', data.token);
            return data.user;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : '未知错误');
        }
    }
);

// 购物车状态切片
const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [] as Array<{ product: Product; quantity: number }>,
        total: 0,
        itemCount: 0,
    },
    reducers: {
        addToCart: (state, action) => {
            const { product, quantity = 1 } = action.payload;
            const existingItem = state.items.find(item => item.product.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                state.items.push({ product, quantity });
            }
            
            state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
            state.total = state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        },
        removeFromCart: (state, action) => {
            const productId = action.payload;
            state.items = state.items.filter(item => item.product.id !== productId);
            state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
            state.total = state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        },
        updateQuantity: (state, action) => {
            const { productId, quantity } = action.payload;
            const item = state.items.find(item => item.product.id === productId);
            
            if (item) {
                item.quantity = Math.max(0, quantity);
                if (item.quantity === 0) {
                    state.items = state.items.filter(item => item.product.id !== productId);
                }
            }
            
            state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
            state.total = state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        },
        clearCart: (state) => {
            state.items = [];
            state.total = 0;
            state.itemCount = 0;
        },
    },
});

// Redux Store 配置
const store = configureStore({
    reducer: {
        user: userSlice.reducer,
        cart: cartSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============= React Query 配置 =============

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5分钟
            gcTime: 10 * 60 * 1000, // 10分钟 (替代 cacheTime)
            retry: 3,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

// API查询钩子
const useProducts = (filters: { 
    search?: string; 
    category?: string; 
    page?: number; 
    limit?: number;
} = {}) => {
    return useQuery({
        queryKey: ['products', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
            
            const response = await fetch(`/api/products?${params}`);
            if (!response.ok) throw new Error('获取产品失败');
            return response.json() as Promise<PaginatedResponse<Product>>;
        },
        enabled: true,
    });
};

const useInfiniteProducts = (filters: { search?: string; category?: string } = {}) => {
    return useInfiniteQuery({
        queryKey: ['products', 'infinite', filters],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({
                ...filters,
                page: String(pageParam),
                limit: '20',
            } as Record<string, string>);
            
            const response = await fetch(`/api/products?${params}`);
            if (!response.ok) throw new Error('获取产品失败');
            return response.json() as Promise<PaginatedResponse<Product>>;
        },
        getNextPageParam: (lastPage) => {
            const { page, totalPages } = lastPage.pagination;
            return page < totalPages ? page + 1 : undefined;
        },
        initialPageParam: 1,
    });
};

const useCreateOrder = () => {
    return useMutation({
        mutationFn: async (orderData: Partial<Order>) => {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(orderData),
            });
            
            if (!response.ok) throw new Error('创建订单失败');
            return response.json() as Promise<ApiResponse<Order>>;
        },
        onSuccess: (data) => {
            toast.success('订单创建成功！');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : '创建订单失败');
        },
    });
};

// ============= Context 提供者 =============

interface AppContextValue {
    theme: 'light' | 'dark';
    language: 'zh' | 'en';
    setTheme: (theme: 'light' | 'dark') => void;
    setLanguage: (language: 'zh' | 'en') => void;
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
}

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [language, setLanguage] = useState<'zh' | 'en'>('zh');
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // 保持最多5个通知
        
        // 5秒后自动移除
        setTimeout(() => {
            removeNotification(newNotification.id);
        }, 5000);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const value = useMemo(() => ({
        theme,
        language,
        setTheme,
        setLanguage,
        notifications,
        addNotification,
        removeNotification,
    }), [theme, language, notifications, addNotification, removeNotification]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

// ============= 性能优化的组件 =============

// 虚拟化列表组件
const VirtualizedProductList = memo<{ 
    products: Product[];
    onProductClick: (product: Product) => void;
    loading?: boolean;
}>(({ products, onProductClick, loading = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
    
    const itemHeight = 120;
    const containerHeight = 600;
    
    const handleScroll = useCallback(
        throttle((e: React.UIEvent<HTMLDivElement>) => {
            const scrollTop = e.currentTarget.scrollTop;
            const start = Math.floor(scrollTop / itemHeight);
            const visibleCount = Math.ceil(containerHeight / itemHeight);
            const end = Math.min(start + visibleCount + 5, products.length); // 预加载5个
            
            setVisibleRange({ start: Math.max(0, start - 5), end });
        }, 16), // 60fps
        [products.length, itemHeight, containerHeight]
    );
    
    const visibleProducts = products.slice(visibleRange.start, visibleRange.end);
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    return (
        <div 
            ref={containerRef}
            className="h-96 overflow-auto"
            onScroll={handleScroll}
        >
            <div style={{ height: products.length * itemHeight, position: 'relative' }}>
                {visibleProducts.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => onProductClick(product)}
                        style={{
                            position: 'absolute',
                            top: (visibleRange.start + index) * itemHeight,
                            left: 0,
                            right: 0,
                            height: itemHeight - 10,
                        }}
                    />
                ))}
            </div>
        </div>
    );
});

// 优化的产品卡片组件
const ProductCard = memo<{
    product: Product;
    onClick: () => void;
    style?: React.CSSProperties;
}>(({ product, onClick, style }) => {
    const dispatch = useDispatch();
    const { addNotification } = useAppContext();
    
    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(cartSlice.actions.addToCart({ product, quantity: 1 }));
        addNotification({
            type: 'success',
            title: '已添加到购物车',
            message: `${product.name} 已添加到购物车`,
        });
    }, [product, dispatch, addNotification]);
    
    const formattedPrice = useMemo(() => 
        new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
        }).format(product.price),
        [product.price]
    );
    
    return (
        <div 
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={onClick}
            style={style}
        >
            <div className="flex items-center space-x-4">
                <img 
                    src={product.images[0] || '/placeholder.jpg'} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                    loading="lazy"
                />
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{product.name}</h3>
                    <p className="text-gray-600 text-sm truncate">{product.description}</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xl font-bold text-blue-600">{formattedPrice}</span>
                        <button
                            onClick={handleAddToCart}
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition-colors"
                        >
                            加入购物车
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// ============= 表单组件 =============

const orderSchema = yup.object({
    shippingAddress: yup.object({
        street: yup.string().required('街道地址是必需的'),
        city: yup.string().required('城市是必需的'),
        state: yup.string().required('省份是必需的'),
        zipCode: yup.string().matches(/^\d{6}$/, '邮政编码格式错误').required('邮政编码是必需的'),
        country: yup.string().required('国家是必需的'),
    }),
    paymentMethod: yup.string().oneOf(['credit', 'debit', 'paypal'], '请选择支付方式').required(),
    notes: yup.string().max(500, '备注不能超过500字符'),
});

type OrderFormData = yup.InferType<typeof orderSchema>;

const OrderForm: React.FC<{
    onSubmit: (data: OrderFormData) => void;
    loading?: boolean;
}> = memo(({ onSubmit, loading = false }) => {
    const methods = useForm<OrderFormData>({
        resolver: yupResolver(orderSchema),
        defaultValues: {
            shippingAddress: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'China',
            },
            paymentMethod: 'credit',
            notes: '',
        },
    });
    
    const { handleSubmit, control, formState: { errors } } = methods;
    
    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">配送地址</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                            name="shippingAddress.street"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        街道地址 *
                                    </label>
                                    <input
                                        {...field}
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="请输入街道地址"
                                    />
                                    {errors.shippingAddress?.street && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.shippingAddress.street.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                        
                        <Controller
                            name="shippingAddress.city"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        城市 *
                                    </label>
                                    <input
                                        {...field}
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="请输入城市"
                                    />
                                    {errors.shippingAddress?.city && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.shippingAddress.city.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                        
                        <Controller
                            name="shippingAddress.state"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        省份 *
                                    </label>
                                    <select
                                        {...field}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">请选择省份</option>
                                        <option value="北京">北京</option>
                                        <option value="上海">上海</option>
                                        <option value="广东">广东</option>
                                        <option value="浙江">浙江</option>
                                        <option value="江苏">江苏</option>
                                    </select>
                                    {errors.shippingAddress?.state && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.shippingAddress.state.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                        
                        <Controller
                            name="shippingAddress.zipCode"
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        邮政编码 *
                                    </label>
                                    <input
                                        {...field}
                                        type="text"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="请输入邮政编码"
                                        maxLength={6}
                                    />
                                    {errors.shippingAddress?.zipCode && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.shippingAddress.zipCode.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">支付方式</h3>
                    <Controller
                        name="paymentMethod"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        {...field}
                                        type="radio"
                                        value="credit"
                                        className="mr-2"
                                    />
                                    信用卡
                                </label>
                                <label className="flex items-center">
                                    <input
                                        {...field}
                                        type="radio"
                                        value="debit"
                                        className="mr-2"
                                    />
                                    借记卡
                                </label>
                                <label className="flex items-center">
                                    <input
                                        {...field}
                                        type="radio"
                                        value="paypal"
                                        className="mr-2"
                                    />
                                    PayPal
                                </label>
                            </div>
                        )}
                    />
                    {errors.paymentMethod && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.paymentMethod.message}
                        </p>
                    )}
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">备注</h3>
                    <Controller
                        name="notes"
                        control={control}
                        render={({ field }) => (
                            <div>
                                <textarea
                                    {...field}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="请输入备注信息（可选）"
                                />
                                {errors.notes && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.notes.message}
                                    </p>
                                )}
                            </div>
                        )}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? '提交中...' : '提交订单'}
                </button>
            </form>
        </FormProvider>
    );
});

// ============= 页面组件 =============

// 懒加载的页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// 产品页面组件
const ProductsPageComponent: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'createdAt'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    // 防抖搜索
    const debouncedSearchTerm = useMemo(
        () => debounce((term: string) => setSearchTerm(term), 300),
        []
    );
    
    const { data, isLoading, error } = useProducts({
        search: searchTerm,
        category: selectedCategory,
        page: 1,
        limit: 50,
    });
    
    // 内存中排序（仅用于演示，实际应在后端处理）
    const sortedProducts = useMemo(() => {
        if (!data?.data) return [];
        
        return [...data.data].sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'price':
                    comparison = a.price - b.price;
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [data?.data, sortBy, sortOrder]);
    
    const handleProductClick = useCallback((product: Product) => {
        // 导航到产品详情页
        console.log('Navigate to product:', product.id);
    }, []);
    
    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-500 text-center">
                    <h3 className="text-lg font-semibold">加载失败</h3>
                    <p>{error instanceof Error ? error.message : '未知错误'}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-4 py-8">
            <Helmet>
                <title>产品列表 - 企业电商平台</title>
                <meta name="description" content="浏览我们的产品目录，找到您需要的商品" />
            </Helmet>
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">产品目录</h1>
                
                {/* 搜索和过滤器 */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="搜索产品..."
                        className="flex-1 min-w-64 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => debouncedSearchTerm(e.target.value)}
                    />
                    
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">所有分类</option>
                        <option value="electronics">电子产品</option>
                        <option value="clothing">服装</option>
                        <option value="books">图书</option>
                        <option value="home">家居</option>
                    </select>
                    
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [sort, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                            setSortBy(sort);
                            setSortOrder(order);
                        }}
                        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="createdAt-desc">最新优先</option>
                        <option value="createdAt-asc">最旧优先</option>
                        <option value="price-asc">价格由低到高</option>
                        <option value="price-desc">价格由高到低</option>
                        <option value="name-asc">名称A-Z</option>
                        <option value="name-desc">名称Z-A</option>
                    </select>
                </div>
            </div>
            
            {/* 产品列表 */}
            <VirtualizedProductList
                products={sortedProducts}
                onProductClick={handleProductClick}
                loading={isLoading}
            />
            
            {/* 分页信息 */}
            {data?.pagination && (
                <div className="mt-8 flex justify-center">
                    <div className="text-gray-600">
                        显示 {data.pagination.page * data.pagination.limit} 
                        / {data.pagination.total} 个产品
                    </div>
                </div>
            )}
        </div>
    );
};

// ============= 主应用组件 =============

const AppContent: React.FC = () => {
    const { theme } = useAppContext();
    const user = useSelector((state: RootState) => state.user.currentUser);
    
    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <Router>
                    <Header />
                    <main>
                        <ErrorBoundary
                            FallbackComponent={ErrorFallback}
                            onError={(error, errorInfo) => {
                                console.error('应用错误:', error, errorInfo);
                                // 可以发送错误报告到监控服务
                            }}
                        >
                            <Suspense fallback={<LoadingSpinner />}>
                                <Routes>
                                    <Route path="/" element={<HomePage />} />
                                    <Route path="/products" element={<ProductsPageComponent />} />
                                    <Route 
                                        path="/orders" 
                                        element={
                                            user ? <OrdersPage /> : <Navigate to="/login" replace />
                                        } 
                                    />
                                    <Route 
                                        path="/profile" 
                                        element={
                                            user ? <ProfilePage /> : <Navigate to="/login" replace />
                                        } 
                                    />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="*" element={<NotFoundPage />} />
                                </Routes>
                            </Suspense>
                        </ErrorBoundary>
                    </main>
                    <Footer />
                </Router>
                <ToastContainer />
                <NotificationCenter />
            </div>
        </div>
    );
};

// 错误边界回退组件
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
    error, 
    resetErrorBoundary 
}) => (
    <div className="flex flex-col items-center justify-center min-h-64 p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">出现了一些问题</h2>
        <p className="text-gray-600 mb-4">抱歉，应用遇到了意外错误。</p>
        <details className="text-sm text-gray-500 mb-4">
            <summary className="cursor-pointer">错误详情</summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
        </details>
        <button
            onClick={resetErrorBoundary}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
            重试
        </button>
    </div>
);

// 加载组件
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
);

// 通知中心组件
const NotificationCenter: React.FC = () => {
    const { notifications, removeNotification } = useAppContext();
    
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
                        notification.type === 'error' ? 'bg-red-500 text-white' :
                        notification.type === 'warning' ? 'bg-yellow-500 text-white' :
                        notification.type === 'success' ? 'bg-green-500 text-white' :
                        'bg-blue-500 text-white'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-semibold">{notification.title}</h4>
                            <p className="text-sm">{notification.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="ml-2 text-white hover:text-gray-200"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// 主应用组件
const App: React.FC = () => {
    return (
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <AppProvider>
                    <AppContent />
                </AppProvider>
            </QueryClientProvider>
        </Provider>
    );
};

export default App;

// ============= 占位符组件 =============

const Header: React.FC = () => <header className="bg-blue-600 text-white p-4">Header</header>;
const Footer: React.FC = () => <footer className="bg-gray-800 text-white p-4">Footer</footer>;
const LoginPage: React.FC = () => <div className="p-8">Login Page</div>;
const NotFoundPage: React.FC = () => <div className="p-8">404 - Page Not Found</div>;

// 注册Chart.js组件
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
