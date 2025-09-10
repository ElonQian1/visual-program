import * as vscode from 'vscode';
import { ReactComponent, ReactHook } from './reactAnalyzer';

// React路由分析
export interface ReactRoute {
    path: string;
    component: string;
    exact?: boolean;
    children?: ReactRoute[];
    line: number;
}

// React Context分析
export interface ReactContext {
    name: string;
    displayName: string;
    providerProps: string[];
    consumerComponents: string[];
    line: number;
}

// Redux Store分析
export interface ReduxStore {
    name: string;
    actions: ReduxAction[];
    reducers: ReduxReducer[];
    selectors: string[];
    line: number;
}

export interface ReduxAction {
    name: string;
    type: string;
    payload?: string;
    line: number;
}

export interface ReduxReducer {
    name: string;
    cases: string[];
    initialState: string;
    line: number;
}

// React表单分析
export interface ReactForm {
    name: string;
    fields: FormField[];
    validation: ValidationRule[];
    onSubmit: string;
    line: number;
}

export interface FormField {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
}

export interface ValidationRule {
    field: string;
    rule: string;
    message: string;
}

// API调用分析
export interface APICall {
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    endpoint: string;
    requestType?: string;
    responseType?: string;
    errorHandling: boolean;
    line: number;
}

export class AdvancedReactAnalyzer {
    private reactEcosystemTranslations: Map<string, string>;

