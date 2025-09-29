// 完整的交互式画布系统
import * as vscode from 'vscode';

// DOM类型定义
declare const document: Document;
declare const window: Window;

interface EventListener {
    (evt: Event): void;
}

export interface CanvasNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    data: Record<string, any>;
    inputs: PortInfo[];
    outputs: PortInfo[];
    selected: boolean;
    dragging: boolean;
}

export interface PortInfo {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    connected: boolean;
}

export interface NodeConnection {
    id: string;
    source: string;
    target: string;
    sourcePort: string;
    targetPort: string;
    type: 'data-flow' | 'control-flow' | 'dependency';
    dataType?: string;
    label?: string;
}

export interface CanvasState {
    nodes: CanvasNode[];
    connections: NodeConnection[];
    selectedNodes: string[];
    selectedConnections: string[];
    viewport: {
        x: number;
        y: number;
        zoom: number;
    };
    mode: 'select' | 'connect' | 'pan';
    dragState: {
        isDragging: boolean;
        dragType: 'node' | 'selection' | 'canvas' | 'connection';
        startPos: { x: number; y: number };
        currentPos: { x: number; y: number };
        draggedNodes: string[];
        tempConnection?: {
            sourceNode: string;
            sourcePort: string;
            targetPos: { x: number; y: number };
        };
    };
}

export class InteractiveCanvasSystem {
    private canvas: HTMLElement | null = null;
    private state: CanvasState;
    private eventListeners: Map<string, EventListener[]> = new Map();
    private nodeTemplates: Map<string, any> = new Map();
    private contextMenu: HTMLElement | null = null;

    constructor() {
        this.state = this.createInitialState();
        this.initializeNodeTemplates();
    }

    // 🎨 初始化画布
    public initializeCanvas(canvasElement: HTMLElement): void {
        this.canvas = canvasElement;
        this.setupEventListeners();
        this.render();
    }

    // 🔧 创建初始状态
    private createInitialState(): CanvasState {
        return {
            nodes: [],
            connections: [],
            selectedNodes: [],
            selectedConnections: [],
            viewport: { x: 0, y: 0, zoom: 1.0 },
            mode: 'select',
            dragState: {
                isDragging: false,
                dragType: 'node',
                startPos: { x: 0, y: 0 },
                currentPos: { x: 0, y: 0 },
                draggedNodes: []
            }
        };
    }

    // 🎭 设置事件监听器
    private setupEventListeners(): void {
        if (!this.canvas) {return;}

        // 鼠标事件
        this.addEventListener(this.canvas, 'mousedown', this.onMouseDown.bind(this));
        this.addEventListener(this.canvas, 'mousemove', this.onMouseMove.bind(this));
        this.addEventListener(this.canvas, 'mouseup', this.onMouseUp.bind(this));
        this.addEventListener(this.canvas, 'wheel', this.onWheel.bind(this));
        this.addEventListener(this.canvas, 'contextmenu', this.onContextMenu.bind(this));

        // 键盘事件
        this.addEventListener(document, 'keydown', this.onKeyDown.bind(this));
        this.addEventListener(document, 'keyup', this.onKeyUp.bind(this));

        // 拖放事件
        this.addEventListener(this.canvas, 'dragover', this.onDragOver.bind(this));
        this.addEventListener(this.canvas, 'drop', this.onDrop.bind(this));

        // 窗口事件
        this.addEventListener(window, 'resize', this.onResize.bind(this));
    }

    // 🖱️ 鼠标按下事件
    private onMouseDown(event: MouseEvent): void {
        const pos = this.getCanvasPosition(event);
        const clickedElement = this.getElementAtPosition(pos);

        event.preventDefault();

        if (event.button === 0) { // 左键
            if (clickedElement) {
                this.handleElementClick(clickedElement, pos, event);
            } else {
                this.handleCanvasClick(pos, event);
            }
        } else if (event.button === 2) { // 右键
            this.handleRightClick(clickedElement, pos, event);
        }
    }

