// 分析可视化面板JavaScript
const vscode = acquireVsCodeApi();

// 全局状态
let analysisData = null;
let currentTab = 'overview';
let selectedItem = null;

// 图表实例
let qualityChart = null;
let renderChart = null;
let memoryChart = null;
let architectureCanvas = null;
let dependencyCanvas = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePanels();
    setupEventListeners();
    requestAnalysisData();
});

/**
 * 初始化面板
 */
function initializePanels() {
    // 初始化画布
    initializeCanvases();
    
    // 设置默认状态
    showLoadingState('正在加载分析数据...');
}

/**
 * 初始化画布
 */
function initializeCanvases() {
    // 质量趋势图
    const qualityCanvas = document.getElementById('quality-trend-canvas');
    if (qualityCanvas) {
        qualityChart = qualityCanvas.getContext('2d');
    }

    // 渲染性能图
    const renderCanvas = document.getElementById('render-performance-canvas');
    if (renderCanvas) {
        renderChart = renderCanvas.getContext('2d');
    }

    // 内存使用图
    const memoryCanvas = document.getElementById('memory-usage-canvas');
    if (memoryCanvas) {
        memoryChart = memoryCanvas.getContext('2d');
    }

    // 架构图
    architectureCanvas = document.getElementById('architecture-canvas');
    if (architectureCanvas) {
        resizeCanvas(architectureCanvas);
    }

    // 依赖图
    dependencyCanvas = document.getElementById('dependency-canvas');
    if (dependencyCanvas) {
        resizeCanvas(dependencyCanvas);
    }

    // 窗口大小改变时调整画布
    window.addEventListener('resize', () => {
        if (architectureCanvas) resizeCanvas(architectureCanvas);
        if (dependencyCanvas) resizeCanvas(dependencyCanvas);
    });
}

/**
 * 调整画布大小
 */
function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 工具栏按钮
    document.getElementById('btn-refresh').addEventListener('click', () => {
        refreshAnalysis();
    });

    document.getElementById('btn-export').addEventListener('click', () => {
        exportReport();
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
        openSettings();
    });

    // 标签页切换
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // 树形结构展开/收起
    document.querySelectorAll('.tree-header').forEach(header => {
        header.addEventListener('click', (e) => {
            toggleTreeSection(e.target.dataset.section);
        });
    });

    // 监听来自VSCode的消息
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'analysisData':
                handleAnalysisData(message.data);
                break;
            case 'updateAnalysis':
                updateAnalysisDisplay(message.data);
                break;
        }
    });
}

/**
 * 请求分析数据
 */
function requestAnalysisData() {
    vscode.postMessage({
        type: 'requestAnalysis'
    });
}

/**
 * 刷新分析
 */
function refreshAnalysis() {
    showLoadingState('正在重新分析代码...');
    vscode.postMessage({
        type: 'refreshAnalysis'
    });
}

/**
 * 处理分析数据
 */
function handleAnalysisData(data) {
    analysisData = data;
    hideLoadingState();
    updateAllPanels();
}

/**
 * 更新所有面板
 */
function updateAllPanels() {
    if (!analysisData) return;

    updateOverviewPanel();
    updateArchitecturePanel();
    updatePerformancePanel();
    updateIssuesPanel();
    updateDependenciesPanel();
    updateAnalysisTree();
}

/**
 * 更新概览面板
 */
function updateOverviewPanel() {
    const metrics = analysisData.metrics || {};
    
    // 更新指标卡片
    updateElement('total-lines', metrics.totalLines || 0);
    updateElement('complexity-score', metrics.complexityScore || 0);
    updateElement('test-coverage', `${metrics.testCoverage || 0}%`);
    updateElement('performance-score', metrics.performanceScore || 0);

    // 绘制质量趋势图
    drawQualityTrendChart();
}

/**
 * 更新架构面板
 */
function updateArchitecturePanel() {
    if (!architectureCanvas) return;

    const ctx = architectureCanvas.getContext('2d');
    ctx.clearRect(0, 0, architectureCanvas.width, architectureCanvas.height);

    // 绘制架构图
    drawArchitectureDiagram(ctx);
}

/**
 * 更新性能面板
 */
function updatePerformancePanel() {
    drawRenderPerformanceChart();
    drawMemoryUsageChart();
}

/**
 * 更新问题面板
 */
