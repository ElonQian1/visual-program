// 🧠 AI增强分析系统
import * as vscode from 'vscode';
import * as https from 'https';

export interface AIAnalysisConfig {
    provider: 'openai' | 'anthropic' | 'local';
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface AIAnalysisResult {
    explanations: CodeExplanation[];
    suggestions: OptimizationSuggestion[];
    patterns: ArchitecturePattern[];
    refactoring: RefactoringRecommendation[];
    quality: CodeQualityAssessment;
}

export interface CodeExplanation {
    codeSnippet: string;
    explanation: string;
    complexity: 'simple' | 'moderate' | 'complex';
    concepts: string[];
    line: number;
}

export interface OptimizationSuggestion {
    type: 'performance' | 'memory' | 'readability' | 'maintainability';
    description: string;
    before: string;
    after: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'easy' | 'moderate' | 'difficult';
}

export interface ArchitecturePattern {
    name: string;
    confidence: number;
    description: string;
    benefits: string[];
    alternatives: string[];
}

export interface RefactoringRecommendation {
    title: string;
    description: string;
    codeLocation: vscode.Range;
    steps: RefactoringStep[];
    riskLevel: 'low' | 'medium' | 'high';
}

export interface RefactoringStep {
    description: string;
    codeChange: {
        from: string;
        to: string;
    };
    automated: boolean;
}

export interface CodeQualityAssessment {
    overall: number;
    maintainability: number;
    readability: number;
    testability: number;
    performance: number;
    security: number;
    issues: QualityIssue[];
}

export interface QualityIssue {
    type: 'warning' | 'error' | 'suggestion';
    message: string;
    line: number;
    severity: 'low' | 'medium' | 'high';
    fixable: boolean;
}

export class AIEnhancedAnalysisSystem {
    private static instance: AIEnhancedAnalysisSystem;
    private config: AIAnalysisConfig;
    private outputChannel: vscode.OutputChannel;
    private analysisCache: Map<string, AIAnalysisResult> = new Map();
    
    private constructor() {
        this.config = {
            provider: 'local', // 默认使用本地分析
            temperature: 0.3,
            maxTokens: 2000
        };
        this.outputChannel = vscode.window.createOutputChannel('AI Enhanced Analysis');
        this.loadConfiguration();
    }
    
    public static getInstance(): AIEnhancedAnalysisSystem {
        if (!AIEnhancedAnalysisSystem.instance) {
            AIEnhancedAnalysisSystem.instance = new AIEnhancedAnalysisSystem();
        }
        return AIEnhancedAnalysisSystem.instance;
    }
    
    // 🔍 智能代码分析
    public async analyzeCode(
        document: vscode.TextDocument, 
        selectedRange?: vscode.Range
    ): Promise<AIAnalysisResult> {
        const code = selectedRange ? 
            document.getText(selectedRange) : 
            document.getText();
        
        const cacheKey = this.generateCacheKey(code, document.languageId);
        
        // 检查缓存
        if (this.analysisCache.has(cacheKey)) {
            this.outputChannel.appendLine('🎯 使用缓存的分析结果');
            return this.analysisCache.get(cacheKey)!;
        }
        
        this.outputChannel.appendLine(`🧠 开始AI增强分析 (${document.languageId})`);
        
        try {
            let result: AIAnalysisResult;
            
            switch (this.config.provider) {
                case 'openai':
                    result = await this.analyzeWithOpenAI(code, document.languageId);
                    break;
                case 'anthropic':
                    result = await this.analyzeWithClaude(code, document.languageId);
                    break;
                case 'local':
                default:
                    result = await this.analyzeWithLocalAI(code, document.languageId);
                    break;
            }
            
            // 缓存结果
            this.analysisCache.set(cacheKey, result);
            
            this.outputChannel.appendLine(`✅ AI分析完成: ${result.explanations.length} 个解释, ${result.suggestions.length} 个建议`);
            
            return result;
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ AI分析失败: ${error}`);
            throw error;
        }
    }
    
    // 💡 智能解释代码
    public async explainCode(code: string, language: string): Promise<string> {
        const prompt = this.buildExplanationPrompt(code, language);
        
        try {
            const response = await this.callAIService(prompt, {
                maxTokens: 500,
                temperature: 0.1
            });
            
            return this.parseExplanationResponse(response);
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ 代码解释失败: ${error}`);
            return this.getFallbackExplanation(code, language);
        }
    }
    
