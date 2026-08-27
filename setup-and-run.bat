@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Sinov Laboratoriyalari Majmuasi - Setup va Ishga tushirish

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo ============================================================
echo   SINOV LABORATORIYALARI MAJMUASI - O'RNATISH VA ISHGA TUSHIRISH
echo ============================================================
echo.

REM ---------------------------------------------------------------
REM 1) Node.js mavjudligini tekshirish
REM ---------------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [XATOLIK] Node.js topilmadi. Iltimos https://nodejs.org dan
    echo Node.js ^(v20 yoki undan yuqori^) o'rnating va qaytadan urinib ko'ring.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js topildi: %NODE_VERSION%
echo.

REM ---------------------------------------------------------------
REM 2) Backend .env faylini tekshirish / yaratish
REM ---------------------------------------------------------------
if not exist "%BACKEND%\.env" (
    if exist "%BACKEND%\.env.example" (
        copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
        echo [OK] backend\.env yaratildi ^(.env.example asosida^).
        echo       DATABASE_URL va JWT_SECRET qiymatlarini o'zgartirishni unutmang.
    ) else (
        echo [OGOHLANTIRISH] backend\.env.example topilmadi. .env qo'lda yaratilishi kerak.
    )
) else (
    echo [OK] backend\.env allaqachon mavjud.
)
echo.

REM ---------------------------------------------------------------
REM 3) Backend: paketlarni o'rnatish
REM ---------------------------------------------------------------
echo ------------------------------------------------------------
echo  Backend paketlari o'rnatilmoqda...
echo ------------------------------------------------------------
cd /d "%BACKEND%"
call npm install
if errorlevel 1 (
    echo [XATOLIK] Backend paketlarini o'rnatishda xatolik yuz berdi.
    pause
    exit /b 1
)
echo.

REM ---------------------------------------------------------------
REM 4) Prisma: generate + migrate + seed
REM ---------------------------------------------------------------
echo ------------------------------------------------------------
echo  Prisma Client generatsiya qilinmoqda...
echo ------------------------------------------------------------
call npx prisma generate
if errorlevel 1 (
    echo [XATOLIK] Prisma generate muvaffaqiyatsiz yakunlandi.
    echo            DATABASE_URL to'g'ri sozlanganini tekshiring.
    pause
    exit /b 1
)
echo.

echo ------------------------------------------------------------
echo  Database migratsiyasi qo'llanilmoqda...
echo  ^(PostgreSQL ishga tushirilgan va DATABASE_URL to'g'ri bo'lishi shart^)
echo ------------------------------------------------------------
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo [XATOLIK] Migratsiya muvaffaqiyatsiz yakunlandi.
    echo            PostgreSQL serverini ishga tushiring va backend\.env
    echo            faylidagi DATABASE_URL qiymatini tekshiring.
    pause
    exit /b 1
)
echo.

echo ------------------------------------------------------------
echo  Demo ma'lumotlar yuklanmoqda ^(seed^)...
echo ------------------------------------------------------------
call npm run seed
echo.

REM ---------------------------------------------------------------
REM 5) Frontend: paketlarni o'rnatish
REM ---------------------------------------------------------------
echo ------------------------------------------------------------
echo  Frontend paketlari o'rnatilmoqda...
echo ------------------------------------------------------------
cd /d "%FRONTEND%"
call npm install
if errorlevel 1 (
    echo [XATOLIK] Frontend paketlarini o'rnatishda xatolik yuz berdi.
    pause
    exit /b 1
)
echo.

REM ---------------------------------------------------------------
REM 6) Serverlarni alohida oynalarda ishga tushirish
REM ---------------------------------------------------------------
echo ============================================================
echo   O'RNATISH YAKUNLANDI. SERVERLAR ISHGA TUSHIRILMOQDA...
echo ============================================================
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
echo   Email:    admin@slm.uz
echo   Parol:    Admin@12345   ^(production'da darhol almashtiring^)
echo.
echo Ikkala server alohida oynalarda ishga tushdi. Ularni to'xtatish
echo uchun tegishli oynada CTRL+C bosing yoki oynani yoping.
echo.
pause
