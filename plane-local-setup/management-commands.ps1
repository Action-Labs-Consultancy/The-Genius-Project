# Plane PM Management Commands

# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f plane-frontend
docker-compose logs -f plane-backend
docker-compose logs -f plane-db

# Check service status
docker-compose ps

# Update to latest images
docker-compose pull
docker-compose up -d

# Backup database
docker exec plane-postgres pg_dump -U plane_user plane_db > plane_backup_$(Get-Date -Format "yyyy-MM-dd_HH-mm-ss").sql

# Restore database (replace with your backup file)
# docker exec -i plane-postgres psql -U plane_user -d plane_db < your_backup.sql

# Access database directly
docker exec -it plane-postgres psql -U plane_user -d plane_db

# Access Redis CLI
docker exec -it plane-redis redis-cli

# Clean up everything (WARNING: This will delete all data)
# docker-compose down -v
# docker system prune -a
