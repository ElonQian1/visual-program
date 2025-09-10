import * as vscode from 'vscode';
import { ReactAnalyzer, ReactComponent } from './reactAnalyzer';
import { RustAnalyzer, RustStruct, RustEnum, RustTrait, RustFunction, RustImpl, RustModule } from './rustAnalyzer';
import { AdvancedReactAnalyzer, ReactRoute, ReactContext, ReduxStore, ReactForm, APICall } from './advancedReactAnalyzer';
import { AdvancedRustAnalyzer, RustWebHandler, RustDbModel, RustAsyncTask, RustErrorType, RustConfig, RustTest } from './advancedRustAnalyzer';
import { AdvancedRustEcosystemAnalyzer, RustMacro, RustLifetime, RustConcurrency, RustPerformance, RustSafety } from './advancedRustEcosystemAnalyzer';
import { AdvancedReactPerformanceAnalyzer, ReactPerformance, ReactArchitecture } from './advancedReactPerformanceAnalyzer';
import { AdvancedRustMicroserviceAnalyzer, RustMicroserviceArchitecture, RustDatabaseOptimization, RustConcurrencyOptimization } from './advancedRustMicroserviceAnalyzer';
import { AdvancedReactArchitectureAnalyzer, ReactAdvancedArchitectureAnalysis } from './advancedReactArchitectureAnalyzer';
import { AdvancedRustArchitectureAnalyzer, RustAdvancedArchitectureAnalysis } from './advancedRustArchitectureAnalyzer';
import { AdvancedReactStateAnalyzer, ReactAdvancedStateAnalysis, ComponentCommunicationAnalysis, DataBindingAnalysis } from './advancedReactStateAnalyzer';
import { AdvancedRustSystemAnalyzer, RustAdvancedSystemAnalysis, RustPerformanceAnalysis, RustSystemArchitecture } from './advancedRustSystemAnalyzer';
import { ReactRuntimeAnalyzer, ReactRuntimeAnalysis, DebuggingAnalysis, TestingAnalysis } from './reactRuntimeAnalyzer';
import { ReactHookAnalyzer, ReactHookAnalysis } from './reactHookAnalyzer';  
import { RustAsyncNetworkAnalyzer, RustAsyncNetworkAnalysis } from './rustAsyncNetworkAnalyzer';
import { ReactStateManagementAnalyzer, ReactStateManagementAnalysis } from './reactStateManagementAnalyzer';
import { RustPerformanceAnalyzer, RustPerformanceAnalysis as RustDetailedPerformanceAnalysis } from './rustPerformanceAnalyzer';
import { ReactAdvancedAnalyzer, ReactPerformanceIssue, ReactArchitecturePattern } from './reactPerformanceAnalyzer';
import { RustBackendArchitectureAnalyzer } from './rustBackendArchitectureAnalyzer';

