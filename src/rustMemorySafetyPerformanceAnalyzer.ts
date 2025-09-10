import * as vscode from 'vscode';

export interface RustMemorySafetyPerformanceAnalysis {
    memorySafetyIssues: MemorySafetyIssue[];
    performanceBottlenecks: PerformanceBottleneck[];
    lifetimeOptimizations: LifetimeOptimization[];
    borrowCheckerTips: BorrowCheckerTip[];
    allocatorOptimizations: AllocatorOptimization[];
    overallScore: {
        memorySafety: number;
        performance: number;
        lifetimeDesign: number;
        borrowingEfficiency: number;
        allocationEfficiency: number;
        overall: number;
    };
}

export interface MemorySafetyIssue {
    issueType: 'unsafe_block' | 'raw_pointer' | 'transmute' | 'memory_leak' | 'double_free';
    line: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    riskAssessment: string;
    safeAlternative: string;
    mitigation: string;
    codeExample: string;
    performanceImpact: string;
}

export interface PerformanceBottleneck {
    bottleneckType: 'allocation_hotspot' | 'clone_heavy' | 'string_concatenation' | 'inefficient_loop' | 'boxing_overhead';
    function: string;
    line: number;
    impact: 'high' | 'medium' | 'low';
    description: string;
    optimization: string;
    expectedImprovement: string;
    benchmarkData: string;
    implementation: string;
}

export interface LifetimeOptimization {
    pattern: string;
    line: number;
    currentLifetime: string;
    suggestedLifetime: string;
    benefit: string;
    complexity: 'simple' | 'moderate' | 'complex';
    explanation: string;
    codeExample: string;
}

export interface BorrowCheckerTip {
    situation: string;
    line: number;
    problem: string;
    solution: string;
    pattern: 'move_semantics' | 'borrowing' | 'ownership' | 'lifetime';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    alternatives: string[];
}

export interface AllocatorOptimization {
    allocationType: 'vec_preallocation' | 'string_capacity' | 'hashmap_capacity' | 'custom_allocator';
    line: number;
    currentUsage: string;
    optimizedUsage: string;
    memoryBenefit: string;
    performanceBenefit: string;
    tradeoffs: string;
}

export class RustMemorySafetyPerformanceAnalyzer {
    
    async analyzeMemorySafetyPerformance(content: string, fileName: string): Promise<RustMemorySafetyPerformanceAnalysis> {
        const lines = content.split('\n');
        
        const memorySafetyIssues = this.analyzeMemorySafety(lines);
        const performanceBottlenecks = this.analyzePerformanceBottlenecks(lines);
        const lifetimeOptimizations = this.analyzeLifetimes(lines);
        const borrowCheckerTips = this.analyzeBorrowingPatterns(lines);
        const allocatorOptimizations = this.analyzeAllocatorUsage(lines);
        const overallScore = this.calculateOverallScore(
            memorySafetyIssues,
            performanceBottlenecks,
            lifetimeOptimizations,
            borrowCheckerTips,
            allocatorOptimizations
        );

        return {
            memorySafetyIssues,
            performanceBottlenecks,
            lifetimeOptimizations,
            borrowCheckerTips,
            allocatorOptimizations,
            overallScore
        };
    }

