@echo off
setlocal
cd /d "%~dp0"
where.exe node >nul 2>&1
if errorlevel 1 goto preview
node scripts\build.mjs
if errorlevel 1 goto failed
:preview
if not exist "dist\index.html" goto failed
start "" "%~dp0dist\index.html"
exit /b 0
:failed
echo Impossible de construire le portfolio. Installez Node.js 20 ou superieur, puis relancez ce fichier.
pause
exit /b 1
