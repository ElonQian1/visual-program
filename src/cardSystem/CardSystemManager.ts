// 卡片管理系统 - 统一管理所有类型的卡片

interface CardData {
    id: string;
    chineseName: string;
    englishName: string;
    summary: string;
    emoji: string;
    tags: string[];
    tabs: Array<{
        id: string;
        title: string;
        description: string;
        points: string[];
    }>;
    callToAction?: string;
}

interface CardConfig {
    id: string;
    type: 'kid-friendly' | 'senior-student';
    data: CardData;
    position: { x: number; y: number };
    size: { width: number; height: number };
}

export class CardSystemManager {
    private webviewPanel: any; // VS Code WebviewPanel

    constructor(webviewPanel: any) {
        this.webviewPanel = webviewPanel;
    }

    // 初始化卡片系统（注入样式和脚本）
    public initializeCardSystem(): void {
        if (!this.webviewPanel) return;

        this.webviewPanel.webview.postMessage({
            command: 'initializeCardSystem',
            styles: generateMovableCardStyles(),
            dragEngineScript: generateDragEngineScript(),
            cardManagerScript: generateCardManagerScript()
        });
    }

    // 显示小朋友友好卡片
    public showKidFriendlyCard(cardData: any): void {
        const config: CardComponentConfig = {
            id: `kid-card-${Date.now()}`,
            type: 'kid-friendly',
            data: {
                id: `kid-card-${Date.now()}`,
                chineseName: cardData.chineseName || '小小代码故事',
                englishName: cardData.englishName || '',
                summary: cardData.summary || '',
                emoji: cardData.emoji || '🧒',
                tags: cardData.tags || [],
                tabs: cardData.tabs || [],
                callToAction: cardData.callToAction
            },
            position: { x: window.innerWidth - 450, y: 100 },
            size: { width: 400, height: 500 },
            minimizable: true,
            maximizable: true,
            closable: true
        };

        this.showCard(config);
    }

    // 显示高年级学生卡片
    public showSeniorStudentCard(cardData: any): void {
        const config: CardComponentConfig = {
            id: `senior-card-${Date.now()}`,
            type: 'senior-student',
            data: {
                id: `senior-card-${Date.now()}`,
                chineseName: cardData.chineseName || '代码分析报告',
                englishName: cardData.englishName || '',
                summary: cardData.summary || '',
                emoji: cardData.emoji || '🎓',
                tags: cardData.tags || [],
                tabs: cardData.tabs || [],
                callToAction: cardData.callToAction
            },
            position: { x: window.innerWidth - 450, y: 100 },
            size: { width: 420, height: 550 },
            minimizable: true,
            maximizable: true,
            closable: true
        };

        this.showCard(config);
    }

    // 显示通用卡片
    public showCard(config: CardComponentConfig): void {
        if (!this.webviewPanel) return;

        // 生成卡片HTML
        const cardHTML = generateCardHTML(config);

        // 发送到webview
        this.webviewPanel.webview.postMessage({
            command: 'showCard',
            config: {
                ...config,
                html: cardHTML
            }
        });
    }

    // 关闭特定卡片
    public closeCard(cardId: string): void {
        if (!this.webviewPanel) return;

        this.webviewPanel.webview.postMessage({
            command: 'closeCard',
            cardId
        });
    }

    // 清理所有卡片
    public clearAllCards(): void {
        if (!this.webviewPanel) return;

        this.webviewPanel.webview.postMessage({
            command: 'clearAllCards'
        });
    }

    // 获取适合在webview中运行的完整脚本
    public getWebviewScript(): string {
        return `
            ${generateDragEngineScript()}
            ${generateCardManagerScript()}
            
            // 监听来自VSCode的消息
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'initializeCardSystem':
                        // 注入样式
                        if (message.styles) {
                            let styleSheet = document.getElementById('cardSystemStyles');
                            if (!styleSheet) {
                                styleSheet = document.createElement('style');
                                styleSheet.id = 'cardSystemStyles';
                                document.head.appendChild(styleSheet);
                            }
                            styleSheet.textContent = message.styles;
                        }
                        
                        // 执行脚本（已经通过script标签加载）
                        console.log('Card system initialized');
                        break;
                        
                    case 'showCard':
                        if (window.cardManager && message.config) {
                            window.cardManager.addCard(message.config);
                        }
                        break;
                        
                    case 'closeCard':
                        if (window.cardManager && message.cardId) {
                            window.cardManager.closeCard(message.cardId);
                        }
                        break;
                        
                    case 'clearAllCards':
                        if (window.cardManager) {
                            window.cardManager.clearAllCards();
                        }
                        break;
                }
            });
        `;
    }

    // 获取卡片系统的CSS样式
    public getWebviewStyles(): string {
        return generateMovableCardStyles();
    }

    // 处理来自webview的消息
    public handleWebviewMessage(message: any): void {
        switch (message.command) {
            case 'cardMoved':
                // 处理卡片移动事件
                console.log(`Card ${message.cardId} moved to:`, message.position);
                break;
                
            case 'cardClosed':
                // 处理卡片关闭事件
                console.log(`Card ${message.cardId} closed`);
                break;
                
            case 'cardMinimized':
                // 处理卡片最小化事件
                console.log(`Card ${message.cardId} minimized`);
                break;
                
            case 'cardMaximized':
                // 处理卡片最大化事件
                console.log(`Card ${message.cardId} maximized`);
                break;
        }
    }
}