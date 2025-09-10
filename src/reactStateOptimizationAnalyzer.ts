import * as vscode from 'vscode';

export interface ReactStateOptimizationAnalysis {
    stateDesignIssues: StateDesignIssue[];
    rerenderOptimizations: RerenderOptimization[];
    stateArchitectureRecommendations: StateArchitectureRecommendation[];
    contextOptimizations: ContextOptimization[];
    reduxOptimizations: ReduxOptimization[];
    overallScore: {
        stateDesign: number;
        rerenderEfficiency: number;
        architectureQuality: number;
        contextUsage: number;
        reduxOptimization: number;
        overall: number;
    };
}

export interface StateDesignIssue {
    issueType: 'oversized_state' | 'nested_state' | 'derived_state' | 'unnecessary_state' | 'state_duplication';
    component: string;
    line: number;
    severity: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    solution: string;
    codeExample: string;
    performanceGain: string;
}

export interface RerenderOptimization {
    component: string;
    line: number;
    rerenderCause: 'prop_drilling' | 'inline_objects' | 'inline_functions' | 'unnecessary_deps' | 'context_provider';
    frequency: 'high' | 'medium' | 'low';
    optimization: string;
    implementation: string;
    expectedImprovement: string;
    difficulty: 'easy' | 'moderate' | 'hard';
}

export interface StateArchitectureRecommendation {
    pattern: 'flux' | 'reducer' | 'context' | 'zustand' | 'recoil' | 'custom_hooks';
    scenario: string;
    currentImplementation: string;
    recommendedImplementation: string;
    benefits: string[];
    tradeoffs: string[];
    migrationComplexity: 'low' | 'medium' | 'high';
    codeExample: string;
}

export interface ContextOptimization {
    contextName: string;
    line: number;
    issue: 'large_context' | 'frequent_updates' | 'unnecessary_renders' | 'poor_separation';
    optimization: string;
    splitSuggestion: string;
    performanceImprovement: string;
    implementation: string;
}

export interface ReduxOptimization {
    optimizationType: 'selector_optimization' | 'action_batching' | 'reducer_complexity' | 'middleware_optimization';
    location: string;
    line: number;
    currentImplementation: string;
    optimizedImplementation: string;
    benefit: string;
    complexity: 'simple' | 'moderate' | 'complex';
}

export class ReactStateOptimizationAnalyzer {
    
    async analyzeStateOptimization(content: string, fileName: string): Promise<ReactStateOptimizationAnalysis> {
        const lines = content.split('\n');
        
        const stateDesignIssues = this.analyzeStateDesign(lines);
        const rerenderOptimizations = this.analyzeRerenderIssues(lines);
        const stateArchitectureRecommendations = this.analyzeStateArchitecture(lines, content);
        const contextOptimizations = this.analyzeContextUsage(lines);
        const reduxOptimizations = this.analyzeReduxUsage(lines);
        const overallScore = this.calculateOverallScore(
            stateDesignIssues,
            rerenderOptimizations,
            stateArchitectureRecommendations,
            contextOptimizations,
            reduxOptimizations
        );

        return {
            stateDesignIssues,
            rerenderOptimizations,
            stateArchitectureRecommendations,
            contextOptimizations,
            reduxOptimizations,
            overallScore
        };
    }

