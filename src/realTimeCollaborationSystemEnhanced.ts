// 🤝 实时协作系统增强版
import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import * as diff from 'diff';

export interface CollaborationSession {
    id: string;
    name: string;
    participants: Participant[];
    sharedState: SharedState;
    permissions: CollaborationPermissions;
}

export interface Participant {
    id: string;
    name: string;
    avatar?: string;
    role: 'owner' | 'editor' | 'viewer';
    cursor?: CursorPosition;
    color: string;
}

export interface SharedState {
    visualNodes: any[];
    codeAnalysis: any;
    activeFile: string;
    selections: { [participantId: string]: vscode.Range };
}

export interface CursorPosition {
    file: string;
    line: number;
    column: number;
    timestamp: number;
}

export interface CollaborationPermissions {
    allowEdit: boolean;
    allowComment: boolean;
    allowShare: boolean;
    restrictedFiles?: string[];
}

export class RealTimeCollaborationSystem {
    private static instance: RealTimeCollaborationSystem;
    private currentSession: CollaborationSession | null = null;
    private websocket: WebSocket | null = null;
    private participants: Map<string, Participant> = new Map();
    private outputChannel: vscode.OutputChannel;
    
    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Real-Time Collaboration');
    }
    
    public static getInstance(): RealTimeCollaborationSystem {
        if (!RealTimeCollaborationSystem.instance) {
            RealTimeCollaborationSystem.instance = new RealTimeCollaborationSystem();
        }
        return RealTimeCollaborationSystem.instance;
    }
    
    // 🌐 创建协作会话
    public async createSession(sessionName: string): Promise<string> {
        const sessionId = this.generateSessionId();
        
        try {
            // 连接到协作服务器
            await this.connectToServer();
            
            const session: CollaborationSession = {
                id: sessionId,
                name: sessionName,
                participants: [{
                    id: this.getCurrentUserId(),
                    name: this.getCurrentUserName(),
                    role: 'owner',
                    color: this.generateUserColor()
                }],
                sharedState: {
                    visualNodes: [],
                    codeAnalysis: null,
                    activeFile: '',
                    selections: {}
                },
                permissions: {
                    allowEdit: true,
                    allowComment: true,
                    allowShare: true
                }
            };
            
            this.currentSession = session;
            
            // 发送会话创建消息
            this.sendMessage({
                type: 'session:create',
                sessionId,
                session
            });
            
            this.outputChannel.appendLine(`✅ 协作会话创建成功: ${sessionId}`);
            
            // 启动状态同步
            this.startStateSynchronization();
            
            return sessionId;
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ 创建协作会话失败: ${error}`);
            throw error;
        }
    }
    
    // 🔗 加入协作会话
    public async joinSession(sessionId: string): Promise<void> {
        try {
            await this.connectToServer();
            
            // 发送加入请求
            this.sendMessage({
                type: 'session:join',
                sessionId,
                participant: {
                    id: this.getCurrentUserId(),
                    name: this.getCurrentUserName(),
                    role: 'editor',
                    color: this.generateUserColor()
                }
            });
            
            this.outputChannel.appendLine(`🤝 正在加入协作会话: ${sessionId}`);
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ 加入协作会话失败: ${error}`);
            throw error;
        }
    }
    
    // 📤 同步可视化状态
    public syncVisualState(nodes: any[], connections: any[]): void {
        if (!this.currentSession || !this.websocket) return;
        
        this.currentSession.sharedState.visualNodes = nodes;
        
        this.sendMessage({
            type: 'state:visual',
            sessionId: this.currentSession.id,
            nodes,
            connections,
            timestamp: Date.now()
        });
    }
    
    // 📝 同步代码选择
    public syncSelection(selection: vscode.Range, document: vscode.TextDocument): void {
        if (!this.currentSession || !this.websocket) return;
        
        const userId = this.getCurrentUserId();
        this.currentSession.sharedState.selections[userId] = selection;
        
        this.sendMessage({
            type: 'state:selection',
            sessionId: this.currentSession.id,
            userId,
            selection: {
                start: { line: selection.start.line, character: selection.start.character },
                end: { line: selection.end.line, character: selection.end.character }
            },
            file: document.fileName,
            timestamp: Date.now()
        });
    }
    
    // 💬 发送聊天消息
    public sendChatMessage(message: string): void {
        if (!this.currentSession || !this.websocket) return;
        
        this.sendMessage({
            type: 'chat:message',
            sessionId: this.currentSession.id,
            userId: this.getCurrentUserId(),
            userName: this.getCurrentUserName(),
            message,
            timestamp: Date.now()
        });
    }
    
    // 📍 显示参与者光标
    public showParticipantCursors(): void {
        if (!this.currentSession) return;
        
        for (const participant of this.currentSession.participants) {
            if (participant.id !== this.getCurrentUserId() && participant.cursor) {
                this.renderParticipantCursor(participant);
            }
        }
    }
    
    // 🔄 处理传入消息
    private handleIncomingMessage(message: any): void {
        switch (message.type) {
            case 'session:joined':
                this.handleParticipantJoined(message);
                break;
            case 'session:left':
                this.handleParticipantLeft(message);
                break;
            case 'state:visual':
                this.handleVisualStateUpdate(message);
                break;
            case 'state:selection':
                this.handleSelectionUpdate(message);
                break;
            case 'state:cursor':
                this.handleCursorUpdate(message);
                break;
            case 'chat:message':
                this.handleChatMessage(message);
                break;
            case 'conflict:detected':
                this.handleConflict(message);
                break;
        }
    }
    
    // 👥 处理参与者加入
    private handleParticipantJoined(message: any): void {
        if (!this.currentSession) return;
        
        const participant = message.participant;
        this.currentSession.participants.push(participant);
        this.participants.set(participant.id, participant);
        
        vscode.window.showInformationMessage(`🤝 ${participant.name} 加入了协作会话`);
        this.outputChannel.appendLine(`👥 参与者加入: ${participant.name} (${participant.id})`);
        
        // 更新UI显示参与者列表
        this.updateParticipantsList();
    }
    
    // 👋 处理参与者离开
    private handleParticipantLeft(message: any): void {
        if (!this.currentSession) return;
        
        const participantId = message.participantId;
        const participant = this.participants.get(participantId);
        
        if (participant) {
            this.currentSession.participants = this.currentSession.participants.filter(p => p.id !== participantId);
            this.participants.delete(participantId);
            
            vscode.window.showInformationMessage(`👋 ${participant.name} 离开了协作会话`);
            this.outputChannel.appendLine(`👥 参与者离开: ${participant.name} (${participantId})`);
            
            // 清除该参与者的光标和选择
            this.clearParticipantCursor(participantId);
            this.updateParticipantsList();
        }
    }
    
    // 🎨 处理可视化状态更新
    private handleVisualStateUpdate(message: any): void {
        if (!this.currentSession) return;
        
        this.currentSession.sharedState.visualNodes = message.nodes;
        
        // 通知可视化面板更新
        vscode.commands.executeCommand('visualProgramming.updateSharedState', {
            nodes: message.nodes,
            connections: message.connections
        });
        
        this.outputChannel.appendLine(`🎨 可视化状态已同步 (${message.nodes.length} 个节点)`);
    }
    
    // 📍 处理选择更新
    private handleSelectionUpdate(message: any): void {
        if (!this.currentSession) return;
        
        const participant = this.participants.get(message.userId);
        if (!participant) return;
        
        // 在编辑器中显示其他参与者的选择
        this.showParticipantSelection(participant, message.selection, message.file);
    }
    
    // 🖱️ 处理光标更新
    private handleCursorUpdate(message: any): void {
        const participant = this.participants.get(message.userId);
        if (!participant) return;
        
        participant.cursor = {
            file: message.file,
            line: message.line,
            column: message.column,
            timestamp: message.timestamp
        };
        
        this.renderParticipantCursor(participant);
    }
    
    // 💬 处理聊天消息
    private handleChatMessage(message: any): void {
        const chatPanel = this.getChatPanel();
        if (chatPanel) {
            chatPanel.appendMessage({
                userId: message.userId,
                userName: message.userName,
                message: message.message,
                timestamp: new Date(message.timestamp)
            });
        }
        
        // 显示通知
        if (message.userId !== this.getCurrentUserId()) {
            vscode.window.showInformationMessage(`💬 ${message.userName}: ${message.message}`);
        }
    }
    
    // ⚡ 处理冲突
    private handleConflict(message: any): void {
        vscode.window.showWarningMessage(
            `⚡ 检测到协作冲突: ${message.description}`,
            '解决冲突',
            '忽略'
        ).then(choice => {
            if (choice === '解决冲突') {
                this.showConflictResolutionDialog(message);
            }
        });
    }
    
    // 🔧 辅助方法
    private async connectToServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // 实际项目中应该使用配置的服务器地址
                const serverUrl = 'ws://localhost:8080/collaboration';
                this.websocket = new WebSocket(serverUrl);
                
                this.websocket.onopen = () => {
                    this.outputChannel.appendLine('🌐 已连接到协作服务器');
                    resolve();
                };
                
                this.websocket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data.toString());
                        this.handleIncomingMessage(message);
                    } catch (error) {
                        this.outputChannel.appendLine(`❌ 消息解析失败: ${error}`);
                    }
                };
                
                this.websocket.onerror = (error) => {
                    this.outputChannel.appendLine(`❌ WebSocket错误: ${error}`);
                    reject(error);
                };
                
                this.websocket.onclose = () => {
                    this.outputChannel.appendLine('🔌 与协作服务器断开连接');
                    this.websocket = null;
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    private sendMessage(message: any): void {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        } else {
            this.outputChannel.appendLine('❌ WebSocket未连接，无法发送消息');
        }
    }
    
    private generateSessionId(): string {
        return 'COLLAB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    private getCurrentUserId(): string {
        // 实际项目中应该从用户设置或认证系统获取
        return vscode.env.machineId;
    }
    
    private getCurrentUserName(): string {
        // 实际项目中应该从用户设置获取
        return process.env.USERNAME || 'Anonymous';
    }
    
    private generateUserColor(): string {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    private startStateSynchronization(): void {
        // 监听编辑器变化
        vscode.window.onDidChangeTextEditorSelection((event) => {
            if (event.selections.length > 0) {
                this.syncSelection(event.selections[0], event.textEditor.document);
            }
        });
        
        // 监听光标位置变化
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && this.websocket) {
                this.sendMessage({
                    type: 'state:cursor',
                    sessionId: this.currentSession?.id,
                    userId: this.getCurrentUserId(),
                    file: editor.document.fileName,
                    line: editor.selection.active.line,
                    column: editor.selection.active.character,
                    timestamp: Date.now()
                });
            }
        });
    }
    
    private renderParticipantCursor(participant: Participant): void {
        // 实现参与者光标渲染逻辑
        // 这里需要使用VS Code的装饰API
        if (!participant.cursor) return;
        
        const decoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: participant.color,
            borderRadius: '2px',
            border: `1px solid ${participant.color}`,
            after: {
                contentText: ` ${participant.name}`,
                backgroundColor: participant.color,
                color: 'white',
                fontWeight: 'bold'
            }
        });
        
        // 应用装饰到对应位置
        const editor = vscode.window.visibleTextEditors.find(e => 
            e.document.fileName.endsWith(participant.cursor!.file)
        );
        
        if (editor) {
            const range = new vscode.Range(
                participant.cursor!.line, 
                participant.cursor!.column,
                participant.cursor!.line, 
                participant.cursor!.column + 1
            );
            
            editor.setDecorations(decoration, [range]);
            
            // 清理装饰（5秒后）
            setTimeout(() => {
                decoration.dispose();
            }, 5000);
        }
    }
    
    private showParticipantSelection(participant: Participant, selection: any, file: string): void {
        const editor = vscode.window.visibleTextEditors.find(e => 
            e.document.fileName.endsWith(file)
        );
        
        if (editor) {
            const decoration = vscode.window.createTextEditorDecorationType({
                backgroundColor: participant.color + '20', // 20% opacity
                border: `1px solid ${participant.color}`
            });
            
            const range = new vscode.Range(
                selection.start.line, selection.start.character,
                selection.end.line, selection.end.character
            );
            
            editor.setDecorations(decoration, [range]);
            
            // 清理装饰（3秒后）
            setTimeout(() => {
                decoration.dispose();
            }, 3000);
        }
    }
    
    private clearParticipantCursor(participantId: string): void {
        // 清理指定参与者的光标和选择装饰
        // 实现细节...
    }
    
    private updateParticipantsList(): void {
        // 更新参与者列表UI
        // 实现细节...
    }
    
    private getChatPanel(): any {
        // 获取或创建聊天面板
        // 实现细节...
        return null;
    }
    
    private showConflictResolutionDialog(conflict: any): void {
        // 显示冲突解决对话框
        vscode.window.showQuickPick([
            '接受远程更改',
            '保留本地更改',
            '手动合并'
        ], {
            placeHolder: '选择冲突解决方式'
        }).then(choice => {
            // 处理选择结果
            this.resolveConflict(conflict, choice);
        });
    }
    
    private resolveConflict(conflict: any, resolution: string | undefined): void {
        if (!resolution) return;
        
        this.sendMessage({
            type: 'conflict:resolve',
            sessionId: this.currentSession?.id,
            conflictId: conflict.id,
            resolution
        });
    }
    
    // 🚪 离开会话
    public async leaveSession(): Promise<void> {
        if (!this.currentSession || !this.websocket) return;
        
        this.sendMessage({
            type: 'session:leave',
            sessionId: this.currentSession.id,
            participantId: this.getCurrentUserId()
        });
        
        this.websocket.close();
        this.currentSession = null;
        this.participants.clear();
        
        this.outputChannel.appendLine('👋 已离开协作会话');
    }
    
    // 📊 获取会话状态
    public getSessionInfo(): CollaborationSession | null {
        return this.currentSession;
    }
    
    public isInSession(): boolean {
        return this.currentSession !== null && this.websocket !== null;
    }
}

// 导出单例实例
export const realTimeCollaborationSystem = RealTimeCollaborationSystem.getInstance();
