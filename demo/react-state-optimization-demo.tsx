// React状态管理优化深度分析演示文件
// 这个文件包含各种状态管理问题，用于测试React状态管理优化分析器

import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { createContext, useReducer } from 'react';

// 1. 状态结构设计问题

// 问题：嵌套过深的状态结构
interface DeepNestedState {
  user: {
    profile: {
      personal: {
        details: {
          name: string;
          age: number;
          address: {
            street: string;
            city: string;
            country: string;
          };
        };
      };
    };
  };
  settings: {
    theme: {
      colors: {
        primary: string;
        secondary: string;
      };
    };
  };
}

const ProblematicDeepNestedComponent: React.FC = () => {
  const [state, setState] = useState<DeepNestedState>({
    user: {
      profile: {
        personal: {
          details: {
            name: '',
            age: 0,
            address: {
              street: '',
              city: '',
              country: ''
            }
          }
        }
      }
    },
    settings: {
      theme: {
        colors: {
          primary: '#000',
          secondary: '#fff'
        }
      }
    }
  });

  // 问题：复杂的状态更新逻辑
  const updateUserName = (name: string) => {
    setState(prevState => ({
      ...prevState,
      user: {
        ...prevState.user,
        profile: {
          ...prevState.user.profile,
          personal: {
            ...prevState.user.profile.personal,
            details: {
              ...prevState.user.profile.personal.details,
              name
            }
          }
        }
      }
    }));
  };

  return <div>Deep nested state component</div>;
};

// 2. 不合理的状态分割

// 问题：相关状态分散在多个useState中
const ScatteredStateComponent: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 这些状态应该组合成一个对象
  // const [userForm, setUserForm] = useState({
  //   firstName: '',
  //   lastName: '',
  //   email: '',
  //   phone: '',
  //   meta: {
  //     isLoading: false,
  //     error: '',
  //     isValidated: false,
  //     hasChanges: false
  //   }
  // });

  return <div>Scattered state component</div>;
};

// 3. 重渲染性能问题

// 问题：过度的重渲染
const OverRenderingParent: React.FC = () => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [items, setItems] = useState<string[]>([]);

  // 问题：每次渲染都创建新对象/函数
  const expensiveData = {
    processedItems: items.map(item => item.toUpperCase()), // 每次都重新计算
    timestamp: new Date().toISOString()
  };

  const handleClick = () => { // 每次渲染都创建新函数
    setCount(count + 1);
  };

  const handleNameChange = (newName: string) => { // 每次渲染都创建新函数
    setName(newName);
  };

  return (
    <div>
      {/* 这些子组件会不必要地重渲染 */}
      <ChildComponent1 data={expensiveData} onClick={handleClick} />
      <ChildComponent2 name={name} onNameChange={handleNameChange} />
      <ChildComponent3 items={items} />
    </div>
  );
};

// 子组件没有使用React.memo优化
const ChildComponent1: React.FC<{ data: any; onClick: () => void }> = ({ data, onClick }) => {
  console.log('ChildComponent1 rendered'); // 会频繁打印
  return <div onClick={onClick}>Child 1: {data.timestamp}</div>;
};

const ChildComponent2: React.FC<{ name: string; onNameChange: (name: string) => void }> = ({ name, onNameChange }) => {
  console.log('ChildComponent2 rendered'); // 会频繁打印
  return <input value={name} onChange={(e) => onNameChange(e.target.value)} />;
};

const ChildComponent3: React.FC<{ items: string[] }> = ({ items }) => {
  console.log('ChildComponent3 rendered'); // 会频繁打印
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

// 4. Context性能问题

// 问题：单一大Context导致过度重渲染
interface AppContextValue {
  user: {
    id: string;
    name: string;
    email: string;
  };
  theme: {
    mode: 'light' | 'dark';
    colors: Record<string, string>;
  };
  settings: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
  ui: {
    sidebarOpen: boolean;
    modalOpen: boolean;
    loading: boolean;
  };
}

const AppContext = createContext<{
  state: AppContextValue;
  setState: React.Dispatch<React.SetStateAction<AppContextValue>>;
} | null>(null);

const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppContextValue>({
    user: { id: '', name: '', email: '' },
    theme: { mode: 'light', colors: {} },
    settings: { language: 'en', timezone: 'UTC', notifications: true },
    ui: { sidebarOpen: false, modalOpen: false, loading: false }
  });

  // 问题：任何状态变化都会导致所有消费者重渲染
  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
};

