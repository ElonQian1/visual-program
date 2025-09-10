import * as vscode from 'vscode';
import { aiEnhancedAnalyzer } from './aiEnhancedAnalyzer';
import { deepPerformanceAnalyzer } from './deepPerformanceAnalyzer';
import { codeGenerationEngine } from './enhancedCodeGenerationEngine';

// 综合代码质量检测结果
export interface CodeQualityReport {
    fileName: string;
    language: 'react' | 'rust' | 'other';
    timestamp: Date;
    overallScore: number; // 0-100 综合评分
    
    // 各维度评分
    scores: {
        codeQuality: number;
        performance: number;
        maintainability: number;
        security: number;
        bestPractices: number;
    };
    
    // 详细分析结果
    analysis: {
        ai: any; // AIAnalysisResult
        performance: any; // PerformanceAnalysisResult
    };
    
    // 优先级问题
    criticalIssues: QualityIssue[];
    recommendations: QualityRecommendation[];
    
    // 改进路线图
    improvementRoadmap: ImprovementPlan[];
}

export interface QualityIssue {
    type: 'security' | 'performance' | 'maintainability' | 'bugs' | 'code-smell';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    location: { line: number; column: number };
    impact: string;
    solution: string;
    effort: 'low' | 'medium' | 'high';
    estimatedFixTime: number; // 预估修复时间(小时)
}

export interface QualityRecommendation {
    category: 'architecture' | 'performance' | 'security' | 'testing' | 'documentation';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    benefits: string[];
    implementation: string;
    codeExample?: {
        before: string;
        after: string;
        explanation: string;
    };
}

export interface ImprovementPlan {
    phase: 'immediate' | 'short-term' | 'long-term';
    timeline: string; // 如 "1-2周", "1个月", "2-3个月"
    tasks: ImprovementTask[];
    expectedImpact: number; // 预期评分提升
}

export interface ImprovementTask {
    title: string;
    description: string;
    category: 'refactor' | 'optimize' | 'security' | 'testing' | 'documentation';
    effort: number; // 工作量(小时)
    priority: number; // 1-10
    dependencies: string[]; // 依赖的其他任务
}

// React和Rust代码质量检测器
export class ComprehensiveCodeQualityDetector {
    
    // 🎯 主要检测入口
    async analyzeCodeQuality(document: vscode.TextDocument): Promise<CodeQualityReport> {
        const content = document.getText();
        const language = this.detectLanguage(document.languageId, content);
        
        // 执行多维度分析
        const [aiAnalysis, performanceAnalysis] = await Promise.all([
            aiEnhancedAnalyzer.analyzeCodeIntelligence(document),
            deepPerformanceAnalyzer.analyzePerformance(document)
        ]);
        
        // 计算各维度评分
        const scores = this.calculateScores(aiAnalysis, performanceAnalysis, language);
        
        // 识别关键问题
        const criticalIssues = this.identifyCriticalIssues(aiAnalysis, performanceAnalysis, content);
        
        // 生成改进建议
        const recommendations = this.generateRecommendations(aiAnalysis, performanceAnalysis, language);
        
        // 制定改进路线图
        const improvementRoadmap = this.createImprovementRoadmap(criticalIssues, recommendations);
        
        // 计算综合评分
        const overallScore = this.calculateOverallScore(scores);
        
        return {
            fileName: document.fileName,
            language,
            timestamp: new Date(),
            overallScore,
            scores,
            analysis: {
                ai: aiAnalysis,
                performance: performanceAnalysis
            },
            criticalIssues,
            recommendations,
            improvementRoadmap
        };
    }

    // 🔍 语言检测
    private detectLanguage(languageId: string, content: string): 'react' | 'rust' | 'other' {
        if (languageId === 'rust') return 'rust';
        
        if ((languageId === 'typescript' || languageId === 'javascript' || 
             languageId === 'typescriptreact' || languageId === 'javascriptreact') &&
            (content.includes('React') || content.includes('jsx') || 
             content.includes('useState') || content.includes('useEffect'))) {
            return 'react';
        }
        
        return 'other';
    }

    // 📊 评分计算
    private calculateScores(aiAnalysis: any, performanceAnalysis: any, language: 'react' | 'rust' | 'other') {
        const codeQuality = (aiAnalysis.complexity + aiAnalysis.maintainability) / 2 * 10;
        const performance = performanceAnalysis.overallScore;
        const maintainability = aiAnalysis.maintainability * 10;
        const security = this.calculateSecurityScore(aiAnalysis, language);
        const bestPractices = this.calculateBestPracticesScore(aiAnalysis, language);

        return {
            codeQuality: Math.round(codeQuality),
            performance: Math.round(performance),
            maintainability: Math.round(maintainability),
            security: Math.round(security),
            bestPractices: Math.round(bestPractices)
        };
    }

