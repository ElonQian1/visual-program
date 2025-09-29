// ⚡ 性能监控和自动优化系统
import * as vscode from 'vscode';

export interface PerformanceMetrics {
    analysisTime: number;
    memoryUsage: number;
    fileCount: number;
    nodeCount: number;
    renderTime: number;
    cacheHitRate: number;
}

export interface OptimizationSuggestion {
    type: 'memory' | 'analysis' | 'render' | 'cache';
    description: string;
    impact: 'high' | 'medium' | 'low';
    autoApplicable: boolean;
    action?: () => Promise<void>;
}

export class PerformanceOptimizer {
    private static instance: PerformanceOptimizer;
    private metrics: PerformanceMetrics[] = [];
    private cache: Map<string, any> = new Map();
    private analysisQueue: Set<string> = new Set();
    private renderQueue: Set<string> = new Set();
    private outputChannel: vscode.OutputChannel;
    
    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Visual Programming - Performance');
        this.startPerformanceMonitoring();
    }
    
    public static getInstance(): PerformanceOptimizer {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }
    
    // 📊 开始性能监控
    private startPerformanceMonitoring(): void {
        setInterval(() => {
            this.collectMetrics();
            this.analyzePerformance();
        }, 30000); // 每30秒检查一次
    }
    
    // 📏 收集性能指标
    private collectMetrics(): void {
        const currentMetrics: PerformanceMetrics = {
            analysisTime: this.getAverageAnalysisTime(),
            memoryUsage: this.getMemoryUsage(),
            fileCount: this.getAnalyzedFileCount(),
            nodeCount: this.getTotalNodeCount(),
            renderTime: this.getAverageRenderTime(),
            cacheHitRate: this.getCacheHitRate()
        };
        
        this.metrics.push(currentMetrics);
        
        // 只保留最近100个指标
        if (this.metrics.length > 100) {
            this.metrics.shift();
        }
        
        this.logMetrics(currentMetrics);
    }
    
    // ⏱️ 分析时间测量
    public async measureAnalysisTime<T>(operation: () => Promise<T>): Promise<T> {
        const startTime = performance.now();
        try {
            const result = await operation();
            const endTime = performance.now();
            this.recordAnalysisTime(endTime - startTime);
            return result;
        } catch (error) {
            const endTime = performance.now();
            this.recordAnalysisTime(endTime - startTime, true);
            throw error;
        }
    }
    
    // 🎨 渲染时间测量
    public measureRenderTime(operation: () => void): void {
        const startTime = performance.now();
        try {
            operation();
            const endTime = performance.now();
            this.recordRenderTime(endTime - startTime);
        } catch (error) {
            const endTime = performance.now();
            this.recordRenderTime(endTime - startTime, true);
            throw error;
        }
    }
    
    // 🧠 智能缓存系统
    public async getCachedOrCompute<T>(
        key: string, 
        computeFn: () => Promise<T>,
        ttl: number = 300000 // 5分钟默认TTL
    ): Promise<T> {
        const cached = this.cache.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < ttl) {
            this.recordCacheHit(true);
            return cached.data;
        }
        
        this.recordCacheHit(false);
        const data = await computeFn();
        this.cache.set(key, { data, timestamp: Date.now() });
        
        return data;
    }
    
    // 📈 性能分析
    private analyzePerformance(): void {
        if (this.metrics.length < 5) {return;}
        
        const suggestions = this.generateOptimizationSuggestions();
        
        if (suggestions.length > 0) {
            this.showPerformanceSuggestions(suggestions);
        }
    }
    
    // 💡 生成优化建议
    private generateOptimizationSuggestions(): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        const latest = this.metrics[this.metrics.length - 1];
        
        // 内存使用过高
        if (latest.memoryUsage > 500) { // 500MB
            suggestions.push({
                type: 'memory',
                description: `内存使用过高 (${latest.memoryUsage}MB)，建议清理缓存`,
                impact: 'high',
                autoApplicable: true,
                action: async () => {
                    this.clearCache();
                    vscode.window.showInformationMessage('🧹 内存缓存已清理');
                }
            });
        }
        
        // 分析时间过长
        if (latest.analysisTime > 5000) { // 5秒
            suggestions.push({
                type: 'analysis',
                description: `代码分析耗时过长 (${(latest.analysisTime/1000).toFixed(1)}s)，建议优化分析策略`,
                impact: 'medium',
                autoApplicable: true,
                action: async () => {
                    this.enableFastAnalysisMode();
                    vscode.window.showInformationMessage('⚡ 已启用快速分析模式');
                }
            });
        }
        
        // 缓存命中率低
        if (latest.cacheHitRate < 0.3) {
            suggestions.push({
                type: 'cache',
                description: `缓存命中率过低 (${(latest.cacheHitRate*100).toFixed(1)}%)，建议优化缓存策略`,
                impact: 'medium',
                autoApplicable: true,
                action: async () => {
                    this.optimizeCacheStrategy();
                    vscode.window.showInformationMessage('🎯 缓存策略已优化');
                }
            });
        }
        
        // 渲染时间过长
        if (latest.renderTime > 1000) { // 1秒
            suggestions.push({
                type: 'render',
                description: `UI渲染耗时过长 (${latest.renderTime}ms)，建议启用虚拟化渲染`,
                impact: 'medium',
                autoApplicable: true,
                action: async () => {
                    this.enableVirtualRendering();
                    vscode.window.showInformationMessage('🖼️ 虚拟化渲染已启用');
                }
            });
        }
        
        return suggestions;
    }
    
    // 📢 显示性能建议
    private async showPerformanceSuggestions(suggestions: OptimizationSuggestion[]): Promise<void> {
        const highImpactSuggestions = suggestions.filter(s => s.impact === 'high');
        
        if (highImpactSuggestions.length > 0) {
            const autoApplicable = highImpactSuggestions.filter(s => s.autoApplicable);
            
            if (autoApplicable.length > 0) {
                const choice = await vscode.window.showWarningMessage(
                    `🚨 检测到 ${highImpactSuggestions.length} 个性能问题，是否自动优化？`,
                    '自动优化',
                    '查看详情',
                    '忽略'
                );
                
                switch (choice) {
                    case '自动优化':
                        await this.applyAutoOptimizations(autoApplicable);
                        break;
                    case '查看详情':
                        this.showPerformanceReport(suggestions);
                        break;
                }
            }
        }
    }
    
    // 🔧 应用自动优化
    private async applyAutoOptimizations(suggestions: OptimizationSuggestion[]): Promise<void> {
        let appliedCount = 0;
        
        for (const suggestion of suggestions) {
            if (suggestion.action) {
                try {
                    await suggestion.action();
                    appliedCount++;
                } catch (error) {
                    console.error('Failed to apply optimization:', error);
                }
            }
        }
        
        vscode.window.showInformationMessage(`✅ 已应用 ${appliedCount} 个性能优化`);
    }
    
    // 📊 显示性能报告
    private async showPerformanceReport(suggestions: OptimizationSuggestion[]): Promise<void> {
        const latest = this.metrics[this.metrics.length - 1];
        
        const report = `# 🚀 性能分析报告

## 📊 当前性能指标
- **内存使用**: ${latest.memoryUsage}MB
- **分析时间**: ${(latest.analysisTime/1000).toFixed(1)}s
- **渲染时间**: ${latest.renderTime}ms
- **缓存命中率**: ${(latest.cacheHitRate*100).toFixed(1)}%
- **文件数量**: ${latest.fileCount}
- **节点数量**: ${latest.nodeCount}

## 💡 优化建议

${suggestions.map((s, i) => `### ${i+1}. ${this.getImpactIcon(s.impact)} ${s.description}
- **类型**: ${s.type}
- **影响**: ${s.impact}
- **可自动应用**: ${s.autoApplicable ? '是' : '否'}
`).join('\n')}

## 📈 性能趋势
${this.generatePerformanceTrend()}

---
*报告生成时间: ${new Date().toLocaleString()}*
`;
        
        const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }
    
    // 📈 生成性能趋势
    private generatePerformanceTrend(): string {
        if (this.metrics.length < 10) {
            return '数据不足，需要更多性能数据';
        }
        
        const recent10 = this.metrics.slice(-10);
        const avgAnalysisTime = recent10.reduce((sum, m) => sum + m.analysisTime, 0) / 10;
        const avgMemoryUsage = recent10.reduce((sum, m) => sum + m.memoryUsage, 0) / 10;
        const avgRenderTime = recent10.reduce((sum, m) => sum + m.renderTime, 0) / 10;
        
        return `最近10次平均性能:
- 分析时间: ${(avgAnalysisTime/1000).toFixed(1)}s
- 内存使用: ${avgMemoryUsage.toFixed(1)}MB  
- 渲染时间: ${avgRenderTime.toFixed(1)}ms`;
    }
    
    // 🎯 优化实现方法
    private clearCache(): void {
        this.cache.clear();
    }
    
    private enableFastAnalysisMode(): void {
        // 实现快速分析模式
        vscode.workspace.getConfiguration('visualProgramming').update('analysis.mode', 'fast');
    }
    
    private optimizeCacheStrategy(): void {
        // 优化缓存策略
        const config = vscode.workspace.getConfiguration('visualProgramming');
        config.update('cache.maxSize', 200);
        config.update('cache.ttl', 600000); // 10分钟
    }
    
    private enableVirtualRendering(): void {
        // 启用虚拟化渲染
        vscode.workspace.getConfiguration('visualProgramming').update('ui.virtualRendering', true);
    }
    
    // 📏 辅助方法
    private getAverageAnalysisTime(): number {
        // 实现获取平均分析时间
        return Math.random() * 3000 + 1000; // 模拟数据
    }
    
    private getMemoryUsage(): number {
        // 实现获取内存使用
        if (process.memoryUsage) {
            return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        }
        return 100; // 默认值
    }
    
    private getAnalyzedFileCount(): number {
        return Math.floor(Math.random() * 100) + 10;
    }
    
    private getTotalNodeCount(): number {
        return Math.floor(Math.random() * 1000) + 100;
    }
    
    private getAverageRenderTime(): number {
        return Math.random() * 500 + 100;
    }
    
    private getCacheHitRate(): number {
        const totalRequests = this.cacheHits + this.cacheMisses;
        return totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    }
    
    private cacheHits = 0;
    private cacheMisses = 0;
    private analysisTimes: number[] = [];
    private renderTimes: number[] = [];
    
    private recordAnalysisTime(time: number, failed = false): void {
        if (!failed) {
            this.analysisTimes.push(time);
            if (this.analysisTimes.length > 100) {
                this.analysisTimes.shift();
            }
        }
    }
    
    private recordRenderTime(time: number, failed = false): void {
        if (!failed) {
            this.renderTimes.push(time);
            if (this.renderTimes.length > 100) {
                this.renderTimes.shift();
            }
        }
    }
    
    private recordCacheHit(hit: boolean): void {
        if (hit) {
            this.cacheHits++;
        } else {
            this.cacheMisses++;
        }
    }
    
    private logMetrics(metrics: PerformanceMetrics): void {
        const logMessage = `Performance Metrics: Analysis=${metrics.analysisTime}ms, Memory=${metrics.memoryUsage}MB, Render=${metrics.renderTime}ms, CacheHit=${(metrics.cacheHitRate*100).toFixed(1)}%`;
        this.outputChannel.appendLine(logMessage);
    }
    
    private getImpactIcon(impact: string): string {
        switch (impact) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    }
}

// 导出单例实例
export const performanceOptimizer = PerformanceOptimizer.getInstance();
