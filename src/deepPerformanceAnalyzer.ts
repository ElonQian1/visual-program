import * as vscode from 'vscode';

// React和Rust深度性能分析器
export interface PerformanceAnalysisResult {
    language: 'react' | 'rust';
    overallScore: number; // 0-100
    metrics: PerformanceMetrics;
    bottlenecks: PerformanceBottleneck[];
    optimizations: PerformanceOptimization[];
    predictions: PerformancePrediction;
}

export interface PerformanceMetrics {
    // React性能指标
    renderComplexity?: number;
    rerenderRisk?: number;
    bundleImpact?: number;
    memoryUsage?: number;
    
    // Rust性能指标
    algorithmicComplexity?: number;
    memoryEfficiency?: number;
    concurrencyScore?: number;
    ioEfficiency?: number;
}

export interface PerformanceBottleneck {
    type: 'render' | 'memory' | 'algorithm' | 'io' | 'concurrency';
    severity: 'critical' | 'high' | 'medium' | 'low';
    location: { line: number; column: number };
    description: string;
    impact: string;
    estimatedCost: number; // 性能开销估算 (ms 或 bytes)
}

export interface PerformanceOptimization {
    category: 'caching' | 'lazy-loading' | 'algorithm' | 'memory' | 'concurrent';
    priority: 'high' | 'medium' | 'low';
    description: string;
    implementation: string;
    expectedGain: number; // 预期性能提升百分比
    effort: 'low' | 'medium' | 'high';
    codeExample?: {
        before: string;
        after: string;
    };
}

export interface PerformancePrediction {
    loadTime?: number; // React 组件加载时间 (ms)
    renderTime?: number; // React 渲染时间 (ms)
    memoryFootprint?: number; // 内存占用 (bytes)
    executionTime?: number; // Rust 执行时间 (ms)
    scalability: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
}

export class DeepPerformanceAnalyzer {
    private performanceCache = new Map<string, PerformanceAnalysisResult>();

    // 🚀 主要分析入口
    async analyzePerformance(document: vscode.TextDocument): Promise<PerformanceAnalysisResult> {
        const content = document.getText();
        const language = document.languageId;

        // 检查缓存
        const cacheKey = `${document.uri.toString()}-${document.version}`;
        if (this.performanceCache.has(cacheKey)) {
            return this.performanceCache.get(cacheKey)!;
        }

        let result: PerformanceAnalysisResult;

        if (this.isReactFile(language, content)) {
            result = await this.analyzeReactPerformance(content);
        } else if (language === 'rust') {
            result = await this.analyzeRustPerformance(content);
        } else {
            // 通用分析
            result = {
                language: 'react', // 默认
                overallScore: 50,
                metrics: {},
                bottlenecks: [],
                optimizations: [],
                predictions: {
                    scalability: 'fair',
                    recommendations: ['添加更多语言支持以获得详细分析']
                }
            };
        }

        // 缓存结果
        this.performanceCache.set(cacheKey, result);
        return result;
    }

    // ⚛️ React性能分析
    private async analyzeReactPerformance(content: string): Promise<PerformanceAnalysisResult> {
        const metrics = this.calculateReactMetrics(content);
        const bottlenecks = this.detectReactBottlenecks(content);
        const optimizations = this.generateReactOptimizations(content, bottlenecks);
        const predictions = this.predictReactPerformance(content, metrics);

        const overallScore = this.calculateReactScore(metrics, bottlenecks.length);

        return {
            language: 'react',
            overallScore,
            metrics,
            bottlenecks,
            optimizations,
            predictions
        };
    }

    // 🦀 Rust性能分析
    private async analyzeRustPerformance(content: string): Promise<PerformanceAnalysisResult> {
        const metrics = this.calculateRustMetrics(content);
        const bottlenecks = this.detectRustBottlenecks(content);
        const optimizations = this.generateRustOptimizations(content, bottlenecks);
        const predictions = this.predictRustPerformance(content, metrics);

        const overallScore = this.calculateRustScore(metrics, bottlenecks.length);

        return {
            language: 'rust',
            overallScore,
            metrics,
            bottlenecks,
            optimizations,
            predictions
        };
    }

