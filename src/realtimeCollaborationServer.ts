// 实时协作WebSocket服务器
import * as vscode from 'vscode';
import * as http from 'http';
import * as WebSocket from 'ws';

export interface CollaborationMessage {
    type: 'node-update' | 'connection-create' | 'connection-delete' | 'user-cursor' | 'user-join' | 'user-leave' | 'graph-update';
    userId: string;
    timestamp: number;
    data: any;
}

export interface CollaborationUser {
    id: string;
    name: string;
    color: string;
    cursor?: { x: number; y: number };
    lastSeen: number;
}

export interface CollaborationSession {
    id: string;
    users: Map<string, CollaborationUser>;
    graph: any; // BlueprintGraph
    lastModified: number;
}

export class RealTimeCollaborationServer {
    private server: http.Server | null = null;
    private wss: WebSocket.Server | null = null;
    private sessions: Map<string, CollaborationSession> = new Map();
    private userConnections: Map<string, WebSocket> = new Map();
    private port: number = 8090;

    constructor() {
        this.setupServer();
    }

    // 🚀 启动WebSocket服务器
    public async startServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server = http.createServer();
                this.wss = new WebSocket.Server({ server: this.server });

                this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
                    this.handleConnection(ws, req);
                });

                this.server.listen(this.port, () => {
                    vscode.window.showInformationMessage(`🔄 实时协作服务器已启动，端口: ${this.port}`);
                    resolve();
                });

                this.server.on('error', (error) => {
                    vscode.window.showErrorMessage(`协作服务器启动失败: ${error.message}`);
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    // 🛑 停止服务器
    public stopServer(): void {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        this.sessions.clear();
        this.userConnections.clear();
    }

    // 🔗 处理WebSocket连接
    private handleConnection(ws: WebSocket, req: http.IncomingMessage): void {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const sessionId = url.searchParams.get('session') || 'default';
        const userId = url.searchParams.get('user') || this.generateUserId();
        const userName = url.searchParams.get('name') || `User-${userId.slice(0, 6)}`;

        // 注册用户连接
        this.userConnections.set(userId, ws);

        // 创建或加入会话
        this.joinSession(sessionId, userId, userName);

        // 发送初始化数据
        this.sendToUser(userId, {
            type: 'session-init',
            data: {
                sessionId,
                userId,
                graph: this.sessions.get(sessionId)?.graph,
                users: Array.from(this.sessions.get(sessionId)?.users.values() || [])
            }
        });

        // 监听消息
        ws.on('message', (data: WebSocket.Data) => {
            try {
                const message: CollaborationMessage = JSON.parse(data.toString());
                this.handleMessage(sessionId, userId, message);
            } catch (error) {
                console.error('Invalid message format:', error);
            }
        });

        // 处理断开连接
        ws.on('close', () => {
            this.leaveSession(sessionId, userId);
            this.userConnections.delete(userId);
        });

        // 处理错误
        ws.on('error', (error) => {
            console.error('WebSocket error for user', userId, ':', error);
        });
    }

    // 📝 处理协作消息
    private handleMessage(sessionId: string, userId: string, message: CollaborationMessage): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        switch (message.type) {
            case 'node-update':
                this.handleNodeUpdate(sessionId, userId, message.data);
                break;
            case 'connection-create':
                this.handleConnectionCreate(sessionId, userId, message.data);
                break;
            case 'connection-delete':
                this.handleConnectionDelete(sessionId, userId, message.data);
                break;
            case 'user-cursor':
                this.handleUserCursor(sessionId, userId, message.data);
                break;
            case 'graph-update':
                this.handleGraphUpdate(sessionId, userId, message.data);
                break;
        }
    }

    // 🔄 处理节点更新
    private handleNodeUpdate(sessionId: string, userId: string, nodeData: any): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // 更新会话中的图表数据
        if (session.graph && session.graph.nodes) {
            const nodeIndex = session.graph.nodes.findIndex((n: any) => n.id === nodeData.id);
            if (nodeIndex >= 0) {
                session.graph.nodes[nodeIndex] = { ...session.graph.nodes[nodeIndex], ...nodeData };
            } else {
                session.graph.nodes.push(nodeData);
            }
        }

        session.lastModified = Date.now();

        // 广播更新给其他用户
        this.broadcastToSession(sessionId, userId, {
            type: 'node-update',
            userId,
            timestamp: Date.now(),
            data: nodeData
        });
    }

    // 🔗 处理连接创建
    private handleConnectionCreate(sessionId: string, userId: string, connectionData: any): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // 添加连接到图表
        if (session.graph && session.graph.connections) {
            session.graph.connections.push(connectionData);
        }

        session.lastModified = Date.now();

        // 广播给其他用户
        this.broadcastToSession(sessionId, userId, {
            type: 'connection-create',
            userId,
            timestamp: Date.now(),
            data: connectionData
        });
    }

    // 🗑️ 处理连接删除
    private handleConnectionDelete(sessionId: string, userId: string, connectionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // 从图表中删除连接
        if (session.graph && session.graph.connections) {
            session.graph.connections = session.graph.connections.filter((c: any) => c.id !== connectionId);
        }

        session.lastModified = Date.now();

        // 广播给其他用户
        this.broadcastToSession(sessionId, userId, {
            type: 'connection-delete',
            userId,
            timestamp: Date.now(),
            data: { connectionId }
        });
    }

    // 🖱️ 处理用户光标
    private handleUserCursor(sessionId: string, userId: string, cursorData: { x: number; y: number }): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const user = session.users.get(userId);
        if (user) {
            user.cursor = cursorData;
            user.lastSeen = Date.now();
        }

        // 广播光标位置给其他用户
        this.broadcastToSession(sessionId, userId, {
            type: 'user-cursor',
            userId,
            timestamp: Date.now(),
            data: { userId, cursor: cursorData }
        });
    }

    // 📊 处理图表更新
    private handleGraphUpdate(sessionId: string, userId: string, graphData: any): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.graph = graphData;
        session.lastModified = Date.now();

        // 广播完整图表更新
        this.broadcastToSession(sessionId, userId, {
            type: 'graph-update',
            userId,
            timestamp: Date.now(),
            data: graphData
        });
    }

    // 👥 加入会话
    private joinSession(sessionId: string, userId: string, userName: string): void {
        let session = this.sessions.get(sessionId);
        
        if (!session) {
            session = {
                id: sessionId,
                users: new Map(),
                graph: { nodes: [], connections: [] },
                lastModified: Date.now()
            };
            this.sessions.set(sessionId, session);
        }

        const user: CollaborationUser = {
            id: userId,
            name: userName,
            color: this.generateUserColor(userId),
            lastSeen: Date.now()
        };

        session.users.set(userId, user);

        // 通知其他用户有新用户加入
        this.broadcastToSession(sessionId, userId, {
            type: 'user-join',
            userId,
            timestamp: Date.now(),
            data: user
        });
    }

    // 👋 离开会话
    private leaveSession(sessionId: string, userId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.users.delete(userId);

        // 通知其他用户有用户离开
        this.broadcastToSession(sessionId, userId, {
            type: 'user-leave',
            userId,
            timestamp: Date.now(),
            data: { userId }
        });

        // 如果会话没有用户了，清理会话
        if (session.users.size === 0) {
            this.sessions.delete(sessionId);
        }
    }

    // 📡 广播消息给会话中的其他用户
    private broadcastToSession(sessionId: string, excludeUserId: string, message: any): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.users.forEach((user, userId) => {
            if (userId !== excludeUserId) {
                this.sendToUser(userId, message);
            }
        });
    }

    // 📤 发送消息给特定用户
    private sendToUser(userId: string, message: any): void {
        const ws = this.userConnections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send message to user', userId, ':', error);
            }
        }
    }

    // 🎨 生成用户颜色
    private generateUserColor(userId: string): string {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        
        const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    }

    // 🔑 生成用户ID
    private generateUserId(): string {
        return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }

    // 🏗️ 设置服务器
    private setupServer(): void {
        // 定期清理非活跃用户
        setInterval(() => {
            this.cleanupInactiveUsers();
        }, 30000); // 每30秒清理一次
    }

    // 🧹 清理非活跃用户
    private cleanupInactiveUsers(): void {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5分钟超时

        this.sessions.forEach((session, sessionId) => {
            const usersToRemove: string[] = [];
            
            session.users.forEach((user, userId) => {
                if (now - user.lastSeen > timeout) {
                    usersToRemove.push(userId);
                }
            });

            usersToRemove.forEach(userId => {
                this.leaveSession(sessionId, userId);
                this.userConnections.delete(userId);
            });
        });
    }

    // 📊 获取服务器状态
    public getServerStatus(): {
        isRunning: boolean;
        port: number;
        sessionsCount: number;
        usersCount: number;
    } {
        const usersCount = Array.from(this.sessions.values())
            .reduce((total, session) => total + session.users.size, 0);

        return {
            isRunning: this.server !== null,
            port: this.port,
            sessionsCount: this.sessions.size,
            usersCount
        };
    }

    // 📈 获取会话统计
    public getSessionStats(sessionId: string): {
        userCount: number;
        nodeCount: number;
        connectionCount: number;
        lastModified: number;
    } | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        return {
            userCount: session.users.size,
            nodeCount: session.graph?.nodes?.length || 0,
            connectionCount: session.graph?.connections?.length || 0,
            lastModified: session.lastModified
        };
    }
}
