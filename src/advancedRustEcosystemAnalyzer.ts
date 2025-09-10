import * as vscode from 'vscode';

// Rust宏分析
export interface RustMacro {
    name: string;
    displayName: string;
    macroType: 'declarative' | 'procedural' | 'attribute' | 'derive';
    rules?: MacroRule[];
    parameters?: string[];
    documentation?: string;
    line: number;
}

export interface MacroRule {
    pattern: string;
    expansion: string;
}

// Rust生命周期分析
export interface RustLifetime {
    name: string;
    scope: string;
    constraints: string[];
    functions: string[];
    structs: string[];
    line: number;
}

// Rust并发分析
export interface RustConcurrency {
    channels: RustChannel[];
    mutexes: RustMutex[];
    atomics: RustAtomic[];
    spawns: RustSpawn[];
    joins: RustJoin[];
}

export interface RustChannel {
    channelType: 'mpsc' | 'oneshot' | 'broadcast' | 'watch';
    sender: string;
    receiver: string;
    dataType: string;
    line: number;
}

export interface RustMutex {
    name: string;
    dataType: string;
    lockType: 'std::sync::Mutex' | 'tokio::sync::Mutex' | 'parking_lot::Mutex';
    line: number;
}

export interface RustAtomic {
    name: string;
    atomicType: string;
    operations: string[];
    line: number;
}

export interface RustSpawn {
    taskName?: string;
    runtime: 'tokio' | 'async-std' | 'smol';
    blocking: boolean;
    line: number;
}

export interface RustJoin {
    handles: string[];
    joinType: 'join!' | 'try_join!' | 'select!';
    line: number;
}

// Rust性能分析
export interface RustPerformance {
    allocations: RustAllocation[];
    clones: RustClone[];
    iterations: RustIteration[];
    benchmarks: RustBenchmark[];
}

export interface RustAllocation {
    allocationType: 'Box' | 'Vec' | 'HashMap' | 'BTreeMap' | 'String';
    context: string;
    suggestion?: string;
    line: number;
}

export interface RustClone {
    target: string;
    necessary: boolean;
    suggestion?: string;
    line: number;
}

export interface RustIteration {
    iteratorType: 'for' | 'while' | 'loop' | 'iter' | 'into_iter';
    optimization: string[];
    line: number;
}

export interface RustBenchmark {
    name: string;
    framework: 'criterion' | 'built-in';
    metrics: string[];
    line: number;
}

// Rust安全分析
export interface RustSafety {
    unsafeBlocks: RustUnsafeBlock[];
    unsafeFunctions: RustUnsafeFunction[];
    rawPointers: RustRawPointer[];
    ffiCalls: RustFFICall[];
}

export interface RustUnsafeBlock {
    reason: string;
    operations: string[];
    safetyComment?: string;
    line: number;
}

export interface RustUnsafeFunction {
    name: string;
    reason: string;
    preconditions: string[];
    line: number;
}

export interface RustRawPointer {
    pointerType: '*const' | '*mut';
    targetType: string;
    usage: string;
    line: number;
}

export interface RustFFICall {
    libraryName: string;
    functionName: string;
    bindingType: 'extern "C"' | 'extern "system"' | 'extern "stdcall"';
    line: number;
}

export class AdvancedRustEcosystemAnalyzer {
    private macroPatterns: RegExp[];
    private concurrencyPatterns: RegExp[];
    private performancePatterns: RegExp[];
    private safetyPatterns: RegExp[];