    private analyzeStateDesign(lines: string[]): StateDesignIssue[] {
        const issues: StateDesignIssue[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测过大的状态对象
            if (trimmed.includes('useState') && trimmed.includes('{')) {
                const stateContent = this.extractStateObject(lines, index);
                const propertyCount = (stateContent.match(/\w+\s*:/g) || []).length;
                
                if (propertyCount > 5) {
                    issues.push({
                        issueType: 'oversized_state',
                        component: this.extractComponentName(lines, index),
                        line: index + 1,
                        severity: 'high',
                        description: `状态对象包含${propertyCount}个属性，过于复杂`,
                        impact: '增加组件复杂度，难以维护，可能导致不必要的重渲染',
                        solution: '拆分为多个useState或使用useReducer',
                        codeExample: `// 替代方案1：拆分状态
const [userInfo, setUserInfo] = useState({ name: '', email: '' });
const [uiState, setUiState] = useState({ loading: false, error: null });

// 替代方案2：使用useReducer
const [state, dispatch] = useReducer(reducer, initialState);`,
                        performanceGain: '减少不必要的重渲染，提高组件性能20-40%'
                    });
                }
            }

            // 检测嵌套状态更新
            if (trimmed.includes('setState') && trimmed.includes('...') && trimmed.includes('.')) {
                issues.push({
                    issueType: 'nested_state',
                    component: this.extractComponentName(lines, index),
                    line: index + 1,
                    severity: 'medium',
                    description: '深度嵌套的状态更新',
                    impact: '代码复杂，容易出错，性能影响',
                    solution: '使用immer库或flattern状态结构',
                    codeExample: `// 使用immer
import { produce } from 'immer';
setUser(produce(draft => {
    draft.profile.address.city = newCity;
}));

// 或者flatten状态
const [userCity, setUserCity] = useState('');`,
                    performanceGain: '简化状态更新逻辑，减少错误'
                });
            }

            // 检测派生状态
            if (trimmed.includes('useState') && lines.slice(index, index + 10).some(l => 
                l.includes('useEffect') && l.includes('setState'))) {
                issues.push({
                    issueType: 'derived_state',
                    component: this.extractComponentName(lines, index),
                    line: index + 1,
                    severity: 'medium',
                    description: '可能存在派生状态',
                    impact: '同步问题，额外的重渲染',
                    solution: '使用useMemo计算派生值',
                    codeExample: `// 避免派生状态
const fullName = useMemo(() => 
    \`\${firstName} \${lastName}\`, [firstName, lastName]
);

// 而不是
useEffect(() => {
    setFullName(\`\${firstName} \${lastName}\`);
}, [firstName, lastName]);`,
                    performanceGain: '避免状态同步问题，减少重渲染'
                });
            }

            // 检测不必要的状态
            if (trimmed.includes('useState') && !lines.slice(index, index + 20).some(l => 
                l.includes('set' + this.extractStateVariableName(trimmed)))) {
                const stateVar = this.extractStateVariableName(trimmed);
                if (stateVar) {
                    issues.push({
                        issueType: 'unnecessary_state',
                        component: this.extractComponentName(lines, index),
                        line: index + 1,
                        severity: 'low',
                        description: `状态变量 ${stateVar} 可能不需要`,
                        impact: '增加组件复杂度，浪费内存',
                        solution: '移除未使用的状态或转换为普通变量',
                        codeExample: `// 如果值不会改变，使用普通变量
const staticValue = calculateValue();

// 如果值可以从props计算，使用useMemo
const derivedValue = useMemo(() => computeValue(props), [props]);`,
                        performanceGain: '减少内存使用，简化组件逻辑'
                    });
                }
            }
        });

