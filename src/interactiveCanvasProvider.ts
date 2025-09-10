// 交互式画布增强模块
import * as vscode from 'vscode';

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
        
        if (!sourceNode || !targetNode) return false;
        
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
}
