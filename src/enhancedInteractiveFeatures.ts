// 🎯 交互式画布增强功能
import * as vscode from 'vscode';
import { CanvasNode, NodeConnection, InteractiveCanvasProvider, ViewportState, ContentBounds } from './interactiveCanvasProvider';

// 现有接口扩展
export interface EnhancedCanvasNode extends CanvasNode {
    selected?: boolean;
    locked?: boolean;
    collapsed?: boolean;
    style?: NodeStyle;
    metadata?: NodeMetadata;
}

export interface NodeStyle {
    width?: number;
    height?: number;
    backgroundColor?: string;
    borderColor?: string;
    fontSize?: number;
    opacity?: number;
}

export interface NodeMetadata {
    tags?: string[];
    lastModified?: Date;
    author?: string;
    version?: string;
    description?: string;
}

export interface SelectionArea {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface ViewportState {
    zoom: number;
    panX: number;
    panY: number;
    centerX: number;
    centerY: number;
}

export interface TouchGesture {
    type: 'pinch' | 'pan' | 'tap' | 'long-press';
    scale?: number;
    deltaX?: number;
    deltaY?: number;
    duration?: number;
}

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: string;
}

// 🚀 增强功能类
export class EnhancedInteractiveFeatures {
    private selectedNodes: Set<string> = new Set();
    private dragState: DragState | null = null;
    private selectionArea: SelectionArea | null = null;
    private viewport: ViewportState = { zoom: 1, panX: 0, panY: 0, centerX: 0, centerY: 0 };
    private keyboardShortcuts: Map<string, KeyboardShortcut> = new Map();
    private touchState: TouchState | null = null;

    constructor(private canvas: InteractiveCanvasProvider) {
        this.initializeKeyboardShortcuts();
        this.setupEventListeners();
    }

    // 🎯 多选功能
    public enableMultiSelection(): void {
        // Ctrl+点击多选
        // 框选功能
        // 全选/反选
    }

    public selectNodes(nodeIds: string[]): void {
        this.selectedNodes.clear();
        nodeIds.forEach(id => this.selectedNodes.add(id));
        this.updateSelectionUI();
    }

    public toggleNodeSelection(nodeId: string): void {
        if (this.selectedNodes.has(nodeId)) {
            this.selectedNodes.delete(nodeId);
        } else {
            this.selectedNodes.add(nodeId);
        }
        this.updateSelectionUI();
    }

    public selectAll(): void {
        this.canvas.getAllNodes().forEach(node => {
            this.selectedNodes.add(node.id);
        });
        this.updateSelectionUI();
    }

    public clearSelection(): void {
        this.selectedNodes.clear();
        this.updateSelectionUI();
    }

    // 🎯 框选功能
    public startSelectionArea(x: number, y: number): void {
        this.selectionArea = { startX: x, startY: y, endX: x, endY: y };
    }

    public updateSelectionArea(x: number, y: number): void {
        if (this.selectionArea) {
            this.selectionArea.endX = x;
            this.selectionArea.endY = y;
            this.highlightNodesInSelection();
        }
    }

    public endSelectionArea(): void {
        if (this.selectionArea) {
            const nodesInArea = this.getNodesInSelectionArea(this.selectionArea);
            this.selectNodes(nodesInArea.map(n => n.id));
        }
        this.selectionArea = null;
    }

    // 🎯 双击编辑功能
    public enableDoubleClickEdit(): void {
        // 双击节点直接编辑名称
        // 双击连线编辑标签
        // 双击空白区域创建新节点
    }

    public handleDoubleClick(target: 'node' | 'connection' | 'canvas', id?: string): void {
        switch (target) {
            case 'node':
                if (id) this.editNodeInline(id);
                break;
            case 'connection':
                if (id) this.editConnectionLabel(id);
                break;
            case 'canvas':
                this.createNodeAtCursor();
                break;
        }
    }

    private editNodeInline(nodeId: string): void {
        // 显示内联编辑器
        vscode.window.showInputBox({
            prompt: '编辑节点名称',
            value: this.canvas.getNode(nodeId)?.data.name || ''
        }).then(newName => {
            if (newName) {
                this.canvas.updateNodeName(nodeId, newName);
            }
        });
    }

