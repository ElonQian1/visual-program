// 卡片拖拽引擎 - 运行在webview中的JavaScript代码
// 这个文件包含卡片拖拽的核心逻辑

export interface DragEngine {
    startDrag(cardId: string, startX: number, startY: number): void;
    updateDrag(currentX: number, currentY: number): void;
    endDrag(): void;
    setConstraints(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void;
}

// 生成在webview中使用的拖拽引擎JavaScript代码
export function generateDragEngineScript(): string {
    return `
        // 卡片拖拽引擎
        class CardDragEngine {
            constructor() {
                this.currentCard = null;
                this.isDragging = false;
                this.startPos = { x: 0, y: 0 };
                this.elementStartPos = { x: 0, y: 0 };
                this.constraints = null;
                this.zIndexCounter = 1000;
            }

            setConstraints(bounds) {
                this.constraints = bounds;
            }

            startDrag(cardElement, startX, startY) {
                this.currentCard = cardElement;
                this.isDragging = true;
                this.startPos = { x: startX, y: startY };
                
                const rect = cardElement.getBoundingClientRect();
                const container = cardElement.offsetParent || document.body;
                const containerRect = container.getBoundingClientRect();
                
                this.elementStartPos = {
                    x: rect.left - containerRect.left,
                    y: rect.top - containerRect.top
                };

                // 将卡片提升到顶层
                this.bringToTop(cardElement);

                // 添加拖拽样式
                cardElement.classList.add('dragging');
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'grabbing';

                // 绑定全局事件
                document.addEventListener('mousemove', this.handleMouseMove.bind(this));
                document.addEventListener('mouseup', this.handleMouseUp.bind(this));
            }

            handleMouseMove(e) {
                if (!this.isDragging || !this.currentCard) return;

                e.preventDefault();
                
                const deltaX = e.clientX - this.startPos.x;
                const deltaY = e.clientY - this.startPos.y;
                
                let newX = this.elementStartPos.x + deltaX;
                let newY = this.elementStartPos.y + deltaY;

                // 应用约束
                if (this.constraints) {
                    const cardRect = this.currentCard.getBoundingClientRect();
                    newX = Math.max(this.constraints.minX, Math.min(newX, this.constraints.maxX - cardRect.width));
                    newY = Math.max(this.constraints.minY, Math.min(newY, this.constraints.maxY - cardRect.height));
                }

                // 更新位置
                this.currentCard.style.left = newX + 'px';
                this.currentCard.style.top = newY + 'px';

                // 触发自定义事件
                this.currentCard.dispatchEvent(new CustomEvent('cardMove', {
                    detail: { x: newX, y: newY, deltaX, deltaY }
                }));
            }

            handleMouseUp(e) {
                if (!this.isDragging) return;

                // 清理
                document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
                document.removeEventListener('mouseup', this.handleMouseUp.bind(this));

                if (this.currentCard) {
                    this.currentCard.classList.remove('dragging');
                    
                    // 触发拖拽结束事件
                    this.currentCard.dispatchEvent(new CustomEvent('cardDragEnd', {
                        detail: { 
                            x: parseInt(this.currentCard.style.left) || 0,
                            y: parseInt(this.currentCard.style.top) || 0
                        }
                    }));
                }

                document.body.style.userSelect = '';
                document.body.style.cursor = '';

                this.currentCard = null;
                this.isDragging = false;
            }

            bringToTop(cardElement) {
                this.zIndexCounter += 1;
                cardElement.style.zIndex = this.zIndexCounter;
            }

            // 静态方法：为元素添加拖拽功能
            static makeDraggable(cardElement, dragHandle = null) {
                const engine = window.cardDragEngine || (window.cardDragEngine = new CardDragEngine());
                const handle = dragHandle || cardElement.querySelector('.movable-card-drag-handle') || cardElement;

                handle.style.cursor = 'grab';
                
                handle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    handle.style.cursor = 'grabbing';
                    engine.startDrag(cardElement, e.clientX, e.clientY);
                });

                // 鼠标释放时恢复光标
                document.addEventListener('mouseup', () => {
                    handle.style.cursor = 'grab';
                });

                return engine;
            }
        }

        // 全局导出
        window.CardDragEngine = CardDragEngine;
    `;
}