    // ⚛️ React性能指标计算
    private calculateReactMetrics(content: string): PerformanceMetrics {
        const lines = content.split('\n');
        
        // 渲染复杂度分析
        let renderComplexity = 0;
        let mapOperations = 0;
        let conditionalRendering = 0;
        let nestedComponents = 0;

        lines.forEach(line => {
            if (line.includes('.map(')) mapOperations++;
            if (line.includes('&&') || line.includes('?')) conditionalRendering++;
            if (line.includes('<') && line.includes('>')) nestedComponents++;
        });

        renderComplexity = mapOperations * 2 + conditionalRendering + nestedComponents * 0.5;

        // 重渲染风险评估
        const stateCount = (content.match(/useState\(/g) || []).length;
        const effectCount = (content.match(/useEffect\(/g) || []).length;
        const propsUsage = (content.match(/props\./g) || []).length;
        
        const rerenderRisk = (stateCount * 10 + effectCount * 5 + propsUsage * 2) / 10;

        // Bundle影响估算
        const importCount = (content.match(/^import/gm) || []).length;
        const exportCount = (content.match(/^export/gm) || []).length;
        const bundleImpact = importCount * 2 + exportCount;

        // 内存使用估算 (KB)
        const componentSize = content.length / 1024;
        const memoryUsage = componentSize * (stateCount + 1) * 0.5;

        return {
            renderComplexity: Math.min(100, renderComplexity),
            rerenderRisk: Math.min(100, rerenderRisk),
            bundleImpact: Math.min(100, bundleImpact),
            memoryUsage: Math.round(memoryUsage)
        };
    }

    // 🦀 Rust性能指标计算
    private calculateRustMetrics(content: string): PerformanceMetrics {
        const lines = content.split('\n');
        
        // 算法复杂度分析
        let loopNesting = 0;
        let currentNesting = 0;
        let maxNesting = 0;

        lines.forEach(line => {
            if (line.includes('for ') || line.includes('while ')) {
                currentNesting++;
                maxNesting = Math.max(maxNesting, currentNesting);
            }
            if (line.includes('}')) {
                currentNesting = Math.max(0, currentNesting - 1);
            }
        });

        const algorithmicComplexity = Math.min(100, maxNesting * 20);

        // 内存效率分析
        const allocations = (content.match(/Vec::new|Box::new|HashMap::new/g) || []).length;
        const clones = (content.match(/\.clone\(\)/g) || []).length;
        const borrowing = (content.match(/&\w+/g) || []).length;

        const memoryEfficiency = Math.max(0, 100 - allocations * 5 - clones * 3 + borrowing * 2);

        // 并发性评分
        const asyncUsage = content.includes('async') ? 30 : 0;
        const threadUsage = content.includes('thread::') ? 20 : 0;
        const concurrencyPrimitives = (content.match(/Mutex|RwLock|Arc/g) || []).length * 10;

        const concurrencyScore = Math.min(100, asyncUsage + threadUsage + concurrencyPrimitives);

        // I/O效率分析
        const ioOperations = (content.match(/std::fs|tokio::fs|read|write/g) || []).length;
        const asyncIo = content.includes('tokio') || content.includes('.await') ? 30 : 0;
        
        const ioEfficiency = ioOperations > 0 ? Math.min(100, 50 + asyncIo) : 100;

        return {
            algorithmicComplexity,
            memoryEfficiency: Math.round(memoryEfficiency),
            concurrencyScore,
            ioEfficiency
        };
    }

    // ⚛️ React瓶颈检测
    private detectReactBottlenecks(content: string): PerformanceBottleneck[] {
        const bottlenecks: PerformanceBottleneck[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // 检测渲染中的昂贵操作
            if ((line.includes('return (') || line.includes('return(')) && 
                lines.slice(index, index + 10).some(l => 
                    l.includes('.sort(') || l.includes('.filter(') || l.includes('new Date()')
                )) {
                bottlenecks.push({
                    type: 'render',
                    severity: 'high',
                    location: { line: index + 1, column: 0 },
                    description: '渲染函数中包含昂贵的操作',
                    impact: '每次渲染都会重新执行，影响性能',
                    estimatedCost: 10 // ms
                });
            }

            // 检测缺少依赖的useEffect
            if (line.includes('useEffect(') && !line.includes('[]') && !line.includes('[')) {
                bottlenecks.push({
                    type: 'render',
                    severity: 'medium',
                    location: { line: index + 1, column: 0 },
                    description: 'useEffect缺少依赖数组或依赖过多',
                    impact: '可能导致无限重渲染或性能问题',
                    estimatedCost: 5
                });
            }

            // 检测大型内联对象
            if (line.includes('{{') && line.length > 80) {
                bottlenecks.push({
                    type: 'memory',
                    severity: 'medium',
                    location: { line: index + 1, column: 0 },
                    description: '渲染中创建大型内联对象',
                    impact: '每次渲染都会创建新对象，影响性能',
                    estimatedCost: 1024 // bytes
                });
            }

            // 检测没有key的列表渲染
            if (line.includes('.map(') && !line.includes('key=')) {
                bottlenecks.push({
                    type: 'render',
                    severity: 'high',
                    location: { line: index + 1, column: 0 },
                    description: '列表渲染缺少key属性',
                    impact: 'React无法优化列表更新，导致性能问题',
                    estimatedCost: 15
                });
            }
        });

        return bottlenecks;
    }

    // 🦀 Rust瓶颈检测
    private detectRustBottlenecks(content: string): PerformanceBottleneck[] {
        const bottlenecks: PerformanceBottleneck[] = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // 检测频繁的clone操作
            if (line.includes('.clone()')) {
                bottlenecks.push({
                    type: 'memory',
                    severity: 'medium',
                    location: { line: index + 1, column: 0 },
                    description: 'clone()操作可能影响性能',
                    impact: '不必要的内存分配和复制',
                    estimatedCost: 1024 // bytes
                });
            }

            // 检测嵌套循环
            const forCount = (line.match(/for /g) || []).length;
            if (forCount > 0) {
                const loopContext = lines.slice(Math.max(0, index - 5), index + 5);
                const nestedLoops = loopContext.filter(l => l.includes('for ')).length;
                
                if (nestedLoops > 1) {
                    bottlenecks.push({
                        type: 'algorithm',
                        severity: 'high',
                        location: { line: index + 1, column: 0 },
                        description: '嵌套循环可能导致性能问题',
                        impact: '时间复杂度可能为O(n²)或更高',
                        estimatedCost: 100 // ms
                    });
                }
            }

            // 检测同步I/O操作
            if (line.includes('std::fs::read') || line.includes('std::fs::write')) {
                if (!content.includes('async') && !content.includes('tokio')) {
                    bottlenecks.push({
                        type: 'io',
                        severity: 'high',
                        location: { line: index + 1, column: 0 },
                        description: '同步I/O操作会阻塞线程',
                        impact: '可能导致应用响应性问题',
                        estimatedCost: 50 // ms
                    });
                }
            }

            // 检测未优化的字符串操作
            if (line.includes('String::new()') && lines.slice(index, index + 10).some(l => l.includes('push_str'))) {
                bottlenecks.push({
                    type: 'memory',
                    severity: 'medium',
                    location: { line: index + 1, column: 0 },
                    description: '字符串连接可能导致多次内存重新分配',
                    impact: '频繁的内存分配和复制',
                    estimatedCost: 512 // bytes
                });
            }
        });

