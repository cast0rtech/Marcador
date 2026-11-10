@echo off
setlocal
echo ========================================================
echo  Compilador del Instalador Windows - Marcador BMS v1.0
echo ========================================================

set STAGE=build_stage
if exist "%STAGE%" rd /s /q "%STAGE%"
mkdir "%STAGE%"
mkdir "%STAGE%\backend"
mkdir "%STAGE%\frontend"
mkdir "%STAGE%\frontend\dist"
mkdir "%STAGE%\frontend\src"

echo [*] Compilando frontend React...
cd frontend
call npm run build
cd ..

echo [*] Compilando Lanzador Go...
go build -o Lanzador.exe launcher.go

echo [*] Preparando archivos para el empaquetado...
copy /y Lanzador.exe "%STAGE%\" >nul
copy /y iniciar.bat "%STAGE%\" >nul
copy /y requirements.txt "%STAGE%\" >nul
copy /y sample_datapoints.csv "%STAGE%\" >nul
copy /y docker-compose.yml "%STAGE%\" >nul
copy /y Dockerfile "%STAGE%\" >nul
copy /y .env.example "%STAGE%\" >nul
copy /y README.md "%STAGE%\" >nul
copy /y *.py "%STAGE%\" >nul

xcopy /s /e /y /q "backend\*" "%STAGE%\backend\" >nul
xcopy /s /e /y /q "frontend\dist\*" "%STAGE%\frontend\dist\" >nul
xcopy /s /e /y /q "frontend\src\*" "%STAGE%\frontend\src\" >nul
copy /y frontend\*.json "%STAGE%\frontend\" >nul 2>nul
copy /y frontend\*.js "%STAGE%\frontend\" >nul 2>nul
copy /y frontend\*.html "%STAGE%\frontend\" >nul 2>nul
copy /y frontend\Dockerfile "%STAGE%\frontend\" >nul 2>nul
copy /y frontend\.dockerignore "%STAGE%\frontend\" >nul 2>nul

echo [*] Ejecutando Inno Setup Compiler (ISCC)...
set ISCC="C:\Users\castor\AppData\Local\Programs\Inno Setup 6\ISCC.exe"
if not exist %ISCC% set ISCC=iscc

%ISCC% installer.iss

echo [*] Limpiando carpeta temporal...
if exist "%STAGE%" rd /s /q "%STAGE%"

echo ========================================================
echo  Instalador generado en dist_installer\Marcador_Installer_v1.0.exe
echo ========================================================
endlocal

