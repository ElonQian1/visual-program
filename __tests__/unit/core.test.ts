// 🧪 核心功能测试套件
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// 导入要测试的模块
import { CodeAnalyzer } from '../../src/codeAnalyzer';
import { ReactAnalyzer } from '../../src/reactAnalyzer';
import { RustAnalyzer } from '../../src/rustAnalyzer';
import { PerformanceMonitor } from '../../src/performanceMonitor';
import { ErrorHandler } from '../../src/errorHandler';
import { UserGuidanceSystem } from '../../src/userGuidanceSystem';
import { FileBasedCollaborationSystem } from '../../src/fileBasedCollaborationSystem';

// Mocha测试框架类型声明
declare const suite: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => void | Promise<void>) => void;
declare const setup: (fn: () => void | Promise<void>) => void;
declare const teardown: (fn: () => void | Promise<void>) => void;

// 测试辅助函数
export class TestHelper {
    static async createTestFile(content: string, fileName: string, language: string = 'typescript'): Promise<vscode.TextDocument> {
        const testUri = vscode.Uri.file(path.join(__dirname, '..', '..', '__tests__', 'fixtures', fileName));
        
        // 确保目录存在
        const dir = path.dirname(testUri.fsPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 写入测试文件
        fs.writeFileSync(testUri.fsPath, content, 'utf8');

        // 打开文档
        const document = await vscode.workspace.openTextDocument(testUri);
        return document;
    }

    static async cleanupTestFiles(): Promise<void> {
        const fixturesDir = path.join(__dirname, '..', '..', '__tests__', 'fixtures');
        if (fs.existsSync(fixturesDir)) {
            fs.rmSync(fixturesDir, { recursive: true, force: true });
        }
    }

    static createMockWorkspaceConfiguration(values: Record<string, any>): any {
        return {
            get: (key: string) => values[key],
            has: (key: string) => key in values,
            inspect: () => undefined,
            update: () => Promise.resolve()
        };
    }
}

// 1. 代码分析器测试
suite('CodeAnalyzer Tests', () => {
    let analyzer: CodeAnalyzer;

    setup(() => {
        analyzer = new CodeAnalyzer();
    });

    teardown(async () => {
        await TestHelper.cleanupTestFiles();
    });

    test('分析React函数组件', async () => {
        const reactCode = `
import React, { useState, useEffect } from 'react';

interface UserProps {
    name: string;
    age: number;
}

const UserProfile: React.FC<UserProps> = ({ name, age }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, [name]);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(\`/api/users/\${name}\`);
            const data = await response.json();
            setUserData(data);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="user-profile">
            <h2>{name}</h2>
            <p>Age: {age}</p>
            {userData && <pre>{JSON.stringify(userData, null, 2)}</pre>}
        </div>
    );
};

export default UserProfile;
        `;

        const document = await TestHelper.createTestFile(reactCode, 'UserProfile.tsx');
        const result = await analyzer.analyzeDocument(document);

        assert.strictEqual(result.language, 'typescript');
        assert.ok(result.functions.length > 0);
        assert.ok(result.components.length > 0);
        assert.ok(result.interfaces.length > 0);
        
        // 检查组件信息
        const component = result.components.find(c => c.name === 'UserProfile');
        assert.ok(component);
        assert.strictEqual(component.type, 'functional');
        assert.ok(component.hooks && component.hooks.length > 0);
        
        // 检查Hook使用
        const hasUseState = component.hooks.some(h => h.name === 'useState');
        const hasUseEffect = component.hooks.some(h => h.name === 'useEffect');
        assert.ok(hasUseState);
        assert.ok(hasUseEffect);
    });

    test('分析Rust结构体和实现', async () => {
        const rustCode = `
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug)]
pub struct UserManager {
    users: HashMap<u64, User>,
    next_id: u64,
}

impl UserManager {
    pub fn new() -> Self {
        Self {
            users: HashMap::new(),
            next_id: 1,
        }
    }

    pub fn create_user(&mut self, name: String, email: String) -> Result<u64, String> {
        if name.is_empty() {
            return Err("Name cannot be empty".to_string());
        }

        if !email.contains('@') {
            return Err("Invalid email format".to_string());
        }

        let user = User {
            id: self.next_id,
            name,
            email,
            created_at: chrono::Utc::now(),
        };

        self.users.insert(self.next_id, user);
        let id = self.next_id;
        self.next_id += 1;
        Ok(id)
    }

    pub fn get_user(&self, id: u64) -> Option<&User> {
        self.users.get(&id)
    }

    pub fn update_user(&mut self, id: u64, name: Option<String>, email: Option<String>) -> Result<(), String> {
        let user = self.users.get_mut(&id)
            .ok_or("User not found")?;

        if let Some(new_name) = name {
            if new_name.is_empty() {
                return Err("Name cannot be empty".to_string());
            }
            user.name = new_name;
        }

        if let Some(new_email) = email {
            if !new_email.contains('@') {
                return Err("Invalid email format".to_string());
            }
            user.email = new_email;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_user() {
        let mut manager = UserManager::new();
        let result = manager.create_user("John Doe".to_string(), "john@example.com".to_string());
        assert!(result.is_ok());
    }
}
        `;

        const document = await TestHelper.createTestFile(rustCode, 'user_manager.rs');
        const result = await analyzer.analyzeDocument(document);

        assert.strictEqual(result.language, 'rust');
        assert.ok(result.structs.length > 0);
        assert.ok(result.functions.length > 0);
        assert.ok(result.impls.length > 0);

        // 检查结构体
        const userStruct = result.structs.find(s => s.name === 'User');
        const userManagerStruct = result.structs.find(s => s.name === 'UserManager');
        assert.ok(userStruct);
        assert.ok(userManagerStruct);

        // 检查实现块
        const userManagerImpl = result.impls.find(i => i.target === 'UserManager');
        assert.ok(userManagerImpl);
        assert.ok(userManagerImpl.methods.length > 0);
    });

    test('计算代码复杂度', async () => {
        const complexCode = `
function complexFunction(x: number, y: number): number {
    if (x > 0) {
        if (y > 0) {
            for (let i = 0; i < x; i++) {
                if (i % 2 === 0) {
                    y += i;
                } else {
                    y -= i;
                }
            }
        } else {
            switch (y) {
                case -1:
                    return x * -1;
                case -2:
                    return x * -2;
                default:
                    return x;
            }
        }
    } else if (x < 0) {
        try {
            return Math.abs(x) + y;
        } catch (error) {
            return 0;
        }
    }
    return x + y;
}
        `;

        const document = await TestHelper.createTestFile(complexCode, 'complex.ts');
        const result = await analyzer.analyzeDocument(document);

        const func = result.functions.find(f => f.name === 'complexFunction');
        assert.ok(func);
        assert.ok(func.complexity && func.complexity > 5); // 期望较高的复杂度
    });
});

// 2. React分析器测试
suite('ReactAnalyzer Tests', () => {
    let analyzer: ReactAnalyzer;

    setup(() => {
        analyzer = new ReactAnalyzer();
    });

    test('检测React Hook模式', async () => {
        const hookCode = `
import { useState, useEffect, useCallback, useMemo } from 'react';

const useUserData = (userId: string) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUser = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(\`/api/users/\${userId}\`);
            const userData = await response.json();
            setUser(userData);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const memoizedUser = useMemo(() => {
        return user ? { ...user, displayName: \`\${user.firstName} \${user.lastName}\` } : null;
    }, [user]);

    return { user: memoizedUser, loading, error, refetch: fetchUser };
};
        `;

        const document = await TestHelper.createTestFile(hookCode, 'useUserData.ts');
        const result = await analyzer.analyzeReactPatterns(document);

        assert.ok(result.customHooks.length > 0);
        const customHook = result.customHooks.find(h => h.name === 'useUserData');
        assert.ok(customHook);
        assert.ok(customHook.usedHooks.includes('useState'));
        assert.ok(customHook.usedHooks.includes('useEffect'));
        assert.ok(customHook.usedHooks.includes('useCallback'));
        assert.ok(customHook.usedHooks.includes('useMemo'));
    });

    test('分析组件状态管理模式', async () => {
        const stateManagementCode = `
import React, { useReducer, useContext, createContext } from 'react';

interface AppState {
    user: User | null;
    theme: 'light' | 'dark';
    notifications: Notification[];
}

type AppAction = 
    | { type: 'SET_USER'; payload: User }
    | { type: 'TOGGLE_THEME' }
    | { type: 'ADD_NOTIFICATION'; payload: Notification };

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };
        case 'TOGGLE_THEME':
            return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [...state.notifications, action.payload] };
        default:
            return state;
    }
};

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | null>(null);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, {
        user: null,
        theme: 'light',
        notifications: []
    });

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};
        `;

        const document = await TestHelper.createTestFile(stateManagementCode, 'AppProvider.tsx');
        const result = await analyzer.analyzeReactPatterns(document);

        assert.ok(result.stateManagement.patterns.includes('useReducer'));
        assert.ok(result.stateManagement.patterns.includes('Context'));
        assert.ok(result.components.some(c => c.name === 'AppProvider'));
    });
});

// 3. 性能监控测试
suite('PerformanceMonitor Tests', () => {
    let monitor: PerformanceMonitor;

    setup(() => {
        monitor = PerformanceMonitor.getInstance();
    });

    test('记录操作指标', async () => {
        const operationId = monitor.startOperation('test-analysis');
        
        // 模拟一些工作
        await new Promise(resolve => setTimeout(resolve, 100));
        
        monitor.endOperation(operationId);
        
        const metrics = monitor.getMetrics();
        assert.ok(metrics.operations.length > 0);
        
        const operation = metrics.operations.find(op => op.name === 'test-analysis');
        assert.ok(operation);
        assert.ok(operation.duration >= 100);
    });

    test('检测性能瓶颈', async () => {
        // 创建一个慢操作
        const slowOperationId = monitor.startOperation('slow-operation');
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5秒
        monitor.endOperation(slowOperationId);

        const insights = await monitor.generatePerformanceInsights();
        assert.ok(insights.bottlenecks.length > 0);
        
        const bottleneck = insights.bottlenecks.find(b => b.operation === 'slow-operation');
        assert.ok(bottleneck);
        assert.strictEqual(bottleneck.severity, 'high');
    });
});

// 4. 错误处理测试
suite('ErrorHandler Tests', () => {
    let errorHandler: ErrorHandler;

    setup(() => {
        errorHandler = ErrorHandler.getInstance();
    });

    test('处理不同类型的错误', async () => {
        const syntaxError = new SyntaxError('Unexpected token');
        const recoveryActions = await errorHandler.handleError(syntaxError, 'code-analysis');

        assert.ok(recoveryActions.length > 0);
        assert.ok(recoveryActions.some(action => action.type === 'retry'));
    });

    test('生成错误恢复建议', async () => {
        const typeError = new TypeError('Cannot read property of undefined');
        const recoveryActions = await errorHandler.handleError(typeError, 'visualization');

        assert.ok(recoveryActions.length > 0);
        const suggestion = recoveryActions.find(action => action.type === 'fix-suggestion');
        assert.ok(suggestion);
        assert.ok(suggestion.description.includes('检查变量'));
    });
});

// 5. 用户引导系统测试
suite('UserGuidanceSystem Tests', () => {
    let guidanceSystem: UserGuidanceSystem;

    setup(() => {
        guidanceSystem = UserGuidanceSystem.getInstance();
    });

    test('获取用户进度', () => {
        const progress = guidanceSystem.getUserProgress();
        assert.ok(Array.isArray(progress.completedTutorials));
    });

    test('重置用户进度', () => {
        guidanceSystem.resetProgress();
        const progress = guidanceSystem.getUserProgress();
        assert.strictEqual(progress.completedTutorials.length, 0);
    });
});

// 6. 协作系统测试
suite('FileBasedCollaborationSystem Tests', () => {
    let collaborationSystem: FileBasedCollaborationSystem;

    setup(() => {
        collaborationSystem = FileBasedCollaborationSystem.getInstance();
    });

    test('检查初始状态', () => {
        assert.strictEqual(collaborationSystem.isInSession(), false);
        assert.strictEqual(collaborationSystem.getCurrentSession(), undefined);
    });

    // 注意：由于协作系统需要实际的工作区，这里只测试基本状态
    // 完整的协作测试需要在集成测试中进行
});

// 7. 集成测试
suite('Integration Tests', () => {
    test('完整的代码分析流程', async () => {
        const testCode = `
import React, { useState, useEffect } from 'react';

interface Props {
    initialValue: number;
}

const Counter: React.FC<Props> = ({ initialValue }) => {
    const [count, setCount] = useState(initialValue);

    useEffect(() => {
        document.title = \`Count: \${count}\`;
    }, [count]);

    const increment = () => setCount(prev => prev + 1);
    const decrement = () => setCount(prev => prev - 1);

    return (
        <div>
            <h1>{count}</h1>
            <button onClick={increment}>+</button>
            <button onClick={decrement}>-</button>
        </div>
    );
};

export default Counter;
        `;

        const document = await TestHelper.createTestFile(testCode, 'Counter.tsx');
        
        // 代码分析
        const codeAnalyzer = new CodeAnalyzer();
        const analysisResult = await codeAnalyzer.analyzeDocument(document);
        
        // React分析
        const reactAnalyzer = new ReactAnalyzer();
        const reactResult = await reactAnalyzer.analyzeReactPatterns(document);
        
        // 验证分析结果
        assert.ok(analysisResult.components.length > 0);
        assert.ok(reactResult.components.length > 0);
        
        const component = analysisResult.components[0];
        assert.strictEqual(component.name, 'Counter');
        assert.strictEqual(component.type, 'functional');
        assert.ok(component.hooks && component.hooks.length >= 2); // useState, useEffect
        
        await TestHelper.cleanupTestFiles();
    });

    test('性能监控集成', async () => {
        const monitor = PerformanceMonitor.getInstance();
        const analyzer = new CodeAnalyzer();
        
        const testCode = 'const x = 1; const y = 2; const z = x + y;';
        const document = await TestHelper.createTestFile(testCode, 'simple.ts');
        
        const operationId = monitor.startOperation('integration-test');
        await analyzer.analyzeDocument(document);
        monitor.endOperation(operationId);
        
        const metrics = monitor.getMetrics();
        assert.ok(metrics.operations.length > 0);
        
        await TestHelper.cleanupTestFiles();
    });
});

// 运行测试辅助函数
export async function runAllTests(): Promise<void> {
    console.log('🧪 开始运行Visual Programming Extension测试套件...');
    
    try {
        // 这里在实际VS Code环境中会由测试运行器执行
        // 目前只是定义了测试结构
        console.log('✅ 所有测试准备就绪');
        console.log('📝 请在VS Code测试视图中运行测试，或使用 npm test 命令');
        
    } catch (error) {
        console.error('❌ 测试运行失败:', error);
        throw error;
    }
}
