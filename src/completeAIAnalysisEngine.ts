// AI增强代码分析引擎 - 完整实现
import * as vscode from 'vscode';
import { CodeAnalysis } from './codeAnalyzer';

export interface AICodeInsight {
    id: string;
    type: 'optimization' | 'refactoring' | 'bug_risk' | 'architecture' | 'performance' | 'security';
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    suggestion: string;
    codeExample?: string;
    autoFixAvailable: boolean;
    location: {
        file: string;
        line: number;
        column: number;
        endLine?: number;
        endColumn?: number;
    };
    confidence: number; // 0-1
    estimatedImpact: 'low' | 'medium' | 'high';
}

export interface CodePattern {
    id: string;
    name: string;
    pattern: RegExp | string;
    framework: 'react' | 'rust' | 'all';
    description: string;
    category: 'antipattern' | 'best_practice' | 'performance' | 'security' | 'maintainability';
    severity: 'info' | 'warning' | 'error';
    suggestion: string;
    autoFix?: (match: string) => string;
}

export interface AnalysisContext {
    fileName: string;
    language: 'typescript' | 'javascript' | 'rust';
    framework?: 'react' | 'next' | 'express' | 'axum' | 'warp';
    projectType?: 'frontend' | 'backend' | 'fullstack';
    codeComplexity: number;
    linesOfCode: number;
}

export class AIEnhancedAnalysisEngine {
    private patterns: Map<string, CodePattern> = new Map();
    private insights: Map<string, AICodeInsight[]> = new Map();
    private analysisHistory: Map<string, AnalysisContext> = new Map();

    constructor() {
        this.initializePatterns();
    }

    // 🧠 主要分析入口
    public async analyzeCodeWithAI(
        document: vscode.TextDocument,
        codeAnalysis?: CodeAnalysis
    ): Promise<AICodeInsight[]> {
        const content = document.getText();
        const context = this.buildAnalysisContext(document, content);
        const insights: AICodeInsight[] = [];

        try {
            // 1. 模式匹配分析
            const patternInsights = await this.analyzePatterns(content, context);
            insights.push(...patternInsights);

            // 2. 架构分析
            const architectureInsights = await this.analyzeArchitecture(content, context, codeAnalysis);
            insights.push(...architectureInsights);

            // 3. 性能分析
            const performanceInsights = await this.analyzePerformance(content, context, codeAnalysis);
            insights.push(...performanceInsights);

            // 4. 安全分析
            const securityInsights = await this.analyzeSecurity(content, context);
            insights.push(...securityInsights);

            // 5. 代码质量分析
            const qualityInsights = await this.analyzeCodeQuality(content, context);
            insights.push(...qualityInsights);

            // 6. React特定分析
            if (context.framework === 'react') {
                const reactInsights = await this.analyzeReactSpecific(content, context, codeAnalysis);
                insights.push(...reactInsights);
            }

            // 7. Rust特定分析
            if (context.language === 'rust') {
                const rustInsights = await this.analyzeRustSpecific(content, context, codeAnalysis);
                insights.push(...rustInsights);
            }

            // 缓存结果
            this.insights.set(document.fileName, insights);
            this.analysisHistory.set(document.fileName, context);

            return insights;

        } catch (error) {
            console.error('AI分析失败:', error);
            return [];
        }
    }

    // 🔍 模式匹配分析
    private async analyzePatterns(content: string, context: AnalysisContext): Promise<AICodeInsight[]> {
        const insights: AICodeInsight[] = [];
        const lines = content.split('\n');

        // 获取适用的模式
        const applicablePatterns = Array.from(this.patterns.values()).filter(pattern => 
            pattern.framework === 'all' || pattern.framework === context.framework
        );

        for (const pattern of applicablePatterns) {
            if (typeof pattern.pattern === 'string') {
                // 简单字符串匹配
                if (content.includes(pattern.pattern)) {
                    insights.push(this.createInsightFromPattern(pattern, context, 0, 0));
                }
            } else {
                // 正则表达式匹配
                lines.forEach((line, index) => {
                    const matches = line.match(pattern.pattern as RegExp);
                    if (matches) {
                        const column = line.indexOf(matches[0]);
                        insights.push(this.createInsightFromPattern(pattern, context, index + 1, column));
                    }
                });
            }
        }

        return insights;
    }

