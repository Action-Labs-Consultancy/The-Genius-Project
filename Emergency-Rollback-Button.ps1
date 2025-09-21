# Emergency Rollback - Single Click GUI
# Simplified one-button emergency rollback interface

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create the main form
$form = New-Object System.Windows.Forms.Form
$form.Text = "🚨 EMERGENCY ROLLBACK"
$form.Size = New-Object System.Drawing.Size(500, 400)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::Black
$form.Icon = [System.Drawing.SystemIcons]::Warning

# Title label
$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Location = New-Object System.Drawing.Point(50, 20)
$titleLabel.Size = New-Object System.Drawing.Size(400, 50)
$titleLabel.Text = "🚨 EMERGENCY DATABASE ROLLBACK"
$titleLabel.Font = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = [System.Drawing.Color]::Red
$titleLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($titleLabel)

# Status label
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(50, 80)
$statusLabel.Size = New-Object System.Drawing.Size(400, 60)
$statusLabel.Text = "Use this button when you need to rollback your PostgreSQL database to a previous point in time."
$statusLabel.Font = New-Object System.Drawing.Font("Arial", 11)
$statusLabel.ForeColor = [System.Drawing.Color]::White
$statusLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($statusLabel)

# Big emergency button
$emergencyButton = New-Object System.Windows.Forms.Button
$emergencyButton.Location = New-Object System.Drawing.Point(75, 160)
$emergencyButton.Size = New-Object System.Drawing.Size(350, 100)
$emergencyButton.Text = "🔄 START EMERGENCY ROLLBACK"
$emergencyButton.Font = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
$emergencyButton.BackColor = [System.Drawing.Color]::Red
$emergencyButton.ForeColor = [System.Drawing.Color]::White
$emergencyButton.FlatStyle = "Flat"
$emergencyButton.Add_Click({
    # Double confirmation for safety
    $result1 = [System.Windows.Forms.MessageBox]::Show(
        "⚠️ EMERGENCY ROLLBACK WARNING ⚠️`n`nThis will:`n• Stop PostgreSQL service`n• Restore database from backup`n• Rollback to a previous point in time`n`nAre you sure you want to continue?", 
        "Emergency Rollback - First Confirmation", 
        "YesNo", 
        "Warning"
    )
    
    if ($result1 -eq "Yes") {
        $result2 = [System.Windows.Forms.MessageBox]::Show(
            "🔥 FINAL CONFIRMATION 🔥`n`nThis action cannot be undone easily.`n`nYou will lose all database changes after the rollback point.`n`nProceed with emergency rollback?", 
            "Emergency Rollback - Final Confirmation", 
            "YesNo", 
            "Stop"
        )
        
        if ($result2 -eq "Yes") {
            # Update button to show action
            $emergencyButton.Text = "🔄 STARTING ROLLBACK..."
            $emergencyButton.BackColor = [System.Drawing.Color]::Orange
            $emergencyButton.Enabled = $false
            $form.Refresh()
            
            # Launch rollback process
            try {
                Start-Process -FilePath "point-in-time-recovery.bat" -WorkingDirectory (Get-Location)
                
                # Show success message
                [System.Windows.Forms.MessageBox]::Show(
                    "✅ Emergency rollback process started!`n`nThe Point-in-Time Recovery wizard is now running.`n`nFollow the on-screen instructions to complete the rollback.", 
                    "Rollback Started", 
                    "OK", 
                    "Information"
                )
                
                # Close the emergency GUI
                $form.Close()
                
            } catch {
                [System.Windows.Forms.MessageBox]::Show(
                    "❌ Error starting rollback process:`n`n$($_.Exception.Message)`n`nPlease run point-in-time-recovery.bat manually.", 
                    "Error", 
                    "OK", 
                    "Error"
                )
                
                # Reset button
                $emergencyButton.Text = "🔄 START EMERGENCY ROLLBACK"
                $emergencyButton.BackColor = [System.Drawing.Color]::Red
                $emergencyButton.Enabled = $true
            }
        }
    }
})
$form.Controls.Add($emergencyButton)

# Info label
$infoLabel = New-Object System.Windows.Forms.Label
$infoLabel.Location = New-Object System.Drawing.Point(50, 280)
$infoLabel.Size = New-Object System.Drawing.Size(400, 60)
$infoLabel.Text = "ℹ️ This will launch the Point-in-Time Recovery wizard.`nYou'll be able to choose exactly when to rollback to."
$infoLabel.Font = New-Object System.Drawing.Font("Arial", 10)
$infoLabel.ForeColor = [System.Drawing.Color]::LightGray
$infoLabel.TextAlign = "MiddleCenter"
$form.Controls.Add($infoLabel)

# Cancel button
$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Location = New-Object System.Drawing.Point(200, 320)
$cancelButton.Size = New-Object System.Drawing.Size(100, 30)
$cancelButton.Text = "Cancel"
$cancelButton.BackColor = [System.Drawing.Color]::Gray
$cancelButton.ForeColor = [System.Drawing.Color]::White
$cancelButton.Add_Click({
    $form.Close()
})
$form.Controls.Add($cancelButton)

# Check if rollback script exists
if (!(Test-Path "point-in-time-recovery.bat")) {
    $emergencyButton.Enabled = $false
    $emergencyButton.Text = "❌ ROLLBACK SCRIPT NOT FOUND"
    $emergencyButton.BackColor = [System.Drawing.Color]::DarkRed
    $statusLabel.Text = "Error: point-in-time-recovery.bat not found in current directory!"
    $statusLabel.ForeColor = [System.Drawing.Color]::Red
}

# Show the form
$form.ShowDialog() | Out-Null
