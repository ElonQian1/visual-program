import * as vscode from 'vscode';
import * as ts from 'typescript';

export interface ASTNode {
    id: string;
    type: string;
    name: string;
    startPosition: number;
    endPosition: number;
    children: ASTNode[];
    metadata: Record<string, any>;
    chineseName?: string;
}

export interface ParsedAST {
    nodes: ASTNode[];
    imports: ImportInfo[];
    exports: ExportInfo[];
    dependencies: DependencyInfo[];
}

export interface ImportInfo {
    source: string;
    imports: string[];
    type: 'default' | 'named' | 'namespace';
}

export interface ExportInfo {
    name: string;
    type: 'function' | 'class' | 'variable' | 'type';
    isDefault: boolean;
}

export interface DependencyInfo {
    from: string;
    to: string;
    type: 'import' | 'call' | 'extends' | 'implements';
}

export class AdvancedASTParser {
    private readonly translationMap: Map<string, string> = new Map([
        // TypeScript/JavaScript 翻译
        ['function', '函数'],
        ['class', '类'],
        ['interface', '接口'],
        ['type', '类型'],
        ['variable', '变量'],
        ['const', '常量'],
        ['let', '变量'],
        ['var', '变量'],
        ['import', '导入'],
        ['export', '导出'],
        ['if', '条件判断'],
        ['for', '循环'],
        ['while', '循环'],
        ['switch', '开关'],
        ['try', '尝试'],
        ['catch', '捕获'],
        ['finally', '最终'],
        ['async', '异步'],
        ['await', '等待'],
        ['promise', '承诺'],
        ['callback', '回调'],
        
        // React 专用翻译
        ['component', '组件'],
        ['props', '属性'],
        ['state', '状态'],
        ['useState', '状态钩子'],
        ['useEffect', '副作用钩子'],
        ['useContext', '上下文钩子'],
        ['useCallback', '回调钩子'],
        ['useMemo', '记忆钩子'],
        ['useRef', '引用钩子'],
        ['useReducer', '减速器钩子'],
        ['jsx', 'JSX元素'],
        ['render', '渲染'],
        ['lifecycle', '生命周期'],
        
        // Rust 专用翻译
        ['struct', '结构体'],
        ['enum', '枚举'],
        ['trait', '特征'],
        ['impl', '实现'],
        ['fn', '函数'],
        ['mod', '模块'],
        ['use', '使用'],
        ['pub', '公开'],
        ['mut', '可变'],
        ['match', '匹配'],
        ['if let', '条件绑定'],
        ['while let', '循环绑定'],
        ['loop', '无限循环'],
        ['async fn', '异步函数'],
        ['await', '等待'],
        ['Result', '结果类型'],
        ['Option', '选项类型'],
        ['Vec', '向量'],
        ['HashMap', '哈希映射'],
        ['String', '字符串'],
        ['&str', '字符串引用'],
        ['Box', '堆分配'],
        ['Rc', '引用计数'],
        ['Arc', '原子引用计数'],
        ['Mutex', '互斥锁'],
        ['RwLock', '读写锁'],
    ]);

    public async parseTypeScript(document: vscode.TextDocument): Promise<ParsedAST> {
        const sourceFile = ts.createSourceFile(
            document.fileName,
            document.getText(),
            ts.ScriptTarget.Latest,
            true
        );

        const nodes: ASTNode[] = [];
        const imports: ImportInfo[] = [];
        const exports: ExportInfo[] = [];
        const dependencies: DependencyInfo[] = [];

        const visit = (node: ts.Node, parent?: ASTNode) => {
            const astNode = this.createASTNode(node, sourceFile);
            
            if (parent) {
                parent.children.push(astNode);
            } else {
                nodes.push(astNode);
            }

            // 处理导入
            if (ts.isImportDeclaration(node)) {
                this.processImport(node, imports, dependencies);
            }

            // 处理导出
            if (this.isExportNode(node)) {
                this.processExport(node, exports);
            }

            // 递归处理子节点
            ts.forEachChild(node, (child: ts.Node) => visit(child, astNode));
        };

        visit(sourceFile);

        return { nodes, imports, exports, dependencies };
    }

