import * as vscode from 'vscode';

// TypeScript类型分析
export interface TypeScriptInterface {
    name: string;
    displayName: string;
    properties: TypeProperty[];
    extends?: string[];
    generics?: string[];
    exported: boolean;
    line: number;
}

export interface TypeProperty {
    name: string;
    type: string;
    optional: boolean;
    readonly: boolean;
    description?: string;
}

export interface TypeScriptType {
    name: string;
    displayName: string;
    kind: 'type' | 'union' | 'intersection' | 'literal';
    definition: string;
    exported: boolean;
    line: number;
}

// React组件Props分析
export interface ComponentProps {
    interfaceName?: string;
    properties: PropProperty[];
    defaultValues: { [key: string]: string };
    line: number;
}

export interface PropProperty {
    name: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: string;
}

// React性能优化分析
export interface ReactPerformance {
    memoUsage: MemoUsage[];
    callbackUsage: CallbackUsage[];
    effectDependencies: EffectDependency[];
    rerenderRisks: RerenderRisk[];
}

export interface MemoUsage {
    componentName: string;
    type: 'React.memo' | 'useMemo' | 'useCallback';
    dependencies?: string[];
    line: number;
}

export interface CallbackUsage {
    hookName: string;
    dependencies: string[];
    stable: boolean;
    line: number;
}

export interface EffectDependency {
    dependencies: string[];
    missing: string[];
    unnecessary: string[];
    line: number;
}

export interface RerenderRisk {
    reason: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
    line: number;
}

// React测试分析
export interface ReactTest {
    name: string;
    type: 'unit' | 'integration' | 'e2e';
    framework: 'jest' | 'react-testing-library' | 'enzyme' | 'cypress';
    componentTested?: string;
    assertions: TestAssertion[];
    line: number;
}

export interface TestAssertion {
    type: string;
    target: string;
    line: number;
}

export class AdvancedTypeScriptAnalyzer {
    private tsInterfacePatterns: RegExp[];
    private tsTypePatterns: RegExp[];
    private reactPatterns: RegExp[];

