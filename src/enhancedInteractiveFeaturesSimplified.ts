// 🎯 简化版交互式画布增强功能
import * as vscode from 'vscode';
import { CanvasNode, NodeConnection, InteractiveCanvasProvider } from './interactiveCanvasProvider';

export interface EnhancedCanvasNode extends CanvasNode {
    selected?: boolean;
    locked?: boolean;
    collapsed?: boolean;
}

export interface SelectionArea {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface SearchResult {
    type: 'node' | 'connection';
    id: string;
    title: string;
    description: string;
    relevance: number;
}

// 🚀 交互增强功能类
export class EnhancedInteractiveFeatures {
    private selectedNodes: Set<string> = new Set();
    private selectionArea: SelectionArea | null = null;
    private clipboard: CanvasNode[] = [];

    constructor(private canvas: InteractiveCanvasProvider) {
        this.initializeEnhancements();
    }

    private initializeEnhancements(): void {
        // 初始化增强功能
        console.log('Enhanced interactive features initialized');
    }

    // 🎯 多选功能
    public enableMultiSelection(): void {
        console.log('Multi-selection enabled');
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
        this.canvas.getAllNodes().forEach((node: CanvasNode) => {
            this.selectedNodes.add(node.id);
        });
        this.updateSelectionUI();
    }

    public clearSelection(): void {
        this.selectedNodes.clear();
        this.updateSelectionUI();
    }

    // 🎯 双击编辑功能
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
        const node = this.canvas.getNode(nodeId);
        vscode.window.showInputBox({
            prompt: '编辑节点名称',
            value: node?.data.name || ''
        }).then(newName => {
            if (newName) {
                this.canvas.updateNodeName(nodeId, newName);
            }
        });
    }

    private editConnectionLabel(connectionId: string): void {
        vscode.window.showInputBox({
            prompt: '编辑连接标签',
            value: ''
        }).then(newLabel => {
            if (newLabel) {
                console.log(`Update connection ${connectionId} label to: ${newLabel}`);
            }
        });
    }

    private createNodeAtCursor(): void {
        vscode.window.showQuickPick([
            'React组件',
            'Rust结构体',
            'Rust特征',
            '状态存储'
        ], { placeHolder: '选择节点类型' }).then(nodeType => {
            if (nodeType) {
                console.log(`Create new node of type: ${nodeType}`);
            }
        });
    }

    // 🎯 搜索和过滤功能
    public globalSearch(query: string): SearchResult[] {
        const results: SearchResult[] = [];
        
        // 搜索节点
        this.canvas.getAllNodes().forEach((node: CanvasNode) => {
            if (this.matchesSearchQuery(node, query)) {
                results.push({
                    type: 'node',
                    id: node.id,
                    title: node.data.name || 'Unnamed Node',
                    description: node.data.description || node.type,
                    relevance: this.calculateRelevance(node, query)
                });
            }
        });

        // 搜索连接
        this.canvas.getAllConnections().forEach((connection: NodeConnection) => {
            if (this.matchesSearchQuery(connection, query)) {
                results.push({
                    type: 'connection',
                    id: connection.source + '->' + connection.target,
                    title: connection.label || 'Connection',
                    description: `${connection.source} → ${connection.target}`,
                    relevance: this.calculateRelevance(connection, query)
                });
            }
        });

        return results.sort((a, b) => b.relevance - a.relevance);
    }

