// 🎪 交互体验优化系统
import * as vscode from 'vscode';

export interface InteractionSettings {
    enableGridSnap: boolean;
    gridSize: number;
    enableSmartAlign: boolean;
    animationSpeed: 'fast' | 'normal' | 'slow';
    theme: 'dark' | 'light' | 'auto';
    shortcuts: Record<string, string>;
}

export interface DragState {
    isDragging: boolean;
    startPosition: { x: number; y: number };
    currentElement: HTMLElement | null;
    ghostElement: HTMLElement | null;
    snapTargets: HTMLElement[];
}

export class InteractionOptimizer {
    private settings: InteractionSettings;
    private dragState: DragState;
    private keyboardShortcuts: Map<string, () => void> = new Map();
    
    constructor(private context: vscode.ExtensionContext) {
        this.settings = this.loadSettings();
        this.dragState = {
            isDragging: false,
            startPosition: { x: 0, y: 0 },
            currentElement: null,
            ghostElement: null,
            snapTargets: []
        };
        
        this.initializeKeyboardShortcuts();
    }
    
    // ⚙️ 加载设置
    private loadSettings(): InteractionSettings {
        const config = vscode.workspace.getConfiguration('visualProgramming');
        
        return {
            enableGridSnap: config.get('interaction.gridSnap', true),
            gridSize: config.get('interaction.gridSize', 20),
            enableSmartAlign: config.get('interaction.smartAlign', true),
            animationSpeed: config.get('interaction.animationSpeed', 'normal'),
            theme: config.get('interaction.theme', 'auto'),
            shortcuts: config.get('interaction.shortcuts', {
                'ctrl+shift+v': 'openVisualView',
                'ctrl+shift+b': 'openBlueprintEditor',
                'ctrl+shift+g': 'generateCode',
                'ctrl+shift+a': 'aiAnalysis'
            })
        };
    }
    
    // ⌨️ 初始化快捷键
    private initializeKeyboardShortcuts(): void {
        Object.entries(this.settings.shortcuts).forEach(([key, command]) => {
            this.keyboardShortcuts.set(key, () => {
                vscode.commands.executeCommand(`visualProgramming.${command}`);
            });
        });
    }
    