    constructor() {
        this.reactEcosystemTranslations = new Map([
            // React Router
            ['BrowserRouter', '浏览器路由器'],
            ['HashRouter', '哈希路由器'],
            ['MemoryRouter', '内存路由器'],
            ['StaticRouter', '静态路由器'],
            ['Route', '路由'],
            ['Routes', '路由组合'],
            ['Link', '链接'],
            ['NavLink', '导航链接'],
            ['Navigate', '导航'],
            ['Outlet', '出口'],
            ['useNavigate', '导航钩子'],
            ['useLocation', '位置钩子'],
            ['useParams', '参数钩子'],
            ['useSearchParams', '搜索参数钩子'],
            ['useMatch', '匹配钩子'],
            
            // React Query/TanStack Query
            ['useQuery', '查询钩子'],
            ['useMutation', '变更钩子'],
            ['useInfiniteQuery', '无限查询钩子'],
            ['QueryClient', '查询客户端'],
            ['QueryCache', '查询缓存'],
            ['MutationCache', '变更缓存'],
            ['useQueryClient', '查询客户端钩子'],
            ['useIsFetching', '获取状态钩子'],
            ['useIsMutating', '变更状态钩子'],
            
            // Redux Toolkit
            ['createSlice', '创建切片'],
            ['createAsyncThunk', '创建异步操作'],
            ['createEntityAdapter', '创建实体适配器'],
            ['configureStore', '配置存储'],
            ['createApi', '创建API'],
            ['fetchBaseQuery', '基础查询构建器'],
            ['useSelector', '选择器钩子'],
            ['useDispatch', '派发钩子'],
            ['useStore', '存储钩子'],
            
            // Zustand
            ['create', '创建存储'],
            ['useStore', '使用存储'],
            ['subscribeWithSelector', '选择器订阅'],
            ['persist', '持久化'],
            ['devtools', '开发工具'],
            
            // React Hook Form
            ['useForm', '表单钩子'],
            ['useController', '控制器钩子'],
            ['useFieldArray', '字段数组钩子'],
            ['useWatch', '监听钩子'],
            ['Controller', '控制器'],
            ['FormProvider', '表单提供者'],
            ['useFormContext', '表单上下文钩子'],
            
            // Formik
            ['Formik', '表单组件'],
            ['Form', '表单'],
            ['Field', '字段'],
            ['ErrorMessage', '错误消息'],
            ['FieldArray', '字段数组'],
            ['useFormik', '表单钩子'],
            ['useField', '字段钩子'],
            
            // Material-UI/MUI
            ['ThemeProvider', '主题提供者'],
            ['CssBaseline', 'CSS基准'],
            ['Box', '盒子组件'],
            ['Stack', '堆栈组件'],
            ['Grid', '网格组件'],
            ['Container', '容器组件'],
            ['Typography', '排版组件'],
            ['Button', '按钮组件'],
            ['TextField', '文本字段'],
            ['Select', '选择器'],
            ['Checkbox', '复选框'],
            ['Radio', '单选框'],
            ['Switch', '开关'],
            ['Slider', '滑块'],
            ['AppBar', '应用栏'],
            ['Toolbar', '工具栏'],
            ['Drawer', '抽屉'],
            ['Dialog', '对话框'],
            ['Snackbar', '消息条'],
            ['Tooltip', '工具提示'],
            ['Menu', '菜单'],
            ['Card', '卡片'],
            ['Chip', '标签'],
            ['Avatar', '头像'],
            ['Badge', '徽章'],
            ['Progress', '进度条'],
            ['Skeleton', '骨架屏'],
            
            // Ant Design
            ['ConfigProvider', '配置提供者'],
            ['Layout', '布局'],
            ['Header', '头部'],
            ['Content', '内容'],
            ['Footer', '底部'],
            ['Sider', '侧边栏'],
            ['Menu', '菜单'],
            ['Breadcrumb', '面包屑'],
            ['Pagination', '分页'],
            ['Steps', '步骤条'],
            ['AutoComplete', '自动完成'],
            ['Cascader', '级联选择'],
            ['DatePicker', '日期选择器'],
            ['InputNumber', '数字输入框'],
            ['Mentions', '提及'],
            ['Rate', '评分'],
            ['TreeSelect', '树选择'],
            ['Upload', '上传'],
            ['Table', '表格'],
            ['Tag', '标签'],
            ['Timeline', '时间轴'],
            ['Tree', '树形控件'],
            ['Alert', '警告提示'],
            ['Drawer', '抽屉'],
            ['Message', '全局提示'],
            ['Modal', '对话框'],
            ['Notification', '通知提醒'],
            ['Popconfirm', '气泡确认框'],
            ['Popover', '气泡卡片'],
            ['Result', '结果'],
            ['Spin', '加载中'],
            ['Anchor', '锚点'],
            ['BackTop', '回到顶部'],
            
            // Styled Components
            ['styled', '样式化组件'],
            ['ThemeProvider', '主题提供者'],
            ['createGlobalStyle', '创建全局样式'],
            ['keyframes', '关键帧'],
            ['css', 'CSS辅助函数'],
            
            // Emotion
            ['css', 'CSS函数'],
            ['jsx', 'JSX编译指示'],
            ['Global', '全局样式'],
            ['ClassNames', '类名组件'],
            ['useTheme', '主题钩子'],
            
            // React Spring
            ['useSpring', '弹簧动画钩子'],
            ['useTransition', '过渡动画钩子'],
            ['useChain', '链式动画钩子'],
            ['useTrail', '轨迹动画钩子'],
            ['animated', '动画组件'],
            ['config', '动画配置'],
            
            // Framer Motion
            ['motion', '动画组件'],
            ['AnimatePresence', '动画存在'],
            ['useAnimation', '动画钩子'],
            ['useMotionValue', '动画值钩子'],
            ['useTransform', '变换钩子'],
            ['useViewportScroll', '视口滚动钩子'],
            
            // React Testing Library
            ['render', '渲染'],
            ['screen', '屏幕'],
            ['fireEvent', '触发事件'],
            ['waitFor', '等待'],
            ['act', '动作'],
            ['cleanup', '清理'],
            
            // Jest
            ['describe', '描述'],
            ['it', '测试用例'],
            ['test', '测试'],
            ['expect', '期望'],
            ['beforeEach', '每次之前'],
            ['afterEach', '每次之后'],
            ['beforeAll', '全部之前'],
            ['afterAll', '全部之后'],
            ['mock', '模拟'],
            ['spy', '间谍'],
            
            // Next.js
            ['getStaticProps', '获取静态属性'],
            ['getStaticPaths', '获取静态路径'],
            ['getServerSideProps', '获取服务端属性'],
            ['useRouter', '路由钩子'],
            ['Head', '头部组件'],
            ['Image', '图片组件'],
            ['Link', '链接组件'],
            ['Script', '脚本组件'],
            
            // React Native
            ['View', '视图'],
            ['Text', '文本'],
            ['ScrollView', '滚动视图'],
            ['FlatList', '平面列表'],
            ['SectionList', '分组列表'],
            ['TouchableOpacity', '触摸透明度'],
            ['TouchableHighlight', '触摸高亮'],
            ['Pressable', '可按压'],
            ['Modal', '模态框'],
            ['Alert', '警告'],
            ['Dimensions', '尺寸'],
            ['Platform', '平台'],
            ['StatusBar', '状态栏'],
            ['SafeAreaView', '安全区域视图']
        ]);
    }

