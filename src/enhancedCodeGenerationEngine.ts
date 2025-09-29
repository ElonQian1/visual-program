import * as vscode from 'vscode';

// 增强代码生成引擎 - React和Rust专用
export interface EnhancedCodeGenerationResult {
    generatedCode: string;
    language: 'react' | 'rust';
    category: 'component' | 'hook' | 'service' | 'struct' | 'trait' | 'module';
    optimizations: string[];
    bestPractices: string[];
    performance: {
        estimatedRenderTime?: number; // React组件
        memoryUsage?: number; // Rust代码
        complexity: 'low' | 'medium' | 'high';
    };
}

export interface ReactCodeGenerationOptions {
    componentType: 'functional' | 'class';
    stateManagement: 'useState' | 'useReducer' | 'context' | 'redux';
    styling: 'css' | 'styled-components' | 'emotion' | 'tailwind';
    hooks: string[];
    typescript: boolean;
    optimizeForPerformance: boolean;
}

export interface RustCodeGenerationOptions {
    moduleType: 'struct' | 'enum' | 'trait' | 'impl' | 'function';
    asyncPattern: boolean;
    errorHandling: 'result' | 'option' | 'panic';
    memoryOptimization: boolean;
    concurrency: 'none' | 'threads' | 'async' | 'channels';
    safetyLevel: 'safe' | 'unsafe-minimal' | 'unsafe-optimized';
}

export class EnhancedCodeGenerationEngine {
    constructor() {}

    // React代码生成
    async generateReactCode(
        description: string, 
        options: ReactCodeGenerationOptions
    ): Promise<EnhancedCodeGenerationResult> {
        const code = this.generateReactComponentFromDescription(description, options);
        
        return {
            generatedCode: code,
            language: 'react',
            category: 'component',
            optimizations: this.getReactOptimizations(options),
            bestPractices: this.getReactBestPractices(options),
            performance: {
                estimatedRenderTime: this.estimateReactRenderTime(code),
                complexity: this.assessComplexity(code)
            }
        };
    }

    // Rust代码生成
    async generateRustCode(
        description: string,
        options: RustCodeGenerationOptions
    ): Promise<EnhancedCodeGenerationResult> {
        const code = this.generateRustModuleFromDescription(description, options);
        
        return {
            generatedCode: code,
            language: 'rust',
            category: options.moduleType as any,
            optimizations: this.getRustOptimizations(options),
            bestPractices: this.getRustBestPractices(options),
            performance: {
                memoryUsage: this.estimateRustMemoryUsage(code),
                complexity: this.assessComplexity(code)
            }
        };
    }

    // 🔧 公共方法：生成React组件
    public generateReactComponent(componentName: string, options: ReactCodeGenerationOptions): string {
        const { componentType, stateManagement, styling, hooks, typescript, optimizeForPerformance } = options;
        
        let code = '';
        
        // 导入语句
        if (typescript) {
            code += `import React, { ${hooks.join(', ')} } from 'react';\n`;
        } else {
            code += `import React, { ${hooks.join(', ')} } from 'react';\n`;
        }
        
        if (styling === 'styled-components') {
            code += `import styled from 'styled-components';\n`;
        }
        
        code += '\n';
        
        // 类型定义 (TypeScript)
        if (typescript) {
            code += `interface ${componentName}Props {\n`;
            code += `  children?: React.ReactNode;\n`;
            code += `  className?: string;\n`;
            code += `}\n\n`;
        }
        
        // 组件代码
        if (componentType === 'functional') {
            if (typescript) {
                code += `const ${componentName}: React.FC<${componentName}Props> = ({ children, className }) => {\n`;
            } else {
                code += `const ${componentName} = ({ children, className }) => {\n`;
            }
            
            if (stateManagement === 'useState' && hooks.includes('useState')) {
                code += `  const [state, setState] = useState(null);\n\n`;
            }
            
            code += `  return (\n`;
            code += `    <div className={className}>\n`;
            code += `      {/* ${componentName} content */}\n`;
            code += `      {children}\n`;
            code += `    </div>\n`;
            code += `  );\n`;
            code += `};\n\n`;
        }
        
        if (optimizeForPerformance) {
            code += `export default React.memo(${componentName});\n`;
        } else {
            code += `export default ${componentName};\n`;
        }
        
        return code;
    }

