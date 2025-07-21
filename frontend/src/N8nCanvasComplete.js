import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  getBezierPath,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import './N8nCanvasBlackYellow.css';
import { communityNodeLoader, COMMUNITY_NODES } from './utils/CommunityNodeLoader';

// N8n Node Registry - Complete node definitions
const N8N_NODES = {
  // Core Nodes
  start: { icon: '▶️', label: 'Start', color: '#10b981', category: 'Core', description: 'Start the workflow execution' },
  if: { icon: '❓', label: 'IF', color: '#f59e0b', category: 'Core', description: 'Conditional logic node' },
  switch: { icon: '🔀', label: 'Switch', color: '#8b5cf6', category: 'Core', description: 'Route data to different paths' },
  merge: { icon: '🔗', label: 'Merge', color: '#06b6d4', category: 'Core', description: 'Merge multiple data streams' },
  noOp: { icon: '⭕', label: 'No Operation', color: '#6b7280', category: 'Core', description: 'Pass data through without changes' },
  set: { icon: '📝', label: 'Set', color: '#8b5cf6', category: 'Core', description: 'Set values in JSON data' },
  code: { icon: '💻', label: 'Code', color: '#ef4444', category: 'Core', description: 'Execute JavaScript code' },
  function: { icon: '⚡', label: 'Function', color: '#f97316', category: 'Core', description: 'Execute custom function' },
  functionItem: { icon: '🔧', label: 'Function Item', color: '#84cc16', category: 'Core', description: 'Process each item with custom function' },
  
  // HTTP & API
  httpRequest: { icon: '🌐', label: 'HTTP Request', color: '#3b82f6', category: 'HTTP', description: 'Make HTTP requests' },
  webhook: { icon: '🔗', label: 'Webhook', color: '#f97316', category: 'HTTP', description: 'Receive HTTP webhooks' },
  respondToWebhook: { icon: '↩️', label: 'Respond to Webhook', color: '#10b981', category: 'HTTP', description: 'Send response to webhook' },
  
  // Email
  gmail: { icon: '📧', label: 'Gmail', color: '#ea4335', category: 'Email', description: 'Send and receive Gmail' },
  outlook: { icon: '📬', label: 'Outlook', color: '#0078d4', category: 'Email', description: 'Send and receive Outlook email' },
  emailReadImap: { icon: '📥', label: 'Email Read (IMAP)', color: '#6366f1', category: 'Email', description: 'Read emails via IMAP' },
  emailSend: { icon: '📤', label: 'Send Email', color: '#dc2626', category: 'Email', description: 'Send emails via SMTP' },
  
  // Communication
  slack: { icon: '💬', label: 'Slack', color: '#4a154b', category: 'Communication', description: 'Slack messaging and automation' },
  discord: { icon: '🎮', label: 'Discord', color: '#5865f2', category: 'Communication', description: 'Discord bot and messaging' },
  telegram: { icon: '📱', label: 'Telegram', color: '#0088cc', category: 'Communication', description: 'Telegram bot API' },
  whatsapp: { icon: '💬', label: 'WhatsApp', color: '#25d366', category: 'Communication', description: 'WhatsApp Business API' },
  microsoftTeams: { icon: '👥', label: 'Microsoft Teams', color: '#6264a7', category: 'Communication', description: 'Teams messaging and meetings' },
  
  // Social Media
  twitter: { icon: '🐦', label: 'Twitter', color: '#1da1f2', category: 'Social Media', description: 'Twitter API integration' },
  facebook: { icon: '📘', label: 'Facebook', color: '#1877f2', category: 'Social Media', description: 'Facebook Graph API' },
  instagram: { icon: '📷', label: 'Instagram', color: '#e4405f', category: 'Social Media', description: 'Instagram Basic Display API' },
  linkedin: { icon: '💼', label: 'LinkedIn', color: '#0077b5', category: 'Social Media', description: 'LinkedIn API integration' },
  youtube: { icon: '📺', label: 'YouTube', color: '#ff0000', category: 'Social Media', description: 'YouTube Data API' },
  tiktok: { icon: '🎵', label: 'TikTok', color: '#000000', category: 'Social Media', description: 'TikTok for Business API' },
  
  // Data & Databases
  mysql: { icon: '🐬', label: 'MySQL', color: '#4479a1', category: 'Database', description: 'MySQL database operations' },
  postgres: { icon: '🐘', label: 'PostgreSQL', color: '#336791', category: 'Database', description: 'PostgreSQL database operations' },
  mongodb: { icon: '🍃', label: 'MongoDB', color: '#47a248', category: 'Database', description: 'MongoDB operations' },
  redis: { icon: '🔴', label: 'Redis', color: '#dc382d', category: 'Database', description: 'Redis key-value store' },
  sqlite: { icon: '💾', label: 'SQLite', color: '#003b57', category: 'Database', description: 'SQLite database operations' },
  
  // File Operations
  readBinaryFile: { icon: '📁', label: 'Read Binary File', color: '#6b7280', category: 'Files', description: 'Read binary files' },
  writeBinaryFile: { icon: '💾', label: 'Write Binary File', color: '#374151', category: 'Files', description: 'Write binary files' },
  csv: { icon: '📊', label: 'CSV', color: '#16a34a', category: 'Files', description: 'Read and write CSV files' },
  json: { icon: '📋', label: 'JSON', color: '#facc15', category: 'Files', description: 'Parse and generate JSON' },
  xml: { icon: '🔖', label: 'XML', color: '#fb923c', category: 'Files', description: 'Parse and generate XML' },
  
  // Cloud Services
  googleSheets: { icon: '📊', label: 'Google Sheets', color: '#0f9d58', category: 'Google', description: 'Google Sheets operations' },
  googleDrive: { icon: '💾', label: 'Google Drive', color: '#4285f4', category: 'Google', description: 'Google Drive file operations' },
  googleCalendar: { icon: '📅', label: 'Google Calendar', color: '#ea4335', category: 'Google', description: 'Google Calendar events' },
  googleTranslate: { icon: '🌐', label: 'Google Translate', color: '#4285f4', category: 'Google', description: 'Google Translate API' },
  
  // AWS Services
  awsS3: { icon: '☁️', label: 'AWS S3', color: '#ff9900', category: 'AWS', description: 'Amazon S3 storage' },
  awsLambda: { icon: '⚡', label: 'AWS Lambda', color: '#ff9900', category: 'AWS', description: 'AWS Lambda functions' },
  awsSes: { icon: '📧', label: 'AWS SES', color: '#ff9900', category: 'AWS', description: 'Amazon Simple Email Service' },
  awsSns: { icon: '📱', label: 'AWS SNS', color: '#ff9900', category: 'AWS', description: 'Amazon Simple Notification Service' },
  
  // Productivity
  notion: { icon: '📝', label: 'Notion', color: '#000000', category: 'Productivity', description: 'Notion workspace automation' },
  airtable: { icon: '🗂️', label: 'Airtable', color: '#18bfff', category: 'Productivity', description: 'Airtable database operations' },
  trello: { icon: '📋', label: 'Trello', color: '#0079bf', category: 'Productivity', description: 'Trello board management' },
  asana: { icon: '🎯', label: 'Asana', color: '#f06a6a', category: 'Productivity', description: 'Asana project management' },
  jira: { icon: '🐛', label: 'Jira', color: '#0052cc', category: 'Productivity', description: 'Jira issue tracking' },
  
  // E-commerce
  shopify: { icon: '🛍️', label: 'Shopify', color: '#95bf47', category: 'E-commerce', description: 'Shopify store operations' },
  woocommerce: { icon: '🛒', label: 'WooCommerce', color: '#96588a', category: 'E-commerce', description: 'WooCommerce store management' },
  stripe: { icon: '💳', label: 'Stripe', color: '#635bff', category: 'Payment', description: 'Stripe payment processing' },
  paypal: { icon: '💰', label: 'PayPal', color: '#00457c', category: 'Payment', description: 'PayPal payment integration' },
  
  // Utilities
  wait: { icon: '⏱️', label: 'Wait', color: '#ef4444', category: 'Utilities', description: 'Wait for specified time' },
  cron: { icon: '⏰', label: 'Cron', color: '#6366f1', category: 'Triggers', description: 'Schedule workflow execution' },
  interval: { icon: '🔁', label: 'Interval', color: '#8b5cf6', category: 'Triggers', description: 'Run at regular intervals' },
  stopAndError: { icon: '🛑', label: 'Stop and Error', color: '#dc2626', category: 'Utilities', description: 'Stop execution with error' },
  
  // AI & ML
  openai: { icon: '🤖', label: 'OpenAI', color: '#10a37f', category: 'AI', description: 'OpenAI GPT and other models' },
  anthropic: { icon: '🧠', label: 'Anthropic', color: '#d4a574', category: 'AI', description: 'Anthropic Claude AI' },
  huggingFace: { icon: '🤗', label: 'Hugging Face', color: '#ff9a00', category: 'AI', description: 'Hugging Face models' },
  
  // Analytics
  googleAnalytics: { icon: '📈', label: 'Google Analytics', color: '#ff6f00', category: 'Analytics', description: 'Google Analytics data' },
  mixpanel: { icon: '📊', label: 'Mixpanel', color: '#9333ea', category: 'Analytics', description: 'Mixpanel analytics' },
  
  // Development
  github: { icon: '🐙', label: 'GitHub', color: '#333', category: 'Development', description: 'GitHub repository operations' },
  gitlab: { icon: '🦊', label: 'GitLab', color: '#fc6d26', category: 'Development', description: 'GitLab repository operations' },
  jenkins: { icon: '⚙️', label: 'Jenkins', color: '#d33833', category: 'Development', description: 'Jenkins CI/CD automation' }
};

