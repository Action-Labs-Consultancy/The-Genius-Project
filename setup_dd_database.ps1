# Quick PostgreSQL Setup for Due Diligence System
# Run this script after PostgreSQL is installed

param(
    [string]$PostgreSQLPath = "C:\PostgreSQL\16\bin"
)

# Set environment variables
$env:PGPASSWORD = "duediligence123"
$env:PATH += ";$PostgreSQLPath"

Write-Host "🚀 Setting up Due Diligence Database..." -ForegroundColor Green

try {
    # Test connection
    Write-Host "Testing PostgreSQL connection..." -ForegroundColor Yellow
    & "$PostgreSQLPath\pg_isready.exe" -h localhost -p 5432

    # Create database if it doesn't exist
    Write-Host "Creating database 'due_diligence_db'..." -ForegroundColor Yellow
    & "$PostgreSQLPath\createdb.exe" -h localhost -p 5432 -U postgres due_diligence_db 2>$null

    # Run the schema file
    Write-Host "Creating tables and schema..." -ForegroundColor Yellow
    & "$PostgreSQLPath\psql.exe" -h localhost -p 5432 -U postgres -d due_diligence_db -f "dd_database_schema.sql"

    Write-Host "✅ Database setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 PostgreSQL Credentials for n8n:" -ForegroundColor Cyan
    Write-Host "   Host: localhost" -ForegroundColor White
    Write-Host "   Port: 5432" -ForegroundColor White
    Write-Host "   Database: due_diligence_db" -ForegroundColor White
    Write-Host "   Username: postgres" -ForegroundColor White
    Write-Host "   Password: duediligence123" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Connection String: postgresql://postgres:duediligence123@localhost:5432/due_diligence_db" -ForegroundColor Yellow
    
    # Test the schema
    Write-Host "Testing schema..." -ForegroundColor Yellow
    & "$PostgreSQLPath\psql.exe" -h localhost -p 5432 -U postgres -d due_diligence_db -c "\dt due_diligence_reports"
    & "$PostgreSQLPath\psql.exe" -h localhost -p 5432 -U postgres -d due_diligence_db -c "SELECT count(*) as table_ready FROM due_diligence_reports;"

} catch {
    Write-Host "❌ Error setting up database: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed and running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Copy the credentials above into n8n PostgreSQL connection" -ForegroundColor White
Write-Host "2. Import the Comprehensive_DD_System.json workflow into n8n" -ForegroundColor White
Write-Host "3. Update credential references in the workflow" -ForegroundColor White
Write-Host "4. Create a 'Due Diligence: Company Name' task in Kanboard" -ForegroundColor White
