@echo off
setlocal
chcp 65001 >nul
title Sinov Laboratoriyalari Majmuasi - PostgreSQL (Docker)

echo ============================================================
echo   POSTGRESQL'NI DOCKER ORQALI ISHGA TUSHIRISH
echo ============================================================
echo.

where docker >nul 2>nul
if errorlevel 1 (
    echo [XATOLIK] Docker topilmadi.
    echo.
    echo Docker Desktop'ni shu yerdan o'rnating:
    echo   https://www.docker.com/products/docker-desktop
    echo.
    echo O'rnatgandan so'ng Docker Desktop dasturini ishga tushiring
    echo va bu faylni qaytadan ishga tushiring.
    echo.
    echo ^(Yoki: PostgreSQL'ni to'g'ridan-to'g'ri kompyuteringizga
    echo o'rnatishingiz mumkin: https://www.postgresql.org/download/windows/^)
    pause
    exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
    echo [XATOLIK] Docker o'rnatilgan, lekin ishlamayapti.
    echo Docker Desktop dasturini oching va to'liq yuklanishini kuting,
    echo so'ngra bu faylni qaytadan ishga tushiring.
    pause
    exit /b 1
)

echo [OK] Docker topildi va ishlamoqda.
echo.

docker ps -a --format "{{.Names}}" | findstr /x "slm_postgres" >nul 2>nul
if not errorlevel 1 (
    echo Mavjud "slm_postgres" konteyneri topildi. Ishga tushirilmoqda...
    docker start slm_postgres >nul
) else (
    echo Yangi "slm_postgres" konteyneri yaratilmoqda...
    docker run --name slm_postgres ^
        -e POSTGRES_USER=slm_user ^
        -e POSTGRES_PASSWORD=slm_password ^
        -e POSTGRES_DB=slm_db ^
        -p 5432:5432 ^
        -d postgres:16-alpine
)

if errorlevel 1 (
    echo [XATOLIK] PostgreSQL konteynerini ishga tushirib bo'lmadi.
    pause
    exit /b 1
)

echo.
echo [OK] PostgreSQL ishga tushdi va 5432 portda tinglanmoqda.
echo.
echo backend\.env faylida quyidagi qator borligiga ishonch hosil qiling:
echo   DATABASE_URL="postgresql://slm_user:slm_password@localhost:5432/slm_db?schema=public"
echo.
echo Endi setup-and-run.bat faylini qaytadan ishga tushiring.
echo.
pause
