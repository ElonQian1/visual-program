@echo off
echo ===================================
echo  代码可视化编程插件 - 快速开始
echo ===================================
echo.

echo 1. 检查Node.js安装...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到Node.js，请先安装Node.js 16.x或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

node --version
echo ✅ Node.js已安装

echo.
echo 2. 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

echo.
echo 3. 编译项目...
call npm run compile
if %errorlevel% neq 0 (
    echo ❌ 编译失败
    pause
    exit /b 1
)
echo ✅ 编译完成

echo.
echo 🎉 设置完成！现在您可以：
echo.
echo 1. 在VSCode中打开此项目
echo 2. 按F5启动插件调试
echo 3. 在新窗口中打开demo文件夹
echo 4. 右键点击UserManager.tsx或user_manager.rs
echo 5. 选择"分析代码结构"
echo 6. 使用Ctrl+Shift+P运行"打开可视化视图"
echo.

pause