    // 🏗️ 架构分析
    private async analyzeArchitecture(
        content: string, 
        context: AnalysisContext, 
        codeAnalysis?: CodeAnalysis
    ): Promise<AICodeInsight[]> {
        const insights: AICodeInsight[] = [];

        if (context.framework === 'react') {
            // React架构分析
            if (codeAnalysis?.reactComponents && codeAnalysis.reactComponents.length > 0) {
                // 检查组件复杂度
                codeAnalysis.reactComponents.forEach(component => {
                    if (component.props && component.props.length > 10) {
                        insights.push({
                            id: `arch-react-${component.name}-props`,
                            type: 'architecture',
                            severity: 'warning',
                            title: '组件属性过多',
                            description: `组件 ${component.name} 有 ${component.props.length} 个属性，可能表明职责过于复杂`,
                            suggestion: '考虑将大型组件拆分为更小的、职责单一的组件，或使用组合模式',
                            autoFixAvailable: false,
                            location: { file: context.fileName, line: component.line || 1, column: 0 },
                            confidence: 0.8,
                            estimatedImpact: 'medium'
                        });
                    }

                    // 检查状态管理复杂度
                    if (component.hooks && component.hooks.length > 8) {
                        insights.push({
                            id: `arch-react-${component.name}-hooks`,
                            type: 'architecture',
                            severity: 'warning',
                            title: 'Hook使用过多',
                            description: `组件 ${component.name} 使用了 ${component.hooks.length} 个Hook，可能逻辑过于复杂`,
                            suggestion: '考虑提取自定义Hook或使用useReducer来管理复杂状态',
                            autoFixAvailable: false,
                            location: { file: context.fileName, line: component.line || 1, column: 0 },
                            confidence: 0.7,
                            estimatedImpact: 'medium'
                        });
                    }
                });
            }
        }

        if (context.language === 'rust') {
            // Rust架构分析
            if (codeAnalysis?.rustStructs && codeAnalysis.rustStructs.length > 0) {
                // 检查结构体大小
                codeAnalysis.rustStructs.forEach(struct => {
                    if (struct.fields && struct.fields.length > 15) {
                        insights.push({
                            id: `arch-rust-${struct.name}-fields`,
                            type: 'architecture',
                            severity: 'warning',
                            title: '结构体字段过多',
                            description: `结构体 ${struct.name} 有 ${struct.fields.length} 个字段，可能违反单一职责原则`,
                            suggestion: '考虑将大型结构体拆分为更小的结构体，或使用组合模式',
                            autoFixAvailable: false,
                            location: { file: context.fileName, line: struct.line || 1, column: 0 },
                            confidence: 0.8,
                            estimatedImpact: 'medium'
                        });
                    }
                });
            }
        }

        return insights;
    }

