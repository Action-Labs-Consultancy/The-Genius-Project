# PostgreSQL Rollback GUI - Simple Version
# Windows GUI for one-click rollback operations

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create the main form
$form = New-Object System.Windows.Forms.Form
$form.Text = "PostgreSQL Rollback Manager"
$form.Size = New-Object System.Drawing.Size(500, 600)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false

# Title
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$titleLabel.Size = New-Object System.Drawing.Size(460, 30)
$titleLabel.Text = "PostgreSQL Rollback Manager"
$titleLabel.Font = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($titleLabel)

# Status label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(20, 60)
$statusLabel.Size = New-Object System.Drawing.Size(460, 20)
$statusLabel.Text = "Ready for operations"
$statusLabel.ForeColor = [System.Drawing.Color]::DarkGreen
$statusLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($statusLabel)

# Function to update status
function Update-Status {
    param($message, $color = "DarkGreen")
    $statusLabel.Text = $message
    $statusLabel.ForeColor = [System.Drawing.Color]::$color
    $form.Refresh()
}

# Emergency Rollback Button
$emergencyButton = New-Object System.Windows.Forms.Button
$emergencyButton.Location = New-Object System.Drawing.Point(50, 100)
$emergencyButton.Size = New-Object System.Drawing.Size(400, 60)
$emergencyButton.Text = "EMERGENCY ROLLBACK - Point in Time Recovery"
$emergencyButton.Font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
$emergencyButton.BackColor = [System.Drawing.Color]::Red
$emergencyButton.ForeColor = [System.Drawing.Color]::White
$emergencyButton.Add_Click({
    $result = [System.Windows.Forms.MessageBox]::Show(
        "WARNING: This will start Point-in-Time Recovery.`n`nThis should only be used when you need to rollback your database.`n`nContinue?", 
        "Emergency Rollback", 
        "YesNo", 
        "Warning"
    )
    if ($result -eq "Yes") {
        Update-Status "Starting emergency rollback..." "Red"
        Start-Process -FilePath "point-in-time-recovery.bat" -WorkingDirectory (Get-Location)
    }
})
$form.Controls.Add($emergencyButton)

# Quick Actions
$actionsLabel = New-Object System.Windows.Forms.Label
$actionsLabel.Location = New-Object System.Drawing.Point(20, 180)
$actionsLabel.Size = New-Object System.Drawing.Size(460, 20)
$actionsLabel.Text = "Quick Actions"
$actionsLabel.Font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($actionsLabel)

# Check Readiness Button
$readinessButton = New-Object System.Windows.Forms.Button
$readinessButton.Location = New-Object System.Drawing.Point(50, 210)
$readinessButton.Size = New-Object System.Drawing.Size(180, 40)
$readinessButton.Text = "Check Readiness"
$readinessButton.BackColor = [System.Drawing.Color]::LightBlue
$readinessButton.Add_Click({
    Update-Status "Checking rollback readiness..." "Blue"
    Start-Process -FilePath "check-rollback-readiness.bat" -WorkingDirectory (Get-Location)
})
$form.Controls.Add($readinessButton)

# Manual Backup Button
$backupButton = New-Object System.Windows.Forms.Button
$backupButton.Location = New-Object System.Drawing.Point(270, 210)
$backupButton.Size = New-Object System.Drawing.Size(180, 40)
$backupButton.Text = "Take Backup Now"
$backupButton.BackColor = [System.Drawing.Color]::LightGreen
$backupButton.Add_Click({
    Update-Status "Taking manual backup..." "Blue"
    Start-Process -FilePath "manual-backup.bat" -WorkingDirectory (Get-Location)
})
$form.Controls.Add($backupButton)

# Test Rollback Button
$testButton = New-Object System.Windows.Forms.Button
$testButton.Location = New-Object System.Drawing.Point(50, 260)
$testButton.Size = New-Object System.Drawing.Size(180, 40)
$testButton.Text = "Test Rollback"
$testButton.BackColor = [System.Drawing.Color]::LightYellow
$testButton.Add_Click({
    $result = [System.Windows.Forms.MessageBox]::Show(
        "This will run a comprehensive rollback test.`n`nIt creates test data and verifies recovery.`n`nContinue?", 
        "Test Rollback", 
        "YesNo", 
        "Question"
    )
    if ($result -eq "Yes") {
        Update-Status "Running rollback test..." "Blue"
        Start-Process -FilePath "verify-rollback-capabilities.bat" -WorkingDirectory (Get-Location)
    }
})
$form.Controls.Add($testButton)

