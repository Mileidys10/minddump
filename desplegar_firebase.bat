@echo off
echo =======================================================
echo   Despliegue de MindDump a Firebase Hosting (100% Gratis)
echo =======================================================
echo.
echo 1. Compilando aplicacion para produccion...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error al compilar la aplicacion.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Desplegando en Firebase Hosting...
call npx -y firebase-tools deploy --only hosting
echo.
echo Despliegue finalizado. Si necesitas iniciar sesion en Firebase,
echo ejecuta primero: npx firebase-tools login
pause
