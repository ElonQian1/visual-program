import * as vscode from 'vscode';

export interface ReactHookOptimizationAnalysis {
    hookDependencyIssues: HookDependencyIssue[];
    customHookOpportunities: CustomHookOpportunity[];
    hookPerformanceIssues: HookPerformanceIssue[];
    hookBestPractices: HookBestPractice[];
    hookComplexityScore: number;
    overallScore: {
        dependency: number;
        performance: number;
        reusability: number;
        maintainability: number;
        overall: number;
    };
}

export interface HookDependencyIssue {
    hookName: string;
    line: number;
    issue: string;
    severity: 'high' | 'medium' | 'low';
    currentDependencies: string[];
    suggestedDependencies: string[];
    explanation: string;
    fix: string;
    impact: string;
}

export interface CustomHookOpportunity {
    pattern: string;
    occurrences: number;
    suggestedHookName: string;
    extractedLogic: string;
    benefits: string[];
    implementation: string;
    complexity: 'simple' | 'moderate' | 'complex';
}

export interface HookPerformanceIssue {
    hookName: string;
    component: string;
    line: number;
    issue: string;
    performanceImpact: 'high' | 'medium' | 'low';
    solution: string;
    alternativeImplementation: string;
    benchmarkImprovement: string;
}

export interface HookBestPractice {
    rule: string;
    violations: Array<{
        line: number;
        description: string;
        suggestion: string;
        example: string;
    }>;
    category: 'dependency' | 'naming' | 'structure' | 'performance';
    importance: 'critical' | 'important' | 'recommended';
}

export class ReactHookOptimizationAnalyzer {
    
    async analyzeHookOptimization(content: string, fileName: string): Promise<ReactHookOptimizationAnalysis> {
        const lines = content.split('\n');
        
        const hookDependencyIssues = this.analyzeHookDependencies(lines);
        const customHookOpportunities = this.identifyCustomHookOpportunities(lines);
        const hookPerformanceIssues = this.analyzeHookPerformance(lines);
        const hookBestPractices = this.checkHookBestPractices(lines);
        const hookComplexityScore = this.calculateHookComplexity(lines);
        const overallScore = this.calculateOverallScore(
            hookDependencyIssues,
            customHookOpportunities,
            hookPerformanceIssues,
            hookBestPractices,
            hookComplexityScore
        );

        return {
            hookDependencyIssues,
            customHookOpportunities,
            hookPerformanceIssues,
            hookBestPractices,
            hookComplexityScore,
            overallScore
        };
    }