# System Status Button
$statusButton = New-Object System.Windows.Forms.Button
$statusButton.Location = New-Object System.Drawing.Point(270, 260)
$statusButton.Size = New-Object System.Drawing.Size(180, 40)
$statusButton.Text = "System Status"
$statusButton.BackColor = [System.Drawing.Color]::Lavender
$statusButton.Add_Click({
    Update-Status "Running system test..." "Blue"
    Start-Process -FilePath "test-complete-system.bat" -WorkingDirectory (Get-Location)
})
$form.Controls.Add($statusButton)

# Setup Section
$setupLabel = New-Object System.Windows.Forms.Label
$setupLabel.Location = New-Object System.Drawing.Point(20, 320)
$setupLabel.Size = New-Object System.Drawing.Size(460, 20)
$setupLabel.Text = "Initial Setup (Run Once)"
$setupLabel.Font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($setupLabel)

# Setup buttons
$createDbButton = New-Object System.Windows.Forms.Button
$createDbButton.Location = New-Object System.Drawing.Point(50, 350)
$createDbButton.Size = New-Object System.Drawing.Size(400, 30)
$createDbButton.Text = "1. Create Database and User"
$createDbButton.BackColor = [System.Drawing.Color]::LightGreen
$createDbButton.Add_Click({
    Update-Status "Creating database..." "Blue"
    Start-Process -FilePath "create-n8n-database.bat" -WorkingDirectory (Get-Location)
})
$form.Controls.Add($createDbButton)

$configureButton = New-Object System.Windows.Forms.Button
$configureButton.Location = New-Object System.Drawing.Point(50, 390)
$configureButton.Size = New-Object System.Drawing.Size(400, 30)
$configureButton.Text = "2. Configure Point-in-Time Recovery"
$configureButton.BackColor = [System.Drawing.Color]::LightBlue
$configureButton.Add_Click({
    Update-Status "Configuring PITR..." "Blue"
    Start-Process -FilePath "configure-postgresql.bat" -WorkingDirectory (Get-Location)
})
$form.Controls.Add($configureButton)

$scheduleButton = New-Object System.Windows.Forms.Button
$scheduleButton.Location = New-Object System.Drawing.Point(50, 430)
$scheduleButton.Size = New-Object System.Drawing.Size(400, 30)
$scheduleButton.Text = "3. Schedule Automated Backups"
$scheduleButton.BackColor = [System.Drawing.Color]::LightYellow
$scheduleButton.Add_Click({
    Update-Status "Setting up backup schedule..." "Blue"
    Start-Process -FilePath "setup-backup-schedule.bat" -WorkingDirectory (Get-Location)
})
$form.Controls.Add($scheduleButton)

$securityButton = New-Object System.Windows.Forms.Button
$securityButton.Location = New-Object System.Drawing.Point(50, 470)
$securityButton.Size = New-Object System.Drawing.Size(400, 30)
$securityButton.Text = "4. Apply Security Hardening"
$securityButton.BackColor = [System.Drawing.Color]::LightCoral
$securityButton.Add_Click({
    Update-Status "Applying security settings..." "Blue"
    Start-Process -FilePath "security-hardening.bat" -WorkingDirectory (Get-Location)
})
$form.Controls.Add($securityButton)

# Info
$infoLabel = New-Object System.Windows.Forms.Label
$infoLabel.Location = New-Object System.Drawing.Point(20, 520)
$infoLabel.Size = New-Object System.Drawing.Size(460, 40)
$infoLabel.Text = "PostgreSQL Rollback Manager - One-click access to Point-in-Time Recovery and database rollback capabilities."
$infoLabel.Font = New-Object System.Drawing.Font("Arial", 9)
$infoLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($infoLabel)

# Check if critical files exist
$criticalFiles = @("point-in-time-recovery.bat", "check-rollback-readiness.bat")
$missingFiles = @()

foreach ($file in $criticalFiles) {
    if (!(Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Update-Status "WARNING: Missing files - $($missingFiles -join ', ')" "Red"
    $emergencyButton.Enabled = $false
} else {
    Update-Status "All rollback files available - Ready for operations" "DarkGreen"
}

# Show the form
$form.ShowDialog() | Out-Null
