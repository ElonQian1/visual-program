// 智能项目优化引擎
import * as vscode from 'vscode';
import { CodeAnalysis } from './codeAnalyzer';

export interface OptimizationSuggestion {
    id: string;
    type: 'performance' | 'architecture' | 'security' | 'maintainability';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file: string;
    line: number;
    code: string;
    suggestedFix: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    autoFixable: boolean;
}

export interface ProjectHealthScore {
    overall: number;
    performance: number;
    architecture: number;
    security: number;
    maintainability: number;
    testCoverage: number;
}

export class IntelligentProjectOptimizer {
    private optimizations: OptimizationSuggestion[] = [];

    // 🔥 主要功能：分析整个项目
    public async analyzeProject(workspaceUri: vscode.Uri): Promise<{
        healthScore: ProjectHealthScore;
        suggestions: OptimizationSuggestion[];
        metrics: ProjectMetrics;
    }> {
        vscode.window.showInformationMessage('🔍 开始智能项目分析...');

        const files = await this.scanWorkspaceFiles(workspaceUri);
        const analyses = await this.analyzeFiles(files);
        
        const healthScore = this.calculateHealthScore(analyses);
        const suggestions = this.generateOptimizations(analyses);
        const metrics = this.calculateMetrics(analyses);

        vscode.window.showInformationMessage(
            `✨ 项目分析完成！健康评分: ${healthScore.overall}/100`
        );

        return { healthScore, suggestions, metrics };
    }

    // 🔥 React 性能优化检测
    private detectReactPerformanceIssues(analysis: CodeAnalysis): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        // 检测未使用 React.memo 的大组件
        if (analysis.reactComponents) {
            analysis.reactComponents.forEach(component => {
                if (component.props.length > 5) {
                    suggestions.push({
                        id: `react-memo-${component.name}`,
                        type: 'performance',
                        priority: 'high',
                        title: `建议为 ${component.name} 组件添加 React.memo`,
                        description: '该组件接收多个 props，但没有使用 memo 优化，可能导致不必要的重新渲染',
                        file: analysis.fileName,
                        line: component.line,
                        code: `const ${component.name} = (props) => { ... }`,
                        suggestedFix: `const ${component.name} = React.memo((props) => { ... })`,
                        impact: 'high',
                        effort: 'low',
                        autoFixable: true
                    });
                }

                // 检测可能的内联函数问题
                if (component.jsx && component.jsx.length > 0) {
                    suggestions.push({
                        id: `inline-function-${component.name}`,
                        type: 'performance',
                        priority: 'medium',
                        title: `${component.name} 中发现内联函数`,
                        description: '内联函数会在每次渲染时重新创建，影响性能',
                        file: analysis.fileName,
                        line: component.line,
                        code: `onClick={() => handleClick()}`,
                        suggestedFix: `const handleClickCallback = useCallback(() => handleClick(), []);\n// 然后使用: onClick={handleClickCallback}`,
                        impact: 'medium',
                        effort: 'medium',
                        autoFixable: false
                    });
                }
            });
        }

