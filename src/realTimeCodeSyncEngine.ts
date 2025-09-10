// 🎯 实时代码同步引擎 - 新功能
import * as vscode from 'vscode';
import { aiEnhancedAnalyzer } from './aiEnhancedAnalyzer';
import * as diff from 'diff';
import * as _ from 'lodash';

export interface CodeChangeEvent {
    document: vscode.TextDocument;
    changes: vscode.TextDocumentContentChangeEvent[];
    timestamp: number;
}

export interface SyncState {
    lastAnalysis: number;
    pendingChanges: CodeChangeEvent[];
    isAnalyzing: boolean;
}

export class RealTimeCodeSyncEngine {
    private syncStates: Map<string, SyncState> = new Map();
    private debounceTimer: Map<string, NodeJS.Timeout> = new Map();
    private changeListeners: vscode.Disposable[] = [];
    private readonly DEBOUNCE_DELAY = 1500; // 1.5秒延迟分析
    
    constructor(private outputChannel: vscode.OutputChannel) {
        this.initializeFileWatchers();
    }
    
    // 🚀 初始化文件监听器
    private initializeFileWatchers(): void {
        // 监听文档变更
        const documentChangeListener = vscode.workspace.onDidChangeTextDocument(
            this.onDocumentChanged.bind(this)
        );
        
        // 监听文档保存
        const documentSaveListener = vscode.workspace.onDidSaveTextDocument(
            this.onDocumentSaved.bind(this)
        );
        
        // 监听文档打开
        const documentOpenListener = vscode.workspace.onDidOpenTextDocument(
            this.onDocumentOpened.bind(this)
        );
        
        // 监听文档关闭
        const documentCloseListener = vscode.workspace.onDidCloseTextDocument(
            this.onDocumentClosed.bind(this)
        );
        
        this.changeListeners.push(
            documentChangeListener,
            documentSaveListener,
            documentOpenListener,
            documentCloseListener
        );
        
        this.outputChannel.appendLine('✅ 实时代码同步引擎已启动');
    }
    
    // 📝 文档变更处理
    private async onDocumentChanged(event: vscode.TextDocumentChangeEvent): Promise<void> {
        const document = event.document;
        const uri = document.uri.toString();
        
        // 只处理支持的语言
        if (!this.isSupportedLanguage(document.languageId)) {
            return;
        }
        
        // 获取或创建同步状态
        let syncState = this.syncStates.get(uri);
        if (!syncState) {
            syncState = {
                lastAnalysis: 0,
                pendingChanges: [],
                isAnalyzing: false
            };
            this.syncStates.set(uri, syncState);
        }
        
        // 记录变更事件
        const changeEvent: CodeChangeEvent = {
            document: document,
            changes: [...event.contentChanges],
            timestamp: Date.now()
        };
        
        syncState.pendingChanges.push(changeEvent);
        
        // 清除之前的定时器
        const existingTimer = this.debounceTimer.get(uri);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        
        // 设置新的防抖定时器
        const timer = setTimeout(() => {
            this.analyzeChanges(uri);
        }, this.DEBOUNCE_DELAY);
        
        this.debounceTimer.set(uri, timer);
        
        this.outputChannel.appendLine(`📝 检测到文档变更: ${document.fileName}`);
    }
    
    // 💾 文档保存处理
    private async onDocumentSaved(document: vscode.TextDocument): Promise<void> {
        const uri = document.uri.toString();
        
        if (!this.isSupportedLanguage(document.languageId)) {
            return;
        }
        
        // 保存时立即分析
        await this.analyzeChanges(uri, true);
        this.outputChannel.appendLine(`💾 文档已保存并分析: ${document.fileName}`);
    }
    
    // 📂 文档打开处理
    private async onDocumentOpened(document: vscode.TextDocument): Promise<void> {
        if (!this.isSupportedLanguage(document.languageId)) {
            return;
        }
        
        // 初始化同步状态
        const uri = document.uri.toString();
        const syncState: SyncState = {
            lastAnalysis: 0,
            pendingChanges: [],
            isAnalyzing: false
        };
        
        this.syncStates.set(uri, syncState);
        
        // 首次打开时进行分析
        await this.analyzeChanges(uri, true);
        this.outputChannel.appendLine(`📂 文档已打开并分析: ${document.fileName}`);
    }
    