    // 🛡️ 计算安全评分
    private calculateSecurityScore(aiAnalysis: any, language: 'react' | 'rust' | 'other'): number {
        const baseScore = 80; // 基础安全分数
        let deductions = 0;

        // 根据代码坏味道扣分
        aiAnalysis.codeSmells?.forEach((smell: any) => {
            if (smell.type === 'structure' && 
                (smell.message.includes('dangerouslySetInnerHTML') || 
                 smell.message.includes('eval') ||
                 smell.message.includes('unsafe'))) {
                deductions += smell.severity === 'high' ? 20 : 10;
            }
        });

        return Math.max(0, baseScore - deductions);
    }

    // 📚 计算最佳实践评分
    private calculateBestPracticesScore(aiAnalysis: any, language: 'react' | 'rust' | 'other'): number {
        const baseScore = 70;
        let bonus = 0;
        let deductions = 0;

        // 根据语言特定的最佳实践评分
        if (language === 'react') {
            // React最佳实践
            aiAnalysis.suggestions?.forEach((suggestion: any) => {
                if (suggestion.type === 'modernize') bonus += 5;
                if (suggestion.type === 'optimize') bonus += 3;
            });
        } else if (language === 'rust') {
            // Rust最佳实践
            aiAnalysis.codeSmells?.forEach((smell: any) => {
                if (smell.message.includes('unwrap()')) deductions += 5;
                if (smell.message.includes('clone()')) deductions += 2;
            });
        }

        return Math.max(0, Math.min(100, baseScore + bonus - deductions));
    }

    // 🚨 识别关键问题
    private identifyCriticalIssues(aiAnalysis: any, performanceAnalysis: any, content: string): QualityIssue[] {
        const issues: QualityIssue[] = [];

        // 从AI分析中提取关键问题
        aiAnalysis.codeSmells?.forEach((smell: any) => {
            if (smell.severity === 'high') {
                issues.push({
                    type: this.mapSmellTypeToIssueType(smell.type),
                    severity: 'high',
                    title: `代码质量问题: ${smell.type}`,
                    description: smell.message,
                    location: { line: smell.location.start.line, column: smell.location.start.character },
                    impact: '影响代码可维护性和可读性',
                    solution: smell.fix || '需要重构此代码段',
                    effort: 'medium',
                    estimatedFixTime: 2
                });
            }
        });

        // 从性能分析中提取关键问题
        performanceAnalysis.bottlenecks?.forEach((bottleneck: any) => {
            if (bottleneck.severity === 'critical' || bottleneck.severity === 'high') {
                issues.push({
                    type: 'performance',
                    severity: bottleneck.severity,
                    title: `性能瓶颈: ${bottleneck.type}`,
                    description: bottleneck.description,
                    location: bottleneck.location,
                    impact: bottleneck.impact,
                    solution: this.generatePerformanceSolution(bottleneck),
                    effort: this.estimateEffort(bottleneck.type),
                    estimatedFixTime: this.estimateFixTime(bottleneck.severity, bottleneck.type)
                });
            }
        });

        return issues.sort((a, b) => {
            const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityWeight[b.severity] - severityWeight[a.severity];
        });
    }

    // 💡 生成改进建议
    private generateRecommendations(aiAnalysis: any, performanceAnalysis: any, language: 'react' | 'rust' | 'other'): QualityRecommendation[] {
        const recommendations: QualityRecommendation[] = [];

        // 基于AI分析生成建议
        aiAnalysis.suggestions?.forEach((suggestion: any) => {
            recommendations.push({
                category: this.mapSuggestionTypeToCategory(suggestion.type),
                priority: this.mapPriorityToLevel(suggestion.priority),
                title: suggestion.description,
                description: suggestion.description,
                benefits: suggestion.benefits || [],
                implementation: suggestion.codeExample || '具体实现需要根据代码上下文确定',
                codeExample: suggestion.codeExample ? {
                    before: '// 当前代码\n' + (suggestion.codeExample.split('//')[0] || ''),
                    after: '// 优化后代码\n' + suggestion.codeExample,
                    explanation: suggestion.benefits?.join(', ') || '代码优化'
                } : undefined
            });
        });

        // 基于性能分析生成建议
        performanceAnalysis.optimizations?.forEach((optimization: any) => {
            recommendations.push({
                category: 'performance',
                priority: optimization.priority,
                title: optimization.description,
                description: optimization.implementation,
                benefits: [`预期性能提升: ${optimization.expectedGain}%`],
                implementation: optimization.implementation,
                codeExample: optimization.codeExample ? {
                    before: optimization.codeExample.before,
                    after: optimization.codeExample.after,
                    explanation: `性能优化 - 预期提升${optimization.expectedGain}%`
                } : undefined
            });
        });

        // 添加语言特定建议
        if (language === 'react') {
            recommendations.push(...this.getReactSpecificRecommendations());
        } else if (language === 'rust') {
            recommendations.push(...this.getRustSpecificRecommendations());
        }

        return recommendations.sort((a, b) => {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        });
    }

