# Taiga Project Management Setup Guide

## 🎯 CURRENT STATUS
✅ Official Taiga Docker repository cloned successfully  
✅ Environment file (.env) configured correctly  
✅ Docker Desktop is being restarted  
⏳ Ready to launch Taiga containers  

## 🚀 NEXT STEPS

### Option 1: Wait for Docker & Auto-Launch (Recommended)
1. **Wait 2-3 minutes** for Docker Desktop to fully start
2. **Run this command** from the Taiga directory:
   ```cmd
   cd C:\Users\PC\taiga-docker && docker-compose up -d
   ```
3. **Wait 2-3 minutes** for containers to initialize
4. **Access Taiga** at: http://localhost:9000

### Option 2: Manual Setup Commands
```cmd
# Navigate to Taiga directory
cd C:\Users\PC\taiga-docker

# Verify Docker is ready
docker --version
docker ps

# Start Taiga services
docker-compose up -d

# Check container status
docker-compose ps

# View logs (if needed)
docker-compose logs taiga-back
```

## 📋 ENVIRONMENT CONFIGURATION
Your .env file is already configured with:
- **URL**: http://localhost:9000
- **Database**: PostgreSQL with user 'taiga'
- **Message Queue**: RabbitMQ for real-time features
- **Secret Key**: Custom generated key for security

## 🔧 MANAGEMENT COMMANDS

### Start Taiga
```cmd
cd C:\Users\PC\taiga-docker
docker-compose up -d
```

### Stop Taiga
```cmd
cd C:\Users\PC\taiga-docker
docker-compose down
```

### View Logs
```cmd
cd C:\Users\PC\taiga-docker
docker-compose logs -f taiga-back
```

### Check Status
```cmd
cd C:\Users\PC\taiga-docker
docker-compose ps
```

## 🌐 ACCESS INFORMATION
- **Frontend URL**: http://localhost:9000
- **Admin Panel**: First user to register becomes admin
- **Default Features**: Project management, Kanban boards, Sprints, Issues

## 🔍 TROUBLESHOOTING

### If Port 9000 is busy:
```cmd
# Stop your Flask app first
netstat -ano | findstr :9000
# Kill the process using the port
```

### If containers fail to start:
```cmd
# Check Docker status
docker --version
docker ps

# Restart Docker Desktop
# Kill Docker processes and restart application
```

### If database issues occur:
```cmd
# Reset database
cd C:\Users\PC\taiga-docker
docker-compose down -v
docker-compose up -d
```

## ✨ FEATURES INCLUDED
- 📊 **Project Dashboards**: Visual project overview
- 📋 **Kanban Boards**: Drag-and-drop task management  
- 🏃 **Sprint Planning**: Agile methodology support
- 🐛 **Issue Tracking**: Bug and task management
- 👥 **Team Collaboration**: User roles and permissions
- 📈 **Reporting**: Progress tracking and analytics
- 🔔 **Real-time Updates**: Live notifications via WebSocket

## 🎉 SUCCESS INDICATORS
When setup is complete, you should see:
1. All containers running: `docker-compose ps`
2. Taiga accessible at: http://localhost:9000
3. Registration page for first admin user
4. Clean, modern project management interface

---
**Note**: This is the official Taiga setup, which is more stable and feature-complete than our custom Docker configuration.
