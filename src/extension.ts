import * as vscode from 'vscode';
import { CodeAnalyzer } from './codeAnalyzer';
import { VisualPanelProvider, createOrShowVisualPanel } from './visualPanelProvider';
import { CodeStructureProvider } from './codeStructureProviderSimplified';
import { InteractiveCanvasProvider } from './interactiveCanvasProvider';
import { CodeGenerationEngine } from './codeGenerationEngine';
import { RealTimeCollaborationProvider } from './realTimeCollaborationProvider';
import { AIEnhancedAnalysisEngine } from './aiEnhancedAnalysisEngine';
import { IntelligentTemplateSystem } from './intelligentTemplateSystem';
import { createOrShowUnifiedVisualizationPanel } from './unifiedVisualizationProvider';
import { IntelligentCodeOptimizer } from './intelligentCodeOptimizer';
import { runProjectDiagnostics, FeatureDiagnosticResult } from './projectFeatureDiagnostics';
// 🚀 新增增强功能
import { codeGenerationEngine } from './enhancedCodeGenerationEngine';
import { aiEnhancedAnalyzer } from './aiEnhancedAnalyzer';
import { createBlueprintEditor } from './blueprintVisualEditor';
import { RealTimeCodeSyncEngine } from './realTimeCodeSyncEngine';
import { createEnhancedTemplateSystem } from './enhancedTemplateSystem';
import { createInteractionOptimizer } from './interactionOptimizer';
import { performanceOptimizer } from './performanceOptimizer';
import { advancedUISystem } from './advancedUISystem';
import { intelligentRefactoringEngine } from './intelligentRefactoringEngine';
import { aiEnhancedAnalysisSystem } from './aiEnhancedAnalysisSystem';
import { EnhancedInteractiveFeatures } from './enhancedInteractiveFeaturesSimplified';
import { ContextMenuManager } from './contextMenu/ContextMenuManager';
import { KidFriendlyCardController } from './kidFriendlyCards/kidFriendlyCardController';
import { SeniorStudentCardController } from './seniorStudentCards/seniorStudentCardController';

// 🚀 新增优化和诊断系统
import { getOptimizationManager } from './projectOptimizationManager';
import { errorDiagnostics } from './intelligentErrorDiagnostics';
import { startCacheCleanupTask } from './intelligentAnalysisCache';
import { analysisCache } from './intelligentAnalysisCache';

// 🎨 蓝图编辑器系统
import { BlueprintEditorProvider } from './blueprintEditorProvider';

// 🖼️ 交互式画布和可视化系统
import { InteractiveCanvasSystem } from './simplifiedInteractiveCanvas';
import { AnalysisVisualizationPanel } from './analysisVisualizationPanel';

// 项目特征分析函数
async function analyzeProjectCharacteristics(workspaceFolder: vscode.WorkspaceFolder) {
    const pattern = new vscode.RelativePattern(workspaceFolder, '**/*.{tsx,ts,jsx,js,rs}');
    const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
    
    let reactFileCount = 0;
    let rustFileCount = 0;
    let totalLinesOfCode = 0;
    let totalFileSize = 0;
    let hasLargeComponents = false;
    let hasComplexState = false;
    let hasAsyncCode = false;
    let hasPerformanceIssues = false;

    for (const file of files) {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            const content = document.getText();
            const lineCount = document.lineCount;
            
            totalLinesOfCode += lineCount;
            totalFileSize += content.length;

            if (file.fsPath.match(/\.(tsx?|jsx?)$/)) {
                reactFileCount++;
                if (content.includes('useState') || content.includes('useEffect')) {
                    hasComplexState = true;
                }
                if (lineCount > 200) {
                    hasLargeComponents = true;
                }
                if (content.includes('Promise') || content.includes('async')) {
                    hasAsyncCode = true;
                }
            } else if (file.fsPath.endsWith('.rs')) {
                rustFileCount++;
                if (content.includes('async fn') || content.includes('tokio')) {
                    hasAsyncCode = true;
                }
            }
        } catch (error) {
            // 忽略无法读取的文件
        }
    }

    // 简单的性能问题检测
    hasPerformanceIssues = hasLargeComponents || (totalLinesOfCode > 10000);

    return {
        reactFileCount,
        rustFileCount,
        totalLinesOfCode,
        averageFileSize: files.length > 0 ? totalFileSize / files.length : 0,
        hasLargeComponents,
        hasComplexState,
        hasAsyncCode,
        hasPerformanceIssues
    };
}

// 🔥 生成诊断报告
function generateDiagnosticReport(result: FeatureDiagnosticResult): string {
    const { projectName, overallHealth, featureCompleteness, gaps, recommendations, roadmap } = result;
    
    return `# 📊 ${projectName} - 项目功能诊断报告

## 🏥 项目健康度概览
- **整体健康度**: ${overallHealth}/100 ${getHealthIcon(overallHealth)}
- **功能完整性**: ${featureCompleteness.completenessScore}%
- **功能缺口数量**: ${gaps.length}
- **诊断时间**: ${new Date().toLocaleString()}

## 📈 功能完整性分析

### 🎯 核心功能 (${featureCompleteness.coreFeatures.length})
${featureCompleteness.coreFeatures.map(f => 
    `- ${getStatusIcon(f.status)} **${f.name}**: ${f.status} (${f.priority})`
).join('\n')}

### ⚡ 高级功能 (${featureCompleteness.advancedFeatures.length})
${featureCompleteness.advancedFeatures.map(f => 
    `- ${getStatusIcon(f.status)} **${f.name}**: ${f.status} (${f.priority})`
).join('\n')}

### 🔗 集成功能 (${featureCompleteness.integrationFeatures.length})
${featureCompleteness.integrationFeatures.map(f => 
    `- ${getStatusIcon(f.status)} **${f.name}**: ${f.status} (${f.priority})`
).join('\n')}

### 🎨 用户界面 (${featureCompleteness.uiExperience.length})
${featureCompleteness.uiExperience.map(f => 
    `- ${getStatusIcon(f.status)} **${f.name}**: ${f.status} (${f.priority})`
).join('\n')}

## 🚨 功能缺口分析

${gaps.length === 0 ? '🎉 恭喜！没有发现功能缺口。' : gaps.map(gap => 
    `### ${getImpactIcon(gap.impact)} ${gap.feature}
- **影响程度**: ${gap.impact}
- **问题描述**: ${gap.description}
- **建议方案**: ${gap.suggestedSolution}
- **预估时间**: ${gap.estimatedTime}
- **相关文件**: ${gap.requiredFiles.join(', ') || '待创建'}
`
).join('\n')}

## 💡 优化建议

${recommendations.map((rec, index) => 
    `### ${index + 1}. ${getTypeIcon(rec.type)} ${rec.title}
- **类型**: ${rec.type}
- **优先级**: ${rec.priority}
- **描述**: ${rec.description}
- **预期收益**:
${rec.benefits.map(b => `  - ${b}`).join('\n')}
- **实施方案**:
${rec.implementation.map(i => `  - ${i}`).join('\n')}
`
).join('\n')}

## 🗺️ 发展路线图

### ${roadmap.phase1.name} (${roadmap.phase1.duration})
**目标**:
${roadmap.phase1.goals.map(g => `- ${g}`).join('\n')}

**功能**:
${roadmap.phase1.features.map(f => `- ${f}`).join('\n')}

### ${roadmap.phase2.name} (${roadmap.phase2.duration})
**目标**:
${roadmap.phase2.goals.map(g => `- ${g}`).join('\n')}

**功能**:
${roadmap.phase2.features.map(f => `- ${f}`).join('\n')}

### ${roadmap.phase3.name} (${roadmap.phase3.duration})
**目标**:
${roadmap.phase3.goals.map(g => `- ${g}`).join('\n')}

**功能**:
${roadmap.phase3.features.map(f => `- ${f}`).join('\n')}

---
*报告生成时间: ${new Date().toLocaleString()}*
*由 Visual Programming VSCode Extension 自动生成*
`;
}

// 辅助函数
function getHealthIcon(health: number): string {
    if (health >= 80) {return '🟢';}
    if (health >= 60) {return '🟡';}
    if (health >= 40) {return '🟠';}
    return '🔴';
}

function getStatusIcon(status: string): string {
    switch (status) {
        case 'complete': return '✅';
        case 'partial': return '🟡';
        case 'missing': return '❌';
        case 'planned': return '📅';
        default: return '❓';
    }
}

function getImpactIcon(impact: string): string {
    switch (impact) {
        case 'critical': return '🔴';
        case 'high': return '🟠';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '❓';
    }
}