    // 🗺️ 创建改进路线图
    private createImprovementRoadmap(criticalIssues: QualityIssue[], recommendations: QualityRecommendation[]): ImprovementPlan[] {
        const roadmap: ImprovementPlan[] = [];

        // 立即处理阶段 - 关键问题
        const immediateTasks: ImprovementTask[] = [];
        criticalIssues.filter(issue => issue.severity === 'critical' || issue.severity === 'high')
            .slice(0, 5) // 最多5个立即任务
            .forEach((issue, index) => {
                immediateTasks.push({
                    title: `修复: ${issue.title}`,
                    description: issue.description,
                    category: this.mapIssueTypeToTaskCategory(issue.type),
                    effort: issue.estimatedFixTime,
                    priority: 10 - index,
                    dependencies: []
                });
            });

        if (immediateTasks.length > 0) {
            roadmap.push({
                phase: 'immediate',
                timeline: '1-2周',
                tasks: immediateTasks,
                expectedImpact: 15
            });
        }

        // 短期改进阶段 - 高优先级建议
        const shortTermTasks: ImprovementTask[] = [];
        recommendations.filter(rec => rec.priority === 'high')
            .slice(0, 8)
            .forEach((rec, index) => {
                shortTermTasks.push({
                    title: rec.title,
                    description: rec.description,
                    category: this.mapRecommendationCategoryToTaskCategory(rec.category),
                    effort: this.estimateRecommendationEffort(rec),
                    priority: 8 - Math.floor(index / 2),
                    dependencies: immediateTasks.length > 0 ? ['修复关键问题'] : []
                });
            });

        if (shortTermTasks.length > 0) {
            roadmap.push({
                phase: 'short-term',
                timeline: '1个月',
                tasks: shortTermTasks,
                expectedImpact: 25
            });
        }

        // 长期优化阶段 - 架构和设计改进
        const longTermTasks: ImprovementTask[] = [];
        recommendations.filter(rec => rec.category === 'architecture' || rec.priority === 'medium')
            .slice(0, 6)
            .forEach((rec, index) => {
                longTermTasks.push({
                    title: rec.title,
                    description: rec.description,
                    category: this.mapRecommendationCategoryToTaskCategory(rec.category),
                    effort: this.estimateRecommendationEffort(rec) * 1.5,
                    priority: 6 - Math.floor(index / 2),
                    dependencies: shortTermTasks.length > 0 ? ['完成短期改进'] : []
                });
            });

        if (longTermTasks.length > 0) {
            roadmap.push({
                phase: 'long-term',
                timeline: '2-3个月',
                tasks: longTermTasks,
                expectedImpact: 20
            });
        }

        return roadmap;
    }

    // 📈 计算综合评分
    private calculateOverallScore(scores: any): number {
        const weights = {
            codeQuality: 0.25,
            performance: 0.3,
            maintainability: 0.2,
            security: 0.15,
            bestPractices: 0.1
        };

        return Math.round(
            scores.codeQuality * weights.codeQuality +
            scores.performance * weights.performance +
            scores.maintainability * weights.maintainability +
            scores.security * weights.security +
            scores.bestPractices * weights.bestPractices
        );
    }

