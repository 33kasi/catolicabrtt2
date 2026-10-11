@echo off
title Devocao Mariana - Servidor Localhost SigiloPay
cd /d "%~dp0"
echo =======================================================
echo   DEVOCAO MARIANA - SERVIDOR LOCALHOST ATIVO
echo =======================================================
echo.
echo   Pagina Principal: http://localhost:8000
echo   Checkout Direto:  http://localhost:8000/checkout.html
echo   Gateway:          SigiloPay Oficial Conectado
echo.
echo   Para encerrar, feche esta janela ou aperte Ctrl + C.
echo =======================================================
node server.js
pause
