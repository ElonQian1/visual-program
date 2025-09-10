// 🔥 性能监控和优化系统
import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export interface PerformanceMetrics {
    operationId: string;
    operationType: 'analysis' | 'visualization' | 'collaboration' | 'codeGeneration';
    startTime: number;
    endTime?: number;
    duration?: number;
    fileCount?: number;
    linesOfCode?: number;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
}

export interface PerformanceReport {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    slowestOperations: PerformanceMetrics[];
    errorPatterns: { error: string; count: number; operations: string[] }[];
    memoryTrends: { timestamp: number; usage: number }[];
    recommendations: PerformanceRecommendation[];
}

export interface PerformanceRecommendation {
    type: 'memory' | 'speed' | 'reliability' | 'configuration';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    implementation: string[];
}

export class PerformanceMonitor extends EventEmitter {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, PerformanceMetrics> = new Map();
    private completedMetrics: PerformanceMetrics[] = [];
    private readonly maxHistorySize = 1000;
    
    // 性能阈值配置
    private readonly thresholds = {
        analysis: {
            maxDuration: 30000, // 30秒
            maxMemory: 500 * 1024 * 1024, // 500MB
            maxFileCount: 1000
        },
        visualization: {
            maxDuration: 5000, // 5秒
            maxMemory: 200 * 1024 * 1024, // 200MB
            maxNodeCount: 500
        },
        collaboration: {
            maxDuration: 2000, // 2秒
            maxMemory: 100 * 1024 * 1024, // 100MB
        },
        codeGeneration: {
            maxDuration: 10000, // 10秒
            maxMemory: 300 * 1024 * 1024, // 300MB
        }
    };

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    // 开始监控操作
    public startOperation(
        operationType: PerformanceMetrics['operationType'],
        metadata?: Record<string, any>
    ): string {
        const operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const metric: PerformanceMetrics = {
            operationId,
            operationType,
            startTime: Date.now(),
            success: false,
            metadata: metadata || {}
        };

        this.metrics.set(operationId, metric);
        
        // 记录初始内存使用
        this.recordMemoryUsage(operationId);
        
        this.emit('operationStarted', { operationId, operationType });
        
        return operationId;
    }

    // 更新操作进度
    public updateOperation(
        operationId: string,
        update: Partial<Pick<PerformanceMetrics, 'fileCount' | 'linesOfCode' | 'metadata'>>
    ): void {
        const metric = this.metrics.get(operationId);
        if (!metric) return;

        Object.assign(metric, update);
        this.recordMemoryUsage(operationId);
        
        this.emit('operationUpdated', { operationId, update });
    }

    // 完成操作监控
    public completeOperation(
        operationId: string,
        success: boolean = true,
        errorMessage?: string
    ): PerformanceMetrics | undefined {
        const metric = this.metrics.get(operationId);
        if (!metric) return undefined;

        metric.endTime = Date.now();
        metric.duration = metric.endTime - metric.startTime;
        metric.success = success;
        if (errorMessage) {
            metric.errorMessage = errorMessage;
        }

        // 最终内存记录
        this.recordMemoryUsage(operationId);

        // 移到完成列表
        this.completedMetrics.push(metric);
        this.metrics.delete(operationId);

        // 限制历史记录大小
        if (this.completedMetrics.length > this.maxHistorySize) {
            this.completedMetrics.shift();
        }

        // 检查性能阈值
        this.checkPerformanceThresholds(metric);

        this.emit('operationCompleted', metric);

        return metric;
    }

    // 记录内存使用情况
    private recordMemoryUsage(operationId: string): void {
        const metric = this.metrics.get(operationId);
        if (!metric) return;

        const memInfo = process.memoryUsage();
        metric.memoryUsage = {
            heapUsed: memInfo.heapUsed,
            heapTotal: memInfo.heapTotal,
            external: memInfo.external
        };
    }