function getTypeIcon(type: string): string {
    switch (type) {
        case 'feature': return '🚀';
        case 'architecture': return '🏗️';
        case 'performance': return '⚡';
        case 'ux': return '🎨';
        case 'security': return '🔒';
        default: return '💡';
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('代码可视化编程插件已激活');

    // 初始化核心组件
    const codeAnalyzer = new CodeAnalyzer();
    const codeStructureProvider = new CodeStructureProvider();
    const interactiveCanvas = new InteractiveCanvasProvider();
    const codeGenerator = new CodeGenerationEngine();
    const collaborationProvider = new RealTimeCollaborationProvider();
    const aiAnalysisEngine = new AIEnhancedAnalysisEngine();
    const templateSystem = new IntelligentTemplateSystem();
    const codeOptimizer = new IntelligentCodeOptimizer();

    // 🆕 初始化新功能组件
    const blueprintEditor = createBlueprintEditor(context);
    const kidFriendlyController = new KidFriendlyCardController(blueprintEditor, context.extensionUri);
    const seniorStudentController = new SeniorStudentCardController(blueprintEditor);
    const syncOutputChannel = vscode.window.createOutputChannel('Real-Time Code Sync');
    const realTimeSync = new RealTimeCodeSyncEngine(syncOutputChannel);

    // 🎨 初始化蓝图编辑器提供器
    const blueprintEditorProvider = new BlueprintEditorProvider(context);
    const enhancedTemplateSystem = createEnhancedTemplateSystem(context);
    const interactionOptimizer = createInteractionOptimizer(context);
    const { ErrorHandler } = require('./errorHandler');
    const { PerformanceMonitor } = require('./performanceMonitor');
    const { UserGuidanceSystem, showWelcomeWizard, showTutorialList } = require('./userGuidanceSystem');
    const { FileBasedCollaborationSystem, createCollaborationSession, joinCollaborationSession } = require('./fileBasedCollaborationSystem');
    
    const errorHandler = ErrorHandler.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const userGuidance = UserGuidanceSystem.getInstance();
    const collaborationSystem = FileBasedCollaborationSystem.getInstance();

    // 注册资源右键菜单命令
    const contextMenuManager = new ContextMenuManager({
        advanced: {
            showKidFriendlyCard: async () => {
                await kidFriendlyController.showDemoCard();
            },
            showSeniorStudentCard: async () => {
                await seniorStudentController.showDemoCard();
            }
        }
    });
    contextMenuManager.registerCommands(context);

    // 🚀 初始化新的优化和诊断系统
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    let optimizationManager: ReturnType<typeof getOptimizationManager> | null = null;
    
    if (workspaceFolder) {
        optimizationManager = getOptimizationManager(workspaceFolder.uri.fsPath);
    }
    
    // 启动缓存清理任务
    const cacheCleanupTask = startCacheCleanupTask();
    context.subscriptions.push(cacheCleanupTask);

    // 注册新命令
    const showOptimizationConfigCommand = vscode.commands.registerCommand(
        'visualProgramming.showOptimizationConfig',
        async () => {
            if (optimizationManager) {
                await optimizationManager.showConfigurationPanel();
            } else {
                vscode.window.showWarningMessage('请先打开一个工作区');
            }
        }
    );

    const showDiagnosticsCommand = vscode.commands.registerCommand(
        'visualProgramming.showDiagnostics',
        async () => {
            await errorDiagnostics.showDiagnosticsPanel();
        }
    );

    const clearCacheCommand = vscode.commands.registerCommand(
        'visualProgramming.clearCache',
        async () => {
            analysisCache.clear();
            vscode.window.showInformationMessage('分析缓存已清理');
        }
    );

    const autoOptimizeProjectCommand = vscode.commands.registerCommand(
        'visualProgramming.autoOptimizeProject',
        async () => {
            if (!optimizationManager || !workspaceFolder) {
                vscode.window.showWarningMessage('请先打开一个工作区');
                return;
            }

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '正在分析项目并自动优化配置...',
                cancellable: false
            }, async (progress) => {
                // 分析项目特征
                const projectAnalysis = await analyzeProjectCharacteristics(workspaceFolder);
                
                // 自动优化配置
                const optimizedConfig = await optimizationManager!.autoOptimizeConfig(projectAnalysis);
                
                // 生成建议
                const recommendations = optimizationManager!.generateOptimizationRecommendations(projectAnalysis);
                
                // 显示结果
                const message = `项目自动优化完成！\n\n优化建议：\n${recommendations.join('\n')}`;
                vscode.window.showInformationMessage(message, '查看配置').then(selection => {
                    if (selection === '查看配置') {
                        optimizationManager!.showConfigurationPanel();
                    }
                });
            });
        }
    );

    // 注册传统命令
    const openVisualViewCommand = vscode.commands.registerCommand(
        'visualProgramming.openVisualView',
        () => {
            createOrShowVisualPanel(context.extensionUri);
        }
    );

    const analyzeCodeCommand = vscode.commands.registerCommand(
        'visualProgramming.analyzeCode',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            const document = activeEditor.document;
            const language = document.languageId;
            
            // 检查是否支持的语言
            if (!['typescript', 'javascript', 'rust'].includes(language)) {
                vscode.window.showWarningMessage('当前只支持 TypeScript/JavaScript 和 Rust 文件');
                return;
            }

            try {
                const analysis = await codeAnalyzer.analyzeFile(document);
                vscode.window.showInformationMessage(`分析完成：发现 ${analysis.functions.length} 个函数`);
                
                // 更新结构视图
                codeStructureProvider.refresh(analysis);
            } catch (error) {
                vscode.window.showErrorMessage(`代码分析失败: ${error}`);
            }
        }
    );

    // 注册视图提供者
    const codeStructureView = vscode.window.createTreeView('codeStructure', {
        treeDataProvider: codeStructureProvider,
        showCollapseAll: true
    });

    // 🚀 新增功能命令
    const openInteractiveCanvasCommand = vscode.commands.registerCommand(
        'visualProgramming.openInteractiveCanvas',
        () => {
            // 暂时使用现有的可视化面板，后续会增强为交互式画布
            createOrShowVisualPanel(context.extensionUri);
            vscode.window.showInformationMessage('🎨 交互式画布已打开');
        }
    );

    const generateCodeCommand = vscode.commands.registerCommand(
        'visualProgramming.generateCode',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个文件');
                return;
            }

            // 模拟可视化图数据
            const mockGraph = {
                nodes: [
                    { id: '1', type: 'component', name: 'UserProfile', framework: 'react' },
                    { id: '2', type: 'service', name: 'UserService', framework: 'rust' }
                ],
                connections: [{ from: '1', to: '2', type: 'api_call' }]
            };

            try {
                // 转换模拟图数据为画布节点格式
                const nodes = mockGraph.nodes.map(node => ({
                    id: node.id,
                    type: node.type,
                    position: { x: 100, y: 100 },
                    data: {
                        name: node.name,
                        framework: node.framework
                    },
                    connections: []
                }));
                
                const connections = mockGraph.connections.map((conn, index) => ({
                    id: `conn-${index}`,
                    source: conn.from,
                    target: conn.to,
                    type: 'data-flow' as const,
                    label: conn.type
                }));
                
                const generatedCodes = codeGenerator.generateFromCanvas(nodes, connections);
                const generatedCode = generatedCodes.length > 0 ? generatedCodes[0].content : '// 代码生成失败';
                
                // 创建新文档显示生成的代码
                const doc = await vscode.workspace.openTextDocument({
                    content: generatedCode,
                    language: 'typescript'
                });
                await vscode.window.showTextDocument(doc);
                
                vscode.window.showInformationMessage('✨ 代码生成完成');
            } catch (error) {
                vscode.window.showErrorMessage(`代码生成失败: ${error}`);
            }
        }
    );

    const startRealtimeMonitoringCommand = vscode.commands.registerCommand(
        'visualProgramming.startRealtimeMonitoring',
        () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                collaborationProvider.startWatching(workspaceFolder);
            } else {
                vscode.window.showWarningMessage('请先打开一个工作区');
            }
        }
    );

    // 🎨 蓝图可视化编辑器命令
    const blueprintEditorCommand = vscode.commands.registerCommand(
        'visualProgramming.openBlueprintEditor',
        () => {
            blueprintEditorProvider.createOrShow();
            vscode.window.showInformationMessage('🎨 蓝图可视化编辑器已打开');
        }
    );

    // 🔄 实时代码同步命令
    const startRealTimeSyncCommand = vscode.commands.registerCommand(
        'visualProgramming.startRealTimeSync',
        () => {
            realTimeSync.refreshAnalysis();
            vscode.window.showInformationMessage('🔄 实时代码同步已启动');
        }
    );

    // 📋 增强模板系统命令
    const createFromEnhancedTemplateCommand = vscode.commands.registerCommand(
        'visualProgramming.createFromEnhancedTemplate',
        async () => {
            const templates = enhancedTemplateSystem.getAllTemplates();
            
            const selectedTemplate = await vscode.window.showQuickPick(
                templates.map(t => ({
                    label: `${t.name}`,
                    description: t.description,
                    detail: `${t.category} | ${t.tags.join(', ')}`,
                    template: t
                })),
                {
                    placeHolder: '选择代码模板',
                    matchOnDescription: true,
                    matchOnDetail: true
                }
            );
            
            if (selectedTemplate) {
                // 收集模板变量
                const variables: Record<string, any> = {};
                
                for (const variable of selectedTemplate.template.variables) {
                    if (variable.type === 'string') {
                        const value = await vscode.window.showInputBox({
                            prompt: variable.description,
                            value: String(variable.defaultValue || ''),
                            validateInput: (value) => {
                                if (variable.required && !value.trim()) {
                                    return `${variable.name} 是必填项`;
                                }
                                return undefined;
                            }
                        });
                        if (value !== undefined) {variables[variable.name] = value;}
                    } else if (variable.type === 'boolean') {
                        const choice = await vscode.window.showQuickPick(['是', '否'], {
                            placeHolder: variable.description
                        });
                        variables[variable.name] = choice === '是';
                    } else if (variable.type === 'choice' && variable.choices) {
                        const choice = await vscode.window.showQuickPick(variable.choices, {
                            placeHolder: variable.description
                        });
                        if (choice) {variables[variable.name] = choice;}
                    }
                }
                
                try {
                    const result = await enhancedTemplateSystem.generateCode(
                        selectedTemplate.template.id,
                        {
                            projectPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                            language: selectedTemplate.template.language,
                            framework: selectedTemplate.template.framework,
                            userPreferences: {},
                            variables: variables
                        }
                    );
                    
                    // 创建新文档
                    const document = await vscode.workspace.openTextDocument({
                        content: result.content,
                        language: selectedTemplate.template.language
                    });
                    
                    await vscode.window.showTextDocument(document);
                    
                    vscode.window.showInformationMessage('✨ 增强模板代码生成完成！');
                } catch (error) {
                    vscode.window.showErrorMessage(`模板生成失败: ${error}`);
                }
            }
        }
    );

    // 🎨 交互优化设置命令
    const configureInteractionCommand = vscode.commands.registerCommand(
        'visualProgramming.configureInteraction',
        async () => {
            const currentSettings = interactionOptimizer.getSettings();
            
            const options = [
                {
                    label: `🎯 网格吸附: ${currentSettings.enableGridSnap ? '开启' : '关闭'}`,
                    description: '拖拽时自动吸附到网格',
                    setting: 'gridSnap'
                },
                {
                    label: `📏 智能对齐: ${currentSettings.enableSmartAlign ? '开启' : '关闭'}`,
                    description: '自动对齐到其他元素',
                    setting: 'smartAlign'
                },
                {
                    label: `🎨 主题: ${currentSettings.theme}`,
                    description: '界面主题设置',
                    setting: 'theme'
                },
                {
                    label: `⚡ 动画速度: ${currentSettings.animationSpeed}`,
                    description: '界面动画播放速度',
                    setting: 'animationSpeed'
                },
                {
                    label: '🔄 重置所有设置',
                    description: '恢复默认交互设置',
                    setting: 'reset'
                }
            ];
            
            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: '选择要配置的交互设置'
            });
            
            if (selected) {
                switch (selected.setting) {
                    case 'gridSnap':
                        await interactionOptimizer.saveSettings({
                            enableGridSnap: !currentSettings.enableGridSnap
                        });
                        break;
                    case 'smartAlign':
                        await interactionOptimizer.saveSettings({
                            enableSmartAlign: !currentSettings.enableSmartAlign
                        });
                        break;
                    case 'theme':
                        const theme = await vscode.window.showQuickPick(['auto', 'dark', 'light'], {
                            placeHolder: '选择主题'
                        });
                        if (theme) {
                            await interactionOptimizer.saveSettings({ theme: theme as any });
                        }
                        break;
                    case 'animationSpeed':
                        const speed = await vscode.window.showQuickPick(['fast', 'normal', 'slow'], {
                            placeHolder: '选择动画速度'
                        });
                        if (speed) {
                            await interactionOptimizer.saveSettings({ animationSpeed: speed as any });
                        }
                        break;
                    case 'reset':
                        await interactionOptimizer.resetSettings();
                        break;
                }
            }
        }
    );

    // ⚡ 性能优化器命令
    const performanceAnalysisCommand = vscode.commands.registerCommand(
        'visualProgramming.performanceAnalysis',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            const metrics = await performanceOptimizer.measureAnalysisTime(async () => {
                return await codeAnalyzer.analyzeFile(activeEditor.document);
            });

            vscode.window.showInformationMessage(`⚡ 性能分析完成`);
        }
    );

    // 🎨 主题切换命令
    const switchThemeCommand = vscode.commands.registerCommand(
        'visualProgramming.switchTheme',
        async () => {
            const themes = advancedUISystem.getAllThemes();
            const themeItems = themes.map(t => ({
                label: t.config.name,
                description: `Theme: ${t.name}`,
                detail: t.name
            }));

            const selected = await vscode.window.showQuickPick(themeItems, {
                placeHolder: '选择一个主题'
            });

            if (selected) {
                await advancedUISystem.applyTheme(selected.detail);
            }
        }
    );

    // 🔧 智能重构命令
    const intelligentRefactorCommand = vscode.commands.registerCommand(
        'visualProgramming.intelligentRefactor',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            try {
                // 分析代码异味
                const smells = await intelligentRefactoringEngine.analyzeCodeSmells(activeEditor.document);
                
                if (smells.length === 0) {
                    vscode.window.showInformationMessage('🎉 代码质量良好，没有发现异味！');
                    return;
                }

                // 显示代码异味和重构建议
                const items = smells.map(smell => ({
                    label: `${smell.type}: ${smell.message}`,
                    description: `Severity: ${smell.severity}`,
                    detail: `Line: ${smell.location.start.line + 1}`,
                    smell
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: '选择要重构的代码异味'
                });

                if (selected && selected.smell.refactoringOptions.length > 0) {
                    const option = selected.smell.refactoringOptions[0];
                    const result = await intelligentRefactoringEngine.executeRefactoring(
                        activeEditor.document,
                        option
                    );

                    if (result.success) {
                        vscode.window.showInformationMessage('✨ 重构完成！');
                    } else {
                        vscode.window.showWarningMessage(`重构失败: ${result.warnings.join(', ')}`);
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`重构分析失败: ${error}`);
            }
        }
    );

    const aiAnalysisCommand = vscode.commands.registerCommand(
        'visualProgramming.aiAnalysis',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            try {
                const insights = await aiAnalysisEngine.analyzeCodeWithAI(activeEditor.document);
                
                if (insights.length === 0) {
                    vscode.window.showInformationMessage('✅ 代码质量良好，没有发现问题');
                    return;
                }

                // 显示分析结果
                const items = insights.map(insight => ({
                    label: `${insight.severity === 'high' ? '⚠️' : insight.severity === 'medium' ? '💡' : 'ℹ️'} ${insight.title}`,
                    description: insight.description,
                    detail: insight.suggestion
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `发现 ${insights.length} 个分析结果`,
                    matchOnDescription: true
                });

                if (selected) {
                    vscode.window.showInformationMessage(selected.detail || '');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`AI 分析失败: ${error}`);
            }
        }
    );

    const createFromTemplateCommand = vscode.commands.registerCommand(
        'visualProgramming.createFromTemplate',
        async () => {
            const templates = templateSystem.getAvailableTemplates();
            
            const templateItems = templates.map(template => ({
                label: `${template.category === 'react' ? '⚛️' : template.category === 'rust' ? '🦀' : '🚀'} ${template.name}`,
                description: template.description,
                detail: `难度: ${template.difficulty} | 标签: ${template.tags.join(', ')}`,
                template
            }));

            const selected = await vscode.window.showQuickPick(templateItems, {
                placeHolder: '选择项目模板',
                matchOnDescription: true
            });

            if (selected) {
                const folderUri = await vscode.window.showOpenDialog({
                    canSelectFolders: true,
                    canSelectFiles: false,
                    canSelectMany: false,
                    openLabel: '选择项目位置'
                });

                if (folderUri && folderUri[0]) {
                    const targetPath = folderUri[0].fsPath;
                    
                    // 收集模板变量
                    const variables: Record<string, any> = {};
                    
                    if (selected.template.category === 'react') {
                        const componentName = await vscode.window.showInputBox({
                            prompt: '输入组件名称',
                            value: 'MyComponent'
                        });
                        if (componentName) {variables.componentName = componentName;}
                        variables.useHooks = true;
                        variables.useStyles = true;
                        variables.props = [];
                    }

                    if (selected.template.category === 'rust') {
                        const serviceName = await vscode.window.showInputBox({
                            prompt: '输入服务名称',
                            value: 'my-service'
                        });
                        if (serviceName) {variables.serviceName = serviceName;}
                        variables.port = 3000;
                    }

                    try {
                        await templateSystem.createProject(selected.template.id, targetPath, variables);
                    } catch (error) {
                        vscode.window.showErrorMessage(`模板创建失败: ${error}`);
                    }
                }
            }
        }
    );

    // 🎨 统一可视化工作台命令
    const openUnifiedVisualizationCommand = vscode.commands.registerCommand(
        'visualProgramming.openUnifiedVisualization',
        () => {
            createOrShowUnifiedVisualizationPanel(context.extensionUri);
            vscode.window.showInformationMessage('🎨 统一可视化工作台已打开');
        }
    );

    // � 增强代码生成命令
    const enhancedCodeGenerationCommand = vscode.commands.registerCommand(
        'visualProgramming.enhancedCodeGeneration',
        async () => {
            const options = await vscode.window.showQuickPick([
                { label: '🔧 生成React组件', value: 'react-component' },
                { label: '🦀 生成Rust结构体', value: 'rust-struct' },
                { label: '🌐 生成Rust Web服务', value: 'rust-service' },
                { label: '📦 生成完整项目', value: 'full-project' }
            ], { placeHolder: '选择代码生成类型' });

            if (!options) {return;}

            try {
                switch (options.value) {
                    case 'react-component':
                        const componentName = await vscode.window.showInputBox({
                            prompt: '输入组件名称',
                            value: 'MyComponent'
                        });
                        if (componentName) {
                            const options = {
                                componentType: 'functional' as const,
                                stateManagement: 'useState' as const,
                                styling: 'css' as const,
                                hooks: ['useState'],
                                typescript: true,
                                optimizeForPerformance: true
                            };
                            const componentCode = codeGenerationEngine.generateReactComponent(componentName, options);
                            const props = [
                                { name: 'title', type: 'string' },
                                { name: 'onClick', type: '() => void' }
                            ];
                            const testCode = codeGenerationEngine.generateComponentTest(componentName, props);
                            await codeGenerationEngine.saveGeneratedFiles([
                                { filename: `${componentName}.tsx`, content: componentCode },
                                { filename: `${componentName}.test.tsx`, content: testCode }
                            ]);
                        }
                        break;

                    case 'rust-struct':
                        const structName = await vscode.window.showInputBox({
                            prompt: '输入结构体名称',
                            value: 'MyStruct'
                        });
                        if (structName) {
                            const options = {
                                moduleType: 'struct' as const,
                                asyncPattern: false,
                                errorHandling: 'result' as const,
                                memoryOptimization: true,
                                concurrency: 'none' as const,
                                safetyLevel: 'safe' as const
                            };
                            const rustStructCode = codeGenerationEngine.generateRustStruct(structName, options);
                            await codeGenerationEngine.saveGeneratedFiles([
                                { filename: `${structName.toLowerCase()}.rs`, content: rustStructCode }
                            ]);
                        }
                        break;

                    case 'rust-service':
                        const serviceName = await vscode.window.showInputBox({
                            prompt: '输入服务名称',
                            value: 'MyService'
                        });
                        if (serviceName) {
                            const endpointNames = ['health', 'api', 'users'];
                            const serviceCode = codeGenerationEngine.generateRustWebService(serviceName, endpointNames);
                            const cargoTomlCode = codeGenerationEngine.generateCargoToml(serviceName, ['axum', 'tokio', 'serde']);
                            await codeGenerationEngine.saveGeneratedFiles([
                                { filename: 'src/main.rs', content: serviceCode },
                                { filename: 'Cargo.toml', content: cargoTomlCode }
                            ]);
                        }
                        break;

                    case 'full-project':
                        const projectName = await vscode.window.showInputBox({
                            prompt: '输入项目名称',
                            value: 'my-project'
                        });
                        
                        const language = await vscode.window.showQuickPick([
                            { label: 'TypeScript/React', value: 'typescript' },
                            { label: 'Rust', value: 'rust' }
                        ], { placeHolder: '选择项目语言' });

                        if (projectName && language) {
                            const projectConfig = {
                                projectName,
                                projectType: language.value === 'typescript' ? 'react' as const : 'rust' as const,
                                features: language.value === 'typescript' ? ['router', 'state', 'ui'] : ['async', 'web', 'database']
                            };
                            
                            const files = await codeGenerationEngine.generateFullProject(projectConfig);
                            await codeGenerationEngine.saveGeneratedFiles(files);
                        }
                        break;
                }
            } catch (error) {
                vscode.window.showErrorMessage(`代码生成失败: ${error}`);
            }
        }
    );

    // 🧠 AI增强分析命令
    const aiEnhancedAnalysisCommand = vscode.commands.registerCommand(
        'visualProgramming.aiEnhancedAnalysis',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            const document = editor.document;
            
            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '🧠 AI正在分析代码...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0, message: '开始分析...' });
                    
                    const result = await aiEnhancedAnalyzer.analyzeCodeIntelligence(document);
                    
                    progress.report({ increment: 50, message: '生成报告...' });
                    
                    const report = aiEnhancedAnalyzer.generateAnalysisReport(result, document.fileName);
                    
                    progress.report({ increment: 100, message: '分析完成!' });
                    
                    // 创建新的不可编辑文档显示报告
                    const reportDoc = await vscode.workspace.openTextDocument({
                        content: report,
                        language: 'markdown'
                    });
                    
                    await vscode.window.showTextDocument(reportDoc);
                    
                    // 提供代码修复建议
                    if (result.codeSmells.length > 0) {
                        const shouldFix = await vscode.window.showInformationMessage(
                            `发现 ${result.codeSmells.length} 个代码问题，是否查看修复建议？`,
                            '查看修复', '稍后'
                        );
                        
                        if (shouldFix === '查看修复') {
                            const fixes = await aiEnhancedAnalyzer.suggestCodeFixes(document, result.codeSmells);
                            // 这里可以集成到VS Code的Quick Fix功能
                            vscode.window.showInformationMessage(`生成了 ${fixes.length} 个修复建议`);
                        }
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`AI分析失败: ${error}`);
            }
        }
    );

    // 🖼️ 交互式画布系统命令
    let canvasSystem: InteractiveCanvasSystem | undefined;
    const openInteractiveCanvasSystemCommand = vscode.commands.registerCommand(
        'visualProgramming.openInteractiveCanvasSystem',
        () => {
            if (!canvasSystem) {
                canvasSystem = new InteractiveCanvasSystem();
            }
            const panel = canvasSystem.createWebviewPanel(context);
            vscode.window.showInformationMessage('🖼️ 交互式画布已打开');
        }
    );

    // 📊 分析结果可视化面板命令
    let analysisVisualizationPanel: AnalysisVisualizationPanel | undefined;
    const openAnalysisVisualizationCommand = vscode.commands.registerCommand(
        'visualProgramming.openAnalysisVisualization',
        async () => {
            if (!analysisVisualizationPanel) {
                analysisVisualizationPanel = new AnalysisVisualizationPanel(context);
            }
            
            const panel = analysisVisualizationPanel.createPanel();
            
            // 如果有活动编辑器，自动分析并显示
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                try {
                    // 分析当前文件
                    const analysisResult = await codeAnalyzer.analyzeFile(activeEditor.document);
                    
                    // 转换为可视化格式
                    const visualizationData = AnalysisVisualizationPanel.createAnalysisFromCodeAnalysis(analysisResult);
                    
                    // 更新可视化面板
                    analysisVisualizationPanel.updateAnalysis(visualizationData);
                    
                    vscode.window.showInformationMessage('📊 代码分析可视化已生成');
                } catch (error) {
                    vscode.window.showErrorMessage(`分析失败: ${error}`);
                }
            } else {
                vscode.window.showInformationMessage('📊 分析可视化面板已打开，请选择文件进行分析');
            }
        }
    );

    // 🎨 创建节点从代码分析命令
    const createNodesFromAnalysisCommand = vscode.commands.registerCommand(
        'visualProgramming.createNodesFromAnalysis',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            try {
                // 分析代码
                const analysisResult = await codeAnalyzer.analyzeFile(activeEditor.document);
                
                // 创建交互式画布（如果还没有）
                if (!canvasSystem) {
                    canvasSystem = new InteractiveCanvasSystem();
                    canvasSystem.createWebviewPanel(context);
                }

                // 从分析结果创建节点
                let nodeCount = 0;
                
                // 函数节点
                if (analysisResult.functions) {
                    analysisResult.functions.forEach((func: any) => {
                        const node = canvasSystem!.createNodeFromAnalysis({
                            type: 'function',
                            name: func.name,
                            description: `函数 - 复杂度: ${func.complexity || 1}`,
                            filePath: activeEditor.document.uri.fsPath,
                            lineNumber: func.lineNumber || 1,
                            complexity: func.complexity || 1
                        });
                        canvasSystem!.addNode(node);
                        nodeCount++;
                    });
                }

                // 类/结构体节点
                if (analysisResult.classes) {
                    analysisResult.classes.forEach((cls: any) => {
                        const node = canvasSystem!.createNodeFromAnalysis({
                            type: cls.name.includes('Component') ? 'reactComponent' : 'class',
                            name: cls.name,
                            description: `类 - ${cls.methods?.length || 0}个方法`,
                            filePath: activeEditor.document.uri.fsPath,
                            lineNumber: cls.lineNumber || 1,
                            complexity: cls.complexity || 1
                        });
                        canvasSystem!.addNode(node);
                        nodeCount++;
                    });
                }

                // 变量节点
                if (analysisResult.variables) {
                    analysisResult.variables.slice(0, 5).forEach((variable: any) => { // 限制数量
                        const node = canvasSystem!.createNodeFromAnalysis({
                            type: 'variable',
                            name: variable.name,
                            description: `变量 - ${variable.type || 'unknown'}`,
                            filePath: activeEditor.document.uri.fsPath,
                            lineNumber: variable.lineNumber || 1,
                            complexity: 1
                        });
                        canvasSystem!.addNode(node);
                        nodeCount++;
                    });
                }

                vscode.window.showInformationMessage(`🎨 已创建 ${nodeCount} 个代码节点`);
            } catch (error) {
                vscode.window.showErrorMessage(`创建节点失败: ${error}`);
            }
        }
    );

    // �🔧 智能代码优化命令
    const openCodeOptimizerCommand = vscode.commands.registerCommand(
        'visualProgramming.openCodeOptimizer',
        () => {
            codeOptimizer.createOptimizationPanel(context);
            vscode.window.showInformationMessage('🔧 智能代码优化面板已打开');
        }
    );

    // 🏥 项目功能诊断命令
    const runProjectDiagnosticsCommand = vscode.commands.registerCommand(
        'visualProgramming.runProjectDiagnostics',
        async () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('请先打开一个工作区');
                return;
            }

            try {
                vscode.window.showInformationMessage('🔍 开始项目功能诊断...');
                
                const diagnosticResult = await runProjectDiagnostics(workspaceFolder.uri.fsPath);
                
                // 生成诊断报告
                const report = generateDiagnosticReport(diagnosticResult);
                
                // 显示诊断结果
                const doc = await vscode.workspace.openTextDocument({
                    content: report,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                
                // 显示摘要信息
                const summary = `项目健康度: ${diagnosticResult.overallHealth}/100 | 功能完整性: ${diagnosticResult.featureCompleteness.completenessScore}% | 发现 ${diagnosticResult.gaps.length} 个功能缺口`;
                vscode.window.showInformationMessage(`📊 ${summary}`);
                
            } catch (error) {
                vscode.window.showErrorMessage(`项目诊断失败: ${error}`);
            }
        }
    );

    // ⚡ 快速优化命令
    const quickOptimizeCommand = vscode.commands.registerCommand(
        'visualProgramming.quickOptimize',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            try {
                const optimizedCount = await codeOptimizer.applyAllHighPriorityOptimizations(activeEditor.document);
                if (optimizedCount > 0) {
                    vscode.window.showInformationMessage(`⚡ 已自动应用 ${optimizedCount} 个高优先级优化！`);
                } else {
                    vscode.window.showInformationMessage('✨ 代码质量良好，没有发现需要优化的地方');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`快速优化失败: ${error}`);
            }
        }
    );

    // 📊 生成质量报告命令
    const generateQualityReportCommand = vscode.commands.registerCommand(
        'visualProgramming.generateQualityReport',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            try {
                const report = await codeOptimizer.generateCodeQualityReport(activeEditor.document);
                const doc = await vscode.workspace.openTextDocument({
                    content: report,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                vscode.window.showInformationMessage('📊 代码质量报告已生成！');
            } catch (error) {
                vscode.window.showErrorMessage(`质量报告生成失败: ${error}`);
            }
        }
    );


    // 🎓 用户引导相关命令
    const showWelcomeCommand = vscode.commands.registerCommand(
        'visualProgramming.showWelcome',
        () => showWelcomeWizard()
    );

    const showTutorialsCommand = vscode.commands.registerCommand(
        'visualProgramming.showTutorials',
        () => showTutorialList()
    );

    const resetTutorialProgressCommand = vscode.commands.registerCommand(
        'visualProgramming.resetTutorialProgress',
        () => userGuidance.resetProgress()
    );

    // 🤝 协作相关命令
    const createCollaborationCommand = vscode.commands.registerCommand(
        'visualProgramming.createCollaboration',
        async () => {
            const sessionName = await vscode.window.showInputBox({
                prompt: '请输入协作会话名称',
                placeHolder: '例如: 项目开发协作'
            });
            
            if (sessionName) {
                try {
                    const sessionId = await createCollaborationSession(sessionName);
                    vscode.window.showInformationMessage(`🎉 协作会话创建成功！ID: ${sessionId}`);
                } catch (error) {
                    errorHandler.handleError(error as Error, { context: 'collaboration-create' });
                }
            }
        }
    );

    const joinCollaborationCommand = vscode.commands.registerCommand(
        'visualProgramming.joinCollaboration',
        async () => {
            const sessionId = await vscode.window.showInputBox({
                prompt: '请输入要加入的协作会话ID',
                placeHolder: '例如: COLLAB-ABCD1234'
            });
            
            if (sessionId) {
                try {
                    await joinCollaborationSession(sessionId);
                    vscode.window.showInformationMessage('🤝 成功加入协作会话！');
                } catch (error) {
                    errorHandler.handleError(error as Error, { context: 'collaboration-join' });
                }
            }
        }
    );

    const leaveCollaborationCommand = vscode.commands.registerCommand(
        'visualProgramming.leaveCollaboration',
        async () => {
            if (collaborationSystem.isInSession()) {
                await collaborationSystem.leaveSession();
                vscode.window.showInformationMessage('👋 已离开协作会话');
            } else {
                vscode.window.showWarningMessage('您当前不在任何协作会话中');
            }
        }
    );

    const sendChatMessageCommand = vscode.commands.registerCommand(
        'visualProgramming.sendChatMessage',
        async () => {
            if (!collaborationSystem.isInSession()) {
                vscode.window.showWarningMessage('请先加入协作会话');
                return;
            }

            const message = await vscode.window.showInputBox({
                prompt: '输入聊天消息',
                placeHolder: '与协作者交流...'
            });

            if (message) {
                await collaborationSystem.sendChatMessage(message);
            }
        }
    );

    // 📊 性能监控命令
    const showPerformanceCommand = vscode.commands.registerCommand(
        'visualProgramming.showPerformance',
        async () => {
            try {
                const report = await performanceMonitor.generatePerformanceReport();
                const doc = await vscode.workspace.openTextDocument({
                    content: report,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                vscode.window.showInformationMessage('📊 性能报告已生成！');
            } catch (error) {
                errorHandler.handleError(error as Error, { context: 'performance-report' });
            }
        }
    );

    const optimizePerformanceCommand = vscode.commands.registerCommand(
        'visualProgramming.optimizePerformance',
        async () => {
            try {
                const insights = await performanceMonitor.generatePerformanceInsights();
                if (insights.optimizations.length === 0) {
                    vscode.window.showInformationMessage('✨ 性能表现良好，没有发现可优化项！');
                    return;
                }

                const items = insights.optimizations.map((opt: any) => ({
                    label: `${opt.priority === 'high' ? '🔴' : opt.priority === 'medium' ? '🟡' : '🟢'} ${opt.title}`,
                    description: opt.description,
                    detail: `预期提升: ${opt.expectedImprovement}`,
                    optimization: opt
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `发现 ${insights.optimizations.length} 个优化建议`,
                    canPickMany: true
                });

                if (selected && selected.length > 0) {
                    vscode.window.showInformationMessage(`📈 已记录 ${selected.length} 个性能优化建议！`);
                }
            } catch (error) {
                errorHandler.handleError(error as Error, { context: 'performance-optimize' });
            }
        }
    );

    // 🆘 帮助和支持命令
    const showHelpCommand = vscode.commands.registerCommand(
        'visualProgramming.showHelp',
        async () => {
            const helpOptions = [
                { label: '📚 查看教程', action: 'tutorials' },
                { label: '🎯 快速入门', action: 'quickstart' },
                { label: '🔧 常见问题', action: 'faq' },
                { label: '📖 功能文档', action: 'docs' },
                { label: '🐛 报告问题', action: 'report' }
            ];

            const selected = await vscode.window.showQuickPick(helpOptions, {
                placeHolder: '选择帮助类型'
            });

            if (selected) {
                switch (selected.action) {
                    case 'tutorials':
                        await showTutorialList();
                        break;
                    case 'quickstart':
                        await userGuidance.startTutorial('getting-started');
                        break;
                    case 'faq':
                    case 'docs':
                        await userGuidance.showContextualHelp('general');
                        break;
                    case 'report':
                        vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-repo/issues'));
                        break;
                }
            }
        }
    );

    // 🔄 系统维护命令
    const cleanupCacheCommand = vscode.commands.registerCommand(
        'visualProgramming.cleanupCache',
        async () => {
            try {
                // 清理性能监控缓存
                performanceMonitor.clearMetrics();
                
                // 重置用户引导进度（可选）
                const shouldResetTutorials = await vscode.window.showWarningMessage(
                    '是否同时重置教程进度？',
                    '是',
                    '否'
                );
                
                if (shouldResetTutorials === '是') {
                    userGuidance.resetProgress();
                }
                
                vscode.window.showInformationMessage('🧹 缓存清理完成！');
            } catch (error) {
                errorHandler.handleError(error as Error, { context: 'cleanup-cache' });
            }
        }
    );

    // 🎯 增强交互功能命令
    const enableEnhancedInteractionCommand = vscode.commands.registerCommand(
        'visualProgramming.enableEnhancedInteraction',
        async () => {
            try {
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    vscode.window.showWarningMessage('请先打开一个代码文件');
                    return;
                }

                // 创建交互式画布实例
                const canvasProvider = new InteractiveCanvasProvider();
                
                // 创建增强交互功能实例
                const enhancedFeatures = new EnhancedInteractiveFeatures(canvasProvider);
                
                // 启用增强功能
                enhancedFeatures.enableMultiSelection();
                
                // 显示功能面板
                const panel = vscode.window.createWebviewPanel(
                    'enhancedInteraction',
                    '🎯 增强交互画布',
                    vscode.ViewColumn.Beside,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );

                panel.webview.html = getEnhancedInteractionHTML(panel.webview);
                
                // 设置消息处理
                panel.webview.onDidReceiveMessage(message => {
                    switch (message.command) {
                        case 'doubleClick':
                            enhancedFeatures.handleDoubleClick(message.target, message.id);
                            break;
                        case 'contextMenu':
                            enhancedFeatures.showContextMenu(message.x, message.y, message.targetType, message.nodeId);
                            break;
                        case 'search':
                            const results = enhancedFeatures.globalSearch(message.query);
                            panel.webview.postMessage({
                                command: 'searchResults',
                                results: results
                            });
                            break;
                        case 'shortcut':
                            enhancedFeatures.handleShortcut(message.action);
                            break;
                    }
                });

                vscode.window.showInformationMessage('🎯 增强交互功能已启用！双击节点编辑，Ctrl+A全选，右键菜单等功能已激活。');

            } catch (error) {
                vscode.window.showErrorMessage(`启用增强交互功能失败: ${error}`);
            }
        }
    );

    // 🎯 智能建议命令
    const getSmartSuggestionsCommand = vscode.commands.registerCommand(
        'visualProgramming.getSmartSuggestions',
        async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('请先打开一个代码文件');
                return;
            }

            try {
                const operationId = performanceMonitor.startOperation('analysis');
                
                // 并行运行多种分析
                const [
                    codeAnalysis,
                    qualityReport,
                    aiInsights
                ] = await Promise.all([
                    codeAnalyzer.analyzeFile(activeEditor.document),
                    codeOptimizer.generateCodeQualityReport(activeEditor.document),
                    aiAnalysisEngine.analyzeCodeWithAI(activeEditor.document)
                ]);

                performanceMonitor.endOperation(operationId);

                // 汇总建议
                const suggestions = [
                    `📊 发现 ${codeAnalysis.functions.length} 个函数，${codeAnalysis.classes?.length || 0} 个类`,
                    `🎯 AI分析发现 ${aiInsights.length} 个优化建议`,
                    `📈 代码质量报告已生成`
                ];

                const action = await vscode.window.showInformationMessage(
                    '🎯 智能分析完成！',
                    '查看详细报告',
                    '应用优化建议'
                );

                if (action === '查看详细报告') {
                    const doc = await vscode.workspace.openTextDocument({
                        content: qualityReport,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                } else if (action === '应用优化建议') {
                    await codeOptimizer.applyAllHighPriorityOptimizations(activeEditor.document);
                    vscode.window.showInformationMessage('✨ 优化建议已应用！');
                }

            } catch (error) {
                errorHandler.handleError(error as Error, { context: 'smart-suggestions' });
            }
        }
    );

    // 首次使用时显示欢迎向导
    if (context.globalState.get('firstRun') !== false) {
        setTimeout(() => {
            showWelcomeWizard();
            context.globalState.update('firstRun', false);
        }, 2000); // 延迟2秒显示
    }

    // 添加到上下文
    context.subscriptions.push(
        openVisualViewCommand,
        analyzeCodeCommand,
        openInteractiveCanvasCommand,
        generateCodeCommand,
        startRealtimeMonitoringCommand,
        aiAnalysisCommand,
        createFromTemplateCommand,
        openUnifiedVisualizationCommand,
        openCodeOptimizerCommand,
        runProjectDiagnosticsCommand,
        quickOptimizeCommand,
        generateQualityReportCommand,
        // 🚀 增强功能命令
        enhancedCodeGenerationCommand,
        aiEnhancedAnalysisCommand,
        // 🖼️ 可视化系统命令
        openInteractiveCanvasSystemCommand,
        openAnalysisVisualizationCommand,
        createNodesFromAnalysisCommand,
        // 🆕 新功能命令
        showWelcomeCommand,
        showTutorialsCommand,
        resetTutorialProgressCommand,
        createCollaborationCommand,
        joinCollaborationCommand,
        leaveCollaborationCommand,
        // 🎯 增强交互功能命令
        enableEnhancedInteractionCommand,
        sendChatMessageCommand,
        showPerformanceCommand,
        optimizePerformanceCommand,
        showHelpCommand,
        cleanupCacheCommand,
        getSmartSuggestionsCommand,
        codeStructureView,
        // 🎨 蓝图编辑器和实时同步
        blueprintEditorCommand,
        startRealTimeSyncCommand,
        createFromEnhancedTemplateCommand,
        configureInteractionCommand,
        // 🆕 新增高级功能命令
        performanceAnalysisCommand,
        switchThemeCommand,
        intelligentRefactorCommand
    );

    // 🚀 新增：React专用分析命令
    const analyzeReactProjectCommand = vscode.commands.registerCommand(
        'visualProgramming.analyzeReactProject',
        async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('请先打开一个React文件');
                    return;
                }

                vscode.window.showInformationMessage('🔍 正在深度分析React项目...');
                
                // 使用专门的React分析器
                const ReactAnalyzer = require('./reactAnalyzer').ReactAnalyzer;
                const AdvancedReactAnalyzer = require('./advancedReactAnalyzer').AdvancedReactAnalyzer;
                const ReactPerformanceAnalyzer = require('./reactPerformanceAnalyzer').ReactPerformanceAnalyzer;
                
                const reactAnalyzer = new ReactAnalyzer();
                const advancedAnalyzer = new AdvancedReactAnalyzer();
                const performanceAnalyzer = new ReactPerformanceAnalyzer();
                
                const content = editor.document.getText();
                const basicAnalysis = await reactAnalyzer.analyzeReactFile(content);
                const advancedAnalysis = await advancedAnalyzer.analyzeAdvancedReactFeatures(content);
                const performanceAnalysis = await performanceAnalyzer.analyzeReactPerformance(content);
                
                // 创建专门的React分析结果面板
                createReactAnalysisPanel(basicAnalysis, advancedAnalysis, performanceAnalysis);
                
                vscode.window.showInformationMessage('✅ React项目分析完成！');
            } catch (error) {
                vscode.window.showErrorMessage(`React分析失败: ${(error as Error).message}`);
            }
        }
    );

    const optimizeReactPerformanceCommand = vscode.commands.registerCommand(
        'visualProgramming.optimizeReactPerformance',
        async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('请先打开一个React文件');
                    return;
                }

                vscode.window.showInformationMessage('⚡ 正在优化React性能...');
                
                // 使用React性能优化分析器
                const ReactPerformanceAnalyzer = require('./reactPerformanceAnalyzer').ReactPerformanceAnalyzer;
                const performanceAnalyzer = new ReactPerformanceAnalyzer();
                
                const content = editor.document.getText();
                const optimizations = await performanceAnalyzer.generateOptimizationSuggestions(content);
                
                // 显示优化建议
                showReactOptimizationSuggestions(optimizations);
                
                vscode.window.showInformationMessage('✅ React性能优化建议已生成！');
            } catch (error) {
                vscode.window.showErrorMessage(`React性能优化失败: ${(error as Error).message}`);
            }
        }
    );

    const generateReactComponentsCommand = vscode.commands.registerCommand(
        'visualProgramming.generateReactComponents',
        async () => {
            try {
                vscode.window.showInformationMessage('🚀 正在生成React组件...');
                
                // 使用增强代码生成引擎
                const generatedCode = await codeGenerationEngine.generateReactComponent('NewComponent', {
                    componentType: 'functional',
                    stateManagement: 'useState',
                    styling: 'css',
                    hooks: ['useState', 'useEffect'],
                    typescript: true,
                    optimizeForPerformance: true
                });
                
                // 创建新文件并插入生成的代码
                const doc = await vscode.workspace.openTextDocument({
                    content: generatedCode,
                    language: 'typescriptreact'
                });
                
                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage('✅ React组件生成完成！');
            } catch (error) {
                vscode.window.showErrorMessage(`React组件生成失败: ${(error as Error).message}`);
            }
        }
    );

    const visualizeReactArchitectureCommand = vscode.commands.registerCommand(
        'visualProgramming.visualizeReactArchitecture',
        async () => {
            try {
                vscode.window.showInformationMessage('🏗️ 正在可视化React架构...');
                
                // 分析工作区中的所有React文件
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('请先打开一个工作区');
                    return;
                }
                
                // 创建React架构可视化面板
                createReactArchitectureVisualizationPanel(workspaceFolder);
                
                vscode.window.showInformationMessage('✅ React架构可视化完成！');
            } catch (error) {
                vscode.window.showErrorMessage(`React架构可视化失败: ${(error as Error).message}`);
            }
        }
    );

    // 🦀 新增：Rust专用分析命令
    const analyzeRustProjectCommand = vscode.commands.registerCommand(
        'visualProgramming.analyzeRustProject',
        async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('请先打开一个Rust文件');
                    return;
                }

                vscode.window.showInformationMessage('🔍 正在深度分析Rust项目...');
                
                // 使用专门的Rust分析器
                const RustAnalyzer = require('./rustAnalyzer').RustAnalyzer;
                const AdvancedRustAnalyzer = require('./advancedRustAnalyzer').AdvancedRustAnalyzer;
                const RustPerformanceAnalyzer = require('./rustPerformanceAnalyzer').RustPerformanceAnalyzer;
                
                const rustAnalyzer = new RustAnalyzer();
                const advancedAnalyzer = new AdvancedRustAnalyzer();
                const performanceAnalyzer = new RustPerformanceAnalyzer();
                
                const content = editor.document.getText();
                const basicAnalysis = await rustAnalyzer.analyzeRustFile(content);
                const advancedAnalysis = await advancedAnalyzer.analyzeAdvancedRustFeatures(content);
                const performanceAnalysis = await performanceAnalyzer.analyzeRustPerformance(content);
                
                // 创建专门的Rust分析结果面板
                createRustAnalysisPanel(basicAnalysis, advancedAnalysis, performanceAnalysis);
                
                vscode.window.showInformationMessage('✅ Rust项目分析完成！');
            } catch (error) {
                vscode.window.showErrorMessage(`Rust分析失败: ${(error as Error).message}`);
            }
        }
    );

    const optimizeRustPerformanceCommand = vscode.commands.registerCommand(
        'visualProgramming.optimizeRustPerformance',
        async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('请先打开一个Rust文件');
                    return;
                }

                vscode.window.showInformationMessage('⚡ 正在优化Rust性能...');
                
                // 使用Rust性能优化分析器
                const RustPerformanceAnalyzer = require('./rustPerformanceAnalyzer').RustPerformanceAnalyzer;
                const performanceAnalyzer = new RustPerformanceAnalyzer();
                
                const content = editor.document.getText();
                const optimizations = await performanceAnalyzer.generateOptimizationSuggestions(content);
                
                // 显示优化建议
                showRustOptimizationSuggestions(optimizations);
                
                vscode.window.showInformationMessage('✅ Rust性能优化建议已生成！');
            } catch (error) {
                vscode.window.showErrorMessage(`Rust性能优化失败: ${(error as Error).message}`);
            }
        }
    );

    const generateRustCodeCommand = vscode.commands.registerCommand(
        'visualProgramming.generateRustCode',
        async () => {
            try {
                vscode.window.showInformationMessage('🚀 正在生成Rust代码...');
                
                // 使用增强代码生成引擎
                const generatedCode = await codeGenerationEngine.generateRustStruct('NewStruct', {
                    moduleType: 'struct',
                    asyncPattern: false,
                    errorHandling: 'result',
                    memoryOptimization: true,
                    concurrency: 'none',
                    safetyLevel: 'safe'
                });
                
                // 创建新文件并插入生成的代码
                const doc = await vscode.workspace.openTextDocument({
                    content: generatedCode,
                    language: 'rust'
                });
                
                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage('✅ Rust代码生成完成！');
            } catch (error) {
                vscode.window.showErrorMessage(`Rust代码生成失败: ${(error as Error).message}`);
            }
        }
    );

    const visualizeRustArchitectureCommand = vscode.commands.registerCommand(
        'visualProgramming.visualizeRustArchitecture',
        async () => {
            try {
                vscode.window.showInformationMessage('🏗️ 正在可视化Rust架构...');
                
                // 分析工作区中的所有Rust文件
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('请先打开一个工作区');
                    return;
                }
                
                // 创建Rust架构可视化面板
                createRustArchitectureVisualizationPanel(workspaceFolder);
                
                vscode.window.showInformationMessage('✅ Rust架构可视化完成！');
            } catch (error) {
                vscode.window.showErrorMessage(`Rust架构可视化失败: ${(error as Error).message}`);
            }
        }
    );

