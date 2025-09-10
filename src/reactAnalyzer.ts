import * as vscode from 'vscode';
import { Parameter, FunctionInfo, ClassInfo } from './codeAnalyzer';

// React特定的代码分析接口
export interface ReactComponent {
    name: string;
    displayName: string;
    type: 'functional' | 'class';
    hooks: ReactHook[];
    props: ReactProp[];
    jsx: JSXElement[];
    line: number;
    column: number;
}

export interface ReactHook {
    name: string;
    displayName: string;
    type: string;
    dependencies?: string[];
    line: number;
}

export interface ReactProp {
    name: string;
    type: string;
    optional: boolean;
    defaultValue?: string;
}

export interface JSXElement {
    tagName: string;
    props: string[];
    children: boolean;
    line: number;
}

export class ReactAnalyzer {
    private reactTranslations: Map<string, string>;

    constructor() {
        this.reactTranslations = new Map([
            // React Hooks
            ['useState', '状态钩子'],
            ['useEffect', '副作用钩子'],
            ['useContext', '上下文钩子'],
            ['useReducer', '减速器钩子'],
            ['useCallback', '回调钩子'],
            ['useMemo', '记忆化钩子'],
            ['useRef', '引用钩子'],
            ['useImperativeHandle', '命令式处理钩子'],
            ['useLayoutEffect', '布局副作用钩子'],
            ['useDebugValue', '调试值钩子'],
            
            // React Components
            ['Component', '组件类'],
            ['PureComponent', '纯组件类'],
            ['memo', '记忆化组件'],
            ['forwardRef', '转发引用组件'],
            ['lazy', '懒加载组件'],
            ['Suspense', '悬停组件'],
            ['Fragment', '片段组件'],
            
            // React Props and State
            ['props', '属性'],
            ['state', '状态'],
            ['children', '子元素'],
            ['key', '键值'],
            ['ref', '引用'],
            
            // Event Handlers
            ['onClick', '点击事件'],
            ['onChange', '改变事件'],
            ['onSubmit', '提交事件'],
            ['onFocus', '聚焦事件'],
            ['onBlur', '失焦事件'],
            ['onMouseEnter', '鼠标进入事件'],
            ['onMouseLeave', '鼠标离开事件'],
            ['onKeyDown', '按键按下事件'],
            ['onKeyUp', '按键抬起事件'],
            
            // React Router
            ['useNavigate', '导航钩子'],
            ['useLocation', '位置钩子'],
            ['useParams', '参数钩子'],
            ['Route', '路由组件'],
            ['Link', '链接组件'],
            ['Navigate', '导航组件'],
            
            // Form Libraries
            ['useForm', '表单钩子'],
            ['Controller', '控制器组件'],
            ['Field', '字段组件'],
            
            // State Management
            ['useSelector', '选择器钩子'],
            ['useDispatch', '派发钩子'],
            ['connect', '连接高阶组件'],
            ['Provider', '提供者组件'],
            
            // API Calls
            ['fetch', '获取数据'],
            ['axios', 'HTTP客户端'],
            ['async', '异步函数'],
            ['await', '等待'],
            ['Promise', '承诺对象'],
            
            // TypeScript/JSX
            ['interface', '接口定义'],
            ['type', '类型定义'],
            ['export', '导出'],
            ['import', '导入'],
            ['default', '默认导出'],
            ['as', '类型断言'],
            
            // HTML Elements
            ['div', '容器元素'],
            ['span', '内联元素'],
            ['button', '按钮'],
            ['input', '输入框'],
            ['form', '表单'],
            ['img', '图片'],
            ['a', '链接'],
            ['ul', '无序列表'],
            ['li', '列表项'],
            ['h1', '一级标题'],
            ['h2', '二级标题'],
            ['h3', '三级标题'],
            ['p', '段落'],
            ['table', '表格'],
            ['tr', '表格行'],
            ['td', '表格单元格'],
            ['th', '表格头']
        ]);
    }

