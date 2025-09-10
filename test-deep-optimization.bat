@echo off
chcp 65001 >nul
echo ====================================
echo   深度优化分析功能测试脚本
echo ====================================
echo.

echo 1. 编译插件...
call npm run compile
if %errorlevel% neq 0 (
    echo ❌ 编译失败
    pause
    exit /b 1
)
echo ✅ 编译成功
echo.

echo 2. 检查深度优化演示文件...
if exist "demo\react-deep-optimization-demo.tsx" (
    echo ✅ React深度优化分析演示文件存在
) else (
    echo ❌ React演示文件缺失
)

if exist "demo\rust-deep-optimization-demo.rs" (
    echo ✅ Rust深度优化分析演示文件存在
) else (
    echo ❌ Rust演示文件缺失
)
echo.

echo 3. 启动VS Code进行深度优化分析测试...
echo.

echo 📋 深度优化分析测试清单：
echo.
echo React深度优化分析测试：
echo   ► 打开 demo\react-deep-optimization-demo.tsx
echo   ► 右键选择 "分析代码结构"
echo   ► 在树状视图中查找 "🚀 React深度优化" 节点
echo   ► 展开查看以下分析结果：
echo     • 📦 代码分割机会 - 大型组件懒加载建议
echo     • ⚡ 渲染优化 - 昂贵渲染检测和记忆化建议
echo     • 🌳 Bundle优化 - Tree-shaking和依赖优化
echo     • 📊 性能评估 - 加载时间和性能预测
echo.
echo Rust深度优化分析测试：
echo   ► 打开 demo\rust-deep-optimization-demo.rs
echo   ► 右键选择 "分析代码结构"
echo   ► 在树状视图中查找 "⚡ Rust深度优化" 节点
echo   ► 展开查看以下分析结果：
echo     • 🧠 内存优化 - 内存分配和生命周期优化
echo     • ⚡ 并发优化 - 异步和并行化机会
echo     • 🛡️ 错误处理 - Panic风险和安全替代方案
echo     • 🏗️ 架构优化 - 模块设计和trait优化
echo     • 📈 性能评估 - 综合性能评分和建议
echo.
echo 期望的测试结果：
echo   ✅ 深度优化分析节点正确显示
echo   ✅ 各类优化建议具体且可操作
echo   ✅ 性能评分准确反映代码质量
echo   ✅ 优化建议包含预期收益估算
echo   ✅ 支持点击节点跳转到问题代码位置
echo   ✅ 图标和颜色正确表示优化机会级别
echo.

echo 🎯 新功能亮点：
echo   • 代码分割分析 - 识别大型组件，建议懒加载
echo   • 渲染性能深度分析 - 检测昂贵渲染，提供记忆化建议
echo   • Bundle优化分析 - Tree-shaking机会，依赖优化
echo   • 内存使用优化 - Rust内存分配模式优化
echo   • 并发性能优化 - 异步/并行化机会识别
echo   • 错误处理安全分析 - Panic风险检测和安全替代
echo   • 架构质量评估 - 模块内聚性和耦合度分析
echo   • 性能预测模型 - 基于代码复杂度的性能预测
echo.

echo 正在启动VS Code...
code .

echo.
echo 🎉 深度优化分析测试准备完成！
echo    请按照上述测试清单验证新功能。
echo    新增功能为React和Rust项目提供企业级性能优化建议。
pause