// 🚀 React专用分析面板创建函数
function createReactAnalysisPanel(basicAnalysis: any, advancedAnalysis: any, performanceAnalysis: any) {
    const panel = vscode.window.createWebviewPanel(
        'reactAnalysis',
        '⚛️ React项目分析结果',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = generateReactAnalysisHTML(basicAnalysis, advancedAnalysis, performanceAnalysis);
}

function generateReactAnalysisHTML(basicAnalysis: any, advancedAnalysis: any, performanceAnalysis: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>React项目分析</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
            .header { text-align: center; margin-bottom: 30px; }
            .analysis-section { margin: 20px 0; padding: 15px; border-radius: 8px; background: #252526; }
            .component-card { margin: 10px 0; padding: 10px; border-left: 4px solid #007ACC; background: #2d2d30; }
            .performance-metric { display: inline-block; margin: 5px; padding: 8px 12px; border-radius: 4px; }
            .good { background: #28a745; }
            .warning { background: #ffc107; color: #000; }
            .error { background: #dc3545; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>⚛️ React项目深度分析报告</h1>
            <p>组件数量: ${basicAnalysis?.components?.length || 0} | Hook数量: ${basicAnalysis?.hooks?.length || 0}</p>
        </div>
        
        <div class="analysis-section">
            <h2>📊 基础组件分析</h2>
            ${(basicAnalysis?.components || []).map((comp: any) => `
                <div class="component-card">
                    <h3>${comp.name}</h3>
                    <p>类型: ${comp.type} | Props: ${comp.props?.length || 0} | State: ${comp.state?.length || 0}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="analysis-section">
            <h2>🚀 高级特性分析</h2>
            <p>Redux Store: ${advancedAnalysis?.reduxStores?.length || 0}</p>
            <p>Context Provider: ${advancedAnalysis?.contexts?.length || 0}</p>
            <p>路由配置: ${advancedAnalysis?.routes?.length || 0}</p>
        </div>
        
        <div class="analysis-section">
            <h2>⚡ 性能分析</h2>
            <div class="performance-metric good">渲染性能: ${performanceAnalysis?.renderScore || 85}/100</div>
            <div class="performance-metric warning">内存使用: ${performanceAnalysis?.memoryScore || 70}/100</div>
            <div class="performance-metric good">优化程度: ${performanceAnalysis?.optimizationScore || 90}/100</div>
        </div>
    </body>
    </html>`;
}

function showReactOptimizationSuggestions(optimizations: any) {
    const panel = vscode.window.createWebviewPanel(
        'reactOptimizations',
        '⚡ React性能优化建议',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
            .suggestion { margin: 15px 0; padding: 15px; border-radius: 8px; background: #252526; }
            .high-priority { border-left: 4px solid #dc3545; }
            .medium-priority { border-left: 4px solid #ffc107; }
            .low-priority { border-left: 4px solid #28a745; }
        </style>
    </head>
    <body>
        <h1>⚡ React性能优化建议</h1>
        ${(optimizations?.suggestions || []).map((suggestion: any) => `
            <div class="suggestion ${suggestion.priority}-priority">
                <h3>${suggestion.title}</h3>
                <p>${suggestion.description}</p>
                <code>${suggestion.example || ''}</code>
            </div>
        `).join('')}
    </body>
    </html>`;
}

function createReactArchitectureVisualizationPanel(workspaceFolder: vscode.WorkspaceFolder) {
    const panel = vscode.window.createWebviewPanel(
        'reactArchitecture',
        '🏗️ React架构可视化',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
            .architecture-diagram { width: 100%; height: 400px; border: 1px solid #444; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>🏗️ React架构可视化</h1>
        <p>项目路径: ${workspaceFolder.uri.fsPath}</p>
        <div class="architecture-diagram">
            <!-- React架构图将在这里显示 -->
            <svg width="100%" height="100%">
                <rect x="50" y="50" width="100" height="60" fill="#61dafb" rx="5"/>
                <text x="100" y="85" text-anchor="middle" fill="#000">App.tsx</text>
                
                <rect x="200" y="50" width="100" height="60" fill="#61dafb" rx="5"/>
                <text x="250" y="85" text-anchor="middle" fill="#000">Router</text>
                
                <rect x="350" y="50" width="100" height="60" fill="#61dafb" rx="5"/>
                <text x="400" y="85" text-anchor="middle" fill="#000">Store</text>
            </svg>
        </div>
    </body>
    </html>`;
}

// 🦀 Rust专用分析面板创建函数
function createRustAnalysisPanel(basicAnalysis: any, advancedAnalysis: any, performanceAnalysis: any) {
    const panel = vscode.window.createWebviewPanel(
        'rustAnalysis',
        '🦀 Rust项目分析结果',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = generateRustAnalysisHTML(basicAnalysis, advancedAnalysis, performanceAnalysis);
}

function generateRustAnalysisHTML(basicAnalysis: any, advancedAnalysis: any, performanceAnalysis: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Rust项目分析</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
            .header { text-align: center; margin-bottom: 30px; }
            .analysis-section { margin: 20px 0; padding: 15px; border-radius: 8px; background: #252526; }
            .struct-card { margin: 10px 0; padding: 10px; border-left: 4px solid #ce422b; background: #2d2d30; }
            .performance-metric { display: inline-block; margin: 5px; padding: 8px 12px; border-radius: 4px; }
            .excellent { background: #28a745; }
            .good { background: #ffc107; color: #000; }
            .needs-improvement { background: #dc3545; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🦀 Rust项目深度分析报告</h1>
            <p>结构体数量: ${basicAnalysis?.structs?.length || 0} | 函数数量: ${basicAnalysis?.functions?.length || 0}</p>
        </div>
        
        <div class="analysis-section">
            <h2>📊 基础结构分析</h2>
            ${(basicAnalysis?.structs || []).map((struct: any) => `
                <div class="struct-card">
                    <h3>${struct.name}</h3>
                    <p>字段数量: ${struct.fields?.length || 0} | 可见性: ${struct.visibility || 'private'}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="analysis-section">
            <h2>🚀 高级特性分析</h2>
            <p>异步函数: ${advancedAnalysis?.asyncFunctions?.length || 0}</p>
            <p>特征实现: ${advancedAnalysis?.traitImpls?.length || 0}</p>
            <p>并发安全: ${advancedAnalysis?.concurrencySafety ? '✅' : '❌'}</p>
        </div>
        
        <div class="analysis-section">
            <h2>⚡ 性能分析</h2>
            <div class="performance-metric excellent">内存安全: ${performanceAnalysis?.memoryScore || 95}/100</div>
            <div class="performance-metric good">编译优化: ${performanceAnalysis?.compileScore || 85}/100</div>
            <div class="performance-metric excellent">零成本抽象: ${performanceAnalysis?.abstractionScore || 98}/100</div>
        </div>
    </body>
    </html>`;
}

function showRustOptimizationSuggestions(optimizations: any) {
    const panel = vscode.window.createWebviewPanel(
        'rustOptimizations',
        '⚡ Rust性能优化建议',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
            .suggestion { margin: 15px 0; padding: 15px; border-radius: 8px; background: #252526; }
            .high-priority { border-left: 4px solid #dc3545; }
            .medium-priority { border-left: 4px solid #ffc107; }
            .low-priority { border-left: 4px solid #28a745; }
        </style>
    </head>
    <body>
        <h1>⚡ Rust性能优化建议</h1>
        ${(optimizations?.suggestions || []).map((suggestion: any) => `
            <div class="suggestion ${suggestion.priority}-priority">
                <h3>${suggestion.title}</h3>
                <p>${suggestion.description}</p>
                <code>${suggestion.example || ''}</code>
            </div>
        `).join('')}
    </body>
    </html>`;
}

function createRustArchitectureVisualizationPanel(workspaceFolder: vscode.WorkspaceFolder) {
    const panel = vscode.window.createWebviewPanel(
        'rustArchitecture',
        '🏗️ Rust架构可视化',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
            .architecture-diagram { width: 100%; height: 400px; border: 1px solid #444; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>🏗️ Rust架构可视化</h1>
        <p>项目路径: ${workspaceFolder.uri.fsPath}</p>
        <div class="architecture-diagram">
            <!-- Rust架构图将在这里显示 -->
            <svg width="100%" height="100%">
                <rect x="50" y="50" width="100" height="60" fill="#ce422b" rx="5"/>
                <text x="100" y="85" text-anchor="middle" fill="#fff">main.rs</text>
                
                <rect x="200" y="50" width="100" height="60" fill="#ce422b" rx="5"/>
                <text x="250" y="85" text-anchor="middle" fill="#fff">lib.rs</text>
                
                <rect x="350" y="50" width="100" height="60" fill="#ce422b" rx="5"/>
                <text x="400" y="85" text-anchor="middle" fill="#fff">modules</text>
            </svg>
        </div>
    </body>
    </html>`;
}

    // 监听文件变化
    const fileWatcher = vscode.workspace.onDidChangeTextDocument((event) => {
        const language = event.document.languageId;
        if (['typescript', 'javascript', 'rust'].includes(language)) {
            // 延迟分析，避免频繁更新
            setTimeout(() => {
                codeAnalyzer.analyzeFile(event.document).then(analysis => {
                    codeStructureProvider.refresh(analysis);
                });
            }, 1000);
        }
    });

    // 📝 将新的React和Rust专用命令添加到subscriptions
    context.subscriptions.push(
        // ⚛️ React专用分析命令
        analyzeReactProjectCommand,
        optimizeReactPerformanceCommand,
        generateReactComponentsCommand,
        visualizeReactArchitectureCommand,
        // 🦀 Rust专用分析命令
        analyzeRustProjectCommand,
        optimizeRustPerformanceCommand,
        generateRustCodeCommand,
        visualizeRustArchitectureCommand
    );

    context.subscriptions.push(fileWatcher);
}

export function deactivate() {
    console.log('代码可视化编程插件已停用');
}

// 🎯 增强交互HTML生成函数
function getEnhancedInteractionHTML(webview: vscode.Webview): string {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>增强交互画布</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .header h1 {
                font-size: 2.5rem;
                margin: 0;
                background: linear-gradient(45deg, #fff, #e0e0e0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .feature-card {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 15px;
                padding: 25px;
                transition: all 0.3s ease;
                cursor: pointer;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .feature-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                background: rgba(255, 255, 255, 0.2);
            }
            
            .feature-icon {
                font-size: 2rem;
                margin-bottom: 15px;
                display: block;
            }
            
            .feature-title {
                font-size: 1.2rem;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                margin: 5px;
            }
            
            .btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 增强交互画布</h1>
                <p>双击编辑、多选操作、智能搜索、快捷键支持</p>
            </div>
            
            <div class="features-grid">
                <div class="feature-card">
                    <span class="feature-icon">🖱️</span>
                    <div class="feature-title">多选功能</div>
                    <div>Ctrl+点击多选节点，框选批量操作</div>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">✏️</span>
                    <div class="feature-title">双击编辑</div>
                    <div>双击节点编辑名称，双击连线编辑标签</div>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">📋</span>
                    <div class="feature-title">右键菜单</div>
                    <div>右键显示上下文菜单，快速操作</div>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🔍</span>
                    <div class="feature-title">智能搜索</div>
                    <div>全局搜索节点和连接，快速定位</div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button class="btn" onclick="showDemo()">🚀 开始体验</button>
            </div>
            
            <div style="margin-top: 30px; font-size: 0.9rem; opacity: 0.8;">
                <h3>🎮 快捷键指南</h3>
                <p><strong>Ctrl+A</strong> - 全选节点</p>
                <p><strong>Ctrl+C/V</strong> - 复制/粘贴</p>
                <p><strong>Delete</strong> - 删除选中节点</p>
                <p><strong>Ctrl+F</strong> - 搜索</p>
                <p><strong>双击</strong> - 编辑节点</p>
                <p><strong>右键</strong> - 上下文菜单</p>
            </div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            function showDemo() {
                vscode.postMessage({
                    command: 'shortcut',
                    action: 'demo'
                });
            }
            
            // 键盘快捷键处理
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'a') {
                    e.preventDefault();
                    vscode.postMessage({
                        command: 'shortcut',
                        action: 'selectAll'
                    });
                }
            });
        </script>
    </body>
    </html>
    `;
}
