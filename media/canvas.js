// 交互式画布JavaScript功能

// VS Code API
const vscode = acquireVsCodeApi();

// 画布工具函数
window.canvasUtils = {
    // 创建唯一ID
    generateId: () => `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    
    // 计算两点距离
    distance: (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)),
    
    // 限制值在范围内
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    
    // 线性插值
    lerp: (start, end, factor) => start + (end - start) * factor,
    
    // 格式化数字
    formatNumber: (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },
    
    // 防抖函数
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 画布事件处理
window.canvasEventHandlers = {
    // 处理鼠标事件
    handleMouseEvent: (event, type) => {
        vscode.postMessage({
            command: 'mouseEvent',
            eventType: type,
            data: {
                x: event.clientX,
                y: event.clientY,
                button: event.button,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey
            }
        });
    },
    
    // 处理键盘事件
    handleKeyboardEvent: (event, type) => {
        vscode.postMessage({
            command: 'keyboardEvent',
            eventType: type,
            data: {
                key: event.key,
                code: event.code,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey
            }
        });
    },
    
    // 处理拖拽事件
    handleDragEvent: (event, type) => {
        event.preventDefault();
        vscode.postMessage({
            command: 'dragEvent',
            eventType: type,
            data: {
                x: event.clientX,
                y: event.clientY,
                dataTransfer: event.dataTransfer ? event.dataTransfer.getData('text') : null
            }
        });
    }
};

// 画布动画系统
window.canvasAnimations = {
    // 动画循环
    animationFrameId: null,
    animations: new Map(),
    
    // 开始动画
    startAnimation: (id, animation) => {
        window.canvasAnimations.animations.set(id, animation);
        if (!window.canvasAnimations.animationFrameId) {
            window.canvasAnimations.animate();
        }
    },
    
    // 停止动画
    stopAnimation: (id) => {
        window.canvasAnimations.animations.delete(id);
        if (window.canvasAnimations.animations.size === 0) {
            cancelAnimationFrame(window.canvasAnimations.animationFrameId);
            window.canvasAnimations.animationFrameId = null;
        }
    },
    
    // 动画循环
    animate: () => {
        window.canvasAnimations.animationFrameId = requestAnimationFrame(window.canvasAnimations.animate);
        
        const now = performance.now();
        window.canvasAnimations.animations.forEach((animation, id) => {
            if (animation.update) {
                const shouldContinue = animation.update(now);
                if (!shouldContinue) {
                    window.canvasAnimations.stopAnimation(id);
                }
            }
        });
    }
};

// 画布性能监控
window.canvasPerformance = {
    frameCount: 0,
    lastTime: 0,
    fps: 0,
    
    // 更新FPS
    updateFPS: () => {
        window.canvasPerformance.frameCount++;
        const now = performance.now();
        
        if (now - window.canvasPerformance.lastTime >= 1000) {
            window.canvasPerformance.fps = Math.round(
                (window.canvasPerformance.frameCount * 1000) / (now - window.canvasPerformance.lastTime)
            );
            window.canvasPerformance.frameCount = 0;
            window.canvasPerformance.lastTime = now;
            
            // 更新状态栏
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = `${window.canvasPerformance.fps} FPS`;
            }
        }
    },
    
    // 获取性能指标
    getMetrics: () => ({
        fps: window.canvasPerformance.fps,
        memory: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : null
    })
};

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('Canvas Error:', event.error);
    vscode.postMessage({
        command: 'error',
        data: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? event.error.toString() : null
        }
    });
});

// 监听未捕获的Promise rejection
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    vscode.postMessage({
        command: 'error',
        data: {
            message: 'Unhandled Promise Rejection',
            error: event.reason ? event.reason.toString() : null
        }
    });
});

// 导出全局对象
window.Canvas = {
    utils: window.canvasUtils,
    eventHandlers: window.canvasEventHandlers,
    animations: window.canvasAnimations,
    performance: window.canvasPerformance
};
