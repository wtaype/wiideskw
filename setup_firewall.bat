@echo off
echo Configurando Firewall para WiiDesk...
netsh advfirewall firewall delete rule name="WiiDesk-WebSocket" >nul 2>&1
netsh advfirewall firewall add rule name="WiiDesk-WebSocket" dir=in action=allow protocol=TCP localport=8765 enable=yes profile=any
if %errorlevel%==0 (
    echo.
    echo [OK] Puerto 8765 habilitado en Firewall de Windows
    echo Ahora puedes conectar desde tu Android.
) else (
    echo.
    echo [ERROR] Ejecuta este archivo como Administrador
)
pause
