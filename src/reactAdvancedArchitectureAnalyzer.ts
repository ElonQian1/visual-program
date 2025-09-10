/**
 * React高级架构分析器
 * 专门分析React应用的架构模式、性能优化和最佳实践
 */

import * as vscode from 'vscode';

export interface ReactArchitecturePattern {
    name: string;
    type: 'component' | 'hook' | 'context' | 'hoc' | 'render-props' | 'compound';
    confidence: number;
    location: { line: number; column: number };
    description: string;
    pros: string[];
    cons: string[];
    recommendations: string[];
}

export interface ReactPerformanceIssue {
    type: 'rendering' | 'memory' | 'bundle' | 'network' | 'state';
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: { line: number; column: number };
    issue: string;
    impact: string;
    solution: string;
    codeExample?: string;
    estimatedImprovement: string;
}

export interface ReactBestPracticeViolation {
    rule: string;
    category: 'hooks' | 'components' | 'props' | 'state' | 'lifecycle' | 'accessibility';
    severity: 'warning' | 'error' | 'info';
    location: { line: number; column: number };
    message: string;
    fix: string;
    example?: string;
}

export interface ReactComponentAnalysis {
    name: string;
    type: 'functional' | 'class' | 'memo' | 'forwardRef';
    complexity: number;
    hooks: string[];
    props: Array<{ name: string; type: string; required: boolean }>;
    dependencies: string[];
    renderCount: number;
    reRenderTriggers: string[];
    optimizationOpportunities: string[];
}

export interface ReactArchitectureAnalysisResult {
    overallScore: number;
    architecturePatterns: ReactArchitecturePattern[];
    performanceIssues: ReactPerformanceIssue[];
    bestPracticeViolations: ReactBestPracticeViolation[];
    componentAnalysis: ReactComponentAnalysis[];
    bundleAnalysis: {
        totalSize: number;
        unusedImports: string[];
        codesplitting: { implemented: boolean; suggestions: string[] };
        treeShaking: { effective: boolean; improvements: string[] };
    };
    stateManagement: {
        pattern: 'useState' | 'useReducer' | 'context' | 'redux' | 'zustand' | 'recoil' | 'mixed';
        complexity: number;
        issues: string[];
        recommendations: string[];
    };
    testability: {
        score: number;
        testableComponents: number;
        untestableComponents: string[];
        recommendations: string[];
    };
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
}

export class ReactAdvancedArchitectureAnalyzer {
    private workspaceRoot: string;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    async analyzeReactArchitecture(code: string, filePath: string): Promise<ReactArchitectureAnalysisResult> {
        const architecturePatterns = await this.detectArchitecturePatterns(code);
        const performanceIssues = await this.analyzePerformanceIssues(code);
        const bestPracticeViolations = await this.analyzeBestPractices(code);
        const componentAnalysis = await this.analyzeComponents(code);
        const bundleAnalysis = await this.analyzeBundleOptimization(code, filePath);
        const stateManagement = await this.analyzeStateManagement(code);
        const testability = await this.analyzeTestability(code);

        const overallScore = this.calculateOverallScore({
            architecturePatterns,
            performanceIssues,
            bestPracticeViolations,
            componentAnalysis,
            bundleAnalysis,
            stateManagement,
            testability
        });

        const recommendations = this.generateRecommendations({
            architecturePatterns,
            performanceIssues,
            bestPracticeViolations,
            componentAnalysis,
            bundleAnalysis,
            stateManagement,
            testability
        });

        return {
            overallScore,
            architecturePatterns,
            performanceIssues,
            bestPracticeViolations,
            componentAnalysis,
            bundleAnalysis,
            stateManagement,
            testability,
            recommendations
        };
    }

    private async detectArchitecturePatterns(code: string): Promise<ReactArchitecturePattern[]> {
        const patterns: ReactArchitecturePattern[] = [];

        // 检测高阶组件 (HOC) 模式
        const hocPattern = /function\s+with\w+\s*\([^)]*\)\s*\{[\s\S]*?return\s+function|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\([^)]*\)\s*=>/g;
        let match;
        while ((match = hocPattern.exec(code)) !== null) {
            const line = code.substring(0, match.index).split('\n').length;
            patterns.push({
                name: 'Higher-Order Component (HOC)',
                type: 'hoc',
                confidence: 0.9,
                location: { line, column: match.index },
                description: '高阶组件模式用于组件逻辑复用',
                pros: ['逻辑复用', '横切关注点分离', '增强组件功能'],
                cons: ['包装地狱', '调试困难', 'props drilling'],
                recommendations: ['考虑使用自定义Hook替代', '保持HOC简单', '添加displayName']
            });
        }

