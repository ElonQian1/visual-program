// 🔥 项目功能诊断系统
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface FeatureDiagnosticResult {
    projectName: string;
    overallHealth: number;
    featureCompleteness: FeatureCompletenessReport;
    gaps: FeatureGap[];
    recommendations: ProjectRecommendation[];
    roadmap: DevelopmentRoadmap;
}

export interface FeatureCompletenessReport {
    coreFeatures: FeatureStatus[];
    advancedFeatures: FeatureStatus[];
    integrationFeatures: FeatureStatus[];
    uiExperience: FeatureStatus[];
    completenessScore: number;
}

export interface FeatureStatus {
    name: string;
    category: 'core' | 'advanced' | 'integration' | 'ui';
    status: 'complete' | 'partial' | 'missing' | 'planned';
    priority: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    implementationFiles?: string[];
    dependencies?: string[];
    estimatedEffort?: string;
}

export interface FeatureGap {
    feature: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    suggestedSolution: string;
    requiredFiles: string[];
    estimatedTime: string;
}

export interface ProjectRecommendation {
    type: 'feature' | 'architecture' | 'performance' | 'ux' | 'security';
    priority: 'immediate' | 'short-term' | 'long-term';
    title: string;
    description: string;
    benefits: string[];
    implementation: string[];
}

export interface DevelopmentRoadmap {
    phase1: {
        name: string;
        duration: string;
        features: string[];
        goals: string[];
    };
    phase2: {
        name: string;
        duration: string;
        features: string[];
        goals: string[];
    };
    phase3: {
        name: string;
        duration: string;
        features: string[];
        goals: string[];
    };
}

export class ProjectFeatureDiagnostics {
    private workspaceRoot: string;
    private packageJson: any;
    private readmeContent: string = '';

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    // 🔥 运行完整的项目诊断
    public async runDiagnostics(): Promise<FeatureDiagnosticResult> {
        console.log('🔍 开始项目功能诊断...');

        // 1. 读取项目基础信息
        await this.loadProjectInfo();

        // 2. 分析文件结构
        const fileStructure = await this.analyzeFileStructure();

        // 3. 评估功能完整性
        const featureCompleteness = await this.evaluateFeatureCompleteness(fileStructure);

        // 4. 识别功能缺口
        const gaps = await this.identifyFeatureGaps(featureCompleteness);

        // 5. 生成优化建议
        const recommendations = await this.generateRecommendations(gaps, featureCompleteness);

        // 6. 制定发展路线图
        const roadmap = await this.createDevelopmentRoadmap(gaps, recommendations);

        // 7. 计算整体健康度
        const overallHealth = this.calculateOverallHealth(featureCompleteness, gaps);

        return {
            projectName: this.packageJson?.displayName || this.packageJson?.name || 'Visual Programming VSCode',
            overallHealth,
            featureCompleteness,
            gaps,
            recommendations,
            roadmap
        };
    }

