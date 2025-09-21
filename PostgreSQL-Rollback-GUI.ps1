# PostgreSQL Rollback GUI - One-Click Recovery Tool
# Simple Windows GUI for PostgreSQL rollback operations

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create the main form
$form = New-Object System.Windows.Forms.Form
$form.Text = "PostgreSQL Rollback Manager"
$form.Size = New-Object System.Drawing.Size(600, 800)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.Icon = [System.Drawing.SystemIcons]::Shield

# Create a status label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(20, 20)
$statusLabel.Size = New-Object System.Drawing.Size(560, 30)
$statusLabel.Text = "PostgreSQL Rollback Manager - Ready"
$statusLabel.Font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::DarkGreen
$form.Controls.Add($statusLabel)

# Function to update status
function Update-Status {
    param($message, $color = "DarkGreen")
    $statusLabel.Text = $message
    $statusLabel.ForeColor = [System.Drawing.Color]::$color
    $form.Refresh()
    Start-Sleep -Milliseconds 100
}

# Function to run batch file with progress
function Run-BatchFile {
    param($batchFile, $description)
    
    Update-Status "Running: $description..." "Blue"
    
    try {
        $process = Start-Process -FilePath $batchFile -Wait -PassThru -WindowStyle Hidden
        if ($process.ExitCode -eq 0) {
            Update-Status "✅ $description completed successfully!" "DarkGreen"
        } else {
            Update-Status "⚠️ $description completed with warnings" "Orange"
        }
    } catch {
        Update-Status "❌ Error running $description" "Red"
        [System.Windows.Forms.MessageBox]::Show("Error: $($_.Exception.Message)", "Error", "OK", "Error")
    }
}

# Emergency Rollback Section
$emergencyGroup = New-Object System.Windows.Forms.GroupBox
$emergencyGroup.Location = New-Object System.Drawing.Point(20, 70)
$emergencyGroup.Size = New-Object System.Drawing.Size(560, 150)
$emergencyGroup.Text = "🚨 EMERGENCY ROLLBACK"
$emergencyGroup.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$emergencyGroup.ForeColor = [System.Drawing.Color]::Red
$form.Controls.Add($emergencyGroup)

# Emergency rollback button
$emergencyButton = New-Object System.Windows.Forms.Button
$emergencyButton.Location = New-Object System.Drawing.Point(20, 30)
$emergencyButton.Size = New-Object System.Drawing.Size(520, 50)
$emergencyButton.Text = "🔄 EMERGENCY ROLLBACK - Point-in-Time Recovery"
$emergencyButton.Font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
$emergencyButton.BackColor = [System.Drawing.Color]::Red
$emergencyButton.ForeColor = [System.Drawing.Color]::White
$emergencyButton.Add_Click({
    $result = [System.Windows.Forms.MessageBox]::Show(
        "⚠️ This will start the Point-in-Time Recovery process.`n`nThis should only be used in emergencies when you need to rollback your database.`n`nContinue?", 
        "Emergency Rollback", 
        "YesNo", 
        "Warning"
    )
    if ($result -eq "Yes") {
        Start-Process -FilePath "point-in-time-recovery.bat" -WorkingDirectory (Get-Location)
    }
})
$emergencyGroup.Controls.Add($emergencyButton)

# Warning label
$warningLabel = New-Object System.Windows.Forms.Label
$warningLabel.Location = New-Object System.Drawing.Point(20, 90)
$warningLabel.Size = New-Object System.Drawing.Size(520, 40)
$warningLabel.Text = "⚠️ Emergency use only! This will stop PostgreSQL and restore from backup."
$warningLabel.Font = New-Object System.Drawing.Font("Arial", 9)
$warningLabel.ForeColor = [System.Drawing.Color]::DarkRed
$emergencyGroup.Controls.Add($warningLabel)

# Quick Actions Section
$quickGroup = New-Object System.Windows.Forms.GroupBox
$quickGroup.Location = New-Object System.Drawing.Point(20, 240)
$quickGroup.Size = New-Object System.Drawing.Size(560, 200)
$quickGroup.Text = "⚡ QUICK ACTIONS"
$quickGroup.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$quickGroup.ForeColor = [System.Drawing.Color]::DarkBlue
$form.Controls.Add($quickGroup)

# Check readiness button
$readinessButton = New-Object System.Windows.Forms.Button
$readinessButton.Location = New-Object System.Drawing.Point(20, 30)
$readinessButton.Size = New-Object System.Drawing.Size(250, 40)
$readinessButton.Text = "Check Rollback Readiness"
$readinessButton.BackColor = [System.Drawing.Color]::LightBlue
$readinessButton.Add_Click({
    Run-BatchFile "check-rollback-readiness.bat" "Rollback readiness check"
})
$quickGroup.Controls.Add($readinessButton)

# Manual backup button
$backupButton = New-Object System.Windows.Forms.Button
$backupButton.Location = New-Object System.Drawing.Point(290, 30)
$backupButton.Size = New-Object System.Drawing.Size(250, 40)
$backupButton.Text = "Take Backup Now"
$backupButton.BackColor = [System.Drawing.Color]::LightGreen
$backupButton.Add_Click({
    Run-BatchFile "manual-backup.bat" "Manual backup"
})
$quickGroup.Controls.Add($backupButton)