// 代码分析结果接口
export interface CodeAnalysis {
    fileName: string;
    language: string;
    functions: FunctionInfo[];
    classes: ClassInfo[];
    imports: ImportInfo[];
    variables: VariableInfo[];
    // React特定数据
    reactComponents?: ReactComponent[];
    // React生态系统数据
    reactRoutes?: ReactRoute[];
    reactContexts?: ReactContext[];
    reduxStores?: ReduxStore[];
    reactForms?: ReactForm[];
    apiCalls?: APICall[];
    // React性能和架构分析
    reactPerformance?: ReactPerformance;
    reactArchitecture?: ReactArchitecture;
    // Rust特定数据
    rustStructs?: RustStruct[];
    rustEnums?: RustEnum[];
    rustTraits?: RustTrait[];
    rustImpls?: RustImpl[];
    rustFunctions?: RustFunction[];
    rustModules?: RustModule[];
    // Rust生态系统数据
    rustWebHandlers?: RustWebHandler[];
    rustDbModels?: RustDbModel[];
    rustAsyncTasks?: RustAsyncTask[];
    rustErrorTypes?: RustErrorType[];
    rustConfigs?: RustConfig[];
    rustTests?: RustTest[];
    // Rust生态系统高级数据
    rustMacros?: RustMacro[];
    rustLifetimes?: RustLifetime[];
    rustConcurrency?: RustConcurrency;
    rustPerformance?: RustPerformance;
    rustSafety?: RustSafety;
    // Rust微服务架构分析
    rustMicroserviceArchitecture?: RustMicroserviceArchitecture;
    rustDatabaseOptimization?: RustDatabaseOptimization;
    rustConcurrencyOptimization?: RustConcurrencyOptimization;
    // 高级架构分析
    reactAdvancedArchitecture?: ReactAdvancedArchitectureAnalysis;
    rustAdvancedArchitecture?: RustAdvancedArchitectureAnalysis;
    // 新增高级分析
    reactAdvancedState?: ReactAdvancedStateAnalysis;
    reactCommunication?: ComponentCommunicationAnalysis;
    reactDataBinding?: DataBindingAnalysis;
    rustAdvancedSystem?: RustAdvancedSystemAnalysis;
    rustSystemPerformance?: RustPerformanceAnalysis;
    rustSystemArchitecture?: RustSystemArchitecture;
    reactRuntime?: ReactRuntimeAnalysis;
    reactDebugging?: DebuggingAnalysis;
    reactTesting?: TestingAnalysis;
    // React Hook分析
    reactHooks?: ReactHookAnalysis;
    // Rust异步网络分析
    rustAsyncNetwork?: RustAsyncNetworkAnalysis;
    // React状态管理分析
    reactStateManagement?: import('./reactStateManagementAnalyzer').ReactStateManagementAnalysis;
    // Rust性能分析
    rustDetailedPerformance?: RustDetailedPerformanceAnalysis;
    // React高级性能分析
    reactPerformanceIssues?: ReactPerformanceIssue[];
    reactArchitecturePattern?: ReactArchitecturePattern;
    // Rust后端架构分析
    rustBackendArchitecture?: any; // RustBackendArchitectureAnalysis;
}

export interface FunctionInfo {
    name: string;
    displayName: string;  // 中文翻译
    parameters: Parameter[];
    returnType: string;
    line: number;
    column: number;
    description: string;
}

export interface ClassInfo {
    name: string;
    displayName: string;  // 中文翻译
    methods: FunctionInfo[];
    properties: VariableInfo[];
    line: number;
    column: number;
}

export interface ImportInfo {
    moduleName: string;
    importedItems: string[];
    line: number;
}

export interface VariableInfo {
    name: string;
    type: string;
    line: number;
    scope: string;
}

export interface Parameter {
    name: string;
    type: string;
    optional: boolean;
}

export class CodeAnalyzer {
    private translationMap: Map<string, string>;
    private reactAnalyzer: ReactAnalyzer;
    private rustAnalyzer: RustAnalyzer;
    private advancedReactAnalyzer: AdvancedReactAnalyzer;
    private advancedRustAnalyzer: AdvancedRustAnalyzer;
    private advancedRustEcosystemAnalyzer: AdvancedRustEcosystemAnalyzer;
    private advancedReactPerformanceAnalyzer: AdvancedReactPerformanceAnalyzer;
    private advancedRustMicroserviceAnalyzer: AdvancedRustMicroserviceAnalyzer;
    private advancedReactArchitectureAnalyzer: AdvancedReactArchitectureAnalyzer;
    private advancedRustArchitectureAnalyzer: AdvancedRustArchitectureAnalyzer;
    // 新增的高级分析器
    private advancedReactStateAnalyzer: AdvancedReactStateAnalyzer;
    private advancedRustSystemAnalyzer: AdvancedRustSystemAnalyzer;
    private reactRuntimeAnalyzer: ReactRuntimeAnalyzer;
    private reactHookAnalyzer: ReactHookAnalyzer;
    private rustAsyncNetworkAnalyzer: RustAsyncNetworkAnalyzer;
    private reactStateManagementAnalyzer: ReactStateManagementAnalyzer;
    private rustPerformanceAnalyzer: RustPerformanceAnalyzer;
    private reactAdvancedAnalyzer: ReactAdvancedAnalyzer;
    private rustBackendArchitectureAnalyzer: RustBackendArchitectureAnalyzer;

