// 🎯 智能AI代码分析增强引擎
import * as vscode from 'vscode';
import { codeGenerationEngine } from './enhancedCodeGenerationEngine';

export interface AIAnalysisResult {
    complexity: number;
    maintainability: number;
    testCoverage: number;
    codeSmells: CodeSmell[];
    suggestions: Suggestion[];
    patterns: ArchitecturePattern[];
}

export interface CodeSmell {
    type: 'duplication' | 'complexity' | 'naming' | 'structure';
    severity: 'low' | 'medium' | 'high';
    location: vscode.Range;
    message: string;
    fix?: string;
}

export interface Suggestion {
    type: 'refactor' | 'optimize' | 'enhance' | 'modernize';
    priority: number;
    description: string;
    codeExample?: string;
    benefits: string[];
}

export interface ArchitecturePattern {
    name: string;
    confidence: number;
    description: string;
    components: string[];
}

export class AIEnhancedAnalyzer {
    private analysisHistory: Map<string, AIAnalysisResult> = new Map();
    
    // 🧠 深度代码分析 - 增强版React和Rust专用
    public async analyzeCodeIntelligence(document: vscode.TextDocument): Promise<AIAnalysisResult> {
        const content = document.getText();
        const language = document.languageId;
        
        // 专门针对React和Rust的深度分析
        let result: AIAnalysisResult;
        
        if (this.isReactFile(language, content)) {
            result = await this.analyzeReactCodeDeep(content, document);
        } else if (language === 'rust') {
            result = await this.analyzeRustCodeDeep(content, document);
        } else {
            // 通用分析
            result = {
                complexity: this.calculateComplexity(content, language),
                maintainability: this.calculateMaintainability(content, language),
                testCoverage: await this.estimateTestCoverage(document),
                codeSmells: this.detectCodeSmells(content, language),
                suggestions: this.generateSuggestions(content, language),
                patterns: this.detectArchitecturePatterns(content, language)
            };
        }
        
        this.analysisHistory.set(document.uri.toString(), result);
        return result;
    }
    
    // 📊 计算代码复杂度
    private calculateComplexity(content: string, language: string): number {
        let complexity = 1; // 基础复杂度
        
        // 控制流复杂度
        const controlFlowPatterns = [
            /if\s*\(/g, /else\s*if/g, /while\s*\(/g, /for\s*\(/g,
            /switch\s*\(/g, /case\s+/g, /catch\s*\(/g, /&&/g, /\|\|/g
        ];
        
        controlFlowPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            complexity += matches ? matches.length : 0;
        });
        
        // 语言特定复杂度
        if (language === 'typescript' || language === 'javascript') {
            const asyncPatterns = [/async\s+/g, /await\s+/g, /Promise\./g, /\.then\(/g];
            asyncPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                complexity += matches ? matches.length * 0.5 : 0;
            });
        }
        
        if (language === 'rust') {
            const rustPatterns = [/match\s+/g, /unsafe\s*{/g, /impl\s+/g];
            rustPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                complexity += matches ? matches.length * 0.7 : 0;
            });
        }
        
        return Math.min(10, Math.max(1, Math.round(complexity / 10)));
    }
    
    // 🔧 计算可维护性
    private calculateMaintainability(content: string, language: string): number {
        let score = 10;
        
        // 函数长度惩罚
        const functionPattern = language === 'rust' ? 
            /fn\s+\w+[^{]*{[^}]*}/g : 
            /function\s+\w+[^{]*{[^}]*}|const\s+\w+\s*=\s*[^=]*=>[^;]*;/g;
        
        const functions = content.match(functionPattern) || [];
        functions.forEach(func => {
            const lines = func.split('\n').length;
            if (lines > 50) score -= 2;
            else if (lines > 30) score -= 1;
        });
        
        // 注释密度奖励
        const commentLines = content.split('\n').filter(line => 
            line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/**')
        ).length;
        const totalLines = content.split('\n').length;
        const commentRatio = commentLines / totalLines;
        
        if (commentRatio > 0.15) score += 2;
        else if (commentRatio > 0.1) score += 1;
        else if (commentRatio < 0.05) score -= 1;
        
        // 命名质量
        const variableNames = content.match(/(?:let|const|var)\s+(\w+)/g) || [];
        const poorNames = variableNames.filter(name => 
            /^[a-z]$|^temp|^data|^info|^item/.test(name)
        ).length;
        score -= poorNames * 0.1;
        
        return Math.min(10, Math.max(1, Math.round(score)));
    }
    
    // 🧪 估算测试覆盖率
    private async estimateTestCoverage(document: vscode.TextDocument): Promise<number> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) return 0;
        
        // 查找测试文件
        const testPatterns = [
            '**/*.test.{ts,js,tsx,jsx}',
            '**/*.spec.{ts,js,tsx,jsx}',
            '**/test/**/*.{ts,js,tsx,jsx}',
            '**/__tests__/**/*.{ts,js,tsx,jsx}'
        ];
        
        let testFiles: vscode.Uri[] = [];
        for (const pattern of testPatterns) {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, pattern)
            );
            testFiles = testFiles.concat(files);
        }
        
