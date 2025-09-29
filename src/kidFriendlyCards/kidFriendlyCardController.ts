import * as vscode from 'vscode';
import * as path from 'path';
import { BlueprintVisualEditor } from '../blueprintVisualEditor';
import { KidFriendlyCardData } from './types';
import { getKidFriendlyCardForFile } from './kidFriendlyCardService';

export class KidFriendlyCardController {
    constructor(
        private readonly blueprintEditor: BlueprintVisualEditor,
        private readonly extensionUri: vscode.Uri
    ) {}

    async showDemoCard(): Promise<void> {
        const demoFilePath = path.join(this.extensionUri.fsPath, 'demo', 'react-deep-optimization-demo.tsx');
        await this.showCardForFile(demoFilePath);
    }

    async showCardForFile(filePath: string): Promise<void> {
        const data: KidFriendlyCardData = getKidFriendlyCardForFile(filePath);
        this.blueprintEditor.createOrShow(this.extensionUri);
        await this.blueprintEditor.showKidFriendlyCard(data);
    }
}
