// Rust后端架构分析器
export interface RustAPIEndpoint {
    method: string;
    path: string;
    handler: string;
    params?: string[];
    line: number;
}

export interface RustSecurityVulnerability {
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
    line: number;
}

export interface RustPerformanceBottleneck {
    type: string;
    impact: string;
    description: string;
    optimization: string;
    line: number;
}

export interface RustMicroserviceReadiness {
    score: number;
    status: string;
    recommendations: string[];
}

export interface RustDatabaseAnalysis {
    ormType: string;
    hasConnectionPool: boolean;
    transactionUsage: string;
    queryCount: number;
    optimizations: string[];
}

export interface RustBackendArchitectureAnalysis {
    apiDesign: {
        endpoints: RustAPIEndpoint[];
        patterns: string[];
    };
    securityAnalysis: {
        vulnerabilities: RustSecurityVulnerability[];
        recommendations: string[];
    };
    performanceAnalysis: {
        bottlenecks: RustPerformanceBottleneck[];
        optimizations: string[];
    };
    microserviceReadiness: RustMicroserviceReadiness;
    databaseAnalysis: RustDatabaseAnalysis;
}

export class RustBackendArchitectureAnalyzer {
    analyze(code: string, fileName: string): RustBackendArchitectureAnalysis {
        return {
            apiDesign: this.analyzeAPIDesign(code),
            securityAnalysis: this.analyzeSecurityVulnerabilities(code),
            performanceAnalysis: this.analyzePerformanceBottlenecks(code),
            microserviceReadiness: this.analyzeMicroserviceReadiness(code),
            databaseAnalysis: this.analyzeDatabaseUsage(code)
        };
    }

    private analyzeAPIDesign(code: string) {
        const endpoints: RustAPIEndpoint[] = [];
        const patterns: string[] = [];
        
        // 检测HTTP路由
        const routeRegex = /#\[(?:get|post|put|delete|patch)\("([^"]+)"\)]/gi;
        let match;
        let lineNum = 1;
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            lineNum = i + 1;
            
            if (routeRegex.test(line)) {
                const methodMatch = line.match(/#\[(\w+)\("([^"]+)"\)]/);
                if (methodMatch) {
                    endpoints.push({
                        method: methodMatch[1].toUpperCase(),
                        path: methodMatch[2],
                        handler: lines[i + 1]?.match(/fn\s+(\w+)/)?.[1] || 'unknown',
                        line: lineNum
                    });
                }
            }
        }
        
        // 识别API模式
        if (endpoints.some(e => e.path.includes('/api/'))) {
            patterns.push('RESTful API');
        }
        if (code.includes('GraphQL') || code.includes('juniper')) {
            patterns.push('GraphQL');
        }
        
        return { endpoints, patterns };
    }

    private analyzeSecurityVulnerabilities(code: string) {
        const vulnerabilities: RustSecurityVulnerability[] = [];
        const recommendations: string[] = [];
        
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            
            // 检测SQL注入风险
            if (line.includes('format!') && line.includes('SELECT')) {
                vulnerabilities.push({
                    type: 'SQL注入风险',
                    severity: 'high',
                    description: '使用字符串拼接构建SQL查询',
                    suggestion: '使用参数化查询或ORM',
                    line: lineNum
                });
            }
            
            // 检测硬编码密钥
            if (line.includes('password') && line.includes('=') && line.includes('"')) {
                vulnerabilities.push({
                    type: '硬编码密钥',
                    severity: 'high',
                    description: '代码中包含硬编码的密码或密钥',
                    suggestion: '使用环境变量或配置文件',
                    line: lineNum
                });
            }
            
            // 检测unsafe代码
            if (line.includes('unsafe')) {
                vulnerabilities.push({
                    type: 'unsafe代码块',
                    severity: 'medium',
                    description: '使用了unsafe代码块',
                    suggestion: '仔细审查unsafe代码的内存安全性',
                    line: lineNum
                });
            }
        }
        