        // 查找源文件
        const sourceFiles = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, '**/*.{ts,js,tsx,jsx}'),
            '**/node_modules/**'
        );
        
        const testableFiles = sourceFiles.filter(uri => 
            !testFiles.some(testUri => testUri.toString() === uri.toString())
        );
        
        if (testableFiles.length === 0) return 10; // 没有源文件时返回满分
        
        const coverageRatio = testFiles.length / testableFiles.length;
        return Math.min(10, Math.round(coverageRatio * 10));
    }
    
    // 👃 检测代码坏味道
    private detectCodeSmells(content: string, language: string): CodeSmell[] {
        const smells: CodeSmell[] = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            // 检测长行
            if (line.length > 120) {
                smells.push({
                    type: 'structure',
                    severity: 'low',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: '行过长，建议分解或重构',
                    fix: '将长行拆分为多行或提取为变量'
                });
            }
            
            // 检测魔术数字
            const magicNumbers = line.match(/(?<![a-zA-Z_])(?!0|1)\d{2,}(?![a-zA-Z_])/g);
            if (magicNumbers) {
                smells.push({
                    type: 'naming',
                    severity: 'medium',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: '发现魔术数字，建议使用命名常量',
                    fix: '将数字提取为具有描述性名称的常量'
                });
            }
            
            // 检测深度嵌套
            const indentLevel = (line.match(/^\s*/) || [''])[0].length / 2;
            if (indentLevel > 4) {
                smells.push({
                    type: 'complexity',
                    severity: 'high',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: '嵌套层级过深，建议重构',
                    fix: '提取方法或使用早期返回模式'
                });
            }
        });
        
        // 检测重复代码
        const duplicates = this.findDuplicateCode(content);
        duplicates.forEach(duplicate => {
            smells.push({
                type: 'duplication',
                severity: 'medium',
                location: duplicate.range,
                message: `发现重复代码片段 (${duplicate.lines}行)`,
                fix: '提取公共方法或创建可重用组件'
            });
        });
        
        return smells;
    }
    
    // 🔍 查找重复代码
    private findDuplicateCode(content: string): { range: vscode.Range; lines: number }[] {
        const lines = content.split('\n');
        const duplicates: { range: vscode.Range; lines: number }[] = [];
        
        for (let i = 0; i < lines.length - 3; i++) {
            for (let j = i + 3; j < lines.length; j++) {
                let matchLength = 0;
                
                while (
                    i + matchLength < lines.length &&
                    j + matchLength < lines.length &&
                    lines[i + matchLength].trim() === lines[j + matchLength].trim() &&
                    lines[i + matchLength].trim() !== '' &&
                    matchLength < 10
                ) {
                    matchLength++;
                }
                
                if (matchLength >= 3) {
                    duplicates.push({
                        range: new vscode.Range(i, 0, i + matchLength, 0),
                        lines: matchLength
                    });
                    break; // 避免重复检测
                }
            }
        }
        
        return duplicates;
    }
    
    // 💡 生成改进建议
    private generateSuggestions(content: string, language: string): Suggestion[] {
        const suggestions: Suggestion[] = [];
        
        // TypeScript/JavaScript建议
        if (language === 'typescript' || language === 'javascript') {
            if (!content.includes('async') && content.includes('Promise')) {
                suggestions.push({
                    type: 'modernize',
                    priority: 8,
                    description: '建议使用async/await替代Promise链',
                    codeExample: 'const result = await fetchData(); // 替代 fetchData().then()',
                    benefits: ['提高代码可读性', '简化错误处理', '减少回调地狱']
                });
            }
            
            if (content.includes('var ')) {
                suggestions.push({
                    type: 'modernize',
                    priority: 7,
                    description: '建议使用const/let替代var',
                    codeExample: 'const value = 42; // 或 let value = 42;',
                    benefits: ['块级作用域', '防止意外重新赋值', '现代JavaScript标准']
                });
            }
            
            if (content.match(/function\s+\w+/g) && content.includes('=>')) {
                suggestions.push({
                    type: 'modernize',
                    priority: 6,
                    description: '考虑统一使用箭头函数或函数声明',
                    benefits: ['代码风格一致性', '更简洁的语法']
                });
            }
        }
        
        // Rust建议
        if (language === 'rust') {
            if (content.includes('unwrap()')) {
                suggestions.push({
                    type: 'enhance',
                    priority: 9,
                    description: '避免使用unwrap()，使用模式匹配或?操作符',
                    codeExample: 'match result { Ok(val) => val, Err(e) => return Err(e) }',
                    benefits: ['更好的错误处理', '避免panic', '增强程序稳定性']
                });
            }
            
            if (content.includes('clone()') && !content.includes('Rc<') && !content.includes('Arc<')) {
                suggestions.push({
                    type: 'optimize',
                    priority: 7,
                    description: '考虑使用引用或智能指针减少clone()调用',
                    codeExample: 'fn process_data(data: &Vec<String>) // 使用引用',
                    benefits: ['提高性能', '减少内存分配', '更符合Rust惯例']
                });
            }
        }
        
        // 通用建议
        const functionCount = (content.match(/fn\s+|function\s+/g) || []).length;
        if (functionCount > 20) {
            suggestions.push({
                type: 'refactor',
                priority: 8,
                description: '文件包含过多函数，考虑拆分为多个模块',
                benefits: ['提高模块化', '改善可维护性', '便于团队协作']
            });
        }
        
        return suggestions.sort((a, b) => b.priority - a.priority);
    }
    
    // 🏗️ 检测架构模式
    private detectArchitecturePatterns(content: string, language: string): ArchitecturePattern[] {
        const patterns: ArchitecturePattern[] = [];
        
        if (language === 'typescript' || language === 'javascript') {
            // React组件模式
            if (content.includes('React.FC') || content.includes('useState') || content.includes('useEffect')) {
                patterns.push({
                    name: 'React功能组件',
                    confidence: 0.9,
                    description: '使用React Hooks的现代函数组件',
                    components: ['状态管理', '生命周期', '副作用处理']
                });
            }
            
            // Observer模式
            if (content.includes('addEventListener') || content.includes('emit') || content.includes('subscribe')) {
                patterns.push({
                    name: '观察者模式',
                    confidence: 0.7,
                    description: '事件驱动的发布-订阅架构',
                    components: ['事件发布', '事件订阅', '事件处理']
                });
            }
            
            // MVC模式
            if (content.includes('Controller') || content.includes('Model') || content.includes('View')) {
                patterns.push({
                    name: 'MVC架构',
                    confidence: 0.8,
                    description: '模型-视图-控制器分层架构',
                    components: ['数据模型', '视图层', '控制器']
                });
            }
        }
        
        if (language === 'rust') {
            // Builder模式
            if (content.includes('impl ') && content.includes('pub fn new') && content.includes('pub fn build')) {
                patterns.push({
                    name: 'Builder模式',
                    confidence: 0.8,
                    description: '链式构建复杂对象',
                    components: ['构建器', '链式方法', '最终构建']
                });
            }
            
            // 状态机模式
            if (content.includes('enum') && content.includes('match') && content.includes('State')) {
                patterns.push({
                    name: '状态机模式',
                    confidence: 0.9,
                    description: '使用枚举和模式匹配的状态管理',
                    components: ['状态枚举', '状态转换', '行为处理']
                });
            }
        }
        
        return patterns;
    }
    
    // 📈 生成分析报告
    public generateAnalysisReport(result: AIAnalysisResult, fileName: string): string {
        const report = `
# 📊 代码分析报告 - ${fileName}

## 总体评分
- **复杂度**: ${result.complexity}/10 ${this.getComplexityEmoji(result.complexity)}
- **可维护性**: ${result.maintainability}/10 ${this.getMaintainabilityEmoji(result.maintainability)}
- **测试覆盖率**: ${result.testCoverage}/10 ${this.getCoverageEmoji(result.testCoverage)}

## 🏗️ 架构模式
${result.patterns.map(pattern => 
    `- **${pattern.name}** (${Math.round(pattern.confidence * 100)}%): ${pattern.description}`
).join('\n')}

## 👃 代码坏味道 (${result.codeSmells.length}个)
${result.codeSmells.slice(0, 5).map(smell => 
    `- **${smell.type}** (${smell.severity}): ${smell.message}`
).join('\n')}

## 💡 改进建议 (前5条)
${result.suggestions.slice(0, 5).map((suggestion, index) => 
    `${index + 1}. **${suggestion.type}** (优先级: ${suggestion.priority})\n   ${suggestion.description}\n   ✨ ${suggestion.benefits.join(', ')}`
).join('\n\n')}

## 📈 分析总结
${this.generateSummary(result)}

---
*由Visual Programming AI分析引擎生成*
`;
        
        return report;
    }
    
    // 🎯 智能代码修复
    public async suggestCodeFixes(document: vscode.TextDocument, codeSmells: CodeSmell[]): Promise<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];
        
        for (const smell of codeSmells) {
            if (smell.fix) {
                const action = new vscode.CodeAction(
                    `修复: ${smell.message}`,
                    vscode.CodeActionKind.QuickFix
                );
                
                action.diagnostics = [{
                    range: smell.location,
                    message: smell.message,
                    severity: this.getSeverityLevel(smell.severity)
                }];
                
                // 根据坏味道类型生成具体修复
                const edit = new vscode.WorkspaceEdit();
                const fixedCode = await this.generateCodeFix(document, smell);
                if (fixedCode) {
                    edit.replace(document.uri, smell.location, fixedCode);
                    action.edit = edit;
                }
                
                actions.push(action);
            }
        }
        
        return actions;
    }
    
    // 🔧 生成具体代码修复
    private async generateCodeFix(document: vscode.TextDocument, smell: CodeSmell): Promise<string | null> {
        const originalCode = document.getText(smell.location);
        
        switch (smell.type) {
            case 'naming':
                if (originalCode.match(/\d{2,}/)) {
                    const number = originalCode.match(/\d{2,}/)?.[0];
                    return originalCode.replace(/\d{2,}/, `CONSTANT_${number}`);
                }
                break;
                
            case 'complexity':
                if (originalCode.includes('if') && originalCode.includes('{')) {
                    // 简单的提前返回重构
                    return originalCode.replace(/if\s*\((.*?)\)\s*{/, 'if (!($1)) return;\n');
                }
                break;
                
            case 'structure':
                // 长行分割
                if (originalCode.length > 120) {
                    const parts = originalCode.split('.');
                    if (parts.length > 1) {
                        return parts.join('\n    .');
                    }
                }
                break;
        }
        
        return null;
    }
    
    // 辅助方法
    private getComplexityEmoji(score: number): string {
        if (score <= 3) return '🟢';
        if (score <= 6) return '🟡';
        return '🔴';
    }
    
    private getMaintainabilityEmoji(score: number): string {
        if (score >= 8) return '✅';
        if (score >= 6) return '⚠️';
        return '❌';
    }
    
    private getCoverageEmoji(score: number): string {
        if (score >= 8) return '🛡️';
        if (score >= 5) return '🔍';
        return '⚠️';
    }
    
    private getSeverityLevel(severity: string): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'high': return vscode.DiagnosticSeverity.Error;
            case 'medium': return vscode.DiagnosticSeverity.Warning;
            default: return vscode.DiagnosticSeverity.Information;
        }
    }
    
    private generateSummary(result: AIAnalysisResult): string {
        const overallScore = (result.complexity + result.maintainability + result.testCoverage) / 3;
        
        if (overallScore >= 8) {
            return '🎉 代码质量优秀！继续保持良好的编码实践。';
        } else if (overallScore >= 6) {
            return '👍 代码质量良好，但仍有改进空间。重点关注复杂度和测试覆盖率。';
        } else {
            return '🔧 代码需要重构。建议优先处理高优先级的改进建议。';
        }
    }
    
    // 🚀 批量分析工作区
    public async analyzeWorkspace(): Promise<Map<string, AIAnalysisResult>> {
        const results = new Map<string, AIAnalysisResult>();
        
        const files = await vscode.workspace.findFiles(
            '**/*.{ts,js,tsx,jsx,rs}',
            '**/node_modules/**'
        );
        
        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const analysis = await this.analyzeCodeIntelligence(document);
                results.set(file.toString(), analysis);
            } catch (error) {
                console.error(`分析文件失败: ${file.toString()}`, error);
            }
        }
        
        return results;
    }

    // 🎯 React文件检测
    private isReactFile(language: string, content: string): boolean {
        return (language === 'typescript' || language === 'javascript' || 
                language === 'typescriptreact' || language === 'javascriptreact') &&
               (content.includes('React') || content.includes('jsx') || 
                content.includes('useState') || content.includes('useEffect'));
    }

    // ⚛️ React代码深度分析
    private async analyzeReactCodeDeep(content: string, document: vscode.TextDocument): Promise<AIAnalysisResult> {
        const baseAnalysis = {
            complexity: this.calculateComplexity(content, 'react'),
            maintainability: this.calculateMaintainability(content, 'react'),
            testCoverage: await this.estimateTestCoverage(document),
            codeSmells: this.detectReactCodeSmells(content),
            suggestions: this.generateReactSuggestions(content),
            patterns: this.detectReactPatterns(content)
        };

        return baseAnalysis;
    }

    // 🦀 Rust代码深度分析
    private async analyzeRustCodeDeep(content: string, document: vscode.TextDocument): Promise<AIAnalysisResult> {
        const baseAnalysis = {
            complexity: this.calculateComplexity(content, 'rust'),
            maintainability: this.calculateMaintainability(content, 'rust'),
            testCoverage: await this.estimateTestCoverage(document),
            codeSmells: this.detectRustCodeSmells(content),
            suggestions: this.generateRustSuggestions(content),
            patterns: this.detectRustPatterns(content)
        };

        return baseAnalysis;
    }

    // ⚛️ React代码坏味道检测
    private detectReactCodeSmells(content: string): CodeSmell[] {
        const smells: CodeSmell[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // 检测直接在渲染中进行计算
            if (line.includes('return (') || line.includes('return(')) {
                const nextLines = lines.slice(index, index + 10);
                if (nextLines.some(l => l.includes('.map(') || l.includes('.filter(') || l.includes('.sort('))) {
                    smells.push({
                        type: 'complexity',
                        severity: 'medium',
                        location: new vscode.Range(index, 0, index, line.length),
                        message: 'React组件在渲染中进行数组操作，建议使用useMemo',
                        fix: '将数组操作移到useMemo中进行缓存'
                    });
                }
            }

            // 检测缺少key属性的列表渲染
            if (line.includes('.map(') && !line.includes('key=')) {
                smells.push({
                    type: 'structure',
                    severity: 'high',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: 'React列表渲染缺少key属性',
                    fix: '为每个列表项添加唯一的key属性'
                });
            }

            // 检测useEffect缺少清理函数
            if (line.includes('useEffect(') && !content.includes('return () =>')) {
                smells.push({
                    type: 'complexity',
                    severity: 'medium',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: 'useEffect可能需要清理函数防止内存泄漏',
                    fix: '添加清理函数：return () => { /* cleanup */ }'
                });
            }

            // 检测过多的useState
            const useStateCount = (content.match(/useState\(/g) || []).length;
            if (useStateCount > 5 && line.includes('useState(')) {
                smells.push({
                    type: 'structure',
                    severity: 'medium',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: '组件状态过多，考虑使用useReducer或拆分组件',
                    fix: '使用useReducer管理复杂状态或拆分组件'
                });
            }
        });

        return smells;
    }

    // 🦀 Rust代码坏味道检测
    private detectRustCodeSmells(content: string): CodeSmell[] {
        const smells: CodeSmell[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // 检测unwrap()使用
            if (line.includes('.unwrap()')) {
                smells.push({
                    type: 'structure',
                    severity: 'high',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: '使用unwrap()可能导致panic，建议使用模式匹配',
                    fix: '使用match或if let处理Result/Option'
                });
            }

            // 检测过度clone
            if (line.includes('.clone()')) {
                smells.push({
                    type: 'complexity',
                    severity: 'medium',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: 'clone()可能影响性能，考虑使用引用或智能指针',
                    fix: '使用&引用或Rc/Arc智能指针'
                });
            }

            // 检测unsafe代码
            if (line.includes('unsafe')) {
                smells.push({
                    type: 'structure',
                    severity: 'high',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: 'unsafe代码需要仔细审查确保内存安全',
                    fix: '确保unsafe代码不会导致未定义行为'
                });
            }

            // 检测未使用的Result
            if (line.includes('Result<') && !line.includes('?') && !line.includes('match') && !line.includes('unwrap')) {
                smells.push({
                    type: 'structure',
                    severity: 'medium',
                    location: new vscode.Range(index, 0, index, line.length),
                    message: 'Result类型应该被正确处理',
                    fix: '使用?操作符、match或unwrap处理Result'
                });
            }
        });

        return smells;
    }

    // ⚛️ React改进建议
    private generateReactSuggestions(content: string): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // Hook优化建议
        if (content.includes('useState') && !content.includes('useCallback')) {
            suggestions.push({
                type: 'optimize',
                priority: 8,
                description: '使用useCallback优化事件处理函数',
                codeExample: 'const handleClick = useCallback(() => { /* ... */ }, [deps]);',
                benefits: ['防止子组件不必要的重渲染', '提高性能', '减少内存分配']
            });
        }

        if (content.includes('useState') && !content.includes('useMemo')) {
            suggestions.push({
                type: 'optimize',
                priority: 7,
                description: '使用useMemo缓存昂贵的计算',
                codeExample: 'const expensiveValue = useMemo(() => heavyComputation(), [deps]);',
                benefits: ['避免重复计算', '提高渲染性能', '优化用户体验']
            });
        }

        // 组件结构建议
        if (!content.includes('React.memo') && content.includes('export default')) {
            suggestions.push({
                type: 'optimize',
                priority: 6,
                description: '使用React.memo防止不必要的重渲染',
                codeExample: 'export default React.memo(MyComponent);',
                benefits: ['减少重渲染', '提高应用性能', '优化子组件更新']
            });
        }

        // TypeScript建议
        if (!content.includes('interface') && !content.includes('type') && content.includes('props')) {
            suggestions.push({
                type: 'enhance',
                priority: 9,
                description: '添加TypeScript类型定义提高代码安全性',
                codeExample: 'interface Props { title: string; onClick: () => void; }',
                benefits: ['编译时类型检查', '更好的IDE支持', '减少运行时错误']
            });
        }

        return suggestions.sort((a, b) => b.priority - a.priority);
    }

    // 🦀 Rust改进建议
    private generateRustSuggestions(content: string): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // 错误处理建议
        if (content.includes('unwrap()')) {
            suggestions.push({
                type: 'enhance',
                priority: 9,
                description: '替换unwrap()为更安全的错误处理',
                codeExample: 'match result { Ok(val) => val, Err(e) => handle_error(e) }',
                benefits: ['避免panic', '更好的错误处理', '提高程序稳定性']
            });
        }

        // 性能优化建议
        if (content.includes('clone()')) {
            suggestions.push({
                type: 'optimize',
                priority: 7,
                description: '减少clone()使用，考虑借用或智能指针',
                codeExample: 'fn process_data(data: &Vec<String>) // 使用引用',
                benefits: ['提高性能', '减少内存分配', '符合Rust零成本抽象原则']
            });
        }

        // 并发安全建议
        if (content.includes('thread::spawn') && !content.includes('Arc<Mutex<')) {
            suggestions.push({
                type: 'enhance',
                priority: 8,
                description: '使用Arc<Mutex<T>>实现线程安全的数据共享',
                codeExample: 'let shared_data = Arc::new(Mutex::new(data));',
                benefits: ['线程安全', '数据一致性', '避免数据竞争']
            });
        }

        // 异步编程建议
        if (content.includes('std::thread') && !content.includes('async')) {
            suggestions.push({
                type: 'modernize',
                priority: 6,
                description: '考虑使用async/await进行异步编程',
                codeExample: 'async fn process_data() -> Result<(), Error> { ... }',
                benefits: ['更高效的I/O处理', '减少线程开销', '现代Rust异步编程']
            });
        }

        return suggestions.sort((a, b) => b.priority - a.priority);
    }

    // ⚛️ React架构模式检测
    private detectReactPatterns(content: string): ArchitecturePattern[] {
        const patterns: ArchitecturePattern[] = [];

        // Hooks模式
        if (content.includes('useState') || content.includes('useEffect')) {
            patterns.push({
                name: 'React Hooks模式',
                confidence: 0.9,
                description: '使用现代Hooks进行状态和副作用管理',
                components: ['状态管理', '副作用处理', '生命周期']
            });
        }

        // 高阶组件模式
        if (content.includes('withComponent') || content.includes('HOC')) {
            patterns.push({
                name: '高阶组件模式',
                confidence: 0.8,
                description: '使用HOC进行组件增强和逻辑复用',
                components: ['组件增强', '逻辑复用', '横切关注点']
            });
        }

        // Context模式
        if (content.includes('createContext') || content.includes('useContext')) {
            patterns.push({
                name: 'Context模式',
                confidence: 0.85,
                description: '使用Context进行跨组件状态共享',
                components: ['状态提升', '跨组件通信', '全局状态']
            });
        }

        return patterns;
    }

    // 🦀 Rust架构模式检测
    private detectRustPatterns(content: string): ArchitecturePattern[] {
        const patterns: ArchitecturePattern[] = [];

        // 所有权模式
        if (content.includes('impl') && content.includes('&self')) {
            patterns.push({
                name: 'Rust所有权模式',
                confidence: 0.95,
                description: '使用Rust所有权系统管理内存安全',
                components: ['借用检查', '生命周期', '内存安全']
            });
        }

        // 状态机模式
        if (content.includes('enum') && content.includes('match')) {
            patterns.push({
                name: '状态机模式',
                confidence: 0.8,
                description: '使用枚举和模式匹配实现状态机',
                components: ['状态枚举', '状态转换', '行为映射']
            });
        }

        // 错误处理模式
        if (content.includes('Result<') && content.includes('?')) {
            patterns.push({
                name: 'Result错误处理模式',
                confidence: 0.9,
                description: '使用Result类型进行优雅的错误处理',
                components: ['错误传播', '类型安全', '显式错误处理']
            });
        }

        return patterns;
    }
}

// 导出单例
export const aiEnhancedAnalyzer = new AIEnhancedAnalyzer();
