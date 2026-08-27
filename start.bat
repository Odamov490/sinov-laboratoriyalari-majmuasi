@echo off
setlocal
chcp 65001 >nul
title Sinov Laboratoriyalari Majmuasi - Ishga tushirish

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if not exist "%BACKEND%\node_modules" (
    echo [OGOHLANTIRISH] backend\node_modules topilmadi.
    echo Avval setup-and-run.bat faylini ishga tushiring.
    pause
    exit /b 1
)
if not exist "%FRONTEND%\node_modules" (
    echo [OGOHLANTIRISH] frontend\node_modules topilmadi.
    echo Avval setup-and-run.bat faylini ishga tushiring.
    pause
    exit /b 1
)

echo Backend va Frontend serverlari ishga tushirilmoqda...
echo.

start "SLM Backend (http://localhost:4000)" cmd /k "cd /d "%BACKEND%" && npm run dev"
timeout /t 3 /nobreak >nul
start "SLM Frontend (http://localhost:5173)" cmd /k "cd /d "%FRONTEND%" && npm run dev"

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo Admin:    http://localhost:5173/admin/login
echo.
pause
