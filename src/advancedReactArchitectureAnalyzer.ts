import * as vscode from 'vscode';

export interface ReactArchitecturePattern {
    pattern: string;
    name: string;
    description: string;
    line: number;
    confidence: number;
    benefits: string[];
    concerns: string[];
    suggestions: string[];
}

export interface ReactComponentHierarchy {
    component: string;
    level: number;
    children: string[];
    props: string[];
    context: string[];
    line: number;
}

export interface ReactStateManagement {
    type: 'redux' | 'zustand' | 'recoil' | 'context' | 'local';
    store: string;
    actions: string[];
    selectors: string[];
    middleware: string[];
    line: number;
    complexity: 'low' | 'medium' | 'high';
}

export interface ReactRenderOptimization {
    component: string;
    optimization: string;
    type: 'memo' | 'useMemo' | 'useCallback' | 'lazy' | 'suspense';
    impact: 'high' | 'medium' | 'low';
    line: number;
    dependencies: string[];
}

export interface ReactCodeSplitting {
    type: 'route' | 'component' | 'vendor';
    entry: string;
    chunks: string[];
    size: string;
    loading: string;
    line: number;
}

export interface ReactAdvancedArchitectureAnalysis {
    architecturePatterns: ReactArchitecturePattern[];
    componentHierarchy: ReactComponentHierarchy[];
    stateManagement: ReactStateManagement[];
    renderOptimizations: ReactRenderOptimization[];
    codeSplitting: ReactCodeSplitting[];
}

export class AdvancedReactArchitectureAnalyzer {
    
    analyze(content: string, fileName: string): ReactAdvancedArchitectureAnalysis {
        const lines = content.split('\n');
        
        return {
            architecturePatterns: this.analyzeArchitecturePatterns(lines),
            componentHierarchy: this.analyzeComponentHierarchy(lines),
            stateManagement: this.analyzeStateManagement(lines),
            renderOptimizations: this.analyzeRenderOptimizations(lines),
            codeSplitting: this.analyzeCodeSplitting(lines)
        };
    }

