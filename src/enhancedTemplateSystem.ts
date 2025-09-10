// 🎯 智能代码模板扩展系统
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface CodeTemplate {
    id: string;
    name: string;
    description: string;
    category: 'react' | 'rust' | 'typescript' | 'general';
    language: string;
    framework?: string;
    tags: string[];
    template: string;
    variables: TemplateVariable[];
    dependencies?: string[];
    files?: TemplateFile[];
    customization: TemplateCustomization;
}

export interface TemplateVariable {
    name: string;
    type: 'string' | 'boolean' | 'array' | 'object' | 'choice';
    description: string;
    defaultValue?: any;
    required: boolean;
    choices?: string[];
    validation?: TemplateValidation;
}

export interface TemplateValidation {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    customValidator?: string;
}

export interface TemplateFile {
    path: string;
    content: string;
    executable?: boolean;
}

export interface TemplateCustomization {
    allowStyleCustomization: boolean;
    allowStructureModification: boolean;
    allowDependencySelection: boolean;
    supportedFrameworkVersions?: string[];
}

export interface GenerationContext {
    projectPath: string;
    language: string;
    framework?: string;
    existingCode?: string;
    userPreferences: Record<string, any>;
    variables: Record<string, any>;
}

export class EnhancedTemplateSystem {
    private templates: Map<string, CodeTemplate> = new Map();
    private userTemplates: Map<string, CodeTemplate> = new Map();
    private templateCache: Map<string, string> = new Map();
    
    constructor(private context: vscode.ExtensionContext) {
        this.loadBuiltInTemplates();
        this.loadUserTemplates();
    }
    
    // 🏗️ 加载内置模板
    private loadBuiltInTemplates(): void {
        const builtInTemplates: CodeTemplate[] = [
            {
                id: 'react-functional-component',
                name: 'React函数式组件',
                description: '创建现代化的React函数式组件，支持Hooks和TypeScript',
                category: 'react',
                language: 'typescript',
                framework: 'react',
                tags: ['component', 'hooks', 'typescript'],
                template: this.getReactComponentTemplate(),
                variables: [
                    {
                        name: 'componentName',
                        type: 'string',
                        description: '组件名称 (PascalCase)',
                        defaultValue: 'MyComponent',
                        required: true,
                        validation: {
                            pattern: '^[A-Z][a-zA-Z0-9]*$',
                            minLength: 2,
                            maxLength: 50
                        }
                    },
                    {
                        name: 'hasProps',
                        type: 'boolean',
                        description: '是否需要Props接口',
                        defaultValue: true,
                        required: false
                    },
                    {
                        name: 'hooks',
                        type: 'array',
                        description: '使用的React Hooks',
                        defaultValue: [],
                        required: false,
                        choices: ['useState', 'useEffect', 'useContext', 'useReducer', 'useMemo', 'useCallback']
                    },
                    {
                        name: 'styling',
                        type: 'choice',
                        description: '样式方案',
                        defaultValue: 'css-modules',
                        required: false,
                        choices: ['css-modules', 'styled-components', 'emotion', 'tailwind', 'none']
                    }
                ],
                dependencies: ['react', '@types/react'],
                customization: {
                    allowStyleCustomization: true,
                    allowStructureModification: true,
                    allowDependencySelection: true,
                    supportedFrameworkVersions: ['18.x', '17.x', '16.x']
                }
            },
            {
                id: 'rust-service',
                name: 'Rust微服务',
                description: '创建完整的Rust微服务架构，包含错误处理和异步支持',
                category: 'rust',
                language: 'rust',
                framework: 'axum',
                tags: ['service', 'async', 'web', 'microservice'],
                template: this.getRustServiceTemplate(),
                variables: [
                    {
                        name: 'serviceName',
                        type: 'string',
                        description: '服务名称 (snake_case)',
                        defaultValue: 'my_service',
                        required: true,
                        validation: {
                            pattern: '^[a-z][a-z0-9_]*$',
                            minLength: 2,
                            maxLength: 30
                        }
                    },
                    {
                        name: 'useDatabase',
                        type: 'boolean',
                        description: '是否使用数据库',
                        defaultValue: true,
                        required: false
                    },
                    {
                        name: 'database',
                        type: 'choice',
                        description: '数据库类型',
                        defaultValue: 'postgresql',
                        required: false,
                        choices: ['postgresql', 'mysql', 'sqlite', 'mongodb']
                    },
                    {
                        name: 'features',
                        type: 'array',
                        description: '服务功能',
                        defaultValue: ['auth', 'logging'],
                        required: false,
                        choices: ['auth', 'logging', 'metrics', 'tracing', 'caching', 'rate-limiting']
                    }
                ],
                dependencies: ['axum', 'tokio', 'serde', 'serde_json'],
                customization: {
                    allowStyleCustomization: false,
                    allowStructureModification: true,
                    allowDependencySelection: true,
                    supportedFrameworkVersions: ['1.70+']
                }
            },
            {
                id: 'typescript-class',
                name: 'TypeScript类',
                description: '创建完整的TypeScript类，支持装饰器和泛型',
                category: 'typescript',
                language: 'typescript',
                tags: ['class', 'generic', 'decorator'],
                template: this.getTypeScriptClassTemplate(),
                variables: [
                    {
                        name: 'className',
                        type: 'string',
                        description: '类名称 (PascalCase)',
                        defaultValue: 'MyClass',
                        required: true,
                        validation: {
                            pattern: '^[A-Z][a-zA-Z0-9]*$',
                            minLength: 2,
                            maxLength: 50
                        }
                    },
                    {
                        name: 'isGeneric',
                        type: 'boolean',
                        description: '是否使用泛型',
                        defaultValue: false,
                        required: false
                    },
                    {
                        name: 'decorators',
                        type: 'array',
                        description: '使用的装饰器',
                        defaultValue: [],
                        required: false,
                        choices: ['Injectable', 'Component', 'Service', 'Controller']
                    }
                ],
                customization: {
                    allowStyleCustomization: false,
                    allowStructureModification: true,
                    allowDependencySelection: false
                }
            }
        ];
        
        builtInTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }
    