    // ⚡ 性能分析
    private async analyzePerformance(
        content: string, 
        context: AnalysisContext, 
        codeAnalysis?: CodeAnalysis
    ): Promise<AICodeInsight[]> {
        const insights: AICodeInsight[] = [];

        if (context.framework === 'react') {
            // React性能分析
            
            // 检查内联函数
            const inlineFunctionPattern = /onClick=\{[^}]*=>/g;
            const inlineFunctions = content.match(inlineFunctionPattern);
            if (inlineFunctions && inlineFunctions.length > 3) {
                insights.push({
                    id: 'perf-react-inline-functions',
                    type: 'performance',
                    severity: 'warning',
                    title: '过多内联函数',
                    description: `发现${inlineFunctions.length}个内联函数，可能导致不必要的重渲染`,
                    suggestion: '使用useCallback包装函数或将函数定义移到组件外部',
                    codeExample: `// 避免这样写
onClick={() => handleClick(item)}

// 推荐这样写
const handleItemClick = useCallback(() => handleClick(item), [item]);
<button onClick={handleItemClick}>`,
                    autoFixAvailable: true,
                    location: { file: context.fileName, line: 1, column: 0 },
                    confidence: 0.9,
                    estimatedImpact: 'medium'
                });
            }

            // 检查缺失key属性
            const listRenderPattern = /\.map\([^}]*=>\s*<[^>]*>/g;
            const mapCalls = content.match(listRenderPattern);
            if (mapCalls) {
                mapCalls.forEach((match, index) => {
                    if (!match.includes('key=')) {
                        insights.push({
                            id: `perf-react-missing-key-${index}`,
                            type: 'performance',
                            severity: 'error',
                            title: '缺失key属性',
                            description: '列表渲染中缺少key属性，会影响React的reconciliation性能',
                            suggestion: '为每个列表项添加唯一的key属性',
                            codeExample: `// 添加key属性
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}`,
                            autoFixAvailable: true,
                            location: { file: context.fileName, line: 1, column: 0 },
                            confidence: 1.0,
                            estimatedImpact: 'high'
                        });
                    }
                });
            }
        }

        if (context.language === 'rust') {
            // Rust性能分析
            
            // 检查不必要的克隆
            const clonePattern = /\.clone\(\)/g;
            const clones = content.match(clonePattern);
            if (clones && clones.length > 5) {
                insights.push({
                    id: 'perf-rust-excessive-clones',
                    type: 'performance',
                    severity: 'warning',
                    title: '过多的clone调用',
                    description: `发现${clones.length}次clone调用，可能影响性能`,
                    suggestion: '考虑使用引用、Rc/Arc或重新设计数据结构以减少克隆',
                    codeExample: `// 避免不必要的clone
fn process_data(data: &Vec<String>) -> String {
    data.first().unwrap().clone() // 考虑返回&str
}

// 更好的方式
fn process_data(data: &[String]) -> &str {
    data.first().unwrap()
}`,
                    autoFixAvailable: false,
                    location: { file: context.fileName, line: 1, column: 0 },
                    confidence: 0.7,
                    estimatedImpact: 'medium'
                });
            }

            // 检查向量预分配
            const vecNewPattern = /Vec::new\(\)/g;
            const vecNews = content.match(vecNewPattern);
            if (vecNews && vecNews.length > 0) {
                insights.push({
                    id: 'perf-rust-vec-capacity',
                    type: 'performance',
                    severity: 'info',
                    title: '考虑预分配向量容量',
                    description: '如果知道大概大小，预分配向量容量可以提高性能',
                    suggestion: '使用Vec::with_capacity()预分配容量',
                    codeExample: `// 如果知道大概大小
let mut items = Vec::with_capacity(expected_size);`,
                    autoFixAvailable: false,
                    location: { file: context.fileName, line: 1, column: 0 },
                    confidence: 0.6,
                    estimatedImpact: 'low'
                });
            }
        }

        return insights;
    }

