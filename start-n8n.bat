@echo off
echo Starting n8n automation platform...
cd /d %USERPROFILE%
start /B n8n start
echo n8n is starting... Please check http://localhost:5678/
pause