    // 🔧 公共方法：生成React组件测试
    public generateComponentTest(componentName: string, props: any[]): string {
        return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  test('renders without crashing', () => {
    render(<${componentName} />);
  });

  test('displays children correctly', () => {
    const testText = 'Test Content';
    render(<${componentName}>{testText}</${componentName}>);
    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  ${props.map(prop => `
  test('handles ${prop.name} prop', () => {
    const ${prop.name} = 'test-${prop.name}';
    render(<${componentName} ${prop.name}={${prop.name}} />);
    // Add specific assertions for ${prop.name}
  });`).join('')}
});
`;
    }

    // 🔧 公共方法：生成Rust结构体
    public generateRustStruct(structName: string, options: RustCodeGenerationOptions): string {
        const { asyncPattern, errorHandling, memoryOptimization, concurrency, safetyLevel } = options;
        
        let code = '';
        
        // 导入语句
        if (asyncPattern) {
            code += `use tokio;\n`;
        }
        if (errorHandling === 'result') {
            code += `use std::result::Result;\n`;
        }
        if (concurrency === 'channels') {
            code += `use std::sync::mpsc;\n`;
        }
        
        code += '\n';
        
        // 结构体定义
        code += `#[derive(Debug, Clone)]\n`;
        if (memoryOptimization) {
            code += `#[repr(C)]\n`;
        }
        code += `pub struct ${structName} {\n`;
        code += `    // TODO: 添加字段\n`;
        code += `    pub id: u64,\n`;
        code += `    pub name: String,\n`;
        code += `}\n\n`;
        
        // 实现块
        code += `impl ${structName} {\n`;
        code += `    pub fn new(id: u64, name: String) -> Self {\n`;
        code += `        Self { id, name }\n`;
        code += `    }\n\n`;
        
        if (asyncPattern) {
            code += `    pub async fn process(&self) -> Result<(), Box<dyn std::error::Error>> {\n`;
            code += `        // TODO: 实现异步处理逻辑\n`;
            code += `        Ok(())\n`;
            code += `    }\n\n`;
        }
        
        code += `}\n`;
        
        return code;
    }

    // 🔧 公共方法：生成Rust Web服务
    public generateRustWebService(serviceName: string, endpoints: string[]): string {
        return `use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;

#[derive(Serialize, Deserialize)]
pub struct ${serviceName}Response {
    pub message: String,
    pub status: String,
}

#[derive(Serialize, Deserialize)]
pub struct ${serviceName}Request {
    pub data: String,
}

pub struct ${serviceName}State {
    pub config: HashMap<String, String>,
}

impl ${serviceName}State {
    pub fn new() -> Self {
        Self {
            config: HashMap::new(),
        }
    }
}

${endpoints.map(endpoint => `
async fn ${endpoint}_handler(
    State(state): State<${serviceName}State>,
) -> Result<Json<${serviceName}Response>, StatusCode> {
    // TODO: 实现${endpoint}逻辑
    Ok(Json(${serviceName}Response {
        message: "${endpoint} executed successfully".to_string(),
        status: "ok".to_string(),
    }))
}`).join('\n')}

pub fn create_${serviceName.toLowerCase()}_router() -> Router {
    let state = ${serviceName}State::new();
    
    Router::new()
        ${endpoints.map(endpoint => `.route("/${endpoint}", get(${endpoint}_handler))`).join('\n        ')}
        .with_state(state)
}

#[tokio::main]
async fn main() {
    let app = create_${serviceName.toLowerCase()}_router();
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("${serviceName} running on http://0.0.0.0:3000");
    
    axum::serve(listener, app).await.unwrap();
}
`;
    }

    // 🔧 公共方法：生成Cargo.toml
    public generateCargoToml(projectName: string, dependencies: string[]): string {
        return `[package]
name = "${projectName.toLowerCase()}"
version = "0.1.0"
edition = "2021"

[dependencies]
${dependencies.map(dep => {
    const versions: Record<string, string> = {
        'axum': '0.7',
        'tokio': '{ version = "1.0", features = ["full"] }',
        'serde': '{ version = "1.0", features = ["derive"] }',
        'serde_json': '1.0',
        'uuid': '{ version = "1.0", features = ["v4"] }',
        'chrono': '{ version = "0.4", features = ["serde"] }',
        'sqlx': '{ version = "0.7", features = ["runtime-tokio-rustls", "postgres"] }',
        'anyhow': '1.0',
        'thiserror': '1.0'
    };
    return `${dep} = ${versions[dep] || '"*"'}`;
}).join('\n')}

[dev-dependencies]
tokio-test = "0.4"

[[bin]]
name = "${projectName.toLowerCase()}"
path = "src/main.rs"
`;
    }

    // 🔧 公共方法：生成完整项目
    public async generateFullProject(config: {
        projectName: string;
        projectType: 'react' | 'rust' | 'fullstack';
        features: string[];
    }): Promise<Array<{ filename: string; content: string }>> {
        const files: Array<{ filename: string; content: string }> = [];
        
        if (config.projectType === 'react' || config.projectType === 'fullstack') {
            // React项目文件
            files.push({
                filename: 'package.json',
                content: this.generatePackageJson(config.projectName, config.features)
            });
            
            files.push({
                filename: 'src/App.tsx',
                content: this.generateReactComponent('App', {
                    componentType: 'functional',
                    stateManagement: 'useState',
                    styling: 'css',
                    hooks: ['useState'],
                    typescript: true,
                    optimizeForPerformance: true
                })
            });
        }
        
        if (config.projectType === 'rust' || config.projectType === 'fullstack') {
            // Rust项目文件
            files.push({
                filename: 'Cargo.toml',
                content: this.generateCargoToml(config.projectName, ['axum', 'tokio', 'serde'])
            });
            
            files.push({
                filename: 'src/main.rs',
                content: this.generateRustWebService(config.projectName, ['health', 'api'])
            });
        }
        
        return files;
    }

