import * as path from 'path';
import { KidFriendlyCardData } from './types';

const DEMO_FILE_NAME = 'react-deep-optimization-demo.tsx';

const demoCardData: KidFriendlyCardData = {
    chineseName: '数据魔法控制台',
    englishName: 'react-deep-optimization-demo.tsx',
    summary: '这个文件做了一个“帮忙整理数据的大面板”，会从网络抓数据、筛选、排序，还会把结果分成一页一页给你看。',
    emoji: '🧙‍♀️',
    tags: ['React', '数据面板', '性能优化示例', '新手友好'],
    tabs: [
        {
            id: 'story',
            title: '它在做什么？',
            description: '像一个小魔法师，帮你从大箱子里挑出想要的玩具。',
            points: [
                '会去服务器拿最新的数据回来。',
                '帮你按照名字、时间或重要程度排好顺序。',
                '把结果一页一页展示，方便慢慢看。',
                '记住你喜欢的选项和设置，下次还给你。'
            ]
        },
        {
            id: 'watchout',
            title: '哪里需要注意？',
            description: '这些地方有点忙，需要老师来帮忙优化。',
            points: [
                '同时做了好多网络请求，像排队买门票一样慢。',
                '用很多 useEffect，如果不整理会乱糟糟。',
                '渲染列表时每个物品都临时算分数，CPU 会累。',
                '每次输入筛选条件都会重新算很多东西，可能卡顿。'
            ]
        },
        {
            id: 'ideas',
            title: '可以怎么改进？',
            description: '这是我们的小改进计划。',
            points: [
                '把网络请求分组，同时发出去，让小朋友不用久等。',
                '把重复的 useEffect 合起来，就像整理书包。',
                '用 useCallback、React.lazy 这类“省力工具”减少重复劳动。',
                '把大计算放到背景里做，或提前存到缓存里。'
            ]
        }
    ],
    callToAction: '试着告诉电脑：先整理数据，再把界面拆成更小的乐高块。'
};

export function getKidFriendlyCardForFile(filePath: string): KidFriendlyCardData {
    if (path.basename(filePath).toLowerCase() === DEMO_FILE_NAME.toLowerCase()) {
        return demoCardData;
    }

    return {
        chineseName: '小小代码故事卡片',
        englishName: path.basename(filePath),
        summary: '这个文件的故事还在收集中，请稍等一下，我们会尽快准备中文讲解~',
        emoji: '📚',
        tags: ['故事筹备中'],
        tabs: [
            {
                id: 'pending',
                title: '敬请期待',
                description: '未来这里会出现针对这个文件的可爱讲解。',
                points: [
                    '我们会告诉你这个文件的中文名字。',
                    '还会介绍它在做什么事情。',
                    '并列出简单的改进建议。'
                ]
            }
        ]
    };
}
