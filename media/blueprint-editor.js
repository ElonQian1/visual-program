/**
 * 蓝图编辑器前端JavaScript
 */

// 获取VSCode API
const vscode = acquireVsCodeApi();

// 全局状态
let currentGraph = null;
let selectedNode = null;
let selectedConnection = null;
let nodeTemplates = [];
let isDragging = false;
let isConnecting = false;
let dragStartPos = { x: 0, y: 0 };
let connectionStart = null;
let viewportTransform = { x: 0, y: 0, scale: 1.0 };

// DOM元素
let canvas, nodesLayer, connectionsLayer, tempConnectionLayer;
let nodePalette, propertiesContent;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    setupEventListeners();
    loadNodeTemplates();
});

/**
 * 初始化编辑器
 */
function initializeEditor() {
    canvas = document.getElementById('blueprint-canvas');
    nodesLayer = document.getElementById('nodes-layer');
    connectionsLayer = document.getElementById('connections-layer');
    tempConnectionLayer = document.getElementById('temp-connection-layer');
    nodePalette = document.getElementById('node-palette');
    propertiesContent = document.getElementById('properties-content');

    // 设置画布大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 工具栏按钮
    document.getElementById('new-graph-btn').addEventListener('click', showNewGraphDialog);
    document.getElementById('save-graph-btn').addEventListener('click', saveGraph);
    document.getElementById('load-graph-btn').addEventListener('click', loadGraph);
    document.getElementById('validate-btn').addEventListener('click', validateGraph);
    document.getElementById('generate-react-btn').addEventListener('click', () => generateCode('react'));
    document.getElementById('generate-rust-btn').addEventListener('click', () => generateCode('rust'));

    // 画布控制
    document.getElementById('zoom-in-btn').addEventListener('click', () => zoomCanvas(1.2));
    document.getElementById('zoom-out-btn').addEventListener('click', () => zoomCanvas(0.8));
    document.getElementById('fit-to-screen-btn').addEventListener('click', fitToScreen);

    // 框架过滤器
    document.getElementById('framework-filter').addEventListener('change', filterNodeTemplates);

    // 画布事件
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('wheel', onCanvasWheel);
    canvas.addEventListener('dblclick', onCanvasDoubleClick);

    // VSCode消息监听
    window.addEventListener('message', handleVSCodeMessage);

    // 键盘事件
    document.addEventListener('keydown', onKeyDown);
}

/**
 * 处理来自VSCode的消息
 */
function handleVSCodeMessage(event) {
    const message = event.data;
    
    switch (message.command) {
        case 'graphCreated':
            handleGraphCreated(message.data);
            break;
        case 'nodeAdded':
            handleNodeAdded(message.data);
            break;
        case 'connectionCreated':
            handleConnectionCreated(message.data);
            break;
        case 'connectionError':
            showError(message.data.error);
            break;
        case 'validationResult':
            handleValidationResult(message.data);
            break;
        case 'codeGenerated':
            handleCodeGenerated(message.data);
            break;
        case 'nodeTemplates':
            handleNodeTemplates(message.data);
            break;
        case 'graphLoaded':
            handleGraphLoaded(message.data);
            break;
        case 'nodeDeleted':
            handleNodeDeleted(message.data);
            break;
        case 'connectionDeleted':
            handleConnectionDeleted(message.data);
            break;
    }
}

/**
 * 加载节点模板
 */
function loadNodeTemplates() {
    vscode.postMessage({
        command: 'getNodeTemplates',
        data: {}
    });
}

/**
 * 处理节点模板数据
 */
function handleNodeTemplates(templates) {
    nodeTemplates = templates;
    renderNodePalette();
}

/**
 * 渲染节点面板
 */
