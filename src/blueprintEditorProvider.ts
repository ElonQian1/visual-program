import * as vscode from 'vscode';
import { BlueprintEditor, VisualNode, NodeConnection, BlueprintGraph, Position } from './blueprintEditor';

/**
 * 蓝图编辑器WebView面板提供器
 */
export class BlueprintEditorProvider {
    private static readonly viewType = 'blueprintEditor';
    private editor: BlueprintEditor;
    private panel: vscode.WebviewPanel | undefined;
    
    constructor(private context: vscode.ExtensionContext) {
        this.editor = new BlueprintEditor(context);
    }

    /**
     * 创建或显示蓝图编辑器
     */
    public createOrShow(): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (this.panel) {
            this.panel.reveal(column);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            BlueprintEditorProvider.viewType,
            '蓝图编辑器',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                    vscode.Uri.joinPath(this.context.extensionUri, 'out')
                ],
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        this.setupWebviewMessageHandling();

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.context.subscriptions);
    }

    /**
     * 设置WebView消息处理
     */
    private setupWebviewMessageHandling(): void {
        if (!this.panel) {return;}

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                try {
                    await this.handleWebviewMessage(message);
                } catch (error) {
                    vscode.window.showErrorMessage(`蓝图编辑器错误: ${error}`);
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * 处理来自WebView的消息
     */
    private async handleWebviewMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'createNewGraph':
                await this.handleCreateNewGraph(message.data);
                break;
            
            case 'addNode':
                await this.handleAddNode(message.data);
                break;
            
            case 'createConnection':
                await this.handleCreateConnection(message.data);
                break;
            
            case 'validateGraph':
                await this.handleValidateGraph();
                break;
            
            case 'generateCode':
                await this.handleGenerateCode(message.data);
                break;
            
            case 'saveGraph':
                await this.handleSaveGraph(message.data);
                break;
            
            case 'loadGraph':
                await this.handleLoadGraph(message.data);
                break;
            
            case 'getNodeTemplates':
                await this.handleGetNodeTemplates(message.data);
                break;
            
            case 'updateNodeProperties':
                await this.handleUpdateNodeProperties(message.data);
                break;
            
            case 'deleteNode':
                await this.handleDeleteNode(message.data);
                break;
            
            case 'deleteConnection':
                await this.handleDeleteConnection(message.data);
                break;
        }
    }

    /**
     * 处理创建新图表
     */
    private async handleCreateNewGraph(data: { name: string; framework: 'react' | 'rust' | 'mixed' }): Promise<void> {
        const graph = this.editor.createNewGraph(data.name, data.framework);
        
        this.sendMessageToWebview({
            command: 'graphCreated',
            data: graph
        });
    }

    /**
     * 处理添加节点
     */
    private async handleAddNode(data: { templateId: string; position: Position }): Promise<void> {
        const node = this.editor.addNode(data.templateId, data.position);
        
        this.sendMessageToWebview({
            command: 'nodeAdded',
            data: node
        });
    }

    /**
     * 处理创建连接
     */
    private async handleCreateConnection(data: {
        sourceNodeId: string;
        sourcePortId: string;
        targetNodeId: string;
        targetPortId: string;
    }): Promise<void> {
        try {
            const connection = this.editor.createConnection(
                data.sourceNodeId,
                data.sourcePortId,
                data.targetNodeId,
                data.targetPortId
            );
            
            this.sendMessageToWebview({
                command: 'connectionCreated',
                data: connection
            });
        } catch (error) {
            this.sendMessageToWebview({
                command: 'connectionError',
                data: { error: (error as Error).message }
            });
        }
    }

    /**
     * 处理验证图表
     */
    private async handleValidateGraph(): Promise<void> {
        const validationResult = this.editor.validateGraph();
        
        this.sendMessageToWebview({
            command: 'validationResult',
            data: validationResult
        });
    }

    /**
     * 处理代码生成
     */
    private async handleGenerateCode(data: { language: 'react' | 'rust' }): Promise<void> {
        const graph = this.editor.getCurrentGraph();
        if (!graph) {
            throw new Error('No active graph');
        }

        // TODO: 实现代码生成逻辑
        const generatedCode = this.generateCodeFromGraph(graph, data.language);
        
        this.sendMessageToWebview({
            command: 'codeGenerated',
            data: { code: generatedCode, language: data.language }
        });
    }

    /**
     * 处理保存图表
     */
    private async handleSaveGraph(data: { filePath?: string }): Promise<void> {
        const graph = this.editor.getCurrentGraph();
        if (!graph) {
            throw new Error('No active graph to save');
        }

        let savePath = data.filePath;
        if (!savePath) {
            const result = await vscode.window.showSaveDialog({
                defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
                filters: {
                    'Blueprint Files': ['blueprint.json']
                }
            });
            
            if (!result) {return;}
            savePath = result.fsPath;
        }

        const graphJson = JSON.stringify(graph, null, 2);
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(savePath),
            Buffer.from(graphJson, 'utf8')
        );

        vscode.window.showInformationMessage(`蓝图已保存到: ${savePath}`);
    }

    /**
     * 处理加载图表
     */
    private async handleLoadGraph(data: { filePath?: string }): Promise<void> {
        let loadPath = data.filePath;
        if (!loadPath) {
            const result = await vscode.window.showOpenDialog({
                defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
                filters: {
                    'Blueprint Files': ['blueprint.json']
                },
                canSelectMany: false
            });
            
            if (!result || result.length === 0) {return;}
            loadPath = result[0].fsPath;
        }

        const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(loadPath));
        const graph: BlueprintGraph = JSON.parse(fileContent.toString());
        
        this.editor.setCurrentGraph(graph);
        
        this.sendMessageToWebview({
            command: 'graphLoaded',
            data: graph
        });
    }

    /**
     * 处理获取节点模板
     */
    private async handleGetNodeTemplates(data: { framework?: 'react' | 'rust' | 'common' }): Promise<void> {
        const templates = this.editor.getNodeTemplates(data.framework);
        
        this.sendMessageToWebview({
            command: 'nodeTemplates',
            data: templates
        });
    }

    /**
     * 处理更新节点属性
     */
    private async handleUpdateNodeProperties(data: { nodeId: string; properties: Record<string, any> }): Promise<void> {
        const graph = this.editor.getCurrentGraph();
        if (!graph) {return;}

        const node = graph.nodes.find(n => n.id === data.nodeId);
        if (node) {
            node.properties = { ...node.properties, ...data.properties };
            graph.metadata.updatedAt = new Date();
        }
    }

    /**
     * 处理删除节点
     */
    private async handleDeleteNode(data: { nodeId: string }): Promise<void> {
        const graph = this.editor.getCurrentGraph();
        if (!graph) {return;}

        // 删除节点
        graph.nodes = graph.nodes.filter(n => n.id !== data.nodeId);
        
        // 删除相关连接
        graph.connections = graph.connections.filter(c => 
            c.sourceNodeId !== data.nodeId && c.targetNodeId !== data.nodeId
        );
        
        graph.metadata.updatedAt = new Date();
        
        this.sendMessageToWebview({
            command: 'nodeDeleted',
            data: { nodeId: data.nodeId }
        });
    }

    /**
     * 处理删除连接
     */
    private async handleDeleteConnection(data: { connectionId: string }): Promise<void> {
        const graph = this.editor.getCurrentGraph();
        if (!graph) {return;}

        graph.connections = graph.connections.filter(c => c.id !== data.connectionId);
        graph.metadata.updatedAt = new Date();
        
        this.sendMessageToWebview({
            command: 'connectionDeleted',
            data: { connectionId: data.connectionId }
        });
    }

    /**
     * 向WebView发送消息
     */
    private sendMessageToWebview(message: any): void {
        if (this.panel) {
            this.panel.webview.postMessage(message);
        }
    }

    /**
     * 从图表生成代码
     */
    private generateCodeFromGraph(graph: BlueprintGraph, language: 'react' | 'rust'): string {
        if (language === 'react') {
            return this.generateReactCode(graph);
        } else {
            return this.generateRustCode(graph);
        }
    }

    /**
     * 生成React代码
     */
    private generateReactCode(graph: BlueprintGraph): string {
        const components = graph.nodes.filter(n => n.type === 'component');
        let code = "import React from 'react';\n\n";

        for (const component of components) {
            const componentName = component.properties.componentName || 'UnnamedComponent';
            code += `const ${componentName} = (props) => {\n`;
            code += `  // TODO: 实现组件逻辑\n`;
            code += `  return (\n`;
            code += `    <div>\n`;
            code += `      {/* 组件内容 */}\n`;
            code += `    </div>\n`;
            code += `  );\n`;
            code += `};\n\n`;
        }

        if (components.length > 0) {
            const mainComponent = components[0];
            const componentName = mainComponent.properties.componentName || 'UnnamedComponent';
            code += `export default ${componentName};\n`;
        }

        return code;
    }

    /**
     * 生成Rust代码
     */
    private generateRustCode(graph: BlueprintGraph): string {
        const functions = graph.nodes.filter(n => n.type === 'function');
        let code = "";

        for (const func of functions) {
            const functionName = func.properties.functionName || 'unnamed_function';
            const visibility = func.properties.visibility || '';
            const isAsync = func.properties.isAsync ? 'async ' : '';
            const returnType = func.properties.returnType || '()';
            
            code += `${visibility} ${isAsync}fn ${functionName}() -> ${returnType} {\n`;
            code += `    // TODO: 实现函数逻辑\n`;
            code += `    todo!()\n`;
            code += `}\n\n`;
        }

        if (functions.length === 0) {
            code = "// 没有函数节点\n";
        }

        return code;
    }

    /**
     * 获取WebView HTML内容
     */
    private getWebviewContent(): string {
        const scriptUri = this.panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'blueprint-editor.js')
        );
        const styleUri = this.panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'media', 'blueprint-editor.css')
        );

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>蓝图编辑器</title>
</head>
<body>
    <div id="app">
        <!-- 工具栏 -->
        <div class="toolbar">
            <div class="toolbar-group">
                <button id="new-graph-btn" class="toolbar-btn">
                    <span class="icon">📄</span>
                    新建蓝图
                </button>
                <button id="save-graph-btn" class="toolbar-btn">
                    <span class="icon">💾</span>
                    保存
                </button>
                <button id="load-graph-btn" class="toolbar-btn">
                    <span class="icon">📁</span>
                    加载
                </button>
            </div>
            <div class="toolbar-group">
                <button id="validate-btn" class="toolbar-btn">
                    <span class="icon">✓</span>
                    验证
                </button>
                <button id="generate-react-btn" class="toolbar-btn">
                    <span class="icon">⚛️</span>
                    生成React
                </button>
                <button id="generate-rust-btn" class="toolbar-btn">
                    <span class="icon">🦀</span>
                    生成Rust
                </button>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="main-content">
            <!-- 节点面板 -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <h3>节点库</h3>
                    <select id="framework-filter">
                        <option value="">所有框架</option>
                        <option value="react">React</option>
                        <option value="rust">Rust</option>
                        <option value="common">通用</option>
                    </select>
                </div>
                <div class="node-palette" id="node-palette">
                    <!-- 节点模板将在这里动态加载 -->
                </div>
            </div>

            <!-- 画布区域 -->
            <div class="canvas-container">
                <div class="canvas-header">
                    <div class="graph-info">
                        <span id="graph-name">未命名蓝图</span>
                        <span id="graph-status" class="status-indicator">●</span>
                    </div>
                    <div class="canvas-controls">
                        <button id="zoom-in-btn">🔍+</button>
                        <button id="zoom-out-btn">🔍-</button>
                        <button id="fit-to-screen-btn">📐</button>
                    </div>
                </div>
                <div class="canvas-wrapper">
                    <svg id="blueprint-canvas" class="blueprint-canvas">
                        <!-- 网格背景 -->
                        <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#333" stroke-width="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        
                        <!-- 连接线层 -->
                        <g id="connections-layer"></g>
                        
                        <!-- 节点层 -->
                        <g id="nodes-layer"></g>
                        
                        <!-- 临时连接线 -->
                        <g id="temp-connection-layer"></g>
                    </svg>
                </div>
            </div>

            <!-- 属性面板 -->
            <div class="properties-panel" id="properties-panel">
                <div class="properties-header">
                    <h3>属性</h3>
                </div>
                <div class="properties-content" id="properties-content">
                    <p class="no-selection">请选择一个节点或连接</p>
                </div>
            </div>
        </div>

        <!-- 底部状态栏 -->
        <div class="status-bar">
            <div class="status-left">
                <span id="node-count">节点: 0</span>
                <span id="connection-count">连接: 0</span>
            </div>
            <div class="status-right">
                <span id="validation-status">就绪</span>
                <span id="zoom-level">100%</span>
            </div>
        </div>
    </div>

    <!-- 对话框 -->
    <div id="dialog-overlay" class="dialog-overlay" style="display: none;">
        <div class="dialog">
            <div class="dialog-header">
                <h3 id="dialog-title">对话框</h3>
                <button id="dialog-close" class="dialog-close">×</button>
            </div>
            <div class="dialog-content" id="dialog-content">
                <!-- 对话框内容 -->
            </div>
            <div class="dialog-footer">
                <button id="dialog-cancel" class="btn btn-cancel">取消</button>
                <button id="dialog-confirm" class="btn btn-confirm">确定</button>
            </div>
        </div>
    </div>

    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    /**
     * 销毁面板
     */
    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}
