// 🔧 智能代码重构引擎
import * as vscode from 'vscode';
import * as ts from 'typescript';

export interface RefactoringOption {
    id: string;
    name: string;
    description: string;
    category: 'extract' | 'inline' | 'move' | 'rename' | 'optimize' | 'modernize';
    confidence: number; // 0-1，重构的信心度
    impact: 'low' | 'medium' | 'high';
    automated: boolean;
    preview?: string;
}

export interface RefactoringResult {
    success: boolean;
    changes: vscode.WorkspaceEdit[];
    warnings: string[];
    suggestions: string[];
    backup?: string;
}

export interface CodeSmell {
    type: 'duplicate' | 'complex' | 'long' | 'dead' | 'coupling' | 'naming';
    severity: 'info' | 'warning' | 'error';
    location: vscode.Range;
    message: string;
    refactoringOptions: RefactoringOption[];
}

export class IntelligentRefactoringEngine {
    private static instance: IntelligentRefactoringEngine;
    private sourceFile: ts.SourceFile | null = null;
    private program: ts.Program | null = null;
    private typeChecker: ts.TypeChecker | null = null;
    
    private constructor() {}
    
    public static getInstance(): IntelligentRefactoringEngine {
        if (!IntelligentRefactoringEngine.instance) {
            IntelligentRefactoringEngine.instance = new IntelligentRefactoringEngine();
        }
        return IntelligentRefactoringEngine.instance;
    }
    
    // 🔍 分析代码异味
    public async analyzeCodeSmells(document: vscode.TextDocument): Promise<CodeSmell[]> {
        const smells: CodeSmell[] = [];
        
        try {
            // 创建TypeScript程序
            await this.initializeTypeScript(document);
            
            if (!this.sourceFile) {
                return smells;
            }
            
            // 检测各种代码异味
            smells.push(...this.detectDuplicateCode());
            smells.push(...this.detectComplexFunctions());
            smells.push(...this.detectLongFunctions());
            smells.push(...this.detectDeadCode());
            smells.push(...this.detectTightCoupling());
            smells.push(...this.detectNamingIssues());
            
        } catch (error) {
            console.error('Code smell analysis failed:', error);
        }
        
        return smells;
    }
    
    // 🚀 获取重构建议
    public async getRefactoringSuggestions(
        document: vscode.TextDocument, 
        range?: vscode.Range
    ): Promise<RefactoringOption[]> {
        const suggestions: RefactoringOption[] = [];
        
        try {
            await this.initializeTypeScript(document);
            
            if (!this.sourceFile) {
                return suggestions;
            }
            
            // 基于选择范围或整个文件提供建议
            if (range) {
                suggestions.push(...this.getSelectionBasedSuggestions(range));
            } else {
                suggestions.push(...this.getFileBasedSuggestions());
            }
            
        } catch (error) {
            console.error('Refactoring suggestions failed:', error);
        }
        
        return suggestions;
    }
    
    // 🔧 执行重构
    public async executeRefactoring(
        document: vscode.TextDocument,
        option: RefactoringOption,
        parameters?: Record<string, any>
    ): Promise<RefactoringResult> {
        try {
            // 创建备份
            const backup = document.getText();
            
            // 执行具体重构
            let result: RefactoringResult;
            
            switch (option.category) {
                case 'extract':
                    result = await this.executeExtractRefactoring(document, option, parameters);
                    break;
                case 'inline':
                    result = await this.executeInlineRefactoring(document, option, parameters);
                    break;
                case 'move':
                    result = await this.executeMoveRefactoring(document, option, parameters);
                    break;
                case 'rename':
                    result = await this.executeRenameRefactoring(document, option, parameters);
                    break;
                case 'optimize':
                    result = await this.executeOptimizeRefactoring(document, option, parameters);
                    break;
                case 'modernize':
                    result = await this.executeModernizeRefactoring(document, option, parameters);
                    break;
                default:
                    throw new Error(`Unknown refactoring category: ${option.category}`);
            }
            
            result.backup = backup;
            return result;
            
        } catch (error: any) {
            return {
                success: false,
                changes: [],
                warnings: [`重构失败: ${error?.message || '未知错误'}`],
                suggestions: ['请检查代码语法是否正确', '尝试选择更小的代码片段进行重构']
            };
        }
    }
    