function renderNodePalette() {
    const filter = document.getElementById('framework-filter').value;
    const filteredTemplates = filter ? 
        nodeTemplates.filter(t => t.metadata.framework === filter || t.metadata.framework === 'common') :
        nodeTemplates;

    nodePalette.innerHTML = '';

    // 按类别分组
    const categories = {};
    filteredTemplates.forEach(template => {
        const category = template.metadata.category;
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(template);
    });

    // 渲染每个类别
    Object.entries(categories).forEach(([category, templates]) => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'node-category';
        
        const headerElement = document.createElement('div');
        headerElement.className = 'category-header';
        headerElement.textContent = category;
        categoryElement.appendChild(headerElement);

        const nodesElement = document.createElement('div');
        nodesElement.className = 'category-nodes';

        templates.forEach(template => {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'node-template';
            nodeElement.draggable = true;
            nodeElement.dataset.templateId = template.id;
            
            nodeElement.innerHTML = `
                <div class="node-template-icon" style="color: ${template.metadata.color || '#666'}">
                    ${getNodeIcon(template.metadata.icon)}
                </div>
                <div class="node-template-label">${template.metadata.label}</div>
                <div class="node-template-description">${template.metadata.description}</div>
            `;

            nodeElement.addEventListener('dragstart', onNodeTemplateDragStart);
            nodesElement.appendChild(nodeElement);
        });

        categoryElement.appendChild(nodesElement);
        nodePalette.appendChild(categoryElement);
    });
}

/**
 * 获取节点图标
 */
function getNodeIcon(iconName) {
    const iconMap = {
        'symbol-class': '🏗️',
        'symbol-function': '🔧',
        'symbol-boolean': '❓',
        'symbol-variable': '📦'
    };
    return iconMap[iconName] || '⚙️';
}

/**
 * 过滤节点模板
 */
function filterNodeTemplates() {
    renderNodePalette();
}

/**
 * 节点模板拖拽开始
 */
function onNodeTemplateDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.closest('.node-template').dataset.templateId);
}

/**
 * 画布鼠标按下
 */
function onCanvasMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - viewportTransform.x) / viewportTransform.scale;
    const y = (event.clientY - rect.top - viewportTransform.y) / viewportTransform.scale;

    const element = event.target;
    
    if (element.classList.contains('node')) {
        selectedNode = element.dataset.nodeId;
        showNodeProperties(selectedNode);
        
        if (event.shiftKey) {
            // 开始连接
            startConnection(element, x, y);
        } else {
            // 开始拖拽节点
            isDragging = true;
            dragStartPos = { x: x - parseFloat(element.dataset.x || 0), y: y - parseFloat(element.dataset.y || 0) };
        }
    } else if (element.classList.contains('connection')) {
        selectedConnection = element.dataset.connectionId;
        showConnectionProperties(selectedConnection);
    } else {
        // 点击空白区域，取消选择
        clearSelection();
    }

    event.preventDefault();
}

/**
 * 画布鼠标移动
 */
function onCanvasMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - viewportTransform.x) / viewportTransform.scale;
    const y = (event.clientY - rect.top - viewportTransform.y) / viewportTransform.scale;

    if (isDragging && selectedNode) {
        // 拖拽节点
        moveNode(selectedNode, x - dragStartPos.x, y - dragStartPos.y);
    } else if (isConnecting) {
        // 绘制临时连接线
        updateTempConnection(x, y);
    }
}

/**
 * 画布鼠标抬起
 */
function onCanvasMouseUp(event) {
    if (isConnecting) {
        const element = event.target;
        if (element.classList.contains('node') && element.dataset.nodeId !== connectionStart.nodeId) {
            // 尝试创建连接
            createConnection(
                connectionStart.nodeId, 
                connectionStart.portId, 
                element.dataset.nodeId, 
                'input-0' // 临时，实际应该检测端口
            );
        }
        endConnection();
    }

    isDragging = false;
    isConnecting = false;
}

/**
 * 画布滚轮缩放
 */
function onCanvasWheel(event) {
    if (event.ctrlKey) {
        event.preventDefault();
        const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;
        zoomCanvas(scaleFactor, event.clientX, event.clientY);
    }
}

/**
 * 画布双击
 */
function onCanvasDoubleClick(event) {
    // 允许拖放添加节点
    canvas.addEventListener('dragover', onCanvasDragOver);
    canvas.addEventListener('drop', onCanvasDrop);
}

/**
 * 画布拖拽悬停
 */
