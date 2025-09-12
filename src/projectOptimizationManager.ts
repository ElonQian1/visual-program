import * as vscode from 'vscode';

// 项目优化配置
export interface ProjectOptimizationConfig {
    react: ReactOptimizationConfig;
    rust: RustOptimizationConfig;
    general: GeneralOptimizationConfig;
}

export interface ReactOptimizationConfig {
    // 性能优化配置
    enableMemoization: boolean;
    enableLazyLoading: boolean;
    enableCodeSplitting: boolean;
    
    // 分析器配置
    deepAnalysisEnabled: boolean;
    performanceMonitoringEnabled: boolean;
    bundleAnalysisEnabled: boolean;
    
    // 代码质量检查
    hookDependencyCheck: boolean;
    renderOptimizationCheck: boolean;
    memoryLeakDetection: boolean;
    
    // 架构分析
    architecturePatternDetection: boolean;
    stateManagementAnalysis: boolean;
    componentDependencyAnalysis: boolean;
}

export interface RustOptimizationConfig {
    // 性能优化配置
    enableZeroCopyOptimizations: boolean;
    enableCompilerOptimizations: boolean;
    enableMemoryPooling: boolean;
    
    // 分析器配置
    performanceProfilingEnabled: boolean;
    memoryAnalysisEnabled: boolean;
    concurrencyAnalysisEnabled: boolean;
    
    // 安全性检查
    borrowCheckOptimization: boolean;
    lifetimeAnalysisEnabled: boolean;
    unsafeBlockDetection: boolean;
    
    // 系统分析
    systemArchitectureAnalysis: boolean;
    microservicePatternDetection: boolean;
    asyncPatternAnalysis: boolean;
}

export interface GeneralOptimizationConfig {
    // 缓存配置
    enableIntelligentCaching: boolean;
    cacheExpirationTime: number; // 分钟
    maxCacheSize: number; // MB
    
    // 性能配置
    enableLazyLoading: boolean;
    enableParallelAnalysis: boolean;
    maxWorkerThreads: number;
    
    // UI配置
    enableRealTimeUpdates: boolean;
    visualizationFrameRate: number; // FPS
    maxVisualizationNodes: number;
    
