import * as vscode from 'vscode';
import { CodeAnalysis, FunctionInfo, ClassInfo } from './codeAnalyzer';
import { ReactComponent } from './reactAnalyzer';
import { RustStruct, RustEnum, RustTrait, RustFunction } from './rustAnalyzer';
import { 
    ReactRoute, ReactContext, ReduxStore, ReactForm, APICall 
} from './advancedReactAnalyzer';
import { 
    RustWebHandler, RustDbModel, RustAsyncTask, RustErrorType, RustConfig, RustTest 
} from './advancedRustAnalyzer';
import { 
    RustMicroserviceArchitecture, RustDatabaseOptimization, RustConcurrencyOptimization,
    MicroserviceInfo, ServiceCommunication, MonitoringSetup, SecurityPattern,
    QueryAnalysis, ThreadPoolAnalysis, ParallelizationOpportunity
} from './advancedRustMicroserviceAnalyzer';
import { ReactAdvancedArchitectureAnalysis } from './advancedReactArchitectureAnalyzer';
import { RustAdvancedArchitectureAnalysis } from './advancedRustArchitectureAnalyzer';
import { ReactAdvancedStateAnalysis, ComponentCommunicationAnalysis, DataBindingAnalysis } from './advancedReactStateAnalyzer';
import { RustAdvancedSystemAnalysis, RustPerformanceAnalysis, RustSystemArchitecture } from './advancedRustSystemAnalyzer';
import { ReactRuntimeAnalysis, DebuggingAnalysis, TestingAnalysis } from './reactRuntimeAnalyzer';

