// 实时协作和监控系统
import * as vscode from 'vscode';
import { CodeAnalysis } from './codeAnalyzer';

export interface FileWatcher {
    uri: vscode.Uri;
    language: string;
    lastModified: number;
    analysisCache: CodeAnalysis | null;
}

export interface CollaborationSession {
    id: string;
    participants: string[];
    sharedNodes: Map<string, any>;
    lastSync: number;
}

export class RealTimeCollaborationProvider {
    private watchers: Map<string, FileWatcher> = new Map();
    private session: CollaborationSession | null = null;
    private analysisCache: Map<string, CodeAnalysis> = new Map();
    
    // 🔥 实时文件监控
    public startWatching(workspaceFolder: vscode.WorkspaceFolder): void {
        const pattern = new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx,rs}');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        // 文件变更监听
        watcher.onDidChange(async (uri) => {
            await this.handleFileChange(uri);
        });
        
        // 文件创建监听
        watcher.onDidCreate(async (uri) => {
            await this.handleFileChange(uri);
        });
        
        // 文件删除监听
        watcher.onDidDelete((uri) => {
            this.handleFileDelete(uri);
        });
        
        vscode.window.showInformationMessage('🔄 实时监控已启动');
    }
    
    // 📊 智能增量分析
    private async handleFileChange(uri: vscode.Uri): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri);
        const currentContent = document.getText();
        const filePath = uri.fsPath;
        
        const watcher = this.watchers.get(filePath);
        if (watcher) {
            // 检查是否需要重新分析
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.mtime > watcher.lastModified) {
                await this.performIncrementalAnalysis(uri, currentContent);
                watcher.lastModified = stat.mtime;
            }
        } else {
            // 新文件，创建监听器
            await this.createWatcher(uri);
        }
        
        // 通知可视化面板更新
        this.notifyVisualizationUpdate(filePath);
    }
    
    // 🧠 智能差异分析
    private async performIncrementalAnalysis(uri: vscode.Uri, content: string): Promise<void> {
        const filePath = uri.fsPath;
        const cachedAnalysis = this.analysisCache.get(filePath);
        
        if (cachedAnalysis) {
            // 执行差异分析，只重新分析变更部分
            const changes = await this.detectChanges(cachedAnalysis, content);
            const updatedAnalysis = await this.updateAnalysis(cachedAnalysis, changes);
            this.analysisCache.set(filePath, updatedAnalysis);
        } else {
            // 全新分析
            const analysis = await this.performFullAnalysis(uri, content);
            this.analysisCache.set(filePath, analysis);
        }
    }
    
    // 🔍 变更检测算法
    private async detectChanges(cachedAnalysis: CodeAnalysis, newContent: string): Promise<ChangeSet> {
        const changes: ChangeSet = {
            addedFunctions: [],
            removedFunctions: [],
            modifiedFunctions: [],
            addedComponents: [],
            removedComponents: [],
            modifiedComponents: []
        };
        
        // 简化的变更检测逻辑
        const lines = newContent.split('\n');
        
        // 检测新增的函数
        lines.forEach((line, index) => {
            if (line.includes('function ') || line.includes('const ') && line.includes('=>')) {
                const funcName = this.extractFunctionName(line);
                if (funcName && !cachedAnalysis.functions.some(f => f.name === funcName)) {
                    changes.addedFunctions.push({
                        name: funcName,
                        line: index + 1,
                        type: 'function'
                    });
                }
            }
            
            // 检测新增的React组件
            if (line.includes('const ') && line.includes('React.FC')) {
                const componentName = this.extractComponentName(line);
                if (componentName && !cachedAnalysis.reactComponents?.some(c => c.name === componentName)) {
                    changes.addedComponents.push({
                        name: componentName,
                        line: index + 1,
                        type: 'functional'
                    });
                }
            }
        });
        
        return changes;
    }
    
    // 🔄 增量更新分析结果
    private async updateAnalysis(cachedAnalysis: CodeAnalysis, changes: ChangeSet): Promise<CodeAnalysis> {
        const updatedAnalysis = { ...cachedAnalysis };
        
        // 添加新函数
        changes.addedFunctions.forEach(func => {
            updatedAnalysis.functions.push({
                name: func.name,
                displayName: func.name,
                line: func.line,
                column: 1,
                description: `新增函数: ${func.name}`,
                parameters: [],
                returnType: 'unknown'
            });
        });
        
        // 添加新组件
        changes.addedComponents.forEach(comp => {
            if (!updatedAnalysis.reactComponents) {
                updatedAnalysis.reactComponents = [];
            }
            updatedAnalysis.reactComponents.push({
                name: comp.name,
                displayName: comp.name,
                type: comp.type as 'functional' | 'class',
                line: comp.line,
                column: 1,
                props: [],
                hooks: [],
                jsx: []
            });
        });
        
        return updatedAnalysis;
    }
    
    // 🌐 多文件联动分析
    public async analyzeProjectStructure(workspaceFolder: vscode.WorkspaceFolder): Promise<ProjectStructure> {
        const structure: ProjectStructure = {
            modules: [],
            dependencies: [],
            architecture: {
                frontend: { framework: 'react', components: [] },
                backend: { framework: 'rust', services: [] }
            }
        };
        
        // 扫描所有支持的文件
        const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx,rs}'),
            '**/node_modules/**'
        );
        
        // 并行分析文件
        const analyses = await Promise.all(
            files.map(uri => this.performFullAnalysis(uri))
        );
        
        // 构建项目结构
        analyses.forEach(analysis => {
            if (analysis.reactComponents?.length) {
                structure.architecture.frontend.components.push(...analysis.reactComponents);
            }
            
            if (analysis.rustStructs?.length) {
                structure.architecture.backend.services.push(
                    ...analysis.rustStructs.map(s => ({ name: s.name, type: 'struct' }))
                );
            }
        });
        
        return structure;
    }
    
    // 📡 实时通知系统
    private notifyVisualizationUpdate(filePath: string): void {
        // 发送消息到可视化面板
        vscode.commands.executeCommand('visualProgramming.updateVisualization', {
            filePath,
            timestamp: Date.now()
        });
    }
    
    // 🤝 协作会话管理
    public startCollaborationSession(sessionId: string): void {
        this.session = {
            id: sessionId,
            participants: [vscode.env.machineId],
            sharedNodes: new Map(),
            lastSync: Date.now()
        };
        
        vscode.window.showInformationMessage(`🤝 协作会话 ${sessionId} 已启动`);
    }
    
    public shareNode(nodeId: string, nodeData: any): void {
        if (this.session) {
            this.session.sharedNodes.set(nodeId, {
                ...nodeData,
                sharedBy: vscode.env.machineId,
                sharedAt: Date.now()
            });
        }
    }
    
    // 🧹 清理和优化
    private async createWatcher(uri: vscode.Uri): Promise<void> {
        const stat = await vscode.workspace.fs.stat(uri);
        const watcher: FileWatcher = {
            uri,
            language: this.detectLanguage(uri),
            lastModified: stat.mtime,
            analysisCache: null
        };
        
        this.watchers.set(uri.fsPath, watcher);
    }
    
    private detectLanguage(uri: vscode.Uri): string {
        const ext = uri.fsPath.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'ts':
            case 'tsx': return 'typescript';
            case 'js':
            case 'jsx': return 'javascript';
            case 'rs': return 'rust';
            default: return 'unknown';
        }
    }
    
    private handleFileDelete(uri: vscode.Uri): void {
        const filePath = uri.fsPath;
        this.watchers.delete(filePath);
        this.analysisCache.delete(filePath);
        this.notifyVisualizationUpdate(filePath);
    }
    
    private async performFullAnalysis(uri: vscode.Uri, content?: string): Promise<CodeAnalysis> {
        const document = content ? 
            { getText: () => content, languageId: this.detectLanguage(uri) } :
            await vscode.workspace.openTextDocument(uri);
            
        // 这里集成现有的分析器
        const { CodeAnalyzer } = require('./codeAnalyzer');
        const analyzer = new CodeAnalyzer();
        
        return await analyzer.analyzeFile(document as any);
    }
    
    // 辅助方法
    private extractFunctionName(line: string): string | null {
        const functionMatch = line.match(/function\s+(\w+)/);
        if (functionMatch) {return functionMatch[1];}
        
        const arrowMatch = line.match(/const\s+(\w+)\s*=/);
        if (arrowMatch) {return arrowMatch[1];}
        
        return null;
    }
    
    private extractComponentName(line: string): string | null {
        const match = line.match(/const\s+(\w+):\s*React\.FC/);
        return match ? match[1] : null;
    }
}

// 类型定义
interface ChangeSet {
    addedFunctions: Array<{ name: string; line: number; type: string }>;
    removedFunctions: Array<{ name: string; line: number; type: string }>;
    modifiedFunctions: Array<{ name: string; line: number; type: string }>;
    addedComponents: Array<{ name: string; line: number; type: string }>;
    removedComponents: Array<{ name: string; line: number; type: string }>;
    modifiedComponents: Array<{ name: string; line: number; type: string }>;
}

interface ProjectStructure {
    modules: Array<{ name: string; path: string; type: string }>;
    dependencies: Array<{ from: string; to: string; type: string }>;
    architecture: {
        frontend: { framework: string; components: any[] };
        backend: { framework: string; services: any[] };
    };
}