    // 调试配置
    enablePerformanceLogging: boolean;
    enableErrorReporting: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export class ProjectOptimizationManager {
    private config: ProjectOptimizationConfig;
    private configPath: string;

    constructor(workspaceRoot: string) {
        this.configPath = vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), '.vscode', 'visual-programming-config.json').fsPath;
        this.config = this.getDefaultConfig();
        this.loadConfig();
    }

    // 默认配置
    private getDefaultConfig(): ProjectOptimizationConfig {
        return {
            react: {
                enableMemoization: true,
                enableLazyLoading: true,
                enableCodeSplitting: true,
                deepAnalysisEnabled: true,
                performanceMonitoringEnabled: true,
                bundleAnalysisEnabled: false, // 资源密集型，默认关闭
                hookDependencyCheck: true,
                renderOptimizationCheck: true,
                memoryLeakDetection: true,
                architecturePatternDetection: true,
                stateManagementAnalysis: true,
                componentDependencyAnalysis: true
            },
            rust: {
                enableZeroCopyOptimizations: true,
                enableCompilerOptimizations: true,
                enableMemoryPooling: false, // 需要手动配置
                performanceProfilingEnabled: true,
                memoryAnalysisEnabled: true,
                concurrencyAnalysisEnabled: true,
                borrowCheckOptimization: true,
                lifetimeAnalysisEnabled: true,
                unsafeBlockDetection: true,
                systemArchitectureAnalysis: true,
                microservicePatternDetection: true,
                asyncPatternAnalysis: true
            },
            general: {
                enableIntelligentCaching: true,
                cacheExpirationTime: 5, // 5分钟
                maxCacheSize: 100, // 100MB
                enableLazyLoading: true,
                enableParallelAnalysis: false, // 避免资源竞争
                maxWorkerThreads: 2,
                enableRealTimeUpdates: true,
                visualizationFrameRate: 30,
                maxVisualizationNodes: 200,
                enablePerformanceLogging: false, // 减少日志开销
                enableErrorReporting: true,
                logLevel: 'warn'
            }
        };
    }

    // 加载配置
    private async loadConfig(): Promise<void> {
        try {
            const configUri = vscode.Uri.file(this.configPath);
            const configContent = await vscode.workspace.fs.readFile(configUri);
            const savedConfig = JSON.parse(configContent.toString());
            
            // 合并配置，保留默认值
            this.config = {
                ...this.config,
                ...savedConfig,
                react: { ...this.config.react, ...savedConfig.react },
                rust: { ...this.config.rust, ...savedConfig.rust },
                general: { ...this.config.general, ...savedConfig.general }
            };
        } catch (error) {
            // 配置文件不存在或无效，使用默认配置
            await this.saveConfig();
        }
    }

    // 保存配置
    private async saveConfig(): Promise<void> {
        try {
            const configUri = vscode.Uri.file(this.configPath);
            const configContent = JSON.stringify(this.config, null, 2);
            await vscode.workspace.fs.writeFile(configUri, Buffer.from(configContent));
        } catch (error) {
            console.error('Failed to save optimization config:', error);
        }
    }

    // 获取配置
    getConfig(): ProjectOptimizationConfig {
        return { ...this.config };
    }

    // 更新配置
    async updateConfig(newConfig: Partial<ProjectOptimizationConfig>): Promise<void> {
        this.config = {
            ...this.config,
            ...newConfig,
            react: { ...this.config.react, ...newConfig.react },
            rust: { ...this.config.rust, ...newConfig.rust },
            general: { ...this.config.general, ...newConfig.general }
        };
        
        await this.saveConfig();
    }

    // 基于项目特征自动优化配置
    async autoOptimizeConfig(projectAnalysis: {
        reactFileCount: number;
        rustFileCount: number;
        totalLinesOfCode: number;
        averageFileSize: number;
        hasLargeComponents: boolean;
        hasComplexState: boolean;
        hasAsyncCode: boolean;
        hasPerformanceIssues: boolean;
    }): Promise<ProjectOptimizationConfig> {
        const optimizedConfig = { ...this.config };

        // 基于项目规模调整配置
        if (projectAnalysis.totalLinesOfCode > 10000) {
            // 大型项目优化
            optimizedConfig.general.enableIntelligentCaching = true;
            optimizedConfig.general.cacheExpirationTime = 10; // 延长缓存时间
            optimizedConfig.general.maxCacheSize = 200; // 增加缓存大小
            optimizedConfig.general.enableLazyLoading = true;
        }

        if (projectAnalysis.reactFileCount > 50) {
            // React文件较多
            optimizedConfig.react.enableCodeSplitting = true;
            optimizedConfig.react.bundleAnalysisEnabled = true;
            optimizedConfig.react.componentDependencyAnalysis = true;
        }

        if (projectAnalysis.rustFileCount > 20) {
            // Rust文件较多
            optimizedConfig.rust.enableCompilerOptimizations = true;
            optimizedConfig.rust.performanceProfilingEnabled = true;
            optimizedConfig.rust.systemArchitectureAnalysis = true;
        }

        if (projectAnalysis.hasPerformanceIssues) {
            // 发现性能问题
            optimizedConfig.react.performanceMonitoringEnabled = true;
            optimizedConfig.react.memoryLeakDetection = true;
            optimizedConfig.rust.memoryAnalysisEnabled = true;
            optimizedConfig.general.enablePerformanceLogging = true;
        }

        if (projectAnalysis.hasComplexState) {
            // 复杂状态管理
            optimizedConfig.react.stateManagementAnalysis = true;
            optimizedConfig.react.architecturePatternDetection = true;
        }

        if (projectAnalysis.hasAsyncCode) {
            // 异步代码较多
            optimizedConfig.rust.asyncPatternAnalysis = true;
            optimizedConfig.rust.concurrencyAnalysisEnabled = true;
        }

        await this.updateConfig(optimizedConfig);
        return optimizedConfig;
    }

    // 生成优化建议
    generateOptimizationRecommendations(projectAnalysis: any): string[] {
        const recommendations: string[] = [];

        // React优化建议
        if (projectAnalysis.reactFileCount > 0) {
            if (!this.config.react.enableMemoization) {
                recommendations.push('💡 建议启用React组件记忆化优化');
            }
            if (!this.config.react.enableLazyLoading) {
                recommendations.push('💡 建议启用React组件懒加载');
            }
            if (projectAnalysis.hasLargeComponents && !this.config.react.enableCodeSplitting) {
                recommendations.push('💡 检测到大型组件，建议启用代码分割');
            }
        }

        // Rust优化建议
        if (projectAnalysis.rustFileCount > 0) {
            if (!this.config.rust.enableZeroCopyOptimizations) {
                recommendations.push('🦀 建议启用Rust零拷贝优化');
            }
            if (projectAnalysis.hasAsyncCode && !this.config.rust.asyncPatternAnalysis) {
                recommendations.push('🦀 检测到异步代码，建议启用异步模式分析');
            }
        }

        // 通用优化建议
        if (projectAnalysis.totalLinesOfCode > 5000 && !this.config.general.enableIntelligentCaching) {
            recommendations.push('🚀 大型项目建议启用智能缓存系统');
        }

        if (projectAnalysis.hasPerformanceIssues && !this.config.general.enablePerformanceLogging) {
            recommendations.push('📊 发现性能问题，建议启用性能日志记录');
        }

        return recommendations;
    }

    // 创建配置面板
    async showConfigurationPanel(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'visualProgrammingConfig',
            '代码可视化 - 优化配置',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: []
            }
        );

        panel.webview.html = this.getConfigurationPanelHtml();
        
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'updateConfig':
                    await this.updateConfig(message.config);
                    vscode.window.showInformationMessage('配置已更新！');
                    break;
                case 'resetConfig':
                    this.config = this.getDefaultConfig();
                    await this.saveConfig();
                    panel.webview.html = this.getConfigurationPanelHtml();
                    vscode.window.showInformationMessage('配置已重置为默认值！');
                    break;
            }
        });
    }

    // 生成配置面板HTML
    private getConfigurationPanelHtml(): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>优化配置</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                .section h3 { margin-top: 0; color: #333; }
                .config-item { margin: 10px 0; display: flex; align-items: center; }
                .config-item label { flex: 1; margin-left: 10px; }
                button { padding: 10px 20px; margin: 5px; cursor: pointer; }
                .primary { background: #007ACC; color: white; border: none; border-radius: 3px; }
                .secondary { background: #f0f0f0; color: #333; border: 1px solid #ccc; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>🚀 代码可视化优化配置</h1>
            
            <div class="section">
                <h3>⚛️ React 前端优化</h3>
                ${this.generateConfigCheckboxes(this.config.react, 'react')}
            </div>
            
            <div class="section">
                <h3>🦀 Rust 后端优化</h3>
                ${this.generateConfigCheckboxes(this.config.rust, 'rust')}
            </div>
            
            <div class="section">
                <h3>⚙️ 通用配置</h3>
                ${this.generateConfigInputs(this.config.general, 'general')}
            </div>
            
            <div>
                <button class="primary" onclick="saveConfig()">保存配置</button>
                <button class="secondary" onclick="resetConfig()">重置默认</button>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function saveConfig() {
                    const config = collectConfig();
                    vscode.postMessage({ command: 'updateConfig', config });
                }
                
                function resetConfig() {
                    vscode.postMessage({ command: 'resetConfig' });
                }
                
                function collectConfig() {
                    // 收集所有配置项的值
                    const config = { react: {}, rust: {}, general: {} };
                    
                    document.querySelectorAll('input').forEach(input => {
                        const parts = input.name.split('.');
                        if (parts.length === 2) {
                            const section = parts[0];
                            const key = parts[1];
                            
                            if (input.type === 'checkbox') {
                                config[section][key] = input.checked;
                            } else if (input.type === 'number') {
                                config[section][key] = parseInt(input.value);
                            } else {
                                config[section][key] = input.value;
                            }
                        }
                    });
                    
                    return config;
                }
            </script>
        </body>
        </html>
        `;
    }

    private generateConfigCheckboxes(config: any, section: string): string {
        return Object.entries(config)
            .filter(([key, value]) => typeof value === 'boolean')
            .map(([key, value]) => `
                <div class="config-item">
                    <input type="checkbox" id="${section}.${key}" name="${section}.${key}" ${value ? 'checked' : ''}>
                    <label for="${section}.${key}">${this.getConfigLabel(key)}</label>
                </div>
            `).join('');
    }

    private generateConfigInputs(config: any, section: string): string {
        return Object.entries(config).map(([key, value]) => {
            if (typeof value === 'boolean') {
                return `
                    <div class="config-item">
                        <input type="checkbox" id="${section}.${key}" name="${section}.${key}" ${value ? 'checked' : ''}>
                        <label for="${section}.${key}">${this.getConfigLabel(key)}</label>
                    </div>
                `;
            } else if (typeof value === 'number') {
                return `
                    <div class="config-item">
                        <label for="${section}.${key}">${this.getConfigLabel(key)}:</label>
                        <input type="number" id="${section}.${key}" name="${section}.${key}" value="${value}" style="width: 100px; margin-left: 10px;">
                    </div>
                `;
            } else {
                return `
                    <div class="config-item">
                        <label for="${section}.${key}">${this.getConfigLabel(key)}:</label>
                        <select id="${section}.${key}" name="${section}.${key}" style="margin-left: 10px;">
                            <option value="error" ${value === 'error' ? 'selected' : ''}>Error</option>
                            <option value="warn" ${value === 'warn' ? 'selected' : ''}>Warning</option>
                            <option value="info" ${value === 'info' ? 'selected' : ''}>Info</option>
                            <option value="debug" ${value === 'debug' ? 'selected' : ''}>Debug</option>
                        </select>
                    </div>
                `;
            }
        }).join('');
    }

    private getConfigLabel(key: string): string {
        const labels: Record<string, string> = {
            enableMemoization: '启用组件记忆化',
            enableLazyLoading: '启用懒加载',
            enableCodeSplitting: '启用代码分割',
            deepAnalysisEnabled: '启用深度分析',
            performanceMonitoringEnabled: '启用性能监控',
            bundleAnalysisEnabled: '启用包体积分析',
            hookDependencyCheck: '检查Hook依赖',
            renderOptimizationCheck: '检查渲染优化',
            memoryLeakDetection: '内存泄漏检测',
            architecturePatternDetection: '架构模式检测',
            stateManagementAnalysis: '状态管理分析',
            componentDependencyAnalysis: '组件依赖分析',
            enableZeroCopyOptimizations: '启用零拷贝优化',
            enableCompilerOptimizations: '启用编译器优化',
            enableMemoryPooling: '启用内存池',
            performanceProfilingEnabled: '启用性能分析',
            memoryAnalysisEnabled: '启用内存分析',
            concurrencyAnalysisEnabled: '启用并发分析',
            borrowCheckOptimization: '借用检查优化',
            lifetimeAnalysisEnabled: '启用生命周期分析',
            unsafeBlockDetection: 'Unsafe块检测',
            systemArchitectureAnalysis: '系统架构分析',
            microservicePatternDetection: '微服务模式检测',
            asyncPatternAnalysis: '异步模式分析',
            enableIntelligentCaching: '启用智能缓存',
            cacheExpirationTime: '缓存过期时间(分钟)',
            maxCacheSize: '最大缓存大小(MB)',
            enableParallelAnalysis: '启用并行分析',
            maxWorkerThreads: '最大工作线程数',
            enableRealTimeUpdates: '启用实时更新',
            visualizationFrameRate: '可视化帧率(FPS)',
            maxVisualizationNodes: '最大可视化节点数',
            enablePerformanceLogging: '启用性能日志',
            enableErrorReporting: '启用错误报告',
            logLevel: '日志级别'
        };
        
        return labels[key] || key;
    }
}

// 全局优化管理器实例
let globalOptimizationManager: ProjectOptimizationManager | null = null;

export function getOptimizationManager(workspaceRoot?: string): ProjectOptimizationManager {
    if (!globalOptimizationManager && workspaceRoot) {
        globalOptimizationManager = new ProjectOptimizationManager(workspaceRoot);
    }
    return globalOptimizationManager!;
}
