import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Play,
  Save,
  FolderOpen,
  Download,
  Upload,
  Search,
  Copy,
  Trash2,
  Settings,
  Zap,
  Globe,
  Database,
  GitBranch,
  Clock,
  Repeat,
  FileText,
  Code,
  StopCircle,
  Plus
} from 'lucide-react';
import './WorkflowCanvas.css';
import CustomNode from './CustomNode';
import NodeSettingsPanel from './NodeSettingsPanel';
import ExecutionPanel from './ExecutionPanel';

const nodeTypes = {
  customNode: CustomNode,
};

const NODE_TYPES_CONFIG = {
  start: { label: 'Start/Trigger', icon: Play, color: '#10B981', category: 'Flow' },
  httpRequest: { label: 'HTTP Request', icon: Globe, color: '#3B82F6', category: 'Actions' },
  setVariable: { label: 'Set Variable', icon: Database, color: '#8B5CF6', category: 'Data' },
  ifCondition: { label: 'If Condition', icon: GitBranch, color: '#F59E0B', category: 'Logic' },
  delay: { label: 'Delay/Wait', icon: Clock, color: '#EF4444', category: 'Flow' },
  loop: { label: 'Loop/For Each', icon: Repeat, color: '#06B6D4', category: 'Logic' },
  log: { label: 'Log/Debug', icon: FileText, color: '#84CC16', category: 'Debug' },
  webhook: { label: 'Webhook', icon: Zap, color: '#F97316', category: 'Triggers' },
  customScript: { label: 'Custom Script', icon: Code, color: '#6366F1', category: 'Advanced' },
  end: { label: 'End', icon: StopCircle, color: '#6B7280', category: 'Flow' }
};

const CATEGORIES = ['All', 'Flow', 'Actions', 'Data', 'Logic', 'Debug', 'Triggers', 'Advanced'];

const WorkflowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const reactFlowInstance = useRef(null);
  const { setViewport } = useReactFlow();

  // Load workflows and templates on mount
  useEffect(() => {
    loadWorkflows();
    loadWorkflowTemplates();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadWorkflowTemplates = async () => {
    try {
      const response = await fetch('/api/workflow-templates');
      const data = await response.json();
      setWorkflowTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#FFD600', strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowSettingsPanel(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowSettingsPanel(false);
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(node);
    // Show context menu
  }, []);

  const addNode = (type) => {
    const config = NODE_TYPES_CONFIG[type];
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'customNode',
      position: { 
        x: 200 + Math.random() * 300, 
        y: 100 + Math.random() * 300 
      },
      data: {
        label: config.label,
        nodeType: type,
        icon: config.icon,
        color: config.color,
        config: getDefaultConfig(type)
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'httpRequest':
        return { url: '', method: 'GET', headers: {}, body: {} };
      case 'setVariable':
        return { name: 'variable', value: '' };
      case 'ifCondition':
        return { leftOperand: '', operator: '==', rightOperand: '' };
      case 'delay':
        return { seconds: 1 };
      case 'log':
        return { message: 'Log message' };
      case 'customScript':
        return { code: '', language: 'javascript' };
      case 'loop':
        return { items: [] };
      default:
        return {};
    }
  };

  const duplicateNode = () => {
    if (!selectedNode) return;
    
    const newNode = {
      ...selectedNode,
      id: `${selectedNode.data.nodeType}-${Date.now()}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50
      }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    
    setNodes((nds) => nds.filter(node => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter(edge => 
      edge.source !== selectedNode.id && edge.target !== selectedNode.id
    ));
    setSelectedNode(null);
    setShowSettingsPanel(false);
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  const saveWorkflow = async () => {
    const workflowData = {
      name: currentWorkflow?.name || `Workflow ${Date.now()}`,
      nodes,
      edges,
      viewport: reactFlowInstance.current?.getViewport(),
      created: currentWorkflow?.created || new Date().toISOString(),
      updated: new Date().toISOString()
    };

    try {
      let response;
      if (currentWorkflow?.id) {
        // Update existing workflow
        response = await fetch('/api/workflows', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...workflowData, id: currentWorkflow.id })
        });
      } else {
        // Create new workflow
        response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflowData)
        });
      }
      
      const savedWorkflow = await response.json();
      setCurrentWorkflow(savedWorkflow);
      loadWorkflows();
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    }
  };

  const loadWorkflow = async (workflowId) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      const workflow = await response.json();
      
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
      setCurrentWorkflow(workflow);
      
      if (workflow.viewport) {
        setViewport(workflow.viewport);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const loadTemplate = (template) => {
    setNodes(template.nodes || []);
    setEdges(template.edges || []);
    setCurrentWorkflow(null);
    setShowTemplates(false);
  };

  const executeWorkflow = async () => {
    if (!currentWorkflow?.id) {
      alert('Please save the workflow first');
      return;
    }

    setIsExecuting(true);
    setShowExecutionPanel(true);
    
    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      setExecutionResult({ status: 'error', error: error.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const exportWorkflow = () => {
    const workflowData = {
      name: currentWorkflow?.name || 'Exported Workflow',
      nodes,
      edges,
      exported: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(workflowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowData.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importWorkflow = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflowData = JSON.parse(e.target.result);
        setNodes(workflowData.nodes || []);
        setEdges(workflowData.edges || []);
        setCurrentWorkflow(null);
      } catch (error) {
        alert('Invalid workflow file');
      }
    };
    reader.readAsText(file);
  };

  const clearCanvas = () => {
    if (confirm('Clear the canvas? This will remove all nodes and connections.')) {
      setNodes([]);
      setEdges([]);
      setCurrentWorkflow(null);
      setSelectedNode(null);
      setShowSettingsPanel(false);
    }
  };

  const filteredNodeTypes = Object.entries(NODE_TYPES_CONFIG)
    .filter(([type, config]) => {
      const matchesSearch = config.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || config.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  return (
    <div className="workflow-canvas">
      {/* Top Toolbar */}
      <div className="workflow-toolbar">
        <div className="toolbar-section">
          <button onClick={saveWorkflow} className="toolbar-btn primary">
            <Save size={16} />
            Save
          </button>
          <button onClick={() => setShowTemplates(!showTemplates)} className="toolbar-btn">
            <FolderOpen size={16} />
            Templates
          </button>
          <button onClick={executeWorkflow} className="toolbar-btn success" disabled={isExecuting}>
            <Play size={16} />
            {isExecuting ? 'Running...' : 'Run'}
          </button>
        </div>
        
        <div className="toolbar-section">
          <button onClick={exportWorkflow} className="toolbar-btn">
            <Download size={16} />
            Export
          </button>
          <label className="toolbar-btn">
            <Upload size={16} />
            Import
            <input type="file" accept=".json" onChange={importWorkflow} style={{ display: 'none' }} />
          </label>
          <button onClick={clearCanvas} className="toolbar-btn danger">
            <Trash2 size={16} />
            Clear
          </button>
        </div>
        
        {currentWorkflow && (
          <div className="workflow-name">
            {currentWorkflow.name}
          </div>
        )}
      </div>

      <div className="workflow-content">
        {/* Left Sidebar - Node Palette */}
        <div className="workflow-sidebar">
          <div className="sidebar-section">
            <h3>Node Library</h3>
            
            {/* Search */}
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Categories */}
            <div className="categories">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Node Types */}
            <div className="node-types">
              {filteredNodeTypes.map(([type, config]) => {
                const IconComponent = config.icon;
                return (
                  <button
                    key={type}
                    className="node-type-btn"
                    onClick={() => addNode(type)}
                    style={{ borderLeft: `4px solid ${config.color}` }}
                  >
                    <IconComponent size={16} />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workflows List */}
          <div className="sidebar-section">
            <h3>Saved Workflows</h3>
            <div className="workflows-list">
              {workflows.map(workflow => (
                <button
                  key={workflow.id}
                  className={`workflow-item ${currentWorkflow?.id === workflow.id ? 'active' : ''}`}
                  onClick={() => loadWorkflow(workflow.id)}
                >
                  {workflow.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="workflow-main">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            fitView
            ref={reactFlowInstance}
            className="workflow-flow"
          >
            <Background color="#333" gap={20} size={1} />
            <Controls />
            <MiniMap 
              nodeColor="#FFD600"
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
            
            {/* Canvas Panels */}
            <Panel position="top-left">
              <div className="canvas-info">
                Nodes: {nodes.length} | Connections: {edges.length}
              </div>
            </Panel>
            
            {selectedNode && (
              <Panel position="top-right">
                <div className="selected-node-actions">
                  <button onClick={duplicateNode} className="action-btn">
                    <Copy size={14} />
                  </button>
                  <button onClick={deleteNode} className="action-btn danger">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setShowSettingsPanel(!showSettingsPanel)} className="action-btn">
                    <Settings size={14} />
                  </button>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right Sidebar - Settings Panel */}
        {showSettingsPanel && selectedNode && (
          <NodeSettingsPanel
            node={selectedNode}
            onUpdateNode={updateNodeData}
            onClose={() => setShowSettingsPanel(false)}
          />
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Workflow Templates</h2>
            <div className="templates-grid">
              {workflowTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <button onClick={() => loadTemplate(template)} className="template-btn">
                    Use Template
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTemplates(false)} className="modal-close">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Execution Panel */}
      {showExecutionPanel && (
        <ExecutionPanel
          isExecuting={isExecuting}
          executionResult={executionResult}
          onClose={() => setShowExecutionPanel(false)}
        />
      )}
    </div>
  );
};

const WorkflowCanvasWrapper = () => (
  <ReactFlowProvider>
    <WorkflowCanvas />
  </ReactFlowProvider>
);

export default WorkflowCanvasWrapper;
