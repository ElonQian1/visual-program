import * as vscode from 'vscode';

// 节点接口定义
export interface CanvasNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
        name?: string;
        fields?: Array<{ name: string; type: string }>;
        props?: Array<{ name: string; type: string; required?: boolean }>;
        methods?: Array<{ name: string; returnType?: string; parameters?: Array<{ name: string; type: string }> }>;
        hooks?: Array<{ type: string; name?: string; initialValue?: any }>;
        [key: string]: any;
    };
}

export interface NodeConnection {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
    label?: string;
}

export interface PropInfo {
    name: string;
    type: string;
    required: boolean;
}

export interface GeneratedCode {
    content: string;
    language: string;
    filename: string;
    type: 'component' | 'function' | 'struct' | 'trait' | 'service' | 'test';
}

export interface CodeTemplate {
    id: string;
    name: string;
    language: string;
    category: string;
    template: string;
    variables: Array<{ name: string; type: string; description: string }>;
}

// 🚀 增强代码生成引擎
export class CodeGenerationEngine {
    private templates: Map<string, CodeTemplate> = new Map();

    constructor() {
        this.initializeTemplates();
    }

    // 🎯 主要代码生成方法
    public generateFromCanvas(nodes: CanvasNode[], connections: NodeConnection[]): GeneratedCode[] {
        const generatedFiles: GeneratedCode[] = [];

        // 按节点类型分组生成
        const reactNodes = nodes.filter(node => node.type.startsWith('react-'));
        const rustNodes = nodes.filter(node => node.type.startsWith('rust-'));

        // 生成React代码
        reactNodes.forEach(node => {
            const code = this.generateReactCode(node, connections);
            if (code) generatedFiles.push(code);
        });

        // 生成Rust代码
        rustNodes.forEach(node => {
            const code = this.generateRustCode(node, connections);
            if (code) generatedFiles.push(code);
        });

        return generatedFiles;
    }

    // 🔧 React代码生成
    private generateReactCode(node: CanvasNode, connections: NodeConnection[]): GeneratedCode | null {
        switch (node.type) {
            case 'react-component':
                return this.generateReactComponent(node, connections);
            case 'react-hook':
                return this.generateReactHook(node);
            default:
                return null;
        }
    }

    // 🦀 Rust代码生成
    private generateRustCode(node: CanvasNode, connections: NodeConnection[]): GeneratedCode | null {
        switch (node.type) {
            case 'rust-struct':
                return this.generateRustStruct(node);
            case 'rust-function':
                return this.generateRustFunction(node);
            case 'rust-trait':
                return this.generateRustTrait(node);
            case 'rust-handler':
                return this.generateWebHandler(node);
            default:
                return null;
        }
    }

    // ⚛️ React组件生成器
    private generateReactComponent(node: CanvasNode, connections: NodeConnection[]): GeneratedCode {
        const componentName = node.data.name || 'Component';
        const props = this.extractPropsFromConnections(node.id, connections);
        const hooks = node.data.hooks || [];

        const propsInterface = props.length > 0 ? `
interface ${componentName}Props {
    ${props.map(prop => `${prop.name}${prop.required ? '' : '?'}: ${prop.type};`).join('\n    ')}
}` : '';

        const hooksCode = hooks.map(hook => this.generateHookCode(hook)).join('\n    ');
        const propsParam = props.length > 0 ? `{ ${props.map(p => p.name).join(', ')} }: ${componentName}Props` : '';

        const content = `import React from 'react';
${propsInterface}

export const ${componentName}: React.FC${props.length > 0 ? `<${componentName}Props>` : ''} = (${propsParam}) => {
    ${hooksCode}

    return (
        <div className="${componentName.toLowerCase()}">
            <h2>${componentName}</h2>
            {/* TODO: 实现组件内容 */}
        </div>
    );
};

export default ${componentName};`;

        return {
            content,
            language: 'typescript',
            filename: `${componentName}.tsx`,
            type: 'component'
        };
    }

