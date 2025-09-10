/**
 * React状态流分析器
 * 深度分析React应用的状态管理，包括状态流向、数据依赖、重渲染优化等
 */

import * as vscode from 'vscode';

export interface StateFlowNode {
    id: string;
    type: 'component' | 'hook' | 'context' | 'store' | 'external';
    name: string;
    location: { line: number; column: number };
    stateData: StateData[];
    dependencies: string[]; // 依赖的其他节点ID
    dependents: string[]; // 依赖此节点的其他节点ID
    updateFrequency: number; // 更新频率
    renderImpact: RenderImpact;
    optimizationSuggestions: StateOptimizationSuggestion[];
}

export interface StateData {
    name: string;
    type: 'primitive' | 'object' | 'array' | 'function' | 'complex';
    size: number; // 估算的数据大小
    updatePattern: 'frequent' | 'occasional' | 'rare' | 'static';
    mutationStyle: 'immutable' | 'mutable' | 'mixed';
    accessPattern: string[]; // 哪些组件访问这个状态
    derivedStates: string[]; // 从此状态衍生的其他状态
}

export interface RenderImpact {
    directRenders: number; // 直接触发的重渲染次数
    cascadeRenders: number; // 级联触发的重渲染次数
    affectedComponents: string[]; // 受影响的组件列表
    renderCost: number; // 渲染成本评估（ms）
    optimizationPotential: number; // 优化潜力（0-100）
}

export interface StateOptimizationSuggestion {
    type: 'memoization' | 'state-colocation' | 'state-lifting' | 'context-splitting' | 
          'selector-optimization' | 'batch-updates' | 'lazy-initialization';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    implementation: {
        currentPattern: string;
        optimizedPattern: string;
        steps: string[];
    };
    benefits: {
        renderReduction: string;
        performanceGain: string;
        memoryImprovement: string;
    };
    tradeoffs: string[];
    complexity: 'simple' | 'moderate' | 'complex';
}

export interface StateFlowGraph {
    nodes: StateFlowNode[];
    edges: StateFlowEdge[];
    cycles: StateCycle[]; // 循环依赖
    criticalPaths: CriticalPath[]; // 关键路径
    bottlenecks: StateBottleneck[]; // 性能瓶颈
    metrics: StateFlowMetrics;
}

export interface StateFlowEdge {
    from: string; // 源节点ID
    to: string; // 目标节点ID
    type: 'data-flow' | 'event-flow' | 'dependency' | 'derivation';
    strength: number; // 连接强度（0-1）
    frequency: number; // 数据流动频率
    latency: number; // 传播延迟（ms）
    description: string;
}

export interface StateCycle {
    nodes: string[]; // 参与循环的节点ID
    severity: 'warning' | 'error' | 'critical';
    description: string;
    impact: string;
    resolution: string;
}

export interface CriticalPath {
    path: string[]; // 路径上的节点ID
    totalLatency: number;
    renderImpact: number;
    optimization: string;
}

export interface StateBottleneck {
    nodeId: string;
    type: 'high-frequency-updates' | 'expensive-computations' | 'large-state-objects' | 'deep-nesting';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metrics: {
        updateFrequency: number;
        renderCost: number;
        memoryUsage: number;
    };
    solution: string;
}

export interface StateFlowMetrics {
    totalNodes: number;
    totalEdges: number;
    averageNodeDegree: number; // 平均节点度数
    maxPathLength: number; // 最长依赖路径
    stateComplexity: number; // 状态复杂度评分
    updateEfficiency: number; // 更新效率评分
    renderOptimization: number; // 渲染优化评分
    memoryEfficiency: number; // 内存效率评分
}

export interface StateManagementPattern {
    pattern: 'local-state' | 'lifted-state' | 'context-api' | 'redux' | 
             'zustand' | 'recoil' | 'jotai' | 'valtio' | 'custom';
    usage: number; // 使用频率
    efficiency: number; // 效率评分（0-100）
    complexity: number; // 复杂度评分（0-100）
    maintainability: number; // 可维护性评分（0-100）
    recommendations: PatternRecommendation[];
}

export interface PatternRecommendation {
    type: 'replace' | 'optimize' | 'refactor' | 'consolidate';
    description: string;
    reason: string;
    implementation: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
}

export interface StateFlowReport {
    timestamp: number;
    filePath: string;
    stateFlowGraph: StateFlowGraph;
    patterns: StateManagementPattern[];
    globalOptimizations: GlobalStateOptimization[];
    performanceIssues: StatePerformanceIssue[];
    recommendations: StateFlowRecommendation[];
    migrations: StateMigrationSuggestion[];
}