export class CodeStructureProvider implements vscode.TreeDataProvider<StructureItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StructureItem | undefined | null | void> = new vscode.EventEmitter<StructureItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StructureItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private codeAnalysis: CodeAnalysis | null = null;

    constructor() {}

    updateStructure(analysis: CodeAnalysis): void {
        this.codeAnalysis = analysis;
        this._onDidChangeTreeData.fire();
    }

    refresh(): void {
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
            // 根节�?
            const rootItems: StructureItem[] = [];

            // 添加文件信息
            rootItems.push(new StructureItem(
                `文件: ${this.getFileName(this.codeAnalysis.fileName)}`,
                vscode.TreeItemCollapsibleState.Expanded,
                'file',
                `语言: ${this.getLanguageDisplayName(this.codeAnalysis.language)}`
            ));

            // 添加导入模块
            if (this.codeAnalysis.imports.length > 0) {
                rootItems.push(new StructureItem(
                    `导入模块 (${this.codeAnalysis.imports.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'imports'
                ));
            }

            // 添加函数
            if (this.codeAnalysis.functions.length > 0) {
                rootItems.push(new StructureItem(
                    `函数 (${this.codeAnalysis.functions.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'functions'
                ));
            }

            // 添加React组件
            if (this.codeAnalysis.reactComponents && this.codeAnalysis.reactComponents.length > 0) {
                rootItems.push(new StructureItem(
                    `React组件 (${this.codeAnalysis.reactComponents.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reactComponents'
                ));
            }

            // 添加Rust结构�?
            if (this.codeAnalysis.rustStructs && this.codeAnalysis.rustStructs.length > 0) {
                rootItems.push(new StructureItem(
                    `结构�?(${this.codeAnalysis.rustStructs.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustStructs'
                ));
            }

            // 添加Rust枚举
            if (this.codeAnalysis.rustEnums && this.codeAnalysis.rustEnums.length > 0) {
                rootItems.push(new StructureItem(
                    `枚举 (${this.codeAnalysis.rustEnums.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustEnums'
                ));
            }

            // 添加Rust特征
            if (this.codeAnalysis.rustTraits && this.codeAnalysis.rustTraits.length > 0) {
                rootItems.push(new StructureItem(
                    `特征 (${this.codeAnalysis.rustTraits.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustTraits'
                ));
            }

            // 添加Rust函数
            if (this.codeAnalysis.rustFunctions && this.codeAnalysis.rustFunctions.length > 0) {
                rootItems.push(new StructureItem(
                    `Rust函数 (${this.codeAnalysis.rustFunctions.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustFunctions'
                ));
            }

            // React生态系统分析结�?
            if (this.codeAnalysis.reactRoutes && this.codeAnalysis.reactRoutes.length > 0) {
                rootItems.push(new StructureItem(
                    `🚀 路由配置 (${this.codeAnalysis.reactRoutes.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reactRoutes'
                ));
            }

            if (this.codeAnalysis.reactContexts && this.codeAnalysis.reactContexts.length > 0) {
                rootItems.push(new StructureItem(
                    `🌐 上下文系�?(${this.codeAnalysis.reactContexts.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reactContexts'
                ));
            }

            if (this.codeAnalysis.reduxStores && this.codeAnalysis.reduxStores.length > 0) {
                rootItems.push(new StructureItem(
                    `🏪 Redux存储 (${this.codeAnalysis.reduxStores.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reduxStores'
                ));
            }

            if (this.codeAnalysis.reactForms && this.codeAnalysis.reactForms.length > 0) {
                rootItems.push(new StructureItem(
                    `📝 表单组件 (${this.codeAnalysis.reactForms.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reactForms'
                ));
            }

            if (this.codeAnalysis.apiCalls && this.codeAnalysis.apiCalls.length > 0) {
                rootItems.push(new StructureItem(
                    `📡 API调用 (${this.codeAnalysis.apiCalls.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'apiCalls'
                ));
            }

            // Rust生态系统分析结�?
            if (this.codeAnalysis.rustWebHandlers && this.codeAnalysis.rustWebHandlers.length > 0) {
                rootItems.push(new StructureItem(
                    `🌐 Web处理�?(${this.codeAnalysis.rustWebHandlers.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustWebHandlers'
                ));
            }

            if (this.codeAnalysis.rustDbModels && this.codeAnalysis.rustDbModels.length > 0) {
                rootItems.push(new StructureItem(
                    `🗃�?数据库模�?(${this.codeAnalysis.rustDbModels.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustDbModels'
                ));
            }

            if (this.codeAnalysis.rustAsyncTasks && this.codeAnalysis.rustAsyncTasks.length > 0) {
                rootItems.push(new StructureItem(
                    `�?异步任务 (${this.codeAnalysis.rustAsyncTasks.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustAsyncTasks'
                ));
            }

            if (this.codeAnalysis.rustErrorTypes && this.codeAnalysis.rustErrorTypes.length > 0) {
                rootItems.push(new StructureItem(
                    `�?错误类型 (${this.codeAnalysis.rustErrorTypes.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustErrorTypes'
                ));
            }

            if (this.codeAnalysis.rustConfigs && this.codeAnalysis.rustConfigs.length > 0) {
                rootItems.push(new StructureItem(
                    `⚙️ 配置管理 (${this.codeAnalysis.rustConfigs.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustConfigs'
                ));
            }

            if (this.codeAnalysis.rustTests && this.codeAnalysis.rustTests.length > 0) {
                rootItems.push(new StructureItem(
                    `🧪 测试用例 (${this.codeAnalysis.rustTests.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustTests'
                ));
            }

            // Rust生态系统高级分析结�?
            if (this.codeAnalysis.rustMacros && this.codeAnalysis.rustMacros.length > 0) {
                rootItems.push(new StructureItem(
                    `📝 宏定�?(${this.codeAnalysis.rustMacros.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustMacros'
                ));
            }

            if (this.codeAnalysis.rustLifetimes && this.codeAnalysis.rustLifetimes.length > 0) {
                rootItems.push(new StructureItem(
                    `�?生命周期 (${this.codeAnalysis.rustLifetimes.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustLifetimes'
                ));
            }

            if (this.codeAnalysis.rustConcurrency && (
                this.codeAnalysis.rustConcurrency.channels.length > 0 ||
                this.codeAnalysis.rustConcurrency.mutexes.length > 0 ||
                this.codeAnalysis.rustConcurrency.spawns.length > 0
            )) {
                rootItems.push(new StructureItem(
                    `🔄 并发模式`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustConcurrency'
                ));
            }

            if (this.codeAnalysis.rustPerformance && (
                this.codeAnalysis.rustPerformance.allocations.length > 0 ||
                this.codeAnalysis.rustPerformance.clones.length > 0 ||
                this.codeAnalysis.rustPerformance.benchmarks.length > 0
            )) {
                rootItems.push(new StructureItem(
                    `�?性能分析`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustPerformance'
                ));
            }

            if (this.codeAnalysis.rustSafety && (
                this.codeAnalysis.rustSafety.unsafeBlocks.length > 0 ||
                this.codeAnalysis.rustSafety.unsafeFunctions.length > 0 ||
                this.codeAnalysis.rustSafety.rawPointers.length > 0
            )) {
                rootItems.push(new StructureItem(
                    `🔒 安全分析`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustSafety'
                ));
            }

            // Rust微服务架构分析结�?
            if (this.codeAnalysis.rustMicroserviceArchitecture && 
                this.codeAnalysis.rustMicroserviceArchitecture.services.length > 0) {
                rootItems.push(new StructureItem(
                    `🏗�?微服务架�?(${this.codeAnalysis.rustMicroserviceArchitecture.services.length}个服�?`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustMicroserviceArchitecture'
                ));
            }

            if (this.codeAnalysis.rustDatabaseOptimization && (
                this.codeAnalysis.rustDatabaseOptimization.queries.length > 0 ||
                this.codeAnalysis.rustDatabaseOptimization.migrations.length > 0
            )) {
                rootItems.push(new StructureItem(
                    `🗄�?数据库优�?(${this.codeAnalysis.rustDatabaseOptimization.queries.length}个查�?`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustDatabaseOptimization'
                ));
            }

            if (this.codeAnalysis.rustConcurrencyOptimization && (
                this.codeAnalysis.rustConcurrencyOptimization.threadPools.length > 0 ||
                this.codeAnalysis.rustConcurrencyOptimization.parallelization.length > 0
            )) {
                rootItems.push(new StructureItem(
                    `�?并发优化 (${this.codeAnalysis.rustConcurrencyOptimization.threadPools.length}个线程池)`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustConcurrencyOptimization'
                ));
            }

            // React高级架构分析
            if (this.codeAnalysis.reactAdvancedArchitecture) {
                const arch = this.codeAnalysis.reactAdvancedArchitecture;
                if (arch.architecturePatterns.length > 0) {
                    rootItems.push(new StructureItem(
                        `🏗�?React架构模式 (${arch.architecturePatterns.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'reactArchitecturePatterns'
                    ));
                }
                if (arch.componentHierarchy.length > 0) {
                    rootItems.push(new StructureItem(
                        `🌳 组件层次结构 (${arch.componentHierarchy.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'reactComponentHierarchy'
                    ));
                }
                if (arch.stateManagement.length > 0) {
                    rootItems.push(new StructureItem(
                        `📊 状态管�?(${arch.stateManagement.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'reactStateManagement'
                    ));
                }
            }

            // Rust高级架构分析
            if (this.codeAnalysis.rustAdvancedArchitecture) {
                const arch = this.codeAnalysis.rustAdvancedArchitecture;
                if (arch.architecturePatterns.length > 0) {
                    rootItems.push(new StructureItem(
                        `🏛�?Rust架构模式 (${arch.architecturePatterns.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'rustArchitecturePatterns'
                    ));
                }
                if (arch.systemDesign.length > 0) {
                    rootItems.push(new StructureItem(
                        `⚙️ 系统设计 (${arch.systemDesign.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'rustSystemDesign'
                    ));
                }
                if (arch.distributedSystems.length > 0) {
                    rootItems.push(new StructureItem(
                        `🌐 分布式系�?(${arch.distributedSystems.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'rustDistributedSystems'
                    ));
                }
                if (arch.resourceManagement.length > 0) {
                    rootItems.push(new StructureItem(
                        `💾 资源管理 (${arch.resourceManagement.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'rustResourceManagement'
                    ));
                }
            }

            // 新增的React高级状态分�?
            if (this.codeAnalysis.reactAdvancedState) {
                const stateAnalysis = this.codeAnalysis.reactAdvancedState;
                if (stateAnalysis.stateFlow.patterns.length > 0) {
                    rootItems.push(new StructureItem(
                        `🔄 React状态流 (${stateAnalysis.stateFlow.patterns.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'reactAdvancedStateFlow'
                    ));
                }
            }

            if (this.codeAnalysis.reactCommunication) {
                const comm = this.codeAnalysis.reactCommunication;
                if (comm.parentChild.length > 0 || comm.siblingCommunication.length > 0) {
                    rootItems.push(new StructureItem(
                        `📡 组件通信`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'reactComponentCommunication'
                    ));
                }
            }

            if (this.codeAnalysis.reactDataBinding) {
                const binding = this.codeAnalysis.reactDataBinding;
                if (binding.bindingTypes.length > 0) {
                    rootItems.push(new StructureItem(
                        `🔗 数据绑定 (${binding.bindingTypes.length})`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'reactDataBinding'
                    ));
                }
            }

            if (this.codeAnalysis.reactRuntime) {
                const runtime = this.codeAnalysis.reactRuntime;
                if (runtime.performanceMonitoring.renderingMetrics.componentRenderTimes.length > 0) {
                    rootItems.push(new StructureItem(
                        `�?React运行时监控`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'reactRuntimeMonitoring'
                    ));
                }
            }

            // 新增的Rust系统分析
            if (this.codeAnalysis.rustAdvancedSystem) {
                const system = this.codeAnalysis.rustAdvancedSystem;
                if (system.performance.memoryOptimizations.length > 0) {
                    rootItems.push(new StructureItem(
                        `🚀 Rust系统性能 (${system.performance.memoryOptimizations.length}个优�?`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'rustSystemPerformance'
                    ));
                }
                if (system.systemArchitecture.designPatterns.length > 0) {
                    rootItems.push(new StructureItem(
                        `🏗�?系统架构 (${system.systemArchitecture.designPatterns.length}个模�?`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'rustSystemArchitecture'
                    ));
                }
                if (system.resourceManagement.resourcePools.length > 0) {
                    rootItems.push(new StructureItem(
                        `💾 资源管理 (${system.resourceManagement.resourcePools.length}个资源池)`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'rustSystemResourceManagement'
                    ));
                }
            }

            // 高级React分析结果
            if (this.codeAnalysis.reactRoutes && this.codeAnalysis.reactRoutes.length > 0) {
                rootItems.push(new StructureItem(
                    `React路由 (${this.codeAnalysis.reactRoutes.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reactRoutes'
                ));
            }

            if (this.codeAnalysis.reactContexts && this.codeAnalysis.reactContexts.length > 0) {
                rootItems.push(new StructureItem(
                    `React上下�?(${this.codeAnalysis.reactContexts.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reactContexts'
                ));
            }

            if (this.codeAnalysis.reduxStores && this.codeAnalysis.reduxStores.length > 0) {
                rootItems.push(new StructureItem(
                    `Redux存储 (${this.codeAnalysis.reduxStores.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reduxStores'
                ));
            }

            if (this.codeAnalysis.reactForms && this.codeAnalysis.reactForms.length > 0) {
                rootItems.push(new StructureItem(
                    `React表单 (${this.codeAnalysis.reactForms.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'reactForms'
                ));
            }

            if (this.codeAnalysis.apiCalls && this.codeAnalysis.apiCalls.length > 0) {
                rootItems.push(new StructureItem(
                    `API调用 (${this.codeAnalysis.apiCalls.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'apiCalls'
                ));
            }

            // 高级Rust分析结果
            if (this.codeAnalysis.rustWebHandlers && this.codeAnalysis.rustWebHandlers.length > 0) {
                rootItems.push(new StructureItem(
                    `Web处理�?(${this.codeAnalysis.rustWebHandlers.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustWebHandlers'
                ));
            }

            if (this.codeAnalysis.rustDbModels && this.codeAnalysis.rustDbModels.length > 0) {
                rootItems.push(new StructureItem(
                    `数据库模�?(${this.codeAnalysis.rustDbModels.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustDbModels'
                ));
            }

            if (this.codeAnalysis.rustAsyncTasks && this.codeAnalysis.rustAsyncTasks.length > 0) {
                rootItems.push(new StructureItem(
                    `异步任务 (${this.codeAnalysis.rustAsyncTasks.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustAsyncTasks'
                ));
            }

            if (this.codeAnalysis.rustErrorTypes && this.codeAnalysis.rustErrorTypes.length > 0) {
                rootItems.push(new StructureItem(
                    `错误类型 (${this.codeAnalysis.rustErrorTypes.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustErrorTypes'
                ));
            }

            if (this.codeAnalysis.rustConfigs && this.codeAnalysis.rustConfigs.length > 0) {
                rootItems.push(new StructureItem(
                    `配置 (${this.codeAnalysis.rustConfigs.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustConfigs'
                ));
            }

            if (this.codeAnalysis.rustTests && this.codeAnalysis.rustTests.length > 0) {
                rootItems.push(new StructureItem(
                    `测试 (${this.codeAnalysis.rustTests.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'rustTests'
                ));
            }

            return Promise.resolve(rootItems);
        }

        // 子节�?
        switch (element.contextValue) {
            case 'imports':
                return Promise.resolve(this.getImportItems());
            case 'functions':
                return Promise.resolve(this.getFunctionItems());
            case 'classes':
                return Promise.resolve(this.getClassItems());
            case 'reactComponents':
                return Promise.resolve(this.getReactComponentItems());
            case 'rustStructs':
                return Promise.resolve(this.getRustStructItems());
            case 'rustEnums':
                return Promise.resolve(this.getRustEnumItems());
            case 'rustTraits':
                return Promise.resolve(this.getRustTraitItems());
            case 'rustFunctions':
                return Promise.resolve(this.getRustFunctionItems());
            case 'reactRoutes':
                return Promise.resolve(this.getReactRouteItems());
            case 'reactContexts':
                return Promise.resolve(this.getReactContextItems());
            case 'reduxStores':
                return Promise.resolve(this.getReduxStoreItems());
            case 'reactForms':
                return Promise.resolve(this.getReactFormItems());
            case 'apiCalls':
                return Promise.resolve(this.getAPICallItems());
            case 'rustWebHandlers':
                return Promise.resolve(this.getRustWebHandlerItems());
            case 'rustDbModels':
                return Promise.resolve(this.getRustDbModelItems());
            case 'rustAsyncTasks':
                return Promise.resolve(this.getRustAsyncTaskItems());
            case 'rustErrorTypes':
                return Promise.resolve(this.getRustErrorTypeItems());
            case 'rustConfigs':
                return Promise.resolve(this.getRustConfigItems());
            case 'rustTests':
                return Promise.resolve(this.getRustTestItems());
            case 'rustMacros':
                return Promise.resolve(this.getRustMacroItems());
            case 'rustLifetimes':
                return Promise.resolve(this.getRustLifetimeItems());
            case 'rustConcurrency':
                return Promise.resolve(this.getRustConcurrencyItems());
            case 'rustPerformance':
                return Promise.resolve(this.getRustPerformanceItems());
            case 'rustSafety':
                return Promise.resolve(this.getRustSafetyItems());
            case 'rustMicroserviceArchitecture':
                return Promise.resolve(this.getRustMicroserviceArchitectureItems());
            case 'rustDatabaseOptimization':
                return Promise.resolve(this.getRustDatabaseOptimizationItems());
            case 'rustConcurrencyOptimization':
                return Promise.resolve(this.getRustConcurrencyOptimizationItems());
            case 'reactArchitecturePatterns':
                return Promise.resolve(this.getReactArchitecturePatternsItems());
            case 'reactComponentHierarchy':
                return Promise.resolve(this.getReactComponentHierarchyItems());
            case 'reactStateManagement':
                return Promise.resolve(this.getReactStateManagementItems());
            case 'rustArchitecturePatterns':
                return Promise.resolve(this.getRustArchitecturePatternsItems());
            case 'rustSystemDesign':
                return Promise.resolve(this.getRustSystemDesignItems());
            case 'rustDistributedSystems':
                return Promise.resolve(this.getRustDistributedSystemsItems());
            case 'rustResourceManagement':
                return Promise.resolve(this.getRustResourceManagementItems());
            // 新增的高级分析节�?
            case 'reactAdvancedStateFlow':
                return Promise.resolve(this.getReactAdvancedStateFlowItems());
            case 'reactComponentCommunication':
                return Promise.resolve(this.getReactComponentCommunicationItems());
            case 'reactDataBinding':
                return Promise.resolve(this.getReactDataBindingItems());
            case 'reactRuntimeMonitoring':
                return Promise.resolve(this.getReactRuntimeMonitoringItems());
            case 'rustSystemPerformance':
                return Promise.resolve(this.getRustSystemPerformanceItems());
            case 'rustSystemArchitecture':
                return Promise.resolve(this.getRustSystemArchitectureItems());
            case 'rustSystemResourceManagement':
                return Promise.resolve(this.getRustSystemResourceManagementItems());
            default:
                return Promise.resolve([]);
        }
    }

    private getImportItems(): StructureItem[] {
        if (!this.codeAnalysis) return [];

        return this.codeAnalysis.imports.map(imp => {
            const label = this.codeAnalysis!.language === 'rust' 
                ? `使用: ${imp.moduleName}`
                : `导入: ${imp.moduleName}`;
            
            return new StructureItem(
                label,
                vscode.TreeItemCollapsibleState.None,
                'import',
                `�?${imp.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到定�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(imp.line - 1, 0)]
                }
            );
        });
    }

    private getFunctionItems(): StructureItem[] {
        if (!this.codeAnalysis) return [];

        return this.codeAnalysis.functions.map(func => {
            const paramCount = func.parameters.length;
            const paramText = paramCount > 0 ? ` (${paramCount}个参�?` : ' (无参�?';
            
            return new StructureItem(
                `${func.displayName}${paramText}`,
                vscode.TreeItemCollapsibleState.None,
                'function',
                `${func.description} - �?${func.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到函�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(func.line - 1, func.column)]
                }
            );
        });
    }

    private getClassItems(): StructureItem[] {
        if (!this.codeAnalysis) return [];

        return this.codeAnalysis.classes.map(cls => {
            const methodCount = cls.methods.length;
            const propCount = cls.properties.length;
            const details: string[] = [];
            
            if (methodCount > 0) details.push(`${methodCount}个方法`);
            if (propCount > 0) details.push(`${propCount}个属性`);
            
            const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
            
            return new StructureItem(
                `${cls.displayName}${detailText}`,
                vscode.TreeItemCollapsibleState.None,
                'class',
                `�?${cls.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到类',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(cls.line - 1, cls.column)]
                }
            );
        });
    }

    private getFileName(fullPath: string): string {
        return fullPath.split(/[/\\]/).pop() || fullPath;
    }

    private getLanguageDisplayName(language: string): string {
        const languageMap: { [key: string]: string } = {
            'typescript': 'TypeScript',
            'javascript': 'JavaScript',
            'rust': 'Rust'
        };
        return languageMap[language] || language;
    }

    private getReactComponentItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactComponents) return [];

        return this.codeAnalysis.reactComponents.map(component => {
            const hookCount = component.hooks.length;
            const propCount = component.props.length;
            const details = [];
            
            if (hookCount > 0) details.push(`${hookCount}个钩子`);
            if (propCount > 0) details.push(`${propCount}个属性`);
            
            const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
            const typeText = component.type === 'functional' ? '函数�? : '�?;
            
            return new StructureItem(
                `${component.displayName}${detailText}`,
                vscode.TreeItemCollapsibleState.None,
                'reactComponent',
                `${typeText}组件 - �?${component.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到组�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(component.line - 1, component.column)]
                }
            );
        });
    }

    private getRustStructItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustStructs) return [];

        return this.codeAnalysis.rustStructs.map(struct => {
            const fieldCount = struct.fields.length;
            const deriveCount = struct.derives.length;
            const details = [];
            
            if (fieldCount > 0) details.push(`${fieldCount}个字段`);
            if (deriveCount > 0) details.push(`派生${deriveCount}个特征`);
            
            const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
            
            return new StructureItem(
                `${struct.displayName}${detailText}`,
                vscode.TreeItemCollapsibleState.None,
                'rustStruct',
                `${struct.visibility}结构�?- �?${struct.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到结构体',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(struct.line - 1, struct.column)]
                }
            );
        });
    }

    private getRustEnumItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustEnums) return [];

        return this.codeAnalysis.rustEnums.map(enumItem => {
            const variantCount = enumItem.variants.length;
            const detailText = variantCount > 0 ? ` (${variantCount}个变�?` : '';
            
            return new StructureItem(
                `${enumItem.displayName}${detailText}`,
                vscode.TreeItemCollapsibleState.None,
                'rustEnum',
                `${enumItem.visibility}枚举 - �?${enumItem.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到枚�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(enumItem.line - 1, enumItem.column)]
                }
            );
        });
    }

    private getRustTraitItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustTraits) return [];

        return this.codeAnalysis.rustTraits.map(trait => {
            const methodCount = trait.methods.length;
            const typeCount = trait.associatedTypes.length;
            const details = [];
            
            if (methodCount > 0) details.push(`${methodCount}个方法`);
            if (typeCount > 0) details.push(`${typeCount}个关联类型`);
            
            const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
            
            return new StructureItem(
                `${trait.displayName}${detailText}`,
                vscode.TreeItemCollapsibleState.None,
                'rustTrait',
                `特征 - �?${trait.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到特�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(trait.line - 1, trait.column)]
                }
            );
        });
    }

    private getRustFunctionItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustFunctions) return [];

        return this.codeAnalysis.rustFunctions.map(func => {
            const paramCount = func.parameters.length;
            const modifiers = [];
            
            if (func.isAsync) modifiers.push('异步');
            if (func.isUnsafe) modifiers.push('不安�?);
            
            const modifierText = modifiers.length > 0 ? modifiers.join('') + ' ' : '';
            const paramText = paramCount > 0 ? ` (${paramCount}个参�?` : ' (无参�?';
            
            return new StructureItem(
                `${func.displayName}${paramText}`,
                vscode.TreeItemCollapsibleState.None,
                'rustFunction',
                `${func.visibility}${modifierText}函数 - �?${func.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到函�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(func.line - 1, func.column)]
                }
            );
        });
    }

    // React高级分析项获取方�?
    private getReactRouteItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.reactRoutes) return [];

        return this.codeAnalysis.reactRoutes.map(route => {
            return new StructureItem(
                `路径: ${route.path} �?${route.component}`,
                vscode.TreeItemCollapsibleState.None,
                'reactRoute',
                `路径: ${route.path}, 组件: ${route.component}, �?${route.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到路�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(route.line - 1, 0)]
                }
            );
        });
    }

    private getReactContextItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.reactContexts) return [];

        return this.codeAnalysis.reactContexts.map(context => {
            return new StructureItem(
                `${context.displayName}`,
                vscode.TreeItemCollapsibleState.None,
                'reactContext',
                `上下�? ${context.name}, �?${context.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到上下文',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(context.line - 1, 0)]
                }
            );
        });
    }

    private getReduxStoreItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.reduxStores) return [];

        return this.codeAnalysis.reduxStores.map(store => {
            return new StructureItem(
                `${store.name} (${store.actions.length}个动�?`,
                vscode.TreeItemCollapsibleState.None,
                'reduxStore',
                `Redux存储: ${store.name}, �?${store.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到存�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(store.line - 1, 0)]
                }
            );
        });
    }

    private getReactFormItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.reactForms) return [];

        return this.codeAnalysis.reactForms.map(form => {
            return new StructureItem(
                `${form.name} (${form.fields.length}个字�?`,
                vscode.TreeItemCollapsibleState.None,
                'reactForm',
                `表单: ${form.name}, �?${form.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到表�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(form.line - 1, 0)]
                }
            );
        });
    }

    private getAPICallItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.apiCalls) return [];

        return this.codeAnalysis.apiCalls.map(api => {
            return new StructureItem(
                `${api.method} ${api.endpoint}`,
                vscode.TreeItemCollapsibleState.None,
                'apiCall',
                `API调用: ${api.method} ${api.endpoint}, �?${api.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到API调用',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(api.line - 1, 0)]
                }
            );
        });
    }

    // Rust高级分析项获取方�?
    private getRustWebHandlerItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustWebHandlers) return [];

        return this.codeAnalysis.rustWebHandlers.map(handler => {
            return new StructureItem(
                `${handler.method} ${handler.path} �?${handler.name}`,
                vscode.TreeItemCollapsibleState.None,
                'rustWebHandler',
                `Web处理�? ${handler.method} ${handler.path}, �?${handler.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到处理器',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(handler.line - 1, 0)]
                }
            );
        });
    }

    private getRustDbModelItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustDbModels) return [];

        return this.codeAnalysis.rustDbModels.map(model => {
            return new StructureItem(
                `${model.name} (${model.fields.length}个字�?`,
                vscode.TreeItemCollapsibleState.None,
                'rustDbModel',
                `数据库模�? ${model.name}, �?${model.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到模�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(model.line - 1, 0)]
                }
            );
        });
    }

    private getRustAsyncTaskItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustAsyncTasks) return [];

        return this.codeAnalysis.rustAsyncTasks.map(task => {
            return new StructureItem(
                `${task.name}`,
                vscode.TreeItemCollapsibleState.None,
                'rustAsyncTask',
                `异步任务: ${task.name}, �?${task.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到异步任�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(task.line - 1, 0)]
                }
            );
        });
    }

    private getRustErrorTypeItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustErrorTypes) return [];

        return this.codeAnalysis.rustErrorTypes.map(error => {
            return new StructureItem(
                `${error.name}`,
                vscode.TreeItemCollapsibleState.None,
                'rustErrorType',
                `错误类型: ${error.name}, �?${error.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到错误类�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(error.line - 1, 0)]
                }
            );
        });
    }

    private getRustConfigItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustConfigs) return [];

        return this.codeAnalysis.rustConfigs.map(config => {
            return new StructureItem(
                `${config.name}`,
                vscode.TreeItemCollapsibleState.None,
                'rustConfig',
                `配置: ${config.name}, �?${config.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到配�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(config.line - 1, 0)]
                }
            );
        });
    }

    private getRustTestItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustTests) return [];

        return this.codeAnalysis.rustTests.map(test => {
            return new StructureItem(
                `${test.name}`,
                vscode.TreeItemCollapsibleState.None,
                'rustTest',
                `测试: ${test.name}, �?${test.line} 行`,
                {
                    command: 'vscode.open',
                    title: '跳转到测�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(test.line - 1, 0)]
                }
            );
        });
    }

    // Rust生态系统高级分析项目方�?
    private getRustMacroItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustMacros) return [];

        return this.codeAnalysis.rustMacros.map(macro => {
            return new StructureItem(
                `${macro.displayName} (${macro.name})`,
                vscode.TreeItemCollapsibleState.None,
                'rustMacro',
                `${macro.macroType} �?{macro.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到宏',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(macro.line - 1, 0)]
                }
            );
        });
    }

    private getRustLifetimeItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustLifetimes) return [];

        return this.codeAnalysis.rustLifetimes.map(lifetime => {
            return new StructureItem(
                `'${lifetime.name}`,
                vscode.TreeItemCollapsibleState.None,
                'rustLifetime',
                `${lifetime.scope} �?{lifetime.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到生命周�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(lifetime.line - 1, 0)]
                }
            );
        });
    }

    private getRustConcurrencyItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustConcurrency) return [];

        const items: StructureItem[] = [];
        const concurrency = this.codeAnalysis.rustConcurrency;

        // 通道
        concurrency.channels.forEach(channel => {
            items.push(new StructureItem(
                `📡 ${channel.channelType}: ${channel.sender} -> ${channel.receiver}`,
                vscode.TreeItemCollapsibleState.None,
                'rustChannel',
                `通道 �?{channel.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到通道',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(channel.line - 1, 0)]
                }
            ));
        });

        // 互斥�?
        concurrency.mutexes.forEach(mutex => {
            items.push(new StructureItem(
                `🔒 ${mutex.name}: ${mutex.dataType}`,
                vscode.TreeItemCollapsibleState.None,
                'rustMutex',
                `${mutex.lockType} �?{mutex.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到互斥锁',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(mutex.line - 1, 0)]
                }
            ));
        });

        // 任务生成
        concurrency.spawns.forEach(spawn => {
            items.push(new StructureItem(
                `🚀 ${spawn.runtime} ${spawn.blocking ? '阻塞' : '异步'}任务`,
                vscode.TreeItemCollapsibleState.None,
                'rustSpawn',
                `�?{spawn.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到任务生�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(spawn.line - 1, 0)]
                }
            ));
        });

        return items;
    }

    private getRustPerformanceItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustPerformance) return [];

        const items: StructureItem[] = [];
        const performance = this.codeAnalysis.rustPerformance;

        // 内存分配
        performance.allocations.forEach(alloc => {
            items.push(new StructureItem(
                `📦 ${alloc.allocationType}分配`,
                vscode.TreeItemCollapsibleState.None,
                'rustAllocation',
                `�?{alloc.line}�?- ${alloc.suggestion || ''}`,
                {
                    command: 'vscode.open',
                    title: '跳转到分�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(alloc.line - 1, 0)]
                }
            ));
        });

        // 克隆操作
        performance.clones.forEach(clone => {
            items.push(new StructureItem(
                `📋 ${clone.target}.clone() ${clone.necessary ? '�? : '⚠️'}`,
                vscode.TreeItemCollapsibleState.None,
                'rustClone',
                `�?{clone.line}�?- ${clone.suggestion || ''}`,
                {
                    command: 'vscode.open',
                    title: '跳转到克�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(clone.line - 1, 0)]
                }
            ));
        });

        // 迭代�?
        performance.iterations.forEach(iter => {
            items.push(new StructureItem(
                `🔄 ${iter.iteratorType}迭代`,
                vscode.TreeItemCollapsibleState.None,
                'rustIteration',
                `�?{iter.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到迭代器',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(iter.line - 1, 0)]
                }
            ));
        });

        // 基准测试
        performance.benchmarks.forEach(bench => {
            items.push(new StructureItem(
                `📊 ${bench.name}`,
                vscode.TreeItemCollapsibleState.None,
                'rustBenchmark',
                `${bench.framework} �?{bench.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到基准测�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(bench.line - 1, 0)]
                }
            ));
        });

        return items;
    }

    private getRustSafetyItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustSafety) return [];

        const items: StructureItem[] = [];
        const safety = this.codeAnalysis.rustSafety;

        // 不安全代码块
        safety.unsafeBlocks.forEach(block => {
            items.push(new StructureItem(
                `⚠️ unsafe { ${block.reason} }`,
                vscode.TreeItemCollapsibleState.None,
                'rustUnsafeBlock',
                `�?{block.line}�?- ${block.safety_comment || '无安全注�?}`,
                {
                    command: 'vscode.open',
                    title: '跳转到不安全代码�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(block.line - 1, 0)]
                }
            ));
        });

        // 不安全函�?
        safety.unsafeFunctions.forEach(func => {
            items.push(new StructureItem(
                `⚠️ unsafe fn ${func.name}`,
                vscode.TreeItemCollapsibleState.None,
                'rustUnsafeFunction',
                `�?{func.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到不安全函数',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(func.line - 1, 0)]
                }
            ));
        });

        // 裸指�?
        safety.rawPointers.forEach(ptr => {
            items.push(new StructureItem(
                `🎯 ${ptr.pointerType} ${ptr.targetType}`,
                vscode.TreeItemCollapsibleState.None,
                'rustRawPointer',
                `�?{ptr.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到裸指针',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(ptr.line - 1, 0)]
                }
            ));
        });

        // FFI调用
        safety.ffiCalls.forEach(ffi => {
            items.push(new StructureItem(
                `🔗 ${ffi.functionName}`,
                vscode.TreeItemCollapsibleState.None,
                'rustFFICall',
                `${ffi.bindingType} �?{ffi.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到FFI调用',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(ffi.line - 1, 0)]
                }
            ));
        });

        return items;
    }

    private getRustMicroserviceArchitectureItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustMicroserviceArchitecture) return [];

        const items: StructureItem[] = [];
        const architecture = this.codeAnalysis.rustMicroserviceArchitecture;

        // 微服务列�?
        architecture.services.forEach(service => {
            const endpointCount = service.endpoints.length;
            const dependencyCount = service.dependencies.length;
            
            items.push(new StructureItem(
                `🏗�?${service.name} (${service.type})`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'microservice',
                `${service.framework} - ${endpointCount}个端�? ${dependencyCount}个依赖`,
                {
                    command: 'vscode.open',
                    title: '跳转到服务定�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(service.line - 1, 0)]
                }
            ));
        });

        // 服务通信
        architecture.communications.forEach(comm => {
            items.push(new StructureItem(
                `🔗 ${comm.from} �?${comm.to}`,
                vscode.TreeItemCollapsibleState.None,
                'serviceCommunication',
                `${comm.protocol} (${comm.pattern}) - �?{comm.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到通信定义',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(comm.line - 1, 0)]
                }
            ));
        });

        // 监控设置
        architecture.monitoring.forEach(monitor => {
            const statusIcon = monitor.configuration.enabled ? '�? : '�?;
            items.push(new StructureItem(
                `${statusIcon} ${monitor.type}: ${monitor.tool}`,
                vscode.TreeItemCollapsibleState.None,
                'monitoring',
                `级别: ${monitor.configuration.level} - �?{monitor.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到监控配�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(monitor.line - 1, 0)]
                }
            ));
        });

        // 安全模式
        architecture.security.forEach(security => {
            const strengthEmoji = security.strength === 'strong' ? '🔒' : security.strength === 'medium' ? '🔓' : '⚠️';
            items.push(new StructureItem(
                `${strengthEmoji} ${security.type}: ${security.implementation}`,
                vscode.TreeItemCollapsibleState.None,
                'securityPattern',
                `强度: ${security.strength} - �?{security.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到安全配�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(security.line - 1, 0)]
                }
            ));
        });

        return items;
    }

    private getRustDatabaseOptimizationItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustDatabaseOptimization) return [];

        const items: StructureItem[] = [];
        const dbOpt = this.codeAnalysis.rustDatabaseOptimization;

        // 查询分析
        dbOpt.queries.forEach(query => {
            const complexityEmoji = query.performance.estimatedComplexity === 'high' ? '🔴' : 
                                    query.performance.estimatedComplexity === 'medium' ? '🟡' : '🟢';
            const indexStatus = query.performance.usesIndex ? '📊' : '⚠️';
            
            items.push(new StructureItem(
                `${complexityEmoji} ${indexStatus} ${query.type.toUpperCase()}查询`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'databaseQuery',
                `复杂�? ${query.performance.estimatedComplexity}, 索引: ${query.performance.usesIndex ? '�? : '�?} - �?{query.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到查�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(query.line - 1, 0)]
                }
            ));
        });

        // 连接池分�?
        const poolStatus = dbOpt.connections.optimal ? '�? : '⚠️';
        items.push(new StructureItem(
            `${poolStatus} 连接池配置`,
            vscode.TreeItemCollapsibleState.None,
            'connectionPool',
            `池大�? ${dbOpt.connections.poolSize}, 最大连�? ${dbOpt.connections.maxConnections}`,
            undefined
        ));

        // 迁移分析
        dbOpt.migrations.forEach(migration => {
            const breakingIcon = migration.breakingChange ? '💥' : '�?;
            const reversibleIcon = migration.reversible ? '↩️' : '⚠️';
            
            items.push(new StructureItem(
                `${breakingIcon} ${reversibleIcon} 迁移 ${migration.version}`,
                vscode.TreeItemCollapsibleState.None,
                'migration',
                `类型: ${migration.type}, 可�? ${migration.reversible ? '�? : '�?} - �?{migration.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到迁�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(migration.line - 1, 0)]
                }
            ));
        });

        // 缓存策略
        dbOpt.caching.forEach(cache => {
            const hitRateEmoji = cache.hitRate > 0.8 ? '🎯' : cache.hitRate > 0.6 ? '🔸' : '🔻';
            
            items.push(new StructureItem(
                `${hitRateEmoji} ${cache.type}缓存`,
                vscode.TreeItemCollapsibleState.None,
                'caching',
                `模式: ${cache.pattern}, 命中�? ${(cache.hitRate * 100).toFixed(1)}% - �?{cache.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到缓存配�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(cache.line - 1, 0)]
                }
            ));
        });

        return items;
    }

    private getRustConcurrencyOptimizationItems(): StructureItem[] {
        if (!this.codeAnalysis || !this.codeAnalysis.rustConcurrencyOptimization) return [];

        const items: StructureItem[] = [];
        const concOpt = this.codeAnalysis.rustConcurrencyOptimization;

        // 线程池分�?
        concOpt.threadPools.forEach(pool => {
            const utilizationEmoji = pool.utilization > 0.8 ? '🔥' : pool.utilization > 0.6 ? '�? : '🟢';
            
            items.push(new StructureItem(
                `${utilizationEmoji} ${pool.name}线程池`,
                vscode.TreeItemCollapsibleState.Collapsed,
                'threadPool',
                `类型: ${pool.type}, 大小: ${pool.size}, 利用�? ${(pool.utilization * 100).toFixed(1)}% - �?{pool.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到线程池',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(pool.line - 1, 0)]
                }
            ));
        });

        // 异步运行时分�?
        const runtimeEmoji = concOpt.asyncRuntime.configuration.multiThreaded ? '🚀' : '🔧';
        items.push(new StructureItem(
            `${runtimeEmoji} ${concOpt.asyncRuntime.runtime}运行时`,
            vscode.TreeItemCollapsibleState.None,
            'asyncRuntime',
            `多线�? ${concOpt.asyncRuntime.configuration.multiThreaded ? '�? : '�?}, 线程�? ${concOpt.asyncRuntime.configuration.threadsCount}`,
            undefined
        ));

        // 锁争用分�?
        concOpt.lockContention.forEach(lock => {
            const contentionEmoji = lock.contentionLevel === 'high' ? '🔴' : 
                                   lock.contentionLevel === 'medium' ? '🟡' : '🟢';
            
            items.push(new StructureItem(
                `${contentionEmoji} ${lock.lockType}锁`,
                vscode.TreeItemCollapsibleState.None,
                'lockContention',
                `争用级别: ${lock.contentionLevel}, 持有时间: ${lock.holdTime} - �?{lock.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到锁定义',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(lock.line - 1, 0)]
                }
            ));
        });

        // 通道使用分析
        concOpt.channelUsage.forEach(channel => {
            const throughputEmoji = channel.throughput === 'high' ? '🚀' : 
                                   channel.throughput === 'medium' ? '�? : '🐌';
            const backpressureIcon = channel.backpressure ? '🔄' : '➡️';
            
            items.push(new StructureItem(
                `${throughputEmoji} ${backpressureIcon} ${channel.channelType}通道`,
                vscode.TreeItemCollapsibleState.None,
                'channelUsage',
                `缓冲�? ${channel.bufferSize}, 吞吐�? ${channel.throughput} - �?{channel.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到通道',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(channel.line - 1, 0)]
                }
            ));
        });

        // 并行化机�?
        concOpt.parallelization.forEach(opportunity => {
            const gainEmoji = opportunity.expectedGain === 'high' ? '🎯' : 
                             opportunity.expectedGain === 'medium' ? '📈' : '📊';
            const complexityEmoji = opportunity.complexity === 'simple' ? '🟢' : 
                                   opportunity.complexity === 'moderate' ? '🟡' : '🔴';
            
            items.push(new StructureItem(
                `${gainEmoji} ${complexityEmoji} ${opportunity.operation}并行化`,
                vscode.TreeItemCollapsibleState.None,
                'parallelization',
                `当前: ${opportunity.currentApproach} �?建议: ${opportunity.suggestedApproach}, 收益: ${opportunity.expectedGain} - �?{opportunity.line}行`,
                {
                    command: 'vscode.open',
                    title: '跳转到并行化机会',
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(opportunity.line - 1, 0)]
                }
            ));
        });

        return items;
    }

    // React高级架构分析方法
    private getReactArchitecturePatternsItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactAdvancedArchitecture?.architecturePatterns) return [];

        return this.codeAnalysis.reactAdvancedArchitecture.architecturePatterns.map(pattern => 
            new StructureItem(
                `🏗�?${pattern.name} (置信�? ${(pattern.confidence * 100).toFixed(0)}%)`,
                vscode.TreeItemCollapsibleState.None,
                'reactArchitecturePattern',
                `�?${pattern.line} �?- ${pattern.description}`,
                {
                    command: 'codeVisualization.goToLine',
                    title: 'Go to Line',
                    arguments: [pattern.line, this.codeAnalysis!.fileName]
                }
            )
        );
    }

    private getReactComponentHierarchyItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactAdvancedArchitecture?.componentHierarchy) return [];

        return this.codeAnalysis.reactAdvancedArchitecture.componentHierarchy.map(comp => 
            new StructureItem(
                `🌳 ${comp.component} (层级: ${comp.level}, ${comp.children.length}个子组件)`,
                vscode.TreeItemCollapsibleState.None,
                'reactComponentHierarchy',
                `�?${comp.line} �?- Props: ${comp.props.join(', ')}`,
                {
                    command: 'codeVisualization.goToLine',
                    title: 'Go to Line',
                    arguments: [comp.line, this.codeAnalysis!.fileName]
                }
            )
        );
    }

    private getReactStateManagementItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactAdvancedArchitecture?.stateManagement) return [];

        return this.codeAnalysis.reactAdvancedArchitecture.stateManagement.map(state => 
            new StructureItem(
                `📊 ${state.store} (${state.type}) - 复杂�? ${state.complexity}`,
                vscode.TreeItemCollapsibleState.None,
                'reactStateManagement',
                `�?${state.line} �?- Actions: ${state.actions.length}, Selectors: ${state.selectors.length}`,
                {
                    command: 'codeVisualization.goToLine',
                    title: 'Go to Line',
                    arguments: [state.line, this.codeAnalysis!.fileName]
                }
            )
        );
    }

    // Rust高级架构分析方法
    private getRustArchitecturePatternsItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustAdvancedArchitecture?.architecturePatterns) return [];

        return this.codeAnalysis.rustAdvancedArchitecture.architecturePatterns.map(pattern => 
            new StructureItem(
                `🏛�?${pattern.name} (置信�? ${(pattern.confidence * 100).toFixed(0)}%)`,
                vscode.TreeItemCollapsibleState.None,
                'rustArchitecturePattern',
                `�?${pattern.line} �?- ${pattern.description}`,
                {
                    command: 'codeVisualization.goToLine',
                    title: 'Go to Line',
                    arguments: [pattern.line, this.codeAnalysis!.fileName]
                }
            )
        );
    }

    private getRustSystemDesignItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustAdvancedArchitecture?.systemDesign) return [];

        return this.codeAnalysis.rustAdvancedArchitecture.systemDesign.map(design => 
            new StructureItem(
                `⚙️ ${design.name} (可扩展�? ${design.scalability})`,
                vscode.TreeItemCollapsibleState.None,
                'rustSystemDesign',
                `�?${design.line} �?- 组件: ${design.components.join(', ')}`,
                {
                    command: 'codeVisualization.goToLine',
                    title: 'Go to Line',
                    arguments: [design.line, this.codeAnalysis!.fileName]
                }
            )
        );
    }

    private getRustDistributedSystemsItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustAdvancedArchitecture?.distributedSystems) return [];

        return this.codeAnalysis.rustAdvancedArchitecture.distributedSystems.map(system => 
            new StructureItem(
                `🌐 ${system.implementation} (${system.protocol})`,
                vscode.TreeItemCollapsibleState.None,
                'rustDistributedSystem',
                `�?${system.line} �?- 一致�? ${system.consistency}, 可用�? ${system.availability}`,
                {
                    command: 'codeVisualization.goToLine',
                    title: 'Go to Line',
                    arguments: [system.line, this.codeAnalysis!.fileName]
                }
            )
        );
    }

    private getRustResourceManagementItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustAdvancedArchitecture?.resourceManagement) return [];

        return this.codeAnalysis.rustAdvancedArchitecture.resourceManagement.map(resource => 
            new StructureItem(
                `💾 ${resource.optimization} (${resource.resource}) - 影响: ${resource.impact}`,
                vscode.TreeItemCollapsibleState.None,
                'rustResourceManagement',
                `�?${resource.line} �?- 技�? ${resource.technique}, 度量: ${resource.measurement}`,
                {
                    command: 'codeVisualization.goToLine',
                    title: 'Go to Line',
                    arguments: [resource.line, this.codeAnalysis!.fileName]
                }
            )
        );
    }

    // 新增的React高级分析方法
    private getReactAdvancedStateFlowItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactAdvancedState) return [];
        
        const stateFlow = this.codeAnalysis.reactAdvancedState.stateFlow;
        return stateFlow.patterns.map(pattern => new StructureItem(
            `${pattern.pattern}: ${pattern.component}`,
            vscode.TreeItemCollapsibleState.None,
            'reactStateFlow',
            `${pattern.description} - �?${pattern.line}`,
            {
                command: 'vscode.open',
                title: '跳转到状�?,
                arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(pattern.line - 1, 0)]
            }
        ));
    }

    private getReactComponentCommunicationItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactCommunication) return [];
        
        const items: StructureItem[] = [];
        const comm = this.codeAnalysis.reactCommunication;
        
        // 父子通信
        comm.parentChild.forEach(pc => {
            items.push(new StructureItem(
                `父子通信: ${pc.parent} �?${pc.child}`,
                vscode.TreeItemCollapsibleState.None,
                'reactCommunication',
                `Props: ${pc.propsFlow.length}, Callbacks: ${pc.callbackFlow.length} - �?${pc.line}`
            ));
        });
        
        // 兄弟组件通信
        comm.siblingCommunication.forEach(sc => {
            items.push(new StructureItem(
                `兄弟通信: ${sc.components.join(' �?')}`,
                vscode.TreeItemCollapsibleState.None,
                'reactCommunication',
                `方法: ${sc.method} - 效率: ${sc.efficiency} - �?${sc.line}`
            ));
        });
        
        return items;
    }

    private getReactDataBindingItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactDataBinding) return [];
        
        const binding = this.codeAnalysis.reactDataBinding;
        return binding.bindingTypes.map(bt => new StructureItem(
            `${bt.type}: ${bt.source} �?${bt.target}`,
            vscode.TreeItemCollapsibleState.None,
            'reactDataBinding',
            `性能: ${bt.performance} - �?${bt.line}`,
            {
                command: 'vscode.open',
                title: '跳转到绑�?,
                arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(bt.line - 1, 0)]
            }
        ));
    }

    private getReactRuntimeMonitoringItems(): StructureItem[] {
        if (!this.codeAnalysis?.reactRuntime) return [];
        
        const runtime = this.codeAnalysis.reactRuntime;
        const items: StructureItem[] = [];
        
        // 渲染指标
        runtime.performanceMonitoring.renderingMetrics.componentRenderTimes.forEach(crt => {
            items.push(new StructureItem(
                `渲染时间: ${crt.component}`,
                vscode.TreeItemCollapsibleState.None,
                'reactPerformance',
                `${crt.averageTime}ms 平均, 渲染 ${crt.renderCount} 次`
            ));
        });
        
        return items;
    }

    // 新增的Rust系统分析方法  
    private getRustSystemPerformanceItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustAdvancedSystem) return [];
        
        const perf = this.codeAnalysis.rustAdvancedSystem.performance;
        const items: StructureItem[] = [];
        
        // 内存优化
        perf.memoryOptimizations.forEach(opt => {
            items.push(new StructureItem(
                `内存优化: ${opt.pattern}`,
                vscode.TreeItemCollapsibleState.None,
                'rustOptimization',
                `${opt.description} - 影响: ${opt.impact} - �?${opt.line}`,
                {
                    command: 'vscode.open',
                    title: '跳转到优�?,
                    arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(opt.line - 1, 0)]
                }
            ));
        });
        
        // 计算优化
        perf.computationalOptimizations.forEach(opt => {
            items.push(new StructureItem(
                `计算优化: ${opt.pattern}`,
                vscode.TreeItemCollapsibleState.None,
                'rustOptimization',
                `算法: ${opt.algorithm} - �?${opt.line}`
            ));
        });
        
        return items;
    }

    private getRustSystemArchitectureItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustAdvancedSystem) return [];
        
        const arch = this.codeAnalysis.rustAdvancedSystem.systemArchitecture;
        return arch.designPatterns.map(pattern => new StructureItem(
            `设计模式: ${pattern.pattern}`,
            vscode.TreeItemCollapsibleState.None,
            'rustArchitecture',
            `${pattern.description} - �?${pattern.line}`,
            {
                command: 'vscode.open',
                title: '跳转到模�?,
                arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(pattern.line - 1, 0)]
            }
        ));
    }

    private getRustSystemResourceManagementItems(): StructureItem[] {
        if (!this.codeAnalysis?.rustAdvancedSystem) return [];
        
        const rm = this.codeAnalysis.rustAdvancedSystem.resourceManagement;
        return rm.resourcePools.map(pool => new StructureItem(
            `资源�? ${pool.resource}`,
            vscode.TreeItemCollapsibleState.None,
            'rustResource',
            `大小: ${pool.poolSize}, 利用�? ${pool.utilizationRate}% - �?${pool.line}`,
            {
                command: 'vscode.open',
                title: '跳转到资源池',
                arguments: [vscode.Uri.file(this.codeAnalysis!.fileName), new vscode.Position(pool.line - 1, 0)]
            }
        ));
    }
}