    constructor() {
        this.reactAnalyzer = new ReactAnalyzer();
        this.rustAnalyzer = new RustAnalyzer();
        this.advancedReactAnalyzer = new AdvancedReactAnalyzer();
        this.advancedRustAnalyzer = new AdvancedRustAnalyzer();
        this.advancedRustEcosystemAnalyzer = new AdvancedRustEcosystemAnalyzer();
        this.advancedReactPerformanceAnalyzer = new AdvancedReactPerformanceAnalyzer();
        this.advancedRustMicroserviceAnalyzer = new AdvancedRustMicroserviceAnalyzer();
        this.advancedReactArchitectureAnalyzer = new AdvancedReactArchitectureAnalyzer();
        this.advancedRustArchitectureAnalyzer = new AdvancedRustArchitectureAnalyzer();
        // 初始化新的分析器
        this.advancedReactStateAnalyzer = new AdvancedReactStateAnalyzer();
        this.advancedRustSystemAnalyzer = new AdvancedRustSystemAnalyzer();
        this.reactRuntimeAnalyzer = new ReactRuntimeAnalyzer();
        this.reactHookAnalyzer = new ReactHookAnalyzer();
        this.rustAsyncNetworkAnalyzer = new RustAsyncNetworkAnalyzer();
        this.reactStateManagementAnalyzer = new ReactStateManagementAnalyzer();
        this.rustPerformanceAnalyzer = new RustPerformanceAnalyzer();
        this.reactAdvancedAnalyzer = new ReactAdvancedAnalyzer();
        this.rustBackendArchitectureAnalyzer = new RustBackendArchitectureAnalyzer();
        this.translationMap = new Map([
            // React/TypeScript 翻译
            ['useState', '使用状态'],
            ['useEffect', '使用副作用'],
            ['useContext', '使用上下文'],
            ['component', '组件'],
            ['props', '属性'],
            ['state', '状态'],
            ['function', '函数'],
            ['const', '常量'],
            ['let', '变量'],
            ['var', '变量'],
            ['interface', '接口'],
            ['type', '类型'],
            ['class', '类'],
            ['export', '导出'],
            ['import', '导入'],
            ['return', '返回'],
            
            // Rust 翻译
            ['fn', '函数'],
            ['struct', '结构体'],
            ['impl', '实现'],
            ['trait', '特征'],
            ['enum', '枚举'],
            ['match', '匹配'],
            ['pub', '公共'],
            ['mod', '模块'],
            ['use', '使用'],
            ['let', '绑定'],
            ['mut', '可变'],
            ['Result', '结果类型'],
            ['Option', '选项类型'],
            ['Vec', '向量'],
            ['HashMap', '哈希映射']
        ]);
    }

