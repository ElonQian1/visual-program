@echo off
echo 正在测试微服务分析功能...

echo.
echo 1. 编译扩展...
call npm run compile

echo.
echo 2. 打开演示文件进行测试...
echo   - demo/advanced-rust-microservice-demo.rs (Rust微服务演示)
echo   - demo/advanced-react-enterprise-demo.tsx (React企业级演示)

echo.
echo 3. 使用说明:
echo   - 打开上述文件
echo   - 按 Ctrl+Shift+P
echo   - 输入 "代码可视化: 分析当前文件"
echo   - 查看树视图和可视化面板
echo   - 查找新的微服务、数据库、并发和安全节点

echo.
echo 4. 新功能包括:
echo   - 🏗️ 微服务分析 (服务发现、API网关等)
echo   - 🗄️ 数据库优化 (查询性能、N+1问题检测)
echo   - ⚡ 并发优化 (线程池、并行化建议)
echo   - 🔒 安全模式 (认证、授权、加密)

echo.
echo 测试准备完成！请在VS Code中打开工作区并测试功能。
pause
