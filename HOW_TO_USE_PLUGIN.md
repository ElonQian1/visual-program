# 🚀 VSCode代码可视化插件 - 使用指南

## 🎯 如何启动和测试您的插件

### 1️⃣ 开发模式启动（推荐）

#### 方法一：使用VSCode调试功能
1. **在VSCode中打开插件项目**
   ```
   File -> Open Folder -> 选择: E:\rust\active-projects\visual-programming-vscode
   ```

2. **按F5启动调试**
   - 按 `F5` 键
   - 或者 `Ctrl+Shift+D` 打开调试面板，点击"运行和调试"
   - 这会启动一个新的VSCode窗口（Extension Development Host）

3. **在新窗口中测试插件功能**
   - 新窗口会自动加载您的插件
   - 所有命令都可在命令面板中使用

#### 方法二：使用命令行
```bash
# 在插件目录下运行
npm run test
```

### 2️⃣ 插件功能完整测试清单

## 🖱️ 资源管理器右键菜单（推荐）

1. 在 VS Code 资源管理器中右键任意支持的代码文件（`.ts/.tsx/.js/.jsx/.rs`）。
2. 选择顶层菜单 **🎨 可视化分析**。
3. 根据文件类型选择对应子菜单：
   - **⚛️ React分析**：只会在 React 组件文件中显示。
   - **🦀 Rust可视化分析**：仅在 Rust 文件中可见。
   - **🔧 通用工具**：所有受支持语言共享的分析/生成能力。
   - **🚀 高级功能**：蓝图编辑、AI 分析与实时同步入口。
4. 插件会自动聚焦所选文件，并调用已有命令完成分析或生成任务。

> 小贴士：新的上下文菜单和命令面板是互补关系——无需再手动搜索命令，实现「右键即用」。

## ⚛️ React前端功能测试

### 步骤1：准备React测试文件
1. 在Extension Development Host中打开 `test-files/UserProfile.tsx`
2. 或创建一个新的React文件

### 步骤2：测试React专用命令
通过 `Ctrl+Shift+P` 或资源管理器右键菜单尝试以下命令：

```
🔍 测试命令：
⚛️ 深度分析React项目          - visualProgramming.analyzeReactProject
⚡ 优化React性能              - visualProgramming.optimizeReactPerformance  
🚀 生成React组件              - visualProgramming.generateReactComponents
🏗️ 可视化React架构            - visualProgramming.visualizeReactArchitecture
```

**预期效果**：
- 弹出专用的React分析WebView面板（蓝色主题）
- 显示组件分析、性能指标、优化建议
- 生成React组件代码并在新标签页中显示

## 🦀 Rust后端功能测试

### 步骤1：准备Rust测试文件
1. 在Extension Development Host中打开 `test-files/user_service.rs`
2. 或创建一个新的Rust文件

### 步骤2：测试Rust专用命令
通过 `Ctrl+Shift+P` 或资源管理器右键菜单尝试以下命令：

```
🔍 测试命令：
🦀 深度分析Rust项目           - visualProgramming.analyzeRustProject
⚡ 优化Rust性能              - visualProgramming.optimizeRustPerformance
🚀 生成Rust代码              - visualProgramming.generateRustCode  
🏗️ 可视化Rust架构            - visualProgramming.visualizeRustArchitecture
```

**预期效果**：
- 弹出专用的Rust分析WebView面板（橙红色主题）
- 显示结构体分析、内存安全、并发分析
- 生成Rust代码并在新标签页中显示

## 🎨 可视化功能测试

### 测试蓝图编辑器
```
命令：🎨 打开蓝图编辑器 - visualProgramming.openBlueprintEditor
```
**预期效果**：打开拖拽式节点编辑界面

