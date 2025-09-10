import * as vscode from 'vscode';
import { RustStruct, RustEnum, RustTrait, RustFunction } from './rustAnalyzer';

// Web框架分析
export interface RustWebHandler {
    name: string;
    displayName: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    params: RustHandlerParam[];
    returnType: string;
    middleware: string[];
    line: number;
}

export interface RustHandlerParam {
    name: string;
    type: string;
    source: 'path' | 'query' | 'body' | 'header' | 'state';
}

// 数据库模型分析
export interface RustDbModel {
    name: string;
    displayName: string;
    table: string;
    fields: RustDbField[];
    relations: RustDbRelation[];
    migrations: string[];
    line: number;
}

export interface RustDbField {
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    defaultValue?: string;
}

export interface RustDbRelation {
    name: string;
    type: 'has_one' | 'has_many' | 'belongs_to' | 'many_to_many';
    target: string;
    foreignKey?: string;
}

// 异步任务分析
export interface RustAsyncTask {
    name: string;
    displayName: string;
    taskType: 'spawn' | 'block_on' | 'join' | 'select';
    dependencies: string[];
    errorHandling: boolean;
    line: number;
}

// 错误类型分析
export interface RustErrorType {
    name: string;
    displayName: string;
    errorKind: 'custom' | 'std' | 'anyhow' | 'thiserror';
    variants?: string[];
    sources?: string[];
    line: number;
}

// 配置分析
export interface RustConfig {
    name: string;
    displayName: string;
    configType: 'serde' | 'clap' | 'figment' | 'config';
    fields: RustConfigField[];
    source: 'file' | 'env' | 'args';
    line: number;
}

export interface RustConfigField {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    envVar?: string;
}

// 测试分析
export interface RustTest {
    name: string;
    displayName: string;
    testType: 'unit' | 'integration' | 'doc' | 'bench';
    async: boolean;
    shouldPanic: boolean;
    ignored: boolean;
    line: number;
}

export class AdvancedRustAnalyzer {
    private rustEcosystemTranslations: Map<string, string>;