    async analyzeFile(document: vscode.TextDocument): Promise<CodeAnalysis> {
        const text = document.getText();
        const language = document.languageId;
        const fileName = document.fileName;

        let analysis: CodeAnalysis = {
            fileName,
            language,
            functions: [],
            classes: [],
            imports: [],
            variables: []
        };

        try {
            if (language === 'typescript' || language === 'javascript') {
                analysis = await this.analyzeTypeScript(text, fileName, language);
                // 添加React特定分析
                if (this.isReactFile(text)) {
                    analysis.reactComponents = this.reactAnalyzer.analyzeReactCode(text, fileName);
                    // 添加高级React分析
                    const advancedAnalysis = this.advancedReactAnalyzer.analyzeReactEcosystem(text, fileName);
                    analysis.reactRoutes = advancedAnalysis.routes;
                    analysis.reactContexts = advancedAnalysis.contexts;
                    analysis.reduxStores = advancedAnalysis.stores;
                    analysis.reactForms = advancedAnalysis.forms;
                    analysis.apiCalls = advancedAnalysis.apiCalls;
                }
                // 添加React性能和架构分析
                const performanceAnalysis = this.advancedReactPerformanceAnalyzer.analyzeReactPerformance(text, fileName);
                analysis.reactPerformance = performanceAnalysis.performance;
                analysis.reactArchitecture = performanceAnalysis.architecture;
                
                // 添加React高级架构分析
                const reactArchAnalysis = this.advancedReactArchitectureAnalyzer.analyze(text, fileName);
                analysis.reactAdvancedArchitecture = reactArchAnalysis;
                
                // 添加新的React高级分析
                if (this.isReactFile(text)) {
                    const reactStateAnalysis = this.advancedReactStateAnalyzer.analyzeReactState(text, fileName);
                    analysis.reactAdvancedState = reactStateAnalysis;
                    analysis.reactCommunication = reactStateAnalysis.componentCommunication;
                    analysis.reactDataBinding = reactStateAnalysis.dataBinding;
                    
                    const reactRuntimeAnalysis = this.reactRuntimeAnalyzer.analyzeReactRuntime(text, fileName);
                    analysis.reactRuntime = reactRuntimeAnalysis;
                    analysis.reactDebugging = reactRuntimeAnalysis.debuggingAnalysis;
                    analysis.reactTesting = reactRuntimeAnalysis.testingAnalysis;
                    
                    // 添加React Hook分析
                    const reactHookAnalysis = this.reactHookAnalyzer.analyzeReactHooks(text, fileName);
                    analysis.reactHooks = reactHookAnalysis;
                    
                    // 添加React状态管理分析
                    const reactStateManagementAnalysis = this.reactStateManagementAnalyzer.analyzeReactStateManagement(text, fileName);
                    analysis.reactStateManagement = reactStateManagementAnalysis;
                    
                    // 添加React高级性能和架构分析
                    const reactComponents = analysis.reactComponents || [];
                    const reactPerformanceIssues = this.reactAdvancedAnalyzer.analyzePerformance(text, fileName, reactComponents);
                    const reactArchPattern = this.reactAdvancedAnalyzer.analyzeArchitecture(text, reactComponents, 
                        analysis.reactContexts || [], analysis.reduxStores || []);
                    analysis.reactPerformanceIssues = reactPerformanceIssues;
                    analysis.reactArchitecturePattern = reactArchPattern;
                }
            } else if (language === 'rust') {
                analysis = await this.analyzeRust(text, fileName, language);
                // 添加Rust特定分析
                const rustAnalysis = this.rustAnalyzer.analyzeRustCode(text, fileName);
                analysis.rustStructs = rustAnalysis.structs;
                analysis.rustEnums = rustAnalysis.enums;
                analysis.rustTraits = rustAnalysis.traits;
                analysis.rustImpls = rustAnalysis.impls;
                analysis.rustFunctions = rustAnalysis.functions;
                analysis.rustModules = rustAnalysis.modules;
                // 添加高级Rust分析
                const advancedRustAnalysis = this.advancedRustAnalyzer.analyzeRustEcosystem(text, fileName);
                analysis.rustWebHandlers = advancedRustAnalysis.webHandlers;
                analysis.rustDbModels = advancedRustAnalysis.dbModels;
                analysis.rustAsyncTasks = advancedRustAnalysis.asyncTasks;
                analysis.rustErrorTypes = advancedRustAnalysis.errorTypes;
                analysis.rustConfigs = advancedRustAnalysis.configs;
                analysis.rustTests = advancedRustAnalysis.tests;
                // 添加Rust生态系统分析
                const ecosystemAnalysis = this.advancedRustEcosystemAnalyzer.analyzeRustEcosystem(text, fileName);
                analysis.rustMacros = ecosystemAnalysis.macros;
                analysis.rustLifetimes = ecosystemAnalysis.lifetimes;
                analysis.rustConcurrency = ecosystemAnalysis.concurrency;
                analysis.rustPerformance = ecosystemAnalysis.performance;
                analysis.rustSafety = ecosystemAnalysis.safety;
                // 添加Rust微服务架构分析
                const microserviceAnalysis = this.advancedRustMicroserviceAnalyzer.analyzeRustMicroservice(text, fileName);
                analysis.rustMicroserviceArchitecture = microserviceAnalysis.architecture;
                analysis.rustDatabaseOptimization = microserviceAnalysis.database;
                analysis.rustConcurrencyOptimization = microserviceAnalysis.concurrency;
                
                // 添加Rust高级架构分析
                const rustArchAnalysis = this.advancedRustArchitectureAnalyzer.analyze(text, fileName);
                analysis.rustAdvancedArchitecture = rustArchAnalysis;
                
                // 添加新的Rust系统分析
                const rustSystemAnalysis = this.advancedRustSystemAnalyzer.analyzeRustSystem(text, fileName);
                analysis.rustAdvancedSystem = rustSystemAnalysis;
                analysis.rustSystemPerformance = rustSystemAnalysis.performance;
                analysis.rustSystemArchitecture = rustSystemAnalysis.systemArchitecture;
                
                // 添加Rust异步网络分析
                const rustAsyncNetworkAnalysis = this.rustAsyncNetworkAnalyzer.analyzeRustAsyncNetwork(text, fileName);
                analysis.rustAsyncNetwork = rustAsyncNetworkAnalysis;
                
                // 添加Rust详细性能分析
                const rustDetailedPerformanceAnalysis = this.rustPerformanceAnalyzer.analyzeRustPerformance(text, fileName);
                analysis.rustDetailedPerformance = rustDetailedPerformanceAnalysis;
                
                // 添加Rust后端架构分析
                const rustBackendAnalysis = this.rustBackendArchitectureAnalyzer.analyze(text, fileName);
                analysis.rustBackendArchitecture = rustBackendAnalysis;
            }
        } catch (error) {
            // 使用VSCode的输出通道而不是console
            vscode.window.showErrorMessage('代码分析错误: ' + error);
            throw error;
        }

        return analysis;
    }

