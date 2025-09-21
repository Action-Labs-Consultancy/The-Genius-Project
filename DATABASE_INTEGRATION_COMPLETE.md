# 🛡️ PostgreSQL Database Integration Setup Guide

## Overview
This integration adds PostgreSQL rollback and database management functionality directly to your running n8n (port 5678) and Kanboard (port 8000) interfaces.

## ✅ Completed Setup

### 1. Backend API Server
- **Status**: ✅ Created and Running
- **File**: `backend-api-server.js`
- **Port**: 10000
- **Endpoints**: 
  - `/health` - Health check
  - `/api/database/status` - Database status
  - `/api/database/backup` - Create backup
  - `/api/database/rollback` - Point-in-time recovery
  - `/api/database/recovery` - Restore from backup
  - `/api/database/backups` - List backups

### 2. Browser Integrations
- **n8n Integration**: ✅ `n8n-database-integration.user.js`
- **Kanboard Integration**: ✅ `kanboard-database-integration.user.js`

## 🚀 Installation Steps

### Step 1: Start API Server
The API server is already running on port 10000. If you need to restart it:
```bash
cd "c:\Users\PC\The-Genius-Project"
node backend-api-server.js
```

### Step 2: Install Browser Userscripts

#### Option A: Direct Installation
1. Install a userscript manager browser extension:
   - **Chrome/Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - **Firefox**: [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)

2. Install the userscripts:
   - Open `n8n-database-integration.user.js` in your text editor
   - Copy the entire content
   - Open Tampermonkey dashboard → Create new script → Paste content → Save
   - Repeat for `kanboard-database-integration.user.js`

#### Option B: Direct File Install
1. In Tampermonkey dashboard → Utilities tab
2. Import from file → Select `n8n-database-integration.user.js`
3. Import from file → Select `kanboard-database-integration.user.js`

### Step 3: Access Your Applications
1. **n8n**: Navigate to http://localhost:5678
   - Look for the new "🛡️ Database" button in the navbar
   
2. **Kanboard**: Navigate to http://localhost:8000
   - Look for the floating "🛡️" button in the bottom-right corner

## 🎯 Features Available

### n8n Interface Integration
- **Navbar Button**: Database management button with real-time status indicator
- **Emergency Rollback**: Point-in-time recovery with safety confirmations
- **Quick Backup**: One-click database backup
- **Status Monitoring**: Real-time database health display
- **Backup Management**: View and restore from available backups

### Kanboard Interface Integration
- **Floating Button**: Always-accessible database management
- **Full Modal Interface**: Complete database management center
- **Emergency Features**: Quick access to rollback functionality
- **Status Dashboard**: Comprehensive database health overview

## 🔧 Configuration

### Environment Variables (Optional)
Create a `.env` file in the project directory:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=n8n_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
BACKUP_DIR=C:\PostgreSQL_Backups
API_PORT=10000
```

### Database Configuration
The system is configured for:
- **Database**: PostgreSQL
- **Default DB**: n8n_db
- **Host**: localhost:5432
- **Backup Directory**: C:\PostgreSQL_Backups

## 🧪 Testing

### Verify Installation
1. Open the test page: `database-integration-test.html`
2. Check that "API Server is running and healthy" shows green
3. Test the API endpoints using the test buttons

### Test n8n Integration
1. Navigate to http://localhost:5678
2. Look for "🛡️ Database" button in navbar
3. Click to open dropdown with database options
4. Green status indicator = healthy database

### Test Kanboard Integration
1. Navigate to http://localhost:8000
2. Look for floating "🛡️" button in bottom-right
3. Click to open database management modal
4. Test backup and status features

## ⚠️ Safety Features

### Emergency Rollback Protection
- **Double Confirmation**: Requires checkbox confirmation
- **Timestamp Validation**: Prevents invalid rollback times
- **Backup Verification**: Shows available backup files
- **Progress Indicators**: Visual feedback during operations

### Database Safety
- **Status Monitoring**: Continuous health checks
- **Error Handling**: Graceful failure with user notifications
- **Connection Validation**: Verifies PostgreSQL connectivity
- **Backup Validation**: Confirms backup integrity

## 🔍 Troubleshooting

### API Server Issues
- Check if server is running: `netstat -an | findstr :10000`
- Restart server: `node backend-api-server.js`
- Check logs for error messages

### Userscript Issues
- Verify Tampermonkey is enabled for the site
- Check browser console for JavaScript errors
- Ensure userscript matches the correct URL pattern

### Database Issues
- Verify PostgreSQL service is running
- Check database connection credentials
- Ensure backup directory exists and is writable

## 📊 API Endpoints Reference

### GET /health
Health check endpoint
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "Database Management API"
}
```

### GET /api/database/status
Database status check
```json
{
  "status": "healthy",
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "n8n_db",
    "size": "15 MB"
  }
}
```

### POST /api/database/backup
Create database backup
```json
{
  "success": true,
  "message": "Backup created successfully",
  "filename": "backup_20240101_120000.sql"
}
```

### POST /api/database/rollback
Point-in-time recovery
```json
{
  "timestamp": "2024-01-01T11:00:00.000Z"
}
```

### POST /api/database/recovery
Restore from backup
```json
{
  "backupFile": "backup_20240101_120000.sql"
}
```

### GET /api/database/backups
List available backups
```json
{
  "backups": [
    {
      "filename": "backup_20240101_120000.sql",
      "size": "2.5 MB",
      "created": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

## 🎉 Success!

Your PostgreSQL database management integration is now fully installed and ready to use. You have:

✅ **Direct Integration** - Database controls embedded in your actual n8n and Kanboard interfaces  
✅ **Emergency Rollback** - Point-in-time recovery with safety features  
✅ **Backup Management** - Create, view, and restore database backups  
✅ **Real-time Monitoring** - Live database status and health indicators  
✅ **Safety Features** - Confirmations and validation for destructive operations  

Navigate to your n8n (localhost:5678) or Kanboard (localhost:8000) interfaces to see the new database management features!
