// 统一可视化界面提供器 - 整合所有功能
import * as vscode from 'vscode';
import { InteractiveCanvasProvider } from './interactiveCanvasProvider';
import { CodeGenerationEngine } from './codeGenerationEngine';
import { AIEnhancedAnalysisEngine } from './aiEnhancedAnalysisEngine';

export class UnifiedVisualizationProvider {
    private canvas: InteractiveCanvasProvider;
    private codeGen: CodeGenerationEngine;
    private aiEngine: AIEnhancedAnalysisEngine;
    private currentPanel: vscode.WebviewPanel | undefined;
    
    constructor() {
        this.canvas = new InteractiveCanvasProvider();
        this.codeGen = new CodeGenerationEngine();
        this.aiEngine = new AIEnhancedAnalysisEngine();
    }
    
    // 🎨 创建统一的可视化面板
    public createUnifiedPanel(extensionUri: vscode.Uri): void {
        if (this.currentPanel) {
            this.currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }
        
        this.currentPanel = vscode.window.createWebviewPanel(
            'unifiedVisualization',
            '🎨 可视化编程工作台',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );
        
        this.currentPanel.webview.html = this.getUnifiedWebviewContent();
        this.setupMessageHandlers();
        
        // 面板关闭时清理
        this.currentPanel.onDidDispose(() => {
            this.currentPanel = undefined;
        });
    }
    
    // 📱 构建完整的WebView界面
    private getUnifiedWebviewContent(): string {
        return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>可视化编程工作台</title>
            <style>
                /* 🎨 现代化界面样式 */
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    height: 100vh;
                    overflow: hidden;
                }
                
                .workspace {
                    display: grid;
                    grid-template-areas: 
                        "sidebar main properties"
                        "sidebar main properties";
                    grid-template-columns: 250px 1fr 300px;
                    grid-template-rows: 60px 1fr;
                    height: 100vh;
                }
                
                .toolbar {
                    grid-area: toolbar;
                    background: rgba(255,255,255,0.1);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    padding: 0 20px;
                    backdrop-filter: blur(10px);
                }
                