    private async analyzeTypeScript(text: string, fileName: string, language: string): Promise<CodeAnalysis> {
        const analysis: CodeAnalysis = {
            fileName,
            language,
            functions: [],
            classes: [],
            imports: [],
            variables: []
        };

        const lines = text.split('\n');

        // 简单的正则表达式解析（后续可以用更强大的AST解析器）
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 解析函数
            const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/);
            if (functionMatch) {
                const functionName = functionMatch[1];
                analysis.functions.push({
                    name: functionName,
                    displayName: this.translateIdentifier(functionName),
                    parameters: this.extractParameters(line),
                    returnType: this.extractReturnType(line),
                    line: lineNumber,
                    column: line.indexOf(functionName),
                    description: this.generateDescription(functionName, 'function')
                });
            }

            // 解析箭头函数
            const arrowFuncMatch = line.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
            if (arrowFuncMatch) {
                const functionName = arrowFuncMatch[1];
                analysis.functions.push({
                    name: functionName,
                    displayName: this.translateIdentifier(functionName),
                    parameters: this.extractParameters(line),
                    returnType: 'unknown',
                    line: lineNumber,
                    column: line.indexOf(functionName),
                    description: this.generateDescription(functionName, 'arrow function')
                });
            }

            // 解析类
            const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
            if (classMatch) {
                const className = classMatch[1];
                analysis.classes.push({
                    name: className,
                    displayName: this.translateIdentifier(className),
                    methods: [],
                    properties: [],
                    line: lineNumber,
                    column: line.indexOf(className)
                });
            }

