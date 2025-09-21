# 🔧 PostgreSQL Password Reset & Database Setup Guide

## 🚨 Issue: PostgreSQL Password Authentication Failed

Since we can't connect to PostgreSQL, we need to temporarily disable password authentication to set up the database.

## 📋 Step-by-Step Solution

### 1. Stop PostgreSQL Service
```powershell
Stop-Service -Name "postgresql-x64-17"
```

### 2. Edit PostgreSQL Configuration
- Open file: `C:\Program Files\PostgreSQL\17\data\pg_hba.conf`
- Find lines that look like:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
```

- Change `md5` to `trust`:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
# IPv6 local connections:
host    all             all             ::1/128                 trust
```

### 3. Start PostgreSQL Service
```powershell
Start-Service -Name "postgresql-x64-17"
```

### 4. Connect Without Password
```powershell
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres
```

### 5. Run Database Setup Commands
Once connected to psql, run:
```sql
-- Create the tables
\i C:\Users\PC\The-Genius-Project\create_tables.sql

-- Set a new password (replace 'your_new_password' with your choice)
ALTER USER postgres PASSWORD 'your_new_password';

-- Exit psql
\q
```

### 6. Restore Security Settings
- Edit `C:\Program Files\PostgreSQL\17\data\pg_hba.conf` again
- Change `trust` back to `md5`:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
```

### 7. Restart PostgreSQL Service
```powershell
Restart-Service -Name "postgresql-x64-17"
```

## 🎯 Quick PowerShell Script (Run as Administrator)

```powershell
# Stop PostgreSQL
Stop-Service -Name "postgresql-x64-17"

# Create backup of pg_hba.conf
Copy-Item "C:\Program Files\PostgreSQL\17\data\pg_hba.conf" "C:\Program Files\PostgreSQL\17\data\pg_hba.conf.backup"

# Read current config
$config = Get-Content "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"

# Replace md5 with trust for local connections
$newConfig = $config -replace "127\.0\.0\.1/32\s+md5", "127.0.0.1/32            trust"
$newConfig = $newConfig -replace "::1/128\s+md5", "::1/128                 trust"

# Write new config
$newConfig | Set-Content "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"

# Start PostgreSQL
Start-Service -Name "postgresql-x64-17"

Write-Host "✅ PostgreSQL configured for passwordless local access"
Write-Host "🔍 Now run: 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -d postgres"
Write-Host "📝 Then execute: \i C:\Users\PC\The-Genius-Project\create_tables.sql"
```

## 🔄 Alternative: Use pgAdmin

If you have pgAdmin installed:
1. Open pgAdmin
2. Connect to PostgreSQL server (may prompt for master password)
3. Right-click on "postgres" database → Query Tool
4. Copy and paste the contents of `create_tables.sql`
5. Execute the SQL

## ✅ Verification

After setup, verify tables exist:
```sql
-- Check tables
\dt dd_*

-- Check test data
SELECT * FROM dd_companies WHERE company_id = 'test_setup_001';
```

## 🎯 n8n Configuration

Once database is set up, configure n8n PostgreSQL credentials:
- **Host**: localhost
- **Port**: 5432
- **Database**: postgres
- **User**: postgres
- **Password**: [your new password]
- **SSL**: Disable

Then update both workflows:
- Replace `REPLACE_WITH_POSTGRES_CRED_ID` with your actual credential ID

## 🚀 Ready to Test!

After database setup:
1. Test Section 1: http://localhost:5678/workflow/IbkJEatTulMiGv9C
2. Import and test Master Workflow
3. The error "relation 'public.dd_sections' does not exist" should be resolved!

---

**📁 Files Created:**
- `create_tables.sql` - Database schema
- `DD_Section_01_Introduction.json` - Section 1 workflow (fixed)
- `DD_Master_Workflow.json` - Master workflow (fixed)
