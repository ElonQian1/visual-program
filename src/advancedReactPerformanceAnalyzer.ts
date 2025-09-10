import * as vscode from 'vscode';

// React性能分析
export interface ReactPerformance {
    renderOptimizations: RenderOptimization[];
    bundleAnalysis: BundleAnalysis;
    memoryUsage: MemoryUsage[];
    loadPerformance: LoadPerformance;
}

export interface RenderOptimization {
    component: string;
    issue: 'unnecessary-render' | 'missing-memo' | 'heavy-computation' | 'large-list';
    description: string;
    suggestion: string;
    line: number;
}

export interface BundleAnalysis {
    codesplitting: CodeSplitting[];
    lazyLoading: LazyLoading[];
    unusedImports: UnusedImport[];
    largeComponents: LargeComponent[];
}

export interface CodeSplitting {
    component: string;
    route: string;
    canBeLazy: boolean;
    suggestion: string;
    line: number;
}

export interface LazyLoading {
    component: string;
    isLazy: boolean;
    shouldBeLazy: boolean;
    line: number;
}

export interface UnusedImport {
    module: string;
    importName: string;
    line: number;
}

export interface LargeComponent {
    name: string;
    lineCount: number;
    complexity: number;
    suggestion: string;
    line: number;
}

export interface MemoryUsage {
    component: string;
    memoryLeaks: MemoryLeak[];
    eventListeners: EventListener[];
    subscriptions: Subscription[];
    line: number;
}

export interface MemoryLeak {
    type: 'uncleaned-effect' | 'uncleaned-listener' | 'uncleaned-timeout' | 'ref-cycle';
    description: string;
    suggestion: string;
    line: number;
}

export interface EventListener {
    event: string;
    hasCleanup: boolean;
    line: number;
}

export interface Subscription {
    type: string;
    hasCleanup: boolean;
    line: number;
}

export interface LoadPerformance {
    coreWebVitals: CoreWebVitals;
    resourceHints: ResourceHint[];
    preloadStrategies: PreloadStrategy[];
}

export interface CoreWebVitals {
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint  
    lcp: number; // Largest Contentful Paint
}

export interface ResourceHint {
    type: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';
    resource: string;
    priority: 'high' | 'medium' | 'low';
    line: number;
}

export interface PreloadStrategy {
    component: string;
    strategy: 'eager' | 'lazy' | 'prefetch';
    optimal: 'eager' | 'lazy' | 'prefetch';
    line: number;
}

// React架构分析
export interface ReactArchitecture {
    patterns: ArchitecturePattern[];
    dependencies: DependencyAnalysis;
    testCoverage: TestCoverage;
    accessibility: AccessibilityAnalysis;
}

export interface ArchitecturePattern {
    pattern: 'compound-component' | 'render-props' | 'hoc' | 'custom-hooks' | 'context-provider' | 'feature-folder';
    component: string;
    description: string;
    benefits: string[];
    line: number;
}

export interface DependencyAnalysis {
    circular: CircularDependency[];
    unused: UnusedDependency[];
    outdated: OutdatedDependency[];
    security: SecurityVulnerability[];
}

export interface CircularDependency {
    from: string;
    to: string;
    path: string[];
    line: number;
}

export interface UnusedDependency {
    name: string;
    version: string;
    reason: string;
}

export interface OutdatedDependency {
    name: string;
    current: string;
    latest: string;
    breaking: boolean;
}

export interface SecurityVulnerability {
    package: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    fix: string;
}

export interface TestCoverage {
    components: ComponentTestCoverage[];
    hooks: HookTestCoverage[];
    utilities: UtilityTestCoverage[];
    overallCoverage: number;
}

export interface ComponentTestCoverage {
    name: string;
    hasTests: boolean;
    testTypes: ('unit' | 'integration' | 'snapshot' | 'e2e')[];
    coverage: number;
    line: number;
}

export interface HookTestCoverage {
    name: string;
    hasTests: boolean;
    coverage: number;
    line: number;
}

export interface UtilityTestCoverage {
    name: string;
    hasTests: boolean;
    coverage: number;
    line: number;
}

