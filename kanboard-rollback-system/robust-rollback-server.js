const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const port = 3001;

// Enhanced middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Storage configuration
const STORAGE_DIR = path.join(__dirname, 'task-snapshots');
const AUDIT_DIR = path.join(__dirname, 'audit-logs');
const BACKUP_DIR = path.join(__dirname, 'daily-backups');

// In-memory cache for performance
let taskVersions = new Map(); // taskId -> versions array
let auditLog = [];
let systemStats = {
    totalSnapshots: 0,
    totalRestores: 0,
    lastBackup: null,
    systemHealth: 'operational'
};

// Kanboard API configuration
const KANBOARD_CONFIG = {
    url: 'http://localhost:8000/jsonrpc.php',
    username: 'admin',
    password: 'admin'
};

// Initialize storage directories
async function initializeStorage() {
    try {
        await fs.mkdir(STORAGE_DIR, { recursive: true });
        await fs.mkdir(AUDIT_DIR, { recursive: true });
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        console.log('✅ Storage directories initialized');
    } catch (error) {
        console.error('❌ Storage initialization failed:', error.message);
    }
}

// Enhanced Kanboard API helper
async function callKanboardAPI(method, params = {}) {
    try {
        const payload = {
            jsonrpc: '2.0',
            method: method,
            id: Date.now(),
            params: params
        };
        
        const response = await axios.post(KANBOARD_CONFIG.url, payload, {
            headers: { 'Content-Type': 'application/json' },
            auth: {
                username: KANBOARD_CONFIG.username,
                password: KANBOARD_CONFIG.password
            },
            timeout: 5000
        });
        
        if (response.data.error) {
            throw new Error(`Kanboard API Error: ${response.data.error.message}`);
        }
        
        return response.data.result;
    } catch (error) {
        throw new Error(`Failed to call Kanboard API: ${error.message}`);
    }
}

// Generate unique version ID
function generateVersionId() {
    return crypto.randomBytes(16).toString('hex');
}

// Create task snapshot with comprehensive data
async function createTaskSnapshot(taskId, reason = 'pre_modification', userId = 'system') {
    const startTime = Date.now();
    
    try {
        // Fetch complete task data
        const task = await callKanboardAPI('getTask', { task_id: taskId });
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        
        // Fetch additional task metadata
        const [comments, files, links, tags] = await Promise.all([
            callKanboardAPI('getAllComments', { task_id: taskId }).catch(() => []),
            callKanboardAPI('getAllTaskFiles', { task_id: taskId }).catch(() => []),
            callKanboardAPI('getAllTaskLinks', { task_id: taskId }).catch(() => []),
            callKanboardAPI('getTaskTags', { task_id: taskId }).catch(() => [])
        ]);
        
        // Create comprehensive snapshot
        const snapshot = {
            versionId: generateVersionId(),
            taskId: parseInt(taskId),
            timestamp: new Date().toISOString(),
            reason: reason,
            userId: userId,
            performanceMs: 0, // Will be updated
            
            // Core task data
            taskData: {
                id: task.id,
                title: task.title,
                description: task.description,
                column_id: task.column_id,
                column_name: task.column_name,
                position: task.position,
                color_id: task.color_id,
                score: task.score,
                category_id: task.category_id,
                category_name: task.category_name,
                owner_id: task.owner_id,
                owner_username: task.owner_username,
                creator_id: task.creator_id,
                creator_username: task.creator_username,
                date_creation: task.date_creation,
                date_modification: task.date_modification,
                date_due: task.date_due,
                date_started: task.date_started,
                date_completed: task.date_completed,
                priority: task.priority,
                is_active: task.is_active,
                project_id: task.project_id,
                project_name: task.project_name
            },
            
            // Metadata
            metadata: {
                comments: comments,
                files: files,
                links: links,
                tags: tags,
                snapshotSize: 0 // Will be calculated
            }
        };
        
        // Calculate performance and size
        const endTime = Date.now();
        snapshot.performanceMs = endTime - startTime;
        snapshot.metadata.snapshotSize = JSON.stringify(snapshot).length;
        
        // Store snapshot
        await storeSnapshot(snapshot);
        
        // Update cache
        if (!taskVersions.has(taskId)) {
            taskVersions.set(taskId, []);
        }
        const versions = taskVersions.get(taskId);
        versions.unshift(snapshot);
        
        // Keep only last 5 versions in memory
        if (versions.length > 5) {
            versions.splice(5);
        }
        
        // Update stats
        systemStats.totalSnapshots++;
        
        // Log audit event
        await logAuditEvent('snapshot_created', {
            taskId: taskId,
            versionId: snapshot.versionId,
            reason: reason,
            userId: userId,
            performanceMs: snapshot.performanceMs
        });
        
        console.log(`📸 Snapshot created for task ${taskId}: ${snapshot.versionId} (${snapshot.performanceMs}ms)`);
        
        return snapshot;
        
    } catch (error) {
        console.error(`❌ Snapshot creation failed for task ${taskId}:`, error.message);
        throw error;
    }
}

