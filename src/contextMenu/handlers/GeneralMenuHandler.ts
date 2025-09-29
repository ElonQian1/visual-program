import * as vscode from 'vscode';
import { ensureDocumentVisible, runWithDocumentContext } from '../utils/commandRunner';

/**
 * 通用上下文菜单处理器 —— 为各类文件提供常见的可视化分析和生成工具。
 */
export class GeneralMenuHandler {
    private static readonly ANALYZE_COMMAND = 'visualProgramming.analyzeCode';
    private static readonly GENERATE_COMMAND = 'visualProgramming.generateCode';
    private static readonly ENHANCED_GENERATE_COMMAND = 'visualProgramming.enhancedCodeGeneration';
    private static readonly OPEN_VISUAL_VIEW_COMMAND = 'visualProgramming.openVisualView';

    registerCommands(context: vscode.ExtensionContext): void {
        const analyzeCode = vscode.commands.registerCommand(
            'visualProgramming.context.general.analyzeCode',
            async (resource?: vscode.Uri) => {
                await runWithDocumentContext(GeneralMenuHandler.ANALYZE_COMMAND, resource);
            }
        );

        const generateCode = vscode.commands.registerCommand(
            'visualProgramming.context.general.generateCode',
            async (resource?: vscode.Uri) => {
                await runWithDocumentContext(GeneralMenuHandler.GENERATE_COMMAND, resource);
            }
        );

        const enhancedGenerate = vscode.commands.registerCommand(
            'visualProgramming.context.general.enhancedGenerate',
            async (resource?: vscode.Uri) => {
                if (resource) {
                    await ensureDocumentVisible(resource);
                }
                await vscode.commands.executeCommand(GeneralMenuHandler.ENHANCED_GENERATE_COMMAND);
            }
        );

        const openVisualView = vscode.commands.registerCommand(
            'visualProgramming.context.general.openVisualView',
            async (resource?: vscode.Uri) => {
                if (resource) {
                    await ensureDocumentVisible(resource);
                }
                await vscode.commands.executeCommand(GeneralMenuHandler.OPEN_VISUAL_VIEW_COMMAND);
            }
        );

        context.subscriptions.push(
            analyzeCode,
            generateCode,
            enhancedGenerate,
            openVisualView
        );
    }
}