export interface AccessibilityAnalysis {
    issues: AccessibilityIssue[];
    wcagCompliance: WCAGCompliance;
    ariaUsage: AriaUsage[];
}

export interface AccessibilityIssue {
    type: 'missing-alt' | 'missing-label' | 'low-contrast' | 'keyboard-trap' | 'focus-order';
    element: string;
    severity: 'error' | 'warning' | 'info';
    description: string;
    fix: string;
    line: number;
}

export interface WCAGCompliance {
    level: 'A' | 'AA' | 'AAA';
    score: number;
    issues: number;
}

export interface AriaUsage {
    attribute: string;
    element: string;
    correct: boolean;
    suggestion?: string;
    line: number;
}

export class AdvancedReactPerformanceAnalyzer {
    private performancePatterns: RegExp[];
    private architecturePatterns: RegExp[];
    private accessibilityPatterns: RegExp[];

    constructor() {
        this.performancePatterns = [
            /React\.memo\(/g,
            /useCallback\(/g,
            /useMemo\(/g,
            /React\.lazy\(/g,
            /Suspense/g,
            /useEffect\(/g
        ];

        this.architecturePatterns = [
            /const\s+\w+Context\s*=/g,
            /createContext\(/g,
            /useContext\(/g,
            /forwardRef\(/g,
            /useImperativeHandle\(/g
        ];

        this.accessibilityPatterns = [
            /aria-\w+/g,
            /role=/g,
            /tabIndex/g,
            /alt=/g,
            /htmlFor=/g
        ];
    }

    analyzeReactPerformance(text: string, fileName: string): {
        performance: ReactPerformance;
        architecture: ReactArchitecture;
    } {
        return {
            performance: this.analyzePerformance(text),
            architecture: this.analyzeArchitecture(text, fileName)
        };
    }

    private analyzePerformance(text: string): ReactPerformance {
        return {
            renderOptimizations: this.findRenderOptimizations(text),
            bundleAnalysis: this.analyzeBundleOptimizations(text),
            memoryUsage: this.analyzeMemoryUsage(text),
            loadPerformance: this.analyzeLoadPerformance(text)
        };
    }

    private findRenderOptimizations(text: string): RenderOptimization[] {
        const optimizations: RenderOptimization[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检查是否缺少React.memo
            const componentMatch = line.match(/^(export\s+)?(const|function)\s+([A-Z]\w+)/);
            if (componentMatch) {
                const componentName = componentMatch[3];
                const hasProps = this.componentHasProps(text, componentName);
                const hasMemo = this.componentHasMemo(text, componentName, i);
                
                if (hasProps && !hasMemo) {
                    optimizations.push({
                        component: componentName,
                        issue: 'missing-memo',
                        description: '组件接收props但未使用React.memo优化',
                        suggestion: `使用 React.memo(${componentName}) 包装组件`,
                        line: i + 1
                    });
                }
            }

            // 检查重计算问题
            if (line.includes('.map(') && line.includes('=>')) {
                const hasUseMemo = this.lineHasUseMemo(text, i);
                if (!hasUseMemo) {
                    optimizations.push({
                        component: 'unknown',
                        issue: 'heavy-computation',
                        description: '在渲染中进行数组映射操作',
                        suggestion: '考虑使用 useMemo 缓存计算结果',
                        line: i + 1
                    });
                }
            }

            // 检查大列表渲染
            if (line.includes('.map(') && this.isLargeListRender(line)) {
                optimizations.push({
                    component: 'unknown',
                    issue: 'large-list',
                    description: '大列表渲染可能导致性能问题',
                    suggestion: '考虑使用虚拟化组件如 react-window',
                    line: i + 1
                });
            }

            // 检查不必要的重新渲染
            const useEffectMatch = line.match(/useEffect\s*\(\s*\(\)\s*=>/);
            if (useEffectMatch) {
                const deps = this.extractEffectDependencies(text, i);
                if (deps.length === 0 && !line.includes('[]')) {
                    optimizations.push({
                        component: 'unknown',
                        issue: 'unnecessary-render',
                        description: 'useEffect缺少依赖数组',
                        suggestion: '添加依赖数组或使用 [] 表示只运行一次',
                        line: i + 1
                    });
                }
            }
        }

        return optimizations;
    }

    private analyzeBundleOptimizations(text: string): BundleAnalysis {
        return {
            codesplitting: this.findCodeSplittingOpportunities(text),
            lazyLoading: this.findLazyLoadingUsage(text),
            unusedImports: this.findUnusedImports(text),
            largeComponents: this.findLargeComponents(text)
        };
    }

    private findCodeSplittingOpportunities(text: string): CodeSplitting[] {
        const opportunities: CodeSplitting[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检查路由组件
            const routeMatch = line.match(/path\s*=\s*["']([^"']+)["'].*component\s*=\s*{?([A-Z]\w+)}/);
            if (routeMatch) {
                const [, route, component] = routeMatch;
                const isLazy = this.isComponentLazy(text, component);
                
                if (!isLazy) {
                    opportunities.push({
                        component,
                        route,
                        canBeLazy: true,
                        suggestion: `使用 React.lazy(() => import('./${component}')) 进行代码分割`,
                        line: i + 1
                    });
                }
            }

            // 检查大型组件导入
            const importMatch = line.match(/import\s+([A-Z]\w+)\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                const [, component, path] = importMatch;
                if (this.isLargeComponent(component, text)) {
                    opportunities.push({
                        component,
                        route: path,
                        canBeLazy: true,
                        suggestion: `考虑延迟加载 ${component} 组件`,
                        line: i + 1
                    });
                }
            }
        }

        return opportunities;
    }

    private findLazyLoadingUsage(text: string): LazyLoading[] {
        const lazyComponents: LazyLoading[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const lazyMatch = line.match(/React\.lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\)/);
            if (lazyMatch) {
                const component = this.extractComponentNameFromPath(lazyMatch[1]);
                lazyComponents.push({
                    component,
                    isLazy: true,
                    shouldBeLazy: true,
                    line: i + 1
                });
            }

            const componentMatch = line.match(/^(export\s+)?(const|function)\s+([A-Z]\w+)/);
            if (componentMatch) {
                const componentName = componentMatch[3];
                const isLazy = lazyComponents.some(lc => lc.component === componentName);
                const shouldBeLazy = this.shouldComponentBeLazy(text, componentName);
                
                if (!isLazy && shouldBeLazy) {
                    lazyComponents.push({
                        component: componentName,
                        isLazy: false,
                        shouldBeLazy: true,
                        line: i + 1
                    });
                }
            }
        }

        return lazyComponents;
    }

    private findUnusedImports(text: string): UnusedImport[] {
        const unusedImports: UnusedImport[] = [];
        const lines = text.split('\n');
        const importedNames = new Set<string>();
        const usedNames = new Set<string>();

        // 收集所有导入
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const importMatch = line.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                const [, namedImports, namespaceImport, defaultImport, modulePath] = importMatch;
                
                if (namedImports) {
                    namedImports.split(',').forEach(name => {
                        const cleanName = name.trim().split(' as ')[0];
                        importedNames.add(cleanName);
                    });
                }
                if (namespaceImport) {importedNames.add(namespaceImport);}
                if (defaultImport) {importedNames.add(defaultImport);}
            }
        }

        // 收集所有使用的名称
        const codeWithoutImports = lines.filter(line => !line.trim().startsWith('import')).join('\n');
        for (const name of importedNames) {
            const regex = new RegExp(`\\b${name}\\b`, 'g');
            if (regex.test(codeWithoutImports)) {
                usedNames.add(name);
            }
        }

        // 找到未使用的导入
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const importMatch = line.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                const [, namedImports, namespaceImport, defaultImport, modulePath] = importMatch;
                
                if (namedImports) {
                    namedImports.split(',').forEach(name => {
                        const cleanName = name.trim().split(' as ')[0];
                        if (!usedNames.has(cleanName)) {
                            unusedImports.push({
                                module: modulePath,
                                importName: cleanName,
                                line: i + 1
                            });
                        }
                    });
                }
                
                if (namespaceImport && !usedNames.has(namespaceImport)) {
                    unusedImports.push({
                        module: modulePath,
                        importName: namespaceImport,
                        line: i + 1
                    });
                }
                
                if (defaultImport && !usedNames.has(defaultImport)) {
                    unusedImports.push({
                        module: modulePath,
                        importName: defaultImport,
                        line: i + 1
                    });
                }
            }
        }

        return unusedImports;
    }

    private findLargeComponents(text: string): LargeComponent[] {
        const largeComponents: LargeComponent[] = [];
        const lines = text.split('\n');
        let currentComponent: string | null = null;
        let componentStartLine = 0;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const componentMatch = line.match(/^(export\s+)?(const|function)\s+([A-Z]\w+)/);
            if (componentMatch && !currentComponent) {
                currentComponent = componentMatch[3];
                componentStartLine = i;
                braceCount = 0;
            }

            if (currentComponent) {
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                if (braceCount <= 0 && i > componentStartLine) {
                    const lineCount = i - componentStartLine + 1;
                    const complexity = this.calculateComplexity(lines.slice(componentStartLine, i + 1));
                    
                    if (lineCount > 100 || complexity > 15) {
                        largeComponents.push({
                            name: currentComponent,
                            lineCount,
                            complexity,
                            suggestion: lineCount > 100 
                                ? '组件过大，考虑拆分为多个小组件'
                                : '组件复杂度过高，考虑使用自定义Hook提取逻辑',
                            line: componentStartLine + 1
                        });
                    }
                    
                    currentComponent = null;
                }
            }
        }

        return largeComponents;
    }

    private analyzeMemoryUsage(text: string): MemoryUsage[] {
        const memoryUsage: MemoryUsage[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const componentMatch = line.match(/^(export\s+)?(const|function)\s+([A-Z]\w+)/);
            if (componentMatch) {
                const componentName = componentMatch[3];
                const componentCode = this.extractComponentCode(text, i);
                
                const memoryLeaks = this.findMemoryLeaks(componentCode);
                const eventListeners = this.findEventListeners(componentCode);
                const subscriptions = this.findSubscriptions(componentCode);

                if (memoryLeaks.length > 0 || eventListeners.length > 0 || subscriptions.length > 0) {
                    memoryUsage.push({
                        component: componentName,
                        memoryLeaks,
                        eventListeners,
                        subscriptions,
                        line: i + 1
                    });
                }
            }
        }

        return memoryUsage;
    }

    private analyzeLoadPerformance(text: string): LoadPerformance {
        return {
            coreWebVitals: this.analyzeCoreWebVitals(text),
            resourceHints: this.findResourceHints(text),
            preloadStrategies: this.analyzePreloadStrategies(text)
        };
    }

    private analyzeArchitecture(text: string, fileName: string): ReactArchitecture {
        return {
            patterns: this.findArchitecturePatterns(text),
            dependencies: this.analyzeDependencies(text, fileName),
            testCoverage: this.analyzeTestCoverage(text, fileName),
            accessibility: this.analyzeAccessibility(text)
        };
    }

    private findArchitecturePatterns(text: string): ArchitecturePattern[] {
        const patterns: ArchitecturePattern[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Context Provider模式
            if (line.includes('createContext')) {
                patterns.push({
                    pattern: 'context-provider',
                    component: 'Context',
                    description: '使用Context API进行状态管理',
                    benefits: ['避免props drilling', '集中状态管理', '组件解耦'],
                    line: i + 1
                });
            }

            // 自定义Hook模式
            const customHookMatch = line.match(/^(export\s+)?(const|function)\s+(use[A-Z]\w+)/);
            if (customHookMatch) {
                patterns.push({
                    pattern: 'custom-hooks',
                    component: customHookMatch[3],
                    description: '自定义Hook封装可复用逻辑',
                    benefits: ['逻辑复用', '组件简化', '关注点分离'],
                    line: i + 1
                });
            }

            // Compound Component模式
            if (line.includes('.displayName') || line.includes('Component.SubComponent')) {
                patterns.push({
                    pattern: 'compound-component',
                    component: 'CompoundComponent',
                    description: '复合组件模式',
                    benefits: ['组件组合', 'API灵活性', '内聚性强'],
                    line: i + 1
                });
            }

            // HOC模式
            if (line.includes('forwardRef') || line.match(/with[A-Z]\w+/)) {
                patterns.push({
                    pattern: 'hoc',
                    component: 'HOC',
                    description: '高阶组件模式',
                    benefits: ['行为复用', '条件渲染', '权限控制'],
                    line: i + 1
                });
            }
        }

        return patterns;
    }

    private analyzeDependencies(text: string, fileName: string): DependencyAnalysis {
        return {
            circular: this.findCircularDependencies(text, fileName),
            unused: [], // 需要package.json分析
            outdated: [], // 需要网络请求
            security: [] // 需要安全数据库
        };
    }

    private analyzeTestCoverage(text: string, fileName: string): TestCoverage {
        const components = this.findComponents(text);
        const hooks = this.findCustomHooks(text);
        
        return {
            components: components.map(comp => ({
                name: comp.name,
                hasTests: this.hasTestFile(fileName, comp.name),
                testTypes: this.getTestTypes(fileName, comp.name),
                coverage: 0, // 需要测试工具集成
                line: comp.line
            })),
            hooks: hooks.map(hook => ({
                name: hook.name,
                hasTests: this.hasTestFile(fileName, hook.name),
                coverage: 0,
                line: hook.line
            })),
            utilities: [],
            overallCoverage: 0
        };
    }

    private analyzeAccessibility(text: string): AccessibilityAnalysis {
        return {
            issues: this.findAccessibilityIssues(text),
            wcagCompliance: this.calculateWCAGCompliance(text),
            ariaUsage: this.analyzeAriaUsage(text)
        };
    }

    // 辅助方法
    private componentHasProps(text: string, componentName: string): boolean {
        const componentRegex = new RegExp(`(const|function)\\s+${componentName}\\s*\\(([^)]+)\\)`);
        const match = text.match(componentRegex);
        return match ? match[2].trim().length > 0 : false;
    }

    private componentHasMemo(text: string, componentName: string, startLine: number): boolean {
        const lines = text.split('\n');
        for (let i = Math.max(0, startLine - 5); i <= Math.min(lines.length - 1, startLine + 5); i++) {
            if (lines[i].includes(`React.memo(${componentName})`) || 
                lines[i].includes(`memo(${componentName})`)) {
                return true;
            }
        }
        return false;
    }

    private lineHasUseMemo(text: string, lineIndex: number): boolean {
        const lines = text.split('\n');
        for (let i = Math.max(0, lineIndex - 3); i <= Math.min(lines.length - 1, lineIndex + 3); i++) {
            if (lines[i].includes('useMemo')) {
                return true;
            }
        }
        return false;
    }

    private isLargeListRender(line: string): boolean {
        return line.includes('map(') && (
            line.includes('items') || 
            line.includes('data') || 
            line.includes('list') ||
            line.includes('array')
        );
    }

    private extractEffectDependencies(text: string, lineIndex: number): string[] {
        const lines = text.split('\n');
        for (let i = lineIndex; i < Math.min(lines.length, lineIndex + 10); i++) {
            const depsMatch = lines[i].match(/\[([^\]]*)\]/);
            if (depsMatch) {
                return depsMatch[1].split(',').map(dep => dep.trim()).filter(dep => dep.length > 0);
            }
        }
        return [];
    }

    private isComponentLazy(text: string, componentName: string): boolean {
        return text.includes(`React.lazy`) && text.includes(componentName);
    }

    private isLargeComponent(componentName: string, text: string): boolean {
        // 简化判断：组件名包含某些关键词
        const largeComponentIndicators = ['Page', 'Dashboard', 'Layout', 'Container'];
        return largeComponentIndicators.some(indicator => componentName.includes(indicator));
    }

    private extractComponentNameFromPath(path: string): string {
        const parts = path.split('/');
        const fileName = parts[parts.length - 1];
        return fileName.replace(/\.(tsx?|jsx?)$/, '');
    }

    private shouldComponentBeLazy(text: string, componentName: string): boolean {
        // 简化逻辑：大型组件应该懒加载
        return this.isLargeComponent(componentName, text);
    }

    private calculateComplexity(lines: string[]): number {
        let complexity = 1;
        const complexityIndicators = [
            /if\s*\(/g,
            /else/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /switch\s*\(/g,
            /case\s+/g,
            /\?\s*:/g,
            /&&/g,
            /\|\|/g
        ];

        for (const line of lines) {
            for (const pattern of complexityIndicators) {
                const matches = line.match(pattern);
                if (matches) {
                    complexity += matches.length;
                }
            }
        }

        return complexity;
    }

    private extractComponentCode(text: string, startLine: number): string {
        const lines = text.split('\n');
        let braceCount = 0;
        let endLine = startLine;

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            if (braceCount <= 0 && i > startLine) {
                endLine = i;
                break;
            }
        }

        return lines.slice(startLine, endLine + 1).join('\n');
    }

    private findMemoryLeaks(componentCode: string): MemoryLeak[] {
        const leaks: MemoryLeak[] = [];
        const lines = componentCode.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检查未清理的useEffect
            if (line.includes('useEffect')) {
                const hasCleanup = this.hasEffectCleanup(componentCode, i);
                const hasAsyncOrTimer = line.includes('setTimeout') || line.includes('setInterval') || line.includes('fetch');
                
                if (hasAsyncOrTimer && !hasCleanup) {
                    leaks.push({
                        type: 'uncleaned-effect',
                        description: 'useEffect中有异步操作但缺少清理函数',
                        suggestion: '添加清理函数：return () => { /* cleanup */ }',
                        line: i + 1
                    });
                }
            }

            // 检查事件监听器
            if (line.includes('addEventListener')) {
                const hasRemoval = componentCode.includes('removeEventListener');
                if (!hasRemoval) {
                    leaks.push({
                        type: 'uncleaned-listener',
                        description: '添加了事件监听器但未移除',
                        suggestion: '在cleanup函数中移除事件监听器',
                        line: i + 1
                    });
                }
            }
        }

        return leaks;
    }

    private findEventListeners(componentCode: string): EventListener[] {
        const listeners: EventListener[] = [];
        const lines = componentCode.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const listenerMatch = line.match(/addEventListener\s*\(\s*['"]([^'"]+)['"]/);
            if (listenerMatch) {
                listeners.push({
                    event: listenerMatch[1],
                    hasCleanup: componentCode.includes('removeEventListener'),
                    line: i + 1
                });
            }
        }

        return listeners;
    }

    private findSubscriptions(componentCode: string): Subscription[] {
        const subscriptions: Subscription[] = [];
        const lines = componentCode.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('subscribe')) {
                subscriptions.push({
                    type: 'Observable',
                    hasCleanup: componentCode.includes('unsubscribe'),
                    line: i + 1
                });
            }
        }

        return subscriptions;
    }

    private hasEffectCleanup(componentCode: string, effectLine: number): boolean {
        const lines = componentCode.split('\n');
        for (let i = effectLine; i < Math.min(lines.length, effectLine + 10); i++) {
            if (lines[i].includes('return ') && lines[i].includes('=>')) {
                return true;
            }
        }
        return false;
    }

    private analyzeCoreWebVitals(text: string): CoreWebVitals {
        // 简化实现，实际需要性能测量工具
        return {
            cls: 0.1,
            fcp: 1200,
            lcp: 2500
        };
    }

    private findResourceHints(text: string): ResourceHint[] {
        // 简化实现
        return [];
    }

    private analyzePreloadStrategies(text: string): PreloadStrategy[] {
        // 简化实现
        return [];
    }

    private findCircularDependencies(text: string, fileName: string): CircularDependency[] {
        // 简化实现
        return [];
    }

    private findComponents(text: string): { name: string; line: number }[] {
        const components: { name: string; line: number }[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const componentMatch = lines[i].match(/^(export\s+)?(const|function)\s+([A-Z]\w+)/);
            if (componentMatch) {
                components.push({
                    name: componentMatch[3],
                    line: i + 1
                });
            }
        }

        return components;
    }

    private findCustomHooks(text: string): { name: string; line: number }[] {
        const hooks: { name: string; line: number }[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const hookMatch = lines[i].match(/^(export\s+)?(const|function)\s+(use[A-Z]\w+)/);
            if (hookMatch) {
                hooks.push({
                    name: hookMatch[3],
                    line: i + 1
                });
            }
        }

        return hooks;
    }

    private hasTestFile(fileName: string, componentName: string): boolean {
        // 简化实现，实际需要文件系统检查
        return false;
    }

    private getTestTypes(fileName: string, componentName: string): ('unit' | 'integration' | 'snapshot' | 'e2e')[] {
        // 简化实现
        return [];
    }

    private findAccessibilityIssues(text: string): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检查img标签缺少alt属性
            if (line.includes('<img') && !line.includes('alt=')) {
                issues.push({
                    type: 'missing-alt',
                    element: 'img',
                    severity: 'error',
                    description: '图片缺少alt属性',
                    fix: '添加 alt="描述性文本" 属性',
                    line: i + 1
                });
            }

            // 检查按钮缺少accessible name
            if (line.includes('<button') && !line.includes('aria-label') && !line.includes('title')) {
                issues.push({
                    type: 'missing-label',
                    element: 'button',
                    severity: 'warning',
                    description: '按钮可能缺少可访问的名称',
                    fix: '添加 aria-label 或确保按钮有文本内容',
                    line: i + 1
                });
            }

            // 检查表单控件
            if ((line.includes('<input') || line.includes('<textarea')) && !line.includes('aria-label') && !line.includes('id=')) {
                issues.push({
                    type: 'missing-label',
                    element: 'input',
                    severity: 'error',
                    description: '表单控件缺少标签',
                    fix: '使用 htmlFor 关联label或添加 aria-label',
                    line: i + 1
                });
            }
        }

