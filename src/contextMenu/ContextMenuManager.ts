/**
 * 右键菜单管理器 - 统一管理所有上下文菜单功能
 */
import * as vscode from 'vscode';
import { ReactMenuHandler } from './handlers/ReactMenuHandler';
import { RustMenuHandler } from './handlers/RustMenuHandler';
import { GeneralMenuHandler } from './handlers/GeneralMenuHandler';
import { AdvancedMenuHandler } from './handlers/AdvancedMenuHandler';

export class ContextMenuManager {
    private reactHandler: ReactMenuHandler;
    private rustHandler: RustMenuHandler;
    private generalHandler: GeneralMenuHandler;
    private advancedHandler: AdvancedMenuHandler;

    constructor() {
        this.reactHandler = new ReactMenuHandler();
        this.rustHandler = new RustMenuHandler();
        this.generalHandler = new GeneralMenuHandler();
        this.advancedHandler = new AdvancedMenuHandler();
    }

    /**
     * 注册所有菜单命令
     */
    registerCommands(context: vscode.ExtensionContext): void {
        // React 菜单命令
        this.reactHandler.registerCommands(context);
        
        // Rust 菜单命令
        this.rustHandler.registerCommands(context);
        
        // 通用菜单命令
        this.generalHandler.registerCommands(context);
        
        // 高级功能菜单命令
        this.advancedHandler.registerCommands(context);
    }

    /**
     * 获取文件类型
     */
    private getFileType(document: vscode.TextDocument): 'react' | 'rust' | 'typescript' | 'javascript' | 'unknown' {
        const extension = document.fileName.split('.').pop()?.toLowerCase();
        
        switch (extension) {
            case 'tsx':
            case 'jsx':
                return 'react';
            case 'rs':
                return 'rust';
            case 'ts':
                return 'typescript';
            case 'js':
                return 'javascript';
            default:
                return 'unknown';
        }
    }

    /**
     * 检查文件是否包含React代码
     */
    private isReactFile(text: string): boolean {
        return text.includes('import React') || 
               text.includes('from \'react\'') ||
               text.includes('useState') ||
               text.includes('useEffect') ||
               text.includes('JSX.Element') ||
               text.includes('<div') || 
               text.includes('React.FC');
    }

    /**
     * 显示快速选择菜单（备用方案）
     */
    async showQuickPickMenu(document?: vscode.TextDocument): Promise<void> {
        if (!document) {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showErrorMessage('请先打开一个文件');
                return;
            }
            document = activeEditor.document;
        }

        const fileType = this.getFileType(document);
        const isReact = this.isReactFile(document.getText());
        
        const items: vscode.QuickPickItem[] = [];
        
        // 根据文件类型显示相应菜单
        if (fileType === 'react' || isReact) {
            items.push(
                { label: '⚛️ 深度分析React项目', description: '分析React组件、Hook、性能等' },
                { label: '⚡ 优化React性能', description: '生成React性能优化建议' },
                { label: '🚀 生成React组件', description: '智能生成React组件代码' },
                { label: '🏗️ 可视化React架构', description: '显示React项目架构图' }
            );
        }
        
        if (fileType === 'rust') {
            items.push(
                { label: '🦀 深度分析Rust项目', description: '分析Rust结构、性能、安全等' },
                { label: '⚡ 优化Rust性能', description: '生成Rust性能优化建议' },
                { label: '🚀 生成Rust代码', description: '智能生成Rust代码' },
                { label: '🏗️ 可视化Rust架构', description: '显示Rust项目架构图' }
            );
        }
        
        // 通用功能
        items.push(
            { label: '🔍 分析代码结构', description: '基础代码结构分析' },
            { label: '💡 智能代码生成', description: '通用代码生成功能' },
            { label: '🎨 打开蓝图编辑器', description: '可视化代码设计工具' },
            { label: '📊 显示分析可视化', description: '显示详细分析结果' },
            { label: '🧠 AI增强分析', description: '使用AI进行深度分析' },
            { label: '🤝 启动实时协作', description: '开启多用户协作模式' }
        );

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '选择要执行的可视化分析功能'
        });

        if (selected) {
            await this.executeCommand(selected.label, document);
        }
    }

    /**
     * 执行选中的命令
     */
    private async executeCommand(label: string, document: vscode.TextDocument): Promise<void> {
        const commandMap: { [key: string]: string } = {
            '⚛️ 深度分析React项目': 'visualProgramming.analyzeReactProject',
            '⚡ 优化React性能': 'visualProgramming.optimizeReactPerformance',
            '🚀 生成React组件': 'visualProgramming.generateReactComponents',
            '🏗️ 可视化React架构': 'visualProgramming.visualizeReactArchitecture',
            '🦀 深度分析Rust项目': 'visualProgramming.analyzeRustProject',
            '⚡ 优化Rust性能': 'visualProgramming.optimizeRustPerformance',
            '🚀 生成Rust代码': 'visualProgramming.generateRustCode',
            '🏗️ 可视化Rust架构': 'visualProgramming.visualizeRustArchitecture',
            '🔍 分析代码结构': 'visualProgramming.analyzeCode',
            '💡 智能代码生成': 'visualProgramming.generateCode',
            '🎨 打开蓝图编辑器': 'visualProgramming.openBlueprintEditor',
            '📊 显示分析可视化': 'visualProgramming.showAnalysisVisualization',
            '🧠 AI增强分析': 'visualProgramming.aiEnhancedAnalysis',
            '🤝 启动实时协作': 'visualProgramming.startCollaboration'
        };

        const command = commandMap[label];
        if (command) {
            await vscode.commands.executeCommand(command);
        }
    }
}