        // 检测Render Props模式
        const renderPropsPattern = /render\s*[=:]\s*\([^)]*\)\s*=>/g;
        while ((match = renderPropsPattern.exec(code)) !== null) {
            const line = code.substring(0, match.index).split('\n').length;
            patterns.push({
                name: 'Render Props',
                type: 'render-props',
                confidence: 0.85,
                location: { line, column: match.index },
                description: '通过函数props共享组件逻辑',
                pros: ['灵活的逻辑共享', '运行时决定渲染内容', '类型安全'],
                cons: ['回调地狱', '性能影响', '复杂的组件层次'],
                recommendations: ['考虑使用自定义Hook', '优化渲染性能', '简化回调层次']
            });
        }

        // 检测复合组件模式
        const compoundPattern = /(\w+)\.(\w+)\s*=/g;
        while ((match = compoundPattern.exec(code)) !== null) {
            const line = code.substring(0, match.index).split('\n').length;
            patterns.push({
                name: 'Compound Component',
                type: 'compound',
                confidence: 0.75,
                location: { line, column: match.index },
                description: '复合组件模式用于构建灵活的API',
                pros: ['API灵活性', '组件组合', '关注点分离'],
                cons: ['复杂的内部状态管理', '学习成本', '过度抽象'],
                recommendations: ['使用Context共享状态', '提供清晰的API文档', '保持组件简单']
            });
        }

        // 检测自定义Hook模式
        const hookPattern = /function\s+use\w+|const\s+use\w+\s*=/g;
        while ((match = hookPattern.exec(code)) !== null) {
            const line = code.substring(0, match.index).split('\n').length;
            patterns.push({
                name: 'Custom Hook',
                type: 'hook',
                confidence: 0.95,
                location: { line, column: match.index },
                description: '自定义Hook用于状态逻辑复用',
                pros: ['逻辑复用', '状态封装', '测试友好'],
                cons: ['过度抽象', 'Hook规则限制', '依赖追踪'],
                recommendations: ['遵循Hook规则', '保持Hook单一职责', '添加适当的依赖']
            });
        }

        return patterns;
    }

    private async analyzePerformanceIssues(code: string): Promise<ReactPerformanceIssue[]> {
        const issues: ReactPerformanceIssue[] = [];

        // 检测不必要的重渲染
        const inlineFunctionPattern = /onClick\s*=\s*\{[^}]*=>/g;
        let match;
        while ((match = inlineFunctionPattern.exec(code)) !== null) {
            const line = code.substring(0, match.index).split('\n').length;
            issues.push({
                type: 'rendering',
                severity: 'medium',
                location: { line, column: match.index },
                issue: '内联函数会导致不必要的重渲染',
                impact: '每次父组件渲染时创建新函数，导致子组件重渲染',
                solution: '使用useCallback包装函数或将函数定义在组件外部',
                codeExample: `// 问题代码
<Button onClick={() => handleClick(id)} />

// 优化后
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<Button onClick={handleButtonClick} />`,
                estimatedImprovement: '减少10-30%的不必要渲染'
            });
        }

        // 检测缺少依赖的useEffect
        const useEffectPattern = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\},\s*\[([^\]]*)\]/g;
        while ((match = useEffectPattern.exec(code)) !== null) {
            const deps = match[1].trim();
            if (deps === '') {
                const line = code.substring(0, match.index).split('\n').length;
                issues.push({
                    type: 'memory',
                    severity: 'high',
                    location: { line, column: match.index },
                    issue: 'useEffect缺少依赖数组，可能导致内存泄漏',
                    impact: '组件卸载后effect可能仍在执行，导致内存泄漏或状态更新错误',
                    solution: '添加适当的依赖数组或清理函数',
                    codeExample: `// 问题代码
useEffect(() => {
  const timer = setInterval(() => setCount(c => c + 1), 1000);
});

// 优化后
useEffect(() => {
  const timer = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(timer);
}, []);`,
                    estimatedImprovement: '消除内存泄漏风险'
                });
            }
        }

        // 检测大组件拆分机会
        const componentLines = code.split('\n').length;
        if (componentLines > 200) {
            issues.push({
                type: 'bundle',
                severity: 'medium',
                location: { line: 1, column: 0 },
                issue: '组件过大，建议拆分成更小的组件',
                impact: '大组件难以维护、测试和复用，影响代码可读性',
                solution: '按功能拆分成多个小组件，使用组合模式',
                estimatedImprovement: '提高代码可维护性和复用性'
            });
        }

        // 检测状态过度更新
        const setStatePattern = /set\w+\s*\(/g;
        const setStateCount = (code.match(setStatePattern) || []).length;
        if (setStateCount > 10) {
            issues.push({
                type: 'state',
                severity: 'medium',
                location: { line: 1, column: 0 },
                issue: '组件中状态更新过于频繁',
                impact: '频繁的状态更新可能导致性能问题和不必要的重渲染',
                solution: '考虑使用useReducer合并相关状态，或使用batching优化',
                estimatedImprovement: '减少状态更新频率和渲染次数'
            });
        }

        return issues;
    }

    private async analyzeBestPractices(code: string): Promise<ReactBestPracticeViolation[]> {
        const violations: ReactBestPracticeViolation[] = [];

        // 检测未使用key属性
        const mapWithoutKeyPattern = /\{[^}]*\.map\s*\([^}]*<\w+[^>]*(?!key)/g;
        let match;
        while ((match = mapWithoutKeyPattern.exec(code)) !== null) {
            const line = code.substring(0, match.index).split('\n').length;
            violations.push({
                rule: 'Missing Key Prop',
                category: 'components',
                severity: 'error',
                location: { line, column: match.index },
                message: '在列表渲染中缺少key属性',
                fix: '为每个列表项添加唯一的key属性',
                example: `{items.map(item => <Item key={item.id} data={item} />)}`
            });
        }

        // 检测Hook规则违反
        const conditionalHookPattern = /if\s*\([^)]*\)\s*\{[^}]*use\w+/g;
        while ((match = conditionalHookPattern.exec(code)) !== null) {
            const line = code.substring(0, match.index).split('\n').length;
            violations.push({
                rule: 'Hook Rules Violation',
                category: 'hooks',
                severity: 'error',
                location: { line, column: match.index },
                message: 'Hook不能在条件语句中调用',
                fix: '将Hook调用移到组件顶层，使用条件判断Hook的返回值',
                example: `const data = useData(); // 正确
if (condition && data) { /* 使用data */ }`
            });
        }

        // 检测未处理的Promise
        const unhandledPromisePattern = /fetch\s*\([^)]*\)(?!\s*\.then|\s*\.catch)/g;
        while ((match = unhandledPromisePattern.exec(code)) !== null) {
            const line = code.substring(0, match.index).split('\n').length;
            violations.push({
                rule: 'Unhandled Promise',
                category: 'state',
                severity: 'warning',
                location: { line, column: match.index },
                message: 'Promise未正确处理错误',
                fix: '添加错误处理逻辑',
                example: `fetch(url).then(response => response.json()).catch(error => console.error(error))`
            });
        }

        return violations;
    }

    private async analyzeComponents(code: string): Promise<ReactComponentAnalysis[]> {
        const components: ReactComponentAnalysis[] = [];
        const functionComponentPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|\w+))\s*[\s\S]*?(?=function\s+\w+|const\s+\w+\s*=|$)/g;
        
        let match;
        while ((match = functionComponentPattern.exec(code)) !== null) {
            const componentName = match[1] || match[2];
            if (componentName && /^[A-Z]/.test(componentName)) {
                const componentCode = match[0];
                const hooks = this.extractHooks(componentCode);
                const props = this.extractProps(componentCode);
                const dependencies = this.extractDependencies(componentCode);
                const complexity = this.calculateComplexity(componentCode);

                components.push({
                    name: componentName,
                    type: 'functional',
                    complexity,
                    hooks,
                    props,
                    dependencies,
                    renderCount: this.estimateRenderCount(componentCode),
                    reRenderTriggers: this.identifyReRenderTriggers(componentCode),
                    optimizationOpportunities: this.identifyOptimizationOpportunities(componentCode)
                });
            }
        }

        return components;
    }

    private extractHooks(code: string): string[] {
        const hookPattern = /use\w+/g;
        const matches = code.match(hookPattern) || [];
        return [...new Set(matches)];
    }

    private extractProps(code: string): Array<{ name: string; type: string; required: boolean }> {
        const props: Array<{ name: string; type: string; required: boolean }> = [];
        
        // 简单的props提取（实际实现需要更复杂的AST解析）
        const destructuringPattern = /\{\s*([^}]+)\s*\}/;
        const match = destructuringPattern.exec(code);
        
        if (match) {
            const propsString = match[1];
            const propNames = propsString.split(',').map(p => p.trim());
            
            propNames.forEach(propName => {
                props.push({
                    name: propName.replace(/[=:].*/g, '').trim(),
                    type: 'any', // 需要TypeScript解析获取实际类型
                    required: !propName.includes('=')
                });
            });
        }

        return props;
    }

    private extractDependencies(code: string): string[] {
        const importPattern = /import\s+(?:\w+(?:\s*,\s*)?|\{[^}]+\})\s+from\s+['"']([^'"']+)['"']/g;
        const dependencies: string[] = [];
        let match;

        while ((match = importPattern.exec(code)) !== null) {
            dependencies.push(match[1]);
        }

        return dependencies;
    }

    private calculateComplexity(code: string): number {
        // 简单的圈复杂度计算
        const complexityPatterns = [
            /if\s*\(/g,
            /else\s*if\s*\(/g,
            /else\s*\{/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /case\s+/g,
            /catch\s*\(/g,
            /&&/g,
            /\|\|/g,
            /\?[^:]*:/g
        ];

        let complexity = 1; // 基础复杂度
        complexityPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });

        return complexity;
    }

    private estimateRenderCount(code: string): number {
        // 基于状态变化和props变化估算渲染次数
        const stateUpdates = (code.match(/set\w+\s*\(/g) || []).length;
        const effectsCount = (code.match(/useEffect/g) || []).length;
        return Math.max(1, stateUpdates + effectsCount);
    }

    private identifyReRenderTriggers(code: string): string[] {
        const triggers: string[] = [];
        
        // 状态更新触发器
        const statePattern = /const\s*\[\s*\w+\s*,\s*(\w+)\s*\]/g;
        let match;
        while ((match = statePattern.exec(code)) !== null) {
            triggers.push(`State update: ${match[1]}`);
        }

        // Props变化触发器
        if (code.includes('props.')) {
            triggers.push('Props changes');
        }

        // Context变化触发器
        if (code.includes('useContext')) {
            triggers.push('Context changes');
        }

        return triggers;
    }

    private identifyOptimizationOpportunities(code: string): string[] {
        const opportunities: string[] = [];

        // 检测可以memo化的组件
        if (!code.includes('React.memo') && !code.includes('memo(')) {
            opportunities.push('考虑使用React.memo优化组件');
        }

        // 检测可以使用useCallback的函数
        if (code.includes('onClick=') && !code.includes('useCallback')) {
            opportunities.push('使用useCallback优化事件处理函数');
        }

        // 检测可以使用useMemo的计算
        if (code.includes('filter(') || code.includes('map(') || code.includes('reduce(')) {
            if (!code.includes('useMemo')) {
                opportunities.push('使用useMemo缓存计算结果');
            }
        }

        // 检测代码分割机会
        if (code.includes('import(') || code.split('\n').length > 100) {
            opportunities.push('考虑进行代码分割和懒加载');
        }

        return opportunities;
    }

    private async analyzeBundleOptimization(code: string, filePath: string): Promise<any> {
        return {
            totalSize: code.length, // 简化计算
            unusedImports: await this.findUnusedImports(code),
            codeSpli5: {
                implemented: code.includes('import(') || code.includes('lazy('),
                suggestions: this.suggestCodeSplitting(code)
            },
            treeShaking: {
                effective: this.analyzeTreeShaking(code),
                improvements: this.suggestTreeShakingImprovements(code)
            }
        };
    }

    private async findUnusedImports(code: string): Promise<string[]> {
        const unusedImports: string[] = [];
        const importPattern = /import\s+(?:\{([^}]+)\}|\w+)\s+from\s+['"']([^'"']+)['"']/g;
        let match: RegExpExecArray | null;

        while ((match = importPattern.exec(code)) !== null) {
            const imports = match[1] ? match[1].split(',').map(i => i.trim()) : [match[0]];
            imports.forEach(importName => {
                const cleanImportName = importName.replace(/\s+as\s+\w+/, '').trim();
                if (!code.includes(cleanImportName) || code.indexOf(cleanImportName) === match!.index) {
                    unusedImports.push(cleanImportName);
                }
            });
        }

        return unusedImports;
    }

    private suggestCodeSplitting(code: string): string[] {
        const suggestions: string[] = [];
        
        if (code.includes('BrowserRouter') || code.includes('Routes')) {
            suggestions.push('使用React.lazy()进行路由级别的代码分割');
        }

        if (code.length > 5000) {
            suggestions.push('考虑将大组件拆分成独立的chunk');
        }

        if (code.includes('import') && code.includes('Modal')) {
            suggestions.push('对Modal等非关键UI组件进行懒加载');
        }

        return suggestions;
    }

    private analyzeTreeShaking(code: string): boolean {
        return code.includes('import {') && !code.includes('import *');
    }

    private suggestTreeShakingImprovements(code: string): string[] {
        const suggestions: string[] = [];
        
        if (code.includes('import * from')) {
            suggestions.push('避免使用import * from，使用具名导入');
        }

        if (code.includes('lodash') && !code.includes('lodash/')) {
            suggestions.push('使用lodash的具体函数导入而不是整个库');
        }

        return suggestions;
    }

    private async analyzeStateManagement(code: string): Promise<any> {
        let pattern: string = 'useState';
        let complexity = 1;
        const issues: string[] = [];
        const recommendations: string[] = [];

        // 检测状态管理模式
        if (code.includes('useReducer')) {
            pattern = 'useReducer';
            complexity = 2;
        }
        if (code.includes('createContext') || code.includes('useContext')) {
            pattern = 'context';
            complexity = 3;
        }
        if (code.includes('redux') || code.includes('useSelector')) {
            pattern = 'redux';
            complexity = 4;
        }
        if (code.includes('zustand')) {
            pattern = 'zustand';
            complexity = 3;
        }

        // 分析状态复杂度
        const stateCount = (code.match(/useState/g) || []).length;
        if (stateCount > 5) {
            issues.push('组件状态过多，建议使用useReducer或提升状态');
            recommendations.push('将相关状态合并，使用useReducer管理复杂状态');
        }

        return {
            pattern,
            complexity,
            issues,
            recommendations
        };
    }

    private async analyzeTestability(code: string): Promise<any> {
        let score = 100;
        const untestableComponents: string[] = [];
        const recommendations: string[] = [];

        // 检测不可测试的模式
        if (code.includes('document.') || code.includes('window.')) {
            score -= 20;
            recommendations.push('避免直接使用DOM/Window API，使用依赖注入');
        }

        if (code.includes('Math.random') || code.includes('Date.now')) {
            score -= 15;
            recommendations.push('避免使用不确定的函数，使用依赖注入或mock');
        }

        if (!code.includes('data-testid') && !code.includes('role=')) {
            score -= 10;
            recommendations.push('添加测试ID或ARIA标签便于测试');
        }

        const testableComponents = Math.max(0, score / 20);

        return {
            score: Math.max(0, score),
            testableComponents,
            untestableComponents,
            recommendations
        };
    }

    private calculateOverallScore(analysis: any): number {
        const weights = {
            performance: 0.3,
            bestPractices: 0.25,
            architecture: 0.2,
            bundle: 0.15,
            testability: 0.1
        };

        const performanceScore = Math.max(0, 100 - analysis.performanceIssues.length * 15);
        const bestPracticesScore = Math.max(0, 100 - analysis.bestPracticeViolations.length * 10);
        const architectureScore = Math.min(100, analysis.architecturePatterns.length * 25);
        const bundleScore = analysis.bundleAnalysis.codeSpli5.implemented ? 100 : 60;
        const testabilityScore = analysis.testability.score;

        return Math.round(
            performanceScore * weights.performance +
            bestPracticesScore * weights.bestPractices +
            architectureScore * weights.architecture +
            bundleScore * weights.bundle +
            testabilityScore * weights.testability
        );
    }

    private generateRecommendations(analysis: any): any {
        const immediate: string[] = [];
        const shortTerm: string[] = [];
        const longTerm: string[] = [];

        // 立即处理的问题
        analysis.performanceIssues.forEach((issue: ReactPerformanceIssue) => {
            if (issue.severity === 'critical' || issue.severity === 'high') {
                immediate.push(issue.solution);
            }
        });

        analysis.bestPracticeViolations.forEach((violation: ReactBestPracticeViolation) => {
            if (violation.severity === 'error') {
                immediate.push(violation.fix);
            }
        });

        // 短期改进
        analysis.componentAnalysis.forEach((component: ReactComponentAnalysis) => {
            component.optimizationOpportunities.forEach(opportunity => {
                shortTerm.push(opportunity);
            });
        });

        // 长期规划
        if (analysis.architecturePatterns.length < 2) {
            longTerm.push('考虑引入更多架构模式提高代码复用性');
        }

        if (!analysis.bundleAnalysis.codeSpli5.implemented) {
            longTerm.push('实施代码分割策略优化首次加载性能');
        }

        return { immediate, shortTerm, longTerm };
    }
}

export const reactAdvancedArchitectureAnalyzer = new ReactAdvancedArchitectureAnalyzer();