    // 🎯 快捷键处理
    public handleShortcut(action: string): void {
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
            case 'find':
                this.showSearchDialog();
                break;
            case 'zoomToFit':
                this.zoomToFit();
                break;
        }
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
            this.selectNodes(nodesInArea.map((n: CanvasNode) => n.id));
        }
        this.selectionArea = null;
    }

    // 🎯 上下文菜单
    public showContextMenu(x: number, y: number, targetType: 'node' | 'canvas', nodeId?: string): void {
        const menuItems = this.buildContextMenu(targetType, nodeId);
        
        vscode.window.showQuickPick(menuItems, {
            placeHolder: '选择操作'
        }).then(selected => {
            if (selected) {
                this.executeContextAction(selected, nodeId);
            }
        });
    }

    // 🔧 辅助方法
    private updateSelectionUI(): void {
        this.canvas.updateSelectedNodes(Array.from(this.selectedNodes));
    }

    private highlightNodesInSelection(): void {
        if (!this.selectionArea) return;
        
        const nodesInArea = this.getNodesInSelectionArea(this.selectionArea);
        this.canvas.highlightNodes(nodesInArea.map((n: CanvasNode) => n.id));
    }

    private getNodesInSelectionArea(area: SelectionArea): CanvasNode[] {
        const minX = Math.min(area.startX, area.endX);
        const maxX = Math.max(area.startX, area.endX);
        const minY = Math.min(area.startY, area.endY);
        const maxY = Math.max(area.startY, area.endY);

        return this.canvas.getAllNodes().filter((node: CanvasNode) => {
            return node.position.x >= minX && node.position.x <= maxX &&
                   node.position.y >= minY && node.position.y <= maxY;
        });
    }

    private matchesSearchQuery(item: any, query: string): boolean {
        const searchText = query.toLowerCase();
        const itemText = JSON.stringify(item).toLowerCase();
        return itemText.includes(searchText);
    }

    private calculateRelevance(item: any, query: string): number {
        const itemText = JSON.stringify(item).toLowerCase();
        const queryText = query.toLowerCase();
        
        if (itemText === queryText) return 1.0;
        if (itemText.startsWith(queryText)) return 0.8;
        if (itemText.includes(queryText)) return 0.6;
        
        return 0.0;
    }

    private deleteSelectedNodes(): void {
        Array.from(this.selectedNodes).forEach(nodeId => {
            this.canvas.deleteNode(nodeId);
        });
        this.clearSelection();
    }

    private copySelectedNodes(): void {
        const selectedNodeData = Array.from(this.selectedNodes)
            .map(nodeId => this.canvas.getNode(nodeId))
            .filter((node): node is CanvasNode => node !== undefined);

        this.clipboard = selectedNodeData;
        this.canvas.setClipboard(selectedNodeData);
    }

    private pasteNodes(): void {
        if (this.clipboard.length > 0) {
            const newNodeIds = this.canvas.pasteNodes(this.clipboard);
            this.selectNodes(newNodeIds);
        }
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

        const quickPickItems = results.map(result => ({
            label: result.title,
            description: result.description,
            detail: `类型: ${result.type}, 相关性: ${Math.round(result.relevance * 100)}%`,
            id: result.id,
            type: result.type
        }));

        vscode.window.showQuickPick(quickPickItems).then(selected => {
            if (selected && selected.type === 'node') {
                this.canvas.focusNode(selected.id);
            }
        });
    }

    private zoomToFit(): void {
        const bounds = this.canvas.getContentBounds();
        console.log('Zoom to fit content bounds:', bounds);
        // 实现缩放到适合的逻辑
    }

    private buildContextMenu(targetType: 'node' | 'canvas', nodeId?: string): string[] {
        const baseMenu = [
            '复制',
            '粘贴',
            '删除',
            '---',
            '全选',
            '清除选择'
        ];

        if (targetType === 'node' && nodeId) {
            return [
                '编辑节点',
                '复制节点',
                '---',
                ...baseMenu
            ];
        }

        return baseMenu;
    }

    private executeContextAction(action: string, nodeId?: string): void {
        switch (action) {
            case '编辑节点':
                if (nodeId) this.editNodeInline(nodeId);
                break;
            case '复制节点':
                if (nodeId) this.duplicateNode(nodeId);
                break;
            case '复制':
                this.copySelectedNodes();
                break;
            case '粘贴':
                this.pasteNodes();
                break;
            case '删除':
                this.deleteSelectedNodes();
                break;
            case '全选':
                this.selectAll();
                break;
            case '清除选择':
                this.clearSelection();
                break;
        }
    }

    private duplicateNode(nodeId: string): void {
        const node = this.canvas.getNode(nodeId);
        if (node) {
            const newNode: CanvasNode = {
                ...node,
                id: this.generateId(),
                position: { 
                    x: node.position.x + 50, 
                    y: node.position.y + 50 
                },
                connections: []
            };
            this.canvas.addNode(newNode);
        }
    }

    private generateId(): string {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 🎯 动画支持 (简化版)
    public animateNodeMove(nodeId: string, targetX: number, targetY: number): void {
        const node = this.canvas.getNode(nodeId);
        if (node) {
            // 简单的位置更新，实际实现中可以添加动画效果
            this.canvas.updateNodePosition(nodeId, targetX, targetY);
            console.log(`Animated move for node ${nodeId} to (${targetX}, ${targetY})`);
        }
    }

    // 🎯 批量操作
    public moveSelectedNodes(deltaX: number, deltaY: number): void {
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

    public getSelectedNodeIds(): string[] {
        return Array.from(this.selectedNodes);
    }

    public getSelectedNodesCount(): number {
        return this.selectedNodes.size;
    }
}
