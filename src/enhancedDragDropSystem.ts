// 🎨 增强交互式画布拖拽系统
import * as vscode from 'vscode';

// VS Code Webview环境的类型定义
declare global {
    interface Window {
        acquireVsCodeApi(): any;
    }
}

export interface DragDropManager {
    isDragging: boolean;
    draggedElement: CanvasNode | null;
    dropZones: DropZone[];
    ghostElement: HTMLElement | null;
}

export interface DropZone {
    id: string;
    element: HTMLElement;
    accepts: string[];
    onDrop: (draggedNode: CanvasNode) => void;
    highlight: boolean;
}

export interface CanvasNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    data: any;
    connections: string[];
}

export class EnhancedDragDropSystem {
    private manager: DragDropManager;
    private canvas: HTMLElement;
    private nodes: Map<string, CanvasNode> = new Map();
    
    constructor(canvasElement: HTMLElement) {
        this.canvas = canvasElement;
        this.manager = {
            isDragging: false,
            draggedElement: null,
            dropZones: [],
            ghostElement: null
        };
        
        this.initializeDragDrop();
    }
    
    // 🚀 初始化拖拽系统
    private initializeDragDrop(): void {
        // 启用拖拽
        this.canvas.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.canvas.addEventListener('dragover', this.handleDragOver.bind(this));
        this.canvas.addEventListener('dragenter', this.handleDragEnter.bind(this));
        this.canvas.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.canvas.addEventListener('drop', this.handleDrop.bind(this));
        this.canvas.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // 鼠标事件（备用）
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // 触摸事件（移动端支持）
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    // 📱 创建可拖拽节点
    public createDraggableNode(nodeConfig: {
        id: string;
        type: string;
        label: string;
        icon?: string;
        position: { x: number; y: number };
        data: any;
    }): HTMLElement {
        const nodeElement = document.createElement('div');
        nodeElement.className = `canvas-node node-${nodeConfig.type}`;
        nodeElement.draggable = true;
        nodeElement.id = nodeConfig.id;
        
        // 设置位置
        nodeElement.style.left = `${nodeConfig.position.x}px`;
        nodeElement.style.top = `${nodeConfig.position.y}px`;
        nodeElement.style.position = 'absolute';
        nodeElement.style.cursor = 'move';
        
        // 节点内容
        nodeElement.innerHTML = `
            <div class="node-header">
                ${nodeConfig.icon ? `<span class="node-icon">${nodeConfig.icon}</span>` : ''}
                <span class="node-label">${nodeConfig.label}</span>
                <button class="node-delete" onclick="this.deleteNode('${nodeConfig.id}')">×</button>
            </div>
            <div class="node-body">
                <div class="node-inputs"></div>
                <div class="node-outputs"></div>
            </div>
            <div class="node-resize-handle"></div>
        `;
        
        // 添加样式
        this.applyNodeStyles(nodeElement, nodeConfig.type);
        
        // 存储节点数据
        const node: CanvasNode = {
            id: nodeConfig.id,
            type: nodeConfig.type,
            position: nodeConfig.position,
            size: { width: 200, height: 100 },
            data: nodeConfig.data,
            connections: []
        };
        
        this.nodes.set(nodeConfig.id, node);
        
        // 添加到画布
        this.canvas.appendChild(nodeElement);
        
        // 启用调整大小
        this.enableResize(nodeElement);
        
        return nodeElement;
    }
    
    // 🎨 应用节点样式
    private applyNodeStyles(element: HTMLElement, nodeType: string): void {
        const styles: Record<string, string> = {
            reactComponent: `
                background: linear-gradient(135deg, #61dafb 0%, #21a9c7 100%);
                border: 2px solid #61dafb;
                color: white;
            `,
            rustStruct: `
                background: linear-gradient(135deg, #dea584 0%, #ce6f3e 100%);
                border: 2px solid #dea584;
                color: white;
            `,
            rustService: `
                background: linear-gradient(135deg, #f74c00 0%, #d63031 100%);
                border: 2px solid #f74c00;
                color: white;
            `,
            database: `
                background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
                border: 2px solid #00b894;
                color: white;
            `,
            api: `
                background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
                border: 2px solid #a29bfe;
                color: white;
            `
        };
        
        const baseStyle = `
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            min-width: 160px;
            min-height: 80px;
            user-select: none;
        `;
        
        element.style.cssText = baseStyle + (styles[nodeType] || styles.reactComponent);
        
        // 悬停效果
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'scale(1.05)';
            element.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
        });
        
