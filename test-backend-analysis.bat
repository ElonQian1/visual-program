@echo off
echo 测试Rust后端架构分析功能...
echo.

echo 1. 编译插件...
call npm run compile
if %errorlevel% neq 0 (
    echo 编译失败！
    pause
    exit /b 1
)

echo.
echo 2. 启动VS Code扩展宿主...
echo 请在新窗口中：
echo - 打开 demo/rust-backend-example.rs 文件
echo - 右键选择 "分析代码结构"
echo - 使用 Ctrl+Shift+P 打开命令面板
echo - 运行 "打开可视化视图" 命令
echo.
echo 预期结果：
echo - 树状视图中显示 Rust后端架构分析节点
echo - 可视化面板中显示API接口、安全问题、性能瓶颈等分析结果
echo - 支持点击节点跳转到对应代码位置
echo.

code --extensionDevelopmentPath="%cd%" "%cd%\demo"

echo.
echo 测试完成！查看分析结果是否正确显示。
pause
