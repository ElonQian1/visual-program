// 🔥 统一错误处理系统
import * as vscode from 'vscode';

export enum ErrorCode {
    // 分析错误
    ANALYSIS_FAILED = 'ANALYSIS_FAILED',
    PARSING_ERROR = 'PARSING_ERROR',
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
    
    // 可视化错误
    VISUALIZATION_ERROR = 'VISUALIZATION_ERROR',
    CANVAS_RENDER_ERROR = 'CANVAS_RENDER_ERROR',
    NODE_CONNECTION_ERROR = 'NODE_CONNECTION_ERROR',
    
    // 协作错误
    COLLABORATION_CONNECTION_ERROR = 'COLLABORATION_CONNECTION_ERROR',
    WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
    SYNC_CONFLICT = 'SYNC_CONFLICT',
    
    // 性能错误
    MEMORY_OVERFLOW = 'MEMORY_OVERFLOW',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    LARGE_PROJECT_ERROR = 'LARGE_PROJECT_ERROR',
    
    // 配置错误
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
    EXTENSION_ERROR = 'EXTENSION_ERROR'
}

export class VisualProgrammingError extends Error {
    public readonly timestamp: Date;
    public readonly context: Record<string, any>;
    public readonly stack?: string;

    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly severity: 'error' | 'warning' | 'info' = 'error',
        public readonly recoverable: boolean = true,
        context?: Record<string, any>
    ) {
        super(message);
        this.name = 'VisualProgrammingError';
        this.timestamp = new Date();
        this.context = context || {};
        
        // 保持错误堆栈
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, VisualProgrammingError);
        }
    }

    // 创建用户友好的错误消息
    public getUserMessage(): string {
        switch (this.code) {
            case ErrorCode.ANALYSIS_FAILED:
                return `代码分析失败: ${this.message}。请检查文件语法是否正确。`;
            case ErrorCode.PARSING_ERROR:
                return `文件解析错误: ${this.message}。请确保代码格式正确。`;
            case ErrorCode.FILE_NOT_FOUND:
                return `找不到文件: ${this.message}。请确认文件路径是否正确。`;
            case ErrorCode.UNSUPPORTED_LANGUAGE:
                return `不支持的语言: ${this.message}。当前支持 TypeScript、JavaScript 和 Rust。`;
            case ErrorCode.VISUALIZATION_ERROR:
                return `可视化渲染失败: ${this.message}。请尝试刷新视图。`;
            case ErrorCode.CANVAS_RENDER_ERROR:
                return `画布渲染错误: ${this.message}。请检查浏览器兼容性。`;
            case ErrorCode.COLLABORATION_CONNECTION_ERROR:
                return `协作连接失败: ${this.message}。请检查网络连接。`;
            case ErrorCode.WEBSOCKET_ERROR:
                return `实时通信错误: ${this.message}。将切换到本地模式。`;
            case ErrorCode.MEMORY_OVERFLOW:
                return `内存不足: ${this.message}。建议处理较小的文件或重启VS Code。`;
            case ErrorCode.TIMEOUT_ERROR:
                return `操作超时: ${this.message}。大型项目分析需要更多时间。`;
            case ErrorCode.LARGE_PROJECT_ERROR:
                return `项目过大: ${this.message}。建议启用增量分析模式。`;
            default:
                return `发生错误: ${this.message}`;
        }
    }

    // 获取恢复建议
    public getRecoveryActions(): string[] {
        switch (this.code) {
            case ErrorCode.ANALYSIS_FAILED:
            case ErrorCode.PARSING_ERROR:
                return [
                    '检查代码语法错误',
                    '确保文件编码为UTF-8',
                    '尝试重新打开文件'
                ];
            
            case ErrorCode.FILE_NOT_FOUND:
                return [
                    '确认文件路径正确',
                    '检查文件是否存在',
                    '刷新文件资源管理器'
                ];
            
            case ErrorCode.UNSUPPORTED_LANGUAGE:
                return [
                    '使用支持的语言 (TypeScript/JavaScript/Rust)',
                    '检查文件扩展名',
                    '考虑转换文件格式'
                ];
            
            case ErrorCode.VISUALIZATION_ERROR:
            case ErrorCode.CANVAS_RENDER_ERROR:
                return [
                    '刷新可视化面板',
                    '重启VS Code',
                    '检查浏览器兼容性',
                    '清除扩展缓存'
                ];
            
            case ErrorCode.COLLABORATION_CONNECTION_ERROR:
            case ErrorCode.WEBSOCKET_ERROR:
                return [
                    '检查网络连接',
                    '重新启动协作会话',
                    '切换到本地模式',
                    '联系网络管理员'
                ];
            
            case ErrorCode.MEMORY_OVERFLOW:
                return [
                    '关闭其他应用程序',
                    '重启VS Code',
                    '分批处理大文件',
                    '增加系统内存'
                ];
            
            case ErrorCode.TIMEOUT_ERROR:
                return [
                    '等待操作完成',
                    '启用增量分析',
                    '减少分析文件数量',
                    '提高分析超时时间'
                ];
            
            case ErrorCode.LARGE_PROJECT_ERROR:
                return [
                    '启用增量分析模式',
                    '排除不必要的文件',
                    '分模块进行分析',
                    '使用过滤器限制范围'
                ];
            
            default:
                return [
                    '重试操作',
                    '重启扩展',
                    '查看输出日志',
                    '联系技术支持'
                ];
        }
    }
}