    constructor() {
        this.macroPatterns = [
            /macro_rules!\s+(\w+)/g,
            /#\[proc_macro\]/g,
            /#\[derive\(([^)]+)\)\]/g
        ];

        this.concurrencyPatterns = [
            /tokio::spawn/g,
            /std::thread::spawn/g,
            /mpsc::channel/g,
            /Mutex::new/g,
            /Arc::new/g
        ];

        this.performancePatterns = [
            /\.clone\(\)/g,
            /Box::new/g,
            /Vec::new/g,
            /HashMap::new/g,
            /#\[bench\]/g
        ];

        this.safetyPatterns = [
            /unsafe\s*{/g,
            /unsafe\s+fn/g,
            /\*const\s+/g,
            /\*mut\s+/g,
            /extern\s+"C"/g
        ];
    }

    analyzeRustEcosystem(text: string, fileName: string): {
        macros: RustMacro[];
        lifetimes: RustLifetime[];
        concurrency: RustConcurrency;
        performance: RustPerformance;
        safety: RustSafety;
    } {
        return {
            macros: this.analyzeMacros(text),
            lifetimes: this.analyzeLifetimes(text),
            concurrency: this.analyzeConcurrency(text),
            performance: this.analyzePerformance(text),
            safety: this.analyzeSafety(text)
        };
    }

    private analyzeMacros(text: string): RustMacro[] {
        const macros: RustMacro[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 声明性宏
            const macroRulesMatch = line.match(/macro_rules!\s+(\w+)/);
            if (macroRulesMatch) {
                const macroName = macroRulesMatch[1];
                const rules = this.extractMacroRules(text, i);
                
                macros.push({
                    name: macroName,
                    displayName: this.translateMacroName(macroName),
                    macroType: 'declarative',
                    rules,
                    line: i + 1
                });
            }

            // 过程性宏
            if (line.includes('#[proc_macro]')) {
                const nextLine = lines[i + 1];
                const funcMatch = nextLine?.match(/pub\s+fn\s+(\w+)/);
                if (funcMatch) {
                    macros.push({
                        name: funcMatch[1],
                        displayName: this.translateMacroName(funcMatch[1]),
                        macroType: 'procedural',
                        line: i + 2
                    });
                }
            }

            // 派生宏
            const deriveMatch = line.match(/#\[derive\(([^)]+)\)\]/);
            if (deriveMatch) {
                const derives = deriveMatch[1].split(',').map(d => d.trim());
                derives.forEach(derive => {
                    macros.push({
                        name: derive,
                        displayName: this.translateDeriveMacro(derive),
                        macroType: 'derive',
                        line: i + 1
                    });
                });
            }
        }

        return macros;
    }

    private analyzeLifetimes(text: string): RustLifetime[] {
        const lifetimes: RustLifetime[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 查找生命周期参数
            const lifetimeMatches = line.match(/'(\w+)/g);
            if (lifetimeMatches) {
                lifetimeMatches.forEach(lifetime => {
                    const name = lifetime.substring(1); // 移除单引号
                    if (!lifetimes.some(lt => lt.name === name)) {
                        lifetimes.push({
                            name,
                            scope: this.determineLifetimeScope(text, name),
                            constraints: this.findLifetimeConstraints(text, name),
                            functions: this.findFunctionsUsingLifetime(text, name),
                            structs: this.findStructsUsingLifetime(text, name),
                            line: i + 1
                        });
                    }
                });
            }
        }

        return lifetimes;
    }

    private analyzeConcurrency(text: string): RustConcurrency {
        return {
            channels: this.findChannels(text),
            mutexes: this.findMutexes(text),
            atomics: this.findAtomics(text),
            spawns: this.findSpawns(text),
            joins: this.findJoins(text)
        };
    }

    private findChannels(text: string): RustChannel[] {
        const channels: RustChannel[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // MPSC channel
            const mpscMatch = line.match(/let\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=\s*mpsc::channel/);
            if (mpscMatch) {
                channels.push({
                    channelType: 'mpsc',
                    sender: mpscMatch[1],
                    receiver: mpscMatch[2],
                    dataType: this.extractChannelDataType(line),
                    line: i + 1
                });
            }

            // Oneshot channel
            const oneshotMatch = line.match(/let\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=\s*oneshot::channel/);
            if (oneshotMatch) {
                channels.push({
                    channelType: 'oneshot',
                    sender: oneshotMatch[1],
                    receiver: oneshotMatch[2],
                    dataType: this.extractChannelDataType(line),
                    line: i + 1
                });
            }

            // Broadcast channel
            const broadcastMatch = line.match(/let\s*(\w+)\s*=\s*broadcast::channel/);
            if (broadcastMatch) {
                channels.push({
                    channelType: 'broadcast',
                    sender: broadcastMatch[1],
                    receiver: 'broadcast_receiver',
                    dataType: this.extractChannelDataType(line),
                    line: i + 1
                });
            }
        }

        return channels;
    }

    private findMutexes(text: string): RustMutex[] {
        const mutexes: RustMutex[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const mutexMatch = line.match(/let\s+(\w+)\s*=\s*([^:]+::)?Mutex::new/);
            if (mutexMatch) {
                const mutexName = mutexMatch[1];
                const lockType = this.determineMutexType(line);
                const dataType = this.extractMutexDataType(line);

                mutexes.push({
                    name: mutexName,
                    dataType,
                    lockType,
                    line: i + 1
                });
            }
        }

        return mutexes;
    }

    private findAtomics(text: string): RustAtomic[] {
        const atomics: RustAtomic[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const atomicMatch = line.match(/let\s+(\w+)\s*=\s*Atomic(\w+)::new/);
            if (atomicMatch) {
                const [, varName, atomicType] = atomicMatch;
                const operations = this.findAtomicOperations(text, varName);

                atomics.push({
                    name: varName,
                    atomicType: `Atomic${atomicType}`,
                    operations,
                    line: i + 1
                });
            }
        }

        return atomics;
    }

    private findSpawns(text: string): RustSpawn[] {
        const spawns: RustSpawn[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Tokio spawn
            if (line.includes('tokio::spawn')) {
                spawns.push({
                    runtime: 'tokio',
                    blocking: false,
                    line: i + 1
                });
            }

            // Tokio spawn_blocking
            if (line.includes('tokio::task::spawn_blocking')) {
                spawns.push({
                    runtime: 'tokio',
                    blocking: true,
                    line: i + 1
                });
            }

            // std::thread::spawn
            if (line.includes('std::thread::spawn')) {
                spawns.push({
                    runtime: 'tokio', // fallback
                    blocking: true,
                    line: i + 1
                });
            }
        }

        return spawns;
    }

    private findJoins(text: string): RustJoin[] {
        const joins: RustJoin[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // join! macro
            if (line.includes('join!')) {
                const handles = this.extractJoinHandles(line);
                joins.push({
                    handles,
                    joinType: 'join!',
                    line: i + 1
                });
            }

            // try_join! macro
            if (line.includes('try_join!')) {
                const handles = this.extractJoinHandles(line);
                joins.push({
                    handles,
                    joinType: 'try_join!',
                    line: i + 1
                });
            }

            // select! macro
            if (line.includes('select!')) {
                const handles = this.extractSelectHandles(line);
                joins.push({
                    handles,
                    joinType: 'select!',
                    line: i + 1
                });
            }
        }

        return joins;
    }

    private analyzePerformance(text: string): RustPerformance {
        return {
            allocations: this.findAllocations(text),
            clones: this.findClones(text),
            iterations: this.findIterations(text),
            benchmarks: this.findBenchmarks(text)
        };
    }

    private findAllocations(text: string): RustAllocation[] {
        const allocations: RustAllocation[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Box::new
            if (line.includes('Box::new')) {
                allocations.push({
                    allocationType: 'Box',
                    context: line.trim(),
                    suggestion: '考虑是否真的需要堆分配',
                    line: i + 1
                });
            }

            // Vec::new or vec![]
            if (line.includes('Vec::new') || line.includes('vec![')) {
                allocations.push({
                    allocationType: 'Vec',
                    context: line.trim(),
                    suggestion: '如果知道大小，考虑使用Vec::with_capacity',
                    line: i + 1
                });
            }

            // HashMap::new
            if (line.includes('HashMap::new')) {
                allocations.push({
                    allocationType: 'HashMap',
                    context: line.trim(),
                    suggestion: '如果知道容量，考虑使用HashMap::with_capacity',
                    line: i + 1
                });
            }
        }

        return allocations;
    }

    private findClones(text: string): RustClone[] {
        const clones: RustClone[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const cloneMatches = line.match(/(\w+)\.clone\(\)/g);
            if (cloneMatches) {
                cloneMatches.forEach(cloneCall => {
                    const target = cloneCall.split('.')[0];
                    const necessary = this.isCloneNecessary(text, i, target);
                    
                    clones.push({
                        target,
                        necessary,
                        suggestion: necessary ? undefined : '考虑使用引用或移动语义',
                        line: i + 1
                    });
                });
            }
        }

        return clones;
    }

    private findIterations(text: string): RustIteration[] {
        const iterations: RustIteration[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // for loops
            if (line.includes('for ') && line.includes(' in ')) {
                const optimization = this.suggestIteratorOptimization(line);
                iterations.push({
                    iteratorType: 'for',
                    optimization,
                    line: i + 1
                });
            }

            // Iterator chains
            if (line.includes('.iter()') || line.includes('.into_iter()')) {
                const optimization = this.suggestIteratorChainOptimization(line);
                iterations.push({
                    iteratorType: line.includes('.into_iter()') ? 'into_iter' : 'iter',
                    optimization,
                    line: i + 1
                });
            }
        }

        return iterations;
    }

    private findBenchmarks(text: string): RustBenchmark[] {
        const benchmarks: RustBenchmark[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Built-in benchmarks
            if (line.includes('#[bench]')) {
                const nextLine = lines[i + 1];
                const funcMatch = nextLine?.match(/fn\s+(\w+)/);
                if (funcMatch) {
                    benchmarks.push({
                        name: funcMatch[1],
                        framework: 'built-in',
                        metrics: ['time'],
                        line: i + 2
                    });
                }
            }

            // Criterion benchmarks
            if (line.includes('criterion_group!') || line.includes('Criterion::default()')) {
                benchmarks.push({
                    name: 'criterion_benchmark',
                    framework: 'criterion',
                    metrics: ['time', 'throughput', 'memory'],
                    line: i + 1
                });
            }
        }

        return benchmarks;
    }

    private analyzeSafety(text: string): RustSafety {
        return {
            unsafeBlocks: this.findUnsafeBlocks(text),
            unsafeFunctions: this.findUnsafeFunctions(text),
            rawPointers: this.findRawPointers(text),
            ffiCalls: this.findFFICalls(text)
        };
    }

    private findUnsafeBlocks(text: string): RustUnsafeBlock[] {
        const blocks: RustUnsafeBlock[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('unsafe {')) {
                const operations = this.extractUnsafeOperations(text, i);
                const safetyComment = this.findSafetyComment(text, i);
                
                blocks.push({
                    reason: this.determineUnsafeReason(operations),
                    operations,
                    safetyComment: safetyComment,
                    line: i + 1
                });
            }
        }

        return blocks;
    }

    private findUnsafeFunctions(text: string): RustUnsafeFunction[] {
        const functions: RustUnsafeFunction[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const unsafeFnMatch = line.match(/unsafe\s+fn\s+(\w+)/);
            if (unsafeFnMatch) {
                const functionName = unsafeFnMatch[1];
                const preconditions = this.extractPreconditions(text, i);
                
                functions.push({
                    name: functionName,
                    reason: '用户定义的不安全函数',
                    preconditions,
                    line: i + 1
                });
            }
        }

        return functions;
    }

    private findRawPointers(text: string): RustRawPointer[] {
        const pointers: RustRawPointer[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // *const T
            const constPtrMatch = line.match(/\*const\s+(\w+)/);
            if (constPtrMatch) {
                pointers.push({
                    pointerType: '*const',
                    targetType: constPtrMatch[1],
                    usage: line.trim(),
                    line: i + 1
                });
            }

            // *mut T
            const mutPtrMatch = line.match(/\*mut\s+(\w+)/);
            if (mutPtrMatch) {
                pointers.push({
                    pointerType: '*mut',
                    targetType: mutPtrMatch[1],
                    usage: line.trim(),
                    line: i + 1
                });
            }
        }

        return pointers;
    }

    private findFFICalls(text: string): RustFFICall[] {
        const ffiCalls: RustFFICall[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const externMatch = line.match(/extern\s+"([^"]+)"\s*{/);
            if (externMatch) {
                const bindingType = `extern "${externMatch[1]}"` as any;
                
                // 查找外部函数
                for (let j = i + 1; j < lines.length; j++) {
                    const fnLine = lines[j];
                    if (fnLine.includes('}')) {break;}
                    
                    const fnMatch = fnLine.match(/fn\s+(\w+)/);
                    if (fnMatch) {
                        ffiCalls.push({
                            libraryName: 'unknown',
                            functionName: fnMatch[1],
                            bindingType,
                            line: j + 1
                        });
                    }
                }
            }
        }

        return ffiCalls;
    }

    // 辅助方法
    private extractMacroRules(text: string, startLine: number): MacroRule[] {
        // 简化实现
        return [];
    }

    private translateMacroName(name: string): string {
        const translations = new Map([
            ['println', '打印宏'],
            ['format', '格式化宏'],
            ['vec', '向量宏'],
            ['panic', '恐慌宏'],
            ['assert', '断言宏'],
            ['debug_assert', '调试断言宏']
        ]);

        return translations.get(name) || `${name}宏`;
    }

    private translateDeriveMacro(derive: string): string {
        const translations = new Map([
            ['Debug', '调试特征'],
            ['Clone', '克隆特征'],
            ['Copy', '复制特征'],
            ['PartialEq', '部分相等特征'],
            ['Eq', '相等特征'],
            ['PartialOrd', '部分排序特征'],
            ['Ord', '排序特征'],
            ['Hash', '哈希特征'],
            ['Default', '默认特征'],
            ['Serialize', '序列化特征'],
            ['Deserialize', '反序列化特征']
        ]);

        return translations.get(derive) || `${derive}特征`;
    }

    private determineLifetimeScope(text: string, lifetimeName: string): string {
        if (text.includes(`impl<'${lifetimeName}>`)) {return '实现块';}
        if (text.includes(`fn `) && text.includes(`'${lifetimeName}`)) {return '函数';}
        if (text.includes(`struct `) && text.includes(`'${lifetimeName}`)) {return '结构体';}
        return '未知';
    }

    private findLifetimeConstraints(text: string, lifetimeName: string): string[] {
        const constraints: string[] = [];
        const pattern = new RegExp(`'${lifetimeName}:\\s*([^,>\\s]+)`, 'g');
        let match;
        while ((match = pattern.exec(text)) !== null) {
            constraints.push(match[1]);
        }
        return constraints;
    }

    private findFunctionsUsingLifetime(text: string, lifetimeName: string): string[] {
        const functions: string[] = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.includes(`'${lifetimeName}`) && line.includes('fn ')) {
                const fnMatch = line.match(/fn\s+(\w+)/);
                if (fnMatch) {
                    functions.push(fnMatch[1]);
                }
            }
        }
        