export interface GlobalStateOptimization {
    type: 'context-optimization' | 'state-normalization' | 'cache-implementation' | 
          'lazy-loading' | 'batch-processing';
    scope: 'file' | 'component-tree' | 'application';
    title: string;
    description: string;
    expectedBenefit: string;
    implementation: {
        strategy: string;
        codeChanges: string[];
        testingPlan: string;
    };
    complexity: number; // 1-10
    priority: number; // 1-10
}

export interface StatePerformanceIssue {
    type: 'unnecessary-rerenders' | 'state-mutation' | 'context-hell' | 
          'prop-drilling' | 'stale-closures' | 'memory-leaks';
    severity: 'info' | 'warning' | 'error' | 'critical';
    location: { line: number; column: number };
    component: string;
    description: string;
    impact: {
        performance: number; // 性能影响（1-10）
        userExperience: number; // 用户体验影响（1-10）
        maintainability: number; // 可维护性影响（1-10）
    };
    solution: {
        quickFix: string;
        properSolution: string;
        refactoringNeeded: boolean;
    };
}

export interface StateFlowRecommendation {
    category: 'architecture' | 'performance' | 'maintainability' | 'best-practices';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    rationale: string;
    implementation: {
        approach: string;
        codeExample: {
            before: string;
            after: string;
        };
        migrationSteps: string[];
    };
    benefits: string[];
    risks: string[];
    effort: {
        timeEstimate: string;
        complexity: 'simple' | 'moderate' | 'complex';
        expertise: 'junior' | 'mid' | 'senior';
    };
}

export interface StateMigrationSuggestion {
    from: string; // 当前状态管理方案
    to: string; // 建议的状态管理方案
    reason: string;
    benefits: string[];
    challenges: string[];
    migrationPlan: {
        phases: MigrationPhase[];
        estimatedTime: string;
        riskLevel: 'low' | 'medium' | 'high';
    };
    codeExamples: {
        before: string;
        after: string;
        migration: string;
    };
}

export interface MigrationPhase {
    phase: number;
    title: string;
    description: string;
    tasks: string[];
    deliverables: string[];
    dependencies: string[];
    risks: string[];
}

export class ReactStateFlowAnalyzer {
    private workspaceRoot: string;
    private analysisHistory: Map<string, StateFlowReport[]> = new Map();

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    async analyzeStateFlow(code: string, filePath: string): Promise<StateFlowReport> {
        const stateFlowGraph = await this.buildStateFlowGraph(code);
        const patterns = this.analyzeStateManagementPatterns(code);
        const globalOptimizations = this.identifyGlobalOptimizations(stateFlowGraph);
        const performanceIssues = this.detectPerformanceIssues(code, stateFlowGraph);
        const recommendations = this.generateRecommendations(stateFlowGraph, patterns);
        const migrations = this.suggestMigrations(patterns, stateFlowGraph);

        const report: StateFlowReport = {
            timestamp: Date.now(),
            filePath,
            stateFlowGraph,
            patterns,
            globalOptimizations,
            performanceIssues,
            recommendations,
            migrations
        };

        this.updateAnalysisHistory(filePath, report);
        return report;
    }

    private async buildStateFlowGraph(code: string): Promise<StateFlowGraph> {
        const nodes = await this.extractStateNodes(code);
        const edges = this.buildStateEdges(nodes, code);
        const cycles = this.detectCycles(nodes, edges);
        const criticalPaths = this.findCriticalPaths(nodes, edges);
        const bottlenecks = this.identifyBottlenecks(nodes);
        const metrics = this.calculateStateFlowMetrics(nodes, edges);

        return {
            nodes,
            edges,
            cycles,
            criticalPaths,
            bottlenecks,
            metrics
        };
    }

