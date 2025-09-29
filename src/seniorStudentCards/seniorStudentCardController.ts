import { getSeniorStudentCardForFile } from './seniorStudentCardService';
import { SeniorStudentCardData } from './types';

export class SeniorStudentCardController {
    private blueprintEditor: any;

    constructor(blueprintEditor: any) {
        this.blueprintEditor = blueprintEditor;
    }

    // 显示demo卡片
    async showDemoCard(): Promise<void> {
        const demoPath = 'react-deep-optimization-demo.tsx';
        const cardData = getSeniorStudentCardForFile(demoPath);
        await this.blueprintEditor.showSeniorStudentCard(cardData);
    }

    // 为指定文件显示高年级卡片
    async showCardForFile(filePath: string): Promise<void> {
        const cardData = getSeniorStudentCardForFile(filePath);
        await this.blueprintEditor.showSeniorStudentCard(cardData);
    }
}