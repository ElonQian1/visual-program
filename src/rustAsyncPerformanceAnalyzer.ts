/**
 * Rust异步性能分析器
 * 专门分析Rust异步编程的性能，包括运行时优化、任务调度、并发模式等
 */

import * as vscode from 'vscode';

export interface AsyncFunctionProfile {
    functionName: string;
    executionTime: number;
    awaitCount: number;
    yieldCount: number;
    blockingOperations: BlockingOperation[];
    asyncPatterns: AsyncPattern[];
    runtimeType: 'tokio' | 'async-std' | 'smol' | 'futures' | 'custom';
    optimizationSuggestions: AsyncOptimizationSuggestion[];
    concurrencyLevel: number;
    resourceUsage: AsyncResourceUsage;
}

export interface BlockingOperation {
    type: 'sync-in-async' | 'blocking-io' | 'cpu-intensive' | 'mutex-blocking';
    location: { line: number; column: number };
    duration: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    operation: string;
    suggestion: string;
    alternativeCode: string;
}

export interface AsyncPattern {
    pattern: 'sequential-awaits' | 'parallel-tasks' | 'select-racing' | 'stream-processing' | 'actor-model';
    usage: number;
    efficiency: number; // 0-100
    location: { line: number; column: number };
    description: string;
    optimization: string;
}

export interface AsyncOptimizationSuggestion {
    type: 'concurrent-execution' | 'runtime-config' | 'task-spawning' | 'channel-optimization' | 'buffer-tuning';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    expectedImprovement: string;
    implementation: {
        before: string;
        after: string;
        explanation: string;
    };
    prerequisites: string[];
    risks: string[];
    benchmarkExample: string;
}

export interface AsyncResourceUsage {
    taskCount: number;
    activeThreads: number;
    memoryPerTask: number;
    channelCount: number;
    mutexContention: number;
    cpuUtilization: number;
    ioWaitTime: number;
}

export interface RuntimeAnalysis {
    runtimeType: string;
    version?: string;
    configuration: RuntimeConfiguration;
    performance: RuntimePerformance;
    recommendations: RuntimeRecommendation[];
    tuningOptions: TuningOption[];
}

export interface RuntimeConfiguration {
    workerThreads: number;
    maxBlockingThreads: number;
    threadStackSize: number;
    enableIoPoll: boolean;
    enableTimeDriver: boolean;
    globalQueueInterval: number;
    localQueueCapacity: number;
}

export interface RuntimePerformance {
    throughput: number; // tasks/second
    latency: LatencyMetrics;
    resourceEfficiency: number; // 0-100
    scalability: ScalabilityMetrics;
    bottlenecks: string[];
}

export interface LatencyMetrics {
    p50: number; // 50th percentile latency in ms
    p95: number; // 95th percentile latency in ms
    p99: number; // 99th percentile latency in ms
    max: number;
    average: number;
}

export interface ScalabilityMetrics {
    taskSpawningCost: number;
    contextSwitchCost: number;
    memoryPerTask: number;
    maxConcurrentTasks: number;
    degradationPoint: number; // task count where performance starts degrading
}

export interface RuntimeRecommendation {
    category: 'threading' | 'memory' | 'io' | 'scheduling' | 'configuration';
    importance: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    implementation: string;
    impact: string;
    trade_offs: string[];
}

export interface TuningOption {
    parameter: string;
    currentValue: any;
    recommendedValue: any;
    reason: string;
    impact: string;
    configuration: string;
}

export interface AsyncCodeMetrics {
    totalAsyncFunctions: number;
    averageExecutionTime: number;
    concurrencyUtilization: number; // 0-100
    blockingOperationsCount: number;
    runtimeEfficiency: number; // 0-100
    errorRate: number;
    throughput: number;
    memoryEfficiency: number;
}

export interface AsyncPerformanceReport {
    timestamp: number;
    filePath: string;
    functionProfiles: AsyncFunctionProfile[];
    runtimeAnalysis: RuntimeAnalysis;
    codeMetrics: AsyncCodeMetrics;
    optimizationOpportunities: AsyncOptimizationSuggestion[];
    performanceAlerts: AsyncPerformanceAlert[];
    benchmarkResults: BenchmarkResult[];
}