function onCanvasDragOver(event) {
    event.preventDefault();
}

/**
 * 画布拖放
 */
function onCanvasDrop(event) {
    event.preventDefault();
    
    const templateId = event.dataTransfer.getData('text/plain');
    if (templateId) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - viewportTransform.x) / viewportTransform.scale;
        const y = (event.clientY - rect.top - viewportTransform.y) / viewportTransform.scale;
        
        addNode(templateId, { x, y });
    }
}

/**
 * 键盘事件处理
 */
function onKeyDown(event) {
    switch (event.key) {
        case 'Delete':
            if (selectedNode) {
                deleteNode(selectedNode);
            } else if (selectedConnection) {
                deleteConnection(selectedConnection);
            }
            break;
        case 'Escape':
            clearSelection();
            if (isConnecting) {
                endConnection();
            }
            break;
        case 's':
            if (event.ctrlKey) {
                event.preventDefault();
                saveGraph();
            }
            break;
        case 'o':
            if (event.ctrlKey) {
                event.preventDefault();
                loadGraph();
            }
            break;
    }
}

/**
 * 显示新建图表对话框
 */
function showNewGraphDialog() {
    showDialog('创建新蓝图', `
        <div class="form-group">
            <label for="graph-name-input">蓝图名称:</label>
            <input type="text" id="graph-name-input" placeholder="输入蓝图名称" />
        </div>
        <div class="form-group">
            <label for="framework-select">框架类型:</label>
            <select id="framework-select">
                <option value="mixed">混合</option>
                <option value="react">React</option>
                <option value="rust">Rust</option>
            </select>
        </div>
    `, () => {
        const name = document.getElementById('graph-name-input').value.trim();
        const framework = document.getElementById('framework-select').value;
        
        if (!name) {
            showError('请输入蓝图名称');
            return false;
        }
        
        createNewGraph(name, framework);
        return true;
    });
}

/**
 * 创建新图表
 */
function createNewGraph(name, framework) {
    vscode.postMessage({
        command: 'createNewGraph',
        data: { name, framework }
    });
}

/**
 * 处理图表创建
 */
function handleGraphCreated(graph) {
    currentGraph = graph;
    document.getElementById('graph-name').textContent = graph.name;
    clearCanvas();
    updateStatusBar();
}

/**
 * 添加节点
 */
function addNode(templateId, position) {
    vscode.postMessage({
        command: 'addNode',
        data: { templateId, position }
    });
}

/**
 * 处理节点添加
 */
function handleNodeAdded(node) {
    if (currentGraph) {
        currentGraph.nodes.push(node);
        renderNode(node);
        updateStatusBar();
    }
}

/**
 * 渲染节点
 */
function renderNode(node) {
    const nodeElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeElement.classList.add('node');
    nodeElement.dataset.nodeId = node.id;
    nodeElement.dataset.x = node.position.x;
    nodeElement.dataset.y = node.position.y;

    // 节点背景
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', node.size.width);
    rect.setAttribute('height', node.size.height);
    rect.setAttribute('rx', '8');
    rect.setAttribute('fill', node.metadata.color || '#444');
    rect.setAttribute('stroke', '#666');
    rect.setAttribute('stroke-width', '2');

    // 节点标题
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', node.size.width / 2);
    title.setAttribute('y', '20');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', 'white');
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', 'bold');
    title.textContent = node.metadata.label;

    // 节点描述
    const description = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    description.setAttribute('x', node.size.width / 2);
    description.setAttribute('y', '40');
    description.setAttribute('text-anchor', 'middle');
    description.setAttribute('fill', '#ccc');
    description.setAttribute('font-size', '10');
    description.textContent = node.metadata.description;

    nodeElement.appendChild(rect);
    nodeElement.appendChild(title);
    nodeElement.appendChild(description);

    // 输入端口
    node.inputs.forEach((input, index) => {
        const port = createPort(input, 'input', index, node.size.height);
        nodeElement.appendChild(port);
    });

    // 输出端口
    node.outputs.forEach((output, index) => {
        const port = createPort(output, 'output', index, node.size.height, node.size.width);
        nodeElement.appendChild(port);
    });

    // 设置位置
    nodeElement.setAttribute('transform', `translate(${node.position.x}, ${node.position.y})`);

    nodesLayer.appendChild(nodeElement);
}