function updateIssuesPanel() {
    const issuesList = document.getElementById('issues-list');
    const issues = analysisData.issues || [];

    if (issues.length === 0) {
        issuesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <div class="empty-title">没有发现问题</div>
                <div class="empty-description">代码质量良好，未检测到明显问题。</div>
            </div>
        `;
        return;
    }

    issuesList.innerHTML = issues.map(issue => `
        <div class="issue-item" data-issue-id="${issue.id}">
            <div class="issue-header">
                <span class="issue-severity severity-${issue.severity}">${issue.severity}</span>
                <span class="issue-title">${issue.title}</span>
            </div>
            <div class="issue-description">${issue.description}</div>
            <div class="issue-location">${issue.location}</div>
        </div>
    `).join('');

    // 添加问题点击事件
    issuesList.querySelectorAll('.issue-item').forEach(item => {
        item.addEventListener('click', () => {
            const issueId = item.dataset.issueId;
            navigateToIssue(issueId);
        });
    });
}

/**
 * 更新依赖面板
 */
function updateDependenciesPanel() {
    if (!dependencyCanvas) return;

    const ctx = dependencyCanvas.getContext('2d');
    ctx.clearRect(0, 0, dependencyCanvas.width, dependencyCanvas.height);

    // 绘制依赖关系图
    drawDependencyGraph(ctx);
}

/**
 * 更新分析树
 */
function updateAnalysisTree() {
    updateTreeSection('components', analysisData.reactComponents || []);
    updateTreeSection('hooks', analysisData.reactHooks || []);
    updateTreeSection('functions', analysisData.rustFunctions || []);
    updateTreeSection('structs', analysisData.rustStructs || []);
    updateTreeSection('traits', analysisData.rustTraits || []);
}

/**
 * 更新树形结构节
 */
function updateTreeSection(section, items) {
    const countElement = document.getElementById(`${section.slice(0, -1)}-count`);
    const treeElement = document.getElementById(`${section}-tree`);

    if (countElement) {
        countElement.textContent = items.length;
    }

    if (treeElement) {
        treeElement.innerHTML = items.map(item => `
            <div class="tree-item" data-item-type="${section}" data-item-id="${item.id}">
                <span class="tree-item-icon ${getIconClass(section)}">
                    ${getIconText(section)}
                </span>
                ${item.name || item.id}
            </div>
        `).join('');

        // 添加点击事件
        treeElement.querySelectorAll('.tree-item').forEach(item => {
            item.addEventListener('click', () => {
                selectTreeItem(item);
            });
        });
    }
}

/**
 * 获取图标类名
 */
function getIconClass(section) {
    const iconMap = {
        components: 'component-icon',
        hooks: 'hook-icon',
        functions: 'function-icon',
        structs: 'struct-icon',
        traits: 'trait-icon'
    };
    return iconMap[section] || 'function-icon';
}

/**
 * 获取图标文本
 */
function getIconText(section) {
    const iconMap = {
        components: '⚛',
        hooks: '🎣',
        functions: '⚡',
        structs: '🏗',
        traits: '🎯'
    };
    return iconMap[section] || '📄';
}

/**
 * 选择树项
 */
function selectTreeItem(item) {
    // 取消之前的选择
    document.querySelectorAll('.tree-item.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // 选择当前项
    item.classList.add('selected');
    selectedItem = {
        type: item.dataset.itemType,
        id: item.dataset.itemId
    };

    // 更新属性面板或详情视图
    updateItemDetails(selectedItem);
}

/**
 * 更新项目详情
 */
function updateItemDetails(item) {
    // 可以在这里实现详细信息显示
    vscode.postMessage({
        type: 'selectItem',
        item: item
    });
}

/**
 * 切换标签页
 */
function switchTab(tabName) {
    // 更新标签页状态
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 显示对应面板
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`).classList.add('active');

    currentTab = tabName;

    // 如果切换到架构或依赖页面，重新绘制图表
    if (tabName === 'architecture') {
        setTimeout(() => updateArchitecturePanel(), 100);
    } else if (tabName === 'dependencies') {
        setTimeout(() => updateDependenciesPanel(), 100);
    }
}

/**
 * 切换树形结构节
 */
