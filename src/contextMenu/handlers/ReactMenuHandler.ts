import * as vscode from 'vscode';
import { runWithDocumentContext } from '../utils/commandRunner';

/**
 * React 上下文菜单处理器 —— 为资源右键菜单提供 React 相关功能。
 */
export class ReactMenuHandler {
    private static readonly ANALYZE_COMMAND = 'visualProgramming.analyzeReactProject';
    private static readonly OPTIMIZE_COMMAND = 'visualProgramming.optimizeReactPerformance';
    private static readonly GENERATE_COMPONENT_COMMAND = 'visualProgramming.generateReactComponents';
    private static readonly VISUALIZE_ARCHITECTURE_COMMAND = 'visualProgramming.visualizeReactArchitecture';

    registerCommands(context: vscode.ExtensionContext): void {
        const analyzeReactProject = vscode.commands.registerCommand(
            'visualProgramming.context.react.analyzeProject',
            async (resource?: vscode.Uri) => {
                await runWithDocumentContext(ReactMenuHandler.ANALYZE_COMMAND, resource);
            }
        );

        const optimizeReactPerformance = vscode.commands.registerCommand(
            'visualProgramming.context.react.optimizePerformance',
            async (resource?: vscode.Uri) => {
                await runWithDocumentContext(ReactMenuHandler.OPTIMIZE_COMMAND, resource);
            }
        );

        const generateReactComponents = vscode.commands.registerCommand(
            'visualProgramming.context.react.generateComponents',
            async (resource?: vscode.Uri) => {
                if (resource) {
                    await runWithDocumentContext(ReactMenuHandler.GENERATE_COMPONENT_COMMAND, resource);
                } else {
                    await vscode.commands.executeCommand(ReactMenuHandler.GENERATE_COMPONENT_COMMAND);
                }
            }
        );

        const visualizeReactArchitecture = vscode.commands.registerCommand(
            'visualProgramming.context.react.visualizeArchitecture',
            async () => {
                await vscode.commands.executeCommand(ReactMenuHandler.VISUALIZE_ARCHITECTURE_COMMAND);
            }
        );

        context.subscriptions.push(
            analyzeReactProject,
            optimizeReactPerformance,
            generateReactComponents,
            visualizeReactArchitecture
        );
    }
}