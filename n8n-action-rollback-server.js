// n8n Action Rollback System - Tracks and reverses specific workflow executions
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 10002;

// Middleware
app.use(cors());
app.use(express.json());

// Action tracking store
let actionHistory = {
  executions: [],
  rollbacks: [],
  snapshots: new Map()
};

// Directory for storing action logs
const ACTION_LOG_DIR = path.join(__dirname, 'n8n_action_logs');

async function ensureLogDir() {
  try {
    await fs.mkdir(ACTION_LOG_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Initialize
ensureLogDir();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'n8n Action Rollback API',
    trackedExecutions: actionHistory.executions.length
  });
});

// Get workflow executions (simulated - would connect to real n8n API)
app.get('/api/n8n/executions', async (req, res) => {
  try {
    // Simulate n8n workflow executions
    const mockExecutions = [
      {
        id: 'exec_001',
        workflowId: 'wf_user_creation',
        workflowName: 'User Registration Workflow',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        finishedAt: new Date(Date.now() - 3500000).toISOString(),
        status: 'success',
        mode: 'manual',
        actions: [
          {
            node: 'Create User',
            action: 'database_insert',
            table: 'users',
            data: { id: 101, name: 'John Doe', email: 'john@example.com' },
            timestamp: new Date(Date.now() - 3580000).toISOString()
          },
          {
            node: 'Send Welcome Email',
            action: 'email_sent',
            recipient: 'john@example.com',
            emailId: 'email_12345',
            timestamp: new Date(Date.now() - 3550000).toISOString()
          },
          {
            node: 'Update Analytics',
            action: 'database_update',
            table: 'analytics',
            data: { user_count: 106 },
            oldData: { user_count: 105 },
            timestamp: new Date(Date.now() - 3520000).toISOString()
          }
        ],
        rollbackable: true
      },
      {
        id: 'exec_002',
        workflowId: 'wf_data_sync',
        workflowName: 'Customer Data Sync',
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        finishedAt: new Date(Date.now() - 1700000).toISOString(),
        status: 'success',
        mode: 'trigger',
        actions: [
          {
            node: 'Fetch External Data',
            action: 'api_call',
            endpoint: 'https://api.customers.com/sync',
            timestamp: new Date(Date.now() - 1780000).toISOString()
          },
          {
            node: 'Update Customer Records',
            action: 'database_batch_update',
            table: 'customers',
            recordsUpdated: 25,
            timestamp: new Date(Date.now() - 1750000).toISOString()
          },
          {
            node: 'Create Backup',
            action: 'file_create',
            file: 'customer_backup_' + Date.now() + '.json',
            timestamp: new Date(Date.now() - 1720000).toISOString()
          }
        ],
        rollbackable: true
      },
      {
        id: 'exec_003',
        workflowId: 'wf_email_campaign',
        workflowName: 'Marketing Email Campaign',
        startedAt: new Date(Date.now() - 900000).toISOString(),
        finishedAt: new Date(Date.now() - 800000).toISOString(),
        status: 'success',
        mode: 'schedule',
        actions: [
          {
            node: 'Get Email List',
            action: 'database_query',
            table: 'subscribers',
            recordsFound: 150,
            timestamp: new Date(Date.now() - 880000).toISOString()
          },
          {
            node: 'Send Campaign Emails',
            action: 'bulk_email_sent',
            emailsSent: 150,
            campaignId: 'camp_08132025',
            timestamp: new Date(Date.now() - 850000).toISOString()
          },
          {
            node: 'Update Campaign Stats',
            action: 'database_insert',
            table: 'campaign_stats',
            data: { campaign_id: 'camp_08132025', emails_sent: 150, status: 'completed' },
            timestamp: new Date(Date.now() - 820000).toISOString()
          }
        ],
        rollbackable: true
      }
    ];

    // Add any manually tracked executions
    const allExecutions = [...mockExecutions, ...actionHistory.executions];
    
    res.json({
      success: true,
      executions: allExecutions,
      total: allExecutions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch executions: ' + error.message
    });
  }
});

// Get detailed execution information
app.get('/api/n8n/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    // This would normally query n8n's database
    // For demo, we'll return detailed mock data
    const execution = {
      id: executionId,
      workflowId: 'wf_user_creation',
      workflowName: 'User Registration Workflow',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      finishedAt: new Date(Date.now() - 3500000).toISOString(),
      status: 'success',
      mode: 'manual',
      data: {
        inputData: {
          name: 'John Doe',
          email: 'john@example.com',
          department: 'Engineering'
        },
        outputData: {
          userId: 101,
          emailSent: true,
          analyticsUpdated: true
        }
      },
      actions: [
        {
          nodeId: 'node_1',
          nodeName: 'Create User',
          action: 'database_insert',
          table: 'users',
          query: "INSERT INTO users (name, email, department) VALUES ('John Doe', 'john@example.com', 'Engineering')",
          data: { id: 101, name: 'John Doe', email: 'john@example.com', department: 'Engineering' },
          timestamp: new Date(Date.now() - 3580000).toISOString(),
          reversible: true,
          reverseAction: {
            type: 'database_delete',
            query: "DELETE FROM users WHERE id = 101"
          }
        },
        {
          nodeId: 'node_2',
          nodeName: 'Send Welcome Email',
          action: 'email_sent',
          recipient: 'john@example.com',
          subject: 'Welcome to Our Platform!',
          emailId: 'email_12345',
          timestamp: new Date(Date.now() - 3550000).toISOString(),
          reversible: false,
          note: 'Cannot unsend emails, but can track for audit'
        },
        {
          nodeId: 'node_3',
          nodeName: 'Update Analytics',
          action: 'database_update',
          table: 'analytics',
          query: "UPDATE analytics SET user_count = 106 WHERE metric = 'total_users'",
          data: { user_count: 106 },
          oldData: { user_count: 105 },
          timestamp: new Date(Date.now() - 3520000).toISOString(),
          reversible: true,
          reverseAction: {
            type: 'database_update',
            query: "UPDATE analytics SET user_count = 105 WHERE metric = 'total_users'"
          }
        }
      ],
      rollbackStatus: 'available',
      rollbackPlan: {
        reversibleActions: 2,
        irreversibleActions: 1,
        estimatedTime: '< 1 minute',
        dataAtRisk: ['User record', 'Analytics counter'],
        warnings: ['Welcome email cannot be unsent']
      }
    };
    
    res.json({
      success: true,
      execution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch execution details: ' + error.message
    });
  }
});