    // 🖱️ 鼠标移动事件
    private onMouseMove(event: MouseEvent): void {
        const pos = this.getCanvasPosition(event);

        if (this.state.dragState.isDragging) {
            this.handleDragMove(pos);
        } else {
            this.handleHover(pos);
        }

        this.state.dragState.currentPos = pos;
        this.render();
    }

    // 🖱️ 鼠标抬起事件
    private onMouseUp(event: MouseEvent): void {
        const pos = this.getCanvasPosition(event);

        if (this.state.dragState.isDragging) {
            this.handleDragEnd(pos);
        }

        this.state.dragState.isDragging = false;
        this.state.dragState.draggedNodes = [];
        this.state.dragState.tempConnection = undefined;
        this.render();
    }

    // 🎯 处理元素点击
    private handleElementClick(element: any, pos: { x: number; y: number }, event: MouseEvent): void {
        if (element.type === 'node') {
            this.handleNodeClick(element.id, pos, event);
        } else if (element.type === 'port') {
            this.handlePortClick(element.nodeId, element.portId, pos, event);
        } else if (element.type === 'connection') {
            this.handleConnectionClick(element.id, pos, event);
        }
    }

    // 🔴 处理节点点击
    private handleNodeClick(nodeId: string, pos: { x: number; y: number }, event: MouseEvent): void {
        const node = this.state.nodes.find(n => n.id === nodeId);
        if (!node) {return;}

        if (event.ctrlKey || event.metaKey) {
            // 多选
            this.toggleNodeSelection(nodeId);
        } else if (event.shiftKey) {
            // 连接模式
            this.startConnectionFromNode(nodeId, pos);
        } else {
            // 单选并开始拖拽
            if (!this.state.selectedNodes.includes(nodeId)) {
                this.selectNode(nodeId);
            }
            this.startNodeDrag(nodeId, pos);
        }
    }

    // 🔌 处理端口点击
    private handlePortClick(nodeId: string, portId: string, pos: { x: number; y: number }, event: MouseEvent): void {
        if (this.state.mode === 'connect' || event.shiftKey) {
            this.handleConnectionDrag(nodeId, portId, pos);
        }
    }

    // 🔗 处理连接点击
    private handleConnectionClick(connectionId: string, pos: { x: number; y: number }, event: MouseEvent): void {
        if (event.ctrlKey || event.metaKey) {
            this.toggleConnectionSelection(connectionId);
        } else {
            this.selectConnection(connectionId);
        }
    }

    // 🖼️ 处理画布点击
    private handleCanvasClick(pos: { x: number; y: number }, event: MouseEvent): void {
        if (!event.ctrlKey && !event.metaKey) {
            this.clearSelection();
        }

        if (event.shiftKey) {
            this.state.mode = 'connect';
        } else {
            this.startCanvasPan(pos);
        }
    }

    // 🖱️ 开始节点拖拽
    private startNodeDrag(nodeId: string, pos: { x: number; y: number }): void {
        this.state.dragState.isDragging = true;
        this.state.dragState.dragType = 'node';
        this.state.dragState.startPos = pos;
        this.state.dragState.draggedNodes = this.state.selectedNodes.includes(nodeId) 
            ? [...this.state.selectedNodes] 
            : [nodeId];

        // 标记被拖拽的节点
        this.state.dragState.draggedNodes.forEach(id => {
            const node = this.state.nodes.find(n => n.id === id);
            if (node) {node.dragging = true;}
        });
    }

    // 🔗 开始连接拖拽
    private handleConnectionDrag(nodeId: string, portId: string, pos: { x: number; y: number }): void {
        this.state.dragState.isDragging = true;
        this.state.dragState.dragType = 'connection';
        this.state.dragState.startPos = pos;
        this.state.dragState.tempConnection = {
            sourceNode: nodeId,
            sourcePort: portId,
            targetPos: pos
        };
    }

    // 🖼️ 开始画布平移
    private startCanvasPan(pos: { x: number; y: number }): void {
        this.state.dragState.isDragging = true;
        this.state.dragState.dragType = 'canvas';
        this.state.dragState.startPos = pos;
    }