/**
 * 创建端口
 */
function createPort(port, type, index, nodeHeight, nodeWidth = 0) {
    const portGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    portGroup.classList.add('port');
    portGroup.dataset.portId = port.id;
    portGroup.dataset.portType = type;

    const y = 60 + index * 20;
    const x = type === 'input' ? -8 : nodeWidth + 8;

    // 端口圆点
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', getDataTypeColor(port.dataType));
    circle.setAttribute('stroke', '#333');
    circle.setAttribute('stroke-width', '2');

    // 端口标签
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', type === 'input' ? x + 15 : x - 15);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', type === 'input' ? 'start' : 'end');
    label.setAttribute('fill', 'white');
    label.setAttribute('font-size', '10');
    label.textContent = port.name;

    portGroup.appendChild(circle);
    portGroup.appendChild(label);

    return portGroup;
}

/**
 * 获取数据类型颜色
 */
function getDataTypeColor(dataType) {
    const colorMap = {
        'string': '#90EE90',
        'number': '#87CEEB',
        'boolean': '#FFB6C1',
        'object': '#DDA0DD',
        'array': '#F0E68C',
        'function': '#FFA07A',
        'component': '#98FB98',
        'event': '#FFD700',
        'any': '#D3D3D3'
    };
    return colorMap[dataType] || '#D3D3D3';
}

/**
 * 移动节点
 */
function moveNode(nodeId, x, y) {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeElement) {
        nodeElement.setAttribute('transform', `translate(${x}, ${y})`);
        nodeElement.dataset.x = x;
        nodeElement.dataset.y = y;
        
        // 更新图表数据
        if (currentGraph) {
            const node = currentGraph.nodes.find(n => n.id === nodeId);
            if (node) {
                node.position.x = x;
                node.position.y = y;
            }
        }
        
        // 更新相关连接
        updateNodeConnections(nodeId);
    }
}

/**
 * 开始连接
 */
function startConnection(nodeElement, x, y) {
    isConnecting = true;
    connectionStart = {
        nodeId: nodeElement.dataset.nodeId,
        portId: 'output-0', // 临时，实际应该检测端口
        x, y
    };
    
    // 创建临时连接线
    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.id = 'temp-connection';
    tempLine.setAttribute('x1', x);
    tempLine.setAttribute('y1', y);
    tempLine.setAttribute('x2', x);
    tempLine.setAttribute('y2', y);
    tempLine.setAttribute('stroke', '#fff');
    tempLine.setAttribute('stroke-width', '2');
    tempLine.setAttribute('stroke-dasharray', '5,5');
    
    tempConnectionLayer.appendChild(tempLine);
}

/**
 * 更新临时连接线
 */
function updateTempConnection(x, y) {
    const tempLine = document.getElementById('temp-connection');
    if (tempLine) {
        tempLine.setAttribute('x2', x);
        tempLine.setAttribute('y2', y);
    }
}

/**
 * 结束连接
 */
function endConnection() {
    isConnecting = false;
    connectionStart = null;
    
    const tempLine = document.getElementById('temp-connection');
    if (tempLine) {
        tempLine.remove();
    }
}

/**
 * 创建连接
 */
function createConnection(sourceNodeId, sourcePortId, targetNodeId, targetPortId) {
    vscode.postMessage({
        command: 'createConnection',
        data: { sourceNodeId, sourcePortId, targetNodeId, targetPortId }
    });
}

/**
 * 处理连接创建
 */
function handleConnectionCreated(connection) {
    if (currentGraph) {
        currentGraph.connections.push(connection);
        renderConnection(connection);
        updateStatusBar();
    }
}

/**
 * 渲染连接
 */
