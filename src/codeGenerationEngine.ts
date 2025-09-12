// 智能代码生成引擎
import * as vscode from 'vscode';
import { CanvasNode, NodeConnection } from './interactiveCanvasProvider';

export interface CodeTemplate {
    id: string;
    name: string;
    language: 'typescript' | 'rust';
    category: 'component' | 'function' | 'struct' | 'module';
    template: string;
    variables: TemplateVariable[];
}

export interface TemplateVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    defaultValue?: any;
    description?: string;
}

export interface GeneratedCode {
    fileName: string;
    content: string;
    language: string;
    imports: string[];
}

export class CodeGenerationEngine {
    private templates: Map<string, CodeTemplate> = new Map();
    
    constructor() {
        this.initializeTemplates();
    }
    
    // 🔥 核心功能：从可视化图生成代码
    public generateCodeFromCanvas(nodes: CanvasNode[], connections: NodeConnection[]): GeneratedCode[] {
        const generatedFiles: GeneratedCode[] = [];
        
        // 按语言分组节点
        const reactNodes = nodes.filter(n => n.type.startsWith('react'));
        const rustNodes = nodes.filter(n => n.type.startsWith('rust'));
        
        // 生成React代码
        if (reactNodes.length > 0) {
            const reactCode = this.generateReactCode(reactNodes, connections);
            generatedFiles.push(reactCode);
        }
        
        // 生成Rust代码
        if (rustNodes.length > 0) {
            const rustCode = this.generateRustCode(rustNodes, connections);
            generatedFiles.push(rustCode);
        }
        
        return generatedFiles;
    }
    
    // 🚀 React代码生成
    private generateReactCode(nodes: CanvasNode[], connections: NodeConnection[]): GeneratedCode {
        let imports: string[] = ['import React from "react";'];
        let components: string[] = [];
        
        // 生成组件代码
        nodes.forEach(node => {
            switch (node.type) {
                case 'reactComponent':
                    components.push(this.generateReactComponent(node, connections));
                    break;
                case 'reactHook':
                    components.push(this.generateCustomHook(node));
                    break;
                case 'reactContext':
                    components.push(this.generateContextProvider(node));
                    imports.push('import { createContext, useContext } from "react";');
                    break;
            }
        });
        
        const content = `${imports.join('\n')}\n\n${components.join('\n\n')}`;
        
        return {
            fileName: 'GeneratedComponents.tsx',
            content,
            language: 'typescript',
            imports
        };
    }
    
    // 🚀 Rust代码生成
    private generateRustCode(nodes: CanvasNode[], connections: NodeConnection[]): GeneratedCode {
        let imports: string[] = [];
        let items: string[] = [];
        
        // 生成Rust项
        nodes.forEach(node => {
            switch (node.type) {
                case 'rustStruct':
                    items.push(this.generateRustStruct(node));
                    break;
                case 'rustTrait':
                    items.push(this.generateRustTrait(node));
                    break;
                case 'rustFunction':
                    items.push(this.generateRustFunction(node));
                    break;
                case 'rustWebHandler':
                    items.push(this.generateWebHandler(node));
                    imports.push('use axum::{routing::get, Router};');
                    break;
            }
        });
        
        const content = `${imports.join('\n')}\n\n${items.join('\n\n')}`;
        
        return {
            fileName: 'generated.rs',
            content,
            language: 'rust',
            imports
        };
    }
    
    // 📦 React组件生成器
    private generateReactComponent(node: CanvasNode, connections: NodeConnection[]): string {
        const componentName = node.data.name || 'GeneratedComponent';
        const props = this.extractPropsFromConnections(node.id, connections);
        const hooks = node.data.hooks || [];
        
        const template = `
interface ${componentName}Props {
    ${props.map(p => `${p.name}: ${p.type};`).join('\n    ')}
}

export const ${componentName}: React.FC<${componentName}Props> = ({ ${props.map(p => p.name).join(', ')} }) => {
    ${hooks.map((h: any) => this.generateHookCode(h)).join('\n    ')}
    
    return (
        <div className="${componentName.toLowerCase()}">
            <h2>{${props[0]?.name || "'Generated Component'"}}</h2>
            {/* TODO: 添加组件内容 */}
        </div>
    );
};`;
        
        return template;
    }
    
    // 🪝 自定义Hook生成器
    private generateCustomHook(node: CanvasNode): string {
        const hookName = node.data.name || 'useGeneratedHook';
        const returnType = node.data.returnType || 'any';
        
        return `
export const ${hookName} = (): ${returnType} => {
    const [state, setState] = React.useState(null);
    
    React.useEffect(() => {
        // TODO: 实现Hook逻辑
    }, []);
    
    return state;
};`;
    }
    
