import * as vscode from 'vscode';
import { Parameter, FunctionInfo, ClassInfo } from './codeAnalyzer';

// Rust特定的代码分析接口
export interface RustStruct {
    name: string;
    displayName: string;
    fields: RustField[];
    derives: string[];
    visibility: string;
    line: number;
    column: number;
}

export interface RustEnum {
    name: string;
    displayName: string;
    variants: RustEnumVariant[];
    derives: string[];
    visibility: string;
    line: number;
    column: number;
}

export interface RustTrait {
    name: string;
    displayName: string;
    methods: RustMethod[];
    associatedTypes: string[];
    line: number;
    column: number;
}

export interface RustImpl {
    structName: string;
    traitName?: string;
    methods: RustMethod[];
    line: number;
    column: number;
}

export interface RustFunction {
    name: string;
    displayName: string;
    parameters: RustParameter[];
    returnType: string;
    visibility: string;
    isAsync: boolean;
    isUnsafe: boolean;
    generics: string[];
    line: number;
    column: number;
}

export interface RustMethod {
    name: string;
    displayName: string;
    parameters: RustParameter[];
    returnType: string;
    selfType: 'self' | '&self' | '&mut self' | 'none';
    visibility: string;
    line: number;
}

export interface RustField {
    name: string;
    type: string;
    visibility: string;
}

export interface RustParameter {
    name: string;
    type: string;
    isMutable: boolean;
}

export interface RustEnumVariant {
    name: string;
    fields?: RustField[];
    discriminant?: string;
}

export interface RustModule {
    name: string;
    displayName: string;
    visibility: string;
    path: string;
    line: number;
}

export class RustAnalyzer {
    private rustTranslations: Map<string, string>;

