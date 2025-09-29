// 卡片管理系统 - 统一管理所有类型的可移动卡片

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

    // 显示小朋友友好卡片
    public showKidFriendlyCard(cardData: any): void {
        const config: CardConfig = {
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
            position: { x: 50, y: 100 },
            size: { width: 400, height: 500 }
        };

        this.showCard(config);
    }

    // 显示高年级学生卡片
    public showSeniorStudentCard(cardData: any): void {
        const config: CardConfig = {
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
            position: { x: 100, y: 150 },
            size: { width: 420, height: 550 }
        };

        this.showCard(config);
    }

    // 显示卡片的核心方法
    private showCard(config: CardConfig): void {
        if (!this.webviewPanel) return;

        this.webviewPanel.webview.postMessage({
            command: 'showMovableCard',
            cardConfig: config
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

    // 处理来自webview的消息
    public handleWebviewMessage(message: any): void {
        switch (message.command) {
            case 'cardMoved':
                console.log(`Card ${message.cardId} moved to:`, message.position);
                break;
            case 'cardClosed':
                console.log(`Card ${message.cardId} closed`);
                break;
            case 'cardMinimized':
                console.log(`Card ${message.cardId} minimized`);
                break;
            case 'cardMaximized':
                console.log(`Card ${message.cardId} maximized`);
                break;
        }
    }
}