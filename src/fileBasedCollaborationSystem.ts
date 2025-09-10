// 🤝 文件同步协作系统
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
    syncFolder: string;
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

export class FileBasedCollaborationSystem extends EventEmitter {
    private static instance: FileBasedCollaborationSystem;
    private sessions: Map<string, CollaborationSession> = new Map();
    private currentSession?: CollaborationSession;
    private currentUser?: User;
    private isHost: boolean = false;
    private collaborationDecorations: Map<string, vscode.TextEditorDecorationType> = new Map();
    private fileWatcher?: vscode.FileSystemWatcher;
    private heartbeatInterval?: NodeJS.Timeout;

    // 用户颜色池
    private userColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    public static getInstance(): FileBasedCollaborationSystem {
        if (!FileBasedCollaborationSystem.instance) {
            FileBasedCollaborationSystem.instance = new FileBasedCollaborationSystem();
        }
        return FileBasedCollaborationSystem.instance;
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
            
            // 创建同步文件夹
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('需要打开一个工作区才能创建协作会话');
            }

            const syncFolder = path.join(workspaceFolder.uri.fsPath, '.vscode', 'collaboration', sessionId);
            await this.ensureDirectoryExists(syncFolder);

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
                syncFolder,
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

            // 初始化同步
            await this.initializeSync();

            // 开始心跳检测
            this.startHeartbeat();

