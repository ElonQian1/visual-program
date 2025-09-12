import * as vscode from 'vscode';
import * as crypto from 'crypto';

// 智能分析结果缓存系统
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    fileHash: string;
    fileSize: number;
    lastModified: number;
}

export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
}

export class IntelligentAnalysisCache {
    private cache = new Map<string, CacheEntry<any>>();
    private hitCount = 0;
    private missCount = 0;
    private readonly maxSize = 50; // 最大缓存条目数
    private readonly maxAge = 5 * 60 * 1000; // 5分钟过期

    // 生成文件缓存键
    private generateCacheKey(filePath: string, analysisType: string): string {
        return `${analysisType}:${filePath}`;
    }

    // 生成文件哈希
    private generateFileHash(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    // 检查缓存是否有效
    private isValidCache(entry: CacheEntry<any>, currentHash: string, currentModified: number): boolean {
        const now = Date.now();
        return (
            entry.fileHash === currentHash &&
            entry.lastModified === currentModified &&
            (now - entry.timestamp) < this.maxAge
        );
    }

    // 获取缓存
    async get<T>(
        filePath: string,
        analysisType: string,
        fileContent: string,
        fileStats: vscode.FileStat
    ): Promise<T | null> {
        const cacheKey = this.generateCacheKey(filePath, analysisType);
        const entry = this.cache.get(cacheKey);
        
        if (!entry) {
            this.missCount++;
            return null;
        }

        const currentHash = this.generateFileHash(fileContent);
        const currentModified = fileStats.mtime;

        if (this.isValidCache(entry, currentHash, currentModified)) {
            this.hitCount++;
            // 更新访问时间
            entry.timestamp = Date.now();
            return entry.data as T;
        } else {
            // 缓存过期，删除
            this.cache.delete(cacheKey);
            this.missCount++;
            return null;
        }
    }

    // 设置缓存
    async set<T>(
        filePath: string,
        analysisType: string,
        data: T,
        fileContent: string,
        fileStats: vscode.FileStat
    ): Promise<void> {
        const cacheKey = this.generateCacheKey(filePath, analysisType);
        const fileHash = this.generateFileHash(fileContent);
        
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            fileHash,
            fileSize: fileStats.size,
            lastModified: fileStats.mtime
        };

        this.cache.set(cacheKey, entry);
        
        // 检查缓存大小限制
        if (this.cache.size > this.maxSize) {
            this.evictOldest();
        }
    }

    // 移除最旧的缓存条目
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    // 清理过期缓存
    cleanupExpired(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if ((now - entry.timestamp) > this.maxAge) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.cache.delete(key));
    }

    // 获取缓存统计
    getStats(): CacheStats {
        const entries = Array.from(this.cache.values());
        const totalRequests = this.hitCount + this.missCount;
        const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

        return {
            totalEntries: this.cache.size,
            totalSize: entries.reduce((sum, entry) => sum + entry.fileSize, 0),
            hitRate: Math.round(hitRate * 100) / 100,
            oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
            newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
        };
    }

    // 清空缓存
    clear(): void {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    // 删除特定文件的所有缓存
    invalidateFile(filePath: string): void {
        const keysToDelete: string[] = [];
        
        for (const key of this.cache.keys()) {
            if (key.includes(filePath)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
    }
}

// 全局缓存实例
export const analysisCache = new IntelligentAnalysisCache();

// 缓存装饰器
export function cached(analysisType: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (fileContent: string, fileName: string, ...args: any[]) {
            try {
                // 尝试获取文件状态
                const fileUri = vscode.Uri.file(fileName);
                const fileStats = await vscode.workspace.fs.stat(fileUri);
                
                // 检查缓存
                const cachedResult = await analysisCache.get(
                    fileName,
                    analysisType,
                    fileContent,
                    fileStats
                );

                if (cachedResult !== null) {
                    return cachedResult;
                }

                // 执行实际分析
                const result = await method.call(this, fileContent, fileName, ...args);
                
                // 保存到缓存
                await analysisCache.set(
                    fileName,
                    analysisType,
                    result,
                    fileContent,
                    fileStats
                );

                return result;
            } catch (error) {
                // 如果缓存失败，直接执行分析
                return await method.call(this, fileContent, fileName, ...args);
            }
        };
    };
}

// 定期清理任务
export function startCacheCleanupTask(): vscode.Disposable {
    const interval = setInterval(() => {
        analysisCache.cleanupExpired();
    }, 2 * 60 * 1000); // 每2分钟清理一次

    return new vscode.Disposable(() => clearInterval(interval));
}