export interface AsyncPerformanceAlert {
    type: 'blocking-in-async' | 'inefficient-concurrency' | 'resource-leak' | 'runtime-misconfiguration';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    location?: { line: number; column: number };
    impact: string;
    solution: string;
    urgency: number; // 1-10
}

export interface BenchmarkResult {
    scenario: string;
    taskCount: number;
    executionTime: number;
    throughput: number;
    memoryUsage: number;
    cpuUsage: number;
    errorCount: number;
    comparison: {
        baseline: number;
        improvement: number; // percentage
    };
}

export class RustAsyncPerformanceAnalyzer {
    private workspaceRoot: string;
    private analysisHistory: Map<string, AsyncPerformanceReport[]> = new Map();

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    async analyzeAsyncPerformance(code: string, filePath: string): Promise<AsyncPerformanceReport> {
        const functionProfiles = await this.profileAsyncFunctions(code);
        const runtimeAnalysis = this.analyzeRuntime(code);
        const codeMetrics = this.calculateAsyncMetrics(functionProfiles, code);
        const optimizationOpportunities = this.identifyOptimizationOpportunities(functionProfiles, code);
        const performanceAlerts = this.generatePerformanceAlerts(functionProfiles, codeMetrics);
        const benchmarkResults = await this.runBenchmarks(code);

        const report: AsyncPerformanceReport = {
            timestamp: Date.now(),
            filePath,
            functionProfiles,
            runtimeAnalysis,
            codeMetrics,
            optimizationOpportunities,
            performanceAlerts,
            benchmarkResults
        };

        this.updateAnalysisHistory(filePath, report);
        return report;
    }

    private async profileAsyncFunctions(code: string): Promise<AsyncFunctionProfile[]> {
        const profiles: AsyncFunctionProfile[] = [];
        
        // 查找异步函数
        const asyncFunctionRegex = /async\s+fn\s+(\w+)/g;
        let match;

        while ((match = asyncFunctionRegex.exec(code)) !== null) {
            const functionName = match[1];
            const profile = await this.analyzeAsyncFunction(functionName, code);
            profiles.push(profile);
        }

        return profiles;
    }

    private async analyzeAsyncFunction(functionName: string, code: string): Promise<AsyncFunctionProfile> {
        const functionCode = this.extractFunctionCode(functionName, code);
        
        const awaitCount = (functionCode.match(/\.await/g) || []).length;
        const yieldCount = (functionCode.match(/yield/g) || []).length;
        const blockingOperations = this.identifyBlockingOperations(functionCode);
        const asyncPatterns = this.identifyAsyncPatterns(functionCode);
        const runtimeType = this.detectRuntimeType(code);
        const optimizationSuggestions = this.generateAsyncOptimizations(functionCode, functionName);
        const concurrencyLevel = this.estimateConcurrencyLevel(functionCode);
        const resourceUsage = this.analyzeResourceUsage(functionCode);

        return {
            functionName,
            executionTime: this.estimateExecutionTime(functionCode),
            awaitCount,
            yieldCount,
            blockingOperations,
            asyncPatterns,
            runtimeType,
            optimizationSuggestions,
            concurrencyLevel,
            resourceUsage
        };
    }

    private extractFunctionCode(functionName: string, code: string): string {
        const regex = new RegExp(`async\\s+fn\\s+${functionName}[^{]*\\{[\\s\\S]*?^\\}`, 'm');
        const match = code.match(regex);
        return match ? match[0] : '';
    }

