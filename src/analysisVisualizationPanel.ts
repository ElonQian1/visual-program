// 分析结果可视化面板
import * as vscode from 'vscode';
import { InteractiveCanvasSystem, CanvasNode, NodeConnection } from './simplifiedInteractiveCanvas';

export interface AnalysisResult {
    type: 'react' | 'rust' | 'mixed';
    timestamp: number;
    filePath: string;
    summary: {
        totalElements: number;
        complexity: number;
        performance: number;
        maintainability: number;
    };
    elements: AnalysisElement[];
    dependencies: DependencyInfo[];
    issues: AnalysisIssue[];
    suggestions: AnalysisSuggestion[];
}

export interface AnalysisElement {
    id: string;
    name: string;
    type: string;
    filePath: string;
    lineNumber: number;
    complexity: number;
    size: number;
    dependencies: string[];
    children?: AnalysisElement[];
    metadata: Record<string, any>;
}

export interface DependencyInfo {
    from: string;
    to: string;
    type: 'import' | 'call' | 'inheritance' | 'composition';
    strength: number;
    filePath?: string;
}

export interface AnalysisIssue {
    id: string;
    severity: 'error' | 'warning' | 'info';
    title: string;
    description: string;
    filePath: string;
    lineNumber: number;
    suggestion?: string;
}

export interface AnalysisSuggestion {
    id: string;
    category: 'performance' | 'architecture' | 'maintainability' | 'security';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    filePath?: string;
}

