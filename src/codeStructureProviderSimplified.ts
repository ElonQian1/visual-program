import * as vscode from 'vscode';
import { CodeAnalysis } from './codeAnalyzer';

// 代码结构树项
export class StructureItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        iconPath?: vscode.ThemeIcon,
        public readonly description?: string,
        public readonly tooltip?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        this.description = description;
        this.tooltip = tooltip;
        this.command = command;
        
        // 设置图标颜色
        this.iconPath = iconPath || this.getIconForContextValue(contextValue);
    }
    
    private getIconForContextValue(contextValue?: string): vscode.ThemeIcon {
        if (!contextValue) {return new vscode.ThemeIcon('circle-filled');}
        
        switch (contextValue) {
            case 'function':
                return new vscode.ThemeIcon('symbol-function', new vscode.ThemeColor('symbolIcon.functionForeground'));
            case 'class':
                return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('symbolIcon.classForeground'));
            case 'reactComponent':
                return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue'));
            case 'reactStateManagement':
                return new vscode.ThemeIcon('symbol-property', new vscode.ThemeColor('charts.purple'));
            case 'rustPerformanceAnalysis':
                return new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.red'));
            case 'optimizationStrategy':
                return new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor('charts.yellow'));
            // 深度优化分析图标
            case 'reactDeepOptimizationGroup':
                return new vscode.ThemeIcon('rocket', new vscode.ThemeColor('charts.blue'));
            case 'rustDeepOptimizationGroup':
                return new vscode.ThemeIcon('zap', new vscode.ThemeColor('charts.orange'));
            case 'reactCodeSplitting':
                return new vscode.ThemeIcon('package', new vscode.ThemeColor('charts.blue'));
            case 'reactRenderOptimization':
                return new vscode.ThemeIcon('zap', new vscode.ThemeColor('charts.orange'));
            case 'reactBundleOptimization':
                return new vscode.ThemeIcon('archive', new vscode.ThemeColor('charts.green'));
            // 高级架构分析图标 (新增)
            case 'reactAdvancedArchitectureGroup':
                return new vscode.ThemeIcon('library', new vscode.ThemeColor('charts.blue'));
            case 'rustAdvancedArchitectureGroup':
                return new vscode.ThemeIcon('gear', new vscode.ThemeColor('charts.orange'));
            case 'architecturePattern':
                return new vscode.ThemeIcon('symbol-structure', new vscode.ThemeColor('charts.purple'));
            case 'performanceIssue':
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red'));
            case 'safetyIssue':
                return new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.red'));
            case 'bestPracticeViolation':
                return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.yellow'));
            case 'componentAnalysis':
                return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue'));
            case 'memoryAnalysis':
                return new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.green'));
            case 'concurrencyAnalysis':
                return new vscode.ThemeIcon('sync', new vscode.ThemeColor('charts.purple'));
            case 'moduleAnalysis':
                return new vscode.ThemeIcon('symbol-module', new vscode.ThemeColor('charts.orange'));
                return new vscode.ThemeIcon('symbol-package', new vscode.ThemeColor('charts.green'));
            case 'reactPerformancePrediction':
                return new vscode.ThemeIcon('graph', new vscode.ThemeColor('charts.purple'));
            case 'rustMemoryOptimization':
                return new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.blue'));
            case 'rustConcurrencyOptimization':
                return new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.red'));
            case 'rustErrorHandlingOptimization':
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow'));
            case 'rustArchitectureOptimization':
                return new vscode.ThemeIcon('organization', new vscode.ThemeColor('charts.green'));
            case 'rustOverallAssessment':
                return new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.purple'));
            // 新增高级分析图标
            case 'componentPerformance':
                return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue'));
            case 'bundleAnalysis':
                return new vscode.ThemeIcon('package', new vscode.ThemeColor('charts.green'));
            case 'performanceIssues':
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red'));
            case 'performanceRecommendations':
                return new vscode.ThemeIcon('light-bulb', new vscode.ThemeColor('charts.yellow'));
            case 'cpuMetrics':
                return new vscode.ThemeIcon('cpu', new vscode.ThemeColor('charts.red'));
            case 'memoryMetrics':
                return new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.blue'));
            case 'performanceBottlenecks':
                return new vscode.ThemeIcon('stop-circle', new vscode.ThemeColor('charts.red'));
            // 状态流和并发安全分析图标
            case 'reactStateFlowGroup':
                return new vscode.ThemeIcon('flow', new vscode.ThemeColor('charts.blue'));
            case 'rustConcurrencySafetyGroup':
                return new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.orange'));
            case 'rustErrorHandlingGroup':
                return new vscode.ThemeIcon('bug', new vscode.ThemeColor('charts.red'));
            case 'errorPattern':
                return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
            case 'loggingPattern':
                return new vscode.ThemeIcon('output', new vscode.ThemeColor('charts.blue'));
            case 'observabilityFeature':
                return new vscode.ThemeIcon('eye', new vscode.ThemeColor('charts.green'));
            case 'resiliencePattern':
                return new vscode.ThemeIcon('shield-check', new vscode.ThemeColor('charts.orange'));
            case 'errorImprovement':
                return new vscode.ThemeIcon('tools', new vscode.ThemeColor('charts.yellow'));
            case 'errorBestPractice':
                return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
            case 'errorMigration':
                return new vscode.ThemeIcon('arrow-swap', new vscode.ThemeColor('charts.purple'));
            // React生命周期优化分析图标
            case 'reactLifecycleOptimizationGroup':
                return new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.blue'));
            case 'lifecycleHook':
                return new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.green'));
            case 'lifecyclePerformanceIssue':
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.orange'));
            case 'lifecycleOptimization':
                return new vscode.ThemeIcon('gear', new vscode.ThemeColor('charts.yellow'));
            case 'lifecycleAntiPattern':
                return new vscode.ThemeIcon('x', new vscode.ThemeColor('charts.red'));
            case 'lifecycleBestPractice':
                return new vscode.ThemeIcon('check-all', new vscode.ThemeColor('charts.green'));
            case 'lifecycleMigration':
                return new vscode.ThemeIcon('arrow-up', new vscode.ThemeColor('charts.purple'));
            case 'stateFlowGraph':
                return new vscode.ThemeIcon('git-branch', new vscode.ThemeColor('charts.purple'));
            case 'stateNode':
                return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.blue'));
            case 'concurrencyPattern':
                return new vscode.ThemeIcon('sync', new vscode.ThemeColor('charts.green'));
            case 'asyncPattern':
                return new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.orange'));
            case 'memorySafety':
                return new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.red'));
            case 'globalOptimization':
                return new vscode.ThemeIcon('settings-gear', new vscode.ThemeColor('charts.yellow'));
            case 'migrationPath':
                return new vscode.ThemeIcon('arrow-right', new vscode.ThemeColor('charts.purple'));
            case 'benchmarkResults':
                return new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.purple'));
            case 'systemOptimizations':
                return new vscode.ThemeIcon('tools', new vscode.ThemeColor('charts.green'));
            case 'codeSmells':
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow'));
            case 'technicalDebt':
                return new vscode.ThemeIcon('credit-card', new vscode.ThemeColor('charts.red'));
            case 'codeDuplication':
                return new vscode.ThemeIcon('copy', new vscode.ThemeColor('charts.orange'));
            case 'testCoverage':
                return new vscode.ThemeIcon('beaker', new vscode.ThemeColor('charts.green'));
            case 'qualityImprovements':
                return new vscode.ThemeIcon('light-bulb', new vscode.ThemeColor('charts.blue'));
            case 'healthScore':
                return new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.purple'));
            default:
                return new vscode.ThemeIcon('circle-filled');
        }
    }
}