    // 🎣 React Hook生成器
    private generateReactHook(node: CanvasNode): GeneratedCode {
        const hookName = node.data.name || 'useCustomHook';
        const returnType = node.data.returnType || 'void';

        const content = `import { useState, useEffect } from 'react';

export const ${hookName} = (): ${returnType} => {
    // TODO: 实现Hook逻辑
    
    return {} as ${returnType};
};`;

        return {
            content,
            language: 'typescript',
            filename: `${hookName}.ts`,
            type: 'function'
        };
    }

    // 🏗️ Rust结构体生成器
    private generateRustStruct(node: CanvasNode): GeneratedCode {
        const structName = node.data.name || 'GeneratedStruct';
        const fields = node.data.fields || [];
        const derives = node.data.derives || ['Debug', 'Clone'];

        const fieldLines = fields.map((field: any) => 
            `    pub ${field.name}: ${field.type},`
        ).join('\n');

        const content = `#[derive(${derives.join(', ')})]
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

        return {
            content,
            language: 'rust',
            filename: `${structName.toLowerCase()}.rs`,
            type: 'struct'
        };
    }

    // ⚡ Rust函数生成器
    private generateRustFunction(node: CanvasNode): GeneratedCode {
        const funcName = node.data.name || 'generated_function';
        const params = node.data.parameters || [];
        const returnType = node.data.returnType || '()';
        const isAsync = node.data.isAsync || false;
        const visibility = node.data.visibility || 'pub';

        const paramStr = params.map((param: any) => 
            `${param.name}: ${param.type}`
        ).join(', ');

        const asyncKeyword = isAsync ? 'async ' : '';

        const content = `${visibility} ${asyncKeyword}fn ${funcName}(${paramStr}) -> ${returnType} {
    // TODO: 实现函数逻辑
    ${returnType === '()' ? '' : 'todo!()'}
}`;

        return {
            content,
            language: 'rust',
            filename: `${funcName}.rs`,
            type: 'function'
        };
    }

    // 🎯 Rust特征生成器
    private generateRustTrait(node: CanvasNode): GeneratedCode {
        const traitName = node.data.name || 'GeneratedTrait';
        const methods = node.data.methods || [];

        const content = `pub trait ${traitName} {
    ${methods.map((m: any) => `fn ${m.name}(&self) -> ${m.returnType || '()'};`).join('\n    ')}
}`;

        return {
            content,
            language: 'rust',
            filename: `${traitName.toLowerCase()}.rs`,
            type: 'trait'
        };
    }

    // 🌐 Web处理器生成器
    private generateWebHandler(node: CanvasNode): GeneratedCode {
        const handlerName = node.data.name || 'handler';
        const path = node.data.path || '/api/endpoint';
        const method = node.data.method || 'GET';

        const content = `use axum::{response::Json, routing::${method.toLowerCase()}, Router};
use serde_json::json;

pub async fn ${handlerName}() -> Json<serde_json::Value> {
    Json(json!({
        "message": "${handlerName} handler",
        "path": "${path}",
        "method": "${method}"
    }))
}

pub fn create_${handlerName}_route() -> Router {
    Router::new().route("${path}", ${method.toLowerCase()}(${handlerName}))
}`;

        return {
            content,
            language: 'rust',
            filename: `${handlerName}.rs`,
            type: 'service'
        };
    }

    // 🔧 辅助方法 
    private extractPropsFromConnections(nodeId: string, connections: NodeConnection[]): PropInfo[] {
        return connections
            .filter(conn => conn.target === nodeId)
            .map(conn => ({
                name: conn.sourceHandle || 'prop',
                type: 'any', // TODO: 从源节点推断类型
                required: true
            }));
    }

    private generateHookCode(hook: any): string {
        switch (hook.type) {
            case 'useState':
                return `const [${hook.name}, set${this.capitalize(hook.name)}] = useState(${hook.initialValue || 'null'});`;
            case 'useEffect':
                return `useEffect(() => {\n        // TODO: 实现effect逻辑\n    }, []);`;
            case 'useCallback':
                return `const ${hook.name} = useCallback(() => {\n        // TODO: 实现回调逻辑\n    }, []);`;
            default:
                return `// TODO: 实现${hook.type}`;
        }
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
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

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ {{#each props}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} }) => {
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

// 导出实例
export const codeGenerationEngine = new CodeGenerationEngine();