    // 🎯 高级拖拽功能
    public enableAdvancedDrag(): void {
        // 磁性对齐
        // 批量拖拽
        // 约束拖拽
        // 拖拽预览
    }

    public startDrag(nodeIds: string[], startX: number, startY: number): void {
        this.dragState = {
            nodeIds,
            startX,
            startY,
            currentX: startX,
            currentY: startY,
            snapToGrid: vscode.workspace.getConfiguration('visualProgramming').get('snapToGrid', true)
        };
    }

    public updateDrag(currentX: number, currentY: number): void {
        if (!this.dragState) return;

        const deltaX = currentX - this.dragState.startX;
        const deltaY = currentY - this.dragState.startY;

        // 磁性对齐
        if (this.dragState.snapToGrid) {
            const gridSize = 20;
            const snappedDeltaX = Math.round(deltaX / gridSize) * gridSize;
            const snappedDeltaY = Math.round(deltaY / gridSize) * gridSize;
            this.previewNodePositions(this.dragState.nodeIds, snappedDeltaX, snappedDeltaY);
        } else {
            this.previewNodePositions(this.dragState.nodeIds, deltaX, deltaY);
        }
    }

    public endDrag(): void {
        if (this.dragState) {
            // 应用最终位置
            this.applyDraggedPositions();
            this.dragState = null;
        }
    }

    // 🎯 视口控制 (缩放/平移)
    public enableViewportControls(): void {
        // 鼠标滚轮缩放
        // 拖拽平移
        // 缩放边界限制
        // 适应窗口大小
    }

    public zoomIn(centerX?: number, centerY?: number): void {
        const zoomFactor = 1.2;
        const newZoom = Math.min(this.viewport.zoom * zoomFactor, 3.0); // 最大3倍
        this.setZoom(newZoom, centerX, centerY);
    }

    public zoomOut(centerX?: number, centerY?: number): void {
        const zoomFactor = 0.8;
        const newZoom = Math.max(this.viewport.zoom * zoomFactor, 0.2); // 最小0.2倍
        this.setZoom(newZoom, centerX, centerY);
    }

    public zoomToFit(): void {
        const bounds = this.canvas.getContentBounds();
        const canvasSize = this.getCanvasSize();
        
        const scaleX = canvasSize.width / bounds.width;
        const scaleY = canvasSize.height / bounds.height;
        const scale = Math.min(scaleX, scaleY, 1.0) * 0.9; // 留10%边距

        this.setZoom(scale);
        this.centerView(bounds.centerX, bounds.centerY);
    }

    public resetView(): void {
        this.viewport = { zoom: 1, panX: 0, panY: 0, centerX: 0, centerY: 0 };
        this.updateViewportTransform();
    }

    // 🎯 触摸/手势支持
    public enableTouchSupport(): void {
        // 双指缩放
        // 触摸拖拽
        // 长按菜单
        // 触摸友好的UI
    }

    public handleTouchStart(touches: Touch[]): void {
        if (touches.length === 1) {
            // 单指操作
            this.touchState = {
                type: 'single',
                startX: touches[0].clientX,
                startY: touches[0].clientY,
                startTime: Date.now()
            };
        } else if (touches.length === 2) {
            // 双指操作
            const distance = this.getTouchDistance(touches[0], touches[1]);
            this.touchState = {
                type: 'pinch',
                initialDistance: distance,
                startZoom: this.viewport.zoom
            };
        }
    }

    public handleTouchMove(touches: Touch[]): void {
        if (!this.touchState) return;

        if (this.touchState.type === 'single' && touches.length === 1) {
            // 拖拽平移
            const deltaX = touches[0].clientX - this.touchState.startX!;
            const deltaY = touches[0].clientY - this.touchState.startY!;
            this.updatePan(deltaX, deltaY);
        } else if (this.touchState.type === 'pinch' && touches.length === 2) {
            // 缩放
            const currentDistance = this.getTouchDistance(touches[0], touches[1]);
            const scale = currentDistance / this.touchState.initialDistance!;
            const newZoom = this.touchState.startZoom! * scale;
            this.setZoom(newZoom);
        }
    }