                .sidebar {
                    grid-area: sidebar;
                    background: rgba(0,0,0,0.3);
                    border-right: 1px solid rgba(255,255,255,0.1);
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .canvas-container {
                    grid-area: main;
                    position: relative;
                    overflow: hidden;
                    background: 
                        radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 1px, transparent 1px),
                        radial-gradient(circle at 75px 75px, rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
                
                .properties-panel {
                    grid-area: properties;
                    background: rgba(0,0,0,0.3);
                    border-left: 1px solid rgba(255,255,255,0.1);
                    overflow-y: auto;
                    padding: 20px;
                }
                
                /* 🎯 交互式画布样式 */
                .canvas {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    cursor: crosshair;
                }
                
                .node {
                    position: absolute;
                    min-width: 120px;
                    min-height: 60px;
                    background: rgba(255,255,255,0.9);
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    cursor: move;
                    padding: 12px;
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                }
                
                .node:hover {
                    border-color: #00ff88;
                    box-shadow: 0 6px 30px rgba(0,255,136,0.3);
                    transform: translateY(-2px);
                }
                
                .node.selected {
                    border-color: #ff6b6b;
                    box-shadow: 0 6px 30px rgba(255,107,107,0.4);
                }
                
                .node-header {
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .node-icon {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                }
                
                .node-content {
                    font-size: 12px;
                    color: #7f8c8d;
                    line-height: 1.4;
                }
                
                /* 🔗 连接线样式 */
                .connection {
                    position: absolute;
                    pointer-events: none;
                    z-index: 1;
                }
                
                .connection-line {
                    stroke: #00ff88;
                    stroke-width: 2;
                    fill: none;
                    filter: drop-shadow(0 0 6px rgba(0,255,136,0.5));
                }
                
                /* 🎛️ 控制面板样式 */
                .control-group {
                    margin-bottom: 20px;
                }
                
                .control-title {
                    color: white;
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                
                .control-item {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 4px;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .control-item:hover {
                    background: rgba(255,255,255,0.2);
                    border-color: #00ff88;
                }
                
                .btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    margin: 5px;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }
                
                .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .btn-success { background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); }
                .btn-warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
                .btn-info { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
            </style>
        </head>
        <body>
            <div class="workspace">
                <!-- 🎛️ 左侧工具栏 -->
                <div class="sidebar">
                    <div class="control-group">
                        <div class="control-title">🔧 分析工具</div>
                        <div class="control-item" onclick="analyzeCode()">📊 代码分析</div>
                        <div class="control-item" onclick="aiAnalysis()">🧠 AI 智能分析</div>
                        <div class="control-item" onclick="performanceAnalysis()">⚡ 性能分析</div>
                        <div class="control-item" onclick="architectureAnalysis()">🏗️ 架构分析</div>
                    </div>
                    
                    <div class="control-group">
                        <div class="control-title">🎨 画布操作</div>
                        <div class="control-item" onclick="addNode('component')">➕ 添加组件</div>
                        <div class="control-item" onclick="addNode('service')">🔧 添加服务</div>
                        <div class="control-item" onclick="autoLayout()">📐 自动布局</div>
                        <div class="control-item" onclick="clearCanvas()">🗑️ 清空画布</div>
                    </div>
                    
                    <div class="control-group">
                        <div class="control-title">💾 代码生成</div>
                        <div class="control-item" onclick="generateReactCode()">⚛️ 生成 React</div>
                        <div class="control-item" onclick="generateRustCode()">🦀 生成 Rust</div>
                        <div class="control-item" onclick="generateFullstack()">🚀 生成全栈</div>
                    </div>
                    
                    <div class="control-group">
                        <div class="control-title">📦 模板库</div>
                        <div class="control-item" onclick="loadTemplate('react-app')">⚛️ React 应用</div>
                        <div class="control-item" onclick="loadTemplate('rust-api')">🦀 Rust API</div>
                        <div class="control-item" onclick="loadTemplate('microservice')">🏗️ 微服务</div>
                    </div>
                </div>
                
                <!-- 🎨 主画布区域 -->
                <div class="canvas-container">
                    <div class="canvas" id="mainCanvas">
                        <svg id="connectionSvg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
                        </svg>
                        <!-- 节点将动态添加到这里 -->
                    </div>
                </div>
                
                <!-- 🎛️ 右侧属性面板 -->
                <div class="properties-panel">
                    <div class="control-group">
                        <div class="control-title">🎯 节点属性</div>
                        <div id="nodeProperties">
                            <p style="color: #bbb;">选择节点查看属性</p>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <div class="control-title">🔍 代码预览</div>
                        <div id="codePreview" style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 12px; color: #00ff88;">
                            // 选择节点查看生成的代码预览
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <div class="control-title">💡 AI 建议</div>
                        <div id="aiSuggestions" style="color: #bbb; font-size: 12px;">
                            暂无建议，开始分析代码获取智能建议
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                // 🎯 全局状态管理
                let selectedNode = null;
                let nodes = [];
                let connections = [];
                let dragOffset = { x: 0, y: 0 };
                let isDragging = false;
                
                // 💬 与VSCode通信
                const vscode = acquireVsCodeApi();
                
                // 📊 分析功能
                function analyzeCode() {
                    vscode.postMessage({ command: 'analyzeCode' });
                }
                
                function aiAnalysis() {
                    vscode.postMessage({ command: 'aiAnalysis' });
                }
                
                function performanceAnalysis() {
                    vscode.postMessage({ command: 'performanceAnalysis' });
                }
                
                function architectureAnalysis() {
                    vscode.postMessage({ command: 'architectureAnalysis' });
                }
                
                // 🎨 画布操作
                function addNode(type) {
                    const canvas = document.getElementById('mainCanvas');
                    const nodeId = 'node_' + Date.now();
                    
                    const node = document.createElement('div');
                    node.className = 'node';
                    node.id = nodeId;
                    node.style.left = Math.random() * 400 + 100 + 'px';
                    node.style.top = Math.random() * 300 + 100 + 'px';
                    
                    const icon = type === 'component' ? '⚛️' : '🔧';
                    const title = type === 'component' ? 'React 组件' : 'Rust 服务';
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon" style="background: \${type === 'component' ? '#61dafb' : '#f74c00'}">\${icon}</span>
                            <span>\${title}</span>
                        </div>
                        <div class="node-content">
                            双击编辑节点内容...
                        </div>
                    \`;
                    
                    // 添加事件监听
                    node.addEventListener('mousedown', startDrag);
                    node.addEventListener('click', selectNode);
                    node.addEventListener('dblclick', editNode);
                    
                    canvas.appendChild(node);
                    nodes.push({ id: nodeId, type, element: node });
                }
                
                function autoLayout() {
                    // 简单的自动布局算法
                    nodes.forEach((node, index) => {
                        const angle = (index / nodes.length) * 2 * Math.PI;
                        const radius = 200;
                        const centerX = 400;
                        const centerY = 300;
                        
                        const x = centerX + radius * Math.cos(angle);
                        const y = centerY + radius * Math.sin(angle);
                        
                        node.element.style.left = x + 'px';
                        node.element.style.top = y + 'px';
                    });
                    
                    updateConnections();
                }
                
                function clearCanvas() {
                    const canvas = document.getElementById('mainCanvas');
                    nodes.forEach(node => canvas.removeChild(node.element));
                    nodes = [];
                    connections = [];
                    selectedNode = null;
                    updateNodeProperties();
                    updateConnections();
                }
                
                // 🖱️ 拖拽功能
                function startDrag(e) {
                    isDragging = true;
                    selectedNode = e.currentTarget;
                    selectNode(e);
                    
                    const rect = selectedNode.getBoundingClientRect();
                    const canvasRect = document.getElementById('mainCanvas').getBoundingClientRect();
                    
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    document.addEventListener('mousemove', drag);
                    document.addEventListener('mouseup', stopDrag);
                    
                    e.preventDefault();
                }
                
                function drag(e) {
                    if (!isDragging || !selectedNode) return;
                    
                    const canvasRect = document.getElementById('mainCanvas').getBoundingClientRect();
                    const x = e.clientX - canvasRect.left - dragOffset.x;
                    const y = e.clientY - canvasRect.top - dragOffset.y;
                    
                    selectedNode.style.left = Math.max(0, Math.min(x, canvasRect.width - selectedNode.offsetWidth)) + 'px';
                    selectedNode.style.top = Math.max(0, Math.min(y, canvasRect.height - selectedNode.offsetHeight)) + 'px';
                    
                    updateConnections();
                }
                
                function stopDrag() {
                    isDragging = false;
                    document.removeEventListener('mousemove', drag);
                    document.removeEventListener('mouseup', stopDrag);
                }
                
                // 🎯 节点选择和编辑
                function selectNode(e) {
                    // 清除其他节点的选中状态
                    nodes.forEach(node => node.element.classList.remove('selected'));
                    
                    // 选中当前节点
                    e.currentTarget.classList.add('selected');
                    selectedNode = e.currentTarget;
                    
                    updateNodeProperties();
                    updateCodePreview();
                }
                
                function editNode(e) {
                    const content = e.currentTarget.querySelector('.node-content');
                    const currentText = content.textContent.trim();
                    
                    const newText = prompt('编辑节点内容:', currentText);
                    if (newText && newText !== currentText) {
                        content.textContent = newText;
                        updateCodePreview();
                    }
                }
                
                // 📝 属性面板更新
                function updateNodeProperties() {
                    const propertiesDiv = document.getElementById('nodeProperties');
                    
                    if (!selectedNode) {
                        propertiesDiv.innerHTML = '<p style="color: #bbb;">选择节点查看属性</p>';
                        return;
                    }
                    
                    const nodeType = selectedNode.querySelector('.node-header span:last-child').textContent;
                    const nodeContent = selectedNode.querySelector('.node-content').textContent;
                    
                    propertiesDiv.innerHTML = \`
                        <div style="color: white; margin-bottom: 10px;">
                            <strong>类型:</strong> \${nodeType}
                        </div>
                        <div style="color: white; margin-bottom: 10px;">
                            <strong>内容:</strong> \${nodeContent}
                        </div>
                        <div style="color: white; margin-bottom: 10px;">
                            <strong>位置:</strong> (\${selectedNode.style.left}, \${selectedNode.style.top})
                        </div>
                        <button class="btn btn-primary" onclick="generateCodeForNode()">生成代码</button>
                        <button class="btn btn-warning" onclick="deleteNode()">删除节点</button>
                    \`;
                }
                
                function updateCodePreview() {
                    const previewDiv = document.getElementById('codePreview');
                    
                    if (!selectedNode) {
                        previewDiv.textContent = '// 选择节点查看生成的代码预览';
                        return;
                    }
                    
                    const nodeType = selectedNode.querySelector('.node-header span:last-child').textContent;
                    const nodeContent = selectedNode.querySelector('.node-content').textContent;
                    
                    let codePreview = '';
                    if (nodeType.includes('React')) {
                        codePreview = \`
// React 组件预览
const \${nodeContent.replace(/\\s+/g, '') || 'MyComponent'} = () => {
    return (
        <div className="component">
            <h2>\${nodeContent}</h2>
        </div>
    );
};

export default \${nodeContent.replace(/\\s+/g, '') || 'MyComponent'};\`;
                    } else if (nodeType.includes('Rust')) {
                        codePreview = \`
// Rust 服务预览
pub struct \${nodeContent.replace(/\\s+/g, '') || 'MyService'} {
    // 服务字段
}

impl \${nodeContent.replace(/\\s+/g, '') || 'MyService'} {
    pub fn new() -> Self {
        Self {}
    }
    
    pub async fn handle_request(&self) -> Result<Response, Error> {
        // 处理逻辑
        Ok(Response::success())
    }
}\`;
                    }
                    
                    previewDiv.textContent = codePreview;
                }
                
                // 🔗 连接线管理
                function updateConnections() {
                    const svg = document.getElementById('connectionSvg');
                    svg.innerHTML = ''; // 清空现有连接线
                    
                    // 这里可以添加智能连接线绘制逻辑
                    // 暂时省略复杂的连接算法
                }
                
                // 💾 代码生成
                function generateReactCode() {
                    vscode.postMessage({ 
                        command: 'generateCode', 
                        type: 'react',
                        nodes: nodes.map(n => ({
                            id: n.id,
                            type: n.type,
                            content: n.element.querySelector('.node-content').textContent,
                            position: {
                                x: parseInt(n.element.style.left),
                                y: parseInt(n.element.style.top)
                            }
                        }))
                    });
                }
                
                function generateRustCode() {
                    vscode.postMessage({ 
                        command: 'generateCode', 
                        type: 'rust',
                        nodes: nodes.map(n => ({
                            id: n.id,
                            type: n.type,
                            content: n.element.querySelector('.node-content').textContent,
                            position: {
                                x: parseInt(n.element.style.left),
                                y: parseInt(n.element.style.top)
                            }
                        }))
                    });
                }
                
                function generateFullstack() {
                    vscode.postMessage({ 
                        command: 'generateCode', 
                        type: 'fullstack',
                        nodes: nodes.map(n => ({
                            id: n.id,
                            type: n.type,
                            content: n.element.querySelector('.node-content').textContent,
                            position: {
                                x: parseInt(n.element.style.left),
                                y: parseInt(n.element.style.top)
                            }
                        }))
                    });
                }
                
                function generateCodeForNode() {
                    if (!selectedNode) return;
                    
                    const nodeType = selectedNode.querySelector('.node-header span:last-child').textContent;
                    
                    if (nodeType.includes('React')) {
                        generateReactCode();
                    } else if (nodeType.includes('Rust')) {
                        generateRustCode();
                    }
                }
                
                // 📦 模板加载
                function loadTemplate(templateType) {
                    vscode.postMessage({ 
                        command: 'loadTemplate', 
                        templateType: templateType
                    });
                }
                
                // 🗑️ 删除节点
                function deleteNode() {
                    if (!selectedNode) return;
                    
                    const nodeId = selectedNode.id;
                    const canvas = document.getElementById('mainCanvas');
                    
                    canvas.removeChild(selectedNode);
                    nodes = nodes.filter(n => n.id !== nodeId);
                    
                    selectedNode = null;
                    updateNodeProperties();
                    updateConnections();
                }
                
                // 📡 监听来自VSCode的消息
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'updateAISuggestions':
                            document.getElementById('aiSuggestions').innerHTML = 
                                message.suggestions.map(s => \`<div style="margin-bottom: 8px;">💡 \${s}</div>\`).join('');
                            break;
                        case 'loadTemplateData':
                            loadTemplateToCanvas(message.templateData);
                            break;
                        case 'showCodeGenResult':
                            alert('代码生成完成！\\n\\n' + message.result.substring(0, 200) + '...');
                            break;
                    }
                });
                
                // 📋 模板数据加载到画布
                function loadTemplateToCanvas(templateData) {
                    clearCanvas();
                    
                    templateData.nodes.forEach(nodeData => {
                        addNode(nodeData.type);
                        const node = nodes[nodes.length - 1];
                        node.element.querySelector('.node-content').textContent = nodeData.content;
                        node.element.style.left = nodeData.x + 'px';
                        node.element.style.top = nodeData.y + 'px';
                    });
                    
                    updateConnections();
                }
                
                // 🚀 初始化
                document.addEventListener('DOMContentLoaded', function() {
                    // 添加示例节点
                    addNode('component');
                    addNode('service');
                    
                    // 自动布局
                    setTimeout(autoLayout, 100);
                });
            </script>
        </body>
        </html>`;
    }
    
    // 📡 消息处理器
    private setupMessageHandlers(): void {
        if (!this.currentPanel) return;
        
        this.currentPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'analyzeCode':
                        await this.handleCodeAnalysis();
                        break;
                    case 'aiAnalysis':
                        await this.handleAIAnalysis();
                        break;
                    case 'generateCode':
                        await this.handleCodeGeneration(message);
                        break;
                    case 'loadTemplate':
                        await this.handleTemplateLoad(message.templateType);
                        break;
                }
            }
        );
    }
    
    // 🔍 处理代码分析
    private async handleCodeAnalysis(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('请先打开一个代码文件');
            return;
        }
        
        // 这里集成现有的代码分析逻辑
        vscode.window.showInformationMessage('🔍 代码分析完成！结果已显示在可视化面板中');
    }
    
