/**
 * 高级代码质量分析器
 * 深度分析React和Rust代码质量，提供全面的改进建议
 */

import * as vscode from 'vscode';

export interface CodeQualityMetrics {
    maintainabilityIndex: number; // 0-100，可维护性指数
    cyclomaticComplexity: number; // 圈复杂度
    cognitiveComplexity: number; // 认知复杂度
    technicalDebt: {
        score: number; // 技术债务分数
        estimatedHours: number; // 预估修复时间（小时）
        categories: {
            [key: string]: {
                count: number;
                severity: 'low' | 'medium' | 'high' | 'critical';
                impact: number;
            };
        };
    };
    codeSmells: CodeSmell[];
    duplication: {
        percentage: number;
        duplicatedBlocks: DuplicatedBlock[];
    };
    testCoverage: {
        coverage: number;
        missingTests: string[];
        testQuality: number;
    };
}

export interface CodeSmell {
    id: string;
    type: 'long-method' | 'large-class' | 'duplicate-code' | 'complex-conditional' | 
          'dead-code' | 'god-object' | 'feature-envy' | 'shotgun-surgery' | 
          'inappropriate-intimacy' | 'refused-bequest';
    severity: 'info' | 'minor' | 'major' | 'critical';
    title: string;
    description: string;
    location: {
        file: string;
        startLine: number;
        endLine: number;
        startColumn: number;
        endColumn: number;
    };
    metrics: {
        [key: string]: number;
    };
    suggestions: QualityImprovement[];
    relatedSmells: string[];
}

export interface DuplicatedBlock {
    id: string;
    content: string;
    occurrences: Array<{
        file: string;
        startLine: number;
        endLine: number;
    }>;
    similarity: number; // 相似度百分比
    extractionSuggestion: string;
}

export interface QualityImprovement {
    id: string;
    type: 'refactor' | 'extract' | 'inline' | 'move' | 'rename' | 'split' | 'merge';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    effort: 'minimal' | 'low' | 'medium' | 'high' | 'major';
    impact: {
        maintainability: number;
        readability: number;
        performance: number;
        testability: number;
    };
    automatable: boolean;
    beforeCode: string;
    afterCode: string;
    steps: string[];
    risks: string[];
    benefits: string[];
}

export interface QualityReport {
    overallScore: number; // 0-100 总体质量分数
    metrics: CodeQualityMetrics;
    trends: {
        improvement: 'improving' | 'stable' | 'degrading';
        direction: number; // -100 到 100，负数表示变差
        timeframe: string;
    };
    recommendations: {
        quickWins: QualityImprovement[]; // 快速改进
        majorRefactoring: QualityImprovement[]; // 大型重构
        longTermGoals: QualityImprovement[]; // 长期目标
    };
    healthChecks: {
        architecture: number;
        testability: number;
        documentation: number;
        performance: number;
        security: number;
    };
}

export class AdvancedCodeQualityAnalyzer {
    private workspaceRoot: string;
    private qualityHistory: Map<string, QualityReport[]> = new Map();

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    async analyzeCodeQuality(code: string, filePath: string): Promise<QualityReport> {
        const language = this.detectLanguage(filePath);
        
        let metrics: CodeQualityMetrics;
        if (language === 'react') {
            metrics = await this.analyzeReactQuality(code, filePath);
        } else if (language === 'rust') {
            metrics = await this.analyzeRustQuality(code, filePath);
        } else {
            metrics = await this.analyzeGenericQuality(code, filePath);
        }

        const overallScore = this.calculateOverallScore(metrics);
        const trends = this.analyzeTrends(filePath, overallScore);
        const recommendations = this.generateRecommendations(metrics);
        const healthChecks = this.performHealthChecks(metrics, code);

        const report: QualityReport = {
            overallScore,
            metrics,
            trends,
            recommendations,
            healthChecks
        };

        // 保存历史记录
        this.updateQualityHistory(filePath, report);

        return report;
    }

    private async analyzeReactQuality(code: string, filePath: string): Promise<CodeQualityMetrics> {
        const complexity = this.calculateComplexity(code);
        const smells = await this.detectReactCodeSmells(code);
        const duplication = this.detectDuplication(code);
        const testCoverage = this.analyzeTestCoverage(code, filePath);

        return {
            maintainabilityIndex: this.calculateMaintainabilityIndex(complexity, smells.length),
            cyclomaticComplexity: complexity.cyclomatic,
            cognitiveComplexity: complexity.cognitive,
            technicalDebt: this.calculateTechnicalDebt(smells),
            codeSmells: smells,
            duplication,
            testCoverage
        };
    }

