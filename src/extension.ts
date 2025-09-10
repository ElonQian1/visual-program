import * as vscode from 'vscode';
import { CodeAnalyzer } from './codeAnalyzer';
import { VisualPanelProvider, createOrShowVisualPanel } from './visualPanelProvider';
import { CodeStructureProvider } from './codeStructureProviderSimplified';

export function activate(context: vscode.ExtensionContext) {
    console.log('代码可视化编程插件已激活');

    // 初始化核心组件
    const codeAnalyzer = new CodeAnalyzer();
    const codeStructureProvider = new CodeStructureProvider();

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

    // 添加到上下文
    context.subscriptions.push(
        openVisualViewCommand,
        analyzeCodeCommand,
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