    // 🚪 文档关闭处理
    private onDocumentClosed(document: vscode.TextDocument): void {
        const uri = document.uri.toString();
        
        // 清理状态
        this.syncStates.delete(uri);
        
        // 清理定时器
        const timer = this.debounceTimer.get(uri);
        if (timer) {
            clearTimeout(timer);
            this.debounceTimer.delete(uri);
        }
        
        this.outputChannel.appendLine(`🚪 文档已关闭: ${document.fileName}`);
    }
    
    // 🔍 分析变更
    private async analyzeChanges(uri: string, immediate: boolean = false): Promise<void> {
        const syncState = this.syncStates.get(uri);
        if (!syncState || syncState.isAnalyzing) {
            return;
        }
        
        // 获取文档
        const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri);
        if (!document) {
            return;
        }
        
        syncState.isAnalyzing = true;
        
        try {
            const startTime = Date.now();
            
            // 执行AI增强分析
            const analysisResult = await aiEnhancedAnalyzer.analyzeCodeIntelligence(document);
            
            const analysisTime = Date.now() - startTime;
            
            // 更新同步状态
            syncState.lastAnalysis = Date.now();
            syncState.pendingChanges = [];
            
            // 发送分析结果到UI
            await this.notifyAnalysisComplete(document, analysisResult, analysisTime);
            
            // 检查是否需要显示重要警告
            if (analysisResult.codeSmells.some(smell => smell.severity === 'high')) {
                vscode.window.showWarningMessage(
                    `⚠️ 发现严重代码问题 - ${document.fileName}`,
                    '查看详情'
                ).then(selection => {
                    if (selection === '查看详情') {
                        vscode.commands.executeCommand('visualProgramming.aiEnhancedAnalysis');
                    }
                });
            }
            
            this.outputChannel.appendLine(
                `🔍 分析完成: ${document.fileName} (${analysisTime}ms) - 复杂度: ${analysisResult.complexity}/10`
            );
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ 分析失败: ${document.fileName} - ${error}`);
        } finally {
            syncState.isAnalyzing = false;
        }
    }
    
    // 📢 通知分析完成
    private async notifyAnalysisComplete(
        document: vscode.TextDocument, 
        result: any, 
        analysisTime: number
    ): Promise<void> {
        // 发送到状态栏
        vscode.window.setStatusBarMessage(
            `✅ ${document.fileName} 分析完成 (${analysisTime}ms)`, 
            3000
        );
        
        // 发送到可视化面板
        vscode.commands.executeCommand('visualProgramming.updateAnalysisResult', {
            document: document.uri.toString(),
            result: result,
            timestamp: Date.now()
        });
        
        // 更新树视图
        vscode.commands.executeCommand('visualProgramming.refreshStructure');
    }
    
    // 🛠️ 工具方法：检查支持的语言
    private isSupportedLanguage(languageId: string): boolean {
        return [
            'typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'rust'
        ].includes(languageId);
    }
    
    // 📊 获取同步状态统计
    public getSyncStatistics(): { [key: string]: any } {
        const stats = {
            trackedFiles: this.syncStates.size,
            analyzingFiles: 0,
            totalAnalyses: 0,
            averageAnalysisTime: 0
        };
        
        for (const [uri, state] of this.syncStates) {
            if (state.isAnalyzing) {
                stats.analyzingFiles++;
            }
            if (state.lastAnalysis > 0) {
                stats.totalAnalyses++;
            }
        }
        
        return stats;
    }
    
    // 🔄 手动刷新分析
    public async refreshAnalysis(document?: vscode.TextDocument): Promise<void> {
        if (document) {
            // 刷新单个文档
            const uri = document.uri.toString();
            await this.analyzeChanges(uri, true);
        } else {
            // 刷新所有打开的文档
            const promises: Promise<void>[] = [];
            for (const [uri] of this.syncStates) {
                promises.push(this.analyzeChanges(uri, true));
            }
            await Promise.all(promises);
        }
        
        this.outputChannel.appendLine('🔄 手动刷新分析完成');
    }
    
    // 🧹 清理资源
    public dispose(): void {
        // 清理所有定时器
        for (const [uri, timer] of this.debounceTimer) {
            clearTimeout(timer);
        }
        this.debounceTimer.clear();
        
        // 清理监听器
        this.changeListeners.forEach(listener => listener.dispose());
        this.changeListeners = [];
        
        // 清理状态
        this.syncStates.clear();
        
        this.outputChannel.appendLine('🧹 实时代码同步引擎已关闭');
    }
}

// 导出单例
export const realTimeCodeSyncEngine = new RealTimeCodeSyncEngine(
    vscode.window.createOutputChannel('实时代码同步')
);
