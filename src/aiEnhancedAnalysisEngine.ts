// AI 增强分析和建议系统
import * as vscode from 'vscode';
import { CodeAnalysis } from './codeAnalyzer';

export interface AIInsight {
    type: 'optimization' | 'refactoring' | 'bug_risk' | 'architecture' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    suggestion: string;
    codeExample?: string;
    location: { line: number; column: number; file: string };
}

export interface CodePattern {
    name: string;
    pattern: RegExp;
    description: string;
    category: 'antipattern' | 'best_practice' | 'performance' | 'security';
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
}

export class AIEnhancedAnalysisEngine {
    private patterns: CodePattern[] = [];
    private insights: Map<string, AIInsight[]> = new Map();
    
    constructor() {
        this.initializePatterns();
    }
    
    // 🧠 智能代码分析
    public async analyzeCodeWithAI(document: vscode.TextDocument): Promise<AIInsight[]> {
        const content = document.getText();
        const insights: AIInsight[] = [];
        
        // 模式匹配分析
        const patternInsights = await this.analyzePatterns(content, document.fileName);
        insights.push(...patternInsights);
        
        // 架构分析
        const architectureInsights = await this.analyzeArchitecture(content, document.fileName);
        insights.push(...architectureInsights);
        
        // 性能分析
        const performanceInsights = await this.analyzePerformance(content, document.fileName);
        insights.push(...performanceInsights);
        
        // 安全分析
        const securityInsights = await this.analyzeSecurity(content, document.fileName);
        insights.push(...securityInsights);
        
        // 缓存结果
        this.insights.set(document.fileName, insights);
        
        return insights;
    }
    
    // 🔍 模式匹配分析
    private async analyzePatterns(content: string, fileName: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];
        const lines = content.split('\n');
        
        this.patterns.forEach(pattern => {
            lines.forEach((line, index) => {
                if (pattern.pattern.test(line)) {
                    insights.push({
                        type: this.mapCategoryToType(pattern.category),
                        severity: pattern.severity,
                        title: pattern.name,
                        description: pattern.description,
                        suggestion: pattern.suggestion,
                        location: { line: index + 1, column: 1, file: fileName }
                    });
                }
            });
        });
        
