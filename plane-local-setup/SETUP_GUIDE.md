# 🚀 Step-by-Step Setup Instructions

## Complete Plane PM Local Setup

### 1. Prerequisites Check

**Before starting, ensure you have:**
- Docker Desktop for Windows (installed and running)
- At least 4GB free disk space
- Ports 3001, 4000, 5433, 6380, 8000, 15673 available

### 2. Quick Setup (Recommended)

```powershell
# Navigate to the setup directory
cd "C:\Users\PC\The-Genius-Project\plane-local-setup"

# Run the setup script
powershell -ExecutionPolicy Bypass -File setup-plane.ps1
```

### 3. Manual Setup (Alternative)

If you prefer to run commands manually:

```powershell
# 1. Navigate to setup directory
cd "C:\Users\PC\The-Genius-Project\plane-local-setup"

# 2. Pull images
docker-compose pull

# 3. Start services
docker-compose up -d

# 4. Check status
docker-compose ps
```

### 4. Verify Installation

After setup completes (2-3 minutes), verify these URLs work:

- **Main App**: http://localhost:3001
- **API Health**: http://localhost:8000/api/health/
- **RabbitMQ Management**: http://localhost:15673

### 5. First Login

1. Open http://localhost:3001
2. Use these credentials:
   - **Email**: admin@plane.local
   - **Password**: admin123

### 6. Integration with Your Dashboard

Your dashboard is already configured! Click the **"📋 Plane Projects"** button in the sidebar to open Plane.

## 🔧 Management Commands

### Daily Operations
```powershell
# Start Plane
docker-compose up -d

# Stop Plane  
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Maintenance
```powershell
# Update to latest version
docker-compose pull
docker-compose up -d

# Backup database
docker exec plane-postgres pg_dump -U plane_user plane_db > backup.sql

# Clean restart (if issues occur)
docker-compose down
docker-compose up -d
```

## 🌐 Network Configuration

All services run on isolated Docker network:
- **Database**: Internal only (not exposed)
- **Redis**: Internal only (not exposed)  
- **RabbitMQ**: Internal + Management UI on 15673
- **Frontend**: Exposed on 3001
- **API**: Exposed on 8000
- **Space**: Exposed on 4000

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Your App      │
│  localhost:3001 │    │ localhost:3000  │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                     │
    ┌─────────────────────────────────┐
    │        Docker Network          │
    │  ┌─────────┐  ┌─────────────┐  │
    │  │   API   │  │   Worker    │  │
    │  │  :8000  │  │  (celery)   │  │
    │  └─────────┘  └─────────────┘  │
    │  ┌─────────┐  ┌─────────────┐  │
    │  │PostgreSQL│  │   Redis     │  │
    │  │  :5432  │  │   :6379     │  │
    │  └─────────┘  └─────────────┘  │
    │  ┌─────────────────────────────┐│
    │  │       RabbitMQ :5672        ││
    │  └─────────────────────────────┘│
    └─────────────────────────────────┘
```

## 🔒 Security Features

- **Isolated Environment**: All data stays on your machine
- **No External Calls**: Zero internet dependencies after setup
- **Local Authentication**: Custom admin account
- **Secure Defaults**: Production-ready configurations adapted for local use

## 🆘 Troubleshooting

### Common Issues:

**Port Conflicts:**
```powershell
# Check what's using ports
netstat -an | findstr :3001
netstat -an | findstr :8000
```

**Services Not Starting:**
```powershell
# Check Docker Desktop is running
docker --version

# View service logs
docker-compose logs plane-frontend
docker-compose logs plane-backend
```

**Database Issues:**
```powershell
# Restart database
docker-compose restart plane-db

# Check database health
docker exec plane-postgres pg_isready -U plane_user
```

### Reset Everything:
```powershell
# Stop and remove all data (CAUTION: Deletes all projects!)
docker-compose down -v
docker-compose up -d
```

## ✅ Success Checklist

- [ ] Docker Desktop is running
- [ ] All containers are healthy: `docker-compose ps`
- [ ] Frontend loads: http://localhost:3001
- [ ] Can login with admin@plane.local / admin123
- [ ] Dashboard button opens Plane correctly
- [ ] Can create a test project in Plane

**🎉 You now have a fully self-hosted Plane PM instance running locally!**