    // 🏃 处理拖拽移动
    private handleDragMove(pos: { x: number; y: number }): void {
        const deltaX = pos.x - this.state.dragState.startPos.x;
        const deltaY = pos.y - this.state.dragState.startPos.y;

        switch (this.state.dragState.dragType) {
            case 'node':
                this.updateNodePositions(deltaX, deltaY);
                break;
            case 'connection':
                this.updateTempConnection(pos);
                break;
            case 'canvas':
                this.updateViewport(deltaX, deltaY);
                break;
        }
    }

    // 📍 更新节点位置
    private updateNodePositions(deltaX: number, deltaY: number): void {
        this.state.dragState.draggedNodes.forEach(nodeId => {
            const node = this.state.nodes.find(n => n.id === nodeId);
            if (node) {
                node.position.x += deltaX / this.state.viewport.zoom;
                node.position.y += deltaY / this.state.viewport.zoom;
                this.updateNodeConnections(nodeId);
            }
        });

        this.state.dragState.startPos = this.state.dragState.currentPos;
    }

    // 🔗 更新临时连接
    private updateTempConnection(pos: { x: number; y: number }): void {
        if (this.state.dragState.tempConnection) {
            this.state.dragState.tempConnection.targetPos = pos;
        }
    }

    // 🖼️ 更新视口
    private updateViewport(deltaX: number, deltaY: number): void {
        this.state.viewport.x += deltaX;
        this.state.viewport.y += deltaY;
        this.state.dragState.startPos = this.state.dragState.currentPos;
    }

    // 🛑 处理拖拽结束
    private handleDragEnd(pos: { x: number; y: number }): void {
        if (this.state.dragState.dragType === 'connection') {
            this.finishConnection(pos);
        }

        // 清除拖拽状态
        this.state.nodes.forEach(node => {
            node.dragging = false;
        });
    }

    // ✅ 完成连接
    private finishConnection(pos: { x: number; y: number }): void {
        const tempConn = this.state.dragState.tempConnection;
        if (!tempConn) {return;}

        const targetElement = this.getElementAtPosition(pos);
        
        if (targetElement && targetElement.type === 'port' && 
            targetElement.nodeId !== tempConn.sourceNode) {
            
            const connection: NodeConnection = {
                id: this.generateId(),
                source: tempConn.sourceNode,
                target: targetElement.nodeId,
                sourcePort: tempConn.sourcePort,
                targetPort: targetElement.portId,
                type: 'data-flow'
            };

            this.addConnection(connection);
        }
    }

    // 🎚️ 处理滚轮缩放
    private onWheel(event: WheelEvent): void {
        if (event.ctrlKey) {
            event.preventDefault();
            const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
            this.zoomAt(this.getCanvasPosition(event), zoomFactor);
        }
    }

    // 🔍 在指定位置缩放
    private zoomAt(pos: { x: number; y: number }, factor: number): void {
        const oldZoom = this.state.viewport.zoom;
        this.state.viewport.zoom = Math.max(0.1, Math.min(3.0, oldZoom * factor));
        
        // 调整视口位置以保持缩放中心
        const zoomChange = this.state.viewport.zoom / oldZoom;
        this.state.viewport.x = pos.x - (pos.x - this.state.viewport.x) * zoomChange;
        this.state.viewport.y = pos.y - (pos.y - this.state.viewport.y) * zoomChange;
        
        this.render();
    }

