import * as vscode from 'vscode';

/**
 * 尝试根据资源 URI 打开文件并聚焦编辑器，以便复用依赖于活动编辑器的命令。
 * @returns 返回是否成功准备好文档。
 */
export async function ensureDocumentVisible(resource?: vscode.Uri): Promise<boolean> {
    if (!resource) {
        return true;
    }

    try {
        const document = await vscode.workspace.openTextDocument(resource);
        const activeDocument = vscode.window.activeTextEditor?.document;

        if (!activeDocument || activeDocument.uri.toString() !== document.uri.toString()) {
            await vscode.window.showTextDocument(document, { preview: true });
        }

        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`无法打开所选文件：${message}`);
        return false;
    }
}

/**
 * 针对上下文菜单命令的通用执行器，会在需要时先打开目标文件。
 */
export async function runWithDocumentContext(commandId: string, resource?: vscode.Uri): Promise<void> {
    const ready = await ensureDocumentVisible(resource);
    if (!ready) {
        return;
    }

    await vscode.commands.executeCommand(commandId);
}
