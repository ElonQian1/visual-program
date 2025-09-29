import * as vscode from 'vscode';
import { runWithDocumentContext } from '../utils/commandRunner';

/**
 * Rust 上下文菜单处理器 —— 为资源右键菜单提供 Rust 相关功能。
 */
export class RustMenuHandler {
    private static readonly ANALYZE_COMMAND = 'visualProgramming.analyzeRustProject';
    private static readonly OPTIMIZE_COMMAND = 'visualProgramming.optimizeRustPerformance';
    private static readonly GENERATE_CODE_COMMAND = 'visualProgramming.generateRustCode';
    private static readonly VISUALIZE_ARCHITECTURE_COMMAND = 'visualProgramming.visualizeRustArchitecture';

    registerCommands(context: vscode.ExtensionContext): void {
        const analyzeRustProject = vscode.commands.registerCommand(
            'visualProgramming.context.rust.analyzeProject',
            async (resource?: vscode.Uri) => {
                await runWithDocumentContext(RustMenuHandler.ANALYZE_COMMAND, resource);
            }
        );

        const optimizeRustPerformance = vscode.commands.registerCommand(
            'visualProgramming.context.rust.optimizePerformance',
            async (resource?: vscode.Uri) => {
                await runWithDocumentContext(RustMenuHandler.OPTIMIZE_COMMAND, resource);
            }
        );

        const generateRustCode = vscode.commands.registerCommand(
            'visualProgramming.context.rust.generateCode',
            async (resource?: vscode.Uri) => {
                if (resource) {
                    await runWithDocumentContext(RustMenuHandler.GENERATE_CODE_COMMAND, resource);
                } else {
                    await vscode.commands.executeCommand(RustMenuHandler.GENERATE_CODE_COMMAND);
                }
            }
        );

        const visualizeRustArchitecture = vscode.commands.registerCommand(
            'visualProgramming.context.rust.visualizeArchitecture',
            async () => {
                await vscode.commands.executeCommand(RustMenuHandler.VISUALIZE_ARCHITECTURE_COMMAND);
            }
        );

        context.subscriptions.push(
            analyzeRustProject,
            optimizeRustPerformance,
            generateRustCode,
            visualizeRustArchitecture
        );
    }
}