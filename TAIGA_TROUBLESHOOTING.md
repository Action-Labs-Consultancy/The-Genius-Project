# Taiga Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker Desktop Not Running
**Symptoms:**
- Error: "The system cannot find the file specified"
- Commands fail with Docker connection errors

**Solutions:**
1. Start Docker Desktop manually:
   - Press Windows key, search "Docker Desktop"
   - Click the application to start it
   - Wait for the Docker icon in system tray to show "Docker Desktop is running"

2. Verify Docker is running:
   ```powershell
   docker info
   ```

### 2. Port Conflicts
**Symptoms:**
- Services fail to start
- "Port already in use" errors

**Default Ports Used:**
- 9000: Taiga Frontend
- 8000: Taiga Backend API  
- 5432: PostgreSQL Database
- 6379: Redis Cache
- 8888: WebSocket Events

**Solutions:**
1. Check what's using the ports:
   ```powershell
   netstat -ano | findstr ":9000"
   netstat -ano | findstr ":8000"
   ```

2. Stop conflicting services or modify docker-compose.taiga.yml ports

### 3. Container Startup Issues
**Symptoms:**
- Containers exit immediately
- Services showing as "unhealthy"

**Solutions:**
1. Check container logs:
   ```bash
   docker-compose -f docker-compose.taiga.yml logs taiga-back
   docker-compose -f docker-compose.taiga.yml logs taiga-front
   docker-compose -f docker-compose.taiga.yml logs taiga-db
   ```

2. Restart containers:
   ```bash
   docker-compose -f docker-compose.taiga.yml restart
   ```

3. Complete restart:
   ```bash
   docker-compose -f docker-compose.taiga.yml down
   docker-compose -f docker-compose.taiga.yml up -d
   ```

### 4. Database Connection Issues
**Symptoms:**
- Backend fails to connect to database
- Migration errors

**Solutions:**
1. Ensure database is healthy:
   ```bash
   docker-compose -f docker-compose.taiga.yml exec taiga-db pg_isready -U taiga
   ```

2. Reset database (⚠️ This will delete all data):
   ```bash
   docker-compose -f docker-compose.taiga.yml down -v
   docker-compose -f docker-compose.taiga.yml up -d
   ```

### 5. Frontend Loading Issues
**Symptoms:**
- Blank page at http://localhost:9000
- JavaScript console errors

**Solutions:**
1. Check if backend is accessible:
   ```
   http://localhost:8000/api/v1/
   ```

2. Clear browser cache and cookies

3. Check frontend container logs:
   ```bash
   docker-compose -f docker-compose.taiga.yml logs taiga-front
   ```

### 6. WebSocket Connection Issues  
**Symptoms:**
- Real-time updates not working
- Events not syncing

**Solutions:**
1. Verify events service is running:
   ```bash
   docker-compose -f docker-compose.taiga.yml ps taiga-events
   ```

2. Check WebSocket endpoint:
   ```
   ws://localhost:8888/events
   ```

### 7. Performance Issues
**Symptoms:**
- Slow loading
- High CPU/Memory usage

**Solutions:**
1. Increase Docker Desktop memory allocation:
   - Docker Desktop → Settings → Resources → Advanced
   - Set Memory to at least 4GB

2. Check container resource usage:
   ```bash
   docker stats
   ```

## Useful Commands

### Management Commands
```bash
# View all containers status
docker-compose -f docker-compose.taiga.yml ps

# Follow logs in real-time
docker-compose -f docker-compose.taiga.yml logs -f

# Restart specific service
docker-compose -f docker-compose.taiga.yml restart taiga-back

# Stop all services
docker-compose -f docker-compose.taiga.yml down

# Stop and remove volumes (⚠️ deletes data)
docker-compose -f docker-compose.taiga.yml down -v

# Update images and restart
docker-compose -f docker-compose.taiga.yml pull
docker-compose -f docker-compose.taiga.yml up -d
```

### Database Commands
```bash
# Access database directly
docker-compose -f docker-compose.taiga.yml exec taiga-db psql -U taiga -d taiga

# Backup database
docker-compose -f docker-compose.taiga.yml exec taiga-db pg_dump -U taiga taiga > taiga_backup.sql

# Restore database
docker-compose -f docker-compose.taiga.yml exec -T taiga-db psql -U taiga -d taiga < taiga_backup.sql
```

### Application Commands
```bash
# Create superuser
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py createsuperuser

# Run migrations
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py migrate

# Collect static files
docker-compose -f docker-compose.taiga.yml exec taiga-back python manage.py collectstatic --noinput
```

## Getting Help

### Log Locations
- Application logs: `docker-compose -f docker-compose.taiga.yml logs`
- Database logs: `docker-compose -f docker-compose.taiga.yml logs taiga-db`
- Browser console: F12 → Console tab

### Health Checks
1. **Backend Health**: http://localhost:8000/api/v1/
2. **Frontend**: http://localhost:9000  
3. **Database**: `docker-compose -f docker-compose.taiga.yml exec taiga-db pg_isready -U taiga`
4. **Events**: WebSocket connection to ws://localhost:8888

### System Requirements
- **OS**: Windows 10/11 with WSL2
- **Docker**: Desktop 4.0+ with 4GB+ RAM allocated
- **Disk**: 10GB+ free space
- **Ports**: 9000, 8000, 5432, 6379, 8888 available

### Support Resources
- [Taiga Documentation](https://docs.taiga.io/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Issues](https://github.com/taigaio/taiga-docker/issues)
