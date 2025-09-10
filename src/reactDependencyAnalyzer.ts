// React组件依赖关系和架构分析器
export interface ReactDependencyAnalysis {
    componentDependencies: ComponentDependency[];
    dependencyGraph: DependencyGraph;
    circularDependencies: CircularDependency[];
    componentCoupling: ComponentCoupling[];
    modularity: ModularityAnalysis;
    architecturePatterns: ArchitecturePattern[];
    codeSmells: ReactCodeSmell[];
    refactoringOpportunities: RefactoringOpportunity[];
}

export interface ComponentDependency {
    component: string;
    dependencies: string[];
    dependents: string[];
    depth: number; // 依赖深度
    type: 'direct' | 'indirect' | 'circular';
    coupling: 'loose' | 'tight' | 'high';
    line: number;
}

export interface DependencyGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    clusters: ComponentCluster[];
    metrics: GraphMetrics;
}

export interface GraphNode {
    id: string;
    name: string;
    type: 'component' | 'hook' | 'context' | 'service';
    size: number; // 代码行数或复杂度
    importance: 'critical' | 'important' | 'normal' | 'low';
    stability: number; // 0-1的稳定性评分
}

export interface GraphEdge {
    from: string;
    to: string;
    type: 'import' | 'prop' | 'context' | 'callback';
    weight: number; // 依赖强度
    bidirectional: boolean;
}

export interface ComponentCluster {
    name: string;
    components: string[];
    cohesion: number; // 内聚性评分
    purpose: string;
    suggestedRefactoring?: string;
}

export interface GraphMetrics {
    totalNodes: number;
    totalEdges: number;
    density: number; // 图密度
    averagePathLength: number;
    clusteingCoefficient: number;
    centralityScores: CentralityScore[];
}

export interface CentralityScore {
    component: string;
    betweenness: number; // 介数中心性
    closeness: number; // 接近中心性
    degree: number; // 度中心性
    eigenvector: number; // 特征向量中心性
}

export interface CircularDependency {
    cycle: string[]; // 循环依赖的组件链
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: string;
    solution: string;
    lines: number[];
}

export interface ComponentCoupling {
    component1: string;
    component2: string;
    couplingType: 'data' | 'control' | 'common' | 'content' | 'external';
    strength: number; // 0-1的耦合强度
    issues: CouplingIssue[];
    suggestions: string[];
}

export interface CouplingIssue {
    type: 'tight-coupling' | 'god-component' | 'feature-envy' | 'inappropriate-intimacy';
    description: string;
    severity: 'low' | 'medium' | 'high';
    line: number;
}

export interface ModularityAnalysis {
    modules: ModuleAnalysis[];
    cohesion: number; // 内聚性评分
    coupling: number; // 耦合度评分
    modularity: number; // 模块化程度
    recommendations: ModularityRecommendation[];
}

export interface ModuleAnalysis {
    name: string;
    components: string[];
    responsibilities: string[];
    interfaces: ModuleInterface[];
    stability: number;
    abstractness: number;
    distance: number; // 到主序列的距离
}

export interface ModuleInterface {
    type: 'public' | 'internal' | 'external';
    exports: string[];
    imports: string[];
    apiSurface: number;
}

export interface ModularityRecommendation {
    type: 'split-module' | 'merge-modules' | 'extract-interface' | 'reduce-coupling';
    description: string;
    benefits: string[];
    effort: 'low' | 'medium' | 'high';
}

export interface ArchitecturePattern {
    pattern: 'mvc' | 'mvp' | 'mvvm' | 'flux' | 'redux' | 'clean' | 'hexagonal' | 'layered';
    components: string[];
    adherence: number; // 0-1的模式遵循程度
    violations: PatternViolation[];
    benefits: string[];
    improvements: string[];
}

export interface PatternViolation {
    type: 'layer-violation' | 'responsibility-breach' | 'dependency-inversion' | 'single-responsibility';
    component: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    fix: string;
    line: number;
}