    // 🎯 键盘快捷键
    public initializeKeyboardShortcuts(): void {
        const shortcuts: KeyboardShortcut[] = [
            { key: 'Delete', action: 'deleteSelected' },
            { key: 'a', ctrlKey: true, action: 'selectAll' },
            { key: 'c', ctrlKey: true, action: 'copy' },
            { key: 'v', ctrlKey: true, action: 'paste' },
            { key: 'z', ctrlKey: true, action: 'undo' },
            { key: 'y', ctrlKey: true, action: 'redo' },
            { key: 'f', ctrlKey: true, action: 'find' },
            { key: '1', action: 'resetZoom' },
            { key: '0', action: 'zoomToFit' },
            { key: 'ArrowUp', action: 'moveUp' },
            { key: 'ArrowDown', action: 'moveDown' },
            { key: 'ArrowLeft', action: 'moveLeft' },
            { key: 'ArrowRight', action: 'moveRight' },
        ];

        shortcuts.forEach(shortcut => {
            const key = this.getShortcutKey(shortcut);
            this.keyboardShortcuts.set(key, shortcut);
        });
    }

    public handleKeyDown(event: KeyboardEvent): void {
        const key = this.getShortcutKey({
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            action: ''
        });

        const shortcut = this.keyboardShortcuts.get(key);
        if (shortcut) {
            event.preventDefault();
            this.executeAction(shortcut.action);
        }
    }

    // 🎯 搜索和过滤增强
    public enhanceSearchFeatures(): void {
        // 全局搜索
        // 智能过滤
        // 搜索历史
        // 正则表达式支持
    }

    public globalSearch(query: string, options?: SearchOptions): SearchResult[] {
        const results: SearchResult[] = [];
        
        // 搜索节点
        this.canvas.getAllNodes().forEach(node => {
            if (this.matchesSearchQuery(node, query, options)) {
                results.push({
                    type: 'node',
                    id: node.id,
                    title: node.data.name,
                    description: node.data.description,
                    relevance: this.calculateRelevance(node, query)
                });
            }
        });

        // 搜索连接
        this.canvas.getAllConnections().forEach(connection => {
            if (this.matchesSearchQuery(connection, query, options)) {
                results.push({
                    type: 'connection',
                    id: connection.source + '->' + connection.target,
                    title: connection.label || 'Connection',
                    description: `${connection.source} → ${connection.target}`,
                    relevance: this.calculateRelevance(connection, query)
                });
            }
        });

        // 按相关性排序
        return results.sort((a, b) => b.relevance - a.relevance);
    }

    // 🎯 上下文菜单增强
    public showContextMenu(x: number, y: number, target: ContextMenuTarget): void {
        const menu = this.buildContextMenu(target);
        // 显示右键菜单
        vscode.window.showQuickPick(menu.map(item => ({
            label: item.label,
            description: item.description,
            detail: item.detail
        }))).then(selected => {
            if (selected) {
                const menuItem = menu.find(item => item.label === selected.label);
                if (menuItem && menuItem.action) {
                    menuItem.action();
                }
            }
        });
    }

    // 🎯 动画和过渡效果
    public enableAnimations(): void {
        // 节点移动动画
        // 连线绘制动画
        // 缩放平滑过渡
        // 状态变化动画
    }