// 代码结构提供器
export class CodeStructureProvider implements vscode.TreeDataProvider<StructureItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StructureItem | undefined | null | void> = new vscode.EventEmitter<StructureItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StructureItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private codeAnalysis: CodeAnalysis | undefined;

    constructor() {}

    refresh(codeAnalysis?: CodeAnalysis): void {
        this.codeAnalysis = codeAnalysis;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StructureItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StructureItem): Thenable<StructureItem[]> {
        if (!this.codeAnalysis) {
            return Promise.resolve([]);
        }

        if (!element) {
            // 根级别项
            return Promise.resolve(this.getRootItems());
        } else {
            // 子级项
            return Promise.resolve(this.getChildItems(element));
        }
    }

    private getRootItems(): StructureItem[] {
        const items: StructureItem[] = [];

        if (!this.codeAnalysis) {
            return items;
        }

        // 基础代码结构
        if (this.codeAnalysis.functions.length > 0) {
            items.push(new StructureItem(
                `函数 (${this.codeAnalysis.functions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'functionGroup'
            ));
        }

        // React组件分析
        if (this.codeAnalysis.reactComponents?.length) {
            items.push(new StructureItem(
                `React组件 (${this.codeAnalysis.reactComponents.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactComponentGroup'
            ));
        }

        // React状态管理
        if (this.codeAnalysis.reactStateManagement) {
            items.push(new StructureItem(
                'React状态管理分析',
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactStateManagementGroup'
            ));
        }

        // React Hooks
        if (this.codeAnalysis.reactHooks) {
            const totalHooks = (this.codeAnalysis.reactHooks.stateHooks?.length || 0) + 
                              (this.codeAnalysis.reactHooks.effectHooks?.length || 0) + 
                              (this.codeAnalysis.reactHooks.customHooks?.length || 0);
            items.push(new StructureItem(
                `React Hooks (${totalHooks})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactHookGroup'
            ));
        }

        // React深度优化分析
        if (this.codeAnalysis.reactDeepOptimization) {
            const score = this.codeAnalysis.reactDeepOptimization.overallScore;
            items.push(new StructureItem(
                `🚀 React深度优化 (${score.performance}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactDeepOptimizationGroup'
            ));
        }

        // React Hook优化分析
        if (this.codeAnalysis.reactHookOptimization) {
            const score = this.codeAnalysis.reactHookOptimization.overallScore;
            items.push(new StructureItem(
                `🎣 React Hook优化 (${score.overall}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactHookOptimizationGroup',
                new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.blue')),
                `依赖: ${score.dependency}分, 性能: ${score.performance}分`,
                'React Hook使用优化分析'
            ));
        }

        // React状态优化分析
        if (this.codeAnalysis.reactStateOptimization) {
            const score = this.codeAnalysis.reactStateOptimization.overallScore;
            items.push(new StructureItem(
                `🏗️ React状态优化 (${score.overall}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactStateOptimizationGroup',
                new vscode.ThemeIcon('symbol-structure', new vscode.ThemeColor('charts.green')),
                `状态设计: ${score.stateDesign}分, 架构质量: ${score.architectureQuality}分`,
                'React状态管理优化分析'
            ));
        }

        // React高级架构分析 (新增)
        if (this.codeAnalysis.reactAdvancedArchitectureAnalysis) {
            const analysis = this.codeAnalysis.reactAdvancedArchitectureAnalysis;
            const score = analysis.overallScore;
            const patterns = analysis.architecturePatterns.length;
            const issues = analysis.performanceIssues.length + analysis.bestPracticeViolations.length;
            
            items.push(new StructureItem(
                `🏛️ React高级架构 (${score}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactAdvancedArchitectureGroup',
                new vscode.ThemeIcon('library', new vscode.ThemeColor('charts.blue')),
                `模式: ${patterns}个, 问题: ${issues}个`,
                'React架构模式、性能问题和最佳实践分析'
            ));
        }

        // Rust结构体
        if (this.codeAnalysis.rustStructs?.length) {
            items.push(new StructureItem(
                `Rust结构体 (${this.codeAnalysis.rustStructs.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustStructGroup'
            ));
        }

        // Rust性能分析
        if (this.codeAnalysis.rustDetailedPerformance) {
            items.push(new StructureItem(
                'Rust性能分析',
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustPerformanceGroup'
            ));
        }

        // Rust异步网络
        if (this.codeAnalysis.rustAsyncNetwork) {
            items.push(new StructureItem(
                'Rust异步网络分析',
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustAsyncNetworkGroup'
            ));
        }

        // Rust深度优化分析
        if (this.codeAnalysis.rustDeepOptimization) {
            const score = this.codeAnalysis.rustDeepOptimization.overallAssessment;
            items.push(new StructureItem(
                `⚡ Rust深度优化 (${score.performanceScore}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustDeepOptimizationGroup'
            ));
        }

        // Rust内存安全性能分析
        if (this.codeAnalysis.rustMemorySafetyPerformance) {
            const score = this.codeAnalysis.rustMemorySafetyPerformance.overallScore;
            items.push(new StructureItem(
                `🛡️ Rust内存安全性能 (${score.overall}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustMemorySafetyPerformanceGroup',
                new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.red')),
                `安全: ${score.memorySafety}分, 性能: ${score.performance}分`,
                'Rust内存安全与性能深度分析'
            ));
        }

        // Rust高级架构分析 (新增)
        if (this.codeAnalysis.rustAdvancedArchitectureAnalysis) {
            const analysis = this.codeAnalysis.rustAdvancedArchitectureAnalysis;
            const score = analysis.overallScore;
            const patterns = analysis.architecturePatterns.length;
            const issues = analysis.performanceIssues.length + analysis.safetyIssues.length;
            
            items.push(new StructureItem(
                `🏗️ Rust高级架构 (${score}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustAdvancedArchitectureGroup',
                new vscode.ThemeIcon('package', new vscode.ThemeColor('charts.orange')),
                `模式: ${patterns}个, 问题: ${issues}个`,
                'Rust架构模式、性能问题和安全性分析'
            ));
        }

        // React状态流分析 (新增)
        if (this.codeAnalysis.reactStateFlow) {
            const analysis = this.codeAnalysis.reactStateFlow;
            const nodeCount = analysis.stateFlowGraph.nodes.length;
            const bottleneckCount = analysis.stateFlowGraph.bottlenecks.length;
            const efficiencyScore = analysis.stateFlowGraph.metrics.updateEfficiency;
            
            items.push(new StructureItem(
                `🌊 React状态流分析 (${efficiencyScore}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactStateFlowGroup',
                new vscode.ThemeIcon('flow', new vscode.ThemeColor('charts.blue')),
                `节点: ${nodeCount}个, 瓶颈: ${bottleneckCount}个`,
                'React状态流向、依赖关系和优化分析'
            ));
        }

        // Rust并发安全分析 (新增)
        if (this.codeAnalysis.rustConcurrencySafety) {
            const analysis = this.codeAnalysis.rustConcurrencySafety;
            const safetyScore = analysis.overallSafetyScore;
            const performanceScore = analysis.overallPerformanceScore;
            const patternCount = analysis.concurrencyPatterns.length;
            
            items.push(new StructureItem(
                `🔒 Rust并发安全 (安全:${safetyScore}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustConcurrencySafetyGroup',
                new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.orange')),
                `模式: ${patternCount}个, 性能: ${performanceScore}分`,
                'Rust并发模式、安全性和性能分析'
            ));
        }

        // Rust错误处理分析 (新增)
        if (this.codeAnalysis.rustErrorHandling) {
            const analysis = this.codeAnalysis.rustErrorHandling;
            const errorScore = analysis.overallScore.errorHandling;
            const loggingScore = analysis.overallScore.logging;
            const observabilityScore = analysis.overallScore.observability;
            const resilienceScore = analysis.overallScore.resilience;
            const patternCount = analysis.errorPatterns.length;
            
            items.push(new StructureItem(
                `🐛 Rust错误处理 (错误:${errorScore}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustErrorHandlingGroup',
                new vscode.ThemeIcon('bug', new vscode.ThemeColor('charts.red')),
                `模式: ${patternCount}个, 日志: ${loggingScore}分, 可观测: ${observabilityScore}分, 恢复: ${resilienceScore}分`,
                'Rust错误处理模式、日志记录、可观测性和韧性分析'
            ));
        }

        // React生命周期优化分析 (新增)
        if (this.codeAnalysis.reactLifecycleOptimization) {
            const analysis = this.codeAnalysis.reactLifecycleOptimization;
            const performanceScore = analysis.overallScore.performance;
            const maintainabilityScore = analysis.overallScore.maintainability;
            const componentsCount = analysis.componentsAnalyzed;
            const hooksCount = analysis.hooksAnalyzed;
            const issueCount = analysis.issuesFound;
            const optimizationCount = analysis.optimizationsAvailable;
            
            items.push(new StructureItem(
                `⚡ React生命周期优化 (性能:${performanceScore}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactLifecycleOptimizationGroup',
                new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.blue')),
                `组件: ${componentsCount}, Hooks: ${hooksCount}, 问题: ${issueCount}, 优化: ${optimizationCount}`,
                'React组件生命周期管理、性能问题和优化建议分析'
            ));
        }

        // React实时性能监控 (新增)
        if (this.codeAnalysis.reactRealtimePerformance) {
            const monitoring = this.codeAnalysis.reactRealtimePerformance;
            const issueCount = monitoring.issues.length;
            const trendIcon = monitoring.trends.performanceTrend === 'improving' ? '📈' : 
                            monitoring.trends.performanceTrend === 'degrading' ? '📉' : '📊';
            
            items.push(new StructureItem(
                `${trendIcon} React实时监控`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactRealtimePerformanceGroup',
                new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.green')),
                `问题: ${issueCount}个, 趋势: ${monitoring.trends.performanceTrend}`,
                'React应用实时性能监控和分析'
            ));
        }

        // Rust系统性能监控 (新增)
        if (this.codeAnalysis.rustSystemMonitoring) {
            const monitoring = this.codeAnalysis.rustSystemMonitoring;
            const bottleneckCount = monitoring.bottlenecks.length;
            const score = monitoring.benchmarks.overallScore;
            
            items.push(new StructureItem(
                `⚙️ Rust系统监控 (${score}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustSystemMonitoringGroup',
                new vscode.ThemeIcon('server', new vscode.ThemeColor('charts.red')),
                `瓶颈: ${bottleneckCount}个, CPU: ${monitoring.metrics.cpuUsage.toFixed(1)}%`,
                'Rust应用系统级性能监控'
            ));
        }

        // 高级代码质量分析 (新增)
        if (this.codeAnalysis.advancedCodeQuality) {
            const quality = this.codeAnalysis.advancedCodeQuality;
            const trendIcon = quality.trends.improvement === 'improving' ? '📈' : 
                            quality.trends.improvement === 'degrading' ? '📉' : '📊';
            
            items.push(new StructureItem(
                `${trendIcon} 代码质量 (${quality.overallScore}分)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'advancedCodeQualityGroup',
                new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.purple')),
                `异味: ${quality.metrics.codeSmells.length}个, 债务: ${quality.metrics.technicalDebt.estimatedHours.toFixed(1)}h`,
                '全面的代码质量分析和改进建议'
            ));
        }

        return items;
    }

    private getChildItems(element: StructureItem): StructureItem[] {
        const items: StructureItem[] = [];

        if (!this.codeAnalysis) {
            return items;
        }

        switch (element.contextValue) {
            case 'functionGroup':
                return this.codeAnalysis.functions.map(func => new StructureItem(
                    `${func.displayName || func.name}`,
                    vscode.TreeItemCollapsibleState.None,
                    'function',
                    undefined,
                    `行 ${func.line}`,
                    func.description
                ));

            case 'reactComponentGroup':
                return this.codeAnalysis.reactComponents?.map(comp => new StructureItem(
                    comp.name,
                    vscode.TreeItemCollapsibleState.None,
                    'reactComponent',
                    undefined,
                    `${comp.type} - 行 ${comp.line}`,
                    `React组件: ${comp.name}`
                )) || [];

            case 'reactStateManagementGroup':
                return this.getReactStateManagementItems();

            case 'reactHookGroup':
                return this.getReactHookItems();

            case 'rustStructGroup':
                return this.codeAnalysis.rustStructs?.map(struct => new StructureItem(
                    struct.name,
                    vscode.TreeItemCollapsibleState.None,
                    'rustStruct',
                    undefined,
                    `行 ${struct.line}`,
                    `Rust结构体: ${struct.name}`
                )) || [];

            case 'rustPerformanceGroup':
                return this.getRustPerformanceItems();

            case 'rustAsyncNetworkGroup':
                return this.getRustAsyncNetworkItems();

            case 'reactDeepOptimizationGroup':
                return this.getReactDeepOptimizationItems();

            case 'rustDeepOptimizationGroup':
                return this.getRustDeepOptimizationItems();

            case 'reactHookOptimizationGroup':
                return this.getReactHookOptimizationItems();

            case 'reactStateOptimizationGroup':
                return this.getReactStateOptimizationItems();

            case 'rustMemorySafetyPerformanceGroup':
                return this.getRustMemorySafetyPerformanceItems();

            case 'reactAdvancedArchitectureGroup':
                return this.getReactAdvancedArchitectureItems();

            case 'rustAdvancedArchitectureGroup':
                return this.getRustAdvancedArchitectureItems();

            case 'reactStateFlowGroup':
                return this.getReactStateFlowItems();

            case 'rustConcurrencySafetyGroup':
                return this.getRustConcurrencySafetyItems();

            case 'rustErrorHandlingGroup':
                return this.getRustErrorHandlingItems();

            case 'reactLifecycleOptimizationGroup':
                return this.getReactLifecycleOptimizationItems();

            case 'reactRealtimePerformanceGroup':
                return this.getReactRealtimePerformanceItems();

            case 'rustSystemMonitoringGroup':
                return this.getRustSystemMonitoringItems();

            case 'advancedCodeQualityGroup':
                return this.getAdvancedCodeQualityItems();

            default:
                return [];
        }
    }

    private getReactStateManagementItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.reactStateManagement;

        if (!analysis) {return items;}

        // 状态架构
        items.push(new StructureItem(
            `状态架构: ${analysis.stateArchitecture.architectureType}`,
            vscode.TreeItemCollapsibleState.None,
            'reactStateArchitecture',
            undefined,
            `复杂度: ${analysis.stateArchitecture.complexity}`,
            '状态管理架构分析'
        ));

        // 优化建议
        if (analysis.optimizationSuggestions.length > 0) {
            items.push(new StructureItem(
                `优化建议 (${analysis.optimizationSuggestions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'optimizationStrategy',
                undefined,
                `${analysis.optimizationSuggestions.length}个建议`,
                '状态管理优化建议'
            ));
        }

        return items;
    }

    private getReactHookItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const hooks = this.codeAnalysis?.reactHooks;

        if (!hooks) {return items;}

        // 状态Hooks
        hooks.stateHooks?.forEach(hook => {
            items.push(new StructureItem(
                `${hook.stateName} (${hook.hookType})`,
                vscode.TreeItemCollapsibleState.None,
                'reactHook',
                undefined,
                `行 ${hook.line}`,
                `状态Hook: ${hook.stateName}`
            ));
        });

        // 副作用Hooks
        hooks.effectHooks?.forEach(hook => {
            items.push(new StructureItem(
                `Effect (${hook.effectType})`,
                vscode.TreeItemCollapsibleState.None,
                'reactHook',
                undefined,
                `行 ${hook.line}`,
                `副作用Hook: ${hook.effectType}`
            ));
        });

        // 自定义Hooks
        hooks.customHooks?.forEach(hook => {
            items.push(new StructureItem(
                `${hook.hookName} (自定义)`,
                vscode.TreeItemCollapsibleState.None,
                'reactHook',
                undefined,
                `行 ${hook.line}`,
                `自定义Hook: ${hook.hookName}`
            ));
        });

        return items;
    }

    private getRustPerformanceItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.rustDetailedPerformance;

        if (!analysis) {return items;}

        // 内存分析
        items.push(new StructureItem(
            '内存性能分析',
            vscode.TreeItemCollapsibleState.None,
            'rustMemoryAnalysis',
            undefined,
            `堆使用: ${analysis.memoryAnalysis.heapUsage.totalAllocations}次分配`,
            '内存使用和分配模式分析'
        ));

        // CPU分析
        items.push(new StructureItem(
            'CPU性能分析',
            vscode.TreeItemCollapsibleState.None,
            'rustCpuAnalysis',  
            undefined,
            `热点: ${analysis.cpuAnalysis.hotspots.length}个`,
            'CPU使用和性能瓶颈分析'
        ));

        // 优化策略
        if (analysis.optimizationStrategies.length > 0) {
            items.push(new StructureItem(
                `优化策略 (${analysis.optimizationStrategies.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'optimizationStrategy',
                undefined,
                `${analysis.optimizationStrategies.length}个优化建议`,
                '性能优化策略和建议'
            ));
        }

        return items;
    }

    private getRustAsyncNetworkItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.rustAsyncNetwork;

        if (!analysis) {return items;}

        // 异步模式
        if (analysis.asyncPatterns?.length > 0) {
            items.push(new StructureItem(
                `异步模式 (${analysis.asyncPatterns.length})`,
                vscode.TreeItemCollapsibleState.None,
                'rustAsync',
                undefined,
                `${analysis.asyncPatterns.length}个模式`,
                '异步编程模式分析'
            ));
        }

        // 网络模式
        if (analysis.networkingPatterns?.length > 0) {
            items.push(new StructureItem(
                `网络模式 (${analysis.networkingPatterns.length})`,
                vscode.TreeItemCollapsibleState.None,
                'rustAsyncNetwork',
                undefined,
                `${analysis.networkingPatterns.length}个模式`,
                '网络通信模式分析'
            ));
        }

        return items;
    }

    private getReactDeepOptimizationItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.reactDeepOptimization;

        if (!analysis) {return items;}

        // 代码分割优化
        if (analysis.codeSplittingAnalysis.opportunities.length > 0) {
            items.push(new StructureItem(
                `📦 代码分割机会 (${analysis.codeSplittingAnalysis.opportunities.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactCodeSplitting',
                new vscode.ThemeIcon('package', new vscode.ThemeColor('charts.blue')),
                `${analysis.codeSplittingAnalysis.opportunities.length}个机会`,
                '代码分割优化建议'
            ));
        }

        // 渲染优化
        if (analysis.renderOptimization.expensiveRenders.length > 0) {
            items.push(new StructureItem(
                `⚡ 渲染优化 (${analysis.renderOptimization.expensiveRenders.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactRenderOptimization',
                new vscode.ThemeIcon('zap', new vscode.ThemeColor('charts.orange')),
                `${analysis.renderOptimization.expensiveRenders.length}个优化点`,
                '渲染性能优化建议'
            ));
        }

        // Bundle优化
        if (analysis.bundleOptimization.treeshakingOpportunities.length > 0) {
            items.push(new StructureItem(
                `🌳 Bundle优化 (${analysis.bundleOptimization.treeshakingOpportunities.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactBundleOptimization',
                new vscode.ThemeIcon('symbol-package', new vscode.ThemeColor('charts.green')),
                `${analysis.bundleOptimization.treeshakingOpportunities.length}个优化项`,
                'Bundle大小优化建议'
            ));
        }

        // 性能预测
        items.push(new StructureItem(
            `📊 性能评估 (${analysis.overallScore.performance}分)`,
            vscode.TreeItemCollapsibleState.None,
            'reactPerformancePrediction',
            new vscode.ThemeIcon('graph', new vscode.ThemeColor('charts.purple')),
            `加载时间: ${analysis.performancePrediction.loadTimeEstimate}ms`,
            `综合性能评分: ${analysis.overallScore.performance}/100`
        ));

        return items;
    }

    private getRustDeepOptimizationItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.rustDeepOptimization;

        if (!analysis) {return items;}

        // 性能优化
        if (analysis.performanceOptimization.memoryOptimization.length > 0) {
            items.push(new StructureItem(
                `🧠 内存优化 (${analysis.performanceOptimization.memoryOptimization.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustMemoryOptimization',
                new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.blue')),
                `${analysis.performanceOptimization.memoryOptimization.length}个优化点`,
                '内存使用优化建议'
            ));
        }

        // 并发优化
        if (analysis.concurrencyOptimization.asyncOptimization.length > 0) {
            items.push(new StructureItem(
                `⚡ 并发优化 (${analysis.concurrencyOptimization.asyncOptimization.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustConcurrencyOptimization',
                new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.red')),
                `${analysis.concurrencyOptimization.asyncOptimization.length}个优化项`,
                '并发性能优化建议'
            ));
        }

        // 错误处理优化
        if (analysis.errorHandlingOptimization.panicAvoidance.length > 0) {
            items.push(new StructureItem(
                `🛡️ 错误处理 (${analysis.errorHandlingOptimization.panicAvoidance.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustErrorHandlingOptimization',
                new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow')),
                `${analysis.errorHandlingOptimization.panicAvoidance.length}个风险点`,
                '错误处理安全性建议'
            ));
        }

        // 架构优化
        if (analysis.architectureOptimization.traitDesign.length > 0) {
            items.push(new StructureItem(
                `🏗️ 架构优化 (${analysis.architectureOptimization.traitDesign.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustArchitectureOptimization',
                new vscode.ThemeIcon('organization', new vscode.ThemeColor('charts.green')),
                `${analysis.architectureOptimization.traitDesign.length}个建议`,
                '代码架构优化建议'
            ));
        }

        // 总体评估
        items.push(new StructureItem(
            `📈 性能评估 (${analysis.overallAssessment.performanceScore}分)`,
            vscode.TreeItemCollapsibleState.None,
            'rustOverallAssessment',
            new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.purple')),
            `内存效率: ${analysis.overallAssessment.memoryEfficiency}分`,
            `综合性能评分: ${analysis.overallAssessment.performanceScore}/100`
        ));

        return items;
    }

    private getReactHookOptimizationItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.reactHookOptimization;

        if (!analysis) {return items;}

        // Hook依赖问题
        if (analysis.hookDependencyIssues.length > 0) {
            items.push(new StructureItem(
                `🎣 Hook依赖优化 (${analysis.hookDependencyIssues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactHookDependencyIssues',
                new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.orange')),
                `${analysis.hookDependencyIssues.length}个依赖问题`,
                'Hook依赖数组优化建议'
            ));
        }

        // 自定义Hook机会
        if (analysis.customHookOpportunities.length > 0) {
            items.push(new StructureItem(
                `🔧 自定义Hook机会 (${analysis.customHookOpportunities.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactCustomHookOpportunities',
                new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.blue')),
                `${analysis.customHookOpportunities.length}个抽象机会`,
                '可复用逻辑抽象建议'
            ));
        }

        // Hook性能问题
        if (analysis.hookPerformanceIssues.length > 0) {
            items.push(new StructureItem(
                `⚡ Hook性能优化 (${analysis.hookPerformanceIssues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactHookPerformanceIssues',
                new vscode.ThemeIcon('zap', new vscode.ThemeColor('charts.red')),
                `${analysis.hookPerformanceIssues.length}个性能问题`,
                'Hook性能优化建议'
            ));
        }

        // 总体评分
        if (analysis.overallScore) {
            items.push(new StructureItem(
                `📊 Hook质量评分 (${analysis.overallScore.overall}分)`,
                vscode.TreeItemCollapsibleState.None,
                'reactHookOverallScore',
                new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.green')),
                `依赖: ${analysis.overallScore.dependency}分, 性能: ${analysis.overallScore.performance}分`,
                `Hook整体质量评估: ${analysis.overallScore.overall}/100`
            ));
        }

        return items;
    }

    private getReactStateOptimizationItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.reactStateOptimization;

        if (!analysis) {return items;}

        // 状态设计问题
        if (analysis.stateDesignIssues.length > 0) {
            items.push(new StructureItem(
                `🏗️ 状态设计优化 (${analysis.stateDesignIssues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactStateDesignIssues',
                new vscode.ThemeIcon('symbol-structure', new vscode.ThemeColor('charts.yellow')),
                `${analysis.stateDesignIssues.length}个设计问题`,
                '状态结构优化建议'
            ));
        }

        // 重渲染优化
        if (analysis.rerenderOptimizations.length > 0) {
            items.push(new StructureItem(
                `🔄 重渲染优化 (${analysis.rerenderOptimizations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactRerenderOptimizations',
                new vscode.ThemeIcon('refresh', new vscode.ThemeColor('charts.red')),
                `${analysis.rerenderOptimizations.length}个优化点`,
                '减少不必要重渲染'
            ));
        }

        // 架构建议
        if (analysis.stateArchitectureRecommendations.length > 0) {
            items.push(new StructureItem(
                `🏛️ 架构建议 (${analysis.stateArchitectureRecommendations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactStateArchitectureRecommendations',
                new vscode.ThemeIcon('organization', new vscode.ThemeColor('charts.purple')),
                `${analysis.stateArchitectureRecommendations.length}项建议`,
                '状态管理架构优化'
            ));
        }

        // 总体评分
        if (analysis.overallScore) {
            items.push(new StructureItem(
                `📊 状态管理评分 (${analysis.overallScore.overall}分)`,
                vscode.TreeItemCollapsibleState.None,
                'reactStateOverallScore',
                new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.green')),
                `设计: ${analysis.overallScore.stateDesign}分, 性能: ${analysis.overallScore.rerenderEfficiency}分`,
                `状态管理质量评估: ${analysis.overallScore.overall}/100`
            ));
        }

        return items;
    }

    private getRustMemorySafetyPerformanceItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.rustMemorySafetyPerformance;

        if (!analysis) {return items;}

        // 内存安全问题
        if (analysis.memorySafetyIssues.length > 0) {
            items.push(new StructureItem(
                `🛡️ 内存安全分析 (${analysis.memorySafetyIssues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustMemorySafetyIssues',
                new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.red')),
                `${analysis.memorySafetyIssues.length}个安全问题`,
                '内存安全优化建议'
            ));
        }

        // 性能瓶颈
        if (analysis.performanceBottlenecks.length > 0) {
            items.push(new StructureItem(
                `🚀 性能瓶颈分析 (${analysis.performanceBottlenecks.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustPerformanceBottlenecks',
                new vscode.ThemeIcon('zap', new vscode.ThemeColor('charts.orange')),
                `${analysis.performanceBottlenecks.length}个瓶颈点`,
                '性能优化机会识别'
            ));
        }

        // 生命周期优化
        if (analysis.lifetimeOptimizations.length > 0) {
            items.push(new StructureItem(
                `⏱️ 生命周期优化 (${analysis.lifetimeOptimizations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustLifetimeOptimizations',
                new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.blue')),
                `${analysis.lifetimeOptimizations.length}个优化点`,
                '生命周期注解优化'
            ));
        }

        // 借用检查器提示
        if (analysis.borrowCheckerTips.length > 0) {
            items.push(new StructureItem(
                `📝 借用检查器提示 (${analysis.borrowCheckerTips.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustBorrowCheckerTips',
                new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor('charts.yellow')),
                `${analysis.borrowCheckerTips.length}个提示`,
                '借用检查器优化建议'
            ));
        }

        // 分配器优化
        if (analysis.allocatorOptimizations.length > 0) {
            items.push(new StructureItem(
                `💾 分配器优化 (${analysis.allocatorOptimizations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustAllocatorOptimizations',
                new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.green')),
                `${analysis.allocatorOptimizations.length}个优化点`,
                '内存分配优化建议'
            ));
        }

        // 总体评分
        if (analysis.overallScore) {
            items.push(new StructureItem(
                `📊 内存安全性能评分 (${analysis.overallScore.overall}分)`,
                vscode.TreeItemCollapsibleState.None,
                'rustMemorySafetyPerformanceOverallScore',
                new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.purple')),
                `安全: ${analysis.overallScore.memorySafety}分, 性能: ${analysis.overallScore.performance}分`,
                `内存安全性能综合评估: ${analysis.overallScore.overall}/100`
            ));
        }

        return items;
    }

    private getReactAdvancedArchitectureItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.reactAdvancedArchitectureAnalysis;

        if (!analysis) { return items; }

        // 架构模式
        if (analysis.architecturePatterns.length > 0) {
            items.push(new StructureItem(
                `🏛️ 架构模式 (${analysis.architecturePatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactArchitecturePatterns',
                new vscode.ThemeIcon('symbol-structure', new vscode.ThemeColor('charts.blue')),
                `${analysis.architecturePatterns.length}个模式`,
                'React架构模式分析'
            ));
        }

        // 性能问题
        if (analysis.performanceIssues.length > 0) {
            items.push(new StructureItem(
                `⚡ 性能问题 (${analysis.performanceIssues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactAdvancedPerformanceIssues',
                new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red')),
                `${analysis.performanceIssues.length}个问题`,
                'React性能问题分析'
            ));
        }

        // 最佳实践违规
        if (analysis.bestPracticeViolations.length > 0) {
            items.push(new StructureItem(
                `📋 最佳实践违规 (${analysis.bestPracticeViolations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactBestPracticeViolations',
                new vscode.ThemeIcon('issues', new vscode.ThemeColor('charts.orange')),
                `${analysis.bestPracticeViolations.length}个违规`,
                'React最佳实践检查'
            ));
        }

        // 组件分析
        if (analysis.componentAnalysis.length > 0) {
            items.push(new StructureItem(
                `⚛️ 组件分析 (${analysis.componentAnalysis.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactComponentAnalysis',
                new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.green')),
                `${analysis.componentAnalysis.length}个组件`,
                'React组件深度分析'
            ));
        }

        // Bundle分析
        if (analysis.bundleAnalysis) {
            items.push(new StructureItem(
                `📦 Bundle分析 (${analysis.bundleAnalysis.totalSize}KB)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactBundleAnalysis',
                new vscode.ThemeIcon('package', new vscode.ThemeColor('charts.purple')),
                `大小: ${analysis.bundleAnalysis.totalSize}KB`,
                'Bundle大小和优化分析'
            ));
        }

        // 总体评分
        items.push(new StructureItem(
            `📊 架构评分 (${analysis.overallScore}分)`,
            vscode.TreeItemCollapsibleState.None,
            'reactAdvancedArchitectureScore',
            new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.blue')),
            `总分: ${analysis.overallScore}/100`,
            'React高级架构综合评分'
        ));

        return items;
    }

    private getRustAdvancedArchitectureItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.rustAdvancedArchitectureAnalysis;

        if (!analysis) { return items; }

        // 架构模式
        if (analysis.architecturePatterns.length > 0) {
            items.push(new StructureItem(
                `🏗️ 架构模式 (${analysis.architecturePatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustArchitecturePatterns',
                new vscode.ThemeIcon('symbol-structure', new vscode.ThemeColor('charts.orange')),
                `${analysis.architecturePatterns.length}个模式`,
                'Rust架构模式分析'
            ));
        }

        // 性能问题
        if (analysis.performanceIssues.length > 0) {
            items.push(new StructureItem(
                `⚡ 性能问题 (${analysis.performanceIssues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustAdvancedPerformanceIssues',
                new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red')),
                `${analysis.performanceIssues.length}个问题`,
                'Rust性能问题分析'
            ));
        }

        // 安全问题
        if (analysis.safetyIssues.length > 0) {
            items.push(new StructureItem(
                `🛡️ 安全问题 (${analysis.safetyIssues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustSafetyIssues',
                new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.red')),
                `${analysis.safetyIssues.length}个问题`,
                'Rust安全性问题分析'
            ));
        }

        // 模块分析
        if (analysis.moduleAnalysis.length > 0) {
            items.push(new StructureItem(
                `📁 模块分析 (${analysis.moduleAnalysis.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustModuleAnalysis',
                new vscode.ThemeIcon('symbol-module', new vscode.ThemeColor('charts.green')),
                `${analysis.moduleAnalysis.length}个模块`,
                'Rust模块结构分析'
            ));
        }

        // 并发分析
        if (analysis.concurrencyAnalysis.patterns.length > 0) {
            items.push(new StructureItem(
                `🔄 并发分析 (${analysis.concurrencyAnalysis.patterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustConcurrencyAnalysis',
                new vscode.ThemeIcon('sync', new vscode.ThemeColor('charts.purple')),
                `${analysis.concurrencyAnalysis.patterns.length}个模式`,
                'Rust并发模式分析'
            ));
        }

        // 内存分析
        if (analysis.memoryAnalysis.allocations.length > 0) {
            items.push(new StructureItem(
                `💾 内存分析 (${analysis.memoryAnalysis.allocations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustMemoryAnalysis',
                new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.cyan')),
                `${analysis.memoryAnalysis.allocations.length}个分配`,
                'Rust内存使用分析'
            ));
        }

        // Cargo分析
        if (analysis.cargoAnalysis.dependencies > 0) {
            items.push(new StructureItem(
                `📦 Cargo分析 (${analysis.cargoAnalysis.dependencies}个依赖)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustCargoAnalysis',
                new vscode.ThemeIcon('package', new vscode.ThemeColor('charts.yellow')),
                `${analysis.cargoAnalysis.dependencies}个依赖`,
                'Cargo配置和依赖分析'
            ));
        }

        // 测试覆盖率
        if (analysis.testCoverage.unitTests > 0 || analysis.testCoverage.integrationTests > 0) {
            items.push(new StructureItem(
                `🧪 测试覆盖率 (${analysis.testCoverage.coverage}%)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustTestCoverage',
                new vscode.ThemeIcon('beaker', new vscode.ThemeColor('charts.green')),
                `覆盖率: ${analysis.testCoverage.coverage}%`,
                'Rust测试覆盖率分析'
            ));
        }

        // 总体评分
        items.push(new StructureItem(
            `📊 架构评分 (${analysis.overallScore}分)`,
            vscode.TreeItemCollapsibleState.None,
            'rustAdvancedArchitectureScore',
            new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.orange')),
            `总分: ${analysis.overallScore}/100`,
            'Rust高级架构综合评分'
        ));

        return items;
    }

    private getReactRealtimePerformanceItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const monitoring = this.codeAnalysis?.reactRealtimePerformance;

        if (!monitoring) {return items;}

        // 组件性能分析
        monitoring.componentProfiles.forEach(profile => {
            const statusIcon = profile.averageRenderTime > 16 ? '🐌' : profile.averageRenderTime > 8 ? '⚠️' : '✅';
            items.push(new StructureItem(
                `${statusIcon} ${profile.name}`,
                vscode.TreeItemCollapsibleState.None,
                'componentPerformance',
                new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue')),
                `渲染: ${profile.averageRenderTime.toFixed(2)}ms`,
                `组件渲染性能: ${profile.averageRenderTime.toFixed(2)}ms`
            ));
        });

        // Bundle分析
        const bundle = monitoring.bundleAnalysis;
        items.push(new StructureItem(
            `📦 Bundle分析`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'bundleAnalysis',
            new vscode.ThemeIcon('package', new vscode.ThemeColor('charts.green')),
            `大小: ${(bundle.totalSize / 1024).toFixed(1)}KB`,
            `Bundle大小和加载时间分析`
        ));

        // 问题报告
        if (monitoring.issues.length > 0) {
            items.push(new StructureItem(
                `⚠️ 性能问题 (${monitoring.issues.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'performanceIssues',
                new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red')),
                `严重: ${monitoring.issues.filter(i => i.severity === 'high').length}个`,
                '发现的性能问题和建议'
            ));
        }

        // 优化建议
        const totalRecommendations = monitoring.recommendations.immediate.length + 
                                   monitoring.recommendations.shortTerm.length + 
                                   monitoring.recommendations.longTerm.length;
        items.push(new StructureItem(
            `💡 优化建议 (${totalRecommendations})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'performanceRecommendations',
            new vscode.ThemeIcon('light-bulb', new vscode.ThemeColor('charts.yellow')),
            `优先级: ${monitoring.recommendations.priority}`,
            '性能优化建议'
        ));

        return items;
    }

    private getRustSystemMonitoringItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const monitoring = this.codeAnalysis?.rustSystemMonitoring;

        if (!monitoring) {return items;}

        // 系统指标
        const metrics = monitoring.metrics;
        items.push(new StructureItem(
            `💻 CPU使用率: ${metrics.cpuUsage.toFixed(1)}%`,
            vscode.TreeItemCollapsibleState.None,
            'cpuMetrics',
            new vscode.ThemeIcon('cpu', new vscode.ThemeColor('charts.red')),
            `编译时间: ${metrics.compilationMetrics.compileTime}ms`,
            'CPU使用率和编译性能监控'
        ));

        items.push(new StructureItem(
            `🧠 内存使用: ${(metrics.memoryUsage.resident / 1024 / 1024).toFixed(1)}MB`,
            vscode.TreeItemCollapsibleState.None,
            'memoryMetrics',
            new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.blue')),
            `堆内存: ${(metrics.memoryUsage.heap / 1024 / 1024).toFixed(1)}MB`,
            '内存使用情况监控'
        ));

        // 性能瓶颈
        if (monitoring.bottlenecks.length > 0) {
            items.push(new StructureItem(
                `🚫 性能瓶颈 (${monitoring.bottlenecks.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'performanceBottlenecks',
                new vscode.ThemeIcon('stop-circle', new vscode.ThemeColor('charts.red')),
                `关键: ${monitoring.bottlenecks.filter(b => b.severity === 'critical').length}个`,
                '系统性能瓶颈分析'
            ));
        }

        // 基准测试结果
        const benchmarks = monitoring.benchmarks;
        items.push(new StructureItem(
            `⏱️ 基准测试 (${benchmarks.overallScore}分)`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'benchmarkResults',
            new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.purple')),
            `CPU: ${benchmarks.cpuBenchmark}`,
            '性能基准测试结果'
        ));

        // 优化建议
        const totalRecommendations = monitoring.recommendations.immediate.length + 
                                   monitoring.recommendations.shortTerm.length + 
                                   monitoring.recommendations.longTerm.length;
        items.push(new StructureItem(
            `🔧 优化建议 (${totalRecommendations})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'systemOptimizations',
            new vscode.ThemeIcon('tools', new vscode.ThemeColor('charts.green')),
            `优先级: ${monitoring.recommendations.priority}`,
            '系统性能优化建议'
        ));

        return items;
    }

    private getAdvancedCodeQualityItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const quality = this.codeAnalysis?.advancedCodeQuality;

        if (!quality) {return items;}

        // 代码指标
        const metrics = quality.metrics;
        
        // 代码异味
        if (metrics.codeSmells.length > 0) {
            items.push(new StructureItem(
                `👃 代码异味 (${metrics.codeSmells.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'codeSmells',
                new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow')),
                `严重: ${metrics.codeSmells.filter(s => s.severity === 'major').length}个`,
                '代码异味检测结果'
            ));
        }

        // 技术债务
        const debt = metrics.technicalDebt;
        items.push(new StructureItem(
            `💳 技术债务: ${debt.estimatedHours.toFixed(1)}小时`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'technicalDebt',
            new vscode.ThemeIcon('credit-card', new vscode.ThemeColor('charts.red')),
            `债务分数: ${debt.score}`,
            '技术债务分析和修复时间估算'
        ));

        // 代码重复
        if (metrics.duplication.duplicatedBlocks.length > 0) {
            items.push(new StructureItem(
                `📋 代码重复 (${metrics.duplication.duplicatedBlocks.length}块)`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'codeDuplication',
                new vscode.ThemeIcon('copy', new vscode.ThemeColor('charts.orange')),
                `重复率: ${metrics.duplication.percentage.toFixed(1)}%`,
                '代码重复检测和消除建议'
            ));
        }

        // 测试覆盖率
        const coverage = metrics.testCoverage;
        const coverageIcon = coverage.coverage >= 80 ? '✅' : coverage.coverage >= 60 ? '⚠️' : '❌';
        items.push(new StructureItem(
            `${coverageIcon} 测试覆盖率: ${coverage.coverage.toFixed(1)}%`,
            vscode.TreeItemCollapsibleState.None,
            'testCoverage',
            new vscode.ThemeIcon('beaker', new vscode.ThemeColor('charts.green')),
            `缺失测试: ${coverage.missingTests.length}个`,
            '测试覆盖率分析'
        ));

        // 改进建议
        const totalRecommendations = quality.recommendations.quickWins.length + 
                                   quality.recommendations.majorRefactoring.length + 
                                   quality.recommendations.longTermGoals.length;
        items.push(new StructureItem(
            `💡 改进建议 (${totalRecommendations})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'qualityImprovements',
            new vscode.ThemeIcon('light-bulb', new vscode.ThemeColor('charts.blue')),
            `快速改进: ${quality.recommendations.quickWins.length}个`,
            '代码质量改进建议'
        ));

        // 健康评分
        items.push(new StructureItem(
            `📊 健康评分: ${quality.overallScore}/100`,
            vscode.TreeItemCollapsibleState.None,
            'healthScore',
            new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.purple')),
            `趋势: ${quality.trends.improvement}`,
            '代码健康综合评分'
        ));

        return items;
    }

    private getReactStateFlowItems(): StructureItem[] {
        const items: StructureItem[] = [];
        
        if (!this.codeAnalysis?.reactStateFlow) {
            return items;
        }

        const analysis = this.codeAnalysis.reactStateFlow;

        // 状态流图概览
        items.push(new StructureItem(
            `📊 状态流图 (${analysis.stateFlowGraph.nodes.length}节点)`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'stateFlowGraph',
            new vscode.ThemeIcon('git-branch', new vscode.ThemeColor('charts.purple')),
            `边: ${analysis.stateFlowGraph.edges.length}条`,
            '状态节点和连接关系图'
        ));

        // 性能瓶颈
        if (analysis.stateFlowGraph.bottlenecks.length > 0) {
            items.push(new StructureItem(
                `🚨 性能瓶颈 (${analysis.stateFlowGraph.bottlenecks.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'performanceBottlenecks',
                new vscode.ThemeIcon('stop-circle', new vscode.ThemeColor('charts.red')),
                `高频更新: ${analysis.stateFlowGraph.bottlenecks.filter(b => b.type === 'high-frequency-updates').length}`,
                '状态更新性能瓶颈分析'
            ));
        }

        // 全局优化建议
        if (analysis.globalOptimizations.length > 0) {
            items.push(new StructureItem(
                `⚡ 全局优化 (${analysis.globalOptimizations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'globalOptimization',
                new vscode.ThemeIcon('settings-gear', new vscode.ThemeColor('charts.yellow')),
                `优先级高: ${analysis.globalOptimizations.filter(o => o.priority >= 7).length}`,
                '全局状态管理优化建议'
            ));
        }

        // 迁移建议
        if (analysis.migrations.length > 0) {
            items.push(new StructureItem(
                `🔄 迁移建议 (${analysis.migrations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'migrationPath',
                new vscode.ThemeIcon('arrow-right', new vscode.ThemeColor('charts.purple')),
                `状态管理库升级建议`,
                '状态管理架构迁移路径'
            ));
        }

        // 状态管理模式分析
        if (analysis.patterns.length > 0) {
            items.push(new StructureItem(
                `🎨 使用模式 (${analysis.patterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'statePatterns',
                new vscode.ThemeIcon('symbol-structure', new vscode.ThemeColor('charts.blue')),
                `效率平均: ${Math.round(analysis.patterns.reduce((sum, p) => sum + p.efficiency, 0) / analysis.patterns.length)}分`,
                '状态管理模式效率分析'
            ));
        }

        return items;
    }

    private getRustConcurrencySafetyItems(): StructureItem[] {
        const items: StructureItem[] = [];
        
        if (!this.codeAnalysis?.rustConcurrencySafety) {
            return items;
        }

        const analysis = this.codeAnalysis.rustConcurrencySafety;

        // 并发模式概览
        if (analysis.concurrencyPatterns.length > 0) {
            items.push(new StructureItem(
                `🔄 并发模式 (${analysis.concurrencyPatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'concurrencyPattern',
                new vscode.ThemeIcon('sync', new vscode.ThemeColor('charts.green')),
                `安全评分: ${Math.round(analysis.concurrencyPatterns.reduce((sum, p) => sum + p.safetyScore, 0) / analysis.concurrencyPatterns.length)}`,
                '并发编程模式安全性分析'
            ));
        }

        // 异步模式分析
        if (analysis.asyncPatterns.length > 0) {
            items.push(new StructureItem(
                `⏰ 异步模式 (${analysis.asyncPatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'asyncPattern',
                new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.orange')),
                `吞吐量: ${analysis.asyncPatterns[0]?.performance.taskThroughput || 0}/s`,
                '异步运行时配置和性能分析'
            ));
        }

        // 内存安全分析
        items.push(new StructureItem(
            `🛡️ 内存安全 (${analysis.memorySafety.overallSafety}分)`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'memorySafety',
            new vscode.ThemeIcon('shield', new vscode.ThemeColor('charts.red')),
            `unsafe块: ${analysis.memorySafety.unsafeBlocks.length}个`,
            '内存安全性和生命周期分析'
        ));

        // 全局优化建议
        if (analysis.globalRecommendations.length > 0) {
            items.push(new StructureItem(
                `🎯 优化建议 (${analysis.globalRecommendations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'globalOptimization',
                new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor('charts.yellow')),
                `关键级: ${analysis.globalRecommendations.filter(r => r.priority === 'critical').length}`,
                '全局并发和安全优化建议'
            ));
        }

        // 基准测试建议
        if (analysis.benchmarkSuggestions.length > 0) {
            items.push(new StructureItem(
                `📈 基准测试 (${analysis.benchmarkSuggestions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'benchmarkSuggestions',
                new vscode.ThemeIcon('graph', new vscode.ThemeColor('charts.blue')),
                '性能基准测试建议',
                '并发性能基准测试方案'
            ));
        }

        // 迁移路径
        if (analysis.migrationPaths.length > 0) {
            items.push(new StructureItem(
                `🚀 迁移路径 (${analysis.migrationPaths.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'migrationPath',
                new vscode.ThemeIcon('arrow-right', new vscode.ThemeColor('charts.purple')),
                '并发架构迁移建议',
                '并发模式升级迁移方案'
            ));
        }

        return items;
    }

    private getRustErrorHandlingItems(): StructureItem[] {
        const items: StructureItem[] = [];
        
        if (!this.codeAnalysis?.rustErrorHandling) {
            return items;
        }

        const analysis = this.codeAnalysis.rustErrorHandling;

        // 错误模式概览
        if (analysis.errorPatterns.length > 0) {
            items.push(new StructureItem(
                `🚨 错误模式 (${analysis.errorPatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'errorPattern',
                new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red')),
                `平均使用频率: ${Math.round(analysis.errorPatterns.reduce((sum, p) => sum + p.usage.frequency, 0) / analysis.errorPatterns.length)}`,
                '错误处理模式和使用分析'
            ));
        }

        // 日志模式分析
        if (analysis.loggingPatterns.length > 0) {
            items.push(new StructureItem(
                `📝 日志模式 (${analysis.loggingPatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'loggingPattern',
                new vscode.ThemeIcon('output', new vscode.ThemeColor('charts.blue')),
                `平均覆盖率: ${Math.round(analysis.loggingPatterns.reduce((sum, p) => sum + p.usage.coverage.errorPaths, 0) / analysis.loggingPatterns.length)}%`,
                '日志记录模式和配置分析'
            ));
        }

        // 可观测性功能
        if (analysis.observabilityFeatures.length > 0) {
            items.push(new StructureItem(
                `👁️ 可观测性 (${analysis.observabilityFeatures.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'observabilityFeature',
                new vscode.ThemeIcon('eye', new vscode.ThemeColor('charts.green')),
                `有效性: ${Math.round(analysis.observabilityFeatures.reduce((sum, f) => sum + f.effectiveness.incidentDetection, 0) / analysis.observabilityFeatures.length)}%`,
                '可观测性特性和监控能力'
            ));
        }

        // 韧性模式分析
        if (analysis.resiliencePatterns.length > 0) {
            items.push(new StructureItem(
                `🛡️ 韧性模式 (${analysis.resiliencePatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'resiliencePattern',
                new vscode.ThemeIcon('shield-check', new vscode.ThemeColor('charts.orange')),
                `平均恢复能力: ${Math.round(analysis.resiliencePatterns.reduce((sum, p) => sum + p.effectiveness.failureRecovery, 0) / analysis.resiliencePatterns.length)}%`,
                '系统韧性和故障恢复模式'
            ));
        }

        // 改进建议
        if (analysis.improvements.length > 0) {
            const criticalCount = analysis.improvements.filter(i => i.priority === 'critical').length;
            items.push(new StructureItem(
                `🔧 改进建议 (${analysis.improvements.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'errorImprovement',
                new vscode.ThemeIcon('tools', new vscode.ThemeColor('charts.yellow')),
                `关键级: ${criticalCount}个`,
                '错误处理系统改进建议'
            ));
        }

        // 最佳实践评估
        if (analysis.bestPractices.length > 0) {
            const excellentCount = analysis.bestPractices.filter(bp => bp.compliance === 'excellent').length;
            const needsImprovementCount = analysis.bestPractices.filter(bp => bp.compliance === 'needs-improvement' || bp.compliance === 'poor').length;
            
            items.push(new StructureItem(
                `✅ 最佳实践 (${analysis.bestPractices.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'errorBestPractice',
                new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green')),
                `优秀: ${excellentCount}, 需改进: ${needsImprovementCount}`,
                '错误处理最佳实践遵循情况'
            ));
        }

        // 迁移建议
        if (analysis.migrationSuggestions.length > 0) {
            items.push(new StructureItem(
                `🔄 迁移建议 (${analysis.migrationSuggestions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'errorMigration',
                new vscode.ThemeIcon('arrow-swap', new vscode.ThemeColor('charts.purple')),
                '错误处理架构迁移方案',
                '错误处理模式升级和迁移建议'
            ));
        }

        return items;
    }

    private getReactLifecycleOptimizationItems(): StructureItem[] {
        const items: StructureItem[] = [];
        
        if (!this.codeAnalysis?.reactLifecycleOptimization) {
            return items;
        }

        const analysis = this.codeAnalysis.reactLifecycleOptimization;

        // 组件分析概览
        if (analysis.analyses.length > 0) {
            items.push(new StructureItem(
                `📊 组件分析 (${analysis.analyses.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'lifecycleAnalysis',
                new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue')),
                `平均问题数: ${Math.round(analysis.analyses.reduce((sum, a) => sum + a.performanceIssues.length, 0) / analysis.analyses.length)}`,
                '各组件生命周期管理详细分析'
            ));
        }

        // 全局推荐
        if (analysis.globalRecommendations.length > 0) {
            const criticalCount = analysis.globalRecommendations.filter(r => r.priority === 'critical').length;
            items.push(new StructureItem(
                `💡 全局建议 (${analysis.globalRecommendations.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'lifecycleOptimization',
                new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor('charts.yellow')),
                `关键级: ${criticalCount}个`,
                '应用级生命周期优化建议'
            ));
        }

        // 趋势分析
        if (analysis.trends) {
            const hookTypes = Object.keys(analysis.trends.hookUsageDistribution).length;
            const antiPatternCount = analysis.trends.commonAntiPatterns.length;
            
            items.push(new StructureItem(
                `📈 使用趋势`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'lifecycleTrends',
                new vscode.ThemeIcon('graph', new vscode.ThemeColor('charts.purple')),
                `Hook类型: ${hookTypes}, 反模式: ${antiPatternCount}`,
                '生命周期使用模式和趋势分析'
            ));
        }

        // 迁移准备度
        if (analysis.trends?.migrationReadiness) {
            const migrationScore = analysis.trends.migrationReadiness.score;
            
            items.push(new StructureItem(
                `🚀 迁移准备度 (${migrationScore}分)`,
                vscode.TreeItemCollapsibleState.None,
                'lifecycleMigration',
                new vscode.ThemeIcon('arrow-up', new vscode.ThemeColor('charts.green')),
                `现代化程度评估`,
                'React现代模式迁移准备度评分'
            ));
        }

        return items;
    }
}
