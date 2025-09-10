import * as vscode from 'vscode';
import { CodeAnalysis } from './codeAnalyzer';

// 代码结构树项
export class StructureItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        iconPath?: vscode.ThemeIcon,
        public readonly description?: string,
        public readonly tooltip?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        this.description = description;
        this.tooltip = tooltip;
        this.command = command;
        
        // 设置图标颜色
        this.iconPath = iconPath || this.getIconForContextValue(contextValue);
    }
    
    private getIconForContextValue(contextValue?: string): vscode.ThemeIcon {
        if (!contextValue) {return new vscode.ThemeIcon('circle-filled');}
        
        switch (contextValue) {
            case 'function':
                return new vscode.ThemeIcon('symbol-function', new vscode.ThemeColor('symbolIcon.functionForeground'));
            case 'class':
                return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('symbolIcon.classForeground'));
            case 'reactComponent':
                return new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue'));
            case 'reactStateManagement':
                return new vscode.ThemeIcon('symbol-property', new vscode.ThemeColor('charts.purple'));
            case 'rustPerformanceAnalysis':
                return new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.red'));
            case 'optimizationStrategy':
                return new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor('charts.yellow'));
            default:
                return new vscode.ThemeIcon('circle-filled');
        }
    }
}

// 代码结构提供器
export class CodeStructureProvider implements vscode.TreeDataProvider<StructureItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StructureItem | undefined | null | void> = new vscode.EventEmitter<StructureItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StructureItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private codeAnalysis: CodeAnalysis | undefined;

    constructor() {}

    refresh(codeAnalysis?: CodeAnalysis): void {
        this.codeAnalysis = codeAnalysis;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StructureItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StructureItem): Thenable<StructureItem[]> {
        if (!this.codeAnalysis) {
            return Promise.resolve([]);
        }

        if (!element) {
            // 根级别项
            return Promise.resolve(this.getRootItems());
        } else {
            // 子级项
            return Promise.resolve(this.getChildItems(element));
        }
    }

    private getRootItems(): StructureItem[] {
        const items: StructureItem[] = [];

        if (!this.codeAnalysis) {
            return items;
        }

        // 基础代码结构
        if (this.codeAnalysis.functions.length > 0) {
            items.push(new StructureItem(
                `函数 (${this.codeAnalysis.functions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'functionGroup'
            ));
        }

        // React组件分析
        if (this.codeAnalysis.reactComponents?.length) {
            items.push(new StructureItem(
                `React组件 (${this.codeAnalysis.reactComponents.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactComponentGroup'
            ));
        }

        // React状态管理
        if (this.codeAnalysis.reactStateManagement) {
            items.push(new StructureItem(
                'React状态管理分析',
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactStateManagementGroup'
            ));
        }

        // React Hooks
        if (this.codeAnalysis.reactHooks) {
            const totalHooks = (this.codeAnalysis.reactHooks.stateHooks?.length || 0) + 
                              (this.codeAnalysis.reactHooks.effectHooks?.length || 0) + 
                              (this.codeAnalysis.reactHooks.customHooks?.length || 0);
            items.push(new StructureItem(
                `React Hooks (${totalHooks})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactHookGroup'
            ));
        }

        // Rust结构体
        if (this.codeAnalysis.rustStructs?.length) {
            items.push(new StructureItem(
                `Rust结构体 (${this.codeAnalysis.rustStructs.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustStructGroup'
            ));
        }

        // Rust性能分析
        if (this.codeAnalysis.rustDetailedPerformance) {
            items.push(new StructureItem(
                'Rust性能分析',
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustPerformanceGroup'
            ));
        }

        // Rust异步网络
        if (this.codeAnalysis.rustAsyncNetwork) {
            items.push(new StructureItem(
                'Rust异步网络分析',
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustAsyncNetworkGroup'
            ));
        }

        return items;
    }

    private getChildItems(element: StructureItem): StructureItem[] {
        const items: StructureItem[] = [];

        if (!this.codeAnalysis) {
            return items;
        }

        switch (element.contextValue) {
            case 'functionGroup':
                return this.codeAnalysis.functions.map(func => new StructureItem(
                    `${func.displayName || func.name}`,
                    vscode.TreeItemCollapsibleState.None,
                    'function',
                    undefined,
                    `行 ${func.line}`,
                    func.description
                ));

            case 'reactComponentGroup':
                return this.codeAnalysis.reactComponents?.map(comp => new StructureItem(
                    comp.name,
                    vscode.TreeItemCollapsibleState.None,
                    'reactComponent',
                    undefined,
                    `${comp.type} - 行 ${comp.line}`,
                    `React组件: ${comp.name}`
                )) || [];

            case 'reactStateManagementGroup':
                return this.getReactStateManagementItems();

            case 'reactHookGroup':
                return this.getReactHookItems();

            case 'rustStructGroup':
                return this.codeAnalysis.rustStructs?.map(struct => new StructureItem(
                    struct.name,
                    vscode.TreeItemCollapsibleState.None,
                    'rustStruct',
                    undefined,
                    `行 ${struct.line}`,
                    `Rust结构体: ${struct.name}`
                )) || [];

            case 'rustPerformanceGroup':
                return this.getRustPerformanceItems();

            case 'rustAsyncNetworkGroup':
                return this.getRustAsyncNetworkItems();

            default:
                return [];
        }
    }

    private getReactStateManagementItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.reactStateManagement;

        if (!analysis) {return items;}

        // 状态架构
        items.push(new StructureItem(
            `状态架构: ${analysis.stateArchitecture.architectureType}`,
            vscode.TreeItemCollapsibleState.None,
            'reactStateArchitecture',
            undefined,
            `复杂度: ${analysis.stateArchitecture.complexity}`,
            '状态管理架构分析'
        ));

        // 优化建议
        if (analysis.optimizationSuggestions.length > 0) {
            items.push(new StructureItem(
                `优化建议 (${analysis.optimizationSuggestions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'optimizationStrategy',
                undefined,
                `${analysis.optimizationSuggestions.length}个建议`,
                '状态管理优化建议'
            ));
        }

        return items;
    }

    private getReactHookItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const hooks = this.codeAnalysis?.reactHooks;

        if (!hooks) {return items;}

        // 状态Hooks
        hooks.stateHooks?.forEach(hook => {
            items.push(new StructureItem(
                `${hook.stateName} (${hook.hookType})`,
                vscode.TreeItemCollapsibleState.None,
                'reactHook',
                undefined,
                `行 ${hook.line}`,
                `状态Hook: ${hook.stateName}`
            ));
        });

        // 副作用Hooks
        hooks.effectHooks?.forEach(hook => {
            items.push(new StructureItem(
                `Effect (${hook.effectType})`,
                vscode.TreeItemCollapsibleState.None,
                'reactHook',
                undefined,
                `行 ${hook.line}`,
                `副作用Hook: ${hook.effectType}`
            ));
        });

        // 自定义Hooks
        hooks.customHooks?.forEach(hook => {
            items.push(new StructureItem(
                `${hook.hookName} (自定义)`,
                vscode.TreeItemCollapsibleState.None,
                'reactHook',
                undefined,
                `行 ${hook.line}`,
                `自定义Hook: ${hook.hookName}`
            ));
        });

        return items;
    }

    private getRustPerformanceItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.rustDetailedPerformance;

        if (!analysis) {return items;}

        // 内存分析
        items.push(new StructureItem(
            '内存性能分析',
            vscode.TreeItemCollapsibleState.None,
            'rustMemoryAnalysis',
            undefined,
            `堆使用: ${analysis.memoryAnalysis.heapUsage.totalAllocations}次分配`,
            '内存使用和分配模式分析'
        ));

        // CPU分析
        items.push(new StructureItem(
            'CPU性能分析',
            vscode.TreeItemCollapsibleState.None,
            'rustCpuAnalysis',  
            undefined,
            `热点: ${analysis.cpuAnalysis.hotspots.length}个`,
            'CPU使用和性能瓶颈分析'
        ));

        // 优化策略
        if (analysis.optimizationStrategies.length > 0) {
            items.push(new StructureItem(
                `优化策略 (${analysis.optimizationStrategies.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'optimizationStrategy',
                undefined,
                `${analysis.optimizationStrategies.length}个优化建议`,
                '性能优化策略和建议'
            ));
        }

        return items;
    }

    private getRustAsyncNetworkItems(): StructureItem[] {
        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis?.rustAsyncNetwork;

        if (!analysis) {return items;}

        // 异步模式
        if (analysis.asyncPatterns?.length > 0) {
            items.push(new StructureItem(
                `异步模式 (${analysis.asyncPatterns.length})`,
                vscode.TreeItemCollapsibleState.None,
                'rustAsync',
                undefined,
                `${analysis.asyncPatterns.length}个模式`,
                '异步编程模式分析'
            ));
        }

        // 网络模式
        if (analysis.networkingPatterns?.length > 0) {
            items.push(new StructureItem(
                `网络模式 (${analysis.networkingPatterns.length})`,
                vscode.TreeItemCollapsibleState.None,
                'rustAsyncNetwork',
                undefined,
                `${analysis.networkingPatterns.length}个模式`,
                '网络通信模式分析'
            ));
        }

        return items;
    }
}
