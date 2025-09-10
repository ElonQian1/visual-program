import * as vscode from 'vscode';

// React Hook 高级分析器
export interface ReactHookAnalysis {
    stateHooks: StateHookAnalysis[];
    effectHooks: EffectHookAnalysis[];
    contextHooks: ContextHookAnalysis[];
    customHooks: CustomHookAnalysis[];
    performanceHooks: PerformanceHookAnalysis[];
    optimizationSuggestions: OptimizationSuggestion[];
}

export interface StateHookAnalysis {
    hookType: 'useState' | 'useReducer' | 'useImmer';
    stateName: string;
    initialValue: string;
    updatePattern: 'direct' | 'functional' | 'batched' | 'optimistic';
    dependencies: string[];
    line: number;
    complexity: 'simple' | 'medium' | 'complex';
    antiPatterns: string[];
    suggestions: string[];
}

export interface EffectHookAnalysis {
    effectType: 'useEffect' | 'useLayoutEffect' | 'useInsertionEffect';
    dependencies: string[];
    cleanupFunction: boolean;
    runCondition: 'mount' | 'update' | 'conditional' | 'every-render';
    potentialIssues: EffectIssue[];
    line: number;
    performance: 'optimal' | 'warning' | 'critical';
}

export interface EffectIssue {
    type: 'missing-dependency' | 'stale-closure' | 'infinite-loop' | 'memory-leak' | 'unnecessary-rerun';
    description: string;
    suggestion: string;
    severity: 'info' | 'warning' | 'error';
}

export interface ContextHookAnalysis {
    contextName: string;
    providerLevel: number;
    consumerCount: number;
    valueStability: 'stable' | 'unstable' | 'optimized';
    selectors: ContextSelector[];
    line: number;
    optimizationOpportunities: string[];
}

export interface ContextSelector {
    property: string;
    usage: 'read' | 'write' | 'both';
    frequency: 'rare' | 'occasional' | 'frequent';
}

export interface CustomHookAnalysis {
    hookName: string;
    parameters: HookParameter[];
    returnValues: HookReturnValue[];
    internalHooks: string[];
    reusability: 'low' | 'medium' | 'high';
    complexity: number;
    line: number;
    testCoverage: 'none' | 'partial' | 'full';
}

export interface HookParameter {
    name: string;
    type: string;
    optional: boolean;
    defaultValue?: string;
}

export interface HookReturnValue {
    name: string;
    type: string;
    stability: 'stable' | 'derived' | 'callback';
}

export interface PerformanceHookAnalysis {
    hookType: 'useMemo' | 'useCallback' | 'useTransition' | 'useDeferredValue';
    dependencies: string[];
    computationCost: 'low' | 'medium' | 'high';
    effectiveness: 'beneficial' | 'neutral' | 'harmful';
    line: number;
    alternatives: string[];
}

export interface OptimizationSuggestion {
    type: 'performance' | 'memory' | 'readability' | 'maintainability';
    description: string;
    impact: 'low' | 'medium' | 'high';
    difficulty: 'easy' | 'medium' | 'hard';
    codeExample?: string;
    line: number;
}

export class ReactHookAnalyzer {
    analyzeReactHooks(text: string, fileName: string): ReactHookAnalysis {
        const lines = text.split('\n');
        
        return {
            stateHooks: this.analyzeStateHooks(lines),
            effectHooks: this.analyzeEffectHooks(lines),
            contextHooks: this.analyzeContextHooks(lines),
            customHooks: this.analyzeCustomHooks(lines),
            performanceHooks: this.analyzePerformanceHooks(lines),
            optimizationSuggestions: this.generateOptimizationSuggestions(lines)
        };
    }

