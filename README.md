# 代码可视化编程 VSCode 插件

一个将 React 和 Rust 代码转换为中文可视化工作流的 VSCode 插件，类似于虚幻引擎的蓝图系统。

## 功能特性

### ✅ 第一阶段 - 基础架构
- [x] VSCode 插件项目结构
- [x] **增强版代码解析引擎**
  - [x] React全栈分析（组件、路由、状态管理、表单、API调用）
  - [x] Rust生态分析（Web框架、数据库、异步任务、错误处理、测试）
  - [x] TypeScript/JavaScript支持
- [x] **智能中文翻译系统**
  - [x] 300+ 编程术语翻译
  - [x] React专用术语（useState→状态钩子、useEffect→副作用钩子）
  - [x] Rust专用术语（struct→结构体、trait→特征、impl→实现）
- [x] **增强版树状结构视图**
  - [x] React组件分层显示
  - [x] Rust类型系统展示
  - [x] 智能图标和颜色编码
- [x] **专业可视化工作流面板**
  - [x] React组件节点（蓝色主题）
  - [x] Rust类型节点（橙/红色主题）
  - [x] 拖拽操作和点击跳转

### ✅ 第二阶段 - 高级分析 🆕
- [x] **React高级架构分析**
  - [x] 🏗️ 架构模式识别（HOC、Render Props、Context、复合组件等6种模式）
  - [x] 🌳 组件层次结构分析（父子关系、Props流向、Context依赖）
  - [x] 📊 状态管理分析（Redux、Zustand、Recoil、Context支持）
  - [x] ⚡ 性能优化检测（memo、useMemo、useCallback、懒加载）
  - [x] 📦 代码分割分析（动态导入、路由分割）
- [x] **Rust高级架构分析**
  - [x] 🏛️ 架构模式识别（Actor、Repository、Command、Observer等6种模式）
  - [x] ⚙️ 系统设计分析（微服务、事件驱动、CQRS、六边形架构）
  - [x] 🌐 分布式系统分析（Raft共识、数据复制、分片、分布式缓存）
  - [x] 💾 资源管理优化（内存、CPU、I/O、网络优化检测）
- [x] **企业级微服务支持**
  - [x] 🏗️ 微服务架构检测（服务发现、API网关、配置中心）
  - [x] 🗄️ 数据库优化分析（查询性能、N+1问题、连接池优化）
  - [x] ⚡ 并发优化分析（线程池、并行化机会、锁优化）
  - [x] 🔒 安全模式分析（认证、授权、加密、漏洞检测）

### 🚧 开发中
- [ ] 高级 AST 解析（TypeScript Compiler API + tree-sitter）
- [ ] 拖拽操作和节点连接
- [ ] 代码生成和反向映射
- [ ] 离线AI翻译模型集成

### 📋 待开发
- [ ] 蓝图式可视化编辑器
- [ ] 实时代码同步
- [ ] 项目级别分析
- [ ] 导出功能

## 安装要求

- Node.js 16.x 或更高版本
- VSCode 1.74.0 或更高版本

## 快速开始

### 方法一：自动设置（推荐）
1. 双击运行 `quick-start.bat`
2. 等待自动安装完成
3. 按F5启动插件调试

### 方法二：手动设置
1. 确保安装了 Node.js 16.x+
2. 安装依赖：
```bash
npm install
```

3. 编译项目：
```bash
npm run compile
```

4. 在 VSCode 中按 F5 启动调试模式

5. 在新窗口中打开包含 React 或 Rust 代码的项目

6. 右键点击代码文件，选择 **"分析代码结构"**

7. 使用命令面板 (Ctrl+Shift+P) 运行 **"打开可视化视图"**

### 测试示例
项目包含了完整的示例代码：

#### 基础示例
- `demo/UserManager.tsx` - React用户管理组件
- `demo/user_manager.rs` - Rust用户管理模块

#### 高级架构示例 🆕
- `demo/react-architecture-demo.tsx` - React架构模式演示
- `demo/rust-architecture-demo.rs` - Rust架构模式演示
- `demo/advanced-react-enterprise-demo.tsx` - React企业级应用演示
- `demo/advanced-rust-microservice-demo.rs` - Rust微服务架构演示

