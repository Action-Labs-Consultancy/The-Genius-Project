const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const zlib = require('zlib');
const { promisify } = require('util');

// Compress with gzip
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class DailyBackupSystem {
    constructor(config = {}) {
        this.config = {
            kanboardUrl: config.kanboardUrl || 'http://localhost:8000/jsonrpc.php',
            username: config.username || 'admin',
            password: config.password || 'admin',
            backupDir: config.backupDir || path.join(__dirname, 'daily-backups'),
            retentionDays: config.retentionDays || 7,
            compressionLevel: config.compressionLevel || 6,
            scheduleHour: config.scheduleHour || 2, // 2 AM
            rollbackServerUrl: config.rollbackServerUrl || 'http://localhost:3001'
        };
        
        this.isRunning = false;
        this.lastBackup = null;
        this.stats = {
            totalBackups: 0,
            totalSize: 0,
            avgCompressionRatio: 0
        };
    }

    // Initialize backup system
    async initialize() {
        try {
            await fs.mkdir(this.config.backupDir, { recursive: true });
            await this.loadStats();
            this.scheduleBackups();
            console.log('📅 Daily backup system initialized');
            return true;
        } catch (error) {
            console.error('❌ Backup system initialization failed:', error.message);
            return false;
        }
    }

    // Call Kanboard API
    async callKanboardAPI(method, params = {}) {
        try {
            const payload = {
                jsonrpc: '2.0',
                method: method,
                id: Date.now(),
                params: params
            };
            
            const response = await axios.post(this.config.kanboardUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: this.config.username,
                    password: this.config.password
                },
                timeout: 30000
            });
            
            if (response.data.error) {
                throw new Error(`Kanboard API Error: ${response.data.error.message}`);
            }
            
            return response.data.result;
        } catch (error) {
            throw new Error(`Failed to call Kanboard API: ${error.message}`);
        }
    }

    // Create comprehensive system backup
    async createDailyBackup() {
        if (this.isRunning) {
            console.log('⏸️ Backup already in progress, skipping...');
            return null;
        }

        this.isRunning = true;
        const startTime = Date.now();
        const backupId = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
        
        try {
            console.log('🚀 Starting daily backup creation...');
            
            // Get all projects
            const projects = await this.callKanboardAPI('getAllProjects');
            console.log(`📂 Found ${projects.length} projects`);
            
            const backupData = {
                metadata: {
                    backupId: backupId,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    type: 'full_system_backup',
                    creator: 'daily_backup_system'
                },
                projects: [],
                statistics: {
                    totalProjects: 0,
                    totalTasks: 0,
                    totalUsers: 0,
                    totalCategories: 0
                }
            };

            // Backup each project comprehensively
            for (const project of projects) {
                const projectData = await this.backupProject(project.id);
                backupData.projects.push(projectData);
                
                backupData.statistics.totalTasks += projectData.tasks.length;
                console.log(`✅ Backed up project: ${project.name} (${projectData.tasks.length} tasks)`);
            }

            // Backup global data
            backupData.users = await this.callKanboardAPI('getAllUsers').catch(() => []);
            backupData.categories = await this.callKanboardAPI('getAllCategories').catch(() => []);
            
            // Update statistics
            backupData.statistics.totalProjects = projects.length;
            backupData.statistics.totalUsers = backupData.users.length;
            backupData.statistics.totalCategories = backupData.categories.length;

            // Compress and save backup
            const jsonData = JSON.stringify(backupData, null, 2);
            const originalSize = Buffer.byteLength(jsonData, 'utf8');
            const compressedData = await gzip(jsonData, { level: this.config.compressionLevel });
            const compressedSize = compressedData.length;
            
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
            
            const backupFileName = `${backupId}.json.gz`;
            const backupPath = path.join(this.config.backupDir, backupFileName);
            await fs.writeFile(backupPath, compressedData);

            // Update stats
            this.stats.totalBackups++;
            this.stats.totalSize += compressedSize;
            this.stats.avgCompressionRatio = (this.stats.avgCompressionRatio + parseFloat(compressionRatio)) / 2;
            this.lastBackup = new Date().toISOString();

            // Save stats
            await this.saveStats();

            // Cleanup old backups
            await this.cleanupOldBackups();

            const duration = Date.now() - startTime;
            console.log(`✅ Daily backup completed: ${backupId}`);
            console.log(`📊 Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📦 Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`🗜️ Compression ratio: ${compressionRatio}%`);
            console.log(`⏱️ Duration: ${duration}ms`);

            // Notify rollback server
            await this.notifyRollbackServer({
                type: 'daily_backup_completed',
                backupId: backupId,
                timestamp: new Date().toISOString(),
                stats: {
                    duration: duration,
                    originalSize: originalSize,
                    compressedSize: compressedSize,
                    compressionRatio: compressionRatio,
                    totalTasks: backupData.statistics.totalTasks,
                    totalProjects: backupData.statistics.totalProjects
                }
            });

            return {
                backupId: backupId,
                path: backupPath,
                stats: {
                    duration: duration,
                    originalSize: originalSize,
                    compressedSize: compressedSize,
                    compressionRatio: compressionRatio
                },
                data: backupData.statistics
            };

        } catch (error) {
            console.error('❌ Daily backup failed:', error.message);
            
            // Notify rollback server of failure
            await this.notifyRollbackServer({
                type: 'daily_backup_failed',
                error: error.message,
                timestamp: new Date().toISOString()
            }).catch(() => {}); // Don't fail if notification fails

            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    // Backup single project comprehensively
    async backupProject(projectId) {
        const [project, tasks, columns, swimlanes, categories] = await Promise.all([
            this.callKanboardAPI('getProjectById', { project_id: projectId }),
            this.callKanboardAPI('getAllTasks', { project_id: projectId }),
            this.callKanboardAPI('getColumns', { project_id: projectId }),
            this.callKanboardAPI('getAllSwimlanes', { project_id: projectId }),
            this.callKanboardAPI('getCategories', { project_id: projectId })
        ]);

        // Get task metadata for each task
        const tasksWithMetadata = [];
        for (const task of tasks) {
            try {
                const [comments, files, links, tags] = await Promise.all([
                    this.callKanboardAPI('getAllComments', { task_id: task.id }).catch(() => []),
                    this.callKanboardAPI('getAllTaskFiles', { task_id: task.id }).catch(() => []),
                    this.callKanboardAPI('getAllTaskLinks', { task_id: task.id }).catch(() => []),
                    this.callKanboardAPI('getTaskTags', { task_id: task.id }).catch(() => [])
                ]);

                tasksWithMetadata.push({
                    ...task,
                    metadata: {
                        comments: comments,
                        files: files,
                        links: links,
                        tags: tags
                    }
                });
            } catch (error) {
                console.warn(`⚠️ Failed to get metadata for task ${task.id}:`, error.message);
                tasksWithMetadata.push(task);
            }
        }

        return {
            project: project,
            tasks: tasksWithMetadata,
            columns: columns,
            swimlanes: swimlanes,
            categories: categories
        };
    }

    // Restore from backup
    async restoreFromBackup(backupId) {
        try {
            console.log(`🔄 Starting restore from backup: ${backupId}`);
            
            const backupPath = path.join(this.config.backupDir, `${backupId}.json.gz`);
            const compressedData = await fs.readFile(backupPath);
            const jsonData = await gunzip(compressedData);
            const backupData = JSON.parse(jsonData.toString());

            console.log(`📋 Backup contains ${backupData.statistics.totalProjects} projects and ${backupData.statistics.totalTasks} tasks`);

            // This is a complex operation that would need careful implementation
            // For safety, we'll provide the backup data structure but not automatically restore
            console.log('⚠️ Full system restore requires manual intervention to prevent data loss');
            
            return {
                success: true,
                message: 'Backup loaded successfully - manual restore required',
                backupData: backupData,
                stats: backupData.statistics
            };

        } catch (error) {
            console.error('❌ Restore failed:', error.message);
            throw error;
        }
    }

    // Get available backups
    async getAvailableBackups() {
        try {
            const files = await fs.readdir(this.config.backupDir);
            const backupFiles = files.filter(f => f.endsWith('.json.gz'));
            
            const backups = [];
            for (const file of backupFiles) {
                try {
                    const stats = await fs.stat(path.join(this.config.backupDir, file));
                    const backupId = file.replace('.json.gz', '');
                    
                    backups.push({
                        backupId: backupId,
                        filename: file,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    });
                } catch (error) {
                    console.warn(`⚠️ Failed to get stats for backup file: ${file}`);
                }
            }

            // Sort by creation date (newest first)
            backups.sort((a, b) => new Date(b.created) - new Date(a.created));

            return backups;
        } catch (error) {
            console.error('❌ Failed to get available backups:', error.message);
            return [];
        }
    }

    // Cleanup old backups
    async cleanupOldBackups() {
        try {
            const backups = await this.getAvailableBackups();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

            let deletedCount = 0;
            for (const backup of backups) {
                if (new Date(backup.created) < cutoffDate) {
                    const backupPath = path.join(this.config.backupDir, backup.filename);
                    await fs.unlink(backupPath);
                    deletedCount++;
                    console.log(`🗑️ Deleted old backup: ${backup.backupId}`);
                }
            }

            if (deletedCount > 0) {
                console.log(`🧹 Cleaned up ${deletedCount} old backups`);
            }

        } catch (error) {
            console.error('❌ Backup cleanup failed:', error.message);
        }
    }

    // Schedule automatic backups
    scheduleBackups() {
        const now = new Date();
        const scheduled = new Date();
        scheduled.setHours(this.config.scheduleHour, 0, 0, 0);
        
        // If scheduled time has passed today, schedule for tomorrow
        if (scheduled <= now) {
            scheduled.setDate(scheduled.getDate() + 1);
        }

        const timeUntilBackup = scheduled.getTime() - now.getTime();
        
        console.log(`⏰ Next backup scheduled for: ${scheduled.toLocaleString()}`);
        
        setTimeout(() => {
            this.createDailyBackup().catch(console.error);
            
            // Schedule recurring backups every 24 hours
            setInterval(() => {
                this.createDailyBackup().catch(console.error);
            }, 24 * 60 * 60 * 1000);
            
        }, timeUntilBackup);
    }

    // Load stats from disk
    async loadStats() {
        try {
            const statsPath = path.join(this.config.backupDir, 'backup-stats.json');
            const statsData = await fs.readFile(statsPath, 'utf8');
            this.stats = JSON.parse(statsData);
        } catch (error) {
            // File doesn't exist or is invalid, use defaults
            this.stats = {
                totalBackups: 0,
                totalSize: 0,
                avgCompressionRatio: 0
            };
        }
    }

    // Save stats to disk
    async saveStats() {
        try {
            const statsPath = path.join(this.config.backupDir, 'backup-stats.json');
            await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('❌ Failed to save backup stats:', error.message);
        }
    }

    // Notify rollback server
    async notifyRollbackServer(event) {
        try {
            await axios.post(`${this.config.rollbackServerUrl}/api/backup/notification`, event, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });
        } catch (error) {
            console.warn('⚠️ Failed to notify rollback server:', error.message);
        }
    }

    // Get system status
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastBackup: this.lastBackup,
            stats: this.stats,
            config: {
                retentionDays: this.config.retentionDays,
                scheduleHour: this.config.scheduleHour,
                backupDir: this.config.backupDir
            }
        };
    }
}

module.exports = DailyBackupSystem;
