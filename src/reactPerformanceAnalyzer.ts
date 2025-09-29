import * as vscode from 'vscode';
import { ReactComponent } from './reactAnalyzer';
import { ReactRoute, ReactContext, ReduxStore, ReactForm, APICall } from './advancedReactAnalyzer';

// React性能分析接口
export interface ReactPerformanceIssue {
    type: 'memory-leak' | 'unnecessary-render' | 'large-bundle' | 'slow-component';
    component: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestion: string;
    line: number;
}

export interface ReactBundleAnalysis {
    totalSize: number;
    chunks: ReactChunk[];
    duplicatedDependencies: string[];
    unusedDependencies: string[];
    heavyComponents: string[];
}

export interface ReactChunk {
    name: string;
    size: number;
    files: string[];
}

// React架构分析
export interface ReactArchitecturePattern {
    pattern: 'MVC' | 'MVP' | 'MVVM' | 'Redux' | 'Context-Reducer' | 'Custom';
    components: string[];
    dataFlow: 'unidirectional' | 'bidirectional' | 'mixed';
    stateManagement: 'local' | 'global' | 'mixed';
    complexity: number;
}

export interface ReactComponentDependency {
    from: string;
    to: string;
    type: 'props' | 'context' | 'state' | 'event';
    strength: number;
}

export class ReactPerformanceAnalyzer {
    private performancePatterns: Map<string, RegExp>;
    