    // 🔒 安全分析
    private async analyzeSecurity(content: string, context: AnalysisContext): Promise<AICodeInsight[]> {
        const insights: AICodeInsight[] = [];

        // 检查潜在的SQL注入（如果有数据库查询）
        const sqlPattern = /(?:SELECT|INSERT|UPDATE|DELETE).*\$\{.*\}/gi;
        const sqlMatches = content.match(sqlPattern);
        if (sqlMatches) {
            insights.push({
                id: 'sec-sql-injection',
                type: 'security',
                severity: 'critical',
                title: '潜在SQL注入风险',
                description: '发现可能的SQL注入漏洞，直接拼接用户输入到SQL查询中',
                suggestion: '使用参数化查询或ORM来防止SQL注入',
                autoFixAvailable: false,
                location: { file: context.fileName, line: 1, column: 0 },
                confidence: 0.9,
                estimatedImpact: 'high'
            });
        }

        // 检查硬编码密钥
        const hardcodedKeyPattern = /(password|secret|key|token)\s*[:=]\s*["'][^"']{8,}/gi;
        const keyMatches = content.match(hardcodedKeyPattern);
        if (keyMatches) {
            insights.push({
                id: 'sec-hardcoded-secrets',
                type: 'security',
                severity: 'critical',
                title: '硬编码敏感信息',
                description: '代码中发现硬编码的密码、密钥或令牌',
                suggestion: '将敏感信息移至环境变量或安全的配置文件中',
                autoFixAvailable: false,
                location: { file: context.fileName, line: 1, column: 0 },
                confidence: 0.8,
                estimatedImpact: 'high'
            });
        }

        if (context.language === 'rust') {
            // Rust安全分析
            const unsafePattern = /unsafe\s*\{/g;
            const unsafeBlocks = content.match(unsafePattern);
            if (unsafeBlocks && unsafeBlocks.length > 0) {
                insights.push({
                    id: 'sec-rust-unsafe',
                    type: 'security',
                    severity: 'warning',
                    title: 'unsafe代码块',
                    description: `发现${unsafeBlocks.length}个unsafe代码块，需要仔细审查`,
                    suggestion: '确保unsafe代码的安全性，考虑是否有安全的替代方案',
                    autoFixAvailable: false,
                    location: { file: context.fileName, line: 1, column: 0 },
                    confidence: 1.0,
                    estimatedImpact: 'medium'
                });
            }
        }

        return insights;
    }

    // 💎 代码质量分析
    private async analyzeCodeQuality(content: string, context: AnalysisContext): Promise<AICodeInsight[]> {
        const insights: AICodeInsight[] = [];

        // 检查函数长度
        const functionPattern = context.language === 'rust' 
            ? /fn\s+\w+[^{]*\{[^}]*\}/gs
            : /(?:function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>)[^{]*\{[^}]*\}/gs;

        const functions = content.match(functionPattern) || [];
        functions.forEach((func, index) => {
            const lines = func.split('\n').length;
            if (lines > 50) {
                insights.push({
                    id: `quality-long-function-${index}`,
                    type: 'refactoring',
                    severity: 'warning',
                    title: '函数过长',
                    description: `函数有${lines}行，建议拆分为更小的函数`,
                    suggestion: '将大函数拆分为多个小函数，每个函数负责单一职责',
                    autoFixAvailable: false,
                    location: { file: context.fileName, line: 1, column: 0 },
                    confidence: 0.8,
                    estimatedImpact: 'medium'
                });
            }
        });

        // 检查注释密度
        const commentPattern = /(?:\/\/.*|\/\*[\s\S]*?\*\/)/g;
        const comments = content.match(commentPattern) || [];
        const codeLines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
        const commentRatio = comments.length / Math.max(codeLines, 1);

        if (commentRatio < 0.1 && codeLines > 50) {
            insights.push({
                id: 'quality-low-comment-ratio',
                type: 'refactoring',
                severity: 'info',
                title: '注释不足',
                description: `代码注释密度较低（${Math.round(commentRatio * 100)}%），建议增加必要的注释`,
                suggestion: '为复杂逻辑、公共API和重要算法添加注释',
                autoFixAvailable: false,
                location: { file: context.fileName, line: 1, column: 0 },
                confidence: 0.6,
                estimatedImpact: 'low'
            });
        }

        return insights;
    }

    // ⚛️ React特定分析
    private async analyzeReactSpecific(
        content: string, 
        context: AnalysisContext, 
        codeAnalysis?: CodeAnalysis
    ): Promise<AICodeInsight[]> {
        const insights: AICodeInsight[] = [];

        // 检查useState的过度使用
        const useStatePattern = /useState\(/g;
        const useStateCount = (content.match(useStatePattern) || []).length;
        if (useStateCount > 8) {
            insights.push({
                id: 'react-excessive-usestate',
                type: 'architecture',
                severity: 'warning',
                title: 'useState使用过多',
                description: `组件中使用了${useStateCount}个useState，考虑状态合并或使用useReducer`,
                suggestion: '使用useReducer管理复杂状态，或将相关状态合并为对象',
                codeExample: `// 替代多个useState
const [state, dispatch] = useReducer(reducer, initialState);`,
                autoFixAvailable: false,
                location: { file: context.fileName, line: 1, column: 0 },
                confidence: 0.7,
                estimatedImpact: 'medium'
            });
        }

        // 检查useEffect依赖
        const useEffectPattern = /useEffect\([^,\]]*,\s*\[[^\]]*\]/g;
        const effects = content.match(useEffectPattern) || [];
        effects.forEach((effect, index) => {
            if (effect.includes('[]')) {
                // 空依赖数组，检查是否合理
                insights.push({
                    id: `react-effect-empty-deps-${index}`,
                    type: 'bug_risk',
                    severity: 'info',
                    title: 'useEffect空依赖数组',
                    description: '使用了空依赖数组，确保这是期望的行为',
                    suggestion: '确认effect只需要在挂载时运行一次，否则添加必要的依赖',
                    autoFixAvailable: false,
                    location: { file: context.fileName, line: 1, column: 0 },
                    confidence: 0.5,
                    estimatedImpact: 'low'
                });
            }
        });

        return insights;
    }

    // 🦀 Rust特定分析
    private async analyzeRustSpecific(
        content: string, 
        context: AnalysisContext, 
        codeAnalysis?: CodeAnalysis
    ): Promise<AICodeInsight[]> {
        const insights: AICodeInsight[] = [];

        // 检查错误处理
        const unwrapPattern = /\.unwrap\(\)/g;
        const unwraps = content.match(unwrapPattern);
        if (unwraps && unwraps.length > 3) {
            insights.push({
                id: 'rust-excessive-unwrap',
                type: 'bug_risk',
                severity: 'warning',
                title: '过多unwrap调用',
                description: `发现${unwraps.length}次unwrap调用，可能导致panic`,
                suggestion: '使用模式匹配、map、and_then或?操作符来处理Option和Result',
                codeExample: `// 避免
value.unwrap()

// 推荐
match value {
    Some(v) => v,
    None => return Err("error"),
}

// 或使用?操作符
let value = some_result?;`,
                autoFixAvailable: false,
                location: { file: context.fileName, line: 1, column: 0 },
                confidence: 0.8,
                estimatedImpact: 'medium'
            });
        }

        // 检查生命周期参数
        const lifetimePattern = /'[a-z]+/g;
        const lifetimes = content.match(lifetimePattern);
        if (lifetimes && lifetimes.length > 5) {
            insights.push({
                id: 'rust-complex-lifetimes',
                type: 'refactoring',
                severity: 'info',
                title: '复杂的生命周期参数',
                description: '使用了多个生命周期参数，考虑简化设计',
                suggestion: '重新设计数据结构以减少生命周期复杂性，或使用智能指针',
                autoFixAvailable: false,
                location: { file: context.fileName, line: 1, column: 0 },
                confidence: 0.6,
                estimatedImpact: 'low'
            });
        }

        return insights;
    }

    // 🏗️ 构建分析上下文
    private buildAnalysisContext(document: vscode.TextDocument, content: string): AnalysisContext {
        const fileName = document.fileName;
        const language = this.detectLanguage(document.languageId);
        const framework = this.detectFramework(content, language);
        const linesOfCode = content.split('\n').length;
        const codeComplexity = this.calculateComplexity(content);

        return {
            fileName,
            language,
            framework,
            linesOfCode,
            codeComplexity
        };
    }

    // 🔍 检测编程语言
    private detectLanguage(languageId: string): 'typescript' | 'javascript' | 'rust' {
        switch (languageId) {
            case 'typescript':
            case 'typescriptreact':
                return 'typescript';
            case 'javascript':
            case 'javascriptreact':
                return 'javascript';
            case 'rust':
                return 'rust';
            default:
                return 'typescript';
        }
    }

    // 🚀 检测框架
    private detectFramework(content: string, language: string): 'react' | 'next' | 'express' | 'axum' | 'warp' | undefined {
        if (language === 'typescript' || language === 'javascript') {
            if (content.includes('from "react"') || content.includes('from \'react\'')) {
                return 'react';
            }
            if (content.includes('from "next"') || content.includes('from \'next\'')) {
                return 'next';
            }
            if (content.includes('express(')) {
                return 'express';
            }
        }
        
        if (language === 'rust') {
            if (content.includes('use axum::')) {
                return 'axum';
            }
            if (content.includes('use warp::')) {
                return 'warp';
            }
        }

        return undefined;
    }

    // 📊 计算代码复杂度
    private calculateComplexity(content: string): number {
        // 简化的复杂度计算
        let complexity = 1; // 基础复杂度

        // 控制流语句增加复杂度
        const controlFlowPatterns = [
            /\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g,
            /\bmatch\b/g, /\bswitch\b/g, /\bcatch\b/g, /\btry\b/g
        ];

        controlFlowPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });

        return Math.min(complexity, 100); // 限制最大值
    }