    // 检查性能阈值
    private checkPerformanceThresholds(metric: PerformanceMetrics): void {
        const threshold = this.thresholds[metric.operationType];
        const warnings: string[] = [];

        // 检查执行时间
        if (metric.duration && metric.duration > threshold.maxDuration) {
            warnings.push(`执行时间超出阈值: ${metric.duration}ms > ${threshold.maxDuration}ms`);
        }

        // 检查内存使用
        if (metric.memoryUsage && metric.memoryUsage.heapUsed > threshold.maxMemory) {
            warnings.push(`内存使用超出阈值: ${Math.round(metric.memoryUsage.heapUsed / 1024 / 1024)}MB > ${Math.round(threshold.maxMemory / 1024 / 1024)}MB`);
        }

        // 检查文件数量
        if (metric.operationType === 'analysis' && metric.fileCount && metric.fileCount > this.thresholds.analysis.maxFileCount) {
            warnings.push(`分析文件数量过多: ${metric.fileCount} > ${this.thresholds.analysis.maxFileCount}`);
        }

        if (warnings.length > 0) {
            this.emit('performanceWarning', {
                operationId: metric.operationId,
                operationType: metric.operationType,
                warnings
            });

            // 显示用户通知
            vscode.window.showWarningMessage(
                `性能警告: ${metric.operationType} 操作可能需要优化`,
                '查看详情'
            ).then(action => {
                if (action === '查看详情') {
                    this.showPerformanceDetails(metric, warnings);
                }
            });
        }
    }

    // 显示性能详情
    private showPerformanceDetails(metric: PerformanceMetrics, warnings: string[]): void {
        const details = `# 性能分析详情

## 操作信息
- **操作ID**: ${metric.operationId}
- **操作类型**: ${metric.operationType}
- **执行时间**: ${metric.duration}ms
- **开始时间**: ${new Date(metric.startTime).toLocaleString()}
- **结束时间**: ${metric.endTime ? new Date(metric.endTime).toLocaleString() : '未完成'}
- **执行状态**: ${metric.success ? '✅ 成功' : '❌ 失败'}

## 性能指标
- **文件数量**: ${metric.fileCount || 'N/A'}
- **代码行数**: ${metric.linesOfCode || 'N/A'}
- **内存使用**: ${metric.memoryUsage ? Math.round(metric.memoryUsage.heapUsed / 1024 / 1024) + 'MB' : 'N/A'}

## ⚠️ 性能警告
${warnings.map(w => `- ${w}`).join('\n')}

## 💡 优化建议
${this.generateOptimizationSuggestions(metric).map(s => `- ${s}`).join('\n')}

## 📊 上下文信息
\`\`\`json
${JSON.stringify(metric.metadata, null, 2)}
\`\`\`
`;

        vscode.workspace.openTextDocument({
            content: details,
            language: 'markdown'
        }).then(doc => {
            vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        });
    }

    // 生成优化建议
    private generateOptimizationSuggestions(metric: PerformanceMetrics): string[] {
        const suggestions: string[] = [];

        switch (metric.operationType) {
            case 'analysis':
                if (metric.duration && metric.duration > 20000) {
                    suggestions.push('启用增量分析以提高速度');
                    suggestions.push('考虑排除不必要的文件');
                }
                if (metric.fileCount && metric.fileCount > 500) {
                    suggestions.push('使用文件过滤器限制分析范围');
                    suggestions.push('分批处理大型项目');
                }
                break;

            case 'visualization':
                if (metric.duration && metric.duration > 3000) {
                    suggestions.push('优化节点渲染算法');
                    suggestions.push('启用虚拟滚动减少DOM节点');
                }
                break;

            case 'collaboration':
                if (metric.duration && metric.duration > 1000) {
                    suggestions.push('检查网络连接质量');
                    suggestions.push('启用本地缓存减少网络请求');
                }
                break;

            case 'codeGeneration':
                if (metric.duration && metric.duration > 5000) {
                    suggestions.push('优化代码模板缓存');
                    suggestions.push('使用异步生成提升响应性');
                }
                break;
        }

        // 通用内存优化建议
        if (metric.memoryUsage && metric.memoryUsage.heapUsed > 200 * 1024 * 1024) {
            suggestions.push('定期清理缓存释放内存');
            suggestions.push('避免创建过多临时对象');
            suggestions.push('考虑重启VS Code释放内存');
        }

        return suggestions;
    }

