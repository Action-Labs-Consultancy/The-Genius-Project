import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, { 
  addEdge, 
  MiniMap, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  ReactFlowProvider,
  Handle,
  Position,
  useReactFlow,
  Panel,
  useViewport
} from 'reactflow';
import 'reactflow/dist/style.css';
import './WorkflowCanvas.css';
import GroupNode from './components/GroupNode';
import IfNode from './components/IfNode';
import NodeDetailsSidebar from './components/NodeDetailsSidebar';
import ExecutionLogPanel from './components/ExecutionLogPanel';
import { NODE_SCHEMAS, validateNodeParameters, getNodeDefaults, getAllNodeTypes } from './nodeSchemas';
import io from 'socket.io-client';
import { API_BASE_URL } from './config/api';

// Custom Node Components
// --- Modernized Node Icons (less emojis) ---
const nodeIconMap = {
  start: '▶',
  httpRequest: '🌐',
  setVariable: '📝',
  condition: '?',
  delay: '⏱',
  loop: '🔄',
  log: '🗒',
  webhook: '🔗',
  end: '🏁',
  code: '<>',
  switch: '⇄',
  merge: '⎇',
  set: '📝',
  email: '✉',
  slack: '💬',
  database: 'DB',
  ai: '🤖',
  math: '∑',
  file: '📄',
  timer: '⏲',
  notification: '🔔',
  // Business workflow nodes
  section: '�',
  request: '📋',
  department: '🏢',
  task: '✅',
  cardDetails: '🗃️',
  phase: '📊',
  result: '🎯'
};