    analyzeReactEcosystem(text: string, fileName: string): {
        routes: ReactRoute[],
        contexts: ReactContext[],
        stores: ReduxStore[],
        forms: ReactForm[],
        apiCalls: APICall[]
    } {
        return {
            routes: this.analyzeRoutes(text),
            contexts: this.analyzeContexts(text),
            stores: this.analyzeReduxStores(text),
            forms: this.analyzeForms(text),
            apiCalls: this.analyzeAPICalls(text)
        };
    }

    private analyzeRoutes(text: string): ReactRoute[] {
        const routes: ReactRoute[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 匹配React Router路由定义
            const routeMatch = line.match(/<Route\s+path=["']([^"']+)["']\s+(?:element={<(\w+)[^>]*>}|component={(\w+)})/);
            if (routeMatch) {
                const path = routeMatch[1];
                const component = routeMatch[2] || routeMatch[3];
                const exact = line.includes('exact');

                routes.push({
                    path,
                    component,
                    exact,
                    line: lineNumber
                });
            }
        }

        return routes;
    }

    private analyzeContexts(text: string): ReactContext[] {
        const contexts: ReactContext[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 匹配Context创建
            const contextMatch = line.match(/const\s+(\w+(?:Context)?)\s*=\s*(?:React\.)?createContext/);
            if (contextMatch) {
                const contextName = contextMatch[1];

                contexts.push({
                    name: contextName,
                    displayName: this.translateIdentifier(contextName),
                    providerProps: this.extractProviderProps(text, contextName),
                    consumerComponents: this.extractConsumerComponents(text, contextName),
                    line: lineNumber
                });
            }
        }

        return contexts;
    }

