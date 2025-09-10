// 🎨 高级UI组件和主题系统
import * as vscode from 'vscode';

export interface ThemeConfig {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        border: string;
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    fonts: {
        primary: string;
        code: string;
        sizes: {
            small: string;
            medium: string;
            large: string;
            xlarge: string;
        };
    };
    shadows: {
        small: string;
        medium: string;
        large: string;
    };
    animations: {
        duration: {
            fast: string;
            medium: string;
            slow: string;
        };
        easing: string;
    };
}

export interface UIComponent {
    type: 'button' | 'input' | 'select' | 'card' | 'modal' | 'tooltip' | 'notification';
    props: Record<string, any>;
    theme?: string;
    variants?: string[];
}

export class AdvancedUISystem {
    private static instance: AdvancedUISystem;
    private currentTheme: string = 'default';
    private themes: Map<string, ThemeConfig> = new Map();
    private components: Map<string, UIComponent> = new Map();
    private customCSS: string = '';
    
    private constructor() {
        this.initializeDefaultThemes();
        this.loadUserThemes();
    }
    
    public static getInstance(): AdvancedUISystem {
        if (!AdvancedUISystem.instance) {
            AdvancedUISystem.instance = new AdvancedUISystem();
        }
        return AdvancedUISystem.instance;
    }
    