    private identifyBlockingOperations(functionCode: string): BlockingOperation[] {
        const operations: BlockingOperation[] = [];

        // 检查同步文件I/O
        const syncIoMatches = functionCode.match(/std::fs::(read|write|open)/g) || [];
        syncIoMatches.forEach((match, index) => {
            operations.push({
                type: 'blocking-io',
                location: { line: index * 10, column: 0 },
                duration: 50, // 估算ms
                impact: 'high',
                operation: match,
                suggestion: 'Use tokio::fs or async-std::fs for async I/O',
                alternativeCode: match.replace('std::fs::', 'tokio::fs::')
            });
        });

        // 检查同步网络操作
        const syncNetMatches = functionCode.match(/std::net::(TcpStream|UdpSocket)/g) || [];
        syncNetMatches.forEach((match, index) => {
            operations.push({
                type: 'blocking-io',
                location: { line: index * 15, column: 0 },
                duration: 100,
                impact: 'critical',
                operation: match,
                suggestion: 'Use tokio::net for async networking',
                alternativeCode: match.replace('std::net::', 'tokio::net::')
            });
        });

        // 检查CPU密集型操作
        const cpuIntensivePatterns = [
            /for\s+\w+\s+in\s+.*\.iter\(\)[^}]{200,}/g,
            /while\s+[^}]{100,}/g
        ];

        cpuIntensivePatterns.forEach(pattern => {
            const matches = functionCode.match(pattern) || [];
            matches.forEach((match, index) => {
                operations.push({
                    type: 'cpu-intensive',
                    location: { line: index * 20, column: 0 },
                    duration: 200,
                    impact: 'medium',
                    operation: 'Long-running computation',
                    suggestion: 'Use tokio::task::spawn_blocking for CPU-intensive work',
                    alternativeCode: 'tokio::task::spawn_blocking(move || { /* CPU work */ }).await'
                });
            });
        });

        // 检查同步Mutex
        const syncMutexMatches = functionCode.match(/std::sync::Mutex/g) || [];
        syncMutexMatches.forEach((match, index) => {
            operations.push({
                type: 'mutex-blocking',
                location: { line: index * 12, column: 0 },
                duration: 10,
                impact: 'medium',
                operation: match,
                suggestion: 'Use tokio::sync::Mutex for async contexts',
                alternativeCode: 'tokio::sync::Mutex'
            });
        });

        return operations;
    }

    private identifyAsyncPatterns(functionCode: string): AsyncPattern[] {
        const patterns: AsyncPattern[] = [];

        // 检查顺序await模式
        const sequentialAwaits = functionCode.match(/\.await[\s;]*\n[\s\S]*?\.await/g) || [];
        if (sequentialAwaits.length > 0) {
            patterns.push({
                pattern: 'sequential-awaits',
                usage: sequentialAwaits.length,
                efficiency: sequentialAwaits.length > 3 ? 30 : 60,
                location: { line: 0, column: 0 },
                description: 'Sequential awaits detected - potential parallelization opportunity',
                optimization: 'Use join! or try_join! to run operations concurrently'
            });
        }

        // 检查并行任务模式
        const parallelPatterns = functionCode.match(/join!|try_join!|spawn/g) || [];
        if (parallelPatterns.length > 0) {
            patterns.push({
                pattern: 'parallel-tasks',
                usage: parallelPatterns.length,
                efficiency: 85,
                location: { line: 0, column: 0 },
                description: 'Good use of parallel task execution',
                optimization: 'Consider task batching for better resource utilization'
            });
        }

        // 检查select模式
        const selectPatterns = functionCode.match(/select!|tokio::select!/g) || [];
        if (selectPatterns.length > 0) {
            patterns.push({
                pattern: 'select-racing',
                usage: selectPatterns.length,
                efficiency: 75,
                location: { line: 0, column: 0 },
                description: 'Select pattern for racing async operations',
                optimization: 'Ensure proper cleanup of unfinished branches'
            });
        }

        // 检查流处理模式
        const streamPatterns = functionCode.match(/StreamExt|stream::|for_each_concurrent/g) || [];
        if (streamPatterns.length > 0) {
            patterns.push({
                pattern: 'stream-processing',
                usage: streamPatterns.length,
                efficiency: 80,
                location: { line: 0, column: 0 },
                description: 'Stream processing pattern detected',
                optimization: 'Consider buffering and batching for better throughput'
            });
        }

        return patterns;
    }

    private detectRuntimeType(code: string): 'tokio' | 'async-std' | 'smol' | 'futures' | 'custom' {
        if (code.includes('tokio::') || code.includes('#[tokio::main]')) {return 'tokio';}
        if (code.includes('async_std::') || code.includes('#[async_std::main]')) {return 'async-std';}
        if (code.includes('smol::')) {return 'smol';}
        if (code.includes('futures::')) {return 'futures';}
        return 'custom';
    }

    private generateAsyncOptimizations(functionCode: string, functionName: string): AsyncOptimizationSuggestion[] {
        const suggestions: AsyncOptimizationSuggestion[] = [];

        // 检查是否可以并发执行
        const awaitCount = (functionCode.match(/\.await/g) || []).length;
        if (awaitCount > 2 && !functionCode.includes('join!')) {
            suggestions.push({
                type: 'concurrent-execution',
                priority: 'high',
                title: 'Enable Concurrent Execution',
                description: `Function ${functionName} has ${awaitCount} await points that could run concurrently`,
                expectedImprovement: '50-80% execution time reduction',
                implementation: {
                    before: 'let a = func1().await;\nlet b = func2().await;',
                    after: 'let (a, b) = tokio::join!(func1(), func2());',
                    explanation: 'Run independent async operations concurrently instead of sequentially'
                },
                prerequisites: ['tokio runtime', 'independent operations'],
                risks: ['Increased memory usage', 'More complex error handling'],
                benchmarkExample: 'Benchmark: Sequential: 200ms -> Concurrent: 100ms'
            });
        }

        // 检查任务生成优化
        if (functionCode.includes('spawn') && functionCode.length > 1000) {
            suggestions.push({
                type: 'task-spawning',
                priority: 'medium',
                title: 'Optimize Task Spawning',
                description: 'Large function spawning tasks - consider task batching',
                expectedImprovement: '20-40% resource efficiency gain',
                implementation: {
                    before: 'for item in items { tokio::spawn(process(item)); }',
                    after: 'stream::iter(items).for_each_concurrent(10, process).await;',
                    explanation: 'Limit concurrent tasks to prevent resource exhaustion'
                },
                prerequisites: ['futures crate', 'StreamExt trait'],
                risks: ['Requires dependency on futures crate'],
                benchmarkExample: 'Memory usage: Unlimited spawning: 1GB -> Limited: 100MB'
            });
        }

        // 检查通道优化
        const channelUsage = (functionCode.match(/mpsc::|oneshot::/g) || []).length;
        if (channelUsage > 2) {
            suggestions.push({
                type: 'channel-optimization',
                priority: 'medium',
                title: 'Optimize Channel Usage',
                description: `Multiple channels detected (${channelUsage}) - consider consolidation`,
                expectedImprovement: '15-30% communication efficiency gain',
                implementation: {
                    before: 'let (tx1, rx1) = mpsc::channel(1);\nlet (tx2, rx2) = mpsc::channel(1);',
                    after: 'enum Message { Type1(Data1), Type2(Data2) }\nlet (tx, rx) = mpsc::channel(10);',
                    explanation: 'Use enum messages with single channel for better performance'
                },
                prerequisites: ['Message enum design'],
                risks: ['More complex message handling', 'Type safety considerations'],
                benchmarkExample: 'Latency: Multiple channels: 5ms -> Single channel: 3ms'
            });
        }

        return suggestions;
    }

    private analyzeRuntime(code: string): RuntimeAnalysis {
        const runtimeType = this.detectRuntimeType(code);
        
        return {
            runtimeType,
            configuration: this.analyzeRuntimeConfiguration(code),
            performance: this.estimateRuntimePerformance(code),
            recommendations: this.generateRuntimeRecommendations(code, runtimeType),
            tuningOptions: this.suggestTuningOptions(code, runtimeType)
        };
    }

    private analyzeRuntimeConfiguration(code: string): RuntimeConfiguration {
        // 分析运行时配置（在实际实现中会解析Cargo.toml和代码配置）
        return {
            workerThreads: 4, // 默认值，实际会从配置中读取
            maxBlockingThreads: 512,
            threadStackSize: 2 * 1024 * 1024, // 2MB
            enableIoPoll: true,
            enableTimeDriver: true,
            globalQueueInterval: 31,
            localQueueCapacity: 256
        };
    }

    private estimateRuntimePerformance(code: string): RuntimePerformance {
        const complexity = this.calculateAsyncComplexity(code);
        
        return {
            throughput: Math.max(100, 10000 - complexity * 100),
            latency: {
                p50: complexity * 0.5,
                p95: complexity * 2,
                p99: complexity * 5,
                max: complexity * 10,
                average: complexity * 1
            },
            resourceEfficiency: Math.max(30, 90 - complexity * 0.1),
            scalability: {
                taskSpawningCost: 0.1,
                contextSwitchCost: 0.05,
                memoryPerTask: 8192, // bytes
                maxConcurrentTasks: 100000,
                degradationPoint: 50000
            },
            bottlenecks: this.identifyBottlenecks(code)
        };
    }

    private generateRuntimeRecommendations(code: string, runtimeType: string): RuntimeRecommendation[] {
        const recommendations: RuntimeRecommendation[] = [];

        if (runtimeType === 'tokio') {
            recommendations.push({
                category: 'threading',
                importance: 'medium',
                title: 'Optimize Worker Thread Count',
                description: 'Consider tuning worker threads based on workload characteristics',
                implementation: 'Set TOKIO_WORKER_THREADS environment variable or use Builder::worker_threads()',
                impact: 'Better CPU utilization and reduced context switching',
                trade_offs: ['More threads = more memory', 'Optimal count depends on workload type']
            });
        }

        // 基于代码特征添加更多建议
        const ioIntensive = (code.match(/tokio::fs|tokio::net/g) || []).length > 5;
        if (ioIntensive) {
            recommendations.push({
                category: 'io',
                importance: 'high',
                title: 'Enable I/O Driver Optimizations',
                description: 'I/O intensive workload detected - optimize I/O polling',
                implementation: 'Enable io-uring on Linux or IOCP optimizations on Windows',
                impact: '20-50% I/O performance improvement',
                trade_offs: ['Platform-specific optimizations', 'Additional memory usage']
            });
        }

        return recommendations;
    }

    private suggestTuningOptions(code: string, runtimeType: string): TuningOption[] {
        const options: TuningOption[] = [];

        if (runtimeType === 'tokio') {
            const taskCount = (code.match(/spawn|spawn_blocking/g) || []).length;
            
            if (taskCount > 10) {
                options.push({
                    parameter: 'worker_threads',
                    currentValue: 4,
                    recommendedValue: Math.min(16, Math.max(4, taskCount / 2)),
                    reason: 'High task count detected',
                    impact: 'Improved task scheduling and CPU utilization',
                    configuration: 'tokio::runtime::Builder::new_multi_thread().worker_threads(N)'
                });
            }

            const blockingOps = (code.match(/spawn_blocking/g) || []).length;
            if (blockingOps > 5) {
                options.push({
                    parameter: 'max_blocking_threads',
                    currentValue: 512,
                    recommendedValue: Math.min(1024, blockingOps * 10),
                    reason: 'Many blocking operations detected',
                    impact: 'Prevent blocking thread starvation',
                    configuration: 'tokio::runtime::Builder::max_blocking_threads(N)'
                });
            }
        }

        return options;
    }

    private calculateAsyncMetrics(profiles: AsyncFunctionProfile[], code: string): AsyncCodeMetrics {
        const totalAsyncFunctions = profiles.length;
        const averageExecutionTime = profiles.reduce((sum, p) => sum + p.executionTime, 0) / totalAsyncFunctions || 0;
        const blockingOperationsCount = profiles.reduce((sum, p) => sum + p.blockingOperations.length, 0);
        
        return {
            totalAsyncFunctions,
            averageExecutionTime,
            concurrencyUtilization: this.calculateConcurrencyUtilization(profiles),
            blockingOperationsCount,
            runtimeEfficiency: this.calculateRuntimeEfficiency(profiles),
            errorRate: this.estimateErrorRate(code),
            throughput: this.calculateThroughput(profiles),
            memoryEfficiency: this.calculateMemoryEfficiency(profiles)
        };
    }

    private identifyOptimizationOpportunities(profiles: AsyncFunctionProfile[], code: string): AsyncOptimizationSuggestion[] {
        const opportunities: AsyncOptimizationSuggestion[] = [];

        profiles.forEach(profile => {
            opportunities.push(...profile.optimizationSuggestions);
        });

        // 添加全局优化机会
        const globalOpportunities = this.identifyGlobalOptimizations(code);
        opportunities.push(...globalOpportunities);

        return opportunities;
    }

    private generatePerformanceAlerts(profiles: AsyncFunctionProfile[], metrics: AsyncCodeMetrics): AsyncPerformanceAlert[] {
        const alerts: AsyncPerformanceAlert[] = [];

        // 阻塞操作警告
        if (metrics.blockingOperationsCount > 0) {
            alerts.push({
                type: 'blocking-in-async',
                severity: 'error',
                message: `${metrics.blockingOperationsCount} blocking operations detected in async context`,
                impact: 'Severe performance degradation and thread pool starvation',
                solution: 'Replace blocking operations with async alternatives',
                urgency: 9
            });
        }

        // 低并发利用率警告
        if (metrics.concurrencyUtilization < 30) {
            alerts.push({
                type: 'inefficient-concurrency',
                severity: 'warning',
                message: `Low concurrency utilization: ${metrics.concurrencyUtilization.toFixed(1)}%`,
                impact: 'Underutilized async capabilities, poor performance',
                solution: 'Increase concurrent operations using join! or spawn',
                urgency: 6
            });
        }

        // 高平均执行时间警告
        if (metrics.averageExecutionTime > 100) {
            alerts.push({
                type: 'inefficient-concurrency',
                severity: 'warning',
                message: `High average execution time: ${metrics.averageExecutionTime.toFixed(2)}ms`,
                impact: 'Poor user experience and resource utilization',
                solution: 'Profile and optimize slow async functions',
                urgency: 7
            });
        }

        return alerts;
    }

    private async runBenchmarks(code: string): Promise<BenchmarkResult[]> {
        // 在实际实现中，这里会运行真实的基准测试
        const results: BenchmarkResult[] = [];
        
        const asyncFunctionCount = (code.match(/async\s+fn/g) || []).length;
        
        results.push({
            scenario: 'Sequential Execution',
            taskCount: asyncFunctionCount,
            executionTime: asyncFunctionCount * 100,
            throughput: 10,
            memoryUsage: asyncFunctionCount * 1024,
            cpuUsage: 0.5,
            errorCount: 0,
            comparison: {
                baseline: asyncFunctionCount * 100,
                improvement: 0
            }
        });

        results.push({
            scenario: 'Concurrent Execution (Optimized)',
            taskCount: asyncFunctionCount,
            executionTime: Math.max(100, asyncFunctionCount * 20),
            throughput: 50,
            memoryUsage: asyncFunctionCount * 1536,
            cpuUsage: 0.8,
            errorCount: 0,
            comparison: {
                baseline: asyncFunctionCount * 100,
                improvement: 60
            }
        });

        return results;
    }

    // 辅助方法
    private estimateConcurrencyLevel(functionCode: string): number {
        const concurrentPatterns = (functionCode.match(/join!|try_join!|spawn|for_each_concurrent/g) || []).length;
        const sequentialAwaits = (functionCode.match(/\.await/g) || []).length;
        
        return concurrentPatterns > 0 ? Math.min(10, concurrentPatterns * 2) : 1;
    }

    private analyzeResourceUsage(functionCode: string): AsyncResourceUsage {
        const taskCount = (functionCode.match(/spawn/g) || []).length;
        const channelCount = (functionCode.match(/mpsc::|oneshot::/g) || []).length;
        const mutexCount = (functionCode.match(/Mutex/g) || []).length;
        
        return {
            taskCount: taskCount || 1,
            activeThreads: Math.min(4, taskCount || 1),
            memoryPerTask: 8192, // bytes
            channelCount,
            mutexContention: mutexCount * 0.1,
            cpuUtilization: 0.6,
            ioWaitTime: 0.2
        };
    }

    private estimateExecutionTime(functionCode: string): number {
        const complexity = this.calculateAsyncComplexity(functionCode);
        const awaitCount = (functionCode.match(/\.await/g) || []).length;
        const blockingOps = (functionCode.match(/std::fs|std::net/g) || []).length;
        
        return complexity + (awaitCount * 10) + (blockingOps * 100);
    }

    private calculateAsyncComplexity(code: string): number {
        const loops = (code.match(/for|while/g) || []).length;
        const conditionals = (code.match(/if|match/g) || []).length;
        const awaits = (code.match(/\.await/g) || []).length;
        const spawns = (code.match(/spawn/g) || []).length;
        
        return loops * 2 + conditionals + awaits + spawns * 3;
    }

    private calculateConcurrencyUtilization(profiles: AsyncFunctionProfile[]): number {
        const totalConcurrency = profiles.reduce((sum, p) => sum + p.concurrencyLevel, 0);
        const maxPossibleConcurrency = profiles.length * 10; // 假设最大并发度为10
        
        return maxPossibleConcurrency > 0 ? (totalConcurrency / maxPossibleConcurrency) * 100 : 0;
    }

    private calculateRuntimeEfficiency(profiles: AsyncFunctionProfile[]): number {
        const totalBlocking = profiles.reduce((sum, p) => sum + p.blockingOperations.length, 0);
        const totalFunctions = profiles.length;
        
        return totalFunctions > 0 ? Math.max(0, 100 - (totalBlocking / totalFunctions) * 50) : 100;
    }

    private estimateErrorRate(code: string): number {
        const errorHandling = (code.match(/\?|unwrap\(\)|expect\(/g) || []).length;
        const totalOperations = (code.match(/\.await/g) || []).length;
        
        return totalOperations > 0 ? Math.min(10, (errorHandling / totalOperations) * 100) : 0;
    }

    private calculateThroughput(profiles: AsyncFunctionProfile[]): number {
        const averageTime = profiles.reduce((sum, p) => sum + p.executionTime, 0) / profiles.length || 1;
        return 1000 / averageTime; // operations per second
    }

    private calculateMemoryEfficiency(profiles: AsyncFunctionProfile[]): number {
        const totalMemory = profiles.reduce((sum, p) => sum + p.resourceUsage.memoryPerTask, 0);
        const totalTasks = profiles.reduce((sum, p) => sum + p.resourceUsage.taskCount, 0);
        
        const averageMemoryPerTask = totalTasks > 0 ? totalMemory / totalTasks : 8192;
        return Math.max(0, 100 - (averageMemoryPerTask / 16384) * 100); // 16KB作为基准
    }

    private identifyBottlenecks(code: string): string[] {
        const bottlenecks: string[] = [];
        
        if ((code.match(/std::fs/g) || []).length > 3) {
            bottlenecks.push('Blocking file I/O operations');
        }
        
        if ((code.match(/std::net/g) || []).length > 2) {
            bottlenecks.push('Blocking network operations');
        }
        
        if ((code.match(/std::sync::Mutex/g) || []).length > 1) {
            bottlenecks.push('Synchronous mutex contention');
        }
        
        const sequentialAwaits = (code.match(/\.await[\s;]*\n[\s\S]*?\.await/g) || []).length;
        if (sequentialAwaits > 3) {
            bottlenecks.push('Sequential async operations');
        }
        
        return bottlenecks;
    }

    private identifyGlobalOptimizations(code: string): AsyncOptimizationSuggestion[] {
        const optimizations: AsyncOptimizationSuggestion[] = [];
        
        // 检查运行时配置优化
        if (!code.includes('Builder::') && (code.match(/async\s+fn/g) || []).length > 10) {
            optimizations.push({
                type: 'runtime-config',
                priority: 'medium',
                title: 'Optimize Runtime Configuration',
                description: 'Many async functions detected - consider custom runtime configuration',
                expectedImprovement: '10-30% overall performance improvement',
                implementation: {
                    before: '#[tokio::main]\nasync fn main() { ... }',
                    after: `#[tokio::main(flavor = "multi_thread", worker_threads = 8)]
async fn main() { ... }`,
                    explanation: 'Custom runtime configuration for better resource utilization'
                },
                prerequisites: ['Workload analysis', 'Performance profiling'],
                risks: ['Over-allocation of resources', 'Platform-specific tuning'],
                benchmarkExample: 'Throughput: Default config: 1000 ops/s -> Tuned: 1300 ops/s'
            });
        }
        
        return optimizations;
    }

    private updateAnalysisHistory(filePath: string, report: AsyncPerformanceReport): void {
        const history = this.analysisHistory.get(filePath) || [];
        history.push(report);
        
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }
        
        this.analysisHistory.set(filePath, history);
    }

    // 公共方法
    public getAnalysisHistory(filePath: string): AsyncPerformanceReport[] {
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
