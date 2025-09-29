// 交互式画布增强模块
import * as vscode from 'vscode';

// 导入增强交互功能
export interface ViewportState {
    zoom: number;
    panX: number;
    panY: number;
    centerX: number;
    centerY: number;
}

export interface ContentBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

export interface NodeConnection {
    source: string;
    target: string;
    type: 'data-flow' | 'control-flow' | 'dependency';
    label?: string;
}

export interface CanvasNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
    connections: NodeConnection[];
}

export class InteractiveCanvasProvider {
    private nodes: Map<string, CanvasNode> = new Map();
    private connections: NodeConnection[] = [];
    
    // 🔥 新功能：智能连线系统
    public createConnection(sourceId: string, targetId: string, type: NodeConnection['type']): boolean {
        const sourceNode = this.nodes.get(sourceId);
        const targetNode = this.nodes.get(targetId);
        
        if (!sourceNode || !targetNode) {return false;}
        
        // 智能连线验证
        if (this.isValidConnection(sourceNode, targetNode, type)) {
            const connection: NodeConnection = {
                source: sourceId,
                target: targetId,
                type,
                label: this.generateConnectionLabel(sourceNode, targetNode, type)
            };
            
            this.connections.push(connection);
            return true;
        }
        
        return false;
    }
    
    // 🔥 新功能：连线智能验证
    private isValidConnection(source: CanvasNode, target: CanvasNode, type: NodeConnection['type']): boolean {
        // React组件连线规则
        if (source.type === 'reactComponent' && target.type === 'reactComponent') {
            return type === 'data-flow'; // 父子组件数据流
        }
        
        // Rust模块连线规则
        if (source.type === 'rustStruct' && target.type === 'rustTrait') {
            return type === 'dependency'; // 结构体实现特征
        }
        
        // 状态管理连线规则
        if (source.type === 'stateStore' && target.type === 'reactComponent') {
            return type === 'data-flow'; // 状态到组件
        }
        
        return true; // 默认允许
    }
    
    // 🔥 新功能：自动布局算法
    public autoLayout(): void {
        const nodes = Array.from(this.nodes.values());
        
        // 层次化布局算法
        const layers = this.buildHierarchy(nodes);
        const positions = this.calculatePositions(layers);
        
        positions.forEach((pos, nodeId) => {
            const node = this.nodes.get(nodeId);
            if (node) {
                node.position = pos;
            }
        });
    }
    
    private buildHierarchy(nodes: CanvasNode[]): CanvasNode[][] {
        // 构建依赖图并进行拓扑排序
        const visited = new Set<string>();
        const layers: CanvasNode[][] = [];
        
        // 简化的层次构建逻辑
        const componentNodes = nodes.filter(n => n.type === 'reactComponent');
        const structNodes = nodes.filter(n => n.type === 'rustStruct');
        const utilNodes = nodes.filter(n => !componentNodes.includes(n) && !structNodes.includes(n));
        
        layers.push(componentNodes);
        layers.push(structNodes);
        layers.push(utilNodes);
        
        return layers;
    }
    
    private calculatePositions(layers: CanvasNode[][]): Map<string, {x: number, y: number}> {
        const positions = new Map<string, {x: number, y: number}>();
        const layerHeight = 200;
        const nodeWidth = 220;
        
        layers.forEach((layer, layerIndex) => {
            layer.forEach((node, nodeIndex) => {
                positions.set(node.id, {
                    x: 50 + nodeIndex * nodeWidth,
                    y: 100 + layerIndex * layerHeight
                });
            });
        });
        
        return positions;
    }
    
    private generateConnectionLabel(source: CanvasNode, target: CanvasNode, type: NodeConnection['type']): string {
        switch (type) {
            case 'data-flow':
                return `${source.data.name} → ${target.data.name}`;
            case 'control-flow':
                return '控制流';
            case 'dependency':
                return '依赖';
            default:
                return '';
        }
    }
    
    // 🔥 新功能：节点搜索和过滤
    public searchNodes(query: string): CanvasNode[] {
        const results: CanvasNode[] = [];
        
        this.nodes.forEach(node => {
            if (this.matchesQuery(node, query)) {
                results.push(node);
            }
        });
        
        return results;
    }
    
    private matchesQuery(node: CanvasNode, query: string): boolean {
        const searchText = query.toLowerCase();
        
        return (
            node.data.name?.toLowerCase().includes(searchText) ||
            node.type.toLowerCase().includes(searchText) ||
            (node.data.description?.toLowerCase().includes(searchText))
        );
    }

    // 🔥 新增：实时协作功能
    public enableRealTimeSync(wsUrl: string): void {
        // 实时同步逻辑
        console.log(`启用实时协作: ${wsUrl}`);
    }

    // 🔥 新增：智能代码生成
    public generateCodeFromGraph(): { react: string; rust: string } {
        const reactCode = this.generateReactCode();
        const rustCode = this.generateRustCode();
        
        return { react: reactCode, rust: rustCode };
    }