function renderConnection(connection) {
    const sourceNode = document.querySelector(`[data-node-id="${connection.sourceNodeId}"]`);
    const targetNode = document.querySelector(`[data-node-id="${connection.targetNodeId}"]`);
    
    if (!sourceNode || !targetNode) return;

    const sourcePos = getNodePosition(sourceNode);
    const targetPos = getNodePosition(targetNode);
    
    // 简化：连接节点中心点
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('connection');
    line.dataset.connectionId = connection.id;
    line.setAttribute('x1', sourcePos.x + 100); // 节点宽度的一半
    line.setAttribute('y1', sourcePos.y + 50);  // 节点高度的一半
    line.setAttribute('x2', targetPos.x + 100);
    line.setAttribute('y2', targetPos.y + 50);
    line.setAttribute('stroke', getDataTypeColor(connection.dataType));
    line.setAttribute('stroke-width', '3');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    
    connectionsLayer.appendChild(line);
}

/**
 * 获取节点位置
 */
function getNodePosition(nodeElement) {
    return {
        x: parseFloat(nodeElement.dataset.x || 0),
        y: parseFloat(nodeElement.dataset.y || 0)
    };
}

/**
 * 更新节点连接
 */
function updateNodeConnections(nodeId) {
    if (!currentGraph) return;
    
    currentGraph.connections.forEach(conn => {
        if (conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId) {
            const connElement = document.querySelector(`[data-connection-id="${conn.id}"]`);
            if (connElement) {
                const sourceNode = document.querySelector(`[data-node-id="${conn.sourceNodeId}"]`);
                const targetNode = document.querySelector(`[data-node-id="${conn.targetNodeId}"]`);
                
                if (sourceNode && targetNode) {
                    const sourcePos = getNodePosition(sourceNode);
                    const targetPos = getNodePosition(targetNode);
                    
                    connElement.setAttribute('x1', sourcePos.x + 100);
                    connElement.setAttribute('y1', sourcePos.y + 50);
                    connElement.setAttribute('x2', targetPos.x + 100);
                    connElement.setAttribute('y2', targetPos.y + 50);
                }
            }
        }
    });
}

/**
 * 删除节点
 */
function deleteNode(nodeId) {
    vscode.postMessage({
        command: 'deleteNode',
        data: { nodeId }
    });
}

/**
 * 处理节点删除
 */
function handleNodeDeleted(data) {
    const nodeElement = document.querySelector(`[data-node-id="${data.nodeId}"]`);
    if (nodeElement) {
        nodeElement.remove();
    }
    
    if (currentGraph) {
        currentGraph.nodes = currentGraph.nodes.filter(n => n.id !== data.nodeId);
        currentGraph.connections = currentGraph.connections.filter(c => 
            c.sourceNodeId !== data.nodeId && c.targetNodeId !== data.nodeId
        );
        
        // 移除相关连接的视觉元素
        document.querySelectorAll('.connection').forEach(conn => {
            const connId = conn.dataset.connectionId;
            const connection = currentGraph.connections.find(c => c.id === connId);
            if (!connection) {
                conn.remove();
            }
        });
    }
    
    clearSelection();
    updateStatusBar();
}

/**
 * 删除连接
 */
function deleteConnection(connectionId) {
    vscode.postMessage({
        command: 'deleteConnection',
        data: { connectionId }
    });
}

/**
 * 处理连接删除
 */
function handleConnectionDeleted(data) {
    const connElement = document.querySelector(`[data-connection-id="${data.connectionId}"]`);
    if (connElement) {
        connElement.remove();
    }
    
    if (currentGraph) {
        currentGraph.connections = currentGraph.connections.filter(c => c.id !== data.connectionId);
    }
    
    clearSelection();
    updateStatusBar();
}

/**
 * 显示节点属性
 */
function showNodeProperties(nodeId) {
    if (!currentGraph) return;
    
    const node = currentGraph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    let html = `<h4>${node.metadata.label}</h4>`;
    html += `<p class="description">${node.metadata.description}</p>`;
    html += '<div class="properties-form">';
    
    Object.entries(node.properties).forEach(([key, value]) => {
        html += `
            <div class="form-group">
                <label for="prop-${key}">${key}:</label>
                <input type="text" id="prop-${key}" value="${value}" data-property="${key}" />
            </div>
        `;
    });
    
    html += '</div>';
    propertiesContent.innerHTML = html;
    
    // 绑定属性更新事件
    propertiesContent.querySelectorAll('input[data-property]').forEach(input => {
        input.addEventListener('change', (e) => {
            updateNodeProperty(nodeId, e.target.dataset.property, e.target.value);
        });
    });
}