    private analyzeMemorySafety(lines: string[]): MemorySafetyIssue[] {
        const issues: MemorySafetyIssue[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测unsafe块
            if (trimmed.includes('unsafe')) {
                const unsafeMatch = line.match(/unsafe\s*\{([^}]*)\}/);
                if (unsafeMatch) {
                    const unsafeContent = unsafeMatch[1];
                    let severity: 'critical' | 'high' | 'medium' | 'low' = 'high';
                    let riskAssessment = '';
                    
                    if (unsafeContent.includes('transmute')) {
                        severity = 'critical';
                        riskAssessment = '类型转换可能导致未定义行为';
                    } else if (unsafeContent.includes('*mut') || unsafeContent.includes('*const')) {
                        severity = 'high';
                        riskAssessment = '原始指针操作需要手动确保内存安全';
                    }

                    issues.push({
                        issueType: 'unsafe_block',
                        line: index + 1,
                        severity,
                        description: 'unsafe代码块需要仔细审查',
                        riskAssessment,
                        safeAlternative: '考虑使用安全的Rust抽象或标准库函数',
                        mitigation: '确保所有不变量得到维护，添加详细的安全注释',
                        codeExample: `// 替代方案：使用Vec::from_raw_parts的安全包装
fn safe_from_raw_parts<T>(ptr: *mut T, length: usize, capacity: usize) -> Option<Vec<T>> {
    if ptr.is_null() || length > capacity {
        return None;
    }
    Some(unsafe { Vec::from_raw_parts(ptr, length, capacity) })
}`,
                        performanceImpact: '安全抽象通常有轻微性能开销，但提供更好的安全保证'
                    });
                }
            }

            // 检测原始指针使用
            if (trimmed.includes('*mut') || trimmed.includes('*const')) {
                issues.push({
                    issueType: 'raw_pointer',
                    line: index + 1,
                    severity: 'high',
                    description: '原始指针使用需要特别注意内存安全',
                    riskAssessment: '可能导致空指针解引用、使用后释放、缓冲区溢出',
                    safeAlternative: '使用Box、Rc、Arc或引用代替原始指针',
                    mitigation: '确保指针有效性，使用RAII模式管理资源',
                    codeExample: `// 使用Box代替原始指针
let boxed_value = Box::new(42);
let reference = &*boxed_value; // 安全的引用`,
                    performanceImpact: '智能指针有轻微开销，但提供自动内存管理'
                });
            }

            // 检测transmute使用
            if (trimmed.includes('transmute')) {
                issues.push({
                    issueType: 'transmute',
                    line: index + 1,
                    severity: 'critical',
                    description: 'transmute是最危险的操作之一',
                    riskAssessment: '可能导致内存损坏、未定义行为、安全漏洞',
                    safeAlternative: '使用From/Into trait或专门的转换函数',
                    mitigation: '只在绝对必要时使用，添加大量测试和文档',
                    codeExample: `// 安全的替代方案
impl From<u32> for MyStruct {
    fn from(value: u32) -> Self {
        MyStruct { field: value }
    }
}`,
                    performanceImpact: '安全转换可能有性能开销，但避免了未定义行为风险'
                });
            }

            // 检测可能的内存泄漏模式
            if (trimmed.includes('Rc::new') && trimmed.includes('RefCell')) {
                issues.push({
                    issueType: 'memory_leak',
                    line: index + 1,
                    severity: 'medium',
                    description: 'Rc<RefCell<T>>模式可能导致循环引用',
                    riskAssessment: '如果形成循环引用，可能导致内存泄漏',
                    safeAlternative: '使用Weak引用打破循环，或重新设计避免循环',
                    mitigation: '仔细设计引用关系，使用Weak<T>打破循环',
                    codeExample: `// 使用Weak引用避免循环
struct Node {
    parent: Option<Weak<RefCell<Node>>>,
    children: Vec<Rc<RefCell<Node>>>,
}`,
                    performanceImpact: 'Weak引用有轻微性能开销，但避免内存泄漏'
                });
            }
        });

        return issues;
    }

    private analyzePerformanceBottlenecks(lines: string[]): PerformanceBottleneck[] {
        const bottlenecks: PerformanceBottleneck[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测频繁的clone
            if (trimmed.includes('.clone()') && !trimmed.includes('//')) {
                let impact: 'high' | 'medium' | 'low' = 'medium';
                if (trimmed.includes('Vec') || trimmed.includes('String') || trimmed.includes('HashMap')) {
                    impact = 'high';
                }

                bottlenecks.push({
                    bottleneckType: 'clone_heavy',
                    function: this.extractFunctionName(lines, index),
                    line: index + 1,
                    impact,
                    description: '频繁的clone操作可能影响性能',
                    optimization: '考虑使用借用、引用计数或写时复制',
                    expectedImprovement: '避免不必要的内存分配和复制，性能提升20-80%',
                    benchmarkData: '大型数据结构clone可能消耗毫秒级时间',
                    implementation: `// 优化方案：
// 1. 使用借用
fn process_data(data: &Vec<i32>) { /* ... */ }
// 2. 使用Rc进行共享
let shared_data = Rc::new(expensive_data);
// 3. 使用Arc进行多线程共享
let thread_safe_data = Arc::new(expensive_data);`
                });
            }

            // 检测字符串连接
            if (trimmed.includes('push_str') && trimmed.includes('&format!')) {
                bottlenecks.push({
                    bottleneckType: 'string_concatenation',
                    function: this.extractFunctionName(lines, index),
                    line: index + 1,
                    impact: 'high',
                    description: '低效的字符串连接模式',
                    optimization: '使用format!宏或预分配容量的String',
                    expectedImprovement: '减少内存分配次数，性能提升30-70%',
                    benchmarkData: '避免多次内存重新分配',
                    implementation: `// 优化方案：
// 1. 使用format!宏
let result = format!("{}{}{}", a, b, c);
// 2. 预分配容量
let mut s = String::with_capacity(estimated_size);
s.push_str(&a);
s.push_str(&b);`
                });
            }

            // 检测装箱开销
            if (trimmed.includes('Box::new') && trimmed.includes('loop')) {
                bottlenecks.push({
                    bottleneckType: 'boxing_overhead',
                    function: this.extractFunctionName(lines, index),
                    line: index + 1,
                    impact: 'medium',
                    description: '循环中频繁装箱可能导致性能问题',
                    optimization: '考虑使用栈分配或预分配容器',
                    expectedImprovement: '减少堆分配开销，性能提升15-40%',
                    benchmarkData: '每次装箱都需要堆分配',
                    implementation: `// 优化方案：
// 1. 使用Vec预分配
let mut items = Vec::with_capacity(expected_count);
// 2. 考虑栈分配的替代方案
let stack_array = [0; FIXED_SIZE];`
                });
            }

            // 检测低效循环
            if (trimmed.includes('for') && (trimmed.includes('.iter()') && trimmed.includes('.collect()'))) {
                bottlenecks.push({
                    bottleneckType: 'inefficient_loop',
                    function: this.extractFunctionName(lines, index),
                    line: index + 1,
                    impact: 'medium',
                    description: '可能可以优化的迭代器链',
                    optimization: '使用更高效的迭代器方法或并行处理',
                    expectedImprovement: '减少中间分配，可能提升10-50%性能',
                    benchmarkData: 'collect()会创建新的集合',
                    implementation: `// 优化方案：
// 1. 避免不必要的collect
items.iter().filter(|x| condition(x)).for_each(|x| process(x));
// 2. 使用rayon进行并行处理
use rayon::prelude::*;
items.par_iter().filter(|x| condition(x)).collect()`
                });
            }
        });

        return bottlenecks;
    }

    private analyzeLifetimes(lines: string[]): LifetimeOptimization[] {
        const optimizations: LifetimeOptimization[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测可能可以简化的生命周期
            if (trimmed.includes("'a") && trimmed.includes("'b")) {
                optimizations.push({
                    pattern: '多个生命周期参数',
                    line: index + 1,
                    currentLifetime: "使用了多个生命周期参数 'a, 'b",
                    suggestedLifetime: '考虑是否可以统一生命周期',
                    benefit: '简化代码，提高可读性',
                    complexity: 'moderate',
                    explanation: '如果两个引用总是有相同的生命周期，可以统一',
                    codeExample: `// 简化前
fn process<'a, 'b>(x: &'a str, y: &'b str) -> &'a str
// 简化后（如果适用）
fn process<'a>(x: &'a str, y: &'a str) -> &'a str`
                });
            }

            // 检测生命周期省略机会
            if (trimmed.includes('fn') && trimmed.includes('&') && !trimmed.includes("'")) {
                const paramCount = (trimmed.match(/&/g) || []).length;
                if (paramCount === 1) {
                    optimizations.push({
                        pattern: '生命周期省略',
                        line: index + 1,
                        currentLifetime: '显式生命周期注解',
                        suggestedLifetime: '可以利用生命周期省略规则',
                        benefit: '代码更简洁，减少样板代码',
                        complexity: 'simple',
                        explanation: '当只有一个输入引用时，输出引用的生命周期可以省略',
                        codeExample: `// 可以省略生命周期
fn get_first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}`
                    });
                }
            }
        });

        return optimizations;
    }

    private analyzeBorrowingPatterns(lines: string[]): BorrowCheckerTip[] {
        const tips: BorrowCheckerTip[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测移动语义问题
            if (trimmed.includes('let') && trimmed.includes('=') && !trimmed.includes('&')) {
                const nextLine = lines[index + 1];
                if (nextLine && nextLine.includes(trimmed.split('=')[0].trim().split(' ')[1])) {
                    tips.push({
                        situation: '值移动后使用',
                        line: index + 1,
                        problem: '值被移动后不能再使用',
                        solution: '使用引用或clone',
                        pattern: 'move_semantics',
                        difficulty: 'beginner',
                        alternatives: [
                            '使用&来借用而不是移动',
                            '使用clone()创建副本',
                            '重新设计避免移动'
                        ]
                    });
                }
            }

            // 检测借用检查器常见问题
            if (trimmed.includes('&mut') && trimmed.includes('&')) {
                tips.push({
                    situation: '可变引用与不可变引用混用',
                    line: index + 1,
                    problem: '不能同时存在可变引用和不可变引用',
                    solution: '限制引用的作用域或使用RefCell/Mutex',
                    pattern: 'borrowing',
                    difficulty: 'intermediate',
                    alternatives: [
                        '使用作用域限制引用生命周期',
                        '使用RefCell进行内部可变性',
                        '重构代码避免同时借用'
                    ]
                });
            }

            // 检测所有权模式
            if (trimmed.includes('Vec::new()') && lines.slice(index, index + 5).some(l => l.includes('push'))) {
                tips.push({
                    situation: 'Vec所有权管理',
                    line: index + 1,
                    problem: '可能的所有权转移问题',
                    solution: '明确Vec的所有权模式',
                    pattern: 'ownership',
                    difficulty: 'beginner',
                    alternatives: [
                        '返回Vec的所有权',
                        '传递&mut Vec进行修改',
                        '使用建造者模式'
                    ]
                });
            }
        });

        return tips;
    }

    private analyzeAllocatorUsage(lines: string[]): AllocatorOptimization[] {
        const optimizations: AllocatorOptimization[] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // 检测Vec预分配机会
            if (trimmed.includes('Vec::new()')) {
                const nextLines = lines.slice(index, index + 10);
                const pushCount = nextLines.filter(l => l.includes('push')).length;
                
                if (pushCount >= 3) {
                    optimizations.push({
                        allocationType: 'vec_preallocation',
                        line: index + 1,
                        currentUsage: 'Vec::new()',
                        optimizedUsage: `Vec::with_capacity(${pushCount})`,
                        memoryBenefit: '减少内存重新分配次数',
                        performanceBenefit: `避免${pushCount}次潜在的内存重新分配`,
                        tradeoffs: '预分配可能浪费内存，但提升性能'
                    });
                }
            }

            // 检测String容量优化
            if (trimmed.includes('String::new()')) {
                const nextLines = lines.slice(index, index + 10);
                const hasStringOps = nextLines.some(l => l.includes('push_str') || l.includes('format!'));
                
                if (hasStringOps) {
                    optimizations.push({
                        allocationType: 'string_capacity',
                        line: index + 1,
                        currentUsage: 'String::new()',
                        optimizedUsage: 'String::with_capacity(estimated_size)',
                        memoryBenefit: '减少字符串扩容时的内存复制',
                        performanceBenefit: '字符串操作性能提升20-50%',
                        tradeoffs: '需要估算字符串大小'
                    });
                }
            }

            // 检测HashMap容量优化
            if (trimmed.includes('HashMap::new()')) {
                optimizations.push({
                    allocationType: 'hashmap_capacity',
                    line: index + 1,
                    currentUsage: 'HashMap::new()',
                    optimizedUsage: 'HashMap::with_capacity(expected_size)',
                    memoryBenefit: '减少哈希表重新散列',
                    performanceBenefit: '避免昂贵的重新散列操作',
                    tradeoffs: '需要预估元素数量'
                });
            }
        });

        return optimizations;
    }

    private calculateOverallScore(
        memorySafetyIssues: MemorySafetyIssue[],
        performanceBottlenecks: PerformanceBottleneck[],
        lifetimeOptimizations: LifetimeOptimization[],
        borrowCheckerTips: BorrowCheckerTip[],
        allocatorOptimizations: AllocatorOptimization[]
    ) {
        // 内存安全评分
        const criticalSafety = memorySafetyIssues.filter(i => i.severity === 'critical').length;
        const highSafety = memorySafetyIssues.filter(i => i.severity === 'high').length;
        const memorySafetyScore = Math.max(0, 100 - (criticalSafety * 40) - (highSafety * 20));

        // 性能评分
        const highPerfBottlenecks = performanceBottlenecks.filter(b => b.impact === 'high').length;
        const mediumPerfBottlenecks = performanceBottlenecks.filter(b => b.impact === 'medium').length;
        const performanceScore = Math.max(0, 100 - (highPerfBottlenecks * 25) - (mediumPerfBottlenecks * 15));

        // 生命周期设计评分
        const complexLifetimes = lifetimeOptimizations.filter(l => l.complexity === 'complex').length;
        const lifetimeScore = Math.max(0, 100 - (complexLifetimes * 20) - (lifetimeOptimizations.length * 5));

        // 借用效率评分
        const advancedBorrowIssues = borrowCheckerTips.filter(t => t.difficulty === 'advanced').length;
        const borrowingScore = Math.max(0, 100 - (advancedBorrowIssues * 30) - (borrowCheckerTips.length * 10));

        // 分配效率评分
        const allocationScore = Math.max(20, 100 - (allocatorOptimizations.length * 15));

        // 总分
        const overallScore = Math.round(
            (memorySafetyScore * 0.3 + performanceScore * 0.25 + lifetimeScore * 0.2 + 
             borrowingScore * 0.15 + allocationScore * 0.1)
        );

        return {
            memorySafety: Math.round(memorySafetyScore),
            performance: Math.round(performanceScore),
            lifetimeDesign: Math.round(lifetimeScore),
            borrowingEfficiency: Math.round(borrowingScore),
            allocationEfficiency: Math.round(allocationScore),
            overall: overallScore
        };
    }

    private extractFunctionName(lines: string[], currentIndex: number): string {
        // 向上查找函数定义
        for (let i = currentIndex; i >= 0 && i >= currentIndex - 20; i--) {
            const line = lines[i].trim();
            if (line.startsWith('fn ')) {
                const match = line.match(/fn\s+(\w+)/);
                if (match) {
                    return match[1];
                }
            }
        }
        return 'unknown';
    }
}
