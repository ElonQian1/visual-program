// 🌐 实时协作系统 (文件同步版本)
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface CollaborationMessage {
    type: 'cursor' | 'edit' | 'selection' | 'analysis' | 'chat' | 'presence';
    userId: string;
    sessionId: string;
    timestamp: number;
    data: any;
}

export interface User {
    id: string;
    name: string;
    color: string;
    avatar?: string;
    cursor?: vscode.Position;
    selection?: vscode.Selection;
    activeFile?: string;
    lastSeen: number;
    isActive: boolean;
}

export interface CollaborationSession {
    id: string;
    name: string;
    host: string;
    users: Map<string, User>;
    createdAt: number;
    settings: {
        allowAnonymous: boolean;
        maxUsers: number;
        permissions: {
            canEdit: boolean;
            canAnalyze: boolean;
            canChat: boolean;
        };
    };
}

export class RealtimeCollaborationSystem extends EventEmitter {
    private static instance: RealtimeCollaborationSystem;
    private webSocketServer?: WebSocketServerLike;
    private webSocketClient?: WebSocketLike;
    private sessions: Map<string, CollaborationSession> = new Map();
    private currentSession?: CollaborationSession;
    private currentUser?: User;
    private isHost: boolean = false;
    private collaborationDecorations: Map<string, vscode.TextEditorDecorationType> = new Map();
    private heartbeatInterval?: NodeJS.Timeout;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;

    // 用户颜色池
    private userColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    public static getInstance(): RealtimeCollaborationSystem {
        if (!RealtimeCollaborationSystem.instance) {
            RealtimeCollaborationSystem.instance = new RealtimeCollaborationSystem();
        }
        return RealtimeCollaborationSystem.instance;
    }

    constructor() {
        super();
        this.setupEventListeners();
    }

    // 创建协作会话
    public async createSession(sessionName: string, settings?: Partial<CollaborationSession['settings']>): Promise<string> {
        try {
            const sessionId = this.generateSessionId();
            const userId = this.generateUserId();
            
            // 创建当前用户
            this.currentUser = {
                id: userId,
                name: await this.getUserName(),
                color: this.getRandomColor(),
                lastSeen: Date.now(),
                isActive: true
            };

            // 创建会话
            const session: CollaborationSession = {
                id: sessionId,
                name: sessionName,
                host: userId,
                users: new Map([[userId, this.currentUser]]),
                createdAt: Date.now(),
                settings: {
                    allowAnonymous: true,
                    maxUsers: 10,
                    permissions: {
                        canEdit: true,
                        canAnalyze: true,
                        canChat: true
                    },
                    ...settings
                }
            };

            this.sessions.set(sessionId, session);
            this.currentSession = session;
            this.isHost = true;

            // 启动WebSocket服务器
            await this.startWebSocketServer();

            // 开始心跳检测
            this.startHeartbeat();

            // 显示会话信息
            await this.showSessionInfo(session);

            vscode.window.showInformationMessage(
                `🎉 协作会话"${sessionName}"已创建！会话ID: ${sessionId}`,
                '复制会话ID',
                '邀请用户'
            ).then(action => {
                if (action === '复制会话ID') {
                    vscode.env.clipboard.writeText(sessionId);
                    vscode.window.showInformationMessage('会话ID已复制到剪贴板！');
                } else if (action === '邀请用户') {
                    this.showInviteDialog(sessionId);
                }
            });

            this.emit('sessionCreated', session);
            return sessionId;

        } catch (error) {
            vscode.window.showErrorMessage(`创建协作会话失败: ${error}`);
            throw error;
        }
    }

    // 加入协作会话
    public async joinSession(sessionId: string, userName?: string): Promise<void> {
        try {
            if (!sessionId) {
                const input = await vscode.window.showInputBox({
                    prompt: '请输入协作会话ID',
                    placeholder: '例如: COLLAB-ABCD1234'
                });
                if (!input) return;
                sessionId = input;
            }

            const userId = this.generateUserId();
            
            // 创建当前用户
            this.currentUser = {
                id: userId,
                name: userName || await this.getUserName(),
                color: this.getRandomColor(),
                lastSeen: Date.now(),
                isActive: true
            };

            // 连接到WebSocket服务器
            await this.connectToWebSocket(sessionId);

            // 发送加入请求
            this.sendMessage({
                type: 'presence',
                userId,
                sessionId,
                timestamp: Date.now(),
                data: {
                    action: 'join',
                    user: this.currentUser
                }
            });

            vscode.window.showInformationMessage(`🤝 正在加入协作会话: ${sessionId}`);

        } catch (error) {
            vscode.window.showErrorMessage(`加入协作会话失败: ${error}`);
            throw error;
        }
    }