/**
 * 更新节点属性
 */
function updateNodeProperty(nodeId, property, value) {
    vscode.postMessage({
        command: 'updateNodeProperties',
        data: { nodeId, properties: { [property]: value } }
    });
    
    // 更新本地数据
    if (currentGraph) {
        const node = currentGraph.nodes.find(n => n.id === nodeId);
        if (node) {
            node.properties[property] = value;
        }
    }
}

/**
 * 显示连接属性
 */
function showConnectionProperties(connectionId) {
    if (!currentGraph) return;
    
    const connection = currentGraph.connections.find(c => c.id === connectionId);
    if (!connection) return;
    
    const sourceNode = currentGraph.nodes.find(n => n.id === connection.sourceNodeId);
    const targetNode = currentGraph.nodes.find(n => n.id === connection.targetNodeId);
    
    let html = '<h4>连接属性</h4>';
    html += `<p><strong>源节点:</strong> ${sourceNode?.metadata.label || 'Unknown'}</p>`;
    html += `<p><strong>目标节点:</strong> ${targetNode?.metadata.label || 'Unknown'}</p>`;
    html += `<p><strong>数据类型:</strong> ${connection.dataType}</p>`;
    html += `<p><strong>数据流:</strong> ${connection.metadata.dataFlow}</p>`;
    
    propertiesContent.innerHTML = html;
}

/**
 * 清除选择
 */
function clearSelection() {
    selectedNode = null;
    selectedConnection = null;
    
    // 移除选择样式
    document.querySelectorAll('.node.selected, .connection.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    propertiesContent.innerHTML = '<p class="no-selection">请选择一个节点或连接</p>';
}

/**
 * 保存图表
 */
function saveGraph() {
    vscode.postMessage({
        command: 'saveGraph',
        data: {}
    });
}

/**
 * 加载图表
 */
function loadGraph() {
    vscode.postMessage({
        command: 'loadGraph',
        data: {}
    });
}

/**
 * 处理图表加载
 */
function handleGraphLoaded(graph) {
    currentGraph = graph;
    document.getElementById('graph-name').textContent = graph.name;
    clearCanvas();
    
    // 渲染节点和连接
    graph.nodes.forEach(node => renderNode(node));
    graph.connections.forEach(connection => renderConnection(connection));
    
    updateStatusBar();
}

/**
 * 验证图表
 */
function validateGraph() {
    vscode.postMessage({
        command: 'validateGraph',
        data: {}
    });
}

/**
 * 处理验证结果
 */
function handleValidationResult(result) {
    const statusElement = document.getElementById('validation-status');
    
    if (result.isValid) {
        statusElement.textContent = '验证通过';
        statusElement.className = 'status-success';
    } else {
        statusElement.textContent = `验证失败 (${result.errors?.length || 0} 个错误)`;
        statusElement.className = 'status-error';
        
        if (result.errors) {
            showError('验证错误:\\n' + result.errors.join('\\n'));
        }
    }
}

/**
 * 生成代码
 */
function generateCode(language) {
    vscode.postMessage({
        command: 'generateCode',
        data: { language }
    });
}

/**
 * 处理代码生成
 */
function handleCodeGenerated(data) {
    showDialog(`生成的${data.language === 'react' ? 'React' : 'Rust'}代码`, `
        <pre><code>${escapeHtml(data.code)}</code></pre>
        <button id="copy-code-btn" class="btn">复制代码</button>
    `, null);
    
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(data.code);
        showSuccess('代码已复制到剪贴板');
    });
}

/**
 * 缩放画布
 */