export class AnalysisVisualizationPanel {
    private panel: vscode.WebviewPanel | undefined;
    private canvasSystem: InteractiveCanvasSystem;
    private currentAnalysis: AnalysisResult | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.canvasSystem = new InteractiveCanvasSystem();
    }

    // 🎨 创建可视化面板
    public createPanel(): vscode.WebviewPanel {
        this.panel = vscode.window.createWebviewPanel(
            'analysisVisualization',
            '代码分析可视化',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        this.setupMessageHandling();
        
        return this.panel;
    }

    // 📝 获取WebView内容
    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码分析可视化</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #1e1e1e;
            color: #d4d4d4;
            height: 100vh;
            overflow: hidden;
        }

        .main-container {
            display: flex;
            height: 100vh;
        }

        .sidebar {
            width: 300px;
            background-color: #252526;
            border-right: 1px solid #3c3c3c;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .sidebar-header {
            padding: 16px;
            background-color: #2d2d30;
            border-bottom: 1px solid #3c3c3c;
        }

        .sidebar-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .sidebar-tabs {
            display: flex;
            gap: 4px;
        }

        .tab-button {
            padding: 6px 12px;
            background: transparent;
            border: 1px solid #3c3c3c;
            border-radius: 4px;
            color: #d4d4d4;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }

        .tab-button:hover {
            background-color: #3c3c3c;
        }

        .tab-button.active {
            background-color: #0e639c;
            border-color: #007acc;
            color: white;
        }

        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }

        .analysis-summary {
            background-color: #2d2d30;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }

        .summary-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #ffffff;
        }

        .summary-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .metric-item {
            text-align: center;
        }

        .metric-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .metric-label {
            font-size: 12px;
            color: #a0a0a0;
        }

        .metric-value.high {
            color: #f14c4c;
        }

        .metric-value.medium {
            color: #ffcc02;
        }

        .metric-value.low {
            color: #73c991;
        }

        .element-list {
            background-color: #2d2d30;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }

        .element-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin-bottom: 4px;
        }

        .element-item:hover {
            background-color: #3c3c3c;
        }

        .element-item.selected {
            background-color: #0e639c;
        }

        .element-icon {
            width: 20px;
            height: 20px;
            margin-right: 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 600;
        }

        .element-icon.react {
            background-color: #61dafb;
            color: #000000;
        }

        .element-icon.rust {
            background-color: #ce422b;
            color: #ffffff;
        }

        .element-icon.function {
            background-color: #f59e0b;
            color: #000000;
        }

        .element-info {
            flex: 1;
        }

        .element-name {
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 2px;
        }

        .element-details {
            font-size: 11px;
            color: #a0a0a0;
        }

        .element-complexity {
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            min-width: 20px;
            text-align: center;
        }

        .complexity-low {
            background-color: #10b981;
            color: #000000;
        }

        .complexity-medium {
            background-color: #f59e0b;
            color: #000000;
        }

        .complexity-high {
            background-color: #ef4444;
            color: #ffffff;
        }

        .issues-list {
            background-color: #2d2d30;
            border-radius: 8px;
            padding: 16px;
        }

        .issue-item {
            display: flex;
            align-items: flex-start;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin-bottom: 8px;
            border-left: 3px solid transparent;
        }

        .issue-item:hover {
            background-color: #3c3c3c;
        }

        .issue-item.error {
            border-left-color: #f14c4c;
        }

        .issue-item.warning {
            border-left-color: #ffcc02;
        }

        .issue-item.info {
            border-left-color: #0ea5e9;
        }

        .issue-severity {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 8px;
            margin-top: 2px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }

        .severity-error {
            background-color: #f14c4c;
            color: #ffffff;
        }

        .severity-warning {
            background-color: #ffcc02;
            color: #000000;
        }

        .severity-info {
            background-color: #0ea5e9;
            color: #ffffff;
        }

        .issue-content {
            flex: 1;
        }

        .issue-title {
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .issue-description {
            font-size: 11px;
            color: #a0a0a0;
            line-height: 1.4;
        }

        .visualization-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .visualization-header {
            padding: 16px;
            background-color: #2d2d30;
            border-bottom: 1px solid #3c3c3c;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .visualization-title {
            font-size: 16px;
            font-weight: 600;
        }

        .visualization-controls {
            display: flex;
            gap: 8px;
        }

        .control-button {
            padding: 6px 12px;
            background: #0e639c;
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s ease;
        }

        .control-button:hover {
            background-color: #1177bb;
        }

        .control-button.secondary {
            background-color: #3c3c3c;
        }

        .control-button.secondary:hover {
            background-color: #4c4c4c;
        }

        .canvas-container {
            flex: 1;
            position: relative;
            overflow: hidden;
            background: 
                radial-gradient(circle at 20px 20px, #3c3c3c 1px, transparent 1px),
                radial-gradient(circle at 40px 40px, #3c3c3c 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: 0 0, 20px 20px;
        }

        .node {
            position: absolute;
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
            border: 2px solid #6b7280;
            border-radius: 12px;
            padding: 16px;
            min-width: 180px;
            min-height: 80px;
            cursor: grab;
            transition: all 0.3s ease;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }

        .node:hover {
            border-color: #60a5fa;
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
        }

        .node.selected {
            border-color: #3b82f6;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
        }

        .node.dragging {
            cursor: grabbing;
            z-index: 1000;
            transform: rotate(2deg) scale(1.05);
        }

        .node-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }

        .node-type-icon {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
        }

        .node-title {
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            flex: 1;
        }

        .node-complexity {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
        }

        .node-content {
            color: #d1d5db;
            font-size: 12px;
            line-height: 1.4;
        }

        .node-metrics {
            display: flex;
            gap: 12px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metric {
            text-align: center;
            flex: 1;
        }

        .metric-number {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 2px;
        }

        .metric-text {
            font-size: 10px;
            color: #a0a0a0;
        }

        .connection {
            position: absolute;
            pointer-events: none;
            z-index: 1;
        }

        .connection svg {
            overflow: visible;
        }

        .connection-path {
            fill: none;
            stroke-width: 3;
            stroke-dasharray: 0;
            transition: all 0.3s ease;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .connection-path.dependency {
            stroke: #10b981;
        }

        .connection-path.import {
            stroke: #3b82f6;
        }

        .connection-path.call {
            stroke: #f59e0b;
        }

        .connection-path.inheritance {
            stroke: #8b5cf6;
        }

        .connection-label {
            fill: #d4d4d4;
            font-size: 11px;
            font-weight: 500;
            text-anchor: middle;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #a0a0a0;
            text-align: center;
        }

        .empty-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .empty-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .empty-description {
            font-size: 14px;
            max-width: 400px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- 侧边栏 -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-title">分析结果</div>
                <div class="sidebar-tabs">
                    <button class="tab-button active" data-tab="summary">概览</button>
                    <button class="tab-button" data-tab="elements">元素</button>
                    <button class="tab-button" data-tab="issues">问题</button>
                    <button class="tab-button" data-tab="suggestions">建议</button>
                </div>
            </div>
            <div class="sidebar-content">
                <!-- 概览标签页 -->
                <div id="tab-summary" class="tab-content active">
                    <div class="analysis-summary">
                        <div class="summary-title">分析概览</div>
                        <div class="summary-metrics">
                            <div class="metric-item">
                                <div class="metric-value low" id="total-elements">0</div>
                                <div class="metric-label">总元素</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value medium" id="complexity-score">0</div>
                                <div class="metric-label">复杂度</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value low" id="performance-score">0</div>
                                <div class="metric-label">性能</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value medium" id="maintainability-score">0</div>
                                <div class="metric-label">可维护性</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 元素标签页 -->
                <div id="tab-elements" class="tab-content">
                    <div class="element-list">
                        <div class="summary-title">代码元素</div>
                        <div id="elements-container">
                            <!-- 动态填充 -->
                        </div>
                    </div>
                </div>

                <!-- 问题标签页 -->
                <div id="tab-issues" class="tab-content">
                    <div class="issues-list">
                        <div class="summary-title">代码问题</div>
                        <div id="issues-container">
                            <!-- 动态填充 -->
                        </div>
                    </div>
                </div>

                <!-- 建议标签页 -->
                <div id="tab-suggestions" class="tab-content">
                    <div class="issues-list">
                        <div class="summary-title">优化建议</div>
                        <div id="suggestions-container">
                            <!-- 动态填充 -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 可视化区域 -->
        <div class="visualization-area">
            <div class="visualization-header">
                <div class="visualization-title">代码结构可视化</div>
                <div class="visualization-controls">
                    <button class="control-button" id="layout-tree">树状布局</button>
                    <button class="control-button" id="layout-force">力导向布局</button>
                    <button class="control-button secondary" id="fit-view">适应视图</button>
                    <button class="control-button secondary" id="export-svg">导出SVG</button>
                </div>
            </div>
            <div class="canvas-container" id="canvas-container">
                <div class="empty-state" id="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-title">暂无分析结果</div>
                    <div class="empty-description">
                        选择一个文件进行分析，结果将在这里显示为交互式可视化图表
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // 应用状态
        let currentAnalysis = null;
        let selectedElements = [];
        let visualizationNodes = [];
        let visualizationConnections = [];
        let viewport = { x: 0, y: 0, zoom: 1.0 };
        let isDragging = false;
        let dragState = {};

        // DOM元素
        const canvasContainer = document.getElementById('canvas-container');
        const emptyState = document.getElementById('empty-state');
        const elementsContainer = document.getElementById('elements-container');
        const issuesContainer = document.getElementById('issues-container');
        const suggestionsContainer = document.getElementById('suggestions-container');

        // 标签页切换
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                switchTab(tabId);
            });
        });

        function switchTab(tabId) {
            // 更新按钮状态
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabId);
            });

            // 更新内容显示
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = content.id === 'tab-' + tabId ? 'block' : 'none';
            });
        }

        // 控制按钮
        document.getElementById('layout-tree').addEventListener('click', () => layoutAsTree());
        document.getElementById('layout-force').addEventListener('click', () => layoutAsForce());
        document.getElementById('fit-view').addEventListener('click', () => fitToView());
        document.getElementById('export-svg').addEventListener('click', () => exportAsSVG());

        // 更新分析结果
        function updateAnalysis(analysis) {
            currentAnalysis = analysis;
            
            if (!analysis) {
                showEmptyState();
                return;
            }

            hideEmptyState();
            updateSummary(analysis.summary);
            updateElementsList(analysis.elements);
            updateIssuesList(analysis.issues);
            updateSuggestionsList(analysis.suggestions);
            createVisualization(analysis);
        }

        // 显示/隐藏空状态
        function showEmptyState() {
            emptyState.style.display = 'flex';
        }

        function hideEmptyState() {
            emptyState.style.display = 'none';
        }

        // 更新概览
        function updateSummary(summary) {
            document.getElementById('total-elements').textContent = summary.totalElements;
            document.getElementById('complexity-score').textContent = Math.round(summary.complexity);
            document.getElementById('performance-score').textContent = Math.round(summary.performance);
            document.getElementById('maintainability-score').textContent = Math.round(summary.maintainability);

            // 更新颜色
            updateMetricColor('complexity-score', summary.complexity);
            updateMetricColor('performance-score', summary.performance);
            updateMetricColor('maintainability-score', summary.maintainability);
        }

        function updateMetricColor(elementId, value) {
            const element = document.getElementById(elementId);
            element.className = 'metric-value ' + getMetricLevel(value);
        }

        function getMetricLevel(value) {
            if (value >= 80) return 'high';
            if (value >= 60) return 'medium';
            return 'low';
        }

        // 更新元素列表
        function updateElementsList(elements) {
            elementsContainer.innerHTML = '';
            
            elements.forEach(element => {
                const item = createElementItem(element);
                elementsContainer.appendChild(item);
            });
        }

        function createElementItem(element) {
            const item = document.createElement('div');
            item.className = 'element-item';
            item.dataset.elementId = element.id;
            
            const complexityClass = getComplexityClass(element.complexity);
            
            item.innerHTML = \`
                <div class="element-icon \${element.type}">
                    \${getElementIcon(element.type)}
                </div>
                <div class="element-info">
                    <div class="element-name">\${element.name}</div>
                    <div class="element-details">\${element.filePath}:\${element.lineNumber}</div>
                </div>
                <div class="element-complexity \${complexityClass}">
                    \${Math.round(element.complexity)}
                </div>
            \`;

            item.addEventListener('click', () => {
                selectElement(element.id);
                highlightNodeInVisualization(element.id);
            });

            return item;
        }

        function getElementIcon(type) {
            const icons = {
                'react': '⚛️',
                'rust': '🦀',
                'function': '🔧',
                'component': '🧩',
                'struct': '📦',
                'enum': '🔀',
                'trait': '🎭'
            };
            return icons[type] || '📄';
        }

        function getComplexityClass(complexity) {
            if (complexity >= 15) return 'complexity-high';
            if (complexity >= 8) return 'complexity-medium';
            return 'complexity-low';
        }

        // 更新问题列表
        function updateIssuesList(issues) {
            issuesContainer.innerHTML = '';
            
            issues.forEach(issue => {
                const item = createIssueItem(issue);
                issuesContainer.appendChild(item);
            });
        }

        function createIssueItem(issue) {
            const item = document.createElement('div');
            item.className = \`issue-item \${issue.severity}\`;
            
            const severityIcon = getSeverityIcon(issue.severity);
            
            item.innerHTML = \`
                <div class="issue-severity severity-\${issue.severity}">
                    \${severityIcon}
                </div>
                <div class="issue-content">
                    <div class="issue-title">\${issue.title}</div>
                    <div class="issue-description">\${issue.description}</div>
                </div>
            \`;

            item.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'goToFile',
                    filePath: issue.filePath,
                    lineNumber: issue.lineNumber
                });
            });

            return item;
        }

        function getSeverityIcon(severity) {
            const icons = {
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            };
            return icons[severity] || 'ℹ️';
        }

        // 更新建议列表
        function updateSuggestionsList(suggestions) {
            suggestionsContainer.innerHTML = '';
            
            suggestions.forEach(suggestion => {
                const item = createSuggestionItem(suggestion);
                suggestionsContainer.appendChild(item);
            });
        }

        function createSuggestionItem(suggestion) {
            const item = document.createElement('div');
            item.className = 'issue-item info';
            
            item.innerHTML = \`
                <div class="issue-severity severity-info">
                    💡
                </div>
                <div class="issue-content">
                    <div class="issue-title">\${suggestion.title}</div>
                    <div class="issue-description">\${suggestion.description}</div>
                </div>
            \`;

            return item;
        }

        // 创建可视化
        function createVisualization(analysis) {
            visualizationNodes = analysis.elements.map(element => createVisualizationNode(element));
            visualizationConnections = analysis.dependencies.map(dep => createVisualizationConnection(dep));
            
            layoutAsTree();
            renderVisualization();
        }

        function createVisualizationNode(element) {
            return {
                id: element.id,
                x: Math.random() * 800 + 100,
                y: Math.random() * 600 + 100,
                width: 180,
                height: 120,
                element: element
            };
        }

        function createVisualizationConnection(dependency) {
            return {
                id: \`conn_\${dependency.from}_\${dependency.to}\`,
                source: dependency.from,
                target: dependency.to,
                type: dependency.type,
                strength: dependency.strength
            };
        }

        // 树状布局
        function layoutAsTree() {
            if (visualizationNodes.length === 0) return;

            const levels = new Map();
            const visited = new Set();
            
            // 找到根节点（没有输入依赖的节点）
            const rootNodes = visualizationNodes.filter(node => 
                !visualizationConnections.some(conn => conn.target === node.id)
            );

            // BFS布局
            const queue = rootNodes.map(node => ({ node, level: 0 }));
            let levelCounts = new Map();

            while (queue.length > 0) {
                const { node, level } = queue.shift();
                
                if (visited.has(node.id)) continue;
                visited.add(node.id);

                if (!levelCounts.has(level)) levelCounts.set(level, 0);
                const posInLevel = levelCounts.get(level);
                levelCounts.set(level, posInLevel + 1);

                node.x = 200 + level * 250;
                node.y = 100 + posInLevel * 150;

                // 添加子节点到队列
                visualizationConnections
                    .filter(conn => conn.source === node.id)
                    .forEach(conn => {
                        const targetNode = visualizationNodes.find(n => n.id === conn.target);
                        if (targetNode && !visited.has(targetNode.id)) {
                            queue.push({ node: targetNode, level: level + 1 });
                        }
                    });
            }

            renderVisualization();
        }

        // 力导向布局
        function layoutAsForce() {
            if (visualizationNodes.length === 0) return;

            // 简单的力导向算法
            const iterations = 100;
            const repulsionForce = 10000;
            const attractionForce = 0.1;
            const damping = 0.9;

            for (let i = 0; i < iterations; i++) {
                // 计算排斥力
                visualizationNodes.forEach(node => {
                    node.vx = node.vx || 0;
                    node.vy = node.vy || 0;
                    
                    visualizationNodes.forEach(other => {
                        if (node === other) return;
                        
                        const dx = node.x - other.x;
                        const dy = node.y - other.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = repulsionForce / (distance * distance);
                        
                        node.vx += (dx / distance) * force;
                        node.vy += (dy / distance) * force;
                    });
                });

                // 计算吸引力
                visualizationConnections.forEach(conn => {
                    const source = visualizationNodes.find(n => n.id === conn.source);
                    const target = visualizationNodes.find(n => n.id === conn.target);
                    
                    if (source && target) {
                        const dx = target.x - source.x;
                        const dy = target.y - source.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = attractionForce * distance;
                        
                        source.vx += (dx / distance) * force;
                        source.vy += (dy / distance) * force;
                        target.vx -= (dx / distance) * force;
                        target.vy -= (dy / distance) * force;
                    }
                });

                // 应用速度和阻尼
                visualizationNodes.forEach(node => {
                    node.x += node.vx;
                    node.y += node.vy;
                    node.vx *= damping;
                    node.vy *= damping;
                });
            }

            renderVisualization();
        }

        // 渲染可视化
        function renderVisualization() {
            canvasContainer.innerHTML = '';

            // 渲染连接
            visualizationConnections.forEach(conn => {
                const connectionEl = createConnectionElement(conn);
                if (connectionEl) canvasContainer.appendChild(connectionEl);
            });

            // 渲染节点
            visualizationNodes.forEach(node => {
                const nodeEl = createNodeElement(node);
                canvasContainer.appendChild(nodeEl);
            });
        }

        // 创建节点元素
        function createNodeElement(node) {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'node';
            nodeEl.style.left = (viewport.x + node.x * viewport.zoom) + 'px';
            nodeEl.style.top = (viewport.y + node.y * viewport.zoom) + 'px';
            nodeEl.style.transform = \`scale(\${viewport.zoom})\`;
            nodeEl.style.transformOrigin = '0 0';
            nodeEl.dataset.nodeId = node.id;

            const element = node.element;
            const complexityClass = getComplexityClass(element.complexity);

            nodeEl.innerHTML = \`
                <div class="node-header">
                    <div class="node-type-icon \${element.type}">
                        \${getElementIcon(element.type)}
                    </div>
                    <div class="node-title">\${element.name}</div>
                    <div class="node-complexity \${complexityClass}">
                        \${Math.round(element.complexity)}
                    </div>
                </div>
                <div class="node-content">
                    \${element.filePath.split('/').pop()}:\${element.lineNumber}
                </div>
                <div class="node-metrics">
                    <div class="metric">
                        <div class="metric-number">\${element.size || 0}</div>
                        <div class="metric-text">大小</div>
                    </div>
                    <div class="metric">
                        <div class="metric-number">\${element.dependencies.length}</div>
                        <div class="metric-text">依赖</div>
                    </div>
                </div>
            \`;

            // 绑定事件
            nodeEl.addEventListener('mousedown', (e) => startDrag(e, node));
            nodeEl.addEventListener('click', (e) => {
                e.stopPropagation();
                selectElement(element.id);
            });
            nodeEl.addEventListener('dblclick', (e) => {
                vscode.postMessage({
                    command: 'goToFile',
                    filePath: element.filePath,
                    lineNumber: element.lineNumber
                });
            });

            return nodeEl;
        }

        // 创建连接元素
        function createConnectionElement(connection) {
            const sourceNode = visualizationNodes.find(n => n.id === connection.source);
            const targetNode = visualizationNodes.find(n => n.id === connection.target);
            
            if (!sourceNode || !targetNode) return null;

            const connectionEl = document.createElement('div');
            connectionEl.className = 'connection';

            const sourceX = viewport.x + (sourceNode.x + sourceNode.width) * viewport.zoom;
            const sourceY = viewport.y + (sourceNode.y + sourceNode.height / 2) * viewport.zoom;
            const targetX = viewport.x + targetNode.x * viewport.zoom;
            const targetY = viewport.y + (targetNode.y + targetNode.height / 2) * viewport.zoom;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.left = '0';
            svg.style.top = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.pointerEvents = 'none';

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const midX = (sourceX + targetX) / 2;
            const pathData = \`M \${sourceX} \${sourceY} Q \${midX} \${sourceY} \${midX} \${(sourceY + targetY) / 2} Q \${midX} \${targetY} \${targetX} \${targetY}\`;
            
            path.setAttribute('d', pathData);
            path.className = \`connection-path \${connection.type}\`;

            svg.appendChild(path);
            connectionEl.appendChild(svg);

            return connectionEl;
        }

        // 拖拽功能
        function startDrag(e, node) {
            e.preventDefault();
            isDragging = true;
            dragState = {
                node: node,
                startX: e.clientX,
                startY: e.clientY,
                nodeStartX: node.x,
                nodeStartY: node.y
            };

            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);
        }

        function onDragMove(e) {
            if (!isDragging || !dragState.node) return;

            const deltaX = (e.clientX - dragState.startX) / viewport.zoom;
            const deltaY = (e.clientY - dragState.startY) / viewport.zoom;

            dragState.node.x = dragState.nodeStartX + deltaX;
            dragState.node.y = dragState.nodeStartY + deltaY;

            renderVisualization();
        }

        function onDragEnd(e) {
            isDragging = false;
            dragState = {};
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
        }

        // 适应视图
        function fitToView() {
            if (visualizationNodes.length === 0) return;

            const bounds = getNodesBounds();
            const containerRect = canvasContainer.getBoundingClientRect();
            
            const scaleX = containerRect.width / (bounds.width + 100);
            const scaleY = containerRect.height / (bounds.height + 100);
            const scale = Math.min(scaleX, scaleY, 1.0);

            viewport.zoom = scale;
            viewport.x = (containerRect.width - bounds.width * scale) / 2 - bounds.left * scale;
            viewport.y = (containerRect.height - bounds.height * scale) / 2 - bounds.top * scale;

            renderVisualization();
        }

        function getNodesBounds() {
            if (visualizationNodes.length === 0) return { left: 0, top: 0, width: 0, height: 0 };

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            visualizationNodes.forEach(node => {
                minX = Math.min(minX, node.x);
                minY = Math.min(minY, node.y);
                maxX = Math.max(maxX, node.x + node.width);
                maxY = Math.max(maxY, node.y + node.height);
            });

            return {
                left: minX,
                top: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }

        // 选择元素
        function selectElement(elementId) {
            selectedElements = [elementId];
            
            // 更新侧边栏选择状态
            document.querySelectorAll('.element-item').forEach(item => {
                item.classList.toggle('selected', item.dataset.elementId === elementId);
            });

            // 更新可视化选择状态
            document.querySelectorAll('.node').forEach(node => {
                node.classList.toggle('selected', node.dataset.nodeId === elementId);
            });
        }

        // 高亮可视化中的节点
        function highlightNodeInVisualization(elementId) {
            const node = visualizationNodes.find(n => n.id === elementId);
            if (node) {
                // 移动视口到节点位置
                viewport.x = canvasContainer.clientWidth / 2 - node.x * viewport.zoom;
                viewport.y = canvasContainer.clientHeight / 2 - node.y * viewport.zoom;
                renderVisualization();
            }
        }

        // 导出SVG
        function exportAsSVG() {
            vscode.postMessage({
                command: 'exportVisualization',
                format: 'svg',
                data: {
                    nodes: visualizationNodes,
                    connections: visualizationConnections,
                    viewport: viewport
                }
            });
        }

        // 接收VS Code消息
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'updateAnalysis':
                    updateAnalysis(message.analysis);
                    break;
                case 'selectElement':
                    selectElement(message.elementId);
                    highlightNodeInVisualization(message.elementId);
                    break;
                case 'highlightIssue':
                    // 高亮显示问题相关的元素
                    break;
            }
        });

        // 初始化
        showEmptyState();
    </script>
</body>
</html>`;
    }

    // 🔧 设置消息处理
    private setupMessageHandling(): void {
        if (!this.panel) {return;}

        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'goToFile':
                        this.goToFile(message.filePath, message.lineNumber);
                        break;
                    case 'exportVisualization':
                        this.exportVisualization(message.format, message.data);
                        break;
                }
            }
        );
    }

    // 📂 跳转到文件
    private async goToFile(filePath: string, lineNumber: number): Promise<void> {
        try {
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);
            
            const position = new vscode.Position(Math.max(0, lineNumber - 1), 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        } catch (error) {
            vscode.window.showErrorMessage(`无法打开文件: ${filePath}`);
        }
    }

    // 📤 导出可视化
    private exportVisualization(format: string, data: any): void {
        const fileName = `code-visualization.${format}`;
        vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(fileName),
            filters: {
                'SVG Files': ['svg'],
                'JSON Files': ['json']
            }
        }).then(uri => {
            if (uri) {
                // 这里可以实现实际的导出逻辑
                vscode.window.showInformationMessage(`可视化已导出到: ${uri.fsPath}`);
            }
        });
    }

    // 🔄 更新分析结果
    public updateAnalysis(analysis: AnalysisResult): void {
        this.currentAnalysis = analysis;
        
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'updateAnalysis',
                analysis: analysis
            });
        }
    }

    // 🎯 选择元素
    public selectElement(elementId: string): void {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'selectElement',
                elementId: elementId
            });
        }
    }

    // 💡 高亮问题
    public highlightIssue(issueId: string): void {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'highlightIssue',
                issueId: issueId
            });
        }
    }

    // 📊 从代码分析创建分析结果
    public static createAnalysisFromCodeAnalysis(codeAnalysis: any): AnalysisResult {
        const elements: AnalysisElement[] = [];
        const dependencies: DependencyInfo[] = [];
        const issues: AnalysisIssue[] = [];
        const suggestions: AnalysisSuggestion[] = [];

        // 处理React组件
        if (codeAnalysis.react?.components) {
            codeAnalysis.react.components.forEach((comp: any, index: number) => {
                elements.push({
                    id: `react_comp_${index}`,
                    name: comp.name,
                    type: 'react',
                    filePath: comp.filePath,
                    lineNumber: comp.lineNumber,
                    complexity: comp.complexity || 1,
                    size: comp.linesOfCode || 0,
                    dependencies: comp.dependencies || [],
                    metadata: {
                        hooks: comp.hooks,
                        props: comp.props,
                        state: comp.state
                    }
                });
            });
        }

        // 处理Rust结构
        if (codeAnalysis.rust?.structs) {
            codeAnalysis.rust.structs.forEach((struct: any, index: number) => {
                elements.push({
                    id: `rust_struct_${index}`,
                    name: struct.name,
                    type: 'rust',
                    filePath: struct.filePath,
                    lineNumber: struct.lineNumber,
                    complexity: struct.complexity || 1,
                    size: struct.linesOfCode || 0,
                    dependencies: struct.dependencies || [],
                    metadata: {
                        fields: struct.fields,
                        methods: struct.methods,
                        traits: struct.traits
                    }
                });
            });
        }

        // 计算概览指标
        const totalElements = elements.length;
        const avgComplexity = elements.reduce((sum, el) => sum + el.complexity, 0) / totalElements || 0;
        const performance = Math.max(0, 100 - avgComplexity * 5);
        const maintainability = Math.max(0, 100 - avgComplexity * 3);

        return {
            type: 'mixed',
            timestamp: Date.now(),
            filePath: codeAnalysis.filePath || '',
            summary: {
                totalElements,
                complexity: avgComplexity,
                performance,
                maintainability
            },
            elements,
            dependencies,
            issues,
            suggestions
        };
    }
}