    // 🖱️ 增强拖拽系统
    public enhanceDragDrop(webview: vscode.Webview): void {
        const enhancedDragScript = `
            (function() {
                let gridSize = ${this.settings.gridSize};
                let enableGridSnap = ${this.settings.enableGridSnap};
                let enableSmartAlign = ${this.settings.enableSmartAlign};
                
                // 🎯 网格吸附
                function snapToGrid(x, y) {
                    if (!enableGridSnap) return { x, y };
                    
                    return {
                        x: Math.round(x / gridSize) * gridSize,
                        y: Math.round(y / gridSize) * gridSize
                    };
                }
                
                // 🎯 智能对齐
                function findAlignmentTargets(element, allElements) {
                    if (!enableSmartAlign) return { x: null, y: null };
                    
                    const rect = element.getBoundingClientRect();
                    const alignThreshold = 10;
                    let xAlign = null;
                    let yAlign = null;
                    
                    allElements.forEach(target => {
                        if (target === element) return;
                        
                        const targetRect = target.getBoundingClientRect();
                        
                        // 水平对齐检测
                        if (Math.abs(rect.left - targetRect.left) < alignThreshold) {
                            xAlign = targetRect.left;
                        } else if (Math.abs(rect.right - targetRect.right) < alignThreshold) {
                            xAlign = targetRect.right - rect.width;
                        } else if (Math.abs(rect.left - targetRect.right) < alignThreshold) {
                            xAlign = targetRect.right;
                        }
                        
                        // 垂直对齐检测
                        if (Math.abs(rect.top - targetRect.top) < alignThreshold) {
                            yAlign = targetRect.top;
                        } else if (Math.abs(rect.bottom - targetRect.bottom) < alignThreshold) {
                            yAlign = targetRect.bottom - rect.height;
                        } else if (Math.abs(rect.top - targetRect.bottom) < alignThreshold) {
                            yAlign = targetRect.bottom;
                        }
                    });
                    
                    return { x: xAlign, y: yAlign };
                }
                
                // 🎨 创建对齐线
                function showAlignmentLines(xAlign, yAlign) {
                    removeAlignmentLines();
                    
                    if (xAlign !== null) {
                        const xLine = document.createElement('div');
                        xLine.className = 'alignment-line vertical';
                        xLine.style.cssText = \`
                            position: fixed;
                            left: \${xAlign}px;
                            top: 0;
                            width: 1px;
                            height: 100vh;
                            background: #00ff00;
                            z-index: 10000;
                            pointer-events: none;
                        \`;
                        document.body.appendChild(xLine);
                    }
                    
                    if (yAlign !== null) {
                        const yLine = document.createElement('div');
                        yLine.className = 'alignment-line horizontal';
                        yLine.style.cssText = \`
                            position: fixed;
                            left: 0;
                            top: \${yAlign}px;
                            width: 100vw;
                            height: 1px;
                            background: #00ff00;
                            z-index: 10000;
                            pointer-events: none;
                        \`;
                        document.body.appendChild(yLine);
                    }
                }
                
                // 🧹 清除对齐线
                function removeAlignmentLines() {
                    document.querySelectorAll('.alignment-line').forEach(line => line.remove());
                }
                
                // 🖱️ 增强拖拽事件
                document.addEventListener('mousedown', function(e) {
                    const draggable = e.target.closest('.draggable, .blueprint-node, .node');
                    if (!draggable) return;
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startLeft = parseInt(draggable.style.left || '0');
                    const startTop = parseInt(draggable.style.top || '0');
                    
                    // 创建拖拽幽灵元素
                    const ghost = draggable.cloneNode(true);
                    ghost.style.opacity = '0.5';
                    ghost.style.zIndex = '9999';
                    ghost.style.pointerEvents = 'none';
                    
                    function onMouseMove(e) {
                        const deltaX = e.clientX - startX;
                        const deltaY = e.clientY - startY;
                        
                        let newX = startLeft + deltaX;
                        let newY = startTop + deltaY;
                        
                        // 应用网格吸附
                        const snapped = snapToGrid(newX, newY);
                        newX = snapped.x;
                        newY = snapped.y;
                        
                        // 检测智能对齐
                        const allDraggables = Array.from(document.querySelectorAll('.draggable, .blueprint-node, .node'));
                        const alignment = findAlignmentTargets(draggable, allDraggables);
                        
                        if (alignment.x !== null) newX = alignment.x;
                        if (alignment.y !== null) newY = alignment.y;
                        
                        // 显示对齐线
                        showAlignmentLines(alignment.x, alignment.y);
                        
                        // 更新位置
                        draggable.style.left = newX + 'px';
                        draggable.style.top = newY + 'px';
                        
                        // 添加拖拽样式
                        draggable.classList.add('dragging');
                    }
                    
                    function onMouseUp(e) {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        
                        removeAlignmentLines();
                        draggable.classList.remove('dragging');
                        
                        // 通知VSCode位置更新
                        const vscode = acquireVsCodeApi();
                        vscode.postMessage({
                            command: 'nodePositionChanged',
                            nodeId: draggable.id,
                            position: {
                                x: parseInt(draggable.style.left),
                                y: parseInt(draggable.style.top)
                            }
                        });
                    }
                    
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                    
                    e.preventDefault();
                });
                
                // ⌨️ 快捷键支持
                document.addEventListener('keydown', function(e) {
                    const key = [];
                    if (e.ctrlKey) key.push('ctrl');
                    if (e.shiftKey) key.push('shift');
                    if (e.altKey) key.push('alt');
                    key.push(e.key.toLowerCase());
                    
                    const keyCombo = key.join('+');
                    
                    switch(keyCombo) {
                        case 'ctrl+z':
                            // 撤销操作
                            e.preventDefault();
                            acquireVsCodeApi().postMessage({ command: 'undo' });
                            break;
                        case 'ctrl+y':
                            // 重做操作
                            e.preventDefault();
                            acquireVsCodeApi().postMessage({ command: 'redo' });
                            break;
                        case 'delete':
                            // 删除选中节点
                            const selected = document.querySelector('.selected');
                            if (selected) {
                                e.preventDefault();
                                acquireVsCodeApi().postMessage({ 
                                    command: 'deleteNode', 
                                    nodeId: selected.id 
                                });
                            }
                            break;
                        case 'ctrl+a':
                            // 全选
                            e.preventDefault();
                            document.querySelectorAll('.draggable, .blueprint-node, .node')
                                .forEach(node => node.classList.add('selected'));
                            break;
                    }
                });
                
                // 🎨 添加CSS样式
                const style = document.createElement('style');
                style.textContent = \`
                    .dragging {
                        transform: scale(1.05);
                        box-shadow: 0 8px 16px rgba(0,0,0,0.3) !important;
                        z-index: 1000;
                        transition: none !important;
                    }
                    
                    .selected {
                        outline: 2px solid #007ACC !important;
                        outline-offset: 2px;
                    }
                    
                    .alignment-line {
                        animation: fadeIn 0.2s ease-in-out;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    .grid-background {
                        background-image: 
                            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
                        background-size: \${gridSize}px \${gridSize}px;
                    }
                \`;
                document.head.appendChild(style);
                
                // 应用网格背景
                if (enableGridSnap) {
                    document.body.classList.add('grid-background');
                }
            })();
        `;
        
        webview.postMessage({
            command: 'enhanceDragDrop',
            script: enhancedDragScript
        });
    }
    