    // 启动WebSocket服务器
    private async startWebSocketServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const port = this.findAvailablePort();
                this.webSocketServer = new ws.Server({ port });

                this.webSocketServer.on('connection', (socket, request) => {
                    this.handleNewConnection(socket, request);
                });

                this.webSocketServer.on('listening', () => {
                    console.log(`协作服务器启动在端口 ${port}`);
                    resolve();
                });

                this.webSocketServer.on('error', (error) => {
                    console.error('WebSocket服务器错误:', error);
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    // 处理新连接
    private handleNewConnection(socket: ws.WebSocket, request: any): void {
        console.log('新用户连接');

        socket.on('message', (data) => {
            try {
                const message: CollaborationMessage = JSON.parse(data.toString());
                this.handleMessage(message, socket);
            } catch (error) {
                console.error('消息解析错误:', error);
            }
        });

        socket.on('close', () => {
            this.handleDisconnection(socket);
        });

        socket.on('error', (error) => {
            console.error('WebSocket连接错误:', error);
        });
    }

    // 处理消息
    private handleMessage(message: CollaborationMessage, socket: ws.WebSocket): void {
        if (!this.currentSession) return;

        switch (message.type) {
            case 'presence':
                this.handlePresenceMessage(message, socket);
                break;
            case 'cursor':
                this.handleCursorMessage(message);
                break;
            case 'edit':
                this.handleEditMessage(message);
                break;
            case 'selection':
                this.handleSelectionMessage(message);
                break;
            case 'analysis':
                this.handleAnalysisMessage(message);
                break;
            case 'chat':
                this.handleChatMessage(message);
                break;
        }

        // 广播消息给其他用户
        this.broadcastMessage(message, socket);
    }

    // 处理在线状态消息
    private handlePresenceMessage(message: CollaborationMessage, socket: ws.WebSocket): void {
        if (!this.currentSession) return;

        const { action, user } = message.data;

        switch (action) {
            case 'join':
                if (this.currentSession.users.size >= this.currentSession.settings.maxUsers) {
                    socket.send(JSON.stringify({
                        type: 'error',
                        data: { message: '会话已满员' }
                    }));
                    socket.close();
                    return;
                }

                // 分配颜色
                user.color = this.getAvailableColor();
                this.currentSession.users.set(user.id, user);
                
                // 欢迎新用户
                socket.send(JSON.stringify({
                    type: 'welcome',
                    data: {
                        session: this.serializeSession(this.currentSession),
                        yourId: user.id
                    }
                }));

                vscode.window.showInformationMessage(`👋 ${user.name} 加入了会话`);
                this.emit('userJoined', user);
                break;

            case 'leave':
                this.currentSession.users.delete(message.userId);
                this.removeUserDecorations(message.userId);
                vscode.window.showInformationMessage(`👋 用户离开了会话`);
                this.emit('userLeft', message.userId);
                break;
        }

        this.updateCollaboratorsList();
    }

    // 处理光标消息
    private handleCursorMessage(message: CollaborationMessage): void {
        if (!this.currentSession) return;

        const user = this.currentSession.users.get(message.userId);
        if (!user) return;

        user.cursor = message.data.cursor;
        user.activeFile = message.data.activeFile;
        user.lastSeen = Date.now();

        this.updateCursorDecoration(user);
    }

    // 处理编辑消息
    private handleEditMessage(message: CollaborationMessage): void {
        if (!this.currentSession?.settings.permissions.canEdit) return;

        const { filePath, changes } = message.data;
        
        // 应用远程编辑
        this.applyRemoteEdits(filePath, changes, message.userId);
    }

    // 处理选择消息
    private handleSelectionMessage(message: CollaborationMessage): void {
        if (!this.currentSession) return;

        const user = this.currentSession.users.get(message.userId);
        if (!user) return;

        user.selection = message.data.selection;
        user.activeFile = message.data.activeFile;
        user.lastSeen = Date.now();

        this.updateSelectionDecoration(user);
    }

    // 处理分析消息
    private handleAnalysisMessage(message: CollaborationMessage): void {
        if (!this.currentSession?.settings.permissions.canAnalyze) return;

        const { type, result } = message.data;
        
        vscode.window.showInformationMessage(
            `📊 ${this.getUserName(message.userId)} 完成了 ${type} 分析`,
            '查看结果'
        ).then(action => {
            if (action === '查看结果') {
                this.showAnalysisResult(result);
            }
        });
    }

    // 处理聊天消息
    private handleChatMessage(message: CollaborationMessage): void {
        if (!this.currentSession?.settings.permissions.canChat) return;

        const userName = this.getUserName(message.userId);
        const { text } = message.data;

        this.showChatMessage(userName, text, message.timestamp);
    }

    // 广播消息
    private broadcastMessage(message: CollaborationMessage, excludeSocket?: ws.WebSocket): void {
        if (!this.webSocketServer) return;

        const messageStr = JSON.stringify(message);

        this.webSocketServer.clients.forEach(client => {
            if (client !== excludeSocket && client.readyState === ws.OPEN) {
                client.send(messageStr);
            }
        });
    }

    // 发送消息
    private sendMessage(message: CollaborationMessage): void {
        if (this.webSocketClient && this.webSocketClient.readyState === ws.OPEN) {
            this.webSocketClient.send(JSON.stringify(message));
        } else if (this.isHost) {
            // 如果是主机，直接处理消息
            this.handleMessage(message, null as any);
        }
    }

    // 更新光标装饰
    private updateCursorDecoration(user: User): void {
        if (!user.cursor || !user.activeFile) return;

        const editor = vscode.window.visibleTextEditors.find(
            e => e.document.fileName === user.activeFile
        );

        if (!editor) return;

        // 创建或获取装饰类型
        let decorationType = this.collaborationDecorations.get(`cursor-${user.id}`);
        if (!decorationType) {
            decorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: user.color + '40',
                borderLeft: `2px solid ${user.color}`,
                after: {
                    contentText: ` ${user.name}`,
                    color: user.color,
                    fontWeight: 'bold'
                }
            });
            this.collaborationDecorations.set(`cursor-${user.id}`, decorationType);
        }

        // 应用装饰
        const range = new vscode.Range(user.cursor, user.cursor);
        editor.setDecorations(decorationType, [range]);
    }