    private async analyzeRustQuality(code: string, filePath: string): Promise<CodeQualityMetrics> {
        const complexity = this.calculateRustComplexity(code);
        const smells = await this.detectRustCodeSmells(code);
        const duplication = this.detectDuplication(code);
        const testCoverage = this.analyzeRustTestCoverage(code, filePath);

        return {
            maintainabilityIndex: this.calculateMaintainabilityIndex(complexity, smells.length),
            cyclomaticComplexity: complexity.cyclomatic,
            cognitiveComplexity: complexity.cognitive,
            technicalDebt: this.calculateTechnicalDebt(smells),
            codeSmells: smells,
            duplication,
            testCoverage
        };
    }

    private async analyzeGenericQuality(code: string, filePath: string): Promise<CodeQualityMetrics> {
        const complexity = this.calculateComplexity(code);
        const smells = await this.detectGenericCodeSmells(code);
        const duplication = this.detectDuplication(code);
        const testCoverage = { coverage: 0, missingTests: [], testQuality: 0 };

        return {
            maintainabilityIndex: this.calculateMaintainabilityIndex(complexity, smells.length),
            cyclomaticComplexity: complexity.cyclomatic,
            cognitiveComplexity: complexity.cognitive,
            technicalDebt: this.calculateTechnicalDebt(smells),
            codeSmells: smells,
            duplication,
            testCoverage
        };
    }

    private async detectReactCodeSmells(code: string): Promise<CodeSmell[]> {
        const smells: CodeSmell[] = [];

        // 检测大型组件
        const largeComponents = this.findLargeComponents(code);
        for (const component of largeComponents) {
            smells.push({
                id: `large-component-${component.name}`,
                type: 'large-class',
                severity: component.lines > 200 ? 'critical' : 'major',
                title: `大型组件: ${component.name}`,
                description: `组件 ${component.name} 包含 ${component.lines} 行代码，超过了建议的最大值`,
                location: {
                    file: 'current',
                    startLine: component.startLine,
                    endLine: component.endLine,
                    startColumn: 0,
                    endColumn: 0
                },
                metrics: {
                    lines: component.lines,
                    complexity: component.complexity
                },
                suggestions: [
                    {
                        id: `split-${component.name}`,
                        type: 'split',
                        priority: 'high',
                        title: `拆分 ${component.name} 组件`,
                        description: '将大型组件拆分为多个较小的子组件',
                        effort: 'medium',
                        impact: {
                            maintainability: 40,
                            readability: 35,
                            performance: 10,
                            testability: 30
                        },
                        automatable: false,
                        beforeCode: `// 大型组件示例\nconst ${component.name} = () => {\n  // 200+ 行代码\n};`,
                        afterCode: `// 拆分后的组件\nconst ${component.name} = () => {\n  return (\n    <div>\n      <${component.name}Header />\n      <${component.name}Content />\n      <${component.name}Footer />\n    </div>\n  );\n};`,
                        steps: [
                            '识别组件的不同职责区域',
                            '提取独立的子组件',
                            '定义清晰的props接口',
                            '更新测试用例'
                        ],
                        risks: [
                            '可能增加props传递的复杂性',
                            '需要重新组织状态管理'
                        ],
                        benefits: [
                            '提高代码可维护性',
                            '增强组件复用性',
                            '简化测试'
                        ]
                    }
                ],
                relatedSmells: []
            });
        }

        // 检测复杂的条件语句
        const complexConditionals = this.findComplexConditionals(code);
        for (const conditional of complexConditionals) {
            smells.push({
                id: `complex-conditional-${conditional.line}`,
                type: 'complex-conditional',
                severity: 'major',
                title: '复杂条件语句',
                description: `第 ${conditional.line} 行的条件语句过于复杂`,
                location: {
                    file: 'current',
                    startLine: conditional.line,
                    endLine: conditional.line,
                    startColumn: 0,
                    endColumn: 0
                },
                metrics: {
                    complexity: conditional.complexity
                },
                suggestions: [
                    {
                        id: `extract-predicate-${conditional.line}`,
                        type: 'extract',
                        priority: 'medium',
                        title: '提取谓词函数',
                        description: '将复杂条件提取为独立的谓词函数',
                        effort: 'low',
                        impact: {
                            maintainability: 25,
                            readability: 40,
                            performance: 0,
                            testability: 30
                        },
                        automatable: true,
                        beforeCode: conditional.code,
                        afterCode: `// 提取的谓词函数\nconst isValidCondition = (data) => {\n  return /* 复杂条件逻辑 */;\n};\n\n// 简化后的使用\nif (isValidCondition(data)) {\n  // 处理逻辑\n}`,
                        steps: [
                            '识别条件逻辑的语义',
                            '创建描述性的函数名',
                            '提取条件到独立函数',
                            '添加单元测试'
                        ],
                        risks: ['可能过度抽象'],
                        benefits: ['提高代码可读性', '便于单独测试条件逻辑']
                    }
                ],
                relatedSmells: []
            });
        }

        // 检测重复的useEffect逻辑
        const duplicateEffects = this.findDuplicateEffects(code);
        if (duplicateEffects.length > 0) {
            smells.push({
                id: 'duplicate-effects',
                type: 'duplicate-code',
                severity: 'major',
                title: '重复的useEffect逻辑',
                description: '检测到重复的副作用逻辑，建议提取为自定义Hook',
                location: {
                    file: 'current',
                    startLine: duplicateEffects[0].line,
                    endLine: duplicateEffects[duplicateEffects.length - 1].line,
                    startColumn: 0,
                    endColumn: 0
                },
                metrics: {
                    duplicateCount: duplicateEffects.length
                },
                suggestions: [
                    {
                        id: 'extract-custom-hook',
                        type: 'extract',
                        priority: 'high',
                        title: '提取自定义Hook',
                        description: '将重复的副作用逻辑提取为可复用的自定义Hook',
                        effort: 'medium',
                        impact: {
                            maintainability: 35,
                            readability: 25,
                            performance: 5,
                            testability: 40
                        },
                        automatable: false,
                        beforeCode: '// 重复的useEffect逻辑',
                        afterCode: '// 提取的自定义Hook\nconst useCommonEffect = () => {\n  // 复用的副作用逻辑\n};',
                        steps: [
                            '分析重复的副作用模式',
                            '设计Hook的接口',
                            '提取通用逻辑',
                            '更新使用方代码'
                        ],
                        risks: ['可能增加抽象复杂度'],
                        benefits: ['提高代码复用性', '集中管理副作用逻辑']
                    }
                ],
                relatedSmells: []
            });
        }

        return smells;
    }