    constructor() {
        this.tsInterfacePatterns = [
            /interface\s+(\w+)(?:<[^>]+>)?\s*(?:extends\s+([^{]+))?\s*{/g,
            /export\s+interface\s+(\w+)(?:<[^>]+>)?\s*(?:extends\s+([^{]+))?\s*{/g
        ];

        this.tsTypePatterns = [
            /type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g,
            /export\s+type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g
        ];

        this.reactPatterns = [
            /React\.memo\(/g,
            /useMemo\(/g,
            /useCallback\(/g,
            /React\.forwardRef\(/g
        ];
    }

    analyzeTypeScript(text: string): {
        interfaces: TypeScriptInterface[];
        types: TypeScriptType[];
        performance: ReactPerformance;
        tests: ReactTest[];
    } {
        return {
            interfaces: this.extractInterfaces(text),
            types: this.extractTypes(text),
            performance: this.analyzePerformance(text),
            tests: this.analyzeTests(text)
        };
    }

    private extractInterfaces(text: string): TypeScriptInterface[] {
        const interfaces: TypeScriptInterface[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 匹配接口定义
            const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)(?:<[^>]+>)?\s*(?:extends\s+([^{]+))?\s*{/);
            if (interfaceMatch) {
                const interfaceName = interfaceMatch[1];
                const extendsClause = interfaceMatch[2];
                
                // 提取接口属性
                const properties = this.extractInterfaceProperties(text, i);
                
                interfaces.push({
                    name: interfaceName,
                    displayName: this.translateInterfaceName(interfaceName),
                    properties,
                    extends: extendsClause ? extendsClause.split(',').map(s => s.trim()) : undefined,
                    exported: line.includes('export'),
                    line: i + 1
                });
            }
        }

        return interfaces;
    }

    private extractInterfaceProperties(text: string, startLine: number): TypeProperty[] {
        const properties: TypeProperty[] = [];
        const lines = text.split('\n');
        let braceCount = 0;
        let inInterface = false;

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes('{')) {
                braceCount += (line.match(/{/g) || []).length;
                inInterface = true;
            }
            
            if (line.includes('}')) {
                braceCount -= (line.match(/}/g) || []).length;
                if (braceCount === 0) break;
            }

            if (inInterface && braceCount > 0) {
                // 匹配属性定义
                const propMatch = line.match(/(\w+)(\?)?:\s*([^;,]+)[;,]?/);
                if (propMatch) {
                    const [, propName, optional, propType] = propMatch;
                    properties.push({
                        name: propName,
                        type: propType.trim(),
                        optional: !!optional,
                        readonly: line.includes('readonly')
                    });
                }
            }
        }

        return properties;
    }

    private extractTypes(text: string): TypeScriptType[] {
        const types: TypeScriptType[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 匹配类型别名
            const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/);
            if (typeMatch) {
                const [, typeName, typeDefinition] = typeMatch;
                
                types.push({
                    name: typeName,
                    displayName: this.translateTypeName(typeName),
                    kind: this.determineTypeKind(typeDefinition),
                    definition: typeDefinition.trim(),
                    exported: line.includes('export'),
                    line: i + 1
                });
            }
        }

        return types;
    }

    private analyzePerformance(text: string): ReactPerformance {
        const memoUsage = this.findMemoUsage(text);
        const callbackUsage = this.findCallbackUsage(text);
        const effectDependencies = this.analyzeEffectDependencies(text);
        const rerenderRisks = this.findRerenderRisks(text);

        return {
            memoUsage,
            callbackUsage,
            effectDependencies,
            rerenderRisks
        };
    }

    private findMemoUsage(text: string): MemoUsage[] {
        const memoUsages: MemoUsage[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // React.memo
            if (line.includes('React.memo(')) {
                const componentMatch = line.match(/React\.memo\((\w+)/);
                if (componentMatch) {
                    memoUsages.push({
                        componentName: componentMatch[1],
                        type: 'React.memo',
                        line: i + 1
                    });
                }
            }

            // useMemo
            if (line.includes('useMemo(')) {
                const dependencyMatch = this.extractHookDependencies(text, i);
                memoUsages.push({
                    componentName: 'useMemo调用',
                    type: 'useMemo',
                    dependencies: dependencyMatch,
                    line: i + 1
                });
            }

            // useCallback
            if (line.includes('useCallback(')) {
                const dependencyMatch = this.extractHookDependencies(text, i);
                memoUsages.push({
                    componentName: 'useCallback调用',
                    type: 'useCallback',
                    dependencies: dependencyMatch,
                    line: i + 1
                });
            }
        }

        return memoUsages;
    }

    private findCallbackUsage(text: string): CallbackUsage[] {
        const callbacks: CallbackUsage[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('useCallback(')) {
                const dependencies = this.extractHookDependencies(text, i);
                const stable = this.isCallbackStable(dependencies);
                
                callbacks.push({
                    hookName: 'useCallback',
                    dependencies,
                    stable,
                    line: i + 1
                });
            }
        }

        return callbacks;
    }

    private analyzeEffectDependencies(text: string): EffectDependency[] {
        const effects: EffectDependency[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('useEffect(')) {
                const dependencies = this.extractHookDependencies(text, i);
                const usedVariables = this.findUsedVariablesInEffect(text, i);
                
                const missing = usedVariables.filter(v => !dependencies.includes(v));
                const unnecessary = dependencies.filter(d => !usedVariables.includes(d));
                
                effects.push({
                    dependencies,
                    missing,
                    unnecessary,
                    line: i + 1
                });
            }
        }

        return effects;
    }

    private findRerenderRisks(text: string): RerenderRisk[] {
        const risks: RerenderRisk[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检查内联对象创建
            if (line.includes('style={{') || line.includes('className={{')) {
                risks.push({
                    reason: '内联对象创建可能导致不必要的重渲染',
                    severity: 'medium',
                    suggestion: '考虑将样式对象提取到组件外部或使用useMemo',
                    line: i + 1
                });
            }

            // 检查内联函数
            if (line.includes('onClick={() =>') || line.includes('onChange={() =>')) {
                risks.push({
                    reason: '内联函数可能导致子组件重渲染',
                    severity: 'medium',
                    suggestion: '考虑使用useCallback缓存函数',
                    line: i + 1
                });
            }

            // 检查缺少key属性
            if (line.includes('.map(') && !line.includes('key=')) {
                risks.push({
                    reason: '列表渲染缺少key属性',
                    severity: 'high',
                    suggestion: '为列表项添加唯一的key属性',
                    line: i + 1
                });
            }
        }

        return risks;
    }

    private analyzeTests(text: string): ReactTest[] {
        const tests: ReactTest[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Jest测试
            if (line.includes('test(') || line.includes('it(')) {
                const testName = this.extractTestName(line);
                const framework = this.detectTestFramework(text);
                const assertions = this.extractTestAssertions(text, i);
                
                tests.push({
                    name: testName,
                    type: this.determineTestType(testName),
                    framework,
                    assertions,
                    line: i + 1
                });
            }
        }

        return tests;
    }

    // 辅助方法
    private extractHookDependencies(text: string, lineIndex: number): string[] {
        const lines = text.split('\n');
        let searchRange = Math.min(lineIndex + 5, lines.length);
        
        for (let i = lineIndex; i < searchRange; i++) {
            const line = lines[i];
            const depMatch = line.match(/\[([^\]]*)\]/);
            if (depMatch) {
                return depMatch[1].split(',').map(dep => dep.trim().replace(/['"]/g, ''));
            }
        }
        
        return [];
    }

    private findUsedVariablesInEffect(text: string, lineIndex: number): string[] {
        // 简化实现：查找effect函数体中使用的变量
        const lines = text.split('\n');
        const variables: string[] = [];
        let inEffect = false;
        let braceCount = 0;

        for (let i = lineIndex; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('useEffect(')) {
                inEffect = true;
            }
            
            if (inEffect) {
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
                
                // 简单的变量识别
                const varMatches = line.match(/\b(\w+)\b/g);
                if (varMatches) {
                    variables.push(...varMatches.filter(v => 
                        !['const', 'let', 'var', 'function', 'return', 'if', 'else'].includes(v)
                    ));
                }
                
                if (braceCount === 0) break;
            }
        }

        return [...new Set(variables)];
    }

    private isCallbackStable(dependencies: string[]): boolean {
        return dependencies.length === 0 || dependencies.every(dep => 
            ['props', 'state'].some(stable => dep.startsWith(stable))
        );
    }

    private determineTypeKind(definition: string): 'type' | 'union' | 'intersection' | 'literal' {
        if (definition.includes('|')) return 'union';
        if (definition.includes('&')) return 'intersection';
        if (definition.includes('"') || definition.includes("'")) return 'literal';
        return 'type';
    }

    private detectTestFramework(text: string): 'jest' | 'react-testing-library' | 'enzyme' | 'cypress' {
        if (text.includes('@testing-library/react')) return 'react-testing-library';
        if (text.includes('enzyme')) return 'enzyme';
        if (text.includes('cypress')) return 'cypress';
        return 'jest';
    }

    private determineTestType(testName: string): 'unit' | 'integration' | 'e2e' {
        const lowerName = testName.toLowerCase();
        if (lowerName.includes('e2e') || lowerName.includes('end-to-end')) return 'e2e';
        if (lowerName.includes('integration')) return 'integration';
        return 'unit';
    }

    private extractTestName(line: string): string {
        const match = line.match(/(?:test|it)\(['"`]([^'"`]+)['"`]/);
        return match ? match[1] : '未知测试';
    }

    private extractTestAssertions(text: string, startLine: number): TestAssertion[] {
        const assertions: TestAssertion[] = [];
        const lines = text.split('\n');
        
        for (let i = startLine; i < Math.min(startLine + 20, lines.length); i++) {
            const line = lines[i];
            
            if (line.includes('expect(')) {
                const expectMatch = line.match(/expect\(([^)]+)\)/);
                const matcherMatch = line.match(/\.(toBe|toEqual|toContain|toHaveLength|toBeInTheDocument)\(/);
                
                if (expectMatch && matcherMatch) {
                    assertions.push({
                        type: matcherMatch[1],
                        target: expectMatch[1],
                        line: i + 1
                    });
                }
            }
        }
        
        return assertions;
    }

    private translateInterfaceName(name: string): string {
        const translations = new Map([
            ['Props', '属性接口'],
            ['State', '状态接口'],
            ['Config', '配置接口'],
            ['API', 'API接口'],
            ['Response', '响应接口'],
            ['Request', '请求接口'],
            ['User', '用户接口'],
            ['Product', '产品接口'],
            ['Order', '订单接口']
        ]);

        return translations.get(name) || `${name}接口`;
    }

    private translateTypeName(name: string): string {
        const translations = new Map([
            ['ID', '标识符类型'],
            ['Status', '状态类型'],
            ['Theme', '主题类型'],
            ['Color', '颜色类型'],
            ['Size', '尺寸类型'],
            ['Mode', '模式类型']
        ]);

        return translations.get(name) || `${name}类型`;
    }
}
