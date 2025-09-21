@echo off
REM Create Desktop Shortcuts for Rollback Tools
REM This creates shortcuts on your desktop for easy access

echo ==========================================
echo Creating Desktop Shortcuts
echo ==========================================
echo.

set CURRENT_DIR=%~dp0
set DESKTOP=%USERPROFILE%\Desktop

echo [INFO] Creating desktop shortcuts...
echo Current directory: %CURRENT_DIR%
echo Desktop location: %DESKTOP%
echo.

REM Create shortcut for main GUI
echo [INFO] Creating Rollback Manager shortcut...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\PostgreSQL Rollback Manager.lnk'); $Shortcut.TargetPath = '%CURRENT_DIR%START-ROLLBACK-GUI.bat'; $Shortcut.WorkingDirectory = '%CURRENT_DIR%'; $Shortcut.Description = 'PostgreSQL Rollback Manager - One-click database recovery'; $Shortcut.Save()}"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Rollback Manager shortcut created
) else (
    echo [WARNING] Could not create Rollback Manager shortcut
)

REM Create shortcut for emergency rollback
echo [INFO] Creating Emergency Rollback shortcut...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\EMERGENCY ROLLBACK.lnk'); $Shortcut.TargetPath = '%CURRENT_DIR%EMERGENCY-ROLLBACK.bat'; $Shortcut.WorkingDirectory = '%CURRENT_DIR%'; $Shortcut.Description = 'Emergency Database Rollback - Instant recovery access'; $Shortcut.Save()}"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Emergency Rollback shortcut created
) else (
    echo [WARNING] Could not create Emergency Rollback shortcut
)

REM Create shortcut for backup
echo [INFO] Creating Quick Backup shortcut...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\Take Database Backup.lnk'); $Shortcut.TargetPath = '%CURRENT_DIR%manual-backup.bat'; $Shortcut.WorkingDirectory = '%CURRENT_DIR%'; $Shortcut.Description = 'Take immediate PostgreSQL backup'; $Shortcut.Save()}"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Quick Backup shortcut created
) else (
    echo [WARNING] Could not create Quick Backup shortcut
)

echo.
echo ==========================================
echo Desktop Shortcuts Created
echo ==========================================
echo.
echo The following shortcuts are now on your desktop:
echo.
echo 1. "PostgreSQL Rollback Manager"
echo    - Main GUI with all rollback functions
echo    - Setup, testing, and recovery tools
echo.
echo 2. "EMERGENCY ROLLBACK"  
echo    - Direct access to emergency recovery
echo    - Single-click rollback interface
echo.
echo 3. "Take Database Backup"
echo    - Immediate backup creation
echo    - Quick backup without GUI
echo.
echo [SUCCESS] You now have quick buttons for rollback operations!
echo.
echo Just double-click any shortcut on your desktop to:
echo - Perform emergency rollbacks
echo - Take instant backups  
echo - Access the full rollback manager
echo.
pause