    private async detectRustCodeSmells(code: string): Promise<CodeSmell[]> {
        const smells: CodeSmell[] = [];

        // 检测长函数
        const longFunctions = this.findLongRustFunctions(code);
        for (const func of longFunctions) {
            smells.push({
                id: `long-function-${func.name}`,
                type: 'long-method',
                severity: func.lines > 100 ? 'critical' : 'major',
                title: `长函数: ${func.name}`,
                description: `函数 ${func.name} 包含 ${func.lines} 行代码`,
                location: {
                    file: 'current',
                    startLine: func.startLine,
                    endLine: func.endLine,
                    startColumn: 0,
                    endColumn: 0
                },
                metrics: {
                    lines: func.lines,
                    complexity: func.complexity
                },
                suggestions: [
                    {
                        id: `split-function-${func.name}`,
                        type: 'split',
                        priority: 'high',
                        title: `拆分 ${func.name} 函数`,
                        description: '将长函数拆分为多个专职的小函数',
                        effort: 'medium',
                        impact: {
                            maintainability: 40,
                            readability: 35,
                            performance: 5,
                            testability: 35
                        },
                        automatable: false,
                        beforeCode: `fn ${func.name}() {\n    // 100+ 行代码\n}`,
                        afterCode: `fn ${func.name}() {\n    step1();\n    step2();\n    step3();\n}\n\nfn step1() { /* 专职逻辑1 */ }\nfn step2() { /* 专职逻辑2 */ }\nfn step3() { /* 专职逻辑3 */ }`,
                        steps: [
                            '识别函数的不同职责',
                            '提取独立的子函数',
                            '保持函数签名的兼容性',
                            '更新测试用例'
                        ],
                        risks: ['可能增加函数调用开销'],
                        benefits: ['提高代码可维护性', '增强函数复用性', '简化测试']
                    }
                ],
                relatedSmells: []
            });
        }

        // 检测过多的clone操作
        const cloneCount = (code.match(/\.clone\(\)/g) || []).length;
        if (cloneCount > 10) {
            smells.push({
                id: 'excessive-cloning',
                type: 'feature-envy',
                severity: 'major',
                title: '过多的克隆操作',
                description: `检测到 ${cloneCount} 个clone()调用，可能影响性能`,
                location: {
                    file: 'current',
                    startLine: 1,
                    endLine: code.split('\n').length,
                    startColumn: 0,
                    endColumn: 0
                },
                metrics: {
                    cloneCount
                },
                suggestions: [
                    {
                        id: 'optimize-ownership',
                        type: 'refactor',
                        priority: 'high',
                        title: '优化所有权设计',
                        description: '重新设计数据结构和函数签名以减少不必要的克隆',
                        effort: 'high',
                        impact: {
                            maintainability: 30,
                            readability: 20,
                            performance: 50,
                            testability: 10
                        },
                        automatable: false,
                        beforeCode: '// 包含大量clone的代码',
                        afterCode: '// 优化所有权后的代码',
                        steps: [
                            '分析数据流和所有权传递',
                            '识别不必要的克隆操作',
                            '重新设计函数接口',
                            '使用引用或Cow类型'
                        ],
                        risks: ['可能需要大量API更改'],
                        benefits: ['显著提升性能', '减少内存使用', '符合Rust最佳实践']
                    }
                ],
                relatedSmells: []
            });
        }

        // 检测unsafe代码块
        const unsafeBlocks = (code.match(/unsafe\s*\{/g) || []).length;
        if (unsafeBlocks > 0) {
            smells.push({
                id: 'unsafe-code',
                type: 'inappropriate-intimacy',
                severity: 'critical',
                title: 'Unsafe代码块',
                description: `检测到 ${unsafeBlocks} 个unsafe代码块，需要仔细审查`,
                location: {
                    file: 'current',
                    startLine: 1,
                    endLine: code.split('\n').length,
                    startColumn: 0,
                    endColumn: 0
                },
                metrics: {
                    unsafeBlocks
                },
                suggestions: [
                    {
                        id: 'review-unsafe',
                        type: 'refactor',
                        priority: 'critical',
                        title: '审查unsafe代码',
                        description: '仔细审查unsafe代码的安全性，考虑安全替代方案',
                        effort: 'high',
                        impact: {
                            maintainability: 20,
                            readability: 15,
                            performance: 0,
                            testability: 10
                        },
                        automatable: false,
                        beforeCode: 'unsafe { /* 不安全操作 */ }',
                        afterCode: '// 安全的替代实现',
                        steps: [
                            '验证unsafe操作的必要性',
                            '添加详细的安全性注释',
                            '考虑使用安全的替代方案',
                            '增加边界检查和测试'
                        ],
                        risks: ['性能可能下降'],
                        benefits: ['提高内存安全性', '减少潜在的安全漏洞']
                    }
                ],
                relatedSmells: []
            });
        }

        return smells;
    }

    private async detectGenericCodeSmells(code: string): Promise<CodeSmell[]> {
        const smells: CodeSmell[] = [];

        // 检测长行
        const longLines = this.findLongLines(code);
        if (longLines.length > 0) {
            smells.push({
                id: 'long-lines',
                type: 'long-method',
                severity: 'minor',
                title: '过长的代码行',
                description: `检测到 ${longLines.length} 行超过120字符的代码`,
                location: {
                    file: 'current',
                    startLine: longLines[0],
                    endLine: longLines[longLines.length - 1],
                    startColumn: 0,
                    endColumn: 0
                },
                metrics: {
                    longLineCount: longLines.length
                },
                suggestions: [
                    {
                        id: 'break-long-lines',
                        type: 'refactor',
                        priority: 'low',
                        title: '分解长行',
                        description: '将长行分解为多行以提高可读性',
                        effort: 'minimal',
                        impact: {
                            maintainability: 10,
                            readability: 25,
                            performance: 0,
                            testability: 0
                        },
                        automatable: true,
                        beforeCode: '// 很长的一行代码',
                        afterCode: '// 分解为多行的代码',
                        steps: ['识别合适的断行点', '保持语义完整性'],
                        risks: [],
                        benefits: ['提高代码可读性']
                    }
                ],
                relatedSmells: []
            });
        }

        return smells;
    }

    // 辅助方法实现
    private calculateComplexity(code: string) {
        const cyclomaticKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', '&&', '||', '?', 'catch'];
        const cognitiveKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'break', 'continue'];
        
        let cyclomatic = 1; // 基础复杂度
        let cognitive = 0;
        let nestingLevel = 0;

        const lines = code.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 计算圈复杂度
            for (const keyword of cyclomaticKeywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                const matches = trimmedLine.match(regex);
                if (matches) {
                    cyclomatic += matches.length;
                }
            }

            // 计算认知复杂度（简化版）
            if (trimmedLine.includes('{')) nestingLevel++;
            if (trimmedLine.includes('}')) nestingLevel = Math.max(0, nestingLevel - 1);

            for (const keyword of cognitiveKeywords) {
                if (trimmedLine.includes(keyword)) {
                    cognitive += 1 + nestingLevel;
                }
            }
        }

