// 🎨 蓝图式可视化编辑器 - 完整实现
import * as vscode from 'vscode';

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
        if (!this.panel) return;
        
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
        if (!this.currentGraph) return;
        
        this.currentGraph.nodes.push(node);
        this.currentGraph.metadata.updatedAt = Date.now();
        
        vscode.window.showInformationMessage(`✅ 添加了${node.type}节点`);
    }
    
    // ✏️ 处理节点更新
    private async handleNodeUpdated(updatedNode: BlueprintNode): Promise<void> {
        if (!this.currentGraph) return;
        
        const index = this.currentGraph.nodes.findIndex(n => n.id === updatedNode.id);
        if (index >= 0) {
            this.currentGraph.nodes[index] = updatedNode;
            this.currentGraph.metadata.updatedAt = Date.now();
        }
    }
    
    // 🗑️ 处理节点删除
    private async handleNodeDeleted(nodeId: string): Promise<void> {
        if (!this.currentGraph) return;
        
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
        if (!this.currentGraph) return;
        
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
        if (!this.currentGraph) return;
        
        this.currentGraph.connections = this.currentGraph.connections.filter(
            c => c.id !== connectionId
        );
        
        this.currentGraph.metadata.updatedAt = Date.now();
    }
    
    // 🎯 验证连接
    private validateConnection(connection: BlueprintConnection): boolean {
        if (!this.currentGraph) return false;
        
        const fromNode = this.currentGraph.nodes.find(n => n.id === connection.from.nodeId);
        const toNode = this.currentGraph.nodes.find(n => n.id === connection.to.nodeId);
        
        if (!fromNode || !toNode) return false;
        
        const fromPoint = fromNode.outputs.find(p => p.id === connection.from.pointId);
        const toPoint = toNode.inputs.find(p => p.id === connection.to.pointId);
        
        if (!fromPoint || !toPoint) return false;
        
        // 检查类型兼容性
        return this.areTypesCompatible(fromPoint, toPoint);
    }
    
    // ✅ 检查类型兼容性
    private areTypesCompatible(from: ConnectionPoint, to: ConnectionPoint): boolean {
        // 执行流总是兼容
        if (from.type === 'execution' && to.type === 'execution') return true;
        
        // 事件类型检查
        if (from.type === 'event' && to.type === 'event') return true;
        
        // 数据类型检查
        if (from.type === 'data' && to.type === 'data') {
            if (!from.dataType || !to.dataType) return true; // 任意类型
            return from.dataType === to.dataType;
        }
        
        return false;
    }
    
    // 🔧 处理代码生成
    private async handleGenerateCode(): Promise<void> {
        if (!this.currentGraph) return;
        
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