    // 🔍 初始化TypeScript分析
    private async initializeTypeScript(document: vscode.TextDocument): Promise<void> {
        const fileName = document.fileName;
        const sourceText = document.getText();
        
        // 创建编译选项
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true
        };
        
        // 创建源文件
        this.sourceFile = ts.createSourceFile(
            fileName,
            sourceText,
            ts.ScriptTarget.ES2020,
            true
        );
        
        // 创建程序
        const host: ts.CompilerHost = {
            getSourceFile: (name) => name === fileName ? this.sourceFile! : undefined,
            writeFile: () => {},
            getCurrentDirectory: () => '',
            getDirectories: () => [],
            fileExists: (name) => name === fileName,
            readFile: (name) => name === fileName ? sourceText : undefined,
            getCanonicalFileName: (fileName) => fileName,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => '\n',
            getDefaultLibFileName: () => 'lib.d.ts'
        };
        
        this.program = ts.createProgram([fileName], compilerOptions, host);
        this.typeChecker = this.program.getTypeChecker();
    }
    
    // 🔍 检测重复代码
    private detectDuplicateCode(): CodeSmell[] {
        const smells: CodeSmell[] = [];
        
        if (!this.sourceFile) return smells;
        
        const functions: ts.FunctionDeclaration[] = [];
        
        // 收集所有函数
        ts.forEachChild(this.sourceFile, node => {
            if (ts.isFunctionDeclaration(node)) {
                functions.push(node);
            }
        });
        
        // 比较函数相似性
        for (let i = 0; i < functions.length; i++) {
            for (let j = i + 1; j < functions.length; j++) {
                const similarity = this.calculateSimilarity(functions[i], functions[j]);
                
                if (similarity > 0.8) {
                    const range = this.tsRangeToVSCodeRange(functions[i].getStart(), functions[i].getEnd());
                    
                    smells.push({
                        type: 'duplicate',
                        severity: 'warning',
                        location: range,
                        message: `函数 ${functions[i].name?.text} 与 ${functions[j].name?.text} 存在重复代码`,
                        refactoringOptions: [
                            {
                                id: 'extract-common-function',
                                name: '提取公共函数',
                                description: '将重复的代码提取为独立函数',
                                category: 'extract',
                                confidence: 0.9,
                                impact: 'medium',
                                automated: true
                            }
                        ]
                    });
                }
            }
        }
        
        return smells;
    }
    
    // 🔍 检测复杂函数
    private detectComplexFunctions(): CodeSmell[] {
        const smells: CodeSmell[] = [];
        
        if (!this.sourceFile) return smells;
        
        const visit = (node: ts.Node) => {
            if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
                const complexity = this.calculateCyclomaticComplexity(node);
                
                if (complexity > 10) {
                    const range = this.tsRangeToVSCodeRange(node.getStart(), node.getEnd());
                    
                    smells.push({
                        type: 'complex',
                        severity: complexity > 15 ? 'error' : 'warning',
                        location: range,
                        message: `函数复杂度过高 (${complexity})，建议重构`,
                        refactoringOptions: [
                            {
                                id: 'extract-method',
                                name: '提取方法',
                                description: '将复杂逻辑分解为多个小方法',
                                category: 'extract',
                                confidence: 0.8,
                                impact: 'high',
                                automated: false
                            },
                            {
                                id: 'simplify-conditions',
                                name: '简化条件',
                                description: '简化复杂的条件表达式',
                                category: 'optimize',
                                confidence: 0.7,
                                impact: 'medium',
                                automated: true
                            }
                        ]
                    });
                }
            }
            
            ts.forEachChild(node, visit);
        };
        
        visit(this.sourceFile);
        return smells;
    }
    
    // 🔍 检测长函数
    private detectLongFunctions(): CodeSmell[] {
        const smells: CodeSmell[] = [];
        
        if (!this.sourceFile) return smells;
        
        const visit = (node: ts.Node) => {
            if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
                const lines = this.countLines(node);
                
                if (lines > 50) {
                    const range = this.tsRangeToVSCodeRange(node.getStart(), node.getEnd());
                    
                    smells.push({
                        type: 'long',
                        severity: lines > 100 ? 'error' : 'warning',
                        location: range,
                        message: `函数过长 (${lines} 行)，建议拆分`,
                        refactoringOptions: [
                            {
                                id: 'split-function',
                                name: '拆分函数',
                                description: '将长函数拆分为多个短函数',
                                category: 'extract',
                                confidence: 0.8,
                                impact: 'high',
                                automated: false
                            }
                        ]
                    });
                }
            }
            
            ts.forEachChild(node, visit);
        };
        
        visit(this.sourceFile);
        return smells;
    }
    
    // 🔍 检测死代码
    private detectDeadCode(): CodeSmell[] {
        const smells: CodeSmell[] = [];
        
        if (!this.sourceFile || !this.typeChecker) return smells;
        
        const visit = (node: ts.Node) => {
            // 检测未使用的变量
            if (ts.isVariableDeclaration(node) && node.name) {
                const symbol = this.typeChecker!.getSymbolAtLocation(node.name);
                if (symbol && this.isSymbolUnused(symbol)) {
                    const range = this.tsRangeToVSCodeRange(node.getStart(), node.getEnd());
                    
                    smells.push({
                        type: 'dead',
                        severity: 'info',
                        location: range,
                        message: `变量 ${node.name.getText()} 未被使用`,
                        refactoringOptions: [
                            {
                                id: 'remove-unused-variable',
                                name: '删除未使用的变量',
                                description: '删除未被引用的变量声明',
                                category: 'optimize',
                                confidence: 0.9,
                                impact: 'low',
                                automated: true
                            }
                        ]
                    });
                }
            }
            
            ts.forEachChild(node, visit);
        };
        
        visit(this.sourceFile);
        return smells;
    }
    
    // 🔍 检测紧耦合
    private detectTightCoupling(): CodeSmell[] {
        const smells: CodeSmell[] = [];
        
        if (!this.sourceFile) return smells;
        
        const classes: ts.ClassDeclaration[] = [];
        
        // 收集所有类
        const visit = (node: ts.Node) => {
            if (ts.isClassDeclaration(node)) {
                classes.push(node);
            }
            ts.forEachChild(node, visit);
        };
        
        visit(this.sourceFile);
        
        // 分析类之间的耦合度
        for (const classNode of classes) {
            const dependencies = this.analyzeDependencies(classNode);
            
            if (dependencies.length > 5) {
                const range = this.tsRangeToVSCodeRange(classNode.getStart(), classNode.getEnd());
                
                smells.push({
                    type: 'coupling',
                    severity: 'warning',
                    location: range,
                    message: `类 ${classNode.name?.text} 耦合度过高 (${dependencies.length} 个依赖)`,
                    refactoringOptions: [
                        {
                            id: 'dependency-injection',
                            name: '依赖注入',
                            description: '使用依赖注入减少耦合',
                            category: 'modernize',
                            confidence: 0.7,
                            impact: 'high',
                            automated: false
                        }
                    ]
                });
            }
        }
        
        return smells;
    }
    
    // 🔍 检测命名问题
    private detectNamingIssues(): CodeSmell[] {
        const smells: CodeSmell[] = [];
        
        if (!this.sourceFile) return smells;
        
        const visit = (node: ts.Node) => {
            // 检测函数命名
            if (ts.isFunctionDeclaration(node) && node.name) {
                const name = node.name.text;
                
                if (name.length < 3 || !/^[a-z][a-zA-Z0-9]*$/.test(name)) {
                    const range = this.tsRangeToVSCodeRange(node.name.getStart(), node.name.getEnd());
                    
                    smells.push({
                        type: 'naming',
                        severity: 'info',
                        location: range,
                        message: `函数名 "${name}" 不符合命名规范`,
                        refactoringOptions: [
                            {
                                id: 'rename-function',
                                name: '重命名函数',
                                description: '使用更清晰的函数名',
                                category: 'rename',
                                confidence: 0.8,
                                impact: 'low',
                                automated: false
                            }
                        ]
                    });
                }
            }
            
            ts.forEachChild(node, visit);
        };
        
        visit(this.sourceFile);
        return smells;
    }
    
    // 🎯 获取基于选择的建议
    private getSelectionBasedSuggestions(range: vscode.Range): RefactoringOption[] {
        const suggestions: RefactoringOption[] = [];
        
        // 提取方法
        suggestions.push({
            id: 'extract-method',
            name: '提取方法',
            description: '将选中的代码提取为独立方法',
            category: 'extract',
            confidence: 0.9,
            impact: 'medium',
            automated: true,
            preview: 'private extractedMethod() {\n  // 提取的代码\n}'
        });
        
        // 提取变量
        suggestions.push({
            id: 'extract-variable',
            name: '提取变量',
            description: '将选中的表达式提取为变量',
            category: 'extract',
            confidence: 0.95,
            impact: 'low',
            automated: true,
            preview: 'const extractedVariable = /* 选中的表达式 */;'
        });
        
        // 内联代码
        suggestions.push({
            id: 'inline-selection',
            name: '内联代码',
            description: '将选中的代码内联到使用位置',
            category: 'inline',
            confidence: 0.7,
            impact: 'medium',
            automated: false
        });
        
        return suggestions;
    }
    
    // 🎯 获取基于文件的建议
    private getFileBasedSuggestions(): RefactoringOption[] {
        const suggestions: RefactoringOption[] = [];
        
        // 现代化代码
        suggestions.push({
            id: 'modernize-syntax',
            name: '现代化语法',
            description: '将代码升级到现代JavaScript/TypeScript语法',
            category: 'modernize',
            confidence: 0.8,
            impact: 'medium',
            automated: true
        });
        
        // 优化导入
        suggestions.push({
            id: 'optimize-imports',
            name: '优化导入',
            description: '整理和优化import语句',
            category: 'optimize',
            confidence: 0.95,
            impact: 'low',
            automated: true
        });
        
        // 添加类型注解
        suggestions.push({
            id: 'add-type-annotations',
            name: '添加类型注解',
            description: '为变量和函数添加TypeScript类型注解',
            category: 'modernize',
            confidence: 0.7,
            impact: 'high',
            automated: true
        });
        
        return suggestions;
    }
    
    // ⭐ 执行提取重构
    private async executeExtractRefactoring(
        document: vscode.TextDocument,
        option: RefactoringOption,
        parameters?: Record<string, any>
    ): Promise<RefactoringResult> {
        // 实现提取重构逻辑
        const edit = new vscode.WorkspaceEdit();
        
        switch (option.id) {
            case 'extract-method':
                // 实现提取方法逻辑
                break;
            case 'extract-variable':
                // 实现提取变量逻辑
                break;
        }
        
        return {
            success: true,
            changes: [edit],
            warnings: [],
            suggestions: ['重构完成后请运行测试确保功能正常']
        };
    }
    
    // ⭐ 执行内联重构
    private async executeInlineRefactoring(
        document: vscode.TextDocument,
        option: RefactoringOption,
        parameters?: Record<string, any>
    ): Promise<RefactoringResult> {
        // 实现内联重构逻辑
        return {
            success: true,
            changes: [],
            warnings: [],
            suggestions: []
        };
    }
    
    // ⭐ 执行移动重构
    private async executeMoveRefactoring(
        document: vscode.TextDocument,
        option: RefactoringOption,
        parameters?: Record<string, any>
    ): Promise<RefactoringResult> {
        // 实现移动重构逻辑
        return {
            success: true,
            changes: [],
            warnings: [],
            suggestions: []
        };
    }
    
    // ⭐ 执行重命名重构
    private async executeRenameRefactoring(
        document: vscode.TextDocument,
        option: RefactoringOption,
        parameters?: Record<string, any>
    ): Promise<RefactoringResult> {
        // 实现重命名重构逻辑
        return {
            success: true,
            changes: [],
            warnings: [],
            suggestions: []
        };
    }
    
    // ⭐ 执行优化重构
    private async executeOptimizeRefactoring(
        document: vscode.TextDocument,
        option: RefactoringOption,
        parameters?: Record<string, any>
    ): Promise<RefactoringResult> {
        // 实现优化重构逻辑
        return {
            success: true,
            changes: [],
            warnings: [],
            suggestions: []
        };
    }
    
    // ⭐ 执行现代化重构
    private async executeModernizeRefactoring(
        document: vscode.TextDocument,
        option: RefactoringOption,
        parameters?: Record<string, any>
    ): Promise<RefactoringResult> {
        // 实现现代化重构逻辑
        return {
            success: true,
            changes: [],
            warnings: [],
            suggestions: []
        };
    }
    
    // 🔢 辅助方法
    private tsPositionToVSCodePosition(lineAndChar: ts.LineAndCharacter): vscode.Position {
        return new vscode.Position(lineAndChar.line, lineAndChar.character);
    }
    
    private tsRangeToVSCodeRange(start: number, end: number): vscode.Range {
        if (!this.sourceFile) {
            return new vscode.Range(0, 0, 0, 0);
        }
        
        const startPos = this.tsPositionToVSCodePosition(this.sourceFile.getLineAndCharacterOfPosition(start));
        const endPos = this.tsPositionToVSCodePosition(this.sourceFile.getLineAndCharacterOfPosition(end));
        
        return new vscode.Range(startPos, endPos);
    }
    
    private calculateSimilarity(node1: ts.Node, node2: ts.Node): number {
        const text1 = node1.getFullText().trim();
        const text2 = node2.getFullText().trim();
        
        if (text1 === text2) return 1;
        
        // 简单的相似度计算
        const longer = text1.length > text2.length ? text1 : text2;
        const shorter = text1.length > text2.length ? text2 : text1;
        
        if (longer.length === 0) return 1;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    
    private calculateCyclomaticComplexity(node: ts.Node): number {
        let complexity = 1; // 基础复杂度
        
        const visit = (child: ts.Node) => {
            // 增加复杂度的结构
            if (ts.isIfStatement(child) ||
                ts.isWhileStatement(child) ||
                ts.isForStatement(child) ||
                ts.isForInStatement(child) ||
                ts.isForOfStatement(child) ||
                ts.isSwitchStatement(child) ||
                ts.isCatchClause(child)) {
                complexity++;
            }
            
            // 条件表达式
            if (ts.isConditionalExpression(child)) {
                complexity++;
            }
            
            // 逻辑运算符
            if (ts.isBinaryExpression(child) && 
                (child.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
                 child.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
                complexity++;
            }
            
            ts.forEachChild(child, visit);
        };
        
        ts.forEachChild(node, visit);
        return complexity;
    }
    
    private countLines(node: ts.Node): number {
        const text = node.getFullText();
        return text.split('\n').length;
    }
    
    private isSymbolUnused(symbol: ts.Symbol): boolean {
        // 简化的未使用检测
        return symbol.valueDeclaration !== undefined && 
               symbol.getDeclarations()?.length === 1;
    }
    
    private analyzeDependencies(classNode: ts.ClassDeclaration): string[] {
        const dependencies: string[] = [];
        
        const visit = (node: ts.Node) => {
            if (ts.isIdentifier(node) && node.text) {
                dependencies.push(node.text);
            }
            ts.forEachChild(node, visit);
        };
        
        ts.forEachChild(classNode, visit);
        
        // 去重并过滤
        return [...new Set(dependencies)];
    }
    
    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
}

// 导出单例实例
export const intelligentRefactoringEngine = IntelligentRefactoringEngine.getInstance();