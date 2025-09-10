import * as vscode from 'vscode';
import { CodeAnalysis } from './codeAnalyzer';

export class VisualPanelProvider {
    public static currentPanel: VisualPanelProvider | undefined;
    public static readonly viewType = 'visualProgramming';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _codeAnalysis: CodeAnalysis | null = null;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (VisualPanelProvider.currentPanel) {
            VisualPanelProvider.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            VisualPanelProvider.viewType,
            '代码可视化工作流',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out', 'compiled')
                ]
            }
        );

        VisualPanelProvider.currentPanel = new VisualPanelProvider(panel, extensionUri);
    }

    public static kill() {
        VisualPanelProvider.currentPanel?.dispose();
        VisualPanelProvider.currentPanel = undefined;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        VisualPanelProvider.currentPanel = new VisualPanelProvider(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        VisualPanelProvider.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public updateCodeAnalysis(analysis: CodeAnalysis) {
        this._codeAnalysis = analysis;
        this._update();
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        
        // 监听来自webview的消息
        webview.onDidReceiveMessage(
            (data) => {
                switch (data.type) {
                    case 'onInfo':
                        if (!data.value) {
                            return;
                        }
                        vscode.window.showInformationMessage(data.value);
                        break;
                    case 'onError':
                        if (!data.value) {
                            return;
                        }
                        vscode.window.showErrorMessage(data.value);
                        break;
                    case 'onNodeClick':
                        this._handleNodeClick(data.value);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private _handleNodeClick(nodeData: any) {
        // 处理节点点击事件，跳转到对应的代码位置
        if (nodeData.file && nodeData.line) {
            const uri = vscode.Uri.file(nodeData.file);
            const position = new vscode.Position(nodeData.line - 1, nodeData.column || 0);
            vscode.window.showTextDocument(uri).then(editor => {
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // 生成可视化工作流的HTML
        const analysisData = this._codeAnalysis ? JSON.stringify(this._codeAnalysis) : 'null';
        
        return `<!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>代码可视化工作流</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: 'Microsoft YaHei', sans-serif;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                
                .container {
                    width: 100%;
                    height: 100vh;
                    position: relative;
                    overflow: hidden;
                }
                
                .toolbar {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    z-index: 1000;
                    background: var(--vscode-panel-background);
                    padding: 10px;
                    border-radius: 5px;
                    border: 1px solid var(--vscode-panel-border);
                }
                
                .canvas {
                    width: 100%;
                    height: 100%;
                    background: 
                        radial-gradient(circle, var(--vscode-editorLineNumber-foreground) 1px, transparent 1px);
                    background-size: 20px 20px;
                    position: relative;
                }
                
                .node {
                    position: absolute;
                    background: var(--vscode-button-background);
                    border: 2px solid var(--vscode-button-border);
                    border-radius: 8px;
                    padding: 15px;
                    cursor: move;
                    user-select: none;
                    min-width: 150px;
                    max-width: 300px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    transition: transform 0.2s ease;
                }
                
                .node:hover {
                    transform: scale(1.05);
                    border-color: var(--vscode-focusBorder);
                }
                
                .node-title {
                    font-weight: bold;
                    font-size: 14px;
                    color: var(--vscode-button-foreground);
                    margin-bottom: 8px;
                }
                
                .node-subtitle {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 5px;
                }
                
                .node-description {
                    font-size: 11px;
                    color: var(--vscode-editorLineNumber-foreground);
                    word-wrap: break-word;
                }
                
                .function-node {
                    border-color: #4CAF50;
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                }
                
                .class-node {
                    border-color: #2196F3;
                    background: linear-gradient(135deg, #2196F3, #1976D2);
                }
                
                .import-node {
                    border-color: #FF9800;
                    background: linear-gradient(135deg, #FF9800, #F57C00);
                }
                
                /* React组件节点 */
                .react-component-node {
                    border-color: #61DAFB;
                    background: linear-gradient(135deg, #61DAFB, #21A1C4);
                    color: #000;
                }
                
                .react-component-node .node-title {
                    color: #000;
                    font-weight: bold;
                }
                
                /* Rust结构体节点 */
                .rust-struct-node {
                    border-color: #CE422B;
                    background: linear-gradient(135deg, #CE422B, #A33A2A);
                }
                
                /* Rust枚举节点 */
                .rust-enum-node {
                    border-color: #8B4513;
                    background: linear-gradient(135deg, #8B4513, #A0522D);
                }
                
                /* Rust特征节点 */
                .rust-trait-node {
                    border-color: #9C27B0;
                    background: linear-gradient(135deg, #9C27B0, #7B1FA2);
                }
                
                /* Rust函数节点 */
                .rust-function-node {
                    border-color: #FF5722;
                    background: linear-gradient(135deg, #FF5722, #E64A19);
                }
                
                .info-panel {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 250px;
                    background: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 5px;
                    padding: 15px;
                    z-index: 1000;
                }
                
                .info-title {
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: var(--vscode-panel-title-foreground);
                }
                
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--vscode-descriptionForeground);
                }
                
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                /* React高级分析节点样式 */
                .react-route-node {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                }

                .react-context-node {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border-color: #f093fb;
                }

                .redux-store-node {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    border-color: #4facfe;
                }

                .api-call-node {
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                    border-color: #43e97b;
                }

                /* Rust高级分析节点样式 */
                .rust-web-handler-node {
                    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                    border-color: #fa709a;
                }

                .rust-db-model-node {
                    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                    border-color: #a8edea;
                }

                .rust-async-task-node {
                    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                    border-color: #ffecd2;
                }

                /* Rust生态系统高级节点样式 */
                .rust-macro-node {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                    color: white;
                }

                .rust-lifetime-node {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border-color: #f093fb;
                    color: white;
                }

                .rust-channel-node {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    border-color: #4facfe;
                    color: white;
                }

                .rust-mutex-node {
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                    border-color: #43e97b;
                    color: black;
                }

                .rust-spawn-node {
                    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                    border-color: #fa709a;
                    color: black;
                }

                .rust-allocation-node {
                    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                    border-color: #a8edea;
                    color: black;
                }

                .rust-clone-node {
                    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                    border-color: #ffecd2;
                    color: black;
                }

                .rust-unsafe-node {
                    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
                    border-color: #ff9a9e;
                    color: black;
                    border-width: 3px;
                    border-style: dashed;
                }

                .rust-pointer-node {
                    background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
                    border-color: #a18cd1;
                    color: white;
                }

                /* 微服务相关节点样式 */
                .microservice-node { 
                    background: linear-gradient(135deg, #00bcd4, #0097a7); 
                    color: white; 
                    border: 2px solid #006064;
                }
                .database-query-node { 
                    background: linear-gradient(135deg, #8bc34a, #689f38); 
                    color: white; 
                    border: 2px solid #33691e;
                }
                .thread-pool-node { 
                    background: linear-gradient(135deg, #ff9800, #f57c00); 
                    color: white; 
                    border: 2px solid #e65100;
                }
                .parallelization-node { 
                    background: linear-gradient(135deg, #9c27b0, #7b1fa2); 
                    color: white; 
                    border: 2px solid #4a148c;
                }
                .security-pattern-node { 
                    background: linear-gradient(135deg, #f44336, #d32f2f); 
                    color: white; 
                    border: 2px solid #b71c1c;
                }

                /* React 架构分析节点样式 */
                .architecture-pattern-node {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                    color: white;
                }

                .component-hierarchy-node {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border-color: #f093fb;
                    color: white;
                }

                .state-management-node {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    border-color: #4facfe;
                    color: white;
                }

                .render-optimization-node {
                    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                    border-color: #fa709a;
                    color: black;
                }

                .code-splitting-node {
                    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                    border-color: #a8edea;
                    color: black;
                }

                /* Rust 架构分析节点样式 */
                .system-design-node {
                    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
                    border-color: #ff9a9e;
                    color: black;
                }

                .distributed-systems-node {
                    background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
                    border-color: #a18cd1;
                    color: white;
                }

                .resource-management-node {
                    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                    border-color: #ffecd2;
                    color: black;
                }

                /* 标签样式 */
                .method-tag {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 3px;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                .tag {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 3px;
                    background-color: #28a745;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                }
                
                .tag.warning { background-color: #ff9800; }
                .tag.info { background-color: #2196f3; }
                .tag.error { background-color: #f44336; }
                .tag.success { background-color: #4caf50; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="toolbar">
                    <button onclick="resetView()">重置视图</button>
                    <button onclick="autoLayout()">自动布局</button>
                    <button onclick="exportImage()">导出图片</button>
                </div>
                
                <div class="info-panel">
                    <div class="info-title">文件信息</div>
                    <div id="fileInfo">请先分析代码文件</div>
                </div>
                
                <div class="canvas" id="canvas">
                    <div class="empty-state" id="emptyState">
                        <div class="empty-icon">📊</div>
                        <h3>代码可视化工作流</h3>
                        <p>请使用 "分析代码结构" 命令来生成可视化视图</p>
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let codeAnalysis = ${analysisData};
                let nodes = [];
                let draggedNode = null;
                let offset = { x: 0, y: 0 };
                
                function init() {
                    if (codeAnalysis) {
                        renderNodes();
                        updateFileInfo();
                        document.getElementById('emptyState').style.display = 'none';
                    }
                }
                
                function renderNodes() {
                    const canvas = document.getElementById('canvas');
                    canvas.innerHTML = ''; // 清空画布
                    
                    let nodeIndex = 0;
                    const nodeSpacing = { x: 220, y: 180 };
                    
                    // 渲染React组件
                    if (codeAnalysis.reactComponents) {
                        codeAnalysis.reactComponents.forEach((component, index) => {
                            const node = createReactComponentNode(component, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    // 渲染Rust结构体
                    if (codeAnalysis.rustStructs) {
                        codeAnalysis.rustStructs.forEach((struct, index) => {
                            const node = createRustStructNode(struct, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    // 渲染Rust枚举
                    if (codeAnalysis.rustEnums) {
                        codeAnalysis.rustEnums.forEach((enumItem, index) => {
                            const node = createRustEnumNode(enumItem, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    // 渲染Rust特征
                    if (codeAnalysis.rustTraits) {
                        codeAnalysis.rustTraits.forEach((trait, index) => {
                            const node = createRustTraitNode(trait, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    // 渲染Rust函数
                    if (codeAnalysis.rustFunctions) {
                        codeAnalysis.rustFunctions.forEach((func, index) => {
                            const node = createRustFunctionNode(func, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    // 渲染React高级分析结果
                    if (codeAnalysis.reactRoutes) {
                        codeAnalysis.reactRoutes.forEach((route, index) => {
                            const node = createReactRouteNode(route, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    if (codeAnalysis.reactContexts) {
                        codeAnalysis.reactContexts.forEach((context, index) => {
                            const node = createReactContextNode(context, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    if (codeAnalysis.reduxStores) {
                        codeAnalysis.reduxStores.forEach((store, index) => {
                            const node = createReduxStoreNode(store, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    if (codeAnalysis.apiCalls) {
                        codeAnalysis.apiCalls.forEach((api, index) => {
                            const node = createAPICallNode(api, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    // 渲染React架构分析结果
                    if (codeAnalysis.reactArchitecture) {
                        // 架构模式
                        if (codeAnalysis.reactArchitecture.patterns) {
                            codeAnalysis.reactArchitecture.patterns.forEach((pattern, index) => {
                                const node = createArchitecturePatternNode(pattern, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 组件层次结构
                        if (codeAnalysis.reactArchitecture.componentHierarchy) {
                            codeAnalysis.reactArchitecture.componentHierarchy.forEach((hierarchy, index) => {
                                const node = createComponentHierarchyNode(hierarchy, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 状态管理
                        if (codeAnalysis.reactArchitecture.stateManagement) {
                            codeAnalysis.reactArchitecture.stateManagement.forEach((state, index) => {
                                const node = createStateManagementNode(state, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染优化
                        if (codeAnalysis.reactArchitecture.renderOptimization) {
                            codeAnalysis.reactArchitecture.renderOptimization.forEach((optimization, index) => {
                                const node = createRenderOptimizationNode(optimization, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 代码分割
                        if (codeAnalysis.reactArchitecture.codeSplitting) {
                            codeAnalysis.reactArchitecture.codeSplitting.forEach((splitting, index) => {
                                const node = createCodeSplittingNode(splitting, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                    }

                    // 渲染Rust高级分析结果
                    if (codeAnalysis.rustWebHandlers) {
                        codeAnalysis.rustWebHandlers.forEach((handler, index) => {
                            const node = createRustWebHandlerNode(handler, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    if (codeAnalysis.rustDbModels) {
                        codeAnalysis.rustDbModels.forEach((model, index) => {
                            const node = createRustDbModelNode(model, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    if (codeAnalysis.rustAsyncTasks) {
                        codeAnalysis.rustAsyncTasks.forEach((task, index) => {
                            const node = createRustAsyncTaskNode(task, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    // 渲染Rust生态系统高级分析结果
                    if (codeAnalysis.rustMacros) {
                        codeAnalysis.rustMacros.forEach((macro, index) => {
                            const node = createRustMacroNode(macro, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    if (codeAnalysis.rustLifetimes) {
                        codeAnalysis.rustLifetimes.forEach((lifetime, index) => {
                            const node = createRustLifetimeNode(lifetime, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    if (codeAnalysis.rustConcurrency) {
                        // 渲染通道
                        if (codeAnalysis.rustConcurrency.channels) {
                            codeAnalysis.rustConcurrency.channels.forEach((channel, index) => {
                                const node = createRustChannelNode(channel, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染互斥锁
                        if (codeAnalysis.rustConcurrency.mutexes) {
                            codeAnalysis.rustConcurrency.mutexes.forEach((mutex, index) => {
                                const node = createRustMutexNode(mutex, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染任务生成
                        if (codeAnalysis.rustConcurrency.spawns) {
                            codeAnalysis.rustConcurrency.spawns.forEach((spawn, index) => {
                                const node = createRustSpawnNode(spawn, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                    }

                    if (codeAnalysis.rustPerformance) {
                        // 渲染性能问题
                        if (codeAnalysis.rustPerformance.allocations) {
                            codeAnalysis.rustPerformance.allocations.forEach((alloc, index) => {
                                const node = createRustAllocationNode(alloc, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        if (codeAnalysis.rustPerformance.clones) {
                            codeAnalysis.rustPerformance.clones.forEach((clone, index) => {
                                const node = createRustCloneNode(clone, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                    }

                    if (codeAnalysis.rustSafety) {
                        // 渲染安全问题
                        if (codeAnalysis.rustSafety.unsafeBlocks) {
                            codeAnalysis.rustSafety.unsafeBlocks.forEach((block, index) => {
                                const node = createRustUnsafeBlockNode(block, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        if (codeAnalysis.rustSafety.rawPointers) {
                            codeAnalysis.rustSafety.rawPointers.forEach((ptr, index) => {
                                const node = createRustRawPointerNode(ptr, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                    }
                    
                    // 渲染Rust架构分析结果
                    if (codeAnalysis.rustArchitecture) {
                        // 架构模式
                        if (codeAnalysis.rustArchitecture.patterns) {
                            codeAnalysis.rustArchitecture.patterns.forEach((pattern, index) => {
                                const node = createRustArchitecturePatternNode(pattern, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 系统设计
                        if (codeAnalysis.rustArchitecture.systemDesign) {
                            codeAnalysis.rustArchitecture.systemDesign.forEach((design, index) => {
                                const node = createSystemDesignNode(design, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 分布式系统
                        if (codeAnalysis.rustArchitecture.distributedSystems) {
                            codeAnalysis.rustArchitecture.distributedSystems.forEach((system, index) => {
                                const node = createDistributedSystemsNode(system, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 资源管理
                        if (codeAnalysis.rustArchitecture.resourceManagement) {
                            codeAnalysis.rustArchitecture.resourceManagement.forEach((resource, index) => {
                                const node = createResourceManagementNode(resource, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                    }
                    
                    // 渲染微服务分析结果
                    if (codeAnalysis.microservices) {
                        codeAnalysis.microservices.forEach((service, index) => {
                            const node = createMicroserviceNode(service, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    if (codeAnalysis.databaseQueries) {
                        codeAnalysis.databaseQueries.forEach((query, index) => {
                            const node = createDatabaseQueryNode(query, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    if (codeAnalysis.threadPools) {
                        codeAnalysis.threadPools.forEach((pool, index) => {
                            const node = createThreadPoolNode(pool, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    if (codeAnalysis.parallelizationOpportunities) {
                        codeAnalysis.parallelizationOpportunities.forEach((opportunity, index) => {
                            const node = createParallelizationNode(opportunity, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    if (codeAnalysis.securityPatterns) {
                        codeAnalysis.securityPatterns.forEach((security, index) => {
                            const node = createSecurityPatternNode(security, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    // 渲染TypeScript/JavaScript函数（原有逻辑）
                    if (codeAnalysis.functions) {
                        codeAnalysis.functions.forEach((func, index) => {
                            const node = createFunctionNode(func, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    // 渲染类/结构体节点（原有逻辑）
                    if (codeAnalysis.classes) {
                        codeAnalysis.classes.forEach((cls, index) => {
                            const node = createClassNode(cls, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }
                    
                    // 渲染导入节点
                    if (codeAnalysis.imports && codeAnalysis.imports.length > 0) {
                        const importNode = createImportNode(codeAnalysis.imports, nodeIndex);
                        positionNode(importNode, nodeIndex, nodeSpacing);
                        canvas.appendChild(importNode);
                    }
                }
                
                function createFunctionNode(func, index) {
                    const node = document.createElement('div');
                    node.className = 'node function-node';
                    node.dataset.type = 'function';
                    node.dataset.line = func.line;
                    node.dataset.column = func.column;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const paramText = func.parameters.length > 0 
                        ? \`(\${func.parameters.map(p => p.name).join(', ')})\`
                        : '()';
                    
                    node.innerHTML = \`
                        <div class="node-title">\${func.displayName}</div>
                        <div class="node-subtitle">函数 \${paramText}</div>
                        <div class="node-description">\${func.description}</div>
                        <div class="node-description">第 \${func.line} 行</div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createClassNode(cls, index) {
                    const node = document.createElement('div');
                    node.className = 'node class-node';
                    node.dataset.type = 'class';
                    node.dataset.line = cls.line;
                    node.dataset.column = cls.column;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const nodeType = codeAnalysis.language === 'rust' ? '结构体' : '类';
                    
                    node.innerHTML = \`
                        <div class="node-title">\${cls.displayName}</div>
                        <div class="node-subtitle">\${nodeType}</div>
                        <div class="node-description">第 \${cls.line} 行</div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createImportNode(imports, index) {
                    const node = document.createElement('div');
                    node.className = 'node import-node';
                    node.dataset.type = 'import';
                    
                    const importCount = imports.length;
                    const firstImport = imports[0];
                    
                    node.innerHTML = \`
                        <div class="node-title">导入模块</div>
                        <div class="node-subtitle">\${importCount} 个模块</div>
                        <div class="node-description">\${firstImport.moduleName}\${importCount > 1 ? ' 等' : ''}</div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createReactComponentNode(component, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-component-node';
                    node.dataset.type = 'reactComponent';
                    node.dataset.line = component.line;
                    node.dataset.column = component.column;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const hookCount = component.hooks.length;
                    const propCount = component.props.length;
                    const typeText = component.type === 'functional' ? '函数式组件' : '类组件';
                    
                    const details = [];
                    if (hookCount > 0) details.push(\`\${hookCount}个钩子\`);
                    if (propCount > 0) details.push(\`\${propCount}个属性\`);
                    const detailText = details.length > 0 ? details.join(', ') : '无状态';
                    
                    node.innerHTML = \`
                        <div class="node-title">\${component.displayName}</div>
                        <div class="node-subtitle">\${typeText}</div>
                        <div class="node-description">\${detailText}</div>
                        <div class="node-description">第 \${component.line} 行</div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustStructNode(struct, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-struct-node';
                    node.dataset.type = 'rustStruct';
                    node.dataset.line = struct.line;
                    node.dataset.column = struct.column;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const fieldCount = struct.fields.length;
                    const deriveCount = struct.derives.length;
                    
                    const details = [];
                    if (fieldCount > 0) details.push(\`\${fieldCount}个字段\`);
                    if (deriveCount > 0) details.push(\`派生\${deriveCount}个特征\`);
                    const detailText = details.length > 0 ? details.join(', ') : '空结构体';
                    
                    node.innerHTML = \`
                        <div class="node-title">\${struct.displayName}</div>
                        <div class="node-subtitle">\${struct.visibility}结构体</div>
                        <div class="node-description">\${detailText}</div>
                        <div class="node-description">第 \${struct.line} 行</div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustEnumNode(enumItem, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-enum-node';
                    node.dataset.type = 'rustEnum';
                    node.dataset.line = enumItem.line;
                    node.dataset.column = enumItem.column;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const variantCount = enumItem.variants.length;
                    const detailText = variantCount > 0 ? \`\${variantCount}个变体\` : '空枚举';
                    
                    node.innerHTML = \`
                        <div class="node-title">\${enumItem.displayName}</div>
                        <div class="node-subtitle">\${enumItem.visibility}枚举</div>
                        <div class="node-description">\${detailText}</div>
                        <div class="node-description">第 \${enumItem.line} 行</div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustTraitNode(trait, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-trait-node';
                    node.dataset.type = 'rustTrait';
                    node.dataset.line = trait.line;
                    node.dataset.column = trait.column;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const methodCount = trait.methods.length;
                    const typeCount = trait.associatedTypes.length;
                    
                    const details = [];
                    if (methodCount > 0) details.push(\`\${methodCount}个方法\`);
                    if (typeCount > 0) details.push(\`\${typeCount}个关联类型\`);
                    const detailText = details.length > 0 ? details.join(', ') : '空特征';
                    
                    node.innerHTML = \`
                        <div class="node-title">\${trait.displayName}</div>
                        <div class="node-subtitle">特征</div>
                        <div class="node-description">\${detailText}</div>
                        <div class="node-description">第 \${trait.line} 行</div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustFunctionNode(func, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-function-node';
                    node.dataset.type = 'rustFunction';
                    node.dataset.line = func.line;
                    node.dataset.column = func.column;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const paramCount = func.parameters.length;
                    const modifiers = [];
                    
                    if (func.isAsync) modifiers.push('异步');
                    if (func.isUnsafe) modifiers.push('不安全');
                    
                    const modifierText = modifiers.length > 0 ? modifiers.join('') + ' ' : '';
                    const paramText = paramCount > 0 ? \`(\${paramCount}个参数)\` : '(无参数)';
                    
                    node.innerHTML = \`
                        <div class="node-title">\${func.displayName}</div>
                        <div class="node-subtitle">\${func.visibility}\${modifierText}函数</div>
                        <div class="node-description">返回: \${func.returnType}</div>
                        <div class="node-description">第 \${func.line} 行</div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                // React高级分析节点创建函数
                function createReactRouteNode(route, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-route-node';
                    node.dataset.type = 'reactRoute';
                    node.dataset.line = route.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🚀</span>
                            <span class="node-title">路由</span>
                        </div>
                        <div class="node-content">
                            <p><strong>路径:</strong> \${route.path}</p>
                            <p><strong>组件:</strong> \${route.component}</p>
                            \${route.exact ? '<p><span class="tag">精确匹配</span></p>' : ''}
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createReactContextNode(context, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-context-node';
                    node.dataset.type = 'reactContext';
                    node.dataset.line = context.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🌐</span>
                            <span class="node-title">\${context.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>上下文:</strong> \${context.name}</p>
                            <p><strong>消费者:</strong> \${context.consumerComponents.length}个组件</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createReduxStoreNode(store, index) {
                    const node = document.createElement('div');
                    node.className = 'node redux-store-node';
                    node.dataset.type = 'reduxStore';
                    node.dataset.line = store.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🏪</span>
                            <span class="node-title">\${store.name}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>动作:</strong> \${store.actions.length}个</p>
                            <p><strong>缩减器:</strong> \${store.reducers.length}个</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createAPICallNode(api, index) {
                    const node = document.createElement('div');
                    node.className = 'node api-call-node';
                    node.dataset.type = 'apiCall';
                    node.dataset.line = api.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const methodColors = {
                        'GET': '#28a745',
                        'POST': '#007bff',
                        'PUT': '#ffc107',
                        'DELETE': '#dc3545',
                        'PATCH': '#6f42c1'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">📡</span>
                            <span class="node-title">\${api.name}</span>
                        </div>
                        <div class="node-content">
                            <p><span class="method-tag" style="background-color: \${methodColors[api.method]}">\${api.method}</span></p>
                            <p><strong>端点:</strong> \${api.endpoint}</p>
                            \${api.errorHandling ? '<p><span class="tag">错误处理</span></p>' : ''}
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                // Rust高级分析节点创建函数
                function createRustWebHandlerNode(handler, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-web-handler-node';
                    node.dataset.type = 'rustWebHandler';
                    node.dataset.line = handler.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const methodColors = {
                        'GET': '#28a745',
                        'POST': '#007bff',
                        'PUT': '#ffc107',
                        'DELETE': '#dc3545',
                        'PATCH': '#6f42c1'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🌐</span>
                            <span class="node-title">\${handler.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><span class="method-tag" style="background-color: \${methodColors[handler.method]}">\${handler.method}</span></p>
                            <p><strong>路径:</strong> \${handler.path}</p>
                            <p><strong>参数:</strong> \${handler.params.length}个</p>
                            \${handler.middleware.length > 0 ? \`<p><strong>中间件:</strong> \${handler.middleware.length}个</p>\` : ''}
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createRustDbModelNode(model, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-db-model-node';
                    node.dataset.type = 'rustDbModel';
                    node.dataset.line = model.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🗃️</span>
                            <span class="node-title">\${model.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>表名:</strong> \${model.tableName || model.name}</p>
                            <p><strong>字段:</strong> \${model.fields.length}个</p>
                            \${model.primaryKey ? \`<p><strong>主键:</strong> \${model.primaryKey}</p>\` : ''}
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createRustAsyncTaskNode(task, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-async-task-node';
                    node.dataset.type = 'rustAsyncTask';
                    node.dataset.line = task.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const taskTypeIcons = {
                        'spawn': '🚀',
                        'block_on': '⏳',
                        'join': '🔗',
                        'select': '🔀'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">\${taskTypeIcons[task.taskType] || '⚡'}</span>
                            <span class="node-title">\${task.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>类型:</strong> \${task.taskType}</p>
                            <p><strong>依赖:</strong> \${task.dependencies.length}个</p>
                            \${task.errorHandling ? '<p><span class="tag">错误处理</span></p>' : ''}
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createMicroserviceNode(service, index) {
                    const node = document.createElement('div');
                    node.className = 'node microservice-node';
                    node.dataset.type = 'microservice';
                    node.dataset.line = service.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const serviceTypeIcons = {
                        'api': '🌐',
                        'worker': '⚙️',
                        'gateway': '🚪',
                        'database': '🗄️',
                        'cache': '💾',
                        'queue': '📬'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">\${serviceTypeIcons[service.type] || '🏗️'}</span>
                            <span class="node-title">\${service.name}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>类型:</strong> \${service.type}</p>
                            <p><strong>框架:</strong> \${service.framework}</p>
                            <p><strong>端点:</strong> \${service.endpoints.length}个</p>
                            <p><strong>依赖:</strong> \${service.dependencies.length}个</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createDatabaseQueryNode(query, index) {
                    const node = document.createElement('div');
                    node.className = 'node database-query-node';
                    node.dataset.type = 'databaseQuery';
                    node.dataset.line = query.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const complexityColors = {
                        'low': '🟢',
                        'medium': '🟡',
                        'high': '🔴'
                    };
                    
                    const indexIcon = query.performance.usesIndex ? '📊' : '⚠️';
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">\${complexityColors[query.performance.estimatedComplexity]} \${indexIcon}</span>
                            <span class="node-title">\${query.type.toUpperCase()}查询</span>
                        </div>
                        <div class="node-content">
                            <p><strong>复杂度:</strong> \${query.performance.estimatedComplexity}</p>
                            <p><strong>使用索引:</strong> \${query.performance.usesIndex ? '是' : '否'}</p>
                            \${query.performance.n1Problem ? '<p><span class="tag warning">N+1问题</span></p>' : ''}
                            \${query.optimization.canBeOptimized ? '<p><span class="tag info">可优化</span></p>' : ''}
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createThreadPoolNode(pool, index) {
                    const node = document.createElement('div');
                    node.className = 'node thread-pool-node';
                    node.dataset.type = 'threadPool';
                    node.dataset.line = pool.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const utilizationEmoji = pool.utilization > 0.8 ? '🔥' : pool.utilization > 0.6 ? '⚡' : '🟢';
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">\${utilizationEmoji}</span>
                            <span class="node-title">\${pool.name}线程池</span>
                        </div>
                        <div class="node-content">
                            <p><strong>类型:</strong> \${pool.type}</p>
                            <p><strong>大小:</strong> \${pool.size}</p>
                            <p><strong>利用率:</strong> \${(pool.utilization * 100).toFixed(1)}%</p>
                            \${pool.bottlenecks.length > 0 ? \`<p><span class="tag warning">瓶颈: \${pool.bottlenecks.length}</span></p>\` : ''}
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createParallelizationNode(opportunity, index) {
                    const node = document.createElement('div');
                    node.className = 'node parallelization-node';
                    node.dataset.type = 'parallelization';
                    node.dataset.line = opportunity.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const gainEmoji = opportunity.expectedGain === 'high' ? '🎯' : 
                                     opportunity.expectedGain === 'medium' ? '📈' : '📊';
                    const complexityEmoji = opportunity.complexity === 'simple' ? '🟢' : 
                                           opportunity.complexity === 'moderate' ? '🟡' : '🔴';
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">\${gainEmoji} \${complexityEmoji}</span>
                            <span class="node-title">\${opportunity.operation}并行化</span>
                        </div>
                        <div class="node-content">
                            <p><strong>当前:</strong> \${opportunity.currentApproach}</p>
                            <p><strong>建议:</strong> \${opportunity.suggestedApproach}</p>
                            <p><strong>收益:</strong> \${opportunity.expectedGain}</p>
                            <p><strong>复杂度:</strong> \${opportunity.complexity}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createSecurityPatternNode(security, index) {
                    const node = document.createElement('div');
                    node.className = 'node security-pattern-node';
                    node.dataset.type = 'securityPattern';
                    node.dataset.line = security.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const strengthEmoji = security.strength === 'strong' ? '🔒' : 
                                         security.strength === 'medium' ? '🔓' : '⚠️';
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">\${strengthEmoji}</span>
                            <span class="node-title">\${security.type}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>实现:</strong> \${security.implementation}</p>
                            <p><strong>强度:</strong> \${security.strength}</p>
                            \${security.suggestion ? \`<p><span class="tag info">\${security.suggestion}</span></p>\` : ''}
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function positionNode(node, index, spacing) {
                    const cols = Math.ceil(Math.sqrt(index + 1));
                    const x = 50 + (index % cols) * spacing.x;
                    const y = 100 + Math.floor(index / cols) * spacing.y;
                    
                    node.style.left = x + 'px';
                    node.style.top = y + 'px';
                }
                
                function addNodeEvents(node) {
                    node.addEventListener('mousedown', startDrag);
                    node.addEventListener('click', (e) => {
                        e.stopPropagation();
                        vscode.postMessage({
                            type: 'onNodeClick',
                            value: {
                                file: node.dataset.file,
                                line: parseInt(node.dataset.line),
                                column: parseInt(node.dataset.column)
                            }
                        });
                    });
                }
                
                function startDrag(e) {
                    draggedNode = e.target.closest('.node');
                    if (!draggedNode) return;
                    
                    const rect = draggedNode.getBoundingClientRect();
                    offset.x = e.clientX - rect.left;
                    offset.y = e.clientY - rect.top;
                    
                    draggedNode.style.zIndex = '1000';
                    
                    document.addEventListener('mousemove', drag);
                    document.addEventListener('mouseup', stopDrag);
                    
                    e.preventDefault();
                }
                
                function drag(e) {
                    if (!draggedNode) return;
                    
                    const canvas = document.getElementById('canvas');
                    const canvasRect = canvas.getBoundingClientRect();
                    
                    const x = e.clientX - canvasRect.left - offset.x;
                    const y = e.clientY - canvasRect.top - offset.y;
                    
                    draggedNode.style.left = Math.max(0, x) + 'px';
                    draggedNode.style.top = Math.max(0, y) + 'px';
                }
                
                function stopDrag() {
                    if (draggedNode) {
                        draggedNode.style.zIndex = '';
                        draggedNode = null;
                    }
                    
                    document.removeEventListener('mousemove', drag);
                    document.removeEventListener('mouseup', stopDrag);
                }
                
                function updateFileInfo() {
                    const fileInfo = document.getElementById('fileInfo');
                    if (codeAnalysis) {
                        const fileName = codeAnalysis.fileName.split(/[/\\\\]/).pop();
                        const languageName = {
                            'typescript': 'TypeScript',
                            'javascript': 'JavaScript',
                            'rust': 'Rust'
                        }[codeAnalysis.language] || codeAnalysis.language;
                        
                        let infoHTML = \`
                            <strong>\${fileName}</strong><br>
                            语言: \${languageName}<br>
                        \`;
                        
                        // React特定信息
                        if (codeAnalysis.reactComponents && codeAnalysis.reactComponents.length > 0) {
                            const functionalCount = codeAnalysis.reactComponents.filter(c => c.type === 'functional').length;
                            const classCount = codeAnalysis.reactComponents.filter(c => c.type === 'class').length;
                            const totalHooks = codeAnalysis.reactComponents.reduce((sum, c) => sum + c.hooks.length, 0);
                            
                            infoHTML += \`
                                <hr style="margin: 8px 0; border-color: var(--vscode-panel-border);">
                                <strong>React组件:</strong><br>
                                函数式: \${functionalCount}<br>
                                类组件: \${classCount}<br>
                                总钩子: \${totalHooks}<br>
                            \`;
                        }
                        
                        // Rust特定信息
                        if (codeAnalysis.language === 'rust') {
                            const structCount = codeAnalysis.rustStructs?.length || 0;
                            const enumCount = codeAnalysis.rustEnums?.length || 0;
                            const traitCount = codeAnalysis.rustTraits?.length || 0;
                            const functionCount = codeAnalysis.rustFunctions?.length || 0;
                            const moduleCount = codeAnalysis.rustModules?.length || 0;
                            
                            infoHTML += \`
                                <hr style="margin: 8px 0; border-color: var(--vscode-panel-border);">
                                <strong>Rust代码:</strong><br>
                                结构体: \${structCount}<br>
                                枚举: \${enumCount}<br>
                                特征: \${traitCount}<br>
                                函数: \${functionCount}<br>
                                模块: \${moduleCount}<br>
                            \`;
                        } else {
                            // TypeScript/JavaScript信息
                            const functionCount = codeAnalysis.functions?.length || 0;
                            const classCount = codeAnalysis.classes?.length || 0;
                            const importCount = codeAnalysis.imports?.length || 0;
                            
                            infoHTML += \`
                                函数: \${functionCount}<br>
                                类: \${classCount}<br>
                                导入: \${importCount}<br>
                            \`;
                        }
                        
                        fileInfo.innerHTML = infoHTML;
                    }
                }
                
                function resetView() {
                    if (codeAnalysis) {
                        renderNodes();
                    }
                }
                
                function autoLayout() {
                    vscode.postMessage({
                        type: 'onInfo',
                        value: '自动布局功能开发中...'
                    });
                }
                
                function exportImage() {
                    vscode.postMessage({
                        type: 'onInfo',
                        value: '导出图片功能开发中...'
                    });
                }

                // React架构分析节点创建函数
                function createArchitecturePatternNode(pattern, index) {
                    const node = document.createElement('div');
                    node.className = 'node architecture-pattern-node';
                    node.dataset.type = 'architecturePattern';
                    node.dataset.line = pattern.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🏗️</span>
                            <span class="node-title">\${pattern.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>模式:</strong> \${pattern.pattern}</p>
                            <p><strong>复杂度:</strong> \${pattern.complexity}</p>
                            <p><strong>组件数:</strong> \${pattern.componentCount}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createComponentHierarchyNode(hierarchy, index) {
                    const node = document.createElement('div');
                    node.className = 'node component-hierarchy-node';
                    node.dataset.type = 'componentHierarchy';
                    node.dataset.line = hierarchy.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🌳</span>
                            <span class="node-title">\${hierarchy.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>层级:</strong> \${hierarchy.level}</p>
                            <p><strong>子组件:</strong> \${hierarchy.children}</p>
                            <p><strong>父组件:</strong> \${hierarchy.parent || '根组件'}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createStateManagementNode(state, index) {
                    const node = document.createElement('div');
                    node.className = 'node state-management-node';
                    node.dataset.type = 'stateManagement';
                    node.dataset.line = state.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🔄</span>
                            <span class="node-title">\${state.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>类型:</strong> \${state.type}</p>
                            <p><strong>状态数:</strong> \${state.stateCount}</p>
                            <p><strong>更新器:</strong> \${state.updaters}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createRenderOptimizationNode(optimization, index) {
                    const node = document.createElement('div');
                    node.className = 'node render-optimization-node';
                    node.dataset.type = 'renderOptimization';
                    node.dataset.line = optimization.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">⚡</span>
                            <span class="node-title">\${optimization.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>优化:</strong> \${optimization.optimization}</p>
                            <p><strong>策略:</strong> \${optimization.strategy}</p>
                            <p><strong>收益:</strong> \${optimization.impact}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createCodeSplittingNode(splitting, index) {
                    const node = document.createElement('div');
                    node.className = 'node code-splitting-node';
                    node.dataset.type = 'codeSplitting';
                    node.dataset.line = splitting.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">📦</span>
                            <span class="node-title">\${splitting.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>分割点:</strong> \${splitting.splitPoint}</p>
                            <p><strong>延迟:</strong> \${splitting.lazy ? '是' : '否'}</p>
                            <p><strong>大小:</strong> \${splitting.chunkSize}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                // Rust架构分析节点创建函数
                function createRustArchitecturePatternNode(pattern, index) {
                    const node = document.createElement('div');
                    node.className = 'node architecture-pattern-node';
                    node.dataset.type = 'rustArchitecturePattern';
                    node.dataset.line = pattern.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🦀</span>
                            <span class="node-title">\${pattern.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>模式:</strong> \${pattern.pattern}</p>
                            <p><strong>复杂度:</strong> \${pattern.complexity}</p>
                            <p><strong>实现:</strong> \${pattern.implementation}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createSystemDesignNode(design, index) {
                    const node = document.createElement('div');
                    node.className = 'node system-design-node';
                    node.dataset.type = 'systemDesign';
                    node.dataset.line = design.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🏛️</span>
                            <span class="node-title">\${design.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>设计:</strong> \${design.type}</p>
                            <p><strong>模块:</strong> \${design.modules}</p>
                            <p><strong>边界:</strong> \${design.boundaries}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createDistributedSystemsNode(system, index) {
                    const node = document.createElement('div');
                    node.className = 'node distributed-systems-node';
                    node.dataset.type = 'distributedSystems';
                    node.dataset.line = system.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🌐</span>
                            <span class="node-title">\${system.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>协议:</strong> \${system.protocol}</p>
                            <p><strong>节点:</strong> \${system.nodes}</p>
                            <p><strong>一致性:</strong> \${system.consistency}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createResourceManagementNode(resource, index) {
                    const node = document.createElement('div');
                    node.className = 'node resource-management-node';
                    node.dataset.type = 'resourceManagement';
                    node.dataset.line = resource.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">💾</span>
                            <span class="node-title">\${resource.displayName}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>资源:</strong> \${resource.type}</p>
                            <p><strong>管理:</strong> \${resource.management}</p>
                            <p><strong>策略:</strong> \${resource.strategy}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                // Rust生态系统节点创建函数
                function createRustMacroNode(macro, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-macro-node';
                    node.draggable = true;
                    node.dataset.type = 'rustMacro';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">📝 \${macro.displayName}</div>
                        <div class="node-content">
                            <div>原名: \${macro.name}</div>
                            <div>类型: \${macro.macroType}</div>
                            <div>行号: \${macro.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustLifetimeNode(lifetime, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-lifetime-node';
                    node.draggable = true;
                    node.dataset.type = 'rustLifetime';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">⏰ '\${lifetime.name}</div>
                        <div class="node-content">
                            <div>作用域: \${lifetime.scope}</div>
                            <div>约束: \${lifetime.constraints.join(', ') || '无'}</div>
                            <div>行号: \${lifetime.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustChannelNode(channel, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-channel-node';
                    node.draggable = true;
                    node.dataset.type = 'rustChannel';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">📡 \${channel.channelType}通道</div>
                        <div class="node-content">
                            <div>发送者: \${channel.sender}</div>
                            <div>接收者: \${channel.receiver}</div>
                            <div>数据类型: \${channel.dataType}</div>
                            <div>行号: \${channel.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustMutexNode(mutex, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-mutex-node';
                    node.draggable = true;
                    node.dataset.type = 'rustMutex';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">🔒 \${mutex.name}</div>
                        <div class="node-content">
                            <div>数据类型: \${mutex.dataType}</div>
                            <div>锁类型: \${mutex.lockType}</div>
                            <div>行号: \${mutex.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustSpawnNode(spawn, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-spawn-node';
                    node.draggable = true;
                    node.dataset.type = 'rustSpawn';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">🚀 \${spawn.runtime}任务</div>
                        <div class="node-content">
                            <div>类型: \${spawn.blocking ? '阻塞' : '异步'}</div>
                            <div>任务名: \${spawn.taskName || '匿名'}</div>
                            <div>行号: \${spawn.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustAllocationNode(alloc, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-allocation-node';
                    node.draggable = true;
                    node.dataset.type = 'rustAllocation';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">📦 \${alloc.allocationType}分配</div>
                        <div class="node-content">
                            <div>上下文: \${alloc.context}</div>
                            <div>建议: \${alloc.suggestion || '无'}</div>
                            <div>行号: \${alloc.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustCloneNode(clone, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-clone-node';
                    node.draggable = true;
                    node.dataset.type = 'rustClone';
                    node.dataset.index = index;
                    
                    const status = clone.necessary ? '✓' : '⚠️';
                    node.innerHTML = \`
                        <div class="node-header">📋 \${clone.target}.clone() \${status}</div>
                        <div class="node-content">
                            <div>必要性: \${clone.necessary ? '必要' : '可能不必要'}</div>
                            <div>建议: \${clone.suggestion || '无'}</div>
                            <div>行号: \${clone.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustUnsafeBlockNode(block, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-unsafe-node';
                    node.draggable = true;
                    node.dataset.type = 'rustUnsafeBlock';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">⚠️ unsafe { }</div>
                        <div class="node-content">
                            <div>原因: \${block.reason}</div>
                            <div>操作: \${block.operations.join(', ')}</div>
                            <div>安全注释: \${block.safety_comment || '无'}</div>
                            <div>行号: \${block.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustRawPointerNode(ptr, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-pointer-node';
                    node.draggable = true;
                    node.dataset.type = 'rustRawPointer';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">🎯 \${ptr.pointerType} \${ptr.targetType}</div>
                        <div class="node-content">
                            <div>使用: \${ptr.usage}</div>
                            <div>行号: \${ptr.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }
                
                // 初始化
                init();
            </script>
        </body>
        </html>`;
    }
}

export function createOrShowVisualPanel(extensionUri: vscode.Uri) {
    VisualPanelProvider.createOrShow(extensionUri);
    return VisualPanelProvider.currentPanel;
}