    // 🎨 主题切换
    public applyTheme(webview: vscode.Webview): void {
        const theme = this.settings.theme === 'auto' ? 
            (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 'light') :
            this.settings.theme;
        
        const themeStyles = theme === 'dark' ? `
            :root {
                --bg-primary: #1e1e1e;
                --bg-secondary: #252526;
                --text-primary: #cccccc;
                --text-secondary: #969696;
                --accent: #007ACC;
                --border: #3c3c3c;
                --node-bg: linear-gradient(135deg, #2d2d30, #3e3e42);
                --node-border: #454545;
            }
        ` : `
            :root {
                --bg-primary: #ffffff;
                --bg-secondary: #f8f8f8;
                --text-primary: #333333;
                --text-secondary: #666666;
                --accent: #0078d4;
                --border: #e1e1e1;
                --node-bg: linear-gradient(135deg, #ffffff, #f0f0f0);
                --node-border: #d1d1d1;
            }
        `;
        
        webview.postMessage({
            command: 'applyTheme',
            styles: themeStyles
        });
    }
    
    // 📊 性能监控
    public enablePerformanceMonitoring(webview: vscode.Webview): void {
        const performanceScript = `
            (function() {
                let frameCount = 0;
                let lastTime = performance.now();
                
                function measureFPS() {
                    frameCount++;
                    const currentTime = performance.now();
                    
                    if (currentTime - lastTime >= 1000) {
                        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                        
                        // 显示FPS（如果需要）
                        let fpsDisplay = document.getElementById('fps-display');
                        if (!fpsDisplay) {
                            fpsDisplay = document.createElement('div');
                            fpsDisplay.id = 'fps-display';
                            fpsDisplay.style.cssText = \`
                                position: fixed;
                                top: 10px;
                                right: 10px;
                                background: rgba(0,0,0,0.7);
                                color: white;
                                padding: 4px 8px;
                                border-radius: 4px;
                                font-size: 12px;
                                z-index: 10000;
                                display: none;
                            \`;
                            document.body.appendChild(fpsDisplay);
                        }
                        
                        fpsDisplay.textContent = \`FPS: \${fps}\`;
                        
                        // 低FPS警告
                        if (fps < 30) {
                            console.warn('Low FPS detected:', fps);
                            acquireVsCodeApi().postMessage({
                                command: 'performanceWarning',
                                fps: fps,
                                timestamp: currentTime
                            });
                        }
                        
                        frameCount = 0;
                        lastTime = currentTime;
                    }
                    
                    requestAnimationFrame(measureFPS);
                }
                
                measureFPS();
                
                // 内存使用监控
                if (performance.memory) {
                    setInterval(() => {
                        const memory = performance.memory;
                        const memoryUsage = {
                            used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                            total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                            limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
                        };
                        
                        // 内存使用率过高警告
                        if (memoryUsage.used / memoryUsage.limit > 0.8) {
                            acquireVsCodeApi().postMessage({
                                command: 'memoryWarning',
                                memory: memoryUsage
                            });
                        }
                    }, 5000);
                }
            })();
        `;
        
        webview.postMessage({
            command: 'enablePerformanceMonitoring',
            script: performanceScript
        });
    }
    
    // 💾 保存设置
    public async saveSettings(newSettings: Partial<InteractionSettings>): Promise<void> {
        const config = vscode.workspace.getConfiguration('visualProgramming');
        
        for (const [key, value] of Object.entries(newSettings)) {
            await config.update(`interaction.${key}`, value, vscode.ConfigurationTarget.Global);
        }
        
        this.settings = { ...this.settings, ...newSettings };
        
        vscode.window.showInformationMessage('✅ 交互设置已保存');
    }
    
    // 🔧 重置设置
    public async resetSettings(): Promise<void> {
        const config = vscode.workspace.getConfiguration('visualProgramming');
        
        await config.update('interaction', undefined, vscode.ConfigurationTarget.Global);
        
        this.settings = this.loadSettings();
        
        vscode.window.showInformationMessage('🔄 交互设置已重置为默认值');
    }
    
    // 📤 获取当前设置
    public getSettings(): InteractionSettings {
        return { ...this.settings };
    }
}

// 导出工厂函数
export function createInteractionOptimizer(context: vscode.ExtensionContext): InteractionOptimizer {
    return new InteractionOptimizer(context);
}