    analyzeReactCode(text: string, fileName: string): ReactComponent[] {
        const components: ReactComponent[] = [];
        const lines = text.split('\n');

        // 分析函数式组件
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 匹配函数式组件
            const funcComponentMatch = line.match(/(?:export\s+(?:default\s+)?)?(?:const\s+|function\s+)(\w+)\s*(?:=\s*\([^)]*\)\s*=>\s*{|\([^)]*\)\s*{)/);
            if (funcComponentMatch && this.isReactComponent(text, funcComponentMatch[1])) {
                const componentName = funcComponentMatch[1];
                const component: ReactComponent = {
                    name: componentName,
                    displayName: this.translateIdentifier(componentName),
                    type: 'functional',
                    hooks: this.extractHooks(text, componentName),
                    props: this.extractProps(text, componentName),
                    jsx: this.extractJSXElements(text, componentName),
                    line: lineNumber,
                    column: line.indexOf(componentName)
                };
                components.push(component);
            }

            // 匹配类组件
            const classComponentMatch = line.match(/(?:export\s+(?:default\s+)?)?class\s+(\w+)\s+extends\s+(?:React\.)?(?:Component|PureComponent)/);
            if (classComponentMatch) {
                const componentName = classComponentMatch[1];
                const component: ReactComponent = {
                    name: componentName,
                    displayName: this.translateIdentifier(componentName),
                    type: 'class',
                    hooks: [], // 类组件不使用hooks
                    props: this.extractClassProps(text, componentName),
                    jsx: this.extractJSXElements(text, componentName),
                    line: lineNumber,
                    column: line.indexOf(componentName)
                };
                components.push(component);
            }
        }