#### 快速测试脚本
- `quick-start.bat` - 一键安装和启动
- `test-microservices.bat` - 微服务功能测试
- `test-architecture.bat` - 架构分析功能测试 🆕

可以用这些文件快速测试插件的各种功能！

## 使用方法

### 支持的语言和特性

#### React/TypeScript 前端
- **组件分析**：自动识别函数式组件和类组件
- **Hooks检测**：useState, useEffect, useContext等30+种hooks
- **Props分析**：组件属性和默认值提取
- **JSX元素**：标签、属性、嵌套关系分析
- **事件处理**：onClick, onChange等事件处理器识别
- **路由支持**：React Router hooks和组件
- **状态管理**：Redux, Context API等模式识别

#### Rust 后端
- **结构体分析**：字段、可见性、派生特征
- **枚举分析**：变体、判别值、模式匹配
- **特征系统**：trait定义、关联类型、方法签名
- **实现块**：impl块、方法实现、泛型参数
- **函数分析**：参数、返回类型、异步/不安全标记
- **模块系统**：mod声明、use语句、可见性控制
- **Web框架**：Actix-web, Axum, Warp等框架支持
- **数据库**：Diesel, SQLx等ORM模式识别

#### 智能翻译特性
- **React术语**：
  ```
  useState → 状态钩子
  useEffect → 副作用钩子
  useCallback → 回调钩子
  Component → 组件类
  props → 属性
  onClick → 点击事件
  ```

- **Rust术语**：
  ```
  fn → 函数
  struct → 结构体
  enum → 枚举
  trait → 特征
  impl → 实现
  Result<T, E> → 结果类型
  Option<T> → 选项类型
  Vec<T> → 向量
  ```

### 主要功能

#### 1. 基础代码分析
- **结构识别**: 自动识别函数、类、结构体、导入等
- **智能翻译**: 编程术语中文化显示
- **位置信息**: 精确的代码位置和行号

#### 2. React深度分析 🔥
- **组件分析**: 函数式/类组件识别，Hook使用检测
- **生态系统**: 路由、Context、Redux、表单、API分析
- **架构模式**: MVC、Redux、Context-Reducer等模式识别
- **性能诊断**: 内存泄漏、渲染问题、性能瓶颈检测
- **优化建议**: 具体的性能优化和最佳实践建议

#### 3. Rust深度分析 🔥
- **类型系统**: 结构体、枚举、特征、生命周期分析
- **异步编程**: async/await模式、并发安全分析
- **生态系统**: Web框架、数据库、宏系统集成分析
- **性能分析**: 内存使用、并发优化、系统性能评估
- **架构模式**: 微服务、系统架构模式识别

#### 4. 可视化工作流
- **拖拽节点**: 支持节点拖拽和重新布局
- **智能跳转**: 点击节点直接跳转到源代码位置
- **分层显示**: 基础结构和高级分析结果分层展示
- **性能标记**: 性能问题和架构模式可视化标识

#### 5. 中文翻译系统
内置编程术语翻译，包括：
- **React**: useState → 使用状态, useEffect → 使用副作用, useContext → 使用上下文
- **Rust**: fn → 函数, struct → 结构体, impl → 实现, trait → 特征
- **通用**: function → 函数, class → 类, interface → 接口

## 开发路线图

### 第二阶段：高级解析（2-3周）
- 集成 TypeScript Compiler API
- 添加 tree-sitter-rust 解析器
- 实现完整的 AST 分析
- 支持复杂代码结构

### 第三阶段：翻译增强（1-2周）
- 集成本地 AI 翻译模型
- 上下文感知翻译
- 自定义术语词典
- 翻译质量优化

### 第四阶段：可视化编辑器（3-4周）
- 类似虚幻蓝图的拖拽编辑器
- 节点连接和数据流
- 代码生成和实时同步
- 项目级别可视化

## 技术架构

```
src/
├── extension.ts           # 插件主入口
├── codeAnalyzer.ts       # 代码解析引擎
├── codeStructureProvider.ts # 树视图提供者
├── visualPanelProvider.ts   # 可视化面板
└── translationEngine.ts     # 翻译引擎（计划中）
```

## 贡献指南

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送到分支: `git push origin feature/new-feature`
5. 提交 Pull Request

## 许可证

MIT License

## 问题反馈

如有问题或建议，请创建 Issue。
