# Taiga Local Setup Guide

## Overview
This guide will help you set up Taiga project management tool locally on your Windows machine using Docker.

## Prerequisites
- Docker Desktop for Windows
- Git
- At least 4GB RAM available
- 10GB free disk space

## Architecture
Taiga consists of three main components:
1. **taiga-back** - Django REST API backend
2. **taiga-front** - Angular frontend
3. **taiga-events** - WebSocket server for real-time events
4. **PostgreSQL** - Database
5. **Redis** - Cache and message broker

## Quick Start
```powershell
# Clone this repository
cd c:\Users\PC\The-Genius-Project

# Start Taiga stack
docker-compose -f docker-compose.taiga.yml up -d

# Access Taiga at: http://localhost:9000
# Default admin credentials:
# Username: admin
# Password: 123123
```

## Features
- ✅ Complete project management (Kanban, Scrum)
- ✅ User stories and sprint planning
- ✅ Issue tracking and bug management
- ✅ Wiki and documentation
- ✅ Time tracking
- ✅ Real-time collaboration
- ✅ Custom fields and workflows
- ✅ API integration ready

## Configuration
- Frontend: http://localhost:9000
- Backend API: http://localhost:8000
- Database: PostgreSQL on port 5432
- Redis: Port 6379
- WebSocket Events: Port 8888

## Default Users
After setup, you can create additional users or use:
- **Admin**: admin / 123123
- **Demo User**: user / 123123

## Volume Persistence
All data is persisted in Docker volumes:
- taiga_db_data - PostgreSQL data
- taiga_media - User uploads and media
- taiga_static - Static files

## Customization
You can customize Taiga by:
1. Modifying environment variables in docker-compose.taiga.yml
2. Adding custom themes
3. Configuring LDAP/SSO integration
4. Setting up email notifications

## Troubleshooting
If you encounter issues:
1. Check Docker Desktop is running
2. Ensure ports 9000, 8000, 5432, 6379, 8888 are available
3. Run: `docker-compose -f docker-compose.taiga.yml logs`
4. Restart with: `docker-compose -f docker-compose.taiga.yml restart`

## Integration with The Genius Project
Taiga can be integrated with your existing project management workflows and used alongside your current tools.
