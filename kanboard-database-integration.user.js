// ==UserScript==
// @name         Kanboard PostgreSQL Database Management Integration
// @namespace    http://action-labs.ai/
// @version      1.0
// @description  Adds PostgreSQL rollback and database management directly to Kanboard interface
// @author       The Genius Project
// @match        http://localhost:8000/*
// @match        http://127.0.0.1:8000/*
// @match        http://192.168.*:8000/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:10000';
    
    // Wait for Kanboard to load
    let initAttempts = 0;
    const maxAttempts = 50;
    
    function initDatabaseIntegration() {
        // Check if Kanboard interface has loaded
        const navbar = document.querySelector('.navbar') || 
                      document.querySelector('nav') ||
                      document.querySelector('header') ||
                      document.querySelector('.header');
        
        if (!navbar && initAttempts < maxAttempts) {
            initAttempts++;
            setTimeout(initDatabaseIntegration, 1000);
            return;
        }
        
        if (!navbar) {
            console.log('🔍 Kanboard navbar not found, adding floating button...');
            addFloatingDatabaseButton();
            return;
        }
        
        console.log('✅ Kanboard interface detected, adding database management...');
        addDatabaseManagementToNavbar(navbar);
    }
    
    function addDatabaseManagementToNavbar(navbar) {
        // Create database management button in navbar
        const dbButton = document.createElement('div');
        dbButton.id = 'kanboard-database-management';
        dbButton.innerHTML = `
            <div style="
                display: inline-block;
                margin-left: 20px;
                position: relative;
            ">
                <button id="db-toggle-btn" style="
                    background: linear-gradient(135deg, #7f1d1d, #991b1b);
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
                    transition: all 0.2s;
                " title="Database Management">
                    <span>🛡️</span>
                    <span>Database</span>
                    <span id="db-status-indicator" style="
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #fbbf24;
                        margin-left: 4px;
                    "></span>
                </button>
                
                <div id="db-dropdown" style="
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    padding: 12px;
                    min-width: 280px;
                    z-index: 1000;
                    display: none;
                    margin-top: 4px;
                ">
                    <div style="margin-bottom: 12px;">
                        <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: bold;">
                            🛡️ Database Management
                        </h4>
                        
                        <div id="detailed-db-status" style="
                            background: #f3f4f6;
                            padding: 8px;
                            border-radius: 4px;
                            margin-bottom: 12px;
                            font-size: 12px;
                        ">
                            <div style="color: #fbbf24;">⏳ Checking status...</div>
                        </div>
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
                            width: 100%;
                        ">
                            🚨 Emergency Rollback
                        </button>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <button id="quick-backup-btn" style="
                                background: #065f46;
                                color: white;
                                border: none;
                                padding: 6px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 11px;
                            ">
                                💾 Backup
                            </button>
                            
                            <button id="view-backups-btn" style="
                                background: #1e40af;
                                color: white;
                                border: none;
                                padding: 6px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 11px;
                            ">
                                📋 Backups
                            </button>
                        </div>
                        
                        <div style="
                            border-top: 1px solid #e5e7eb;
                            margin-top: 8px;
                            padding-top: 8px;
                            font-size: 10px;
                            color: #6b7280;
                            text-align: center;
                        ">
                            PostgreSQL PITR System
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Try to add to existing navbar
        if (navbar.querySelector('ul') || navbar.querySelector('.nav')) {
            const navList = navbar.querySelector('ul') || navbar.querySelector('.nav');
            navList.appendChild(dbButton);
        } else {
            navbar.appendChild(dbButton);
        }
        
        // Initialize functionality
        initDatabaseFunctionality();
        
        // Setup dropdown toggle
        const toggleBtn = document.getElementById('db-toggle-btn');
        const dropdown = document.getElementById('db-dropdown');
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
        
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Start status monitoring
        updateDatabaseStatus();
        setInterval(updateDatabaseStatus, 30000); // Update every 30 seconds
    }
    
    function addFloatingDatabaseButton() {
        // Create floating database button for Kanboard
        const floatingBtn = document.createElement('div');
        floatingBtn.id = 'floating-database-btn';
        floatingBtn.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
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
        const emergencyBtn = document.getElementById('emergency-rollback-btn');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => {
                showEmergencyRollbackModal();
            });
        }
        
        // Quick Backup
        const backupBtn = document.getElementById('quick-backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', async () => {
                await performQuickBackup();
            });
        }
        
        // View Backups
        const viewBtn = document.getElementById('view-backups-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                showBackupsModal();
            });
        }
    }
    
    async function updateDatabaseStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/database/status`);
            const data = await response.json();
            
            const indicator = document.getElementById('db-status-indicator');
            const detailedStatus = document.getElementById('detailed-db-status');
            
            if (data.status === 'healthy') {
                if (indicator) {
                    indicator.style.background = '#10b981';
                    indicator.title = 'Database Healthy';
                }
                if (detailedStatus) {
                    detailedStatus.innerHTML = `
                        <div style="color: #10b981; font-weight: bold;">✅ Database Status: Healthy</div>
                        <div style="color: #6b7280; font-size: 10px; margin-top: 2px;">
                            Size: ${data.database?.size || 'Unknown'} | 
                            ${data.database?.host}:${data.database?.port}
                        </div>
                    `;
                }
            } else {
                if (indicator) {
                    indicator.style.background = '#ef4444';
                    indicator.title = 'Database Issues';
                }
                if (detailedStatus) {
                    detailedStatus.innerHTML = `
                        <div style="color: #ef4444; font-weight: bold;">❌ Database Issues</div>
                        <div style="color: #6b7280; font-size: 10px; margin-top: 2px;">Check logs</div>
                    `;
                }
            }
        } catch (error) {
            const indicator = document.getElementById('db-status-indicator');
            const detailedStatus = document.getElementById('detailed-db-status');
            
            if (indicator) {
                indicator.style.background = '#f59e0b';
                indicator.title = 'API Unavailable';
            }
            if (detailedStatus) {
                detailedStatus.innerHTML = `
                    <div style="color: #f59e0b; font-weight: bold;">⚠️ API Server Unavailable</div>
                    <div style="color: #6b7280; font-size: 10px; margin-top: 2px;">Start API server (port 10000)</div>
                `;
            }
        }
    }
    
    function showEmergencyRollbackModal() {
        const modal = createModal('Emergency Database Rollback', `
            <div style="color: #dc2626; font-weight: bold; margin-bottom: 16px; padding: 12px; background: #fef2f2; border-radius: 6px; border: 1px solid #fecaca;">
                ⚠️ WARNING: This will rollback your database and may cause data loss!
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: bold;">Rollback Type:</label>
                <select id="rollback-type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    <option value="pitr">Point-in-Time Recovery</option>
                    <option value="backup">Restore from Backup</option>
                </select>
            </div>
            
            <div id="pitr-options" style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: bold;">Target Time:</label>
                <input type="datetime-local" id="target-timestamp" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                    Select the point in time to rollback to
                </div>
            </div>
            
            <div id="backup-options" style="margin-bottom: 16px; display: none;">
                <label style="display: block; margin-bottom: 4px; font-weight: bold;">Backup File:</label>
                <select id="backup-file" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    <option value="">Loading backups...</option>
                </select>
            </div>
            
            <div style="margin-bottom: 16px; padding: 12px; background: #fffbeb; border: 1px solid #fed7aa; border-radius: 6px;">
                <label style="display: flex; align-items: flex-start;">
                    <input type="checkbox" id="confirm-rollback" style="margin-right: 8px; margin-top: 2px;">
                    <span style="font-size: 12px;">I understand this operation is destructive and may cause data loss. I have verified the rollback parameters and have current backups.</span>
                </label>
            </div>
            
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button onclick="closeModal()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="executeRollback()" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
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
        btn.textContent = '⏳';
        btn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/database/backup`, {
                method: 'POST'
            });
            
            if (response.ok) {
                btn.textContent = '✅';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 2000);
                
                // Show success notification
                showNotification('✅ Database backup created successfully!', 'success');
            } else {
                throw new Error('Backup failed');
            }
        } catch (error) {
            btn.textContent = '❌';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
            showNotification('❌ Backup failed. Check if API server is running.', 'error');
        }
    }
    
    async function performRollback(type, params) {
        const endpoint = type === 'pitr' ? '/api/database/rollback' : '/api/database/recovery';
        
        try {
            showNotification('⏳ Performing database rollback...', 'info');
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('✅ Database rollback completed successfully!', 'success');
                updateDatabaseStatus();
            } else {
                throw new Error(data.message || 'Rollback failed');
            }
        } catch (error) {
            showNotification(`❌ Rollback failed: ${error.message}`, 'error');
        }
    }
    
    function showBackupsModal() {
        const modal = createModal('Database Backups', `
            <div id="backups-list" style="max-height: 400px; overflow-y: auto;">
                <div style="text-align: center; padding: 20px; color: #6b7280;">
                    ⏳ Loading backups...
                </div>
            </div>
            
            <div style="display: flex; gap: 8px; justify-content: space-between; margin-top: 16px;">
                <button onclick="refreshBackups()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Refresh
                </button>
                <button onclick="closeModal()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        `);
        
        loadBackupsList();
        
        // Make refresh function globally available
        window.refreshBackups = loadBackupsList;
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
                        <div style="font-weight: bold; color: #1f2937; margin-bottom: 4px;">${backup.filename}</div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                            📊 Size: ${backup.size} | 📅 Created: ${new Date(backup.created).toLocaleString()}
                        </div>
                        <button onclick="restoreFromBackup('${backup.filename}')" style="
                            background: #059669;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: 4px;
                            font-size: 12px;
                            cursor: pointer;
                            font-weight: bold;
                        ">
                            🔄 Restore from this backup
                        </button>
                    </div>
                `).join('');
            } else {
                listElement.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6b7280;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                        <div style="font-weight: bold; margin-bottom: 8px;">No backups found</div>
                        <div style="font-size: 12px;">Create your first backup using the backup button</div>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('backups-list').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <div style="font-weight: bold; margin-bottom: 8px;">Error loading backups</div>
                    <div style="font-size: 12px;">Check if the API server is running</div>
                </div>
            `;
        }
        
        // Make restore function globally available
        window.restoreFromBackup = async (filename) => {
            if (confirm(`⚠️ Are you sure you want to restore from backup: ${filename}?\\n\\nThis will replace your current database!`)) {
                await performRollback('backup', { backupFile: filename });
                closeModal();
            }
        };
    }
    
    function showDatabaseManagementModal() {
        const modal = createModal('Database Management Center', `
            <div id="modal-db-status" style="
                background: #f3f4f6;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 20px;
                border: 1px solid #e5e7eb;
            ">
                <div style="color: #fbbf24;">⏳ Checking database status...</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <button onclick="performModalQuickBackup()" style="
                    background: #065f46;
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                ">
                    <span style='font-size: 24px;'>💾</span>
                    <span>Create Backup</span>
                </button>
                
                <button onclick="showModalEmergencyRollback()" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                ">
                    <span style='font-size: 24px;'>🚨</span>
                    <span>Emergency Rollback</span>
                </button>
            </div>
            
            <div style="text-align: center; margin-bottom: 16px;">
                <button onclick="showModalBackups()" style="
                    background: #1e40af;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    📋 View All Backups
                </button>
            </div>
            
            <div style="
                border-top: 1px solid #e5e7eb;
                padding-top: 16px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
            ">
                <div>PostgreSQL Point-in-Time Recovery System</div>
                <div>API Server: ${API_BASE_URL}</div>
            </div>
            
            <div style="text-align: center; margin-top: 16px;">
                <button onclick="closeModal()" style="padding: 8px 20px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        `);
        
        // Update status in modal
        updateModalDatabaseStatus();
        
        // Make functions globally available
        window.performModalQuickBackup = performQuickBackup;
        window.showModalEmergencyRollback = showEmergencyRollbackModal;
        window.showModalBackups = showBackupsModal;
    }
    
    async function updateModalDatabaseStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/database/status`);
            const data = await response.json();
            
            const statusElement = document.getElementById('modal-db-status');
            if (statusElement) {
                if (data.status === 'healthy') {
                    statusElement.innerHTML = `
                        <div style="color: #10b981; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                            ✅ Database Status: Healthy
                        </div>
                        <div style="color: #6b7280; font-size: 12px;">
                            📊 Size: ${data.database?.size || 'Unknown'} | 
                            🔗 Host: ${data.database?.host}:${data.database?.port} | 
                            🗄️ Database: ${data.database?.database}
                        </div>
                    `;
                } else {
                    statusElement.innerHTML = `
                        <div style="color: #ef4444; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                            ❌ Database Issues Detected
                        </div>
                        <div style="color: #6b7280; font-size: 12px;">Check system logs for details</div>
                    `;
                }
            }
        } catch (error) {
            const statusElement = document.getElementById('modal-db-status');
            if (statusElement) {
                statusElement.innerHTML = `
                    <div style="color: #f59e0b; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                        ⚠️ API Server Unavailable
                    </div>
                    <div style="color: #6b7280; font-size: 12px;">
                        Please start the database API server on port 10000<br>
                        Run: start-database-api.bat
                    </div>
                `;
            }
        }
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.getElementById('db-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.id = 'db-notification';
        
        const colors = {
            success: { bg: '#065f46', border: '#10b981' },
            error: { bg: '#dc2626', border: '#ef4444' },
            info: { bg: '#1e40af', border: '#3b82f6' }
        };
        
        const color = colors[type] || colors.info;
        
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10002;
                background: ${color.bg};
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                border: 2px solid ${color.border};
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                font-weight: bold;
                font-size: 14px;
                max-width: 300px;
                animation: slideIn 0.3s ease;
            ">
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
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
                background: rgba(0,0,0,0.6);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(2px);
            ">
                <div style="
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80%;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    border: 1px solid #e5e7eb;
                ">
                    <h3 style="
                        margin: 0 0 20px 0; 
                        color: #1f2937; 
                        border-bottom: 2px solid #e5e7eb; 
                        padding-bottom: 12px;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <span>🛡️</span>
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
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Make closeModal globally available
        window.closeModal = () => {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        };
        
        return modal;
    }
    
    // Add CSS animation for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Start initialization
    console.log('🚀 Kanboard PostgreSQL Database Management Integration loading...');
    setTimeout(initDatabaseIntegration, 2000);
    
})();