    constructor() {
        this.rustEcosystemTranslations = new Map([
            // Actix Web
            ['App', '应用'],
            ['HttpServer', 'HTTP服务器'],
            ['HttpRequest', 'HTTP请求'],
            ['HttpResponse', 'HTTP响应'],
            ['web', 'Web模块'],
            ['middleware', '中间件'],
            ['route', '路由'],
            ['scope', '作用域'],
            ['service', '服务'],
            ['handler', '处理器'],
            ['extractor', '提取器'],
            ['Json', 'JSON提取器'],
            ['Query', '查询参数提取器'],
            ['Path', '路径参数提取器'],
            ['Form', '表单提取器'],
            ['Bytes', '字节提取器'],
            ['State', '状态提取器'],
            ['Header', '请求头提取器'],
            
            // Axum
            ['Router', '路由器'],
            ['Extension', '扩展'],
            ['extract', '提取模块'],
            ['response', '响应模块'],
            ['handler', '处理器模块'],
            ['routing', '路由模块'],
            ['serve', '服务函数'],
            ['layer', '层'],
            ['tower', 'Tower中间件'],
            
            // Warp
            ['Filter', '过滤器'],
            ['Reply', '回复'],
            ['Rejection', '拒绝'],
            ['path', '路径过滤器'],
            ['query', '查询过滤器'],
            ['header', '请求头过滤器'],
            ['body', '请求体过滤器'],
            ['map', '映射过滤器'],
            ['and_then', '然后过滤器'],
            ['or', '或过滤器'],
            
            // Rocket
            ['rocket', '火箭框架'],
            ['launch', '启动'],
            ['mount', '挂载'],
            ['routes', '路由'],
            ['catchers', '捕获器'],
            ['State', '状态'],
            ['Data', '数据'],
            ['Json', 'JSON'],
            ['Form', '表单'],
            ['Flash', '闪存消息'],
            ['Cookies', 'Cookie'],
            
            // Diesel ORM
            ['diesel', 'Diesel ORM'],
            ['table', '表'],
            ['schema', '模式'],
            ['connection', '连接'],
            ['query', '查询'],
            ['filter', '过滤'],
            ['select', '选择'],
            ['insert', '插入'],
            ['update', '更新'],
            ['delete', '删除'],
            ['join', '连接查询'],
            ['order', '排序'],
            ['group_by', '分组'],
            ['limit', '限制'],
            ['offset', '偏移'],
            ['load', '加载'],
            ['execute', '执行'],
            ['first', '第一个'],
            ['get_result', '获取结果'],
            ['get_results', '获取结果集'],
            
            // SQLx
            ['sqlx', 'SQLx数据库库'],
            ['query', '查询'],
            ['query_as', '查询映射'],
            ['query_scalar', '查询标量'],
            ['fetch_one', '获取一个'],
            ['fetch_all', '获取全部'],
            ['fetch_optional', '可选获取'],
            ['execute', '执行'],
            ['Pool', '连接池'],
            ['Database', '数据库'],
            ['Transaction', '事务'],
            ['migrate', '迁移'],
            
            // SeaORM
            ['sea_orm', 'SeaORM'],
            ['Entity', '实体'],
            ['ActiveModel', '活动模型'],
            ['Model', '模型'],
            ['Column', '列'],
            ['Relation', '关系'],
            ['Related', '相关'],
            ['find', '查找'],
            ['insert', '插入'],
            ['update', '更新'],
            ['delete', '删除'],
            ['save', '保存'],
            
            // Serde
            ['Serialize', '序列化'],
            ['Deserialize', '反序列化'],
            ['serde_json', 'JSON序列化'],
            ['serde_yaml', 'YAML序列化'],
            ['serde_toml', 'TOML序列化'],
            ['from_str', '从字符串反序列化'],
            ['to_string', '序列化为字符串'],
            ['from_slice', '从切片反序列化'],
            ['to_vec', '序列化为向量'],
            ['from_reader', '从读取器反序列化'],
            ['to_writer', '序列化到写入器'],
            
            // Tokio异步运行时
            ['tokio', 'Tokio异步运行时'],
            ['spawn', '生成任务'],
            ['block_on', '阻塞运行'],
            ['join', '合并任务'],
            ['select', '选择任务'],
            ['timeout', '超时'],
            ['sleep', '休眠'],
            ['interval', '间隔'],
            ['spawn_blocking', '生成阻塞任务'],
            ['task', '任务模块'],
            ['sync', '同步原语'],
            ['net', '网络模块'],
            ['fs', '文件系统模块'],
            ['io', '输入输出模块'],
            ['process', '进程模块'],
            ['signal', '信号模块'],
            ['time', '时间模块'],
            
            // 异步特征
            ['async_trait', '异步特征宏'],
            ['Send', '发送特征'],
            ['Sync', '同步特征'],
            ['Future', '未来值'],
            ['Stream', '流'],
            ['Sink', '接收器'],
            ['AsyncRead', '异步读取'],
            ['AsyncWrite', '异步写入'],
            ['AsyncSeek', '异步寻址'],
            
            // 错误处理
            ['anyhow', '通用错误库'],
            ['thiserror', '错误派生库'],
            ['eyre', '错误报告库'],
            ['miette', '诊断错误库'],
            ['color_eyre', '彩色错误报告'],
            ['Error', '错误特征'],
            ['Result', '结果类型'],
            ['bail', '抛出错误'],
            ['ensure', '确保条件'],
            ['context', '错误上下文'],
            ['with_context', '添加上下文'],
            
            // 日志和追踪
            ['log', '日志库'],
            ['env_logger', '环境日志器'],
            ['tracing', '追踪库'],
            ['tracing_subscriber', '追踪订阅器'],
            ['span', '跨度'],
            ['instrument', '仪器化'],
            ['trace', '跟踪级别'],
            ['debug', '调试级别'],
            ['info', '信息级别'],
            ['warn', '警告级别'],
            ['error', '错误级别'],
            
            // 配置管理
            ['config', '配置库'],
            ['figment', 'Figment配置库'],
            ['clap', '命令行解析库'],
            ['structopt', '结构化选项库'],
            ['Args', '参数'],
            ['Parser', '解析器'],
            ['Subcommand', '子命令'],
            ['ValueEnum', '值枚举'],
            
            // 测试
            ['test', '测试'],
            ['cfg', '配置'],
            ['should_panic', '应该恐慌'],
            ['ignore', '忽略测试'],
            ['tokio::test', '异步测试'],
            ['proptest', '属性测试'],
            ['quickcheck', '快速检查'],
            ['criterion', '基准测试'],
            ['mock', '模拟'],
            ['assert_eq', '断言相等'],
            ['assert_ne', '断言不等'],
            ['assert', '断言'],
            ['panic', '恐慌'],
            
            // 并发和同步
            ['Mutex', '互斥锁'],
            ['RwLock', '读写锁'],
            ['Arc', '原子引用计数'],
            ['Rc', '引用计数'],
            ['RefCell', '引用单元'],
            ['Cell', '单元'],
            ['OnceCell', '一次性单元'],
            ['Lazy', '懒加载'],
            ['channel', '通道'],
            ['mpsc', '多生产者单消费者'],
            ['broadcast', '广播通道'],
            ['watch', '监视通道'],
            ['oneshot', '一次性通道'],
            
            // 性能和优化
            ['rayon', '数据并行库'],
            ['par_iter', '并行迭代器'],
            ['dashmap', '并发哈希映射'],
            ['parking_lot', '停车场锁'],
            ['crossbeam', '交叉梁并发库'],
            ['flume', 'Flume通道'],
            ['once_cell', '一次性单元'],
            ['lazy_static', '懒静态'],
            
            // HTTP客户端
            ['reqwest', 'HTTP客户端库'],
            ['hyper', 'HTTP库'],
            ['curl', 'CURL绑定'],
            ['ureq', '微型HTTP客户端'],
            ['surf', 'Surf HTTP客户端'],
            ['Client', 'HTTP客户端'],
            ['Request', 'HTTP请求'],
            ['Response', 'HTTP响应'],
            ['get', 'GET请求'],
            ['post', 'POST请求'],
            ['put', 'PUT请求'],
            ['delete', 'DELETE请求'],
            ['patch', 'PATCH请求'],
            ['header', '请求头'],
            ['body', '请求体'],
            ['json', 'JSON'],
            ['form', '表单'],
            ['multipart', '多部分'],
            
            // 加密和安全
            ['ring', 'Ring加密库'],
            ['rustls', 'Rust TLS库'],
            ['openssl', 'OpenSSL绑定'],
            ['sha2', 'SHA-2哈希'],
            ['md5', 'MD5哈希'],
            ['bcrypt', 'Bcrypt密码哈希'],
            ['argon2', 'Argon2密码哈希'],
            ['rand', '随机数生成'],
            ['uuid', 'UUID生成'],
            ['base64', 'Base64编码'],
            ['hex', '十六进制编码'],
            
            // 文件和路径
            ['std::path', '路径模块'],
            ['std::fs', '文件系统模块'],
            ['Path', '路径'],
            ['PathBuf', '路径缓冲区'],
            ['File', '文件'],
            ['OpenOptions', '打开选项'],
            ['read_to_string', '读取为字符串'],
            ['write', '写入'],
            ['create_dir_all', '创建目录'],
            ['remove_file', '删除文件'],
            ['copy', '复制'],
            ['rename', '重命名'],
            
            // 时间和日期
            ['chrono', '时间日期库'],
            ['time', '时间库'],
            ['DateTime', '日期时间'],
            ['NaiveDate', '朴素日期'],
            ['NaiveTime', '朴素时间'],
            ['Duration', '持续时间'],
            ['Utc', 'UTC时区'],
            ['Local', '本地时区'],
            ['format', '格式化'],
            ['parse', '解析'],
            
            // 正则表达式
            ['regex', '正则表达式库'],
            ['Regex', '正则表达式'],
            ['RegexBuilder', '正则构建器'],
            ['Captures', '捕获组'],
            ['is_match', '是否匹配'],
            ['find', '查找'],
            ['find_all', '查找全部'],
            ['replace', '替换'],
            ['replace_all', '替换全部'],
            ['split', '分割']
        ]);
    }

