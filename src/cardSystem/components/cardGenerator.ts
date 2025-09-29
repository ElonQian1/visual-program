// 卡片组件生成器 - 生成可移动卡片的HTML和JavaScript

import { CardData } from '../core/types';

export interface CardComponentConfig {
    id: string;
    type: 'kid-friendly' | 'senior-student' | 'custom';
    data: CardData;
    position: { x: number; y: number };
    size: { width: number; height: number };
    minimizable?: boolean;
    maximizable?: boolean;
    closable?: boolean;
}

// 生成卡片HTML结构
export function generateCardHTML(config: CardComponentConfig): string {
    const { id, type, data, position, size } = config;
    
    return `
        <div id="${id}" 
             class="movable-card ${type}-card" 
             style="left: ${position.x}px; top: ${position.y}px; width: ${size.width}px; height: ${size.height}px;"
             data-card-type="${type}">
            
            <!-- 卡片头部 -->
            <div class="movable-card-header">
                <div class="movable-card-drag-handle">
                    <div class="card-emoji">${data.emoji || '📄'}</div>
                    <div class="card-title-wrapper">
                        <div class="card-title">${data.chineseName || '卡片标题'}</div>
                        <div class="card-subtitle">${data.englishName || ''}</div>
                    </div>
                </div>
                
                <div class="movable-card-controls">
                    ${config.minimizable !== false ? `
                        <button class="card-control-btn minimize-btn" title="最小化" onclick="cardManager.minimizeCard('${id}')">−</button>
                    ` : ''}
                    ${config.maximizable !== false ? `
                        <button class="card-control-btn maximize-btn" title="最大化" onclick="cardManager.toggleMaximize('${id}')">⬜</button>
                    ` : ''}
                    ${config.closable !== false ? `
                        <button class="card-control-btn close-btn" title="关闭" onclick="cardManager.closeCard('${id}')">×</button>
                    ` : ''}
                </div>
            </div>
            
            <!-- 卡片内容 -->
            <div class="movable-card-content">
                ${generateCardContent(data)}
            </div>
        </div>
    `;
}

