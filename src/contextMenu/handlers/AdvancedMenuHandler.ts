import * as vscode from 'vscode';
import { ensureDocumentVisible, runWithDocumentContext } from '../utils/commandRunner';

export interface AdvancedMenuHandlerOptions {
    showKidFriendlyCard?: (resource?: vscode.Uri) => Promise<void>;
    showSeniorStudentCard?: (resource?: vscode.Uri) => Promise<void>;
}

/**
 * 高级功能上下文菜单处理器 —— 封装蓝图编辑、可视化及协作等高级命令。
 */
export class AdvancedMenuHandler {
    private static readonly BLUEPRINT_COMMAND = 'visualProgramming.openBlueprintEditor';
    private static readonly VISUALIZATION_COMMAND = 'visualProgramming.openAnalysisVisualization';
    private static readonly AI_ANALYSIS_COMMAND = 'visualProgramming.aiEnhancedAnalysis';
    private static readonly REALTIME_SYNC_COMMAND = 'visualProgramming.startRealTimeSync';

    constructor(private readonly options: AdvancedMenuHandlerOptions = {}) {}

    registerCommands(context: vscode.ExtensionContext): void {
        const openBlueprintEditor = vscode.commands.registerCommand(
            'visualProgramming.context.advanced.openBlueprint',
            async (resource?: vscode.Uri) => {
                if (resource) {
                    await ensureDocumentVisible(resource);
                }
                await vscode.commands.executeCommand(AdvancedMenuHandler.BLUEPRINT_COMMAND);
            }
        );

        const openAnalysisVisualization = vscode.commands.registerCommand(
            'visualProgramming.context.advanced.openVisualization',
            async (resource?: vscode.Uri) => {
                if (resource) {
                    await ensureDocumentVisible(resource);
                }
                await vscode.commands.executeCommand(AdvancedMenuHandler.VISUALIZATION_COMMAND);
            }
        );

        const runAiEnhancedAnalysis = vscode.commands.registerCommand(
            'visualProgramming.context.advanced.aiEnhancedAnalysis',
            async (resource?: vscode.Uri) => {
                await runWithDocumentContext(AdvancedMenuHandler.AI_ANALYSIS_COMMAND, resource);
            }
        );

        const startRealTimeSync = vscode.commands.registerCommand(
            'visualProgramming.context.advanced.startRealTimeSync',
            async (resource?: vscode.Uri) => {
                if (resource) {
                    await ensureDocumentVisible(resource);
                }
                await vscode.commands.executeCommand(AdvancedMenuHandler.REALTIME_SYNC_COMMAND);
            }
        );

        const showKidFriendlyCard = vscode.commands.registerCommand(
            'visualProgramming.context.advanced.showKidFriendlyCard',
            async (resource?: vscode.Uri) => {
                if (this.options.showKidFriendlyCard) {
                    await this.options.showKidFriendlyCard(resource);
                } else {
                    vscode.window.showWarningMessage('儿童友好分析暂未启用');
                }
            }
        );

        const showSeniorStudentCard = vscode.commands.registerCommand(
            'visualProgramming.context.advanced.showSeniorStudentCard',
            async (resource?: vscode.Uri) => {
                if (this.options.showSeniorStudentCard) {
                    await this.options.showSeniorStudentCard(resource);
                } else {
                    vscode.window.showWarningMessage('高年级学生分析暂未启用');
                }
            }
        );

        context.subscriptions.push(
            openBlueprintEditor,
            openAnalysisVisualization,
            runAiEnhancedAnalysis,
            startRealTimeSync,
            showKidFriendlyCard,
            showSeniorStudentCard
        );
    }
}
