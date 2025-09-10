// React高级组件架构分析器
export interface ReactComponentDependency {
    componentName: string;
    dependencies: string[];
    dependents: string[];
    cyclic: boolean;
    complexity: number;
}

export interface ReactHookDependency {
    hookName: string;
    dependencies: string[];
    recomputeFrequency: 'low' | 'medium' | 'high';
    optimizationSuggestion: string;
    line: number;
}

export interface ReactRenderOptimization {
    componentName: string;
    issues: string[];
    solutions: string[];
    priority: 'low' | 'medium' | 'high';
    estimatedImprovement: string;
    line: number;
}

export interface ReactStateFlowAnalysis {
    stateVariables: {
        name: string;
        type: string;
        mutations: number;
        scope: 'local' | 'global' | 'context';
        line: number;
    }[];
    dataFlow: {
        from: string;
        to: string;
        type: 'props' | 'state' | 'context' | 'callback';
    }[];
    stateComplexity: number;
}

export interface ReactBundleAnalysis {
    totalComponents: number;
    codeSize: number;
    importedLibraries: string[];
    heavyComponents: string[];
    unusedImports: string[];
    optimizationPotential: string;
}

export interface ReactAdvancedComponentAnalysis {
    componentDependencies: ReactComponentDependency[];
    hookDependencies: ReactHookDependency[];
    renderOptimizations: ReactRenderOptimization[];
    stateFlow: ReactStateFlowAnalysis;
    bundleAnalysis: ReactBundleAnalysis;
    architectureScore: number;
    recommendations: string[];
}

export class ReactAdvancedComponentAnalyzer {
    analyzeAdvancedComponents(code: string, fileName: string): ReactAdvancedComponentAnalysis {
        return {
            componentDependencies: this.analyzeComponentDependencies(code),
            hookDependencies: this.analyzeHookDependencies(code),
            renderOptimizations: this.analyzeRenderOptimizations(code),
            stateFlow: this.analyzeStateFlow(code),
            bundleAnalysis: this.analyzeBundleImpact(code),
            architectureScore: this.calculateArchitectureScore(code),
            recommendations: this.generateRecommendations(code)
        };
    }

    private analyzeComponentDependencies(code: string): ReactComponentDependency[] {
        const dependencies: ReactComponentDependency[] = [];
        const componentMatches = code.match(/(?:function|const)\s+(\w+Component|\w+)\s*(?:\(|\s*=)/g) || [];
        const importMatches = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g) || [];
        
        componentMatches.forEach((match, index) => {
            const componentName = match.match(/(?:function|const)\s+(\w+)/)?.[1] || `Component${index}`;
            const componentCode = this.extractComponentCode(code, componentName);
            const componentDeps = this.findComponentDependencies(componentCode);
            
            dependencies.push({
                componentName,
                dependencies: componentDeps,
                dependents: this.findDependents(code, componentName),
                cyclic: this.detectCyclicDependencies(componentName, componentDeps, dependencies),
                complexity: this.calculateComponentComplexity(componentCode)
            });
        });

        return dependencies;
    }

    private analyzeHookDependencies(code: string): ReactHookDependency[] {
        const hookDeps: ReactHookDependency[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            // 分析useEffect依赖
            const useEffectMatch = line.match(/useEffect\s*\(\s*[^,]+,\s*\[([^\]]*)\]/);
            if (useEffectMatch) {
                const deps = useEffectMatch[1].split(',').map(d => d.trim()).filter(d => d);
                hookDeps.push({
                    hookName: 'useEffect',
                    dependencies: deps,
                    recomputeFrequency: deps.length > 3 ? 'high' : deps.length > 1 ? 'medium' : 'low',
                    optimizationSuggestion: this.suggestEffectOptimization(deps),
                    line: index + 1
                });
            }

            // 分析useMemo依赖
            const useMemoMatch = line.match(/useMemo\s*\(\s*[^,]+,\s*\[([^\]]*)\]/);
            if (useMemoMatch) {
                const deps = useMemoMatch[1].split(',').map(d => d.trim()).filter(d => d);
                hookDeps.push({
                    hookName: 'useMemo',
                    dependencies: deps,
                    recomputeFrequency: this.estimateRecomputeFrequency(deps, code),
                    optimizationSuggestion: this.suggestMemoOptimization(deps),
                    line: index + 1
                });
            }

            // 分析useCallback依赖
            const useCallbackMatch = line.match(/useCallback\s*\(\s*[^,]+,\s*\[([^\]]*)\]/);
            if (useCallbackMatch) {
                const deps = useCallbackMatch[1].split(',').map(d => d.trim()).filter(d => d);
                hookDeps.push({
                    hookName: 'useCallback',
                    dependencies: deps,
                    recomputeFrequency: this.estimateRecomputeFrequency(deps, code),
                    optimizationSuggestion: this.suggestCallbackOptimization(deps),
                    line: index + 1
                });
            }
        });