// Create execution rollback plan
app.post('/api/n8n/executions/:executionId/rollback-plan', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    // Generate rollback plan for the execution
    const rollbackPlan = {
      executionId,
      planId: 'plan_' + Date.now(),
      createdAt: new Date().toISOString(),
      steps: [
        {
          stepId: 1,
          action: 'revert_database_update',
          description: 'Restore analytics counter to previous value',
          table: 'analytics',
          query: "UPDATE analytics SET user_count = 105 WHERE metric = 'total_users'",
          risk: 'low',
          reversible: true
        },
        {
          stepId: 2,
          action: 'revert_database_insert',
          description: 'Remove created user record',
          table: 'users',
          query: "DELETE FROM users WHERE id = 101",
          risk: 'medium',
          reversible: false,
          warning: 'This will permanently delete the user record'
        },
        {
          stepId: 3,
          action: 'audit_log',
          description: 'Log email send action (cannot be reversed)',
          note: 'Welcome email to john@example.com cannot be unsent',
          risk: 'info',
          reversible: false
        }
      ],
      summary: {
        totalSteps: 3,
        reversibleSteps: 2,
        irreversibleSteps: 1,
        estimatedDuration: '30 seconds',
        riskLevel: 'medium'
      },
      warnings: [
        'User data will be permanently deleted',
        'Email notifications cannot be recalled',
        'This action cannot be undone'
      ]
    };
    
    res.json({
      success: true,
      rollbackPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create rollback plan: ' + error.message
    });
  }
});

// Execute rollback
app.post('/api/n8n/executions/:executionId/rollback', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { planId, confirmed } = req.body;
    
    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Rollback confirmation required'
      });
    }
    
    // Simulate rollback execution
    const rollbackExecution = {
      rollbackId: 'rb_' + Date.now(),
      executionId,
      planId,
      startedAt: new Date().toISOString(),
      steps: [
        {
          stepId: 1,
          action: 'revert_database_update',
          status: 'completed',
          message: 'Analytics counter restored to 105',
          completedAt: new Date().toISOString()
        },
        {
          stepId: 2,
          action: 'revert_database_insert',
          status: 'completed',
          message: 'User record (ID: 101) deleted',
          completedAt: new Date().toISOString()
        },
        {
          stepId: 3,
          action: 'audit_log',
          status: 'completed',
          message: 'Irreversible email action logged',
          completedAt: new Date().toISOString()
        }
      ],
      finishedAt: new Date().toISOString(),
      status: 'completed',
      summary: {
        stepsCompleted: 3,
        dataReverted: ['User record', 'Analytics counter'],
        dataUnrecoverable: ['Welcome email'],
        duration: '15 seconds'
      }
    };
    
    // Store rollback record
    actionHistory.rollbacks.push(rollbackExecution);
    
    // Save to file
    const logFile = path.join(ACTION_LOG_DIR, `rollback_${rollbackExecution.rollbackId}.json`);
    await fs.writeFile(logFile, JSON.stringify(rollbackExecution, null, 2));
    
    res.json({
      success: true,
      message: 'Execution rollback completed successfully',
      rollback: rollbackExecution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Rollback failed: ' + error.message
    });
  }
});

// Get rollback history
app.get('/api/n8n/rollbacks', async (req, res) => {
  try {
    res.json({
      success: true,
      rollbacks: actionHistory.rollbacks,
      total: actionHistory.rollbacks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rollback history: ' + error.message
    });
  }
});

// Manual action tracking (for real-time monitoring)
app.post('/api/n8n/track-action', async (req, res) => {
  try {
    const { executionId, nodeId, action, data } = req.body;
    
    const actionRecord = {
      id: 'action_' + Date.now(),
      executionId,
      nodeId,
      action,
      data,
      timestamp: new Date().toISOString(),
      tracked: true
    };
    
    // Store action for rollback purposes
    actionHistory.snapshots.set(actionRecord.id, actionRecord);
    
    res.json({
      success: true,
      message: 'Action tracked successfully',
      actionId: actionRecord.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to track action: ' + error.message
    });
  }
});

// Start server
app.listen(PORT, async () => {
  await ensureLogDir();
  console.log(`🎯 n8n Action Rollback API running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Rollback interface: file:///${__dirname}/n8n-action-rollback-interface.html`);
  console.log(`🔄 Tracking workflow executions and actions`);
});