        return issues;
    }

    private analyzeRerenderIssues(lines: string[]): RerenderOptimization[] {
        const optimizations: RerenderOptimization[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测内联对象
            if (trimmed.includes('style={{') || trimmed.includes('className={{')) {
                optimizations.push({
                    component: this.extractComponentName(lines, index),
                    line: index + 1,
                    rerenderCause: 'inline_objects',
                    frequency: 'high',
                    optimization: '将内联对象提取为变量或使用useMemo',
                    implementation: `// 优化方案
const styles = useMemo(() => ({
    color: theme.color,
    fontSize: size
}), [theme.color, size]);

// 或者提取到组件外部
const STATIC_STYLES = { padding: 10, margin: 5 };`,
                    expectedImprovement: '避免每次渲染创建新对象，减少子组件重渲染',
                    difficulty: 'easy'
                });
            }

            // 检测内联函数
            if (trimmed.includes('onClick={() =>') || trimmed.includes('onChange={(')) {
                optimizations.push({
                    component: this.extractComponentName(lines, index),
                    line: index + 1,
                    rerenderCause: 'inline_functions',
                    frequency: 'high',
                    optimization: '使用useCallback缓存函数',
                    implementation: `// 优化方案
const handleClick = useCallback(() => {
    // 处理逻辑
}, [dependencies]);

// 然后使用
<button onClick={handleClick}>Click</button>`,
                    expectedImprovement: '避免每次渲染创建新函数，减少子组件重渲染',
                    difficulty: 'easy'
                });
            }

            // 检测Context Provider重渲染
            if (trimmed.includes('Provider') && trimmed.includes('value={{')) {
                optimizations.push({
                    component: this.extractComponentName(lines, index),
                    line: index + 1,
                    rerenderCause: 'context_provider',
                    frequency: 'high',
                    optimization: '缓存Context值',
                    implementation: `// 优化方案
const contextValue = useMemo(() => ({
    state,
    actions: {
        updateState,
        resetState
    }
}), [state, updateState, resetState]);

<Context.Provider value={contextValue}>`,
                    expectedImprovement: '避免所有Context消费者不必要的重渲染',
                    difficulty: 'moderate'
                });
            }

            // 检测prop drilling
            if (this.detectPropDrilling(lines, index)) {
                optimizations.push({
                    component: this.extractComponentName(lines, index),
                    line: index + 1,
                    rerenderCause: 'prop_drilling',
                    frequency: 'medium',
                    optimization: '使用Context或状态管理库',
                    implementation: `// 使用Context替代prop drilling
const DataContext = createContext();

// 提供数据
<DataContext.Provider value={data}>
  <DeepChild />
</DataContext.Provider>

// 在深层组件中使用
const data = useContext(DataContext);`,
                    expectedImprovement: '减少中间组件不必要的重渲染',
                    difficulty: 'moderate'
                });
            }
        });

        return optimizations;
    }

    private analyzeStateArchitecture(lines: string[], content: string): StateArchitectureRecommendation[] {
        const recommendations: StateArchitectureRecommendation[] = [];

        // 检测复杂状态逻辑，建议使用useReducer
        const stateCount = (content.match(/useState/g) || []).length;
        const complexStateUpdates = (content.match(/setState.*\.\.\./g) || []).length;
        
        if (stateCount > 5 && complexStateUpdates > 3) {
            recommendations.push({
                pattern: 'reducer',
                scenario: '复杂的状态逻辑和多个相关状态',
                currentImplementation: '多个useState + 复杂的状态更新',
                recommendedImplementation: 'useReducer集中管理状态',
                benefits: [
                    '更清晰的状态更新逻辑',
                    '更好的可测试性',
                    '减少状态同步问题',
                    '更好的性能优化机会'
                ],
                tradeoffs: [
                    '初始设置较复杂',
                    '需要定义action types',
                    '增加代码量'
                ],
                migrationComplexity: 'medium',
                codeExample: `// useReducer实现
const initialState = {
    users: [],
    loading: false,
    error: null,
    filters: {}
};

function userReducer(state, action) {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, users: action.payload };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
}

const [state, dispatch] = useReducer(userReducer, initialState);`
            });
        }

        // 检测全局状态需求，建议状态管理库
        const contextUsage = (content.match(/useContext/g) || []).length;
        const propPassing = (content.match(/props\.\w+/g) || []).length;
        
        if (contextUsage > 3 || propPassing > 10) {
            recommendations.push({
                pattern: 'zustand',
                scenario: '多个组件需要共享状态',
                currentImplementation: 'Context API或prop drilling',
                recommendedImplementation: 'Zustand状态管理',
                benefits: [
                    '更好的性能',
                    '更简单的API',
                    '更好的TypeScript支持',
                    '减少样板代码'
                ],
                tradeoffs: [
                    '额外的依赖',
                    '学习成本',
                    '可能过度工程化小型应用'
                ],
                migrationComplexity: 'low',
                codeExample: `// Zustand store
import { create } from 'zustand';

const useUserStore = create((set) => ({
    users: [],
    loading: false,
    fetchUsers: async () => {
        set({ loading: true });
        const users = await api.getUsers();
        set({ users, loading: false });
    },
}));

// 在组件中使用
const { users, loading, fetchUsers } = useUserStore();`
            });
        }

        return recommendations;
    }

    private analyzeContextUsage(lines: string[]): ContextOptimization[] {
        const optimizations: ContextOptimization[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测大型Context
            if (trimmed.includes('createContext') || trimmed.includes('Provider')) {
                const contextValue = this.extractContextValue(lines, index);
                const valueSize = (contextValue.match(/\w+\s*:/g) || []).length;
                
                if (valueSize > 5) {
                    optimizations.push({
                        contextName: this.extractContextName(lines, index),
                        line: index + 1,
                        issue: 'large_context',
                        optimization: '拆分Context为多个小型Context',
                        splitSuggestion: '按功能域拆分Context',
                        performanceImprovement: '减少不必要的重渲染，提高性能30-60%',
                        implementation: `// 拆分Context
const UserContext = createContext(); // 用户相关状态
const UIContext = createContext();   // UI相关状态
const DataContext = createContext(); // 数据相关状态

// 分别提供
<UserContext.Provider value={userState}>
  <UIContext.Provider value={uiState}>
    <DataContext.Provider value={dataState}>
      <App />
    </DataContext.Provider>
  </UIContext.Provider>
</UserContext.Provider>`
                    });
                }
            }

            // 检测频繁更新的Context
            if (trimmed.includes('Provider') && 
                lines.slice(index - 5, index + 5).some(l => l.includes('useState'))) {
                optimizations.push({
                    contextName: this.extractContextName(lines, index),
                    line: index + 1,
                    issue: 'frequent_updates',
                    optimization: '使用useCallback和useMemo优化Context值',
                    splitSuggestion: '将频繁变化的值和稳定的值分开',
                    performanceImprovement: '减少Context消费者重渲染频率',
                    implementation: `// 优化Context值
const contextValue = useMemo(() => ({
    // 稳定的值
    config,
    utils,
    // 变化的值
    state
}), [config, utils, state]);

// 或者分离频繁变化的值
const StableContext = createContext(stableValues);
const DynamicContext = createContext(dynamicValues);`
                });
            }
        });

        return optimizations;
    }

    private analyzeReduxUsage(lines: string[]): ReduxOptimization[] {
        const optimizations: ReduxOptimization[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测选择器优化机会
            if (trimmed.includes('useSelector') && !trimmed.includes('createSelector')) {
                optimizations.push({
                    optimizationType: 'selector_optimization',
                    location: 'Component',
                    line: index + 1,
                    currentImplementation: '直接使用useSelector',
                    optimizedImplementation: '使用createSelector创建记忆化选择器',
                    benefit: '避免不必要的重计算和重渲染',
                    complexity: 'moderate'
                });
            }

            // 检测Reducer复杂度
            if (trimmed.includes('case') && lines.slice(index - 10, index + 10).filter(l => 
                l.trim().startsWith('case')).length > 10) {
                optimizations.push({
                    optimizationType: 'reducer_complexity',
                    location: 'Reducer',
                    line: index + 1,
                    currentImplementation: '单一大型reducer',
                    optimizedImplementation: '拆分为多个小型reducer并使用combineReducers',
                    benefit: '提高代码可维护性和测试性',
                    complexity: 'complex'
                });
            }

            // 检测Action批处理机会
            if (trimmed.includes('dispatch') && 
                lines.slice(index, index + 5).filter(l => l.includes('dispatch')).length > 2) {
                optimizations.push({
                    optimizationType: 'action_batching',
                    location: 'Component',
                    line: index + 1,
                    currentImplementation: '多个单独的dispatch调用',
                    optimizedImplementation: '使用unstable_batchedUpdates批处理',
                    benefit: '减少不必要的重渲染',
                    complexity: 'simple'
                });
            }
        });

        return optimizations;
    }

    private calculateOverallScore(
        stateDesignIssues: StateDesignIssue[],
        rerenderOptimizations: RerenderOptimization[],
        stateArchitectureRecommendations: StateArchitectureRecommendation[],
        contextOptimizations: ContextOptimization[],
        reduxOptimizations: ReduxOptimization[]
    ) {
        // 状态设计评分
        const highStateIssues = stateDesignIssues.filter(i => i.severity === 'high').length;
        const stateDesignScore = Math.max(0, 100 - (highStateIssues * 25) - (stateDesignIssues.length * 10));

        // 重渲染效率评分
        const highFreqRerenders = rerenderOptimizations.filter(r => r.frequency === 'high').length;
        const rerenderScore = Math.max(0, 100 - (highFreqRerenders * 30) - (rerenderOptimizations.length * 15));

        // 架构质量评分
        const highComplexityRecommendations = stateArchitectureRecommendations.filter(r => 
            r.migrationComplexity === 'high').length;
        const architectureScore = Math.max(30, 100 - (highComplexityRecommendations * 25));

        // Context使用评分
        const contextScore = Math.max(0, 100 - (contextOptimizations.length * 20));

        // Redux优化评分
        const complexReduxOptimizations = reduxOptimizations.filter(r => r.complexity === 'complex').length;
        const reduxScore = Math.max(50, 100 - (complexReduxOptimizations * 30) - (reduxOptimizations.length * 15));

        // 总分
        const overallScore = Math.round(
            (stateDesignScore * 0.25 + rerenderScore * 0.25 + architectureScore * 0.2 + 
             contextScore * 0.15 + reduxScore * 0.15)
        );

        return {
            stateDesign: Math.round(stateDesignScore),
            rerenderEfficiency: Math.round(rerenderScore),
            architectureQuality: Math.round(architectureScore),
            contextUsage: Math.round(contextScore),
            reduxOptimization: Math.round(reduxScore),
            overall: overallScore
        };
    }

    // 辅助方法
    private extractComponentName(lines: string[], index: number): string {
        for (let i = index; i >= 0 && i >= index - 20; i--) {
            const line = lines[i].trim();
            const match = line.match(/(?:function|const)\s+(\w+)|export\s+(?:default\s+)?(?:function\s+)?(\w+)/);
            if (match) {
                return match[1] || match[2] || 'Unknown';
            }
        }
        return 'Unknown';
    }

    private extractStateObject(lines: string[], index: number): string {
        // 简化实现：假设状态对象在同一行或下几行
        let content = lines[index];
        for (let i = index + 1; i < lines.length && i < index + 10; i++) {
            content += lines[i];
            if (lines[i].includes('}')) break;
        }
        return content;
    }

    private extractStateVariableName(line: string): string {
        const match = line.match(/\[(\w+),/);
        return match ? match[1] : '';
    }

    private extractContextName(lines: string[], index: number): string {
        const line = lines[index];
        const match = line.match(/(\w+)Context|createContext/);
        return match ? match[1] + 'Context' : 'UnknownContext';
    }

    private extractContextValue(lines: string[], index: number): string {
        // 查找Context Provider的value属性
        for (let i = index; i < lines.length && i < index + 10; i++) {
            if (lines[i].includes('value={')) {
                return lines[i];
            }
        }
        return '';
    }

    private detectPropDrilling(lines: string[], index: number): boolean {
        // 简化检测：查看是否有多层props传递
        const propPattern = /props\.\w+/g;
        const nearbyLines = lines.slice(Math.max(0, index - 5), index + 5);
        const propCount = nearbyLines.join('').match(propPattern)?.length || 0;
        return propCount > 3;
    }
}