        return hookDeps;
    }

    private analyzeRenderOptimizations(code: string): ReactRenderOptimization[] {
        const optimizations: ReactRenderOptimization[] = [];
        const lines = code.split('\n');
        const componentMatches = code.match(/(?:function|const)\s+(\w+)\s*(?:\(|\s*=)/g) || [];

        componentMatches.forEach(match => {
            const componentName = match.match(/(?:function|const)\s+(\w+)/)?.[1] || 'Unknown';
            const componentCode = this.extractComponentCode(code, componentName);
            const issues: string[] = [];
            const solutions: string[] = [];
            let priority: 'low' | 'medium' | 'high' = 'low';

            // 检测内联对象创建
            if (componentCode.includes('style={{') || componentCode.includes('className={`')) {
                issues.push('内联样式对象导致不必要的重渲染');
                solutions.push('将样式对象提取到组件外部或使用useMemo');
                priority = 'medium';
            }

            // 检测内联函数
            if (componentCode.match(/on\w+={(.*?=>.*)}/)) {
                issues.push('内联箭头函数导致子组件重渲染');
                solutions.push('使用useCallback缓存函数或提取到组件外部');
                priority = 'high';
            }

            // 检测缺少React.memo
            if (!componentCode.includes('React.memo') && !componentCode.includes('memo(')) {
                const hasProps = componentCode.includes('props') || componentCode.match(/\(\s*\{\s*\w+/);
                if (hasProps) {
                    issues.push('组件未使用React.memo进行优化');
                    solutions.push('考虑使用React.memo包装组件');
                    priority = priority === 'high' ? 'high' : 'medium';
                }
            }

            // 检测大型渲染列表
            if (componentCode.includes('.map(') && !componentCode.includes('key=')) {
                issues.push('列表渲染缺少key属性');
                solutions.push('为列表项添加唯一的key属性');
                priority = 'high';
            }

            if (issues.length > 0) {
                optimizations.push({
                    componentName,
                    issues,
                    solutions,
                    priority,
                    estimatedImprovement: this.estimatePerformanceImprovement(issues),
                    line: this.findComponentLine(lines, componentName)
                });
            }
        });

        return optimizations;
    }

    private analyzeStateFlow(code: string): ReactStateFlowAnalysis {
        const stateVariables: any[] = [];
        const dataFlow: any[] = [];
        const lines = code.split('\n');

        // 分析useState变量
        lines.forEach((line, index) => {
            const useStateMatch = line.match(/const\s+\[(\w+),\s*(\w+)\]\s*=\s*useState\s*\(([^)]*)\)/);
            if (useStateMatch) {
                const stateName = useStateMatch[1];
                const mutations = this.countStateMutations(code, useStateMatch[2]);
                stateVariables.push({
                    name: stateName,
                    type: this.inferStateType(useStateMatch[3]),
                    mutations,
                    scope: 'local',
                    line: index + 1
                });
            }

            // 分析Context使用
            const contextMatch = line.match(/const\s+(\w+)\s*=\s*useContext\s*\((\w+)\)/);
            if (contextMatch) {
                stateVariables.push({
                    name: contextMatch[1],
                    type: 'context',
                    mutations: 0,
                    scope: 'context',
                    line: index + 1
                });
            }
        });

        // 分析数据流
        stateVariables.forEach(stateVar => {
            const propsUsage = this.findPropsUsage(code, stateVar.name);
            propsUsage.forEach(usage => {
                dataFlow.push({
                    from: stateVar.name,
                    to: usage,
                    type: 'state'
                });
            });
        });

        return {
            stateVariables,
            dataFlow,
            stateComplexity: this.calculateStateComplexity(stateVariables, dataFlow)
        };
    }

    private analyzeBundleImpact(code: string): ReactBundleAnalysis {
        const importMatches = code.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || [];
        const componentMatches = code.match(/(?:function|const)\s+(\w+Component|\w+)\s*(?:\(|\s*=)/g) || [];
        
        const importedLibraries = importMatches.map(imp => {
            const match = imp.match(/from\s+['"]([^'"]+)['"]/);
            return match ? match[1] : '';
        }).filter(lib => lib && !lib.startsWith('.'));

        const heavyComponents = componentMatches
            .map(match => match.match(/(?:function|const)\s+(\w+)/)?.[1] || '')
            .filter(name => {
                const componentCode = this.extractComponentCode(code, name);
                return componentCode.length > 1000; // 认为超过1000字符的组件为重型组件
            });

        const unusedImports = this.findUnusedImports(code, importMatches);

        return {
            totalComponents: componentMatches.length,
            codeSize: code.length,
            importedLibraries,
            heavyComponents,
            unusedImports,
            optimizationPotential: this.assessOptimizationPotential(importedLibraries, heavyComponents, unusedImports)
        };
    }

    private calculateArchitectureScore(code: string): number {
        let score = 100;
        
        // 扣分项
        const inlineFunctions = (code.match(/on\w+={(.*?=>.*?)}/g) || []).length;
        score -= inlineFunctions * 5;
        
        const inlineStyles = (code.match(/style={{/g) || []).length;
        score -= inlineStyles * 3;
        
        const missingKeys = (code.match(/\.map\([^}]*\)/) || []).length - (code.match(/key=/g) || []).length;
        score -= Math.max(0, missingKeys) * 10;
        
        // 加分项
        const memoUsage = (code.match(/React\.memo|useMemo|useCallback/g) || []).length;
        score += memoUsage * 5;
        
        const propTypesUsage = code.includes('PropTypes') ? 10 : 0;
        score += propTypesUsage;

        return Math.max(0, Math.min(100, score));
    }

    private generateRecommendations(code: string): string[] {
        const recommendations: string[] = [];
        
        if (code.includes('on') && code.includes('=>')) {
            recommendations.push('使用useCallback优化事件处理函数');
        }
        
        if (!code.includes('React.memo') && code.includes('props')) {
            recommendations.push('考虑使用React.memo包装纯组件');
        }
        
        if (code.includes('.map(') && !code.includes('key=')) {
            recommendations.push('为列表渲染添加key属性');
        }
        
        if (code.includes('useState') && !code.includes('useCallback')) {
            recommendations.push('对于复杂状态更新，考虑使用useCallback');
        }
        
        if (!code.includes('PropTypes') && !code.includes('interface')) {
            recommendations.push('添加类型定义或PropTypes验证');
        }

        return recommendations;
    }

    // 辅助方法
    private extractComponentCode(code: string, componentName: string): string {
        const regex = new RegExp(`(?:function|const)\\s+${componentName}[\\s\\S]*?(?=(?:function|const|export|$))`, 'i');
        const match = code.match(regex);
        return match ? match[0] : '';
    }

    private findComponentDependencies(componentCode: string): string[] {
        const imports = componentCode.match(/import\s+\{([^}]+)\}/g) || [];
        const deps: string[] = [];
        imports.forEach(imp => {
            const match = imp.match(/\{([^}]+)\}/);
            if (match) {
                deps.push(...match[1].split(',').map(d => d.trim()));
            }
        });
        return deps;
    }

    private findDependents(code: string, componentName: string): string[] {
        const regex = new RegExp(`<${componentName}[\\s/>]`, 'g');
        const matches = code.match(regex) || [];
        return matches.map(() => `使用${componentName}的组件`);
    }

    private detectCyclicDependencies(componentName: string, dependencies: string[], allDeps: ReactComponentDependency[]): boolean {
        // 简化的循环依赖检测
        return dependencies.some(dep => 
            allDeps.some(d => d.componentName === dep && d.dependencies.includes(componentName))
        );
    }

    private calculateComponentComplexity(componentCode: string): number {
        let complexity = 1;
        complexity += (componentCode.match(/if\s*\(/g) || []).length;
        complexity += (componentCode.match(/\?\s*.*?\s*:/g) || []).length;
        complexity += (componentCode.match(/&&/g) || []).length;
        complexity += (componentCode.match(/\.map\(/g) || []).length;
        return complexity;
    }

    private suggestEffectOptimization(deps: string[]): string {
        if (deps.length === 0) return '考虑是否需要依赖数组';
        if (deps.length > 5) return '依赖过多，考虑拆分useEffect';
        return '依赖合理';
    }

    private suggestMemoOptimization(deps: string[]): string {
        if (deps.length === 0) return '不需要useMemo，考虑移除';
        if (deps.length > 3) return '依赖较多，确保必要性';
        return '使用合理';
    }

    private suggestCallbackOptimization(deps: string[]): string {
        if (deps.length === 0) return '考虑是否真的需要useCallback';
        return '使用合理，有助于性能优化';
    }

    private estimateRecomputeFrequency(deps: string[], code: string): 'low' | 'medium' | 'high' {
        if (deps.length === 0) return 'low';
        
        let changeFreq = 0;
        deps.forEach(dep => {
            if (code.includes(`set${dep.charAt(0).toUpperCase() + dep.slice(1)}`)) {
                changeFreq++;
            }
        });
        
        return changeFreq > 2 ? 'high' : changeFreq > 0 ? 'medium' : 'low';
    }

    private estimatePerformanceImprovement(issues: string[]): string {
        const highImpactIssues = issues.filter(issue => 
            issue.includes('内联函数') || issue.includes('key属性')
        ).length;
        
        if (highImpactIssues > 0) return '20-40%性能提升';
        if (issues.length > 2) return '10-20%性能提升';
        return '5-10%性能提升';
    }

    private findComponentLine(lines: string[], componentName: string): number {
        const index = lines.findIndex(line => 
            line.includes(`function ${componentName}`) || 
            line.includes(`const ${componentName}`)
        );
        return index >= 0 ? index + 1 : 1;
    }

    private countStateMutations(code: string, setterName: string): number {
        const regex = new RegExp(setterName, 'g');
        return (code.match(regex) || []).length;
    }

    private inferStateType(initialValue: string): string {
        if (initialValue.includes('[')) return 'array';
        if (initialValue.includes('{')) return 'object';
        if (initialValue.includes('true') || initialValue.includes('false')) return 'boolean';
        if (!isNaN(Number(initialValue))) return 'number';
        return 'string';
    }

    private findPropsUsage(code: string, stateName: string): string[] {
        const regex = new RegExp(`${stateName}=\\{([^}]+)\\}`, 'g');
        const matches = code.match(regex) || [];
        return matches.map(match => match.split('=')[0]);
    }

    private calculateStateComplexity(states: any[], flows: any[]): number {
        return states.length + flows.length + states.reduce((sum, s) => sum + s.mutations, 0);
    }

    private findUnusedImports(code: string, imports: string[]): string[] {
        const unused: string[] = [];
        imports.forEach(imp => {
            const match = imp.match(/import\s+\{([^}]+)\}/);
            if (match) {
                const importedItems = match[1].split(',').map(item => item.trim());
                importedItems.forEach(item => {
                    if (!code.includes(item)) {
                        unused.push(item);
                    }
                });
            }
        });
        return unused;
    }

    private assessOptimizationPotential(libs: string[], heavyComps: string[], unused: string[]): string {
        let potential = 0;
        potential += libs.length > 10 ? 30 : libs.length * 3;
        potential += heavyComps.length * 20;
        potential += unused.length * 5;
        
        if (potential > 50) return '高优化潜力';
        if (potential > 20) return '中等优化潜力';
        return '低优化潜力';
    }
}
