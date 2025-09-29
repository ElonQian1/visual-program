// 🔥 用户引导和教程系统
import * as vscode from 'vscode';

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    command?: string;
    expectedResult?: string;
    hints?: string[];
    validation?: () => Promise<boolean>;
    nextStep?: string;
}

export interface Tutorial {
    id: string;
    name: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: string;
    prerequisites?: string[];
    steps: TutorialStep[];
}

export class UserGuidanceSystem {
    private static instance: UserGuidanceSystem;
    private currentTutorial?: { tutorial: Tutorial; currentStepIndex: number };
    private completedTutorials: Set<string> = new Set();
    private userProgress: Map<string, any> = new Map();

    // 内置教程定义
    private tutorials: Tutorial[] = [
        {
            id: 'getting-started',
            name: '🚀 快速入门',
            description: '了解Visual Programming Extension的基本功能',
            difficulty: 'beginner',
            estimatedTime: '5-10分钟',
            steps: [
                {
                    id: 'welcome',
                    title: '欢迎使用Visual Programming Extension',
                    description: '这个扩展可以将React和Rust代码转换为可视化工作流。让我们开始吧！',
                    nextStep: 'open-file'
                },
                {
                    id: 'open-file',
                    title: '打开代码文件',
                    description: '首先，请打开一个TypeScript、JavaScript或Rust文件进行分析。',
                    hints: [
                        '支持的文件类型: .ts, .tsx, .js, .jsx, .rs',
                        '可以打开现有项目或创建新文件',
                        '演示文件位于 demo/ 目录中'
                    ],
                    validation: async () => {
                        const activeEditor = vscode.window.activeTextEditor;
                        return activeEditor != null && 
                               ['typescript', 'javascript', 'rust', 'typescriptreact', 'javascriptreact'].includes(activeEditor.document.languageId);
                    },
                    nextStep: 'analyze-code'
                },
                {
                    id: 'analyze-code',
                    title: '分析代码结构',
                    description: '使用代码分析功能来解析文件结构。',
                    command: 'visualProgramming.analyzeCode',
                    expectedResult: '应该看到代码结构分析完成的通知',
                    nextStep: 'open-visual-view'
                },
                {
                    id: 'open-visual-view',
                    title: '打开可视化视图',
                    description: '现在让我们查看代码的可视化表示。',
                    command: 'visualProgramming.openVisualView',
                    expectedResult: '可视化面板应该在右侧打开，显示代码的图形化表示',
                    nextStep: 'explore-features'
                },
                {
                    id: 'explore-features',
                    title: '探索更多功能',
                    description: '尝试使用其他功能，如项目诊断、智能优化等。',
                    hints: [
                        '使用 Ctrl+Shift+P 打开命令面板',
                        '搜索 "visual programming" 查看所有可用命令',
                        '查看左侧的代码结构树视图'
                    ],
                    nextStep: 'completion'
                },
                {
                    id: 'completion',
                    title: '🎉 教程完成！',
                    description: '恭喜！您已经掌握了基本操作。接下来可以探索高级功能或查看其他教程。'
                }
            ]
        },
        {
            id: 'advanced-analysis',
            name: '🔍 高级代码分析',
            description: '深入了解代码分析和架构识别功能',
            difficulty: 'intermediate',
            estimatedTime: '10-15分钟',
            prerequisites: ['getting-started'],
            steps: [
                {
                    id: 'project-diagnostics',
                    title: '运行项目诊断',
                    description: '使用项目诊断功能全面分析您的项目健康度。',
                    command: 'visualProgramming.runProjectDiagnostics',
                    expectedResult: '生成详细的项目诊断报告',
                    nextStep: 'architecture-analysis'
                },
                {
                    id: 'architecture-analysis',
                    title: '架构模式分析',
                    description: '了解如何识别和分析代码中的架构模式。',
                    hints: [
                        'React: 组件模式、Hook模式、状态管理模式',
                        'Rust: 所有权模式、并发模式、错误处理模式',
                        '在可视化面板中查看模式标识'
                    ],
                    nextStep: 'performance-analysis'
                },
                {
                    id: 'performance-analysis',
                    title: '性能分析',
                    description: '学习如何识别性能瓶颈和优化机会。',
                    command: 'visualProgramming.openCodeOptimizer',
                    expectedResult: '打开智能代码优化面板',
                    nextStep: 'completion'
                },
                {
                    id: 'completion',
                    title: '🎓 高级分析掌握！',
                    description: '您现在可以熟练使用高级分析功能了。'
                }
            ]
        },
        {
            id: 'collaboration-features',
            name: '🤝 协作功能',
            description: '学习如何使用实时协作和团队功能',
            difficulty: 'advanced',
            estimatedTime: '15-20分钟',
            prerequisites: ['getting-started', 'advanced-analysis'],
            steps: [
                {
                    id: 'start-collaboration',
                    title: '启动实时监控',
                    description: '开启实时文件监控和协作功能。',
                    command: 'visualProgramming.startRealtimeMonitoring',
                    expectedResult: '实时监控开始工作',
                    nextStep: 'interactive-canvas'
                },
                {
                    id: 'interactive-canvas',
                    title: '使用交互式画布',
                    description: '在交互式画布中创建和编辑代码流程图。',
                    command: 'visualProgramming.openInteractiveCanvas',
                    hints: [
                        '可以拖拽节点重新排列',
                        '点击节点查看详细信息',
                        '使用连线显示依赖关系'
                    ],
                    nextStep: 'code-generation'
                },
                {
                    id: 'code-generation',
                    title: '代码生成',
                    description: '基于可视化图表生成代码。',
                    command: 'visualProgramming.generateCode',
                    expectedResult: '生成的代码在新标签页中显示',
                    nextStep: 'completion'
                },
                {
                    id: 'completion',
                    title: '🌟 协作专家！',
                    description: '您已经掌握了所有协作功能，可以与团队高效协作了。'
                }
            ]
        }
    ];

