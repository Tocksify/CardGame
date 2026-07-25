@echo off
setlocal enabledelayedexpansion
title Aethermancer — Building installer...

echo.
echo  ===================================================
echo   AETHERMANCER  ^|  Desktop Installer Build
echo  ===================================================
echo.

:: Move to repo root (one level up from desktop-setup\)
cd /d "%~dp0.."

:: ── Step 1: workspace dependencies ──────────────────────────────────────────
echo [1/4] Installing workspace dependencies...
call pnpm install
if errorlevel 1 goto :fail
echo.

:: ── Step 2: API server ───────────────────────────────────────────────────────
echo [2/4] Building API server...
call pnpm --filter @workspace/api-server run build
if errorlevel 1 goto :fail
echo.

:: ── Step 3: Frontend ─────────────────────────────────────────────────────────
echo [3/4] Building frontend...
set PORT=3000
set BASE_PATH=/
set NODE_ENV=production
call pnpm --filter @workspace/aethermancer run build
if errorlevel 1 goto :fail
echo.

:: ── Step 4: Electron installer ───────────────────────────────────────────────
echo [4/4] Packaging Electron installer...
cd desktop-setup
call npm install
if errorlevel 1 goto :fail
call npm run dist
if errorlevel 1 goto :fail

echo.
echo  ===================================================
echo   Build complete!
echo   Installer is in:  desktop-setup\out\
echo  ===================================================
echo.
goto :end

:fail
echo.
echo  BUILD FAILED — see errors above.
echo.
exit /b 1

:end
endlocal