        return issues;
    }

    private calculateWCAGCompliance(text: string): WCAGCompliance {
        const issues = this.findAccessibilityIssues(text);
        const errorCount = issues.filter(issue => issue.severity === 'error').length;
        const warningCount = issues.filter(issue => issue.severity === 'warning').length;
        
        const totalElements = (text.match(/<[a-zA-Z]/g) || []).length;
        const compliance = totalElements > 0 ? (totalElements - errorCount - warningCount * 0.5) / totalElements : 1;

        return {
            level: compliance > 0.9 ? 'AA' : compliance > 0.7 ? 'A' : 'A',
            score: Math.round(compliance * 100),
            issues: issues.length
        };
    }

    private analyzeAriaUsage(text: string): AriaUsage[] {
        const ariaUsage: AriaUsage[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const ariaMatches = line.match(/aria-([a-zA-Z-]+)=/g);
            
            if (ariaMatches) {
                ariaMatches.forEach(match => {
                    const attribute = match.replace('=', '');
                    ariaUsage.push({
                        attribute,
                        element: this.extractElementType(line),
                        correct: this.isAriaUsageCorrect(attribute, line),
                        line: i + 1
                    });
                });
            }
        }

        return ariaUsage;
    }

    private extractElementType(line: string): string {
        const match = line.match(/<([a-zA-Z]+)/);
        return match ? match[1] : 'unknown';
    }

    private isAriaUsageCorrect(attribute: string, line: string): boolean {
        // 简化的验证逻辑
        const validUsage: { [key: string]: boolean } = {
            ariaLabel: true,
            ariaLabelledby: line.includes('id='),
            ariaDescribedby: line.includes('id='),
            ariaExpanded: line.includes('button') || line.includes('details'),
            ariaHidden: true
        };

        return validUsage[attribute] !== false;
    }
}