// Enhanced N8n Node Component
const N8nNode = ({ data, selected, type }) => {
  const nodeConfig = N8N_NODES[type] || N8N_NODES.httpRequest;
  const isStartNode = type === 'start';
  const isConditionalNode = ['if', 'switch'].includes(type);
  
  return (
    <div className={`n8n-node ${type}-node ${selected ? 'selected' : ''}`} 
         style={{ borderColor: nodeConfig.color }}>
      {!isStartNode && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="n8n-handle n8n-handle-target"
        />
      )}
      
      <div className="n8n-node-header" style={{ backgroundColor: nodeConfig.color }}>
        <span className="n8n-node-icon">{nodeConfig.icon}</span>
        <span className="n8n-node-title">{data.label || nodeConfig.label}</span>
      </div>
      
      <div className="n8n-node-content">
        {data.description && (
          <div className="n8n-node-description">{data.description}</div>
        )}
        {data.status && (
          <div className={`n8n-node-status status-${data.status}`}>
            {data.status}
          </div>
        )}
      </div>
      
      {isConditionalNode ? (
        <>
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="true" 
            style={{ left: '25%' }}
            className="n8n-handle n8n-handle-source"
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="false" 
            style={{ left: '75%' }}
            className="n8n-handle n8n-handle-source"
          />
          <div className="n8n-conditional-labels">
            <span className="true-label">True</span>
            <span className="false-label">False</span>
          </div>
        </>
      ) : (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="n8n-handle n8n-handle-source"
        />
      )}
    </div>
  );
};