# Test rollback button
$testButton = New-Object System.Windows.Forms.Button
$testButton.Location = New-Object System.Drawing.Point(20, 80)
$testButton.Size = New-Object System.Drawing.Size(250, 40)
$testButton.Text = "Test Rollback Capabilities"
$backupButton.BackColor = [System.Drawing.Color]::LightYellow
$testButton.Add_Click({
    $result = [System.Windows.Forms.MessageBox]::Show(
        "This will run a comprehensive rollback test.`n`nIt will create test data, simulate problems, and verify recovery.`n`nContinue?", 
        "Test Rollback", 
        "YesNo", 
        "Question"
    )
    if ($result -eq "Yes") {
        Start-Process -FilePath "verify-rollback-capabilities.bat" -WorkingDirectory (Get-Location)
    }
})
$quickGroup.Controls.Add($testButton)

# Demo button
$demoButton = New-Object System.Windows.Forms.Button
$demoButton.Location = New-Object System.Drawing.Point(290, 80)
$demoButton.Size = New-Object System.Drawing.Size(250, 40)
$demoButton.Text = "📋 View Rollback Demo"
$demoButton.BackColor = [System.Drawing.Color]::LightCyan
$demoButton.Add_Click({
    Start-Process -FilePath "demo-rollback-capabilities.bat" -WorkingDirectory (Get-Location)
})
$quickGroup.Controls.Add($demoButton)

# System status button
$statusButton = New-Object System.Windows.Forms.Button
$statusButton.Location = New-Object System.Drawing.Point(155, 130)
$statusButton.Size = New-Object System.Drawing.Size(250, 40)
$statusButton.Text = "📊 Complete System Test"
$statusButton.BackColor = [System.Drawing.Color]::Lavender
$statusButton.Add_Click({
    Run-BatchFile "test-complete-system.bat" "Complete system test"
})
$quickGroup.Controls.Add($statusButton)

# Setup Section
$setupGroup = New-Object System.Windows.Forms.GroupBox
$setupGroup.Location = New-Object System.Drawing.Point(20, 460)
$setupGroup.Size = New-Object System.Drawing.Size(560, 200)
$setupGroup.Text = "⚙️ INITIAL SETUP (Run Once)"
$setupGroup.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$setupGroup.ForeColor = [System.Drawing.Color]::DarkGreen
$form.Controls.Add($setupGroup)

# Setup buttons
$setupButtons = @(
    @{Text="1. Create Database"; File="create-n8n-database.bat"; Color="LightGreen"},
    @{Text="2. Configure PITR"; File="configure-postgresql.bat"; Color="LightBlue"},
    @{Text="3. Schedule Backups"; File="setup-backup-schedule.bat"; Color="LightYellow"},
    @{Text="4. Security Hardening"; File="security-hardening.bat"; Color="LightCoral"}
)

$y = 30
foreach ($btn in $setupButtons) {
    $setupBtn = New-Object System.Windows.Forms.Button
    $setupBtn.Location = New-Object System.Drawing.Point(20, $y)
    $setupBtn.Size = New-Object System.Drawing.Size(520, 35)
    $setupBtn.Text = $btn.Text
    $setupBtn.BackColor = [System.Drawing.Color]::($btn.Color)
    $setupFile = $btn.File
    $setupBtn.Add_Click({
        Run-BatchFile $setupFile $this.Text
    }.GetNewClosure())
    $setupGroup.Controls.Add($setupBtn)
    $y += 40
}

# Information Section
$infoGroup = New-Object System.Windows.Forms.GroupBox
$infoGroup.Location = New-Object System.Drawing.Point(20, 680)
$infoGroup.Size = New-Object System.Drawing.Size(560, 80)
$infoGroup.Text = "ℹ️ INFORMATION"
$infoGroup.Font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($infoGroup)

# Info text
$infoText = New-Object System.Windows.Forms.Label
$infoText.Location = New-Object System.Drawing.Point(10, 20)
$infoText.Size = New-Object System.Drawing.Size(540, 50)
$infoText.Text = "🛡️ PostgreSQL Rollback Manager provides one-click access to Point-in-Time Recovery.`n⚡ Emergency rollback can restore your database to any previous moment in time."
$infoText.Font = New-Object System.Drawing.Font("Arial", 9)
$infoGroup.Controls.Add($infoText)

# Function to check if files exist and enable/disable buttons
function Check-FileAvailability {
    $files = @("point-in-time-recovery.bat", "check-rollback-readiness.bat", "manual-backup.bat", "verify-rollback-capabilities.bat")
    $missingFiles = @()
    
    foreach ($file in $files) {
        if (!(Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        Update-Status "⚠️ Missing files: $($missingFiles -join ', ')" "Orange"
        $emergencyButton.Enabled = $false
    } else {
        Update-Status "✅ All rollback files available - Ready for operations" "DarkGreen"
    }
}

# Check file availability on startup
Check-FileAvailability

# Show the form
$form.ShowDialog() | Out-Null
