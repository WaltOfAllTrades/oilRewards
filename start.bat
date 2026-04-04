@echo off
title Oil Rewards
echo ========================================
echo   Oil Rewards
echo ========================================
echo.
echo Close this window to stop the server.
echo.
start "" http://localhost:3000
npx json-server db.json --static . --port 3000
