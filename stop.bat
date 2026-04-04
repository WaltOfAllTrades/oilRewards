@echo off
echo Stopping Oil Rewards server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Oil Rewards" >nul 2>&1
echo Done.
timeout /t 2 >nul
