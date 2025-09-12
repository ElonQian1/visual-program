// 延迟加载优化配置
export class LazyLoadingOptimizer {
    private static loadedModules = new Map<string, any>();
    
    // 按需加载分析器
    static async loadAnalyzer<T>(modulePath: string, className: string): Promise<T> {
        const cacheKey = `${modulePath}:${className}`;
        
        if (this.loadedModules.has(cacheKey)) {
            return this.loadedModules.get(cacheKey);
        }
        
        try {
            const module = await import(modulePath);
            const AnalyzerClass = module[className];
            const instance = new AnalyzerClass();
            
            this.loadedModules.set(cacheKey, instance);
            return instance;
        } catch (error) {
            console.error(`Failed to load ${modulePath}:${className}`, error);
            throw error;
        }
    }
    
    // 清理未使用的模块
    static cleanupUnusedModules() {
        // 实现模块清理逻辑
        const unusedModules = Array.from(this.loadedModules.keys()).filter(key => {
            // 检查模块是否在最近5分钟内被使用
            return false; // 简化实现
        });
        
        unusedModules.forEach(key => {
            this.loadedModules.delete(key);
        });
    }
    
    // 预加载核心模块
    static async preloadCoreModules() {
        const coreModules = [
            { path: './reactAnalyzer', class: 'ReactAnalyzer' },
            { path: './rustAnalyzer', class: 'RustAnalyzer' },
            { path: './visualPanelProvider', class: 'VisualPanelProvider' }
        ];
        
        await Promise.all(
            coreModules.map(({ path, class: className }) => 
                this.loadAnalyzer(path, className).catch(err => {
                    console.warn(`Failed to preload ${path}:${className}`, err);
                })
            )
        );
    }
}
