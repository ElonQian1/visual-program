import * as path from 'path';
import { SeniorStudentCardData } from './types';

const DEMO_FILE_NAME = 'react-deep-optimization-demo.tsx';

const demoCardData: SeniorStudentCardData = {
    chineseName: 'React数据面板优化示例',
    englishName: 'react-deep-optimization-demo.tsx',
    summary: '这是一个复杂的React组件，实现了数据获取、过滤、排序和分页功能，但存在多个性能问题需要优化。',
    emoji: '⚡',
    tags: ['React', 'TypeScript', '性能优化', 'Hook优化', '数据管理'],
    tabs: [
        {
            id: 'functionality',
            title: '组件功能',
            description: '这个组件实现了完整的数据管理面板功能。',
            points: [
                '使用fetch API从后端获取用户数据列表',
                '提供实时搜索过滤功能，支持按用户名筛选',
                '实现多列排序（按姓名、邮箱、创建时间）',
                '集成分页器组件，支持每页显示数量配置',
                '使用localStorage持久化用户的筛选和排序偏好'
            ]
        },
        {
            id: 'performance_issues',
            title: '性能问题分析',
            description: '代码中存在的性能瓶颈和优化点。',
            points: [
                '多个useEffect缺乏依赖优化，可能导致不必要的重新渲染',
                '每次搜索都会触发完整的数据过滤计算，没有使用防抖',
                '列表渲染时每个item都会重新计算样式和状态',
                '组件没有使用React.memo进行浅比较优化',
                '异步数据加载缺乏错误边界处理'
            ]
        },
        {
            id: 'optimization_techniques',
            title: '优化技术方案',
            description: '针对性能问题的具体优化策略。',
            points: [
                '使用useMemo缓存过滤和排序后的数据结果',
                '使用useCallback包装事件处理函数，避免子组件不必要渲染',
                '引入防抖(debounce)优化搜索输入体验',
                '使用React.lazy和Suspense实现组件懒加载',
                '优化useEffect依赖数组，减少副作用执行频率'
            ]
        },
        {
            id: 'code_structure',
            title: '代码结构建议',
            description: '改善代码可维护性和可读性的建议。',
            points: [
                '将数据获取逻辑抽取为自定义Hook（如useUserData）',
                '将复杂的状态管理迁移到useReducer或状态管理库',
                '拆分大组件为更小的功能组件（搜索栏、列表、分页器）',
                '使用TypeScript严格模式提高类型安全',
                '添加错误边界组件处理运行时异常'
            ]
        }
    ],
    callToAction: '建议重构：先优化Hooks使用，再拆分组件结构，最后添加性能监控。'
};

export function getSeniorStudentCardForFile(filePath: string): SeniorStudentCardData {
    if (path.basename(filePath).toLowerCase() === DEMO_FILE_NAME.toLowerCase()) {
        return demoCardData;
    }

    return {
        chineseName: '代码分析报告',
        englishName: path.basename(filePath),
        summary: '正在分析该文件的技术特征和优化建议，请稍候...',
        emoji: '🔍',
        tags: ['待分析'],
        tabs: [
            {
                id: 'analysis',
                title: '分析中',
                description: '系统正在解析代码结构和技术栈。',
                points: [
                    '识别使用的编程语言和框架',
                    '分析代码复杂度和性能特征', 
                    '检测潜在的优化点和改进建议',
                    '生成针对该文件的专业技术报告'
                ]
            }
        ]
    };
}