// Node Configuration Panel
const NodeConfigPanel = ({ selectedNode, onUpdateNode, onClose }) => {
  const [config, setConfig] = useState(selectedNode?.data || {});
  
  useEffect(() => {
    setConfig(selectedNode?.data || {});
  }, [selectedNode]);
  
  if (!selectedNode) return null;
  
  const nodeType = selectedNode.type;
  const nodeConfig = N8N_NODES[nodeType] || {};
  
  const handleSave = () => {
    onUpdateNode(selectedNode.id, config);
    onClose();
  };
  
  return (
    <div className="n8n-config-panel">
      <div className="config-header">
        <h3>{nodeConfig.label} Configuration</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <div className="config-content">
        <div className="config-field">
          <label>Node Name</label>
          <input
            type="text"
            value={config.label || ''}
            onChange={(e) => setConfig({...config, label: e.target.value})}
            placeholder={nodeConfig.label}
          />
        </div>
        
        {nodeType === 'httpRequest' && (
          <>
            <div className="config-field">
              <label>HTTP Method</label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => setConfig({...config, method: e.target.value})}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            
            <div className="config-field">
              <label>URL</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => setConfig({...config, url: e.target.value})}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            
            <div className="config-field">
              <label>Headers</label>
              <textarea
                value={config.headers || ''}
                onChange={(e) => setConfig({...config, headers: e.target.value})}
                placeholder='{"Content-Type": "application/json"}'
                rows={3}
              />
            </div>
            
            <div className="config-field">
              <label>Body</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => setConfig({...config, body: e.target.value})}
                placeholder='{"key": "value"}'
                rows={4}
              />
            </div>
          </>
        )}
        
        {nodeType === 'if' && (
          <div className="config-field">
            <label>Condition</label>
            <input
              type="text"
              value={config.condition || ''}
              onChange={(e) => setConfig({...config, condition: e.target.value})}
              placeholder="{{$json.value}} > 10"
            />
          </div>
        )}
        
        {nodeType === 'wait' && (
          <div className="config-field">
            <label>Wait Time (seconds)</label>
            <input
              type="number"
              value={config.waitTime || 5}
              onChange={(e) => setConfig({...config, waitTime: parseInt(e.target.value)})}
            />
          </div>
        )}
        
        {nodeType === 'code' && (
          <div className="config-field">
            <label>JavaScript Code</label>
            <textarea
              value={config.code || ''}
              onChange={(e) => setConfig({...config, code: e.target.value})}
              placeholder="// Your JavaScript code here\nreturn items.map(item => ({ ...item, processed: true }));"
              rows={8}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        )}
      </div>
      
      <div className="config-footer">
        <button onClick={handleSave} className="save-btn">Save</button>
        <button onClick={onClose} className="cancel-btn">Cancel</button>
      </div>
    </div>
  );
};

