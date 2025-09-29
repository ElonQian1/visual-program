// 高年级学生代码分析卡片的数据接口定义
export interface SeniorStudentCardTab {
    id: string;
    title: string;
    description: string;
    points: string[];
}

export interface SeniorStudentCardData {
    chineseName: string;
    englishName: string;
    summary: string;
    emoji: string;
    tags: string[];
    tabs: SeniorStudentCardTab[];
    callToAction?: string;
}