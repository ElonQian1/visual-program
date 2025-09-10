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
        if (iconPath) {
            this.iconPath = iconPath;
        } else {
            this.setIconForContextValue(contextValue);
        }
    }
    
    private setIconForContextValue(contextValue?: string) {
        if (!contextValue) {return;}
        
        let icon: vscode.ThemeIcon;
        
        switch (contextValue) {
            case 'function':
                this.iconPath = new vscode.ThemeIcon('symbol-function', new vscode.ThemeColor('symbolIcon.functionForeground'));
                break;
            case 'class':
                this.iconPath = new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('symbolIcon.classForeground'));
                break;
            case 'import':
                this.iconPath = new vscode.ThemeIcon('symbol-namespace', new vscode.ThemeColor('symbolIcon.namespaceForeground'));
                break;
            case 'variable':
                this.iconPath = new vscode.ThemeIcon('symbol-variable', new vscode.ThemeColor('symbolIcon.variableForeground'));
                break;
            case 'reactComponent':
                this.iconPath = new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue'));
                break;
            case 'reactRoute':
                this.iconPath = new vscode.ThemeIcon('symbol-misc', new vscode.ThemeColor('charts.green'));
                break;
            case 'reactContext':
                this.iconPath = new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.purple'));
                break;
            case 'reduxStore':
                this.iconPath = new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.orange'));
                break;
            case 'reactForm':
                this.iconPath = new vscode.ThemeIcon('symbol-field', new vscode.ThemeColor('charts.yellow'));
                break;
            case 'apiCall':
                this.iconPath = new vscode.ThemeIcon('cloud', new vscode.ThemeColor('charts.red'));
                break;
            case 'rustStruct':
                this.iconPath = new vscode.ThemeIcon('symbol-struct', new vscode.ThemeColor('charts.orange'));
                break;
            case 'rustEnum':
                this.iconPath = new vscode.ThemeIcon('symbol-enum', new vscode.ThemeColor('charts.green'));
                break;
            case 'rustTrait':
                this.iconPath = new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.purple'));
                break;
            case 'rustImpl':
                this.iconPath = new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.blue'));
                break;
            case 'rustWebHandler':
                this.iconPath = new vscode.ThemeIcon('globe', new vscode.ThemeColor('charts.red'));
                break;
            case 'rustDbModel':
                this.iconPath = new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.green'));
                break;
            case 'rustAsyncTask':
                this.iconPath = new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'));
                break;
            case 'rustErrorType':
                this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
                break;
            case 'rustConfig':
                this.iconPath = new vscode.ThemeIcon('gear', new vscode.ThemeColor('charts.blue'));
                break;
            case 'rustTest':
                this.iconPath = new vscode.ThemeIcon('beaker', new vscode.ThemeColor('charts.green'));
                break;
            case 'rustMacro':
                this.iconPath = new vscode.ThemeIcon('symbol-operator', new vscode.ThemeColor('charts.purple'));
                break;
            case 'rustLifetime':
                this.iconPath = new vscode.ThemeIcon('symbol-parameter', new vscode.ThemeColor('charts.orange'));
                break;
            case 'reactStateFlow':
                this.iconPath = new vscode.ThemeIcon('arrow-both', new vscode.ThemeColor('charts.blue'));
                break;
            case 'reactCommunication':
                this.iconPath = new vscode.ThemeIcon('radio-tower', new vscode.ThemeColor('charts.green'));
                break;
            case 'reactDataBinding':
                this.iconPath = new vscode.ThemeIcon('link', new vscode.ThemeColor('charts.orange'));
                break;
            case 'reactPerformance':
                this.iconPath = new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.red'));
                break;
            case 'rustOptimization':
                this.iconPath = new vscode.ThemeIcon('rocket', new vscode.ThemeColor('charts.yellow'));
                break;
            case 'rustArchitecture':
                this.iconPath = new vscode.ThemeIcon('organization', new vscode.ThemeColor('charts.purple'));
                break;
            case 'rustResource':
                this.iconPath = new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.green'));
                break;
            case 'reactHook':
                this.iconPath = new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.blue'));
                break;
            case 'rustAsyncNetwork':
                this.iconPath = new vscode.ThemeIcon('cloud', new vscode.ThemeColor('charts.cyan'));
                break;
            case 'rustConcurrency':
                this.iconPath = new vscode.ThemeIcon('symbol-thread', new vscode.ThemeColor('charts.orange'));
                break;
            case 'rustAsync':
                this.iconPath = new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'));
                break;
            case 'reactStateManagement':
                this.iconPath = new vscode.ThemeIcon('symbol-property', new vscode.ThemeColor('charts.purple'));
                break;
            case 'reactRedux':
                this.iconPath = new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.red'));
                break;
            case 'reactZustand':
                this.iconPath = new vscode.ThemeIcon('symbol-object', new vscode.ThemeColor('charts.green'));
                break;
            case 'reactRecoil':
                this.iconPath = new vscode.ThemeIcon('atom', new vscode.ThemeColor('charts.blue'));
                break;
            case 'rustPerformanceAnalysis':
                this.iconPath = new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.red'));
                break;
            case 'rustMemoryAnalysis':
                this.iconPath = new vscode.ThemeIcon('symbol-array', new vscode.ThemeColor('charts.orange'));
                break;
            case 'rustCpuAnalysis':
                this.iconPath = new vscode.ThemeIcon('cpu', new vscode.ThemeColor('charts.yellow'));
                break;
            case 'rustIoAnalysis':
                this.iconPath = new vscode.ThemeIcon('symbol-file', new vscode.ThemeColor('charts.green'));
                break;
            case 'rustNetworkAnalysis':
                this.iconPath = new vscode.ThemeIcon('globe', new vscode.ThemeColor('charts.blue'));
                break;
            case 'rustAlgorithmicAnalysis':
                this.iconPath = new vscode.ThemeIcon('symbol-ruler', new vscode.ThemeColor('charts.purple'));
                break;
            case 'optimizationStrategy':
                this.iconPath = new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor('charts.yellow'));
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('circle-filled');
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

    getChildren(element?: StructureItem): Promise<StructureItem[]> {
        if (!this.codeAnalysis) {
            return Promise.resolve([]);
        }

        if (!element) {
            // 根节点
            const rootItems: StructureItem[] = [];

            // 添加基础结构
            rootItems.push(new StructureItem(
                '导入模块',
                vscode.TreeItemCollapsibleState.Collapsed, 
                'imports',
                new vscode.ThemeIcon('symbol-namespace')
            ));

            if (this.codeAnalysis.functions && this.codeAnalysis.functions.length > 0) {
                rootItems.push(new StructureItem(
                    '函数',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'functions',
                    new vscode.ThemeIcon('symbol-function')
                ));
            }

            if (this.codeAnalysis.classes && this.codeAnalysis.classes.length > 0) {
                rootItems.push(new StructureItem(
                    '类',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'classes',
                    new vscode.ThemeIcon('symbol-class')
                ));
            }

            if (this.codeAnalysis.variables && this.codeAnalysis.variables.length > 0) {
                rootItems.push(new StructureItem(
                    '变量',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'variables',
                    new vscode.ThemeIcon('symbol-variable')
                ));
            }

            // React相关分析
            if (this.codeAnalysis.reactComponents && this.codeAnalysis.reactComponents.length > 0) {
                rootItems.push(new StructureItem(
                    'React 组件',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reactComponents',
                    new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue'))
                ));
            }

            if (this.codeAnalysis.reactRoutes && this.codeAnalysis.reactRoutes.length > 0) {
                rootItems.push(new StructureItem(
                    'React 路由',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reactRoutes',
                    new vscode.ThemeIcon('symbol-misc', new vscode.ThemeColor('charts.green'))
                ));
            }

            if (this.codeAnalysis.reactContexts && this.codeAnalysis.reactContexts.length > 0) {
                rootItems.push(new StructureItem(
                    'React 上下文',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reactContexts',
                    new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.purple'))
                ));
            }

            if (this.codeAnalysis.reduxStores && this.codeAnalysis.reduxStores.length > 0) {
                rootItems.push(new StructureItem(
                    'Redux 存储',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reduxStores',
                    new vscode.ThemeIcon('database', new vscode.ThemeColor('charts.orange'))
                ));
            }

            if (this.codeAnalysis.reactForms && this.codeAnalysis.reactForms.length > 0) {
                rootItems.push(new StructureItem(
                    'React 表单',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reactForms',
                    new vscode.ThemeIcon('symbol-field', new vscode.ThemeColor('charts.yellow'))
                ));
            }

            if (this.codeAnalysis.apiCalls && this.codeAnalysis.apiCalls.length > 0) {
                rootItems.push(new StructureItem(
                    'API 调用',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'apiCalls',
                    new vscode.ThemeIcon('cloud', new vscode.ThemeColor('charts.red'))
                ));
            }

            // React Hook分析
            if (this.codeAnalysis.reactHooks) {
                rootItems.push(new StructureItem(
                    'React Hooks',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reactHooks',
                    new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.blue'))
                ));
            }

            // React高级分析
            if (this.codeAnalysis.reactAdvancedState) {
                rootItems.push(new StructureItem(
                    'React 状态管理',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reactAdvancedState',
                    new vscode.ThemeIcon('arrow-both', new vscode.ThemeColor('charts.blue'))
                ));
            }

            if (this.codeAnalysis.reactRuntime) {
                rootItems.push(new StructureItem(
                    'React 运行时',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'reactRuntime',
                    new vscode.ThemeIcon('debug', new vscode.ThemeColor('charts.purple'))
                ));
            }

            // Rust相关分析
            if (this.codeAnalysis.rustStructs && this.codeAnalysis.rustStructs.length > 0) {
                rootItems.push(new StructureItem(
                    'Rust 结构体',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'rustStructs',
                    new vscode.ThemeIcon('symbol-struct', new vscode.ThemeColor('charts.orange'))
                ));
            }

            if (this.codeAnalysis.rustEnums && this.codeAnalysis.rustEnums.length > 0) {
                rootItems.push(new StructureItem(
                    'Rust 枚举',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'rustEnums',
                    new vscode.ThemeIcon('symbol-enum', new vscode.ThemeColor('charts.green'))
                ));
            }

            if (this.codeAnalysis.rustTraits && this.codeAnalysis.rustTraits.length > 0) {
                rootItems.push(new StructureItem(
                    'Rust 特征',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'rustTraits',
                    new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.purple'))
                ));
            }

            if (this.codeAnalysis.rustImpls && this.codeAnalysis.rustImpls.length > 0) {
                rootItems.push(new StructureItem(
                    'Rust 实现',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'rustImpls',
                    new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.blue'))
                ));
            }

            if (this.codeAnalysis.rustWebHandlers && this.codeAnalysis.rustWebHandlers.length > 0) {
                rootItems.push(new StructureItem(
                    'Rust Web 处理器',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'rustWebHandlers',
                    new vscode.ThemeIcon('globe', new vscode.ThemeColor('charts.red'))
                ));
            }

            if (this.codeAnalysis.rustAsyncTasks && this.codeAnalysis.rustAsyncTasks.length > 0) {
                rootItems.push(new StructureItem(
                    'Rust 异步任务',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'rustAsyncTasks',
                    new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'))
                ));
            }

            // Rust异步网络分析
            if (this.codeAnalysis.rustAsyncNetwork) {
                rootItems.push(new StructureItem(
                    'Rust 异步网络',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'rustAsyncNetwork',
                    new vscode.ThemeIcon('cloud', new vscode.ThemeColor('charts.cyan'))
                ));
            }

            // Rust高级系统分析
            if (this.codeAnalysis.rustAdvancedSystem) {
                rootItems.push(new StructureItem(
                    'Rust 系统分析',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'rustSystemAnalysis',
                    new vscode.ThemeIcon('organization', new vscode.ThemeColor('charts.purple'))
                ));
            }

            return Promise.resolve(rootItems);
        } else {
            // 子节点
            return this.getChildItems(element);
        }
    }

    private async getChildItems(element: StructureItem): Promise<StructureItem[]> {
        if (!this.codeAnalysis) {
            return [];
        }

        switch (element.contextValue) {
            case 'imports':
                return this.getImportItems();
            case 'functions':
                return this.getFunctionItems();
            case 'classes':
                return this.getClassItems();
            case 'variables':
                return this.getVariableItems();
            case 'reactComponents':
                return this.getReactComponentItems();
            case 'reactRoutes':
                return this.getReactRouteItems();
            case 'reactContexts':
                return this.getReactContextItems();
            case 'reduxStores':
                return this.getReduxStoreItems();
            case 'reactForms':
                return this.getReactFormItems();
            case 'apiCalls':
                return this.getApiCallItems();
            case 'reactHooks':
                return this.getReactHookItems();
            case 'reactAdvancedState':
                return this.getReactAdvancedStateItems();
            case 'reactRuntime':
                return this.getReactRuntimeItems();
            case 'rustStructs':
                return this.getRustStructItems();
            case 'rustEnums':
                return this.getRustEnumItems();
            case 'rustTraits':
                return this.getRustTraitItems();
            case 'rustImpls':
                return this.getRustImplItems();
            case 'rustWebHandlers':
                return this.getRustWebHandlerItems();
            case 'rustAsyncTasks':
                return this.getRustAsyncTaskItems();
            case 'rustAsyncNetwork':
                return this.getRustAsyncNetworkItems();
            case 'rustSystemAnalysis':
                return this.getRustSystemAnalysisItems();
            default:
                return [];
        }
    }

    // React Hook分析项
    private getReactHookItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactHooks) {return [];}

        const items: StructureItem[] = [];
        
        // useState hooks
        if (this.codeAnalysis.reactHooks.stateHooks.length > 0) {
            items.push(new StructureItem(
                `状态钩子 (${this.codeAnalysis.reactHooks.stateHooks.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactStateHooks',
                new vscode.ThemeIcon('symbol-field', new vscode.ThemeColor('charts.blue'))
            ));
        }

        // useEffect hooks
        if (this.codeAnalysis.reactHooks.effectHooks.length > 0) {
            items.push(new StructureItem(
                `副作用钩子 (${this.codeAnalysis.reactHooks.effectHooks.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactEffectHooks',
                new vscode.ThemeIcon('symbol-event', new vscode.ThemeColor('charts.green'))
            ));
        }

        // useContext hooks
        if (this.codeAnalysis.reactHooks.contextHooks.length > 0) {
            items.push(new StructureItem(
                `上下文钩子 (${this.codeAnalysis.reactHooks.contextHooks.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactContextHooks',
                new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.purple'))
            ));
        }

        // Custom hooks
        if (this.codeAnalysis.reactHooks.customHooks.length > 0) {
            items.push(new StructureItem(
                `自定义钩子 (${this.codeAnalysis.reactHooks.customHooks.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactCustomHooks',
                new vscode.ThemeIcon('symbol-method', new vscode.ThemeColor('charts.orange'))
            ));
        }

        // Performance hooks
        if (this.codeAnalysis.reactHooks.performanceHooks.length > 0) {
            items.push(new StructureItem(
                `性能钩子 (${this.codeAnalysis.reactHooks.performanceHooks.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'reactPerformanceHooks',
                new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.red'))
            ));
        }

        return items;
    }

    // Rust异步网络分析项
    private getRustAsyncNetworkItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustAsyncNetwork) {return [];}

        const items: StructureItem[] = [];
        const analysis = this.codeAnalysis.rustAsyncNetwork;

        // 异步模式
        if (analysis.asyncPatterns.length > 0) {
            items.push(new StructureItem(
                `异步模式 (${analysis.asyncPatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustAsyncPatterns',
                new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'))
            ));
        }

        // Tokio分析
        if (analysis.tokioAnalysis) {
            items.push(new StructureItem(
                'Tokio 运行时分析',
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustTokioAnalysis',
                new vscode.ThemeIcon('gear', new vscode.ThemeColor('charts.blue'))
            ));
        }

        // 网络模式
        if (analysis.networkingPatterns.length > 0) {
            items.push(new StructureItem(
                `网络模式 (${analysis.networkingPatterns.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustNetworkPatterns',
                new vscode.ThemeIcon('cloud', new vscode.ThemeColor('charts.cyan'))
            ));
        }

        // 并发分析
        if (analysis.concurrencyAnalysis) {
            items.push(new StructureItem(
                '并发分析',
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustConcurrencyAnalysis',
                new vscode.ThemeIcon('symbol-thread', new vscode.ThemeColor('charts.orange'))
            ));
        }

        // 性能指标
        if (analysis.performanceMetrics) {
            items.push(new StructureItem(
                '异步性能指标',
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustAsyncPerformance',
                new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('charts.red'))
            ));
        }

        // 优化建议
        if (analysis.optimizationSuggestions.length > 0) {
            items.push(new StructureItem(
                `异步优化建议 (${analysis.optimizationSuggestions.length})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'rustAsyncOptimizations',
                new vscode.ThemeIcon('lightbulb', new vscode.ThemeColor('charts.green'))
            ));
        }

        return items;
    }

    // 其他项目获取方法 - 简化实现
    private getImportItems(): StructureItem[] {
        if (!this.codeAnalysis?.imports) {return [];}
        
        return this.codeAnalysis.imports.map(imp =>
            new StructureItem(
                imp.moduleName,
                vscode.TreeItemCollapsibleState.None,
                'import',
                new vscode.ThemeIcon('symbol-namespace'),
                imp.importedItems.join(', '),
                `导入: ${imp.importedItems.join(', ')}`,
                {
                    command: 'vscode.open',
                    title: '跳转到定义',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(imp.line - 1, 0)]
                }
            )
        );
    }

    private getFunctionItems(): StructureItem[] {
        if (!this.codeAnalysis?.functions) {return [];}
        
        return this.codeAnalysis.functions.map(func =>
            new StructureItem(
                func.displayName,
                vscode.TreeItemCollapsibleState.None,
                'function',
                new vscode.ThemeIcon('symbol-function'),
                func.returnType,
                func.description,
                {
                    command: 'vscode.open',
                    title: '跳转到函数',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(func.line - 1, func.column)]
                }
            )
        );
    }

    private getClassItems(): StructureItem[] {
        if (!this.codeAnalysis?.classes) {return [];}
        
        return this.codeAnalysis.classes.map(cls =>
            new StructureItem(
                cls.displayName,
                vscode.TreeItemCollapsibleState.None,
                'class',
                new vscode.ThemeIcon('symbol-class'),
                `${cls.methods.length} 方法, ${cls.properties.length} 属性`,
                `类: ${cls.displayName}`,
                {
                    command: 'vscode.open',
                    title: '跳转到类',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(cls.line - 1, cls.column)]
                }
            )
        );
    }

    private getVariableItems(): StructureItem[] {
        if (!this.codeAnalysis?.variables) {return [];}
        
        return this.codeAnalysis.variables.map(vari =>
            new StructureItem(
                vari.name,
                vscode.TreeItemCollapsibleState.None,
                'variable',
                new vscode.ThemeIcon('symbol-variable'),
                vari.type,
                `变量: ${vari.name} (${vari.type})`,
                {
                    command: 'vscode.open',
                    title: '跳转到变量',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(vari.line - 1, 0)]
                }
            )
        );
    }

    private getReactComponentItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactComponents) {return [];}
        
        return this.codeAnalysis.reactComponents.map(component => {
            const propsCount = component.props?.length || 0;
            const hooksCount = component.hooks?.length || 0;
            const detailText = propsCount > 0 || hooksCount > 0 ? 
                ` (${propsCount} props, ${hooksCount} hooks)` : '';
            const typeText = component.type === 'functional' ? '函数组件' : '类组件';
            
            return new StructureItem(
                `${component.displayName}${detailText}`,
                vscode.TreeItemCollapsibleState.None,
                'reactComponent',
                new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue')),
                typeText,
                `${typeText}: ${component.displayName}`,
                {
                    command: 'vscode.open',
                    title: '跳转到组件',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(component.line - 1, 0)]
                }
            );
        });
    }

    // 其他方法的简化实现
    private getReactRouteItems(): StructureItem[] { return []; }
    private getReactContextItems(): StructureItem[] { return []; }
    private getReduxStoreItems(): StructureItem[] { return []; }
    private getReactFormItems(): StructureItem[] { return []; }
    private getApiCallItems(): StructureItem[] { return []; }
    private getReactAdvancedStateItems(): StructureItem[] { return []; }
    private getReactRuntimeItems(): StructureItem[] { return []; }
    private getRustStructItems(): StructureItem[] { return []; }
    private getRustEnumItems(): StructureItem[] { return []; }
    private getRustTraitItems(): StructureItem[] { return []; }
    private getRustImplItems(): StructureItem[] { return []; }
    private getRustWebHandlerItems(): StructureItem[] { return []; }
    private getRustAsyncTaskItems(): StructureItem[] { return []; }
    private getRustSystemAnalysisItems(): StructureItem[] { return []; }
}