// 只需要用户信息的组件，但会因为其他状态变化而重渲染
const UserProfile: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  console.log('UserProfile rendered'); // 频繁打印
  return <div>User: {context.state.user.name}</div>;
};

// 只需要主题信息的组件，但会因为其他状态变化而重渲染  
const ThemeToggle: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;

  console.log('ThemeToggle rendered'); // 频繁打印
  return (
    <button onClick={() => {
      context.setState(prev => ({
        ...prev,
        theme: {
          ...prev.theme,
          mode: prev.theme.mode === 'light' ? 'dark' : 'light'
        }
      }));
    }}>
      Toggle Theme
    </button>
  );
};

// 5. 异步状态管理问题

// 问题：手动管理异步状态
const ManualAsyncStateComponent: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 问题：容易出现竞态条件
  const fetchData = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/data/${id}`);
      const result = await response.json();
      setData(result); // 可能设置过期的数据
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  // 没有清理effect
  useEffect(() => {
    fetchData('123');
    // 缺少清理函数，可能导致内存泄漏
  }, []);

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>Data: {JSON.stringify(data)}</div>}
    </div>
  );
};

// 6. 状态更新时机问题

// 问题：不必要的状态同步
const UnnecessaryStateSyncComponent: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // 问题：没有防抖，频繁更新
  useEffect(() => {
    setDebouncedValue(inputValue); // 应该使用防抖
  }, [inputValue]);

  // 问题：每次防抖值变化都触发搜索
  useEffect(() => {
    if (debouncedValue) {
      // 模拟API调用
      setSearchResults([`Result for ${debouncedValue}`]);
    }
  }, [debouncedValue]);

  return (
    <div>
      <input 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <ul>
        {searchResults.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ul>
    </div>
  );
};

// 7. 复杂的reducer逻辑

// 问题：复杂的reducer逻辑
interface ComplexState {
  entities: Record<string, any>;
  ui: {
    selectedIds: string[];
    filters: Record<string, any>;
    sorting: {
      field: string;
      direction: 'asc' | 'desc';
    };
  };
  cache: Record<string, any>;
}

type ComplexAction = 
  | { type: 'ADD_ENTITY'; payload: { id: string; data: any } }
  | { type: 'UPDATE_ENTITY'; payload: { id: string; data: Partial<any> } }
  | { type: 'DELETE_ENTITY'; payload: { id: string } }
  | { type: 'SELECT_ENTITY'; payload: { id: string; multi?: boolean } }
  | { type: 'SET_FILTER'; payload: { key: string; value: any } }
  | { type: 'SET_SORTING'; payload: { field: string; direction: 'asc' | 'desc' } }
  | { type: 'CLEAR_CACHE' };

// 问题：单一庞大的reducer，难以维护
const complexReducer = (state: ComplexState, action: ComplexAction): ComplexState => {
  switch (action.type) {
    case 'ADD_ENTITY':
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.payload.id]: action.payload.data
        },
        cache: {} // 清除所有缓存，可能过度
      };
    
    case 'UPDATE_ENTITY':
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.payload.id]: {
            ...state.entities[action.payload.id],
            ...action.payload.data
          }
        }
      };
    
    case 'DELETE_ENTITY':
      const { [action.payload.id]: deleted, ...remainingEntities } = state.entities;
      return {
        ...state,
        entities: remainingEntities,
        ui: {
          ...state.ui,
          selectedIds: state.ui.selectedIds.filter(id => id !== action.payload.id)
        }
      };
    
    case 'SELECT_ENTITY':
      const { id, multi = false } = action.payload;
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedIds: multi 
            ? state.ui.selectedIds.includes(id)
              ? state.ui.selectedIds.filter(selectedId => selectedId !== id)
              : [...state.ui.selectedIds, id]
            : [id]
        }
      };
    
    case 'SET_FILTER':
      return {
        ...state,
        ui: {
          ...state.ui,
          filters: {
            ...state.ui.filters,
            [action.payload.key]: action.payload.value
          }
        }
      };
    
    case 'SET_SORTING':
      return {
        ...state,
        ui: {
          ...state.ui,
          sorting: action.payload
        }
      };
    
    case 'CLEAR_CACHE':
      return {
        ...state,
        cache: {}
      };
    
    default:
      return state;
  }
};

const ComplexReducerComponent: React.FC = () => {
  const [state, dispatch] = useReducer(complexReducer, {
    entities: {},
    ui: {
      selectedIds: [],
      filters: {},
      sorting: { field: 'name', direction: 'asc' }
    },
    cache: {}
  });

  return <div>Complex reducer component</div>;
};

// 8. 状态持久化问题

// 问题：不合理的状态持久化
const StatePersistenceComponent: React.FC = () => {
  const [formData, setFormData] = useState(() => {
    // 问题：同步读取可能阻塞渲染
    const saved = localStorage.getItem('formData');
    return saved ? JSON.parse(saved) : {};
  });

  // 问题：每次状态变化都写入localStorage
  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [formData]); // 频繁写入，性能问题

  // 问题：敏感数据也被持久化
  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('userSession'); // 敏感数据不应持久化
    return saved ? JSON.parse(saved) : null;
  });

  return <div>State persistence component</div>;
};

// 9. 状态依赖问题

// 问题：状态间复杂依赖关系
const StateDependencyComponent: React.FC = () => {
  const [userType, setUserType] = useState<'admin' | 'user' | 'guest'>('guest');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [visibleUI, setVisibleUI] = useState<string[]>([]);

  // 问题：多个effect处理相关逻辑，容易出错
  useEffect(() => {
    switch (userType) {
      case 'admin':
        setPermissions(['read', 'write', 'delete', 'admin']);
        break;
      case 'user':
        setPermissions(['read', 'write']);
        break;
      case 'guest':
        setPermissions(['read']);
        break;
    }
  }, [userType]);

  useEffect(() => {
    setAvailableActions(permissions.filter(p => p !== 'admin'));
  }, [permissions]);

  useEffect(() => {
    const ui: string[] = [];
    if (permissions.includes('write')) ui.push('editButton');
    if (permissions.includes('delete')) ui.push('deleteButton');
    if (permissions.includes('admin')) ui.push('adminPanel');
    setVisibleUI(ui);
  }, [permissions]);

  return <div>State dependency component</div>;
};

// 10. 优化建议示例

// 优化后的组件示例
const OptimizedComponent: React.FC = () => {
  // 1. 合理的状态结构
  const [userForm, setUserForm] = useState({
    data: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    meta: {
      isLoading: false,
      error: '',
      isValidated: false,
      hasChanges: false
    }
  });

  // 2. 使用useCallback优化函数
  const handleInputChange = useCallback((field: string, value: string) => {
    setUserForm(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      },
      meta: {
        ...prev.meta,
        hasChanges: true
      }
    }));
  }, []);

  // 3. 使用useMemo优化计算
  const isFormValid = useMemo(() => {
    const { firstName, lastName, email } = userForm.data;
    return firstName.length > 0 && lastName.length > 0 && email.includes('@');
  }, [userForm.data]);

  // 4. 合并相关的状态更新
  const handleSubmit = useCallback(async () => {
    setUserForm(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        isLoading: true,
        error: ''
      }
    }));

    try {
      await submitForm(userForm.data);
      setUserForm(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          isLoading: false,
          hasChanges: false
        }
      }));
    } catch (error) {
      setUserForm(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Submission failed'
        }
      }));
    }
  }, [userForm.data]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <input
        value={userForm.data.firstName}
        onChange={(e) => handleInputChange('firstName', e.target.value)}
        placeholder="First Name"
      />
      <input
        value={userForm.data.lastName}
        onChange={(e) => handleInputChange('lastName', e.target.value)}
        placeholder="Last Name"
      />
      <input
        value={userForm.data.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        placeholder="Email"
        type="email"
      />
      
      {userForm.meta.error && (
        <div style={{ color: 'red' }}>{userForm.meta.error}</div>
      )}
      
      <button 
        type="submit" 
        disabled={!isFormValid || userForm.meta.isLoading}
      >
        {userForm.meta.isLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

// 辅助函数
async function submitForm(data: any): Promise<void> {
  // 模拟API调用
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      Math.random() > 0.5 ? resolve() : reject(new Error('Network error'));
    }, 1000);
  });
}

// 主应用组件
const StateManagementDemoApp: React.FC = () => {
  return (
    <div>
      <h1>React状态管理优化演示</h1>
      
      <section>
        <h2>问题示例</h2>
        <ProblematicDeepNestedComponent />
        <ScatteredStateComponent />
        <OverRenderingParent />
        
        <AppContextProvider>
          <UserProfile />
          <ThemeToggle />
        </AppContextProvider>
        
        <ManualAsyncStateComponent />
        <UnnecessaryStateSyncComponent />
        <ComplexReducerComponent />
        <StatePersistenceComponent />
        <StateDependencyComponent />
      </section>
      
      <section>
        <h2>优化示例</h2>
        <OptimizedComponent />
      </section>
    </div>
  );
};

export default StateManagementDemoApp;
