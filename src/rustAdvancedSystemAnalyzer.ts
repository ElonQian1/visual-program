// Rust高级系统架构分析器
export interface RustModuleArchitecture {
    moduleName: string;
    subModules: string[];
    dependencies: string[];
    exports: string[];
    visibility: 'public' | 'private' | 'crate';
    complexity: number;
    cohesion: number;
    coupling: number;
}

export interface RustErrorHandlingAnalysis {
    errorTypes: {
        name: string;
        variants: string[];
        usageCount: number;
        line: number;
    }[];
    resultUsage: {
        function: string;
        errorHandling: 'propagated' | 'handled' | 'panicked';
        line: number;
    }[];
    errorHandlingScore: number;
    recommendations: string[];
}

export interface RustConcurrencyAnalysis {
    asyncFunctions: {
        name: string;
        awaitCount: number;
        complexity: number;
        line: number;
    }[];
    threadSafety: {
        unsafeBlocks: number;
        mutexUsage: number;
        arcUsage: number;
        channelUsage: number;
    };
    concurrencyPatterns: string[];
    safetyScore: number;
}

export interface RustMemoryManagement {
    ownershipTransfers: {
        function: string;
        type: 'move' | 'borrow' | 'mutable_borrow';
        line: number;
    }[];
    lifetimeAnnotations: {
        name: string;
        complexity: number;
        line: number;
    }[];
    cloneUsage: {
        type: string;
        necessary: boolean;
        suggestion: string;
        line: number;
    }[];
    memoryEfficiencyScore: number;
}

export interface RustTestingAnalysis {
    unitTests: {
        function: string;
        testCount: number;
        coverage: 'low' | 'medium' | 'high';
        line: number;
    }[];
    integrationTests: number;
    benchmarks: number;
    testQualityScore: number;
    missingTests: string[];
}

export interface RustDependencyAnalysis {
    externalCrates: {
        name: string;
        version: string;
        category: string;
        securityRisk: 'low' | 'medium' | 'high';
        alternatives: string[];
    }[];
    dependencyTree: {
        depth: number;
        totalDependencies: number;
        duplicates: string[];
    };
    optimizationSuggestions: string[];
}

export interface RustAdvancedSystemAnalysis {
    moduleArchitecture: RustModuleArchitecture[];
    errorHandling: RustErrorHandlingAnalysis;
    concurrency: RustConcurrencyAnalysis;
    memoryManagement: RustMemoryManagement;
    testing: RustTestingAnalysis;
    dependencies: RustDependencyAnalysis;
    overallArchitectureScore: number;
    systemRecommendations: string[];
}

export class RustAdvancedSystemAnalyzer {
    analyzeAdvancedSystem(code: string, fileName: string): RustAdvancedSystemAnalysis {
        return {
            moduleArchitecture: this.analyzeModuleArchitecture(code),
            errorHandling: this.analyzeErrorHandling(code),
            concurrency: this.analyzeConcurrency(code),
            memoryManagement: this.analyzeMemoryManagement(code),
            testing: this.analyzeTesting(code),
            dependencies: this.analyzeDependencies(code),
            overallArchitectureScore: this.calculateOverallScore(code),
            systemRecommendations: this.generateSystemRecommendations(code)
        };
    }

    private analyzeModuleArchitecture(code: string): RustModuleArchitecture[] {
        const modules: RustModuleArchitecture[] = [];
        const lines = code.split('\n');
        
        // 分析主模块
        const mainModule = this.analyzeMainModule(code);
        modules.push(mainModule);

        // 分析子模块
        lines.forEach((line, index) => {
            const modMatch = line.match(/^mod\s+(\w+);?/);
            if (modMatch) {
                const moduleName = modMatch[1];
                const moduleCode = this.extractModuleCode(code, moduleName);
                
                modules.push({
                    moduleName,
                    subModules: this.findSubModules(moduleCode),
                    dependencies: this.findModuleDependencies(moduleCode),
                    exports: this.findModuleExports(moduleCode),
                    visibility: this.determineModuleVisibility(line),
                    complexity: this.calculateModuleComplexity(moduleCode),
                    cohesion: this.calculateCohesion(moduleCode),
                    coupling: this.calculateCoupling(moduleCode, code)
                });
            }
        });

        return modules;
    }

