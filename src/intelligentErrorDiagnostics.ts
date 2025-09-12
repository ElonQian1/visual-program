import * as vscode from 'vscode';

// 错误类型定义
export interface DiagnosticError {
    id: string;
    type: 'analysis' | 'visualization' | 'performance' | 'cache' | 'system';
    severity: 'error' | 'warning' | 'info';
    message: string;
    details: string;
    fileName?: string;
    line?: number;
    column?: number;
    timestamp: number;
    resolved: boolean;
    resolutionSteps?: string[];
    stackTrace?: string;
}

export interface ErrorPattern {
    pattern: RegExp;
    type: DiagnosticError['type'];
    severity: DiagnosticError['severity'];
    description: string;
    commonCauses: string[];
    solutions: string[];
    autoFixable: boolean;
}

export interface SystemHealthReport {
    overallHealth: 'healthy' | 'warning' | 'critical';
    errorCount: number;
    warningCount: number;
    criticalIssues: DiagnosticError[];
    performanceIssues: string[];
    recommendations: string[];
    lastCheck: number;
}

export class IntelligentErrorDiagnostics {
    private errors: Map<string, DiagnosticError> = new Map();
    private errorPatterns: ErrorPattern[] = [];
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('visual-programming');
        this.initializeErrorPatterns();
    }

    // 初始化错误模式
    private initializeErrorPatterns(): void {
        this.errorPatterns = [
            {
                pattern: /Cannot find module ['"]([^'"]+)['"]/,
                type: 'analysis',
                severity: 'error',
                description: '找不到模块',
                commonCauses: [
                    '模块未安装',
                    '模块路径错误',
                    'node_modules目录损坏'
                ],
                solutions: [
                    '运行 npm install 安装依赖',
                    '检查模块路径是否正确',
                    '删除node_modules后重新安装'
                ],
                autoFixable: false
            },
            {
                pattern: /Property ['"]([^'"]+)['"] does not exist on type/,
                type: 'analysis',
                severity: 'error',
                description: 'TypeScript类型错误',
                commonCauses: [
                    '类型定义不完整',
                    '接口不匹配',
                    '版本不兼容'
                ],
                solutions: [
                    '更新类型定义',
                    '检查接口声明',
                    '使用类型断言'
                ],
                autoFixable: true
            },
            {
                pattern: /Out of memory/,
                type: 'performance',
                severity: 'error',
                description: '内存不足',
                commonCauses: [
                    '分析文件过大',
                    '缓存占用过多',
                    '内存泄漏'
                ],
                solutions: [
                    '减少分析文件大小',
                    '清理缓存',
                    '重启VSCode'
                ],
                autoFixable: true
            },
            {
                pattern: /ENOENT.*open.*package\.json/,
                type: 'system',
                severity: 'warning',
                description: '找不到package.json',
                commonCauses: [
                    '不在项目根目录',
                    'package.json被删除'
                ],
                solutions: [
                    '切换到项目根目录',
                    '初始化新的package.json'
                ],
                autoFixable: true
            }
        ];
    }

    // 记录错误
    recordError(error: Error | string, context: {
        type: DiagnosticError['type'];
        fileName?: string;
        line?: number;
        column?: number;
        details?: string;
    }): string {
        const errorId = this.generateErrorId();
        const errorMessage = error instanceof Error ? error.message : error;
        const stackTrace = error instanceof Error ? error.stack : undefined;

        const diagnosticError: DiagnosticError = {
            id: errorId,
            type: context.type,
            severity: 'error',
            message: errorMessage,
            details: context.details || '',
            fileName: context.fileName,
            line: context.line,
            column: context.column,
            timestamp: Date.now(),
            resolved: false,
            stackTrace
        };

        // 分析错误模式并提供解决方案
        const pattern = this.matchErrorPattern(errorMessage);
        if (pattern) {
            diagnosticError.severity = pattern.severity;
            diagnosticError.resolutionSteps = pattern.solutions;
        }

        this.errors.set(errorId, diagnosticError);
        this.updateDiagnostics();

        return errorId;
    }

    // 匹配错误模式
    private matchErrorPattern(errorMessage: string): ErrorPattern | null {
        for (const pattern of this.errorPatterns) {
            if (pattern.pattern.test(errorMessage)) {
                return pattern;
            }
        }
        return null;
    }

    // 生成错误ID
    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 更新VSCode诊断信息
    private updateDiagnostics(): void {
        const diagnosticMap = new Map<string, vscode.Diagnostic[]>();

        for (const error of this.errors.values()) {
            if (error.resolved || !error.fileName) continue;

            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(
                    error.line || 0,
                    error.column || 0,
                    error.line || 0,
                    (error.column || 0) + 10
                ),
                `${error.message}${error.resolutionSteps ? '\n建议: ' + error.resolutionSteps.join(', ') : ''}`,
                error.severity === 'error' ? vscode.DiagnosticSeverity.Error :
                error.severity === 'warning' ? vscode.DiagnosticSeverity.Warning :
                vscode.DiagnosticSeverity.Information
            );

            diagnostic.source = 'Visual Programming';
            diagnostic.code = error.id;

            const fileName = error.fileName;
            if (!diagnosticMap.has(fileName)) {
                diagnosticMap.set(fileName, []);
            }
            diagnosticMap.get(fileName)!.push(diagnostic);
        }

        // 更新所有文件的诊断信息
        this.diagnosticCollection.clear();
        for (const [fileName, diagnostics] of diagnosticMap) {
            this.diagnosticCollection.set(vscode.Uri.file(fileName), diagnostics);
        }
    }

    // 自动修复错误
    async autoFixError(errorId: string): Promise<boolean> {
        const error = this.errors.get(errorId);
        if (!error) return false;

        const pattern = this.matchErrorPattern(error.message);
        if (!pattern || !pattern.autoFixable) return false;

        try {
            // 根据错误类型执行自动修复
            switch (error.type) {
                case 'performance':
                    if (error.message.includes('Out of memory')) {
                        await this.fixMemoryIssue();
                        return true;
                    }
                    break;

                case 'system':
                    if (error.message.includes('package.json')) {
                        await this.fixPackageJsonIssue(error.fileName!);
                        return true;
                    }
                    break;

                case 'analysis':
                    if (error.message.includes('Property') && error.message.includes('does not exist')) {
                        await this.fixTypeScriptError(error);
                        return true;
                    }
                    break;
            }
        } catch (fixError) {
            console.error('Auto-fix failed:', fixError);
            return false;
        }

        return false;
    }

    // 修复内存问题
    private async fixMemoryIssue(): Promise<void> {
        // 清理缓存
        const { analysisCache } = await import('./intelligentAnalysisCache');
        analysisCache.clear();

        // 触发垃圾回收
        if (global.gc) {
            global.gc();
        }

        vscode.window.showInformationMessage('已清理缓存和内存，请重试操作');
    }

    // 修复package.json问题
    private async fixPackageJsonIssue(filePath: string): Promise<void> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        if (!workspaceFolder) return;

        const packageJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
        
        try {
            await vscode.workspace.fs.stat(packageJsonPath);
        } catch {
            // 创建基本的package.json
            const packageJson = {
                name: "visual-programming-project",
                version: "1.0.0",
                description: "",
                main: "index.js",
                scripts: {
                    test: "echo \"Error: no test specified\" && exit 1"
                },
                dependencies: {}
            };

            await vscode.workspace.fs.writeFile(
                packageJsonPath,
                Buffer.from(JSON.stringify(packageJson, null, 2))
            );

            vscode.window.showInformationMessage('已创建基础的 package.json 文件');
        }
    }

    // 修复TypeScript错误
    private async fixTypeScriptError(error: DiagnosticError): Promise<void> {
        if (!error.fileName) return;

        const document = await vscode.workspace.openTextDocument(error.fileName);
        const edit = new vscode.WorkspaceEdit();

        // 简单的类型断言修复
        const line = document.lineAt(error.line || 0);
        const newText = line.text.replace(
            /(\w+)\.(\w+)/,
            '($1 as any).$2'
        );

        edit.replace(
            document.uri,
            line.range,
            newText
        );

        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage('已应用类型断言修复');
    }

    // 标记错误为已解决
    resolveError(errorId: string): void {
        const error = this.errors.get(errorId);
        if (error) {
            error.resolved = true;
            this.updateDiagnostics();
        }
    }

    // 获取系统健康报告
    getSystemHealthReport(): SystemHealthReport {
        const activeErrors = Array.from(this.errors.values()).filter(e => !e.resolved);
        const errorCount = activeErrors.filter(e => e.severity === 'error').length;
        const warningCount = activeErrors.filter(e => e.severity === 'warning').length;
        const criticalIssues = activeErrors.filter(e => 
            e.severity === 'error' && 
            (e.type === 'system' || e.type === 'performance')
        );

        let overallHealth: SystemHealthReport['overallHealth'] = 'healthy';
        if (criticalIssues.length > 0) {
            overallHealth = 'critical';
        } else if (errorCount > 3 || warningCount > 10) {
            overallHealth = 'warning';
        }

        const recommendations: string[] = [];
        
        if (errorCount > 0) {
            recommendations.push(`修复 ${errorCount} 个错误`);
        }
        
        if (warningCount > 5) {
            recommendations.push(`处理 ${warningCount} 个警告`);
        }

        if (criticalIssues.some(e => e.type === 'performance')) {
            recommendations.push('优化性能问题');
        }

        if (criticalIssues.some(e => e.type === 'system')) {
            recommendations.push('检查系统配置');
        }

        return {
            overallHealth,
            errorCount,
            warningCount,
            criticalIssues,
            performanceIssues: activeErrors
                .filter(e => e.type === 'performance')
                .map(e => e.message),
            recommendations,
            lastCheck: Date.now()
        };
    }

    // 创建诊断面板
    async showDiagnosticsPanel(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'visualProgrammingDiagnostics',
            '代码可视化 - 诊断报告',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: []
            }
        );

        const healthReport = this.getSystemHealthReport();
        panel.webview.html = this.getDiagnosticsPanelHtml(healthReport);

        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'autoFixError':
                    const success = await this.autoFixError(message.errorId);
                    if (success) {
                        this.resolveError(message.errorId);
                        panel.webview.html = this.getDiagnosticsPanelHtml(this.getSystemHealthReport());
                        vscode.window.showInformationMessage('错误已自动修复！');
                    } else {
                        vscode.window.showWarningMessage('无法自动修复此错误');
                    }
                    break;
                case 'resolveError':
                    this.resolveError(message.errorId);
                    panel.webview.html = this.getDiagnosticsPanelHtml(this.getSystemHealthReport());
                    break;
                case 'clearAll':
                    this.errors.clear();
                    this.updateDiagnostics();
                    panel.webview.html = this.getDiagnosticsPanelHtml(this.getSystemHealthReport());
                    vscode.window.showInformationMessage('所有诊断信息已清除！');
                    break;
            }
        });
    }

    // 生成诊断面板HTML
    private getDiagnosticsPanelHtml(healthReport: SystemHealthReport): string {
        const activeErrors = Array.from(this.errors.values()).filter(e => !e.resolved);
        
        const healthColor = {
            healthy: '#28a745',
            warning: '#ffc107',
            critical: '#dc3545'
        };

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>诊断报告</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .health-status {
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    background: ${healthColor[healthReport.overallHealth]};
                    color: white;
                }
                .error-item {
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 10px 0;
                    background: #f9f9f9;
                }
                .error-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .severity-error { border-left: 4px solid #dc3545; }
                .severity-warning { border-left: 4px solid #ffc107; }
                .severity-info { border-left: 4px solid #17a2b8; }
                button {
                    padding: 5px 10px;
                    margin: 2px;
                    cursor: pointer;
                    border: none;
                    border-radius: 3px;
                }
                .btn-fix { background: #28a745; color: white; }
                .btn-resolve { background: #6c757d; color: white; }
                .btn-clear { background: #dc3545; color: white; }
                .stats { display: flex; gap: 20px; margin: 20px 0; }
                .stat { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>🏥 系统诊断报告</h1>
            
            <div class="health-status">
                <h2>系统健康状态: ${healthReport.overallHealth.toUpperCase()}</h2>
                <p>最后检查: ${new Date(healthReport.lastCheck).toLocaleString()}</p>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <h3>${healthReport.errorCount}</h3>
                    <p>错误</p>
                </div>
                <div class="stat">
                    <h3>${healthReport.warningCount}</h3>
                    <p>警告</p>
                </div>
                <div class="stat">
                    <h3>${activeErrors.length}</h3>
                    <p>总问题</p>
                </div>
            </div>
            
            <div>
                <button class="btn-clear" onclick="clearAll()">清除所有</button>
            </div>
            
            <h3>📋 活跃问题</h3>
            ${activeErrors.map(error => `
                <div class="error-item severity-${error.severity}">
                    <div class="error-header">
                        <strong>${error.type.toUpperCase()}: ${error.message}</strong>
                        <div>
                            <button class="btn-fix" onclick="autoFix('${error.id}')">自动修复</button>
                            <button class="btn-resolve" onclick="resolve('${error.id}')">标记已解决</button>
                        </div>
                    </div>
                    <p><strong>详情:</strong> ${error.details}</p>
                    ${error.fileName ? `<p><strong>文件:</strong> ${error.fileName}:${error.line || 0}</p>` : ''}
                    ${error.resolutionSteps ? `
                        <p><strong>建议解决方案:</strong></p>
                        <ul>${error.resolutionSteps.map(step => `<li>${step}</li>`).join('')}</ul>
                    ` : ''}
                    <p><small>时间: ${new Date(error.timestamp).toLocaleString()}</small></p>
                </div>
            `).join('')}
            
            ${healthReport.recommendations.length > 0 ? `
                <h3>💡 系统建议</h3>
                <ul>
                    ${healthReport.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            ` : ''}
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function autoFix(errorId) {
                    vscode.postMessage({ command: 'autoFixError', errorId });
                }
                
                function resolve(errorId) {
                    vscode.postMessage({ command: 'resolveError', errorId });
                }
                
                function clearAll() {
                    if (confirm('确定要清除所有诊断信息吗？')) {
                        vscode.postMessage({ command: 'clearAll' });
                    }
                }
            </script>
        </body>
        </html>
        `;
    }

    // 清理资源
    dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

// 全局诊断实例
export const errorDiagnostics = new IntelligentErrorDiagnostics();

// 错误处理装饰器
export function handleErrors(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        try {
            return await method.apply(this, args);
        } catch (error) {
            const errorId = errorDiagnostics.recordError(error as Error, {
                type: 'analysis',
                details: `方法 ${propertyName} 执行失败`,
                fileName: args[1] // 假设第二个参数是文件名
            });

            console.error(`Error in ${propertyName}:`, error);
            vscode.window.showErrorMessage(
                `分析过程中发生错误: ${error instanceof Error ? error.message : error}`,
                '查看详情'
            ).then(selection => {
                if (selection === '查看详情') {
                    errorDiagnostics.showDiagnosticsPanel();
                }
            });

            // 返回空结果或默认值，保持系统继续运行
            return null;
        }
    };
}