const CustomNode = ({ data, type, id, selected }) => {
  const icon = nodeIconMap[type] || '⚪';
  const statusIcon = data.status === 'success' ? '✅' : data.status === 'error' ? '❌' : 
                     data.status === 'running' ? '🔄' : data.status === 'pending' ? '⏳' : '';
  
  // Check if node has validation errors
  const hasErrors = data.params ? validateNodeParameters(type, data.params).length > 0 : false;
  
  // Get dynamic node name from parameters
  const getNodeDisplayName = () => {
    if (data.config) {
      // For section nodes, show the section name
      if (type === 'section' && data.config.sectionName) {
        return data.config.sectionName;
      }
      // For other nodes, show their specific name fields
      if (type === 'request' && data.config.requestTitle) {
        return data.config.requestTitle;
      }
      if (type === 'department' && data.config.departmentName) {
        return data.config.departmentName;
      }
      if (type === 'task' && data.config.taskTitle) {
        return data.config.taskTitle;
      }
      if (type === 'cardDetails' && data.config.cardTitle) {
        return data.config.cardTitle;
      }
      if (type === 'phase' && data.config.phaseName) {
        return data.config.phaseName;
      }
      if (type === 'result' && data.config.resultTitle) {
        return data.config.resultTitle;
      }
    }
    
    // Fallback to default label
    return data.label || NODE_SCHEMAS[type]?.label || type;
  };

  // Show detailed parameters for cardDetails node
  const showDetailedParams = type === 'cardDetails';
  
  return (
    <div 
      className={`custom-node ${type} ${selected ? 'selected' : ''} ${data.status || ''} ${hasErrors ? 'has-errors' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#FFD600', width: 8, height: 8 }}
      />
      <div className="node-content">
        <div className="node-header">
          <span className="node-icon">{icon}</span>
          <span className="node-label" style={{ color: type === 'request' ? 'white' : '#333' }}>
            {getNodeDisplayName()}
          </span>
          {hasErrors && <span className="node-error">⚠️</span>}
          {statusIcon && <span className="node-status">{statusIcon}</span>}
        </div>
        
        {/* ONLY CARD DETAILS SHOWS PARAMETERS - ALL OTHER BUSINESS NODES SHOW JUST NAME */}
        {showDetailedParams && type === 'cardDetails' && data.config && (
          <div className="card-details-info">
            {data.config.cardType && (
              <div className="card-detail-item">
                <span className="card-detail-label">Type:</span>
                <span className="card-detail-value">{data.config.cardType}</span>
              </div>
            )}
            {data.config.description && (
              <div className="card-detail-item">
                <span className="card-detail-label">Desc:</span>
                <span className="card-detail-value">{data.config.description.length > 35 ? data.config.description.substring(0, 35) + '...' : data.config.description}</span>
              </div>
            )}
            {data.config.assignedTo && (
              <div className="card-detail-item">
                <span className="card-detail-label">Assigned:</span>
                <span className="card-detail-value">{data.config.assignedTo}</span>
              </div>
            )}
            {data.config.priority && (
              <div className="card-detail-item">
                <span className="card-detail-label">Priority:</span>
                <span className="card-detail-value">{data.config.priority}</span>
              </div>
            )}
            {data.config.acceptanceCriteria && (
              <div className="card-detail-item">
                <span className="card-detail-label">Criteria:</span>
                <span className="card-detail-value">{data.config.acceptanceCriteria.length > 30 ? data.config.acceptanceCriteria.substring(0, 30) + '...' : data.config.acceptanceCriteria}</span>
              </div>
            )}
            {data.config.storyPoints && (
              <div className="card-detail-item">
                <span className="card-detail-label">Points:</span>
                <span className="card-detail-value">{data.config.storyPoints}</span>
              </div>
            )}
            {data.config.labels && (
              <div className="card-detail-item">
                <span className="card-detail-label">Labels:</span>
                <span className="card-detail-value">{data.config.labels.length > 20 ? data.config.labels.substring(0, 20) + '...' : data.config.labels}</span>
              </div>
            )}
            {data.config.dueDate && (
              <div className="card-detail-item">
                <span className="card-detail-label">Due:</span>
                <span className="card-detail-value">{data.config.dueDate}</span>
              </div>
            )}
            {data.config.customFields && Object.keys(JSON.parse(data.config.customFields || '{}')).length > 0 && (
              <div className="card-detail-item">
                <span className="card-detail-label">Custom:</span>
                <span className="card-detail-value">{Object.keys(JSON.parse(data.config.customFields)).length} field(s)</span>
              </div>
            )}
          </div>
        )}
        
        {/* ABSOLUTELY NO PARAMETERS SHOWN FOR ANY NODES EXCEPT CARD DETAILS */}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#FFD600', width: 8, height: 8 }}
      />
    </div>
  );
};

// Use dynamic node types from schemas
const nodeTypesList = getAllNodeTypes();

// No hardcoded templates - will be fetched from API
// Professional Workflow Templates for Business Automation
const workflowTemplates = [
  {
    name: "Customer Onboarding Automation",
    description: "Automate new customer welcome emails, account setup, and follow-up sequences",
    category: "CRM",
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 100 },
        data: { 
          label: 'New Customer Registration',
          nodeType: 'start',
          config: { trigger: 'new_customer_signup' }
        }
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 300, y: 100 },
        data: { 
          label: 'Welcome Email',
          nodeType: 'email',
          config: {
            subject: 'Welcome to {{company_name}}!',
            template: 'welcome_template',
            to_email: '{{customer_email}}'
          }
        }
      },
      {
        id: 'delay-1',
        type: 'delay',
        position: { x: 500, y: 100 },
        data: { 
          label: 'Wait 24 Hours',
          nodeType: 'delay',
          config: { delay_amount: 24, delay_unit: 'hours' }
        }
      },
      {
        id: 'email-2',
        type: 'email',
        position: { x: 700, y: 100 },
        data: { 
          label: 'Getting Started Guide',
          nodeType: 'email',
          config: {
            subject: 'Your {{product_name}} Getting Started Guide',
            template: 'getting_started_template',
            to_email: '{{customer_email}}'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'start-1', target: 'email-1' },
      { id: 'e2-3', source: 'email-1', target: 'delay-1' },
      { id: 'e3-4', source: 'delay-1', target: 'email-2' }
    ]
  },
  {
    name: "Lead Qualification System",
    description: "Score and qualify leads automatically using AI and conditional logic",
    category: "Sales",
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 150 },
        data: { 
          label: 'New Lead Submission',
          nodeType: 'start',
          config: { trigger: 'form_submission' }
        }
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 150 },
        data: { 
          label: 'Lead Analysis',
          nodeType: 'ai',
          config: {
            prompt: 'Analyze this lead data and provide a qualification score from 1-10 based on company size, budget, and need urgency.',
            brainId: '',
            temperature: 0.3
          }
        }
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 500, y: 150 },
        data: { 
          label: 'High Quality Lead?',
          nodeType: 'condition',
          config: {
            condition_field: 'lead_score',
            condition_operator: 'greater_than',
            condition_value: '7'
          }
        }
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 700, y: 80 },
        data: { 
          label: 'Sales Team Alert',
          nodeType: 'email',
          config: {
            subject: 'High-Quality Lead Alert',
            to_email: 'sales@company.com',
            template: 'sales_alert_template'
          }
        }
      },
      {
        id: 'email-2',
        type: 'email',
        position: { x: 700, y: 220 },
        data: { 
          label: 'Nurture Sequence',
          nodeType: 'email',
          config: {
            subject: 'Thanks for your interest',
            to_email: '{{lead_email}}',
            template: 'nurture_template'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'start-1', target: 'ai-1' },
      { id: 'e2-3', source: 'ai-1', target: 'condition-1' },
      { id: 'e3-4', source: 'condition-1', target: 'email-1', label: 'Yes' },
      { id: 'e3-5', source: 'condition-1', target: 'email-2', label: 'No' }
    ]
  },
  {
    name: "Content Creation Pipeline",
    description: "Generate, review, and publish content automatically using AI agents",
    category: "Marketing",
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 200 },
        data: { 
          label: 'Content Request',
          nodeType: 'start',
          config: { trigger: 'manual' }
        }
      },
      {
        id: 'agent-1',
        type: 'agent',
        position: { x: 300, y: 200 },
        data: { 
          label: 'Content Writer Agent',
          nodeType: 'agent',
          config: {
            agentId: '',
            task: 'Write a blog post about {{topic}} targeting {{audience}}'
          }
        }
      },
      {
        id: 'agent-2',
        type: 'agent',
        position: { x: 500, y: 200 },
        data: { 
          label: 'Editor Agent',
          nodeType: 'agent',
          config: {
            agentId: '',
            task: 'Review and edit the content for grammar, tone, and SEO optimization'
          }
        }
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 700, y: 200 },
        data: { 
          label: 'Content Approved?',
          nodeType: 'condition',
          config: {
            condition_field: 'approval_status',
            condition_operator: 'equals',
            condition_value: 'approved'
          }
        }
      },
      {
        id: 'webhook-1',
        type: 'webhook',
        position: { x: 900, y: 130 },
        data: { 
          label: 'Publish to CMS',
          nodeType: 'webhook',
          config: {
            url: 'https://cms.company.com/api/publish',
            method: 'POST'
          }
        }
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 900, y: 270 },
        data: { 
          label: 'Request Revision',
          nodeType: 'email',
          config: {
            subject: 'Content needs revision',
            to_email: 'content-team@company.com'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'start-1', target: 'agent-1' },
      { id: 'e2-3', source: 'agent-1', target: 'agent-2' },
      { id: 'e3-4', source: 'agent-2', target: 'condition-1' },
      { id: 'e4-5', source: 'condition-1', target: 'webhook-1', label: 'Yes' },
      { id: 'e4-6', source: 'condition-1', target: 'email-1', label: 'No' }
    ]
  },
  {
    name: "Support Ticket Automation",
    description: "Automatically categorize, route, and respond to customer support tickets",
    category: "Support",
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 180 },
        data: { 
          label: 'New Support Ticket',
          nodeType: 'start',
          config: { trigger: 'ticket_created' }
        }
      },
      {
        id: 'ai-1',
        type: 'ai',
        position: { x: 300, y: 180 },
        data: { 
          label: 'Ticket Classification',
          nodeType: 'ai',
          config: {
            prompt: 'Classify this support ticket into categories: Technical, Billing, Feature Request, or Bug Report. Also determine urgency: Low, Medium, High.',
            brainId: '',
            temperature: 0.1
          }
        }
      },
      {
        id: 'switch-1',
        type: 'switch',
        position: { x: 500, y: 180 },
        data: { 
          label: 'Route by Category',
          nodeType: 'switch',
          config: {
            switch_field: 'category',
            cases: ['Technical', 'Billing', 'Feature Request', 'Bug Report']
          }
        }
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 700, y: 80 },
        data: { 
          label: 'Technical Team',
          nodeType: 'email',
          config: {
            to_email: 'tech-support@company.com',
            subject: 'Technical Support Ticket #{{ticket_id}}'
          }
        }
      },
      {
        id: 'email-2',
        type: 'email',
        position: { x: 700, y: 160 },
        data: { 
          label: 'Billing Team',
          nodeType: 'email',
          config: {
            to_email: 'billing@company.com',
            subject: 'Billing Inquiry #{{ticket_id}}'
          }
        }
      },
      {
        id: 'database-1',
        type: 'database',
        position: { x: 700, y: 240 },
        data: { 
          label: 'Log Feature Request',
          nodeType: 'database',
          config: {
            operation: 'insert',
            table: 'feature_requests',
            connection: 'main_db'
          }
        }
      },
      {
        id: 'webhook-1',
        type: 'webhook',
        position: { x: 700, y: 320 },
        data: { 
          label: 'Create Bug Report',
          nodeType: 'webhook',
          config: {
            url: 'https://bugs.company.com/api/create',
            method: 'POST'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'start-1', target: 'ai-1' },
      { id: 'e2-3', source: 'ai-1', target: 'switch-1' },
      { id: 'e3-4', source: 'switch-1', target: 'email-1', label: 'Technical' },
      { id: 'e3-5', source: 'switch-1', target: 'email-2', label: 'Billing' },
      { id: 'e3-6', source: 'switch-1', target: 'database-1', label: 'Feature Request' },
      { id: 'e3-7', source: 'switch-1', target: 'webhook-1', label: 'Bug Report' }
    ]
  },
  {
    name: "E-commerce Order Processing",
    description: "Process orders, check inventory, send confirmations, and handle fulfillment",
    category: "E-commerce",
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 160 },
        data: { 
          label: 'New Order',
          nodeType: 'start',
          config: { trigger: 'order_placed' }
        }
      },
      {
        id: 'database-1',
        type: 'database',
        position: { x: 300, y: 160 },
        data: { 
          label: 'Check Inventory',
          nodeType: 'database',
          config: {
            operation: 'select',
            query: 'SELECT stock_quantity FROM products WHERE id = {{product_id}}',
            connection: 'inventory_db'
          }
        }
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 500, y: 160 },
        data: { 
          label: 'In Stock?',
          nodeType: 'condition',
          config: {
            condition_field: 'stock_quantity',
            condition_operator: 'greater_than',
            condition_value: '0'
          }
        }
      },
      {
        id: 'email-1',
        type: 'email',
        position: { x: 700, y: 90 },
        data: { 
          label: 'Order Confirmation',
          nodeType: 'email',
          config: {
            to_email: '{{customer_email}}',
            subject: 'Order Confirmation #{{order_id}}',
            template: 'order_confirmation'
          }
        }
      },
      {
        id: 'webhook-1',
        type: 'webhook',
        position: { x: 900, y: 90 },
        data: { 
          label: 'Fulfillment Center',
          nodeType: 'webhook',
          config: {
            url: 'https://fulfillment.company.com/api/ship',
            method: 'POST'
          }
        }
      },
      {
        id: 'email-2',
        type: 'email',
        position: { x: 700, y: 230 },
        data: { 
          label: 'Out of Stock Notice',
          nodeType: 'email',
          config: {
            to_email: '{{customer_email}}',
            subject: 'Item temporarily unavailable',
            template: 'out_of_stock'
          }
        }
      },
      {
        id: 'database-2',
        type: 'database',
        position: { x: 900, y: 230 },
        data: { 
          label: 'Update Order Status',
          nodeType: 'database',
          config: {
            operation: 'update',
            query: 'UPDATE orders SET status = "backordered" WHERE id = {{order_id}}',
            connection: 'main_db'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'start-1', target: 'database-1' },
      { id: 'e2-3', source: 'database-1', target: 'condition-1' },
      { id: 'e3-4', source: 'condition-1', target: 'email-1', label: 'Yes' },
      { id: 'e4-5', source: 'email-1', target: 'webhook-1' },
      { id: 'e3-6', source: 'condition-1', target: 'email-2', label: 'No' },
      { id: 'e6-7', source: 'email-2', target: 'database-2' }
    ]
  },
  {
    name: "Social Media Management",
    description: "Create, schedule, and analyze social media posts across platforms",
    category: "Marketing",
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 100, y: 150 },
        data: { 
          label: 'Content Calendar Trigger',
          nodeType: 'start',
          config: { trigger: 'scheduled' }
        }
      },
      {
        id: 'agent-1',
        type: 'agent',
        position: { x: 300, y: 150 },
        data: { 
          label: 'Content Creator Agent',
          nodeType: 'agent',
          config: {
            agentId: '',
            task: 'Create engaging social media post about {{topic}} for {{platform}}'
          }
        }
      },
      {
        id: 'switch-1',
        type: 'switch',
        position: { x: 500, y: 150 },
        data: { 
          label: 'Platform Router',
          nodeType: 'switch',
          config: {
            switch_field: 'platform',
            cases: ['Twitter', 'LinkedIn', 'Facebook', 'Instagram']
          }
        }
      },
      {
        id: 'webhook-1',
        type: 'webhook',
        position: { x: 700, y: 50 },
        data: { 
          label: 'Post to Twitter',
          nodeType: 'webhook',
          config: {
            url: 'https://api.twitter.com/2/tweets',
            method: 'POST',
            headers: { 'Authorization': 'Bearer {{twitter_token}}' }
          }
        }
      },
      {
        id: 'webhook-2',
        type: 'webhook',
        position: { x: 700, y: 130 },
        data: { 
          label: 'Post to LinkedIn',
          nodeType: 'webhook',
          config: {
            url: 'https://api.linkedin.com/v2/shares',
            method: 'POST'
          }
        }
      },
      {
        id: 'webhook-3',
        type: 'webhook',
        position: { x: 700, y: 210 },
        data: { 
          label: 'Post to Facebook',
          nodeType: 'webhook',
          config: {
            url: 'https://graph.facebook.com/v18.0/{{page_id}}/feed',
            method: 'POST'
          }
        }
      },
      {
        id: 'webhook-4',
        type: 'webhook',
        position: { x: 700, y: 290 },
        data: { 
          label: 'Post to Instagram',
          nodeType: 'webhook',
          config: {
            url: 'https://graph.facebook.com/v18.0/{{instagram_id}}/media',
            method: 'POST'
          }
        }
      },
      {
        id: 'database-1',
        type: 'database',
        position: { x: 900, y: 150 },
        data: { 
          label: 'Log Analytics',
          nodeType: 'database',
          config: {
            operation: 'insert',
            table: 'social_posts',
            connection: 'analytics_db'
          }
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'start-1', target: 'agent-1' },
      { id: 'e2-3', source: 'agent-1', target: 'switch-1' },
      { id: 'e3-4', source: 'switch-1', target: 'webhook-1', label: 'Twitter' },
      { id: 'e3-5', source: 'switch-1', target: 'webhook-2', label: 'LinkedIn' },
      { id: 'e3-6', source: 'switch-1', target: 'webhook-3', label: 'Facebook' },
      { id: 'e3-7', source: 'switch-1', target: 'webhook-4', label: 'Instagram' },
      { id: 'e4-8', source: 'webhook-1', target: 'database-1' },
      { id: 'e5-8', source: 'webhook-2', target: 'database-1' },
      { id: 'e6-8', source: 'webhook-3', target: 'database-1' },
      { id: 'e7-8', source: 'webhook-4', target: 'database-1' }
    ]
  }
];

// Move nodeTypes and edgeTypes outside component to fix React Flow warning
const createNodeTypes = (handleUngroup) => ({
  start: (props) => <CustomNode {...props} type="start" />,
  httpRequest: (props) => <CustomNode {...props} type="httpRequest" />,
  setVariable: (props) => <CustomNode {...props} type="setVariable" />,
  condition: (props) => <CustomNode {...props} type="condition" />,
  ifCondition: (props) => <IfNode {...props} />,
  delay: (props) => <CustomNode {...props} type="delay" />,
  loop: (props) => <CustomNode {...props} type="loop" />,
  log: (props) => <CustomNode {...props} type="log" />,
  webhook: (props) => <CustomNode {...props} type="webhook" />,
  end: (props) => <CustomNode {...props} type="end" />,
  code: (props) => <CustomNode {...props} type="code" />,
  switch: (props) => <CustomNode {...props} type="switch" />,
  merge: (props) => <CustomNode {...props} type="merge" />,
  set: (props) => <CustomNode {...props} type="set" />,
  email: (props) => <CustomNode {...props} type="email" />,
  slack: (props) => <CustomNode {...props} type="slack" />,
  database: (props) => <CustomNode {...props} type="database" />,
  ai: (props) => <CustomNode {...props} type="ai" />,
  math: (props) => <CustomNode {...props} type="math" />,
  file: (props) => <CustomNode {...props} type="file" />,
  timer: (props) => <CustomNode {...props} type="timer" />,
  notification: (props) => <CustomNode {...props} type="notification" />,
  brain: (props) => <CustomNode {...props} type="brain" />,
  agent: (props) => <CustomNode {...props} type="agent" />,
  group: (props) => <GroupNode {...props} data={{...props.data, onUngroup: handleUngroup}} />,
  // Business Workflow Nodes
  section: (props) => <CustomNode {...props} type="section" />,
  request: (props) => <CustomNode {...props} type="request" />,
  department: (props) => <CustomNode {...props} type="department" />,
  task: (props) => <CustomNode {...props} type="task" />,
  cardDetails: (props) => <CustomNode {...props} type="cardDetails" />,
  phase: (props) => <CustomNode {...props} type="phase" />,
  result: (props) => <CustomNode {...props} type="result" />,
  // Add customNode as an alias for backward compatibility
  customNode: (props) => <CustomNode {...props} />,
});

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#b1b1b7' },
  type: 'smoothstep',
  markerEnd: {
    type: 'arrowclosed',
    color: '#b1b1b7',
  },
};

function WorkflowCanvas() {
  // Component state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [draggingGroup, setDraggingGroup] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [nodeSearch, setNodeSearch] = useState("");
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  
  // Execution Log Panel state
  const [isLogCollapsed, setIsLogCollapsed] = useState(true); // Start collapsed
  const [showParameterPanel, setShowParameterPanel] = useState(false);

  // Refs and ReactFlow instance
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  // WebSocket for real-time execution streaming
  const [socket, setSocket] = useState(null);
  
  // Initialize saved workflows from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedWorkflows');
    if (saved) {
      setSavedWorkflows(JSON.parse(saved));
    }
    
    // Fetch templates from API
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/workflow-templates`);
        if (response.ok) {
          const templatesData = await response.json();
          setTemplates(templatesData);
          console.log('✅ Loaded templates from API:', templatesData.length);
        } else {
          console.error('❌ Failed to fetch templates:', response.status);
          setTemplates(workflowTemplates); // fallback to empty array
        }
      } catch (error) {
        console.error('❌ Error fetching templates:', error);
        setTemplates(workflowTemplates); // fallback to empty array
      }
    };
    
    fetchTemplates();
  }, []);

  // Initialize WebSocket connection for real-time execution streaming
  useEffect(() => {
    const socketConnection = io(API_BASE_URL);
    setSocket(socketConnection);
    
    // Listen for execution log updates
    socketConnection.on('execution_log', (logEntry) => {
      setExecutionLog(prev => [...prev, logEntry]);
    });
    
    // Listen for node status updates
    socketConnection.on('node_status', (statusUpdate) => {
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === statusUpdate.nodeId 
            ? { ...node, data: { ...node.data, status: statusUpdate.status } }
            : node
        )
      );
    });
    
    // Cleanup on unmount
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Helper function to create a new node
  const createNode = useCallback((type, position) => {
    const defaults = getNodeDefaults(type);
    const schema = NODE_SCHEMAS[type];
    
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { 
        label: schema?.label || type,
        config: defaults,
        status: 'pending'
      }
    };
    return newNode;
  }, []);

  // ReactFlow event handlers
  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const onNodeClick = useCallback((event, node) => {
    if (isShiftPressed) {
      // Multi-select mode
      setSelectedNodes(prev => {
        const isSelected = prev.some(n => n.id === node.id);
        if (isSelected) {
          return prev.filter(n => n.id !== node.id);
        } else {
          return [...prev, node];
        }
      });
    } else {
      setSelectedNode(node);
      setSelectedNodes([node]);
      setShowParameterPanel(true); // Show the new sidebar
    }
    setSelectedEdge(null);
  }, [isShiftPressed]);

  const onNodeDoubleClick = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(node);
    setShowParameterPanel(true);
    setContextMenu(null);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setSelectedNodes([]);
    setContextMenu(null);
    setShowParameterPanel(false);
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      id: node.id,
      top: event.clientY,
      left: event.clientX,
    });
  }, []);

  // Ungroup function for handling group node ungroup action
  const handleUngroup = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      // Remove the group from groups state
      setGroups(prev => prev.filter(g => g.id !== groupId));
      
      // The nodes are already on the canvas, we just remove the group container
      // No need to modify nodes as they remain in their current positions
      console.log(`Ungrouped: ${group.title} (${group.nodeIds.length} nodes)`);
    }
  }, [groups]);

  // Handle node updates from sidebar
  const handleNodeUpdate = useCallback((nodeId, updatedData) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updatedData } }
        : node
    ));
    
    // Update selected node if it's the one being updated
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => ({
        ...prev,
        data: { ...prev.data, ...updatedData }
      }));
    }
  }, [selectedNode]);

  // Execute individual node for testing
  const executeNode = useCallback(async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Validate node parameters first
    const errors = validateNodeParameters(node.type, node.data.params || {});
    if (errors.length > 0) {
      console.error('Node validation failed:', errors);
      setExecutionLog(prev => [...prev, {
        nodeId,
        nodeName: node.data.label || node.type,
        status: 'error',
        message: `Validation failed: ${errors.join(', ')}`,
        timestamp: new Date().toISOString(),
        output: null
      }]);
      return;
    }

    // Update node status to running
    handleNodeUpdate(nodeId, { status: 'running' });
    
    // Add log entry for start
    setExecutionLog(prev => [...prev, {
      nodeId,
      nodeName: node.data.label || node.type,
      status: 'running',
      message: 'Node execution started',
      timestamp: new Date().toISOString(),
      output: null
    }]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/nodes/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId,
          nodeType: node.type,
          nodeData: node.data,
          workflowId: workflowName
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update node status and output
        handleNodeUpdate(nodeId, { 
          status: 'success',
          lastOutput: result.output,
          lastExecutionTime: new Date().toISOString()
        });
        
        // Add success log entry
        setExecutionLog(prev => [...prev, {
          nodeId,
          nodeName: node.data.label || node.type,
          status: 'success',
          message: 'Node executed successfully',
          timestamp: new Date().toISOString(),
          output: result.output
        }]);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Node execution failed');
      }
    } catch (error) {
      console.error('Node execution error:', error);
      
      // Update node status to error
      handleNodeUpdate(nodeId, { 
        status: 'error',
        lastError: error.message,
        lastExecutionTime: new Date().toISOString()
      });
      
      // Add error log entry
      setExecutionLog(prev => [...prev, {
        nodeId,
        nodeName: node.data.label || node.type,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
        output: null
      }]);
    }
  }, [nodes, handleNodeUpdate, workflowName, API_BASE_URL]);

  // Delete node function (moved before useEffect that uses it)
  const deleteNode = useCallback((nodeId) => {
    // Remove the node
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    
    // Remove any edges connected to this node
    setEdges(prev => prev.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    
    // Clear selection if this node was selected
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    
    // Remove from selected nodes if it was selected
    setSelectedNodes(prev => prev.filter(id => id !== nodeId));
    
    // Remove from any groups
    setGroups(prev => prev.map(group => ({
      ...group,
      nodeIds: group.nodeIds.filter(id => id !== nodeId)
    })).filter(group => group.nodeIds.length > 0));
    
    // Clear context menu
    setContextMenu(null);
    
    console.log(`Deleted node: ${nodeId}`);
  }, [selectedNode]);

  // Handle context menu actions
  const handleContextMenuAction = useCallback((action, nodeId) => {
    switch (action) {
      case 'delete':
        deleteNode(nodeId);
        break;
      case 'duplicate':
        // Find the node to duplicate
        const nodeToDuplicate = nodes.find(n => n.id === nodeId);
        if (nodeToDuplicate) {
          const newId = (Date.now() + Math.random()).toString();
          const newNode = {
            ...nodeToDuplicate,
            id: newId,
            position: {
              x: nodeToDuplicate.position.x + 50,
              y: nodeToDuplicate.position.y + 50
            },
            data: {
              ...nodeToDuplicate.data,
              label: `${nodeToDuplicate.data.label || nodeToDuplicate.type} (Copy)`
            }
          };
          setNodes(prev => [...prev, newNode]);
        }
        break;
      case 'ungroup':
        handleUngroup(nodeId);
        break;
      case 'duplicateGroup':
        const groupToDuplicate = groups.find(g => g.id === nodeId);
        if (groupToDuplicate) {
          const newGroupId = `group-${Date.now()}`;
          const nodeIdMap = {};
          
          // Duplicate all nodes in the group
          const duplicatedNodes = groupToDuplicate.nodeIds.map(oldNodeId => {
            const originalNode = nodes.find(n => n.id === oldNodeId);
            if (originalNode) {
              const newNodeId = `${oldNodeId}-copy-${Date.now()}`;
              nodeIdMap[oldNodeId] = newNodeId;
              return {
                ...originalNode,
                id: newNodeId,
                position: {
                  x: originalNode.position.x + 100,
                  y: originalNode.position.y + 100
                }
              };
            }
            return null;
          }).filter(Boolean);
          
          // Duplicate edges between group nodes
          const groupEdges = edges.filter(edge => 
            groupToDuplicate.nodeIds.includes(edge.source) && 
            groupToDuplicate.nodeIds.includes(edge.target)
          );
          const duplicatedEdges = groupEdges.map(edge => ({
            ...edge,
            id: `${edge.id}-copy-${Date.now()}`,
            source: nodeIdMap[edge.source],
            target: nodeIdMap[edge.target]
          }));
          
          // Create new group
          const newGroup = {
            ...groupToDuplicate,
            id: newGroupId,
            title: `${groupToDuplicate.title} (Copy)`,
            nodeIds: Object.values(nodeIdMap),
            position: {
              x: groupToDuplicate.position.x + 100,
              y: groupToDuplicate.position.y + 100
            }
          };
          
          setNodes(prev => [...prev, ...duplicatedNodes]);
          setEdges(prev => [...prev, ...duplicatedEdges]);
          setGroups(prev => [...prev, newGroup]);
        }
        break;
      default:
        break;
    }
    setContextMenu(null);
  }, [nodes, deleteNode]);

  // Log panel functions (moved before executeWorkflow to fix dependency order)
  const addLogEntry = useCallback((entry) => {
    setExecutionLog(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...entry
    }]);
  }, []);

  const clearExecutionLog = useCallback(() => {
    setExecutionLog([]);
  }, []);

  const toggleLogCollapse = useCallback(() => {
    setIsLogCollapsed(prev => !prev);
  }, []);

  // Execute workflow function (SINGLE DECLARATION)
  const executeWorkflow = useCallback(async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    setIsLogCollapsed(false); // Expand log when execution starts
    clearExecutionLog();
    
    // Add initial log entry
    const systemLogEntry = {
      node_id: 'system',
      node_name: 'Workflow System',
      status: 'running',
      message: 'Starting workflow execution...',
      timestamp: new Date().toISOString(),
      output: null
    };
    setExecutionLog([systemLogEntry]);
    
    try {
      // Validate all nodes first
      const validationErrors = [];
      nodes.forEach(node => {
        const nodeType = node.data.nodeType;
        const config = node.data.config || {};
        const errors = validateNodeParameters(nodeType, config);
        if (errors.length > 0) {
          validationErrors.push(`${node.data.label || nodeType}: ${errors.join(', ')}`);
        }
      });
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
      }
      
      // Find start node
      const startNode = nodes.find(n => n.data.nodeType === 'start');
      if (!startNode) {
        throw new Error('No start node found. Workflow must have a start node to execute.');
      }
      
      // Reset all node statuses
      const resetNodes = nodes.map(node => ({
        ...node,
        data: { ...node.data, status: 'pending' }
      }));
      setNodes(resetNodes);
      
      // Create workflow payload for new backend format
      const workflowPayload = {
        workflow: {
          id: `temp-${Date.now()}`,
          name: workflowName,
          nodes: resetNodes,
          edges,
          groups
        },
        input_data: {
          user_input: 'Manual execution',
          timestamp: new Date().toISOString()
        }
      };
      
      // Log workflow start
      setExecutionLog(prev => [...prev, {
        node_id: 'system',
        node_name: 'Workflow System',
        status: 'running',
        message: `Executing "${workflowName}" with ${nodes.length} nodes`,
        timestamp: new Date().toISOString(),
        output: { nodesCount: nodes.length, edgesCount: edges.length }
      }]);
      
      // Emit start execution event via WebSocket if available
      if (socket) {
        socket.emit('start_execution', {
          workflow_id: workflowPayload.workflow.id,
          workflow_name: workflowName
        });
      }
      
      // Execute workflow on backend
      const response = await fetch(`${API_BASE_URL}/api/workflows/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowPayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Process execution results
        if (result.status === 'success') {
          // Update nodes with execution results
          if (result.node_statuses) {
            const updatedNodes = nodes.map(node => {
              const nodeStatus = result.node_statuses[node.id];
              if (nodeStatus) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    status: nodeStatus.status,
                    lastOutput: nodeStatus.output,
                    lastExecutionTime: nodeStatus.completed_at,
                    error: nodeStatus.error
                  }
                };
              }
              return node;
            });
            setNodes(updatedNodes);
          }
          
          // Add execution log entries
          if (result.execution_log && Array.isArray(result.execution_log)) {
            const newLogEntries = result.execution_log.map(entry => ({
              node_id: entry.node_id,
              node_name: entry.node_name || entry.node_type,
              node_type: entry.node_type,
              status: entry.status,
              message: entry.message,
              timestamp: entry.timestamp,
              output: entry.output,
              error: entry.error
            }));
            setExecutionLog(prev => [...prev, ...newLogEntries]);
          }
          
          // Add completion log
          setExecutionLog(prev => [...prev, {
            node_id: 'system',
            node_name: 'Workflow System',
            status: 'success',
            message: `Workflow completed successfully in ${result.duration_seconds?.toFixed(2) || 'unknown'} seconds`,
            timestamp: new Date().toISOString(),
            output: {
              status: result.status,
              nodesExecuted: result.nodes_executed,
              duration: result.duration_seconds
            }
          }]);
        } else {
          throw new Error(result.error || 'Workflow execution failed');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      
      // Add error to execution log
      setExecutionLog(prev => [...prev, {
        node_id: 'system',
        node_name: 'Workflow System',
        status: 'error',
        message: `Workflow execution failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error.message
      }]);
      
      // Update nodes to show error state
      setNodes(prev => prev.map(node => ({
        ...node,
        data: { ...node.data, status: 'error' }
      })));
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, groups, workflowName, isExecuting, socket]);

  // Save workflow function
  const saveWorkflow = useCallback(async () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
      groups, // Include groups metadata
      created: new Date().toISOString()
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow)
      });
      
      if (response.ok) {
        const savedWorkflow = await response.json();
        const updated = [...savedWorkflows, savedWorkflow];
        setSavedWorkflows(updated);
        // Also save to localStorage as backup
        localStorage.setItem('savedWorkflows', JSON.stringify(updated));
        alert('Workflow saved successfully!');
      } else {
        throw new Error('Failed to save workflow');
      }
    } catch (error) {
      console.error('Save workflow error:', error);
      // Fallback to localStorage
      const workflow_with_id = {
        ...workflow,
        id: Date.now()
      };
      const updated = [...savedWorkflows, workflow_with_id];
      setSavedWorkflows(updated);
      localStorage.setItem('savedWorkflows', JSON.stringify(updated));
      alert('Workflow saved locally (backend unavailable)');
    }
  }, [workflowName, nodes, edges, groups, savedWorkflows, API_BASE_URL]);

  // Load workflow
  const loadWorkflow = useCallback((workflow) => {
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
    setGroups(workflow.groups || []); // Load groups if available
    setWorkflowName(workflow.name);
    setShowTemplates(false);
  }, []);

  // Load template
  const loadTemplate = useCallback((template) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setGroups(template.groups || []); // Load groups if available
    setWorkflowName(template.name);
    setShowTemplates(false);
  }, []);

  // Export workflow as JSON
  const exportWorkflow = useCallback(() => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
      groups,
      exported: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${workflowName.replace(/[^a-z0-9]/gi, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [workflowName, nodes, edges, groups]);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type) {
      return;
    }

    // Get the drop position relative to the ReactFlow canvas
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds || !reactFlowInstance) {
      return;
    }

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    const newNode = createNode(type, position);
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, createNode]);

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // Handle multi-selection with Shift key
  const onSelectionChange = useCallback(({ nodes: selectedNodeIds }) => {
    setSelectedNodes(selectedNodeIds);
  }, []);

  const createGroup = useCallback(() => {
    setShowGroupModal(true);
  }, []);

  const confirmCreateGroup = useCallback(() => {
    if (selectedNodes.length < 2) {
      alert('Please select at least 2 nodes to create a group.');
      return;
    }

    const groupId = `group-${Date.now()}`;
    const nodeIds = selectedNodes.map(node => node.id);
    
    // Calculate bounding box for the group
    const minX = Math.min(...selectedNodes.map(node => node.position.x)) - 20;
    const minY = Math.min(...selectedNodes.map(node => node.position.y)) - 50;
    const maxX = Math.max(...selectedNodes.map(node => node.position.x + (node.width || 200))) + 20;
    const maxY = Math.max(...selectedNodes.map(node => node.position.y + (node.height || 100))) + 20;

    const newGroup = {
      id: groupId,
      title: groupTitle || 'New Group',
      description: groupDescription || '',
      nodeIds,
      position: { x: minX, y: minY },
      size: { width: maxX - minX, height: maxY - minY },
      created: new Date().toISOString()
    };

    setGroups(prev => [...prev, newGroup]);
    setShowGroupModal(false);
    setGroupTitle('');
    setGroupDescription('');
    setSelectedNodes([]);
  }, [selectedNodes, groupTitle, groupDescription]);

  const deleteGroup = useCallback((groupId) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  }, []);

  const updateGroupPosition = useCallback((groupId, newPosition) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, position: newPosition }
        : group
    ));
  }, []);

  const onGroupDrag = useCallback((groupId, delta) => {
    // Move all nodes in the group
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setNodes(prev => prev.map(node => {
        if (group.nodeIds.includes(node.id)) {
          return {
            ...node,
            position: {
              x: node.position.x + delta.x,
              y: node.position.y + delta.y
            }
          };
        }
        return node;
      }));
      
      updateGroupPosition(groupId, {
        x: group.position.x + delta.x,
        y: group.position.y + delta.y
      });
    }
  }, [groups, updateGroupPosition]);

  const handleGroupMouseDown = useCallback((groupId, e) => {
    e.stopPropagation();
    setDraggingGroup({
      id: groupId,
      startPosition: { x: e.clientX, y: e.clientY }
    });
  }, []);

  const handleGroupMouseMove = useCallback((e) => {
    if (draggingGroup) {
      const delta = {
        x: e.clientX - draggingGroup.startPosition.x,
        y: e.clientY - draggingGroup.startPosition.y
      };
      onGroupDrag(draggingGroup.id, delta);
      setDraggingGroup(prev => ({
        ...prev,
        startPosition: { x: e.clientX, y: e.clientY }
      }));
    }
  }, [draggingGroup, onGroupDrag]);

  const handleGroupMouseUp = useCallback(() => {
    setDraggingGroup(null);
  }, []);

  // Add global mouse event listeners for group dragging
  useEffect(() => {
    if (draggingGroup) {
      const handleMouseMove = (e) => handleGroupMouseMove(e);
      const handleMouseUp = (e) => handleGroupMouseUp(e);
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingGroup, handleGroupMouseMove, handleGroupMouseUp]);

  // Keyboard event handling for grouping
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (e.key === 'g' && (e.ctrlKey || e.metaKey) && selectedNodes.length >= 2) {
        e.preventDefault();
        createGroup();
      }
      // Delete selected node with Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        e.preventDefault();
        deleteNode(selectedNode.id);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodes, createGroup, selectedNode, deleteNode]);

  // Memoized nodeTypes to prevent React Flow warnings
  const nodeTypes = useMemo(() => createNodeTypes(handleUngroup), [handleUngroup]);

  return (
    <div className="workflow-canvas-container">
      <div className="workflow-header">
        <div className="workflow-title">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="workflow-name-input"
            placeholder="Enter workflow name..."
          />
        </div>
        <div className="workflow-actions">
          <button onClick={() => setShowTemplates(!showTemplates)} className="action-btn">
            Templates
          </button>
          <button onClick={saveWorkflow} className="action-btn">
            Save
          </button>
          <button onClick={exportWorkflow} className="action-btn">
            Export
          </button>
          <button 
            onClick={createGroup} 
            disabled={selectedNodes.length < 2}
            className="action-btn group-btn"
            title={selectedNodes.length < 2 ? 'Hold Shift and click nodes to select, then group (Ctrl+G)' : `Create group from ${selectedNodes.length} selected nodes (Ctrl+G)`}
          >
            Group ({selectedNodes.length})
          </button>
          <button 
            onClick={executeWorkflow} 
            disabled={isExecuting}
            className="action-btn execute-btn"
          >
            {isExecuting ? '⏳ Executing...' : '▶️ Execute'}
          </button>
        </div>
      </div>

      <div className="workflow-content">
        {/* Left: Node Palette */}
        <div className="node-palette">
          <h3>Workflow Nodes</h3>
          <input
            type="text"
            placeholder="Search nodes..."
            value={nodeSearch}
            onChange={(e) => setNodeSearch(e.target.value)}
            className="node-search"
          />
          
          {Object.entries(nodeTypesList.reduce((acc, node) => {
            if (!nodeSearch || node.label.toLowerCase().includes(nodeSearch.toLowerCase())) {
              if (!acc[node.category]) acc[node.category] = [];
              acc[node.category].push(node);
            }
            return acc;
          }, {})).map(([category, categoryNodes]) => (
            <div key={category} className="node-category">
              <h4>{category}</h4>
              {categoryNodes.map((node) => (
                <div
                  key={node.type}
                  className="node-item"
                  draggable
                  onDragStart={(event) => onDragStart(event, node.type)}
                >
                  <span className="node-icon">{nodeIconMap[node.type]}</span>
                  <span className="node-label">{node.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Center: Canvas Area */}
        <div className="canvas-area" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onNodeContextMenu={onNodeContextMenu}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
              style={{ background: '#0f0f0f' }}
              onSelectionChange={onSelectionChange}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              multiSelectionKeyCode="Shift"
              selectionOnDrag={true}
              panOnDrag={!isShiftPressed}
              selectionMode="partial"
            >
              <MiniMap 
                style={{
                  height: 120,
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #FFD600',
                  borderRadius: '8px'
                }}
                nodeStrokeColor={(n) => {
                  if (n.type === 'input') return '#FFD600';
                  if (n.type === 'output') return '#FFD600';
                  if (n.type === 'default') return '#FFD600';
                  return '#FFD600';
                }}
                nodeColor={(n) => {
                  if (n.type === 'input') return '#333';
                  if (n.type === 'output') return '#333';
                  if (n.type === 'default') return '#333';
                  return '#333';
                }}
                nodeBorderRadius={8}
              />
              <Controls 
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #FFD600',
                  borderRadius: '8px'
                }}
              />
              <Background color="#333" gap={20} size={1} />
              
              {/* Group visualizations */}
              {groups.map(group => (
                <div
                  key={group.id}
                  className="group-visualization"
                  style={{
                    position: 'absolute',
                    left: group.position.x,
                    top: group.position.y,
                    width: group.size.width,
                    height: group.size.height,
                    border: '2px dashed #FFD600',
                    backgroundColor: 'rgba(255, 214, 0, 0.1)',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    zIndex: -1
                  }}
                >
                  <div className="group-label" style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '8px',
                    background: '#FFD600',
                    color: '#111',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {group.title}
                  </div>
                </div>
              ))}
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Workflow Templates</h2>
              <button onClick={() => setShowTemplates(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="templates-grid">
                {templates.map((template, index) => (
                  <div key={index} className="template-card">
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                    <button onClick={() => loadTemplate(template)} className="action-btn">
                      Load Template
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="saved-workflows">
                <h3>Saved Workflows</h3>
                {savedWorkflows.length === 0 ? (
                  <p>No saved workflows yet.</p>
                ) : (
                  <div className="workflows-list">
                    {savedWorkflows.map((workflow, index) => (
                      <div key={index} className="workflow-card">
                        <h4>{workflow.name}</h4>
                        <p>Created: {new Date(workflow.created).toLocaleDateString()}</p>
                        <button onClick={() => loadWorkflow(workflow)} className="action-btn">
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create Group</h2>
              <button onClick={() => setShowGroupModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <p>Creating group with {selectedNodes.length} selected nodes</p>
              <div className="form-group">
                <label>Group Title:</label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="Enter group title"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button onClick={confirmCreateGroup} className="action-btn">
                  Create Group
                </button>
                <button onClick={() => setShowGroupModal(false)} className="action-btn cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.top,
            left: contextMenu.left,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {/* Check if this is a group node */}
          {nodes.find(n => n.id === contextMenu.id)?.type === 'group' ? (
            <>
              <button
                className="context-menu-item"
                onClick={() => handleContextMenuAction('duplicateGroup', contextMenu.id)}
              >
                <span>📋</span>
                Duplicate Group
              </button>
              <button
                className="context-menu-item"
                onClick={() => handleContextMenuAction('ungroup', contextMenu.id)}
              >
                <span>📦</span>
                Ungroup
              </button>
              <button
                className="context-menu-item danger"
                onClick={() => handleContextMenuAction('delete', contextMenu.id)}
              >
                <span>🗑️</span>
                Delete Group
              </button>
            </>
          ) : (
            <>
              <button
                className="context-menu-item"
                onClick={() => handleContextMenuAction('duplicate', contextMenu.id)}
              >
                <span>📋</span>
                Duplicate
              </button>
              <button
                className="context-menu-item danger"
                onClick={() => handleContextMenuAction('delete', contextMenu.id)}
              >
                <span>🗑️</span>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Node Details Sidebar */}
      <NodeDetailsSidebar
        selectedNode={selectedNode}
        onNodeUpdate={handleNodeUpdate}
        onClose={() => setShowParameterPanel(false)}
        isVisible={showParameterPanel}
        edges={edges}
        nodes={nodes}
        onExecuteNode={executeNode}
      />

      {/* Execution Log Panel */}
      <ExecutionLogPanel
        executionLog={executionLog}
        isCollapsed={isLogCollapsed}
        onToggleCollapse={toggleLogCollapse}
        onClearLog={clearExecutionLog}
      />
    </div>
  );
}

export default WorkflowCanvas;
