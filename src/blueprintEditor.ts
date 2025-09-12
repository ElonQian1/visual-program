import * as vscode from 'vscode';

/**
 * 可视化节点接口定义
 */
export interface VisualNode {
    id: string;
    type: NodeType;
    position: Position;
    size: Size;
    inputs: NodePort[];
    outputs: NodePort[];
    properties: Record<string, any>;
    metadata: NodeMetadata;
}

export enum NodeType {
    FUNCTION = 'function',
    COMPONENT = 'component',
    VARIABLE = 'variable',
    IMPORT = 'import',
    EXPORT = 'export',
    CONDITION = 'condition',
    LOOP = 'loop',
    EVENT = 'event',
    API_CALL = 'api_call',
    STATE = 'state'
}

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface NodePort {
    id: string;
    name: string;
    dataType: DataType;
    isRequired: boolean;
    defaultValue?: any;
    description?: string;
}

export enum DataType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    OBJECT = 'object',
    ARRAY = 'array',
    FUNCTION = 'function',
    COMPONENT = 'component',
    EVENT = 'event',
    ANY = 'any'
}

export interface NodeMetadata {
    label: string;
    category: string;
    description: string;
    icon?: string;
    color?: string;
    isAsync?: boolean;
    framework: 'react' | 'rust' | 'common';
    complexity: 'simple' | 'medium' | 'complex';
}

/**
 * 连接线接口定义
 */
export interface NodeConnection {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
    dataType: DataType;
    metadata: ConnectionMetadata;
}

export interface ConnectionMetadata {
    isValid: boolean;
    validationErrors?: string[];
    dataFlow: 'sync' | 'async' | 'event';
    description?: string;
}

/**
 * 蓝图图表接口定义
 */
export interface BlueprintGraph {
    id: string;
    name: string;
    nodes: VisualNode[];
    connections: NodeConnection[];
    viewport: Viewport;
    metadata: GraphMetadata;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

export interface GraphMetadata {
    framework: 'react' | 'rust' | 'mixed';
    version: string;
    createdAt: Date;
    updatedAt: Date;
    description?: string;
    tags: string[];
}

/**
 * 蓝图编辑器核心类
 */
export class BlueprintEditor {
    private context: vscode.ExtensionContext;
    private currentGraph: BlueprintGraph | null = null;
    private nodeTemplates: Map<string, VisualNode>;
    private validationRules: ValidationRule[];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.nodeTemplates = new Map();
        this.validationRules = [];
        this.initializeNodeTemplates();
        this.initializeValidationRules();
    }

    /**
     * 初始化节点模板
     */
    private initializeNodeTemplates(): void {
        // React组件节点模板
        this.addNodeTemplate({
            id: 'react-component',
            type: NodeType.COMPONENT,
            position: { x: 0, y: 0 },
            size: { width: 200, height: 100 },
            inputs: [
                {
                    id: 'props',
                    name: 'Props',
                    dataType: DataType.OBJECT,
                    isRequired: false,
                    description: '组件属性'
                }
            ],
            outputs: [
                {
                    id: 'jsx',
                    name: 'JSX Element',
                    dataType: DataType.COMPONENT,
                    isRequired: true,
                    description: 'React JSX元素'
                }
            ],
            properties: {
                componentName: '',
                exportType: 'default'
            },
            metadata: {
                label: 'React组件',
                category: 'React',
                description: '创建React函数组件',
                icon: 'symbol-class',
                color: '#61dafb',
                framework: 'react',
                complexity: 'simple'
            }
        });

        // Rust函数节点模板
        this.addNodeTemplate({
            id: 'rust-function',
            type: NodeType.FUNCTION,
            position: { x: 0, y: 0 },
            size: { width: 180, height: 120 },
            inputs: [
                {
                    id: 'params',
                    name: 'Parameters',
                    dataType: DataType.ARRAY,
                    isRequired: false,
                    description: '函数参数'
                }
            ],
            outputs: [
                {
                    id: 'result',
                    name: 'Result',
                    dataType: DataType.ANY,
                    isRequired: true,
                    description: '函数返回值'
                }
            ],
            properties: {
                functionName: '',
                visibility: 'pub',
                isAsync: false,
                returnType: 'String'
            },
            metadata: {
                label: 'Rust函数',
                category: 'Rust',
                description: '创建Rust函数',
                icon: 'symbol-function',
                color: '#ce422b',
                framework: 'rust',
                complexity: 'simple'
            }
        });

        // 条件节点模板
        this.addNodeTemplate({
            id: 'condition',
            type: NodeType.CONDITION,
            position: { x: 0, y: 0 },
            size: { width: 150, height: 100 },
            inputs: [
                {
                    id: 'condition',
                    name: 'Condition',
                    dataType: DataType.BOOLEAN,
                    isRequired: true,
                    description: '条件表达式'
                }
            ],
            outputs: [
                {
                    id: 'true',
                    name: 'True',
                    dataType: DataType.ANY,
                    isRequired: true,
                    description: '条件为真时的输出'
                },
                {
                    id: 'false',
                    name: 'False',
                    dataType: DataType.ANY,
                    isRequired: true,
                    description: '条件为假时的输出'
                }
            ],
            properties: {
                conditionExpression: ''
            },
            metadata: {
                label: '条件判断',
                category: 'Logic',
                description: '条件分支控制',
                icon: 'symbol-boolean',
                color: '#ffd700',
                framework: 'common',
                complexity: 'simple'
            }
        });
    }

