@echo off
chcp 65001 >nul
echo ====================================
echo   Advanced Analysis Testing Script
echo ====================================
echo.

echo 1. Compiling plugin...
call npm run compile
if %errorlevel% neq 0 (
    echo ❌ Compilation failed
    pause
    exit /b 1
)
echo ✅ Compilation successful
echo.

echo 2. Checking demo files...
if exist "demo\react-advanced-component-demo.tsx" (
    echo ✅ React advanced component analysis demo exists
) else (
    echo ❌ React demo file missing
)

if exist "demo\rust-advanced-system-demo.rs" (
    echo ✅ Rust advanced system analysis demo exists  
) else (
    echo ❌ Rust system demo file missing
)

if exist "demo\rust-backend-example.rs" (
    echo ✅ Rust backend architecture analysis demo exists
) else (
    echo ❌ Rust backend demo file missing
)
echo.

echo 3. Starting VS Code Extension Host for testing...
echo.

echo 📋 Test Checklist:
echo.
echo React Advanced Component Analysis Testing:
echo   ► Right-click and select "Analyze Code Structure"
echo   ► Check tree view for "🔥 React Advanced Component Analysis" node
echo   ► Expand to view: Component Dependencies, Hook Dependencies, Render Optimization
echo   ► Review Architecture Score and Optimization Suggestions
echo.
echo Rust Advanced System Analysis Testing:  
echo   ► Right-click and select "Analyze Code Structure"
echo   ► Check tree view for "🔥 Rust Advanced System Analysis" node
echo   ► Expand to view: Module Architecture, Error Handling, Concurrency Safety, Memory Management
echo   ► Review System Architecture Score and System Recommendations
echo.
echo Rust Backend Architecture Analysis Testing:
echo   ► Right-click and select "Analyze Code Structure" 
echo   ► View in visualization panel: API Interfaces, Security Issues, Performance Bottlenecks
echo   ► Check Microservice Readiness and Database Analysis
echo.
echo Expected Results:
echo   ✅ Detailed analysis results with scores and specific recommendations
echo   ✅ Support for clicking nodes to jump to corresponding code locations  
echo   ✅ Rich icons and color coding indicating issue severity
echo   ✅ Concrete improvement suggestions and optimization plans
echo.

echo Starting VS Code...
code .

echo.
echo 🎉 Testing complete! 
echo    Please check the tree view and visualization panel for analysis results.
echo    Refer to ADVANCED_FEATURES.md for detailed feature documentation.
pause