    public async parseRust(document: vscode.TextDocument): Promise<ParsedAST> {
        // 使用简化的 Rust 解析器
        // 在实际项目中，这里会集成 tree-sitter-rust
        const content = document.getText();
        const nodes: ASTNode[] = [];
        const imports: ImportInfo[] = [];
        const exports: ExportInfo[] = [];
        const dependencies: DependencyInfo[] = [];

        // 解析 use 语句
        const useRegex = /use\s+([^;]+);/g;
        let match;
        while ((match = useRegex.exec(content)) !== null) {
            const importPath = match[1].trim();
            imports.push({
                source: importPath,
                imports: [importPath],
                type: 'named'
            });
        }

        // 解析函数
        const fnRegex = /(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/g;
        while ((match = fnRegex.exec(content)) !== null) {
            const node: ASTNode = {
                id: `fn_${match[1]}_${match.index}`,
                type: 'function',
                name: match[1],
                chineseName: '函数',
                startPosition: match.index,
                endPosition: match.index + match[0].length,
                children: [],
                metadata: {
                    isPublic: match[0].includes('pub'),
                    isAsync: match[0].includes('async'),
                    language: 'rust'
                }
            };
            nodes.push(node);
        }

        // 解析结构体
        const structRegex = /(?:pub\s+)?struct\s+(\w+)/g;
        while ((match = structRegex.exec(content)) !== null) {
            const node: ASTNode = {
                id: `struct_${match[1]}_${match.index}`,
                type: 'struct',
                name: match[1],
                chineseName: '结构体',
                startPosition: match.index,
                endPosition: match.index + match[0].length,
                children: [],
                metadata: {
                    isPublic: match[0].includes('pub'),
                    language: 'rust'
                }
            };
            nodes.push(node);
        }

        // 解析枚举
        const enumRegex = /(?:pub\s+)?enum\s+(\w+)/g;
        while ((match = enumRegex.exec(content)) !== null) {
            const node: ASTNode = {
                id: `enum_${match[1]}_${match.index}`,
                type: 'enum',
                name: match[1],
                chineseName: '枚举',
                startPosition: match.index,
                endPosition: match.index + match[0].length,
                children: [],
                metadata: {
                    isPublic: match[0].includes('pub'),
                    language: 'rust'
                }
            };
            nodes.push(node);
        }

        return { nodes, imports, exports, dependencies };
    }

    private createASTNode(node: ts.Node, sourceFile: ts.SourceFile): ASTNode {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const nodeType = ts.SyntaxKind[node.kind];
        const nodeName = this.getNodeName(node);
        
        return {
            id: `${nodeType}_${nodeName}_${node.getStart()}`,
            type: nodeType,
            name: nodeName,
            chineseName: this.translateToChinese(nodeType),
            startPosition: node.getStart(),
            endPosition: node.getEnd(),
            children: [],
            metadata: {
                line: line + 1,
                character: character + 1,
                kind: node.kind,
                language: 'typescript'
            }
        };
    }

    private getNodeName(node: ts.Node): string {
        if (ts.isIdentifier(node)) {
            return node.text;
        }
        
        if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
            return node.name?.getText() || '匿名函数';
        }
        
        if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
            return node.name?.getText() || '匿名类型';
        }
        
        if (ts.isVariableDeclaration(node)) {
            return node.name.getText();
        }
        
        return ts.SyntaxKind[node.kind];
    }

    private processImport(node: ts.ImportDeclaration, imports: ImportInfo[], dependencies: DependencyInfo[]) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
            const source = moduleSpecifier.text;
            const importClause = node.importClause;
            
            if (importClause) {
                const importInfo: ImportInfo = {
                    source,
                    imports: [],
                    type: 'named'
                };

                // 默认导入
                if (importClause.name) {
                    importInfo.imports.push(importClause.name.text);
                    importInfo.type = 'default';
                }

                // 命名导入
                if (importClause.namedBindings) {
                    if (ts.isNamespaceImport(importClause.namedBindings)) {
                        importInfo.imports.push(importClause.namedBindings.name.text);
                        importInfo.type = 'namespace';
                    } else if (ts.isNamedImports(importClause.namedBindings)) {
                        for (const element of importClause.namedBindings.elements) {
                            importInfo.imports.push(element.name.text);
                        }
                    }
                }

                imports.push(importInfo);

                // 添加依赖关系
                for (const importName of importInfo.imports) {
                    dependencies.push({
                        from: source,
                        to: importName,
                        type: 'import'
                    });
                }
            }
        }
    }

    private processExport(node: ts.Node, exports: ExportInfo[]) {
        if (ts.isExportDeclaration(node)) {
            // 处理 export { ... } 语句
            if (node.exportClause && ts.isNamedExports(node.exportClause)) {
                for (const element of node.exportClause.elements) {
                    exports.push({
                        name: element.name.text,
                        type: 'variable',
                        isDefault: false
                    });
                }
            }
        } else if (this.hasExportModifier(node)) {
            // 处理带 export 修饰符的声明
            const name = this.getNodeName(node);
            const type = this.getExportType(node);
            const isDefault = this.hasDefaultModifier(node);
            
            exports.push({ name, type, isDefault });
        }
    }

    private isExportNode(node: ts.Node): boolean {
        return ts.isExportDeclaration(node) || this.hasExportModifier(node);
    }

    private hasExportModifier(node: ts.Node): boolean {
        return node.modifiers?.some((modifier: ts.ModifierLike) => 
            modifier.kind === ts.SyntaxKind.ExportKeyword
        ) || false;
    }

    private hasDefaultModifier(node: ts.Node): boolean {
        return node.modifiers?.some((modifier: ts.ModifierLike) => 
            modifier.kind === ts.SyntaxKind.DefaultKeyword
        ) || false;
    }

    private getExportType(node: ts.Node): 'function' | 'class' | 'variable' | 'type' {
        if (ts.isFunctionDeclaration(node)) {return 'function';}
        if (ts.isClassDeclaration(node)) {return 'class';}
        if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {return 'type';}
        return 'variable';
    }

    private translateToChinese(term: string): string {
        const lowerTerm = term.toLowerCase();
        return this.translationMap.get(lowerTerm) || term;
    }

    public async parseDocument(document: vscode.TextDocument): Promise<ParsedAST> {
        const language = document.languageId;
        
        switch (language) {
            case 'typescript':
            case 'javascript':
            case 'typescriptreact':
            case 'javascriptreact':
                return this.parseTypeScript(document);
            case 'rust':
                return this.parseRust(document);
            default:
                throw new Error(`不支持的语言: ${language}`);
        }
    }
}
