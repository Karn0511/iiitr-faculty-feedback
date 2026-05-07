@echo off
echo ==============================================
echo   Starting IIIT Ranchi Faculty Feedback System
echo ==============================================

echo [1/2] Launching Backend Server...
start "Backend Server" cmd /k "npm run dev"

echo [2/2] Launching Frontend Angular App...
start "Frontend App" cmd /k "cd frontend && npm start"

echo Both servers are starting up in separate windows!
echo You can close this window now.
pause