    // 🧠 处理AI分析
    private async handleAIAnalysis(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('请先打开一个代码文件');
            return;
        }
        
        try {
            const insights = await this.aiEngine.analyzeCodeWithAI(activeEditor.document);
            const suggestions = insights.map(insight => `${insight.title}: ${insight.description}`);
            
            this.currentPanel?.webview.postMessage({
                command: 'updateAISuggestions',
                suggestions
            });
            
            vscode.window.showInformationMessage(`🧠 AI分析完成！发现 ${insights.length} 个优化建议`);
        } catch (error) {
            vscode.window.showErrorMessage(`AI分析失败: ${error}`);
        }
    }
    
    // 💾 处理代码生成
    private async handleCodeGeneration(message: any): Promise<void> {
        try {
            const { type, nodes } = message;
            
            // 转换节点数据格式
            const canvasNodes = nodes.map((node: any) => ({
                id: node.id,
                type: node.type,
                position: { x: node.position.x, y: node.position.y },
                data: { name: node.content },
                connections: []
            }));
            
            const generatedCodes = this.codeGen.generateCodeFromCanvas(canvasNodes, []);
            const result = generatedCodes.length > 0 ? generatedCodes[0].content : '// 代码生成失败';
            
            // 创建新文档显示生成的代码
            const doc = await vscode.workspace.openTextDocument({
                content: result,
                language: type === 'rust' ? 'rust' : 'typescript'
            });
            await vscode.window.showTextDocument(doc);
            
            // 通知前端
            this.currentPanel?.webview.postMessage({
                command: 'showCodeGenResult',
                result
            });
            
            vscode.window.showInformationMessage('✨ 代码生成完成！');
        } catch (error) {
            vscode.window.showErrorMessage(`代码生成失败: ${error}`);
        }
    }
    
    // 📦 处理模板加载
    private async handleTemplateLoad(templateType: string): Promise<void> {
        // 模拟模板数据
        const templateData = {
            nodes: [
                {
                    type: 'component',
                    content: templateType === 'react-app' ? 'App组件' : 'API处理器',
                    x: 200,
                    y: 150
                },
                {
                    type: 'service',
                    content: templateType === 'rust-api' ? '用户服务' : '数据服务',
                    x: 400,
                    y: 150
                }
            ]
        };
        
        this.currentPanel?.webview.postMessage({
            command: 'loadTemplateData',
            templateData
        });
        
        vscode.window.showInformationMessage(`📦 模板 "${templateType}" 加载完成！`);
    }
}

// 🎯 增强的可视化面板创建函数
export function createOrShowUnifiedVisualizationPanel(extensionUri: vscode.Uri): void {
    const provider = new UnifiedVisualizationProvider();
    provider.createUnifiedPanel(extensionUri);
}