        // 通用安全建议
        if (vulnerabilities.length === 0) {
            recommendations.push('代码通过基础安全检查');
        } else {
            recommendations.push('建议进行专业安全审计');
        }
        
        return { vulnerabilities, recommendations };
    }

    private analyzePerformanceBottlenecks(code: string) {
        const bottlenecks: RustPerformanceBottleneck[] = [];
        const optimizations: string[] = [];
        
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            
            // 检测同步阻塞操作
            if (line.includes('.wait()') || line.includes('.join()')) {
                bottlenecks.push({
                    type: '阻塞操作',
                    impact: '可能阻塞事件循环',
                    description: '使用了同步等待操作',
                    optimization: '考虑使用异步操作',
                    line: lineNum
                });
            }
            
            // 检测大量clone操作
            const cloneMatches = line.match(/\.clone\(\)/g);
            if (cloneMatches && cloneMatches.length > 2) {
                bottlenecks.push({
                    type: '频繁克隆',
                    impact: '增加内存使用和CPU开销',
                    description: '单行包含多次clone调用',
                    optimization: '使用引用或Arc<T>共享数据',
                    line: lineNum
                });
            }
        }
        
        // 性能优化建议
        if (code.includes('tokio') || code.includes('async-std')) {
            optimizations.push('使用异步运行时，性能较好');
        }
        if (code.includes('rayon')) {
            optimizations.push('使用并行计算库，CPU密集任务性能佳');
        }
        
        return { bottlenecks, optimizations };
    }

    private analyzeMicroserviceReadiness(code: string): RustMicroserviceReadiness {
        let score = 5; // 基础分
        const recommendations: string[] = [];
        
        // 检查健康检查端点
        if (code.includes('/health') || code.includes('/status')) {
            score += 1;
        } else {
            recommendations.push('添加健康检查端点');
        }
        
        // 检查配置管理
        if (code.includes('env::var') || code.includes('dotenv') || code.includes('config')) {
            score += 1;
        } else {
            recommendations.push('使用环境变量进行配置管理');
        }
        
        // 检查日志记录
        if (code.includes('log::') || code.includes('tracing::')) {
            score += 1;
        } else {
            recommendations.push('添加结构化日志记录');
        }
        
        // 检查错误处理
        if (code.includes('Result<') && code.includes('?')) {
            score += 1;
        } else {
            recommendations.push('完善错误处理机制');
        }
        
        // 检查数据库连接池
        if (code.includes('Pool') || code.includes('pool')) {
            score += 1;
        } else {
            recommendations.push('使用数据库连接池');
        }
        
        const status = score >= 8 ? '优秀' : score >= 6 ? '良好' : '需改进';
        
        return { score, status, recommendations };
    }

    private analyzeDatabaseUsage(code: string): RustDatabaseAnalysis {
        let ormType = '未检测到ORM';
        let hasConnectionPool = false;
        let transactionUsage = '无';
        let queryCount = 0;
        const optimizations: string[] = [];
        
        // 检测ORM类型
        if (code.includes('diesel')) {
            ormType = 'Diesel';
        } else if (code.includes('sqlx')) {
            ormType = 'SQLx';
        } else if (code.includes('sea-orm')) {
            ormType = 'SeaORM';
        }
        
        // 检测连接池
        if (code.includes('Pool') || code.includes('pool')) {
            hasConnectionPool = true;
        }
        
        // 检测事务使用
        if (code.includes('transaction') || code.includes('begin_transaction')) {
            transactionUsage = '已使用';
        }
        
        // 统计查询数量
        queryCount = (code.match(/\.execute|\.fetch|\.query/g) || []).length;
        
        // 优化建议
        if (hasConnectionPool) {
            optimizations.push('已配置连接池，数据库连接管理良好');
        } else {
            optimizations.push('建议配置数据库连接池');
        }
        
        if (queryCount > 10) {
            optimizations.push('查询较多，考虑使用缓存');
        }
        
        return { ormType, hasConnectionPool, transactionUsage, queryCount, optimizations };
    }
}