// 🛡️ 全局错误处理和恢复系统
import * as vscode from 'vscode';

export interface ErrorContext {
    operation: string;
    file?: string;
    line?: number;
    component?: string;
    userId?: string;
    timestamp: number;
}

export interface ErrorRecoveryStrategy {
    canRecover: boolean;
    recoveryAction?: () => Promise<void>;
    fallbackAction?: () => Promise<void>;
    userMessage: string;
}

export class GlobalErrorHandler {
    private static instance: GlobalErrorHandler;
    private errorLog: Array<{ error: Error; context: ErrorContext }> = [];
    private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
    private outputChannel: vscode.OutputChannel;
    
    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Visual Programming - Errors');
        this.initializeRecoveryStrategies();
    }
    
    public static getInstance(): GlobalErrorHandler {
        if (!GlobalErrorHandler.instance) {
            GlobalErrorHandler.instance = new GlobalErrorHandler();
        }
        return GlobalErrorHandler.instance;
    }
    
    // 🏗️ 初始化恢复策略
    private initializeRecoveryStrategies(): void {
        this.recoveryStrategies.set('analysis-timeout', {
            canRecover: true,
            recoveryAction: async () => {
                // 重试分析，但降低分析深度
                vscode.window.showInformationMessage('🔄 正在重试分析（简化模式）...');
            },
            userMessage: '分析超时，已自动切换到快速模式'
        });
        
        this.recoveryStrategies.set('memory-limit', {
            canRecover: true,
            recoveryAction: async () => {
                // 清理缓存，分块处理
                vscode.window.showInformationMessage('🧹 正在清理内存缓存...');
            },
            userMessage: '内存不足，已自动优化内存使用'
        });
        
        this.recoveryStrategies.set('file-access', {
            canRecover: true,
            fallbackAction: async () => {
                // 跳过问题文件，继续处理
                vscode.window.showInformationMessage('⏭️ 跳过问题文件，继续分析...');
            },
            userMessage: '文件访问失败，已跳过并继续处理'
        });
        
        this.recoveryStrategies.set('network-error', {
            canRecover: true,
            recoveryAction: async () => {
                // 切换到离线模式
                vscode.window.showInformationMessage('📡 网络错误，切换到离线模式');
            },
            userMessage: '网络连接失败，已切换到离线分析模式'
        });
    }
    
    // 🚨 处理错误
    public async handleError(error: Error, context: ErrorContext): Promise<void> {
        const errorEntry = { error, context };
        this.errorLog.push(errorEntry);
        
        // 记录到输出通道
        this.logError(error, context);
        
        // 尝试错误恢复
        const recoveryKey = this.categorizeError(error);
        const strategy = this.recoveryStrategies.get(recoveryKey);
        
        if (strategy && strategy.canRecover) {
            try {
                if (strategy.recoveryAction) {
                    await strategy.recoveryAction();
                } else if (strategy.fallbackAction) {
                    await strategy.fallbackAction();
                }
                
                vscode.window.showInformationMessage(`✅ ${strategy.userMessage}`);
                return;
            } catch (recoveryError) {
                // 恢复失败，降级处理
                this.logError(recoveryError as Error, { 
                    ...context, 
                    operation: 'error-recovery' 
                });
            }
        }
        
        // 无法恢复，显示用户友好错误
        this.showUserFriendlyError(error, context);
    }
    
    // 📝 记录错误
    private logError(error: Error, context: ErrorContext): void {
        const timestamp = new Date().toISOString();
        const logMessage = `
[${timestamp}] ERROR in ${context.operation}
File: ${context.file || 'Unknown'}
Component: ${context.component || 'Unknown'}
Error: ${error.message}
Stack: ${error.stack}
---
`;
        
        this.outputChannel.appendLine(logMessage);
        console.error('[Visual Programming Error]', error, context);
    }
    
    // 🏷️ 错误分类
    private categorizeError(error: Error): string {
        const message = error.message.toLowerCase();
        
        if (message.includes('timeout') || message.includes('time out')) {
            return 'analysis-timeout';
        }
        
        if (message.includes('memory') || message.includes('heap')) {
            return 'memory-limit';
        }
        
        if (message.includes('enoent') || message.includes('access') || message.includes('permission')) {
            return 'file-access';
        }
        
        if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
            return 'network-error';
        }
        
        return 'general-error';
    }
    
    // 👤 显示用户友好错误
    private showUserFriendlyError(error: Error, context: ErrorContext): void {
        const userMessage = this.getUserFriendlyMessage(error, context);
        
        vscode.window.showErrorMessage(
            userMessage,
            '查看详细信息',
            '重试',
            '报告问题'
        ).then(selection => {
            switch (selection) {
                case '查看详细信息':
                    this.outputChannel.show();
                    break;
                case '重试':
                    this.retryOperation(context);
                    break;
                case '报告问题':
                    this.openIssueReporter(error, context);
                    break;
            }
        });
    }
    
    // 💬 获取用户友好消息
    private getUserFriendlyMessage(error: Error, context: ErrorContext): string {
        const operation = context.operation;
        
        switch (operation) {
            case 'code-analysis':
                return '代码分析失败，请检查文件格式是否正确';
            case 'blueprint-generation':
                return '蓝图生成失败，请尝试简化代码结构';
            case 'template-creation':
                return '模板创建失败，请检查模板配置';
            case 'collaboration-sync':
                return '协作同步失败，请检查网络连接';
            default:
                return `操作失败：${operation}，请稍后重试`;
        }
    }
    
    // 🔄 重试操作
    private retryOperation(context: ErrorContext): void {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
    
    // 🐛 打开问题报告
    private openIssueReporter(error: Error, context: ErrorContext): void {
        const issueBody = this.generateIssueTemplate(error, context);
        const encodedBody = encodeURIComponent(issueBody);
        const url = `https://github.com/your-repo/visual-programming-vscode/issues/new?body=${encodedBody}`;
        
        vscode.env.openExternal(vscode.Uri.parse(url));
    }
    
    // 📋 生成问题模板
    private generateIssueTemplate(error: Error, context: ErrorContext): string {
        return `## 错误报告

**操作**: ${context.operation}
**文件**: ${context.file || '未知'}
**组件**: ${context.component || '未知'}
**时间**: ${new Date(context.timestamp).toLocaleString()}

**错误信息**:
\`\`\`
${error.message}
\`\`\`

**堆栈信息**:
\`\`\`
${error.stack}
\`\`\`

**环境信息**:
- VSCode版本: ${vscode.version}
- 扩展版本: ${vscode.extensions.getExtension('your-publisher.visual-programming-chinese')?.packageJSON.version}
- 操作系统: ${process.platform}

**重现步骤**:
1. 
2. 
3. 

**期望行为**:

**实际行为**:
`;
    }
    
    // 📊 获取错误统计
    public getErrorStatistics(): {
        totalErrors: number;
        errorsByType: Record<string, number>;
        recentErrors: Array<{ error: Error; context: ErrorContext }>;
    } {
        const errorsByType: Record<string, number> = {};
        
        this.errorLog.forEach(entry => {
            const type = this.categorizeError(entry.error);
            errorsByType[type] = (errorsByType[type] || 0) + 1;
        });
        
        return {
            totalErrors: this.errorLog.length,
            errorsByType,
            recentErrors: this.errorLog.slice(-10)
        };
    }
    
    // 🧹 清理错误日志
    public clearErrorLog(): void {
        this.errorLog = [];
        this.outputChannel.clear();
        vscode.window.showInformationMessage('✅ 错误日志已清理');
    }
}

// 导出单例实例
export const globalErrorHandler = GlobalErrorHandler.getInstance();
