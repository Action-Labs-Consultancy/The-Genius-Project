const { exec, spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

class RobustRollbackSystemLauncher {
    constructor() {
        this.services = {
            kanboard: { name: 'Kanboard', port: 8000, status: 'stopped', process: null },
            rollback: { name: 'Rollback Server', port: 3001, status: 'stopped', process: null },
            n8n: { name: 'n8n', port: 5678, status: 'stopped', process: null },
            backup: { name: 'Daily Backup', status: 'stopped', process: null }
        };
        
        this.config = {
            maxRetries: 3,
            retryDelay: 2000,
            healthCheckInterval: 30000,
            autoRestart: true
        };
        
        this.isShuttingDown = false;
    }

    // Start all services
    async startSystem() {
        console.log('🚀 Starting Robust Kanboard Rollback System');
        console.log('=' .repeat(60));
        
        try {
            // Start services in order
            await this.startKanboard();
            await this.waitForService('kanboard', 'http://localhost:8000');
            
            await this.startRollbackServer();
            await this.waitForService('rollback', 'http://localhost:3001/health');
            
            await this.startn8n();
            await this.waitForService('n8n', 'http://localhost:5678/rest/active');
            
            await this.startDailyBackupSystem();
            
            console.log('\n✅ All services started successfully!');
            console.log('🌐 System URLs:');
            console.log('   📋 Kanboard: http://localhost:8000');
            console.log('   🔄 Rollback Management: http://localhost:3001');
            console.log('   🤖 n8n Automation: http://localhost:5678');
            
            // Setup health monitoring
            this.setupHealthMonitoring();
            
            // Setup graceful shutdown
            this.setupGracefulShutdown();
            
            // Import n8n workflows
            await this.importn8nWorkflows();
            
            console.log('\n🎯 System is ready for use!');
            console.log('📊 Monitor system health at: http://localhost:3001/health');
            
        } catch (error) {
            console.error('❌ System startup failed:', error.message);
            await this.shutdownSystem();
            process.exit(1);
        }
    }

    // Start Kanboard Docker container
    async startKanboard() {
        console.log('📋 Starting Kanboard...');
        
        return new Promise((resolve, reject) => {
            const dockerCmd = 'docker-compose -f docker-compose.yml up -d kanboard';
            
            exec(dockerCmd, { cwd: __dirname }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Kanboard startup failed: ${error.message}`));
                    return;
                }
                
                this.services.kanboard.status = 'starting';
                console.log('   ✅ Kanboard container started');
                resolve();
            });
        });
    }

    // Start rollback server
    async startRollbackServer() {
        console.log('🔄 Starting Rollback Server...');
        
        return new Promise((resolve, reject) => {
            const serverPath = path.join(__dirname, 'robust-rollback-server.js');
            const process = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: __dirname
            });
            
            let output = '';
            let isStarted = false;
            
            process.stdout.on('data', (data) => {
                output += data.toString();
                console.log('   📄', data.toString().trim());
                
                if (data.toString().includes('System ready for production use') && !isStarted) {
                    isStarted = true;
                    this.services.rollback.status = 'running';
                    this.services.rollback.process = process;
                    console.log('   ✅ Rollback Server started');
                    resolve();
                }
            });
            
            process.stderr.on('data', (data) => {
                console.log('   ⚠️', data.toString().trim());
            });
            
            process.on('exit', (code) => {
                if (!isStarted) {
                    reject(new Error(`Rollback Server exited with code ${code}`));
                } else {
                    console.log('   ❌ Rollback Server stopped unexpectedly');
                    this.services.rollback.status = 'stopped';
                    this.services.rollback.process = null;
                    
                    if (this.config.autoRestart && !this.isShuttingDown) {
                        setTimeout(() => this.restartService('rollback'), this.config.retryDelay);
                    }
                }
            });
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (!isStarted) {
                    process.kill();
                    reject(new Error('Rollback Server startup timeout'));
                }
            }, 30000);
        });
    }

    // Start n8n
    async startn8n() {
        console.log('🤖 Starting n8n...');
        
        return new Promise((resolve, reject) => {
            const process = spawn('n8n', ['start'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });
            
            let output = '';
            let isStarted = false;
            
            process.stdout.on('data', (data) => {
                output += data.toString();
                console.log('   📄', data.toString().trim());
                
                if (data.toString().includes('n8n ready') && !isStarted) {
                    isStarted = true;
                    this.services.n8n.status = 'running';
                    this.services.n8n.process = process;
                    console.log('   ✅ n8n started');
                    resolve();
                }
            });
            
            process.stderr.on('data', (data) => {
                const errorText = data.toString();
                console.log('   ⚠️', errorText.trim());
                
                // n8n often outputs to stderr even for normal operation
                if (errorText.includes('n8n ready') && !isStarted) {
                    isStarted = true;
                    this.services.n8n.status = 'running';
                    this.services.n8n.process = process;
                    console.log('   ✅ n8n started');
                    resolve();
                }
            });
            
            process.on('exit', (code) => {
                if (!isStarted) {
                    reject(new Error(`n8n exited with code ${code}`));
                } else {
                    console.log('   ❌ n8n stopped unexpectedly');
                    this.services.n8n.status = 'stopped';
                    this.services.n8n.process = null;
                    
                    if (this.config.autoRestart && !this.isShuttingDown) {
                        setTimeout(() => this.restartService('n8n'), this.config.retryDelay);
                    }
                }
            });
            
            // Timeout after 45 seconds (n8n can take a while to start)
            setTimeout(() => {
                if (!isStarted) {
                    process.kill();
                    reject(new Error('n8n startup timeout'));
                }
            }, 45000);
        });
    }

    // Start daily backup system
    async startDailyBackupSystem() {
        console.log('📅 Starting Daily Backup System...');
        
        try {
            const DailyBackupSystem = require('./daily-backup-system');
            const backupSystem = new DailyBackupSystem();
            
            await backupSystem.initialize();
            this.services.backup.status = 'running';
            this.services.backup.process = backupSystem;
            
            console.log('   ✅ Daily Backup System started');
            
        } catch (error) {
            throw new Error(`Daily Backup System startup failed: ${error.message}`);
        }
    }

    // Wait for service to be ready
    async waitForService(serviceName, url) {
        console.log(`   ⏳ Waiting for ${this.services[serviceName].name} to be ready...`);
        
        for (let i = 0; i < this.config.maxRetries; i++) {
            try {
                await axios.get(url, { timeout: 5000 });
                this.services[serviceName].status = 'running';
                console.log(`   ✅ ${this.services[serviceName].name} is ready`);
                return;
            } catch (error) {
                console.log(`   ⏳ Attempt ${i + 1}/${this.config.maxRetries}: ${this.services[serviceName].name} not ready yet...`);
                
                if (i < this.config.maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                }
            }
        }
        
        throw new Error(`${this.services[serviceName].name} failed to start after ${this.config.maxRetries} attempts`);
    }

    // Import n8n workflows
    async importn8nWorkflows() {
        console.log('📤 Importing n8n workflows...');
        
        try {
            const workflowsDir = path.join(__dirname, 'workflows');
            const files = await fs.readdir(workflowsDir);
            const workflowFiles = files.filter(f => f.endsWith('.json'));
            
            for (const file of workflowFiles) {
                try {
                    const workflowData = JSON.parse(await fs.readFile(path.join(workflowsDir, file), 'utf8'));
                    
                    // Import workflow via n8n API
                    await axios.post('http://localhost:5678/rest/workflows', workflowData, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000
                    });
                    
                    console.log(`   ✅ Imported workflow: ${workflowData.name}`);
                    
                } catch (error) {
                    console.log(`   ⚠️ Failed to import workflow ${file}: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`   ⚠️ Workflow import failed: ${error.message}`);
        }
    }

    // Setup health monitoring
    setupHealthMonitoring() {
        console.log('🔍 Setting up health monitoring...');
        
        setInterval(async () => {
            try {
                const health = await axios.get('http://localhost:3001/health', { timeout: 5000 });
                
                if (health.data.status !== 'healthy') {
                    console.log('⚠️ System health warning:', health.data.status);
                }
                
                // Check individual services
                for (const [key, service] of Object.entries(health.data.services)) {
                    if (service.status === 'disconnected' && this.services[key]) {
                        console.log(`⚠️ Service ${key} is disconnected`);
                        
                        if (this.config.autoRestart) {
                            this.restartService(key);
                        }
                    }
                }
                
            } catch (error) {
                console.log('⚠️ Health check failed:', error.message);
            }
        }, this.config.healthCheckInterval);
    }

    // Restart service
    async restartService(serviceName) {
        console.log(`🔄 Restarting ${this.services[serviceName].name}...`);
        
        try {
            // Stop service if running
            if (this.services[serviceName].process) {
                this.services[serviceName].process.kill();
                this.services[serviceName].process = null;
            }
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Restart based on service type
            switch (serviceName) {
                case 'rollback':
                    await this.startRollbackServer();
                    break;
                case 'n8n':
                    await this.startn8n();
                    break;
                case 'kanboard':
                    await this.startKanboard();
                    break;
                default:
                    console.log(`   ⚠️ Don't know how to restart ${serviceName}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to restart ${serviceName}:`, error.message);
        }
    }

    // Setup graceful shutdown
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            this.isShuttingDown = true;
            await this.shutdownSystem();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGHUP', () => shutdown('SIGHUP'));
    }

    // Shutdown all services
    async shutdownSystem() {
        console.log('🛑 Shutting down Robust Rollback System...');
        
        // Stop Node.js processes
        for (const [name, service] of Object.entries(this.services)) {
            if (service.process && typeof service.process.kill === 'function') {
                console.log(`   🛑 Stopping ${service.name}...`);
                service.process.kill('SIGTERM');
                service.status = 'stopped';
            }
        }
        
        // Stop Docker containers
        try {
            await new Promise((resolve) => {
                exec('docker-compose -f docker-compose.yml down', { cwd: __dirname }, () => {
                    console.log('   🛑 Stopped Docker containers');
                    resolve();
                });
            });
        } catch (error) {
            console.log('   ⚠️ Docker cleanup failed:', error.message);
        }
        
        console.log('✅ System shutdown complete');
    }

    // Get system status
    getSystemStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            services: {}
        };
        
        for (const [key, service] of Object.entries(this.services)) {
            status.services[key] = {
                name: service.name,
                status: service.status,
                port: service.port || null,
                process: service.process ? 'running' : 'stopped'
            };
        }
        
        return status;
    }
}

// CLI interface
if (require.main === module) {
    const launcher = new RobustRollbackSystemLauncher();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            launcher.startSystem().catch(console.error);
            break;
            
        case 'stop':
            launcher.shutdownSystem().then(() => process.exit(0));
            break;
            
        case 'status':
            console.log(JSON.stringify(launcher.getSystemStatus(), null, 2));
            break;
            
        case 'test':
            const RobustRollbackSystemTest = require('./test-robust-system');
            const tester = new RobustRollbackSystemTest();
            tester.runAllTests().catch(console.error);
            break;
            
        default:
            console.log('🔄 Robust Kanboard Rollback System Launcher');
            console.log('');
            console.log('Usage:');
            console.log('  node launch-system.js start   - Start all services');
            console.log('  node launch-system.js stop    - Stop all services');
            console.log('  node launch-system.js status  - Show system status');
            console.log('  node launch-system.js test    - Run system tests');
            console.log('');
            console.log('Services included:');
            console.log('  📋 Kanboard (Docker) - Task management');
            console.log('  🔄 Rollback Server - Version control & restoration');
            console.log('  🤖 n8n - Workflow automation');
            console.log('  📅 Daily Backup - Automated system backups');
    }
}

module.exports = RobustRollbackSystemLauncher;
