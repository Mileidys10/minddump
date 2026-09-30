@echo off
echo ========================================================
echo   Iniciando Servidor Web Local para MindDump (PWA)
echo ========================================================
echo.
echo Sirviendo aplicacion compilada en http://localhost:4200 y en tu red local...
echo.
call npx -y serve -s dist/minddump/browser -l 4200
pause