function zoomCanvas(scaleFactor, centerX, centerY) {
    const rect = canvas.getBoundingClientRect();
    const cx = centerX || rect.width / 2;
    const cy = centerY || rect.height / 2;
    
    const oldScale = viewportTransform.scale;
    viewportTransform.scale = Math.max(0.1, Math.min(3.0, oldScale * scaleFactor));
    
    // 调整平移以保持中心点不变
    const scaleChange = viewportTransform.scale / oldScale;
    viewportTransform.x = cx - (cx - viewportTransform.x) * scaleChange;
    viewportTransform.y = cy - (cy - viewportTransform.y) * scaleChange;
    
    updateCanvasTransform();
    updateZoomLevel();
}

/**
 * 适应屏幕
 */
function fitToScreen() {
    if (!currentGraph || currentGraph.nodes.length === 0) return;
    
    // 计算所有节点的边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    currentGraph.nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + node.size.width);
        maxY = Math.max(maxY, node.position.y + node.size.height);
    });
    
    const rect = canvas.getBoundingClientRect();
    const padding = 50;
    
    const scaleX = (rect.width - padding * 2) / (maxX - minX);
    const scaleY = (rect.height - padding * 2) / (maxY - minY);
    
    viewportTransform.scale = Math.min(scaleX, scaleY, 1.0);
    viewportTransform.x = (rect.width - (maxX - minX) * viewportTransform.scale) / 2 - minX * viewportTransform.scale;
    viewportTransform.y = (rect.height - (maxY - minY) * viewportTransform.scale) / 2 - minY * viewportTransform.scale;
    
    updateCanvasTransform();
    updateZoomLevel();
}

/**
 * 更新画布变换
 */
function updateCanvasTransform() {
    const transform = `translate(${viewportTransform.x}, ${viewportTransform.y}) scale(${viewportTransform.scale})`;
    nodesLayer.setAttribute('transform', transform);
    connectionsLayer.setAttribute('transform', transform);
}

/**
 * 更新缩放级别显示
 */
function updateZoomLevel() {
    document.getElementById('zoom-level').textContent = `${Math.round(viewportTransform.scale * 100)}%`;
}

/**
 * 调整画布大小
 */
function resizeCanvas() {
    const container = document.querySelector('.canvas-wrapper');
    const rect = container.getBoundingClientRect();
    canvas.setAttribute('width', rect.width);
    canvas.setAttribute('height', rect.height);
}

/**
 * 清空画布
 */
function clearCanvas() {
    nodesLayer.innerHTML = '';
    connectionsLayer.innerHTML = '';
    tempConnectionLayer.innerHTML = '';
}

/**
 * 更新状态栏
 */
function updateStatusBar() {
    if (currentGraph) {
        document.getElementById('node-count').textContent = `节点: ${currentGraph.nodes.length}`;
        document.getElementById('connection-count').textContent = `连接: ${currentGraph.connections.length}`;
    }
}

/**
 * 显示对话框
 */
function showDialog(title, content, onConfirm) {
    const overlay = document.getElementById('dialog-overlay');
    const titleEl = document.getElementById('dialog-title');
    const contentEl = document.getElementById('dialog-content');
    const confirmBtn = document.getElementById('dialog-confirm');
    const cancelBtn = document.getElementById('dialog-cancel');
    const closeBtn = document.getElementById('dialog-close');
    
    titleEl.textContent = title;
    contentEl.innerHTML = content;
    overlay.style.display = 'flex';
    
    const closeDialog = () => {
        overlay.style.display = 'none';
    };
    
    const handleConfirm = () => {
        if (!onConfirm || onConfirm()) {
            closeDialog();
        }
    };
    
    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = closeDialog;
    closeBtn.onclick = closeDialog;
    
    // 隐藏确认按钮如果没有确认回调
    confirmBtn.style.display = onConfirm ? 'inline-block' : 'none';
}

/**
 * 显示错误消息
 */
function showError(message) {
    // 简单实现，实际可以用更好的通知系统
    alert('错误: ' + message);
}

/**
 * 显示成功消息
 */
function showSuccess(message) {
    // 简单实现，实际可以用更好的通知系统
    alert('成功: ' + message);
}

/**
 * HTML转义
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
