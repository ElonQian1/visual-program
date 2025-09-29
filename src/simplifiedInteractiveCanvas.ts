// 简化的交互式画布系统
import * as vscode from 'vscode';

export interface CanvasNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    data: Record<string, any>;
    selected: boolean;
    dragging: boolean;
}

export interface NodeConnection {
    id: string;
    source: string;
    target: string;
    type: 'data-flow' | 'control-flow' | 'dependency';
    label?: string;
}

export interface CanvasState {
    nodes: CanvasNode[];
    connections: NodeConnection[];
    selectedNodes: string[];
    viewport: {
        x: number;
        y: number;
        zoom: number;
    };
    dragState: {
        isDragging: boolean;
        startPos: { x: number; y: number };
        draggedNodes: string[];
    };
}

export class InteractiveCanvasSystem {
    private state: CanvasState;
    private panelProvider: vscode.WebviewPanel | undefined;

    constructor() {
        this.state = this.createInitialState();
    }

    // 🔧 创建初始状态
    private createInitialState(): CanvasState {
        return {
            nodes: [],
            connections: [],
            selectedNodes: [],
            viewport: { x: 0, y: 0, zoom: 1.0 },
            dragState: {
                isDragging: false,
                startPos: { x: 0, y: 0 },
                draggedNodes: []
            }
        };
    }