    // 生成性能报告
    public generatePerformanceReport(): PerformanceReport {
        const completedOps = this.completedMetrics;
        const totalOperations = completedOps.length;
        
        if (totalOperations === 0) {
            return {
                totalOperations: 0,
                averageDuration: 0,
                successRate: 1,
                slowestOperations: [],
                errorPatterns: [],
                memoryTrends: [],
                recommendations: [{
                    type: 'reliability',
                    priority: 'low',
                    title: '暂无性能数据',
                    description: '开始使用扩展功能后将收集性能数据',
                    impact: '无影响',
                    implementation: ['继续正常使用扩展']
                }]
            };
        }

        // 计算基础指标
        const successfulOps = completedOps.filter(op => op.success);
        const durations = completedOps.filter(op => op.duration).map(op => op.duration!);
        const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const successRate = successfulOps.length / totalOperations;

        // 找出最慢的操作
        const slowestOperations = completedOps
            .filter(op => op.duration)
            .sort((a, b) => (b.duration || 0) - (a.duration || 0))
            .slice(0, 10);

        // 分析错误模式
        const errors = completedOps.filter(op => !op.success && op.errorMessage);
        const errorMap = new Map<string, string[]>();
        
        errors.forEach(op => {
            const error = op.errorMessage!;
            if (!errorMap.has(error)) {
                errorMap.set(error, []);
            }
            errorMap.get(error)!.push(op.operationId);
        });

        const errorPatterns = Array.from(errorMap.entries())
            .map(([error, operations]) => ({ error, count: operations.length, operations }))
            .sort((a, b) => b.count - a.count);

        // 内存趋势分析
        const memoryTrends = completedOps
            .filter(op => op.memoryUsage)
            .map(op => ({
                timestamp: op.startTime,
                usage: op.memoryUsage!.heapUsed
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

        // 生成优化建议
        const recommendations = this.generateRecommendations({
            totalOperations,
            averageDuration,
            successRate,
            slowestOperations,
            errorPatterns,
            memoryTrends
        });

        return {
            totalOperations,
            averageDuration,
            successRate,
            slowestOperations,
            errorPatterns,
            memoryTrends,
            recommendations
        };
    }

    // 生成优化建议
    private generateRecommendations(data: Omit<PerformanceReport, 'recommendations'>): PerformanceRecommendation[] {
        const recommendations: PerformanceRecommendation[] = [];

        // 成功率建议
        if (data.successRate < 0.9) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                title: '提升操作成功率',
                description: `当前成功率为 ${Math.round(data.successRate * 100)}%，需要改进错误处理`,
                impact: '提升用户体验和系统稳定性',
                implementation: [
                    '分析最常见的错误模式',
                    '改进输入验证和错误恢复',
                    '添加更详细的错误提示'
                ]
            });
        }

        // 性能建议
        if (data.averageDuration > 10000) {
            recommendations.push({
                type: 'speed',
                priority: 'high',
                title: '优化操作执行时间',
                description: `平均执行时间为 ${Math.round(data.averageDuration)}ms，超出理想范围`,
                impact: '显著提升响应速度和用户体验',
                implementation: [
                    '启用增量处理和缓存机制',
                    '优化算法复杂度',
                    '考虑异步处理大型操作'
                ]
            });
        }

        // 内存建议
        const avgMemory = data.memoryTrends.length > 0 
            ? data.memoryTrends.reduce((sum, trend) => sum + trend.usage, 0) / data.memoryTrends.length
            : 0;
        
        if (avgMemory > 300 * 1024 * 1024) {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                title: '优化内存使用',
                description: `平均内存使用为 ${Math.round(avgMemory / 1024 / 1024)}MB，偏高`,
                impact: '降低系统资源占用，提升稳定性',
                implementation: [
                    '实现对象池和缓存清理',
                    '优化数据结构选择',
                    '及时释放不需要的引用'
                ]
            });
        }

        // 错误模式建议
        if (data.errorPatterns.length > 0) {
            const topError = data.errorPatterns[0];
            recommendations.push({
                type: 'reliability',
                priority: 'medium',
                title: '解决常见错误',
                description: `最常见错误: "${topError.error}" (出现 ${topError.count} 次)`,
                impact: '减少用户遇到的问题',
                implementation: [
                    '针对性修复高频错误',
                    '改进相关功能的健壮性',
                    '添加预防性检查'
                ]
            });
        }

        // 配置建议
        if (data.slowestOperations.length > 0) {
            const slowOp = data.slowestOperations[0];
            if (slowOp.operationType === 'analysis' && slowOp.fileCount && slowOp.fileCount > 500) {
                recommendations.push({
                    type: 'configuration',
                    priority: 'low',
                    title: '优化分析配置',
                    description: '检测到大型项目分析，建议调整配置',
                    impact: '提升大型项目处理效率',
                    implementation: [
                        '启用智能文件过滤',
                        '配置排除模式',
                        '使用渐进式分析'
                    ]
                });
            }
        }

        return recommendations;
    }

    // 显示性能报告
    public async showPerformanceReport(): Promise<void> {
        const report = this.generatePerformanceReport();
        
        const reportContent = `# 📊 Visual Programming Extension - 性能报告

**生成时间**: ${new Date().toLocaleString()}  
**数据范围**: 最近 ${report.totalOperations} 次操作

---

## 📈 性能概览

| 指标 | 值 | 状态 |
|------|-----|------|
| 总操作数 | ${report.totalOperations} | ${report.totalOperations > 100 ? '📊 充足数据' : '📊 数据收集中'} |
| 平均执行时间 | ${Math.round(report.averageDuration)}ms | ${report.averageDuration < 5000 ? '🟢 优秀' : report.averageDuration < 15000 ? '🟡 良好' : '🔴 需优化'} |
| 成功率 | ${Math.round(report.successRate * 100)}% | ${report.successRate > 0.95 ? '🟢 优秀' : report.successRate > 0.9 ? '🟡 良好' : '🔴 需改进'} |

## 🐌 最慢操作分析

${report.slowestOperations.length === 0 ? '暂无数据' : report.slowestOperations.slice(0, 5).map((op, index) => 
    `${index + 1}. **${op.operationType}** - ${op.duration}ms (${op.success ? '成功' : '失败'})`
).join('\n')}

## ❌ 错误模式分析

${report.errorPatterns.length === 0 ? '🎉 无错误记录' : report.errorPatterns.slice(0, 5).map((pattern, index) => 
    `${index + 1}. **${pattern.error}** - 出现 ${pattern.count} 次`
).join('\n')}

## 💾 内存使用趋势

${report.memoryTrends.length === 0 ? '暂无内存数据' : 
    `- 最低使用: ${Math.round(Math.min(...report.memoryTrends.map(t => t.usage)) / 1024 / 1024)}MB
- 最高使用: ${Math.round(Math.max(...report.memoryTrends.map(t => t.usage)) / 1024 / 1024)}MB
- 平均使用: ${Math.round(report.memoryTrends.reduce((sum, t) => sum + t.usage, 0) / report.memoryTrends.length / 1024 / 1024)}MB`}

## 💡 优化建议

${report.recommendations.map((rec, index) => 
    `### ${index + 1}. ${rec.title} (${rec.priority.toUpperCase()} 优先级)

**类型**: ${rec.type}  
**描述**: ${rec.description}  
**预期影响**: ${rec.impact}

**实施步骤**:
${rec.implementation.map(step => `- ${step}`).join('\n')}
`).join('\n')}

---

*性能监控数据每次操作自动收集*  
*建议定期查看此报告以发现优化机会*
`;

        const doc = await vscode.workspace.openTextDocument({
            content: reportContent,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }

    // 清理历史数据
    public clearHistory(): void {
        this.completedMetrics = [];
        vscode.window.showInformationMessage('✨ 性能监控历史数据已清理');
    }

    // 获取实时状态
    public getActiveOperations(): PerformanceMetrics[] {
        return Array.from(this.metrics.values());
    }

    // 设置性能阈值
    public updateThresholds(operationType: keyof typeof this.thresholds, thresholds: Partial<typeof this.thresholds.analysis>): void {
        Object.assign(this.thresholds[operationType], thresholds);
    }
}

// 便捷的性能监控装饰器
export function performanceMonitor(operationType: PerformanceMetrics['operationType']) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const monitor = PerformanceMonitor.getInstance();
            const operationId = monitor.startOperation(operationType, {
                method: propertyName,
                className: target.constructor.name
            });

            try {
                const result = await method.apply(this, args);
                monitor.completeOperation(operationId, true);
                return result;
            } catch (error) {
                monitor.completeOperation(operationId, false, error instanceof Error ? error.message : String(error));
                throw error;
            }
        };

        return descriptor;
    };
}

// 导出便捷函数
export function startPerformanceMonitoring(operationType: PerformanceMetrics['operationType'], metadata?: Record<string, any>): string {
    return PerformanceMonitor.getInstance().startOperation(operationType, metadata);
}

export function completePerformanceMonitoring(operationId: string, success?: boolean, errorMessage?: string): PerformanceMetrics | undefined {
    return PerformanceMonitor.getInstance().completeOperation(operationId, success, errorMessage);
}

export function showPerformanceReport(): Promise<void> {
    return PerformanceMonitor.getInstance().showPerformanceReport();
}