    // 🌐 Context生成器
    private generateContextProvider(node: CanvasNode): string {
        const contextName = node.data.name || 'GeneratedContext';
        
        return `
interface ${contextName}Value {
    // TODO: 定义Context值类型
    value: any;
    setValue: (value: any) => void;
}

const ${contextName} = createContext<${contextName}Value | undefined>(undefined);

export const ${contextName}Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [value, setValue] = React.useState(null);
    
    return (
        <${contextName}.Provider value={{ value, setValue }}>
            {children}
        </${contextName}.Provider>
    );
};

export const use${contextName} = () => {
    const context = useContext(${contextName});
    if (!context) {
        throw new Error('use${contextName} must be used within ${contextName}Provider');
    }
    return context;
};`;
    }
    
    // 🦀 Rust结构体生成器
    private generateRustStruct(node: CanvasNode): string {
        const structName = node.data.name || 'GeneratedStruct';
        const fields = node.data.fields || [];
        const derives = node.data.derives || ['Debug', 'Clone'];
        
        const fieldLines = fields.map((field: any) => 
            `    pub ${field.name}: ${field.type},`
        ).join('\n');
        
        return `
#[derive(${derives.join(', ')})]
pub struct ${structName} {
${fieldLines || '    // TODO: 添加字段'}
}

impl ${structName} {
    pub fn new() -> Self {
        Self {
            ${fields.map((field: any) => `${field.name}: Default::default()`).join(',\n            ') || '// TODO: 初始化字段'}
        }
    }
}`;
    }
    
    // 🔧 Rust函数生成器
    private generateRustFunction(node: CanvasNode): string {
        const funcName = node.data.name || 'generated_function';
        const params = node.data.parameters || [];
        const returnType = node.data.returnType || '()';
        const isAsync = node.data.isAsync || false;
        const visibility = node.data.visibility || 'pub';
        
        const paramStr = params.map((param: any) => 
            `${param.name}: ${param.type}`
        ).join(', ');
        
        const asyncKeyword = isAsync ? 'async ' : '';
        
        return `
${visibility} ${asyncKeyword}fn ${funcName}(${paramStr}) -> ${returnType} {
    // TODO: 实现函数逻辑
    ${returnType === '()' ? '' : 'todo!()'}
}`;
    }
    
    // 🌐 Web处理器生成器
    private generateWebHandler(node: CanvasNode): string {
        const handlerName = node.data.name || 'handler';
        const path = node.data.path || '/api/endpoint';
        const method = node.data.method || 'GET';
        
        return `
pub async fn ${handlerName}() -> impl IntoResponse {
    Json(serde_json::json!({
        "message": "Hello from ${handlerName}",
        "status": "success"
    }))
}

// 注册路由
// Router::new().route("${path}", ${method.toLowerCase()}(${handlerName}))`;
    }
    
    // 🔗 提取连接中的Props
    private extractPropsFromConnections(nodeId: string, connections: NodeConnection[]): PropInfo[] {
        const incomingConnections = connections.filter(c => c.targetId === nodeId);
        const props: PropInfo[] = [];
        
        incomingConnections.forEach(conn => {
            props.push({
                name: conn.targetPort || 'data',
                type: this.mapDataType(conn.dataType || 'any')
            });
        });
        
        // 默认props
        if (props.length === 0) {
            props.push({ name: 'title', type: 'string' });
        }
        
        return props;
    }
    
    // 🎣 Hook代码生成
    private generateHookCode(hook: any): string {
        switch (hook.type) {
            case 'useState':
                return `const [${hook.stateName || 'state'}, set${hook.stateName ? hook.stateName.charAt(0).toUpperCase() + hook.stateName.slice(1) : 'State'}] = React.useState(${hook.initialValue || 'null'});`;
            case 'useEffect':
                return `React.useEffect(() => {\n        // TODO: 实现effect逻辑\n    }, [${hook.dependencies ? hook.dependencies.join(', ') : ''}]);`;
            case 'useCallback':
                return `const ${hook.name || 'callback'} = React.useCallback(() => {\n        // TODO: 实现callback逻辑\n    }, [${hook.dependencies ? hook.dependencies.join(', ') : ''}]);`;
            case 'useMemo':
                return `const ${hook.name || 'memoValue'} = React.useMemo(() => {\n        // TODO: 实现memo计算\n        return null;\n    }, [${hook.dependencies ? hook.dependencies.join(', ') : ''}]);`;
            default:
                return `// Custom hook: ${hook.type}`;
        }
    }
    
    // 📊 数据类型映射
    private mapDataType(dataType: string): string {
        const typeMap: Record<string, string> = {
            'string': 'string',
            'number': 'number',
            'boolean': 'boolean',
            'array': 'any[]',
            'object': 'object',
            'function': '() => void',
            'any': 'any'
        };
        
        return typeMap[dataType] || 'any';
    }
        