    public static getInstance(): UserGuidanceSystem {
        if (!UserGuidanceSystem.instance) {
            UserGuidanceSystem.instance = new UserGuidanceSystem();
        }
        return UserGuidanceSystem.instance;
    }

    // 显示欢迎向导
    public async showWelcomeWizard(): Promise<void> {
        const isFirstTime = !this.userProgress.has('welcomed') || this.completedTutorials.size === 0;
        
        if (!isFirstTime) {
            return;
        }

        const action = await vscode.window.showInformationMessage(
            '🎉 欢迎使用Visual Programming Extension！这是您第一次使用，需要进行快速导览吗？',
            '开始导览',
            '稍后提醒',
            '不再显示'
        );

        switch (action) {
            case '开始导览':
                await this.startTutorial('getting-started');
                break;
            case '稍后提醒':
                // 设置30分钟后提醒
                setTimeout(() => this.showWelcomeWizard(), 30 * 60 * 1000);
                break;
            case '不再显示':
                this.userProgress.set('welcomed', true);
                break;
        }
    }

    // 显示教程列表
    public async showTutorialList(): Promise<void> {
        const availableTutorials = this.tutorials.filter(tutorial => 
            this.arePrerequisitesMet(tutorial)
        );

        const items = availableTutorials.map(tutorial => ({
            label: `${this.completedTutorials.has(tutorial.id) ? '✅' : '📚'} ${tutorial.name}`,
            description: tutorial.description,
            detail: `难度: ${tutorial.difficulty} | 时长: ${tutorial.estimatedTime}`,
            tutorial
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '选择要开始的教程',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            await this.startTutorial(selected.tutorial.id);
        }
    }

    // 开始教程
    public async startTutorial(tutorialId: string): Promise<void> {
        const tutorial = this.tutorials.find(t => t.id === tutorialId);
        if (!tutorial) {
            vscode.window.showErrorMessage(`找不到教程: ${tutorialId}`);
            return;
        }

        if (!this.arePrerequisitesMet(tutorial)) {
            const missing = tutorial.prerequisites?.filter(prereq => !this.completedTutorials.has(prereq)) || [];
            vscode.window.showWarningMessage(
                `此教程需要先完成: ${missing.join(', ')}`,
                '查看教程列表'
            ).then(action => {
                if (action === '查看教程列表') {
                    this.showTutorialList();
                }
            });
            return;
        }

        this.currentTutorial = { tutorial, currentStepIndex: 0 };
        await this.showCurrentStep();
    }

    // 显示当前步骤
    private async showCurrentStep(): Promise<void> {
        if (!this.currentTutorial) {return;}

        const { tutorial, currentStepIndex } = this.currentTutorial;
        const step = tutorial.steps[currentStepIndex];
        
        if (!step) {
            await this.completeTutorial();
            return;
        }

        // 创建教程面板内容
        const content = this.createStepContent(tutorial, step, currentStepIndex);
        
        // 显示教程面板
        const panel = vscode.window.createWebviewPanel(
            'tutorialStep',
            `📚 ${tutorial.name} - ${step.title}`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = content;

        // 处理来自面板的消息
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'next':
                    await this.nextStep();
                    panel.dispose();
                    break;
                case 'previous':
                    await this.previousStep();
                    panel.dispose();
                    break;
                case 'execute':
                    if (step.command) {
                        await vscode.commands.executeCommand(step.command);
                    }
                    break;
                case 'validate':
                    if (step.validation) {
                        const isValid = await step.validation();
                        panel.webview.postMessage({ command: 'validationResult', result: isValid });
                    }
                    break;
                case 'skip':
                    await this.skipTutorial();
                    panel.dispose();
                    break;
            }
        });
    }