    // 🎨 生成完整质量报告
    generateQualityReport(report: CodeQualityReport): string {
        const { fileName, language, overallScore, scores, criticalIssues, recommendations, improvementRoadmap } = report;
        
        const reportContent = `
# 📋 代码质量综合报告 - ${fileName}

## 🎯 总体评分: ${overallScore}/100 ${this.getScoreEmoji(overallScore)}

### 📊 各维度评分
- **代码质量**: ${scores.codeQuality}/100 ${this.getScoreEmoji(scores.codeQuality)}
- **性能表现**: ${scores.performance}/100 ${this.getScoreEmoji(scores.performance)}
- **可维护性**: ${scores.maintainability}/100 ${this.getScoreEmoji(scores.maintainability)}
- **安全性**: ${scores.security}/100 ${this.getScoreEmoji(scores.security)}
- **最佳实践**: ${scores.bestPractices}/100 ${this.getScoreEmoji(scores.bestPractices)}

## 🚨 关键问题 (${criticalIssues.length}个)
${criticalIssues.slice(0, 5).map((issue, index) => `
### ${index + 1}. ${issue.title} (${issue.severity})
- **位置**: 第${issue.location.line}行
- **问题**: ${issue.description}
- **影响**: ${issue.impact}
- **解决方案**: ${issue.solution}
- **预估工作量**: ${issue.estimatedFixTime}小时 (${issue.effort}难度)
`).join('\n')}

## 💡 改进建议 (前8条)
${recommendations.slice(0, 8).map((rec, index) => `
### ${index + 1}. ${rec.title} (${rec.priority}优先级)
**类别**: ${rec.category}
**描述**: ${rec.description}
**收益**: ${rec.benefits.join(', ')}
**实施**: ${rec.implementation}
${rec.codeExample ? `
**代码示例**:
\`\`\`${language}
// 优化前
${rec.codeExample.before}

// 优化后  
${rec.codeExample.after}
\`\`\`
*${rec.codeExample.explanation}*
` : ''}
`).join('\n')}

## 🗺️ 改进路线图
${improvementRoadmap.map(plan => `
### ${this.getPhaseName(plan.phase)} (${plan.timeline})
**预期提升**: +${plan.expectedImpact}分
**任务数量**: ${plan.tasks.length}个

${plan.tasks.map((task, index) => `
${index + 1}. **${task.title}** (${task.effort}小时)
   - ${task.description}
   - 优先级: ${task.priority}/10
   ${task.dependencies.length > 0 ? `- 依赖: ${task.dependencies.join(', ')}` : ''}
`).join('\n')}
`).join('\n')}

## 📈 质量评估总结
${this.generateQualitySummary(overallScore, criticalIssues.length, recommendations.length)}

---
*报告生成时间: ${report.timestamp.toLocaleString()}*
*由综合代码质量检测器生成*
`;
        
        return reportContent;
    }

    // React特定建议
    private getReactSpecificRecommendations(): QualityRecommendation[] {
        return [
            {
                category: 'performance',
                priority: 'high',
                title: '实施React性能最佳实践',
                description: '使用React.memo、useMemo、useCallback优化组件性能',
                benefits: ['减少不必要的重渲染', '提高应用响应性', '改善用户体验'],
                implementation: '在适当的组件和计算中添加记忆化'
            },
            {
                category: 'testing',
                priority: 'medium',
                title: '添加React组件测试',
                description: '使用React Testing Library编写组件测试',
                benefits: ['提高代码稳定性', '便于重构', '文档化组件行为'],
                implementation: '为每个组件创建对应的测试文件'
            }
        ];
    }

    // Rust特定建议
    private getRustSpecificRecommendations(): QualityRecommendation[] {
        return [
            {
                category: 'security',
                priority: 'high',
                title: '改进Rust错误处理',
                description: '使用Result类型和?操作符替代unwrap()',
                benefits: ['避免panic', '更好的错误处理', '提高程序稳定性'],
                implementation: '重构所有unwrap()调用为适当的错误处理'
            },
            {
                category: 'performance',
                priority: 'medium',
                title: '优化Rust内存使用',
                description: '减少不必要的clone()，使用引用和智能指针',
                benefits: ['提高性能', '减少内存分配', '符合零成本抽象原则'],
                implementation: '审查所有clone()调用，使用借用或Rc/Arc替代'
            }
        ];
    }

    // 工具方法
    private mapSmellTypeToIssueType(smellType: string): 'security' | 'performance' | 'maintainability' | 'bugs' | 'code-smell' {
        switch (smellType) {
            case 'complexity': return 'maintainability';
            case 'structure': return 'code-smell';
            case 'naming': return 'maintainability';
            case 'duplication': return 'code-smell';
            default: return 'code-smell';
        }
    }