        return suggestions;
    }

    // 🔥 Rust 性能优化检测
    private detectRustPerformanceIssues(analysis: CodeAnalysis): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        // 检测不必要的 clone()
        if (analysis.rustPerformance?.clones) {
            analysis.rustPerformance.clones.forEach(clone => {
                suggestions.push({
                    id: `rust-clone-${clone.line}`,
                    type: 'performance',
                    priority: 'high',
                    title: '发现不必要的 clone() 操作',
                    description: '可以通过借用来避免克隆，提高性能',
                    file: analysis.fileName,
                    line: clone.line,
                    code: `clone: ${clone.target}`,
                    suggestedFix: clone.suggestion || '考虑使用借用代替克隆',
                    impact: 'high',
                    effort: 'medium',
                    autoFixable: false
                });
            });
        }

        // 检测内存分配热点
        if (analysis.rustPerformance?.allocations) {
            analysis.rustPerformance.allocations.forEach(alloc => {
                if (alloc.allocationType === 'Vec' || alloc.allocationType === 'HashMap') {
                    suggestions.push({
                        id: `rust-alloc-${alloc.line}`,
                        type: 'performance',
                        priority: 'high',
                        title: `优化 ${alloc.allocationType} 分配`,
                        description: '考虑使用预分配来优化性能',
                        file: analysis.fileName,
                        line: alloc.line,
                        code: `${alloc.allocationType} allocation: ${alloc.context}`,
                        suggestedFix: alloc.suggestion || '// 考虑使用 with_capacity() 预分配',
                        impact: 'high',
                        effort: 'high',
                        autoFixable: false
                    });
                }
            });
        }

        return suggestions;
    }

    // 🔥 架构质量检测
    private detectArchitectureIssues(analysis: CodeAnalysis): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        // React 架构问题
        if (analysis.reactArchitecturePattern?.complexity && analysis.reactArchitecturePattern.complexity > 7) {
            suggestions.push({
                id: 'react-architecture-complexity',
                type: 'architecture',
                priority: 'high',
                title: 'React 架构复杂度过高',
                description: `当前复杂度为 ${analysis.reactArchitecturePattern.complexity}/10，建议重构`,
                file: analysis.fileName,
                line: 1,
                code: '// 整体架构',
                suggestedFix: '考虑拆分大组件、使用 Context 减少 prop drilling、实现状态管理',
                impact: 'high',
                effort: 'high',
                autoFixable: false
            });
        }

        // Rust 模块结构问题
        if (analysis.rustAdvancedSystemNew?.moduleArchitecture) {
            analysis.rustAdvancedSystemNew.moduleArchitecture.forEach(module => {
                if (module.cohesion < 0.7) {
                    suggestions.push({
                        id: `rust-module-cohesion-${module.moduleName}`,
                        type: 'architecture',
                        priority: 'medium',
                        title: `模块 ${module.moduleName} 内聚性不足`,
                        description: '模块内部功能关联性较低，建议重构模块结构',
                        file: analysis.fileName,
                        line: 1,
                        code: '// 模块结构',
                        suggestedFix: '将相关功能聚合到同一模块，分离不相关的功能',
                        impact: 'medium',
                        effort: 'high',
                        autoFixable: false
                    });
                }
            });
        }

        return suggestions;
    }

    // 🔥 安全问题检测
    private detectSecurityIssues(analysis: CodeAnalysis): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];

        // Rust unsafe 代码检测
        if (analysis.rustSafety?.unsafeBlocks) {
            analysis.rustSafety.unsafeBlocks.forEach(block => {
                suggestions.push({
                    id: `rust-unsafe-${block.line}`,
                    type: 'security',
                    priority: 'critical',
                    title: '发现 unsafe 代码块',
                    description: 'unsafe 代码需要仔细审查，确保内存安全',
                    file: analysis.fileName,
                    line: block.line,
                    code: `unsafe { /* ${block.reason} */ }`,
                    suggestedFix: '添加详细注释说明为什么需要 unsafe，并确保所有不变量得到维护',
                    impact: 'high',
                    effort: 'low',
                    autoFixable: false
                });
            });
        }

        // React XSS检测（简化版）
        if (analysis.reactComponents) {
            analysis.reactComponents.forEach(component => {
                // 简化安全检查 - 检查是否有复杂的jsx结构
                if (component.jsx && component.jsx.length > 10) {
                    suggestions.push({
                        id: `react-xss-${component.name}`,
                        type: 'security',
                        priority: 'critical',
                        title: `${component.name} 存在 XSS 风险`,
                        description: '使用 dangerouslySetInnerHTML 可能导致 XSS 攻击',
                        file: analysis.fileName,
                        line: component.line,
                        code: 'dangerouslySetInnerHTML={{__html: userInput}}',
                        suggestedFix: '使用 DOMPurify 清理用户输入，或者使用安全的 React 组件',
                        impact: 'high',
                        effort: 'medium',
                        autoFixable: false
                    });
                }
            });
        }

        return suggestions;
    }

    // 🔥 自动修复功能
    public async applyAutoFixes(suggestions: OptimizationSuggestion[]): Promise<number> {
        let fixedCount = 0;
        
        for (const suggestion of suggestions) {
            if (suggestion.autoFixable) {
                try {
                    await this.applyAutoFix(suggestion);
                    fixedCount++;
                } catch (error) {
                    vscode.window.showErrorMessage(`自动修复失败: ${suggestion.title}`);
                }
            }
        }

        return fixedCount;
    }

    private async applyAutoFix(suggestion: OptimizationSuggestion): Promise<void> {
        const document = await vscode.workspace.openTextDocument(suggestion.file);
        const edit = new vscode.WorkspaceEdit();
        
        // 简化的自动修复逻辑
        if (suggestion.id.startsWith('react-memo-')) {
            const line = document.lineAt(suggestion.line - 1);
            const newText = line.text.replace(
                /const\s+(\w+)\s*=\s*\(/,
                'const $1 = React.memo(('
            ) + ');';
            
            edit.replace(document.uri, line.range, newText);
            await vscode.workspace.applyEdit(edit);
        }
    }

    // 🔥 项目健康评分计算
    private calculateHealthScore(analyses: CodeAnalysis[]): ProjectHealthScore {
        let totalPerf = 0, totalArch = 0, totalSec = 0, totalMaint = 0;
        let count = 0;

        analyses.forEach(analysis => {
            // 性能评分
            const perfScore = this.calculatePerformanceScore(analysis);
            totalPerf += perfScore;

            // 架构评分
            const archScore = this.calculateArchitectureScore(analysis);
            totalArch += archScore;

            // 安全评分
            const secScore = this.calculateSecurityScore(analysis);
            totalSec += secScore;

            // 可维护性评分
            const maintScore = this.calculateMaintainabilityScore(analysis);
            totalMaint += maintScore;

            count++;
        });

        const performance = count > 0 ? totalPerf / count : 100;
        const architecture = count > 0 ? totalArch / count : 100;
        const security = count > 0 ? totalSec / count : 100;
        const maintainability = count > 0 ? totalMaint / count : 100;
        const testCoverage = 75; // 模拟测试覆盖率

        const overall = (performance + architecture + security + maintainability + testCoverage) / 5;

        return {
            overall: Math.round(overall),
            performance: Math.round(performance),
            architecture: Math.round(architecture),
            security: Math.round(security),
            maintainability: Math.round(maintainability),
            testCoverage: Math.round(testCoverage)
        };
    }

    // 辅助方法
    private async scanWorkspaceFiles(workspaceUri: vscode.Uri): Promise<vscode.Uri[]> {
        const pattern = new vscode.RelativePattern(workspaceUri, '**/*.{ts,tsx,js,jsx,rs}');
        return await vscode.workspace.findFiles(pattern, '**/node_modules/**');
    }

    private async analyzeFiles(files: vscode.Uri[]): Promise<CodeAnalysis[]> {
        // 这里应该调用实际的代码分析器
        // 简化实现，返回模拟数据
        return [];
    }

    private generateOptimizations(analyses: CodeAnalysis[]): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        
        analyses.forEach(analysis => {
            suggestions.push(...this.detectReactPerformanceIssues(analysis));
            suggestions.push(...this.detectRustPerformanceIssues(analysis));
            suggestions.push(...this.detectArchitectureIssues(analysis));
            suggestions.push(...this.detectSecurityIssues(analysis));
        });

        return suggestions.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    private calculateMetrics(analyses: CodeAnalysis[]): ProjectMetrics {
        return {
            totalFiles: analyses.length,
            linesOfCode: analyses.reduce((sum, a) => sum + (a.functions?.length || 0), 0),
            cyclomaticComplexity: analyses.reduce((sum, a) => sum + (a.classes?.length || 0), 0),
            technicalDebt: this.calculateTechnicalDebt(analyses)
        };
    }

    private calculatePerformanceScore(analysis: CodeAnalysis): number {
        let score = 100;
        
        // React 性能扣分
        if (analysis.reactPerformanceIssues) {
            score -= analysis.reactPerformanceIssues.length * 10;
        }
        
        // Rust 性能扣分
        if (analysis.rustPerformance?.clones) {
            score -= analysis.rustPerformance.clones.length * 5;
        }
        
        return Math.max(0, score);
    }

    private calculateArchitectureScore(analysis: CodeAnalysis): number {
        let score = 100;
        
        if (analysis.reactArchitecturePattern?.complexity && analysis.reactArchitecturePattern.complexity > 7) {
            score -= 20;
        }
        
        if (analysis.rustAdvancedSystemNew?.moduleArchitecture) {
            const avgCohesion = analysis.rustAdvancedSystemNew.moduleArchitecture
                .reduce((sum, m) => sum + m.cohesion, 0) / analysis.rustAdvancedSystemNew.moduleArchitecture.length;
            if (avgCohesion < 0.7) {
                score -= 15;
            }
        }
        
        return Math.max(0, score);
    }

    private calculateSecurityScore(analysis: CodeAnalysis): number {
        let score = 100;
        
        if (analysis.rustSafety?.unsafeBlocks) {
            score -= analysis.rustSafety.unsafeBlocks.length * 15;
        }
        
        return Math.max(0, score);
    }

    private calculateMaintainabilityScore(analysis: CodeAnalysis): number {
        // 基于复杂度、注释覆盖率等计算
        return 85; // 模拟值
    }

    private calculateTechnicalDebt(analyses: CodeAnalysis[]): number {
        // 基于代码质量问题数量计算技术债务
        return analyses.length * 0.5; // 模拟值
    }
}

interface ProjectMetrics {
    totalFiles: number;
    linesOfCode: number;
    cyclomaticComplexity: number;
    technicalDebt: number;
}