    constructor() {
        this.rustTranslations = new Map([
            // Rust关键字
            ['fn', '函数'],
            ['struct', '结构体'],
            ['enum', '枚举'],
            ['trait', '特征'],
            ['impl', '实现'],
            ['mod', '模块'],
            ['use', '使用'],
            ['pub', '公共'],
            ['const', '常量'],
            ['static', '静态'],
            ['let', '绑定'],
            ['mut', '可变'],
            ['ref', '引用'],
            ['match', '匹配'],
            ['if', '如果'],
            ['else', '否则'],
            ['loop', '循环'],
            ['while', '当'],
            ['for', '遍历'],
            ['return', '返回'],
            ['break', '跳出'],
            ['continue', '继续'],
            ['async', '异步'],
            ['await', '等待'],
            ['unsafe', '不安全'],
            
            // Rust类型
            ['String', '字符串'],
            ['str', '字符串切片'],
            ['i8', '8位整数'],
            ['i16', '16位整数'],
            ['i32', '32位整数'],
            ['i64', '64位整数'],
            ['i128', '128位整数'],
            ['u8', '8位无符号整数'],
            ['u16', '16位无符号整数'],
            ['u32', '32位无符号整数'],
            ['u64', '64位无符号整数'],
            ['u128', '128位无符号整数'],
            ['f32', '32位浮点数'],
            ['f64', '64位浮点数'],
            ['bool', '布尔值'],
            ['char', '字符'],
            ['Vec', '向量'],
            ['HashMap', '哈希映射'],
            ['HashSet', '哈希集合'],
            ['BTreeMap', '二叉树映射'],
            ['BTreeSet', '二叉树集合'],
            ['Option', '选项类型'],
            ['Result', '结果类型'],
            ['Box', '堆分配智能指针'],
            ['Rc', '引用计数智能指针'],
            ['Arc', '原子引用计数智能指针'],
            ['RefCell', '内部可变性'],
            ['Mutex', '互斥锁'],
            ['RwLock', '读写锁'],
            ['Channel', '通道'],
            
            // Rust标准库
            ['std', '标准库'],
            ['collections', '集合模块'],
            ['io', '输入输出模块'],
            ['fs', '文件系统模块'],
            ['net', '网络模块'],
            ['thread', '线程模块'],
            ['sync', '同步模块'],
            ['time', '时间模块'],
            ['path', '路径模块'],
            ['env', '环境模块'],
            ['process', '进程模块'],
            
            // 常用特征
            ['Clone', '克隆特征'],
            ['Copy', '复制特征'],
            ['Debug', '调试特征'],
            ['Display', '显示特征'],
            ['PartialEq', '部分相等特征'],
            ['Eq', '相等特征'],
            ['PartialOrd', '部分排序特征'],
            ['Ord', '排序特征'],
            ['Hash', '哈希特征'],
            ['Default', '默认值特征'],
            ['From', '转换来源特征'],
            ['Into', '转换目标特征'],
            ['AsRef', '引用转换特征'],
            ['AsMut', '可变引用转换特征'],
            ['Deref', '解引用特征'],
            ['DerefMut', '可变解引用特征'],
            ['Drop', '析构特征'],
            ['Send', '发送特征'],
            ['Sync', '同步特征'],
            ['Iterator', '迭代器特征'],
            ['IntoIterator', '转换为迭代器特征'],
            ['Serialize', '序列化特征'],
            ['Deserialize', '反序列化特征'],
            
            // 错误处理
            ['Error', '错误特征'],
            ['unwrap', '解包'],
            ['expect', '期望值'],
            ['panic', '恐慌'],
            ['assert', '断言'],
            
            // 异步编程
            ['Future', '未来值'],
            ['Stream', '流'],
            ['Sink', '接收器'],
            ['spawn', '生成任务'],
            ['join', '合并'],
            ['select', '选择'],
            
            // Web开发 (Actix, Axum, Warp等)
            ['Handler', '处理器'],
            ['Router', '路由器'],
            ['Middleware', '中间件'],
            ['Request', '请求'],
            ['Response', '响应'],
            ['HttpServer', 'HTTP服务器'],
            ['Json', 'JSON格式'],
            ['Query', '查询参数'],
            ['Path', '路径参数'],
            ['State', '状态'],
            ['Extract', '提取器'],
            ['Service', '服务'],
            
            // 数据库 (Diesel, SQLx等)
            ['Connection', '数据库连接'],
            ['Pool', '连接池'],
            ['Transaction', '事务'],
            ['Migration', '迁移'],
            ['Schema', '模式'],
            ['Table', '表'],
            ['Column', '列'],
            ['Query', '查询'],
            ['Insert', '插入'],
            ['Update', '更新'],
            ['Delete', '删除'],
            ['Select', '选择'],
            ['Join', '连接'],
            ['Where', '条件'],
            ['OrderBy', '排序'],
            ['GroupBy', '分组'],
            ['Having', '聚合条件'],
            
            // 序列化 (Serde)
            ['serde', '序列化库'],
            ['Serialize', '序列化'],
            ['Deserialize', '反序列化'],
            ['serialize', '序列化操作'],
            ['deserialize', '反序列化操作'],
            ['from_str', '从字符串解析'],
            ['to_string', '转换为字符串'],
            ['from_slice', '从切片解析'],
            ['to_vec', '转换为向量'],
            
            // 命令行 (Clap)
            ['Args', '参数'],
            ['Command', '命令'],
            ['Arg', '参数项'],
            ['Parser', '解析器'],
            ['Subcommand', '子命令'],
            
            // 日志 (Log, Tracing)
            ['debug', '调试日志'],
            ['info', '信息日志'],
            ['warn', '警告日志'],
            ['error', '错误日志'],
            ['trace', '跟踪日志'],
            ['span', '跨度'],
            ['instrument', '仪器化'],
            
            // 测试
            ['test', '测试'],
            ['cfg', '配置'],
            ['should_panic', '应该恐慌'],
            ['ignore', '忽略'],
            ['bench', '基准测试']
        ]);
    }