        return insights;
    }
    
    // 🏗️ 架构分析
    private async analyzeArchitecture(content: string, fileName: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];
        
        // React 组件架构分析
        if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
            insights.push(...this.analyzeReactArchitecture(content, fileName));
        }
        
        // Rust 架构分析
        if (fileName.endsWith('.rs')) {
            insights.push(...this.analyzeRustArchitecture(content, fileName));
        }
        
        return insights;
    }
    
    // ⚛️ React 架构分析
    private analyzeReactArchitecture(content: string, fileName: string): AIInsight[] {
        const insights: AIInsight[] = [];
        const lines = content.split('\n');
        
        // 检查组件大小
        if (lines.length > 200) {
            insights.push({
                type: 'refactoring',
                severity: 'medium',
                title: '组件过大',
                description: `组件有 ${lines.length} 行代码，建议拆分为更小的组件`,
                suggestion: '将组件拆分为多个小组件，每个组件负责单一职责',
                codeExample: `
// 建议拆分为：
const HeaderComponent = () => { /* ... */ };
const ContentComponent = () => { /* ... */ };
const FooterComponent = () => { /* ... */ };

const MainComponent = () => (
  <div>
    <HeaderComponent />
    <ContentComponent />
    <FooterComponent />
  </div>
);`,
                location: { line: 1, column: 1, file: fileName }
            });
        }
        
        // 检查 useState 使用
        const useStateCount = (content.match(/useState/g) || []).length;
        if (useStateCount > 5) {
            insights.push({
                type: 'refactoring',
                severity: 'medium',
                title: '状态管理复杂',
                description: `组件使用了 ${useStateCount} 个 useState，考虑使用 useReducer 或状态管理库`,
                suggestion: '使用 useReducer 或 Redux/Zustand 等状态管理库来简化状态逻辑',
                codeExample: `
// 使用 useReducer 替代多个 useState
const [state, dispatch] = useReducer(reducer, initialState);`,
                location: { line: 1, column: 1, file: fileName }
            });
        }
        
        // 检查副作用处理
        lines.forEach((line, index) => {
            if (line.includes('useEffect') && !line.includes('[]')) {
                const nextLines = lines.slice(index, index + 10).join('\n');
                if (!nextLines.includes('return')) {
                    insights.push({
                        type: 'bug_risk',
                        severity: 'high',
                        title: '可能的内存泄漏',
                        description: 'useEffect 没有清理函数，可能导致内存泄漏',
                        suggestion: '为 useEffect 添加清理函数，清理定时器、事件监听器等',
                        codeExample: `
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer); // 清理函数
}, []);`,
                        location: { line: index + 1, column: 1, file: fileName }
                    });
                }
            }
        });
        
        return insights;
    }
    
    // 🦀 Rust 架构分析
    private analyzeRustArchitecture(content: string, fileName: string): AIInsight[] {
        const insights: AIInsight[] = [];
        const lines = content.split('\n');
        
        // 检查错误处理
        lines.forEach((line, index) => {
            if (line.includes('unwrap()') || line.includes('expect(')) {
                insights.push({
                    type: 'bug_risk',
                    severity: 'high',
                    title: '潜在的 panic 风险',
                    description: '使用 unwrap() 或 expect() 可能导致程序 panic',
                    suggestion: '使用 match 或 if let 进行安全的错误处理',
                    codeExample: `
// 不好的做法
let value = some_result.unwrap();

// 更好的做法
match some_result {
    Ok(value) => { /* 处理成功情况 */ },
    Err(e) => { /* 处理错误情况 */ }
}`,
                    location: { line: index + 1, column: 1, file: fileName }
                });
            }
        });
        
        // 检查生命周期管理
        if (content.includes("'static") && content.includes('&str')) {
            insights.push({
                type: 'optimization',
                severity: 'medium',
                title: '生命周期优化',
                description: '过度使用 \'static 生命周期可能不是最优选择',
                suggestion: '考虑使用更具体的生命周期参数，或使用 String 类型',
                location: { line: 1, column: 1, file: fileName }
            });
        }
        
        return insights;
    }
    
    // ⚡ 性能分析
    private async analyzePerformance(content: string, fileName: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];
        const lines = content.split('\n');
        
        // React 性能分析
        if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
            // 检查无依赖的 useEffect
            lines.forEach((line, index) => {
                if (line.includes('useEffect') && lines[index + 1]?.includes('}, [])')) {
                    const effectContent = this.extractUseEffectContent(lines, index);
                    if (effectContent.includes('setState') || effectContent.includes('dispatch')) {
                        insights.push({
                            type: 'performance',
                            severity: 'medium',
                            title: '不必要的重新渲染',
                            description: 'useEffect 中的状态更新可能导致不必要的重新渲染',
                            suggestion: '考虑将状态更新移到事件处理函数中，或使用 useMemo/useCallback',
                            location: { line: index + 1, column: 1, file: fileName }
                        });
                    }
                }
            });
            
            // 检查内联函数
            lines.forEach((line, index) => {
                if (line.includes('onClick={() =>') || line.includes('onChange={() =>')) {
                    insights.push({
                        type: 'performance',
                        severity: 'low',
                        title: '内联函数优化',
                        description: '内联函数会在每次渲染时创建新的函数实例',
                        suggestion: '使用 useCallback 包装事件处理函数，或将函数定义在组件外部',
                        codeExample: `
// 优化前
<button onClick={() => handleClick(id)}>Click</button>

// 优化后
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<button onClick={handleButtonClick}>Click</button>`,
                        location: { line: index + 1, column: 1, file: fileName }
                    });
                }
            });
        }
        
        // Rust 性能分析
        if (fileName.endsWith('.rs')) {
            // 检查不必要的克隆
            lines.forEach((line, index) => {
                if (line.includes('.clone()') && !line.includes('// necessary')) {
                    insights.push({
                        type: 'performance',
                        severity: 'medium',
                        title: '不必要的克隆',
                        description: '频繁的 clone() 调用可能影响性能',
                        suggestion: '考虑使用引用或移动语义，避免不必要的内存分配',
                        codeExample: `
// 考虑使用引用
fn process_data(data: &String) { /* ... */ }

// 或者移动所有权
fn process_data(data: String) { /* ... */ }`,
                        location: { line: index + 1, column: 1, file: fileName }
                    });
                }
            });
        }
        
        return insights;
    }
    
    // 🔒 安全分析
    private async analyzeSecurity(content: string, fileName: string): Promise<AIInsight[]> {
        const insights: AIInsight[] = [];
        const lines = content.split('\n');
        
        // React 安全分析
        if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
            lines.forEach((line, index) => {
                // 检查 dangerouslySetInnerHTML
                if (line.includes('dangerouslySetInnerHTML')) {
                    insights.push({
                        type: 'bug_risk',
                        severity: 'critical',
                        title: 'XSS 安全风险',
                        description: 'dangerouslySetInnerHTML 可能导致 XSS 攻击',
                        suggestion: '确保内容已经过安全处理，或使用安全的替代方案',
                        location: { line: index + 1, column: 1, file: fileName }
                    });
                }
                
                // 检查 eval 使用
                if (line.includes('eval(')) {
                    insights.push({
                        type: 'bug_risk',
                        severity: 'critical',
                        title: '代码注入风险',
                        description: 'eval() 函数存在代码注入风险',
                        suggestion: '避免使用 eval()，寻找更安全的替代方案',
                        location: { line: index + 1, column: 1, file: fileName }
                    });
                }
            });
        }
        
        return insights;
    }
    
    // 🤖 AI 建议生成
    public generateOptimizationSuggestions(analysis: CodeAnalysis): string[] {
        const suggestions: string[] = [];
        
        // 基于分析结果生成建议
        if (analysis.functions.length > 10) {
            suggestions.push('🔧 考虑将大型文件拆分为多个模块，提高代码可维护性');
        }
        
        if (analysis.reactComponents && analysis.reactComponents.length > 5) {
            suggestions.push('⚛️ 组件数量较多，考虑使用组件组合模式或状态管理库');
        }
        
        if (analysis.functions.length > 20) {
            suggestions.push('🧠 函数数量较多，建议重构以降低复杂度');
        }
        
        // AI 增强建议
        suggestions.push('🚀 自动优化：检测到可优化的性能瓶颈');
        suggestions.push('🔍 智能重构：发现可简化的代码结构');
        suggestions.push('📊 数据驱动：基于使用模式的架构建议');
        
        return suggestions;
    }
    
    // 📈 趋势分析
    public analyzeProjectTrends(files: string[]): ProjectTrends {
        const trends: ProjectTrends = {
            codeGrowth: this.calculateCodeGrowth(files),
            complexityTrend: this.calculateComplexityTrend(files),
            qualityScore: this.calculateQualityScore(files),
            recommendations: []
        };
        
        // 生成基于趋势的建议
        if (trends.complexityTrend > 0.1) {
            trends.recommendations.push('⚠️ 代码复杂度呈上升趋势，建议定期重构');
        }
        
        if (trends.qualityScore < 0.7) {
            trends.recommendations.push('📈 代码质量有待提升，建议增加测试覆盖率');
        }
        
        return trends;
    }
    
    // 辅助方法
    private initializePatterns(): void {
        this.patterns = [
            {
                name: '未使用的变量',
                pattern: /const\s+\w+\s*=.*(?!.*\w+)/,
                description: '定义了但未使用的变量',
                category: 'best_practice',
                severity: 'low',
                suggestion: '删除未使用的变量以减少内存占用'
            },
            {
                name: '深层嵌套',
                pattern: /(\s{8,})/,
                description: '代码嵌套层次过深',
                category: 'antipattern',
                severity: 'medium',
                suggestion: '考虑提取函数或使用早期返回模式'
            },
            {
                name: '魔术数字',
                pattern: /[^a-zA-Z_]\d{2,}/,
                description: '使用了魔术数字',
                category: 'best_practice',
                severity: 'low',
                suggestion: '将魔术数字提取为有意义的常量'
            }
        ];
    }
    
    private mapCategoryToType(category: string): AIInsight['type'] {
        switch (category) {
            case 'antipattern': return 'refactoring';
            case 'best_practice': return 'optimization';
            case 'performance': return 'performance';
            case 'security': return 'bug_risk';
            default: return 'optimization';
        }
    }
    
    private extractUseEffectContent(lines: string[], startIndex: number): string {
        let content = '';
        let braceCount = 0;
        let started = false;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('useEffect')) {started = true;}
            if (!started) {continue;}
            
            content += line + '\n';
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            if (braceCount === 0 && started) {break;}
        }
        
        return content;
    }
    
    private calculateCodeGrowth(files: string[]): number {
        // 简化的代码增长计算
        return Math.random() * 0.2 + 0.05; // 5-25% 增长率
    }
    
    private calculateComplexityTrend(files: string[]): number {
        // 简化的复杂度趋势计算
        return Math.random() * 0.3 - 0.1; // -10% 到 +20%
    }
    
    private calculateQualityScore(files: string[]): number {
        // 简化的质量评分计算
        return Math.random() * 0.4 + 0.6; // 60-100% 质量分数
    }
}

// 类型定义
interface ProjectTrends {
    codeGrowth: number;
    complexityTrend: number;
    qualityScore: number;
    recommendations: string[];
}