// 错误处理管理器
export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorLog: VisualProgrammingError[] = [];
    private readonly maxLogSize = 1000;

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    // 处理错误
    public handleError(error: Error | VisualProgrammingError, context?: Record<string, any>): void {
        let vpError: VisualProgrammingError;

        if (error instanceof VisualProgrammingError) {
            vpError = error;
        } else {
            // 将普通错误转换为VisualProgrammingError
            vpError = new VisualProgrammingError(
                error.message,
                ErrorCode.EXTENSION_ERROR,
                'error',
                true,
                { ...context, originalError: error.name }
            );
        }

        // 记录错误
        this.logError(vpError);

        // 显示用户通知
        this.showUserNotification(vpError);

        // 输出到开发者控制台
        this.logToConsole(vpError);
    }

    // 记录错误到内存日志
    private logError(error: VisualProgrammingError): void {
        this.errorLog.push(error);
        
        // 限制日志大小
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
    }

    // 显示用户通知
    private showUserNotification(error: VisualProgrammingError): void {
        const message = error.getUserMessage();
        const actions = error.getRecoveryActions();

        switch (error.severity) {
            case 'error':
                if (error.recoverable) {
                    vscode.window.showErrorMessage(
                        message,
                        ...actions.slice(0, 2) // 只显示前两个建议
                    ).then(selectedAction => {
                        if (selectedAction) {
                            this.executeRecoveryAction(selectedAction, error);
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(message);
                }
                break;
                
            case 'warning':
                vscode.window.showWarningMessage(message);
                break;
                
            case 'info':
                vscode.window.showInformationMessage(message);
                break;
        }
    }

    // 执行恢复操作
    private executeRecoveryAction(action: string, error: VisualProgrammingError): void {
        switch (action) {
            case '刷新可视化面板':
                vscode.commands.executeCommand('visualProgramming.openVisualView');
                break;
                
            case '重启VS Code':
                vscode.window.showInformationMessage(
                    '请手动重启VS Code以完成恢复',
                    '确定'
                );
                break;
                
            case '查看输出日志':
                this.showErrorLog();
                break;
                
            case '清除扩展缓存':
                this.clearCache();
                break;
                
            default:
                // 对于其他操作，显示详细指导
                this.showDetailedGuidance(action, error);
                break;
        }
    }

    // 输出到开发者控制台
    private logToConsole(error: VisualProgrammingError): void {
        const logMessage = `[${error.timestamp.toISOString()}] ${error.code}: ${error.message}`;
        
        if (error.context && Object.keys(error.context).length > 0) {
            console.group(logMessage);
            console.log('Context:', error.context);
            if (error.stack) {
                console.log('Stack:', error.stack);
            }
            console.groupEnd();
        } else {
            console.error(logMessage);
        }
    }

    // 显示错误日志
    public showErrorLog(): void {
        const recentErrors = this.errorLog.slice(-20); // 显示最近20个错误
        
        if (recentErrors.length === 0) {
            vscode.window.showInformationMessage('🎉 没有发现错误！');
            return;
        }

        const logContent = recentErrors.map(error => 
            `[${error.timestamp.toLocaleString()}] ${error.severity.toUpperCase()}: ${error.code}\n` +
            `消息: ${error.message}\n` +
            `上下文: ${JSON.stringify(error.context, null, 2)}\n` +
            `可恢复: ${error.recoverable ? '是' : '否'}\n` +
            '---'
        ).join('\n\n');

        vscode.workspace.openTextDocument({
            content: `# Visual Programming Extension - 错误日志\n\n${logContent}`,
            language: 'markdown'
        }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    // 清除缓存
    private clearCache(): void {
        // 这里可以实现缓存清理逻辑
        vscode.window.showInformationMessage('✨ 扩展缓存已清除');
    }

    // 显示详细指导
    private showDetailedGuidance(action: string, error: VisualProgrammingError): void {
        const guidance = `## 📋 恢复指导: ${action}\n\n` +
            `**错误类型**: ${error.code}\n` +
            `**错误描述**: ${error.message}\n\n` +
            `**详细步骤**:\n` +
            error.getRecoveryActions().map((step, index) => `${index + 1}. ${step}`).join('\n') +
            '\n\n**如果问题持续存在，请联系技术支持并提供此错误信息。**';

        vscode.workspace.openTextDocument({
            content: guidance,
            language: 'markdown'
        }).then(doc => {
            vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        });
    }

    // 获取错误统计
    public getErrorStats(): { total: number; byCode: Record<string, number>; byTime: Record<string, number> } {
        const byCode: Record<string, number> = {};
        const byTime: Record<string, number> = {};

        this.errorLog.forEach(error => {
            // 按错误代码统计
            byCode[error.code] = (byCode[error.code] || 0) + 1;

            // 按时间统计（按小时）
            const hourKey = error.timestamp.toISOString().slice(0, 13);
            byTime[hourKey] = (byTime[hourKey] || 0) + 1;
        });

        return {
            total: this.errorLog.length,
            byCode,
            byTime
        };
    }

    // 检查系统健康度
    public checkSystemHealth(): { healthy: boolean; issues: string[]; recommendations: string[] } {
        const stats = this.getErrorStats();
        const issues: string[] = [];
        const recommendations: string[] = [];
        
        // 检查错误频率
        if (stats.total > 50) {
            issues.push(`发现 ${stats.total} 个错误，频率较高`);
            recommendations.push('考虑重启VS Code或检查项目配置');
        }

        // 检查常见错误模式
        const criticalErrors = Object.entries(stats.byCode).filter(([_, count]) => count > 10);
        if (criticalErrors.length > 0) {
            issues.push(`频繁出现的错误: ${criticalErrors.map(([code]) => code).join(', ')}`);
            recommendations.push('重点关注并解决高频错误');
        }

        const healthy = issues.length === 0;
        
        if (healthy) {
            recommendations.push('系统运行良好，继续保持！');
        }

        return { healthy, issues, recommendations };
    }
}

// 便捷的错误处理函数
export function handleError(error: Error | VisualProgrammingError, context?: Record<string, any>): void {
    ErrorHandler.getInstance().handleError(error, context);
}

// 创建特定类型的错误
export function createAnalysisError(message: string, context?: Record<string, any>): VisualProgrammingError {
    return new VisualProgrammingError(message, ErrorCode.ANALYSIS_FAILED, 'error', true, context);
}

export function createVisualizationError(message: string, context?: Record<string, any>): VisualProgrammingError {
    return new VisualProgrammingError(message, ErrorCode.VISUALIZATION_ERROR, 'error', true, context);
}

export function createCollaborationError(message: string, context?: Record<string, any>): VisualProgrammingError {
    return new VisualProgrammingError(message, ErrorCode.COLLABORATION_CONNECTION_ERROR, 'error', true, context);
}

export function createPerformanceError(message: string, context?: Record<string, any>): VisualProgrammingError {
    return new VisualProgrammingError(message, ErrorCode.TIMEOUT_ERROR, 'warning', true, context);
}
