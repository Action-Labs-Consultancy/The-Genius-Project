# Complete PostgreSQL Setup Guide for n8n with Point-in-Time Recovery

## 🎯 Overview
This comprehensive guide provides a complete PostgreSQL setup for n8n with Point-in-Time Recovery (PITR) capabilities, automated backups, security hardening, and production-ready configuration on Windows.

## 📁 Files Created
This guide includes 10 essential files for complete PostgreSQL deployment:

1. **postgresql-n8n-setup.md** - Main installation guide
2. **create-n8n-database.bat** - Database and user creation
3. **n8n.env** - Environment configuration for n8n
4. **postgresql-config.txt** - PITR configuration settings
5. **configure-postgresql.bat** - Apply PITR configuration
6. **manual-backup.bat** - Manual backup execution
7. **automated-backup.bat** - Daily automated backup script
8. **point-in-time-recovery.bat** - Complete recovery procedure
9. **setup-backup-schedule.bat** - Windows Task Scheduler setup
10. **security-hardening.bat** - Production security configuration
11. **test-complete-system.bat** - Comprehensive system testing

## 🚀 Quick Start Guide

### Step 1: Install PostgreSQL
```bash
# Download and install PostgreSQL 14+ from official website
# https://www.postgresql.org/download/windows/
# Remember the postgres user password during installation
```

### Step 2: Run Setup Scripts (in order)
```bash
# 1. Create database and user
create-n8n-database.bat

# 2. Configure PITR
configure-postgresql.bat

# 3. Set up automated backups
setup-backup-schedule.bat

# 4. Apply security hardening
security-hardening.bat

# 5. Test complete system
test-complete-system.bat
```

### Step 3: Configure n8n
```bash
# Copy n8n.env contents to your n8n environment
# Start n8n with PostgreSQL connection
```

## 🔧 Detailed Setup Process

### Database Configuration
- **Database Name**: n8n_db
- **User**: n8n_user
- **Password**: n8n_secure_password_2024 (change in production)
- **Encoding**: UTF8
- **Locale**: C

### Point-in-Time Recovery Features
- ✅ WAL archiving enabled
- ✅ Continuous backup streaming
- ✅ Recovery to any point in time
- ✅ Transaction-level recovery precision
- ✅ Automated cleanup of old WAL files

### Backup Strategy
- **Frequency**: Daily at 2:00 AM
- **Retention**: 7 days for full backups
- **WAL Retention**: 2 days
- **Backup Types**: 
  - Physical backup (pg_basebackup)
  - Logical backup (pg_dump)
  - Compressed archives for space efficiency

### Security Features
- ✅ SCRAM-SHA-256 password encryption
- ✅ SSL/TLS encryption
- ✅ Network access restrictions
- ✅ Comprehensive logging
- ✅ Connection limits
- ✅ Authentication hardening

## 📊 System Requirements

### Minimum Requirements
- Windows 10/11 or Windows Server 2016+
- 4GB RAM (8GB recommended)
- 20GB free disk space
- PostgreSQL 12+ (14+ recommended)

### Recommended Production Setup
- 16GB+ RAM
- SSD storage for data directory
- Separate drive for WAL archives
- Network backup destination
- Monitoring and alerting system

## 🔄 Recovery Procedures

### Point-in-Time Recovery
```bash
# Run the recovery script
point-in-time-recovery.bat

# Follow prompts to:
# 1. Select backup to restore from
# 2. Choose recovery target (latest, specific time, or transaction)
# 3. Automatic recovery process execution
```

### Manual Backup
```bash
# Take immediate backup
manual-backup.bat

# Or run scheduled backup manually
run-backup-now.bat
```

## 📈 Monitoring and Maintenance

### Regular Monitoring
```bash
# Check system status
check-system-status.bat

# Monitor security
monitor-security.bat

# Review logs
# Check: C:\Program Files\PostgreSQL\14\data\log\
```

### Maintenance Tasks
- **Daily**: Automated backups via scheduled task
- **Weekly**: Review backup logs and disk usage
- **Monthly**: Test recovery procedures
- **Quarterly**: Security audit and password rotation

## 🔒 Security Best Practices

### Authentication
- Strong passwords with regular rotation
- SCRAM-SHA-256 encryption
- Limited user privileges
- Connection source restrictions

### Network Security
- Firewall rules for PostgreSQL port
- SSL/TLS for all connections
- VPN for remote access
- Regular security updates

### Data Protection
- Encrypted backups
- Secure backup storage
- Access logging and monitoring
- Regular security audits