    // 更新选择装饰
    private updateSelectionDecoration(user: User): void {
        if (!user.selection || !user.activeFile) return;

        const editor = vscode.window.visibleTextEditors.find(
            e => e.document.fileName === user.activeFile
        );

        if (!editor) return;

        // 创建或获取装饰类型
        let decorationType = this.collaborationDecorations.get(`selection-${user.id}`);
        if (!decorationType) {
            decorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: user.color + '20',
                border: `1px solid ${user.color}`,
                borderRadius: '2px'
            });
            this.collaborationDecorations.set(`selection-${user.id}`, decorationType);
        }

        // 应用装饰
        editor.setDecorations(decorationType, [user.selection]);
    }

    // 移除用户装饰
    private removeUserDecorations(userId: string): void {
        const cursorDecorations = this.collaborationDecorations.get(`cursor-${userId}`);
        const selectionDecorations = this.collaborationDecorations.get(`selection-${userId}`);

        if (cursorDecorations) {
            cursorDecorations.dispose();
            this.collaborationDecorations.delete(`cursor-${userId}`);
        }

        if (selectionDecorations) {
            selectionDecorations.dispose();
            this.collaborationDecorations.delete(`selection-${userId}`);
        }
    }

    // 应用远程编辑
    private async applyRemoteEdits(filePath: string, changes: vscode.TextDocumentContentChangeEvent[], userId: string): Promise<void> {
        const document = vscode.workspace.textDocuments.find(doc => doc.fileName === filePath);
        if (!document) return;

        const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
        if (!editor) return;

        // 暂时禁用本地编辑事件，避免循环
        this.isApplyingRemoteEdit = true;

        try {
            const success = await editor.edit(editBuilder => {
                changes.forEach(change => {
                    if (change.range) {
                        editBuilder.replace(change.range, change.text);
                    } else {
                        // 全文替换
                        const fullRange = new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(document.getText().length)
                        );
                        editBuilder.replace(fullRange, change.text);
                    }
                });
            });

            if (success) {
                const userName = this.getUserName(userId);
                vscode.window.showInformationMessage(`✏️ ${userName} 编辑了文件`, { detail: filePath });
            }

        } finally {
            this.isApplyingRemoteEdit = false;
        }
    }

    private isApplyingRemoteEdit = false;

    // 设置事件监听器
    private setupEventListeners(): void {
        // 监听光标位置变化
        vscode.window.onDidChangeTextEditorSelection(event => {
            if (this.isApplyingRemoteEdit || !this.currentSession || !this.currentUser) return;

            this.sendMessage({
                type: 'cursor',
                userId: this.currentUser.id,
                sessionId: this.currentSession.id,
                timestamp: Date.now(),
                data: {
                    cursor: event.textEditor.selection.active,
                    activeFile: event.textEditor.document.fileName
                }
            });

            if (!event.textEditor.selection.isEmpty) {
                this.sendMessage({
                    type: 'selection',
                    userId: this.currentUser.id,
                    sessionId: this.currentSession.id,
                    timestamp: Date.now(),
                    data: {
                        selection: event.textEditor.selection,
                        activeFile: event.textEditor.document.fileName
                    }
                });
            }
        });

        // 监听文档变化
        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.isApplyingRemoteEdit || !this.currentSession || !this.currentUser) return;
            if (!this.currentSession.settings.permissions.canEdit) return;

            this.sendMessage({
                type: 'edit',
                userId: this.currentUser.id,
                sessionId: this.currentSession.id,
                timestamp: Date.now(),
                data: {
                    filePath: event.document.fileName,
                    changes: event.contentChanges
                }
            });
        });
    }

    // 显示会话信息
    private async showSessionInfo(session: CollaborationSession): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'collaborationSession',
            `🤝 协作会话: ${session.name}`,
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        panel.webview.html = this.createSessionInfoContent(session);
        
        // 定期更新会话信息
        const interval = setInterval(() => {
            if (panel.visible && this.currentSession) {
                panel.webview.html = this.createSessionInfoContent(this.currentSession);
            }
        }, 5000);

        panel.onDidDispose(() => {
            clearInterval(interval);
        });
    }

    // 创建会话信息内容
    private createSessionInfoContent(session: CollaborationSession): string {
        const users = Array.from(session.users.values());
        const activeUsers = users.filter(u => u.isActive);

        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                }
                .session-header {
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 16px;
                    margin-bottom: 20px;
                }
                .user-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .user-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: var(--vscode-textBlockQuote-background);
                    border-radius: 4px;
                }
                .user-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                }
                .user-info {
                    flex: 1;
                }
                .user-status {
                    font-size: 12px;
                    opacity: 0.8;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                    margin-top: 20px;
                }
                .stat-item {
                    text-align: center;
                    padding: 12px;
                    background: var(--vscode-textBlockQuote-background);
                    border-radius: 4px;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--vscode-charts-blue);
                }
                .stat-label {
                    font-size: 12px;
                    opacity: 0.8;
                    margin-top: 4px;
                }
                .online-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--vscode-charts-green);
                }
                .offline-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--vscode-charts-red);
                }
            </style>
        </head>
        <body>
            <div class="session-header">
                <h2>🤝 ${session.name}</h2>
                <p><strong>会话ID:</strong> ${session.id}</p>
                <p><strong>创建时间:</strong> ${new Date(session.createdAt).toLocaleString()}</p>
            </div>
            
            <h3>👥 协作者 (${activeUsers.length}/${session.settings.maxUsers})</h3>
            <div class="user-list">
                ${users.map(user => `
                    <div class="user-item">
                        <div class="user-avatar" style="background-color: ${user.color}">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-info">
                            <div>${user.name} ${user.id === session.host ? '👑' : ''}</div>
                            <div class="user-status">
                                ${user.activeFile ? `正在编辑: ${user.activeFile.split('/').pop()}` : '空闲中'}
                            </div>
                        </div>
                        <div class="${user.isActive ? 'online-indicator' : 'offline-indicator'}"></div>
                    </div>
                `).join('')}
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-value">${activeUsers.length}</div>
                    <div class="stat-label">在线用户</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Math.floor((Date.now() - session.createdAt) / 60000)}</div>
                    <div class="stat-label">会话时长(分钟)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${session.settings.permissions.canEdit ? '✅' : '❌'}</div>
                    <div class="stat-label">编辑权限</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${session.settings.permissions.canChat ? '✅' : '❌'}</div>
                    <div class="stat-label">聊天功能</div>
                </div>
            </div>
        </body>
        </html>`;
    }

    // 工具函数
    private generateSessionId(): string {
        return 'COLLAB-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    private generateUserId(): string {
        return 'USER-' + Math.random().toString(36).substr(2, 8);
    }

    private async getUserName(): Promise<string> {
        const gitConfig = vscode.workspace.getConfiguration('git');
        const userName = gitConfig.get<string>('userName');
        
        if (userName) {
            return userName;
        }

        const input = await vscode.window.showInputBox({
            prompt: '请输入您的用户名',
            placeholder: '用于在协作中显示您的身份'
        });

        return input || '匿名用户';
    }

    private getUserName(userId: string): string {
        if (!this.currentSession) return '未知用户';
        const user = this.currentSession.users.get(userId);
        return user?.name || '未知用户';
    }

    private getRandomColor(): string {
        return this.userColors[Math.floor(Math.random() * this.userColors.length)];
    }

    private getAvailableColor(): string {
        if (!this.currentSession) return this.getRandomColor();
        
        const usedColors = Array.from(this.currentSession.users.values()).map(u => u.color);
        const availableColors = this.userColors.filter(color => !usedColors.includes(color));
        
        return availableColors.length > 0 ? availableColors[0] : this.getRandomColor();
    }

    private findAvailablePort(): number {
        // 简化实现，实际应该检查端口可用性
        return 8080 + Math.floor(Math.random() * 1000);
    }

    private serializeSession(session: CollaborationSession): any {
        return {
            id: session.id,
            name: session.name,
            host: session.host,
            users: Array.from(session.users.entries()),
            createdAt: session.createdAt,
            settings: session.settings
        };
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.currentUser && this.currentSession) {
                this.sendMessage({
                    type: 'presence',
                    userId: this.currentUser.id,
                    sessionId: this.currentSession.id,
                    timestamp: Date.now(),
                    data: {
                        action: 'heartbeat'
                    }
                });
            }
        }, 30000); // 30秒心跳
    }

    private async connectToWebSocket(sessionId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // 这里应该根据实际的服务器地址连接
                // 简化实现，假设本地测试
                const serverUrl = `ws://localhost:8080`;
                this.webSocketClient = new ws.WebSocket(serverUrl);

                this.webSocketClient.on('open', () => {
                    console.log('已连接到协作服务器');
                    resolve();
                });

                this.webSocketClient.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleServerMessage(message);
                    } catch (error) {
                        console.error('消息解析错误:', error);
                    }
                });

                this.webSocketClient.on('error', (error) => {
                    console.error('WebSocket连接错误:', error);
                    reject(error);
                });

                this.webSocketClient.on('close', () => {
                    console.log('与协作服务器断开连接');
                    this.handleDisconnection();
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    private handleServerMessage(message: any): void {
        switch (message.type) {
            case 'welcome':
                this.handleWelcomeMessage(message.data);
                break;
            case 'error':
                vscode.window.showErrorMessage(`协作错误: ${message.data.message}`);
                break;
            default:
                // 处理其他协作消息
                if ('userId' in message && 'sessionId' in message) {
                    this.handleMessage(message as CollaborationMessage, null as any);
                }
        }
    }

    private handleWelcomeMessage(data: any): void {
        // 恢复会话状态
        const sessionData = data.session;
        this.currentSession = {
            id: sessionData.id,
            name: sessionData.name,
            host: sessionData.host,
            users: new Map(sessionData.users),
            createdAt: sessionData.createdAt,
            settings: sessionData.settings
        };

        vscode.window.showInformationMessage(`🎉 成功加入协作会话: ${this.currentSession.name}`);
        this.showSessionInfo(this.currentSession);
        this.updateCollaboratorsList();
    }

    private handleDisconnection(socket?: ws.WebSocket): void {
        // 处理断连逻辑
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                this.attemptReconnect();
            }, 2000 * this.reconnectAttempts);
        } else {
            vscode.window.showErrorMessage('协作连接已断开且重连失败');
        }
    }

    private async attemptReconnect(): Promise<void> {
        if (this.currentSession && this.currentUser) {
            try {
                await this.connectToWebSocket(this.currentSession.id);
                this.reconnectAttempts = 0;
                vscode.window.showInformationMessage('🔄 协作连接已恢复');
            } catch (error) {
                console.error('重连失败:', error);
            }
        }
    }

    private updateCollaboratorsList(): void {
        // 更新状态栏或面板中的协作者列表
        this.emit('collaboratorsUpdated', this.currentSession?.users);
    }

    private showInviteDialog(sessionId: string): void {
        const inviteUrl = `vscode://extension/visual-programming/join/${sessionId}`;
        const inviteText = `🤝 邀请您加入Visual Programming协作会话\n\n会话ID: ${sessionId}\n\n点击链接加入: ${inviteUrl}`;

        vscode.window.showInformationMessage(
            '邀请信息已生成',
            '复制邀请文本',
            '分享会话ID'
        ).then(action => {
            if (action === '复制邀请文本') {
                vscode.env.clipboard.writeText(inviteText);
            } else if (action === '分享会话ID') {
                vscode.env.clipboard.writeText(sessionId);
            }
        });
    }

    private showAnalysisResult(result: any): void {
        // 显示分析结果
        vscode.window.showInformationMessage('查看协作者的分析结果功能正在开发中');
    }

    private showChatMessage(userName: string, text: string, timestamp: number): void {
        const time = new Date(timestamp).toLocaleTimeString();
        vscode.window.showInformationMessage(`💬 ${userName} (${time}): ${text}`);
    }

    // 公共API
    public async leaveSession(): Promise<void> {
        if (!this.currentSession || !this.currentUser) return;

        this.sendMessage({
            type: 'presence',
            userId: this.currentUser.id,
            sessionId: this.currentSession.id,
            timestamp: Date.now(),
            data: {
                action: 'leave'
            }
        });

        // 清理资源
        this.cleanup();

        vscode.window.showInformationMessage('已离开协作会话');
    }

    public async sendChatMessage(text: string): Promise<void> {
        if (!this.currentSession || !this.currentUser) return;
        if (!this.currentSession.settings.permissions.canChat) return;

        this.sendMessage({
            type: 'chat',
            userId: this.currentUser.id,
            sessionId: this.currentSession.id,
            timestamp: Date.now(),
            data: { text }
        });
    }

    public isInSession(): boolean {
        return this.currentSession !== undefined;
    }

    public getCurrentSession(): CollaborationSession | undefined {
        return this.currentSession;
    }

    private cleanup(): void {
        // 清理心跳
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = undefined;
        }

        // 清理装饰
        this.collaborationDecorations.forEach(decoration => decoration.dispose());
        this.collaborationDecorations.clear();

        // 关闭连接
        if (this.webSocketClient) {
            this.webSocketClient.close();
            this.webSocketClient = undefined;
        }

        if (this.webSocketServer) {
            this.webSocketServer.close();
            this.webSocketServer = undefined;
        }

        // 重置状态
        this.currentSession = undefined;
        this.currentUser = undefined;
        this.isHost = false;
        this.reconnectAttempts = 0;
    }

    public dispose(): void {
        this.cleanup();
    }
}

// 导出便捷函数
export function createCollaborationSession(sessionName: string): Promise<string> {
    return RealtimeCollaborationSystem.getInstance().createSession(sessionName);
}

export function joinCollaborationSession(sessionId: string): Promise<void> {
    return RealtimeCollaborationSystem.getInstance().joinSession(sessionId);
}

export function leaveCollaborationSession(): Promise<void> {
    return RealtimeCollaborationSystem.getInstance().leaveSession();
}