    analyzeRustEcosystem(text: string, fileName: string): {
        webHandlers: RustWebHandler[],
        dbModels: RustDbModel[],
        asyncTasks: RustAsyncTask[],
        errorTypes: RustErrorType[],
        configs: RustConfig[],
        tests: RustTest[]
    } {
        return {
            webHandlers: this.analyzeWebHandlers(text),
            dbModels: this.analyzeDbModels(text),
            asyncTasks: this.analyzeAsyncTasks(text),
            errorTypes: this.analyzeErrorTypes(text),
            configs: this.analyzeConfigs(text),
            tests: this.analyzeTests(text)
        };
    }

    private analyzeWebHandlers(text: string): RustWebHandler[] {
        const handlers: RustWebHandler[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // Actix Web路由
            const actixMatch = line.match(/#\[(?:web::)?(get|post|put|delete|patch)\("([^"]+)"\)\]/);
            if (actixMatch) {
                const method = actixMatch[1].toUpperCase() as any;
                const path = actixMatch[2];
                
                // 查找下一行的函数定义
                const nextLine = lines[i + 1]?.trim();
                const funcMatch = nextLine?.match(/(?:async\s+)?(?:pub\s+)?fn\s+(\w+)/);
                
                if (funcMatch) {
                    handlers.push({
                        name: funcMatch[1],
                        displayName: this.translateIdentifier(funcMatch[1]),
                        method,
                        path,
                        params: this.extractHandlerParams(lines, i + 1),
                        returnType: this.extractHandlerReturnType(lines, i + 1),
                        middleware: [],
                        line: lineNumber + 1
                    });
                }
            }

            // Axum路由
            const axumMatch = line.match(/\.route\("([^"]+)",\s*(get|post|put|delete|patch)\((\w+)\)/);
            if (axumMatch) {
                const path = axumMatch[1];
                const method = axumMatch[2].toUpperCase() as any;
                const handlerName = axumMatch[3];

                handlers.push({
                    name: handlerName,
                    displayName: this.translateIdentifier(handlerName),
                    method,
                    path,
                    params: [],
                    returnType: 'impl IntoResponse',
                    middleware: [],
                    line: lineNumber
                });
            }
        }

        return handlers;
    }

    private analyzeDbModels(text: string): RustDbModel[] {
        const models: RustDbModel[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // Diesel table宏
            const dieselTableMatch = line.match(/table!\s*\{\s*(\w+)/);
            if (dieselTableMatch) {
                const tableName = dieselTableMatch[1];
                
                models.push({
                    name: tableName,
                    displayName: this.translateIdentifier(tableName),
                    table: tableName,
                    fields: this.extractTableFields(text, lineNumber),
                    relations: [],
                    migrations: [],
                    line: lineNumber
                });
            }

            // SQLx/SeaORM模型
            const modelMatch = line.match(/#\[derive\([^)]*(?:sqlx::FromRow|sea_orm::FromQueryResult)[^)]*\)\]/);
            if (modelMatch) {
                const nextLine = lines[i + 1]?.trim();
                const structMatch = nextLine?.match(/struct\s+(\w+)/);
                
                if (structMatch) {
                    const modelName = structMatch[1];
                    
                    models.push({
                        name: modelName,
                        displayName: this.translateIdentifier(modelName),
                        table: modelName.toLowerCase(),
                        fields: this.extractStructFields(text, i + 1),
                        relations: this.extractDbRelations(text, modelName),
                        migrations: [],
                        line: lineNumber + 1
                    });
                }
            }
        }

        return models;
    }

    private analyzeAsyncTasks(text: string): RustAsyncTask[] {
        const tasks: RustAsyncTask[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // tokio::spawn
            const spawnMatch = line.match(/tokio::spawn\s*\(/);
            if (spawnMatch) {
                tasks.push({
                    name: 'spawn_task',
                    displayName: '生成异步任务',
                    taskType: 'spawn',
                    dependencies: [],
                    errorHandling: this.hasAsyncErrorHandling(text, lineNumber),
                    line: lineNumber
                });
            }

            // join!宏
            const joinMatch = line.match(/join!\s*\(/);
            if (joinMatch) {
                tasks.push({
                    name: 'join_tasks',
                    displayName: '合并异步任务',
                    taskType: 'join',
                    dependencies: this.extractJoinDependencies(line),
                    errorHandling: false,
                    line: lineNumber
                });
            }

            // select!宏
            const selectMatch = line.match(/select!\s*\{/);
            if (selectMatch) {
                tasks.push({
                    name: 'select_tasks',
                    displayName: '选择异步任务',
                    taskType: 'select',
                    dependencies: [],
                    errorHandling: true,
                    line: lineNumber
                });
            }
        }

        return tasks;
    }

    private analyzeErrorTypes(text: string): RustErrorType[] {
        const errorTypes: RustErrorType[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // thiserror派生
            const thiserrorMatch = line.match(/#\[derive\([^)]*thiserror::Error[^)]*\)\]/);
            if (thiserrorMatch) {
                const nextLine = lines[i + 1]?.trim();
                const enumMatch = nextLine?.match(/enum\s+(\w+)/);
                
                if (enumMatch) {
                    const errorName = enumMatch[1];
                    
                    errorTypes.push({
                        name: errorName,
                        displayName: this.translateIdentifier(errorName),
                        errorKind: 'thiserror',
                        variants: this.extractErrorVariants(text, i + 1),
                        sources: [],
                        line: lineNumber + 1
                    });
                }
            }

            // 自定义错误实现
            const errorImplMatch = line.match(/impl\s+(?:std::)?Error\s+for\s+(\w+)/);
            if (errorImplMatch) {
                const errorName = errorImplMatch[1];
                
                errorTypes.push({
                    name: errorName,
                    displayName: this.translateIdentifier(errorName),
                    errorKind: 'custom',
                    variants: [],
                    sources: [],
                    line: lineNumber
                });
            }
        }

        return errorTypes;
    }

    private analyzeConfigs(text: string): RustConfig[] {
        const configs: RustConfig[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // Serde配置
            const serdeConfigMatch = line.match(/#\[derive\([^)]*(?:serde::)?(?:Serialize|Deserialize)[^)]*\)\]/);
            if (serdeConfigMatch) {
                const nextLine = lines[i + 1]?.trim();
                const structMatch = nextLine?.match(/struct\s+(\w+)/);
                
                if (structMatch) {
                    const configName = structMatch[1];
                    
                    configs.push({
                        name: configName,
                        displayName: this.translateIdentifier(configName),
                        configType: 'serde',
                        fields: this.extractConfigFields(text, i + 1),
                        source: 'file',
                        line: lineNumber + 1
                    });
                }
            }

            // Clap配置
            const clapMatch = line.match(/#\[derive\([^)]*clap::Parser[^)]*\)\]/);
            if (clapMatch) {
                const nextLine = lines[i + 1]?.trim();
                const structMatch = nextLine?.match(/struct\s+(\w+)/);
                
                if (structMatch) {
                    const configName = structMatch[1];
                    
                    configs.push({
                        name: configName,
                        displayName: this.translateIdentifier(configName),
                        configType: 'clap',
                        fields: this.extractConfigFields(text, i + 1),
                        source: 'args',
                        line: lineNumber + 1
                    });
                }
            }
        }

        return configs;
    }

    private analyzeTests(text: string): RustTest[] {
        const tests: RustTest[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 测试函数
            const testMatch = line.match(/#\[(?:tokio::)?test\]/);
            if (testMatch) {
                const nextLine = lines[i + 1]?.trim();
                const funcMatch = nextLine?.match(/(?:async\s+)?fn\s+(\w+)/);
                
                if (funcMatch) {
                    const testName = funcMatch[1];
                    const isAsync = nextLine?.includes('async') || line.includes('tokio::test');
                    
                    tests.push({
                        name: testName,
                        displayName: this.translateIdentifier(testName),
                        testType: 'unit',
                        async: isAsync,
                        shouldPanic: this.checkShouldPanic(text, lineNumber),
                        ignored: this.checkIgnored(text, lineNumber),
                        line: lineNumber + 1
                    });
                }
            }

            // 基准测试
            const benchMatch = line.match(/#\[bench\]/);
            if (benchMatch) {
                const nextLine = lines[i + 1]?.trim();
                const funcMatch = nextLine?.match(/fn\s+(\w+)/);
                
                if (funcMatch) {
                    const benchName = funcMatch[1];
                    
                    tests.push({
                        name: benchName,
                        displayName: this.translateIdentifier(benchName),
                        testType: 'bench',
                        async: false,
                        shouldPanic: false,
                        ignored: false,
                        line: lineNumber + 1
                    });
                }
            }
        }

        return tests;
    }

    // 辅助方法
    private extractHandlerParams(lines: string[], startLine: number): RustHandlerParam[] {
        const params: RustHandlerParam[] = [];
        const funcLine = lines[startLine]?.trim();
        
        if (funcLine) {
            const paramMatch = funcLine.match(/fn\s+\w+\s*\(([^)]*)\)/);
            if (paramMatch) {
                const paramStr = paramMatch[1];
                // 解析参数，识别提取器类型
                // 简化实现
                if (paramStr.includes('Json')) {
                    params.push({ name: 'json_data', type: 'Json', source: 'body' });
                }
                if (paramStr.includes('Path')) {
                    params.push({ name: 'path_params', type: 'Path', source: 'path' });
                }
                if (paramStr.includes('Query')) {
                    params.push({ name: 'query_params', type: 'Query', source: 'query' });
                }
            }
        }
        
        return params;
    }

    private extractHandlerReturnType(lines: string[], startLine: number): string {
        const funcLine = lines[startLine]?.trim();
        const returnMatch = funcLine?.match(/->\s*([^{]+)/);
        return returnMatch ? returnMatch[1].trim() : 'impl Responder';
    }

    private extractTableFields(text: string, startLine: number): RustDbField[] {
        // 解析Diesel table!宏中的字段
        return [];
    }

    private extractStructFields(text: string, startLine: number): RustDbField[] {
        // 解析结构体字段
        return [];
    }

    private extractDbRelations(text: string, modelName: string): RustDbRelation[] {
        // 解析数据库关系
        return [];
    }

    private hasAsyncErrorHandling(text: string, lineNumber: number): boolean {
        const nextFewLines = text.split('\n').slice(lineNumber, lineNumber + 10).join('\n');
        return nextFewLines.includes('?') || nextFewLines.includes('unwrap') || nextFewLines.includes('expect');
    }

    private extractJoinDependencies(line: string): string[] {
        // 提取join!宏中的依赖
        return [];
    }

    private extractErrorVariants(text: string, startLine: number): string[] {
        // 提取错误枚举变体
        return [];
    }

    private extractConfigFields(text: string, startLine: number): RustConfigField[] {
        // 提取配置字段
        return [];
    }

    private checkShouldPanic(text: string, lineNumber: number): boolean {
        const prevLines = text.split('\n').slice(Math.max(0, lineNumber - 5), lineNumber).join('\n');
        return prevLines.includes('#[should_panic]');
    }

    private checkIgnored(text: string, lineNumber: number): boolean {
        const prevLines = text.split('\n').slice(Math.max(0, lineNumber - 5), lineNumber).join('\n');
        return prevLines.includes('#[ignore]');
    }

    private translateIdentifier(identifier: string): string {
        return this.rustEcosystemTranslations.get(identifier) || identifier;
    }

    getEcosystemNodeDescription(item: RustWebHandler | RustDbModel | RustAsyncTask | RustErrorType | RustConfig | RustTest): string {
        if ('method' in item) {
            // RustWebHandler
            return `Web处理器: ${item.method} ${item.path}`;
        } else if ('table' in item) {
            // RustDbModel
            return `数据模型: ${item.table}表, ${item.fields.length}个字段`;
        } else if ('taskType' in item) {
            // RustAsyncTask
            return `异步任务: ${item.taskType}`;
        } else if ('errorKind' in item) {
            // RustErrorType
            return `错误类型: ${item.errorKind}, ${item.variants?.length || 0}个变体`;
        } else if ('configType' in item) {
            // RustConfig
            return `配置: ${item.configType}, ${item.fields.length}个字段`;
        } else {
            // RustTest
            return `测试: ${item.testType}${item.async ? ' (异步)' : ''}`;
        }
    }
}
