// ==UserScript==
// @name         n8n PostgreSQL Database Management Integration
// @namespace    http://action-labs.ai/
// @version      1.0
// @description  Adds PostgreSQL rollback and database management directly to n8n interface
// @author       The Genius Project
// @match        http://localhost:5678/*
// @match        http://127.0.0.1:5678/*
// @match        http://192.168.*:5678/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:10000';
    
    // Wait for n8n to load
    let initAttempts = 0;
    const maxAttempts = 50;
    
    function initDatabaseIntegration() {
        // Check if n8n interface has loaded
        const leftPanel = document.querySelector('[data-test-id="menu-panel"]') || 
                         document.querySelector('.el-aside') ||
                         document.querySelector('.left-panel') ||
                         document.querySelector('nav');
        
        if (!leftPanel && initAttempts < maxAttempts) {
            initAttempts++;
            setTimeout(initDatabaseIntegration, 1000);
            return;
        }
        
        if (!leftPanel) {
            console.log('🔍 n8n left panel not found, trying alternative approach...');
            addFloatingDatabaseButton();
            return;
        }
        
        console.log('✅ n8n interface detected, adding database management...');
        addDatabaseManagementToSidebar(leftPanel);
    }
    
    function addDatabaseManagementToSidebar(leftPanel) {
        // Create database management section
        const dbSection = document.createElement('div');
        dbSection.id = 'database-management-section';
        dbSection.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #7f1d1d, #991b1b);
                color: white;
                padding: 12px;
                margin: 8px;
                border-radius: 8px;
                border: 1px solid #dc2626;
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 18px; margin-right: 8px;">🛡️</span>
                    <span style="font-weight: bold; font-size: 14px;">Database Control</span>
                </div>
                
                <div id="db-status" style="
                    background: rgba(0,0,0,0.2);
                    padding: 8px;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    font-size: 12px;
                ">
                    <div style="color: #fbbf24;">⏳ Checking status...</div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <button id="emergency-rollback-btn" style="
                        background: #dc2626;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 12px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
                        🚨 Emergency Rollback
                    </button>
                    
                    <button id="quick-backup-btn" style="
                        background: #065f46;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#047857'" onmouseout="this.style.background='#065f46'">
                        💾 Quick Backup
                    </button>
                    
                    <button id="view-backups-btn" style="
                        background: #1e40af;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#1e40af'">
                        📋 View Backups
                    </button>
                </div>
            </div>
        `;
        
        // Add to the top of the left panel
        leftPanel.insertBefore(dbSection, leftPanel.firstChild);
        
        // Initialize functionality
        initDatabaseFunctionality();
        
        // Start status monitoring
        updateDatabaseStatus();
        setInterval(updateDatabaseStatus, 30000); // Update every 30 seconds
    }
    
    function addFloatingDatabaseButton() {
        // Create floating database button if sidebar integration fails
        const floatingBtn = document.createElement('div');
        floatingBtn.id = 'floating-database-btn';
        floatingBtn.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #7f1d1d, #991b1b);
                color: white;
                padding: 12px;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
                transition: all 0.3s;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            " title="Database Management">
                🛡️
            </div>
        `;
        
        document.body.appendChild(floatingBtn);
        
        floatingBtn.addEventListener('click', () => {
            showDatabaseManagementModal();
        });
        
        // Add hover effect
        floatingBtn.addEventListener('mouseover', () => {
            floatingBtn.firstElementChild.style.transform = 'scale(1.1)';
            floatingBtn.firstElementChild.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.6)';
        });
        
        floatingBtn.addEventListener('mouseout', () => {
            floatingBtn.firstElementChild.style.transform = 'scale(1)';
            floatingBtn.firstElementChild.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
        });
    }
    
    function initDatabaseFunctionality() {
        // Emergency Rollback
        document.getElementById('emergency-rollback-btn').addEventListener('click', () => {
            showEmergencyRollbackModal();
        });
        
        // Quick Backup
        document.getElementById('quick-backup-btn').addEventListener('click', async () => {
            await performQuickBackup();
        });
        
        // View Backups
        document.getElementById('view-backups-btn').addEventListener('click', () => {
            showBackupsModal();
        });
    }
    
    async function updateDatabaseStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/database/status`);
            const data = await response.json();
            
            const statusElement = document.getElementById('db-status');
            if (statusElement) {
                if (data.status === 'healthy') {
                    statusElement.innerHTML = `
                        <div style="color: #10b981;">✅ Database Online</div>
                        <div style="color: #9ca3af; font-size: 10px;">Size: ${data.database?.size || 'Unknown'}</div>
                    `;
                } else {
                    statusElement.innerHTML = `
                        <div style="color: #ef4444;">❌ Database Issues</div>
                        <div style="color: #9ca3af; font-size: 10px;">Check logs</div>
                    `;
                }
            }
        } catch (error) {
            const statusElement = document.getElementById('db-status');
            if (statusElement) {
                statusElement.innerHTML = `
                    <div style="color: #f59e0b;">⚠️ API Unavailable</div>
                    <div style="color: #9ca3af; font-size: 10px;">Start API server</div>
                `;
            }
        }
    }
    
    function showEmergencyRollbackModal() {
        const modal = createModal('Emergency Database Rollback', `
            <div style="color: #dc2626; font-weight: bold; margin-bottom: 16px;">
                ⚠️ WARNING: This will rollback your database and may cause data loss!
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: bold;">Rollback Type:</label>
                <select id="rollback-type" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="pitr">Point-in-Time Recovery</option>
                    <option value="backup">Restore from Backup</option>
                </select>
            </div>
            
            <div id="pitr-options" style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: bold;">Target Time:</label>
                <input type="datetime-local" id="target-timestamp" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            
            <div id="backup-options" style="margin-bottom: 16px; display: none;">
                <label style="display: block; margin-bottom: 4px; font-weight: bold;">Backup File:</label>
                <select id="backup-file" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">Loading backups...</option>
                </select>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: flex; align-items: center;">
                    <input type="checkbox" id="confirm-rollback" style="margin-right: 8px;">
                    <span>I understand this operation is destructive and have verified the parameters</span>
                </label>
            </div>
            
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button onclick="closeModal()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="executeRollback()" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🚨 Execute Rollback
                </button>
            </div>
        `);
        
        // Setup rollback type switching
        const rollbackType = modal.querySelector('#rollback-type');
        const pitrOptions = modal.querySelector('#pitr-options');
        const backupOptions = modal.querySelector('#backup-options');
        
        rollbackType.addEventListener('change', () => {
            if (rollbackType.value === 'pitr') {
                pitrOptions.style.display = 'block';
                backupOptions.style.display = 'none';
            } else {
                pitrOptions.style.display = 'none';
                backupOptions.style.display = 'block';
                loadBackupOptions();
            }
        });
        
        // Set default timestamp to 1 hour ago
        const defaultTime = new Date(Date.now() - 3600000);
        const timestamp = defaultTime.toISOString().slice(0, 19);
        modal.querySelector('#target-timestamp').value = timestamp;
        
        // Make executeRollback available globally for the button
        window.executeRollback = async () => {
            const confirmed = modal.querySelector('#confirm-rollback').checked;
            if (!confirmed) {
                alert('Please confirm that you understand this operation is destructive.');
                return;
            }
            
            const type = rollbackType.value;
            let params = {};
            
            if (type === 'pitr') {
                const timestamp = modal.querySelector('#target-timestamp').value;
                if (!timestamp) {
                    alert('Please select a target timestamp.');
                    return;
                }
                params = { timestamp: new Date(timestamp).toISOString() };
            } else {
                const backupFile = modal.querySelector('#backup-file').value;
                if (!backupFile) {
                    alert('Please select a backup file.');
                    return;
                }
                params = { backupFile };
            }
            
            await performRollback(type, params);
            closeModal();
        };
    }
    
    async function loadBackupOptions() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/database/backups`);
            const data = await response.json();
            
            const select = document.getElementById('backup-file');
            select.innerHTML = '';
            
            if (data.backups && data.backups.length > 0) {
                data.backups.forEach(backup => {
                    const option = document.createElement('option');
                    option.value = backup.filename;
                    option.textContent = `${backup.filename} (${backup.size}) - ${new Date(backup.created).toLocaleString()}`;
                    select.appendChild(option);
                });
            } else {
                select.innerHTML = '<option value="">No backups available</option>';
            }
        } catch (error) {
            document.getElementById('backup-file').innerHTML = '<option value="">Error loading backups</option>';
        }
    }
    
    async function performQuickBackup() {
        const btn = document.getElementById('quick-backup-btn');
        const originalText = btn.textContent;
        btn.textContent = '⏳ Creating...';
        btn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/database/backup`, {
                method: 'POST'
            });
            
            if (response.ok) {
                btn.textContent = '✅ Success!';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 2000);
            } else {
                throw new Error('Backup failed');
            }
        } catch (error) {
            btn.textContent = '❌ Failed';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
            alert('Backup failed. Please check if the API server is running.');
        }
    }
    
    async function performRollback(type, params) {
        const endpoint = type === 'pitr' ? '/api/database/rollback' : '/api/database/recovery';
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('✅ Database rollback completed successfully!');
                updateDatabaseStatus();
            } else {
                throw new Error(data.message || 'Rollback failed');
            }
        } catch (error) {
            alert(`❌ Rollback failed: ${error.message}`);
        }
    }
    
    function showBackupsModal() {
        const modal = createModal('Database Backups', `
            <div id="backups-list" style="max-height: 400px; overflow-y: auto;">
                <div style="text-align: center; padding: 20px; color: #6b7280;">
                    ⏳ Loading backups...
                </div>
            </div>
            
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
                <button onclick="closeModal()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        `);
        
        loadBackupsList();
    }
    
    async function loadBackupsList() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/database/backups`);
            const data = await response.json();
            
            const listElement = document.getElementById('backups-list');
            
            if (data.backups && data.backups.length > 0) {
                listElement.innerHTML = data.backups.map(backup => `
                    <div style="
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        padding: 12px;
                        margin-bottom: 8px;
                        background: #f9fafb;
                    ">
                        <div style="font-weight: bold; color: #1f2937;">${backup.filename}</div>
                        <div style="font-size: 12px; color: #6b7280; margin: 4px 0;">
                            Size: ${backup.size} | Created: ${new Date(backup.created).toLocaleString()}
                        </div>
                        <button onclick="restoreFromBackup('${backup.filename}')" style="
                            background: #059669;
                            color: white;
                            border: none;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            cursor: pointer;
                        ">
                            🔄 Restore
                        </button>
                    </div>
                `).join('');
            } else {
                listElement.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #6b7280;">
                        📋 No backups found
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('backups-list').innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ef4444;">
                    ❌ Error loading backups
                </div>
            `;
        }
        
        // Make restore function globally available
        window.restoreFromBackup = async (filename) => {
            if (confirm(`Are you sure you want to restore from backup: ${filename}?`)) {
                await performRollback('backup', { backupFile: filename });
                closeModal();
            }
        };
    }
    
    function showDatabaseManagementModal() {
        const modal = createModal('Database Management', `
            <div id="modal-db-status" style="
                background: #f3f4f6;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 16px;
            ">
                <div style="color: #fbbf24;">⏳ Checking status...</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <button onclick="performModalQuickBackup()" style="
                    background: #065f46;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    💾 Create Backup
                </button>
                
                <button onclick="showModalEmergencyRollback()" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    🚨 Emergency Rollback
                </button>
            </div>
            
            <div style="text-align: center;">
                <button onclick="closeModal()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        `);
        
        // Update status in modal
        updateModalDatabaseStatus();
        
        // Make functions globally available
        window.performModalQuickBackup = performQuickBackup;
        window.showModalEmergencyRollback = showEmergencyRollbackModal;
    }
    
    async function updateModalDatabaseStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/database/status`);
            const data = await response.json();
            
            const statusElement = document.getElementById('modal-db-status');
            if (statusElement) {
                if (data.status === 'healthy') {
                    statusElement.innerHTML = `
                        <div style="color: #10b981; font-weight: bold;">✅ Database Status: Healthy</div>
                        <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">
                            Size: ${data.database?.size || 'Unknown'} | 
                            Host: ${data.database?.host}:${data.database?.port}
                        </div>
                    `;
                } else {
                    statusElement.innerHTML = `
                        <div style="color: #ef4444; font-weight: bold;">❌ Database Issues Detected</div>
                        <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Check system logs</div>
                    `;
                }
            }
        } catch (error) {
            const statusElement = document.getElementById('modal-db-status');
            if (statusElement) {
                statusElement.innerHTML = `
                    <div style="color: #f59e0b; font-weight: bold;">⚠️ API Server Unavailable</div>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">
                        Please start the database API server (port 10000)
                    </div>
                `;
            }
        }
    }
    
    function createModal(title, content) {
        // Remove existing modal if any
        const existingModal = document.getElementById('database-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'database-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: white;
                    padding: 24px;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80%;
                    overflow-y: auto;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                ">
                    <h3 style="margin: 0 0 16px 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                        ${title}
                    </h3>
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Make closeModal globally available
        window.closeModal = () => {
            modal.remove();
        };
        
        return modal;
    }
    
    // Start initialization
    console.log('🚀 n8n PostgreSQL Database Management Integration loading...');
    setTimeout(initDatabaseIntegration, 2000);
    
})();