    analyzeRustCode(text: string, fileName: string): {
        structs: RustStruct[],
        enums: RustEnum[],
        traits: RustTrait[],
        impls: RustImpl[],
        functions: RustFunction[],
        modules: RustModule[]
    } {
        const result = {
            structs: [] as RustStruct[],
            enums: [] as RustEnum[],
            traits: [] as RustTrait[],
            impls: [] as RustImpl[],
            functions: [] as RustFunction[],
            modules: [] as RustModule[]
        };

        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 分析结构体
            const structMatch = line.match(/^(?:(pub(?:\([^)]+\))?)\s+)?struct\s+(\w+)/);
            if (structMatch) {
                const visibility = structMatch[1] || 'private';
                const structName = structMatch[2];
                
                const rustStruct: RustStruct = {
                    name: structName,
                    displayName: this.translateIdentifier(structName),
                    fields: this.extractStructFields(text, lineNumber, structName),
                    derives: this.extractDerives(text, lineNumber),
                    visibility: this.translateVisibility(visibility),
                    line: lineNumber,
                    column: line.indexOf(structName)
                };
                result.structs.push(rustStruct);
            }

            // 分析枚举
            const enumMatch = line.match(/^(?:(pub(?:\([^)]+\))?)\s+)?enum\s+(\w+)/);
            if (enumMatch) {
                const visibility = enumMatch[1] || 'private';
                const enumName = enumMatch[2];
                
                const rustEnum: RustEnum = {
                    name: enumName,
                    displayName: this.translateIdentifier(enumName),
                    variants: this.extractEnumVariants(text, lineNumber, enumName),
                    derives: this.extractDerives(text, lineNumber),
                    visibility: this.translateVisibility(visibility),
                    line: lineNumber,
                    column: line.indexOf(enumName)
                };
                result.enums.push(rustEnum);
            }

            // 分析特征
            const traitMatch = line.match(/^(?:(pub(?:\([^)]+\))?)\s+)?trait\s+(\w+)/);
            if (traitMatch) {
                const traitName = traitMatch[2];
                
                const rustTrait: RustTrait = {
                    name: traitName,
                    displayName: this.translateIdentifier(traitName),
                    methods: this.extractTraitMethods(text, lineNumber, traitName),
                    associatedTypes: this.extractAssociatedTypes(text, lineNumber, traitName),
                    line: lineNumber,
                    column: line.indexOf(traitName)
                };
                result.traits.push(rustTrait);
            }

            // 分析实现块
            const implMatch = line.match(/^impl(?:\s*<[^>]*>)?\s+(?:(\w+)\s+for\s+)?(\w+)/);
            if (implMatch) {
                const traitName = implMatch[1];
                const structName = implMatch[2];
                
                const rustImpl: RustImpl = {
                    structName,
                    traitName,
                    methods: this.extractImplMethods(text, lineNumber, structName, traitName),
                    line: lineNumber,
                    column: line.indexOf('impl')
                };
                result.impls.push(rustImpl);
            }

            // 分析函数
            const functionMatch = line.match(/^(?:(pub(?:\([^)]+\))?)\s+)?(?:(async)\s+)?(?:(unsafe)\s+)?fn\s+(\w+)/);
            if (functionMatch && !this.isInsideImplOrTrait(text, lineNumber)) {
                const visibility = functionMatch[1] || 'private';
                const isAsync = !!functionMatch[2];
                const isUnsafe = !!functionMatch[3];
                const functionName = functionMatch[4];
                
                const rustFunction: RustFunction = {
                    name: functionName,
                    displayName: this.translateIdentifier(functionName),
                    parameters: this.extractFunctionParameters(line),
                    returnType: this.extractReturnType(line),
                    visibility: this.translateVisibility(visibility),
                    isAsync,
                    isUnsafe,
                    generics: this.extractGenerics(line),
                    line: lineNumber,
                    column: line.indexOf(functionName)
                };
                result.functions.push(rustFunction);
            }

            // 分析模块
            const moduleMatch = line.match(/^(?:(pub(?:\([^)]+\))?)\s+)?mod\s+(\w+)/);
            if (moduleMatch) {
                const visibility = moduleMatch[1] || 'private';
                const moduleName = moduleMatch[2];
                
                const rustModule: RustModule = {
                    name: moduleName,
                    displayName: this.translateIdentifier(moduleName),
                    visibility: this.translateVisibility(visibility),
                    path: fileName,
                    line: lineNumber
                };
                result.modules.push(rustModule);
            }
        }

        return result;
    }

    private extractStructFields(text: string, startLine: number, structName: string): RustField[] {
        const fields: RustField[] = [];
        const lines = text.split('\n');
        let inStruct = false;
        let braceCount = 0;

        for (let i = startLine - 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes(`struct ${structName}`)) {
                inStruct = true;
            }

            if (inStruct) {
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                // 匹配字段定义
                const fieldMatch = line.match(/^(?:(pub(?:\([^)]+\))?)\s+)?(\w+):\s*([^,]+),?/);
                if (fieldMatch) {
                    const visibility = fieldMatch[1] || 'private';
                    const fieldName = fieldMatch[2];
                    const fieldType = fieldMatch[3].trim();

                    fields.push({
                        name: fieldName,
                        type: fieldType,
                        visibility: this.translateVisibility(visibility)
                    });
                }

                if (braceCount === 0 && line.includes('}')) {
                    break;
                }
            }
        }

        return fields;
    }

    private extractEnumVariants(text: string, startLine: number, enumName: string): RustEnumVariant[] {
        const variants: RustEnumVariant[] = [];
        // 这里实现枚举变体提取逻辑
        return variants;
    }

    private extractTraitMethods(text: string, startLine: number, traitName: string): RustMethod[] {
        const methods: RustMethod[] = [];
        // 这里实现特征方法提取逻辑
        return methods;
    }

    private extractImplMethods(text: string, startLine: number, structName: string, traitName?: string): RustMethod[] {
        const methods: RustMethod[] = [];
        // 这里实现实现块方法提取逻辑
        return methods;
    }

    private extractAssociatedTypes(text: string, startLine: number, traitName: string): string[] {
        const types: string[] = [];
        // 这里实现关联类型提取逻辑
        return types;
    }

    private extractDerives(text: string, lineNumber: number): string[] {
        const derives: string[] = [];
        const lines = text.split('\n');
        
        // 查找上一行的derive属性
        for (let i = lineNumber - 2; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('#[derive(')) {
                const deriveMatch = line.match(/#\[derive\(([^)]+)\)\]/);
                if (deriveMatch) {
                    const deriveList = deriveMatch[1].split(',').map(d => d.trim());
                    derives.push(...deriveList);
                }
                break;
            }
            if (line && !line.startsWith('#')) {
                break;
            }
        }

        return derives;
    }

    private extractFunctionParameters(line: string): RustParameter[] {
        const parameters: RustParameter[] = [];
        const paramMatch = line.match(/fn\s+\w+\s*\(([^)]*)\)/);
        
        if (paramMatch) {
            const paramStr = paramMatch[1];
            if (paramStr.trim()) {
                const params = paramStr.split(',');
                
                for (const param of params) {
                    const cleanParam = param.trim();
                    if (cleanParam) {
                        const parts = cleanParam.split(':');
                        if (parts.length >= 2) {
                            const name = parts[0].trim();
                            const type = parts[1].trim();
                            
                            parameters.push({
                                name: name.replace('mut ', ''),
                                type,
                                isMutable: name.includes('mut ')
                            });
                        }
                    }
                }
            }
        }

        return parameters;
    }

    private extractReturnType(line: string): string {
        const returnMatch = line.match(/->\s*([^{]+)/);
        return returnMatch ? returnMatch[1].trim() : '()';
    }

    private extractGenerics(line: string): string[] {
        const genericMatch = line.match(/<([^>]+)>/);
        if (genericMatch) {
            return genericMatch[1].split(',').map(g => g.trim());
        }
        return [];
    }

    private isInsideImplOrTrait(text: string, lineNumber: number): boolean {
        const lines = text.split('\n');
        let implOrTraitCount = 0;

        for (let i = 0; i < lineNumber - 1; i++) {
            const line = lines[i].trim();
            if (line.match(/^(?:impl|trait)\s/)) {
                implOrTraitCount++;
            }
            // 这里需要更精确的逻辑来检测块的结束
        }

        return implOrTraitCount > 0;
    }

    private translateVisibility(visibility: string): string {
        if (visibility.startsWith('pub')) {
            if (visibility.includes('(crate)')) return '包内公共';
            if (visibility.includes('(super)')) return '父模块公共';
            return '公共';
        }
        return '私有';
    }

    private translateIdentifier(identifier: string): string {
        // 直接翻译
        if (this.rustTranslations.has(identifier)) {
            return this.rustTranslations.get(identifier)!;
        }

        // 常见后缀翻译
        if (identifier.endsWith('Error')) {
            return identifier.replace('Error', '错误');
        }
        if (identifier.endsWith('Result')) {
            return identifier.replace('Result', '结果');
        }
        if (identifier.endsWith('Config')) {
            return identifier.replace('Config', '配置');
        }
        if (identifier.endsWith('Builder')) {
            return identifier.replace('Builder', '构建器');
        }
        if (identifier.endsWith('Handler')) {
            return identifier.replace('Handler', '处理器');
        }
        if (identifier.endsWith('Service')) {
            return identifier.replace('Service', '服务');
        }
        if (identifier.endsWith('Manager')) {
            return identifier.replace('Manager', '管理器');
        }
        if (identifier.endsWith('Controller')) {
            return identifier.replace('Controller', '控制器');
        }

        // 常见前缀翻译
        if (identifier.startsWith('get_')) {
            return '获取' + identifier.substring(4);
        }
        if (identifier.startsWith('set_')) {
            return '设置' + identifier.substring(4);
        }
        if (identifier.startsWith('create_')) {
            return '创建' + identifier.substring(7);
        }
        if (identifier.startsWith('update_')) {
            return '更新' + identifier.substring(7);
        }
        if (identifier.startsWith('delete_')) {
            return '删除' + identifier.substring(7);
        }
        if (identifier.startsWith('is_')) {
            return '是否' + identifier.substring(3);
        }
        if (identifier.startsWith('has_')) {
            return '是否有' + identifier.substring(4);
        }
        if (identifier.startsWith('can_')) {
            return '是否能' + identifier.substring(4);
        }

        return identifier;
    }

    getRustNodeDescription(item: RustStruct | RustEnum | RustTrait | RustFunction): string {
        if ('fields' in item) {
            // RustStruct
            const fieldCount = item.fields.length;
            const deriveCount = item.derives.length;
            return `结构体 • ${fieldCount}个字段${deriveCount > 0 ? ` • 派生${deriveCount}个特征` : ''}`;
        } else if ('variants' in item) {
            // RustEnum
            const variantCount = item.variants.length;
            return `枚举 • ${variantCount}个变体`;
        } else if ('methods' in item) {
            // RustTrait
            const methodCount = item.methods.length;
            return `特征 • ${methodCount}个方法`;
        } else {
            // RustFunction
            const paramCount = item.parameters.length;
            const modifiers = [];
            if (item.isAsync) modifiers.push('异步');
            if (item.isUnsafe) modifiers.push('不安全');
            const modifierText = modifiers.length > 0 ? modifiers.join('') + '' : '';
            return `${modifierText}函数 • ${paramCount}个参数`;
        }
    }
}