    // 🔧 公共方法：保存生成的文件
    public async saveGeneratedFiles(files: Array<{ filename: string; content: string }>): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        
        for (const file of files) {
            const filePath = vscode.Uri.joinPath(workspaceFolder.uri, file.filename);
            const fileContent = new TextEncoder().encode(file.content);
            
            // 创建目录（如果不存在）
            const dir = vscode.Uri.joinPath(filePath, '..');
            try {
                await vscode.workspace.fs.createDirectory(dir);
            } catch (error) {
                // 目录可能已存在
            }
            
            await vscode.workspace.fs.writeFile(filePath, fileContent);
            vscode.window.showInformationMessage(`Generated: ${file.filename}`);
        }
    }

    // 私有辅助方法
    private generateReactComponentFromDescription(description: string, options: ReactCodeGenerationOptions): string {
        const componentName = this.extractComponentName(description);
        return this.generateReactComponent(componentName, options);
    }

    private generateRustModuleFromDescription(description: string, options: RustCodeGenerationOptions): string {
        const moduleName = this.extractModuleName(description);
        return this.generateRustStruct(moduleName, options);
    }

    private generatePackageJson(projectName: string, features: string[]): string {
        const deps: string[] = [
            '"react": "^18.2.0"',
            '"react-dom": "^18.2.0"',
            '"typescript": "^4.9.0"',
            '"web-vitals": "^2.1.0"'
        ];

        if (features.includes('router')) {
            deps.push('"react-router-dom": "^6.0.0"');
        }
        if (features.includes('state')) {
            deps.push('"@reduxjs/toolkit": "^1.9.0"');
        }
        if (features.includes('ui')) {
            deps.push('"@mui/material": "^5.0.0"');
        }

        return `{
  "name": "${projectName.toLowerCase()}",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    ${deps.join(',\n    ')}
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react-scripts": "5.0.1"
  }
}`;
    }

    private extractComponentName(description: string): string {
        // 从描述中提取组件名
        const match = description.match(/(\w+)\s*组件|(\w+)\s*Component/i);
        return match ? (match[1] || match[2]) : 'MyComponent';
    }

    private extractModuleName(description: string): string {
        // 从描述中提取模块名
        const match = description.match(/(\w+)\s*模块|(\w+)\s*Module/i);
        return match ? (match[1] || match[2]) : 'MyModule';
    }

    private getReactOptimizations(options: ReactCodeGenerationOptions): string[] {
        const optimizations: string[] = [];
        
        if (options.optimizeForPerformance) {
            optimizations.push('使用React.memo优化重渲染');
            optimizations.push('使用useCallback和useMemo优化计算');
        }
        
        if (options.hooks.includes('useState')) {
            optimizations.push('合理使用useState避免不必要的状态');
        }
        
        return optimizations;
    }

    private getReactBestPractices(options: ReactCodeGenerationOptions): string[] {
        const practices: string[] = [];
        
        practices.push('使用函数组件和Hooks');
        practices.push('保持组件单一职责');
        
        if (options.typescript) {
            practices.push('充分利用TypeScript类型系统');
        }
        
        return practices;
    }

    private getRustOptimizations(options: RustCodeGenerationOptions): string[] {
        const optimizations: string[] = [];
        
        if (options.memoryOptimization) {
            optimizations.push('使用#[repr(C)]优化内存布局');
            optimizations.push('避免不必要的堆分配');
        }
        
        if (options.asyncPattern) {
            optimizations.push('使用async/await实现非阻塞IO');
        }
        
        return optimizations;
    }

    private getRustBestPractices(options: RustCodeGenerationOptions): string[] {
        const practices: string[] = [];
        
        practices.push('遵循Rust所有权规则');
        practices.push('使用Result类型进行错误处理');
        
        if (options.safetyLevel === 'safe') {
            practices.push('避免使用unsafe代码');
        }
        
        return practices;
    }

    private estimateReactRenderTime(code: string): number {
        // 简单的渲染时间估算
        const complexity = code.split('\n').length;
        return complexity * 0.1; // 每行0.1ms
    }

    private estimateRustMemoryUsage(code: string): number {
        // 简单的内存使用估算
        const structCount = (code.match(/struct/g) || []).length;
        const enumCount = (code.match(/enum/g) || []).length;
        return (structCount * 64) + (enumCount * 32); // 字节
    }

    private assessComplexity(code: string): 'low' | 'medium' | 'high' {
        const lines = code.split('\n').length;
        
        if (lines < 50) {return 'low';}
        if (lines < 200) {return 'medium';}
        return 'high';
    }
}

// 导出单例实例
export const codeGenerationEngine = new EnhancedCodeGenerationEngine();