function toggleTreeSection(section) {
    const content = document.getElementById(`${section}-tree`);
    if (content) {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * 绘制质量趋势图
 */
function drawQualityTrendChart() {
    if (!qualityChart) return;

    const canvas = qualityChart.canvas;
    qualityChart.clearRect(0, 0, canvas.width, canvas.height);

    // 模拟数据
    const data = [65, 70, 75, 72, 78, 82, 85];
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];

    drawLineChart(qualityChart, data, labels, '#61dafb');
}

/**
 * 绘制渲染性能图
 */
function drawRenderPerformanceChart() {
    if (!renderChart) return;

    const canvas = renderChart.canvas;
    renderChart.clearRect(0, 0, canvas.width, canvas.height);

    // 模拟数据
    const data = [16, 15, 17, 14, 16, 15, 16];
    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

    drawLineChart(renderChart, data, labels, '#28a745');
}

/**
 * 绘制内存使用图
 */
function drawMemoryUsageChart() {
    if (!memoryChart) return;

    const canvas = memoryChart.canvas;
    memoryChart.clearRect(0, 0, canvas.width, canvas.height);

    // 模拟数据
    const data = [45, 48, 52, 49, 51, 47, 46];
    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

    drawLineChart(memoryChart, data, labels, '#ffc107');
}

/**
 * 绘制线性图表
 */
function drawLineChart(ctx, data, labels, color) {
    const canvas = ctx.canvas;
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // 计算数据点位置
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const valueRange = maxValue - minValue || 1;

    const points = data.map((value, index) => ({
        x: padding + (index * chartWidth) / (data.length - 1),
        y: padding + chartHeight - ((value - minValue) / valueRange) * chartHeight
    }));

    // 绘制网格线
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--vscode-textBlockQuote-border');
    ctx.lineWidth = 1;
    
    // 水平网格线
    for (let i = 0; i <= 5; i++) {
        const y = padding + (i * chartHeight) / 5;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
    }

    // 垂直网格线
    for (let i = 0; i < data.length; i++) {
        const x = padding + (i * chartWidth) / (data.length - 1);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
    }

    // 绘制数据线
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // 绘制数据点
    ctx.fillStyle = color;
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // 绘制标签
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--vscode-editor-foreground');
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    labels.forEach((label, index) => {
        const x = padding + (index * chartWidth) / (data.length - 1);
        ctx.fillText(label, x, canvas.height - 10);
    });
}

/**
 * 绘制架构图
 */
function drawArchitectureDiagram(ctx) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // 模拟组件节点
    const components = analysisData?.reactComponents || [];
    const structs = analysisData?.rustStructs || [];

    // 绘制React组件
    components.forEach((component, index) => {
        const x = 100 + (index % 3) * 200;
        const y = 100 + Math.floor(index / 3) * 150;
        
        drawComponentNode(ctx, x, y, component.name, '#61dafb');
    });

    // 绘制Rust结构体
    structs.forEach((struct, index) => {
        const x = 100 + (index % 3) * 200;
        const y = 300 + Math.floor(index / 3) * 150;
        
        drawComponentNode(ctx, x, y, struct.name, '#ce422b');
    });
}

/**
 * 绘制组件节点
 */
function drawComponentNode(ctx, x, y, name, color) {
    const width = 120;
    const height = 60;

    // 绘制节点背景
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--vscode-editor-background');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    ctx.fillRect(x - width/2, y - height/2, width, height);
    ctx.strokeRect(x - width/2, y - height/2, width, height);

    // 绘制节点文本
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--vscode-editor-foreground');
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y + 5);
}

/**
 * 绘制依赖关系图
 */
function drawDependencyGraph(ctx) {
    const canvas = ctx.canvas;
    
    // 这里可以实现更复杂的依赖关系图
    // 暂时显示一个简单的示例
    
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--vscode-editor-foreground');
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('依赖关系图', canvas.width / 2, canvas.height / 2);
    ctx.fillText('(开发中...)', canvas.width / 2, canvas.height / 2 + 30);
}

/**
 * 显示加载状态
 */
function showLoadingState(message) {
    const content = document.querySelector('.visualization-content');
    content.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <div>${message}</div>
        </div>
    `;
}

/**
 * 隐藏加载状态
 */
function hideLoadingState() {
    // 恢复原始内容
    location.reload();
}

/**
 * 更新元素内容
 */
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

/**
 * 导出报告
 */
function exportReport() {
    vscode.postMessage({
        type: 'exportReport',
        data: analysisData
    });
}

/**
 * 打开设置
 */
function openSettings() {
    vscode.postMessage({
        type: 'openSettings'
    });
}

/**
 * 导航到问题位置
 */
function navigateToIssue(issueId) {
    vscode.postMessage({
        type: 'navigateToIssue',
        issueId: issueId
    });
}