    private generatePerformanceSolution(bottleneck: any): string {
        switch (bottleneck.type) {
            case 'render': return '优化渲染逻辑，使用React.memo或useMemo';
            case 'memory': return '优化内存使用，减少对象创建';
            case 'algorithm': return '优化算法复杂度，使用更高效的数据结构';
            case 'io': return '使用异步I/O操作，避免阻塞';
            case 'concurrency': return '改进并发设计，使用适当的同步原语';
            default: return '需要进一步分析确定解决方案';
        }
    }

    private estimateEffort(type: string): 'low' | 'medium' | 'high' {
        switch (type) {
            case 'render':
            case 'memory': return 'medium';
            case 'algorithm': return 'high';
            case 'io': return 'medium';
            case 'concurrency': return 'high';
            default: return 'medium';
        }
    }

    private estimateFixTime(severity: string, type: string): number {
        const baseTimes = { critical: 8, high: 4, medium: 2, low: 1 };
        const typeMultipliers = { algorithm: 2, concurrency: 2, security: 1.5 };
        
        const baseTime = baseTimes[severity as keyof typeof baseTimes] || 2;
        const multiplier = typeMultipliers[type as keyof typeof typeMultipliers] || 1;
        
        return Math.round(baseTime * multiplier);
    }

    private mapSuggestionTypeToCategory(type: string): 'architecture' | 'performance' | 'security' | 'testing' | 'documentation' {
        switch (type) {
            case 'optimize': return 'performance';
            case 'refactor': return 'architecture';
            case 'enhance': return 'security';
            case 'modernize': return 'architecture';
            default: return 'architecture';
        }
    }

    private mapPriorityToLevel(priority: number): 'high' | 'medium' | 'low' {
        if (priority >= 8) return 'high';
        if (priority >= 5) return 'medium';
        return 'low';
    }

    private mapIssueTypeToTaskCategory(type: string): 'refactor' | 'optimize' | 'security' | 'testing' | 'documentation' {
        switch (type) {
            case 'performance': return 'optimize';
            case 'security': return 'security';
            case 'maintainability': return 'refactor';
            case 'bugs': return 'refactor';
            default: return 'refactor';
        }
    }

    private mapRecommendationCategoryToTaskCategory(category: string): 'refactor' | 'optimize' | 'security' | 'testing' | 'documentation' {
        switch (category) {
            case 'performance': return 'optimize';
            case 'security': return 'security';
            case 'testing': return 'testing';
            case 'documentation': return 'documentation';
            default: return 'refactor';
        }
    }

    private estimateRecommendationEffort(rec: QualityRecommendation): number {
        const categoryEfforts = {
            architecture: 8,
            performance: 4,
            security: 6,
            testing: 3,
            documentation: 2
        };
        
        const priorityMultipliers = { high: 1.5, medium: 1, low: 0.5 };
        
        const baseEffort = categoryEfforts[rec.category] || 4;
        const multiplier = priorityMultipliers[rec.priority] || 1;
        
        return Math.round(baseEffort * multiplier);
    }

    private getPhaseName(phase: string): string {
        switch (phase) {
            case 'immediate': return '🚨 立即处理';
            case 'short-term': return '⚡ 短期改进';
            case 'long-term': return '🎯 长期优化';
            default: return phase;
        }
    }

    private getScoreEmoji(score: number): string {
        if (score >= 90) return '🟢 优秀';
        if (score >= 80) return '🟡 良好';
        if (score >= 70) return '🟠 一般';
        if (score >= 60) return '🔴 需改进';
        return '⚫ 急需优化';
    }

    private generateQualitySummary(overallScore: number, issueCount: number, recommendationCount: number): string {
        let summary = '';
        
        if (overallScore >= 85) {
            summary = '🎉 代码质量优秀！继续保持良好的编码实践。';
        } else if (overallScore >= 70) {
            summary = '👍 代码质量良好，但仍有提升空间。';
        } else if (overallScore >= 55) {
            summary = '⚠️ 代码质量一般，建议优先处理关键问题。';
        } else {
            summary = '🔧 代码质量需要显著改进，请按照路线图逐步优化。';
        }
        
        summary += `\n\n当前发现 ${issueCount} 个关键问题，${recommendationCount} 条改进建议。`;
        summary += `建议按照改进路线图的阶段顺序进行优化，预期可提升 ${Math.min(40, issueCount * 3 + recommendationCount * 2)} 分。`;
        
        return summary;
    }
}

// 导出单例
export const comprehensiveCodeQualityDetector = new ComprehensiveCodeQualityDetector();
