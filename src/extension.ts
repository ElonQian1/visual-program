import * as vscode from 'vscode';
import { CodeAnalyzer } from './codeAnalyzer';
import { VisualPanelProvider, createOrShowVisualPanel } from './visualPanelProvider';
import { CodeStructureProvider } from './codeStructureProviderSimplified';
import { InteractiveCanvasProvider } from './interactiveCanvasProvider';
import { CodeGenerationEngine } from './codeGenerationEngine';
import { RealTimeCollaborationProvider } from './realTimeCollaborationProvider';
import { AIEnhancedAnalysisEngine } from './aiEnhancedAnalysisEngine';
import { IntelligentTemplateSystem } from './intelligentTemplateSystem';

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

    // 注册命令
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
                
                const connections = mockGraph.connections.map(conn => ({
                    source: conn.from,
                    target: conn.to,
                    type: 'data-flow' as const,
                    label: conn.type
                }));
                
                const generatedCodes = codeGenerator.generateCodeFromCanvas(nodes, connections);
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
                        if (componentName) variables.componentName = componentName;
                        variables.useHooks = true;
                        variables.useStyles = true;
                        variables.props = [];
                    }

                    if (selected.template.category === 'rust') {
                        const serviceName = await vscode.window.showInputBox({
                            prompt: '输入服务名称',
                            value: 'my-service'
                        });
                        if (serviceName) variables.serviceName = serviceName;
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

    // 添加到上下文
    context.subscriptions.push(
        openVisualViewCommand,
        analyzeCodeCommand,
        openInteractiveCanvasCommand,
        generateCodeCommand,
        startRealtimeMonitoringCommand,
        aiAnalysisCommand,
        createFromTemplateCommand,
        codeStructureView
    );

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

    context.subscriptions.push(fileWatcher);
}

export function deactivate() {
    console.log('代码可视化编程插件已停用');
}