    private async extractStateNodes(code: string): Promise<StateFlowNode[]> {
        const nodes: StateFlowNode[] = [];

        // 提取useState节点
        const useStateMatches = code.match(/const\s*\[([^\]]+)\]\s*=\s*useState\(([^)]*)\)/g) || [];
        useStateMatches.forEach((match, index) => {
            const stateMatch = match.match(/const\s*\[([^\]]+)\]\s*=\s*useState\(([^)]*)\)/);
            if (stateMatch) {
                const [stateName] = stateMatch[1].split(',').map(s => s.trim());
                nodes.push({
                    id: `useState_${stateName}_${index}`,
                    type: 'hook',
                    name: stateName,
                    location: { line: index * 5, column: 0 },
                    stateData: [{
                        name: stateName,
                        type: this.inferStateType(stateMatch[2] || ''),
                        size: this.estimateStateSize(stateMatch[2] || ''),
                        updatePattern: 'occasional',
                        mutationStyle: 'immutable',
                        accessPattern: [],
                        derivedStates: []
                    }],
                    dependencies: [],
                    dependents: [],
                    updateFrequency: this.estimateUpdateFrequency(code, stateName),
                    renderImpact: this.calculateRenderImpact(code, stateName),
                    optimizationSuggestions: []
                });
            }
        });

        // 提取useContext节点
        const useContextMatches = code.match(/const\s+(\w+)\s*=\s*useContext\(([^)]+)\)/g) || [];
        useContextMatches.forEach((match, index) => {
            const contextMatch = match.match(/const\s+(\w+)\s*=\s*useContext\(([^)]+)\)/);
            if (contextMatch) {
                const [, contextVar, contextName] = contextMatch;
                nodes.push({
                    id: `context_${contextVar}_${index}`,
                    type: 'context',
                    name: contextVar,
                    location: { line: index * 8, column: 0 },
                    stateData: [{
                        name: contextVar,
                        type: 'complex',
                        size: 1000, // 估算Context大小
                        updatePattern: 'frequent',
                        mutationStyle: 'immutable',
                        accessPattern: [],
                        derivedStates: []
                    }],
                    dependencies: [],
                    dependents: [],
                    updateFrequency: this.estimateContextUpdateFrequency(code, contextVar),
                    renderImpact: this.calculateContextRenderImpact(code, contextVar),
                    optimizationSuggestions: []
                });
            }
        });

        // 提取useMemo和useCallback节点
        const memoMatches = code.match(/const\s+(\w+)\s*=\s*use(Memo|Callback)\(/g) || [];
        memoMatches.forEach((match, index) => {
            const memoMatch = match.match(/const\s+(\w+)\s*=\s*use(Memo|Callback)\(/);
            if (memoMatch) {
                const [, memoVar, hookType] = memoMatch;
                nodes.push({
                    id: `${hookType.toLowerCase()}_${memoVar}_${index}`,
                    type: 'hook',
                    name: memoVar,
                    location: { line: index * 10, column: 0 },
                    stateData: [{
                        name: memoVar,
                        type: hookType === 'Memo' ? 'complex' : 'function',
                        size: hookType === 'Memo' ? 500 : 100,
                        updatePattern: 'rare',
                        mutationStyle: 'immutable',
                        accessPattern: [],
                        derivedStates: []
                    }],
                    dependencies: this.extractDependencies(code, memoVar),
                    dependents: [],
                    updateFrequency: 1, // Memo/Callback更新频率低
                    renderImpact: {
                        directRenders: 0,
                        cascadeRenders: 0,
                        affectedComponents: [],
                        renderCost: 1,
                        optimizationPotential: 90
                    },
                    optimizationSuggestions: []
                });
            }
        });

        // 为每个节点生成优化建议
        nodes.forEach(node => {
            node.optimizationSuggestions = this.generateNodeOptimizations(node, code);
        });

        return nodes;
    }

    private buildStateEdges(nodes: StateFlowNode[], code: string): StateFlowEdge[] {
        const edges: StateFlowEdge[] = [];

        nodes.forEach(fromNode => {
            nodes.forEach(toNode => {
                if (fromNode.id !== toNode.id) {
                    const relationship = this.analyzeNodeRelationship(fromNode, toNode, code);
                    if (relationship) {
                        edges.push({
                            from: fromNode.id,
                            to: toNode.id,
                            type: relationship.type,
                            strength: relationship.strength,
                            frequency: relationship.frequency,
                            latency: relationship.latency,
                            description: relationship.description
                        });

                        // 更新节点的依赖关系
                        if (!fromNode.dependents.includes(toNode.id)) {
                            fromNode.dependents.push(toNode.id);
                        }
                        if (!toNode.dependencies.includes(fromNode.id)) {
                            toNode.dependencies.push(fromNode.id);
                        }
                    }
                }
            });
        });

        return edges;
    }

    private detectCycles(nodes: StateFlowNode[], edges: StateFlowEdge[]): StateCycle[] {
        const cycles: StateCycle[] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (nodeId: string, path: string[]): void => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const outgoingEdges = edges.filter(edge => edge.from === nodeId);
            outgoingEdges.forEach(edge => {
                if (recursionStack.has(edge.to)) {
                    // 发现循环
                    const cycleStart = path.indexOf(edge.to);
                    const cyclePath = path.slice(cycleStart);
                    cycles.push({
                        nodes: cyclePath,
                        severity: cyclePath.length > 5 ? 'critical' : cyclePath.length > 3 ? 'error' : 'warning',
                        description: `Circular dependency detected in state flow`,
                        impact: 'May cause infinite re-renders or update loops',
                        resolution: 'Break the cycle by lifting state or using context'
                    });
                } else if (!visited.has(edge.to)) {
                    dfs(edge.to, [...path]);
                }
            });

            recursionStack.delete(nodeId);
        };

        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                dfs(node.id, []);
            }
        });

        return cycles;
    }

    private findCriticalPaths(nodes: StateFlowNode[], edges: StateFlowEdge[]): CriticalPath[] {
        const paths: CriticalPath[] = [];

        // 找到高影响的渲染路径
        const highImpactNodes = nodes.filter(node => 
            node.renderImpact.directRenders > 10 || node.renderImpact.cascadeRenders > 20
        );

        highImpactNodes.forEach(startNode => {
            const path = this.tracePath(startNode.id, edges, new Set());
            if (path.length > 2) {
                const totalLatency = path.reduce((sum, nodeId) => {
                    const node = nodes.find(n => n.id === nodeId);
                    return sum + (node?.renderImpact.renderCost || 0);
                }, 0);

                const renderImpact = path.reduce((sum, nodeId) => {
                    const node = nodes.find(n => n.id === nodeId);
                    return sum + (node?.renderImpact.directRenders || 0);
                }, 0);

                paths.push({
                    path,
                    totalLatency,
                    renderImpact,
                    optimization: 'Consider memoization or state colocation'
                });
            }
        });

        return paths.sort((a, b) => b.renderImpact - a.renderImpact).slice(0, 5);
    }

    private identifyBottlenecks(nodes: StateFlowNode[]): StateBottleneck[] {
        const bottlenecks: StateBottleneck[] = [];

        nodes.forEach(node => {
            // 高频更新瓶颈
            if (node.updateFrequency > 50) {
                bottlenecks.push({
                    nodeId: node.id,
                    type: 'high-frequency-updates',
                    severity: node.updateFrequency > 100 ? 'critical' : 'high',
                    description: `${node.name} updates ${node.updateFrequency} times frequently`,
                    metrics: {
                        updateFrequency: node.updateFrequency,
                        renderCost: node.renderImpact.renderCost,
                        memoryUsage: node.stateData.reduce((sum, data) => sum + data.size, 0)
                    },
                    solution: 'Consider debouncing updates or batch processing'
                });
            }

            // 昂贵的渲染成本
            if (node.renderImpact.renderCost > 20) {
                bottlenecks.push({
                    nodeId: node.id,
                    type: 'expensive-computations',
                    severity: node.renderImpact.renderCost > 50 ? 'critical' : 'high',
                    description: `${node.name} has high render cost (${node.renderImpact.renderCost}ms)`,
                    metrics: {
                        updateFrequency: node.updateFrequency,
                        renderCost: node.renderImpact.renderCost,
                        memoryUsage: node.stateData.reduce((sum, data) => sum + data.size, 0)
                    },
                    solution: 'Use React.memo, useMemo, or optimize computations'
                });
            }

            // 大状态对象
            const totalSize = node.stateData.reduce((sum, data) => sum + data.size, 0);
            if (totalSize > 5000) {
                bottlenecks.push({
                    nodeId: node.id,
                    type: 'large-state-objects',
                    severity: totalSize > 10000 ? 'critical' : 'medium',
                    description: `${node.name} manages large state (${totalSize} bytes)`,
                    metrics: {
                        updateFrequency: node.updateFrequency,
                        renderCost: node.renderImpact.renderCost,
                        memoryUsage: totalSize
                    },
                    solution: 'Consider state normalization or lazy loading'
                });
            }
        });

        return bottlenecks.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    private calculateStateFlowMetrics(nodes: StateFlowNode[], edges: StateFlowEdge[]): StateFlowMetrics {
        const totalNodes = nodes.length;
        const totalEdges = edges.length;
        const averageNodeDegree = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;
        
        // 计算最长路径
        const maxPathLength = this.calculateMaxPathLength(nodes, edges);
        
        // 状态复杂度评分
        const stateComplexity = this.calculateStateComplexity(nodes, edges);
        
        // 更新效率评分
        const updateEfficiency = this.calculateUpdateEfficiency(nodes);
        
        // 渲染优化评分
        const renderOptimization = this.calculateRenderOptimization(nodes);
        
        // 内存效率评分
        const memoryEfficiency = this.calculateMemoryEfficiency(nodes);

        return {
            totalNodes,
            totalEdges,
            averageNodeDegree,
            maxPathLength,
            stateComplexity,
            updateEfficiency,
            renderOptimization,
            memoryEfficiency
        };
    }

    private analyzeStateManagementPatterns(code: string): StateManagementPattern[] {
        const patterns: StateManagementPattern[] = [];

        // 检测本地状态模式
        const localStateUsage = (code.match(/useState/g) || []).length;
        if (localStateUsage > 0) {
            patterns.push({
                pattern: 'local-state',
                usage: localStateUsage,
                efficiency: this.calculatePatternEfficiency('local-state', code),
                complexity: Math.min(100, localStateUsage * 5),
                maintainability: Math.max(20, 100 - localStateUsage * 3),
                recommendations: this.generatePatternRecommendations('local-state', localStateUsage)
            });
        }

        // 检测Context API模式
        const contextUsage = (code.match(/useContext|createContext/g) || []).length;
        if (contextUsage > 0) {
            patterns.push({
                pattern: 'context-api',
                usage: contextUsage,
                efficiency: this.calculatePatternEfficiency('context-api', code),
                complexity: Math.min(100, contextUsage * 15),
                maintainability: Math.max(30, 90 - contextUsage * 2),
                recommendations: this.generatePatternRecommendations('context-api', contextUsage)
            });
        }

        // 检测Redux模式
        if (code.includes('useSelector') || code.includes('useDispatch') || code.includes('redux')) {
            const reduxUsage = (code.match(/useSelector|useDispatch/g) || []).length;
            patterns.push({
                pattern: 'redux',
                usage: reduxUsage,
                efficiency: this.calculatePatternEfficiency('redux', code),
                complexity: 70,
                maintainability: 85,
                recommendations: this.generatePatternRecommendations('redux', reduxUsage)
            });
        }

        // 检测其他状态管理库
        const stateLibraries = ['zustand', 'recoil', 'jotai', 'valtio'];
        stateLibraries.forEach(lib => {
            if (code.includes(lib)) {
                patterns.push({
                    pattern: lib as any,
                    usage: (code.match(new RegExp(lib, 'g')) || []).length,
                    efficiency: this.calculatePatternEfficiency(lib, code),
                    complexity: 50,
                    maintainability: 80,
                    recommendations: this.generatePatternRecommendations(lib, 1)
                });
            }
        });

        return patterns;
    }

    private identifyGlobalOptimizations(graph: StateFlowGraph): GlobalStateOptimization[] {
        const optimizations: GlobalStateOptimization[] = [];

        // Context优化
        const contextNodes = graph.nodes.filter(node => node.type === 'context');
        if (contextNodes.length > 3) {
            optimizations.push({
                type: 'context-optimization',
                scope: 'application',
                title: 'Optimize Context Usage',
                description: `${contextNodes.length} contexts detected - consider consolidation or splitting`,
                expectedBenefit: '20-40% reduction in unnecessary re-renders',
                implementation: {
                    strategy: 'Split large contexts or consolidate related ones',
                    codeChanges: [
                        'Analyze context value changes',
                        'Split frequently changing values',
                        'Use context selectors'
                    ],
                    testingPlan: 'Monitor render counts and performance metrics'
                },
                complexity: 6,
                priority: 7
            });
        }

        // 状态规范化
        const largeStateNodes = graph.nodes.filter(node => 
            node.stateData.some(data => data.size > 2000)
        );
        if (largeStateNodes.length > 0) {
            optimizations.push({
                type: 'state-normalization',
                scope: 'application',
                title: 'Normalize Large State Objects',
                description: 'Large state objects detected - consider normalization',
                expectedBenefit: '30-50% improvement in update performance',
                implementation: {
                    strategy: 'Flatten nested objects and use relational structure',
                    codeChanges: [
                        'Create entity normalization',
                        'Use lookup tables',
                        'Implement selectors'
                    ],
                    testingPlan: 'Performance testing with large datasets'
                },
                complexity: 8,
                priority: 8
            });
        }

        return optimizations;
    }

    private generateRecommendations(graph: StateFlowGraph, patterns: StateManagementPattern[]): StateFlowRecommendation[] {
        const recommendations: StateFlowRecommendation[] = [];

        // 基于瓶颈的建议
        graph.bottlenecks.forEach(bottleneck => {
            const node = graph.nodes.find(n => n.id === bottleneck.nodeId);
            if (node) {
                recommendations.push({
                    category: 'performance',
                    priority: bottleneck.severity === 'critical' ? 'critical' : 'high',
                    title: `Optimize ${node.name} Performance`,
                    description: bottleneck.description,
                    rationale: `Performance bottleneck affecting user experience`,
                    implementation: {
                        approach: bottleneck.solution,
                        codeExample: {
                            before: `// High frequency updates causing performance issues`,
                            after: `// Optimized with memoization and batching`
                        },
                        migrationSteps: [
                            'Identify update patterns',
                            'Implement optimization strategy',
                            'Test performance improvements'
                        ]
                    },
                    benefits: ['Improved performance', 'Better user experience', 'Reduced resource usage'],
                    risks: ['Code complexity increase', 'Potential behavioral changes'],
                    effort: {
                        timeEstimate: bottleneck.severity === 'critical' ? '1-2 days' : '4-8 hours',
                        complexity: 'moderate',
                        expertise: 'mid'
                    }
                });
            }
        });

        // 基于模式的建议
        patterns.forEach(pattern => {
            if (pattern.efficiency < 60) {
                recommendations.push({
                    category: 'architecture',
                    priority: 'medium',
                    title: `Improve ${pattern.pattern} Implementation`,
                    description: `Current ${pattern.pattern} usage has efficiency score of ${pattern.efficiency}`,
                    rationale: 'Low efficiency pattern detected',
                    implementation: {
                        approach: 'Optimize pattern usage based on best practices',
                        codeExample: {
                            before: '// Inefficient pattern usage',
                            after: '// Optimized pattern implementation'
                        },
                        migrationSteps: pattern.recommendations.map(rec => rec.description)
                    },
                    benefits: ['Better performance', 'Improved maintainability'],
                    risks: ['Refactoring effort required'],
                    effort: {
                        timeEstimate: '1-3 days',
                        complexity: 'moderate',
                        expertise: 'mid'
                    }
                });
            }
        });

        return recommendations;
    }

    private suggestMigrations(patterns: StateManagementPattern[], graph: StateFlowGraph): StateMigrationSuggestion[] {
        const migrations: StateMigrationSuggestion[] = [];

        // 复杂本地状态迁移到状态管理库
        const localStatePattern = patterns.find(p => p.pattern === 'local-state');
        if (localStatePattern && localStatePattern.usage > 10 && localStatePattern.complexity > 70) {
            migrations.push({
                from: 'local-state',
                to: 'zustand',
                reason: 'High complexity and usage of local state detected',
                benefits: [
                    'Centralized state management',
                    'Better performance with selective subscriptions',
                    'Easier testing and debugging'
                ],
                challenges: [
                    'Learning curve for new library',
                    'Refactoring existing components',
                    'State structure redesign'
                ],
                migrationPlan: {
                    phases: [
                        {
                            phase: 1,
                            title: 'Setup and Planning',
                            description: 'Install Zustand and plan state structure',
                            tasks: ['Install zustand', 'Design store structure', 'Identify migration scope'],
                            deliverables: ['Store design document', 'Migration timeline'],
                            dependencies: [],
                            risks: ['Incomplete state analysis']
                        },
                        {
                            phase: 2,
                            title: 'Gradual Migration',
                            description: 'Migrate components incrementally',
                            tasks: ['Create stores', 'Migrate high-impact components', 'Update tests'],
                            deliverables: ['Migrated components', 'Updated tests'],
                            dependencies: ['Phase 1 completion'],
                            risks: ['Breaking existing functionality']
                        }
                    ],
                    estimatedTime: '2-3 weeks',
                    riskLevel: 'medium'
                },
                codeExamples: {
                    before: `const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);`,
                    after: `const { data, loading, setData, setLoading } = useStore();`,
                    migration: `// Migration helper
const useStore = create((set) => ({
  data: [],
  loading: false,
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading })
}));`
                }
            });
        }

        return migrations;
    }

    // 辅助方法
    private inferStateType(initialValue: string): 'primitive' | 'object' | 'array' | 'function' | 'complex' {
        if (initialValue.includes('[') || initialValue.includes('Array')) return 'array';
        if (initialValue.includes('{') || initialValue.includes('Object')) return 'object';
        if (initialValue.includes('=>') || initialValue.includes('function')) return 'function';
        if (initialValue.includes('null') || initialValue.includes('undefined') || 
            /^['"`]/.test(initialValue) || /^\d+$/.test(initialValue) || 
            /^(true|false)$/.test(initialValue)) return 'primitive';
        return 'complex';
    }

    private estimateStateSize(initialValue: string): number {
        // 简化的大小估算
        if (initialValue.includes('[') && initialValue.length > 50) return 1000;
        if (initialValue.includes('{') && initialValue.length > 30) return 500;
        if (initialValue.length > 100) return 2000;
        return 100;
    }

    private estimateUpdateFrequency(code: string, stateName: string): number {
        const setterName = `set${stateName.charAt(0).toUpperCase() + stateName.slice(1)}`;
        const setterUsage = (code.match(new RegExp(setterName, 'g')) || []).length;
        return setterUsage * 5; // 估算频率
    }

    private calculateRenderImpact(code: string, stateName: string): RenderImpact {
        const usageCount = (code.match(new RegExp(`\\b${stateName}\\b`, 'g')) || []).length;
        const componentMatches = code.match(/function\s+[A-Z]\w+|const\s+[A-Z]\w+\s*=/g) || [];
        
        return {
            directRenders: usageCount * 2,
            cascadeRenders: usageCount * componentMatches.length,
            affectedComponents: componentMatches.map(match => 
                match.replace(/function\s+|const\s+|=.*/, '').trim()
            ).slice(0, 3),
            renderCost: Math.min(50, usageCount * 2),
            optimizationPotential: Math.max(10, 100 - usageCount * 5)
        };
    }

    private estimateContextUpdateFrequency(code: string, contextVar: string): number {
        const providerUsage = (code.match(/\.Provider/g) || []).length;
        return providerUsage * 10;
    }

    private calculateContextRenderImpact(code: string, contextVar: string): RenderImpact {
        const usageCount = (code.match(new RegExp(`\\b${contextVar}\\b`, 'g')) || []).length;
        
        return {
            directRenders: usageCount * 5, // Context changes affect more components
            cascadeRenders: usageCount * 10,
            affectedComponents: ['ContextProvider', 'ConsumerComponent1', 'ConsumerComponent2'],
            renderCost: Math.min(100, usageCount * 5),
            optimizationPotential: 60
        };
    }

    private extractDependencies(code: string, variableName: string): string[] {
        const dependencies: string[] = [];
        const depArrayMatch = code.match(new RegExp(`${variableName}[^\\[]*\\[([^\\]]*)\\]`));
        
        if (depArrayMatch && depArrayMatch[1]) {
            const deps = depArrayMatch[1].split(',').map(dep => dep.trim());
            dependencies.push(...deps.filter(dep => dep && dep !== ''));
        }
        
        return dependencies;
    }

    private generateNodeOptimizations(node: StateFlowNode, code: string): StateOptimizationSuggestion[] {
        const suggestions: StateOptimizationSuggestion[] = [];

        // 基于更新频率的优化建议
        if (node.updateFrequency > 20) {
            suggestions.push({
                type: 'batch-updates',
                priority: 'medium',
                title: 'Batch State Updates',
                description: `${node.name} updates frequently (${node.updateFrequency} times)`,
                implementation: {
                    currentPattern: 'Multiple separate setState calls',
                    optimizedPattern: 'Batched updates using unstable_batchedUpdates',
                    steps: [
                        'Identify related state updates',
                        'Group updates in batch calls',
                        'Test render count reduction'
                    ]
                },
                benefits: {
                    renderReduction: '30-50%',
                    performanceGain: 'Significant',
                    memoryImprovement: 'Moderate'
                },
                tradeoffs: ['Slightly more complex update logic'],
                complexity: 'simple'
            });
        }

        // 基于渲染影响的优化建议
        if (node.renderImpact.renderCost > 15) {
            suggestions.push({
                type: 'memoization',
                priority: 'high',
                title: 'Add Memoization',
                description: `${node.name} has high render cost (${node.renderImpact.renderCost}ms)`,
                implementation: {
                    currentPattern: 'No memoization',
                    optimizedPattern: 'React.memo or useMemo optimization',
                    steps: [
                        'Wrap component with React.memo',
                        'Optimize prop comparisons',
                        'Use useMemo for expensive calculations'
                    ]
                },
                benefits: {
                    renderReduction: '40-70%',
                    performanceGain: 'High',
                    memoryImprovement: 'Low'
                },
                tradeoffs: ['Memory overhead for memoization cache'],
                complexity: 'simple'
            });
        }

        return suggestions;
    }

    // 更多辅助方法...
    private analyzeNodeRelationship(fromNode: StateFlowNode, toNode: StateFlowNode, code: string): any {
        // 简化的关系分析
        if (fromNode.dependencies.includes(toNode.id) || toNode.dependencies.includes(fromNode.id)) {
            return {
                type: 'dependency',
                strength: 0.8,
                frequency: 10,
                latency: 1,
                description: 'Direct dependency relationship'
            };
        }

        return null;
    }

    private tracePath(nodeId: string, edges: StateFlowEdge[], visited: Set<string>): string[] {
        if (visited.has(nodeId)) return [];
        
        visited.add(nodeId);
        const outgoing = edges.filter(edge => edge.from === nodeId);
        
        if (outgoing.length === 0) return [nodeId];
        
        const longestPath = outgoing.reduce((longest, edge) => {
            const path = this.tracePath(edge.to, edges, new Set(visited));
            return path.length > longest.length ? path : longest;
        }, [] as string[]);
        
        return [nodeId, ...longestPath];
    }

    private calculateMaxPathLength(nodes: StateFlowNode[], edges: StateFlowEdge[]): number {
        let maxLength = 0;
        
        nodes.forEach(node => {
            const path = this.tracePath(node.id, edges, new Set());
            maxLength = Math.max(maxLength, path.length);
        });
        
        return maxLength;
    }

    private calculateStateComplexity(nodes: StateFlowNode[], edges: StateFlowEdge[]): number {
        const nodeComplexity = nodes.reduce((sum, node) => 
            sum + node.stateData.length + node.dependencies.length, 0
        );
        const edgeComplexity = edges.length;
        
        return Math.min(100, (nodeComplexity + edgeComplexity) * 2);
    }

    private calculateUpdateEfficiency(nodes: StateFlowNode[]): number {
        const totalUpdates = nodes.reduce((sum, node) => sum + node.updateFrequency, 0);
        const avgUpdate = totalUpdates / nodes.length || 0;
        
        return Math.max(0, 100 - avgUpdate);
    }

    private calculateRenderOptimization(nodes: StateFlowNode[]): number {
        const totalOptimization = nodes.reduce((sum, node) => 
            sum + node.renderImpact.optimizationPotential, 0
        );
        
        return nodes.length > 0 ? totalOptimization / nodes.length : 100;
    }

    private calculateMemoryEfficiency(nodes: StateFlowNode[]): number {
        const totalMemory = nodes.reduce((sum, node) => 
            sum + node.stateData.reduce((s, data) => s + data.size, 0), 0
        );
        const avgMemory = totalMemory / nodes.length || 0;
        
        return Math.max(0, 100 - avgMemory / 100);
    }

    private calculatePatternEfficiency(pattern: string, code: string): number {
        // 简化的效率计算
        const usageCount = (code.match(new RegExp(pattern, 'g')) || []).length;
        const codeComplexity = code.length / 1000;
        
        const baseEfficiency = {
            'local-state': 80,
            'context-api': 70,
            'redux': 85,
            'zustand': 90
        }[pattern] || 75;
        
        return Math.max(20, baseEfficiency - (usageCount * 2) - (codeComplexity * 5));
    }

    private generatePatternRecommendations(pattern: string, usage: number): PatternRecommendation[] {
        const recommendations: PatternRecommendation[] = [];

        if (pattern === 'local-state' && usage > 8) {
            recommendations.push({
                type: 'replace',
                description: 'Consider migrating to a state management library',
                reason: 'High usage of local state increases complexity',
                implementation: 'Evaluate Zustand or Redux Toolkit',
                effort: 'high',
                impact: 'high'
            });
        }

        if (pattern === 'context-api' && usage > 5) {
            recommendations.push({
                type: 'optimize',
                description: 'Split large contexts into smaller ones',
                reason: 'Multiple contexts can cause unnecessary re-renders',
                implementation: 'Separate frequently changing values',
                effort: 'medium',
                impact: 'medium'
            });
        }

        return recommendations;
    }

    private detectPerformanceIssues(code: string, graph: StateFlowGraph): StatePerformanceIssue[] {
        const issues: StatePerformanceIssue[] = [];

        // 检测不必要的重渲染
        const memoUsage = (code.match(/React\.memo|useMemo|useCallback/g) || []).length;
        const componentCount = (code.match(/function\s+[A-Z]\w+|const\s+[A-Z]\w+\s*=/g) || []).length;
        
        if (componentCount > 3 && memoUsage === 0) {
            issues.push({
                type: 'unnecessary-rerenders',
                severity: 'warning',
                location: { line: 1, column: 1 },
                component: 'Multiple components',
                description: 'No memoization detected in components with multiple state dependencies',
                impact: {
                    performance: 7,
                    userExperience: 6,
                    maintainability: 4
                },
                solution: {
                    quickFix: 'Add React.memo to pure components',
                    properSolution: 'Analyze render patterns and apply selective memoization',
                    refactoringNeeded: false
                }
            });
        }

        return issues;
    }

    private updateAnalysisHistory(filePath: string, report: StateFlowReport): void {
        const history = this.analysisHistory.get(filePath) || [];
        history.push(report);
        
        if (history.length > 5) {
            history.splice(0, history.length - 5);
        }
        
        this.analysisHistory.set(filePath, history);
    }

    // 公共方法
    public getAnalysisHistory(filePath: string): StateFlowReport[] {
        return this.analysisHistory.get(filePath) || [];
    }

    public clearHistory(filePath?: string): void {
        if (filePath) {
            this.analysisHistory.delete(filePath);
        } else {
            this.analysisHistory.clear();
        }
    }
}