    // 🎨 初始化默认主题
    private initializeDefaultThemes(): void {
        // 默认亮色主题
        this.themes.set('default', {
            name: '默认亮色',
            colors: {
                primary: '#0066cc',
                secondary: '#6c757d',
                background: '#ffffff',
                surface: '#f8f9fa',
                text: '#212529',
                textSecondary: '#6c757d',
                border: '#dee2e6',
                success: '#28a745',
                warning: '#ffc107',
                error: '#dc3545',
                info: '#17a2b8'
            },
            fonts: {
                primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                code: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
                sizes: {
                    small: '12px',
                    medium: '14px',
                    large: '16px',
                    xlarge: '20px'
                }
            },
            shadows: {
                small: '0 1px 3px rgba(0,0,0,0.12)',
                medium: '0 4px 6px rgba(0,0,0,0.15)',
                large: '0 8px 16px rgba(0,0,0,0.15)'
            },
            animations: {
                duration: {
                    fast: '150ms',
                    medium: '300ms',
                    slow: '500ms'
                },
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
        });
        
        // 暗色主题
        this.themes.set('dark', {
            name: '暗色主题',
            colors: {
                primary: '#0ea5e9',
                secondary: '#94a3b8',
                background: '#0f172a',
                surface: '#1e293b',
                text: '#f1f5f9',
                textSecondary: '#94a3b8',
                border: '#334155',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                info: '#06b6d4'
            },
            fonts: {
                primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                code: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
                sizes: {
                    small: '12px',
                    medium: '14px',
                    large: '16px',
                    xlarge: '20px'
                }
            },
            shadows: {
                small: '0 1px 3px rgba(0,0,0,0.3)',
                medium: '0 4px 6px rgba(0,0,0,0.4)',
                large: '0 8px 16px rgba(0,0,0,0.4)'
            },
            animations: {
                duration: {
                    fast: '150ms',
                    medium: '300ms',
                    slow: '500ms'
                },
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
        });
        
        // 高对比度主题
        this.themes.set('high-contrast', {
            name: '高对比度',
            colors: {
                primary: '#ffff00',
                secondary: '#ffffff',
                background: '#000000',
                surface: '#1a1a1a',
                text: '#ffffff',
                textSecondary: '#cccccc',
                border: '#ffffff',
                success: '#00ff00',
                warning: '#ffff00',
                error: '#ff0000',
                info: '#00ffff'
            },
            fonts: {
                primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                code: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
                sizes: {
                    small: '14px',
                    medium: '16px',
                    large: '18px',
                    xlarge: '22px'
                }
            },
            shadows: {
                small: '0 2px 4px rgba(255,255,255,0.3)',
                medium: '0 4px 8px rgba(255,255,255,0.3)',
                large: '0 8px 16px rgba(255,255,255,0.3)'
            },
            animations: {
                duration: {
                    fast: '100ms',
                    medium: '200ms',
                    slow: '300ms'
                },
                easing: 'linear'
            }
        });
        
        // 护眼主题
        this.themes.set('eye-care', {
            name: '护眼主题',
            colors: {
                primary: '#8b5a3c',
                secondary: '#a0a0a0',
                background: '#f5f3f0',
                surface: '#f0ede8',
                text: '#3c3c3c',
                textSecondary: '#666666',
                border: '#d4cfc7',
                success: '#6b8e3d',
                warning: '#d4932b',
                error: '#c55353',
                info: '#5a8db3'
            },
            fonts: {
                primary: 'Georgia, "Times New Roman", serif',
                code: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
                sizes: {
                    small: '13px',
                    medium: '15px',
                    large: '17px',
                    xlarge: '21px'
                }
            },
            shadows: {
                small: '0 1px 2px rgba(139,90,60,0.15)',
                medium: '0 2px 4px rgba(139,90,60,0.2)',
                large: '0 4px 8px rgba(139,90,60,0.2)'
            },
            animations: {
                duration: {
                    fast: '200ms',
                    medium: '400ms',
                    slow: '600ms'
                },
                easing: 'ease-in-out'
            }
        });
    }
    
    // 📱 注册UI组件
    public registerComponent(id: string, component: UIComponent): void {
        this.components.set(id, component);
    }
    
    // 🎨 应用主题
    public async applyTheme(themeName: string): Promise<void> {
        const theme = this.themes.get(themeName);
        if (!theme) {
            throw new Error(`Theme "${themeName}" not found`);
        }
        
        this.currentTheme = themeName;
        await this.updateThemeCSS(theme);
        
        // 保存用户偏好
        await vscode.workspace.getConfiguration('visualProgramming').update('ui.theme', themeName, true);
        
        vscode.window.showInformationMessage(`🎨 已切换到 "${theme.name}" 主题`);
    }
    
    // 🎨 生成主题CSS
    private async updateThemeCSS(theme: ThemeConfig): Promise<void> {
        const css = `
            :root {
                /* 颜色变量 */
                --vp-color-primary: ${theme.colors.primary};
                --vp-color-secondary: ${theme.colors.secondary};
                --vp-color-background: ${theme.colors.background};
                --vp-color-surface: ${theme.colors.surface};
                --vp-color-text: ${theme.colors.text};
                --vp-color-text-secondary: ${theme.colors.textSecondary};
                --vp-color-border: ${theme.colors.border};
                --vp-color-success: ${theme.colors.success};
                --vp-color-warning: ${theme.colors.warning};
                --vp-color-error: ${theme.colors.error};
                --vp-color-info: ${theme.colors.info};
                
                /* 字体变量 */
                --vp-font-primary: ${theme.fonts.primary};
                --vp-font-code: ${theme.fonts.code};
                --vp-font-size-small: ${theme.fonts.sizes.small};
                --vp-font-size-medium: ${theme.fonts.sizes.medium};
                --vp-font-size-large: ${theme.fonts.sizes.large};
                --vp-font-size-xlarge: ${theme.fonts.sizes.xlarge};
                
                /* 阴影变量 */
                --vp-shadow-small: ${theme.shadows.small};
                --vp-shadow-medium: ${theme.shadows.medium};
                --vp-shadow-large: ${theme.shadows.large};
                
                /* 动画变量 */
                --vp-duration-fast: ${theme.animations.duration.fast};
                --vp-duration-medium: ${theme.animations.duration.medium};
                --vp-duration-slow: ${theme.animations.duration.slow};
                --vp-easing: ${theme.animations.easing};
            }
            
            /* 基础样式 */
            .vp-container {
                background-color: var(--vp-color-background);
                color: var(--vp-color-text);
                font-family: var(--vp-font-primary);
                font-size: var(--vp-font-size-medium);
                transition: background-color var(--vp-duration-medium) var(--vp-easing);
            }
            
            .vp-surface {
                background-color: var(--vp-color-surface);
                border: 1px solid var(--vp-color-border);
                border-radius: 8px;
                box-shadow: var(--vp-shadow-small);
                transition: all var(--vp-duration-medium) var(--vp-easing);
            }
            
            .vp-surface:hover {
                box-shadow: var(--vp-shadow-medium);
                transform: translateY(-2px);
            }
            
            /* 按钮组件 */
            .vp-button {
                background-color: var(--vp-color-primary);
                color: var(--vp-color-background);
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-family: var(--vp-font-primary);
                font-size: var(--vp-font-size-medium);
                font-weight: 500;
                cursor: pointer;
                transition: all var(--vp-duration-fast) var(--vp-easing);
            }
            
            .vp-button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
                box-shadow: var(--vp-shadow-medium);
            }
            
            .vp-button:active {
                transform: translateY(0);
                box-shadow: var(--vp-shadow-small);
            }
            
            .vp-button.secondary {
                background-color: var(--vp-color-secondary);
            }
            
            .vp-button.success {
                background-color: var(--vp-color-success);
            }
            
            .vp-button.warning {
                background-color: var(--vp-color-warning);
                color: var(--vp-color-text);
            }
            
            .vp-button.error {
                background-color: var(--vp-color-error);
            }
            
            /* 输入框组件 */
            .vp-input {
                background-color: var(--vp-color-surface);
                color: var(--vp-color-text);
                border: 2px solid var(--vp-color-border);
                border-radius: 6px;
                padding: 8px 12px;
                font-family: var(--vp-font-primary);
                font-size: var(--vp-font-size-medium);
                transition: all var(--vp-duration-fast) var(--vp-easing);
            }
            
            .vp-input:focus {
                outline: none;
                border-color: var(--vp-color-primary);
                box-shadow: 0 0 0 3px rgba(var(--vp-color-primary), 0.1);
            }
            
            /* 卡片组件 */
            .vp-card {
                background-color: var(--vp-color-surface);
                border: 1px solid var(--vp-color-border);
                border-radius: 12px;
                padding: 16px;
                box-shadow: var(--vp-shadow-small);
                transition: all var(--vp-duration-medium) var(--vp-easing);
            }
            
            .vp-card:hover {
                box-shadow: var(--vp-shadow-medium);
                transform: translateY(-2px);
            }
            
            .vp-card-header {
                font-size: var(--vp-font-size-large);
                font-weight: 600;
                margin-bottom: 12px;
                color: var(--vp-color-text);
            }
            
            .vp-card-content {
                color: var(--vp-color-text-secondary);
                line-height: 1.5;
            }
            
            /* 模态框组件 */
            .vp-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                animation: fadeIn var(--vp-duration-medium) var(--vp-easing);
            }
            
            .vp-modal {
                background-color: var(--vp-color-surface);
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80%;
                overflow-y: auto;
                box-shadow: var(--vp-shadow-large);
                animation: slideUp var(--vp-duration-medium) var(--vp-easing);
            }
            
            /* 通知组件 */
            .vp-notification {
                background-color: var(--vp-color-surface);
                border-left: 4px solid var(--vp-color-info);
                border-radius: 6px;
                padding: 12px 16px;
                margin: 8px 0;
                box-shadow: var(--vp-shadow-small);
                animation: slideInRight var(--vp-duration-medium) var(--vp-easing);
            }
            
            .vp-notification.success {
                border-left-color: var(--vp-color-success);
            }
            
            .vp-notification.warning {
                border-left-color: var(--vp-color-warning);
            }
            
            .vp-notification.error {
                border-left-color: var(--vp-color-error);
            }
            
            /* 工具提示 */
            .vp-tooltip {
                position: relative;
                display: inline-block;
            }
            
            .vp-tooltip-content {
                position: absolute;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--vp-color-text);
                color: var(--vp-color-background);
                padding: 6px 12px;
                border-radius: 6px;
                font-size: var(--vp-font-size-small);
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all var(--vp-duration-fast) var(--vp-easing);
                z-index: 100;
            }
            
            .vp-tooltip:hover .vp-tooltip-content {
                opacity: 1;
                visibility: visible;
            }
            
            /* 动画定义 */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            /* 响应式设计 */
            @media (max-width: 768px) {
                .vp-modal {
                    width: 95%;
                    margin: 16px;
                }
                
                .vp-card {
                    padding: 12px;
                }
                
                .vp-button {
                    padding: 10px 18px;
                    font-size: var(--vp-font-size-medium);
                }
            }
            
            /* 无障碍支持 */
            .vp-focus-visible {
                outline: 2px solid var(--vp-color-primary);
                outline-offset: 2px;
            }
            
            .vp-sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            /* 打印样式 */
            @media print {
                .vp-container {
                    background: white !important;
                    color: black !important;
                }
                
                .vp-button,
                .vp-modal-overlay {
                    display: none !important;
                }
            }
        `;
        
        this.customCSS = css;
    }
    
    // 🎨 获取当前主题
    public getCurrentTheme(): ThemeConfig | undefined {
        return this.themes.get(this.currentTheme);
    }
    
    // 🎨 获取所有主题
    public getAllThemes(): Array<{name: string, config: ThemeConfig}> {
        return Array.from(this.themes.entries()).map(([name, config]) => ({name, config}));
    }
    
    // 🎨 创建自定义主题
    public createCustomTheme(name: string, baseTheme: string, overrides: Partial<ThemeConfig>): void {
        const base = this.themes.get(baseTheme);
        if (!base) {
            throw new Error(`Base theme "${baseTheme}" not found`);
        }
        
        const customTheme: ThemeConfig = {
            ...base,
            ...overrides,
            name,
            colors: { ...base.colors, ...(overrides.colors || {}) },
            fonts: { 
                ...base.fonts, 
                ...(overrides.fonts || {}),
                sizes: { ...base.fonts.sizes, ...(overrides.fonts?.sizes || {}) }
            },
            shadows: { ...base.shadows, ...(overrides.shadows || {}) },
            animations: { 
                ...base.animations, 
                ...(overrides.animations || {}),
                duration: { ...base.animations.duration, ...(overrides.animations?.duration || {}) }
            }
        };
        
        this.themes.set(name, customTheme);
    }
    
    // 📱 生成组件HTML
    public generateComponentHTML(componentId: string, props: Record<string, any> = {}): string {
        const component = this.components.get(componentId);
        if (!component) {
            return '<div class="vp-error">组件未找到</div>';
        }
        
        const mergedProps = { ...component.props, ...props };
        
        switch (component.type) {
            case 'button':
                return this.generateButtonHTML(mergedProps);
            case 'input':
                return this.generateInputHTML(mergedProps);
            case 'card':
                return this.generateCardHTML(mergedProps);
            case 'modal':
                return this.generateModalHTML(mergedProps);
            case 'notification':
                return this.generateNotificationHTML(mergedProps);
            default:
                return '<div class="vp-component">未知组件类型</div>';
        }
    }
    
    // 🔘 生成按钮HTML
    private generateButtonHTML(props: any): string {
        const variant = props.variant || 'primary';
        const size = props.size || 'medium';
        const disabled = props.disabled ? 'disabled' : '';
        
        return `
            <button class="vp-button ${variant} ${size}" ${disabled} onclick="${props.onClick || ''}">
                ${props.icon ? `<span class="vp-icon">${props.icon}</span>` : ''}
                ${props.text || 'Button'}
            </button>
        `;
    }
    
    // 📝 生成输入框HTML
    private generateInputHTML(props: any): string {
        const type = props.type || 'text';
        const placeholder = props.placeholder || '';
        const value = props.value || '';
        
        return `
            <div class="vp-input-group">
                ${props.label ? `<label class="vp-label">${props.label}</label>` : ''}
                <input class="vp-input" type="${type}" placeholder="${placeholder}" value="${value}" />
                ${props.helper ? `<div class="vp-helper-text">${props.helper}</div>` : ''}
            </div>
        `;
    }
    
    // 🎴 生成卡片HTML
    private generateCardHTML(props: any): string {
        return `
            <div class="vp-card">
                ${props.header ? `<div class="vp-card-header">${props.header}</div>` : ''}
                <div class="vp-card-content">${props.content || ''}</div>
                ${props.actions ? `<div class="vp-card-actions">${props.actions}</div>` : ''}
            </div>
        `;
    }
    
    // 🪟 生成模态框HTML
    private generateModalHTML(props: any): string {
        return `
            <div class="vp-modal-overlay" onclick="this.style.display='none'">
                <div class="vp-modal" onclick="event.stopPropagation()">
                    ${props.header ? `<div class="vp-modal-header">${props.header}</div>` : ''}
                    <div class="vp-modal-content">${props.content || ''}</div>
                    ${props.actions ? `<div class="vp-modal-actions">${props.actions}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    // 🔔 生成通知HTML
    private generateNotificationHTML(props: any): string {
        const type = props.type || 'info';
        return `
            <div class="vp-notification ${type}">
                ${props.icon ? `<span class="vp-notification-icon">${props.icon}</span>` : ''}
                <div class="vp-notification-content">
                    ${props.title ? `<div class="vp-notification-title">${props.title}</div>` : ''}
                    <div class="vp-notification-message">${props.message || ''}</div>
                </div>
                ${props.closable ? '<button class="vp-notification-close">×</button>' : ''}
            </div>
        `;
    }
    
    // 💾 加载用户主题
    private async loadUserThemes(): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('visualProgramming');
            const customThemes = config.get<Record<string, ThemeConfig>>('ui.customThemes', {});
            
            for (const [name, theme] of Object.entries(customThemes)) {
                this.themes.set(name, theme);
            }
            
            const savedTheme = config.get<string>('ui.theme', 'default');
            if (this.themes.has(savedTheme)) {
                await this.applyTheme(savedTheme);
            }
        } catch (error) {
            console.error('Failed to load user themes:', error);
        }
    }
    
    // 💾 保存用户主题
    public async saveUserTheme(name: string): Promise<void> {
        const theme = this.themes.get(name);
        if (!theme || ['default', 'dark', 'high-contrast', 'eye-care'].includes(name)) {
            return; // 不保存内置主题
        }
        
        const config = vscode.workspace.getConfiguration('visualProgramming');
        const customThemes = config.get<Record<string, ThemeConfig>>('ui.customThemes', {});
        customThemes[name] = theme;
        
        await config.update('ui.customThemes', customThemes, true);
    }
    
    // 🗑️ 删除用户主题
    public async deleteUserTheme(name: string): Promise<void> {
        if (['default', 'dark', 'high-contrast', 'eye-care'].includes(name)) {
            throw new Error('Cannot delete built-in themes');
        }
        
        this.themes.delete(name);
        
        const config = vscode.workspace.getConfiguration('visualProgramming');
        const customThemes = config.get<Record<string, ThemeConfig>>('ui.customThemes', {});
        delete customThemes[name];
        
        await config.update('ui.customThemes', customThemes, true);
        
        if (this.currentTheme === name) {
            await this.applyTheme('default');
        }
    }
    
    // 🎨 获取当前CSS
    public getCurrentCSS(): string {
        return this.customCSS;
    }
}

// 导出单例实例
export const advancedUISystem = AdvancedUISystem.getInstance();