        element.addEventListener('mouseleave', () => {
            if (!this.manager.isDragging) {
                element.style.transform = 'scale(1)';
                element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }
        });
    }
    
    // 📏 启用节点调整大小
    private enableResize(nodeElement: HTMLElement): void {
        const resizeHandle = nodeElement.querySelector('.node-resize-handle') as HTMLElement;
        if (!resizeHandle) return;
        
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            background: rgba(255,255,255,0.8);
            cursor: se-resize;
            border-radius: 0 0 8px 0;
        `;
        
        let isResizing = false;
        let startX = 0, startY = 0, startWidth = 0, startHeight = 0;
        
        resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView!.getComputedStyle(nodeElement).width, 10);
            startHeight = parseInt(document.defaultView!.getComputedStyle(nodeElement).height, 10);
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            
            const newWidth = startWidth + e.clientX - startX;
            const newHeight = startHeight + e.clientY - startY;
            
            nodeElement.style.width = Math.max(160, newWidth) + 'px';
            nodeElement.style.height = Math.max(80, newHeight) + 'px';
            
            // 更新节点数据
            const nodeId = nodeElement.id;
            const node = this.nodes.get(nodeId);
            if (node) {
                node.size.width = Math.max(160, newWidth);
                node.size.height = Math.max(80, newHeight);
            }
        };
        
        const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }
    
    // 🖱️ 拖拽开始
    private handleDragStart(e: DragEvent): void {
        const target = e.target as HTMLElement;
        const nodeElement = target.closest('.canvas-node') as HTMLElement;
        
        if (!nodeElement) return;
        
        this.manager.isDragging = true;
        const nodeId = nodeElement.id;
        const node = this.nodes.get(nodeId);
        
        if (node) {
            this.manager.draggedElement = node;
            
            // 创建拖拽预览
            this.createDragPreview(nodeElement);
            
            // 设置拖拽数据
            e.dataTransfer?.setData('text/plain', nodeId);
            e.dataTransfer!.effectAllowed = 'move';
            
            // 高亮潜在的放置区域
            this.highlightDropZones(node.type);
            
            // 添加拖拽样式
            nodeElement.style.opacity = '0.5';
            nodeElement.classList.add('dragging');
        }
    }
    
    // 👻 创建拖拽预览
    private createDragPreview(nodeElement: HTMLElement): void {
        const ghost = nodeElement.cloneNode(true) as HTMLElement;
        ghost.id = 'drag-ghost';
        ghost.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            opacity: 0.8;
            transform: rotate(5deg) scale(0.9);
            transition: none;
        `;
        
        document.body.appendChild(ghost);
        this.manager.ghostElement = ghost;
    }
    
    // 🎯 处理拖拽悬停
    private handleDragOver(e: DragEvent): void {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        
        // 更新幽灵元素位置
        if (this.manager.ghostElement) {
            this.manager.ghostElement.style.left = `${e.clientX - 100}px`;
            this.manager.ghostElement.style.top = `${e.clientY - 50}px`;
        }
        
        // 检查是否在有效的放置区域
        const dropZone = this.getDropZoneAt(e.clientX, e.clientY);
        if (dropZone && this.canDrop(this.manager.draggedElement, dropZone)) {
            this.highlightDropZone(dropZone, true);
        }
    }
    
    // 📍 处理放置
    private handleDrop(e: DragEvent): void {
        e.preventDefault();
        
        const nodeId = e.dataTransfer?.getData('text/plain');
        const node = nodeId ? this.nodes.get(nodeId) : null;
        
        if (!node) return;
        
        // 计算相对于画布的位置
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 更新节点位置
        this.updateNodePosition(nodeId!, { x, y });
        
        // 检查连接
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        if (targetElement) {
            const targetNode = targetElement.closest('.canvas-node') as HTMLElement;
            if (targetNode && targetNode.id !== nodeId) {
                this.createConnection(nodeId!, targetNode.id);
            }
        }
        
        vscode.postMessage({
            command: 'nodeMoved',
            nodeId: nodeId,
            position: { x, y }
        });
    }
    
    // 🔗 创建节点连接
    private createConnection(sourceId: string, targetId: string): void {
        const sourceNode = this.nodes.get(sourceId);
        const targetNode = this.nodes.get(targetId);
        
        if (!sourceNode || !targetNode) return;
        
        // 避免重复连接
        if (sourceNode.connections.includes(targetId)) return;
        
        // 添加连接
        sourceNode.connections.push(targetId);
        
        // 绘制连接线
        this.drawConnection(sourceId, targetId);
        
        // 通知扩展
        vscode.postMessage({
            command: 'connectionCreated',
            source: sourceId,
            target: targetId
        });
    }
    
    // ✏️ 绘制连接线
    private drawConnection(sourceId: string, targetId: string): void {
        const sourceElement = document.getElementById(sourceId);
        const targetElement = document.getElementById(targetId);
        
        if (!sourceElement || !targetElement) return;
        
        const svg = document.getElementById('connections-svg') || this.createConnectionsSVG();
        
        const sourceRect = sourceElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const startX = sourceRect.right - canvasRect.left;
        const startY = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
        const endX = targetRect.left - canvasRect.left;
        const endY = targetRect.top + targetRect.height / 2 - canvasRect.top;
        
        // 创建贝塞尔曲线路径
        const controlOffset = Math.abs(endX - startX) * 0.5;
        const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
        
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', path);
        pathElement.setAttribute('stroke', '#4a90e2');
        pathElement.setAttribute('stroke-width', '2');
        pathElement.setAttribute('fill', 'none');
        pathElement.setAttribute('id', `connection-${sourceId}-${targetId}`);
        pathElement.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))';
        
        // 添加动画
        pathElement.style.strokeDasharray = '5,5';
        pathElement.style.animation = 'dash 1s linear infinite';
        
        svg.appendChild(pathElement);
    }
    
    // 🖼️ 创建连接线SVG容器
    private createConnectionsSVG(): SVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'connections-svg';
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        
        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes dash {
                to { stroke-dashoffset: -10; }
            }
        `;
        document.head.appendChild(style);
        
        this.canvas.appendChild(svg);
        return svg;
    }
    
    // 📍 更新节点位置
    private updateNodePosition(nodeId: string, position: { x: number; y: number }): void {
        const nodeElement = document.getElementById(nodeId);
        const node = this.nodes.get(nodeId);
        
        if (nodeElement && node) {
            // 边界检测
            const canvasRect = this.canvas.getBoundingClientRect();
            const nodeRect = nodeElement.getBoundingClientRect();
            
            const x = Math.max(0, Math.min(position.x, canvasRect.width - nodeRect.width));
            const y = Math.max(0, Math.min(position.y, canvasRect.height - nodeRect.height));
            
            nodeElement.style.left = `${x}px`;
            nodeElement.style.top = `${y}px`;
            
            node.position = { x, y };
            
            // 更新连接线
            this.updateConnections(nodeId);
        }
    }
    
    // 🔄 更新节点连接
    private updateConnections(nodeId: string): void {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // 更新该节点的所有连接
        node.connections.forEach(targetId => {
            const connectionElement = document.getElementById(`connection-${nodeId}-${targetId}`);
            if (connectionElement) {
                connectionElement.remove();
                this.drawConnection(nodeId, targetId);
            }
        });
        
        // 更新连接到该节点的连接
        this.nodes.forEach((otherNode, otherId) => {
            if (otherNode.connections.includes(nodeId)) {
                const connectionElement = document.getElementById(`connection-${otherId}-${nodeId}`);
                if (connectionElement) {
                    connectionElement.remove();
                    this.drawConnection(otherId, nodeId);
                }
            }
        });
    }
    
    // 🧹 拖拽结束清理
    private handleDragEnd(e: DragEvent): void {
        this.manager.isDragging = false;
        this.manager.draggedElement = null;
        
        // 移除幽灵元素
        if (this.manager.ghostElement) {
            this.manager.ghostElement.remove();
            this.manager.ghostElement = null;
        }
        
        // 恢复所有节点样式
        const nodes = this.canvas.querySelectorAll('.canvas-node');
        nodes.forEach(node => {
            (node as HTMLElement).style.opacity = '1';
            node.classList.remove('dragging');
        });
        
        // 清除放置区域高亮
        this.clearDropZoneHighlights();
    }
    
    // 🔍 获取指定位置的放置区域
    private getDropZoneAt(x: number, y: number): DropZone | null {
        return this.manager.dropZones.find(zone => {
            const rect = zone.element.getBoundingClientRect();
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        }) || null;
    }
    
    // ✅ 检查是否可以放置
    private canDrop(draggedNode: CanvasNode | null, dropZone: DropZone): boolean {
        if (!draggedNode) return false;
        return dropZone.accepts.includes(draggedNode.type) || dropZone.accepts.includes('*');
    }
    
    // 💡 高亮放置区域
    private highlightDropZones(nodeType: string): void {
        this.manager.dropZones.forEach(zone => {
            if (zone.accepts.includes(nodeType) || zone.accepts.includes('*')) {
                zone.element.classList.add('drop-zone-active');
            }
        });
    }
    
    private highlightDropZone(dropZone: DropZone, highlight: boolean): void {
        if (highlight) {
            dropZone.element.classList.add('drop-zone-hover');
        } else {
            dropZone.element.classList.remove('drop-zone-hover');
        }
    }
    
    private clearDropZoneHighlights(): void {
        this.manager.dropZones.forEach(zone => {
            zone.element.classList.remove('drop-zone-active', 'drop-zone-hover');
        });
    }
    
    // === 鼠标和触摸事件处理 ===
    private handleMouseDown(e: MouseEvent): void {
        // 鼠标拖拽备用实现
    }
    
    private handleMouseMove(e: MouseEvent): void {
        // 鼠标移动处理
    }
    
    private handleMouseUp(e: MouseEvent): void {
        // 鼠标释放处理
    }
    
    private handleTouchStart(e: TouchEvent): void {
        // 触摸开始处理
    }
    
    private handleTouchMove(e: TouchEvent): void {
        // 触摸移动处理
    }
    
    private handleTouchEnd(e: TouchEvent): void {
        // 触摸结束处理
    }
    
    private handleDragEnter(e: DragEvent): void {
        e.preventDefault();
    }
    
    private handleDragLeave(e: DragEvent): void {
        // 处理拖拽离开
    }
    
    // 🗑️ 删除节点
    public deleteNode(nodeId: string): void {
        const nodeElement = document.getElementById(nodeId);
        const node = this.nodes.get(nodeId);
        
        if (nodeElement && node) {
            // 删除连接
            node.connections.forEach(targetId => {
                const connectionElement = document.getElementById(`connection-${nodeId}-${targetId}`);
                connectionElement?.remove();
            });
            
            // 删除连接到此节点的连接
            this.nodes.forEach((otherNode, otherId) => {
                const index = otherNode.connections.indexOf(nodeId);
                if (index > -1) {
                    otherNode.connections.splice(index, 1);
                    const connectionElement = document.getElementById(`connection-${otherId}-${nodeId}`);
                    connectionElement?.remove();
                }
            });
            
            // 删除节点
            nodeElement.remove();
            this.nodes.delete(nodeId);
            
            vscode.postMessage({
                command: 'nodeDeleted',
                nodeId: nodeId
            });
        }
    }
    
    // 📊 获取所有节点数据
    public getNodesData(): CanvasNode[] {
        return Array.from(this.nodes.values());
    }
}

// CSS样式注入
const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .canvas-node {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            user-select: none;
            cursor: move;
        }
        
        .canvas-node.dragging {
            z-index: 1000;
        }
        
        .node-header {
            padding: 8px 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .node-icon {
            margin-right: 8px;
            font-size: 16px;
        }
        
        .node-delete {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .node-delete:hover {
            background: rgba(255,0,0,0.5);
        }
        
        .drop-zone-active {
            outline: 2px dashed #4a90e2;
            background: rgba(74, 144, 226, 0.1);
        }
        
        .drop-zone-hover {
            background: rgba(74, 144, 226, 0.2);
            outline-color: #2ecc71;
        }
    `;
    document.head.appendChild(style);
};

// 导出
export { EnhancedDragDropSystem, injectStyles };