    // 创建步骤内容
    private createStepContent(tutorial: Tutorial, step: TutorialStep, stepIndex: number): string {
        const totalSteps = tutorial.steps.length;
        const progress = Math.round((stepIndex / (totalSteps - 1)) * 100);

        return `<!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${step.title}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    margin: 0;
                    line-height: 1.6;
                }
                
                .tutorial-header {
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                
                .tutorial-title {
                    font-size: 24px;
                    font-weight: 600;
                    margin: 0 0 8px 0;
                    color: var(--vscode-titleBar-activeForeground);
                }
                
                .tutorial-meta {
                    color: var(--vscode-descriptionForeground);
                    font-size: 14px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: var(--vscode-progressBar-background);
                    border-radius: 4px;
                    margin: 16px 0;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: var(--vscode-progressBar-background);
                    background: linear-gradient(90deg, var(--vscode-charts-blue), var(--vscode-charts-green));
                    width: ${progress}%;
                    transition: width 0.3s ease;
                }
                
                .step-content {
                    margin: 24px 0;
                }
                
                .step-description {
                    font-size: 16px;
                    margin-bottom: 16px;
                }
                
                .hints {
                    background: var(--vscode-textBlockQuote-background);
                    border-left: 4px solid var(--vscode-charts-yellow);
                    padding: 12px 16px;
                    margin: 16px 0;
                    border-radius: 4px;
                }
                
                .hints-title {
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--vscode-charts-yellow);
                }
                
                .hints ul {
                    margin: 0;
                    padding-left: 16px;
                }
                
                .expected-result {
                    background: var(--vscode-textBlockQuote-background);
                    border-left: 4px solid var(--vscode-charts-green);
                    padding: 12px 16px;
                    margin: 16px 0;
                    border-radius: 4px;
                }
                
                .actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .btn-primary {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                
                .btn-primary:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .btn-secondary {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .btn-secondary:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                
                .validation-status {
                    margin: 16px 0;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-weight: 500;
                    display: none;
                }
                
                .validation-success {
                    background: var(--vscode-inputValidation-infoBackground);
                    border: 1px solid var(--vscode-inputValidation-infoBorder);
                    color: var(--vscode-charts-green);
                }
                
                .validation-pending {
                    background: var(--vscode-inputValidation-warningBackground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                    color: var(--vscode-charts-yellow);
                }
            </style>
        </head>
        <body>
            <div class="tutorial-header">
                <h1 class="tutorial-title">${step.title}</h1>
                <div class="tutorial-meta">
                    第 ${stepIndex + 1} 步，共 ${totalSteps} 步 | ${tutorial.name}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
            
            <div class="step-content">
                <div class="step-description">
                    ${step.description}
                </div>
                
                ${step.hints ? `
                <div class="hints">
                    <div class="hints-title">💡 提示</div>
                    <ul>
                        ${step.hints.map(hint => `<li>${hint}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${step.expectedResult ? `
                <div class="expected-result">
                    <strong>🎯 预期结果:</strong> ${step.expectedResult}
                </div>
                ` : ''}
                
                <div class="validation-status" id="validationStatus"></div>
                
                <div class="actions">
                    ${step.command ? `
                        <button class="btn btn-primary" onclick="executeCommand()">
                            ▶️ 执行操作
                        </button>
                    ` : ''}
                    
                    ${step.validation ? `
                        <button class="btn btn-secondary" onclick="validateStep()">
                            ✓ 验证完成
                        </button>
                    ` : ''}
                    
                    ${stepIndex > 0 ? `
                        <button class="btn btn-secondary" onclick="previousStep()">
                            ← 上一步
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-primary" onclick="nextStep()" ${step.validation ? 'disabled id="nextBtn"' : ''}>
                        ${stepIndex === totalSteps - 1 ? '🎉 完成教程' : '下一步 →'}
                    </button>
                    
                    <button class="btn btn-secondary" onclick="skipTutorial()">
                        跳过教程
                    </button>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function executeCommand() {
                    vscode.postMessage({ command: 'execute' });
                }
                
                function validateStep() {
                    const status = document.getElementById('validationStatus');
                    status.style.display = 'block';
                    status.className = 'validation-status validation-pending';
                    status.textContent = '⏳ 正在验证...';
                    
                    vscode.postMessage({ command: 'validate' });
                }
                
                function nextStep() {
                    vscode.postMessage({ command: 'next' });
                }
                
                function previousStep() {
                    vscode.postMessage({ command: 'previous' });
                }
                
                function skipTutorial() {
                    vscode.postMessage({ command: 'skip' });
                }
                
                // 监听验证结果
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'validationResult') {
                        const status = document.getElementById('validationStatus');
                        const nextBtn = document.getElementById('nextBtn');
                        
                        if (message.result) {
                            status.className = 'validation-status validation-success';
                            status.textContent = '✅ 验证通过！可以继续下一步。';
                            if (nextBtn) {
                                nextBtn.disabled = false;
                            }
                        } else {
                            status.className = 'validation-status validation-pending';
                            status.textContent = '❌ 验证未通过，请检查操作是否正确完成。';
                        }
                    }
                });
            </script>
        </body>
        </html>`;
    }

    // 下一步
    private async nextStep(): Promise<void> {
        if (!this.currentTutorial) {return;}

        this.currentTutorial.currentStepIndex++;
        await this.showCurrentStep();
    }

    // 上一步
    private async previousStep(): Promise<void> {
        if (!this.currentTutorial) {return;}

        if (this.currentTutorial.currentStepIndex > 0) {
            this.currentTutorial.currentStepIndex--;
            await this.showCurrentStep();
        }
    }

    // 完成教程
    private async completeTutorial(): Promise<void> {
        if (!this.currentTutorial) {return;}

        const tutorial = this.currentTutorial.tutorial;
        this.completedTutorials.add(tutorial.id);
        this.currentTutorial = undefined;

        const nextTutorials = this.tutorials.filter(t => 
            !this.completedTutorials.has(t.id) && this.arePrerequisitesMet(t)
        );

        let message = `🎉 恭喜完成"${tutorial.name}"教程！`;
        const actions: string[] = [];

        if (nextTutorials.length > 0) {
            message += ` 还有 ${nextTutorials.length} 个教程可以继续学习。`;
            actions.push('查看更多教程');
        }

        actions.push('关闭');

        const action = await vscode.window.showInformationMessage(message, ...actions);

        if (action === '查看更多教程') {
            await this.showTutorialList();
        }
    }

    // 跳过教程
    private async skipTutorial(): Promise<void> {
        const action = await vscode.window.showWarningMessage(
            '确定要跳过当前教程吗？您可以稍后重新开始。',
            '跳过',
            '继续教程'
        );

        if (action === '跳过') {
            this.currentTutorial = undefined;
            vscode.window.showInformationMessage('教程已跳过。您可以随时从命令面板重新开始。');
        }
    }

    // 检查先决条件
    private arePrerequisitesMet(tutorial: Tutorial): boolean {
        if (!tutorial.prerequisites) {return true;}
        return tutorial.prerequisites.every(prereq => this.completedTutorials.has(prereq));
    }

    // 显示上下文帮助
    public async showContextualHelp(context: string): Promise<void> {
        const helpContent = this.getContextualHelpContent(context);
        
        if (!helpContent) {
            vscode.window.showInformationMessage('该功能的帮助文档正在完善中。');
            return;
        }

        const doc = await vscode.workspace.openTextDocument({
            content: helpContent,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }

    // 获取上下文帮助内容
    private getContextualHelpContent(context: string): string | undefined {
        const helpTexts: Record<string, string> = {
            'code-analysis': `# 📊 代码分析帮助

## 功能说明
代码分析功能可以解析TypeScript、JavaScript和Rust文件，提取：
- 函数和方法
- 类和结构体
- 导入导出关系
- 复杂度指标

## 使用方法
1. 打开要分析的代码文件
2. Ctrl+Shift+P 打开命令面板
3. 输入"分析代码结构"并回车
4. 查看左侧树形视图中的结果

## 支持的语言特性
### React/TypeScript
- 函数组件和类组件
- Hook使用情况
- JSX结构
- Context和Redux

### Rust
- 结构体和枚举
- 特征实现
- 模块结构
- 所有权模式`,

            'visualization': `# 🎨 可视化视图帮助

## 功能说明
可视化视图将代码结构转换为直观的图形界面，类似虚幻引擎的蓝图系统。

## 界面元素
- **蓝色节点**: React组件
- **橙色节点**: Rust结构体
- **绿色节点**: 函数/方法
- **连线**: 依赖关系

## 交互操作
- **拖拽**: 重新排列节点
- **点击**: 查看详细信息
- **双击**: 跳转到源代码
- **右键**: 显示上下文菜单

## 优化建议
- 大型项目可能需要等待几秒钟渲染
- 使用搜索框快速定位节点
- 调整缩放级别获得最佳视图`,

            'diagnostics': `# 🏥 项目诊断帮助

## 功能说明
项目诊断提供项目健康度的全面评估，包括：
- 功能完整性分析
- 架构质量评估
- 性能优化建议
- 安全隐患检测

## 诊断报告内容
### 健康度评分 (0-100)
- 85-100: 优秀 🟢
- 70-84: 良好 🟡
- 60-69: 需改进 🟠
- <60: 需要重构 🔴

### 功能缺口分析
- 缺失的核心功能
- 不完整的实现
- 架构改进机会

### 优化建议
- 按优先级排序
- 具体实施步骤
- 预期收益评估

## 使用建议
- 定期运行诊断（每周一次）
- 优先解决高优先级问题
- 跟踪改进进度`
        };

        return helpTexts[context];
    }

    // 重置教程进度
    public resetProgress(): void {
        this.completedTutorials.clear();
        this.userProgress.clear();
        this.currentTutorial = undefined;
        vscode.window.showInformationMessage('📚 教程进度已重置，您可以重新开始所有教程。');
    }

    // 获取用户进度
    public getUserProgress(): { completedTutorials: string[]; currentTutorial?: string } {
        return {
            completedTutorials: Array.from(this.completedTutorials),
            currentTutorial: this.currentTutorial?.tutorial.id
        };
    }
}

// 导出便捷函数
export function showWelcomeWizard(): Promise<void> {
    return UserGuidanceSystem.getInstance().showWelcomeWizard();
}

export function showTutorialList(): Promise<void> {
    return UserGuidanceSystem.getInstance().showTutorialList();
}

export function showContextualHelp(context: string): Promise<void> {
    return UserGuidanceSystem.getInstance().showContextualHelp(context);
}