    private analyzeStateHooks(lines: string[]): StateHookAnalysis[] {
        const stateHooks: StateHookAnalysis[] = [];
        
        lines.forEach((line, index) => {
            // useState 模式分析
            const useStateMatch = line.match(/const\s*\[([^,]+),\s*([^\]]+)\]\s*=\s*useState\(([^)]*)\)/);
            if (useStateMatch) {
                const [, stateName, setterName, initialValue] = useStateMatch;
                
                stateHooks.push({
                    hookType: 'useState',
                    stateName: stateName.trim(),
                    initialValue: initialValue.trim(),
                    updatePattern: this.detectUpdatePattern(lines, setterName.trim(), index),
                    dependencies: this.findStateDependencies(lines, stateName.trim()),
                    line: index + 1,
                    complexity: this.assessStateComplexity(initialValue),
                    antiPatterns: this.detectStateAntiPatterns(lines, stateName.trim(), index),
                    suggestions: this.generateStateSuggestions(initialValue, stateName.trim())
                });
            }

            // useReducer 模式分析
            const useReducerMatch = line.match(/const\s*\[([^,]+),\s*([^\]]+)\]\s*=\s*useReducer\(([^,]+),\s*([^)]*)\)/);
            if (useReducerMatch) {
                const [, stateName, dispatchName, reducer, initialState] = useReducerMatch;
                
                stateHooks.push({
                    hookType: 'useReducer',
                    stateName: stateName.trim(),
                    initialValue: initialState.trim(),
                    updatePattern: 'functional',
                    dependencies: this.findReducerDependencies(lines, reducer.trim()),
                    line: index + 1,
                    complexity: 'complex',
                    antiPatterns: this.detectReducerAntiPatterns(lines, dispatchName.trim()),
                    suggestions: this.generateReducerSuggestions(reducer.trim())
                });
            }
        });

        return stateHooks;
    }

    private analyzeEffectHooks(lines: string[]): EffectHookAnalysis[] {
        const effectHooks: EffectHookAnalysis[] = [];
        
        lines.forEach((line, index) => {
            const effectMatch = line.match(/(useEffect|useLayoutEffect|useInsertionEffect)\s*\(\s*([^,]+),?\s*(\[[^\]]*\])?\s*\)/);
            if (effectMatch) {
                const [, hookType, , dependencyArray] = effectMatch;
                const dependencies = this.parseDependencyArray(dependencyArray);
                
                effectHooks.push({
                    effectType: hookType as any,
                    dependencies,
                    cleanupFunction: this.hasCleanupFunction(lines, index),
                    runCondition: this.determineRunCondition(dependencies),
                    potentialIssues: this.detectEffectIssues(lines, index, dependencies),
                    line: index + 1,
                    performance: this.assessEffectPerformance(dependencies, lines, index)
                });
            }
        });

        return effectHooks;
    }

    private analyzeContextHooks(lines: string[]): ContextHookAnalysis[] {
        const contextHooks: ContextHookAnalysis[] = [];
        
        lines.forEach((line, index) => {
            const contextMatch = line.match(/const\s+([^=]+)\s*=\s*useContext\(([^)]+)\)/);
            if (contextMatch) {
                const [, contextValue, contextName] = contextMatch;
                
                contextHooks.push({
                    contextName: contextName.trim(),
                    providerLevel: this.calculateProviderLevel(lines, contextName.trim()),
                    consumerCount: this.countContextConsumers(lines, contextName.trim()),
                    valueStability: this.assessContextStability(lines, contextName.trim()),
                    selectors: this.findContextSelectors(lines, contextValue.trim()),
                    line: index + 1,
                    optimizationOpportunities: this.findContextOptimizations(lines, contextName.trim())
                });
            }
        });

        return contextHooks;
    }

    private analyzeCustomHooks(lines: string[]): CustomHookAnalysis[] {
        const customHooks: CustomHookAnalysis[] = [];
        
        lines.forEach((line, index) => {
            const customHookMatch = line.match(/function\s+(use[A-Z][^(]*)\s*\(([^)]*)\)/);
            if (customHookMatch) {
                const [, hookName, params] = customHookMatch;
                
                customHooks.push({
                    hookName: hookName.trim(),
                    parameters: this.parseHookParameters(params),
                    returnValues: this.analyzeHookReturnValues(lines, index),
                    internalHooks: this.findInternalHooks(lines, index),
                    reusability: this.assessReusability(lines, index, hookName.trim()),
                    complexity: this.calculateHookComplexity(lines, index),
                    line: index + 1,
                    testCoverage: this.assessTestCoverage(lines, hookName.trim())
                });
            }
        });

        return customHooks;
    }

    private analyzePerformanceHooks(lines: string[]): PerformanceHookAnalysis[] {
        const performanceHooks: PerformanceHookAnalysis[] = [];
        
        lines.forEach((line, index) => {
            const memoMatch = line.match(/(useMemo|useCallback|useTransition|useDeferredValue)\s*\(([^,]+),?\s*(\[[^\]]*\])?\s*\)/);
            if (memoMatch) {
                const [, hookType, computation, dependencyArray] = memoMatch;
                const dependencies = this.parseDependencyArray(dependencyArray);
                
                performanceHooks.push({
                    hookType: hookType as any,
                    dependencies,
                    computationCost: this.assessComputationCost(computation),
                    effectiveness: this.assessMemoEffectiveness(lines, index, dependencies),
                    line: index + 1,
                    alternatives: this.suggestAlternatives(hookType, computation)
                });
            }
        });

        return performanceHooks;
    }

    private generateOptimizationSuggestions(lines: string[]): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        
        // 检查常见的优化机会
        lines.forEach((line, index) => {
            // 检测不必要的useEffect
            if (line.includes('useEffect') && line.includes('[]')) {
                const effectBody = this.getEffectBody(lines, index);
                if (!effectBody.includes('cleanup') && !effectBody.includes('return')) {
                    suggestions.push({
                        type: 'performance',
                        description: '考虑将此useEffect移到组件外部或使用useState的初始化函数',
                        impact: 'medium',
                        difficulty: 'easy',
                        line: index + 1
                    });
                }
            }

            // 检测过度使用useMemo
            if (line.includes('useMemo') && this.isSimpleComputation(line)) {
                suggestions.push({
                    type: 'performance',
                    description: '简单计算不需要useMemo，直接计算可能更快',
                    impact: 'low',
                    difficulty: 'easy',
                    line: index + 1
                });
            }

            // 检测内联对象/函数
            if (this.hasInlineObjectOrFunction(line)) {
                suggestions.push({
                    type: 'performance',
                    description: '内联对象/函数会导致不必要的重渲染，考虑使用useMemo/useCallback',
                    impact: 'high',
                    difficulty: 'medium',
                    line: index + 1
                });
            }
        });

        return suggestions;
    }

    // 辅助方法
    private detectUpdatePattern(lines: string[], setterName: string, startIndex: number): 'direct' | 'functional' | 'batched' | 'optimistic' {
        const usages = this.findSetterUsages(lines, setterName);
        
        if (usages.some(usage => usage.includes('prev') || usage.includes('=>'))) {
            return 'functional';
        }
        if (usages.length > 3) {
            return 'batched';
        }
        return 'direct';
    }

    private assessStateComplexity(initialValue: string): 'simple' | 'medium' | 'complex' {
        if (initialValue.includes('{') || initialValue.includes('[')) {
            return 'complex';
        }
        if (initialValue.includes('()') || initialValue.length > 20) {
            return 'medium';
        }
        return 'simple';
    }

    private detectStateAntiPatterns(lines: string[], stateName: string, startIndex: number): string[] {
        const antiPatterns: string[] = [];
        
        // 检测直接修改状态
        if (this.hasDirectStateMutation(lines, stateName)) {
            antiPatterns.push('直接修改状态对象');
        }

        // 检测在渲染中调用setter
        if (this.hasSetterInRender(lines, stateName)) {
            antiPatterns.push('在渲染过程中调用状态setter');
        }

        return antiPatterns;
    }

    private generateStateSuggestions(initialValue: string, stateName: string): string[] {
        const suggestions: string[] = [];
        
        if (initialValue.includes('{') && !initialValue.includes('useState')) {
            suggestions.push('考虑使用useReducer管理复杂状态');
        }

        if (stateName.includes('loading') || stateName.includes('error')) {
            suggestions.push('考虑使用自定义Hook封装异步状态管理');
        }

        return suggestions;
    }

    private parseDependencyArray(depArray?: string): string[] {
        if (!depArray || depArray === '[]') return [];
        return depArray.slice(1, -1).split(',').map(dep => dep.trim());
    }

    private hasCleanupFunction(lines: string[], effectIndex: number): boolean {
        const effectBody = this.getEffectBody(lines, effectIndex);
        return effectBody.includes('return ') && effectBody.includes('=>') || effectBody.includes('function');
    }

    private determineRunCondition(dependencies: string[]): 'mount' | 'update' | 'conditional' | 'every-render' {
        if (dependencies.length === 0) return 'mount';
        if (dependencies.length > 0) return 'conditional';
        return 'every-render';
    }

    private detectEffectIssues(lines: string[], effectIndex: number, dependencies: string[]): EffectIssue[] {
        const issues: EffectIssue[] = [];
        const effectBody = this.getEffectBody(lines, effectIndex);
        
        // 检测遗漏的依赖
        const usedVars = this.extractUsedVariables(effectBody);
        const missingDeps = usedVars.filter(v => !dependencies.includes(v) && this.isReactiveDependency(v));
        
        if (missingDeps.length > 0) {
            issues.push({
                type: 'missing-dependency',
                description: `遗漏依赖: ${missingDeps.join(', ')}`,
                suggestion: '添加到依赖数组中',
                severity: 'warning'
            });
        }

        return issues;
    }

    private assessEffectPerformance(dependencies: string[], lines: string[], index: number): 'optimal' | 'warning' | 'critical' {
        if (dependencies.length > 5) return 'warning';
        if (this.hasExpensiveOperationInEffect(lines, index)) return 'critical';
        return 'optimal';
    }

    // 更多辅助方法的实现...
    private findStateDependencies(lines: string[], stateName: string): string[] {
        // 实现状态依赖查找逻辑
        return [];
    }

    private findSetterUsages(lines: string[], setterName: string): string[] {
        return lines.filter(line => line.includes(setterName));
    }

    private hasDirectStateMutation(lines: string[], stateName: string): boolean {
        return lines.some(line => line.includes(`${stateName}.`) && line.includes('='));
    }

    private hasSetterInRender(lines: string[], stateName: string): boolean {
        // 简化实现
        return false;
    }

    private getEffectBody(lines: string[], startIndex: number): string {
        // 获取effect函数体
        let body = '';
        let braceCount = 0;
        let started = false;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('useEffect')) started = true;
            if (!started) continue;
            
            body += line + '\n';
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            if (braceCount === 0 && started) break;
        }
        
        return body;
    }

    private extractUsedVariables(code: string): string[] {
        const matches = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
        return [...new Set(matches)];
    }

    private isReactiveDependency(variable: string): boolean {
        const reactiveKeywords = ['state', 'props', 'context', 'ref'];
        return reactiveKeywords.some(keyword => variable.toLowerCase().includes(keyword));
    }

    private hasExpensiveOperationInEffect(lines: string[], index: number): boolean {
        const effectBody = this.getEffectBody(lines, index);
        const expensiveOps = ['fetch', 'setTimeout', 'setInterval', 'getElementById'];
        return expensiveOps.some(op => effectBody.includes(op));
    }

    private calculateProviderLevel(lines: string[], contextName: string): number {
        // 简化实现
        return 1;
    }

    private countContextConsumers(lines: string[], contextName: string): number {
        return lines.filter(line => line.includes(`useContext(${contextName})`)).length;
    }

    private assessContextStability(lines: string[], contextName: string): 'stable' | 'unstable' | 'optimized' {
        // 简化实现
        return 'stable';
    }

    private findContextSelectors(lines: string[], contextValue: string): ContextSelector[] {
        return [];
    }

    private findContextOptimizations(lines: string[], contextName: string): string[] {
        return [];
    }

    private parseHookParameters(params: string): HookParameter[] {
        if (!params.trim()) return [];
        
        return params.split(',').map(param => {
            const trimmed = param.trim();
            const optional = trimmed.includes('?');
            const hasDefault = trimmed.includes('=');
            
            return {
                name: trimmed.split(':')[0].replace('?', '').trim(),
                type: trimmed.split(':')[1]?.split('=')[0]?.trim() || 'any',
                optional,
                defaultValue: hasDefault ? trimmed.split('=')[1]?.trim() : undefined
            };
        });
    }

    private analyzeHookReturnValues(lines: string[], startIndex: number): HookReturnValue[] {
        // 简化实现
        return [];
    }

    private findInternalHooks(lines: string[], startIndex: number): string[] {
        const hookBody = this.getHookBody(lines, startIndex);
        const hookPattern = /use[A-Z][a-zA-Z]*/g;
        return [...new Set(hookBody.match(hookPattern) || [])];
    }

    private getHookBody(lines: string[], startIndex: number): string {
        // 类似于getEffectBody的实现
        return lines.slice(startIndex, startIndex + 10).join('\n');
    }

    private assessReusability(lines: string[], index: number, hookName: string): 'low' | 'medium' | 'high' {
        const usages = lines.filter(line => line.includes(hookName)).length;
        if (usages > 3) return 'high';
        if (usages > 1) return 'medium';
        return 'low';
    }

    private calculateHookComplexity(lines: string[], startIndex: number): number {
        const hookBody = this.getHookBody(lines, startIndex);
        return (hookBody.match(/if|for|while|switch/g) || []).length;
    }

    private assessTestCoverage(lines: string[], hookName: string): 'none' | 'partial' | 'full' {
        // 简化实现，实际需要检查测试文件
        return 'none';
    }

    private assessComputationCost(computation: string): 'low' | 'medium' | 'high' {
        if (computation.includes('map') || computation.includes('filter')) return 'medium';
        if (computation.includes('sort') || computation.includes('reduce')) return 'high';
        return 'low';
    }

    private assessMemoEffectiveness(lines: string[], index: number, dependencies: string[]): 'beneficial' | 'neutral' | 'harmful' {
        if (dependencies.length === 0) return 'harmful';
        if (dependencies.length > 5) return 'neutral';
        return 'beneficial';
    }

    private suggestAlternatives(hookType: string, computation: string): string[] {
        const alternatives: string[] = [];
        
        if (hookType === 'useMemo' && computation.length < 20) {
            alternatives.push('直接计算可能更快');
        }
        
        if (hookType === 'useCallback' && !computation.includes('expensive')) {
            alternatives.push('考虑是否真的需要缓存');
        }

        return alternatives;
    }

    private isSimpleComputation(line: string): boolean {
        return !line.includes('map') && !line.includes('filter') && !line.includes('reduce') && line.length < 50;
    }

    private hasInlineObjectOrFunction(line: string): boolean {
        return (line.includes('{') && line.includes('}')) || (line.includes('=>') && !line.includes('useCallback'));
    }

    private findReducerDependencies(lines: string[], reducer: string): string[] {
        return [];
    }

    private detectReducerAntiPatterns(lines: string[], dispatchName: string): string[] {
        return [];
    }

    private generateReducerSuggestions(reducer: string): string[] {
        return [];
    }
}