    // ⌨️ 键盘事件处理
    private onKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelected();
                break;
            case 'Escape':
                this.clearSelection();
                this.state.mode = 'select';
                break;
            case 'a':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.selectAll();
                }
                break;
            case 'c':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.copySelected();
                }
                break;
            case 'v':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.pasteNodes();
                }
                break;
            case 'z':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                }
                break;
        }
    }

    // 📍 获取画布坐标
    private getCanvasPosition(event: MouseEvent): { x: number; y: number } {
        if (!this.canvas) {return { x: 0, y: 0 };}
        
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left - this.state.viewport.x) / this.state.viewport.zoom,
            y: (event.clientY - rect.top - this.state.viewport.y) / this.state.viewport.zoom
        };
    }

    // 🎯 获取位置上的元素
    private getElementAtPosition(pos: { x: number; y: number }): any {
        // 检查节点
        for (const node of this.state.nodes) {
            if (this.isPointInNode(pos, node)) {
                // 检查端口
                for (const port of [...node.inputs, ...node.outputs]) {
                    if (this.isPointInPort(pos, port, node)) {
                        return { type: 'port', nodeId: node.id, portId: port.id };
                    }
                }
                return { type: 'node', id: node.id };
            }
        }

        // 检查连接
        for (const connection of this.state.connections) {
            if (this.isPointInConnection(pos, connection)) {
                return { type: 'connection', id: connection.id };
            }
        }

        return null;
    }

    // 📏 检查点是否在节点内
    private isPointInNode(pos: { x: number; y: number }, node: CanvasNode): boolean {
        return pos.x >= node.position.x && pos.x <= node.position.x + node.size.width &&
               pos.y >= node.position.y && pos.y <= node.position.y + node.size.height;
    }

    // 📏 检查点是否在端口内
    private isPointInPort(pos: { x: number; y: number }, port: PortInfo, node: CanvasNode): boolean {
        const portPos = {
            x: node.position.x + port.position.x,
            y: node.position.y + port.position.y
        };
        const distance = Math.sqrt(
            Math.pow(pos.x - portPos.x, 2) + Math.pow(pos.y - portPos.y, 2)
        );
        return distance <= 8; // 端口半径
    }

    // 📏 检查点是否在连接线上
    private isPointInConnection(pos: { x: number; y: number }, connection: NodeConnection): boolean {
        const sourceNode = this.state.nodes.find(n => n.id === connection.source);
        const targetNode = this.state.nodes.find(n => n.id === connection.target);
        
        if (!sourceNode || !targetNode) {return false;}

        // 简化：检查点到线段的距离
        const sourcePos = { x: sourceNode.position.x + sourceNode.size.width, y: sourceNode.position.y + sourceNode.size.height / 2 };
        const targetPos = { x: targetNode.position.x, y: targetNode.position.y + targetNode.size.height / 2 };
        
        const distance = this.pointToLineDistance(pos, sourcePos, targetPos);
        return distance <= 5; // 连接线宽度容差
    }

    // 📐 计算点到线段的距离
    private pointToLineDistance(
        point: { x: number; y: number },
        lineStart: { x: number; y: number },
        lineEnd: { x: number; y: number }
    ): number {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) {return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));}
        
        const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)));
        const projection = {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy
        };
        
        return Math.sqrt(Math.pow(point.x - projection.x, 2) + Math.pow(point.y - projection.y, 2));
    }

    // 🎨 渲染画布
    private render(): void {
        if (!this.canvas) {return;}

        this.canvas.innerHTML = '';
        
        // 创建SVG容器
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';

        // 应用视口变换
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${this.state.viewport.x}, ${this.state.viewport.y}) scale(${this.state.viewport.zoom})`);

        // 渲染连接线
        this.renderConnections(g);
        
        // 渲染临时连接线
        this.renderTempConnection(g);
        
        // 渲染节点
        this.renderNodes(g);

        svg.appendChild(g);
        this.canvas.appendChild(svg);
    }

    // 🔗 渲染连接线
    private renderConnections(container: SVGElement): void {
        this.state.connections.forEach(connection => {
            const line = this.createConnectionElement(connection);
            if (line) {container.appendChild(line);}
        });
    }

    // ⚡ 渲染临时连接线
    private renderTempConnection(container: SVGElement): void {
        const tempConn = this.state.dragState.tempConnection;
        if (!tempConn) {return;}

        const sourceNode = this.state.nodes.find(n => n.id === tempConn.sourceNode);
        if (!sourceNode) {return;}

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(sourceNode.position.x + sourceNode.size.width));
        line.setAttribute('y1', String(sourceNode.position.y + sourceNode.size.height / 2));
        line.setAttribute('x2', String(tempConn.targetPos.x));
        line.setAttribute('y2', String(tempConn.targetPos.y));
        line.setAttribute('stroke', '#60a5fa');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        line.style.pointerEvents = 'none';

        container.appendChild(line);
    }

    // 🔴 渲染节点
    private renderNodes(container: SVGElement): void {
        this.state.nodes.forEach(node => {
            const nodeElement = this.createNodeElement(node);
            if (nodeElement) {container.appendChild(nodeElement);}
        });
    }

    // 🔗 创建连接元素
    private createConnectionElement(connection: NodeConnection): SVGElement | null {
        const sourceNode = this.state.nodes.find(n => n.id === connection.source);
        const targetNode = this.state.nodes.find(n => n.id === connection.target);
        
        if (!sourceNode || !targetNode) {return null;}

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(sourceNode.position.x + sourceNode.size.width));
        line.setAttribute('y1', String(sourceNode.position.y + sourceNode.size.height / 2));
        line.setAttribute('x2', String(targetNode.position.x));
        line.setAttribute('y2', String(targetNode.position.y + targetNode.size.height / 2));
        line.setAttribute('stroke', this.getConnectionColor(connection.type));
        line.setAttribute('stroke-width', '2');
        line.setAttribute('data-connection-id', connection.id);
        line.style.cursor = 'pointer';

        if (this.state.selectedConnections.includes(connection.id)) {
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '5,5');
        }

        return line;
    }

    // 🔴 创建节点元素
    private createNodeElement(node: CanvasNode): SVGElement | null {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('data-node-id', node.id);
        g.style.cursor = node.dragging ? 'grabbing' : 'grab';

        // 节点背景
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(node.position.x));
        rect.setAttribute('y', String(node.position.y));
        rect.setAttribute('width', String(node.size.width));
        rect.setAttribute('height', String(node.size.height));
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', this.getNodeColor(node.type));
        rect.setAttribute('stroke', node.selected ? '#60a5fa' : '#374151');
        rect.setAttribute('stroke-width', node.selected ? '2' : '1');

        // 节点标题
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(node.position.x + node.size.width / 2));
        text.setAttribute('y', String(node.position.y + 20));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.textContent = node.data.name || node.type;

        g.appendChild(rect);
        g.appendChild(text);

        // 渲染端口
        this.renderNodePorts(g, node);

        return g;
    }

    // 🔌 渲染节点端口
    private renderNodePorts(container: SVGElement, node: CanvasNode): void {
        // 输入端口
        node.inputs.forEach((port, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const x = node.position.x - 6;
            const y = node.position.y + 30 + index * 20;
            
            circle.setAttribute('cx', String(x));
            circle.setAttribute('cy', String(y));
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', this.getPortColor(port.type));
            circle.setAttribute('stroke', '#374151');
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('data-port-id', port.id);
            circle.setAttribute('data-node-id', node.id);
            circle.style.cursor = 'crosshair';

            port.position = { x: x - node.position.x, y: y - node.position.y };
            container.appendChild(circle);
        });

        // 输出端口
        node.outputs.forEach((port, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const x = node.position.x + node.size.width + 6;
            const y = node.position.y + 30 + index * 20;
            
            circle.setAttribute('cx', String(x));
            circle.setAttribute('cy', String(y));
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', this.getPortColor(port.type));
            circle.setAttribute('stroke', '#374151');
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('data-port-id', port.id);
            circle.setAttribute('data-node-id', node.id);
            circle.style.cursor = 'crosshair';

            port.position = { x: x - node.position.x, y: y - node.position.y };
            container.appendChild(circle);
        });
    }

    // 🎨 获取节点颜色
    private getNodeColor(nodeType: string): string {
        const colors: Record<string, string> = {
            'reactComponent': '#61dafb',
            'rustStruct': '#ce422b',
            'function': '#f59e0b',
            'data': '#10b981',
            'control': '#8b5cf6'
        };
        return colors[nodeType] || '#6b7280';
    }

    // 🎨 获取端口颜色
    private getPortColor(portType: string): string {
        const colors: Record<string, string> = {
            'data': '#10b981',
            'event': '#f59e0b',
            'control': '#8b5cf6',
            'string': '#3b82f6',
            'number': '#06b6d4',
            'boolean': '#84cc16'
        };
        return colors[portType] || '#6b7280';
    }

    // 🎨 获取连接颜色
    private getConnectionColor(connectionType: string): string {
        const colors: Record<string, string> = {
            'data-flow': '#10b981',
            'control-flow': '#8b5cf6',
            'dependency': '#f59e0b'
        };
        return colors[connectionType] || '#6b7280';
    }

    // 🎯 节点选择操作
    private selectNode(nodeId: string): void {
        this.state.selectedNodes = [nodeId];
        this.state.selectedConnections = [];
        this.updateNodeSelection();
    }

    private toggleNodeSelection(nodeId: string): void {
        const index = this.state.selectedNodes.indexOf(nodeId);
        if (index >= 0) {
            this.state.selectedNodes.splice(index, 1);
        } else {
            this.state.selectedNodes.push(nodeId);
        }
        this.updateNodeSelection();
    }

    private selectConnection(connectionId: string): void {
        this.state.selectedConnections = [connectionId];
        this.state.selectedNodes = [];
        this.updateNodeSelection();
    }

    private toggleConnectionSelection(connectionId: string): void {
        const index = this.state.selectedConnections.indexOf(connectionId);
        if (index >= 0) {
            this.state.selectedConnections.splice(index, 1);
        } else {
            this.state.selectedConnections.push(connectionId);
        }
    }

    private clearSelection(): void {
        this.state.selectedNodes = [];
        this.state.selectedConnections = [];
        this.updateNodeSelection();
    }

    private selectAll(): void {
        this.state.selectedNodes = this.state.nodes.map(n => n.id);
        this.state.selectedConnections = [];
        this.updateNodeSelection();
    }

    private updateNodeSelection(): void {
        this.state.nodes.forEach(node => {
            node.selected = this.state.selectedNodes.includes(node.id);
        });
        this.render();
    }

    // 🔧 辅助方法
    private addEventListener(element: EventTarget, event: string, listener: EventListener): void {
        element.addEventListener(event, listener);
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(listener);
    }

    private generateId(): string {
        return `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    }

    private onContextMenu(event: MouseEvent): void {
        event.preventDefault();
        // 显示上下文菜单
    }

    private onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    private onDrop(event: DragEvent): void {
        event.preventDefault();
        // 处理节点拖放
    }

    private onKeyUp(event: KeyboardEvent): void {
        // 处理按键抬起
    }

    private onResize(): void {
        this.render();
    }

    private onHover(pos: { x: number; y: number }): void {
        // 处理悬停效果
    }

    private handleHover(pos: { x: number; y: number }): void {
        // 实现悬停逻辑
    }

    private updateNodeConnections(nodeId: string): void {
        // 更新节点连接位置
        this.state.connections.forEach(conn => {
            if (conn.source === nodeId || conn.target === nodeId) {
                // 重新计算连接位置
            }
        });
    }

    private addConnection(connection: NodeConnection): void {
        this.state.connections.push(connection);
        this.render();
    }

    private deleteSelected(): void {
        // 删除选中的节点和连接
        this.state.nodes = this.state.nodes.filter(n => !this.state.selectedNodes.includes(n.id));
        this.state.connections = this.state.connections.filter(c => !this.state.selectedConnections.includes(c.id));
        this.clearSelection();
        this.render();
    }

    private copySelected(): void {
        // 复制选中元素
    }

    private pasteNodes(): void {
        // 粘贴节点
    }

    private undo(): void {
        // 撤销操作
    }

    private redo(): void {
        // 重做操作
    }

    private initializeNodeTemplates(): void {
        // 初始化节点模板
    }

    // 🚀 公共API
    public addNode(node: CanvasNode): void {
        this.state.nodes.push(node);
        this.render();
    }

    public removeNode(nodeId: string): void {
        this.state.nodes = this.state.nodes.filter(n => n.id !== nodeId);
        this.state.connections = this.state.connections.filter(c => c.source !== nodeId && c.target !== nodeId);
        this.render();
    }

    public getSelectedNodes(): CanvasNode[] {
        return this.state.nodes.filter(n => this.state.selectedNodes.includes(n.id));
    }

    public getCanvasState(): CanvasState {
        return { ...this.state };
    }

    public setCanvasState(state: Partial<CanvasState>): void {
        this.state = { ...this.state, ...state };
        this.render();
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
        this.render();
    }
}
