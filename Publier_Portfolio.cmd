@echo off
setlocal
cd /d "%~dp0"
title Publier le portfolio de Victor
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 20 ou superieur est necessaire pour construire et publier le portfolio.
  pause
  exit /b 1
)
node scripts\deploy.mjs
if errorlevel 1 (
  echo.
  echo La publication a ete interrompue. Consulte le message ci-dessus.
  pause
  exit /b 1
)
echo.
echo Termine : https://perso.telecom-paristech.fr/vwoelffel-23/
pause