    // 🎨 创建WebView面板
    public createWebviewPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
        this.panelProvider = vscode.window.createWebviewPanel(
            'interactiveCanvas',
            '交互式画布',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
            }
        );

        this.panelProvider.webview.html = this.getWebviewContent(context);
        this.setupMessageHandling();
        
        return this.panelProvider;
    }

    // 📝 获取WebView内容
    private getWebviewContent(context: vscode.ExtensionContext): string {
        const cssUri = this.panelProvider!.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'canvas.css')
        );
        const scriptUri = this.panelProvider!.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'canvas.js')
        );

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>交互式画布</title>
    <link href="${cssUri}" rel="stylesheet">
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            background-color: #1e1e1e;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        #canvas-container {
            width: 100%;
            height: 100vh;
            position: relative;
            overflow: hidden;
            cursor: grab;
        }

        #canvas-container.dragging {
            cursor: grabbing;
        }

        .canvas-node {
            position: absolute;
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
            border: 2px solid #6b7280;
            border-radius: 8px;
            padding: 12px;
            min-width: 120px;
            min-height: 60px;
            cursor: grab;
            transition: all 0.2s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .canvas-node:hover {
            border-color: #60a5fa;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }

        .canvas-node.selected {
            border-color: #3b82f6;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        }

        .canvas-node.dragging {
            cursor: grabbing;
            z-index: 1000;
            transform: rotate(3deg) scale(1.05);
        }

        .node-title {
            color: white;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 8px;
            text-align: center;
        }

        .node-content {
            color: #d1d5db;
            font-size: 12px;
            line-height: 1.4;
        }

        .connection-line {
            position: absolute;
            pointer-events: none;
            z-index: 1;
        }

        .connection-line svg {
            overflow: visible;
        }

        .connection-path {
            fill: none;
            stroke: #10b981;
            stroke-width: 2;
            stroke-dasharray: 0;
            transition: all 0.2s ease;
        }

        .connection-path.data-flow {
            stroke: #10b981;
        }

        .connection-path.control-flow {
            stroke: #8b5cf6;
        }

        .connection-path.dependency {
            stroke: #f59e0b;
        }

        .toolbar {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(31, 41, 55, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid #374151;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            gap: 8px;
            align-items: center;
            z-index: 1000;
        }

        .toolbar button {
            background: #4b5563;
            border: 1px solid #6b7280;
            border-radius: 6px;
            color: white;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }

        .toolbar button:hover {
            background: #374151;
            border-color: #60a5fa;
        }

        .toolbar button.active {
            background: #3b82f6;
            border-color: #60a5fa;
        }

        .minimap {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 200px;
            height: 150px;
            background: rgba(31, 41, 55, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid #374151;
            border-radius: 8px;
            z-index: 1000;
        }

        .status-bar {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(31, 41, 55, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid #374151;
            border-radius: 8px;
            padding: 8px 12px;
            color: #d1d5db;
            font-size: 12px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="canvas-container">
        <div class="toolbar">
            <button id="add-node" title="添加节点">+ 节点</button>
            <button id="add-connection" title="添加连接">🔗 连接</button>
            <button id="select-mode" class="active" title="选择模式">✋ 选择</button>
            <button id="pan-mode" title="平移模式">🖐 平移</button>
            <button id="zoom-in" title="放大">🔍+</button>
            <button id="zoom-out" title="缩小">🔍-</button>
            <button id="fit-view" title="适应视图">📐 适应</button>
            <button id="export-canvas" title="导出画布">💾 导出</button>
        </div>

        <div class="status-bar">
            <span id="status-text">就绪</span> | 
            缩放: <span id="zoom-level">100%</span> | 
            节点: <span id="node-count">0</span> | 
            连接: <span id="connection-count">0</span>
        </div>

        <div class="minimap">
            <canvas id="minimap-canvas" width="200" height="150"></canvas>
        </div>
    </div>

    <script>
        // VS Code API
        const vscode = acquireVsCodeApi();

        // 画布状态
        let canvasState = {
            nodes: [],
            connections: [],
            selectedNodes: [],
            viewport: { x: 0, y: 0, zoom: 1.0 },
            dragState: {
                isDragging: false,
                startPos: { x: 0, y: 0 },
                draggedNodes: []
            },
            mode: 'select' // select, pan, connect
        };

        // DOM元素
        const container = document.getElementById('canvas-container');
        const statusText = document.getElementById('status-text');
        const zoomLevel = document.getElementById('zoom-level');
        const nodeCount = document.getElementById('node-count');
        const connectionCount = document.getElementById('connection-count');

        // 工具栏按钮
        document.getElementById('add-node').onclick = () => addRandomNode();
        document.getElementById('add-connection').onclick = () => setMode('connect');
        document.getElementById('select-mode').onclick = () => setMode('select');
        document.getElementById('pan-mode').onclick = () => setMode('pan');
        document.getElementById('zoom-in').onclick = () => zoom(1.2);
        document.getElementById('zoom-out').onclick = () => zoom(0.8);
        document.getElementById('fit-view').onclick = () => fitToView();
        document.getElementById('export-canvas').onclick = () => exportCanvas();

        // 设置模式
        function setMode(mode) {
            canvasState.mode = mode;
            document.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));
            document.getElementById(mode + '-mode').classList.add('active');
            updateStatus('模式: ' + mode);
        }

        // 添加随机节点
        function addRandomNode() {
            const node = {
                id: 'node_' + Date.now(),
                type: 'function',
                position: {
                    x: Math.random() * 800 + 100,
                    y: Math.random() * 600 + 100
                },
                size: { width: 120, height: 80 },
                data: {
                    name: '函数 ' + (canvasState.nodes.length + 1),
                    description: '这是一个示例函数节点'
                },
                selected: false,
                dragging: false
            };

            canvasState.nodes.push(node);
            renderCanvas();
            updateStats();
        }

        // 缩放
        function zoom(factor) {
            canvasState.viewport.zoom = Math.max(0.1, Math.min(3.0, canvasState.viewport.zoom * factor));
            renderCanvas();
            updateStats();
        }

        // 适应视图
        function fitToView() {
            if (canvasState.nodes.length === 0) return;

            const bounds = getNodesBounds();
            const containerRect = container.getBoundingClientRect();
            
            const scaleX = containerRect.width / (bounds.width + 100);
            const scaleY = containerRect.height / (bounds.height + 100);
            const scale = Math.min(scaleX, scaleY, 1.0);

            canvasState.viewport.zoom = scale;
            canvasState.viewport.x = (containerRect.width - bounds.width * scale) / 2 - bounds.left * scale;
            canvasState.viewport.y = (containerRect.height - bounds.height * scale) / 2 - bounds.top * scale;

            renderCanvas();
            updateStats();
        }

        // 获取节点边界
        function getNodesBounds() {
            if (canvasState.nodes.length === 0) return { left: 0, top: 0, width: 0, height: 0 };

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            canvasState.nodes.forEach(node => {
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                maxX = Math.max(maxX, node.position.x + node.size.width);
                maxY = Math.max(maxY, node.position.y + node.size.height);
            });

            return {
                left: minX,
                top: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }

        // 导出画布
        function exportCanvas() {
            const data = {
                nodes: canvasState.nodes,
                connections: canvasState.connections,
                viewport: canvasState.viewport
            };
            
            vscode.postMessage({
                command: 'exportCanvas',
                data: data
            });
            
            updateStatus('画布已导出');
        }

        // 渲染画布
        function renderCanvas() {
            // 清除现有节点
            container.querySelectorAll('.canvas-node, .connection-line').forEach(el => el.remove());

            // 渲染连接线
            renderConnections();

            // 渲染节点
            canvasState.nodes.forEach(node => {
                const nodeEl = createNodeElement(node);
                container.appendChild(nodeEl);
            });

            // 更新小地图
            updateMinimap();
        }

        // 渲染连接线
        function renderConnections() {
            canvasState.connections.forEach(connection => {
                const sourceNode = canvasState.nodes.find(n => n.id === connection.source);
                const targetNode = canvasState.nodes.find(n => n.id === connection.target);
                
                if (sourceNode && targetNode) {
                    const lineEl = createConnectionElement(connection, sourceNode, targetNode);
                    container.appendChild(lineEl);
                }
            });
        }

        // 创建节点元素
        function createNodeElement(node) {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'canvas-node';
            nodeEl.style.left = (canvasState.viewport.x + node.position.x * canvasState.viewport.zoom) + 'px';
            nodeEl.style.top = (canvasState.viewport.y + node.position.y * canvasState.viewport.zoom) + 'px';
            nodeEl.style.width = (node.size.width * canvasState.viewport.zoom) + 'px';
            nodeEl.style.height = (node.size.height * canvasState.viewport.zoom) + 'px';
            nodeEl.style.transform = 'scale(' + canvasState.viewport.zoom + ')';
            nodeEl.style.transformOrigin = '0 0';
            
            if (node.selected) nodeEl.classList.add('selected');
            if (node.dragging) nodeEl.classList.add('dragging');

            nodeEl.innerHTML = \`
                <div class="node-title">\${node.data.name}</div>
                <div class="node-content">\${node.data.description || ''}</div>
            \`;

            // 绑定事件
            nodeEl.onmousedown = (e) => onNodeMouseDown(e, node.id);
            nodeEl.onclick = (e) => onNodeClick(e, node.id);
            nodeEl.ondblclick = (e) => onNodeDoubleClick(e, node.id);

            return nodeEl;
        }

        // 创建连接元素
        function createConnectionElement(connection, sourceNode, targetNode) {
            const lineEl = document.createElement('div');
            lineEl.className = 'connection-line';

            const sourceX = canvasState.viewport.x + (sourceNode.position.x + sourceNode.size.width) * canvasState.viewport.zoom;
            const sourceY = canvasState.viewport.y + (sourceNode.position.y + sourceNode.size.height / 2) * canvasState.viewport.zoom;
            const targetX = canvasState.viewport.x + targetNode.position.x * canvasState.viewport.zoom;
            const targetY = canvasState.viewport.y + (targetNode.position.y + targetNode.size.height / 2) * canvasState.viewport.zoom;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.left = '0';
            svg.style.top = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const midX = (sourceX + targetX) / 2;
            const pathData = \`M \${sourceX} \${sourceY} Q \${midX} \${sourceY} \${midX} \${(sourceY + targetY) / 2} Q \${midX} \${targetY} \${targetX} \${targetY}\`;
            
            path.setAttribute('d', pathData);
            path.className = 'connection-path ' + connection.type;

            svg.appendChild(path);
            lineEl.appendChild(svg);

            return lineEl;
        }

        // 节点鼠标按下
        function onNodeMouseDown(e, nodeId) {
            if (canvasState.mode !== 'select') return;
            
            e.preventDefault();
            e.stopPropagation();

            const node = canvasState.nodes.find(n => n.id === nodeId);
            if (!node) return;

            // 开始拖拽
            canvasState.dragState.isDragging = true;
            canvasState.dragState.startPos = { x: e.clientX, y: e.clientY };
            canvasState.dragState.draggedNodes = canvasState.selectedNodes.includes(nodeId) 
                ? [...canvasState.selectedNodes] 
                : [nodeId];

            // 标记拖拽状态
            canvasState.dragState.draggedNodes.forEach(id => {
                const n = canvasState.nodes.find(n => n.id === id);
                if (n) n.dragging = true;
            });

            container.classList.add('dragging');
            renderCanvas();

            // 绑定全局事件
            document.onmousemove = onGlobalMouseMove;
            document.onmouseup = onGlobalMouseUp;
        }

        // 节点点击
        function onNodeClick(e, nodeId) {
            if (e.ctrlKey || e.metaKey) {
                toggleNodeSelection(nodeId);
            } else {
                selectNode(nodeId);
            }
        }

        // 节点双击
        function onNodeDoubleClick(e, nodeId) {
            vscode.postMessage({
                command: 'editNode',
                nodeId: nodeId
            });
        }

        // 全局鼠标移动
        function onGlobalMouseMove(e) {
            if (!canvasState.dragState.isDragging) return;

            const deltaX = (e.clientX - canvasState.dragState.startPos.x) / canvasState.viewport.zoom;
            const deltaY = (e.clientY - canvasState.dragState.startPos.y) / canvasState.viewport.zoom;

            if (canvasState.mode === 'select' && canvasState.dragState.draggedNodes.length > 0) {
                // 拖拽节点
                canvasState.dragState.draggedNodes.forEach(nodeId => {
                    const node = canvasState.nodes.find(n => n.id === nodeId);
                    if (node) {
                        node.position.x += deltaX;
                        node.position.y += deltaY;
                    }
                });
            } else if (canvasState.mode === 'pan') {
                // 平移画布
                canvasState.viewport.x += e.clientX - canvasState.dragState.startPos.x;
                canvasState.viewport.y += e.clientY - canvasState.dragState.startPos.y;
            }

            canvasState.dragState.startPos = { x: e.clientX, y: e.clientY };
            renderCanvas();
        }

        // 全局鼠标抬起
        function onGlobalMouseUp(e) {
            if (canvasState.dragState.isDragging) {
                // 清除拖拽状态
                canvasState.nodes.forEach(node => {
                    node.dragging = false;
                });

                canvasState.dragState.isDragging = false;
                canvasState.dragState.draggedNodes = [];
                container.classList.remove('dragging');
                renderCanvas();
            }

            // 清除全局事件
            document.onmousemove = null;
            document.onmouseup = null;
        }

        // 选择节点
        function selectNode(nodeId) {
            canvasState.selectedNodes = [nodeId];
            updateNodeSelection();
        }

        // 切换节点选择
        function toggleNodeSelection(nodeId) {
            const index = canvasState.selectedNodes.indexOf(nodeId);
            if (index >= 0) {
                canvasState.selectedNodes.splice(index, 1);
            } else {
                canvasState.selectedNodes.push(nodeId);
            }
            updateNodeSelection();
        }

        // 更新节点选择状态
        function updateNodeSelection() {
            canvasState.nodes.forEach(node => {
                node.selected = canvasState.selectedNodes.includes(node.id);
            });
            renderCanvas();
        }

        // 更新状态
        function updateStatus(message) {
            statusText.textContent = message;
        }

        // 更新统计信息
        function updateStats() {
            zoomLevel.textContent = Math.round(canvasState.viewport.zoom * 100) + '%';
            nodeCount.textContent = canvasState.nodes.length;
            connectionCount.textContent = canvasState.connections.length;
        }

        // 更新小地图
        function updateMinimap() {
            const canvas = document.getElementById('minimap-canvas');
            const ctx = canvas.getContext('2d');
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#374151';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (canvasState.nodes.length === 0) return;

            const bounds = getNodesBounds();
            const scaleX = canvas.width / (bounds.width + 100);
            const scaleY = canvas.height / (bounds.height + 100);
            const scale = Math.min(scaleX, scaleY);

            ctx.save();
            ctx.translate(10, 10);
            ctx.scale(scale, scale);

            // 绘制节点
            canvasState.nodes.forEach(node => {
                ctx.fillStyle = node.selected ? '#3b82f6' : '#6b7280';
                ctx.fillRect(
                    node.position.x - bounds.left,
                    node.position.y - bounds.top,
                    node.size.width,
                    node.size.height
                );
            });

            ctx.restore();
        }

        // 画布点击
        container.onclick = (e) => {
            if (e.target === container) {
                canvasState.selectedNodes = [];
                updateNodeSelection();
            }
        };

        // 画布右键菜单
        container.oncontextmenu = (e) => {
            e.preventDefault();
            // 可以显示上下文菜单
        };

        // 滚轮缩放
        container.onwheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const factor = e.deltaY > 0 ? 0.9 : 1.1;
                zoom(factor);
            }
        };

        // 键盘事件
        document.onkeydown = (e) => {
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    deleteSelectedNodes();
                    break;
                case 'Escape':
                    canvasState.selectedNodes = [];
                    updateNodeSelection();
                    break;
                case 'a':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        canvasState.selectedNodes = canvasState.nodes.map(n => n.id);
                        updateNodeSelection();
                    }
                    break;
            }
        };

        // 删除选中节点
        function deleteSelectedNodes() {
            canvasState.nodes = canvasState.nodes.filter(n => !canvasState.selectedNodes.includes(n.id));
            canvasState.connections = canvasState.connections.filter(c => 
                !canvasState.selectedNodes.includes(c.source) && 
                !canvasState.selectedNodes.includes(c.target)
            );
            canvasState.selectedNodes = [];
            renderCanvas();
            updateStats();
        }

        // 接收VS Code消息
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateCanvas':
                    canvasState = { ...canvasState, ...message.data };
                    renderCanvas();
                    updateStats();
                    break;
                case 'addNode':
                    canvasState.nodes.push(message.node);
                    renderCanvas();
                    updateStats();
                    break;
                case 'addConnection':
                    canvasState.connections.push(message.connection);
                    renderCanvas();
                    updateStats();
                    break;
            }
        });

        // 初始化
        updateStats();
        updateStatus('画布已就绪');

        // 添加一些示例节点
        setTimeout(() => {
            addRandomNode();
            addRandomNode();
            addRandomNode();
        }, 500);
    </script>
</body>
</html>`;
    }

    // 🔧 设置消息处理
    private setupMessageHandling(): void {
        if (!this.panelProvider) {return;}

        this.panelProvider.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'exportCanvas':
                        this.handleExportCanvas(message.data);
                        break;
                    case 'editNode':
                        this.handleEditNode(message.nodeId);
                        break;
                    case 'nodePositionChanged':
                        this.handleNodePositionChanged(message.nodeId, message.position);
                        break;
                }
            }
        );
    }

    // 📤 处理导出画布
    private handleExportCanvas(data: any): void {
        vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('canvas-export.json'),
            filters: {
                'JSON Files': ['json']
            }
        }).then(uri => {
            if (uri) {
                const fs = require('fs');
                fs.writeFileSync(uri.fsPath, JSON.stringify(data, null, 2));
                vscode.window.showInformationMessage('画布已导出到: ' + uri.fsPath);
            }
        });
    }

    // ✏️ 处理编辑节点
    private handleEditNode(nodeId: string): void {
        const node = this.state.nodes.find(n => n.id === nodeId);
        if (!node) {return;}

        vscode.window.showInputBox({
            prompt: '编辑节点名称',
            value: node.data.name
        }).then(newName => {
            if (newName && node) {
                node.data.name = newName;
                this.updateWebview();
            }
        });
    }

    // 📍 处理节点位置变更
    private handleNodePositionChanged(nodeId: string, position: { x: number; y: number }): void {
        const node = this.state.nodes.find(n => n.id === nodeId);
        if (node) {
            node.position = position;
        }
    }

    // 🔄 更新WebView
    private updateWebview(): void {
        if (this.panelProvider) {
            this.panelProvider.webview.postMessage({
                command: 'updateCanvas',
                data: this.state
            });
        }
    }

    // 🚀 公共API
    public addNode(node: CanvasNode): void {
        this.state.nodes.push(node);
        if (this.panelProvider) {
            this.panelProvider.webview.postMessage({
                command: 'addNode',
                node: node
            });
        }
    }

    public addConnection(connection: NodeConnection): void {
        this.state.connections.push(connection);
        if (this.panelProvider) {
            this.panelProvider.webview.postMessage({
                command: 'addConnection',
                connection: connection
            });
        }
    }

    public removeNode(nodeId: string): void {
        this.state.nodes = this.state.nodes.filter(n => n.id !== nodeId);
        this.state.connections = this.state.connections.filter(c => 
            c.source !== nodeId && c.target !== nodeId
        );
        this.updateWebview();
    }

    public getSelectedNodes(): CanvasNode[] {
        return this.state.nodes.filter(n => this.state.selectedNodes.includes(n.id));
    }

    public getCanvasState(): CanvasState {
        return { ...this.state };
    }

    public setCanvasState(state: Partial<CanvasState>): void {
        this.state = { ...this.state, ...state };
        this.updateWebview();
    }

    public exportCanvas(): any {
        return {
            nodes: this.state.nodes,
            connections: this.state.connections,
            viewport: this.state.viewport
        };
    }

    public importCanvas(data: any): void {
        this.state.nodes = data.nodes || [];
        this.state.connections = data.connections || [];
        this.state.viewport = data.viewport || { x: 0, y: 0, zoom: 1.0 };
        this.updateWebview();
    }

    // 🎯 从代码分析创建节点
    public createNodeFromAnalysis(analysis: any): CanvasNode {
        return {
            id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: analysis.type || 'function',
            position: {
                x: Math.random() * 800 + 100,
                y: Math.random() * 600 + 100
            },
            size: { width: 150, height: 100 },
            data: {
                name: analysis.name || '未命名',
                description: analysis.description || '',
                filePath: analysis.filePath,
                lineNumber: analysis.lineNumber,
                complexity: analysis.complexity,
                dependencies: analysis.dependencies || []
            },
            selected: false,
            dragging: false
        };
    }

    // 🔗 从依赖关系创建连接
    public createConnectionFromDependency(sourceId: string, targetId: string, type: string = 'dependency'): NodeConnection {
        return {
            id: 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            source: sourceId,
            target: targetId,
            type: type as 'data-flow' | 'control-flow' | 'dependency',
            label: type
        };
    }
}
