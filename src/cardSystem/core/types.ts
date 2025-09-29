// 可移动卡片系统的核心接口定义

export interface CardPosition {
    x: number;
    y: number;
}

export interface CardSize {
    width: number;
    height: number;
}

export interface CardBounds {
    position: CardPosition;
    size: CardSize;
}

export interface CardTab {
    id: string;
    title: string;
    description: string;
    points: string[];
}

export interface CardData {
    id: string;
    chineseName: string;
    englishName: string;
    summary: string;
    emoji: string;
    tags: string[];
    tabs: CardTab[];
    callToAction?: string;
}

export interface CardState {
    isMinimized: boolean;
    isMaximized: boolean;
    isDragging: boolean;
    isVisible: boolean;
    zIndex: number;
    activeTabId?: string;
}

export interface MovableCardConfig {
    id: string;
    type: 'kid-friendly' | 'senior-student' | 'custom';
    data: CardData;
    bounds: CardBounds;
    state: CardState;
    resizable?: boolean;
    minimizable?: boolean;
    maximizable?: boolean;
    closable?: boolean;
}

export interface DragEvent {
    startPosition: CardPosition;
    currentPosition: CardPosition;
    delta: CardPosition;
}

export interface CardEventHandlers {
    onDragStart?: (cardId: string, event: DragEvent) => void;
    onDragMove?: (cardId: string, event: DragEvent) => void;
    onDragEnd?: (cardId: string, event: DragEvent) => void;
    onMinimize?: (cardId: string) => void;
    onMaximize?: (cardId: string) => void;
    onClose?: (cardId: string) => void;
    onTabChange?: (cardId: string, tabId: string) => void;
}

export interface CardSystemBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}