class StructureItem extends vscode.TreeItem {
    public iconPath: vscode.ThemeIcon | undefined;
    
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly tooltip?: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.command = command;

        // 设置图标
        switch (contextValue) {
            case 'file':
                this.iconPath = new vscode.ThemeIcon('file');
                break;
            case 'imports':
                this.iconPath = new vscode.ThemeIcon('package');
                break;
            case 'functions':
                this.iconPath = new vscode.ThemeIcon('symbol-function');
                break;
            case 'classes':
                this.iconPath = new vscode.ThemeIcon('symbol-class');
                break;
            case 'function':
                this.iconPath = new vscode.ThemeIcon('symbol-method');
                break;
            case 'class':
                this.iconPath = new vscode.ThemeIcon('symbol-class');
                break;
            case 'import':
                this.iconPath = new vscode.ThemeIcon('references');
                break;
            // React相关图标
            case 'reactComponents':
                this.iconPath = new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.blue'));
                break;
            case 'reactComponent':
                this.iconPath = new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.blue'));
                break;
            // Rust相关图标
            case 'rustStructs':
                this.iconPath = new vscode.ThemeIcon('symbol-struct', new vscode.ThemeColor('charts.orange'));
                break;
            case 'rustStruct':
                this.iconPath = new vscode.ThemeIcon('symbol-struct', new vscode.ThemeColor('charts.orange'));
                break;
            case 'rustEnums':
                this.iconPath = new vscode.ThemeIcon('symbol-enum', new vscode.ThemeColor('charts.purple'));
                break;
            case 'rustEnum':
                this.iconPath = new vscode.ThemeIcon('symbol-enum', new vscode.ThemeColor('charts.purple'));
                break;
            case 'rustTraits':
                this.iconPath = new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.green'));
                break;
            case 'rustTrait':
                this.iconPath = new vscode.ThemeIcon('symbol-interface', new vscode.ThemeColor('charts.green'));
                break;
            case 'rustFunctions':
                this.iconPath = new vscode.ThemeIcon('symbol-function', new vscode.ThemeColor('charts.red'));
                break;
            case 'rustFunction':
                this.iconPath = new vscode.ThemeIcon('symbol-function', new vscode.ThemeColor('charts.red'));
                break;
            // 新增高级分析图标
            case 'reactStateFlow':
                this.iconPath = new vscode.ThemeIcon('git-branch', new vscode.ThemeColor('charts.blue'));
                break;
            case 'reactCommunication':
                this.iconPath = new vscode.ThemeIcon('arrow-both', new vscode.ThemeColor('charts.green'));
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
            default:
                this.iconPath = new vscode.ThemeIcon('circle-filled');
        }
    }
}
