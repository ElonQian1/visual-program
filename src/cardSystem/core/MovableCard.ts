import { MovableCardConfig, CardState, CardBounds, CardPosition, CardEventHandlers, DragEvent } from './types';

/**
 * 基础可移动卡片类
 * 提供拖拽、缩放、最小化等核心功能
 */
export class MovableCard {
    private config: MovableCardConfig;
    private eventHandlers: CardEventHandlers;
    private element: HTMLElement | null = null;
    private dragState: {
        isDragging: boolean;
        startPos: CardPosition;
        elementStartPos: CardPosition;
    } = {
        isDragging: false,
        startPos: { x: 0, y: 0 },
        elementStartPos: { x: 0, y: 0 }
    };

    constructor(config: MovableCardConfig, eventHandlers: CardEventHandlers = {}) {
        this.config = { ...config };
        this.eventHandlers = eventHandlers;
    }

    // 创建卡片DOM元素
    createElement(parent: HTMLElement): HTMLElement {
        if (this.element) {
            this.destroy();
        }

        this.element = document.createElement('div');
        this.element.className = `movable-card ${this.config.type}-card`;
        this.element.id = this.config.id;
        this.element.style.cssText = this.getCardStyles();

        // 创建卡片头部
        const header = this.createHeader();
        this.element.appendChild(header);

        // 创建卡片内容
        const content = this.createContent();
        this.element.appendChild(content);

        // 绑定事件
        this.bindEvents();

        parent.appendChild(this.element);
        return this.element;
    }

    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'movable-card-header';

        // 拖拽区域
        const dragHandle = document.createElement('div');
        dragHandle.className = 'movable-card-drag-handle';
        dragHandle.innerHTML = `
            <div class="card-emoji">${this.config.data.emoji}</div>
            <div class="card-title-wrapper">
                <div class="card-title">${this.config.data.chineseName}</div>
                <div class="card-subtitle">${this.config.data.englishName}</div>
            </div>
        `;

        // 控制按钮
        const controls = document.createElement('div');
        controls.className = 'movable-card-controls';

        if (this.config.minimizable !== false) {
            const minimizeBtn = document.createElement('button');
            minimizeBtn.className = 'card-control-btn minimize-btn';
            minimizeBtn.innerHTML = '−';
            minimizeBtn.title = '最小化';
            minimizeBtn.onclick = () => this.minimize();
            controls.appendChild(minimizeBtn);
        }

        if (this.config.maximizable !== false) {
            const maximizeBtn = document.createElement('button');
            maximizeBtn.className = 'card-control-btn maximize-btn';
            maximizeBtn.innerHTML = this.config.state.isMaximized ? '⧉' : '⬜';
            maximizeBtn.title = this.config.state.isMaximized ? '还原' : '最大化';
            maximizeBtn.onclick = () => this.toggleMaximize();
            controls.appendChild(maximizeBtn);
        }