        return components;
    }

    private isReactComponent(text: string, functionName: string): boolean {
        // 检查函数是否返回JSX
        const functionBody = this.extractFunctionBody(text, functionName);
        return functionBody.includes('return') && 
               (functionBody.includes('<') || functionBody.includes('React.createElement'));
    }

    private extractFunctionBody(text: string, functionName: string): string {
        const lines = text.split('\n');
        let inFunction = false;
        let braceCount = 0;
        let functionBody = '';

        for (const line of lines) {
            if (line.includes(`function ${functionName}`) || line.includes(`const ${functionName}`)) {
                inFunction = true;
            }

            if (inFunction) {
                functionBody += line + '\n';
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                if (braceCount === 0 && line.includes('}')) {
                    break;
                }
            }
        }

        return functionBody;
    }

    private extractHooks(text: string, componentName: string): ReactHook[] {
        const hooks: ReactHook[] = [];
        const functionBody = this.extractFunctionBody(text, componentName);
        const lines = functionBody.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 匹配各种hooks
            const hookPatterns = [
                /const\s+\[([^,]+),\s*([^\]]+)\]\s*=\s*useState\s*\(([^)]*)\)/,
                /const\s+(\w+)\s*=\s*use(\w+)\s*\(([^)]*)\)/,
                /use(\w+)\s*\(([^)]*)\)/
            ];

            for (const pattern of hookPatterns) {
                const hookMatch = line.match(pattern);
                if (hookMatch) {
                    let hookName, hookType;
                    
                    if (pattern.source.includes('useState')) {
                        hookName = hookMatch[1];
                        hookType = 'useState';
                    } else if (hookMatch[2]) {
                        hookName = hookMatch[1];
                        hookType = 'use' + hookMatch[2];
                    } else {
                        hookName = hookMatch[1];
                        hookType = 'use' + hookMatch[1];
                    }

                    hooks.push({
                        name: hookName,
                        displayName: this.translateHook(hookType),
                        type: hookType,
                        dependencies: this.extractDependencies(hookMatch[0]),
                        line: lineNumber
                    });
                }
            }
        }

        return hooks;
    }

    private extractProps(text: string, componentName: string): ReactProp[] {
        const props: ReactProp[] = [];
        const functionBody = this.extractFunctionBody(text, componentName);

        // 匹配函数参数中的props
        const propsMatch = functionBody.match(/function\s+\w+\s*\(\s*{\s*([^}]+)\s*}\s*\)|const\s+\w+\s*=\s*\(\s*{\s*([^}]+)\s*}\s*\)/);
        if (propsMatch) {
            const propsString = propsMatch[1] || propsMatch[2];
            const propItems = propsString.split(',');

            propItems.forEach(prop => {
                const cleanProp = prop.trim();
                const [name, defaultValue] = cleanProp.split('=');
                
                props.push({
                    name: name.trim(),
                    type: 'unknown',
                    optional: cleanProp.includes('?') || defaultValue !== undefined,
                    defaultValue: defaultValue?.trim()
                });
            });
        }

        return props;
    }

    private extractClassProps(text: string, componentName: string): ReactProp[] {
        const props: ReactProp[] = [];
        // 类组件的props分析逻辑
        // 这里可以扩展解析this.props的使用
        return props;
    }

    private extractJSXElements(text: string, componentName: string): JSXElement[] {
        const jsxElements: JSXElement[] = [];
        const functionBody = this.extractFunctionBody(text, componentName);
        const lines = functionBody.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 匹配JSX元素
            const jsxMatch = line.match(/<(\w+)([^>]*)(\/?>)/);
            if (jsxMatch) {
                const tagName = jsxMatch[1];
                const attrs = jsxMatch[2];
                const isSelfClosing = jsxMatch[3] === '/>';

                jsxElements.push({
                    tagName,
                    props: this.extractJSXProps(attrs),
                    children: !isSelfClosing,
                    line: lineNumber
                });
            }
        }

        return jsxElements;
    }

    private extractJSXProps(attrsString: string): string[] {
        const props: string[] = [];
        const propPattern = /(\w+)(?:=(?:{[^}]*}|"[^"]*"|'[^']*'))?/g;
        let match;

        while ((match = propPattern.exec(attrsString)) !== null) {
            props.push(match[1]);
        }

        return props;
    }

    private extractDependencies(hookString: string): string[] {
        // 提取useEffect等hook的依赖数组
        const depsMatch = hookString.match(/\[([^\]]*)\]/);
        if (depsMatch) {
            return depsMatch[1].split(',').map(dep => dep.trim()).filter(dep => dep);
        }
        return [];
    }

    private translateHook(hookType: string): string {
        return this.reactTranslations.get(hookType) || hookType;
    }

    private translateIdentifier(identifier: string): string {
        // 首先检查直接翻译
        if (this.reactTranslations.has(identifier)) {
            return this.reactTranslations.get(identifier)!;
        }

        // React组件名称翻译
        if (identifier.endsWith('Component')) {
            return identifier.replace('Component', '组件');
        }
        if (identifier.endsWith('Container')) {
            return identifier.replace('Container', '容器');
        }
        if (identifier.endsWith('Provider')) {
            return identifier.replace('Provider', '提供者');
        }
        if (identifier.endsWith('Hook')) {
            return identifier.replace('Hook', '钩子');
        }

        // 常见前缀翻译
        if (identifier.startsWith('use')) {
            return '使用' + identifier.substring(3);
        }
        if (identifier.startsWith('handle')) {
            return '处理' + identifier.substring(6);
        }
        if (identifier.startsWith('on')) {
            return identifier.substring(2) + '事件处理';
        }

        return identifier;
    }

    getReactNodeDescription(component: ReactComponent): string {
        const hookCount = component.hooks.length;
        const propCount = component.props.length;
        const jsxCount = component.jsx.length;

        let description = `${component.type === 'functional' ? '函数式' : '类'}组件`;
        
        if (hookCount > 0) {
            description += ` • ${hookCount}个钩子`;
        }
        if (propCount > 0) {
            description += ` • ${propCount}个属性`;
        }
        if (jsxCount > 0) {
            description += ` • ${jsxCount}个元素`;
        }

        return description;
    }
}
