@echo off
setlocal

rem One-click devnet launcher for Windows
rem Usage: double-click or run: script\devnet.cmd [up|down]

set CMD=%1
if "%CMD%"=="" set CMD=up

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0devnet.ps1" %CMD%
if errorlevel 1 pause
endlocal