## 🛠️ Troubleshooting

### Common Issues
1. **PostgreSQL won't start**: Check logs in data/log directory
2. **Connection refused**: Verify firewall and pg_hba.conf settings
3. **Backup fails**: Check disk space and permissions
4. **Recovery fails**: Verify WAL files and backup integrity

### Log Locations
- **PostgreSQL Logs**: `C:\Program Files\PostgreSQL\14\data\log\`
- **Backup Logs**: `C:\PostgreSQL\backups\automated_backup.log`
- **Recovery Logs**: `C:\PostgreSQL\recovery\recovery.log`

### Performance Tuning
- Monitor connection usage
- Optimize shared_buffers setting
- Configure work_mem appropriately
- Regular VACUUM and ANALYZE

## 🔄 Backup and Recovery Workflow

### Backup Process
1. **Continuous WAL Archiving**: Real-time transaction log backup
2. **Daily Base Backup**: Complete database snapshot
3. **Compression**: Automatic backup compression
4. **Cleanup**: Automatic old backup removal
5. **Verification**: Backup integrity checking

### Recovery Process
1. **Stop PostgreSQL**: Safe service shutdown
2. **Backup Current Data**: Safety copy of current state
3. **Restore Base Backup**: Extract and restore backup
4. **Apply WAL Files**: Replay transactions to target time
5. **Promote Database**: Bring database online
6. **Verify Integrity**: Test database functionality

## 📝 Configuration Files

### postgresql.conf Key Settings
```ini
# PITR Configuration
archive_mode = on
archive_command = 'copy "%p" "C:\\PostgreSQL\\wal_archives\\%f"'
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB

# Security Settings
ssl = on
password_encryption = scram-sha-256
max_connections = 50

# Performance Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
```

### pg_hba.conf Security
```ini
# Secure authentication
local   all             postgres                                peer
host    n8n_db          n8n_user        127.0.0.1/32            scram-sha-256
host    n8n_db          n8n_user        192.168.1.0/24          scram-sha-256
host    all             all             0.0.0.0/0               reject
```

## 🎯 Production Deployment Checklist

### Pre-Deployment
- [ ] Install PostgreSQL with secure configuration
- [ ] Create dedicated n8n database and user
- [ ] Configure PITR and WAL archiving
- [ ] Set up automated backup schedule
- [ ] Apply security hardening
- [ ] Test backup and recovery procedures

### Post-Deployment
- [ ] Monitor system performance
- [ ] Verify backup execution
- [ ] Test database connectivity
- [ ] Configure monitoring alerts
- [ ] Document access procedures
- [ ] Train team on recovery procedures

### Ongoing Maintenance
- [ ] Regular backup verification
- [ ] Security updates and patches
- [ ] Performance monitoring
- [ ] Disk space management
- [ ] Log rotation and cleanup
- [ ] Disaster recovery testing

## 🚨 Emergency Procedures

### Database Corruption
1. Stop n8n immediately
2. Run point-in-time-recovery.bat
3. Choose recovery point before corruption
4. Verify data integrity
5. Restart n8n with recovered database

### Hardware Failure
1. Prepare new PostgreSQL server
2. Install PostgreSQL with same version
3. Restore latest backup
4. Apply WAL files if available
5. Update n8n connection configuration

### Security Breach
1. Immediately change all passwords
2. Review access logs
3. Update firewall rules
4. Rotate SSL certificates
5. Audit user permissions

## 📞 Support and Resources

### Documentation
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [n8n Database Configuration](https://docs.n8n.io/hosting/configuration/database/)
- [Point-in-Time Recovery Guide](https://www.postgresql.org/docs/current/continuous-archiving.html)

### Useful Commands
```bash
# Check PostgreSQL status
sc query postgresql-x64-14

# Connect to database
psql -U n8n_user -d n8n_db

# Check database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('n8n_db'));"

# View active connections
psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

## 🎉 Conclusion

This comprehensive PostgreSQL setup provides:
- **Enterprise-grade reliability** with PITR capabilities
- **Automated backup and recovery** procedures
- **Production-ready security** configuration
- **Monitoring and maintenance** tools
- **Complete documentation** and procedures

Your n8n instance now has a robust, scalable, and secure database foundation that can handle production workloads while providing point-in-time recovery capabilities for ultimate data protection.

---

**⚠️ Important Notes:**
- Test all procedures in a development environment first
- Customize passwords and network settings for your environment
- Regular backup testing is essential for disaster recovery readiness
- Keep this documentation updated with any configuration changes
