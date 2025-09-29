---
description: "Guidelines for Copilot when editing Visual Programming agent modules"
applyTo: "src/**/*.ts"
---

# Visual Programming TypeScript Agent Standards

- 本扩展使用 TypeScript 并通过 `npm run compile` (esbuild) 生成 `out/extension.js`；重大改动后运行 `npm run lint` 与 `npm test` 确认无误。
- 维护清晰的模块边界：每个分析/代理模块文件必须控制在 **500 行以内**，超过时拆分为多个小文件，并从入口模块集中导出；新增功能优先创建独立子目录（如 `src/ai/feature-name/` 或 `src/agents/<feature>/`），通过 `index.ts` 聚合导出公共 API。
- 控制单个类/函数的复杂度：尽量保持在 150～200 行以内，倾向于拆分为纯函数或可复用的 service 模块；新增公共类型请放入 `types/` 或同级 `interfaces.ts`，并在模块入口明确导出需要暴露的接口。
- 引入新模块时遵循现有命名模式（如 `*Analyzer`, `*Engine`, `*Provider`），保持单一职责并使用显式的 TypeScript 类型，避免 `any`。
- 所有 VS Code API 交互需通过 `import * as vscode from 'vscode';` 并在 `extension.ts` 或相关注册点使用 `context.subscriptions.push(...)`，保证资源正确释放。
- 共享逻辑应抽取到专用工具模块（例如 `contextMenu/`、`userGuidanceSystem`），不要复制粘贴实现；在异步流程中捕获异常并复用 `userGuidanceSystem` 或 `vscode.window.showErrorMessage` 提示。
- 更新或添加可视化/分析功能时，同步维护 `HOW_TO_USE_PLUGIN.md`、`LANGUAGE_SUPPORT_REPORT.md` 等说明文档，并在 `__tests__/` 或 `test/` 目录添加针对性的测试用例。