    public animateNodePosition(nodeId: string, targetX: number, targetY: number, duration: number = 300): void {
        const node = this.canvas.getNode(nodeId);
        if (!node) return;

        const startX = node.position.x;
        const startY = node.position.y;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用easing函数
            const easedProgress = this.easeInOutCubic(progress);
            
            const currentX = startX + (targetX - startX) * easedProgress;
            const currentY = startY + (targetY - startY) * easedProgress;
            
            node.position = { x: currentX, y: currentY };
            this.canvas.updateNodePosition(nodeId, currentX, currentY);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // 🔧 辅助方法
    private updateSelectionUI(): void {
        // 更新选中状态的视觉效果
        this.canvas.updateSelectedNodes(Array.from(this.selectedNodes));
    }

    private highlightNodesInSelection(): void {
        if (!this.selectionArea) return;
        
        const nodesInArea = this.getNodesInSelectionArea(this.selectionArea);
        this.canvas.highlightNodes(nodesInArea.map(n => n.id));
    }

    private getNodesInSelectionArea(area: SelectionArea): CanvasNode[] {
        const minX = Math.min(area.startX, area.endX);
        const maxX = Math.max(area.startX, area.endX);
        const minY = Math.min(area.startY, area.endY);
        const maxY = Math.max(area.startY, area.endY);

        return this.canvas.getAllNodes().filter(node => {
            return node.position.x >= minX && node.position.x <= maxX &&
                   node.position.y >= minY && node.position.y <= maxY;
        });
    }

    private previewNodePositions(nodeIds: string[], deltaX: number, deltaY: number): void {
        nodeIds.forEach(nodeId => {
            const node = this.canvas.getNode(nodeId);
            if (node) {
                this.canvas.previewNodePosition(nodeId, 
                    node.position.x + deltaX, 
                    node.position.y + deltaY
                );
            }
        });
    }

    private applyDraggedPositions(): void {
        if (!this.dragState) return;

        const deltaX = this.dragState.currentX - this.dragState.startX;
        const deltaY = this.dragState.currentY - this.dragState.startY;

        this.dragState.nodeIds.forEach(nodeId => {
            const node = this.canvas.getNode(nodeId);
            if (node) {
                this.canvas.updateNodePosition(nodeId, 
                    node.position.x + deltaX, 
                    node.position.y + deltaY
                );
            }
        });
    }

    private setZoom(zoom: number, centerX?: number, centerY?: number): void {
        this.viewport.zoom = zoom;
        this.updateViewportTransform();
        
        if (centerX !== undefined && centerY !== undefined) {
            this.viewport.centerX = centerX;
            this.viewport.centerY = centerY;
        }
    }

    private centerView(x: number, y: number): void {
        this.viewport.centerX = x;
        this.viewport.centerY = y;
        this.updateViewportTransform();
    }

    private updatePan(deltaX: number, deltaY: number): void {
        this.viewport.panX += deltaX;
        this.viewport.panY += deltaY;
        this.updateViewportTransform();
    }

    private updateViewportTransform(): void {
        // 应用变换到画布
        this.canvas.setViewport(this.viewport);
    }

    private getTouchDistance(touch1: Touch, touch2: Touch): number {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getShortcutKey(shortcut: KeyboardShortcut): string {
        let key = shortcut.key.toLowerCase();
        if (shortcut.ctrlKey) key = 'ctrl+' + key;
        if (shortcut.shiftKey) key = 'shift+' + key;
        if (shortcut.altKey) key = 'alt+' + key;
        return key;
    }

    private executeAction(action: string): void {
        switch (action) {
            case 'deleteSelected':
                this.deleteSelectedNodes();
                break;
            case 'selectAll':
                this.selectAll();
                break;
            case 'copy':
                this.copySelectedNodes();
                break;
            case 'paste':
                this.pasteNodes();
                break;
            case 'undo':
                this.canvas.undo();
                break;
            case 'redo':
                this.canvas.redo();
                break;
            case 'find':
                this.showSearchDialog();
                break;
            case 'resetZoom':
                this.resetView();
                break;
            case 'zoomToFit':
                this.zoomToFit();
                break;
            case 'moveUp':
                this.moveSelectedNodes(0, -10);
                break;
            case 'moveDown':
                this.moveSelectedNodes(0, 10);
                break;
            case 'moveLeft':
                this.moveSelectedNodes(-10, 0);
                break;
            case 'moveRight':
                this.moveSelectedNodes(10, 0);
                break;
        }
    }

    private deleteSelectedNodes(): void {
        Array.from(this.selectedNodes).forEach(nodeId => {
            this.canvas.deleteNode(nodeId);
        });
        this.clearSelection();
    }

    private copySelectedNodes(): void {
        const selectedNodeData = Array.from(this.selectedNodes).map(nodeId => 
            this.canvas.getNode(nodeId)
        ).filter(node => node !== undefined);

        // 保存到剪贴板
        this.canvas.setClipboard(selectedNodeData);
    }

    private pasteNodes(): void {
        const clipboardData = this.canvas.getClipboard();
        if (clipboardData && clipboardData.length > 0) {
            const newNodeIds = this.canvas.pasteNodes(clipboardData);
            this.selectNodes(newNodeIds);
        }
    }

    private moveSelectedNodes(deltaX: number, deltaY: number): void {
        Array.from(this.selectedNodes).forEach(nodeId => {
            const node = this.canvas.getNode(nodeId);
            if (node) {
                this.canvas.updateNodePosition(nodeId, 
                    node.position.x + deltaX, 
                    node.position.y + deltaY
                );
            }
        });
    }

    private showSearchDialog(): void {
        vscode.window.showInputBox({
            prompt: '搜索节点和连接',
            placeHolder: '输入搜索关键词...'
        }).then(query => {
            if (query) {
                const results = this.globalSearch(query);
                this.showSearchResults(results);
            }
        });
    }

    private showSearchResults(results: SearchResult[]): void {
        if (results.length === 0) {
            vscode.window.showInformationMessage('未找到匹配的结果');
            return;
        }

        vscode.window.showQuickPick(results.map(result => ({
            label: result.title,
            description: result.description,
            detail: `类型: ${result.type}, 相关性: ${Math.round(result.relevance * 100)}%`,
            result: result
        }))).then(selected => {
            if (selected && selected.result.type === 'node') {
                this.canvas.focusNode(selected.result.id);
            }
        });
    }

    private matchesSearchQuery(item: any, query: string, options?: SearchOptions): boolean {
        const searchText = query.toLowerCase();
        
        if (options?.useRegex) {
            try {
                const regex = new RegExp(query, 'i');
                return regex.test(JSON.stringify(item));
            } catch {
                return false;
            }
        }

        const itemText = JSON.stringify(item).toLowerCase();
        return itemText.includes(searchText);
    }

    private calculateRelevance(item: any, query: string): number {
        // 简单的相关性计算
        const itemText = JSON.stringify(item).toLowerCase();
        const queryText = query.toLowerCase();
        
        if (itemText === queryText) return 1.0;
        if (itemText.startsWith(queryText)) return 0.8;
        if (itemText.includes(queryText)) return 0.6;
        
        return 0.0;
    }

    private buildContextMenu(target: ContextMenuTarget): ContextMenuItem[] {
        const baseMenu: ContextMenuItem[] = [
            { label: '复制', action: () => this.copySelectedNodes() },
            { label: '粘贴', action: () => this.pasteNodes() },
            { label: '删除', action: () => this.deleteSelectedNodes() },
            { separator: true },
            { label: '全选', action: () => this.selectAll() },
            { label: '清除选择', action: () => this.clearSelection() },
        ];

        if (target.type === 'node') {
            baseMenu.unshift(
                { label: '编辑节点', action: () => this.editNodeInline(target.nodeId!) },
                { label: '复制节点', action: () => this.duplicateNode(target.nodeId!) },
                { separator: true }
            );
        }

        return baseMenu;
    }

    private duplicateNode(nodeId: string): void {
        const node = this.canvas.getNode(nodeId);
        if (node) {
            const newNode = { ...node, id: this.generateId(), position: { 
                x: node.position.x + 50, 
                y: node.position.y + 50 
            }};
            this.canvas.addNode(newNode);
        }
    }

    private generateId(): string {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    private getCanvasSize(): { width: number; height: number } {
        // 获取画布尺寸
        return { width: 1200, height: 800 }; // 示例值
    }

    private easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
}

// 辅助接口
interface DragState {
    nodeIds: string[];
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    snapToGrid: boolean;
}

interface TouchState {
    type: 'single' | 'pinch';
    startX?: number;
    startY?: number;
    startTime?: number;
    initialDistance?: number;
    startZoom?: number;
}

interface SearchOptions {
    caseSensitive?: boolean;
    useRegex?: boolean;
    searchInContent?: boolean;
    searchInMetadata?: boolean;
}

interface SearchResult {
    type: 'node' | 'connection';
    id: string;
    title: string;
    description: string;
    relevance: number;
}

interface ContextMenuTarget {
    type: 'node' | 'connection' | 'canvas';
    nodeId?: string;
    connectionId?: string;
    x?: number;
    y?: number;
}

interface ContextMenuItem {
    label?: string;
    description?: string;
    detail?: string;
    action?: () => void;
    separator?: boolean;
}
