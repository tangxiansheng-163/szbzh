@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   设计协同系统 - 本地服务
echo ========================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python。请先安装 Python 并加入 PATH。
    echo.
    pause
    exit /b 1
)

echo 正在启动服务（端口 8080）...
echo.
echo 启动成功后，在浏览器打开:
echo   http://localhost:8080/main.html
echo.
echo 按 Ctrl+C 可停止服务。
echo ========================================
echo.

python start_server.py

pause
