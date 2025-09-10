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
        // 生成可视化工作流的HTML，包含AI增强分析和性能评估
        const analysisData = this._codeAnalysis ? JSON.stringify(this._codeAnalysis) : 'null';
        
        return `<!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI增强代码可视化分析平台</title>
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
                    overflow: auto;
                }
                
                .toolbar {
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    z-index: 1000;
                    background: var(--vscode-panel-background);
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid var(--vscode-panel-border);
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                
                .toolbar button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .toolbar button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .toolbar .separator {
                    width: 1px;
                    height: 20px;
                    background: var(--vscode-panel-border);
                    margin: 0 5px;
                }
                
                /* 分析面板布局 */
                .analysis-dashboard {
                    margin-top: 70px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                /* 评分卡片样式 */
                .score-card {
                    background: var(--vscode-editor-background);
                    border: 2px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }
                
                .score-card:hover {
                    border-color: var(--vscode-focusBorder);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
                }
                
                .score-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 15px;
                }
                
                .score-icon {
                    font-size: 24px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: var(--vscode-button-background);
                }
                
                .score-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--vscode-editor-foreground);
                }
                
                .score-value {
                    font-size: 32px;
                    font-weight: 700;
                    text-align: center;
                    margin: 15px 0;
                }
                
                .score-excellent { color: #4caf50; }
                .score-good { color: #ff9800; }
                .score-warning { color: #f44336; }
                
                .score-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: var(--vscode-panel-background);
                    border-radius: 6px;
                    font-size: 14px;
                }
                
                .detail-score {
                    font-weight: 600;
                }
                
                /* 可视化图表区域 */
                .visualization-panel {
                    grid-column: 1 / -1;
                    background: var(--vscode-editor-background);
                    border: 2px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    padding: 20px;
                    margin-top: 20px;
                }
                
                .viz-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .viz-title {
                    font-size: 20px;
                    font-weight: 600;
                }
                
                /* 节点可视化区域 */
                .node-canvas {
                    width: 100%;
                    height: 400px;
                    background: var(--vscode-panel-background);
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid var(--vscode-panel-border);
                }
                
                .analysis-node {
                    position: absolute;
                    width: 120px;
                    height: 80px;
                    background: var(--vscode-button-background);
                    border: 2px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 12px;
                    text-align: center;
                    padding: 8px;
                }
                
                .analysis-node:hover {
                    border-color: var(--vscode-focusBorder);
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                .node-icon {
                    font-size: 20px;
                    margin-bottom: 4px;
                }
                
                .node-title {
                    font-weight: 600;
                    font-size: 11px;
                    line-height: 1.2;
                }
                
                /* 建议列表 */
                .suggestions-panel {
                    grid-column: 1 / -1;
                    background: var(--vscode-editor-background);
                    border: 2px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    padding: 20px;
                    margin-top: 20px;
                }
                
                .suggestion-item {
                    background: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .suggestion-item:hover {
                    border-color: var(--vscode-focusBorder);
                    background: var(--vscode-editor-background);
                }
                
                .suggestion-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                
                .priority-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .priority-high { background: #f44336; color: white; }
                .priority-medium { background: #ff9800; color: white; }
                .priority-low { background: #4caf50; color: white; }
                
                .suggestion-title {
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .suggestion-description {
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                    line-height: 1.4;
                    margin-bottom: 10px;
                }
                
                .suggestion-code {
                    background: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 10px;
                    font-family: 'Cascadia Code', monospace;
                    font-size: 12px;
                    overflow-x: auto;
                    margin-top: 10px;
                }
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
                .react-performance-issue-node {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
                    border-color: #ff6b6b;
                    border-width: 2px;
                }

                .react-architecture-pattern-node {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                    border-width: 3px;
                }

                .severity-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    margin-left: 8px;
                }

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

                /* Rust后端架构分析节点样式 */
                .rust-api-endpoint-node {
                    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                    border-color: #17a2b8;
                    color: white;
                }

                .rust-security-issue-node {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                    border-color: #dc3545;
                    color: white;
                    border-style: double;
                }

                .rust-performance-bottleneck-node {
                    background: linear-gradient(135deg, #fd7e14 0%, #e8590c 100%);
                    border-color: #fd7e14;
                    color: white;
                }

                .rust-microservice-readiness-node {
                    background: linear-gradient(135deg, #20c997 0%, #1ba085 100%);
                    border-color: #20c997;
                    color: white;
                }

                .rust-database-analysis-node {
                    background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%);
                    border-color: #6f42c1;
                    color: white;
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
                <!-- 工具栏 -->
                <div class="toolbar">
                    <button onclick="resetView()">🔄 重置视图</button>
                    <button onclick="autoLayout()">🎯 自动布局</button>
                    <div class="separator"></div>
                    <button onclick="showAIAnalysis()">🧠 AI分析</button>
                    <button onclick="showPerformanceReport()">⚡ 性能报告</button>
                    <button onclick="showQualityReport()">📊 质量评估</button>
                    <div class="separator"></div>
                    <button onclick="exportReport()">📄 导出报告</button>
                </div>
                
                <!-- AI增强分析仪表板 -->
                <div class="analysis-dashboard">
                    <!-- 综合质量评分卡 -->
                    <div class="score-card" id="qualityScoreCard">
                        <div class="score-header">
                            <div class="score-icon">🎯</div>
                            <div class="score-title">综合质量评分</div>
                        </div>
                        <div class="score-value" id="overallScore">--</div>
                        <div class="score-details">
                            <div class="detail-item">
                                <span>代码质量</span>
                                <span class="detail-score" id="codeQualityScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>性能表现</span>
                                <span class="detail-score" id="performanceScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>可维护性</span>
                                <span class="detail-score" id="maintainabilityScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>安全性</span>
                                <span class="detail-score" id="securityScore">--</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI增强分析卡 -->
                    <div class="score-card" id="aiAnalysisCard">
                        <div class="score-header">
                            <div class="score-icon">🧠</div>
                            <div class="score-title">AI增强分析</div>
                        </div>
                        <div class="score-value" id="aiInsightCount">--</div>
                        <div class="score-details">
                            <div class="detail-item">
                                <span>代码坏味道</span>
                                <span class="detail-score" id="badSmellCount">--</span>
                            </div>
                            <div class="detail-item">
                                <span>架构模式</span>
                                <span class="detail-score" id="patternCount">--</span>
                            </div>
                            <div class="detail-item">
                                <span>改进建议</span>
                                <span class="detail-score" id="suggestionCount">--</span>
                            </div>
                            <div class="detail-item">
                                <span>最佳实践</span>
                                <span class="detail-score" id="bestPracticeCount">--</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 性能分析卡 -->
                    <div class="score-card" id="performanceCard">
                        <div class="score-header">
                            <div class="score-icon">⚡</div>
                            <div class="score-title">性能分析</div>
                        </div>
                        <div class="score-value" id="performanceOverall">--</div>
                        <div class="score-details">
                            <div class="detail-item">
                                <span>算法复杂度</span>
                                <span class="detail-score" id="algorithmScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>内存效率</span>
                                <span class="detail-score" id="memoryScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>I/O效率</span>
                                <span class="detail-score" id="ioScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>并发安全</span>
                                <span class="detail-score" id="concurrencyScore">--</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 专项优化卡 -->
                    <div class="score-card" id="specializationCard">
                        <div class="score-header">
                            <div class="score-icon">🎨</div>
                            <div class="score-title">专项优化</div>
                        </div>
                        <div class="score-value" id="specializationScore">--</div>
                        <div class="score-details">
                            <div class="detail-item">
                                <span>React Hook</span>
                                <span class="detail-score" id="reactHookScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>状态管理</span>
                                <span class="detail-score" id="stateManagementScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>Rust内存</span>
                                <span class="detail-score" id="rustMemoryScore">--</span>
                            </div>
                            <div class="detail-item">
                                <span>代码生成</span>
                                <span class="detail-score" id="codeGenScore">--</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 可视化面板 -->
                <div class="visualization-panel">
                    <div class="viz-header">
                        <div class="score-icon">📊</div>
                        <div class="viz-title">代码结构可视化</div>
                        <div style="margin-left: auto; display: flex; gap: 10px;">
                            <button onclick="toggleNodeDetails()" style="padding: 6px 12px; font-size: 12px;">📝 详细信息</button>
                            <button onclick="focusOnIssues()" style="padding: 6px 12px; font-size: 12px;">🚨 问题聚焦</button>
                        </div>
                    </div>
                    
                    <div class="node-canvas" id="nodeCanvas">
                        <div class="empty-state" id="emptyState" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 20px;">🧠</div>
                            <h3>AI增强代码分析平台</h3>
                            <p>使用 "分析代码结构" 命令开始智能分析</p>
                            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                                <button onclick="loadDemo('react')" style="padding: 8px 16px; font-size: 12px;">🎯 React演示</button>
                                <button onclick="loadDemo('rust')" style="padding: 8px 16px; font-size: 12px;">🦀 Rust演示</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 优化建议面板 -->
                <div class="suggestions-panel">
                    <div class="viz-header">
                        <div class="score-icon">💡</div>
                        <div class="viz-title">AI优化建议</div>
                        <div style="margin-left: auto;">
                            <select id="priorityFilter" onchange="filterSuggestions()" style="padding: 4px 8px; font-size: 12px;">
                                <option value="all">全部建议</option>
                                <option value="high">高优先级</option>
                                <option value="medium">中优先级</option>
                                <option value="low">低优先级</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="suggestionsList">
                        <div class="empty-state" style="text-align: center; padding: 40px;">
                            <div style="font-size: 32px; margin-bottom: 15px;">💡</div>
                            <h4>暂无优化建议</h4>
                            <p>分析代码后将显示AI生成的优化建议</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let codeAnalysis = ${analysisData};
                let nodes = [];
                let draggedNode = null;
                let offset = { x: 0, y: 0 };
                let showNodeDetails = false;
                let currentFilter = 'all';
                
                // AI增强分析数据处理
                function init() {
                    if (codeAnalysis) {
                        renderNodes();
                        updateAnalysisDashboard();
                        updateSuggestionsList();
                        document.getElementById('emptyState').style.display = 'none';
                    }
                }
                
                // 更新AI分析仪表板
                function updateAnalysisDashboard() {
                    if (!codeAnalysis) return;
                    
                    // 综合质量评分
                    const qualityReport = codeAnalysis.comprehensiveQualityReport;
                    if (qualityReport) {
                        updateScoreElement('overallScore', qualityReport.overallScore, true);
                        updateScoreElement('codeQualityScore', qualityReport.dimensions.codeQuality);
                        updateScoreElement('performanceScore', qualityReport.dimensions.performance);
                        updateScoreElement('maintainabilityScore', qualityReport.dimensions.maintainability);
                        updateScoreElement('securityScore', qualityReport.dimensions.security);
                    }
                    
                    // AI增强分析
                    const aiAnalysis = codeAnalysis.aiEnhancedAnalysis;
                    if (aiAnalysis) {
                        updateScoreElement('aiInsightCount', aiAnalysis.insights?.length || 0);
                        updateScoreElement('badSmellCount', aiAnalysis.codeSmells?.length || 0);
                        updateScoreElement('patternCount', aiAnalysis.architecturePatterns?.length || 0);
                        updateScoreElement('suggestionCount', aiAnalysis.suggestions?.length || 0);
                        updateScoreElement('bestPracticeCount', aiAnalysis.bestPractices?.length || 0);
                    }
                    
                    // 性能分析
                    const performanceAnalysis = codeAnalysis.deepPerformanceAnalysis;
                    if (performanceAnalysis) {
                        updateScoreElement('performanceOverall', performanceAnalysis.overallScore || 0, true);
                        updateScoreElement('algorithmScore', performanceAnalysis.metrics?.algorithm || 0);
                        updateScoreElement('memoryScore', performanceAnalysis.metrics?.memory || 0);
                        updateScoreElement('ioScore', performanceAnalysis.metrics?.io || 0);
                        updateScoreElement('concurrencyScore', performanceAnalysis.metrics?.concurrency || 0);
                    }
                    
                    // 专项优化
                    const hookAnalysis = codeAnalysis.reactHookOptimization;
                    const stateAnalysis = codeAnalysis.reactStateOptimization;
                    const memoryAnalysis = codeAnalysis.rustMemorySafetyPerformance;
                    
                    if (hookAnalysis) updateScoreElement('reactHookScore', hookAnalysis.overallScore || 0);
                    if (stateAnalysis) updateScoreElement('stateManagementScore', stateAnalysis.overallScore || 0);
                    if (memoryAnalysis) updateScoreElement('rustMemoryScore', memoryAnalysis.overallScore || 0);
                    
                    const avgSpecScore = Math.round(
                        ((hookAnalysis?.overallScore || 0) + 
                         (stateAnalysis?.overallScore || 0) + 
                         (memoryAnalysis?.overallScore || 0)) / 3
                    );
                    updateScoreElement('specializationScore', avgSpecScore, true);
                    updateScoreElement('codeGenScore', 85); // 代码生成评分
                }
                
                // 更新评分元素
                function updateScoreElement(elementId, score, isMainScore = false) {
                    const element = document.getElementById(elementId);
                    if (!element) return;
                    
                    if (isMainScore && typeof score === 'number') {
                        element.textContent = score + '/100';
                        element.className = 'score-value ' + getScoreClass(score);
                    } else if (typeof score === 'number') {
                        element.textContent = score > 100 ? score : score + '/100';
                        element.className = 'detail-score ' + getScoreClass(score);
                    } else {
                        element.textContent = score;
                    }
                }
                
                // 获取评分样式类
                function getScoreClass(score) {
                    if (score >= 80) return 'score-excellent';
                    if (score >= 60) return 'score-good';
                    return 'score-warning';
                }
                
                // 更新建议列表
                function updateSuggestionsList() {
                    const container = document.getElementById('suggestionsList');
                    if (!container || !codeAnalysis) return;
                    
                    let allSuggestions = [];
                    
                    // 收集所有建议
                    if (codeAnalysis.aiEnhancedAnalysis?.suggestions) {
                        allSuggestions.push(...codeAnalysis.aiEnhancedAnalysis.suggestions.map(s => ({...s, source: 'AI分析'})));
                    }
                    if (codeAnalysis.deepPerformanceAnalysis?.suggestions) {
                        allSuggestions.push(...codeAnalysis.deepPerformanceAnalysis.suggestions.map(s => ({...s, source: '性能分析'})));
                    }
                    if (codeAnalysis.comprehensiveQualityReport?.suggestions) {
                        allSuggestions.push(...codeAnalysis.comprehensiveQualityReport.suggestions.map(s => ({...s, source: '质量分析'})));
                    }
                    
                    // 收集专项分析建议
                    ['reactHookOptimization', 'reactStateOptimization', 'rustMemorySafetyPerformance'].forEach(key => {
                        if (codeAnalysis[key]?.suggestions) {
                            const sourceMap = {
                                'reactHookOptimization': 'React Hook优化',
                                'reactStateOptimization': '状态管理优化',
                                'rustMemorySafetyPerformance': 'Rust内存优化'
                            };
                            allSuggestions.push(...codeAnalysis[key].suggestions.map(s => ({...s, source: sourceMap[key]})));
                        }
                    });
                    
                    if (allSuggestions.length === 0) {
                        container.innerHTML = '<div class="empty-state" style="text-align: center; padding: 40px;"><div style="font-size: 32px; margin-bottom: 15px;">✅</div><h4>代码质量良好</h4><p>暂无优化建议</p></div>';
                        return;
                    }
                    
                    // 过滤建议
                    let filteredSuggestions = allSuggestions;
                    if (currentFilter !== 'all') {
                        filteredSuggestions = allSuggestions.filter(s => s.priority === currentFilter);
                    }
                    
                    // 按优先级排序
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    filteredSuggestions.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
                    
                    // 渲染建议
                    container.innerHTML = filteredSuggestions.map(suggestion => createSuggestionHTML(suggestion)).join('');
                }
                
                // 创建建议HTML
                function createSuggestionHTML(suggestion) {
                    const priorityClass = 'priority-' + (suggestion.priority || 'medium');
                    const priorityText = (suggestion.priority || 'medium').toUpperCase();
                    
                    return \`
                        <div class="suggestion-item" onclick="jumpToCode('\${suggestion.file}', \${suggestion.line})">
                            <div class="suggestion-header">
                                <span class="priority-badge \${priorityClass}">\${priorityText}</span>
                                <span class="suggestion-title">\${suggestion.title || '优化建议'}</span>
                                <span style="margin-left: auto; font-size: 12px; color: var(--vscode-descriptionForeground);">
                                    \${suggestion.source} • 第\${suggestion.line || 0}行
                                </span>
                            </div>
                            <div class="suggestion-description">
                                \${suggestion.description || suggestion.message || '建议优化此处代码'}
                            </div>
                            \${suggestion.codeExample ? \`
                                <div class="suggestion-code">\${suggestion.codeExample}</div>
                            \` : ''}
                            \${suggestion.estimatedImpact ? \`
                                <div style="margin-top: 10px; font-size: 12px; color: var(--vscode-descriptionForeground);">
                                    预期收益: \${suggestion.estimatedImpact}
                                </div>
                            \` : ''}
                        </div>
                    \`;
                }
                
                // 工具栏按钮功能
                function showAIAnalysis() {
                    document.querySelector('.analysis-dashboard').scrollIntoView({ behavior: 'smooth' });
                }
                
                function showPerformanceReport() {
                    const perfCard = document.getElementById('performanceCard');
                    if (perfCard) {
                        perfCard.scrollIntoView({ behavior: 'smooth' });
                        perfCard.style.transform = 'scale(1.02)';
                        setTimeout(() => { perfCard.style.transform = 'scale(1)'; }, 200);
                    }
                }
                
                function showQualityReport() {
                    const qualityCard = document.getElementById('qualityScoreCard');
                    if (qualityCard) {
                        qualityCard.scrollIntoView({ behavior: 'smooth' });
                        qualityCard.style.transform = 'scale(1.02)';
                        setTimeout(() => { qualityCard.style.transform = 'scale(1)'; }, 200);
                    }
                }
                
                function toggleNodeDetails() {
                    showNodeDetails = !showNodeDetails;
                    renderNodes();
                }
                
                function focusOnIssues() {
                    // 聚焦到有问题的节点
                    const canvas = document.getElementById('nodeCanvas');
                    const problemNodes = canvas.querySelectorAll('.analysis-node[data-has-issues="true"]');
                    if (problemNodes.length > 0) {
                        problemNodes.forEach(node => {
                            node.style.border = '3px solid #f44336';
                            node.style.animation = 'pulse 1s infinite';
                        });
                    }
                }
                
                function filterSuggestions() {
                    const select = document.getElementById('priorityFilter');
                    currentFilter = select.value;
                    updateSuggestionsList();
                }
                
                function loadDemo(type) {
                    vscode.postMessage({
                        type: 'onInfo',
                        value: \`正在加载\${type === 'react' ? 'React' : 'Rust'}演示项目...\`
                    });
                }
                
                function exportReport() {
                    if (!codeAnalysis) {
                        vscode.postMessage({
                            type: 'onError',
                            value: '没有可导出的分析数据'
                        });
                        return;
                    }
                    
                    vscode.postMessage({
                        type: 'exportReport',
                        value: codeAnalysis
                    });
                }
                
                function jumpToCode(file, line) {
                    if (file && line) {
                        vscode.postMessage({
                            type: 'onNodeClick',
                            value: { file, line }
                        });
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

                    // 渲染React性能问题
                    if (codeAnalysis.reactPerformanceIssues) {
                        codeAnalysis.reactPerformanceIssues.forEach((issue, index) => {
                            const node = createReactPerformanceIssueNode(issue, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        });
                    }

                    // 渲染React架构模式
                    if (codeAnalysis.reactArchitecturePattern) {
                        const node = createReactArchitecturePatternNode(codeAnalysis.reactArchitecturePattern, nodeIndex);
                        positionNode(node, nodeIndex, nodeSpacing);
                        canvas.appendChild(node);
                        nodeIndex++;
                    }

                    // 渲染React高级组件分析结果
                    if (codeAnalysis.reactAdvancedComponentAnalysis) {
                        const advancedAnalysis = codeAnalysis.reactAdvancedComponentAnalysis;
                        
                        // 渲染组件依赖分析
                        if (advancedAnalysis.componentDependencies && advancedAnalysis.componentDependencies.dependencies) {
                            advancedAnalysis.componentDependencies.dependencies.forEach((dep, index) => {
                                const node = createReactComponentDependencyNode(dep, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染Hook依赖分析
                        if (advancedAnalysis.hookDependencies && advancedAnalysis.hookDependencies.issues) {
                            advancedAnalysis.hookDependencies.issues.forEach((issue, index) => {
                                const node = createReactHookIssueNode(issue, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染架构评分
                        if (advancedAnalysis.architectureScore) {
                            const node = createReactArchitectureScoreNode(advancedAnalysis.architectureScore, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        }
                    }

                    // 渲染Rust高级系统分析结果
                    if (codeAnalysis.rustAdvancedSystemAnalysis) {
                        const advancedAnalysis = codeAnalysis.rustAdvancedSystemAnalysis;
                        
                        // 渲染模块架构分析
                        if (advancedAnalysis.moduleArchitecture && advancedAnalysis.moduleArchitecture.modules) {
                            advancedAnalysis.moduleArchitecture.modules.forEach((module, index) => {
                                const node = createRustModuleArchitectureNode(module, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染错误处理质量
                        if (advancedAnalysis.errorHandling && advancedAnalysis.errorHandling.issues) {
                            advancedAnalysis.errorHandling.issues.forEach((issue, index) => {
                                const node = createRustErrorHandlingNode(issue, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染系统架构评分
                        if (advancedAnalysis.systemArchitectureScore) {
                            const node = createRustSystemScoreNode(advancedAnalysis.systemArchitectureScore, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        }
                    }

                    // 渲染Rust后端架构分析结果
                    if (codeAnalysis.rustBackendArchitecture) {
                        const backendArch = codeAnalysis.rustBackendArchitecture;
                        
                        // 渲染API设计节点
                        if (backendArch.apiDesign && backendArch.apiDesign.endpoints) {
                            backendArch.apiDesign.endpoints.forEach((endpoint, index) => {
                                const node = createRustAPIEndpointNode(endpoint, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染安全问题节点
                        if (backendArch.securityAnalysis && backendArch.securityAnalysis.vulnerabilities) {
                            backendArch.securityAnalysis.vulnerabilities.forEach((vuln, index) => {
                                const node = createRustSecurityIssueNode(vuln, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染性能问题节点
                        if (backendArch.performanceAnalysis && backendArch.performanceAnalysis.bottlenecks) {
                            backendArch.performanceAnalysis.bottlenecks.forEach((bottleneck, index) => {
                                const node = createRustPerformanceBottleneckNode(bottleneck, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }

                        // 渲染微服务就绪度节点
                        if (backendArch.microserviceReadiness) {
                            const node = createRustMicroserviceReadinessNode(backendArch.microserviceReadiness, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        }

                        // 渲染数据库分析节点
                        if (backendArch.databaseAnalysis) {
                            const node = createRustDatabaseAnalysisNode(backendArch.databaseAnalysis, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        }
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
                    
                    // 渲染React深度优化分析结果
                    if (codeAnalysis.reactDeepOptimization) {
                        const optimization = codeAnalysis.reactDeepOptimization;
                        
                        // 渲染代码分割优化节点
                        if (optimization.codeSplitting && optimization.codeSplitting.opportunities) {
                            optimization.codeSplitting.opportunities.forEach((opportunity, index) => {
                                const node = createReactCodeSplittingOptimizationNode(opportunity, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染渲染性能优化节点
                        if (optimization.renderPerformance && optimization.renderPerformance.expensiveOperations) {
                            optimization.renderPerformance.expensiveOperations.forEach((operation, index) => {
                                const node = createReactRenderPerformanceOptimizationNode(operation, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染Bundle优化节点
                        if (optimization.bundleOptimization && optimization.bundleOptimization.treeshakingOpportunities) {
                            optimization.bundleOptimization.treeshakingOpportunities.forEach((treeshaking, index) => {
                                const node = createReactBundleOptimizationNode(treeshaking, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染状态管理优化节点
                        if (optimization.stateManagement && optimization.stateManagement.overStateDetection) {
                            optimization.stateManagement.overStateDetection.forEach((stateIssue, index) => {
                                const node = createReactStateOptimizationNode(stateIssue, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染性能预测模型节点
                        if (optimization.performancePrediction) {
                            const node = createReactPerformancePredictionNode(optimization.performancePrediction, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        }
                        
                        // 渲染综合评分节点
                        if (optimization.comprehensiveScore) {
                            const node = createReactComprehensiveScoreNode(optimization.comprehensiveScore, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        }
                    }
                    
                    // 渲染Rust深度优化分析结果
                    if (codeAnalysis.rustDeepOptimization) {
                        const optimization = codeAnalysis.rustDeepOptimization;
                        
                        // 渲染内存分配优化节点
                        if (optimization.memoryAllocation && optimization.memoryAllocation.preallocationOpportunities) {
                            optimization.memoryAllocation.preallocationOpportunities.forEach((opportunity, index) => {
                                const node = createRustMemoryAllocationOptimizationNode(opportunity, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染并发性能优化节点
                        if (optimization.concurrencyPerformance && optimization.concurrencyPerformance.asyncConversionOpportunities) {
                            optimization.concurrencyPerformance.asyncConversionOpportunities.forEach((opportunity, index) => {
                                const node = createRustConcurrencyPerformanceOptimizationNode(opportunity, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染计算优化节点
                        if (optimization.computationalOptimization && optimization.computationalOptimization.algorithmComplexityIssues) {
                            optimization.computationalOptimization.algorithmComplexityIssues.forEach((issue, index) => {
                                const node = createRustComputationalOptimizationNode(issue, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染错误处理安全节点
                        if (optimization.errorHandlingSafety && optimization.errorHandlingSafety.panicRisks) {
                            optimization.errorHandlingSafety.panicRisks.forEach((risk, index) => {
                                const node = createRustErrorHandlingSafetyNode(risk, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染I/O优化节点
                        if (optimization.ioOptimization && optimization.ioOptimization.syncToAsyncOpportunities) {
                            optimization.ioOptimization.syncToAsyncOpportunities.forEach((opportunity, index) => {
                                const node = createRustIOOptimizationNode(opportunity, nodeIndex);
                                positionNode(node, nodeIndex, nodeSpacing);
                                canvas.appendChild(node);
                                nodeIndex++;
                            });
                        }
                        
                        // 渲染架构质量评估节点
                        if (optimization.architectureQuality) {
                            const node = createRustArchitectureQualityNode(optimization.architectureQuality, nodeIndex);
                            positionNode(node, nodeIndex, nodeSpacing);
                            canvas.appendChild(node);
                            nodeIndex++;
                        }
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

                // React性能问题节点创建函数
                function createReactPerformanceIssueNode(issue, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-performance-issue-node';
                    node.dataset.type = 'reactPerformanceIssue';
                    node.dataset.line = issue.line;
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const severityColor = {
                        'low': '#28a745',
                        'medium': '#ffc107', 
                        'high': '#fd7e14',
                        'critical': '#dc3545'
                    };
                    
                    const typeText = {
                        'memory-leak': '内存泄漏',
                        'unnecessary-render': '不必要渲染',
                        'large-bundle': '包体积过大',
                        'slow-component': '组件性能慢'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">⚠️</span>
                            <span class="node-title">性能问题</span>
                            <span class="severity-badge" style="background-color: \${severityColor[issue.severity]}">\${issue.severity.toUpperCase()}</span>
                        </div>
                        <div class="node-content">
                            <p><strong>类型:</strong> \${typeText[issue.type]}</p>
                            <p><strong>组件:</strong> \${issue.component}</p>
                            <p><strong>描述:</strong> \${issue.description}</p>
                            <p><strong>建议:</strong> \${issue.suggestion}</p>
                            <p><strong>行号:</strong> \${issue.line}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                // React架构模式节点创建函数
                function createReactArchitecturePatternNode(pattern, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-architecture-pattern-node';
                    node.dataset.type = 'reactArchitecturePattern';
                    node.dataset.file = codeAnalysis.fileName;
                    
                    const dataFlowText = {
                        'unidirectional': '单向数据流',
                        'bidirectional': '双向数据流',
                        'mixed': '混合数据流'
                    };
                    
                    const stateManagementText = {
                        'local': '本地状态管理',
                        'global': '全局状态管理',
                        'mixed': '混合状态管理'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">
                            <span class="node-icon">🏛️</span>
                            <span class="node-title">架构模式</span>
                        </div>
                        <div class="node-content">
                            <p><strong>模式:</strong> \${pattern.pattern}</p>
                            <p><strong>数据流:</strong> \${dataFlowText[pattern.dataFlow]}</p>
                            <p><strong>状态管理:</strong> \${stateManagementText[pattern.stateManagement]}</p>
                            <p><strong>复杂度:</strong> \${pattern.complexity}/10</p>
                            <p><strong>组件数:</strong> \${pattern.components.length}</p>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
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

                // Rust后端架构分析节点创建函数
                function createRustAPIEndpointNode(endpoint, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-api-endpoint-node';
                    node.draggable = true;
                    node.dataset.type = 'rustAPIEndpoint';
                    node.dataset.index = index;
                    
                    const methodColor = {
                        'GET': '#28a745',
                        'POST': '#007bff', 
                        'PUT': '#ffc107',
                        'DELETE': '#dc3545'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">🌐 API接口</div>
                        <div class="node-content">
                            <div style="color: \${methodColor[endpoint.method] || '#666'}">
                                <strong>\${endpoint.method} \${endpoint.path}</strong>
                            </div>
                            <div>处理器: \${endpoint.handler}</div>
                            <div>参数: \${endpoint.params ? endpoint.params.join(', ') : '无'}</div>
                            <div>行号: \${endpoint.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustSecurityIssueNode(vuln, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-security-issue-node';
                    node.draggable = true;
                    node.dataset.type = 'rustSecurityIssue';
                    node.dataset.index = index;
                    
                    const severityColors = {
                        'high': '#dc3545',
                        'medium': '#ffc107',  
                        'low': '#28a745'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header" style="color: \${severityColors[vuln.severity] || '#666'}">
                            🔐 安全问题
                        </div>
                        <div class="node-content">
                            <div><strong>\${vuln.type}</strong></div>
                            <div>严重程度: \${vuln.severity}</div>
                            <div>描述: \${vuln.description}</div>
                            <div>建议: \${vuln.suggestion}</div>
                            <div>行号: \${vuln.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustPerformanceBottleneckNode(bottleneck, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-performance-bottleneck-node';
                    node.draggable = true;
                    node.dataset.type = 'rustPerformanceBottleneck';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">⚡ 性能瓶颈</div>
                        <div class="node-content">
                            <div><strong>\${bottleneck.type}</strong></div>
                            <div>影响: \${bottleneck.impact}</div>
                            <div>描述: \${bottleneck.description}</div>
                            <div>优化建议: \${bottleneck.optimization}</div>
                            <div>行号: \${bottleneck.line}</div>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustMicroserviceReadinessNode(readiness, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-microservice-readiness-node';
                    node.draggable = true;
                    node.dataset.type = 'rustMicroserviceReadiness';
                    node.dataset.index = index;
                    
                    const scoreColor = readiness.score >= 8 ? '#28a745' : 
                                     readiness.score >= 6 ? '#ffc107' : '#dc3545';
                    
                    node.innerHTML = \`
                        <div class="node-header">🏗️ 微服务就绪度</div>
                        <div class="node-content">
                            <div style="color: \${scoreColor}">
                                <strong>评分: \${readiness.score}/10</strong>
                            </div>
                            <div>状态: \${readiness.status}</div>
                            <div>建议:</div>
                            <ul>
                                \${readiness.recommendations.map(rec => \`<li>\${rec}</li>\`).join('')}
                            </ul>
                        </div>
                    \`;
                    
                    return node;
                }

                function createRustDatabaseAnalysisNode(dbAnalysis, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-database-analysis-node';
                    node.draggable = true;
                    node.dataset.type = 'rustDatabaseAnalysis';
                    node.dataset.index = index;
                    
                    node.innerHTML = \`
                        <div class="node-header">🗄️ 数据库分析</div>
                        <div class="node-content">
                            <div>ORM类型: \${dbAnalysis.ormType}</div>
                            <div>连接池: \${dbAnalysis.hasConnectionPool ? '已配置' : '未配置'}</div>
                            <div>事务使用: \${dbAnalysis.transactionUsage}</div>
                            <div>查询数量: \${dbAnalysis.queryCount}</div>
                            <div>优化建议:</div>
                            <ul>
                                \${dbAnalysis.optimizations.map(opt => \`<li>\${opt}</li>\`).join('')}
                            </ul>
                        </div>
                    \`;
                    
                    return node;
                }

                // React高级组件分析相关节点创建函数
                function createReactComponentDependencyNode(dependency, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-component-dependency-node';
                    node.draggable = true;
                    node.dataset.type = 'reactComponentDependency';
                    node.dataset.index = index;
                    
                    const typeColors = {
                        'circular': '#dc3545',
                        'deep': '#ffc107',
                        'normal': '#28a745'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">🔗 组件依赖</div>
                        <div class="node-content">
                            <div><strong>来源:</strong> \${dependency.from}</div>
                            <div><strong>目标:</strong> \${dependency.to}</div>
                            <div style="color: \${typeColors[dependency.type]}">
                                <strong>类型:</strong> \${dependency.type === 'circular' ? '循环依赖' : 
                                                      dependency.type === 'deep' ? '深度依赖' : '正常依赖'}
                            </div>
                            <div><strong>严重程度:</strong> \${dependency.severity}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createReactHookIssueNode(issue, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-hook-issue-node';
                    node.draggable = true;
                    node.dataset.type = 'reactHookIssue';
                    node.dataset.index = index;
                    
                    const severityColors = {
                        'high': '#dc3545',
                        'medium': '#ffc107',
                        'low': '#28a745'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">🪝 Hook问题</div>
                        <div class="node-content">
                            <div><strong>Hook:</strong> \${issue.hook}</div>
                            <div style="color: \${severityColors[issue.severity]}">
                                <strong>严重程度:</strong> \${issue.severity}
                            </div>
                            <div><strong>问题:</strong> \${issue.issue}</div>
                            <div><strong>建议:</strong> \${issue.suggestion}</div>
                            <div><strong>行号:</strong> \${issue.line}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createReactArchitectureScoreNode(score, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-architecture-score-node';
                    node.draggable = true;
                    node.dataset.type = 'reactArchitectureScore';
                    node.dataset.index = index;
                    
                    const scoreColor = score.total >= 80 ? '#28a745' : 
                                      score.total >= 60 ? '#ffc107' : '#dc3545';
                    
                    node.innerHTML = \`
                        <div class="node-header">📊 架构评分</div>
                        <div class="node-content">
                            <div style="color: \${scoreColor}; font-size: 18px;">
                                <strong>总分: \${score.total}/100</strong>
                            </div>
                            <div><strong>组件设计:</strong> \${score.componentDesign}/100</div>
                            <div><strong>性能优化:</strong> \${score.performanceOptimization}/100</div>
                            <div><strong>可维护性:</strong> \${score.maintainability}/100</div>
                            <div><strong>可扩展性:</strong> \${score.scalability}/100</div>
                            <div><strong>建议数:</strong> \${score.suggestions.length}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                // Rust高级系统分析相关节点创建函数
                function createRustModuleArchitectureNode(module, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-module-architecture-node';
                    node.draggable = true;
                    node.dataset.type = 'rustModuleArchitecture';
                    node.dataset.index = index;
                    
                    const cohesionColors = {
                        'high': '#28a745',
                        'medium': '#ffc107',
                        'low': '#dc3545'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">📦 模块架构</div>
                        <div class="node-content">
                            <div><strong>模块:</strong> \${module.name}</div>
                            <div style="color: \${cohesionColors[module.cohesion]}">
                                <strong>内聚性:</strong> \${module.cohesion}
                            </div>
                            <div><strong>耦合度:</strong> \${module.coupling}</div>
                            <div><strong>可见性:</strong> \${module.visibility}</div>
                            <div><strong>函数数:</strong> \${module.functions}</div>
                            <div><strong>结构体数:</strong> \${module.structs}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createRustErrorHandlingNode(errorIssue, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-error-handling-node';
                    node.draggable = true;
                    node.dataset.type = 'rustErrorHandling';
                    node.dataset.index = index;
                    
                    const severityColors = {
                        'high': '#dc3545',
                        'medium': '#ffc107',
                        'low': '#28a745'
                    };
                    
                    node.innerHTML = \`
                        <div class="node-header">❌ 错误处理</div>
                        <div class="node-content">
                            <div><strong>类型:</strong> \${errorIssue.type}</div>
                            <div style="color: \${severityColors[errorIssue.severity]}">
                                <strong>严重程度:</strong> \${errorIssue.severity}
                            </div>
                            <div><strong>问题:</strong> \${errorIssue.issue}</div>
                            <div><strong>建议:</strong> \${errorIssue.suggestion}</div>
                            <div><strong>行号:</strong> \${errorIssue.line}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }

                function createRustSystemScoreNode(score, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-system-score-node';
                    node.draggable = true;
                    node.dataset.type = 'rustSystemScore';
                    node.dataset.index = index;
                    
                    const scoreColor = score.total >= 80 ? '#28a745' : 
                                      score.total >= 60 ? '#ffc107' : '#dc3545';
                    
                    node.innerHTML = \`
                        <div class="node-header">🏗️ 系统评分</div>
                        <div class="node-content">
                            <div style="color: \${scoreColor}; font-size: 18px;">
                                <strong>总分: \${score.total}/100</strong>
                            </div>
                            <div><strong>架构质量:</strong> \${score.architectureQuality}/100</div>
                            <div><strong>错误处理:</strong> \${score.errorHandling}/100</div>
                            <div><strong>并发安全:</strong> \${score.concurrencySafety}/100</div>
                            <div><strong>内存效率:</strong> \${score.memoryEfficiency}/100</div>
                            <div><strong>测试质量:</strong> \${score.testQuality}/100</div>
                            <div><strong>建议数:</strong> \${score.recommendations.length}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
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
                // React深度优化节点创建函数
                function createReactCodeSplittingOptimizationNode(opportunity, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-code-splitting-optimization-node';
                    node.draggable = true;
                    node.dataset.type = 'reactCodeSplittingOptimization';
                    node.dataset.index = index;
                    
                    const performanceColor = opportunity.estimatedSaving >= 30 ? '#28a745' : 
                                            opportunity.estimatedSaving >= 20 ? '#ffc107' : '#17a2b8';
                    
                    node.innerHTML = \`
                        <div class="node-header">🚀 代码分割优化</div>
                        <div class="node-content">
                            <div><strong>组件:</strong> \${opportunity.component || 'Unknown'}</div>
                            <div><strong>大小:</strong> \${opportunity.size}KB</div>
                            <div style="color: \${performanceColor};">
                                <strong>预期节省:</strong> \${opportunity.estimatedSaving}%
                            </div>
                            <div><strong>优先级:</strong> \${opportunity.priority}</div>
                            <div class="node-description">\${opportunity.suggestion}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createReactRenderPerformanceOptimizationNode(operation, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-render-performance-optimization-node';
                    node.draggable = true;
                    node.dataset.type = 'reactRenderPerformanceOptimization';
                    node.dataset.index = index;
                    
                    const severityColor = operation.severity === 'high' ? '#dc3545' : 
                                         operation.severity === 'medium' ? '#ffc107' : '#28a745';
                    
                    node.innerHTML = \`
                        <div class="node-header">⚡ 渲染性能优化</div>
                        <div class="node-content">
                            <div><strong>组件:</strong> \${operation.component || 'Unknown'}</div>
                            <div><strong>操作:</strong> \${operation.operation}</div>
                            <div style="color: \${severityColor};">
                                <strong>严重级别:</strong> \${operation.severity}
                            </div>
                            <div><strong>建议:</strong> \${operation.memoizationSuggestion}</div>
                            <div class="node-description">\${operation.description}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createReactBundleOptimizationNode(treeshaking, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-bundle-optimization-node';
                    node.draggable = true;
                    node.dataset.type = 'reactBundleOptimization';
                    node.dataset.index = index;
                    
                    const impactColor = treeshaking.estimatedSaving >= 50 ? '#28a745' : 
                                       treeshaking.estimatedSaving >= 20 ? '#ffc107' : '#17a2b8';
                    
                    node.innerHTML = \`
                        <div class="node-header">📦 Bundle优化</div>
                        <div class="node-content">
                            <div><strong>模块:</strong> \${treeshaking.module}</div>
                            <div><strong>未使用导出:</strong> \${treeshaking.unusedExports ? treeshaking.unusedExports.length : 0}</div>
                            <div style="color: \${impactColor};">
                                <strong>预期节省:</strong> \${treeshaking.estimatedSaving}KB
                            </div>
                            <div><strong>建议:</strong> \${treeshaking.suggestion}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createReactStateOptimizationNode(stateIssue, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-state-optimization-node';
                    node.draggable = true;
                    node.dataset.type = 'reactStateOptimization';
                    node.dataset.index = index;
                    
                    const impactColor = stateIssue.impact === 'high' ? '#dc3545' : 
                                       stateIssue.impact === 'medium' ? '#ffc107' : '#28a745';
                    
                    node.innerHTML = \`
                        <div class="node-header">🏗️ 状态管理优化</div>
                        <div class="node-content">
                            <div><strong>组件:</strong> \${stateIssue.component || 'Unknown'}</div>
                            <div><strong>问题:</strong> \${stateIssue.issue}</div>
                            <div style="color: \${impactColor};">
                                <strong>影响:</strong> \${stateIssue.impact}
                            </div>
                            <div><strong>建议:</strong> \${stateIssue.normalizationSuggestion}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createReactPerformancePredictionNode(prediction, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-performance-prediction-node';
                    node.draggable = true;
                    node.dataset.type = 'reactPerformancePrediction';
                    node.dataset.index = index;
                    
                    const loadTimeColor = prediction.loadTime <= 2 ? '#28a745' : 
                                         prediction.loadTime <= 5 ? '#ffc107' : '#dc3545';
                    
                    node.innerHTML = \`
                        <div class="node-header">📈 性能预测</div>
                        <div class="node-content">
                            <div style="color: \${loadTimeColor};">
                                <strong>预测加载时间:</strong> \${prediction.loadTime}s
                            </div>
                            <div><strong>交互性评分:</strong> \${prediction.interactivityScore}/100</div>
                            <div><strong>内存使用:</strong> \${prediction.memoryUsage}MB</div>
                            <div><strong>复杂度:</strong> \${prediction.complexityScore}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createReactComprehensiveScoreNode(score, index) {
                    const node = document.createElement('div');
                    node.className = 'node react-comprehensive-score-node';
                    node.draggable = true;
                    node.dataset.type = 'reactComprehensiveScore';
                    node.dataset.index = index;
                    
                    const overallColor = score.overall >= 80 ? '#28a745' : 
                                        score.overall >= 60 ? '#ffc107' : '#dc3545';
                    
                    node.innerHTML = \`
                        <div class="node-header">📊 React综合评分</div>
                        <div class="node-content">
                            <div style="color: \${overallColor}; font-size: 18px;">
                                <strong>总分: \${score.overall}/100</strong>
                            </div>
                            <div><strong>性能:</strong> \${score.performance}/100</div>
                            <div><strong>可维护性:</strong> \${score.maintainability}/100</div>
                            <div><strong>可扩展性:</strong> \${score.scalability}/100</div>
                            <div><strong>用户体验:</strong> \${score.userExperience}/100</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                // Rust深度优化节点创建函数
                function createRustMemoryAllocationOptimizationNode(opportunity, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-memory-allocation-optimization-node';
                    node.draggable = true;
                    node.dataset.type = 'rustMemoryAllocationOptimization';
                    node.dataset.index = index;
                    
                    const impactColor = opportunity.impact === 'high' ? '#dc3545' : 
                                       opportunity.impact === 'medium' ? '#ffc107' : '#28a745';
                    
                    node.innerHTML = \`
                        <div class="node-header">💾 内存分配优化</div>
                        <div class="node-content">
                            <div><strong>函数:</strong> \${opportunity.function}</div>
                            <div><strong>类型:</strong> \${opportunity.type}</div>
                            <div style="color: \${impactColor};">
                                <strong>影响:</strong> \${opportunity.impact}
                            </div>
                            <div><strong>建议:</strong> \${opportunity.suggestion}</div>
                            <div class="node-description">\${opportunity.reasoning}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustConcurrencyPerformanceOptimizationNode(opportunity, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-concurrency-performance-optimization-node';
                    node.draggable = true;
                    node.dataset.type = 'rustConcurrencyPerformanceOptimization';
                    node.dataset.index = index;
                    
                    const performanceColor = opportunity.performanceGain >= 100 ? '#28a745' : 
                                            opportunity.performanceGain >= 50 ? '#ffc107' : '#17a2b8';
                    
                    node.innerHTML = \`
                        <div class="node-header">🚀 并发性能优化</div>
                        <div class="node-content">
                            <div><strong>函数:</strong> \${opportunity.function}</div>
                            <div><strong>转换类型:</strong> \${opportunity.conversionType}</div>
                            <div style="color: \${performanceColor};">
                                <strong>性能提升:</strong> \${opportunity.performanceGain}%
                            </div>
                            <div><strong>建议:</strong> \${opportunity.suggestion}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustComputationalOptimizationNode(issue, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-computational-optimization-node';
                    node.draggable = true;
                    node.dataset.type = 'rustComputationalOptimization';
                    node.dataset.index = index;
                    
                    const complexityColor = issue.currentComplexity && issue.currentComplexity.includes('O(n²)') ? '#dc3545' : 
                                           issue.currentComplexity && issue.currentComplexity.includes('O(n)') ? '#ffc107' : '#28a745';
                    
                    node.innerHTML = \`
                        <div class="node-header">🧮 计算优化</div>
                        <div class="node-content">
                            <div><strong>函数:</strong> \${issue.function}</div>
                            <div style="color: \${complexityColor};">
                                <strong>当前复杂度:</strong> \${issue.currentComplexity}
                            </div>
                            <div><strong>建议复杂度:</strong> \${issue.suggestedComplexity}</div>
                            <div><strong>优化建议:</strong> \${issue.inliningSuggestion}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustErrorHandlingSafetyNode(risk, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-error-handling-safety-node';
                    node.draggable = true;
                    node.dataset.type = 'rustErrorHandlingSafety';
                    node.dataset.index = index;
                    
                    const riskColor = risk.riskLevel === 'high' ? '#dc3545' : 
                                     risk.riskLevel === 'medium' ? '#ffc107' : '#28a745';
                    
                    node.innerHTML = \`
                        <div class="node-header">🛡️ 错误处理安全</div>
                        <div class="node-content">
                            <div><strong>函数:</strong> \${risk.function}</div>
                            <div><strong>风险类型:</strong> \${risk.riskType}</div>
                            <div style="color: \${riskColor};">
                                <strong>风险级别:</strong> \${risk.riskLevel}
                            </div>
                            <div><strong>安全替代:</strong> \${risk.safeAlternative}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustIOOptimizationNode(opportunity, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-io-optimization-node';
                    node.draggable = true;
                    node.dataset.type = 'rustIOOptimization';
                    node.dataset.index = index;
                    
                    const performanceColor = opportunity.expectedImprovement >= 50 ? '#28a745' : 
                                            opportunity.expectedImprovement >= 20 ? '#ffc107' : '#17a2b8';
                    
                    node.innerHTML = \`
                        <div class="node-header">📊 I/O优化</div>
                        <div class="node-content">
                            <div><strong>函数:</strong> \${opportunity.function}</div>
                            <div><strong>操作类型:</strong> \${opportunity.operationType}</div>
                            <div style="color: \${performanceColor};">
                                <strong>预期改进:</strong> \${opportunity.expectedImprovement}%
                            </div>
                            <div><strong>建议:</strong> \${opportunity.suggestion}</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
                function createRustArchitectureQualityNode(quality, index) {
                    const node = document.createElement('div');
                    node.className = 'node rust-architecture-quality-node';
                    node.draggable = true;
                    node.dataset.type = 'rustArchitectureQuality';
                    node.dataset.index = index;
                    
                    const overallColor = quality.overall >= 80 ? '#28a745' : 
                                        quality.overall >= 60 ? '#ffc107' : '#dc3545';
                    
                    node.innerHTML = \`
                        <div class="node-header">🏆 Rust架构质量</div>
                        <div class="node-content">
                            <div style="color: \${overallColor}; font-size: 18px;">
                                <strong>总分: \${quality.overall}/100</strong>
                            </div>
                            <div><strong>性能:</strong> \${quality.performance}/100</div>
                            <div><strong>内存效率:</strong> \${quality.memoryEfficiency}/100</div>
                            <div><strong>并发安全:</strong> \${quality.concurrencySafety}/100</div>
                            <div><strong>代码质量:</strong> \${quality.codeQuality}/100</div>
                            <div><strong>可维护性:</strong> \${quality.maintainability}/100</div>
                        </div>
                    \`;
                    
                    addNodeEvents(node);
                    return node;
                }
                
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