    // 🎯 从模式创建洞察
    private createInsightFromPattern(
        pattern: CodePattern, 
        context: AnalysisContext, 
        line: number, 
        column: number
    ): AICodeInsight {
        return {
            id: `pattern-${pattern.id}-${line}-${column}`,
            type: this.mapCategoryToType(pattern.category),
            severity: pattern.severity,
            title: pattern.name,
            description: pattern.description,
            suggestion: pattern.suggestion,
            autoFixAvailable: !!pattern.autoFix,
            location: { file: context.fileName, line, column },
            confidence: 0.8,
            estimatedImpact: pattern.severity === 'error' ? 'high' : 'medium'
        };
    }

    // 🗂️ 映射类别到类型
    private mapCategoryToType(category: string): AICodeInsight['type'] {
        switch (category) {
            case 'antipattern':
            case 'best_practice':
                return 'refactoring';
            case 'performance':
                return 'performance';
            case 'security':
                return 'security';
            default:
                return 'optimization';
        }
    }

    // 📚 初始化模式库
    private initializePatterns(): void {
        // React模式
        this.patterns.set('react-inline-styles', {
            id: 'react-inline-styles',
            name: '内联样式使用',
            pattern: /style=\{\{[^}]+\}\}/g,
            framework: 'react',
            description: '使用内联样式可能影响性能和维护性',
            category: 'performance',
            severity: 'info',
            suggestion: '考虑使用CSS类或CSS-in-JS库'
        });

