// 🎨 蓝图式可视化编辑器 - 完整实现
import * as vscode from 'vscode';
import { KidFriendlyCardData } from './kidFriendlyCards/types';
import { SeniorStudentCardData } from './seniorStudentCards/types';
import { CardSystemManager } from './cardSystem/CardSystemManagerNew';

export interface BlueprintNode {
    id: string;
    type: 'react-component' | 'rust-struct' | 'rust-function' | 'connection' | 'logic-gate';
    position: { x: number; y: number };
    size: { width: number; height: number };
    data: any;
    inputs: ConnectionPoint[];
    outputs: ConnectionPoint[];
}

export interface ConnectionPoint {
    id: string;
    label: string;
    type: 'data' | 'execution' | 'event';
    dataType?: string;
    connected: boolean;
}

export interface BlueprintConnection {
    id: string;
    from: { nodeId: string; pointId: string };
    to: { nodeId: string; pointId: string };
    type: 'data' | 'execution' | 'event';
}

export interface BlueprintGraph {
    nodes: BlueprintNode[];
    connections: BlueprintConnection[];
    metadata: {
        name: string;
        description: string;
        language: 'typescript' | 'rust';
        createdAt: number;
        updatedAt: number;
    };
}

export class BlueprintVisualEditor {
    private panel: vscode.WebviewPanel | undefined;
    private currentGraph: BlueprintGraph | undefined;
    private readonly viewType = 'blueprintEditor';
    private cardSystemManager: CardSystemManager | undefined;
    
    constructor(private context: vscode.ExtensionContext) {}
    
    // 🚀 创建或显示蓝图编辑器
    public createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        
        if (this.panel) {
            this.panel.reveal(column);
            return;
        }
        