    private analyzeHookDependencies(lines: string[]): HookDependencyIssue[] {
        const issues: HookDependencyIssue[] = [];
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // 检测useEffect依赖问题
            if (trimmed.includes('useEffect')) {
                const effectMatch = line.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([^}]*)\}/);
                if (effectMatch) {
                    const effectBody = effectMatch[1];
                    const dependencyMatch = line.match(/\],\s*\[([^\]]*)\]/);
                    
                    if (dependencyMatch) {
                        const currentDeps = dependencyMatch[1].split(',').map(d => d.trim()).filter(d => d);
                        const usedVariables = this.extractUsedVariables(effectBody);
                        const missedDeps = usedVariables.filter(v => !currentDeps.includes(v));
                        const unnecessaryDeps = currentDeps.filter(d => !usedVariables.includes(d));
                        
                        if (missedDeps.length > 0) {
                            issues.push({
                                hookName: 'useEffect',
                                line: index + 1,
                                issue: '缺少依赖项',
                                severity: 'high',
                                currentDependencies: currentDeps,
                                suggestedDependencies: [...currentDeps, ...missedDeps],
                                explanation: `Effect使用了变量 ${missedDeps.join(', ')} 但未在依赖数组中声明`,
                                fix: `添加 ${missedDeps.join(', ')} 到依赖数组`,
                                impact: '可能导致stale closure问题，Effect不会在变量变化时重新执行'
                            });
                        }
                        
                        if (unnecessaryDeps.length > 0) {
                            issues.push({
                                hookName: 'useEffect',
                                line: index + 1,
                                issue: '不必要的依赖项',
                                severity: 'medium',
                                currentDependencies: currentDeps,
                                suggestedDependencies: currentDeps.filter(d => !unnecessaryDeps.includes(d)),
                                explanation: `依赖数组包含未使用的变量 ${unnecessaryDeps.join(', ')}`,
                                fix: `移除 ${unnecessaryDeps.join(', ')} 从依赖数组`,
                                impact: '可能导致不必要的Effect重新执行，影响性能'
                            });
                        }
                    }
                }
            }

            // 检测useMemo和useCallback依赖问题
            if (trimmed.includes('useMemo') || trimmed.includes('useCallback')) {
                const hookType = trimmed.includes('useMemo') ? 'useMemo' : 'useCallback';
                const dependencyMatch = line.match(/\[([^\]]*)\]/);
                
                if (dependencyMatch) {
                    const currentDeps = dependencyMatch[1].split(',').map(d => d.trim()).filter(d => d);
                    
                    if (currentDeps.length === 0) {
                        issues.push({
                            hookName: hookType,
                            line: index + 1,
                            issue: '空依赖数组',
                            severity: 'medium',
                            currentDependencies: [],
                            suggestedDependencies: ['检查是否需要依赖项'],
                            explanation: `${hookType}使用空依赖数组，值永远不会更新`,
                            fix: '添加必要的依赖项或考虑是否真的需要记忆化',
                            impact: '可能导致使用过期的值，或者不必要的记忆化开销'
                        });
                    }
                }
            }
        });

        return issues;
    }

    private identifyCustomHookOpportunities(lines: string[]): CustomHookOpportunity[] {
        const opportunities: CustomHookOpportunity[] = [];
        const patterns = new Map<string, number>();

        // 识别重复的状态逻辑模式
        const statePatterns = [
            /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\s*\(\s*false\s*\)/g,
            /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\s*\(\s*true\s*\)/g,
            /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\s*\(\s*['""].*['""]\s*\)/g,
            /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\s*\(\s*\[\]\s*\)/g
        ];

        lines.forEach(line => {
            statePatterns.forEach(pattern => {
                const matches = [...line.matchAll(pattern)];
                matches.forEach(match => {
                    const key = match[0].replace(/\w+/g, 'X'); // 泛化模式
                    patterns.set(key, (patterns.get(key) || 0) + 1);
                });
            });
        });

        // 识别fetch数据的模式
        const fetchPattern = /useEffect.*fetch.*useState.*loading.*error/gs;
        const content = lines.join('\n');
        if (fetchPattern.test(content)) {
            const fetchOccurrences = (content.match(/useEffect.*fetch/g) || []).length;
            if (fetchOccurrences >= 2) {
                opportunities.push({
                    pattern: 'fetch数据模式',
                    occurrences: fetchOccurrences,
                    suggestedHookName: 'useFetch',
                    extractedLogic: '数据获取、加载状态、错误处理',
                    benefits: [
                        '减少重复代码',
                        '统一错误处理',
                        '更好的加载状态管理',
                        '可复用的数据获取逻辑'
                    ],
                    implementation: `
const useFetch = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  return { data, loading, error };
};`,
                    complexity: 'moderate'
                });
            }
        }

        // 识别表单处理模式
        const formPattern = /useState.*value.*onChange/gs;
        if (formPattern.test(content)) {
            const formOccurrences = (content.match(/onChange.*setValue/g) || []).length;
            if (formOccurrences >= 3) {
                opportunities.push({
                    pattern: '表单处理模式',
                    occurrences: formOccurrences,
                    suggestedHookName: 'useForm',
                    extractedLogic: '表单值管理、验证、提交处理',
                    benefits: [
                        '简化表单状态管理',
                        '统一验证逻辑',
                        '减少样板代码',
                        '更好的类型安全'
                    ],
                    implementation: `
const useForm = <T>(initialValues: T, validationRules?: ValidationRules<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (validationRules?.[name]) {
      const error = validationRules[name](value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const reset = () => setValues(initialValues);
  const isValid = Object.values(errors).every(error => !error);

  return { values, errors, handleChange, reset, isValid };
};`,
                    complexity: 'complex'
                });
            }
        }

        return opportunities;
    }

    private analyzeHookPerformance(lines: string[]): HookPerformanceIssue[] {
        const issues: HookPerformanceIssue[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测在render中创建的对象/数组
            if (trimmed.includes('useMemo') && trimmed.includes('{}')) {
                issues.push({
                    hookName: 'useMemo',
                    component: 'Unknown',
                    line: index + 1,
                    issue: 'useMemo用于空对象',
                    performanceImpact: 'low',
                    solution: '考虑将空对象提取到组件外部或使用常量',
                    alternativeImplementation: 'const EMPTY_OBJECT = {}; // 在组件外部',
                    benchmarkImprovement: '减少不必要的记忆化开销'
                });
            }

            // 检测过度使用useCallback
            if (trimmed.includes('useCallback') && trimmed.includes('[]')) {
                issues.push({
                    hookName: 'useCallback',
                    component: 'Unknown',
                    line: index + 1,
                    issue: 'useCallback使用空依赖数组',
                    performanceImpact: 'medium',
                    solution: '检查是否真的需要记忆化这个函数',
                    alternativeImplementation: '考虑将函数提取到组件外部或使用useRef',
                    benchmarkImprovement: '避免不必要的函数记忆化开销'
                });
            }

            // 检测在Effect中频繁调用setState
            if (trimmed.includes('useEffect') && line.includes('set') && line.includes('setInterval')) {
                issues.push({
                    hookName: 'useEffect',
                    component: 'Unknown',
                    line: index + 1,
                    issue: 'Effect中使用setInterval可能导致闭包问题',
                    performanceImpact: 'high',
                    solution: '使用useRef存储最新值或使用functional update',
                    alternativeImplementation: 'setState(prev => prev + 1) 或 useRef存储最新状态',
                    benchmarkImprovement: '避免stale closure，确保正确的状态更新'
                });
            }
        });

        return issues;
    }

    private checkHookBestPractices(lines: string[]): HookBestPractice[] {
        const practices: HookBestPractice[] = [];

        // 检查Hook命名规范
        const hookNamingViolations: Array<{line: number; description: string; suggestion: string; example: string}> = [];
        lines.forEach((line, index) => {
            const customHookMatch = line.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
            if (customHookMatch) {
                const hookName = customHookMatch[1];
                if (!hookName.startsWith('use')) {
                    hookNamingViolations.push({
                        line: index + 1,
                        description: `自定义Hook "${hookName}" 未遵循 "use" 前缀规范`,
                        suggestion: `重命名为 "use${hookName.charAt(0).toUpperCase() + hookName.slice(1)}"`,
                        example: `const use${hookName.charAt(0).toUpperCase() + hookName.slice(1)} = () => {}`
                    });
                }
            }
        });

        if (hookNamingViolations.length > 0) {
            practices.push({
                rule: 'Hook命名规范',
                violations: hookNamingViolations,
                category: 'naming',
                importance: 'critical'
            });
        }

        // 检查Hook顺序规则
        const hookOrderViolations: Array<{line: number; description: string; suggestion: string; example: string}> = [];
        let foundConditionalHook = false;
        lines.forEach((line, index) => {
            if (line.includes('if') || line.includes('for') || line.includes('while')) {
                foundConditionalHook = true;
            }
            if (foundConditionalHook && (line.includes('useState') || line.includes('useEffect') || line.includes('useCallback'))) {
                hookOrderViolations.push({
                    line: index + 1,
                    description: 'Hook可能在条件语句中调用',
                    suggestion: '将Hook调用移到组件顶层',
                    example: '// 将所有Hook调用放在组件函数的顶部'
                });
            }
        });

        if (hookOrderViolations.length > 0) {
            practices.push({
                rule: 'Hook调用顺序',
                violations: hookOrderViolations,
                category: 'structure',
                importance: 'critical'
            });
        }

        return practices;
    }

    private calculateHookComplexity(lines: string[]): number {
        let complexity = 0;
        let hookCount = 0;

        lines.forEach(line => {
            // 计算Hook数量
            if (line.includes('useState') || line.includes('useEffect') || line.includes('useCallback') || 
                line.includes('useMemo') || line.includes('useContext') || line.includes('useReducer')) {
                hookCount++;
            }

            // 复杂的依赖数组
            const depMatch = line.match(/\[([^\]]+)\]/);
            if (depMatch) {
                const deps = depMatch[1].split(',').length;
                complexity += deps > 3 ? deps * 2 : deps;
            }

            // 嵌套Effect
            if (line.includes('useEffect') && line.includes('useEffect')) {
                complexity += 10;
            }
        });

        // 基于Hook数量和复杂度计算分数
        const baseScore = Math.max(0, 100 - (hookCount * 5) - complexity);
        return Math.round(baseScore);
    }

    private calculateOverallScore(
        dependencyIssues: HookDependencyIssue[],
        customHookOpportunities: CustomHookOpportunity[],
        performanceIssues: HookPerformanceIssue[],
        bestPractices: HookBestPractice[],
        complexityScore: number
    ) {
        // 依赖项评分
        const highSeverityDeps = dependencyIssues.filter(i => i.severity === 'high').length;
        const mediumSeverityDeps = dependencyIssues.filter(i => i.severity === 'medium').length;
        const dependencyScore = Math.max(0, 100 - (highSeverityDeps * 20) - (mediumSeverityDeps * 10));

        // 性能评分
        const highImpactPerf = performanceIssues.filter(i => i.performanceImpact === 'high').length;
        const mediumImpactPerf = performanceIssues.filter(i => i.performanceImpact === 'medium').length;
        const performanceScore = Math.max(0, 100 - (highImpactPerf * 25) - (mediumImpactPerf * 15));

        // 可复用性评分（基于自定义Hook机会）
        const reusabilityScore = Math.max(20, 100 - (customHookOpportunities.length * 15));

        // 可维护性评分（基于最佳实践）
        const criticalViolations = bestPractices.filter(p => p.importance === 'critical').length;
        const importantViolations = bestPractices.filter(p => p.importance === 'important').length;
        const maintainabilityScore = Math.max(0, 100 - (criticalViolations * 30) - (importantViolations * 15));

        // 总分
        const overallScore = Math.round(
            (dependencyScore * 0.3 + performanceScore * 0.25 + reusabilityScore * 0.2 + 
             maintainabilityScore * 0.15 + complexityScore * 0.1)
        );

        return {
            dependency: Math.round(dependencyScore),
            performance: Math.round(performanceScore),
            reusability: Math.round(reusabilityScore),
            maintainability: Math.round(maintainabilityScore),
            overall: overallScore
        };
    }

    private extractUsedVariables(code: string): string[] {
        // 简化的变量提取逻辑
        const variables: string[] = [];
        const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
        let match;
        
        while ((match = identifierRegex.exec(code)) !== null) {
            const identifier = match[1];
            // 排除JavaScript关键字和常见方法名
            if (!['if', 'else', 'for', 'while', 'function', 'return', 'const', 'let', 'var', 
                  'console', 'log', 'push', 'pop', 'map', 'filter', 'reduce'].includes(identifier)) {
                variables.push(identifier);
            }
        }
        
        return [...new Set(variables)]; // 去重
    }
}