        return functions;
    }

    private findStructsUsingLifetime(text: string, lifetimeName: string): string[] {
        const structs: string[] = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.includes(`'${lifetimeName}`) && line.includes('struct ')) {
                const structMatch = line.match(/struct\s+(\w+)/);
                if (structMatch) {
                    structs.push(structMatch[1]);
                }
            }
        }
        
        return structs;
    }

    private extractChannelDataType(line: string): string {
        const typeMatch = line.match(/::<([^>]+)>/);
        return typeMatch ? typeMatch[1] : 'unknown';
    }

    private determineMutexType(line: string): 'std::sync::Mutex' | 'tokio::sync::Mutex' | 'parking_lot::Mutex' {
        if (line.includes('tokio::sync::Mutex')) {return 'tokio::sync::Mutex';}
        if (line.includes('parking_lot::Mutex')) {return 'parking_lot::Mutex';}
        return 'std::sync::Mutex';
    }

    private extractMutexDataType(line: string): string {
        const typeMatch = line.match(/Mutex::new\(([^)]+)\)/);
        return typeMatch ? 'inferred' : 'unknown';
    }

    private findAtomicOperations(text: string, varName: string): string[] {
        const operations: string[] = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (line.includes(`${varName}.`)) {
                const opMatch = line.match(new RegExp(`${varName}\\.(\\w+)`));
                if (opMatch) {
                    operations.push(opMatch[1]);
                }
            }
        }
        
        return [...new Set(operations)];
    }

    private extractJoinHandles(line: string): string[] {
        const match = line.match(/join!\s*\(([^)]+)\)/);
        if (match) {
            return match[1].split(',').map(h => h.trim());
        }
        return [];
    }

    private extractSelectHandles(line: string): string[] {
        // 简化实现
        return ['select_handle'];
    }

    private isCloneNecessary(text: string, lineIndex: number, target: string): boolean {
        // 简化的分析：检查是否在移动后使用
        const lines = text.split('\n');
        const currentLine = lines[lineIndex];
        
        // 如果在函数调用中克隆，可能是必要的
        return currentLine.includes('(') && currentLine.includes(')');
    }

    private suggestIteratorOptimization(line: string): string[] {
        const suggestions: string[] = [];
        
        if (line.includes('.collect()')) {
            suggestions.push('考虑避免collect()，直接使用迭代器');
        }
        
        if (line.includes('.iter()') && line.includes('.enumerate()')) {
            suggestions.push('考虑使用.iter().enumerate()优化');
        }
        
        return suggestions;
    }

    private suggestIteratorChainOptimization(line: string): string[] {
        const suggestions: string[] = [];
        
        const mapMatches = line.match(/\.map\(/g);
        if (mapMatches && mapMatches.length > 1) {
            suggestions.push('考虑合并多个map调用');
        }
        
        if (line.includes('.filter(') && line.includes('.map(')) {
            suggestions.push('考虑filter_map优化');
        }
        
        return suggestions;
    }

    private extractUnsafeOperations(text: string, startLine: number): string[] {
        const operations: string[] = [];
        const lines = text.split('\n');
        let braceCount = 0;
        
        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            if (line.includes('*')) {operations.push('指针解引用');}
            if (line.includes('transmute')) {operations.push('类型转换');}
            if (line.includes('from_raw')) {operations.push('原始指针转换');}
            
            if (braceCount === 0) {break;}
        }
        
        return operations;
    }

    private findSafetyComment(text: string, lineIndex: number): string | undefined {
        const lines = text.split('\n');
        
        // 查找前面的注释
        for (let i = lineIndex - 1; i >= Math.max(0, lineIndex - 3); i--) {
            const line = lines[i].trim();
            if (line.startsWith('// SAFETY:') || line.startsWith('/// # Safety')) {
                return line;
            }
        }
        
        return undefined;
    }

    private determineUnsafeReason(operations: string[]): string {
        if (operations.includes('指针解引用')) {return '指针解引用操作';}
        if (operations.includes('类型转换')) {return '类型转换操作';}
        if (operations.includes('原始指针转换')) {return '原始指针操作';}
        return '不安全操作';
    }

    private extractPreconditions(text: string, lineIndex: number): string[] {
        const preconditions: string[] = [];
        const lines = text.split('\n');
        
        // 查找文档注释中的前置条件
        for (let i = lineIndex - 1; i >= Math.max(0, lineIndex - 10); i--) {
            const line = lines[i].trim();
            if (line.startsWith('/// # Preconditions') || line.startsWith('/// # Safety')) {
                preconditions.push(line.substring(4));
            }
        }
        
        return preconditions;
    }
}