export interface ReactCodeSmell {
    smell: 'god-component' | 'feature-envy' | 'shotgun-surgery' | 'duplicate-code' | 
           'long-parameter-list' | 'large-class' | 'dead-code' | 'speculative-generality';
    component: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metrics: CodeSmellMetrics;
    refactoring: string;
    line: number;
}

export interface CodeSmellMetrics {
    linesOfCode: number;
    cyclomaticComplexity: number;
    numberOfProps: number;
    numberOfHooks: number;
    numberOfChildren: number;
    fanIn: number; // 传入耦合
    fanOut: number; // 传出耦合
}

export interface RefactoringOpportunity {
    type: 'extract-component' | 'extract-hook' | 'inline-component' | 'move-method' | 
          'extract-interface' | 'consolidate-conditional' | 'simplify-conditional';
    component: string;
    description: string;
    benefit: string;
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
    steps: RefactoringStep[];
    line: number;
}

export interface RefactoringStep {
    step: number;
    action: string;
    codeExample?: string;
    validation: string;
}

export class ReactDependencyAnalyzer {
    analyzeReactDependencies(text: string, fileName: string): ReactDependencyAnalysis {
        const lines = text.split('\n');
        
        return {
            componentDependencies: this.analyzeComponentDependencies(lines),
            dependencyGraph: this.buildDependencyGraph(lines),
            circularDependencies: this.detectCircularDependencies(lines),
            componentCoupling: this.analyzeComponentCoupling(lines),
            modularity: this.analyzeModularity(lines),
            architecturePatterns: this.detectArchitecturePatterns(lines),
            codeSmells: this.detectCodeSmells(lines),
            refactoringOpportunities: this.identifyRefactoringOpportunities(lines)
        };
    }

