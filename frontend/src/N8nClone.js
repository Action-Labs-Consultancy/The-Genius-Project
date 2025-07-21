// n8n Clone - Main Workflow Editor Component
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  MarkerType,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import node types and components
import { NODE_TYPES, BUILT_IN_INTEGRATIONS, CORE_NODES, AI_NODES } from './nodeRegistry';
import NodePalette from './components/NodePalette';
import NodeSettings from './components/NodeSettings';
import WorkflowToolbar from './components/WorkflowToolbar';
import ExecutionPanel from './components/ExecutionPanel';
import TemplatesModal from './components/TemplatesModal';
import CredentialsManager from './components/CredentialsManager';
import WorkflowHistory from './components/WorkflowHistory';
import './styles/N8nClone.css';

// Custom node components
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import CodeNode from './nodes/CodeNode';
import HttpRequestNode from './nodes/HttpRequestNode';
import WebhookNode from './nodes/WebhookNode';
import ScheduleNode from './nodes/ScheduleNode';
import IfNode from './nodes/IfNode';
import SwitchNode from './nodes/SwitchNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  code: CodeNode,
  httpRequest: HttpRequestNode,
  webhook: WebhookNode,
  schedule: ScheduleNode,
  if: IfNode,
  switch: SwitchNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 2, stroke: '#FFD600' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#FFD600' },
};