function generateCardContent(data: CardData): string {
    let content = '';
    
    // 摘要
    if (data.summary) {
        content += `<div class="card-summary">${data.summary}</div>`;
    }
    
    // 标签
    if (data.tags && data.tags.length > 0) {
        content += `
            <div class="card-tags">
                ${data.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
            </div>
        `;
    }
    
    // 选项卡
    if (data.tabs && data.tabs.length > 0) {
        const firstTabId = data.tabs[0].id;
        
        content += `
            <div class="card-tabs-container">
                <div class="card-tab-buttons">
                    ${data.tabs.map((tab, index) => `
                        <button class="card-tab-button ${index === 0 ? 'active' : ''}" 
                                onclick="cardManager.switchTab('${data.id}', '${tab.id}')">
                            ${tab.title}
                        </button>
                    `).join('')}
                </div>
                
                <div class="card-tab-contents">
                    ${data.tabs.map((tab, index) => `
                        <div class="card-tab-content ${index === 0 ? 'active' : ''}" data-tab-id="${tab.id}">
                            ${tab.description ? `<div class="tab-description">${tab.description}</div>` : ''}
                            ${tab.points && tab.points.length > 0 ? `
                                <ul class="tab-points-list">
                                    ${tab.points.map(point => `<li>${point}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // 行动建议
    if (data.callToAction) {
        content += `<div class="card-cta">${data.callToAction}</div>`;
    }
    
    return content;
}

// 生成卡片管理器JavaScript代码
export function generateCardManagerScript(): string {
    return `
        // 卡片管理器类
        class CardManager {
            constructor() {
                this.cards = new Map();
                this.zIndexCounter = 1000;
                this.dragEngine = new CardDragEngine();
                
                // 设置拖拽约束
                this.updateDragConstraints();
                window.addEventListener('resize', () => this.updateDragConstraints());
            }
            
            // 添加卡片
            addCard(cardConfig) {
                const cardHTML = this.generateCardHTML(cardConfig);
                const container = document.getElementById('canvas') || document.body;
                
                // 创建临时容器来解析HTML
                const temp = document.createElement('div');
                temp.innerHTML = cardHTML;
                const cardElement = temp.firstElementChild;
                
                // 添加到容器
                container.appendChild(cardElement);
                
                // 使卡片可拖拽
                CardDragEngine.makeDraggable(cardElement);
                
                // 存储卡片配置
                this.cards.set(cardConfig.id, {
                    config: cardConfig,
                    element: cardElement,
                    state: {
                        isMinimized: false,
                        isMaximized: false,
                        zIndex: this.zIndexCounter++
                    }
                });
                
                return cardElement;
            }
            
            // 生成卡片HTML（简化版，实际使用传入的HTML）
            generateCardHTML(config) {
                // 这里应该返回完整的HTML，但由于在运行时，
                // 我们直接使用传入的HTML字符串
                return config.html || '<div>Empty Card</div>';
            }
            
            // 最小化卡片
            minimizeCard(cardId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                const content = card.element.querySelector('.movable-card-content');
                const minimizeBtn = card.element.querySelector('.minimize-btn');
                
                if (card.state.isMinimized) {
                    // 恢复
                    content.style.display = 'block';
                    minimizeBtn.innerHTML = '−';
                    minimizeBtn.title = '最小化';
                    card.state.isMinimized = false;
                } else {
                    // 最小化
                    content.style.display = 'none';
                    minimizeBtn.innerHTML = '+';
                    minimizeBtn.title = '恢复';
                    card.state.isMinimized = true;
                }
            }
            
            // 切换最大化
            toggleMaximize(cardId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                const maximizeBtn = card.element.querySelector('.maximize-btn');
                
                if (card.state.isMaximized) {
                    // 恢复正常大小
                    card.element.classList.remove('maximized');
                    maximizeBtn.innerHTML = '⬜';
                    maximizeBtn.title = '最大化';
                    card.state.isMaximized = false;
                } else {
                    // 最大化
                    card.element.classList.add('maximized');
                    maximizeBtn.innerHTML = '⧉';
                    maximizeBtn.title = '还原';
                    card.state.isMaximized = true;
                }
            }
            
            // 关闭卡片
            closeCard(cardId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                // 添加消失动画
                card.element.style.transition = 'all 0.3s ease';
                card.element.style.opacity = '0';
                card.element.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    if (card.element.parentNode) {
                        card.element.parentNode.removeChild(card.element);
                    }
                    this.cards.delete(cardId);
                }, 300);
            }
            
            // 切换选项卡
            switchTab(cardId, tabId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                // 更新按钮状态
                const buttons = card.element.querySelectorAll('.card-tab-button');
                const contents = card.element.querySelectorAll('.card-tab-content');
                
                buttons.forEach(btn => btn.classList.remove('active'));
                contents.forEach(content => content.classList.remove('active'));
                
                // 激活对应的按钮和内容
                const activeButton = Array.from(buttons).find(btn => 
                    btn.textContent.trim() === Array.from(contents).find(content => 
                        content.dataset.tabId === tabId
                    )?.previousElementSibling?.textContent?.trim()
                );
                
                const activeContent = card.element.querySelector(\`[data-tab-id="\${tabId}"]\`);
                
                if (activeButton) activeButton.classList.add('active');
                if (activeContent) activeContent.classList.add('active');
            }
            
            // 将卡片置于顶层
            bringToTop(cardId) {
                const card = this.cards.get(cardId);
                if (!card) return;
                
                card.state.zIndex = this.zIndexCounter++;
                card.element.style.zIndex = card.state.zIndex;
            }
            
            // 更新拖拽约束
            updateDragConstraints() {
                const container = document.getElementById('canvas') || document.body;
                const rect = container.getBoundingClientRect();
                
                this.dragEngine.setConstraints({
                    minX: 0,
                    minY: 0,
                    maxX: rect.width,
                    maxY: rect.height
                });
            }
            
            // 获取卡片信息
            getCard(cardId) {
                return this.cards.get(cardId);
            }
            
            // 获取所有卡片
            getAllCards() {
                return Array.from(this.cards.values());
            }
            
            // 清理所有卡片
            clearAllCards() {
                this.cards.forEach(card => {
                    if (card.element.parentNode) {
                        card.element.parentNode.removeChild(card.element);
                    }
                });
                this.cards.clear();
            }
        }
        
        // 创建全局卡片管理器实例
        window.cardManager = new CardManager();
    `;
}