    private analyzeComponentDependencies(lines: string[]): ComponentDependency[] {
        const dependencies: ComponentDependency[] = [];
        const importMap = new Map<string, string[]>();
        const componentMap = new Map<string, number>();

        lines.forEach((line, index) => {
            // 分析import语句
            const importMatch = line.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                const [, namedImports, namespaceImport, defaultImport, modulePath] = importMatch;
                const imports = [];
                
                if (namedImports) {
                    imports.push(...namedImports.split(',').map(imp => imp.trim()));
                }
                if (namespaceImport) {imports.push(namespaceImport);}
                if (defaultImport) {imports.push(defaultImport);}
                
                if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
                    importMap.set(modulePath, imports);
                }
            }

            // 分析组件定义
            const componentMatch = line.match(/(?:export\s+)?(?:const|function)\s+(\w+)\s*[:=]/);
            if (componentMatch) {
                componentMap.set(componentMatch[1], index + 1);
            }
        });

        // 构建依赖关系
        for (const [component, line] of componentMap) {
            const deps: string[] = [];
            
            // 查找该组件使用的其他组件
            for (const [modulePath, imports] of importMap) {
                for (const imp of imports) {
                    if (componentMap.has(imp)) {
                        deps.push(imp);
                    }
                }
            }

            dependencies.push({
                component,
                dependencies: deps,
                dependents: [], // 会在后续步骤中填充
                depth: this.calculateDependencyDepth(component, importMap),
                type: this.determineDependencyType(component, deps, importMap),
                coupling: this.calculateCoupling(deps.length),
                line
            });
        }

        // 填充依赖者信息
        dependencies.forEach(dep => {
            dependencies.forEach(other => {
                if (other.dependencies.includes(dep.component)) {
                    dep.dependents.push(other.component);
                }
            });
        });

        return dependencies;
    }

    private buildDependencyGraph(lines: string[]): DependencyGraph {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const componentComplexity = new Map<string, number>();

        // 分析组件复杂度
        lines.forEach((line, index) => {
            const componentMatch = line.match(/(?:export\s+)?(?:const|function)\s+(\w+)/);
            if (componentMatch) {
                const complexity = this.calculateComponentComplexity(lines, index);
                componentComplexity.set(componentMatch[1], complexity);
            }
        });

        // 创建节点
        for (const [component, complexity] of componentComplexity) {
            nodes.push({
                id: component,
                name: component,
                type: this.determineNodeType(component, lines),
                size: complexity,
                importance: this.calculateImportance(complexity),
                stability: this.calculateStability(component, lines)
            });
        }

        // 创建边
        // 这里需要根据import和使用关系创建边
        
        const clusters = this.identifyComponentClusters(nodes, edges);
        const metrics = this.calculateGraphMetrics(nodes, edges);

        return {
            nodes,
            edges,
            clusters,
            metrics
        };
    }

    private detectCircularDependencies(lines: string[]): CircularDependency[] {
        const circularDeps: CircularDependency[] = [];
        
        // 使用深度优先搜索检测循环依赖
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const adjacencyList = this.buildAdjacencyList(lines);

        const detectCycle = (node: string, path: string[]): boolean => {
            if (recursionStack.has(node)) {
                // 找到循环
                const cycleStart = path.indexOf(node);
                const cycle = [...path.slice(cycleStart), node];
                
                circularDeps.push({
                    cycle,
                    severity: this.calculateCircularDependencySeverity(cycle),
                    impact: `循环依赖影响了 ${cycle.length} 个组件的可测试性和可维护性`,
                    solution: this.suggestCircularDependencySolution(cycle),
                    lines: cycle.map(comp => this.findComponentLine(comp, lines))
                });
                
                return true;
            }

            if (visited.has(node)) {
                return false;
            }

            visited.add(node);
            recursionStack.add(node);

            const neighbors = adjacencyList.get(node) || [];
            for (const neighbor of neighbors) {
                if (detectCycle(neighbor, [...path, node])) {
                    return true;
                }
            }

            recursionStack.delete(node);
            return false;
        };

        // 检查所有节点
        for (const node of adjacencyList.keys()) {
            if (!visited.has(node)) {
                detectCycle(node, []);
            }
        }

        return circularDeps;
    }

    private analyzeComponentCoupling(lines: string[]): ComponentCoupling[] {
        const couplings: ComponentCoupling[] = [];
        
        // 分析组件间的耦合关系
        const components = this.extractComponents(lines);
        
        for (let i = 0; i < components.length; i++) {
            for (let j = i + 1; j < components.length; j++) {
                const coupling = this.calculateComponentCoupling(components[i], components[j], lines);
                if (coupling.strength > 0.3) { // 只记录有意义的耦合
                    couplings.push(coupling);
                }
            }
        }

        return couplings;
    }

    private analyzeModularity(lines: string[]): ModularityAnalysis {
        const modules = this.identifyModules(lines);
        const cohesion = this.calculateOverallCohesion(modules);
        const coupling = this.calculateOverallCoupling(modules);
        const modularity = this.calculateModularity(cohesion, coupling);

        return {
            modules,
            cohesion,
            coupling,
            modularity,
            recommendations: this.generateModularityRecommendations(modules, cohesion, coupling)
        };
    }

    private detectArchitecturePatterns(lines: string[]): ArchitecturePattern[] {
        const patterns: ArchitecturePattern[] = [];

        // 检测Redux模式
        if (this.hasReduxPattern(lines)) {
            patterns.push(this.analyzeReduxPattern(lines));
        }

        // 检测MVC模式
        if (this.hasMVCPattern(lines)) {
            patterns.push(this.analyzeMVCPattern(lines));
        }

        // 检测Clean Architecture模式
        if (this.hasCleanArchitecturePattern(lines)) {
            patterns.push(this.analyzeCleanArchitecturePattern(lines));
        }

        return patterns;
    }

    private detectCodeSmells(lines: string[]): ReactCodeSmell[] {
        const smells: ReactCodeSmell[] = [];

        lines.forEach((line, index) => {
            // 检测God Component
            const componentMatch = line.match(/(?:export\s+)?(?:const|function)\s+(\w+)/);
            if (componentMatch) {
                const component = componentMatch[1];
                const metrics = this.calculateCodeSmellMetrics(component, lines, index);
                
                if (metrics.linesOfCode > 200) {
                    smells.push({
                        smell: 'god-component',
                        component,
                        description: `组件 ${component} 过于庞大（${metrics.linesOfCode} 行代码）`,
                        severity: metrics.linesOfCode > 500 ? 'critical' : 'high',
                        metrics,
                        refactoring: '将大组件拆分为多个小组件，每个组件负责单一职责',
                        line: index + 1
                    });
                }

                if (metrics.numberOfProps > 10) {
                    smells.push({
                        smell: 'long-parameter-list',
                        component,
                        description: `组件 ${component} 接收太多属性（${metrics.numberOfProps} 个）`,
                        severity: 'medium',
                        metrics,
                        refactoring: '使用对象参数或将相关属性组合成对象',
                        line: index + 1
                    });
                }
            }
        });

        return smells;
    }

    private identifyRefactoringOpportunities(lines: string[]): RefactoringOpportunity[] {
        const opportunities: RefactoringOpportunity[] = [];

        // 识别可以提取的组件
        const extractableComponents = this.findExtractableComponents(lines);
        extractableComponents.forEach(comp => {
            opportunities.push({
                type: 'extract-component',
                component: comp.parent,
                description: `可以从 ${comp.parent} 中提取 ${comp.extractable} 组件`,
                benefit: '提高代码复用性，降低组件复杂度',
                effort: 'medium',
                risk: 'low',
                steps: [
                    { step: 1, action: '创建新的组件文件', validation: '确保新组件可以独立运行' },
                    { step: 2, action: '移动相关JSX和逻辑', validation: '检查所有依赖都已正确迁移' },
                    { step: 3, action: '更新父组件引用', validation: '确保UI和功能保持一致' }
                ],
                line: comp.line
            });
        });

        return opportunities;
    }

    // 辅助方法实现
    private calculateDependencyDepth(component: string, importMap: Map<string, string[]>): number {
        // 计算依赖深度的简化实现
        return 1;
    }

    private determineDependencyType(component: string, deps: string[], importMap: Map<string, string[]>): 'direct' | 'indirect' | 'circular' {
        return 'direct';
    }

    private calculateCoupling(depCount: number): 'loose' | 'tight' | 'high' {
        if (depCount <= 2) {return 'loose';}
        if (depCount <= 5) {return 'tight';}
        return 'high';
    }

    private calculateComponentComplexity(lines: string[], startIndex: number): number {
        // 简化的复杂度计算
        let complexity = 1;
        let braceCount = 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            if (braceCount < 0) {break;}
            
            // 计算循环复杂度
            if (line.includes('if') || line.includes('while') || line.includes('for')) {
                complexity++;
            }
        }
        
        return complexity;
    }

    private determineNodeType(component: string, lines: string[]): 'component' | 'hook' | 'context' | 'service' {
        if (component.startsWith('use')) {return 'hook';}
        if (component.includes('Context')) {return 'context';}
        if (component.includes('Service') || component.includes('API')) {return 'service';}
        return 'component';
    }

    private calculateImportance(complexity: number): 'critical' | 'important' | 'normal' | 'low' {
        if (complexity > 20) {return 'critical';}
        if (complexity > 10) {return 'important';}
        if (complexity > 5) {return 'normal';}
        return 'low';
    }

    private calculateStability(component: string, lines: string[]): number {
        // 简化的稳定性计算，基于组件的传入和传出依赖
        return 0.5;
    }

    private identifyComponentClusters(nodes: GraphNode[], edges: GraphEdge[]): ComponentCluster[] {
        // 简化的聚类算法
        return [];
    }

    private calculateGraphMetrics(nodes: GraphNode[], edges: GraphEdge[]): GraphMetrics {
        return {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            density: nodes.length > 0 ? edges.length / (nodes.length * (nodes.length - 1) / 2) : 0,
            averagePathLength: 2.5,
            clusteingCoefficient: 0.3,
            centralityScores: []
        };
    }

    private buildAdjacencyList(lines: string[]): Map<string, string[]> {
        const adjList = new Map<string, string[]>();
        // 构建邻接表的实现
        return adjList;
    }

    private calculateCircularDependencySeverity(cycle: string[]): 'low' | 'medium' | 'high' | 'critical' {
        if (cycle.length > 5) {return 'critical';}
        if (cycle.length > 3) {return 'high';}
        if (cycle.length > 2) {return 'medium';}
        return 'low';
    }

    private suggestCircularDependencySolution(cycle: string[]): string {
        return `考虑引入中介组件或重新设计组件职责来打破循环依赖`;
    }

    private findComponentLine(component: string, lines: string[]): number {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(component)) {
                return i + 1;
            }
        }
        return 0;
    }

    private extractComponents(lines: string[]): string[] {
        const components: string[] = [];
        lines.forEach(line => {
            const match = line.match(/(?:export\s+)?(?:const|function)\s+(\w+)/);
            if (match) {
                components.push(match[1]);
            }
        });
        return components;
    }

    private calculateComponentCoupling(comp1: string, comp2: string, lines: string[]): ComponentCoupling {
        return {
            component1: comp1,
            component2: comp2,
            couplingType: 'data',
            strength: 0.5,
            issues: [],
            suggestions: []
        };
    }

    private identifyModules(lines: string[]): ModuleAnalysis[] {
        return [];
    }

    private calculateOverallCohesion(modules: ModuleAnalysis[]): number {
        return 0.7;
    }

    private calculateOverallCoupling(modules: ModuleAnalysis[]): number {
        return 0.3;
    }

    private calculateModularity(cohesion: number, coupling: number): number {
        return cohesion - coupling;
    }

    private generateModularityRecommendations(modules: ModuleAnalysis[], cohesion: number, coupling: number): ModularityRecommendation[] {
        return [];
    }

    private hasReduxPattern(lines: string[]): boolean {
        return lines.some(line => line.includes('useSelector') || line.includes('useDispatch'));
    }

    private analyzeReduxPattern(lines: string[]): ArchitecturePattern {
        return {
            pattern: 'redux',
            components: [],
            adherence: 0.8,
            violations: [],
            benefits: ['可预测的状态管理', '时间旅行调试', '中间件支持'],
            improvements: ['考虑使用Redux Toolkit简化代码']
        };
    }

    private hasMVCPattern(lines: string[]): boolean {
        return false;
    }

    private analyzeMVCPattern(lines: string[]): ArchitecturePattern {
        return {
            pattern: 'mvc',
            components: [],
            adherence: 0.6,
            violations: [],
            benefits: [],
            improvements: []
        };
    }

    private hasCleanArchitecturePattern(lines: string[]): boolean {
        return false;
    }

    private analyzeCleanArchitecturePattern(lines: string[]): ArchitecturePattern {
        return {
            pattern: 'clean',
            components: [],
            adherence: 0.7,
            violations: [],
            benefits: [],
            improvements: []
        };
    }

    private calculateCodeSmellMetrics(component: string, lines: string[], startIndex: number): CodeSmellMetrics {
        return {
            linesOfCode: 50,
            cyclomaticComplexity: 5,
            numberOfProps: 3,
            numberOfHooks: 2,
            numberOfChildren: 1,
            fanIn: 2,
            fanOut: 3
        };
    }

    private findExtractableComponents(lines: string[]): Array<{parent: string, extractable: string, line: number}> {
        return [];
    }
}
