/**
 * React性能剖析器
 * 提供深度的React应用性能分析，包括组件生命周期、渲染优化、内存使用等
 */

import * as vscode from 'vscode';

export interface ReactComponentProfile {
    componentName: string;
    renderCount: number;
    averageRenderTime: number;
    maxRenderTime: number;
    minRenderTime: number;
    memoryUsage: number;
    propsChanges: number;
    stateChanges: number;
    effectExecutions: number;
    childComponents: string[];
    parentComponent?: string;
    renderTriggers: RenderTrigger[];
    optimizationSuggestions: OptimizationSuggestion[];
}

export interface RenderTrigger {
    type: 'props' | 'state' | 'context' | 'parent' | 'force';
    frequency: number;
    impact: 'low' | 'medium' | 'high';
    details: string;
    location: { line: number; column: number };
}

export interface OptimizationSuggestion {
    type: 'memo' | 'callback' | 'useMemo' | 'lazy' | 'virtualization' | 'code-splitting';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    estimatedImprovement: string;
    implementation: string;
    codeExample: {
        before: string;
        after: string;
    };
    risks: string[];
    dependencies: string[];
}

export interface ReactPerformanceMetrics {
    totalComponents: number;
    averageRenderTime: number;
    slowestComponent: string;
    fastestComponent: string;
    memoryLeaks: MemoryLeak[];
    unnecessaryRerenders: number;
    optimizationPotential: number; // 0-100
    performanceScore: number; // 0-100
    bundleMetrics: BundleMetrics;
    runtimeMetrics: RuntimeMetrics;
}

export interface MemoryLeak {
    componentName: string;
    type: 'listener' | 'timer' | 'subscription' | 'reference';
    location: { line: number; column: number };
    severity: 'low' | 'medium' | 'high';
    description: string;
    fix: string;
}

export interface BundleMetrics {
    totalSize: number;
    chunkSizes: { [chunkName: string]: number };
    unusedCode: number;
    duplicateCode: number;
    compressionRatio: number;
    loadTime: number;
    cacheEfficiency: number;
}

export interface RuntimeMetrics {
    initialLoadTime: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    interactionLatency: number;
    memoryUsagePattern: MemoryUsagePoint[];
}

export interface MemoryUsagePoint {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
}

export interface ReactPerformanceReport {
    timestamp: number;
    filePath: string;
    componentProfiles: ReactComponentProfile[];
    metrics: ReactPerformanceMetrics;
    recommendations: PerformanceRecommendation[];
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
}

export interface PerformanceRecommendation {
    id: string;
    category: 'rendering' | 'memory' | 'bundle' | 'runtime' | 'architecture';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    effort: 'small' | 'medium' | 'large';
    implementation: {
        steps: string[];
        code: string;
        tests: string;
    };
    metrics: {
        currentValue: number;
        targetValue: number;
        improvement: string;
    };
}

export interface PerformanceTrend {
    metric: string;
    direction: 'improving' | 'stable' | 'degrading';
    change: number; // percentage
    period: string;
    significance: 'low' | 'medium' | 'high';
}

export interface PerformanceAlert {
    type: 'regression' | 'memory-leak' | 'slow-component' | 'bundle-bloat';
    severity: 'warning' | 'error' | 'critical';
    message: string;
    component?: string;
    threshold: number;
    currentValue: number;
    recommendation: string;
}

export class ReactPerformanceProfiler {
    private workspaceRoot: string;
    private performanceHistory: Map<string, ReactPerformanceReport[]> = new Map();
    private isProfilingEnabled: boolean = false;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    async analyzePerformance(code: string, filePath: string): Promise<ReactPerformanceReport> {
        const componentProfiles = await this.profileComponents(code, filePath);
        const metrics = this.calculateMetrics(componentProfiles, code);
        const recommendations = this.generateRecommendations(componentProfiles, metrics);
        const trends = this.analyzeTrends(filePath, metrics);
        const alerts = this.generateAlerts(metrics, componentProfiles);

        const report: ReactPerformanceReport = {
            timestamp: Date.now(),
            filePath,
            componentProfiles,
            metrics,
            recommendations,
            trends,
            alerts
        };

        this.updatePerformanceHistory(filePath, report);
        return report;
    }

    private async profileComponents(code: string, filePath: string): Promise<ReactComponentProfile[]> {
        const profiles: ReactComponentProfile[] = [];

        // 使用正则表达式查找React组件
        const componentRegex = /(?:function\s+([A-Z]\w+)|const\s+([A-Z]\w+)\s*=\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*:\s*React\.FC))/g;
        let match;