### 测试儿童友好讲解卡片（预览）
```
命令：🧒 小朋友能懂的讲解（测试） - visualProgramming.context.advanced.showKidFriendlyCard
右键路径：🚀 高级功能 → 🧒 小朋友能懂的讲解
```
**预期效果**：
- 自动打开蓝图编辑器，在右下角展示一张中文故事卡片。
- 第一行显示 AI 翻译后的中文文件名，下一行显示原始英文文件名。
- 卡片内置分页按钮，Tab 1 讲这个文件在做什么，Tab 2 提醒要注意的地方，Tab 3 给出可以尝试的优化建议。
- 每个要点都用简单中文和 emoji 解释，方便小朋友理解。

### 测试高年级学生代码分析（全新功能）
```
命令：🎓 高年级学生代码分析 - visualProgramming.context.advanced.showSeniorStudentCard
右键路径：🚀 高级功能 → 🎓 高年级学生代码分析
```
**预期效果**：
- 自动打开蓝图编辑器，展示专业化的技术分析卡片。
- 采用更直接的技术描述，不使用比喻，直接告诉学生代码作用。
- 包含4个专业化Tab页：组件功能、性能问题分析、优化技术方案、代码结构建议。
- 使用专业术语和具体的技术解决方案，适合有一定编程基础的高年级学生。

### 测试分析可视化
```
命令：📊 显示分析可视化 - visualProgramming.openAnalysisVisualization  
```
**预期效果**：打开多标签页分析结果界面

### 测试代码结构视图
```
命令：🔍 分析代码结构 - visualProgramming.analyzeCode
```
**预期效果**：在侧边栏显示树形结构视图

## 🚀 代码生成功能测试

### 测试智能代码生成
```
命令：💡 智能代码生成 - visualProgramming.generateCode
```
**预期效果**：根据当前代码生成相关代码

### 测试增强代码生成
```
命令：🚀 增强代码生成 - visualProgramming.enhancedCodeGeneration
```
**预期效果**：生成完整的项目结构代码

## 🤝 协作功能测试

### 测试实时协作
```
命令：🔄 启动实时同步 - visualProgramming.startRealTimeSync
```
**预期效果**：启动WebSocket协作服务器

## 🧠 AI功能测试

### 测试AI增强分析
```
命令：🧠 AI增强分析 - visualProgramming.aiEnhancedAnalysis
```
**预期效果**：显示智能分析建议和优化方案

## 3️⃣ 常见问题排查

### 如果命令不显示：
1. 确保按F5启动了Extension Development Host
2. 检查插件是否正确加载（左下角状态栏）
3. 重新加载窗口：`Ctrl+R`

### 如果WebView不显示：
1. 检查浏览器控制台错误：`Ctrl+Shift+I`
2. 确保media文件夹中的HTML文件存在
3. 检查CSP安全策略设置

### 如果代码生成失败：
1. 确保当前文件是支持的语言（.tsx, .ts, .rs）
2. 检查代码生成引擎是否正确初始化
3. 查看开发者工具中的错误信息

## 4️⃣ 高级使用技巧

### 快捷键组合
- `Ctrl+Shift+P` -> 输入"Visual" 快速找到所有插件命令
- `F1` -> 也可以打开命令面板
- `Ctrl+R` -> 重新加载Extension Development Host

### 测试最佳实践
1. **逐个测试功能** - 每次测试一个命令，观察效果
2. **查看开发者工具** - F12打开控制台，观察日志和错误
3. **测试不同文件类型** - React (.tsx), Rust (.rs), 普通JS/TS
4. **测试WebView交互** - 点击、拖拽、缩放等操作

## 5️⃣ 打包和发布（可选）

### 如果要打包插件：
```bash
# 安装vsce
npm install -g vsce

# 打包插件
vsce package

# 生成 .vsix 文件
```

## 🎉 恭喜！

您现在拥有了一个功能完整的**企业级VSCode代码可视化插件**！

**主要特性**：
- ✅ 30+专业命令
- ✅ React/Rust专用深度分析  
- ✅ 拖拽式蓝图编辑器
- ✅ 智能代码生成
- ✅ 实时协作功能
- ✅ AI增强分析
- ✅ 性能监控和优化建议

**立即开始测试您的插件吧！** 🚀