    private analyzeArchitecturePatterns(lines: string[]): ReactArchitecturePattern[] {
        const patterns: ReactArchitecturePattern[] = [];
        
        lines.forEach((line, index) => {
            // Compound Component Pattern
            if (line.includes('React.Children') || line.includes('cloneElement')) {
                patterns.push({
                    pattern: 'compound-component',
                    name: '复合组件模式',
                    description: '使用React.Children和cloneElement实现的复合组件',
                    line: index + 1,
                    confidence: 0.8,
                    benefits: ['组件组合灵活', '逻辑封装清晰', 'API简洁'],
                    concerns: ['实现复杂度较高', '性能开销'],
                    suggestions: ['考虑使用Context减少prop drilling', '添加组件验证']
                });
            }

            // Render Props Pattern
            if (line.match(/render\s*[=:]\s*\{?\s*\(?.*\)?\s*=>/)) {
                patterns.push({
                    pattern: 'render-props',
                    name: 'Render Props模式',
                    description: '通过render prop共享代码的模式',
                    line: index + 1,
                    confidence: 0.9,
                    benefits: ['代码复用性高', '逻辑抽象清晰'],
                    concerns: ['可能造成wrapper hell', '调试困难'],
                    suggestions: ['考虑使用自定义Hook替代', '限制嵌套层级']
                });
            }

            // Higher-Order Component
            if (line.match(/^(export\s+)?(const|function)\s+with[A-Z]\w*/) || 
                line.includes('withRouter') || line.includes('withAuth')) {
                patterns.push({
                    pattern: 'hoc',
                    name: '高阶组件模式',
                    description: '通过HOC增强组件功能',
                    line: index + 1,
                    confidence: 0.85,
                    benefits: ['横切关注点分离', '代码复用'],
                    concerns: ['refs传递问题', 'displayName丢失', 'props类型推导困难'],
                    suggestions: ['迁移到Hooks', '使用forwardRef处理refs', '添加displayName']
                });
            }

            // Provider Pattern
            if (line.includes('Provider') && line.includes('value=')) {
                patterns.push({
                    pattern: 'provider',
                    name: 'Provider模式',
                    description: 'Context Provider提供全局状态',
                    line: index + 1,
                    confidence: 0.9,
                    benefits: ['避免prop drilling', '全局状态管理'],
                    concerns: ['重渲染性能影响', '依赖关系复杂'],
                    suggestions: ['拆分Context避免不必要重渲染', '使用useMemo优化value']
                });
            }

            // Container/Presentational Pattern
            if (line.includes('Container') || (line.includes('connect') && line.includes('mapStateToProps'))) {
                patterns.push({
                    pattern: 'container-presentational',
                    name: '容器/展示组件模式',
                    description: '分离业务逻辑和UI展示',
                    line: index + 1,
                    confidence: 0.8,
                    benefits: ['关注点分离', '测试友好', '复用性好'],
                    concerns: ['文件数量增加', '样板代码'],
                    suggestions: ['考虑使用Hooks简化', '保持组件职责单一']
                });
            }
        });

        return patterns;
    }

    private analyzeComponentHierarchy(lines: string[]): ReactComponentHierarchy[] {
        const hierarchy: ReactComponentHierarchy[] = [];
        let currentComponent = '';
        let level = 0;

        lines.forEach((line, index) => {
            // 检测组件定义
            const componentMatch = line.match(/(?:export\s+)?(?:const|function)\s+([A-Z]\w+)/);
            if (componentMatch) {
                currentComponent = componentMatch[1];
                level = 0;
                
                // 分析props
                const propsMatch = line.match(/\(\s*\{\s*([^}]+)\s*\}/);
                const props = propsMatch ? propsMatch[1].split(',').map(p => p.trim()) : [];

                hierarchy.push({
                    component: currentComponent,
                    level: level,
                    children: [],
                    props: props,
                    context: [],
                    line: index + 1
                });
            }

            // 检测组件使用
            const usageMatch = line.match(/<([A-Z]\w+)/g);
            if (usageMatch && currentComponent) {
                const children = usageMatch.map(match => match.substring(1));
                const current = hierarchy.find(h => h.component === currentComponent);
                if (current) {
                    current.children.push(...children);
                }
            }

            // 检测Context使用
            if (line.includes('useContext')) {
                const contextMatch = line.match(/useContext\((\w+)\)/);
                if (contextMatch && currentComponent) {
                    const current = hierarchy.find(h => h.component === currentComponent);
                    if (current) {
                        current.context.push(contextMatch[1]);
                    }
                }
            }
        });

        return hierarchy;
    }

    private analyzeStateManagement(lines: string[]): ReactStateManagement[] {
        const stateManagement: ReactStateManagement[] = [];

        lines.forEach((line, index) => {
            // Redux
            if (line.includes('createStore') || line.includes('configureStore')) {
                stateManagement.push({
                    type: 'redux',
                    store: 'Redux Store',
                    actions: [],
                    selectors: [],
                    middleware: this.extractMiddleware(line),
                    line: index + 1,
                    complexity: 'high'
                });
            }

            // Zustand
            if (line.includes('create') && line.includes('set') && line.includes('get')) {
                stateManagement.push({
                    type: 'zustand',
                    store: 'Zustand Store',
                    actions: [],
                    selectors: [],
                    middleware: [],
                    line: index + 1,
                    complexity: 'medium'
                });
            }

            // Recoil
            if (line.includes('atom') || line.includes('selector')) {
                stateManagement.push({
                    type: 'recoil',
                    store: 'Recoil Atom/Selector',
                    actions: [],
                    selectors: [],
                    middleware: [],
                    line: index + 1,
                    complexity: 'medium'
                });
            }

            // Context
            if (line.includes('createContext')) {
                stateManagement.push({
                    type: 'context',
                    store: 'React Context',
                    actions: [],
                    selectors: [],
                    middleware: [],
                    line: index + 1,
                    complexity: 'low'
                });
            }
        });

        return stateManagement;
    }

    private analyzeRenderOptimizations(lines: string[]): ReactRenderOptimization[] {
        const optimizations: ReactRenderOptimization[] = [];

        lines.forEach((line, index) => {
            // React.memo
            if (line.includes('React.memo') || line.includes('memo(')) {
                optimizations.push({
                    component: this.extractComponentName(line),
                    optimization: 'React.memo包装',
                    type: 'memo',
                    impact: 'high',
                    line: index + 1,
                    dependencies: []
                });
            }

            // useMemo
            if (line.includes('useMemo')) {
                const depsMatch = line.match(/\[([^\]]*)\]/);
                const dependencies = depsMatch ? depsMatch[1].split(',').map(d => d.trim()) : [];
                
                optimizations.push({
                    component: '当前组件',
                    optimization: 'useMemo缓存计算结果',
                    type: 'useMemo',
                    impact: dependencies.length > 3 ? 'high' : 'medium',
                    line: index + 1,
                    dependencies: dependencies
                });
            }

            // useCallback
            if (line.includes('useCallback')) {
                const depsMatch = line.match(/\[([^\]]*)\]/);
                const dependencies = depsMatch ? depsMatch[1].split(',').map(d => d.trim()) : [];
                
                optimizations.push({
                    component: '当前组件',
                    optimization: 'useCallback缓存函数',
                    type: 'useCallback',
                    impact: 'medium',
                    line: index + 1,
                    dependencies: dependencies
                });
            }

            // React.lazy
            if (line.includes('React.lazy') || line.includes('lazy(')) {
                optimizations.push({
                    component: this.extractComponentName(line),
                    optimization: '懒加载组件',
                    type: 'lazy',
                    impact: 'high',
                    line: index + 1,
                    dependencies: []
                });
            }

            // Suspense
            if (line.includes('<Suspense')) {
                optimizations.push({
                    component: 'Suspense边界',
                    optimization: '异步组件加载',
                    type: 'suspense',
                    impact: 'high',
                    line: index + 1,
                    dependencies: []
                });
            }
        });

        return optimizations;
    }

    private analyzeCodeSplitting(lines: string[]): ReactCodeSplitting[] {
        const splitting: ReactCodeSplitting[] = [];

        lines.forEach((line, index) => {
            // Dynamic import
            if (line.includes('import(') && line.includes('.then')) {
                splitting.push({
                    type: 'component',
                    entry: this.extractImportPath(line),
                    chunks: ['async'],
                    size: '未知',
                    loading: 'dynamic',
                    line: index + 1
                });
            }

            // Route-based splitting
            if (line.includes('React.lazy') && line.includes('Route')) {
                splitting.push({
                    type: 'route',
                    entry: this.extractImportPath(line),
                    chunks: ['route'],
                    size: '未知',
                    loading: 'route-based',
                    line: index + 1
                });
            }
        });

        return splitting;
    }

    private extractMiddleware(line: string): string[] {
        const middleware: string[] = [];
        if (line.includes('thunk')) middleware.push('redux-thunk');
        if (line.includes('saga')) middleware.push('redux-saga');
        if (line.includes('logger')) middleware.push('redux-logger');
        if (line.includes('persist')) middleware.push('redux-persist');
        return middleware;
    }

    private extractComponentName(line: string): string {
        const match = line.match(/([A-Z]\w+)/);
        return match ? match[1] : '未知组件';
    }

    private extractImportPath(line: string): string {
        const match = line.match(/import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
        return match ? match[1] : '未知路径';
    }
}