    private analyzeReduxStores(text: string): ReduxStore[] {
        const stores: ReduxStore[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 匹配Redux slice创建
            const sliceMatch = line.match(/const\s+(\w+)\s*=\s*createSlice\s*\(/);
            if (sliceMatch) {
                const sliceName = sliceMatch[1];

                stores.push({
                    name: sliceName,
                    actions: this.extractReduxActions(text, lineNumber),
                    reducers: this.extractReduxReducers(text, lineNumber),
                    selectors: this.extractReduxSelectors(text, sliceName),
                    line: lineNumber
                });
            }
        }

        return stores;
    }

    private analyzeForms(text: string): ReactForm[] {
        const forms: ReactForm[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 匹配React Hook Form
            const hookFormMatch = line.match(/const\s+\{[^}]*\}\s*=\s*useForm\s*\(/);
            if (hookFormMatch) {
                forms.push({
                    name: 'HookForm',
                    fields: this.extractFormFields(text, lineNumber),
                    validation: this.extractValidationRules(text, lineNumber),
                    onSubmit: this.extractSubmitHandler(text, lineNumber),
                    line: lineNumber
                });
            }

            // 匹配Formik
            const formikMatch = line.match(/<Formik/);
            if (formikMatch) {
                forms.push({
                    name: 'Formik',
                    fields: this.extractFormikFields(text, lineNumber),
                    validation: this.extractFormikValidation(text, lineNumber),
                    onSubmit: this.extractFormikSubmit(text, lineNumber),
                    line: lineNumber
                });
            }
        }

        return forms;
    }

    private analyzeAPICalls(text: string): APICall[] {
        const apiCalls: APICall[] = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 匹配fetch调用
            const fetchMatch = line.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*,?\s*\{[^}]*method:\s*['"`](\w+)['"`]/);
            if (fetchMatch) {
                const endpoint = fetchMatch[1];
                const method = fetchMatch[2].toUpperCase() as any;

                apiCalls.push({
                    name: `fetch_${method}_${endpoint.split('/').pop()}`,
                    method,
                    endpoint,
                    errorHandling: this.hasErrorHandling(text, lineNumber),
                    line: lineNumber
                });
            }

            // 匹配axios调用
            const axiosMatch = line.match(/axios\.(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/);
            if (axiosMatch) {
                const method = axiosMatch[1].toUpperCase() as any;
                const endpoint = axiosMatch[2];

                apiCalls.push({
                    name: `axios_${method}_${endpoint.split('/').pop()}`,
                    method,
                    endpoint,
                    errorHandling: this.hasErrorHandling(text, lineNumber),
                    line: lineNumber
                });
            }

            // 匹配React Query
            const queryMatch = line.match(/useQuery\s*\(\s*\[?['"`]([^'"`]+)['"`]/);
            if (queryMatch) {
                const queryKey = queryMatch[1];

                apiCalls.push({
                    name: `query_${queryKey}`,
                    method: 'GET',
                    endpoint: queryKey,
                    errorHandling: true,
                    line: lineNumber
                });
            }
        }

        return apiCalls;
    }

    // 辅助方法
    private extractProviderProps(text: string, contextName: string): string[] {
        // 提取Provider组件的props
        return [];
    }

    private extractConsumerComponents(text: string, contextName: string): string[] {
        // 提取使用该Context的组件
        return [];
    }

    private extractReduxActions(text: string, startLine: number): ReduxAction[] {
        // 提取Redux actions
        return [];
    }

    private extractReduxReducers(text: string, startLine: number): ReduxReducer[] {
        // 提取Redux reducers
        return [];
    }

    private extractReduxSelectors(text: string, sliceName: string): string[] {
        // 提取Redux selectors
        return [];
    }

    private extractFormFields(text: string, startLine: number): FormField[] {
        // 提取表单字段
        return [];
    }

    private extractValidationRules(text: string, startLine: number): ValidationRule[] {
        // 提取验证规则
        return [];
    }

    private extractSubmitHandler(text: string, startLine: number): string {
        // 提取提交处理器
        return '';
    }

    private extractFormikFields(text: string, startLine: number): FormField[] {
        return [];
    }

    private extractFormikValidation(text: string, startLine: number): ValidationRule[] {
        return [];
    }

    private extractFormikSubmit(text: string, startLine: number): string {
        return '';
    }

    private hasErrorHandling(text: string, lineNumber: number): boolean {
        // 检查是否有错误处理
        const nextFewLines = text.split('\n').slice(lineNumber, lineNumber + 10).join('\n');
        return nextFewLines.includes('catch') || nextFewLines.includes('onError') || nextFewLines.includes('error');
    }

    private translateIdentifier(identifier: string): string {
        return this.reactEcosystemTranslations.get(identifier) || identifier;
    }

    getEcosystemNodeDescription(item: ReactRoute | ReactContext | ReduxStore | ReactForm | APICall): string {
        if ('path' in item) {
            // ReactRoute
            return `路由: ${item.path} → ${item.component}`;
        } else if ('providerProps' in item) {
            // ReactContext
            return `上下文: ${item.consumerComponents.length}个消费者`;
        } else if ('actions' in item) {
            // ReduxStore
            return `状态管理: ${item.actions.length}个动作, ${item.reducers.length}个简化器`;
        } else if ('fields' in item) {
            // ReactForm
            return `表单: ${item.fields.length}个字段, ${item.validation.length}个验证规则`;
        } else {
            // APICall
            return `API调用: ${item.method} ${item.endpoint}`;
        }
    }
}