    private analyzeErrorHandling(code: string): RustErrorHandlingAnalysis {
        const errorTypes: any[] = [];
        const resultUsage: any[] = [];
        const lines = code.split('\n');

        // 分析自定义错误类型
        lines.forEach((line, index) => {
            const enumMatch = line.match(/enum\s+(\w*Error\w*)\s*\{/);
            if (enumMatch) {
                const errorName = enumMatch[1];
                const variants = this.extractEnumVariants(code, errorName);
                const usageCount = this.countErrorUsage(code, errorName);
                
                errorTypes.push({
                    name: errorName,
                    variants,
                    usageCount,
                    line: index + 1
                });
            }

            // 分析Result使用
            const fnMatch = line.match(/fn\s+(\w+)[^{]*Result<[^,>]+,\s*([^>]+)>/);
            if (fnMatch) {
                const functionName = fnMatch[1];
                const errorType = fnMatch[2];
                const functionCode = this.extractFunctionCode(code, functionName);
                
                resultUsage.push({
                    function: functionName,
                    errorHandling: this.analyzeErrorHandlingPattern(functionCode),
                    line: index + 1
                });
            }
        });

        const errorHandlingScore = this.calculateErrorHandlingScore(code);
        const recommendations = this.generateErrorHandlingRecommendations(code);

        return {
            errorTypes,
            resultUsage,
            errorHandlingScore,
            recommendations
        };
    }

    private analyzeConcurrency(code: string): RustConcurrencyAnalysis {
        const asyncFunctions: any[] = [];
        const lines = code.split('\n');

        // 分析异步函数
        lines.forEach((line, index) => {
            const asyncMatch = line.match(/async\s+fn\s+(\w+)/);
            if (asyncMatch) {
                const functionName = asyncMatch[1];
                const functionCode = this.extractFunctionCode(code, functionName);
                const awaitCount = (functionCode.match(/\.await/g) || []).length;
                
                asyncFunctions.push({
                    name: functionName,
                    awaitCount,
                    complexity: this.calculateAsyncComplexity(functionCode),
                    line: index + 1
                });
            }
        });

        // 分析线程安全
        const threadSafety = {
            unsafeBlocks: (code.match(/unsafe\s*\{/g) || []).length,
            mutexUsage: (code.match(/Mutex::/g) || []).length,
            arcUsage: (code.match(/Arc::/g) || []).length,
            channelUsage: (code.match(/mpsc::|crossbeam_channel/g) || []).length
        };

        const concurrencyPatterns = this.identifyConcurrencyPatterns(code);
        const safetyScore = this.calculateConcurrencySafetyScore(threadSafety, asyncFunctions);

        return {
            asyncFunctions,
            threadSafety,
            concurrencyPatterns,
            safetyScore
        };
    }

    private analyzeMemoryManagement(code: string): RustMemoryManagement {
        const ownershipTransfers: any[] = [];
        const lifetimeAnnotations: any[] = [];
        const cloneUsage: any[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            // 分析所有权转移
            if (line.includes('move') || line.includes('&mut') || line.includes('&')) {
                const functionMatch = line.match(/fn\s+(\w+)/);
                if (functionMatch) {
                    ownershipTransfers.push({
                        function: functionMatch[1],
                        type: this.determineOwnershipType(line),
                        line: index + 1
                    });
                }
            }

            // 分析生命周期注解
            const lifetimeMatch = line.match(/'([a-z]+)/g);
            if (lifetimeMatch) {
                lifetimeMatch.forEach(lifetime => {
                    lifetimeAnnotations.push({
                        name: lifetime,
                        complexity: this.calculateLifetimeComplexity(line),
                        line: index + 1
                    });
                });
            }

            // 分析clone使用
            if (line.includes('.clone()')) {
                const target = line.match(/(\w+)\.clone\(\)/)?.[1] || 'unknown';
                cloneUsage.push({
                    type: target,
                    necessary: this.isCloneNecessary(line, code),
                    suggestion: this.suggestCloneAlternative(line),
                    line: index + 1
                });
            }
        });

        const memoryEfficiencyScore = this.calculateMemoryEfficiencyScore(ownershipTransfers, cloneUsage);

        return {
            ownershipTransfers,
            lifetimeAnnotations,
            cloneUsage,
            memoryEfficiencyScore
        };
    }

    private analyzeTesting(code: string): RustTestingAnalysis {
        const unitTests: any[] = [];
        const lines = code.split('\n');
        let integrationTests = 0;
        let benchmarks = 0;

        // 分析单元测试
        lines.forEach((line, index) => {
            if (line.includes('#[test]')) {
                const nextLine = lines[index + 1];
                const functionMatch = nextLine?.match(/fn\s+(\w+)/);
                if (functionMatch) {
                    const testFunction = functionMatch[1];
                    const functionCode = this.extractFunctionCode(code, testFunction);
                    
                    unitTests.push({
                        function: testFunction,
                        testCount: 1,
                        coverage: this.estimateTestCoverage(functionCode),
                        line: index + 2
                    });
                }
            }

            if (line.includes('#[bench]')) {
                benchmarks++;
            }
        });

        // 估算集成测试（简化检测）
        if (code.includes('tests/') || code.includes('integration_test')) {
            integrationTests = 1;
        }

        const testQualityScore = this.calculateTestQualityScore(unitTests, integrationTests, benchmarks);
        const missingTests = this.findMissingTests(code, unitTests);

        return {
            unitTests,
            integrationTests,
            benchmarks,
            testQualityScore,
            missingTests
        };
    }

    private analyzeDependencies(code: string): RustDependencyAnalysis {
        const externalCrates: any[] = [];
        const lines = code.split('\n');

        // 分析外部crate使用
        lines.forEach(line => {
            const useMatch = line.match(/use\s+(\w+)::/);
            if (useMatch) {
                const crateName = useMatch[1];
                if (!this.isStdLibCrate(crateName)) {
                    externalCrates.push({
                        name: crateName,
                        version: 'unknown',
                        category: this.categorizeCrate(crateName),
                        securityRisk: this.assessSecurityRisk(crateName),
                        alternatives: this.suggestAlternatives(crateName)
                    });
                }
            }
        });

        const dependencyTree = {
            depth: this.calculateDependencyDepth(externalCrates),
            totalDependencies: externalCrates.length,
            duplicates: this.findDuplicateDependencies(externalCrates)
        };

        const optimizationSuggestions = this.generateDependencyOptimizations(externalCrates, dependencyTree);

        return {
            externalCrates,
            dependencyTree,
            optimizationSuggestions
        };
    }

    private calculateOverallScore(code: string): number {
        let score = 100;
        
        // 模块化设计
        const moduleCount = (code.match(/^mod\s+\w+/gm) || []).length;
        score += moduleCount > 0 ? 10 : -10;
        
        // 错误处理
        const resultUsage = (code.match(/Result</g) || []).length;
        const panicUsage = (code.match(/panic!/g) || []).length;
        score += resultUsage * 5 - panicUsage * 10;
        
        // 测试覆盖
        const testCount = (code.match(/#\[test\]/g) || []).length;
        const functionCount = (code.match(/fn\s+\w+/g) || []).length;
        const testRatio = functionCount > 0 ? testCount / functionCount : 0;
        score += testRatio * 50;
        
        // 文档
        const docCount = (code.match(/\/\/\//g) || []).length;
        score += Math.min(docCount * 2, 20);
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    private generateSystemRecommendations(code: string): string[] {
        const recommendations: string[] = [];
        
        if (!(code.includes('mod ') || code.includes('pub mod'))) {
            recommendations.push('考虑将代码拆分为多个模块提高可维护性');
        }
        
        if (!code.includes('Result<') && code.includes('panic!')) {
            recommendations.push('使用Result类型替代panic!进行错误处理');
        }
        
        if (!code.includes('#[test]')) {
            recommendations.push('添加单元测试提高代码质量');
        }
        
        if (!code.includes('///')) {
            recommendations.push('添加文档注释提高代码可读性');
        }
        
        if (code.includes('unsafe') && !code.includes('// SAFETY:')) {
            recommendations.push('为unsafe代码块添加安全性注释');
        }
        
        const cloneCount = (code.match(/\.clone\(\)/g) || []).length;
        if (cloneCount > 5) {
            recommendations.push('过多clone操作，考虑使用引用或Arc优化性能');
        }

        return recommendations;
    }

    // 辅助方法实现
    private analyzeMainModule(code: string): RustModuleArchitecture {
        return {
            moduleName: 'main',
            subModules: this.findSubModules(code),
            dependencies: this.findModuleDependencies(code),
            exports: this.findModuleExports(code),
            visibility: 'public',
            complexity: this.calculateModuleComplexity(code),
            cohesion: this.calculateCohesion(code),
            coupling: this.calculateCoupling(code, code)
        };
    }

    private findSubModules(code: string): string[] {
        const matches = code.match(/mod\s+(\w+)/g) || [];
        return matches.map(match => match.split(' ')[1]);
    }

    private findModuleDependencies(code: string): string[] {
        const useMatches = code.match(/use\s+[^;]+/g) || [];
        return useMatches.map(use => use.replace('use ', '').split('::')[0]);
    }

    private findModuleExports(code: string): string[] {
        const pubMatches = code.match(/pub\s+(?:fn|struct|enum|trait)\s+(\w+)/g) || [];
        return pubMatches.map(match => match.split(' ').pop() || '');
    }

    private determineModuleVisibility(line: string): 'public' | 'private' | 'crate' {
        if (line.includes('pub mod')) {return 'public';}
        if (line.includes('pub(crate) mod')) {return 'crate';}
        return 'private';
    }

    private calculateModuleComplexity(code: string): number {
        let complexity = 1;
        complexity += (code.match(/if\s+/g) || []).length;
        complexity += (code.match(/match\s+/g) || []).length;
        complexity += (code.match(/for\s+/g) || []).length;
        complexity += (code.match(/while\s+/g) || []).length;
        return complexity;
    }

    private calculateCohesion(code: string): number {
        // 简化的内聚性计算
        const functions = (code.match(/fn\s+\w+/g) || []).length;
        const structs = (code.match(/struct\s+\w+/g) || []).length;
        const totalItems = functions + structs;
        return totalItems > 0 ? Math.min(100, (functions + structs) * 10) : 0;
    }

    private calculateCoupling(moduleCode: string, fullCode: string): number {
        const externalUses = (moduleCode.match(/use\s+(?!self|super|crate)\w+/g) || []).length;
        return Math.min(100, externalUses * 10);
    }

    private extractModuleCode(code: string, moduleName: string): string {
        const regex = new RegExp(`mod\\s+${moduleName}\\s*\\{[\\s\\S]*?\\}`, 'g');
        const match = code.match(regex);
        return match ? match[0] : '';
    }

    private extractEnumVariants(code: string, enumName: string): string[] {
        const enumRegex = new RegExp(`enum\\s+${enumName}\\s*\\{([\\s\\S]*?)\\}`, 'g');
        const match = code.match(enumRegex);
        if (match) {
            const variantMatches = match[0].match(/(\w+)(?:\([^)]*\))?(?:\s*,|\s*\})/g) || [];
            return variantMatches.map(v => v.replace(/[,{}]/g, '').trim());
        }
        return [];
    }

    private countErrorUsage(code: string, errorName: string): number {
        const regex = new RegExp(errorName, 'g');
        return (code.match(regex) || []).length;
    }

    private extractFunctionCode(code: string, functionName: string): string {
        const regex = new RegExp(`fn\\s+${functionName}[\\s\\S]*?(?=\\nfn|\\n\\}|$)`, 'g');
        const match = code.match(regex);
        return match ? match[0] : '';
    }

    private analyzeErrorHandlingPattern(functionCode: string): 'propagated' | 'handled' | 'panicked' {
        if (functionCode.includes('?')) {return 'propagated';}
        if (functionCode.includes('match') && functionCode.includes('Err')) {return 'handled';}
        if (functionCode.includes('panic!') || functionCode.includes('unwrap()')) {return 'panicked';}
        return 'handled';
    }

    private calculateErrorHandlingScore(code: string): number {
        const resultCount = (code.match(/Result</g) || []).length;
        const panicCount = (code.match(/panic!|unwrap\(\)/g) || []).length;
        const questionMarkCount = (code.match(/\?/g) || []).length;
        
        let score = 50;
        score += resultCount * 10;
        score += questionMarkCount * 5;
        score -= panicCount * 15;
        
        return Math.max(0, Math.min(100, score));
    }

    private generateErrorHandlingRecommendations(code: string): string[] {
        const recommendations: string[] = [];
        
        if (code.includes('unwrap()')) {
            recommendations.push('避免使用unwrap()，使用expect()或match处理错误');
        }
        
        if (code.includes('panic!')) {
            recommendations.push('考虑使用Result类型替代panic!');
        }
        
        if (!code.includes('Result<')) {
            recommendations.push('对可能失败的操作使用Result类型');
        }
        
        return recommendations;
    }

    private calculateAsyncComplexity(functionCode: string): number {
        let complexity = 1;
        complexity += (functionCode.match(/\.await/g) || []).length;
        complexity += (functionCode.match(/spawn/g) || []).length;
        complexity += (functionCode.match(/select!/g) || []).length;
        return complexity;
    }

    private identifyConcurrencyPatterns(code: string): string[] {
        const patterns: string[] = [];
        
        if (code.includes('async fn') && code.includes('.await')) {
            patterns.push('异步编程模式');
        }
        
        if (code.includes('Arc<Mutex<')) {
            patterns.push('共享状态并发模式');
        }
        
        if (code.includes('mpsc::') || code.includes('crossbeam_channel')) {
            patterns.push('消息传递并发模式');
        }
        
        if (code.includes('rayon::')) {
            patterns.push('数据并行模式');
        }
        
        return patterns;
    }

    private calculateConcurrencySafetyScore(threadSafety: any, asyncFunctions: any[]): number {
        let score = 70; // 基础分
        
        score += threadSafety.mutexUsage * 5;
        score += threadSafety.arcUsage * 5;
        score += threadSafety.channelUsage * 10;
        score -= threadSafety.unsafeBlocks * 15;
        
        if (asyncFunctions.length > 0) {
            score += 10; // 使用异步编程加分
        }
        
        return Math.max(0, Math.min(100, score));
    }

    private determineOwnershipType(line: string): 'move' | 'borrow' | 'mutable_borrow' {
        if (line.includes('&mut')) {return 'mutable_borrow';}
        if (line.includes('&')) {return 'borrow';}
        return 'move';
    }

    private calculateLifetimeComplexity(line: string): number {
        const lifetimeCount = (line.match(/'[a-z]+/g) || []).length;
        return lifetimeCount;
    }

    private isCloneNecessary(line: string, code: string): boolean {
        // 简化的clone必要性判断
        return !line.includes('&') && !line.includes('Arc::');
    }

    private suggestCloneAlternative(line: string): string {
        if (line.includes('String')) {return '考虑使用&str引用';}
        if (line.includes('Vec')) {return '考虑使用切片&[T]';}
        return '考虑使用引用或Arc共享数据';
    }

    private calculateMemoryEfficiencyScore(ownershipTransfers: any[], cloneUsage: any[]): number {
        let score = 80;
        
        const unnecessaryClones = cloneUsage.filter(c => !c.necessary).length;
        score -= unnecessaryClones * 10;
        
        const moveCount = ownershipTransfers.filter(t => t.type === 'move').length;
        score += moveCount * 2;
        
        return Math.max(0, Math.min(100, score));
    }

    private estimateTestCoverage(functionCode: string): 'low' | 'medium' | 'high' {
        const assertCount = (functionCode.match(/assert!/g) || []).length;
        if (assertCount > 3) {return 'high';}
        if (assertCount > 1) {return 'medium';}
        return 'low';
    }

    private calculateTestQualityScore(unitTests: any[], integrationTests: number, benchmarks: number): number {
        let score = 0;
        
        score += unitTests.length * 10;
        score += integrationTests * 20;
        score += benchmarks * 15;
        
        const highCoverageTests = unitTests.filter(t => t.coverage === 'high').length;
        score += highCoverageTests * 5;
        
        return Math.min(100, score);
    }

    private findMissingTests(code: string, existingTests: any[]): string[] {
        const functions = code.match(/pub\s+fn\s+(\w+)/g) || [];
        const testedFunctions = existingTests.map(t => t.function);
        
        return functions
            .map(f => f.match(/fn\s+(\w+)/)?.[1] || '')
            .filter(f => f && !testedFunctions.includes(`test_${f}`) && !f.startsWith('test_'));
    }

    private isStdLibCrate(crateName: string): boolean {
        const stdCrates = ['std', 'core', 'alloc', 'collections', 'fmt', 'io', 'fs', 'net', 'thread'];
        return stdCrates.includes(crateName);
    }

    private categorizeCrate(crateName: string): string {
        const categories: { [key: string]: string } = {
            'serde': 'serialization',
            'tokio': 'async-runtime',
            'actix-web': 'web-framework',
            'diesel': 'database',
            'clap': 'cli',
            'reqwest': 'http-client',
            'log': 'logging',
            'env_logger': 'logging',
            'chrono': 'datetime',
            'uuid': 'utility',
            'regex': 'utility'
        };
        
        return categories[crateName] || 'unknown';
    }

    private assessSecurityRisk(crateName: string): 'low' | 'medium' | 'high' {
        // 简化的安全风险评估
        const highRiskCrates = ['openssl-sys', 'libc'];
        const mediumRiskCrates = ['reqwest', 'hyper'];
        
        if (highRiskCrates.includes(crateName)) {return 'high';}
        if (mediumRiskCrates.includes(crateName)) {return 'medium';}
        return 'low';
    }

    private suggestAlternatives(crateName: string): string[] {
        const alternatives: { [key: string]: string[] } = {
            'reqwest': ['surf', 'ureq'],
            'tokio': ['async-std', 'smol'],
            'serde_json': ['simd-json', 'sonic-rs'],
            'clap': ['structopt', 'argh']
        };
        
        return alternatives[crateName] || [];
    }

    private calculateDependencyDepth(crates: any[]): number {
        // 简化的依赖深度计算
        return Math.min(5, Math.ceil(crates.length / 3));
    }

    private findDuplicateDependencies(crates: any[]): string[] {
        const names = crates.map(c => c.name);
        return names.filter((name, index) => names.indexOf(name) !== index);
    }

    private generateDependencyOptimizations(crates: any[], tree: any): string[] {
        const suggestions: string[] = [];
        
        if (tree.totalDependencies > 20) {
            suggestions.push('依赖数量较多，考虑减少非必要依赖');
        }
        
        if (tree.duplicates.length > 0) {
            suggestions.push('存在重复依赖，检查是否可以统一版本');
        }
        
        const highRiskCrates = crates.filter(c => c.securityRisk === 'high');
        if (highRiskCrates.length > 0) {
            suggestions.push('存在高安全风险的依赖，考虑替换或更新');
        }
        
        return suggestions;
    }
}