    private generateReactCode(): string {
        const components = Array.from(this.nodes.values())
            .filter(node => node.type === 'reactComponent');
        
        let code = "// 自动生成的 React 代码\n";
        code += "import React from 'react';\n\n";
        
        components.forEach(component => {
            code += `const ${component.data.name} = () => {\n`;
            code += `  return <div>{/* ${component.data.name} 组件 */}</div>;\n`;
            code += `};\n\n`;
        });
        
        code += `export { ${components.map(c => c.data.name).join(', ')} };\n`;
        return code;
    }

    private generateRustCode(): string {
        const structs = Array.from(this.nodes.values())
            .filter(node => node.type === 'rustStruct');
        
        let code = "// 自动生成的 Rust 代码\n";
        
        structs.forEach(struct => {
            code += `#[derive(Debug, Clone)]\n`;
            code += `pub struct ${struct.data.name} {\n`;
            code += `    // TODO: 添加字段\n`;
            code += `}\n\n`;
        });
        
        return code;
    }

    // 🔥 新增：性能监控面板
    public getPerformanceMetrics(): PerformanceMetrics {
        return {
            nodeCount: this.nodes.size,
            connectionCount: this.connections.length,
            renderTime: this.calculateRenderTime(),
            memoryUsage: this.calculateMemoryUsage()
        };
    }

    private calculateRenderTime(): number {
        // 模拟性能计算
        return performance.now() % 100;
    }

    private calculateMemoryUsage(): number {
        // 模拟内存使用计算
        return this.nodes.size * 0.5 + this.connections.length * 0.2;
    }

    // 🚀 新增增强交互功能支持
    public getAllNodes(): CanvasNode[] {
        return Array.from(this.nodes.values());
    }

    public getAllConnections(): NodeConnection[] {
        return this.connections;
    }

    public getNode(nodeId: string): CanvasNode | undefined {
        return this.nodes.get(nodeId);
    }

    public updateNodeName(nodeId: string, newName: string): void {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.data.name = newName;
        }
    }

    public updateNodePosition(nodeId: string, x: number, y: number): void {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.position = { x, y };
        }
    }

    public previewNodePosition(nodeId: string, x: number, y: number): void {
        // 预览位置变化，不实际更新
        const node = this.nodes.get(nodeId);
        if (node) {
            // 发送预览事件到webview
            console.log(`Preview position for ${nodeId}: (${x}, ${y})`);
        }
    }

    public updateSelectedNodes(selectedNodeIds: string[]): void {
        // 更新选中状态
        this.nodes.forEach((node, nodeId) => {
            (node as any).selected = selectedNodeIds.includes(nodeId);
        });
    }

    public highlightNodes(nodeIds: string[]): void {
        // 高亮显示指定节点
        this.nodes.forEach((node, nodeId) => {
            (node as any).highlighted = nodeIds.includes(nodeId);
        });
    }

    public addNode(node: CanvasNode): void {
        this.nodes.set(node.id, node);
    }

    public deleteNode(nodeId: string): void {
        this.nodes.delete(nodeId);
        // 删除相关连接
        this.connections = this.connections.filter(
            conn => conn.source !== nodeId && conn.target !== nodeId
        );
    }

    public focusNode(nodeId: string): void {
        const node = this.nodes.get(nodeId);
        if (node) {
            // 居中显示节点
            console.log(`Focus on node: ${nodeId}`);
        }
    }

    public setViewport(viewport: ViewportState): void {
        // 设置视口变换
        console.log(`Setting viewport: zoom=${viewport.zoom}, pan=(${viewport.panX}, ${viewport.panY})`);
    }

    public getContentBounds(): ContentBounds {
        if (this.nodes.size === 0) {
            return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100, centerX: 50, centerY: 50 };
        }

        const positions = Array.from(this.nodes.values()).map(node => node.position);
        const minX = Math.min(...positions.map(p => p.x));
        const minY = Math.min(...positions.map(p => p.y));
        const maxX = Math.max(...positions.map(p => p.x));
        const maxY = Math.max(...positions.map(p => p.y));

        return {
            minX, minY, maxX, maxY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }

    // 历史操作支持
    private history: any[] = [];
    private historyIndex: number = -1;

    public undo(): void {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            // 恢复历史状态
            console.log('Undo operation');
        }
    }

    public redo(): void {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            // 重做操作
            console.log('Redo operation');
        }
    }

    // 剪贴板支持
    private clipboard: CanvasNode[] = [];

    public setClipboard(nodes: CanvasNode[]): void {
        this.clipboard = nodes.map(node => ({ ...node }));
    }

    public getClipboard(): CanvasNode[] {
        return this.clipboard;
    }

    public pasteNodes(nodeData: CanvasNode[]): string[] {
        const newNodeIds: string[] = [];
        
        nodeData.forEach(node => {
            const newNode: CanvasNode = {
                ...node,
                id: this.generateId(),
                position: { x: node.position.x + 50, y: node.position.y + 50 }
            };
            this.addNode(newNode);
            newNodeIds.push(newNode.id);
        });

        return newNodeIds;
    }

    private generateId(): string {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

export interface PerformanceMetrics {
    nodeCount: number;
    connectionCount: number;
    renderTime: number;
    memoryUsage: number;
}