        while ((match = componentRegex.exec(code)) !== null) {
            const componentName = match[1] || match[2];
            if (componentName) {
                const profile = await this.analyzeComponent(componentName, code, filePath);
                profiles.push(profile);
            }
        }

        return profiles;
    }

    private async analyzeComponent(componentName: string, code: string, filePath: string): Promise<ReactComponentProfile> {
        // 提取组件代码
        const componentCode = this.extractComponentCode(componentName, code);
        
        // 分析渲染触发器
        const renderTriggers = this.analyzeRenderTriggers(componentCode);
        
        // 分析子组件
        const childComponents = this.findChildComponents(componentCode);
        
        // 生成优化建议
        const optimizationSuggestions = this.generateOptimizationSuggestions(componentCode, componentName);

        // 模拟性能指标（在实际实现中，这些数据会来自实际的性能监控）
        const renderCount = this.estimateRenderCount(componentCode);
        const renderTime = this.estimateRenderTime(componentCode);
        const memoryUsage = this.estimateMemoryUsage(componentCode);

        return {
            componentName,
            renderCount,
            averageRenderTime: renderTime,
            maxRenderTime: renderTime * 1.5,
            minRenderTime: renderTime * 0.5,
            memoryUsage,
            propsChanges: this.countPropsUsage(componentCode),
            stateChanges: this.countStateUsage(componentCode),
            effectExecutions: this.countEffectUsage(componentCode),
            childComponents,
            renderTriggers,
            optimizationSuggestions
        };
    }

    private extractComponentCode(componentName: string, code: string): string {
        const regex = new RegExp(`(?:function\\s+${componentName}|const\\s+${componentName}\\s*=)[^}]*\\{[\\s\\S]*?^\\}`, 'm');
        const match = code.match(regex);
        return match ? match[0] : '';
    }

    private analyzeRenderTriggers(componentCode: string): RenderTrigger[] {
        const triggers: RenderTrigger[] = [];

        // 分析useState使用
        const stateMatches = componentCode.match(/useState\(/g) || [];
        if (stateMatches.length > 0) {
            triggers.push({
                type: 'state',
                frequency: stateMatches.length * 10, // 估算频率
                impact: stateMatches.length > 5 ? 'high' : stateMatches.length > 2 ? 'medium' : 'low',
                details: `Found ${stateMatches.length} state variables`,
                location: { line: 0, column: 0 }
            });
        }

        // 分析props使用
        const propsUsage = (componentCode.match(/props\./g) || []).length;
        if (propsUsage > 0) {
            triggers.push({
                type: 'props',
                frequency: propsUsage * 5,
                impact: propsUsage > 10 ? 'high' : propsUsage > 5 ? 'medium' : 'low',
                details: `Props accessed ${propsUsage} times`,
                location: { line: 0, column: 0 }
            });
        }

        // 分析Context使用
        const contextMatches = componentCode.match(/useContext\(/g) || [];
        if (contextMatches.length > 0) {
            triggers.push({
                type: 'context',
                frequency: contextMatches.length * 15,
                impact: 'high',
                details: `Uses ${contextMatches.length} contexts`,
                location: { line: 0, column: 0 }
            });
        }

        return triggers;
    }

    private findChildComponents(componentCode: string): string[] {
        const childComponents: string[] = [];
        const componentRegex = /<([A-Z]\w+)/g;
        let match;

        while ((match = componentRegex.exec(componentCode)) !== null) {
            const componentName = match[1];
            if (!childComponents.includes(componentName)) {
                childComponents.push(componentName);
            }
        }

        return childComponents;
    }

    private generateOptimizationSuggestions(componentCode: string, componentName: string): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        // 检查是否需要React.memo
        if (!componentCode.includes('React.memo') && !componentCode.includes('memo(')) {
            const propsCount = (componentCode.match(/props\./g) || []).length;
            if (propsCount > 3) {
                suggestions.push({
                    type: 'memo',
                    priority: 'medium',
                    description: `${componentName} receives props and might benefit from memoization`,
                    estimatedImprovement: '20-40% render time reduction',
                    implementation: 'Wrap component with React.memo',
                    codeExample: {
                        before: `export default function ${componentName}(props) {`,
                        after: `export default React.memo(function ${componentName}(props) {`
                    },
                    risks: ['Props comparison overhead for complex objects'],
                    dependencies: ['React.memo import']
                });
            }
        }

        // 检查是否需要useCallback
        const functionDefCount = (componentCode.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length;
        if (functionDefCount > 2 && !componentCode.includes('useCallback')) {
            suggestions.push({
                type: 'callback',
                priority: 'medium',
                description: 'Functions are recreated on every render',
                estimatedImprovement: '10-25% child component rerenders reduction',
                implementation: 'Use useCallback for event handlers',
                codeExample: {
                    before: 'const handleClick = () => { /* handler */ };',
                    after: 'const handleClick = useCallback(() => { /* handler */ }, []);'
                },
                risks: ['Incorrect dependency arrays'],
                dependencies: ['useCallback import']
            });
        }

        // 检查是否需要useMemo
        const complexCalculations = componentCode.match(/\.map\(|\.filter\(|\.reduce\(|\.sort\(/g) || [];
        if (complexCalculations.length > 2 && !componentCode.includes('useMemo')) {
            suggestions.push({
                type: 'useMemo',
                priority: 'high',
                description: 'Expensive calculations are performed on every render',
                estimatedImprovement: '30-60% render time reduction',
                implementation: 'Memoize expensive calculations',
                codeExample: {
                    before: 'const result = expensiveCalculation(data);',
                    after: 'const result = useMemo(() => expensiveCalculation(data), [data]);'
                },
                risks: ['Memory usage increase', 'Stale closures'],
                dependencies: ['useMemo import']
            });
        }

        // 检查是否需要代码分割
        const componentSize = componentCode.length;
        if (componentSize > 5000) {
            suggestions.push({
                type: 'code-splitting',
                priority: 'high',
                description: `Large component (${componentSize} chars) should be split`,
                estimatedImprovement: '40-70% initial bundle size reduction',
                implementation: 'Use React.lazy for code splitting',
                codeExample: {
                    before: `import ${componentName} from './${componentName}';`,
                    after: `const ${componentName} = React.lazy(() => import('./${componentName}'));`
                },
                risks: ['Loading states required', 'Error boundaries needed'],
                dependencies: ['React.lazy', 'Suspense']
            });
        }

        return suggestions;
    }

    private calculateMetrics(profiles: ReactComponentProfile[], code: string): ReactPerformanceMetrics {
        const totalComponents = profiles.length;
        const averageRenderTime = profiles.reduce((sum, p) => sum + p.averageRenderTime, 0) / totalComponents || 0;
        
        const sortedByRenderTime = [...profiles].sort((a, b) => b.averageRenderTime - a.averageRenderTime);
        const slowestComponent = sortedByRenderTime[0]?.componentName || 'N/A';
        const fastestComponent = sortedByRenderTime[sortedByRenderTime.length - 1]?.componentName || 'N/A';

        const memoryLeaks = this.detectMemoryLeaks(code);
        const unnecessaryRerenders = this.countUnnecessaryRerenders(profiles);
        
        // 计算优化潜力
        const optimizationPotential = Math.min(100, 
            profiles.reduce((sum, p) => sum + p.optimizationSuggestions.length, 0) * 10
        );

        // 计算性能评分
        const performanceScore = Math.max(0, 100 - (averageRenderTime * 2) - (unnecessaryRerenders * 5));

        return {
            totalComponents,
            averageRenderTime,
            slowestComponent,
            fastestComponent,
            memoryLeaks,
            unnecessaryRerenders,
            optimizationPotential,
            performanceScore,
            bundleMetrics: this.analyzeBundleMetrics(code),
            runtimeMetrics: this.estimateRuntimeMetrics(code)
        };
    }

    private detectMemoryLeaks(code: string): MemoryLeak[] {
        const leaks: MemoryLeak[] = [];

        // 检查缺少清理的事件监听器
        const listenerMatches = code.match(/addEventListener\([^)]+\)/g) || [];
        const removeListenerMatches = code.match(/removeEventListener\([^)]+\)/g) || [];
        
        if (listenerMatches.length > removeListenerMatches.length) {
            leaks.push({
                componentName: 'Unknown',
                type: 'listener',
                location: { line: 0, column: 0 },
                severity: 'medium',
                description: 'Event listeners may not be properly cleaned up',
                fix: 'Add removeEventListener in useEffect cleanup function'
            });
        }

        // 检查未清理的定时器
        const timerMatches = code.match(/setTimeout\(|setInterval\(/g) || [];
        const clearMatches = code.match(/clearTimeout\(|clearInterval\(/g) || [];
        
        if (timerMatches.length > clearMatches.length) {
            leaks.push({
                componentName: 'Unknown',
                type: 'timer',
                location: { line: 0, column: 0 },
                severity: 'high',
                description: 'Timers may not be properly cleared',
                fix: 'Clear timers in useEffect cleanup function'
            });
        }

        return leaks;
    }

    private countUnnecessaryRerenders(profiles: ReactComponentProfile[]): number {
        return profiles.reduce((sum, profile) => {
            // 启发式计算：如果渲染次数远高于状态和props变化，可能存在不必要的重渲染
            const expectedRenders = profile.propsChanges + profile.stateChanges + 1;
            const excessRenders = Math.max(0, profile.renderCount - expectedRenders * 2);
            return sum + excessRenders;
        }, 0);
    }

    private analyzeBundleMetrics(code: string): BundleMetrics {
        const codeSize = code.length;
        const importCount = (code.match(/import\s+[^;]+from/g) || []).length;
        
        return {
            totalSize: codeSize,
            chunkSizes: { main: codeSize },
            unusedCode: this.estimateUnusedCode(code),
            duplicateCode: this.estimateDuplicateCode(code),
            compressionRatio: 0.7, // 估算
            loadTime: codeSize / 1000, // 简化计算
            cacheEfficiency: 0.8 // 估算
        };
    }

    private estimateRuntimeMetrics(code: string): RuntimeMetrics {
        const complexity = this.calculateComplexity(code);
        
        return {
            initialLoadTime: complexity * 10,
            timeToInteractive: complexity * 15,
            firstContentfulPaint: complexity * 8,
            largestContentfulPaint: complexity * 12,
            cumulativeLayoutShift: 0.1,
            interactionLatency: complexity * 2,
            memoryUsagePattern: [
                { timestamp: 0, heapUsed: 10, heapTotal: 20, external: 5 },
                { timestamp: 1000, heapUsed: 15, heapTotal: 25, external: 7 }
            ]
        };
    }

    private generateRecommendations(profiles: ReactComponentProfile[], metrics: ReactPerformanceMetrics): PerformanceRecommendation[] {
        const recommendations: PerformanceRecommendation[] = [];

        // 基于平均渲染时间的建议
        if (metrics.averageRenderTime > 16) {
            recommendations.push({
                id: 'reduce-render-time',
                category: 'rendering',
                priority: 'high',
                title: 'Reduce Average Render Time',
                description: `Current average render time (${metrics.averageRenderTime.toFixed(2)}ms) exceeds 16ms threshold`,
                impact: 'Improves user experience and reduces frame drops',
                effort: 'medium',
                implementation: {
                    steps: [
                        'Identify slowest components',
                        'Apply React.memo where appropriate',
                        'Optimize expensive calculations with useMemo'
                    ],
                    code: 'const OptimizedComponent = React.memo(YourComponent);',
                    tests: 'Add performance tests to monitor render times'
                },
                metrics: {
                    currentValue: metrics.averageRenderTime,
                    targetValue: 10,
                    improvement: `${((metrics.averageRenderTime - 10) / metrics.averageRenderTime * 100).toFixed(1)}% faster`
                }
            });
        }

        // Bundle优化建议
        if (metrics.bundleMetrics.totalSize > 100000) {
            recommendations.push({
                id: 'optimize-bundle-size',
                category: 'bundle',
                priority: 'medium',
                title: 'Optimize Bundle Size',
                description: `Bundle size (${(metrics.bundleMetrics.totalSize / 1024).toFixed(1)}KB) is larger than recommended`,
                impact: 'Faster initial load times and better mobile experience',
                effort: 'large',
                implementation: {
                    steps: [
                        'Implement code splitting',
                        'Remove unused dependencies',
                        'Use tree shaking optimization'
                    ],
                    code: 'const LazyComponent = React.lazy(() => import("./Component"));',
                    tests: 'Monitor bundle size in CI/CD pipeline'
                },
                metrics: {
                    currentValue: metrics.bundleMetrics.totalSize,
                    targetValue: 80000,
                    improvement: `${((metrics.bundleMetrics.totalSize - 80000) / metrics.bundleMetrics.totalSize * 100).toFixed(1)}% smaller`
                }
            });
        }

        return recommendations;
    }

    private analyzeTrends(filePath: string, metrics: ReactPerformanceMetrics): PerformanceTrend[] {
        const history = this.performanceHistory.get(filePath) || [];
        const trends: PerformanceTrend[] = [];

        if (history.length > 1) {
            const previous = history[history.length - 2];
            const current = metrics;

            // 渲染时间趋势
            const renderTimeChange = ((current.averageRenderTime - previous.metrics.averageRenderTime) / previous.metrics.averageRenderTime) * 100;
            trends.push({
                metric: 'Average Render Time',
                direction: renderTimeChange < -5 ? 'improving' : renderTimeChange > 5 ? 'degrading' : 'stable',
                change: renderTimeChange,
                period: 'Last analysis',
                significance: Math.abs(renderTimeChange) > 20 ? 'high' : Math.abs(renderTimeChange) > 10 ? 'medium' : 'low'
            });

            // 性能评分趋势
            const scoreChange = ((current.performanceScore - previous.metrics.performanceScore) / previous.metrics.performanceScore) * 100;
            trends.push({
                metric: 'Performance Score',
                direction: scoreChange > 5 ? 'improving' : scoreChange < -5 ? 'degrading' : 'stable',
                change: scoreChange,
                period: 'Last analysis',
                significance: Math.abs(scoreChange) > 20 ? 'high' : Math.abs(scoreChange) > 10 ? 'medium' : 'low'
            });
        }

        return trends;
    }

    private generateAlerts(metrics: ReactPerformanceMetrics, profiles: ReactComponentProfile[]): PerformanceAlert[] {
        const alerts: PerformanceAlert[] = [];

        // 渲染时间警告
        if (metrics.averageRenderTime > 50) {
            alerts.push({
                type: 'slow-component',
                severity: 'critical',
                message: 'Critical render time detected',
                component: metrics.slowestComponent,
                threshold: 16,
                currentValue: metrics.averageRenderTime,
                recommendation: 'Immediate optimization required for smooth user experience'
            });
        }

        // 内存泄漏警告
        if (metrics.memoryLeaks.length > 0) {
            alerts.push({
                type: 'memory-leak',
                severity: 'error',
                message: `${metrics.memoryLeaks.length} potential memory leaks detected`,
                threshold: 0,
                currentValue: metrics.memoryLeaks.length,
                recommendation: 'Fix memory leaks to prevent application slowdown'
            });
        }

        // Bundle大小警告
        if (metrics.bundleMetrics.totalSize > 500000) {
            alerts.push({
                type: 'bundle-bloat',
                severity: 'warning',
                message: 'Bundle size exceeds recommended threshold',
                threshold: 100000,
                currentValue: metrics.bundleMetrics.totalSize,
                recommendation: 'Implement code splitting and remove unused dependencies'
            });
        }

        return alerts;
    }

    // 辅助方法
    private estimateRenderCount(componentCode: string): number {
        const stateCount = (componentCode.match(/useState\(/g) || []).length;
        const effectCount = (componentCode.match(/useEffect\(/g) || []).length;
        return (stateCount + effectCount) * 5 + 10; // 简化估算
    }

    private estimateRenderTime(componentCode: string): number {
        const complexity = this.calculateComplexity(componentCode);
        return Math.max(1, complexity * 0.5); // 毫秒
    }

    private estimateMemoryUsage(componentCode: string): number {
        const codeSize = componentCode.length;
        const objectCount = (componentCode.match(/\{[^}]*\}/g) || []).length;
        return (codeSize / 100) + (objectCount * 0.1); // KB估算
    }

    private countPropsUsage(componentCode: string): number {
        return (componentCode.match(/props\./g) || []).length;
    }

    private countStateUsage(componentCode: string): number {
        return (componentCode.match(/useState\(/g) || []).length;
    }

    private countEffectUsage(componentCode: string): number {
        return (componentCode.match(/useEffect\(/g) || []).length;
    }

    private calculateComplexity(code: string): number {
        const ifCount = (code.match(/\bif\s*\(/g) || []).length;
        const loopCount = (code.match(/\b(for|while)\s*\(/g) || []).length;
        const switchCount = (code.match(/\bswitch\s*\(/g) || []).length;
        const ternaryCount = (code.match(/\?[^:]*:/g) || []).length;
        
        return ifCount + loopCount * 2 + switchCount * 2 + ternaryCount;
    }

    private estimateUnusedCode(code: string): number {
        // 简化估算：假设有10%的未使用代码
        return Math.floor(code.length * 0.1);
    }

    private estimateDuplicateCode(code: string): number {
        // 简化估算：基于重复的模式
        const patterns = code.match(/(\w+)\s*=\s*\1/g) || [];
        return patterns.length * 50; // 估算字符数
    }

    private updatePerformanceHistory(filePath: string, report: ReactPerformanceReport): void {
        const history = this.performanceHistory.get(filePath) || [];
        history.push(report);
        
        // 保留最近20次记录
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
        
        this.performanceHistory.set(filePath, history);
    }

    // 公共方法
    public enableProfiling(): void {
        this.isProfilingEnabled = true;
    }

    public disableProfiling(): void {
        this.isProfilingEnabled = false;
    }

    public getPerformanceHistory(filePath: string): ReactPerformanceReport[] {
        return this.performanceHistory.get(filePath) || [];
    }

    public clearHistory(filePath?: string): void {
        if (filePath) {
            this.performanceHistory.delete(filePath);
        } else {
            this.performanceHistory.clear();
        }
    }
}