    // 🔥 加载项目信息
    private async loadProjectInfo(): Promise<void> {
        try {
            const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const content = fs.readFileSync(packageJsonPath, 'utf-8');
                this.packageJson = JSON.parse(content);
            }

            const readmePath = path.join(this.workspaceRoot, 'README.md');
            if (fs.existsSync(readmePath)) {
                this.readmeContent = fs.readFileSync(readmePath, 'utf-8');
            }
        } catch (error) {
            console.error('读取项目信息失败:', error);
        }
    }

    // 🔥 分析文件结构
    private async analyzeFileStructure(): Promise<{[key: string]: string[]}> {
        const structure: {[key: string]: string[]} = {
            analyzers: [],
            providers: [],
            engines: [],
            interfaces: [],
            configs: [],
            demos: [],
            tests: []
        };

        try {
            const srcPath = path.join(this.workspaceRoot, 'src');
            if (fs.existsSync(srcPath)) {
                const files = fs.readdirSync(srcPath);
                
                for (const file of files) {
                    if (file.endsWith('.ts')) {
                        if (file.includes('Analyzer')) structure.analyzers.push(file);
                        else if (file.includes('Provider')) structure.providers.push(file);
                        else if (file.includes('Engine')) structure.engines.push(file);
                        else structure.interfaces.push(file);
                    }
                }
            }

            const demoPath = path.join(this.workspaceRoot, 'demo');
            if (fs.existsSync(demoPath)) {
                structure.demos = fs.readdirSync(demoPath).filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.rs'));
            }

        } catch (error) {
            console.error('分析文件结构失败:', error);
        }

        return structure;
    }

    // 🔥 评估功能完整性
    private async evaluateFeatureCompleteness(fileStructure: {[key: string]: string[]}): Promise<FeatureCompletenessReport> {
        const coreFeatures: FeatureStatus[] = [
            {
                name: '代码结构分析',
                category: 'core',
                status: fileStructure.analyzers.some(f => f.includes('codeAnalyzer')) ? 'complete' : 'missing',
                priority: 'critical',
                description: '分析代码结构，提取函数、类、模块等信息',
                implementationFiles: ['codeAnalyzer.ts']
            },
            {
                name: 'React代码分析',
                category: 'core',
                status: fileStructure.analyzers.some(f => f.includes('reactAnalyzer')) ? 'complete' : 'missing',
                priority: 'high',
                description: '分析React组件、Hook、JSX结构',
                implementationFiles: ['reactAnalyzer.ts', 'advancedReactAnalyzer.ts']
            },
            {
                name: 'Rust代码分析',
                category: 'core',
                status: fileStructure.analyzers.some(f => f.includes('rustAnalyzer')) ? 'complete' : 'missing',
                priority: 'high',
                description: '分析Rust模块、函数、所有权模式',
                implementationFiles: ['rustAnalyzer.ts', 'advancedRustAnalyzer.ts']
            },
            {
                name: '可视化面板',
                category: 'core',
                status: fileStructure.providers.some(f => f.includes('visualPanel')) ? 'complete' : 'missing',
                priority: 'critical',
                description: '提供代码可视化界面',
                implementationFiles: ['visualPanelProvider.ts']
            }
        ];

        const advancedFeatures: FeatureStatus[] = [
            {
                name: '交互式画布',
                category: 'advanced',
                status: fileStructure.providers.some(f => f.includes('interactiveCanvas')) ? 'complete' : 'missing',
                priority: 'high',
                description: '支持拖拽、连线的交互式代码图表',
                implementationFiles: ['interactiveCanvasProvider.ts']
            },
            {
                name: '智能代码生成',
                category: 'advanced',
                status: fileStructure.engines.some(f => f.includes('codeGeneration')) ? 'complete' : 'missing',
                priority: 'high',
                description: '基于可视化图表生成代码',
                implementationFiles: ['codeGenerationEngine.ts']
            },
            {
                name: 'AI增强分析',
                category: 'advanced',
                status: fileStructure.engines.some(f => f.includes('aiEnhanced')) ? 'complete' : 'missing',
                priority: 'medium',
                description: 'AI驱动的代码分析和建议',
                implementationFiles: ['aiEnhancedAnalysisEngine.ts']
            },
            {
                name: '实时协作',
                category: 'advanced',
                status: fileStructure.providers.some(f => f.includes('realTimeCollaboration') || f.includes('enhancedRealTime')) ? 'complete' : 'missing',
                priority: 'medium',
                description: '多用户实时协作编辑',
                implementationFiles: ['realTimeCollaborationProvider.ts', 'enhancedRealTimeCollaboration.ts']
            }
        ];

        const integrationFeatures: FeatureStatus[] = [
            {
                name: 'VS Code扩展集成',
                category: 'integration',
                status: fs.existsSync(path.join(this.workspaceRoot, 'src', 'extension.ts')) ? 'complete' : 'missing',
                priority: 'critical',
                description: '完整的VS Code扩展功能',
                implementationFiles: ['extension.ts']
            },
            {
                name: '项目模板系统',
                category: 'integration',
                status: fileStructure.interfaces.some(f => f.includes('template')) ? 'complete' : 'missing',
                priority: 'medium',
                description: '提供项目和组件模板',
                implementationFiles: ['intelligentTemplateSystem.ts']
            },
            {
                name: '性能监控',
                category: 'integration',
                status: fileStructure.analyzers.some(f => f.includes('Performance')) ? 'partial' : 'missing',
                priority: 'medium',
                description: '监控和分析性能指标',
                implementationFiles: ['rustPerformanceAnalyzer.ts', 'reactPerformanceAnalyzer.ts']
            }
        ];

        const uiExperience: FeatureStatus[] = [
            {
                name: '统一工作台',
                category: 'ui',
                status: fileStructure.providers.some(f => f.includes('unifiedVisualization')) ? 'complete' : 'missing',
                priority: 'high',
                description: '集成所有功能的统一界面',
                implementationFiles: ['unifiedVisualizationProvider.ts']
            },
            {
                name: '响应式UI设计',
                category: 'ui',
                status: 'partial',
                priority: 'medium',
                description: '适配不同屏幕尺寸的UI',
                estimatedEffort: '1-2周'
            },
            {
                name: '主题支持',
                category: 'ui',
                status: 'partial',
                priority: 'low',
                description: '支持多种视觉主题',
                estimatedEffort: '3-5天'
            }
        ];

        // 计算完整性评分
        const allFeatures = [...coreFeatures, ...advancedFeatures, ...integrationFeatures, ...uiExperience];
        const completeCount = allFeatures.filter(f => f.status === 'complete').length;
        const partialCount = allFeatures.filter(f => f.status === 'partial').length;
        const completenessScore = Math.round(((completeCount + partialCount * 0.5) / allFeatures.length) * 100);

        return {
            coreFeatures,
            advancedFeatures,
            integrationFeatures,
            uiExperience,
            completenessScore
        };
    }

    // 🔥 识别功能缺口
    private async identifyFeatureGaps(completeness: FeatureCompletenessReport): Promise<FeatureGap[]> {
        const gaps: FeatureGap[] = [];

        const allFeatures = [
            ...completeness.coreFeatures,
            ...completeness.advancedFeatures,
            ...completeness.integrationFeatures,
            ...completeness.uiExperience
        ];

        for (const feature of allFeatures) {
            if (feature.status === 'missing') {
                gaps.push({
                    feature: feature.name,
                    impact: this.mapPriorityToImpact(feature.priority),
                    description: `缺少${feature.description}功能`,
                    suggestedSolution: this.getSuggestedSolution(feature),
                    requiredFiles: feature.implementationFiles || [],
                    estimatedTime: feature.estimatedEffort || this.estimateImplementationTime(feature)
                });
            } else if (feature.status === 'partial') {
                gaps.push({
                    feature: feature.name,
                    impact: 'medium',
                    description: `${feature.description}功能需要完善`,
                    suggestedSolution: `完善现有的${feature.name}实现`,
                    requiredFiles: feature.implementationFiles || [],
                    estimatedTime: '3-7天'
                });
            }
        }

        return gaps;
    }

    // 🔥 生成优化建议
    private async generateRecommendations(gaps: FeatureGap[], completeness: FeatureCompletenessReport): Promise<ProjectRecommendation[]> {
        const recommendations: ProjectRecommendation[] = [];

        // 基于完整性评分生成建议
        if (completeness.completenessScore < 60) {
            recommendations.push({
                type: 'feature',
                priority: 'immediate',
                title: '补齐核心功能',
                description: '当前功能完整性较低，需要优先完成核心功能模块',
                benefits: ['提高产品可用性', '建立完整功能基础', '提升用户体验'],
                implementation: ['专注于core类别功能', '建立完整的分析和可视化流程', '确保基础功能稳定']
            });
        }

        // 基于高影响力缺口生成建议
        const criticalGaps = gaps.filter(g => g.impact === 'critical');
        if (criticalGaps.length > 0) {
            recommendations.push({
                type: 'feature',
                priority: 'immediate',
                title: '修复关键功能缺失',
                description: `发现${criticalGaps.length}个关键功能缺失，需要立即处理`,
                benefits: ['确保产品基本可用', '避免用户流失', '建立产品信任度'],
                implementation: criticalGaps.map(g => `实现${g.feature}功能`)
            });
        }

        // 架构优化建议
        recommendations.push({
            type: 'architecture',
            priority: 'short-term',
            title: '优化模块架构',
            description: '建立更清晰的模块边界和依赖关系',
            benefits: ['提高代码可维护性', '支持功能扩展', '提升开发效率'],
            implementation: ['重构分析器模块', '统一接口设计', '优化依赖注入']
        });

        // 用户体验优化
        recommendations.push({
            type: 'ux',
            priority: 'short-term',
            title: '提升用户体验',
            description: '优化界面交互和视觉设计',
            benefits: ['提高用户满意度', '降低学习成本', '增加用户粘性'],
            implementation: ['统一UI组件库', '改进交互流程', '添加引导和帮助']
        });

        // 性能优化建议
        recommendations.push({
            type: 'performance',
            priority: 'long-term',
            title: '性能监控与优化',
            description: '建立完整的性能监控和优化体系',
            benefits: ['提升分析速度', '优化内存使用', '支持大型项目'],
            implementation: ['实现增量分析', '优化算法复杂度', '添加缓存机制']
        });

        return recommendations;
    }

    // 🔥 制定发展路线图
    private async createDevelopmentRoadmap(gaps: FeatureGap[], recommendations: ProjectRecommendation[]): Promise<DevelopmentRoadmap> {
        const criticalGaps = gaps.filter(g => g.impact === 'critical');
        const highGaps = gaps.filter(g => g.impact === 'high');
        const mediumGaps = gaps.filter(g => g.impact === 'medium');

        return {
            phase1: {
                name: '🚀 基础完善阶段',
                duration: '4-6周',
                features: [
                    ...criticalGaps.map(g => g.feature),
                    '统一工作台界面',
                    '基础分析能力'
                ],
                goals: [
                    '确保核心功能完整可用',
                    '建立稳定的分析基础',
                    '提供基本的可视化能力'
                ]
            },
            phase2: {
                name: '⚡ 功能增强阶段',
                duration: '6-8周',
                features: [
                    ...highGaps.map(g => g.feature),
                    '智能代码生成',
                    '实时协作功能',
                    'AI增强分析'
                ],
                goals: [
                    '提供高级分析功能',
                    '支持团队协作',
                    '集成AI能力'
                ]
            },
            phase3: {
                name: '🌟 生态完善阶段',
                duration: '4-6周',
                features: [
                    ...mediumGaps.map(g => g.feature),
                    '性能监控',
                    '插件生态',
                    '企业级功能'
                ],
                goals: [
                    '建立完整生态系统',
                    '支持企业级应用',
                    '提供可扩展架构'
                ]
            }
        };
    }

    // 辅助方法
    private mapPriorityToImpact(priority: string): 'critical' | 'high' | 'medium' | 'low' {
        switch (priority) {
            case 'critical': return 'critical';
            case 'high': return 'high';
            case 'medium': return 'medium';
            default: return 'low';
        }
    }

    private getSuggestedSolution(feature: FeatureStatus): string {
        switch (feature.category) {
            case 'core':
                return `实现${feature.name}的核心逻辑，包括${feature.description}`;
            case 'advanced':
                return `开发高级${feature.name}功能，提供${feature.description}`;
            case 'integration':
                return `集成${feature.name}到现有系统，实现${feature.description}`;
            case 'ui':
                return `设计和实现${feature.name}界面，支持${feature.description}`;
            default:
                return `实现${feature.name}功能`;
        }
    }

    private estimateImplementationTime(feature: FeatureStatus): string {
        switch (feature.priority) {
            case 'critical':
                return '1-2周';
            case 'high':
                return '5-10天';
            case 'medium':
                return '3-7天';
            default:
                return '1-3天';
        }
    }

    private calculateOverallHealth(completeness: FeatureCompletenessReport, gaps: FeatureGap[]): number {
        let score = completeness.completenessScore;

        // 基于缺口影响调整评分
        const criticalGaps = gaps.filter(g => g.impact === 'critical').length;
        const highGaps = gaps.filter(g => g.impact === 'high').length;

        score -= criticalGaps * 15;
        score -= highGaps * 8;

        return Math.max(0, Math.min(100, score));
    }
}

// 导出便捷函数
export async function runProjectDiagnostics(workspaceRoot: string): Promise<FeatureDiagnosticResult> {
    const diagnostics = new ProjectFeatureDiagnostics(workspaceRoot);
    return await diagnostics.runDiagnostics();
}