    // 👤 加载用户自定义模板
    private async loadUserTemplates(): Promise<void> {
        try {
            const templatesPath = path.join(this.context.globalStorageUri.fsPath, 'templates.json');
            
            if (fs.existsSync(templatesPath)) {
                const templatesData = fs.readFileSync(templatesPath, 'utf8');
                const userTemplatesData = JSON.parse(templatesData);
                
                userTemplatesData.forEach((template: CodeTemplate) => {
                    this.userTemplates.set(template.id, template);
                });
            }
        } catch (error) {
            console.warn('Failed to load user templates:', error);
        }
    }
    
    // 💾 保存用户模板
    public async saveUserTemplate(template: CodeTemplate): Promise<void> {
        this.userTemplates.set(template.id, template);
        
        try {
            const templatesPath = path.join(this.context.globalStorageUri.fsPath, 'templates.json');
            const userTemplatesArray = Array.from(this.userTemplates.values());
            
            // 确保目录存在
            const dir = path.dirname(templatesPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(templatesPath, JSON.stringify(userTemplatesArray, null, 2));
            
            vscode.window.showInformationMessage(`✅ 模板 "${template.name}" 已保存`);
        } catch (error) {
            vscode.window.showErrorMessage(`保存模板失败: ${error}`);
        }
    }
    
    // 📋 获取所有模板
    public getAllTemplates(): CodeTemplate[] {
        const allTemplates = [
            ...Array.from(this.templates.values()),
            ...Array.from(this.userTemplates.values())
        ];
        
        return allTemplates.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // 🔍 搜索模板
    public searchTemplates(query: string, category?: string): CodeTemplate[] {
        const allTemplates = this.getAllTemplates();
        const lowerQuery = query.toLowerCase();
        
        return allTemplates.filter(template => {
            const matchesQuery = 
                template.name.toLowerCase().includes(lowerQuery) ||
                template.description.toLowerCase().includes(lowerQuery) ||
                template.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
            
            const matchesCategory = !category || template.category === category;
            
            return matchesQuery && matchesCategory;
        });
    }
    
    // 🎯 智能生成代码
    public async generateCode(
        templateId: string, 
        context: GenerationContext
    ): Promise<{ content: string; files?: TemplateFile[] }> {
        const template = this.templates.get(templateId) || this.userTemplates.get(templateId);
        
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }
        
        // 验证变量
        this.validateVariables(template, context.variables);
        
        // 生成主要内容
        const content = await this.processTemplate(template.template, context);
        
        // 生成附加文件
        const files = template.files ? 
            await Promise.all(template.files.map(file => this.processTemplateFile(file, context))) :
            undefined;
        
        return { content, files };
    }
    
    // ✅ 验证模板变量
    private validateVariables(template: CodeTemplate, variables: Record<string, any>): void {
        for (const variable of template.variables) {
            const value = variables[variable.name];
            
            if (variable.required && (value === undefined || value === null)) {
                throw new Error(`Required variable '${variable.name}' is missing`);
            }
            
            if (value !== undefined && variable.validation) {
                this.validateVariable(variable, value);
            }
        }
    }
    
    // 🔧 验证单个变量
    private validateVariable(variable: TemplateVariable, value: any): void {
        const validation = variable.validation!;
        
        if (validation.pattern && typeof value === 'string') {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
                throw new Error(`Variable '${variable.name}' does not match pattern ${validation.pattern}`);
            }
        }
        
        if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
            throw new Error(`Variable '${variable.name}' is too short (minimum ${validation.minLength})`);
        }
        
