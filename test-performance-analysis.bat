@echo off
echo ====================================
echo React 性能分析功能测试
echo ====================================
echo.

echo 正在编译项目...
call npm run compile
if %errorlevel% neq 0 (
    echo 编译失败！
    pause
    exit /b 1
)

echo.
echo ✓ 编译成功！
echo.
echo 测试功能包括：
echo [1] React组件性能问题检测
echo [2] 架构模式识别 (Redux, Context, MVC等)
echo [3] 内存泄漏和渲染优化建议  
echo [4] 可视化节点展示和交互
echo.
echo 使用方法：
echo 1. 按F5启动调试模式
echo 2. 打开demo/react-performance-test.ts或任何React文件
echo 3. 右键选择 "分析代码结构"
echo 4. 使用命令面板运行 "打开可视化视图"  
echo 5. 查看性能问题节点（橙红色渐变）和架构模式节点（蓝紫色渐变）
echo.
echo 新增可视化特性：
echo - 性能问题节点带有严重程度标识
echo - 架构模式节点显示数据流和状态管理类型
echo - 支持点击节点跳转到问题代码位置
echo.
echo 按任意键继续...
pause > nul

echo.
echo ====================================
echo 开始VSCode调试模式...  
echo ====================================
echo.
echo 请在VSCode中按F5启动调试！
echo.
pause