    /**
     * 添加节点模板
     */
    private addNodeTemplate(template: VisualNode): void {
        this.nodeTemplates.set(template.id, template);
    }

    /**
     * 初始化验证规则
     */
    private initializeValidationRules(): void {
        this.validationRules = [
            {
                name: 'dataTypeCompatibility',
                validate: this.validateDataTypeCompatibility.bind(this),
                errorMessage: '数据类型不兼容'
            },
            {
                name: 'requiredInputs',
                validate: this.validateRequiredInputs.bind(this),
                errorMessage: '缺少必需的输入'
            },
            {
                name: 'cyclicDependency',
                validate: this.validateCyclicDependency.bind(this),
                errorMessage: '检测到循环依赖'
            },
            {
                name: 'frameworkCompatibility',
                validate: this.validateFrameworkCompatibility.bind(this),
                errorMessage: '框架不兼容'
            }
        ];
    }

    /**
     * 创建新的蓝图图表
     */
    public createNewGraph(name: string, framework: 'react' | 'rust' | 'mixed'): BlueprintGraph {
        this.currentGraph = {
            id: this.generateId(),
            name,
            nodes: [],
            connections: [],
            viewport: { x: 0, y: 0, zoom: 1.0 },
            metadata: {
                framework,
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date(),
                tags: []
            }
        };
        return this.currentGraph;
    }

    /**
     * 添加节点到图表
     */
    public addNode(templateId: string, position: Position): VisualNode | null {
        if (!this.currentGraph) {
            throw new Error('No active graph');
        }

        const template = this.nodeTemplates.get(templateId);
        if (!template) {
            throw new Error(`Node template '${templateId}' not found`);
        }

        const newNode: VisualNode = {
            ...JSON.parse(JSON.stringify(template)), // 深拷贝
            id: this.generateId(),
            position
        };

        this.currentGraph.nodes.push(newNode);
        this.currentGraph.metadata.updatedAt = new Date();
        
        return newNode;
    }

    /**
     * 创建连接
     */
    public createConnection(
        sourceNodeId: string,
        sourcePortId: string,
        targetNodeId: string,
        targetPortId: string
    ): NodeConnection | null {
        if (!this.currentGraph) {
            throw new Error('No active graph');
        }

        const sourceNode = this.currentGraph.nodes.find(n => n.id === sourceNodeId);
        const targetNode = this.currentGraph.nodes.find(n => n.id === targetNodeId);

        if (!sourceNode || !targetNode) {
            throw new Error('Source or target node not found');
        }

        const sourcePort = sourceNode.outputs.find(p => p.id === sourcePortId);
        const targetPort = targetNode.inputs.find(p => p.id === targetPortId);

        if (!sourcePort || !targetPort) {
            throw new Error('Source or target port not found');
        }

        // 验证连接
        const validationResult = this.validateConnection(sourcePort, targetPort);
        if (!validationResult.isValid) {
            throw new Error(`Invalid connection: ${validationResult.errors?.join(', ')}`);
        }

        const connection: NodeConnection = {
            id: this.generateId(),
            sourceNodeId,
            sourcePortId,
            targetNodeId,
            targetPortId,
            dataType: sourcePort.dataType,
            metadata: {
                isValid: true,
                dataFlow: sourceNode.metadata.isAsync ? 'async' : 'sync'
            }
        };

        this.currentGraph.connections.push(connection);
        this.currentGraph.metadata.updatedAt = new Date();

        return connection;
    }