const WorkflowEditor = () => {
  // State management
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [workflowTags, setWorkflowTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadWorkflows();
    loadCredentials();
    loadExecutionHistory();
    loadCommunityNodes();
  }, []);

  // API functions
  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/credentials');
      const data = await response.json();
      setCredentials(data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const loadExecutionHistory = async () => {
    try {
      const response = await fetch('/api/executions');
      const data = await response.json();
      setExecutionHistory(data);
    } catch (error) {
      console.error('Failed to load execution history:', error);
    }
  };

  const loadCommunityNodes = async () => {
    try {
      const response = await fetch('/api/community-nodes');
      const data = await response.json();
      // Register community nodes dynamically
      data.forEach(nodeConfig => {
        NODE_TYPES[nodeConfig.type] = nodeConfig;
      });
    } catch (error) {
      console.error('Failed to load community nodes:', error);
    }
  };

  // Workflow operations
  const saveWorkflow = async () => {
    if (!currentWorkflow?.name) {
      const name = prompt('Enter workflow name:');
      if (!name) return;
      setCurrentWorkflow(prev => ({ ...prev, name }));
    }

    const workflowData = {
      id: currentWorkflow?.id || generateId(),
      name: currentWorkflow?.name,
      nodes: nodes.map(node => ({
        ...node,
        data: { ...node.data }
      })),
      edges,
      tags: workflowTags,
      active: currentWorkflow?.active || false,
      created: currentWorkflow?.created || new Date().toISOString(),
      updated: new Date().toISOString(),
      settings: {
        timezone: 'UTC',
        saveExecutionProgress: true,
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        saveManualExecutions: true,
        callerPolicy: 'workflowOwner',
        errorWorkflow: null,
      }
    };

    try {
      const method = currentWorkflow?.id ? 'PUT' : 'POST';
      const response = await fetch('/api/workflows', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });

      if (response.ok) {
        const savedWorkflow = await response.json();
        setCurrentWorkflow(savedWorkflow);
        loadWorkflows();
        showNotification('Workflow saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      showNotification('Failed to save workflow', 'error');
    }
  };

  const executeWorkflow = async () => {
    if (!currentWorkflow?.id) {
      showNotification('Please save the workflow first', 'warning');
      return;
    }

    setIsExecuting(true);
    
    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {},
          mode: 'manual'
        })
      });

      const result = await response.json();
      setExecutionResult(result);
      setIsRightPanelOpen(true);
      loadExecutionHistory();
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      setExecutionResult({ 
        status: 'error', 
        error: error.message,
        executionId: generateId(),
        startedAt: new Date().toISOString(),
        stoppedAt: new Date().toISOString()
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Node operations
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      id: generateId(),
      ...defaultEdgeOptions
    };
    setEdges(eds => addEdge(newEdge, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setIsRightPanelOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback((nodeType, position = null) => {
    const nodeConfig = NODE_TYPES[nodeType] || BUILT_IN_INTEGRATIONS[nodeType] || CORE_NODES[nodeType];
    
    if (!nodeConfig) {
      console.error(`Unknown node type: ${nodeType}`);
      return;
    }

    const newNode = {
      id: generateId(),
      type: nodeConfig.category === 'trigger' ? 'trigger' : 'action',
      position: position || {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
      },
      data: {
        nodeType: nodeType,
        label: nodeConfig.displayName,
        description: nodeConfig.description,
        inputs: nodeConfig.inputs || {},
        outputs: nodeConfig.outputs || {},
        credentials: nodeConfig.credentials || [],
        properties: nodeConfig.properties || [],
        ...getDefaultNodeData(nodeType)
      }
    };

    setNodes(nds => [...nds, newNode]);
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes(nds =>
      nds.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  // Utility functions
  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const getDefaultNodeData = (nodeType) => {
    const defaults = {
      httpRequest: {
        method: 'GET',
        url: '',
        headers: {},
        body: '',
        authentication: 'none'
      },
      webhook: {
        httpMethod: 'POST',
        path: generateId(),
        responseMode: 'onReceived'
      },
      schedule: {
        rule: {
          interval: [{ field: 'cronExpression', value: '0 0 * * *' }]
        }
      },
      code: {
        mode: 'runOnceForAllItems',
        jsCode: '// Write your JavaScript code here\nreturn items;'
      }
    };
    return defaults[nodeType] || {};
  };

  const showNotification = (message, type = 'info') => {
    // Implementation for toast notifications
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            saveWorkflow();
            break;
          case 'Enter':
            event.preventDefault();
            executeWorkflow();
            break;
        }
      }
      
      if (event.key === 'Tab') {
        event.preventDefault();
        setIsRightPanelOpen(!isRightPanelOpen);
      }

      if (event.key === 'Delete' && selectedNode) {
        deleteNode(selectedNode.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, isRightPanelOpen]);

  return (
    <div className="n8n-editor">
      {/* Top Toolbar */}
      <WorkflowToolbar
        currentWorkflow={currentWorkflow}
        onSave={saveWorkflow}
        onExecute={executeWorkflow}
        isExecuting={isExecuting}
        onShowTemplates={() => setShowTemplates(true)}
        onShowHistory={() => setShowHistory(true)}
        onToggleActive={(active) => setCurrentWorkflow(prev => ({ ...prev, active }))}
      />

      <div className="editor-content">
        {/* Left Panel */}
        {isLeftPanelOpen && (
          <div className="left-panel">
            <div className="panel-tabs">
              <button 
                className={activeTab === 'overview' ? 'active' : ''}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={activeTab === 'credentials' ? 'active' : ''}
                onClick={() => setActiveTab('credentials')}
              >
                Credentials
              </button>
              <button 
                className={activeTab === 'executions' ? 'active' : ''}
                onClick={() => setActiveTab('executions')}
              >
                Executions
              </button>
            </div>

            <div className="panel-content">
              {activeTab === 'overview' && (
                <div>
                  <h3>Workflows</h3>
                  <div className="workflows-list">
                    {workflows.map(workflow => (
                      <div 
                        key={workflow.id} 
                        className={`workflow-item ${currentWorkflow?.id === workflow.id ? 'active' : ''}`}
                        onClick={() => loadWorkflow(workflow.id)}
                      >
                        <div className="workflow-name">{workflow.name}</div>
                        <div className="workflow-status">
                          {workflow.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'credentials' && (
                <CredentialsManager 
                  credentials={credentials}
                  onUpdate={loadCredentials}
                />
              )}

              {activeTab === 'executions' && (
                <div>
                  <h3>Recent Executions</h3>
                  <div className="executions-list">
                    {executionHistory.slice(0, 10).map(execution => (
                      <div key={execution.id} className="execution-item">
                        <div className={`execution-status ${execution.status}`}>
                          {execution.status}
                        </div>
                        <div className="execution-time">
                          {new Date(execution.startedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Canvas */}
        <div className="canvas-container" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionMode={ConnectionMode.Loose}
            fitView
            onInit={(instance) => (reactFlowInstance.current = instance)}
          >
            <Background color="#444" gap={20} size={1} variant="dots" />
            <Controls />
            <MiniMap 
              nodeColor="#FFD600"
              nodeStrokeWidth={2}
              zoomable
              pannable
            />
            
            <Panel position="top-left">
              <div className="canvas-info">
                <span>Nodes: {nodes.length}</span>
                <span>Connections: {edges.length}</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Panel - Node Palette or Settings */}
        {isRightPanelOpen && (
          <div className="right-panel">
            {selectedNode ? (
              <NodeSettings
                node={selectedNode}
                credentials={credentials}
                onUpdateNode={updateNodeData}
                onDeleteNode={() => deleteNode(selectedNode.id)}
                onClose={() => setIsRightPanelOpen(false)}
              />
            ) : (
              <NodePalette
                onAddNode={addNode}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTemplates && (
        <TemplatesModal
          onClose={() => setShowTemplates(false)}
          onLoadTemplate={(template) => {
            setNodes(template.nodes || []);
            setEdges(template.edges || []);
            setCurrentWorkflow(null);
            setShowTemplates(false);
          }}
        />
      )}

      {showHistory && (
        <WorkflowHistory
          workflowId={currentWorkflow?.id}
          onClose={() => setShowHistory(false)}
          onRestoreVersion={(version) => {
            setNodes(version.nodes || []);
            setEdges(version.edges || []);
            setShowHistory(false);
          }}
        />
      )}

      {executionResult && (
        <ExecutionPanel
          execution={executionResult}
          onClose={() => setExecutionResult(null)}
        />
      )}
    </div>
  );
};

// Wrap with ReactFlowProvider
const N8nClone = () => (
  <ReactFlowProvider>
    <WorkflowEditor />
  </ReactFlowProvider>
);

export default N8nClone;