        this.panel = vscode.window.createWebviewPanel(
            this.viewType,
            '🎨 蓝图可视化编辑器',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out', 'compiled')
                ]
            }
        );
        
        this.panel.webview.html = this.getWebviewContent(this.panel.webview, extensionUri);
        this.panel.onDidDispose(() => this.dispose(), null, this.context.subscriptions);
        
        // 设置消息处理
        this.setupMessageHandling();
        
        // 初始化空图表
        this.initializeEmptyGraph();
    }
    
    // 📝 设置消息处理
    private setupMessageHandling(): void {
        if (!this.panel) {return;}
        
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'nodeAdded':
                        await this.handleNodeAdded(message.node);
                        break;
                    case 'nodeUpdated':
                        await this.handleNodeUpdated(message.node);
                        break;
                    case 'nodeDeleted':
                        await this.handleNodeDeleted(message.nodeId);
                        break;
                    case 'connectionCreated':
                        await this.handleConnectionCreated(message.connection);
                        break;
                    case 'connectionDeleted':
                        await this.handleConnectionDeleted(message.connectionId);
                        break;
                    case 'generateCode':
                        await this.handleGenerateCode();
                        break;
                    case 'saveGraph':
                        await this.handleSaveGraph(message.graph);
                        break;
                    case 'loadGraph':
                        await this.handleLoadGraph();
                        break;
                    case 'exportImage':
                        await this.handleExportImage(message.imageData);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }
    
    // 🏗️ 初始化空图表
    private initializeEmptyGraph(): void {
        this.currentGraph = {
            nodes: [],
            connections: [],
            metadata: {
                name: '新建蓝图',
                description: '通过拖拽创建代码架构',
                language: 'typescript',
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        };
        
        this.sendMessageToWebview({
            command: 'initializeGraph',
            graph: this.currentGraph
        });
    }
    
    // 🔧 处理节点添加
    private async handleNodeAdded(node: BlueprintNode): Promise<void> {
        if (!this.currentGraph) {return;}
        
        this.currentGraph.nodes.push(node);
        this.currentGraph.metadata.updatedAt = Date.now();
        
        vscode.window.showInformationMessage(`✅ 添加了${node.type}节点`);
    }
    
    // ✏️ 处理节点更新
    private async handleNodeUpdated(updatedNode: BlueprintNode): Promise<void> {
        if (!this.currentGraph) {return;}
        
        const index = this.currentGraph.nodes.findIndex(n => n.id === updatedNode.id);
        if (index >= 0) {
            this.currentGraph.nodes[index] = updatedNode;
            this.currentGraph.metadata.updatedAt = Date.now();
        }
    }
    
    // 🗑️ 处理节点删除
    private async handleNodeDeleted(nodeId: string): Promise<void> {
        if (!this.currentGraph) {return;}
        
        // 删除节点
        this.currentGraph.nodes = this.currentGraph.nodes.filter(n => n.id !== nodeId);
        
        // 删除相关连接
        this.currentGraph.connections = this.currentGraph.connections.filter(
            c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId
        );
        
        this.currentGraph.metadata.updatedAt = Date.now();
        
        vscode.window.showInformationMessage('🗑️ 节点已删除');
    }
    
    // 🔗 处理连接创建
    private async handleConnectionCreated(connection: BlueprintConnection): Promise<void> {
        if (!this.currentGraph) {return;}
        
        // 验证连接有效性
        if (this.validateConnection(connection)) {
            this.currentGraph.connections.push(connection);
            this.currentGraph.metadata.updatedAt = Date.now();
            
            vscode.window.showInformationMessage('🔗 连接已创建');
        } else {
            vscode.window.showErrorMessage('❌ 无效的连接类型');
        }
    }
    
    // 🚫 处理连接删除
    private async handleConnectionDeleted(connectionId: string): Promise<void> {
        if (!this.currentGraph) {return;}
        
        this.currentGraph.connections = this.currentGraph.connections.filter(
            c => c.id !== connectionId
        );
        
        this.currentGraph.metadata.updatedAt = Date.now();
    }
    
    // 🎯 验证连接
    private validateConnection(connection: BlueprintConnection): boolean {
        if (!this.currentGraph) {return false;}
        
        const fromNode = this.currentGraph.nodes.find(n => n.id === connection.from.nodeId);
        const toNode = this.currentGraph.nodes.find(n => n.id === connection.to.nodeId);
        
        if (!fromNode || !toNode) {return false;}
        
        const fromPoint = fromNode.outputs.find(p => p.id === connection.from.pointId);
        const toPoint = toNode.inputs.find(p => p.id === connection.to.pointId);
        
        if (!fromPoint || !toPoint) {return false;}
        
        // 检查类型兼容性
        return this.areTypesCompatible(fromPoint, toPoint);
    }
    
    // ✅ 检查类型兼容性
    private areTypesCompatible(from: ConnectionPoint, to: ConnectionPoint): boolean {
        // 执行流总是兼容
        if (from.type === 'execution' && to.type === 'execution') {return true;}
        
        // 事件类型检查
        if (from.type === 'event' && to.type === 'event') {return true;}
        
        // 数据类型检查
        if (from.type === 'data' && to.type === 'data') {
            if (!from.dataType || !to.dataType) {return true;} // 任意类型
            return from.dataType === to.dataType;
        }
        
        return false;
    }
    
    // 🔧 处理代码生成
    private async handleGenerateCode(): Promise<void> {
        if (!this.currentGraph) {return;}
        
        try {
            const generatedCode = await this.generateCodeFromGraph(this.currentGraph);
            
            // 创建新文档显示生成的代码
            const document = await vscode.workspace.openTextDocument({
                content: generatedCode,
                language: this.currentGraph.metadata.language
            });
            
            await vscode.window.showTextDocument(document);
            
            vscode.window.showInformationMessage('🎉 代码生成成功！');
            
        } catch (error) {
            vscode.window.showErrorMessage(`代码生成失败: ${error}`);
        }
    }
    
    // 🏭 从图表生成代码
    private async generateCodeFromGraph(graph: BlueprintGraph): Promise<string> {
        if (graph.metadata.language === 'typescript') {
            return this.generateTypeScriptCode(graph);
        } else if (graph.metadata.language === 'rust') {
            return this.generateRustCode(graph);
        }
        
        throw new Error('不支持的语言类型');
    }
    
    // ⚛️ 生成TypeScript代码
    private generateTypeScriptCode(graph: BlueprintGraph): string {
        const components: string[] = [];
        const imports: Set<string> = new Set(['import React from "react";']);
        
        // 生成组件
        graph.nodes.forEach(node => {
            if (node.type === 'react-component') {
                const componentCode = this.generateReactComponent(node);
                components.push(componentCode);
                
                // 添加必要的导入
                if (node.data.hooks?.includes('useState')) {
                    imports.add('import { useState } from "react";');
                }
                if (node.data.hooks?.includes('useEffect')) {
                    imports.add('import { useEffect } from "react";');
                }
            }
        });
        
        // 构建完整代码
        const importsCode = Array.from(imports).join('\n');
        const componentsCode = components.join('\n\n');
        
        return `${importsCode}\n\n${componentsCode}`;
    }
    
    // 🦀 生成Rust代码
    private generateRustCode(graph: BlueprintGraph): string {
        const structs: string[] = [];
        const functions: string[] = [];
        const imports: Set<string> = new Set();
        
        // 生成结构体和函数
        graph.nodes.forEach(node => {
            if (node.type === 'rust-struct') {
                const structCode = this.generateRustStruct(node);
                structs.push(structCode);
            } else if (node.type === 'rust-function') {
                const functionCode = this.generateRustFunction(node);
                functions.push(functionCode);
            }
        });
        
        // 构建完整代码
        const importsCode = Array.from(imports).join('\n');
        const structsCode = structs.join('\n\n');
        const functionsCode = functions.join('\n\n');
        
        return `${importsCode}\n\n${structsCode}\n\n${functionsCode}`;
    }
    
    // ⚛️ 生成React组件
    private generateReactComponent(node: BlueprintNode): string {
        const name = node.data.name || 'GeneratedComponent';
        const props = node.data.props || [];
        const hooks = node.data.hooks || [];
        
        const propsInterface = props.length > 0 ? 
            `interface ${name}Props {\n${props.map((p: any) => `  ${p.name}: ${p.type};`).join('\n')}\n}\n\n` : '';
        
        const hooksCode = hooks.map((hook: string) => {
            switch (hook) {
                case 'useState':
                    return '  const [state, setState] = useState();';
                case 'useEffect':
                    return '  useEffect(() => {\n    // Effect logic\n  }, []);';
                default:
                    return `  // ${hook}`;
            }
        }).join('\n');
        
        return `${propsInterface}export const ${name}: React.FC${props.length > 0 ? `<${name}Props>` : ''} = (${props.length > 0 ? 'props' : ''}) => {
${hooksCode}
  
  return (
    <div>
      <h2>${name}</h2>
      {/* Component content */}
    </div>
  );
};`;
    }
    
    // 🦀 生成Rust结构体
    private generateRustStruct(node: BlueprintNode): string {
        const name = node.data.name || 'GeneratedStruct';
        const fields = node.data.fields || [];
        
        const fieldsCode = fields.map((field: any) => 
            `    pub ${field.name}: ${field.type},`
        ).join('\n');
        
        return `#[derive(Debug, Clone)]
pub struct ${name} {
${fieldsCode}
}

impl ${name} {
    pub fn new() -> Self {
        Self {
            ${fields.map((f: any) => `${f.name}: Default::default()`).join(',\n            ')}
        }
    }
}`;
    }
    
    // 🔧 生成Rust函数
    private generateRustFunction(node: BlueprintNode): string {
        const name = node.data.name || 'generated_function';
        const params = node.data.params || [];
        const returnType = node.data.returnType || '()';
        
        const paramsCode = params.map((param: any) => 
            `${param.name}: ${param.type}`
        ).join(', ');
        
        return `pub fn ${name}(${paramsCode}) -> ${returnType} {
    // Function implementation
    todo!("Implement ${name}")
}`;
    }
    
    // 💾 处理保存图表
    private async handleSaveGraph(graph: BlueprintGraph): Promise<void> {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`${graph.metadata.name}.blueprint.json`),
                filters: {
                    'Blueprint Files': ['blueprint.json'],
                    'JSON Files': ['json']
                }
            });
            
            if (uri) {
                const content = JSON.stringify(graph, null, 2);
                await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
                
                this.currentGraph = graph;
                vscode.window.showInformationMessage('💾 蓝图已保存！');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`保存失败: ${error}`);
        }
    }
    
    // 📂 处理加载图表
    private async handleLoadGraph(): Promise<void> {
        try {
            const uri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Blueprint Files': ['blueprint.json'],
                    'JSON Files': ['json']
                }
            });
            
            if (uri && uri[0]) {
                const content = await vscode.workspace.fs.readFile(uri[0]);
                const graph: BlueprintGraph = JSON.parse(content.toString());
                
                this.currentGraph = graph;
                
                this.sendMessageToWebview({
                    command: 'loadGraph',
                    graph: graph
                });
                
                vscode.window.showInformationMessage('📂 蓝图已加载！');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`加载失败: ${error}`);
        }
    }
    
    // 🖼️ 处理导出图片
    private async handleExportImage(imageData: string): Promise<void> {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`${this.currentGraph?.metadata.name || 'blueprint'}.png`),
                filters: {
                    'PNG Images': ['png'],
                    'JPEG Images': ['jpg', 'jpeg']
                }
            });
            
            if (uri) {
                // 移除data:image/png;base64,前缀
                const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                
                await vscode.workspace.fs.writeFile(uri, buffer);
                
                vscode.window.showInformationMessage('🖼️ 图片已导出！');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`导出失败: ${error}`);
        }
    }
    
    // 📤 发送消息到Webview
    private sendMessageToWebview(message: any): void {
        if (this.panel) {
            this.panel.webview.postMessage(message);
        }
    }

    async showKidFriendlyCard(card: KidFriendlyCardData): Promise<void> {
        if (!this.panel) {
            vscode.window.showWarningMessage('请先打开蓝图编辑器');
            return;
        }

        // 初始化卡片系统管理器（如果尚未初始化）
        if (!this.cardSystemManager) {
            this.cardSystemManager = new CardSystemManager(this.panel);
        }

        // 使用新的可移动卡片系统
        this.cardSystemManager.showKidFriendlyCard(card);
    }

    async showSeniorStudentCard(card: SeniorStudentCardData): Promise<void> {
        if (!this.panel) {
            vscode.window.showWarningMessage('请先打开蓝图编辑器');
            return;
        }

        // 初始化卡片系统管理器（如果尚未初始化）
        if (!this.cardSystemManager) {
            this.cardSystemManager = new CardSystemManager(this.panel);
        }

        // 使用新的可移动卡片系统
        this.cardSystemManager.showSeniorStudentCard(card);
    }
    
    // 🎨 获取Webview内容
    private getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>蓝图可视化编辑器</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            overflow: hidden;
        }
        
        .editor-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            background-image: 
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        .toolbar {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 1000;
            background: rgba(0,0,0,0.8);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            gap: 10px;
        }
        
        .toolbar button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .toolbar button:hover {
            background: #45a049;
        }
        
        .node-palette {
            position: absolute;
            right: 10px;
            top: 10px;
            width: 200px;
            background: rgba(0,0,0,0.8);
            border-radius: 8px;
            padding: 15px;
            z-index: 1000;
        }
        
        .palette-title {
            color: white;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .node-template {
            background: #2196F3;
            color: white;
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 4px;
            cursor: grab;
            text-align: center;
            font-size: 12px;
        }
        
        .node-template:hover {
            background: #1976D2;
        }
        
        .canvas {
            width: 100%;
            height: 100%;
            position: relative;
            cursor: default;
        }
        
        .blueprint-node {
            position: absolute;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 2px solid #fff;
            border-radius: 8px;
            padding: 10px;
            min-width: 120px;
            min-height: 60px;
            cursor: move;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            color: white;
            font-size: 12px;
        }
        
        .node-title {
            font-weight: bold;
            text-align: center;
            margin-bottom: 5px;
        }
        
        .node-ports {
            display: flex;
            justify-content: space-between;
        }
        
        .port {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid #333;
            cursor: pointer;
        }
        
        .connection-line {
            position: absolute;
            pointer-events: none;
            z-index: 100;
        }
        
        .status-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px 15px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
        }

        .kid-card-panel {
            position: absolute;
            right: 10px;
            bottom: 80px;
            width: 320px;
            max-height: 65vh;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.96);
            border-radius: 16px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
            padding: 18px 20px;
            color: #1a237e;
            backdrop-filter: blur(4px);
        }

        .kid-card-panel.hidden {
            display: none;
        }

        .kid-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .kid-card-emoji {
            font-size: 34px;
        }

        .kid-card-title {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
            color: #1a237e;
        }

        .kid-card-subtitle {
            font-size: 12px;
            color: #5c6bc0;
            margin: 2px 0 0 0;
            letter-spacing: 0.05em;
        }

        .kid-card-summary {
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 12px;
        }

        .kid-card-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }

        .kid-card-tag {
            background: #e8eaf6;
            color: #3949ab;
            padding: 4px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
        }

        .kid-card-tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 12px;
        }

        .kid-card-tab-button {
            flex: 1 1 auto;
            background: #c5cae9;
            border: none;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 12px;
            cursor: pointer;
            color: #1a237e;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .kid-card-tab-button.active {
            background: #3f51b5;
            color: white;
            box-shadow: 0 6px 14px rgba(63, 81, 181, 0.4);
        }

        .kid-card-tab-content {
            display: none;
        }

        .kid-card-tab-content.active {
            display: block;
        }

        .kid-card-tab-description {
            font-size: 13px;
            margin-bottom: 8px;
            color: #303f9f;
        }

        .kid-card-tab-list {
            list-style: none;
            padding-left: 18px;
            margin: 0;
        }

        .kid-card-tab-list li {
            position: relative;
            margin-bottom: 6px;
            font-size: 13px;
            line-height: 1.6;
        }

        .kid-card-tab-list li::before {
            content: '✨';
            position: absolute;
            left: -18px;
        }

        .kid-card-cta {
            margin-top: 12px;
            padding: 10px 12px;
            background: linear-gradient(135deg, #ffb74d, #ffa726);
            color: #4e342e;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.5;
        }

        .kid-card-empty {
            color: rgba(255, 255, 255, 0.7);
            font-size: 13px;
            text-align: center;
            line-height: 1.6;
        }

        /* 高年级学生卡片样式 - 更专业、更简洁 */
        .senior-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            border-bottom: 1px solid #e3f2fd;
            padding-bottom: 8px;
        }

        .senior-card-emoji {
            font-size: 28px;
        }

        .senior-card-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: #0d47a1;
        }

        .senior-card-subtitle {
            font-size: 11px;
            color: #1976d2;
            margin: 2px 0 0 0;
            letter-spacing: 0.05em;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        }

        .senior-card-summary {
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 12px;
            color: #37474f;
        }

        .senior-card-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }

        .senior-card-tag {
            background: #e1f5fe;
            color: #0277bd;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid #b3e5fc;
        }

        .senior-card-tabs {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 12px;
            border-bottom: 1px solid #e0e0e0;
        }

        .senior-card-tab-button {
            flex: 1 1 auto;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            padding: 8px 12px;
            font-size: 13px;
            cursor: pointer;
            color: #546e7a;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .senior-card-tab-button:hover {
            background: #f5f5f5;
            color: #263238;
        }

        .senior-card-tab-button.active {
            background: transparent;
            color: #1976d2;
            border-bottom: 2px solid #2196f3;
            font-weight: 600;
        }

        .senior-card-tab-content {
            display: none;
        }

        .senior-card-tab-content.active {
            display: block;
        }

        .senior-card-tab-description {
            font-size: 13px;
            margin-bottom: 10px;
            color: #455a64;
            font-weight: 500;
        }

        .senior-card-tab-list {
            list-style: none;
            padding-left: 20px;
            margin: 0;
        }

        .senior-card-tab-list li {
            position: relative;
            margin-bottom: 8px;
            font-size: 13px;
            line-height: 1.6;
            color: #37474f;
        }

        .senior-card-tab-list li::before {
            content: '▶';
            position: absolute;
            left: -20px;
            color: #2196f3;
            font-size: 10px;
        }

        .senior-card-cta {
            margin-top: 12px;
            padding: 10px 12px;
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            color: #0d47a1;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.5;
            border-left: 4px solid #2196f3;
        }

        /* ===== 可移动卡片系统样式 ===== */
        .movable-card {
            position: absolute;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 300px;
            max-width: 500px;
            min-height: 200px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 100;
            transition: box-shadow 0.2s ease, transform 0.2s ease;
            overflow: hidden;
        }

        .movable-card:hover {
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
            transform: translateY(-1px);
        }

        .movable-card.dragging {
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
            transform: rotate(1deg) scale(1.02);
            cursor: grabbing;
        }

        .movable-card.maximized {
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            width: calc(100vw - 20px) !important;
            height: calc(100vh - 20px) !important;
            max-width: none !important;
            z-index: 9999;
            transform: none !important;
        }

        .movable-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 12px 12px 0 0;
        }

        .movable-card-drag-handle {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: grab;
            flex: 1;
            min-width: 0;
        }

        .movable-card-drag-handle:active {
            cursor: grabbing;
        }

        .card-emoji {
            font-size: 24px;
            flex-shrink: 0;
        }

        .card-title-wrapper {
            flex: 1;
            min-width: 0;
        }

        .card-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
            color: #1f2937;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .card-subtitle {
            font-size: 12px;
            color: #6b7280;
            margin: 2px 0 0 0;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .movable-card-controls {
            display: flex;
            gap: 4px;
        }

        .card-control-btn {
            width: 24px;
            height: 24px;
            border: none;
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.1);
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .card-control-btn:hover {
            background: rgba(0, 0, 0, 0.2);
            color: #374151;
            transform: scale(1.1);
        }

        .card-control-btn.close-btn:hover {
            background: #ef4444;
            color: white;
        }

        .movable-card-content {
            padding: 16px;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        }

        .card-summary {
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 12px;
            color: #374151;
        }

        .card-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }

        .card-tag {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .card-tabs-container {
            margin-top: 12px;
        }

        .card-tab-buttons {
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding-bottom: 8px;
        }

        .card-tab-button {
            flex: 1;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            padding: 8px 12px;
            font-size: 13px;
            cursor: pointer;
            color: #6b7280;
            font-weight: 500;
            transition: all 0.2s ease;
            border-radius: 6px 6px 0 0;
        }

        .card-tab-button:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #374151;
        }

        .card-tab-button.active {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            border-bottom: 2px solid #6366f1;
            font-weight: 600;
        }

        .card-tab-content {
            display: none;
        }

        .card-tab-content.active {
            display: block;
        }

        .tab-description {
            font-size: 13px;
            margin-bottom: 10px;
            color: #6b7280;
            font-weight: 500;
        }

        .tab-points-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .tab-points-list li {
            position: relative;
            margin-bottom: 8px;
            padding-left: 20px;
            font-size: 13px;
            line-height: 1.6;
            color: #374151;
        }

        .tab-points-list li::before {
            content: '▶';
            position: absolute;
            left: 0;
            color: #6366f1;
            font-size: 10px;
            top: 2px;
        }

        .card-cta {
            margin-top: 12px;
            padding: 10px 12px;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
            color: #047857;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.5;
            border-left: 4px solid #10b981;
        }

        /* 不同类型卡片的特殊样式 */
        .kid-friendly-card {
            border: 2px solid #fbbf24;
            background: linear-gradient(135deg, rgba(252, 211, 77, 0.1), rgba(251, 191, 36, 0.05));
        }

        .kid-friendly-card .movable-card-header {
            background: linear-gradient(135deg, rgba(252, 211, 77, 0.2), rgba(251, 191, 36, 0.1));
        }

        .kid-friendly-card .card-tag {
            background: rgba(252, 211, 77, 0.2);
            color: #d97706;
            border-color: rgba(252, 211, 77, 0.4);
        }

        .kid-friendly-card .tab-points-list li::before {
            content: '✨';
            color: #f59e0b;
        }

        .senior-student-card {
            border: 2px solid #3b82f6;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.03));
        }

        .senior-student-card .movable-card-header {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
        }

        .senior-student-card .card-tag {
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
            border-color: rgba(59, 130, 246, 0.3);
        }

        .senior-student-card .card-cta {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
            color: #1d4ed8;
            border-left-color: #3b82f6;
        }
    </style>
