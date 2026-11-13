@echo off
title StockObs - Multi-Timeframe Volume Breakout Observer
cd /d "%~dp0"
echo ===================================================
echo   Starting StockObs Dev Server (http://localhost:3000)
echo ===================================================
call npm run dev
if errorlevel 1 (
  echo.
  echo Server stopped or encountered an error.
  pause
)