        return `
#[derive(Debug, Clone)]
pub struct ${structName} {
    ${fields.map((f: any) => `pub ${f.name}: ${f.type},`).join('\n    ')}
}

impl ${structName} {
    pub fn new(${fields.map((f: any) => `${f.name}: ${f.type}`).join(', ')}) -> Self {
        Self {
            ${fields.map((f: any) => f.name).join(',\n            ')}
        }
    }
}`;
    }
    
    // 🎯 Rust特征生成器
    private generateRustTrait(node: CanvasNode): string {
        const traitName = node.data.name || 'GeneratedTrait';
        const methods = node.data.methods || [];
        
        return `
pub trait ${traitName} {
    ${methods.map((m: any) => `fn ${m.name}(&self) -> ${m.returnType || '()'};`).join('\n    ')}
}`;
    }
    
    // ⚡ Rust函数生成器
    private generateRustFunction(node: CanvasNode): string {
        const funcName = node.data.name || 'generated_function';
        const params = node.data.params || [];
        const returnType = node.data.returnType || '()';
        
        return `
pub fn ${funcName}(${params.map((p: any) => `${p.name}: ${p.type}`).join(', ')}) -> ${returnType} {
    // TODO: 实现函数逻辑
    ${returnType === '()' ? '' : 'unimplemented!()'}
}`;
    }
    
    // 🌐 Web处理器生成器
    private generateWebHandler(node: CanvasNode): string {
        const handlerName = node.data.name || 'handler';
        const method = node.data.method || 'GET';
        const path = node.data.path || '/';
        
        return `
pub async fn ${handlerName}() -> String {
    // TODO: 实现${method} ${path}处理逻辑
    "Hello, World!".to_string()
}

pub fn create_${handlerName}_route() -> Router {
    Router::new().route("${path}", ${method.toLowerCase()}(${handlerName}))
}`;
    }
    
    // 🔧 辅助方法
    private extractPropsFromConnections(nodeId: string, connections: NodeConnection[]): Array<{name: string, type: string}> {
        return connections
            .filter(conn => conn.target === nodeId && conn.type === 'data-flow')
            .map(conn => ({
                name: conn.label?.split(' → ')[0] || 'prop',
                type: 'any' // TODO: 类型推断
            }));
    }
    
    private generateHookCode(hook: any): string {
        switch (hook.type) {
            case 'useState':
                return `const [${hook.stateName}, set${hook.stateName.charAt(0).toUpperCase() + hook.stateName.slice(1)}] = React.useState(${hook.initialValue || 'null'});`;
            case 'useEffect':
                return `React.useEffect(() => {\n        // TODO: 实现副作用逻辑\n    }, []);`;
            default:
                return `// TODO: 实现${hook.type}`;
        }
    }
    
    // 📚 初始化模板库
    private initializeTemplates(): void {
        // React组件模板
        this.templates.set('react-functional-component', {
            id: 'react-functional-component',
            name: 'React函数式组件',
            language: 'typescript',
            category: 'component',
            template: `
interface {{ComponentName}}Props {
    {{#each props}}
    {{name}}: {{type}};
    {{/each}}
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({{ {{#each props}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} }}) => {
    return (
        <div>
            <h2>{{ComponentName}}</h2>
        </div>
    );
};`,
            variables: [
                { name: 'ComponentName', type: 'string', description: '组件名称' },
                { name: 'props', type: 'array', description: '组件属性' }
            ]
        });
        
        // Rust结构体模板
        this.templates.set('rust-struct', {
            id: 'rust-struct',
            name: 'Rust结构体',
            language: 'rust',
            category: 'struct',
            template: `
#[derive(Debug, Clone)]
pub struct {{StructName}} {
    {{#each fields}}
    pub {{name}}: {{type}},
    {{/each}}
}

impl {{StructName}} {
    pub fn new({{#each fields}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}}) -> Self {
        Self {
            {{#each fields}}
            {{name}},
            {{/each}}
        }
    }
}`,
            variables: [
                { name: 'StructName', type: 'string', description: '结构体名称' },
                { name: 'fields', type: 'array', description: '字段列表' }
            ]
        });
    }
    
    // 🎨 代码美化和格式化
    public formatGeneratedCode(code: GeneratedCode): GeneratedCode {
        // TODO: 集成prettier/rustfmt
        return {
            ...code,
            content: this.basicFormat(code.content, code.language)
        };
    }
    
    private basicFormat(content: string, language: string): string {
        // 基础格式化逻辑
        let formatted = content
            .replace(/\n\s*\n\s*\n/g, '\n\n') // 移除多余空行
            .replace(/^\s+/gm, (match) => match.replace(/\t/g, '    ')); // 统一缩进
            
        return formatted.trim();
    }
}
