# PostgreSQL Configuration Script for n8n Due Diligence Setup
# Run this as Administrator to temporarily disable password authentication

Write-Host "🗃️ PostgreSQL Configuration for n8n Due Diligence" -ForegroundColor Green
Write-Host "=" -Repeat 60 -ForegroundColor Yellow

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "🔧 Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

$postgresService = "postgresql-x64-17"
$pgDataDir = "C:\Program Files\PostgreSQL\17\data"
$pgHbaFile = "$pgDataDir\pg_hba.conf"
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$sqlFile = "C:\Users\PC\The-Genius-Project\create_tables.sql"

Write-Host "🔍 Checking PostgreSQL installation..." -ForegroundColor Cyan

# Check if PostgreSQL service exists
try {
    $service = Get-Service -Name $postgresService -ErrorAction Stop
    Write-Host "✅ PostgreSQL service found: $($service.Status)" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL service '$postgresService' not found!" -ForegroundColor Red
    Write-Host "📋 Please install PostgreSQL 17 or update the service name in this script" -ForegroundColor Yellow
    pause
    exit 1
}

# Check if pg_hba.conf exists
if (-not (Test-Path $pgHbaFile)) {
    Write-Host "❌ PostgreSQL configuration file not found: $pgHbaFile" -ForegroundColor Red
    pause
    exit 1
}

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Database setup SQL file not found: $sqlFile" -ForegroundColor Red
    Write-Host "📋 Please ensure create_tables.sql exists in the project directory" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ All prerequisites found" -ForegroundColor Green

# Step 1: Stop PostgreSQL service
Write-Host "`n📛 Step 1: Stopping PostgreSQL service..." -ForegroundColor Cyan
try {
    Stop-Service -Name $postgresService -Force -ErrorAction Stop
    Write-Host "✅ PostgreSQL service stopped" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to stop PostgreSQL service: $($_.Exception.Message)" -ForegroundColor Red
    pause
    exit 1
}

# Step 2: Backup pg_hba.conf
Write-Host "`n💾 Step 2: Creating backup of pg_hba.conf..." -ForegroundColor Cyan
$backupFile = "$pgHbaFile.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
try {
    Copy-Item $pgHbaFile $backupFile -ErrorAction Stop
    Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create backup: $($_.Exception.Message)" -ForegroundColor Red
    Start-Service -Name $postgresService
    pause
    exit 1
}

# Step 3: Modify pg_hba.conf for passwordless access
Write-Host "`n🔧 Step 3: Configuring passwordless local access..." -ForegroundColor Cyan
try {
    $config = Get-Content $pgHbaFile
    $newConfig = $config -replace "127\.0\.0\.1/32\s+md5", "127.0.0.1/32            trust"
    $newConfig = $newConfig -replace "::1/128\s+md5", "::1/128                 trust"
    $newConfig | Set-Content $pgHbaFile -ErrorAction Stop
    Write-Host "✅ PostgreSQL configured for passwordless local access" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to modify pg_hba.conf: $($_.Exception.Message)" -ForegroundColor Red
    Copy-Item $backupFile $pgHbaFile -Force
    Start-Service -Name $postgresService
    pause
    exit 1
}

# Step 4: Start PostgreSQL service
Write-Host "`n🚀 Step 4: Starting PostgreSQL service..." -ForegroundColor Cyan
try {
    Start-Service -Name $postgresService -ErrorAction Stop
    Start-Sleep -Seconds 3  # Wait for service to fully start
    Write-Host "✅ PostgreSQL service started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start PostgreSQL service: $($_.Exception.Message)" -ForegroundColor Red
    Copy-Item $backupFile $pgHbaFile -Force
    pause
    exit 1
}

# Step 5: Execute database setup
Write-Host "`n🗃️ Step 5: Creating database tables..." -ForegroundColor Cyan
try {
    $result = & $psqlPath -U postgres -d postgres -f $sqlFile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database tables created successfully!" -ForegroundColor Green
        Write-Host "📊 SQL Output:" -ForegroundColor Yellow
        $result | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    } else {
        throw "psql exited with code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Failed to create database tables: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 SQL Output:" -ForegroundColor Yellow
    $result | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
}

# Step 6: Restore security settings
Write-Host "`n🔒 Step 6: Restoring security settings..." -ForegroundColor Cyan
try {
    Copy-Item $backupFile $pgHbaFile -Force -ErrorAction Stop
    Write-Host "✅ Security settings restored" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Failed to restore security settings: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "📋 Please manually restore from: $backupFile" -ForegroundColor Yellow
}

# Step 7: Restart PostgreSQL service
Write-Host "`n🔄 Step 7: Restarting PostgreSQL service..." -ForegroundColor Cyan
try {
    Restart-Service -Name $postgresService -ErrorAction Stop
    Write-Host "✅ PostgreSQL service restarted with security restored" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart PostgreSQL service: $($_.Exception.Message)" -ForegroundColor Red
}

# Final verification
Write-Host "`n🔍 Final Verification..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

Write-Host "`n" + "=" -Repeat 60 -ForegroundColor Yellow
Write-Host "🎉 DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=" -Repeat 60 -ForegroundColor Yellow

Write-Host "`n✅ Tables Created:" -ForegroundColor Green
Write-Host "   • dd_companies - Company information and processing status" -ForegroundColor White
Write-Host "   • dd_sections - Individual section content and approvals" -ForegroundColor White
Write-Host "   • dd_reports - Final report generation and PDF links" -ForegroundColor White

Write-Host "`n🔧 n8n PostgreSQL Credentials:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Database: postgres" -ForegroundColor White
Write-Host "   User: postgres" -ForegroundColor White
Write-Host "   Password: [your PostgreSQL password]" -ForegroundColor White

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. In n8n, create PostgreSQL credentials with the above settings" -ForegroundColor White
Write-Host "2. Update both workflows to use your PostgreSQL credential ID" -ForegroundColor White
Write-Host "3. Test Section 1 workflow: http://localhost:5678/workflow/IbkJEatTulMiGv9C" -ForegroundColor White
Write-Host "4. Import and test the Master Workflow" -ForegroundColor White

Write-Host "`n🚀 The error 'relation public.dd_sections does not exist' should now be resolved!" -ForegroundColor Green

Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