    /**
     * 验证连接有效性
     */
    private validateConnection(sourcePort: NodePort, targetPort: NodePort): ValidationResult {
        const errors: string[] = [];

        // 数据类型兼容性检查
        if (!this.isDataTypeCompatible(sourcePort.dataType, targetPort.dataType)) {
            errors.push(`数据类型不兼容: ${sourcePort.dataType} -> ${targetPort.dataType}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * 检查数据类型兼容性
     */
    private isDataTypeCompatible(sourceType: DataType, targetType: DataType): boolean {
        if (sourceType === targetType || targetType === DataType.ANY) {
            return true;
        }

        // 特殊兼容性规则
        const compatibilityRules: Record<DataType, DataType[]> = {
            [DataType.STRING]: [DataType.ANY],
            [DataType.NUMBER]: [DataType.ANY, DataType.STRING],
            [DataType.BOOLEAN]: [DataType.ANY, DataType.STRING],
            [DataType.OBJECT]: [DataType.ANY],
            [DataType.ARRAY]: [DataType.ANY, DataType.OBJECT],
            [DataType.FUNCTION]: [DataType.ANY],
            [DataType.COMPONENT]: [DataType.ANY],
            [DataType.EVENT]: [DataType.ANY],
            [DataType.ANY]: []
        };

        return compatibilityRules[sourceType]?.includes(targetType) || false;
    }

    /**
     * 验证图表完整性
     */
    public validateGraph(): ValidationResult {
        if (!this.currentGraph) {
            return { isValid: false, errors: ['No active graph'] };
        }

        const errors: string[] = [];

        for (const rule of this.validationRules) {
            const result = rule.validate(this.currentGraph);
            if (!result.isValid && result.errors) {
                errors.push(...result.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * 数据类型兼容性验证
     */
    private validateDataTypeCompatibility(graph: BlueprintGraph): ValidationResult {
        const errors: string[] = [];

        for (const connection of graph.connections) {
            const sourceNode = graph.nodes.find(n => n.id === connection.sourceNodeId);
            const targetNode = graph.nodes.find(n => n.id === connection.targetNodeId);

            if (sourceNode && targetNode) {
                const sourcePort = sourceNode.outputs.find(p => p.id === connection.sourcePortId);
                const targetPort = targetNode.inputs.find(p => p.id === connection.targetPortId);

                if (sourcePort && targetPort && !this.isDataTypeCompatible(sourcePort.dataType, targetPort.dataType)) {
                    errors.push(`连接 ${sourceNode.metadata.label} -> ${targetNode.metadata.label}: 数据类型不兼容`);
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * 必需输入验证
     */
    private validateRequiredInputs(graph: BlueprintGraph): ValidationResult {
        const errors: string[] = [];

        for (const node of graph.nodes) {
            for (const input of node.inputs.filter(i => i.isRequired)) {
                const hasConnection = graph.connections.some(c => 
                    c.targetNodeId === node.id && c.targetPortId === input.id
                );

                if (!hasConnection && input.defaultValue === undefined) {
                    errors.push(`节点 ${node.metadata.label}: 缺少必需的输入 ${input.name}`);
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * 循环依赖验证
     */
    private validateCyclicDependency(graph: BlueprintGraph): ValidationResult {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const errors: string[] = [];

        const hasCycle = (nodeId: string): boolean => {
            if (recursionStack.has(nodeId)) {
                return true;
            }
            if (visited.has(nodeId)) {
                return false;
            }

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoingConnections = graph.connections.filter(c => c.sourceNodeId === nodeId);
            for (const connection of outgoingConnections) {
                if (hasCycle(connection.targetNodeId)) {
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of graph.nodes) {
            if (!visited.has(node.id) && hasCycle(node.id)) {
                errors.push(`检测到循环依赖，涉及节点: ${node.metadata.label}`);
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * 框架兼容性验证
     */
    private validateFrameworkCompatibility(graph: BlueprintGraph): ValidationResult {
        const errors: string[] = [];

        for (const connection of graph.connections) {
            const sourceNode = graph.nodes.find(n => n.id === connection.sourceNodeId);
            const targetNode = graph.nodes.find(n => n.id === connection.targetNodeId);

            if (sourceNode && targetNode) {
                const sourceFramework = sourceNode.metadata.framework;
                const targetFramework = targetNode.metadata.framework;

                if (sourceFramework !== 'common' && targetFramework !== 'common' && 
                    sourceFramework !== targetFramework) {
                    errors.push(`框架不兼容: ${sourceFramework} -> ${targetFramework}`);
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    /**
     * 获取节点模板列表
     */
    public getNodeTemplates(framework?: 'react' | 'rust' | 'common'): VisualNode[] {
        const templates = Array.from(this.nodeTemplates.values());
        
        if (framework) {
            return templates.filter(t => t.metadata.framework === framework || t.metadata.framework === 'common');
        }
        
        return templates;
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取当前图表
     */
    public getCurrentGraph(): BlueprintGraph | null {
        return this.currentGraph;
    }

    /**
     * 设置当前图表
     */
    public setCurrentGraph(graph: BlueprintGraph): void {
        this.currentGraph = graph;
    }
}

/**
 * 验证规则接口
 */
interface ValidationRule {
    name: string;
    validate: (graph: BlueprintGraph) => ValidationResult;
    errorMessage: string;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
}
