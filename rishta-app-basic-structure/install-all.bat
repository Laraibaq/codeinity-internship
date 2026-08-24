@echo off
cd /d "%~dp0"
echo Installing Rishta (single package)...
call npm install
if errorlevel 1 (
  echo Install failed.
  pause
  exit /b 1
)
echo.
echo Done. Run run-mobile.bat or run-web.bat to start.
pause
