@echo off
echo ====================================
echo   高级分析功能综合测试脚本
echo ====================================
echo.

echo 1. 编译插件...
call npm run compile
if %errorlevel% neq 0 (
    echo 编译失败！
    pause
    exit /b 1
)
echo ✅ 编译成功
echo.

echo 2. 检查演示文件...

if exist "demo\react-advanced-component-demo.tsx" (
    echo ✅ React高级组件分析示例存在
) else (
    echo ❌ React高级组件分析示例缺失
)

if exist "demo\rust-advanced-system-demo.rs" (
    echo ✅ Rust高级系统分析示例存在
) else (
    echo ❌ Rust高级系统分析示例缺失
)

if exist "demo\rust-backend-example.rs" (
    echo ✅ Rust后端架构分析示例存在
) else (
    echo ❌ Rust后端架构分析示例缺失
)

echo.
echo 3. 启动VS Code扩展宿主进行测试...
echo.

echo 📋 测试清单：
echo.
echo React高级组件分析测试：
echo   🔸 打开 demo/react-advanced-component-demo.tsx
echo   🔸 右键选择 "分析代码结构"
echo   🔸 查看树状视图中的 "🔬 React 高级组件分析" 节点
echo   🔸 展开查看：组件依赖分析、Hook依赖分析、渲染优化建议
echo   🔸 检查架构评分和优化建议
echo.
echo Rust高级系统分析测试：
echo   🔸 打开 demo/rust-advanced-system-demo.rs
echo   🔸 右键选择 "分析代码结构"
echo   🔸 查看树状视图中的 "🔬 Rust 高级系统分析" 节点
echo   🔸 展开查看：模块架构、错误处理、并发安全、内存管理
echo   🔸 检查总体架构评分和系统建议
echo.
echo Rust后端架构分析测试：
echo   🔸 打开 demo/rust-backend-example.rs
echo   🔸 右键选择 "分析代码结构"
echo   🔸 在可视化面板中查看：API接口、安全问题、性能瓶颈节点
echo   🔸 检查微服务就绪度和数据库分析
echo.
echo 预期结果：
echo   ✅ 树状视图显示高级分析节点，带有评分信息
echo   ✅ 可视化面板显示丰富的分析节点和优化建议
echo   ✅ 支持点击节点跳转到对应代码位置
echo   ✅ 分析结果包含具体的改进建议和优化方案
echo.

echo 正在启动VS Code...
code --extensionDevelopmentPath="%cd%" "%cd%\demo"

echo.
echo ====================================
echo 测试说明：
echo ====================================
echo.
echo 1. 新功能亮点：
echo    🔥 React高级组件分析 - 深度分析组件架构和性能
echo    🔥 Rust高级系统分析 - 全面评估系统架构质量
echo    🔥 评分机制 - 量化分析结果，提供改进指标
echo.
echo 2. 分析维度：
echo    📊 组件/模块依赖关系分析
echo    ⚡ 性能优化机会识别
echo    🔒 安全问题和漏洞检测
echo    🧪 测试覆盖率和质量评估
echo    📦 打包和依赖优化建议
echo.
echo 3. 评分系统：
echo    🟢 80-100分：架构优秀，维护性好
echo    🟡 60-79分：架构良好，有改进空间
echo    🔴 0-59分：需要重构，存在问题
echo.
echo 测试完成后请检查分析结果的准确性和实用性！
echo.
pause