    // 🔧 智能重构建议
    public async suggestRefactoring(
        document: vscode.TextDocument,
        range: vscode.Range
    ): Promise<RefactoringRecommendation[]> {
        const code = document.getText(range);
        const context = this.getCodeContext(document, range);
        
        const prompt = this.buildRefactoringPrompt(code, context, document.languageId);
        
        try {
            const response = await this.callAIService(prompt, {
                maxTokens: 1000,
                temperature: 0.2
            });
            
            return this.parseRefactoringResponse(response, range);
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ 重构建议失败: ${error}`);
            return this.getFallbackRefactoringRecommendations(code, document.languageId);
        }
    }
    
    // 🏗️ 架构模式识别
    public async identifyPatterns(
        codeAnalysis: any,
        language: string
    ): Promise<ArchitecturePattern[]> {
        const prompt = this.buildPatternIdentificationPrompt(codeAnalysis, language);
        
        try {
            const response = await this.callAIService(prompt, {
                maxTokens: 800,
                temperature: 0.1
            });
            
            return this.parsePatternResponse(response);
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ 模式识别失败: ${error}`);
            return this.getFallbackPatterns(codeAnalysis, language);
        }
    }
    
    // 📊 代码质量评估
    public async assessQuality(
        document: vscode.TextDocument,
        codeAnalysis: any
    ): Promise<CodeQualityAssessment> {
        const prompt = this.buildQualityAssessmentPrompt(
            document.getText(),
            codeAnalysis,
            document.languageId
        );
        
        try {
            const response = await this.callAIService(prompt, {
                maxTokens: 600,
                temperature: 0.1
            });
            
            return this.parseQualityResponse(response);
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ 质量评估失败: ${error}`);
            return this.getFallbackQualityAssessment(codeAnalysis);
        }
    }
    
    // 🤖 AI服务调用 (各种提供商的实现)
    private async analyzeWithOpenAI(code: string, language: string): Promise<AIAnalysisResult> {
        // OpenAI GPT-4 分析实现
        const prompt = this.buildComprehensiveAnalysisPrompt(code, language);
        
        try {
            // 使用node-fetch或替代方案进行HTTP请求
            const requestBody = JSON.stringify({
                model: this.config.model || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的代码分析专家，专门分析React和Rust代码。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            });

            const response = await this.makeHttpRequest('api.openai.com', '/v1/chat/completions', {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            }, requestBody);
            
            const data = JSON.parse(response);
            return this.parseAIResponse(data.choices[0].message.content, language);
        } catch (error) {
            this.outputChannel.appendLine(`❌ OpenAI API调用失败: ${error}`);
            return this.analyzeWithLocalAI(code, language);
        }
    }
    
    private async analyzeWithClaude(code: string, language: string): Promise<AIAnalysisResult> {
        // Anthropic Claude 分析实现
        const prompt = this.buildComprehensiveAnalysisPrompt(code, language);
        
        try {
            const requestBody = JSON.stringify({
                model: this.config.model || 'claude-3-sonnet-20240229',
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const response = await this.makeHttpRequest('api.anthropic.com', '/v1/messages', {
                'x-api-key': this.config.apiKey!,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            }, requestBody);
            
            const data = JSON.parse(response);
            return this.parseAIResponse(data.content[0].text, language);
        } catch (error) {
            this.outputChannel.appendLine(`❌ Claude API调用失败: ${error}`);
            return this.analyzeWithLocalAI(code, language);
        }
    }
    
    private async analyzeWithLocalAI(code: string, language: string): Promise<AIAnalysisResult> {
        // 本地AI分析实现（基于规则和模式匹配）
        this.outputChannel.appendLine('🏠 使用本地AI分析引擎');
        
        const result: AIAnalysisResult = {
            explanations: await this.generateLocalExplanations(code, language),
            suggestions: await this.generateLocalSuggestions(code, language),
            patterns: await this.identifyLocalPatterns(code, language),
            refactoring: await this.generateLocalRefactoring(code, language),
            quality: await this.assessLocalQuality(code, language)
        };
        
        return result;
    }
    
    // 🏠 本地AI分析方法实现
    private async generateLocalExplanations(code: string, language: string): Promise<CodeExplanation[]> {
        const explanations: CodeExplanation[] = [];
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (language === 'typescript' || language === 'javascript') {
                // React/TypeScript 解释
                if (line.includes('useState')) {
                    explanations.push({
                        codeSnippet: line,
                        explanation: '使用React的useState Hook来管理组件内部状态。useState返回一个状态值和更新该状态的函数。',
                        complexity: 'simple',
                        concepts: ['React Hooks', '状态管理', 'useState'],
                        line: i + 1
                    });
                }
                
                if (line.includes('useEffect')) {
                    explanations.push({
                        codeSnippet: line,
                        explanation: '使用useEffect Hook来处理副作用，如数据获取、订阅或手动更改DOM。',
                        complexity: 'moderate',
                        concepts: ['React Hooks', '副作用处理', 'useEffect'],
                        line: i + 1
                    });
                }
                
                if (line.includes('async') && line.includes('await')) {
                    explanations.push({
                        codeSnippet: line,
                        explanation: '使用async/await语法处理异步操作，使异步代码看起来像同步代码。',
                        complexity: 'moderate',
                        concepts: ['异步编程', 'async/await', 'Promise'],
                        line: i + 1
                    });
                }
            } else if (language === 'rust') {
                // Rust 解释
                if (line.includes('impl')) {
                    explanations.push({
                        codeSnippet: line,
                        explanation: '实现块(impl)为结构体或枚举提供方法。可以实现关联函数和实例方法。',
                        complexity: 'moderate',
                        concepts: ['impl块', '方法实现', '关联函数'],
                        line: i + 1
                    });
                }
                
                if (line.includes('Result<')) {
                    explanations.push({
                        codeSnippet: line,
                        explanation: 'Result类型用于错误处理，包含Ok(成功值)或Err(错误值)两种变体。',
                        complexity: 'moderate',
                        concepts: ['错误处理', 'Result类型', '枚举'],
                        line: i + 1
                    });
                }
                
                if (line.includes('async fn')) {
                    explanations.push({
                        codeSnippet: line,
                        explanation: '异步函数使用async关键字声明，返回Future，可以使用.await等待结果。',
                        complexity: 'complex',
                        concepts: ['异步编程', 'Future', 'async/await'],
                        line: i + 1
                    });
                }
            }
        }
        
        return explanations;
    }
    
    private async generateLocalSuggestions(code: string, language: string): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];
        
        if (language === 'typescript' || language === 'javascript') {
            // React优化建议
            if (code.includes('useEffect(') && !code.includes('[]')) {
                suggestions.push({
                    type: 'performance',
                    description: '考虑为useEffect添加依赖数组以避免不必要的重复执行',
                    before: 'useEffect(() => { /* ... */ });',
                    after: 'useEffect(() => { /* ... */ }, [dependency]);',
                    impact: 'medium',
                    effort: 'easy'
                });
            }
            
            if (code.includes('console.log')) {
                suggestions.push({
                    type: 'maintainability',
                    description: '生产环境中应该移除或使用适当的日志系统替换console.log',
                    before: 'console.log(data);',
                    after: '// 使用适当的日志系统或移除',
                    impact: 'low',
                    effort: 'easy'
                });
            }
        } else if (language === 'rust') {
            // Rust优化建议
            if (code.includes('.clone()')) {
                suggestions.push({
                    type: 'performance',
                    description: '频繁的clone操作可能影响性能，考虑使用引用或优化数据结构',
                    before: 'let copied = data.clone();',
                    after: 'let borrowed = &data; // 或使用其他方式避免克隆',
                    impact: 'medium',
                    effort: 'moderate'
                });
            }
            
            if (code.includes('unwrap()')) {
                suggestions.push({
                    type: 'maintainability',
                    description: '使用unwrap()可能导致panic，建议使用更安全的错误处理',
                    before: 'let value = result.unwrap();',
                    after: 'let value = result.expect("详细错误信息");',
                    impact: 'high',
                    effort: 'easy'
                });
            }
        }
        
        return suggestions;
    }
    
    private async identifyLocalPatterns(code: string, language: string): Promise<ArchitecturePattern[]> {
        const patterns: ArchitecturePattern[] = [];
        
        if (language === 'typescript' || language === 'javascript') {
            // React模式识别
            if (code.includes('createContext') && code.includes('useContext')) {
                patterns.push({
                    name: 'Context模式',
                    confidence: 0.9,
                    description: '使用React Context API进行状态管理和数据传递',
                    benefits: ['避免props drilling', '全局状态管理', '组件解耦'],
                    alternatives: ['Redux', 'Zustand', '本地状态']
                });
            }
            
            if (code.includes('React.memo') || code.includes('useMemo')) {
                patterns.push({
                    name: '性能优化模式',
                    confidence: 0.8,
                    description: '使用记忆化技术优化组件性能',
                    benefits: ['减少重复渲染', '提升性能', '优化用户体验'],
                    alternatives: ['useCallback', '组件拆分', '虚拟化']
                });
            }
        } else if (language === 'rust') {
            // Rust模式识别
            if (code.includes('trait') && code.includes('impl')) {
                patterns.push({
                    name: 'Trait模式',
                    confidence: 0.9,
                    description: '使用trait定义共同行为，实现多态性',
                    benefits: ['代码复用', '多态性', '抽象化'],
                    alternatives: ['枚举', '泛型', '宏']
                });
            }
            
            if (code.includes('Result') && code.includes('?')) {
                patterns.push({
                    name: '错误传播模式',
                    confidence: 0.8,
                    description: '使用?操作符进行错误传播，简化错误处理',
                    benefits: ['简洁的错误处理', '安全性', '可读性'],
                    alternatives: ['match表达式', 'unwrap', 'expect']
                });
            }
        }
        
        return patterns;
    }
    
    private async generateLocalRefactoring(code: string, language: string): Promise<RefactoringRecommendation[]> {
        const recommendations: RefactoringRecommendation[] = [];
        
        // 基于规则的重构建议
        if (code.length > 1000) {
            recommendations.push({
                title: '函数过长重构',
                description: '建议将长函数拆分为多个小函数以提高可读性和可维护性',
                codeLocation: new vscode.Range(0, 0, 0, 0),
                steps: [
                    {
                        description: '识别功能相关的代码块',
                        codeChange: { from: '// 长函数', to: '// 拆分后的小函数' },
                        automated: false
                    }
                ],
                riskLevel: 'low'
            });
        }
        
        return recommendations;
    }
    
    private async assessLocalQuality(code: string, language: string): Promise<CodeQualityAssessment> {
        let overall = 80;
        const issues: QualityIssue[] = [];
        
        // 基于规则的质量评估
        if (code.includes('console.log')) {
            issues.push({
                type: 'warning',
                message: '包含调试代码',
                line: 1,
                severity: 'low',
                fixable: true
            });
            overall -= 5;
        }
        
        if (language === 'rust' && code.includes('unwrap()')) {
            issues.push({
                type: 'warning',
                message: '使用了可能panic的unwrap()',
                line: 1,
                severity: 'medium',
                fixable: true
            });
            overall -= 10;
        }
        
        return {
            overall,
            maintainability: overall,
            readability: overall,
            testability: overall - 5,
            performance: overall,
            security: overall - 5,
            issues
        };
    }
    
    // 🔧 辅助方法和提示词生成
    private buildComprehensiveAnalysisPrompt(code: string, language: string): string {
        return `
请分析以下${language}代码，提供详细的分析报告：

\`\`\`${language}
${code}
\`\`\`

请按以下格式提供分析：

1. 代码解释：
   - 主要功能和目的
   - 关键概念和技术点
   - 复杂度评估

2. 优化建议：
   - 性能优化
   - 可读性改进
   - 最佳实践

3. 架构模式：
   - 识别的设计模式
   - 架构特点
   - 改进建议

4. 重构建议：
   - 具体的重构步骤
   - 风险评估
   - 优先级排序

5. 质量评估：
   - 整体质量评分
   - 具体问题点
   - 改进方向

请使用中文回答，并提供具体的代码示例。
        `;
    }
    
    private buildExplanationPrompt(code: string, language: string): string {
        return `
请用通俗易懂的中文解释以下${language}代码的功能和原理：

\`\`\`${language}
${code}
\`\`\`

请重点说明：
1. 代码的主要功能
2. 使用的技术概念
3. 执行流程
4. 注意事项
        `;
    }
    
    private buildRefactoringPrompt(code: string, context: string, language: string): string {
        return `
请为以下${language}代码提供重构建议：

代码：
\`\`\`${language}
${code}
\`\`\`

上下文：
${context}

请提供：
1. 具体的重构步骤
2. 重构前后的代码对比
3. 重构的好处
4. 风险评估
5. 实施难度评估
        `;
    }
    
    private buildPatternIdentificationPrompt(codeAnalysis: any, language: string): string {
        return `
基于以下代码分析结果，识别其中使用的架构模式和设计模式：

分析结果：
${JSON.stringify(codeAnalysis, null, 2)}

语言：${language}

请识别：
1. 设计模式（如单例、工厂、观察者等）
2. 架构模式（如MVC、MVP、MVVM等）
3. 编程范式特征
4. 最佳实践的使用情况
        `;
    }
    
    private buildQualityAssessmentPrompt(code: string, analysis: any, language: string): string {
        return `
请评估以下${language}代码的质量：

代码：
\`\`\`${language}
${code}
\`\`\`

分析结果：
${JSON.stringify(analysis, null, 2)}

请评估：
1. 整体质量评分（0-100）
2. 可维护性评分
3. 可读性评分
4. 可测试性评分
5. 性能质量评分
6. 安全性评分
7. 具体问题和改进建议
        `;
    }
    
    // 🔧 响应解析方法
    private parseAIResponse(response: string, language: string): AIAnalysisResult {
        // 解析AI服务响应，提取结构化数据
        // 这里需要根据实际的AI响应格式进行解析
        return {
            explanations: [],
            suggestions: [],
            patterns: [],
            refactoring: [],
            quality: {
                overall: 80,
                maintainability: 80,
                readability: 80,
                testability: 75,
                performance: 80,
                security: 75,
                issues: []
            }
        };
    }
    
    private parseExplanationResponse(response: string): string {
        // 解析解释响应
        return response.trim();
    }
    
    private parseRefactoringResponse(response: string, range: vscode.Range): RefactoringRecommendation[] {
        // 解析重构建议响应
        return [];
    }
    
    private parsePatternResponse(response: string): ArchitecturePattern[] {
        // 解析模式识别响应
        return [];
    }
    
    private parseQualityResponse(response: string): CodeQualityAssessment {
        // 解析质量评估响应
        return {
            overall: 80,
            maintainability: 80,
            readability: 80,
            testability: 75,
            performance: 80,
            security: 75,
            issues: []
        };
    }
    
    // 🔧 后备方法
    private getFallbackExplanation(code: string, language: string): string {
        return `这是一段${language}代码，包含${code.split('\n').length}行。由于AI服务不可用，无法提供详细解释。`;
    }
    
    private getFallbackRefactoringRecommendations(code: string, language: string): RefactoringRecommendation[] {
        return [];
    }
    
    private getFallbackPatterns(codeAnalysis: any, language: string): ArchitecturePattern[] {
        return [];
    }
    
    private getFallbackQualityAssessment(codeAnalysis: any): CodeQualityAssessment {
        return {
            overall: 70,
            maintainability: 70,
            readability: 70,
            testability: 65,
            performance: 70,
            security: 65,
            issues: []
        };
    }
    
    // 🔧 工具方法
    private async callAIService(prompt: string, options: any): Promise<string> {
        // 调用AI服务的通用方法
        throw new Error('AI服务调用未实现');
    }

    private async makeHttpRequest(
        hostname: string, 
        path: string, 
        headers: any, 
        body: string
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const options = {
                hostname,
                path,
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(body);
            req.end();
        });
    }
    
    private generateCacheKey(code: string, language: string): string {
        const hash = this.simpleHash(code + language);
        return `${language}-${hash}`;
    }
    
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    private getCodeContext(document: vscode.TextDocument, range: vscode.Range): string {
        // 获取代码上下文
        const startLine = Math.max(0, range.start.line - 5);
        const endLine = Math.min(document.lineCount - 1, range.end.line + 5);
        const contextRange = new vscode.Range(startLine, 0, endLine, 0);
        return document.getText(contextRange);
    }
    
    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('visualProgramming.ai');
        this.config = {
            provider: config.get('provider', 'local'),
            apiKey: config.get('apiKey'),
            model: config.get('model'),
            temperature: config.get('temperature', 0.3),
            maxTokens: config.get('maxTokens', 2000)
        };
    }
    
    // 📊 配置管理
    public async updateConfiguration(newConfig: Partial<AIAnalysisConfig>): Promise<void> {
        this.config = { ...this.config, ...newConfig };
        
        const config = vscode.workspace.getConfiguration('visualProgramming.ai');
        for (const [key, value] of Object.entries(newConfig)) {
            await config.update(key, value, true);
        }
        
        this.outputChannel.appendLine('🔧 AI配置已更新');
    }
    
    public getConfiguration(): AIAnalysisConfig {
        return { ...this.config };
    }
    
    // 🧹 缓存管理
    public clearCache(): void {
        this.analysisCache.clear();
        this.outputChannel.appendLine('🧹 AI分析缓存已清理');
    }
    
    public getCacheSize(): number {
        return this.analysisCache.size;
    }
}

// 导出单例实例
export const aiEnhancedAnalysisSystem = AIEnhancedAnalysisSystem.getInstance();