</head>
<body>
    <div class="editor-container">
        <div class="toolbar">
            <button onclick="addNode('react-component')">+ React组件</button>
            <button onclick="addNode('rust-struct')">+ Rust结构体</button>
            <button onclick="addNode('rust-function')">+ Rust函数</button>
            <button onclick="generateCode()">🎯 生成代码</button>
            <button onclick="saveGraph()">💾 保存</button>
            <button onclick="loadGraph()">📂 加载</button>
            <button onclick="exportImage()">🖼️ 导出图片</button>
        </div>
        
        <div class="node-palette">
            <div class="palette-title">🎨 节点模板</div>
            <div class="node-template" draggable="true" data-type="react-component">
                ⚛️ React组件
            </div>
            <div class="node-template" draggable="true" data-type="rust-struct">
                🦀 Rust结构体
            </div>
            <div class="node-template" draggable="true" data-type="rust-function">
                🔧 Rust函数
            </div>
            <div class="node-template" draggable="true" data-type="logic-gate">
                🧠 逻辑门
            </div>
            <div class="node-template" draggable="true" data-type="connection">
                🔗 连接器
            </div>
        </div>
        
        <div class="canvas" id="canvas"></div>

        <div class="kid-card-panel" id="kidCardPanel">
            <div class="kid-card-empty">
                点击右键 → 🚀 高级功能 → 🧒 小朋友能懂的讲解<br />
                我们会在这里用中文讲故事~
            </div>
        </div>
        
        <div class="status-bar">
            <span id="nodeCount">节点: 0</span>
            <span id="connectionCount">连接: 0</span>
            <span>🎨 蓝图可视化编辑器 v1.0</span>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let currentGraph = { nodes: [], connections: [], metadata: {} };
        let selectedNode = null;
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
    let kidFriendlyCardData = null;
    let kidFriendlyActiveTabId = null;
    let seniorStudentCardData = null;
    let seniorStudentActiveTabId = null;
        
        // 添加节点
        function addNode(type) {
            const node = {
                id: 'node_' + Date.now(),
                type: type,
                position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
                size: { width: 150, height: 80 },
                data: { name: getDefaultNodeName(type) },
                inputs: getDefaultInputs(type),
                outputs: getDefaultOutputs(type)
            };
            
            currentGraph.nodes.push(node);
            renderNode(node);
            updateStatus();
            
            vscode.postMessage({
                command: 'nodeAdded',
                node: node
            });
        }
        
        function getDefaultNodeName(type) {
            switch(type) {
                case 'react-component': return 'MyComponent';
                case 'rust-struct': return 'MyStruct';
                case 'rust-function': return 'my_function';
                default: return 'Node';
            }
        }
        
        function getDefaultInputs(type) {
            switch(type) {
                case 'react-component': 
                    return [{ id: 'props', label: 'Props', type: 'data', connected: false }];
                case 'rust-function':
                    return [{ id: 'input', label: 'Input', type: 'data', connected: false }];
                default: 
                    return [];
            }
        }
        
        function getDefaultOutputs(type) {
            switch(type) {
                case 'react-component': 
                    return [{ id: 'jsx', label: 'JSX', type: 'data', connected: false }];
                case 'rust-function':
                    return [{ id: 'output', label: 'Output', type: 'data', connected: false }];
                default: 
                    return [];
            }
        }

        function renderKidFriendlyCard(card) {
            const panel = document.getElementById('kidCardPanel');
            if (!panel) return;

            kidFriendlyCardData = card;
            kidFriendlyActiveTabId = (card.tabs && card.tabs.length > 0) ? card.tabs[0].id : null;

            panel.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'kid-card-header';

            const emojiEl = document.createElement('div');
            emojiEl.className = 'kid-card-emoji';
            emojiEl.textContent = card.emoji || '📘';
            header.appendChild(emojiEl);

            const titleWrapper = document.createElement('div');
            const titleEl = document.createElement('div');
            titleEl.className = 'kid-card-title';
            titleEl.textContent = card.chineseName || '小小代码故事';
            titleWrapper.appendChild(titleEl);

            const subtitleEl = document.createElement('div');
            subtitleEl.className = 'kid-card-subtitle';
            subtitleEl.textContent = card.englishName || '';
            titleWrapper.appendChild(subtitleEl);

            header.appendChild(titleWrapper);
            panel.appendChild(header);

            if (card.summary) {
                const summaryEl = document.createElement('div');
                summaryEl.className = 'kid-card-summary';
                summaryEl.textContent = card.summary;
                panel.appendChild(summaryEl);
            }

            if (Array.isArray(card.tags) && card.tags.length > 0) {
                const tagsEl = document.createElement('div');
                tagsEl.className = 'kid-card-tags';
                card.tags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'kid-card-tag';
                    tagEl.textContent = tag;
                    tagsEl.appendChild(tagEl);
                });
                panel.appendChild(tagsEl);
            }

            if (Array.isArray(card.tabs) && card.tabs.length > 0) {
                const tabsEl = document.createElement('div');
                tabsEl.className = 'kid-card-tabs';
                const contentWrapper = document.createElement('div');

                card.tabs.forEach(tab => {
                    const button = document.createElement('button');
                    button.className = 'kid-card-tab-button';
                    button.dataset.tabId = tab.id;
                    button.textContent = tab.title;
                    button.addEventListener('click', () => {
                        kidFriendlyActiveTabId = tab.id;
                        activateKidFriendlyTab(tab.id);
                    });
                    tabsEl.appendChild(button);

                    const contentEl = document.createElement('div');
                    contentEl.className = 'kid-card-tab-content';
                    contentEl.dataset.tabId = tab.id;

                    if (tab.description) {
                        const descEl = document.createElement('div');
                        descEl.className = 'kid-card-tab-description';
                        descEl.textContent = tab.description;
                        contentEl.appendChild(descEl);
                    }

                    if (Array.isArray(tab.points) && tab.points.length > 0) {
                        const listEl = document.createElement('ul');
                        listEl.className = 'kid-card-tab-list';
                        tab.points.forEach(point => {
                            const li = document.createElement('li');
                            li.textContent = point;
                            listEl.appendChild(li);
                        });
                        contentEl.appendChild(listEl);
                    }

                    contentWrapper.appendChild(contentEl);
                });

                panel.appendChild(tabsEl);
                panel.appendChild(contentWrapper);
            }

            if (card.callToAction) {
                const ctaEl = document.createElement('div');
                ctaEl.className = 'kid-card-cta';
                ctaEl.textContent = card.callToAction;
                panel.appendChild(ctaEl);
            }

            activateKidFriendlyTab(kidFriendlyActiveTabId);
        }

        function activateKidFriendlyTab(tabId) {
            const panel = document.getElementById('kidCardPanel');
            if (!panel) return;

            if (!tabId) {
                const firstButton = panel.querySelector('.kid-card-tab-button');
                tabId = firstButton ? firstButton.dataset.tabId : null;
            }

            if (!tabId) {
                return;
            }

            const buttons = panel.querySelectorAll('.kid-card-tab-button');
            const contents = panel.querySelectorAll('.kid-card-tab-content');

            buttons.forEach(button => {
                const isActive = button.dataset.tabId === tabId;
                button.classList.toggle('active', isActive);
            });

            contents.forEach(content => {
                const isActive = content.dataset.tabId === tabId;
                content.classList.toggle('active', isActive);
            });

            kidFriendlyActiveTabId = tabId;
        }

        // 高年级学生卡片渲染函数
        function renderSeniorStudentCard(card) {
            const panel = document.getElementById('kidCardPanel'); // 复用同一个面板
            if (!panel) return;

            seniorStudentCardData = card;
            seniorStudentActiveTabId = (card.tabs && card.tabs.length > 0) ? card.tabs[0].id : null;

            panel.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'senior-card-header';

            const emojiEl = document.createElement('div');
            emojiEl.className = 'senior-card-emoji';
            emojiEl.textContent = card.emoji || '📊';
            header.appendChild(emojiEl);

            const titleWrapper = document.createElement('div');
            const titleEl = document.createElement('div');
            titleEl.className = 'senior-card-title';
            titleEl.textContent = card.chineseName || '代码分析报告';
            titleWrapper.appendChild(titleEl);

            const subtitleEl = document.createElement('div');
            subtitleEl.className = 'senior-card-subtitle';
            subtitleEl.textContent = card.englishName || '';
            titleWrapper.appendChild(subtitleEl);

            header.appendChild(titleWrapper);
            panel.appendChild(header);

            if (card.summary) {
                const summaryEl = document.createElement('div');
                summaryEl.className = 'senior-card-summary';
                summaryEl.textContent = card.summary;
                panel.appendChild(summaryEl);
            }

            if (Array.isArray(card.tags) && card.tags.length > 0) {
                const tagsEl = document.createElement('div');
                tagsEl.className = 'senior-card-tags';
                card.tags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'senior-card-tag';
                    tagEl.textContent = tag;
                    tagsEl.appendChild(tagEl);
                });
                panel.appendChild(tagsEl);
            }

            if (Array.isArray(card.tabs) && card.tabs.length > 0) {
                const tabsEl = document.createElement('div');
                tabsEl.className = 'senior-card-tabs';
                const contentWrapper = document.createElement('div');

                card.tabs.forEach(tab => {
                    const button = document.createElement('button');
                    button.className = 'senior-card-tab-button';
                    button.dataset.tabId = tab.id;
                    button.textContent = tab.title;
                    button.addEventListener('click', () => {
                        seniorStudentActiveTabId = tab.id;
                        activateSeniorStudentTab(tab.id);
                    });
                    tabsEl.appendChild(button);

                    const contentEl = document.createElement('div');
                    contentEl.className = 'senior-card-tab-content';
                    contentEl.dataset.tabId = tab.id;

                    if (tab.description) {
                        const descEl = document.createElement('div');
                        descEl.className = 'senior-card-tab-description';
                        descEl.textContent = tab.description;
                        contentEl.appendChild(descEl);
                    }

                    if (Array.isArray(tab.points) && tab.points.length > 0) {
                        const listEl = document.createElement('ul');
                        listEl.className = 'senior-card-tab-list';
                        tab.points.forEach(point => {
                            const li = document.createElement('li');
                            li.textContent = point;
                            listEl.appendChild(li);
                        });
                        contentEl.appendChild(listEl);
                    }

                    contentWrapper.appendChild(contentEl);
                });

                panel.appendChild(tabsEl);
                panel.appendChild(contentWrapper);
            }

            if (card.callToAction) {
                const ctaEl = document.createElement('div');
                ctaEl.className = 'senior-card-cta';
                ctaEl.textContent = card.callToAction;
                panel.appendChild(ctaEl);
            }

            activateSeniorStudentTab(seniorStudentActiveTabId);
        }

        function activateSeniorStudentTab(tabId) {
            const panel = document.getElementById('kidCardPanel');
            if (!panel) return;

            if (!tabId) {
                const firstButton = panel.querySelector('.senior-card-tab-button');
                tabId = firstButton ? firstButton.dataset.tabId : null;
            }

            if (!tabId) {
                return;
            }

            const buttons = panel.querySelectorAll('.senior-card-tab-button');
            const contents = panel.querySelectorAll('.senior-card-tab-content');

            buttons.forEach(button => {
                if (button.dataset.tabId === tabId) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });

            contents.forEach(content => {
                if (content.dataset.tabId === tabId) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });

            seniorStudentActiveTabId = tabId;
        }
        
        // 渲染节点
        function renderNode(node) {
            const canvas = document.getElementById('canvas');
            const nodeEl = document.createElement('div');
            nodeEl.className = 'blueprint-node';
            nodeEl.id = node.id;
            nodeEl.style.left = node.position.x + 'px';
            nodeEl.style.top = node.position.y + 'px';
            
            nodeEl.innerHTML = \`
                <div class="node-title">\${getNodeIcon(node.type)} \${node.data.name}</div>
                <div class="node-ports">
                    <div class="inputs">
                        \${node.inputs.map(input => \`<div class="port input-port" data-port="\${input.id}"></div>\`).join('')}
                    </div>
                    <div class="outputs">
                        \${node.outputs.map(output => \`<div class="port output-port" data-port="\${output.id}"></div>\`).join('')}
                    </div>
                </div>
            \`;
            
            // 添加拖拽事件
            nodeEl.addEventListener('mousedown', (e) => startDrag(e, node));
            canvas.appendChild(nodeEl);
        }
        
        function getNodeIcon(type) {
            switch(type) {
                case 'react-component': return '⚛️';
                case 'rust-struct': return '🦀';
                case 'rust-function': return '🔧';
                case 'logic-gate': return '🧠';
                default: return '📦';
            }
        }
        
        // 拖拽功能
        function startDrag(e, node) {
            selectedNode = node;
            isDragging = true;
            
            const nodeEl = document.getElementById(node.id);
            const rect = nodeEl.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        }
        
        function drag(e) {
            if (!isDragging || !selectedNode) return;
            
            const canvas = document.getElementById('canvas');
            const rect = canvas.getBoundingClientRect();
            
            const x = e.clientX - rect.left - dragOffset.x;
            const y = e.clientY - rect.top - dragOffset.y;
            
            selectedNode.position.x = Math.max(0, x);
            selectedNode.position.y = Math.max(0, y);
            
            const nodeEl = document.getElementById(selectedNode.id);
            nodeEl.style.left = selectedNode.position.x + 'px';
            nodeEl.style.top = selectedNode.position.y + 'px';
        }
        
        function stopDrag() {
            if (selectedNode) {
                vscode.postMessage({
                    command: 'nodeUpdated',
                    node: selectedNode
                });
            }
            
            isDragging = false;
            selectedNode = null;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }
        
        // 生成代码
        function generateCode() {
            vscode.postMessage({
                command: 'generateCode'
            });
        }
        
        // 保存图表
        function saveGraph() {
            vscode.postMessage({
                command: 'saveGraph',
                graph: currentGraph
            });
        }
        
        // 加载图表
        function loadGraph() {
            vscode.postMessage({
                command: 'loadGraph'
            });
        }
        
        // 导出图片
        function exportImage() {
            const canvas = document.getElementById('canvas');
            html2canvas(canvas).then(canvas => {
                const imageData = canvas.toDataURL('image/png');
                vscode.postMessage({
                    command: 'exportImage',
                    imageData: imageData
                });
            });
        }
        
        // 更新状态栏
        function updateStatus() {
            document.getElementById('nodeCount').textContent = \`节点: \${currentGraph.nodes.length}\`;
            document.getElementById('connectionCount').textContent = \`连接: \${currentGraph.connections.length}\`;
        }
        
        // 监听VSCode消息
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'initializeGraph':
                    currentGraph = message.graph;
                    updateStatus();
                    break;
                case 'loadGraph':
                    currentGraph = message.graph;
                    renderGraph();
                    updateStatus();
                    break;
                case 'showKidFriendlyCard':
                    renderKidFriendlyCard(message.card);
                    break;
                case 'showSeniorStudentCard':
                    renderSeniorStudentCard(message.card);
                    break;
                case 'showMovableCard':
                    showMovableCard(message.cardConfig);
                    break;
                case 'closeCard':
                    if (window.cardManager) {
                        window.cardManager.closeCard(message.cardId);
                    }
                    break;
                case 'clearAllCards':
                    if (window.cardManager) {
                        window.cardManager.clearAllCards();
                    }
                    break;
            }
        });
        
        // 渲染整个图表
        function renderGraph() {
            const canvas = document.getElementById('canvas');
            canvas.innerHTML = '';
            
            currentGraph.nodes.forEach(node => {
                renderNode(node);
            });
        }
        
        // ===== 可移动卡片系统 =====
        
        // 卡片拖拽引擎
        class CardDragEngine {
            constructor() {
                this.currentCard = null;
                this.isDragging = false;
                this.startPos = { x: 0, y: 0 };
                this.elementStartPos = { x: 0, y: 0 };
                this.zIndexCounter = 1000;
            }

            startDrag(cardElement, startX, startY) {
                this.currentCard = cardElement;
                this.isDragging = true;
                this.startPos = { x: startX, y: startY };
                
                const rect = cardElement.getBoundingClientRect();
                const container = cardElement.offsetParent || document.body;
                const containerRect = container.getBoundingClientRect();
                
                this.elementStartPos = {
                    x: rect.left - containerRect.left,
                    y: rect.top - containerRect.top
                };

                this.bringToTop(cardElement);
                cardElement.classList.add('dragging');
                document.body.style.userSelect = 'none';

                document.addEventListener('mousemove', this.handleMouseMove.bind(this));
                document.addEventListener('mouseup', this.handleMouseUp.bind(this));
            }

            handleMouseMove(e) {
                if (!this.isDragging || !this.currentCard) return;

                e.preventDefault();
                
                const deltaX = e.clientX - this.startPos.x;
                const deltaY = e.clientY - this.startPos.y;
                
                let newX = this.elementStartPos.x + deltaX;
                let newY = this.elementStartPos.y + deltaY;

                // 简单边界约束
                newX = Math.max(0, Math.min(newX, window.innerWidth - this.currentCard.offsetWidth));
                newY = Math.max(0, Math.min(newY, window.innerHeight - this.currentCard.offsetHeight));

                this.currentCard.style.left = newX + 'px';
                this.currentCard.style.top = newY + 'px';
            }

            handleMouseUp(e) {
                if (!this.isDragging) return;

                document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
                document.removeEventListener('mouseup', this.handleMouseUp.bind(this));

                if (this.currentCard) {
                    this.currentCard.classList.remove('dragging');
                }

                document.body.style.userSelect = '';
                this.currentCard = null;
                this.isDragging = false;
            }

            bringToTop(cardElement) {
                this.zIndexCounter += 1;
                cardElement.style.zIndex = this.zIndexCounter;
            }

            static makeDraggable(cardElement) {
                const engine = window.cardDragEngine || (window.cardDragEngine = new CardDragEngine());
                const handle = cardElement.querySelector('.movable-card-drag-handle');
                
                if (handle) {
                    handle.style.cursor = 'grab';
                    handle.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        engine.startDrag(cardElement, e.clientX, e.clientY);
                    });
                }

                return engine;
            }
        }

        // 卡片管理器
        class CardManager {
            constructor() {
                this.cards = new Map();
                this.zIndexCounter = 1000;
            }
            
            addCard(cardConfig) {
                const cardHTML = this.generateCardHTML(cardConfig);
                const container = document.getElementById('canvas') || document.body;
                
                const temp = document.createElement('div');
                temp.innerHTML = cardHTML;
                const cardElement = temp.firstElementChild;
                
                container.appendChild(cardElement);
                CardDragEngine.makeDraggable(cardElement);
                
                this.cards.set(cardConfig.id, {
                    config: cardConfig,
                    element: cardElement,
                    state: {
                        isMinimized: false,
                        isMaximized: false,
                        zIndex: this.zIndexCounter++
                    }
                });
                
                return cardElement;
            }
            
            generateCardHTML(config) {
                const { id, type, data, position, size } = config;
                
                return \`
                    <div id="\${id}" 
                         class="movable-card \${type}-card" 
                         style="left: \${position.x}px; top: \${position.y}px; width: \${size.width}px; height: \${size.height}px;">
                        
                        <div class="movable-card-header">
                            <div class="movable-card-drag-handle">
                                <div class="card-emoji">\${data.emoji || '📄'}</div>
                                <div class="card-title-wrapper">
                                    <div class="card-title">\${data.chineseName || '卡片标题'}</div>
                                    <div class="card-subtitle">\${data.englishName || ''}</div>
                                </div>
                            </div>
                            
                            <div class="movable-card-controls">
                                <button class="card-control-btn minimize-btn" title="最小化" onclick="cardManager.minimizeCard('\${id}')">−</button>
                                <button class="card-control-btn maximize-btn" title="最大化" onclick="cardManager.toggleMaximize('\${id}')">⬜</button>
                                <button class="card-control-btn close-btn" title="关闭" onclick="cardManager.closeCard('\${id}')">×</button>
                            </div>
                        </div>
                        
                        <div class="movable-card-content">
                            \${this.generateCardContent(data)}
                        </div>
                    </div>
                \`;
            }
            
            generateCardContent(data) {
                let content = '';
                
                if (data.summary) {
                    content += \`<div class="card-summary">\${data.summary}</div>\`;
                }
                
                if (data.tags && data.tags.length > 0) {
                    content += \`
                        <div class="card-tags">
                            \${data.tags.map(tag => \`<span class="card-tag">\${tag}</span>\`).join('')}
                        </div>
                    \`;
                }
                
                if (data.tabs && data.tabs.length > 0) {
                    content += \`
                        <div class="card-tabs-container">
                            <div class="card-tab-buttons">
                                \${data.tabs.map((tab, index) => \`
                                    <button class="card-tab-button \${index === 0 ? 'active' : ''}" 
                                            onclick="cardManager.switchTab('\${data.id}', '\${tab.id}')">
                                        \${tab.title}
                                    </button>
                                \`).join('')}
                            </div>
                            
                            <div class="card-tab-contents">
                                \${data.tabs.map((tab, index) => \`
                                    <div class="card-tab-content \${index === 0 ? 'active' : ''}" data-tab-id="\${tab.id}">
                                        \${tab.description ? \`<div class="tab-description">\${tab.description}</div>\` : ''}
                                        \${tab.points && tab.points.length > 0 ? \`
                                            <ul class="tab-points-list">
                                                \${tab.points.map(point => \`<li>\${point}</li>\`).join('')}
                                            </ul>
                                        \` : ''}
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`;
                }
                
                if (data.callToAction) {
                    content += \`<div class="card-cta">\${data.callToAction}</div>\`;
                }
                
                return content;
            }
            
            minimizeCard(cardId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                const content = card.element.querySelector('.movable-card-content');
                const minimizeBtn = card.element.querySelector('.minimize-btn');
                
                if (card.state.isMinimized) {
                    content.style.display = 'block';
                    minimizeBtn.innerHTML = '−';
                    minimizeBtn.title = '最小化';
                    card.state.isMinimized = false;
                } else {
                    content.style.display = 'none';
                    minimizeBtn.innerHTML = '+';
                    minimizeBtn.title = '恢复';
                    card.state.isMinimized = true;
                }
            }
            
            toggleMaximize(cardId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                const maximizeBtn = card.element.querySelector('.maximize-btn');
                
                if (card.state.isMaximized) {
                    card.element.classList.remove('maximized');
                    maximizeBtn.innerHTML = '⬜';
                    maximizeBtn.title = '最大化';
                    card.state.isMaximized = false;
                } else {
                    card.element.classList.add('maximized');
                    maximizeBtn.innerHTML = '⧉';
                    maximizeBtn.title = '还原';
                    card.state.isMaximized = true;
                }
            }
            
            closeCard(cardId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                card.element.style.transition = 'all 0.3s ease';
                card.element.style.opacity = '0';
                card.element.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    if (card.element.parentNode) {
                        card.element.parentNode.removeChild(card.element);
                    }
                    this.cards.delete(cardId);
                }, 300);
            }
            
            switchTab(cardId, tabId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                const buttons = card.element.querySelectorAll('.card-tab-button');
                const contents = card.element.querySelectorAll('.card-tab-content');
                
                buttons.forEach(btn => btn.classList.remove('active'));
                contents.forEach(content => content.classList.remove('active'));
                
                const activeContent = card.element.querySelector(\`[data-tab-id="\${tabId}"]\`);
                if (activeContent) {
                    activeContent.classList.add('active');
                    const buttonIndex = Array.from(contents).indexOf(activeContent);
                    if (buttons[buttonIndex]) {
                        buttons[buttonIndex].classList.add('active');
                    }
                }
            }
            
            clearAllCards() {
                this.cards.forEach(card => {
                    if (card.element.parentNode) {
                        card.element.parentNode.removeChild(card.element);
                    }
                });
                this.cards.clear();
            }
        }
        
        // 初始化卡片管理器
        window.cardManager = new CardManager();
        
        // 可移动卡片显示函数
        function showMovableCard(cardConfig) {
            if (window.cardManager) {
                window.cardManager.addCard(cardConfig);
            }
        }
        
        // 添加到全局
        window.CardDragEngine = CardDragEngine;
        window.CardManager = CardManager;
        window.showMovableCard = showMovableCard;
        
        // 初始化
        updateStatus();
    </script>
</body>
</html>`;
    }
    
    // 🧹 清理资源
    private dispose(): void {
        this.panel = undefined;
    }
}

// 导出工厂函数
export function createBlueprintEditor(context: vscode.ExtensionContext): BlueprintVisualEditor {
    return new BlueprintVisualEditor(context);
}
