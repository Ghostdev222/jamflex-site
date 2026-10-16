@echo off
setlocal
cd /d "%~dp0"

rem JAMFLEX preview on this computer: http://127.0.0.1:4321
rem Uses a real Node install if you have one, otherwise the Node inside Qoder.
where node >nul 2>nul
if %errorlevel%==0 (
  set "NODE=node"
) else (
  set "NODE=%LOCALAPPDATA%\Programs\Qoder\Qoder.exe"
  set "ELECTRON_RUN_AS_NODE=1"
)

if not exist "%NODE%" (
  echo No Node found, and Qoder is not at "%NODE%".
  echo Install Node from https://nodejs.org and double-click this file again.
  pause
  exit /b 1
)

echo Starting JAMFLEX... press Ctrl+C to stop.
"%NODE%" server\dev.mjs

pause