            // 解析导入
            const importMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                const importedItems = importMatch[1].split(',').map(item => item.trim());
                const moduleName = importMatch[2];
                analysis.imports.push({
                    moduleName,
                    importedItems,
                    line: lineNumber
                });
            }
        }

        return analysis;
    }

    private async analyzeRust(text: string, fileName: string, language: string): Promise<CodeAnalysis> {
        const analysis: CodeAnalysis = {
            fileName,
            language,
            functions: [],
            classes: [],
            imports: [],
            variables: []
        };

        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 解析函数
            const functionMatch = line.match(/(?:pub\s+)?fn\s+(\w+)\s*\(/);
            if (functionMatch) {
                const functionName = functionMatch[1];
                analysis.functions.push({
                    name: functionName,
                    displayName: this.translateIdentifier(functionName),
                    parameters: this.extractRustParameters(line),
                    returnType: this.extractRustReturnType(line),
                    line: lineNumber,
                    column: line.indexOf(functionName),
                    description: this.generateDescription(functionName, 'function')
                });
            }

            // 解析结构体
            const structMatch = line.match(/(?:pub\s+)?struct\s+(\w+)/);
            if (structMatch) {
                const structName = structMatch[1];
                analysis.classes.push({
                    name: structName,
                    displayName: this.translateIdentifier(structName),
                    methods: [],
                    properties: [],
                    line: lineNumber,
                    column: line.indexOf(structName)
                });
            }

            // 解析use语句
            const useMatch = line.match(/use\s+([^;]+);/);
            if (useMatch) {
                const usePath = useMatch[1];
                analysis.imports.push({
                    moduleName: usePath,
                    importedItems: [usePath],
                    line: lineNumber
                });
            }
        }

        return analysis;
    }

    private translateIdentifier(identifier: string): string {
        // 尝试直接翻译
        if (this.translationMap.has(identifier)) {
            return this.translationMap.get(identifier)!;
        }

        // 翻译常见的编程模式
        if (identifier.startsWith('use')) {
            return '使用' + identifier.substring(3);
        }
        if (identifier.startsWith('get')) {
            return '获取' + identifier.substring(3);
        }
        if (identifier.startsWith('set')) {
            return '设置' + identifier.substring(3);
        }
        if (identifier.startsWith('create')) {
            return '创建' + identifier.substring(6);
        }
        if (identifier.startsWith('update')) {
            return '更新' + identifier.substring(6);
        }
        if (identifier.startsWith('delete')) {
            return '删除' + identifier.substring(6);
        }

        // 如果无法翻译，返回原名
        return identifier;
    }

    private extractParameters(line: string): Parameter[] {
        const paramMatch = line.match(/\(([^)]*)\)/);
        if (!paramMatch) {return [];}

        const paramStr = paramMatch[1];
        if (!paramStr.trim()) {return [];}

        return paramStr.split(',').map(param => {
            const trimmed = param.trim();
            const parts = trimmed.split(':');
            return {
                name: parts[0]?.trim() || '',
                type: parts[1]?.trim() || 'any',
                optional: trimmed.includes('?')
            };
        });
    }

    private extractRustParameters(line: string): Parameter[] {
        const paramMatch = line.match(/\(([^)]*)\)/);
        if (!paramMatch) {return [];}

        const paramStr = paramMatch[1];
        if (!paramStr.trim()) {return [];}

        return paramStr.split(',').map(param => {
            const trimmed = param.trim();
            const parts = trimmed.split(':');
            return {
                name: parts[0]?.trim() || '',
                type: parts[1]?.trim() || 'unknown',
                optional: false
            };
        });
    }

    private extractReturnType(line: string): string {
        const returnMatch = line.match(/:\s*([^{]+)\s*{/);
        return returnMatch ? returnMatch[1].trim() : 'void';
    }

    private extractRustReturnType(line: string): string {
        const returnMatch = line.match(/->\s*([^{]+)\s*{/);
        return returnMatch ? returnMatch[1].trim() : '()';
    }

    private generateDescription(name: string, type: string): string {
        const translatedName = this.translateIdentifier(name);
        const translatedType = this.translationMap.get(type) || type;
        return `${translatedType}: ${translatedName}`;
    }

    private isReactFile(text: string): boolean {
        // 检查文件是否包含React相关内容
        return text.includes('import React') || 
               text.includes('from \'react\'') || 
               text.includes('from "react"') ||
               text.includes('useState') ||
               text.includes('useEffect') ||
               text.includes('jsx') ||
               text.includes('tsx') ||
               text.includes('<') && text.includes('/>');
    }
}