        return bottlenecks;
    }

    // ⚛️ React优化建议生成
    private generateReactOptimizations(content: string, bottlenecks: PerformanceBottleneck[]): PerformanceOptimization[] {
        const optimizations: PerformanceOptimization[] = [];

        // 基于瓶颈生成优化建议
        bottlenecks.forEach(bottleneck => {
            switch (bottleneck.type) {
                case 'render':
                    if (bottleneck.description.includes('昂贵的操作')) {
                        optimizations.push({
                            category: 'caching',
                            priority: 'high',
                            description: '使用useMemo缓存昂贵的计算',
                            implementation: '将计算移到useMemo中',
                            expectedGain: 30,
                            effort: 'low',
                            codeExample: {
                                before: 'const result = expensiveCalculation(data);',
                                after: 'const result = useMemo(() => expensiveCalculation(data), [data]);'
                            }
                        });
                    }
                    break;
                case 'memory':
                    optimizations.push({
                        category: 'memory',
                        priority: 'medium',
                        description: '避免在渲染中创建新对象',
                        implementation: '将对象创建移到组件外部或使用useMemo',
                        expectedGain: 15,
                        effort: 'low'
                    });
                    break;
            }
        });

        // 通用优化建议
        if (!content.includes('React.memo')) {
            optimizations.push({
                category: 'caching',
                priority: 'medium',
                description: '使用React.memo防止不必要的重渲染',
                implementation: '包装组件或使用memo HOC',
                expectedGain: 25,
                effort: 'low',
                codeExample: {
                    before: 'export default MyComponent;',
                    after: 'export default React.memo(MyComponent);'
                }
            });
        }

        if (content.includes('.map(') && !content.includes('useCallback')) {
            optimizations.push({
                category: 'caching',
                priority: 'medium',
                description: '使用useCallback优化事件处理函数',
                implementation: '缓存事件处理函数避免子组件重渲染',
                expectedGain: 20,
                effort: 'low'
            });
        }

        return optimizations.sort((a, b) => {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        });
    }

    // 🦀 Rust优化建议生成
    private generateRustOptimizations(content: string, bottlenecks: PerformanceBottleneck[]): PerformanceOptimization[] {
        const optimizations: PerformanceOptimization[] = [];

        // 基于瓶颈生成优化建议
        bottlenecks.forEach(bottleneck => {
            switch (bottleneck.type) {
                case 'memory':
                    if (bottleneck.description.includes('clone()')) {
                        optimizations.push({
                            category: 'memory',
                            priority: 'high',
                            description: '减少clone()使用，使用引用或智能指针',
                            implementation: '使用&引用或Rc/Arc智能指针',
                            expectedGain: 40,
                            effort: 'medium',
                            codeExample: {
                                before: 'fn process(data: Vec<String>) { ... }',
                                after: 'fn process(data: &[String]) { ... }'
                            }
                        });
                    }
                    break;
                case 'algorithm':
                    optimizations.push({
                        category: 'algorithm',
                        priority: 'high',
                        description: '优化算法减少时间复杂度',
                        implementation: '使用更高效的数据结构或算法',
                        expectedGain: 60,
                        effort: 'high'
                    });
                    break;
                case 'io':
                    optimizations.push({
                        category: 'concurrent',
                        priority: 'high',
                        description: '使用异步I/O替代同步操作',
                        implementation: '使用tokio和async/await',
                        expectedGain: 50,
                        effort: 'medium',
                        codeExample: {
                            before: 'let content = std::fs::read_to_string("file.txt")?;',
                            after: 'let content = tokio::fs::read_to_string("file.txt").await?;'
                        }
                    });
                    break;
            }
        });

        // 通用优化建议
        if (content.includes('Vec::new()') && !content.includes('with_capacity')) {
            optimizations.push({
                category: 'memory',
                priority: 'medium',
                description: '预分配Vec容量避免重新分配',
                implementation: '使用Vec::with_capacity预分配',
                expectedGain: 25,
                effort: 'low',
                codeExample: {
                    before: 'let mut vec = Vec::new();',
                    after: 'let mut vec = Vec::with_capacity(expected_size);'
                }
            });
        }

        if (content.includes('HashMap::new()') && !content.includes('with_capacity')) {
            optimizations.push({
                category: 'memory',
                priority: 'medium',
                description: '预分配HashMap容量减少rehashing',
                implementation: '使用HashMap::with_capacity预分配',
                expectedGain: 20,
                effort: 'low'
            });
        }

        return optimizations.sort((a, b) => {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        });
    }

    // ⚛️ React性能预测
    private predictReactPerformance(content: string, metrics: PerformanceMetrics): PerformancePrediction {
        const renderTime = (metrics.renderComplexity || 0) * 0.5 + 2; // 基础渲染时间
        const loadTime = (metrics.bundleImpact || 0) * 0.8 + 10; // 组件加载时间
        const memoryFootprint = (metrics.memoryUsage || 0) * 1024; // 转换为bytes

        let scalability: 'excellent' | 'good' | 'fair' | 'poor';
        const complexityScore = (metrics.renderComplexity || 0) + (metrics.rerenderRisk || 0);
        
        if (complexityScore < 30) scalability = 'excellent';
        else if (complexityScore < 60) scalability = 'good';
        else if (complexityScore < 90) scalability = 'fair';
        else scalability = 'poor';

        const recommendations = [];
        if (renderTime > 16) { // 超过一帧时间
            recommendations.push('优化渲染性能，目标是低于16ms');
        }
        if (memoryFootprint > 1024 * 1024) { // 超过1MB
            recommendations.push('减少内存使用，考虑代码分割');
        }
        if (loadTime > 100) {
            recommendations.push('优化组件加载时间，使用懒加载');
        }

        return {
            renderTime: Math.round(renderTime),
            loadTime: Math.round(loadTime),
            memoryFootprint: Math.round(memoryFootprint),
            scalability,
            recommendations
        };
    }

    // 🦀 Rust性能预测
    private predictRustPerformance(content: string, metrics: PerformanceMetrics): PerformancePrediction {
        const executionTime = (metrics.algorithmicComplexity || 0) * 0.3 + 1;
        const memoryFootprint = (100 - (metrics.memoryEfficiency || 50)) * 100;

        let scalability: 'excellent' | 'good' | 'fair' | 'poor';
        const efficiencyScore = ((metrics.memoryEfficiency || 50) + (metrics.concurrencyScore || 50)) / 2;
        
        if (efficiencyScore > 80) scalability = 'excellent';
        else if (efficiencyScore > 60) scalability = 'good';
        else if (efficiencyScore > 40) scalability = 'fair';
        else scalability = 'poor';

        const recommendations = [];
        if (executionTime > 10) {
            recommendations.push('优化算法复杂度，目标是低于10ms');
        }
        if ((metrics.memoryEfficiency || 50) < 70) {
            recommendations.push('改进内存使用效率');
        }
        if ((metrics.concurrencyScore || 0) < 30) {
            recommendations.push('考虑使用异步编程提高并发性');
        }

        return {
            executionTime: Math.round(executionTime),
            memoryFootprint: Math.round(memoryFootprint),
            scalability,
            recommendations
        };
    }

    // 🔢 React性能评分计算
    private calculateReactScore(metrics: PerformanceMetrics, bottleneckCount: number): number {
        const complexityPenalty = (metrics.renderComplexity || 0) * 0.3;
        const rerenderPenalty = (metrics.rerenderRisk || 0) * 0.2;
        const bundlePenalty = (metrics.bundleImpact || 0) * 0.1;
        const bottleneckPenalty = bottleneckCount * 5;

        const totalPenalty = complexityPenalty + rerenderPenalty + bundlePenalty + bottleneckPenalty;
        return Math.max(0, Math.min(100, 100 - totalPenalty));
    }

    // 🔢 Rust性能评分计算
    private calculateRustScore(metrics: PerformanceMetrics, bottleneckCount: number): number {
        const algorithmPenalty = (metrics.algorithmicComplexity || 0) * 0.4;
        const memoryBonus = (metrics.memoryEfficiency || 50) * 0.3;
        const concurrencyBonus = (metrics.concurrencyScore || 0) * 0.2;
        const ioBonus = (metrics.ioEfficiency || 50) * 0.1;
        const bottleneckPenalty = bottleneckCount * 5;

        const score = memoryBonus + concurrencyBonus + ioBonus - algorithmPenalty - bottleneckPenalty;
        return Math.max(0, Math.min(100, score));
    }

    // 工具方法
    private isReactFile(language: string, content: string): boolean {
        return (language === 'typescript' || language === 'javascript' || 
                language === 'typescriptreact' || language === 'javascriptreact') &&
               (content.includes('React') || content.includes('jsx') || 
                content.includes('useState') || content.includes('useEffect'));
    }

    // 生成性能报告
    generatePerformanceReport(result: PerformanceAnalysisResult, fileName: string): string {
        const { language, overallScore, metrics, bottlenecks, optimizations, predictions } = result;
        
        const report = `
# 🚀 性能分析报告 - ${fileName}

## 📊 总体评分: ${overallScore}/100 ${this.getScoreEmoji(overallScore)}

## 🔍 性能指标
${language === 'react' ? this.formatReactMetrics(metrics) : this.formatRustMetrics(metrics)}

## ⚠️ 性能瓶颈 (${bottlenecks.length}个)
${bottlenecks.slice(0, 5).map((bottleneck, index) => 
    `${index + 1}. **${bottleneck.type}** (${bottleneck.severity}) - 行${bottleneck.location.line}
   ${bottleneck.description}
   💰 估算开销: ${bottleneck.estimatedCost}${bottleneck.type === 'memory' ? ' bytes' : ' ms'}`
).join('\n\n')}

## 💡 优化建议 (前5条)
${optimizations.slice(0, 5).map((opt, index) => 
    `${index + 1}. **${opt.category}** (${opt.priority}优先级)
   ${opt.description}
   🎯 预期提升: ${opt.expectedGain}%
   💪 实施难度: ${opt.effort}
   ${opt.codeExample ? `\n   \`\`\`${language}\n   // 优化前\n   ${opt.codeExample.before}\n   \n   // 优化后\n   ${opt.codeExample.after}\n   \`\`\`` : ''}`
).join('\n\n')}

## 🔮 性能预测
- **可扩展性**: ${predictions.scalability} ${this.getScalabilityEmoji(predictions.scalability)}
${language === 'react' ? 
    `- **渲染时间**: ${predictions.renderTime}ms
- **加载时间**: ${predictions.loadTime}ms` :
    `- **执行时间**: ${predictions.executionTime}ms`
}
- **内存占用**: ${Math.round((predictions.memoryFootprint || 0) / 1024)}KB

## 📋 改进建议
${predictions.recommendations.map(rec => `• ${rec}`).join('\n')}

---
*由深度性能分析器生成*
`;
        
        return report;
    }

    private formatReactMetrics(metrics: PerformanceMetrics): string {
        return `
- **渲染复杂度**: ${metrics.renderComplexity}/100 ${this.getMetricEmoji(metrics.renderComplexity)}
- **重渲染风险**: ${metrics.rerenderRisk}/100 ${this.getMetricEmoji(metrics.rerenderRisk)}
- **Bundle影响**: ${metrics.bundleImpact}/100 ${this.getMetricEmoji(metrics.bundleImpact)}
- **内存使用**: ${metrics.memoryUsage}KB`;
    }

    private formatRustMetrics(metrics: PerformanceMetrics): string {
        return `
- **算法复杂度**: ${metrics.algorithmicComplexity}/100 ${this.getMetricEmoji(metrics.algorithmicComplexity)}
- **内存效率**: ${metrics.memoryEfficiency}/100 ${this.getMetricEmoji(100 - (metrics.memoryEfficiency || 0))}
- **并发评分**: ${metrics.concurrencyScore}/100 ${this.getMetricEmoji(100 - (metrics.concurrencyScore || 0))}
- **I/O效率**: ${metrics.ioEfficiency}/100 ${this.getMetricEmoji(100 - (metrics.ioEfficiency || 0))}`;
    }

    private getScoreEmoji(score: number): string {
        if (score >= 80) return '🟢 优秀';
        if (score >= 60) return '🟡 良好';
        if (score >= 40) return '🟠 一般';
        return '🔴 需优化';
    }

    private getMetricEmoji(value?: number): string {
        if (!value) return '⚪';
        if (value < 30) return '🟢';
        if (value < 60) return '🟡';
        return '🔴';
    }

    private getScalabilityEmoji(scalability: string): string {
        switch (scalability) {
            case 'excellent': return '🟢';
            case 'good': return '🟡';
            case 'fair': return '🟠';
            case 'poor': return '🔴';
            default: return '⚪';
        }
    }
}

// 导出单例
export const deepPerformanceAnalyzer = new DeepPerformanceAnalyzer();