// Main Canvas Component
const N8nCanvasComplete = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowId, setWorkflowId] = useState(null);
  const [communityNodes, setCommunityNodes] = useState([]);
  const [showCommunityNodes, setShowCommunityNodes] = useState(false);
  const [installingNode, setInstallingNode] = useState(null);
  
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  
  // Load community nodes on component mount
  useEffect(() => {
    const loadCommunityNodes = async () => {
      try {
        const allNodes = communityNodeLoader.getAllNodes();
        setCommunityNodes(allNodes);
      } catch (error) {
        console.error('Failed to load community nodes:', error);
      }
    };
    
    loadCommunityNodes();
  }, []);
  
  // Combined node registry (built-in + community)
  const getAllAvailableNodes = () => {
    const allNodes = { ...N8N_NODES };
    
    // Add installed community nodes
    communityNodes.forEach(node => {
      if (node.installed) {
        allNodes[node.packageName] = {
          icon: node.icon,
          label: node.displayName,
          color: node.color,
          category: node.category,
          description: node.description
        };
      }
    });
    
    return allNodes;
  };
  
  // Node types for ReactFlow
  const nodeTypes = {
    ...Object.keys(getAllAvailableNodes()).reduce((acc, nodeType) => {
      acc[nodeType] = (props) => <N8nNode {...props} type={nodeType} />;
      return acc;
    }, {})
  };
  
  // Categories for filtering (including community categories)
  const categories = ['All', ...new Set([
    ...Object.values(N8N_NODES).map(node => node.category),
    ...communityNodes.map(node => node.category)
  ])];
  
  // Filter nodes based on search and category
  const filteredNodes = Object.entries(getAllAvailableNodes()).filter(([type, config]) => {
    const matchesSearch = config.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || config.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Filter community nodes for installation
  const filteredCommunityNodes = communityNodes.filter(node => {
    if (node.installed) return false; // Don't show already installed nodes
    
    const matchesSearch = node.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Install community node
  const handleInstallCommunityNode = async (packageName) => {
    setInstallingNode(packageName);
    
    try {
      const result = await communityNodeLoader.installNode(packageName);
      
      if (result.success) {
        // Refresh community nodes
        const allNodes = communityNodeLoader.getAllNodes();
        setCommunityNodes([...allNodes]);
        console.log(result.message);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error('Failed to install node:', error);
    } finally {
      setInstallingNode(null);
    }
  };
  
  // Event handlers
  const onConnect = useCallback((params) => {
    const edge = {
      ...params,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#ffd600' },
      style: { stroke: '#ffd600', strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(edge, eds));
  }, [setEdges]);
  
  const onDrop = useCallback((event) => {
    event.preventDefault();
    
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { 
        label: N8N_NODES[type]?.label || type,
        description: N8N_NODES[type]?.description || ''
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
  }, [screenToFlowPosition, setNodes]);
  
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  }, []);
  
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  
  // Workflow management functions
  const saveWorkflow = async () => {
    const workflow = {
      id: workflowId || `workflow-${Date.now()}`,
      name: workflowName,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });
      
      if (response.ok) {
        const saved = await response.json();
        setWorkflowId(saved.id);
        console.log('Workflow saved successfully');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };
  
  const executeWorkflow = async () => {
    if (nodes.length === 0) return;
    
    setIsExecuting(true);
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Workflow executed:', result);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    } finally {
      setIsExecuting(false);
    }
  };
  
  const onUpdateNode = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };
  
  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowName('Untitled Workflow');
    setWorkflowId(null);
  };
  
  const fitView = () => {
    // This would be handled by ReactFlow's fitView function
  };
  
  return (
    <div className="n8n-canvas-container">
      {/* Top Bar */}
      <div className="n8n-topbar">
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="workflow-name-input"
          placeholder="Workflow name"
        />
        
        <div className="workflow-controls">
          <button onClick={saveWorkflow} className="workflow-btn">
            💾 Save
          </button>
          <button 
            onClick={executeWorkflow} 
            className="workflow-btn"
            disabled={isExecuting}
          >
            {isExecuting ? '⏳ Running...' : '▶️ Execute'}
          </button>
          <button onClick={clearCanvas} className="workflow-btn">
            🗑️ Clear
          </button>
          <button onClick={fitView} className="workflow-btn">
            🔍 Fit View
          </button>
        </div>
      </div>
      
      {/* Left Panel */}
      <div className="n8n-left-panel">
        <div className="left-panel-tabs">
          <button 
            className={`left-panel-tab ${activeTab === 'workflows' ? 'active' : ''}`}
            onClick={() => setActiveTab('workflows')}
          >
            Workflows
          </button>
          <button 
            className={`left-panel-tab ${activeTab === 'executions' ? 'active' : ''}`}
            onClick={() => setActiveTab('executions')}
          >
            Executions
          </button>
          <button 
            className={`left-panel-tab ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
          >
            Credentials
          </button>
        </div>
        
        <div className="left-panel-content">
          {activeTab === 'workflows' && (
            <div className="workflows-tab">
              <p>Current workflow: {workflowName}</p>
              <p>Nodes: {nodes.length}</p>
              <p>Connections: {edges.length}</p>
            </div>
          )}
          
          {activeTab === 'executions' && (
            <div className="executions-tab">
              <p>Recent executions will appear here</p>
            </div>
          )}
          
          {activeTab === 'credentials' && (
            <div className="credentials-tab">
              <p>Manage your API credentials here</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Canvas */}
      <div className="n8n-main-area">
        <ReactFlow
          ref={reactFlowWrapper}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls className="n8n-controls" />
          <MiniMap className="n8n-minimap" />
          <Background variant="dots" gap={20} size={1} color="#333" />
          
          <Panel position="top-right" className="n8n-canvas-panel">
            <div className="canvas-stats">
              <span>Nodes: {nodes.length}</span>
              <span>Edges: {edges.length}</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
      
      {/* Right Panel - Node Library */}
      <div className="n8n-right-panel">
        <div className="node-library-header">
          <h3>Nodes</h3>
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="node-search"
          />
          
          <div className="node-library-tabs">
            <button 
              className={`node-tab ${!showCommunityNodes ? 'active' : ''}`}
              onClick={() => setShowCommunityNodes(false)}
            >
              Built-in
            </button>
            <button 
              className={`node-tab ${showCommunityNodes ? 'active' : ''}`}
              onClick={() => setShowCommunityNodes(true)}
            >
              Community
            </button>
          </div>
        </div>
        
        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="node-library">
          {!showCommunityNodes ? (
            // Built-in nodes
            filteredNodes.map(([type, config]) => (
              <div
                key={type}
                className="node-library-item"
                draggable
                onDragStart={(event) => onDragStart(event, type)}
                title={config.description}
              >
                <span className="node-library-icon">{config.icon}</span>
                <span className="node-library-label">{config.label}</span>
                <span className="node-library-category">{config.category}</span>
              </div>
            ))
          ) : (
            // Community nodes
            filteredCommunityNodes.map(node => (
              <div
                key={node.packageName}
                className="node-library-item community-node"
                title={node.description}
              >
                <span className="node-library-icon">{node.icon}</span>
                <div className="community-node-info">
                  <span className="node-library-label">{node.displayName}</span>
                  <span className="node-library-version">v{node.version}</span>
                  <span className="node-library-category">{node.category}</span>
                </div>
                <button
                  className="install-btn"
                  onClick={() => handleInstallCommunityNode(node.packageName)}
                  disabled={installingNode === node.packageName}
                >
                  {installingNode === node.packageName ? '⏳' : '📥'}
                </button>
              </div>
            ))
          )}
          
          {showCommunityNodes && filteredCommunityNodes.length === 0 && (
            <div className="no-nodes-message">
              {searchTerm ? 'No community nodes match your search.' : 'All community nodes are installed!'}
            </div>
          )}
        </div>
      </div>
      
      {/* Node Configuration Panel */}
      {showConfigPanel && (
        <NodeConfigPanel
          selectedNode={selectedNode}
          onUpdateNode={onUpdateNode}
          onClose={() => setShowConfigPanel(false)}
        />
      )}
    </div>
  );
};

// Wrapper with ReactFlowProvider
const N8nCanvasWrapper = () => (
  <ReactFlowProvider>
    <N8nCanvasComplete />
  </ReactFlowProvider>
);

export default N8nCanvasWrapper;