        if (this.config.closable !== false) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'card-control-btn close-btn';
            closeBtn.innerHTML = '×';
            closeBtn.title = '关闭';
            closeBtn.onclick = () => this.close();
            controls.appendChild(closeBtn);
        }

        header.appendChild(dragHandle);
        header.appendChild(controls);

        return header;
    }

    private createContent(): HTMLElement {
        const content = document.createElement('div');
        content.className = 'movable-card-content';

        if (this.config.state.isMinimized) {
            content.style.display = 'none';
            return content;
        }

        // 摘要
        if (this.config.data.summary) {
            const summary = document.createElement('div');
            summary.className = 'card-summary';
            summary.textContent = this.config.data.summary;
            content.appendChild(summary);
        }

        // 标签
        if (this.config.data.tags?.length > 0) {
            const tags = document.createElement('div');
            tags.className = 'card-tags';
            this.config.data.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'card-tag';
                tagEl.textContent = tag;
                tags.appendChild(tagEl);
            });
            content.appendChild(tags);
        }

        // 选项卡
        if (this.config.data.tabs?.length > 0) {
            const tabsContainer = this.createTabs();
            content.appendChild(tabsContainer);
        }

        // 行动建议
        if (this.config.data.callToAction) {
            const cta = document.createElement('div');
            cta.className = 'card-cta';
            cta.textContent = this.config.data.callToAction;
            content.appendChild(cta);
        }

        return content;
    }

    private createTabs(): HTMLElement {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'card-tabs-container';

        // 选项卡按钮
        const tabButtons = document.createElement('div');
        tabButtons.className = 'card-tab-buttons';

        // 选项卡内容容器
        const tabContents = document.createElement('div');
        tabContents.className = 'card-tab-contents';

        const activeTabId = this.config.state.activeTabId || this.config.data.tabs[0]?.id;

        this.config.data.tabs.forEach(tab => {
            // 按钮
            const button = document.createElement('button');
            button.className = `card-tab-button ${tab.id === activeTabId ? 'active' : ''}`;
            button.textContent = tab.title;
            button.onclick = () => this.switchTab(tab.id);
            tabButtons.appendChild(button);

            // 内容
            const content = document.createElement('div');
            content.className = `card-tab-content ${tab.id === activeTabId ? 'active' : ''}`;
            content.dataset.tabId = tab.id;

            if (tab.description) {
                const desc = document.createElement('div');
                desc.className = 'tab-description';
                desc.textContent = tab.description;
                content.appendChild(desc);
            }

            if (tab.points?.length > 0) {
                const pointsList = document.createElement('ul');
                pointsList.className = 'tab-points-list';
                tab.points.forEach(point => {
                    const li = document.createElement('li');
                    li.textContent = point;
                    pointsList.appendChild(li);
                });
                content.appendChild(pointsList);
            }

            tabContents.appendChild(content);
        });

        tabsContainer.appendChild(tabButtons);
        tabsContainer.appendChild(tabContents);

        return tabsContainer;
    }

    private getCardStyles(): string {
        const { position, size } = this.config.bounds;
        const { zIndex, isVisible } = this.config.state;

        return `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            width: ${size.width}px;
            height: ${size.height}px;
            z-index: ${zIndex};
            display: ${isVisible ? 'block' : 'none'};
        `;
    }

    private bindEvents(): void {
        if (!this.element) return;

        const dragHandle = this.element.querySelector('.movable-card-drag-handle') as HTMLElement;
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', this.handleMouseDown.bind(this));
        }

        // 防止卡片内容被选中
        this.element.addEventListener('selectstart', (e) => e.preventDefault());
    }

    private handleMouseDown(e: MouseEvent): void {
        if (this.config.state.isMaximized) return; // 最大化状态下不允许拖拽

        e.preventDefault();
        this.dragState.isDragging = true;
        this.dragState.startPos = { x: e.clientX, y: e.clientY };
        this.dragState.elementStartPos = { ...this.config.bounds.position };

        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // 触发拖拽开始事件
        const dragEvent: DragEvent = {
            startPosition: this.dragState.startPos,
            currentPosition: this.dragState.startPos,
            delta: { x: 0, y: 0 }
        };
        this.eventHandlers.onDragStart?.(this.config.id, dragEvent);

        // 设置卡片为顶层
        this.bringToTop();
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.dragState.isDragging || !this.element) return;

        const deltaX = e.clientX - this.dragState.startPos.x;
        const deltaY = e.clientY - this.dragState.startPos.y;

        const newPosition = {
            x: this.dragState.elementStartPos.x + deltaX,
            y: this.dragState.elementStartPos.y + deltaY
        };

        this.updatePosition(newPosition);

        // 触发拖拽移动事件
        const dragEvent: DragEvent = {
            startPosition: this.dragState.startPos,
            currentPosition: { x: e.clientX, y: e.clientY },
            delta: { x: deltaX, y: deltaY }
        };
        this.eventHandlers.onDragMove?.(this.config.id, dragEvent);
    }

    private handleMouseUp(e: MouseEvent): void {
        if (!this.dragState.isDragging) return;

        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));

        const dragEvent: DragEvent = {
            startPosition: this.dragState.startPos,
            currentPosition: { x: e.clientX, y: e.clientY },
            delta: {
                x: e.clientX - this.dragState.startPos.x,
                y: e.clientY - this.dragState.startPos.y
            }
        };

        this.dragState.isDragging = false;
        this.eventHandlers.onDragEnd?.(this.config.id, dragEvent);
    }

    // 公共方法
    public updatePosition(position: CardPosition): void {
        this.config.bounds.position = { ...position };
        if (this.element) {
            this.element.style.left = position.x + 'px';
            this.element.style.top = position.y + 'px';
        }
    }

    public minimize(): void {
        this.config.state.isMinimized = true;
        const content = this.element?.querySelector('.movable-card-content') as HTMLElement;
        if (content) {
            content.style.display = 'none';
        }
        this.eventHandlers.onMinimize?.(this.config.id);
    }

    public restore(): void {
        this.config.state.isMinimized = false;
        this.config.state.isMaximized = false;
        const content = this.element?.querySelector('.movable-card-content') as HTMLElement;
        if (content) {
            content.style.display = 'block';
        }
        this.updateStyles();
    }

    public toggleMaximize(): void {
        if (this.config.state.isMaximized) {
            this.restore();
        } else {
            this.maximize();
        }
    }

    public maximize(): void {
        this.config.state.isMaximized = true;
        this.config.state.isMinimized = false;
        this.updateStyles();
        this.eventHandlers.onMaximize?.(this.config.id);
    }

    public close(): void {
        this.config.state.isVisible = false;
        if (this.element) {
            this.element.style.display = 'none';
        }
        this.eventHandlers.onClose?.(this.config.id);
    }

    public switchTab(tabId: string): void {
        this.config.state.activeTabId = tabId;
        
        // 更新按钮状态
        const buttons = this.element?.querySelectorAll('.card-tab-button');
        buttons?.forEach((btn, index) => {
            const tab = this.config.data.tabs[index];
            if (tab?.id === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 更新内容显示
        const contents = this.element?.querySelectorAll('.card-tab-content');
        contents?.forEach(content => {
            const contentEl = content as HTMLElement;
            if (contentEl.dataset.tabId === tabId) {
                contentEl.classList.add('active');
            } else {
                contentEl.classList.remove('active');
            }
        });

        this.eventHandlers.onTabChange?.(this.config.id, tabId);
    }

    public bringToTop(): void {
        // 这个方法将由CardManager调用来管理z-index
    }

    public getConfig(): MovableCardConfig {
        return { ...this.config };
    }

    public updateStyles(): void {
        if (!this.element) return;
        this.element.style.cssText = this.getCardStyles();
        
        // 更新最大化按钮
        const maximizeBtn = this.element.querySelector('.maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.innerHTML = this.config.state.isMaximized ? '⧉' : '⬜';
            maximizeBtn.setAttribute('title', this.config.state.isMaximized ? '还原' : '最大化');
        }
    }

    public destroy(): void {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}