        return { cyclomatic, cognitive };
    }

    private calculateRustComplexity(code: string) {
        const rustKeywords = ['if', 'else', 'for', 'while', 'loop', 'match', '&&', '||', '?'];
        let cyclomatic = 1;
        let cognitive = 0;
        let nestingLevel = 0;

        const lines = code.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('{')) nestingLevel++;
            if (trimmedLine.includes('}')) nestingLevel = Math.max(0, nestingLevel - 1);

            for (const keyword of rustKeywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                const matches = trimmedLine.match(regex);
                if (matches) {
                    cyclomatic += matches.length;
                    cognitive += matches.length * (1 + nestingLevel);
                }
            }

            // 特殊处理match表达式的分支
            if (trimmedLine.includes('=>')) {
                cyclomatic += 1;
                cognitive += 1 + nestingLevel;
            }
        }

        return { cyclomatic, cognitive };
    }

    private calculateMaintainabilityIndex(complexity: any, smellCount: number): number {
        const baseScore = 100;
        const complexityPenalty = complexity.cyclomatic * 2 + complexity.cognitive;
        const smellPenalty = smellCount * 5;
        
        return Math.max(0, baseScore - complexityPenalty - smellPenalty);
    }

    private calculateTechnicalDebt(smells: CodeSmell[]) {
        const categories: { [key: string]: any } = {};
        let totalScore = 0;
        let totalHours = 0;

        for (const smell of smells) {
            const category = smell.type;
            if (!categories[category]) {
                categories[category] = { count: 0, severity: 'low', impact: 0 };
            }

            categories[category].count++;
            
            // 估算修复时间
            const severityHours = {
                'info': 0.5,
                'minor': 1,
                'major': 4,
                'critical': 8
            };

            const hours = severityHours[smell.severity] || 1;
            totalHours += hours;
            
            const severityScore = {
                'info': 1,
                'minor': 3,
                'major': 7,
                'critical': 15
            };

            totalScore += severityScore[smell.severity] || 1;
            categories[category].impact += severityScore[smell.severity] || 1;
            
            if (smell.severity === 'critical' || 
                (smell.severity === 'major' && categories[category].severity !== 'critical')) {
                categories[category].severity = smell.severity;
            }
        }

        return {
            score: totalScore,
            estimatedHours: totalHours,
            categories
        };
    }

    private detectDuplication(code: string) {
        // 简化的重复检测
        const lines = code.split('\n');
        const duplicatedBlocks: DuplicatedBlock[] = [];
        const lineMap: { [key: string]: number[] } = {};

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.length > 10 && !trimmedLine.startsWith('//')) {
                if (!lineMap[trimmedLine]) {
                    lineMap[trimmedLine] = [];
                }
                lineMap[trimmedLine].push(index + 1);
            }
        });

        let duplicatedLines = 0;
        Object.entries(lineMap).forEach(([line, occurrences]) => {
            if (occurrences.length > 1) {
                duplicatedLines += occurrences.length;
                duplicatedBlocks.push({
                    id: `duplicate-${occurrences[0]}`,
                    content: line,
                    occurrences: occurrences.map(lineNum => ({
                        file: 'current',
                        startLine: lineNum,
                        endLine: lineNum
                    })),
                    similarity: 100,
                    extractionSuggestion: '考虑提取为函数或常量'
                });
            }
        });

        const percentage = lines.length > 0 ? (duplicatedLines / lines.length) * 100 : 0;

        return {
            percentage,
            duplicatedBlocks
        };
    }

    private analyzeTestCoverage(code: string, filePath: string) {
        const hasTests = code.includes('test(') || code.includes('it(') || code.includes('describe(');
        const testCount = (code.match(/(?:test|it)\s*\(/g) || []).length;
        const functionCount = (code.match(/(?:function|const|class)\s+\w+/g) || []).length;
        
        const coverage = functionCount > 0 ? Math.min(100, (testCount / functionCount) * 100) : 0;
        const missingTests = functionCount > testCount ? 
            [`需要为 ${functionCount - testCount} 个函数/组件添加测试`] : [];

        return {
            coverage,
            missingTests,
            testQuality: hasTests ? Math.min(100, testCount * 10) : 0
        };
    }

    private analyzeRustTestCoverage(code: string, filePath: string) {
        const hasTests = code.includes('#[test]') || code.includes('#[cfg(test)]');
        const testCount = (code.match(/#\[test\]/g) || []).length;
        const functionCount = (code.match(/fn\s+\w+/g) || []).length;
        
        const coverage = functionCount > 0 ? Math.min(100, (testCount / functionCount) * 100) : 0;
        const missingTests = functionCount > testCount ? 
            [`需要为 ${functionCount - testCount} 个函数添加测试`] : [];

        return {
            coverage,
            missingTests,
            testQuality: hasTests ? Math.min(100, testCount * 15) : 0
        };
    }

    private calculateOverallScore(metrics: CodeQualityMetrics): number {
        const weights = {
            maintainability: 0.3,
            complexity: 0.2,
            technicalDebt: 0.25,
            duplication: 0.15,
            testCoverage: 0.1
        };

        const maintainabilityScore = metrics.maintainabilityIndex;
        const complexityScore = Math.max(0, 100 - metrics.cyclomaticComplexity * 2 - metrics.cognitiveComplexity);
        const technicalDebtScore = Math.max(0, 100 - metrics.technicalDebt.score);
        const duplicationScore = Math.max(0, 100 - metrics.duplication.percentage * 2);
        const testCoverageScore = metrics.testCoverage.coverage;

        return Math.round(
            maintainabilityScore * weights.maintainability +
            complexityScore * weights.complexity +
            technicalDebtScore * weights.technicalDebt +
            duplicationScore * weights.duplication +
            testCoverageScore * weights.testCoverage
        );
    }

    private analyzeTrends(filePath: string, currentScore: number): { improvement: 'improving' | 'stable' | 'degrading'; direction: number; timeframe: string } {
        const history = this.qualityHistory.get(filePath) || [];
        
        if (history.length < 2) {
            return {
                improvement: 'stable' as const,
                direction: 0,
                timeframe: 'insufficient data'
            };
        }

        const recentScores = history.slice(-5).map(h => h.overallScore);
        const avgRecentScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
        const olderScores = history.slice(-10, -5).map(h => h.overallScore);
        const avgOlderScore = olderScores.length > 0 ? 
            olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length : avgRecentScore;

        const direction = avgRecentScore - avgOlderScore;
        const improvement: 'improving' | 'stable' | 'degrading' = direction > 5 ? 'improving' : 
                          direction < -5 ? 'degrading' : 'stable';

        return {
            improvement,
            direction: Math.round(direction),
            timeframe: `based on last ${history.length} analyses`
        };
    }

    private generateRecommendations(metrics: CodeQualityMetrics) {
        const allSuggestions = metrics.codeSmells.flatMap(smell => smell.suggestions);
        
        return {
            quickWins: allSuggestions
                .filter(s => s.effort === 'minimal' || s.effort === 'low')
                .sort((a, b) => b.impact.maintainability - a.impact.maintainability)
                .slice(0, 5),
            majorRefactoring: allSuggestions
                .filter(s => s.effort === 'medium' || s.effort === 'high')
                .filter(s => s.priority === 'high' || s.priority === 'critical')
                .slice(0, 3),
            longTermGoals: allSuggestions
                .filter(s => s.effort === 'major')
                .sort((a, b) => {
                    const aTotal = a.impact.maintainability + a.impact.readability + 
                                  a.impact.performance + a.impact.testability;
                    const bTotal = b.impact.maintainability + b.impact.readability + 
                                  b.impact.performance + b.impact.testability;
                    return bTotal - aTotal;
                })
                .slice(0, 3)
        };
    }

    private performHealthChecks(metrics: CodeQualityMetrics, code: string) {
        return {
            architecture: Math.max(0, 100 - metrics.codeSmells.filter(s => 
                s.type === 'large-class' || s.type === 'god-object').length * 20),
            testability: metrics.testCoverage.coverage,
            documentation: this.calculateDocumentationScore(code),
            performance: Math.max(0, 100 - metrics.codeSmells.filter(s => 
                s.type === 'duplicate-code' || s.type === 'complex-conditional').length * 15),
            security: Math.max(0, 100 - metrics.codeSmells.filter(s => 
                s.type === 'inappropriate-intimacy').length * 30)
        };
    }

    private calculateDocumentationScore(code: string): number {
        const commentLines = (code.match(/^\s*\/\/|^\s*\/\*|\s*\*|^\s*#/gm) || []).length;
        const codeLines = code.split('\n').filter(line => line.trim() && 
            !line.trim().startsWith('//') && !line.trim().startsWith('/*')).length;
        
        if (codeLines === 0) return 0;
        const ratio = commentLines / codeLines;
        return Math.min(100, ratio * 200); // 目标是20%的注释率
    }

    private updateQualityHistory(filePath: string, report: QualityReport) {
        const history = this.qualityHistory.get(filePath) || [];
        history.push(report);
        
        // 保留最近20次分析结果
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
        
        this.qualityHistory.set(filePath, history);
    }

    // 具体的代码检测方法
    private findLargeComponents(code: string) {
        const components = [];
        const componentRegex = /(?:function|const|class)\s+([A-Z]\w*)[\s\S]*?(?=\n(?:function|const|class|export)|$)/g;
        let match;

        while ((match = componentRegex.exec(code)) !== null) {
            const componentCode = match[0];
            const lines = componentCode.split('\n').length;
            const startLine = code.substring(0, match.index).split('\n').length;

            if (lines > 50) {
                components.push({
                    name: match[1],
                    lines,
                    startLine,
                    endLine: startLine + lines - 1,
                    complexity: this.calculateComplexity(componentCode).cyclomatic
                });
            }
        }

        return components;
    }

    private findComplexConditionals(code: string): Array<{line: number; code: string; complexity: number}> {
        const conditionals: Array<{line: number; code: string; complexity: number}> = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            const logicalOperators = (trimmedLine.match(/&&|\|\|/g) || []).length;
            const conditionalKeywords = (trimmedLine.match(/if|else if|while/g) || []).length;

            if ((logicalOperators > 2 || conditionalKeywords > 0) && logicalOperators > 1) {
                conditionals.push({
                    line: index + 1,
                    code: trimmedLine,
                    complexity: logicalOperators + conditionalKeywords
                });
            }
        });

        return conditionals;
    }

    private findDuplicateEffects(code: string) {
        const effects = [];
        const effectRegex = /useEffect\s*\([^}]+\}/g;
        let match;

        while ((match = effectRegex.exec(code)) !== null) {
            const startLine = code.substring(0, match.index).split('\n').length;
            effects.push({
                line: startLine,
                code: match[0]
            });
        }

        // 简化的重复检测：如果有3个以上的useEffect，认为可能有重复
        return effects.length > 3 ? effects : [];
    }

    private findLongRustFunctions(code: string) {
        const functions = [];
        const functionRegex = /fn\s+(\w+)[^{]*\{[\s\S]*?(?=\nfn|\n}\s*$|$)/g;
        let match;

        while ((match = functionRegex.exec(code)) !== null) {
            const functionCode = match[0];
            const lines = functionCode.split('\n').length;
            const startLine = code.substring(0, match.index).split('\n').length;

            if (lines > 30) {
                functions.push({
                    name: match[1],
                    lines,
                    startLine,
                    endLine: startLine + lines - 1,
                    complexity: this.calculateRustComplexity(functionCode).cyclomatic
                });
            }
        }

        return functions;
    }

    private findLongLines(code: string): number[] {
        const lines = code.split('\n');
        const longLines: number[] = [];

        lines.forEach((line, index) => {
            if (line.length > 120) {
                longLines.push(index + 1);
            }
        });

        return longLines;
    }

    private detectLanguage(filePath: string): 'react' | 'rust' | 'generic' {
        if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
            return 'react';
        } else if (filePath.endsWith('.rs')) {
            return 'rust';
        }
        return 'generic';
    }
}