    constructor() {
        this.performancePatterns = new Map([
            // 性能问题模式
            ['inline-function', /onClick=\{.*?=>/],
            ['inline-object', /style=\{\{.*?\}\}/],
            ['missing-key', /<\w+(?![^>]*key=)/],
            ['unused-state', /useState\([^)]*\)/],
            ['large-component', /export\s+(?:default\s+)?(?:function|const)\s+\w+[\s\S]{2000,}?(?=export|$)/],
            // 内存泄漏模式
            ['missing-cleanup', /useEffect\([^,]*,\s*\[\]/],
            ['direct-dom', /document\./],
            ['global-variable', /window\./],
        ]);
    }

    analyzePerformance(text: string, fileName: string, components: ReactComponent[]): ReactPerformanceIssue[] {
        const issues: ReactPerformanceIssue[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // 检查内联函数
            if (this.performancePatterns.get('inline-function')?.test(line)) {
                issues.push({
                    type: 'unnecessary-render',
                    component: this.findComponentName(text, lineNumber),
                    description: '内联函数会导致子组件不必要的重新渲染',
                    severity: 'medium',
                    suggestion: '将函数定义移到组件外部或使用useCallback',
                    line: lineNumber
                });
            }

            // 检查内联对象
            if (this.performancePatterns.get('inline-object')?.test(line)) {
                issues.push({
                    type: 'unnecessary-render',
                    component: this.findComponentName(text, lineNumber),
                    description: '内联样式对象会导致重新渲染',
                    severity: 'low',
                    suggestion: '将样式对象提取到组件外部或使用CSS模块',
                    line: lineNumber
                });
            }

            // 检查缺失的key属性
            if (line.includes('.map(') && this.performancePatterns.get('missing-key')?.test(line)) {
                issues.push({
                    type: 'unnecessary-render',
                    component: this.findComponentName(text, lineNumber),
                    description: '列表项缺少key属性',
                    severity: 'high',
                    suggestion: '为每个列表项添加唯一的key属性',
                    line: lineNumber
                });
            }

            // 检查可能的内存泄漏
            if (line.includes('useEffect') && !line.includes('return') && 
                (line.includes('setInterval') || line.includes('setTimeout') || 
                 line.includes('addEventListener'))) {
                issues.push({
                    type: 'memory-leak',
                    component: this.findComponentName(text, lineNumber),
                    description: '可能存在内存泄漏：未清理副作用',
                    severity: 'critical',
                    suggestion: '在useEffect的返回函数中清理副作用',
                    line: lineNumber
                });
            }
        }

        // 检查组件大小
        components.forEach(component => {
            const componentText = this.extractComponentText(text, component.name);
            if (componentText.length > 2000) {
                issues.push({
                    type: 'large-bundle',
                    component: component.name,
                    description: '组件过大，影响性能和可维护性',
                    severity: 'medium',
                    suggestion: '考虑将组件拆分为更小的子组件',
                    line: component.line
                });
            }
        });

        return issues;
    }

    analyzeArchitecture(text: string, components: ReactComponent[], 
                       contexts: ReactContext[], stores: ReduxStore[]): ReactArchitecturePattern {
        
        // 分析架构模式
        let pattern: ReactArchitecturePattern['pattern'] = 'Custom';
        
        if (stores.length > 0) {
            pattern = 'Redux';
        } else if (contexts.length > 0) {
            pattern = 'Context-Reducer';
        } else if (this.hasClassComponents(components)) {
            pattern = 'MVC';
        }

        // 分析数据流
        const dataFlow = this.analyzeDataFlow(text, components);
        
        // 分析状态管理
        const stateManagement = this.analyzeStateManagement(text, components, contexts, stores);
        
        // 计算复杂度
        const complexity = this.calculateComplexity(components, contexts, stores);

        return {
            pattern,
            components: components.map(c => c.name),
            dataFlow,
            stateManagement,
            complexity
        };
    }

    analyzeComponentDependencies(text: string, components: ReactComponent[]): ReactComponentDependency[] {
        const dependencies: ReactComponentDependency[] = [];
        
        components.forEach(component => {
            const componentText = this.extractComponentText(text, component.name);
            
            // 分析Props依赖
            const propsMatches = componentText.match(/<(\w+)[^>]*>/g);
            if (propsMatches) {
                propsMatches.forEach(match => {
                    const tagMatch = match.match(/<(\w+)/);
                    if (tagMatch) {
                        const targetComponent = tagMatch[1];
                        if (components.some(c => c.name === targetComponent)) {
                            dependencies.push({
                                from: component.name,
                                to: targetComponent,
                                type: 'props',
                                strength: this.calculateDependencyStrength(match)
                            });
                        }
                    }
                });
            }

            // 分析Context依赖  
            const contextMatches = componentText.match(/useContext\((\w+)\)/g);
            if (contextMatches) {
                contextMatches.forEach(match => {
                    const contextMatch = match.match(/useContext\((\w+)\)/);
                    if (contextMatch) {
                        dependencies.push({
                            from: component.name,
                            to: contextMatch[1],
                            type: 'context',
                            strength: 3
                        });
                    }
                });
            }

            // 分析状态依赖
            const stateMatches = componentText.match(/\w+\.\w+/g);
            if (stateMatches) {
                stateMatches.forEach(match => {
                    dependencies.push({
                        from: component.name,
                        to: match,
                        type: 'state',
                        strength: 2
                    });
                });
            }
        });

        return dependencies;
    }

    generateOptimizationSuggestionsOld(issues: ReactPerformanceIssue[], 
                                   architecture: ReactArchitecturePattern): string[] {
        const suggestions: string[] = [];
        
        // 基于性能问题的建议
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            suggestions.push('🚨 发现严重性能问题，建议立即修复内存泄漏');
        }

        const renderIssues = issues.filter(i => i.type === 'unnecessary-render');
        if (renderIssues.length > 3) {
            suggestions.push('⚡ 使用React.memo、useMemo和useCallback优化渲染性能');
        }

        const bundleIssues = issues.filter(i => i.type === 'large-bundle');
        if (bundleIssues.length > 0) {
            suggestions.push('📦 考虑代码分割和懒加载来减少包体积');
        }

        // 基于架构的建议
        if (architecture.complexity > 8) {
            suggestions.push('🏗️ 架构复杂度较高，建议重构为更简单的结构');
        }

        if (architecture.dataFlow === 'bidirectional') {
            suggestions.push('🔄 双向数据流可能导致状态同步问题，考虑使用单向数据流');
        }

        if (architecture.stateManagement === 'mixed') {
            suggestions.push('📊 状态管理方式混合，建议统一状态管理策略');
        }

        return suggestions;
    }

    private findComponentName(text: string, lineNumber: number): string {
        const lines = text.split('\n');
        
        // 向上查找最近的组件定义
        for (let i = lineNumber - 1; i >= 0; i--) {
            const line = lines[i];
            const componentMatch = line.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+(\w+)/);
            if (componentMatch) {
                return componentMatch[1];
            }
        }
        