            // 保存会话信息
            await this.saveSessionInfo(session);

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
                    placeHolder: '例如: COLLAB-ABCD1234'
                });
                if (!input) return;
                sessionId = input;
            }

            const userId = this.generateUserId();
            
            // 查找同步文件夹
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('需要打开一个工作区才能加入协作会话');
            }

            const syncFolder = path.join(workspaceFolder.uri.fsPath, '.vscode', 'collaboration', sessionId);
            
            // 检查会话是否存在
            const sessionInfoPath = path.join(syncFolder, 'session.json');
            if (!fs.existsSync(sessionInfoPath)) {
                throw new Error(`找不到协作会话: ${sessionId}`);
            }

            // 加载会话信息
            const sessionData = JSON.parse(fs.readFileSync(sessionInfoPath, 'utf8'));
            
            // 创建当前用户
            this.currentUser = {
                id: userId,
                name: userName || await this.getUserName(),
                color: this.getRandomColor(),
                lastSeen: Date.now(),
                isActive: true
            };

            // 恢复会话
            this.currentSession = {
                ...sessionData,
                users: new Map(sessionData.users),
                syncFolder
            };

            // 添加当前用户
            if (this.currentSession && this.currentUser) {
                this.currentSession.users.set(userId, this.currentUser);

                // 初始化同步
                await this.initializeSync();

                // 保存用户加入信息
                await this.saveUserPresence('join');

                vscode.window.showInformationMessage(`🤝 成功加入协作会话: ${this.currentSession.name}`);
                await this.showSessionInfo(this.currentSession);
            }

        } catch (error) {
            vscode.window.showErrorMessage(`加入协作会话失败: ${error}`);
            throw error;
        }
    }

    // 初始化同步
    private async initializeSync(): Promise<void> {
        if (!this.currentSession) return;

        const syncFolder = this.currentSession.syncFolder;

        // 创建文件监视器
        const pattern = new vscode.RelativePattern(syncFolder, '**/*');
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        // 监听文件变化
        this.fileWatcher.onDidChange(uri => this.handleFileChange(uri));
        this.fileWatcher.onDidCreate(uri => this.handleFileCreate(uri));
        this.fileWatcher.onDidDelete(uri => this.handleFileDelete(uri));

        // 创建必要的目录结构
        await this.ensureDirectoryExists(path.join(syncFolder, 'users'));
        await this.ensureDirectoryExists(path.join(syncFolder, 'messages'));
        await this.ensureDirectoryExists(path.join(syncFolder, 'cursors'));
    }

    // 处理文件变化
    private async handleFileChange(uri: vscode.Uri): Promise<void> {
        if (!this.currentSession || !this.currentUser) return;

        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);

        // 处理不同类型的文件
        if (fileName.startsWith('user-') && fileName.endsWith('.json')) {
            await this.handleUserUpdate(filePath);
        } else if (fileName.startsWith('msg-') && fileName.endsWith('.json')) {
            await this.handleMessageUpdate(filePath);
        } else if (fileName.startsWith('cursor-') && fileName.endsWith('.json')) {
            await this.handleCursorUpdate(filePath);
        }
    }

    private async handleFileCreate(uri: vscode.Uri): Promise<void> {
        await this.handleFileChange(uri);
    }

    private async handleFileDelete(uri: vscode.Uri): Promise<void> {
        // 处理用户离开等情况
        const fileName = path.basename(uri.fsPath);
        if (fileName.startsWith('user-') && fileName.endsWith('.json')) {
            const userId = fileName.replace('user-', '').replace('.json', '');
            if (this.currentSession && userId !== this.currentUser?.id) {
                this.currentSession.users.delete(userId);
                this.removeUserDecorations(userId);
                this.updateCollaboratorsList();
            }
        }
    }

    // 处理用户更新
    private async handleUserUpdate(filePath: string): Promise<void> {
        try {
            const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (this.currentSession && userData.id !== this.currentUser?.id) {
                this.currentSession.users.set(userData.id, userData);
                this.updateUserDecorations(userData);
                this.updateCollaboratorsList();
            }
        } catch (error) {
            console.error('处理用户更新失败:', error);
        }
    }

    // 处理消息更新
    private async handleMessageUpdate(filePath: string): Promise<void> {
        try {
            const messageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (messageData.userId !== this.currentUser?.id) {
                await this.processCollaborationMessage(messageData);
            }
        } catch (error) {
            console.error('处理消息更新失败:', error);
        }
    }

    // 处理光标更新
    private async handleCursorUpdate(filePath: string): Promise<void> {
        try {
            const cursorData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (cursorData.userId !== this.currentUser?.id && this.currentSession) {
                const user = this.currentSession.users.get(cursorData.userId);
                if (user) {
                    user.cursor = cursorData.cursor;
                    user.activeFile = cursorData.activeFile;
                    user.lastSeen = Date.now();
                    this.updateCursorDecoration(user);
                }
            }
        } catch (error) {
            console.error('处理光标更新失败:', error);
        }
    }

    // 处理协作消息
    private async processCollaborationMessage(message: CollaborationMessage): Promise<void> {
        switch (message.type) {
            case 'analysis':
                const { type, result } = message.data;
                vscode.window.showInformationMessage(
                    `📊 ${this.getUserDisplayName(message.userId)} 完成了 ${type} 分析`,
                    '查看结果'
                ).then(action => {
                    if (action === '查看结果') {
                        this.showAnalysisResult(result);
                    }
                });
                break;

            case 'chat':
                const userName = this.getUserDisplayName(message.userId);
                const { text } = message.data;
                this.showChatMessage(userName, text, message.timestamp);
                break;
        }
    }

    // 保存用户在线状态
    private async saveUserPresence(action: 'join' | 'leave' | 'update'): Promise<void> {
        if (!this.currentSession || !this.currentUser) return;

        const userFile = path.join(this.currentSession.syncFolder, 'users', `user-${this.currentUser.id}.json`);
        
        if (action === 'leave') {
            if (fs.existsSync(userFile)) {
                fs.unlinkSync(userFile);
            }
        } else {
            this.currentUser.lastSeen = Date.now();
            fs.writeFileSync(userFile, JSON.stringify(this.currentUser, null, 2));
        }
    }

    // 保存会话信息
    private async saveSessionInfo(session: CollaborationSession): Promise<void> {
        const sessionFile = path.join(session.syncFolder, 'session.json');
        const sessionData = {
            ...session,
            users: Array.from(session.users.entries())
        };
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    }

    // 发送协作消息
    public async sendCollaborationMessage(message: Omit<CollaborationMessage, 'timestamp'>): Promise<void> {
        if (!this.currentSession) return;

        const fullMessage: CollaborationMessage = {
            ...message,
            timestamp: Date.now()
        };

        const messageFile = path.join(
            this.currentSession.syncFolder,
            'messages',
            `msg-${Date.now()}-${Math.random().toString(36).substr(2, 8)}.json`
        );

        fs.writeFileSync(messageFile, JSON.stringify(fullMessage, null, 2));
    }

    // 更新光标位置
    public async updateCursorPosition(cursor: vscode.Position, activeFile: string): Promise<void> {
        if (!this.currentSession || !this.currentUser) return;

        const cursorData = {
            userId: this.currentUser.id,
            cursor: { line: cursor.line, character: cursor.character },
            activeFile,
            timestamp: Date.now()
        };

        const cursorFile = path.join(
            this.currentSession.syncFolder,
            'cursors',
            `cursor-${this.currentUser.id}.json`
        );

        fs.writeFileSync(cursorFile, JSON.stringify(cursorData, null, 2));
    }

    // 更新用户装饰
    private updateUserDecorations(user: User): void {
        this.updateCursorDecoration(user);
        if (user.selection) {
            this.updateSelectionDecoration(user);
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
                border: `2px solid ${user.color}`,
                after: {
                    contentText: ` ${user.name}`,
                    color: user.color,
                    fontWeight: 'bold'
                }
            });
            this.collaborationDecorations.set(`cursor-${user.id}`, decorationType);
        }

        // 应用装饰
        const position = new vscode.Position(user.cursor.line, user.cursor.character);
        const range = new vscode.Range(position, position);
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

    // 设置事件监听器
    private setupEventListeners(): void {
        // 监听光标位置变化
        vscode.window.onDidChangeTextEditorSelection(event => {
            if (!this.currentSession || !this.currentUser) return;

            const cursor = event.textEditor.selection.active;
            const activeFile = event.textEditor.document.fileName;

            this.updateCursorPosition(cursor, activeFile);

            if (!event.textEditor.selection.isEmpty) {
                this.currentUser.selection = event.textEditor.selection;
                this.saveUserPresence('update');
            }
        });

        // 监听文档变化
        vscode.workspace.onDidChangeTextDocument(event => {
            if (!this.currentSession || !this.currentUser) return;
            if (!this.currentSession.settings.permissions.canEdit) return;

            // 简化处理：只记录编辑活动
            this.currentUser.lastSeen = Date.now();
            this.saveUserPresence('update');
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
        const activeUsers = users.filter(u => Date.now() - u.lastSeen < 60000); // 1分钟内活跃

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
                <p><strong>同步文件夹:</strong> ${session.syncFolder}</p>
            </div>
            
            <h3>👥 协作者 (${activeUsers.length}/${session.settings.maxUsers})</h3>
            <div class="user-list">
                ${users.map(user => {
                    const isActive = Date.now() - user.lastSeen < 60000;
                    return `
                    <div class="user-item">
                        <div class="user-avatar" style="background-color: ${user.color}">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-info">
                            <div>${user.name} ${user.id === session.host ? '👑' : ''}</div>
                            <div class="user-status">
                                ${user.activeFile ? `正在编辑: ${path.basename(user.activeFile)}` : '空闲中'}
                            </div>
                        </div>
                        <div class="${isActive ? 'online-indicator' : 'offline-indicator'}"></div>
                    </div>
                `;
                }).join('')}
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-value">${activeUsers.length}</div>
                    <div class="stat-label">活跃用户</div>
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
            placeHolder: '用于在协作中显示您的身份'
        });

        return input || '匿名用户';
    }

    private getUserDisplayName(userId: string): string {
        if (!this.currentSession) return '未知用户';
        const user = this.currentSession.users.get(userId);
        return user?.name || '未知用户';
    }

    private getRandomColor(): string {
        return this.userColors[Math.floor(Math.random() * this.userColors.length)];
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.currentUser && this.currentSession) {
                this.saveUserPresence('update');
            }
        }, 30000); // 30秒心跳
    }

    private showInviteDialog(sessionId: string): void {
        const inviteText = `🤝 邀请您加入Visual Programming协作会话

会话名称: ${this.currentSession?.name}
会话ID: ${sessionId}

加入方式:
1. 在VS Code中打开命令面板 (Ctrl+Shift+P)
2. 输入 "Visual Programming: 加入协作会话"
3. 粘贴会话ID: ${sessionId}`;

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
        vscode.window.showInformationMessage('查看协作者的分析结果功能正在开发中');
    }

    private showChatMessage(userName: string, text: string, timestamp: number): void {
        const time = new Date(timestamp).toLocaleTimeString();
        vscode.window.showInformationMessage(`💬 ${userName} (${time}): ${text}`);
    }

    private updateCollaboratorsList(): void {
        this.emit('collaboratorsUpdated', this.currentSession?.users);
    }

    // 公共API
    public async leaveSession(): Promise<void> {
        if (!this.currentSession || !this.currentUser) return;

        await this.saveUserPresence('leave');
        this.cleanup();

        vscode.window.showInformationMessage('已离开协作会话');
    }

    public async sendChatMessage(text: string): Promise<void> {
        if (!this.currentSession || !this.currentUser) return;
        if (!this.currentSession.settings.permissions.canChat) return;

        await this.sendCollaborationMessage({
            type: 'chat',
            userId: this.currentUser.id,
            sessionId: this.currentSession.id,
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

        // 关闭文件监视器
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }

        // 重置状态
        this.currentSession = undefined;
        this.currentUser = undefined;
        this.isHost = false;
    }

    public dispose(): void {
        this.cleanup();
    }
}

// 导出便捷函数
export function createCollaborationSession(sessionName: string): Promise<string> {
    return FileBasedCollaborationSystem.getInstance().createSession(sessionName);
}

export function joinCollaborationSession(sessionId: string): Promise<void> {
    return FileBasedCollaborationSystem.getInstance().joinSession(sessionId);
}

export function leaveCollaborationSession(): Promise<void> {
    return FileBasedCollaborationSystem.getInstance().leaveSession();
}