        if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
            throw new Error(`Variable '${variable.name}' is too long (maximum ${validation.maxLength})`);
        }
    }
    
    // 🏭 处理模板内容
    private async processTemplate(template: string, context: GenerationContext): Promise<string> {
        let processed = template;
        
        // 替换变量
        for (const [key, value] of Object.entries(context.variables)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            processed = processed.replace(regex, this.formatValue(value));
        }
        
        // 处理条件语句 {{#if variable}}...{{/if}}
        processed = this.processConditionals(processed, context.variables);
        
        // 处理循环语句 {{#each array}}...{{/each}}
        processed = this.processLoops(processed, context.variables);
        
        // 智能代码分析和优化建议
        processed = await this.applyIntelligentOptimizations(processed, context);
        
        return processed;
    }
    
    // 📁 处理模板文件
    private async processTemplateFile(file: TemplateFile, context: GenerationContext): Promise<TemplateFile> {
        return {
            path: await this.processTemplate(file.path, context),
            content: await this.processTemplate(file.content, context),
            executable: file.executable
        };
    }
    
    // 🔄 处理条件语句
    private processConditionals(template: string, variables: Record<string, any>): string {
        const conditionalRegex = /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs;
        
        return template.replace(conditionalRegex, (match, variable, content) => {
            const value = variables[variable];
            return this.isTruthy(value) ? content : '';
        });
    }
    
    // 🔁 处理循环语句
    private processLoops(template: string, variables: Record<string, any>): string {
        const loopRegex = /\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs;
        
        return template.replace(loopRegex, (match, variable, content) => {
            const array = variables[variable];
            
            if (!Array.isArray(array)) {
                return '';
            }
            
            return array.map((item, index) => {
                let itemContent = content;
                itemContent = itemContent.replace(/\{\{this\}\}/g, this.formatValue(item));
                itemContent = itemContent.replace(/\{\{@index\}\}/g, index.toString());
                return itemContent;
            }).join('\n');
        });
    }
    
    // 🧠 应用智能优化
    private async applyIntelligentOptimizations(
        code: string, 
        context: GenerationContext
    ): Promise<string> {
        // 基于语言的优化
        switch (context.language) {
            case 'typescript':
            case 'javascript':
                return this.optimizeJavaScriptCode(code, context);
            case 'rust':
                return this.optimizeRustCode(code, context);
            default:
                return code;
        }
    }
    
    // ⚛️ 优化JavaScript/TypeScript代码
    private optimizeJavaScriptCode(code: string, context: GenerationContext): string {
        // 添加严格模式
        if (!code.includes('"use strict"') && !code.includes("'use strict'")) {
            code = '"use strict";\n\n' + code;
        }
        
        // 优化导入语句
        code = this.optimizeImports(code);
        
        // 添加JSDoc注释
        code = this.addJSDocComments(code);
        
        return code;
    }
    
    // 🦀 优化Rust代码
    private optimizeRustCode(code: string, context: GenerationContext): string {
        // 添加标准属性
        if (!code.includes('#![')) {
            code = '#![warn(clippy::all)]\n\n' + code;
        }
        
        // 优化use语句
        code = this.optimizeRustUses(code);
        
        return code;
    }
    
    // 📦 优化导入语句
    private optimizeImports(code: string): string {
        const lines = code.split('\n');
        const imports: string[] = [];
        const otherLines: string[] = [];
        
        for (const line of lines) {
            if (line.trim().startsWith('import ') || line.trim().startsWith('const ') && line.includes('require(')) {
                imports.push(line);
            } else {
                otherLines.push(line);
            }
        }
        
        // 按字母顺序排序导入
        imports.sort();
        
        return [...imports, '', ...otherLines].join('\n');
    }
    
    // 📝 添加JSDoc注释
    private addJSDocComments(code: string): string {
        // 为函数添加基本的JSDoc注释
        const functionRegex = /(export\s+)?(async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
        
        return code.replace(functionRegex, (match, exportKeyword, asyncKeyword, functionName) => {
            const jsdoc = `/**\n * ${functionName}的描述\n * @returns {any} 返回值描述\n */\n`;
            return jsdoc + match;
        });
    }
    
    // 🦀 优化Rust use语句
    private optimizeRustUses(code: string): string {
        const lines = code.split('\n');
        const uses: string[] = [];
        const otherLines: string[] = [];
        
        for (const line of lines) {
            if (line.trim().startsWith('use ')) {
                uses.push(line);
            } else {
                otherLines.push(line);
            }
        }
        
        // 按标准库、外部crate、内部模块排序
        uses.sort((a, b) => {
            const aIsStd = a.includes('std::');
            const bIsStd = b.includes('std::');
            
            if (aIsStd && !bIsStd) return -1;
            if (!aIsStd && bIsStd) return 1;
            
            return a.localeCompare(b);
        });
        
        return [...uses, '', ...otherLines].join('\n');
    }
    
    // 🎯 格式化值
    private formatValue(value: any): string {
        if (Array.isArray(value)) {
            return value.map(v => this.formatValue(v)).join(', ');
        }
        
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        
        return String(value);
    }
    
    // ✅ 检查值是否为真
    private isTruthy(value: any): boolean {
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        
        return Boolean(value);
    }
    
    // 🎨 React组件模板
    private getReactComponentTemplate(): string {
        return `import React{{#if hooks}}, { {{#each hooks}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} }{{/if}} from 'react';
{{#if hasProps}}

interface {{componentName}}Props {
  // 定义组件Props
  className?: string;
  children?: React.ReactNode;
}
{{/if}}

/**
 * {{componentName}} - 描述组件功能
 * @param props - 组件属性
 * @returns JSX元素
 */
const {{componentName}}: React.FC{{#if hasProps}}<{{componentName}}Props>{{/if}} = ({{#if hasProps}}props{{/if}}) => {
{{#if hooks}}
{{#each hooks}}
  {{#if this == 'useState'}}
  const [state, setState] = useState();
  {{/if}}
  {{#if this == 'useEffect'}}
  useEffect(() => {
    // Effect logic here
  }, []);
  {{/if}}
{{/each}}
{{/if}}

  return (
    <div{{#if hasProps}} className={props.className}{{/if}}>
      <h2>{{componentName}}</h2>
      {{#if hasProps}}{props.children}{{/if}}
    </div>
  );
};

export default {{componentName}};`;
    }
    
    // 🦀 Rust服务模板
    private getRustServiceTemplate(): string {
        return `use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::net::TcpListener;
{{#if useDatabase}}
use sqlx::PgPool;
{{/if}}

#[derive(Debug, Serialize, Deserialize)]
pub struct {{pascalCase serviceName}}Request {
    // 请求结构定义
}

#[derive(Debug, Serialize, Deserialize)]
pub struct {{pascalCase serviceName}}Response {
    // 响应结构定义
    success: bool,
    message: String,
}

#[derive(Debug, Clone)]
pub struct AppState {
{{#if useDatabase}}
    db: PgPool,
{{/if}}
    // 应用状态
}

/// {{serviceName}}的主处理函数
pub async fn handle_{{serviceName}}(
    State(state): State<AppState>,
    Json(payload): Json<{{pascalCase serviceName}}Request>,
) -> Result<Json<{{pascalCase serviceName}}Response>, StatusCode> {
    // 业务逻辑处理
    
    Ok(Json({{pascalCase serviceName}}Response {
        success: true,
        message: "操作成功".to_string(),
    }))
}

/// 健康检查端点
pub async fn health_check() -> Json<HashMap<String, String>> {
    let mut response = HashMap::new();
    response.insert("status".to_string(), "healthy".to_string());
    Json(response)
}

/// 创建应用路由
pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/{{serviceName}}", post(handle_{{serviceName}}))
        .with_state(state)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
{{#if useDatabase}}
    // 连接数据库
    let db = sqlx::postgres::PgPoolOptions::new()
        .max_connections(10)
        .connect(&std::env::var("DATABASE_URL")?)
        .await?;
{{/if}}

    let state = AppState {
{{#if useDatabase}}
        db,
{{/if}}
    };

    let app = create_router(state);
    let listener = TcpListener::bind("0.0.0.0:3000").await?;
    
    println!("🚀 {{serviceName}} 服务启动在 http://0.0.0.0:3000");
    
    axum::serve(listener, app).await?;
    Ok(())
}`;
    }
    
    // 📝 TypeScript类模板
    private getTypeScriptClassTemplate(): string {
        return `{{#each decorators}}
@{{this}}
{{/each}}
export class {{className}}{{#if isGeneric}}<T>{{/if}} {
    private _id: string;
    
    constructor() {
        this._id = crypto.randomUUID();
    }
    
    /**
     * 获取实例ID
     * @returns 实例唯一标识符
     */
    public getId(): string {
        return this._id;
    }
    
    /**
     * 主要业务方法
     * @param data - 输入数据
     * @returns 处理结果
     */
    public process(data: {{#if isGeneric}}T{{else}}any{{/if}}): {{#if isGeneric}}T{{else}}any{{/if}} {
        // 业务逻辑实现
        return data;
    }
}`;
    }
}

// 工厂函数
export function createEnhancedTemplateSystem(context: vscode.ExtensionContext): EnhancedTemplateSystem {
    return new EnhancedTemplateSystem(context);
}
