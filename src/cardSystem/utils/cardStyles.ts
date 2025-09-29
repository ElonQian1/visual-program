// 卡片样式生成器 - 生成CSS样式代码

export function generateMovableCardStyles(): string {
    return `
        /* 可移动卡片基础样式 */
        .movable-card {
            position: absolute;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 300px;
            max-width: 500px;
            min-height: 200px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 100;
            transition: box-shadow 0.2s ease, transform 0.2s ease;
            overflow: hidden;
        }

        .movable-card:hover {
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
            transform: translateY(-1px);
        }

        .movable-card.dragging {
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
            transform: rotate(2deg) scale(1.02);
            cursor: grabbing;
        }

        .movable-card.maximized {
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            width: calc(100vw - 20px) !important;
            height: calc(100vh - 20px) !important;
            max-width: none !important;
            max-height: none !important;
            z-index: 9999;
            transform: none !important;
        }

        .movable-card.minimized {
            height: auto !important;
        }

        .movable-card.minimized .movable-card-content {
            display: none !important;
        }

        /* 卡片头部 */
        .movable-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            border-radius: 12px 12px 0 0;
        }

        .movable-card-drag-handle {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: grab;
            flex: 1;
            min-width: 0;
        }

        .movable-card-drag-handle:active {
            cursor: grabbing;
        }

        .card-emoji {
            font-size: 24px;
            flex-shrink: 0;
        }

        .card-title-wrapper {
            flex: 1;
            min-width: 0;
        }

        .card-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
            color: #1f2937;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .card-subtitle {
            font-size: 12px;
            color: #6b7280;
            margin: 2px 0 0 0;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* 控制按钮 */
        .movable-card-controls {
            display: flex;
            gap: 4px;
        }

        .card-control-btn {
            width: 24px;
            height: 24px;
            border: none;
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.1);
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .card-control-btn:hover {
            background: rgba(0, 0, 0, 0.2);
            color: #374151;
            transform: scale(1.1);
        }

        .card-control-btn.close-btn:hover {
            background: #ef4444;
            color: white;
        }

        /* 卡片内容 */
        .movable-card-content {
            padding: 16px;
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        }

        .card-summary {
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 12px;
            color: #374151;
        }

        .card-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }

        .card-tag {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid rgba(99, 102, 241, 0.2);
        }

        /* 选项卡 */
        .card-tabs-container {
            margin-top: 12px;
        }

        .card-tab-buttons {
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding-bottom: 8px;
        }

        .card-tab-button {
            flex: 1;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            padding: 8px 12px;
            font-size: 13px;
            cursor: pointer;
            color: #6b7280;
            font-weight: 500;
            transition: all 0.2s ease;
            border-radius: 6px 6px 0 0;
        }

        .card-tab-button:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #374151;
        }

        .card-tab-button.active {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            border-bottom: 2px solid #6366f1;
            font-weight: 600;
        }

        .card-tab-contents {
            position: relative;
        }

        .card-tab-content {
            display: none;
        }

        .card-tab-content.active {
            display: block;
        }

        .tab-description {
            font-size: 13px;
            margin-bottom: 10px;
            color: #6b7280;
            font-weight: 500;
        }

        .tab-points-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .tab-points-list li {
            position: relative;
            margin-bottom: 8px;
            padding-left: 20px;
            font-size: 13px;
            line-height: 1.6;
            color: #374151;
        }

        .tab-points-list li::before {
            content: '▶';
            position: absolute;
            left: 0;
            color: #6366f1;
            font-size: 10px;
            top: 2px;
        }

        .card-cta {
            margin-top: 12px;
            padding: 10px 12px;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
            color: #047857;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.5;
            border-left: 4px solid #10b981;
        }

        /* 不同类型卡片的特殊样式 */
        .kid-friendly-card {
            border: 2px solid #fbbf24;
            background: linear-gradient(135deg, rgba(252, 211, 77, 0.1), rgba(251, 191, 36, 0.05));
        }

        .kid-friendly-card .movable-card-header {
            background: linear-gradient(135deg, rgba(252, 211, 77, 0.2), rgba(251, 191, 36, 0.1));
        }

        .kid-friendly-card .card-tag {
            background: rgba(252, 211, 77, 0.2);
            color: #d97706;
            border-color: rgba(252, 211, 77, 0.4);
        }

        .kid-friendly-card .tab-points-list li::before {
            content: '✨';
            color: #f59e0b;
        }

        .senior-student-card {
            border: 2px solid #3b82f6;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.03));
        }

        .senior-student-card .movable-card-header {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
        }

        .senior-student-card .card-tag {
            background: rgba(59, 130, 246, 0.1);
            color: #2563eb;
            border-color: rgba(59, 130, 246, 0.3);
        }

        .senior-student-card .card-cta {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
            color: #1d4ed8;
            border-left-color: #3b82f6;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .movable-card {
                min-width: 280px;
                max-width: calc(100vw - 20px);
            }

            .movable-card.maximized {
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                border-radius: 0 !important;
            }

            .card-tab-buttons {
                flex-direction: column;
                gap: 2px;
            }

            .card-tab-button {
                flex: none;
            }
        }

        /* 滚动条样式 */
        .movable-card-content::-webkit-scrollbar {
            width: 6px;
        }

        .movable-card-content::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 3px;
        }

        .movable-card-content::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
        }

        .movable-card-content::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
        }
    `;
}