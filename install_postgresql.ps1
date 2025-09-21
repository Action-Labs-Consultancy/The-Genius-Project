# PostgreSQL Installation and Setup Script
# Run this in PowerShell as Administrator

# Download PostgreSQL installer
Write-Host "Downloading PostgreSQL 16..."
$url = "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe"
$output = "$env:TEMP\postgresql-installer.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# Install PostgreSQL silently
Write-Host "Installing PostgreSQL..."
Start-Process -FilePath $output -ArgumentList "--mode unattended --superpassword duediligence123 --servicepassword duediligence123 --servicename postgresql --prefix C:\PostgreSQL\16 --datadir C:\PostgreSQL\16\data --port 5432" -Wait

# Add PostgreSQL to PATH
$env:PATH += ";C:\PostgreSQL\16\bin"
[Environment]::SetEnvironmentVariable("PATH", $env:PATH, [EnvironmentVariableTarget]::Machine)

Write-Host "PostgreSQL installed successfully!"
Write-Host "Credentials:"
Write-Host "  Host: localhost"
Write-Host "  Port: 5432"
Write-Host "  Username: postgres"
Write-Host "  Password: duediligence123"
Write-Host "  Database: due_diligence_db (will be created)"

# Create the database and schema
Write-Host "Creating database and schema..."
$env:PGPASSWORD = "duediligence123"

# Wait a bit for service to start
Start-Sleep -Seconds 10

# Create database
& "C:\PostgreSQL\16\bin\createdb.exe" -h localhost -p 5432 -U postgres due_diligence_db

Write-Host "Setup complete! Database 'due_diligence_db' created."
Write-Host "You can now run the schema file: dd_database_schema.sql"
