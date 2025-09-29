// 智能模板和脚手架系统
import * as vscode from 'vscode';
import * as path from 'path';

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: 'react' | 'rust' | 'fullstack' | 'microservice' | 'component';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    files: TemplateFile[];
    dependencies?: string[];
    scripts?: Record<string, string>;
    setupInstructions?: string[];
}

export interface TemplateFile {
    path: string;
    content: string;
    isTemplate: boolean;
    variables?: Record<string, string>;
}

export interface TemplateVariable {
    name: string;
    type: 'string' | 'boolean' | 'choice' | 'number';
    description: string;
    default?: any;
    choices?: string[];
    required: boolean;
}

export class IntelligentTemplateSystem {
    private templates: Map<string, ProjectTemplate> = new Map();
    private userPreferences: UserPreferences = {
        preferredFramework: 'react',
        codeStyle: 'typescript',
        testingFramework: 'jest',
        stateManagement: 'hooks'
    };
    
    constructor() {
        this.initializeBuiltInTemplates();
    }
    
    // 🚀 快速项目创建
    public async createProject(templateId: string, targetPath: string, variables: Record<string, any>): Promise<void> {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`模板 ${templateId} 不存在`);
        }
        
        vscode.window.showInformationMessage(`🎯 正在创建项目: ${template.name}`);
        
        // 创建项目文件夹
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetPath));
        
        // 处理模板文件
        for (const file of template.files) {
            const filePath = path.join(targetPath, this.processPath(file.path, variables));
            const content = file.isTemplate ? 
                this.processTemplate(file.content, variables) : 
                file.content;
                
            await this.createFileFromTemplate(filePath, content);
        }
        
        // 安装依赖
        if (template.dependencies?.length) {
            await this.installDependencies(targetPath, template.dependencies);
        }
        
        // 执行初始化脚本
        if (template.scripts) {
            await this.runInitializationScripts(targetPath, template.scripts);
        }
        
        vscode.window.showInformationMessage(`✅ 项目创建完成: ${template.name}`);
        
        // 显示设置说明
        if (template.setupInstructions?.length) {
            this.showSetupInstructions(template.setupInstructions);
        }
    }
    
    // 🧩 智能组件生成
    public async generateComponent(componentType: 'functional' | 'class' | 'hook', 
                                 componentName: string, 
                                 options: ComponentOptions): Promise<string> {
        const template = this.getComponentTemplate(componentType, options);
        const variables = {
            componentName,
            ...options,
            timestamp: new Date().toISOString(),
            author: vscode.workspace.getConfiguration().get('user.name', 'Developer')
        };
        
        return this.processTemplate(template, variables);
    }
    
    // 📋 模板目录和搜索
    public getAvailableTemplates(category?: string): ProjectTemplate[] {
        const templates = Array.from(this.templates.values());
        
        if (category) {
            return templates.filter(t => t.category === category);
        }
        
        return templates;
    }
    
    public searchTemplates(query: string): ProjectTemplate[] {
        const templates = Array.from(this.templates.values());
        const lowerQuery = query.toLowerCase();
        
        return templates.filter(template => 
            template.name.toLowerCase().includes(lowerQuery) ||
            template.description.toLowerCase().includes(lowerQuery) ||
            template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }
    
    // 🎨 自定义模板创建
    public async createCustomTemplate(name: string, 
                                    sourceFiles: string[], 
                                    variables: TemplateVariable[]): Promise<string> {
        const template: ProjectTemplate = {
            id: `custom-${Date.now()}`,
            name,
            description: `自定义模板: ${name}`,
            category: 'component', // 默认类别
            difficulty: 'intermediate',
            tags: ['custom', 'user-generated'],
            files: []
        };
        
        // 从源文件创建模板文件
        for (const sourcePath of sourceFiles) {
            const uri = vscode.Uri.file(sourcePath);
            const content = await vscode.workspace.fs.readFile(uri);
            const contentStr = Buffer.from(content).toString('utf8');
            
            template.files.push({
                path: path.relative(path.dirname(sourceFiles[0]), sourcePath),
                content: this.extractTemplateVariables(contentStr, variables),
                isTemplate: true,
                variables: this.extractVariablesFromContent(contentStr)
            });
        }
        
        this.templates.set(template.id, template);
        
        vscode.window.showInformationMessage(`✨ 自定义模板 "${name}" 创建成功`);
        return template.id;
    }
    
    // 🤖 AI 增强模板推荐
    public recommendTemplates(context: ProjectContext): ProjectTemplate[] {
        const recommendations: Array<{ template: ProjectTemplate; score: number }> = [];
        
        for (const template of this.templates.values()) {
            let score = 0;
            
            // 基于项目类型评分
            if (context.projectType === template.category) {score += 30;}
            
            // 基于技术栈评分
            if (context.technologies.some(tech => template.tags.includes(tech))) {
                score += 20;
            }
            
            // 基于用户偏好评分
            if (this.userPreferences.preferredFramework === template.category) {
                score += 15;
            }
            
            // 基于项目规模评分
            if (context.projectSize === 'small' && template.difficulty === 'beginner') {score += 10;}
            if (context.projectSize === 'medium' && template.difficulty === 'intermediate') {score += 10;}
            if (context.projectSize === 'large' && template.difficulty === 'advanced') {score += 10;}
            
            if (score > 20) {
                recommendations.push({ template, score });
            }
        }
        
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(r => r.template);
    }
    
    // 📊 使用统计和分析
    public getTemplateUsageStats(): TemplateStats {
        return {
            totalTemplates: this.templates.size,
            categoryDistribution: this.calculateCategoryDistribution(),
            popularTemplates: this.getPopularTemplates(),
            recentlyUsed: this.getRecentlyUsedTemplates()
        };
    }
    
    // 🔧 模板处理核心逻辑
    private processTemplate(template: string, variables: Record<string, any>): string {
        let processed = template;
        
        // 处理基本变量替换
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            processed = processed.replace(placeholder, String(value));
        });
        
        // 处理条件语句
        processed = this.processConditionals(processed, variables);
        
        // 处理循环语句
        processed = this.processLoops(processed, variables);
        
        // 处理辅助函数
        processed = this.processHelpers(processed, variables);
        
        return processed;
    }
    
    private processConditionals(template: string, variables: Record<string, any>): string {
        const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
        
        return template.replace(conditionalRegex, (match, condition, content) => {
            return variables[condition] ? content : '';
        });
    }
    
    private processLoops(template: string, variables: Record<string, any>): string {
        const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
        
        return template.replace(loopRegex, (match, arrayName, content) => {
            const array = variables[arrayName];
            if (!Array.isArray(array)) {return '';}
            
            return array.map((item, index) => {
                let itemContent = content;
                itemContent = itemContent.replace(/{{this}}/g, item);
                itemContent = itemContent.replace(/{{@index}}/g, String(index));
                return itemContent;
            }).join('\n');
        });
    }
    
    private processHelpers(template: string, variables: Record<string, any>): string {
        // 处理 camelCase 转换
        template = template.replace(/{{camelCase\s+(\w+)}}/g, (match, varName) => {
            const value = variables[varName];
            return typeof value === 'string' ? this.toCamelCase(value) : value;
        });
        
        // 处理 PascalCase 转换
        template = template.replace(/{{pascalCase\s+(\w+)}}/g, (match, varName) => {
            const value = variables[varName];
            return typeof value === 'string' ? this.toPascalCase(value) : value;
        });
        
        // 处理 kebab-case 转换
        template = template.replace(/{{kebabCase\s+(\w+)}}/g, (match, varName) => {
            const value = variables[varName];
            return typeof value === 'string' ? this.toKebabCase(value) : value;
        });
        
        return template;
    }
    
    private processPath(pathTemplate: string, variables: Record<string, any>): string {
        return this.processTemplate(pathTemplate, variables);
    }
    
    // 🏗️ 内置模板初始化
    private initializeBuiltInTemplates(): void {
        // React 函数组件模板
        this.templates.set('react-functional-component', {
            id: 'react-functional-component',
            name: 'React 函数组件',
            description: '创建一个现代的 React 函数组件，包含 TypeScript 支持',
            category: 'react',
            difficulty: 'beginner',
            tags: ['react', 'typescript', 'functional', 'hooks'],
            files: [
                {
                    path: 'src/components/{{pascalCase componentName}}/{{pascalCase componentName}}.tsx',
                    content: `import React{{#if useHooks}}, { useState, useEffect }{{/if}} from 'react';
{{#if useStyles}}import './{{pascalCase componentName}}.css';{{/if}}

export interface {{pascalCase componentName}}Props {
  {{#each props}}
  {{name}}?: {{type}};
  {{/each}}
}

const {{pascalCase componentName}}: React.FC<{{pascalCase componentName}}Props> = ({{#if props.length}}{ {{#each props}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} }{{/if}}) => {
  {{#if useHooks}}
  const [state, setState] = useState('');
  
  useEffect(() => {
    // 组件挂载时的副作用逻辑
  }, []);
  {{/if}}

  return (
    <div className="{{kebabCase componentName}}">
      <h2>{{componentName}} Component</h2>
      {{#if props.length}}
      <div>
        {{#each props}}
        <p>{{name}}: {{{name}}}</p>
        {{/each}}
      </div>
      {{/if}}
    </div>
  );
};

export default {{pascalCase componentName}};`,
                    isTemplate: true
                },
                {
                    path: 'src/components/{{pascalCase componentName}}/{{pascalCase componentName}}.css',
                    content: `.{{kebabCase componentName}} {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.{{kebabCase componentName}} h2 {
  margin: 0 0 1rem 0;
  color: #333;
}`,
                    isTemplate: true
                }
            ]
        });
        
        // Rust 微服务模板
        this.templates.set('rust-microservice', {
            id: 'rust-microservice',
            name: 'Rust 微服务',
            description: '创建一个完整的 Rust 微服务，包含 API 和数据库支持',
            category: 'rust',
            difficulty: 'advanced',
            tags: ['rust', 'microservice', 'api', 'tokio', 'axum'],
            files: [
                {
                    path: 'src/main.rs',
                    content: `use axum::{
    routing::{get, post},
    http::StatusCode,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

#[derive(Serialize, Deserialize)]
struct {{pascalCase serviceName}}Request {
    data: String,
}

#[derive(Serialize, Deserialize)]
struct {{pascalCase serviceName}}Response {
    message: String,
    success: bool,
}

async fn health_check() -> &'static str {
    "{{serviceName}} service is running"
}

async fn handle_{{camelCase serviceName}}_request(
    Json(payload): Json<{{pascalCase serviceName}}Request>,
) -> Result<Json<{{pascalCase serviceName}}Response>, StatusCode> {
    let response = {{pascalCase serviceName}}Response {
        message: format!("Processed: {}", payload.data),
        success: true,
    };
    
    Ok(Json(response))
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/{{kebabCase serviceName}}", post(handle_{{camelCase serviceName}}_request));

    let addr = SocketAddr::from(([127, 0, 0, 1], {{port}}));
    println!("{{serviceName}} service listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}`,
                    isTemplate: true
                },
                {
                    path: 'Cargo.toml',
                    content: `[package]
name = "{{kebabCase serviceName}}"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.6"
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"`,
                    isTemplate: true
                }
            ],
            dependencies: ['axum', 'tokio', 'serde'],
            setupInstructions: [
                '运行 cargo build 编译项目',
                '使用 cargo run 启动服务',
                '访问 http://localhost:{{port}}/health 检查服务状态'
            ]
        });
        
        // 全栈项目模板
        this.templates.set('fullstack-app', {
            id: 'fullstack-app',
            name: '全栈应用',
            description: '创建包含 React 前端和 Rust 后端的完整应用',
            category: 'fullstack',
            difficulty: 'advanced',
            tags: ['react', 'rust', 'fullstack', 'typescript', 'api'],
            files: [
                // 这里会包含更多的文件结构
            ]
        });
    }
    
    // 辅助方法
    private async createFileFromTemplate(filePath: string, content: string): Promise<void> {
        const uri = vscode.Uri.file(filePath);
        const dirUri = vscode.Uri.file(path.dirname(filePath));
        
        try {
            await vscode.workspace.fs.createDirectory(dirUri);
        } catch (error) {
            // 目录可能已存在
        }
        
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
    }
    
    private async installDependencies(projectPath: string, dependencies: string[]): Promise<void> {
        const terminal = vscode.window.createTerminal({
            name: 'Template Setup',
            cwd: projectPath
        });
        
        // 检查项目类型并安装对应依赖
        if (dependencies.some(dep => ['react', 'typescript', 'next'].includes(dep))) {
            terminal.sendText(`npm install ${dependencies.join(' ')}`);
        } else if (dependencies.some(dep => ['axum', 'tokio', 'serde'].includes(dep))) {
            terminal.sendText(`cargo add ${dependencies.join(' ')}`);
        }
        
        terminal.show();
    }
    
    private async runInitializationScripts(projectPath: string, scripts: Record<string, string>): Promise<void> {
        for (const [name, command] of Object.entries(scripts)) {
            const terminal = vscode.window.createTerminal({
                name: `Setup: ${name}`,
                cwd: projectPath
            });
            terminal.sendText(command);
        }
    }
    
    private showSetupInstructions(instructions: string[]): void {
        const message = '📋 项目设置说明：\n' + instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n');
        vscode.window.showInformationMessage(message, { modal: true });
    }
    
    private getComponentTemplate(type: string, options: ComponentOptions): string {
        // 根据组件类型返回相应模板
        return this.templates.get('react-functional-component')?.files[0]?.content || '';
    }
    
    private extractTemplateVariables(content: string, variables: TemplateVariable[]): string {
        // 将实际值替换为模板变量
        let templateContent = content;
        
        variables.forEach(variable => {
            if (variable.default) {
                const regex = new RegExp(variable.default.toString(), 'g');
                templateContent = templateContent.replace(regex, `{{${variable.name}}}`);
            }
        });
        
        return templateContent;
    }
    
    private extractVariablesFromContent(content: string): Record<string, string> {
        const variables: Record<string, string> = {};
        const matches = content.match(/{{(\w+)}}/g);
        
        if (matches) {
            matches.forEach(match => {
                const varName = match.replace(/[{}]/g, '');
                variables[varName] = 'string';
            });
        }
        
        return variables;
    }
    
    private calculateCategoryDistribution(): Record<string, number> {
        const distribution: Record<string, number> = {};
        
        for (const template of this.templates.values()) {
            distribution[template.category] = (distribution[template.category] || 0) + 1;
        }
        
        return distribution;
    }
    
    private getPopularTemplates(): string[] {
        // 模拟热门模板
        return ['react-functional-component', 'rust-microservice', 'fullstack-app'];
    }
    
    private getRecentlyUsedTemplates(): string[] {
        // 模拟最近使用的模板
        return ['react-functional-component'];
    }
    
    // 字符串转换辅助函数
    private toCamelCase(str: string): string {
        return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    }
    
    private toPascalCase(str: string): string {
        const camelCase = this.toCamelCase(str);
        return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
    }
    
    private toKebabCase(str: string): string {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
}

// 类型定义
interface ComponentOptions {
    useHooks?: boolean;
    useStyles?: boolean;
    props?: Array<{ name: string; type: string }>;
}

interface ProjectContext {
    projectType: string;
    technologies: string[];
    projectSize: 'small' | 'medium' | 'large';
}

interface UserPreferences {
    preferredFramework: string;
    codeStyle: string;
    testingFramework: string;
    stateManagement: string;
}

interface TemplateStats {
    totalTemplates: number;
    categoryDistribution: Record<string, number>;
    popularTemplates: string[];
    recentlyUsed: string[];
}
