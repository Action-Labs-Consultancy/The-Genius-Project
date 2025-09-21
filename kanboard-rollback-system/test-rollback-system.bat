@echo off
echo Testing Ultimate Rollback System
echo ================================
echo.

echo Testing Kanboard backup...
curl -X POST http://localhost:3001/api/system/backup -H "Content-Type: application/json" -d "{\"reason\":\"Test Kanboard backup\",\"backupType\":\"kanboard\",\"userId\":\"admin\"}" > backup_result.json
echo Kanboard backup result:
type backup_result.json
echo.

echo Testing n8n backup (with authentication)...
curl -X POST http://localhost:3001/api/system/backup -H "Content-Type: application/json" -d "{\"reason\":\"Test n8n backup\",\"backupType\":\"n8n\",\"userId\":\"admin\"}" > n8n_backup_result.json
echo n8n backup result:
type n8n_backup_result.json
echo.

echo Testing full system backup...
curl -X POST http://localhost:3001/api/system/backup -H "Content-Type: application/json" -d "{\"reason\":\"Full system test with fixed auth\",\"backupType\":\"full\",\"userId\":\"admin\"}" > full_backup_result.json
echo Full backup result:
type full_backup_result.json
echo.

echo Testing backup list...
curl http://localhost:3001/api/system/backups > backup_list.json
echo Backup list:
type backup_list.json
echo.

echo ================================
echo Test completed! Check results above.
pause