        return 'Unknown';
    }

    private extractComponentText(text: string, componentName: string): string {
        const lines = text.split('\n');
        let startLine = -1;
        let endLine = -1;
        let braceCount = 0;
        
        // 找到组件开始位置
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`function ${componentName}`) || 
                lines[i].includes(`const ${componentName}`)) {
                startLine = i;
                break;
            }
        }
        
        if (startLine === -1) {return '';}
        
        // 找到组件结束位置
        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            if (braceCount === 0 && line.includes('}')) {
                endLine = i;
                break;
            }
        }
        
        if (endLine === -1) {endLine = lines.length - 1;}
        
        return lines.slice(startLine, endLine + 1).join('\n');
    }

    private hasClassComponents(components: ReactComponent[]): boolean {
        return components.some(c => c.type === 'class');
    }

    private analyzeDataFlow(text: string, components: ReactComponent[]): 'unidirectional' | 'bidirectional' | 'mixed' {
        // 简化的数据流分析
        const hasUpwardDataFlow = text.includes('onCallback') || text.includes('onChange');
        const hasDownwardDataFlow = text.includes('props.') || text.includes('{...props}');
        
        if (hasUpwardDataFlow && hasDownwardDataFlow) {
            return 'bidirectional';
        } else if (hasDownwardDataFlow) {
            return 'unidirectional';
        } else {
            return 'mixed';
        }
    }

    private analyzeStateManagement(text: string, components: ReactComponent[], 
                                 contexts: ReactContext[], stores: ReduxStore[]): 'local' | 'global' | 'mixed' {
        const hasLocalState = components.some(c => c.hooks.some(h => h.type === 'useState'));
        const hasGlobalState = contexts.length > 0 || stores.length > 0;
        
        if (hasLocalState && hasGlobalState) {
            return 'mixed';
        } else if (hasGlobalState) {
            return 'global';
        } else {
            return 'local';
        }
    }

    private calculateComplexity(components: ReactComponent[], contexts: ReactContext[], 
                               stores: ReduxStore[]): number {
        let complexity = 0;
        
        // 组件复杂度
        complexity += components.length * 1;
        complexity += components.reduce((sum, c) => sum + c.hooks.length, 0) * 0.5;
        
        // Context复杂度
        complexity += contexts.length * 2;
        
        // Redux复杂度
        complexity += stores.length * 3;
        complexity += stores.reduce((sum, s) => sum + s.actions.length + s.reducers.length, 0) * 0.3;
        
        return Math.round(complexity);
    }

    private calculateDependencyStrength(propsText: string): number {
        // 根据传递的props数量计算依赖强度
        const propsCount = (propsText.match(/\w+=/g) || []).length;
        return Math.min(propsCount, 5);
    }

    // 添加缺失的主要分析方法
    analyzeReactPerformance(content: string, fileName?: string): Promise<{
        renderScore: number;
        memoryScore: number;
        optimizationScore: number;
        issues: ReactPerformanceIssue[];
        bundleAnalysis: ReactBundleAnalysis;
    }> {
        return new Promise((resolve) => {
            const issues = this.analyzePerformance(content, fileName || '', []);
            
            // 计算性能得分
            const criticalIssues = issues.filter(i => i.severity === 'critical').length;
            const highIssues = issues.filter(i => i.severity === 'high').length;
            const mediumIssues = issues.filter(i => i.severity === 'medium').length;
            
            const renderScore = Math.max(0, 100 - (criticalIssues * 30 + highIssues * 15 + mediumIssues * 5));
            const memoryScore = Math.max(0, 100 - (criticalIssues * 25 + highIssues * 10 + mediumIssues * 3));
            const optimizationScore = Math.max(0, 100 - (criticalIssues * 20 + highIssues * 8 + mediumIssues * 2));
            
            // 简化的bundle分析
            const bundleAnalysis: ReactBundleAnalysis = {
                totalSize: this.estimateBundleSize(content),
                chunks: this.analyzeChunks(content),
                duplicatedDependencies: this.findDuplicatedDeps(content),
                unusedDependencies: this.findUnusedDeps(content),
                heavyComponents: this.findHeavyComponents(content)
            };
            
            resolve({
                renderScore,
                memoryScore,
                optimizationScore,
                issues,
                bundleAnalysis
            });
        });
    }

    generateOptimizationSuggestions(content: string): Promise<{
        suggestions: Array<{
            priority: 'high' | 'medium' | 'low';
            title: string;
            description: string;
            example?: string;
        }>;
    }> {
        return new Promise((resolve) => {
            const suggestions = [];
            
            // 检查常见优化点
            if (content.includes('useEffect') && !content.includes('dependency array')) {
                suggestions.push({
                    priority: 'high' as const,
                    title: '优化useEffect依赖',
                    description: '添加正确的依赖数组以避免不必要的重新渲染',
                    example: 'useEffect(() => { ... }, [dependency1, dependency2])'
                });
            }
            
            if (content.includes('function ') && content.includes('onClick')) {
                suggestions.push({
                    priority: 'medium' as const,
                    title: '使用useCallback优化事件处理器',
                    description: '缓存事件处理函数以减少子组件重新渲染',
                    example: 'const handleClick = useCallback(() => { ... }, [deps])'
                });
            }
            
            if (content.includes('map(') && !content.includes('key=')) {
                suggestions.push({
                    priority: 'high' as const,
                    title: '为列表项添加key属性',
                    description: '为map渲染的列表项添加唯一key以提高渲染性能',
                    example: '{items.map(item => <Item key={item.id} {...item} />)}'
                });
            }
            
            if (content.includes('expensive calculation')) {
                suggestions.push({
                    priority: 'medium' as const,
                    title: '使用useMemo缓存计算结果',
                    description: '对昂贵的计算使用useMemo进行缓存',
                    example: 'const expensiveValue = useMemo(() => calculation(), [deps])'
                });
            }
            
            resolve({ suggestions });
        });
    }

    private estimateBundleSize(content: string): number {
        // 简化的bundle大小估算
        return Math.floor(content.length * 0.8); // 假设压缩后约80%
    }

    private analyzeChunks(content: string): ReactChunk[] {
        // 简化的chunk分析
        return [
            {
                name: 'main',
                size: this.estimateBundleSize(content) * 0.6,
                files: ['main.js']
            },
            {
                name: 'vendors',
                size: this.estimateBundleSize(content) * 0.4,
                files: ['vendors.js']
            }
        ];
    }

    private findDuplicatedDeps(content: string): string[] {
        // 简化的重复依赖检测
        const imports = content.match(/import.*from ['"]([^'"]+)['"]/g) || [];
        const deps = imports.map(imp => imp.match(/from ['"]([^'"]+)['"]/)?.[1]).filter(Boolean);
        const duplicated = deps.filter((dep, index) => deps.indexOf(dep) !== index);
        return [...new Set(duplicated)] as string[];
    }

    private findUnusedDeps(content: string): string[] {
        // 简化的未使用依赖检测
        const imports = content.match(/import\s+(?:\{[^}]*\}|\w+)\s+from\s+['"]([^'"]+)['"]/g) || [];
        const unused: string[] = [];
        
        imports.forEach(imp => {
            const match = imp.match(/import\s+(?:\{([^}]*)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
            if (match) {
                const [, namedImports, defaultImport] = match;
                if (namedImports) {
                    namedImports.split(',').forEach(named => {
                        const name = named.trim();
                        if (!content.includes(name)) {
                            unused.push(name);
                        }
                    });
                } else if (defaultImport && !content.includes(defaultImport)) {
                    unused.push(defaultImport);
                }
            }
        });
        
        return unused;
    }

    private findHeavyComponents(content: string): string[] {
        // 检测可能的重型组件
        const components = content.match(/(?:function|const)\s+(\w+).*?(?:React\.FC|JSX\.Element)/g) || [];
        return components
            .map(comp => comp.match(/(?:function|const)\s+(\w+)/)?.[1])
            .filter(Boolean)
            .filter(name => {
                // 简单启发式：包含大量代码的组件可能较重
                const componentMatch = content.match(new RegExp(`(?:function|const)\\s+${name}[\\s\\S]*?(?=(?:function|const|export|$))`));
                return componentMatch && componentMatch[0].length > 1000;
            }) as string[];
    }
}

// 为了兼容性，也导出ReactAdvancedAnalyzer别名
export { ReactPerformanceAnalyzer as ReactAdvancedAnalyzer };
