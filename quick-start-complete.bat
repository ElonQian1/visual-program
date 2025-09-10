@echo off
chcp 65001 >nul
echo.
echo 🚀 Visual Programming VSCode Extension - 快速启动
echo ================================================
echo.

echo 📋 检查环境...
if not exist package.json (
    echo ❌ 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo ✅ 项目目录确认

echo.
echo 📦 安装依赖...
call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

echo.
echo 🔨 编译项目...
call npm run compile
if errorlevel 1 (
    echo ❌ 编译失败
    pause
    exit /b 1
)
echo ✅ 项目编译完成

echo.
echo 🧪 运行测试 (可选)...
set /p run_tests="是否运行测试? (y/N): "
if /i "%run_tests%"=="y" (
    call npm test
    if errorlevel 1 (
        echo ⚠️  测试运行有问题，但不影响扩展使用
    ) else (
        echo ✅ 测试通过
    )
)

echo.
echo 🎯 启动扩展开发...
echo.
echo 请按照以下步骤启动扩展:
echo 1. 在 VS Code 中打开此项目
echo 2. 按 F5 启动扩展开发主机
echo 3. 在新窗口中测试扩展功能
echo.
echo 📚 可用命令 (Ctrl+Shift+P):
echo   - Visual Programming: 打开可视化视图
echo   - Visual Programming: 分析代码结构  
echo   - Visual Programming: 显示欢迎向导
echo   - Visual Programming: 运行项目诊断
echo   - Visual Programming: 创建协作会话
echo.
echo 🎉 准备完成！扩展已准备就绪！
echo.

set /p open_vscode="是否自动打开 VS Code? (Y/n): "
if /i not "%open_vscode%"=="n" (
    echo 🚀 正在启动 VS Code...
    start "" code .
)

echo.
echo ✨ 祝您使用愉快！
pause
