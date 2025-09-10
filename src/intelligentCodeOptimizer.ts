// 智能代码重构优化引擎
import * as vscode from 'vscode';
import * as ts from 'typescript';

interface RefactoringRule {
    id: string;
    name: string;
    description: string;
    pattern: RegExp;
    replacement: (match: string, ...groups: string[]) => string;
    language: 'typescript' | 'rust' | 'javascript';
    priority: 'low' | 'medium' | 'high';
}

interface OptimizationSuggestion {
    rule: RefactoringRule;
    match: string;
    line: number;
    column: number;
    suggestion: string;
    before: string;
    after: string;
}

export class IntelligentCodeOptimizer {
    private refactoringRules: RefactoringRule[] = [];
    
    constructor() {
        this.initializeRefactoringRules();
    }
    
    // 🧠 初始化重构规则库
    private initializeRefactoringRules(): void {
        this.refactoringRules = [
            // TypeScript/JavaScript 优化规则
            {
                id: 'prefer-const',
                name: '使用 const 替代 let',
                description: '当变量不会被重新赋值时，使用 const 提高代码安全性',
                pattern: /let\s+(\w+)\s*=\s*([^;]+);(?!\s*\1\s*=)/g,
                replacement: (match, varName, value) => `const ${varName} = ${value};`,
                language: 'typescript',
                priority: 'medium'
            },
            {
                id: 'arrow-function-simplify',
                name: '简化箭头函数',
                description: '单行箭头函数可以省略大括号和return',
                pattern: /\(\s*([^)]*)\s*\)\s*=>\s*{\s*return\s+([^;{}]+);\s*}/g,
                replacement: (match, params, returnValue) => `(${params}) => ${returnValue}`,
                language: 'typescript',
                priority: 'low'
            },
            {
                id: 'optional-chaining',
                name: '使用可选链操作符',
                description: '简化深层对象属性访问的安全检查',
                pattern: /(\w+)\s*&&\s*\1\.(\w+)\s*&&\s*\1\.\2\.(\w+)/g,
                replacement: (match, obj, prop1, prop2) => `${obj}?.${prop1}?.${prop2}`,
                language: 'typescript',
                priority: 'high'
            },
            {
                id: 'template-literals',
                name: '使用模板字符串',
                description: '使用模板字符串替代字符串拼接',
                pattern: /(['"])[^'"]*\1\s*\+\s*[^+]+\+\s*['"][^'"]*['"]/g,
                replacement: (match) => {
                    // 复杂的字符串拼接转模板字符串逻辑
                    return match.replace(/['"]([^'"]*)['"]\s*\+\s*/g, '${$1}').replace(/^/, '`').replace(/$/, '`');
                },
                language: 'typescript',
                priority: 'medium'
            },
            {
                id: 'async-await',
                name: '使用 async/await 替代 Promise',
                description: '使用 async/await 提高异步代码可读性',
                pattern: /\.then\(\s*\(([^)]*)\)\s*=>\s*{([^}]+)}\s*\)/g,
                replacement: (match, param, body) => {
                    return `// 建议使用 async/await 重构此 Promise 链`;
                },
                language: 'typescript',
                priority: 'high'
            },
            
            // React 特定优化规则
            {
                id: 'react-hooks-deps',
                name: 'React Hooks 依赖优化',
                description: '确保 useEffect 依赖数组的完整性',
                pattern: /useEffect\(\s*\(\)\s*=>\s*{[^}]*(\w+)[^}]*},\s*\[\s*\]\s*\)/g,
                replacement: (match, dependency) => {
                    return match.replace('[]', `[${dependency}] // 添加依赖项`);
                },
                language: 'typescript',
                priority: 'high'
            },
            {
                id: 'react-memo',
                name: '使用 React.memo 优化性能',
                description: '对纯函数组件使用 React.memo 避免不必要的重渲染',
                pattern: /^(const\s+\w+:\s*React\.FC.*?=\s*\([^)]*\)\s*=>\s*{[\s\S]*?^})/gm,
                replacement: (match) => `React.memo(${match})`,
                language: 'typescript',
                priority: 'medium'
            },
            
            // Rust 优化规则
            {
                id: 'rust-unwrap-safety',
                name: '安全的错误处理',
                description: '避免使用 unwrap()，使用更安全的错误处理方式',
                pattern: /\.unwrap\(\)/g,
                replacement: () => '.expect("描述预期错误的具体信息")',
                language: 'rust',
                priority: 'high'
            },
            {
                id: 'rust-clone-optimization',
                name: '避免不必要的克隆',
                description: '使用引用替代不必要的 clone() 操作',
                pattern: /(\w+)\.clone\(\)/g,
                replacement: (match, variable) => `&${variable} // 考虑使用引用`,
                language: 'rust',
                priority: 'medium'
            },
            {
                id: 'rust-vec-capacity',
                name: 'Vec 容量预分配',
                description: '为已知大小的 Vec 预分配容量',
                pattern: /let\s+mut\s+(\w+)\s*=\s*Vec::new\(\);/g,
                replacement: (match, varName) => `let mut ${varName} = Vec::with_capacity(initial_capacity); // 预分配容量`,
                language: 'rust',
                priority: 'low'
            },
            {
                id: 'rust-string-efficiency',
                name: '字符串操作优化',
                description: '使用更高效的字符串操作方法',
                pattern: /(\w+)\.to_string\(\)\s*\+\s*&/g,
                replacement: (match, str) => `format!("{}{}", ${str}, `,
                language: 'rust',
                priority: 'medium'
            }
        ];
    }
    
    // 🔍 分析代码并提供优化建议
    public async analyzeCodeForOptimization(document: vscode.TextDocument): Promise<OptimizationSuggestion[]> {
        const text = document.getText();
        const language = this.getLanguageFromDocument(document);
        const suggestions: OptimizationSuggestion[] = [];
        
        const relevantRules = this.refactoringRules.filter(rule => 
            rule.language === language || language === 'javascript' && rule.language === 'typescript'
        );
        
        for (const rule of relevantRules) {
            let match;
            rule.pattern.lastIndex = 0; // 重置正则表达式
            
            while ((match = rule.pattern.exec(text)) !== null) {
                const position = document.positionAt(match.index);
                const matchedText = match[0];
                const suggestedText = rule.replacement(matchedText, ...match.slice(1));
                
                suggestions.push({
                    rule,
                    match: matchedText,
                    line: position.line,
                    column: position.character,
                    suggestion: rule.description,
                    before: matchedText,
                    after: suggestedText
                });
                
                // 防止无限循环
                if (!rule.pattern.global) break;
            }
        }
        
        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.rule.priority] - priorityOrder[a.rule.priority];
        });
    }
    
    // 🛠️ 自动应用优化建议
    public async applyOptimization(
        document: vscode.TextDocument, 
        suggestion: OptimizationSuggestion
    ): Promise<boolean> {
        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
            suggestion.line, 
            suggestion.column,
            suggestion.line, 
            suggestion.column + suggestion.before.length
        );
        
        edit.replace(document.uri, range, suggestion.after);
        
        const success = await vscode.workspace.applyEdit(edit);
        
        if (success) {
            vscode.window.showInformationMessage(
                `✨ 已应用优化: ${suggestion.rule.name}`
            );
        }
        
        return success;
    }
    
    // 🚀 批量应用所有高优先级优化
    public async applyAllHighPriorityOptimizations(document: vscode.TextDocument): Promise<number> {
        const suggestions = await this.analyzeCodeForOptimization(document);
        const highPrioritySuggestions = suggestions.filter(s => s.rule.priority === 'high');
        
        let appliedCount = 0;
        
        // 从后往前应用，避免位置偏移问题
        const sortedSuggestions = highPrioritySuggestions.sort((a, b) => 
            b.line - a.line || b.column - a.column
        );
        
        for (const suggestion of sortedSuggestions) {
            const success = await this.applyOptimization(document, suggestion);
            if (success) appliedCount++;
        }
        
        if (appliedCount > 0) {
            vscode.window.showInformationMessage(
                `🎉 自动应用了 ${appliedCount} 个高优先级优化！`
            );
        }
        
        return appliedCount;
    }
    
    // 📊 生成代码质量报告
    public async generateCodeQualityReport(document: vscode.TextDocument): Promise<string> {
        const suggestions = await this.analyzeCodeForOptimization(document);
        const metrics = this.calculateCodeMetrics(document.getText());
        
        const report = `
# 📊 代码质量分析报告

## 📈 基础指标
- **文件大小**: ${document.getText().length} 字符
- **代码行数**: ${document.lineCount} 行
- **复杂度评分**: ${metrics.complexity}/10
- **可维护性**: ${metrics.maintainability}/10

## 🎯 优化建议 (${suggestions.length} 个)

### 🔴 高优先级 (${suggestions.filter(s => s.rule.priority === 'high').length} 个)
${suggestions
    .filter(s => s.rule.priority === 'high')
    .map(s => `- **第${s.line + 1}行**: ${s.rule.name} - ${s.rule.description}`)
    .join('\n')}

### 🟡 中优先级 (${suggestions.filter(s => s.rule.priority === 'medium').length} 个)
${suggestions
    .filter(s => s.rule.priority === 'medium')
    .map(s => `- **第${s.line + 1}行**: ${s.rule.name} - ${s.rule.description}`)
    .join('\n')}

### 🟢 低优先级 (${suggestions.filter(s => s.rule.priority === 'low').length} 个)
${suggestions
    .filter(s => s.rule.priority === 'low')
    .map(s => `- **第${s.line + 1}行**: ${s.rule.name} - ${s.rule.description}`)
    .join('\n')}

## 💡 总体建议
${this.generateOverallRecommendations(suggestions, metrics)}

---
*由 Visual Programming VSCode 智能分析引擎生成*
        `.trim();
        
        return report;
    }
    
    // 📏 计算代码指标
    private calculateCodeMetrics(code: string): { complexity: number; maintainability: number } {
        const lines = code.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        
        // 简化的复杂度评估
        const cyclomaticComplexity = (code.match(/if|for|while|switch|catch/g) || []).length;
        const functionCount = (code.match(/function|const.*=>|async/g) || []).length;
        const classCount = (code.match(/class|interface|type/g) || []).length;
        
        const complexity = Math.min(10, Math.max(1, 10 - cyclomaticComplexity / functionCount * 2));
        const maintainability = Math.min(10, Math.max(1, 10 - nonEmptyLines.length / 100));
        
        return {
            complexity: Math.round(complexity * 10) / 10,
            maintainability: Math.round(maintainability * 10) / 10
        };
    }
    
    // 💭 生成总体建议
    private generateOverallRecommendations(
        suggestions: OptimizationSuggestion[], 
        metrics: { complexity: number; maintainability: number }
    ): string {
        const recommendations: string[] = [];
        
        if (suggestions.filter(s => s.rule.priority === 'high').length > 5) {
            recommendations.push('🚨 建议优先处理高优先级问题，可显著提升代码质量');
        }
        
        if (metrics.complexity < 5) {
            recommendations.push('🧩 代码复杂度较高，建议拆分大函数和复杂逻辑');
        }
        
        if (metrics.maintainability < 6) {
            recommendations.push('🔧 代码可维护性有待提升，建议增加注释和文档');
        }
        
        const typeScriptSuggestions = suggestions.filter(s => s.rule.language === 'typescript');
        if (typeScriptSuggestions.length > 0) {
            recommendations.push('⚡ 考虑使用现代 TypeScript 特性提升开发体验');
        }
        
        const rustSuggestions = suggestions.filter(s => s.rule.language === 'rust');
        if (rustSuggestions.length > 0) {
            recommendations.push('🦀 Rust 代码建议关注内存安全和性能优化');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('🎉 代码质量良好，继续保持！');
        }
        
        return recommendations.join('\n');
    }
    
    // 🔤 识别文档语言
    private getLanguageFromDocument(document: vscode.TextDocument): 'typescript' | 'rust' | 'javascript' {
        const languageId = document.languageId;
        
        switch (languageId) {
            case 'typescript':
            case 'typescriptreact':
                return 'typescript';
            case 'rust':
                return 'rust';
            case 'javascript':
            case 'javascriptreact':
            default:
                return 'javascript';
        }
    }
    
    // 🎨 创建代码优化面板
    public createOptimizationPanel(context: vscode.ExtensionContext): void {
        const panel = vscode.window.createWebviewPanel(
            'codeOptimization',
            '🔧 智能代码优化',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        panel.webview.html = this.getOptimizationPanelHTML();
        
        // 存储当前分析结果
        let currentSuggestions: OptimizationSuggestion[] = [];
        
        // 处理来自WebView的消息
        panel.webview.onDidReceiveMessage(async (message) => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) return;
            
            switch (message.command) {
                case 'analyze':
                    currentSuggestions = await this.analyzeCodeForOptimization(activeEditor.document);
                    panel.webview.postMessage({
                        command: 'updateSuggestions',
                        suggestions: currentSuggestions.map(s => ({
                            id: `${s.line}-${s.column}`,
                            title: s.rule.name,
                            description: s.rule.description,
                            priority: s.rule.priority,
                            line: s.line + 1,
                            before: s.before,
                            after: s.after
                        }))
                    });
                    break;
                    
                case 'applyOptimization':
                    const suggestion = currentSuggestions.find(s => 
                        `${s.line}-${s.column}` === message.suggestionId
                    );
                    if (suggestion) {
                        await this.applyOptimization(activeEditor.document, suggestion);
                        // 重新分析更新建议列表
                        currentSuggestions = await this.analyzeCodeForOptimization(activeEditor.document);
                        panel.webview.postMessage({
                            command: 'updateSuggestions',
                            suggestions: currentSuggestions.map(s => ({
                                id: `${s.line}-${s.column}`,
                                title: s.rule.name,
                                description: s.rule.description,
                                priority: s.rule.priority,
                                line: s.line + 1,
                                before: s.before,
                                after: s.after
                            }))
                        });
                    }
                    break;
                    
                case 'applyAll':
                    await this.applyAllHighPriorityOptimizations(activeEditor.document);
                    // 重新分析
                    currentSuggestions = await this.analyzeCodeForOptimization(activeEditor.document);
                    panel.webview.postMessage({
                        command: 'updateSuggestions',
                        suggestions: currentSuggestions.map(s => ({
                            id: `${s.line}-${s.column}`,
                            title: s.rule.name,
                            description: s.rule.description,
                            priority: s.rule.priority,
                            line: s.line + 1,
                            before: s.before,
                            after: s.after
                        }))
                    });
                    break;
                    
                case 'generateReport':
                    const report = await this.generateCodeQualityReport(activeEditor.document);
                    const doc = await vscode.workspace.openTextDocument({
                        content: report,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                    break;
            }
        });
    }
    
    // 🎨 优化面板HTML
    private getOptimizationPanelHTML(): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: 'Segoe UI', sans-serif;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .control-panel {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    backdrop-filter: blur(10px);
                }
                .btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    padding: 10px 20px;
                    margin: 5px;
                    border-radius: 20px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
                .suggestion {
                    background: rgba(255,255,255,0.1);
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 8px;
                    border-left: 4px solid;
                }
                .high { border-left-color: #ff6b6b; }
                .medium { border-left-color: #feca57; }
                .low { border-left-color: #48dbfb; }
                .code-block {
                    background: rgba(0,0,0,0.3);
                    padding: 10px;
                    border-radius: 4px;
                    font-family: 'Consolas', monospace;
                    font-size: 12px;
                    margin: 8px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔧 智能代码优化工具</h1>
                <p>AI驱动的代码质量提升助手</p>
            </div>
            
            <div class="control-panel">
                <button class="btn" onclick="analyzeCode()">🔍 分析代码</button>
                <button class="btn" onclick="applyAllOptimizations()">⚡ 应用所有高优先级优化</button>
                <button class="btn" onclick="generateReport()">📊 生成质量报告</button>
            </div>
            
            <div id="suggestions-container">
                <div style="text-align: center; color: #bbb;">
                    点击"分析代码"开始智能优化建议分析
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentSuggestions = [];
                
                function analyzeCode() {
                    vscode.postMessage({ command: 'analyze' });
                }
                
                function applyAllOptimizations() {
                    vscode.postMessage({ command: 'applyAll' });
                }
                
                function generateReport() {
                    vscode.postMessage({ command: 'generateReport' });
                }
                
                function applySuggestion(suggestionId) {
                    vscode.postMessage({ 
                        command: 'applyOptimization', 
                        suggestionId: suggestionId 
                    });
                }
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    if (message.command === 'updateSuggestions') {
                        currentSuggestions = message.suggestions;
                        updateSuggestionsDisplay();
                    }
                });
                
                function updateSuggestionsDisplay() {
                    const container = document.getElementById('suggestions-container');
                    
                    if (currentSuggestions.length === 0) {
                        container.innerHTML = '<div style="text-align: center; color: #00ff88;">🎉 代码质量良好，没有发现需要优化的地方！</div>';
                        return;
                    }
                    
                    container.innerHTML = currentSuggestions.map(suggestion => \`
                        <div class="suggestion \${suggestion.priority}">
                            <h3>\${suggestion.title}</h3>
                            <p>\${suggestion.description}</p>
                            <p><strong>位置:</strong> 第 \${suggestion.line} 行</p>
                            
                            <div class="code-block">
                                <div style="color: #ff6b6b;">- \${suggestion.before}</div>
                                <div style="color: #00ff88;">+ \${suggestion.after}</div>
                            </div>
                            
                            <button class="btn" onclick="applySuggestion('\${suggestion.id}')">
                                ✨ 应用此优化
                            </button>
                        </div>
                    \`).join('');
                }
            </script>
        </body>
        </html>`;
    }
}