        this.patterns.set('react-console-log', {
            id: 'react-console-log',
            name: '控制台日志',
            pattern: /console\.log\(/g,
            framework: 'all',
            description: '生产代码中不应该包含console.log',
            category: 'best_practice',
            severity: 'warning',
            suggestion: '移除console.log或使用适当的日志库'
        });

        // Rust模式
        this.patterns.set('rust-println-debug', {
            id: 'rust-println-debug',
            name: 'println!调试语句',
            pattern: /println!\(/g,
            framework: 'rust',
            description: '生产代码中不应该包含调试println!语句',
            category: 'best_practice',
            severity: 'info',
            suggestion: '使用log宏或移除调试语句'
        });

        this.patterns.set('rust-todo-macro', {
            id: 'rust-todo-macro',
            name: 'todo!宏',
            pattern: /todo!\(/g,
            framework: 'rust',
            description: 'todo!宏会在运行时panic',
            category: 'antipattern',
            severity: 'error',
            suggestion: '实现相应的逻辑或使用unimplemented!如果是有意的'
        });
    }

    // 🔧 自动修复洞察
    public async autoFixInsight(insight: AICodeInsight, document: vscode.TextDocument): Promise<boolean> {
        if (!insight.autoFixAvailable) {
            return false;
        }

        try {
            const edit = new vscode.WorkspaceEdit();
            
            // 根据洞察类型应用修复
            switch (insight.id) {
                case 'react-inline-functions':
                    // 这里应该实现具体的修复逻辑
                    break;
                case 'perf-react-missing-key':
                    // 实现key属性添加逻辑
                    break;
                default:
                    return false;
            }

            const success = await vscode.workspace.applyEdit(edit);
            return success;
        } catch (error) {
            console.error('自动修复失败:', error);
            return false;
        }
    }

    // 📊 获取分析统计
    public getAnalysisStats(fileName: string): {
        totalInsights: number;
        criticalCount: number;
        warningCount: number;
        infoCount: number;
        categories: Record<string, number>;
    } | null {
        const insights = this.insights.get(fileName);
        if (!insights) return null;

        const stats = {
            totalInsights: insights.length,
            criticalCount: insights.filter(i => i.severity === 'critical').length,
            warningCount: insights.filter(i => i.severity === 'warning').length,
            infoCount: insights.filter(i => i.severity === 'info').length,
            categories: {} as Record<string, number>
        };

        insights.forEach(insight => {
            stats.categories[insight.type] = (stats.categories[insight.type] || 0) + 1;
        });

        return stats;
    }

    // 🎯 获取优先修复建议
    public getPriorityInsights(fileName: string, limit: number = 5): AICodeInsight[] {
        const insights = this.insights.get(fileName);
        if (!insights) return [];

        return insights
            .sort((a, b) => {
                // 按严重程度和置信度排序
                const severityWeight = { critical: 4, error: 3, warning: 2, info: 1 };
                const aWeight = severityWeight[a.severity] * a.confidence;
                const bWeight = severityWeight[b.severity] * b.confidence;
                return bWeight - aWeight;
            })
            .slice(0, limit);
    }
}