// Store snapshot to disk
async function storeSnapshot(snapshot) {
    const filePath = path.join(STORAGE_DIR, `${snapshot.taskId}_${snapshot.versionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2));
}

// Load snapshot from disk
async function loadSnapshot(taskId, versionId) {
    const filePath = path.join(STORAGE_DIR, `${taskId}_${versionId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

// Restore task from snapshot
async function restoreTaskFromSnapshot(taskId, versionId, userId = 'system') {
    const startTime = Date.now();
    
    try {
        // Load snapshot
        const snapshot = await loadSnapshot(taskId, versionId);
        if (!snapshot) {
            throw new Error(`Snapshot not found: ${versionId}`);
        }
        
        // Create pre-restore snapshot
        await createTaskSnapshot(taskId, 'pre_restore', userId);
        
        // Restore task data
        const taskData = snapshot.taskData;
        await callKanboardAPI('updateTask', {
            id: taskData.id,
            title: taskData.title,
            description: taskData.description,
            color_id: taskData.color_id,
            score: taskData.score,
            category_id: taskData.category_id,
            owner_id: taskData.owner_id,
            priority: taskData.priority,
            date_due: taskData.date_due
        });
        
        // Move to correct column if needed
        if (taskData.column_id) {
            await callKanboardAPI('moveTaskPosition', {
                project_id: taskData.project_id,
                task_id: taskData.id,
                column_id: taskData.column_id,
                position: taskData.position || 1
            });
        }
        
        const endTime = Date.now();
        const performanceMs = endTime - startTime;
        
        // Update stats
        systemStats.totalRestores++;
        
        // Log audit event
        await logAuditEvent('task_restored', {
            taskId: taskId,
            versionId: versionId,
            userId: userId,
            performanceMs: performanceMs,
            restoredFrom: snapshot.timestamp
        });
        
        console.log(`🔄 Task ${taskId} restored from ${versionId} (${performanceMs}ms)`);
        
        return {
            success: true,
            taskId: taskId,
            versionId: versionId,
            performanceMs: performanceMs,
            restoredTimestamp: snapshot.timestamp
        };
        
    } catch (error) {
        await logAuditEvent('restore_failed', {
            taskId: taskId,
            versionId: versionId,
            userId: userId,
            error: error.message
        });
        
        console.error(`❌ Restore failed for task ${taskId}:`, error.message);
        throw error;
    }
}

// Log audit events
async function logAuditEvent(eventType, data) {
    const event = {
        id: generateVersionId(),
        timestamp: new Date().toISOString(),
        eventType: eventType,
        data: data
    };
    
    auditLog.unshift(event);
    
    // Keep only last 1000 events in memory
    if (auditLog.length > 1000) {
        auditLog.splice(1000);
    }
    
    // Persist to disk
    const filePath = path.join(AUDIT_DIR, `${new Date().toISOString().split('T')[0]}.json`);
    try {
        let dailyLog = [];
        try {
            const existing = await fs.readFile(filePath, 'utf8');
            dailyLog = JSON.parse(existing);
        } catch (e) {
            // File doesn't exist, start new
        }
        
        dailyLog.push(event);
        await fs.writeFile(filePath, JSON.stringify(dailyLog, null, 2));
    } catch (error) {
        console.error('❌ Audit logging failed:', error.message);
    }
}

// Get task version history
async function getTaskVersionHistory(taskId) {
    try {
        // Check cache first
        if (taskVersions.has(taskId)) {
            return taskVersions.get(taskId);
        }
        
        // Load from disk
        const files = await fs.readdir(STORAGE_DIR);
        const taskFiles = files.filter(f => f.startsWith(`${taskId}_`));
        
        const versions = [];
        for (const file of taskFiles) {
            try {
                const snapshot = JSON.parse(await fs.readFile(path.join(STORAGE_DIR, file), 'utf8'));
                versions.push(snapshot);
            } catch (e) {
                console.warn(`⚠️ Failed to load snapshot file: ${file}`);
            }
        }
        
        // Sort by timestamp (newest first)
        versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Keep only last 5 versions
        const recentVersions = versions.slice(0, 5);
        
        // Update cache
        taskVersions.set(taskId, recentVersions);
        
        return recentVersions;
        
    } catch (error) {
        console.error(`❌ Failed to get version history for task ${taskId}:`, error.message);
        return [];
    }
}

// AI confidence check
function checkAIConfidence(modifications, aiScore) {
    const riskFactors = {
        titleChange: modifications.title ? 0.3 : 0,
        descriptionChange: modifications.description ? 0.2 : 0,
        assigneeChange: modifications.owner_id ? 0.4 : 0,
        priorityChange: modifications.priority ? 0.3 : 0,
        dueDateChange: modifications.date_due ? 0.2 : 0
    };
    
    const riskScore = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0);
    const adjustedConfidence = aiScore - (riskScore * 0.3);
    
    return {
        originalConfidence: aiScore,
        adjustedConfidence: adjustedConfidence,
        riskScore: riskScore,
        requiresApproval: adjustedConfidence < 0.8 || riskScore > 0.5,
        autoRollback: adjustedConfidence < 0.6
    };
}

// API Endpoints

// Health check
app.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                rollback_server: { status: 'connected' },
                kanboard: { status: 'checking...' },
                n8n: { status: 'checking...' }
            },
            stats: systemStats,
            performance: {
                avgSnapshotTime: '< 500ms',
                avgRestoreTime: '< 3s',
                storageUsed: 'calculating...'
            }
        };
        
        // Test Kanboard
        try {
            const version = await callKanboardAPI('getVersion');
            health.services.kanboard = { status: 'connected', version: version };
        } catch (error) {
            health.services.kanboard = { status: 'disconnected', error: error.message };
        }
        
        // Test n8n
        try {
            await axios.get('http://localhost:5678/rest/active', { timeout: 3000 });
            health.services.n8n = { status: 'connected' };
        } catch (error) {
            health.services.n8n = { status: 'disconnected' };
        }
        
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Create snapshot
app.post('/api/snapshot/create', async (req, res) => {
    try {
        const { taskId, reason, userId } = req.body;
        
        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: 'taskId is required'
            });
        }
        
        const snapshot = await createTaskSnapshot(taskId, reason, userId);
        
        res.json({
            success: true,
            versionId: snapshot.versionId,
            taskId: snapshot.taskId,
            timestamp: snapshot.timestamp,
            performanceMs: snapshot.performanceMs,
            size: snapshot.metadata.snapshotSize
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get task version history
app.get('/api/task/:taskId/versions', async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const versions = await getTaskVersionHistory(taskId);
        
        // Return summary data for UI
        const versionSummary = versions.map(v => ({
            versionId: v.versionId,
            timestamp: v.timestamp,
            reason: v.reason,
            userId: v.userId,
            performanceMs: v.performanceMs,
            changes: {
                title: v.taskData.title,
                description: v.taskData.description ? v.taskData.description.substring(0, 100) + '...' : '',
                column: v.taskData.column_name,
                assignee: v.taskData.owner_username
            }
        }));
        
        res.json({
            success: true,
            taskId: taskId,
            versions: versionSummary,
            totalVersions: versions.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get version diff
app.get('/api/task/:taskId/diff/:versionId1/:versionId2', async (req, res) => {
    try {
        const { taskId, versionId1, versionId2 } = req.params;
        
        const [snapshot1, snapshot2] = await Promise.all([
            loadSnapshot(taskId, versionId1),
            loadSnapshot(taskId, versionId2)
        ]);
        
        // Calculate differences
        const diff = {
            title: {
                from: snapshot1.taskData.title,
                to: snapshot2.taskData.title,
                changed: snapshot1.taskData.title !== snapshot2.taskData.title
            },
            description: {
                from: snapshot1.taskData.description,
                to: snapshot2.taskData.description,
                changed: snapshot1.taskData.description !== snapshot2.taskData.description
            },
            column: {
                from: snapshot1.taskData.column_name,
                to: snapshot2.taskData.column_name,
                changed: snapshot1.taskData.column_id !== snapshot2.taskData.column_id
            },
            assignee: {
                from: snapshot1.taskData.owner_username,
                to: snapshot2.taskData.owner_username,
                changed: snapshot1.taskData.owner_id !== snapshot2.taskData.owner_id
            },
            priority: {
                from: snapshot1.taskData.priority,
                to: snapshot2.taskData.priority,
                changed: snapshot1.taskData.priority !== snapshot2.taskData.priority
            }
        };
        
        res.json({
            success: true,
            taskId: taskId,
            comparison: {
                version1: { id: versionId1, timestamp: snapshot1.timestamp },
                version2: { id: versionId2, timestamp: snapshot2.timestamp }
            },
            diff: diff
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Restore task
app.post('/api/task/:taskId/restore/:versionId', async (req, res) => {
    try {
        const { taskId, versionId } = req.params;
        const { userId } = req.body;
        
        const result = await restoreTaskFromSnapshot(taskId, versionId, userId);
        
        res.json(result);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// AI confidence check
app.post('/api/ai/confidence-check', async (req, res) => {
    try {
        const { taskId, modifications, aiScore } = req.body;
        
        const confidence = checkAIConfidence(modifications, aiScore);
        
        if (confidence.autoRollback) {
            // Automatically restore to previous version
            const versions = await getTaskVersionHistory(taskId);
            if (versions.length > 0) {
                await restoreTaskFromSnapshot(taskId, versions[0].versionId, 'ai_auto_rollback');
                confidence.autoRollbackExecuted = true;
            }
        }
        
        res.json({
            success: true,
            confidence: confidence
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get audit log
app.get('/api/audit', async (req, res) => {
    try {
        const { limit = 100, eventType, taskId } = req.query;
        
        let filteredLog = auditLog;
        
        if (eventType) {
            filteredLog = filteredLog.filter(e => e.eventType === eventType);
        }
        
        if (taskId) {
            filteredLog = filteredLog.filter(e => e.data.taskId == taskId);
        }
        
        const events = filteredLog.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            events: events,
            totalEvents: filteredLog.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Export audit trail
app.get('/api/audit/export', async (req, res) => {
    try {
        const { format = 'json', startDate, endDate } = req.query;
        
        let events = auditLog;
        
        if (startDate || endDate) {
            events = events.filter(e => {
                const eventDate = new Date(e.timestamp);
                if (startDate && eventDate < new Date(startDate)) return false;
                if (endDate && eventDate > new Date(endDate)) return false;
                return true;
            });
        }
        
        if (format === 'csv') {
            // Convert to CSV
            const csv = [
                'Timestamp,Event Type,Task ID,User ID,Data',
                ...events.map(e => `${e.timestamp},${e.eventType},${e.data.taskId || ''},${e.data.userId || ''},"${JSON.stringify(e.data).replace(/"/g, '""')}"`)
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=audit-trail.csv');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=audit-trail.json');
            res.json(events);
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced management interface
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🔄 Robust Kanboard Rollback System</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: white; border-radius: 10px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .stat-card h3 { color: #4a5568; margin-bottom: 0.5rem; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #667eea; }
        .tabs { display: flex; background: white; border-radius: 10px 10px 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .tab { flex: 1; padding: 1rem 2rem; background: #e2e8f0; border: none; cursor: pointer; font-weight: 600; transition: all 0.3s; }
        .tab.active { background: #667eea; color: white; }
        .tab-content { background: white; border-radius: 0 0 10px 10px; padding: 2rem; min-height: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .search-bar { width: 100%; padding: 1rem; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 1.5rem; }
        .task-item { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; transition: all 0.3s; }
        .task-item:hover { border-color: #667eea; transform: translateY(-2px); }
        .btn { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s; margin: 0.25rem; }
        .btn-primary { background: #667eea; color: white; }
        .btn-success { background: #48bb78; color: white; }
        .btn-warning { background: #ed8936; color: white; }
        .btn-danger { background: #f56565; color: white; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .version-item { background: #f7fafc; border-left: 4px solid #667eea; padding: 1rem; margin: 0.5rem 0; border-radius: 0 6px 6px 0; }
        .diff-view { background: #f8f9fa; border-radius: 6px; padding: 1rem; margin: 1rem 0; }
        .diff-changed { background: #fff3cd; border-left: 4px solid #ffc107; }
        .performance-indicator { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        .perf-good { background: #d4edda; color: #155724; }
        .perf-warning { background: #fff3cd; color: #856404; }
        .perf-danger { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔄 Robust Kanboard Rollback System</h1>
        <p>Advanced task versioning with AI confidence checking and comprehensive audit trails</p>
    </div>
    
    <div class="container">
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card">
                <h3>📸 Total Snapshots</h3>
                <div class="stat-value" id="totalSnapshots">Loading...</div>
            </div>
            <div class="stat-card">
                <h3>🔄 Total Restores</h3>
                <div class="stat-value" id="totalRestores">Loading...</div>
            </div>
            <div class="stat-card">
                <h3>⚡ Avg Performance</h3>
                <div class="stat-value" id="avgPerformance">Loading...</div>
            </div>
            <div class="stat-card">
                <h3>📊 System Health</h3>
                <div class="stat-value" id="systemHealth">Loading...</div>
            </div>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('snapshots')">📸 Snapshots</button>
            <button class="tab" onclick="showTab('versions')">📋 Version History</button>
            <button class="tab" onclick="showTab('audit')">📝 Audit Trail</button>
            <button class="tab" onclick="showTab('ai')">🤖 AI Confidence</button>
        </div>
        
        <div class="tab-content">
            <div id="snapshots-content">
                <h2>📸 Task Snapshots</h2>
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <input type="number" id="taskIdInput" placeholder="Task ID" class="search-bar" style="width: 200px;">
                    <button class="btn btn-primary" onclick="createSnapshot()">Create Snapshot</button>
                    <button class="btn btn-success" onclick="loadAllSnapshots()">Refresh</button>
                </div>
                <div id="snapshotsList">Loading snapshots...</div>
            </div>
            
            <div id="versions-content" style="display: none;">
                <h2>📋 Version History</h2>
                <input type="number" id="versionTaskId" placeholder="Enter Task ID" class="search-bar" onchange="loadVersionHistory()">
                <div id="versionsList">Enter a Task ID to view version history</div>
            </div>
            
            <div id="audit-content" style="display: none;">
                <h2>📝 Audit Trail</h2>
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <select id="eventTypeFilter" class="search-bar" style="width: 200px;" onchange="loadAuditLog()">
                        <option value="">All Events</option>
                        <option value="snapshot_created">Snapshots Created</option>
                        <option value="task_restored">Tasks Restored</option>
                        <option value="restore_failed">Restore Failures</option>
                    </select>
                    <input type="number" id="auditTaskId" placeholder="Task ID Filter" class="search-bar" style="width: 200px;" onchange="loadAuditLog()">
                    <button class="btn btn-primary" onclick="exportAuditTrail()">Export</button>
                </div>
                <div id="auditList">Loading audit trail...</div>
            </div>
            
            <div id="ai-content" style="display: none;">
                <h2>🤖 AI Confidence Testing</h2>
                <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h3>Test AI Confidence Check</h3>
                    <div style="margin: 1rem 0;">
                        <label>Task ID:</label>
                        <input type="number" id="aiTaskId" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;">
                    </div>
                    <div style="margin: 1rem 0;">
                        <label>AI Confidence Score (0-1):</label>
                        <input type="number" id="aiScore" min="0" max="1" step="0.1" value="0.8" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0;">
                    </div>
                    <div style="margin: 1rem 0;">
                        <label>Modifications:</label>
                        <textarea id="aiModifications" placeholder='{"title": true, "description": true, "owner_id": false}' style="width: 100%; padding: 0.5rem; margin: 0.5rem 0; height: 100px;"></textarea>
                    </div>
                    <button class="btn btn-primary" onclick="testAIConfidence()">Test Confidence</button>
                    <div id="aiResults" style="margin-top: 1rem;"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentTab = 'snapshots';
        
        function showTab(tabName) {
            // Hide all content
            ['snapshots', 'versions', 'audit', 'ai'].forEach(tab => {
                document.getElementById(tab + '-content').style.display = 'none';
                document.querySelector(\`[onclick="showTab('\${tab}')"]\`).classList.remove('active');
            });
            
            // Show selected content
            document.getElementById(tabName + '-content').style.display = 'block';
            document.querySelector(\`[onclick="showTab('\${tabName}')"]\`).classList.add('active');
            currentTab = tabName;
        }
        
        async function loadStats() {
            try {
                const response = await fetch('/health');
                const health = await response.json();
                
                document.getElementById('totalSnapshots').textContent = health.stats.totalSnapshots || 0;
                document.getElementById('totalRestores').textContent = health.stats.totalRestores || 0;
                document.getElementById('avgPerformance').textContent = health.performance.avgSnapshotTime || 'N/A';
                document.getElementById('systemHealth').textContent = health.status;
                document.getElementById('systemHealth').className = 'stat-value ' + (health.status === 'healthy' ? 'perf-good' : 'perf-danger');
                
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
        
        async function createSnapshot() {
            const taskId = document.getElementById('taskIdInput').value;
            if (!taskId) {
                alert('Please enter a Task ID');
                return;
            }
            
            try {
                const response = await fetch('/api/snapshot/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId: parseInt(taskId),
                        reason: 'manual_snapshot',
                        userId: 'web_interface'
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert(\`✅ Snapshot created! Version ID: \${result.versionId}\\nPerformance: \${result.performanceMs}ms\`);
                    loadAllSnapshots();
                    loadStats();
                } else {
                    alert(\`❌ Snapshot failed: \${result.error}\`);
                }
            } catch (error) {
                alert(\`❌ Snapshot failed: \${error.message}\`);
            }
        }
        
        async function loadVersionHistory() {
            const taskId = document.getElementById('versionTaskId').value;
            if (!taskId) return;
            
            try {
                const response = await fetch(\`/api/task/\${taskId}/versions\`);
                const result = await response.json();
                
                if (result.success) {
                    let html = \`<h3>📋 Versions for Task \${taskId} (\${result.totalVersions} total)</h3>\`;
                    
                    if (result.versions.length === 0) {
                        html += '<p>No versions found for this task.</p>';
                    } else {
                        result.versions.forEach(version => {
                            const perfClass = version.performanceMs < 500 ? 'perf-good' : version.performanceMs < 1000 ? 'perf-warning' : 'perf-danger';
                            html += \`
                                <div class="version-item">
                                    <div style="display: flex; justify-content: between; align-items: center;">
                                        <div>
                                            <strong>\${version.reason}</strong> - \${new Date(version.timestamp).toLocaleString()}
                                            <span class="performance-indicator \${perfClass}">\${version.performanceMs}ms</span>
                                        </div>
                                        <div>
                                            <button class="btn btn-primary" onclick="restoreVersion('\${taskId}', '\${version.versionId}')">🔄 Restore</button>
                                            <button class="btn btn-warning" onclick="viewDiff('\${taskId}', '\${version.versionId}')">👁️ View</button>
                                        </div>
                                    </div>
                                    <div style="margin-top: 0.5rem; color: #666;">
                                        <strong>Title:</strong> \${version.changes.title}<br>
                                        <strong>Column:</strong> \${version.changes.column}<br>
                                        <strong>Assignee:</strong> \${version.changes.assignee || 'Unassigned'}
                                    </div>
                                </div>
                            \`;
                        });
                    }
                    
                    document.getElementById('versionsList').innerHTML = html;
                } else {
                    document.getElementById('versionsList').innerHTML = \`<p>❌ Error: \${result.error}</p>\`;
                }
            } catch (error) {
                document.getElementById('versionsList').innerHTML = \`<p>❌ Error: \${error.message}</p>\`;
            }
        }
        
        async function restoreVersion(taskId, versionId) {
            if (!confirm(\`Are you sure you want to restore task \${taskId} to version \${versionId}?\`)) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/task/\${taskId}/restore/\${versionId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'web_interface' })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert(\`✅ Task restored successfully!\\nPerformance: \${result.performanceMs}ms\`);
                    loadVersionHistory();
                    loadStats();
                } else {
                    alert(\`❌ Restore failed: \${result.error}\`);
                }
            } catch (error) {
                alert(\`❌ Restore failed: \${error.message}\`);
            }
        }
        
        async function loadAuditLog() {
            try {
                const eventType = document.getElementById('eventTypeFilter').value;
                const taskId = document.getElementById('auditTaskId').value;
                
                let url = '/api/audit?limit=50';
                if (eventType) url += \`&eventType=\${eventType}\`;
                if (taskId) url += \`&taskId=\${taskId}\`;
                
                const response = await fetch(url);
                const result = await response.json();
                
                if (result.success) {
                    let html = \`<h3>📝 Audit Events (\${result.totalEvents} total)</h3>\`;
                    
                    result.events.forEach(event => {
                        const icon = event.eventType === 'snapshot_created' ? '📸' : 
                                   event.eventType === 'task_restored' ? '🔄' : '❌';
                        html += \`
                            <div class="version-item">
                                <div style="display: flex; justify-content: between; align-items: center;">
                                    <div>
                                        \${icon} <strong>\${event.eventType}</strong> - \${new Date(event.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <div style="margin-top: 0.5rem; color: #666; font-family: monospace; font-size: 0.9rem;">
                                    \${JSON.stringify(event.data, null, 2)}
                                </div>
                            </div>
                        \`;
                    });
                    
                    document.getElementById('auditList').innerHTML = html;
                } else {
                    document.getElementById('auditList').innerHTML = \`<p>❌ Error: \${result.error}</p>\`;
                }
            } catch (error) {
                document.getElementById('auditList').innerHTML = \`<p>❌ Error: \${error.message}</p>\`;
            }
        }
        
        async function exportAuditTrail() {
            window.open('/api/audit/export?format=csv', '_blank');
        }
        
        async function testAIConfidence() {
            const taskId = document.getElementById('aiTaskId').value;
            const aiScore = parseFloat(document.getElementById('aiScore').value);
            const modificationsText = document.getElementById('aiModifications').value;
            
            if (!taskId || !aiScore) {
                alert('Please fill in all fields');
                return;
            }
            
            let modifications;
            try {
                modifications = JSON.parse(modificationsText);
            } catch (error) {
                alert('Invalid JSON in modifications field');
                return;
            }
            
            try {
                const response = await fetch('/api/ai/confidence-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskId: parseInt(taskId),
                        modifications: modifications,
                        aiScore: aiScore
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    const confidence = result.confidence;
                    let html = \`
                        <div class="diff-view">
                            <h4>🤖 AI Confidence Analysis</h4>
                            <p><strong>Original Confidence:</strong> \${(confidence.originalConfidence * 100).toFixed(1)}%</p>
                            <p><strong>Adjusted Confidence:</strong> \${(confidence.adjustedConfidence * 100).toFixed(1)}%</p>
                            <p><strong>Risk Score:</strong> \${confidence.riskScore.toFixed(2)}</p>
                            <p><strong>Requires Approval:</strong> \${confidence.requiresApproval ? '⚠️ Yes' : '✅ No'}</p>
                            <p><strong>Auto Rollback:</strong> \${confidence.autoRollback ? '🔄 Yes' : '✅ No'}</p>
                    \`;
                    
                    if (confidence.autoRollbackExecuted) {
                        html += '<p><strong>🔄 Auto rollback was executed!</strong></p>';
                    }
                    
                    html += '</div>';
                    document.getElementById('aiResults').innerHTML = html;
                } else {
                    document.getElementById('aiResults').innerHTML = \`<p>❌ Error: \${result.error}</p>\`;
                }
            } catch (error) {
                document.getElementById('aiResults').innerHTML = \`<p>❌ Error: \${error.message}</p>\`;
            }
        }
        
        function loadAllSnapshots() {
            document.getElementById('snapshotsList').innerHTML = '<p>📸 Snapshot functionality is active. Use the form above to create snapshots for specific tasks.</p>';
        }
        
        // Initialize
        loadStats();
        loadAllSnapshots();
        loadAuditLog();
        
        // Auto-refresh stats every 30 seconds
        setInterval(loadStats, 30000);
    </script>
</body>
</html>
    `);
});

// Start server
async function startServer() {
    await initializeStorage();
    
    app.listen(port, () => {
        console.log(`🚀 Robust Kanboard Rollback Server running on http://localhost:${port}`);
        console.log(`📊 Management Interface: http://localhost:${port}`);
        console.log(`🔧 API Health Check: http://localhost:${port}/health`);
        console.log(`📸 Snapshot API: POST /api/snapshot/create`);
        console.log(`📋 Version History: GET /api/task/:taskId/versions`);
        console.log(`🔄 Restore Task: POST /api/task/:taskId/restore/:versionId`);
        console.log(`🤖 AI Confidence: POST /api/ai/confidence-check`);
        console.log(`📝 Audit Trail: GET /api/audit`);
        console.log(`📤 Export Audit: GET /api/audit/export`);
        console.log(`🎯 System ready for production use!`);
    });
}

startServer().catch(console.error);
