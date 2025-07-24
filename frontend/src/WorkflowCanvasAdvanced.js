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
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import './WorkflowCanvas.css';

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
  file: '📁',
  timer: '⏲',
  notification: '🔔',
};

function CustomNode({ data, selected, type }) {
  return (
    <div className={`custom-node ${type}-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-icon">{nodeIconMap[type] || '?'}</span>
        <span className="node-title">{data.label}</span>
      </div>
      {type !== 'start' && <Handle type="target" position={Position.Top} />}
      <div className="node-content">
        {/* Render node-specific fields here, simplified for brevity */}
        {Object.entries(data).map(([key, value]) =>
          key !== 'label' ? (
            <div className="node-field" key={key}>
              <span className="field-label">{key}:</span>
              <span className="field-value">{value}</span>
            </div>
          ) : null
        )}
      </div>
      {type !== 'end' && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
}

// Node types mapping
const nodeTypes = {
  start: (props) => <CustomNode {...props} type="start" />, // ...repeat for all types
  httpRequest: (props) => <CustomNode {...props} type="httpRequest" />, // ...etc
  setVariable: (props) => <CustomNode {...props} type="setVariable" />, // ...etc
  condition: (props) => <CustomNode {...props} type="condition" />, // ...etc
  delay: (props) => <CustomNode {...props} type="delay" />, // ...etc
  loop: (props) => <CustomNode {...props} type="loop" />, // ...etc
  log: (props) => <CustomNode {...props} type="log" />, // ...etc
  webhook: (props) => <CustomNode {...props} type="webhook" />, // ...etc
  end: (props) => <CustomNode {...props} type="end" />, // ...etc
  code: (props) => <CustomNode {...props} type="code" />, // ...etc
  switch: (props) => <CustomNode {...props} type="switch" />, // ...etc
  merge: (props) => <CustomNode {...props} type="merge" />, // ...etc
  set: (props) => <CustomNode {...props} type="set" />, // ...etc
  email: (props) => <CustomNode {...props} type="email" />, // ...etc
  slack: (props) => <CustomNode {...props} type="slack" />, // ...etc
  database: (props) => <CustomNode {...props} type="database" />, // ...etc
  ai: (props) => <CustomNode {...props} type="ai" />, // ...etc
  math: (props) => <CustomNode {...props} type="math" />, // ...etc
  file: (props) => <CustomNode {...props} type="file" />, // ...etc
  timer: (props) => <CustomNode {...props} type="timer" />, // ...etc
  notification: (props) => <CustomNode {...props} type="notification" />, // ...etc
};

// Available node types for the sidebar
const nodeTypesList = [
  { type: 'start', label: 'Start/Trigger', icon: '▶', color: '#FFD600' },
  { type: 'httpRequest', label: 'HTTP Request', icon: '🌐', color: '#FFD600' },
  { type: 'setVariable', label: 'Set Variable', icon: '📝', color: '#FFD600' },
  { type: 'condition', label: 'If Condition', icon: '?', color: '#FFD600' },
  { type: 'delay', label: 'Delay/Wait', icon: '⏱', color: '#FFD600' },
  { type: 'loop', label: 'Loop/For Each', icon: '🔄', color: '#FFD600' },
  { type: 'log', label: 'Log/Debug', icon: '🗒', color: '#FFD600' },
  { type: 'webhook', label: 'Webhook', icon: '🔗', color: '#FFD600' },
  { type: 'end', label: 'End', icon: '🛑', color: '#FFD600' },
  { type: 'code', label: 'Code', icon: '<>', color: '#FFD600' },
  { type: 'switch', label: 'Switch', icon: '⇄', color: '#FFD600' },
  { type: 'merge', label: 'Merge', icon: '⎇', color: '#FFD600' },
  { type: 'set', label: 'Set', icon: '📝', color: '#FFD600' },
  { type: 'email', label: 'Email', icon: '✉', color: '#FFD600' },
  { type: 'slack', label: 'Slack', icon: '💬', color: '#FFD600' },
  { type: 'database', label: 'Database', icon: '🗄', color: '#FFD600' },
  { type: 'ai', label: 'AI', icon: '🤖', color: '#FFD600' },
  { type: 'math', label: 'Math', icon: '∑', color: '#FFD600' },
  { type: 'file', label: 'File', icon: '📁', color: '#FFD600' },
  { type: 'timer', label: 'Timer', icon: '⏲', color: '#FFD600' },
  { type: 'notification', label: 'Notification', icon: '🔔', color: '#FFD600' },
];

// Workflow templates
const workflowTemplates = [
  {
    name: 'Simple API Call',
    description: 'Make an HTTP request and log the response',
    nodes: [
      { id: '1', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } },
      { id: '2', type: 'httpRequest', position: { x: 250, y: 150 }, data: { label: 'API Call', method: 'GET', url: 'https://api.example.com/data' } },
      { id: '3', type: 'log', position: { x: 250, y: 250 }, data: { label: 'Log Response', message: 'API Response received' } },
      { id: '4', type: 'end', position: { x: 250, y: 350 }, data: { label: 'End' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' }
    ]
  },
  {
    name: 'Conditional Workflow',
    description: 'A workflow with branching logic',
    nodes: [
      { id: '1', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } },
      { id: '2', type: 'setVariable', position: { x: 250, y: 150 }, data: { label: 'Set Amount', variable: 'amount', value: '1000' } },
      { id: '3', type: 'condition', position: { x: 250, y: 250 }, data: { label: 'Check Amount', condition: 'amount > 500' } },
      { id: '4', type: 'log', position: { x: 150, y: 350 }, data: { label: 'High Amount', message: 'Processing high amount' } },
      { id: '5', type: 'log', position: { x: 350, y: 350 }, data: { label: 'Low Amount', message: 'Processing low amount' } },
      { id: '6', type: 'end', position: { x: 250, y: 450 }, data: { label: 'End' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true' },
      { id: 'e3-5', source: '3', target: '5', sourceHandle: 'false' },
      { id: 'e4-6', source: '4', target: '6' },
      { id: 'e5-6', source: '5', target: '6' }
    ]
  }
];

const WorkflowCanvas = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [nodeSearch, setNodeSearch] = useState("");
  const { project } = useReactFlow();
  const reactFlowWrapper = useRef(null);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:10000';

  // Load saved workflows from backend
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/workflows`);
        if (response.ok) {
          const workflows = await response.json();
          setSavedWorkflows(workflows);
        }
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('savedWorkflows');
        if (saved) {
          setSavedWorkflows(JSON.parse(saved));
        }
      }
    };
    
    fetchWorkflows();
  }, [API_BASE_URL]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Add node to canvas
  const addNode = useCallback((type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { 
        x: 200 + Math.floor(Math.random() * 200), 
        y: 100 + Math.floor(Math.random() * 200) 
      },
      data: { 
        label: nodeTypesList.find(n => n.type === type)?.label || type 
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Duplicate selected node
  const duplicateNode = useCallback(() => {
    if (!selectedNode) return;
    
    const newNode = {
      ...selectedNode,
      id: `${selectedNode.type}-${Date.now()}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [selectedNode]);

  // Delete selected node
  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    
    setNodes((nds) => nds.filter(n => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode]);

  // Update node data
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      );
      // If the selected node is being updated, refresh selectedNode to latest
      const updatedNode = updatedNodes.find((node) => node.id === nodeId);
      if (selectedNode && selectedNode.id === nodeId && updatedNode) {
        setSelectedNode(updatedNode);
      }
      return updatedNodes;
    });
  }, [selectedNode]);

  // Context menu handlers
  const [contextMenu, setContextMenu] = useState(null);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      type: 'node',
      x: event.clientX,
      y: event.clientY,
      node
    });
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    
    setContextMenu({
      type: 'pane',
      x: event.clientX,
      y: event.clientY,
      position
    });
  }, [project]);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    setIsExecuting(true);
    setExecutionLog([]);
    
    // Find start node
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) {
      setExecutionLog(['❌ No start node found']);
      setIsExecuting(false);
      return;
    }
    
    try {
      // Create workflow object
      const workflow = {
        id: `temp-${Date.now()}`,
        name: workflowName,
        nodes,
        edges
      };
      
      // Execute on backend
      const response = await fetch(`${API_BASE_URL}/api/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow,
          input_data: {}
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const log = [`▶️ Workflow execution started`];
        
        if (result.execution_log) {
          result.execution_log.forEach(entry => {
            log.push(`${entry.node_type}: ${entry.output?.message || JSON.stringify(entry.output)}`);
          });
        }
        
        log.push(`✅ Workflow execution ${result.status}`);
        setExecutionLog(log);
      } else {
        setExecutionLog(['❌ Failed to execute workflow on backend']);
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      setExecutionLog(['❌ Workflow execution failed: ' + error.message]);
    }
    
    setIsExecuting(false);
  }, [nodes, edges, workflowName, API_BASE_URL]);

  // Save workflow
  const saveWorkflow = useCallback(async () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
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
  }, [workflowName, nodes, edges, savedWorkflows, API_BASE_URL]);

  // Load workflow
  const loadWorkflow = useCallback((workflow) => {
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
    setWorkflowName(workflow.name);
    setShowTemplates(false);
  }, []);

  // Load template
  const loadTemplate = useCallback((template) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setWorkflowName(template.name);
    setShowTemplates(false);
  }, []);

  // Export workflow as JSON
  const exportWorkflow = useCallback(() => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
      exported: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${workflowName.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [workflowName, nodes, edges]);

  // Drag-and-drop node creation
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top
    };
    const newNode = {
      id: `${type}-${+new Date()}`,
      type,
      position,
      data: { label: nodeTypesList.find(n => n.type === type)?.label || type }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, nodeTypesList]);

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="workflow-canvas-container" ref={reactFlowWrapper}>
      <div className="workflow-header">
        <div className="workflow-title">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="workflow-name-input"
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
            onClick={executeWorkflow} 
            disabled={isExecuting}
            className="action-btn execute-btn"
          >
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
        </div>
      </div>

      <div className="workflow-content">
        {/* Sidebar */}
        <div className="workflow-sidebar">
          <h3>Node Types</h3>
          <input
            type="text"
            className="node-search-input"
            placeholder="Search node..."
            value={nodeSearch}
            onChange={e => setNodeSearch(e.target.value)}
            style={{ marginBottom: '12px', width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FFD600', background: '#222', color: '#FFD600', fontSize: '15px' }}
          />
          <div className="node-types-list">
            {nodeTypesList.filter(n => n.label.toLowerCase().includes(nodeSearch.toLowerCase())).map((nodeType) => (
              <button
                key={nodeType.type}
                className="node-type-button"
                style={{ borderLeftColor: nodeType.color, justifyContent: 'flex-start' }}
                onClick={() => addNode(nodeType.type)}
                draggable
                onDragStart={(event) => onDragStart(event, nodeType.type)}
              >
                <span className="node-type-icon" style={{ textAlign: 'left', marginRight: '8px' }}>{nodeType.icon}</span>
                <span className="node-type-separator" style={{ borderLeft: '2px solid #FFD600', height: '24px', marginRight: '12px' }}></span>
                <span className="node-type-label">{nodeType.label}</span>
              </button>
            ))}
          </div>

          {/* Execution Log */}
          {executionLog.length > 0 && (
            <div className="execution-log">
              <h4>📊 Execution Log</h4>
              <div className="log-content">
                {executionLog.map((entry, index) => (
                  <div key={index} className="log-entry">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="workflow-canvas" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: '#111' }}
          >
            <MiniMap 
              style={{
                height: 120,
                backgroundColor: '#1e293b',
                border: '1px solid #334155'
              }}
              nodeColor={(node) => {
                const nodeType = nodeTypesList.find(n => n.type === node.type);
                return nodeType?.color || '#6b7280';
              }}
            />
            <Controls 
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155'
              }}
            />
            <Background color="#334155" gap={20} size={1} />
            
            {/* Execution Status Panel */}
            {isExecuting && (
              <Panel position="top-center">
                <div className="execution-status">
                  <span className="execution-spinner">⏳</span>
                  Executing workflow...
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {(selectedNode || selectedEdge) && (
          <div className="properties-panel">
            {selectedNode && (
              <>
                <h3>⚙️ Node Properties</h3>
                <div className="property-group">
                  <label>Label:</label>
                  <input
                    type="text"
                    value={selectedNode.data?.label || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  />
                </div>

                {/* Node-specific properties */}
                {selectedNode.type === 'httpRequest' && (
                  <>
                    <div className="property-group">
                      <label>Method:</label>
                      <select
                        value={selectedNode.data?.method || 'GET'}
                        onChange={(e) => updateNodeData(selectedNode.id, { method: e.target.value })}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div className="property-group">
                      <label>URL:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.url || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })}
                        placeholder="https://api.example.com/endpoint"
                      />
                    </div>
                    <div className="property-group">
                      <label>Headers (JSON):</label>
                      <textarea
                        value={selectedNode.data?.headers || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { headers: e.target.value })}
                        placeholder='{"Content-Type": "application/json"}'
                        rows="3"
                      />
                    </div>
                    <div className="property-group">
                      <label>Body (JSON):</label>
                      <textarea
                        value={selectedNode.data?.body || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { body: e.target.value })}
                        placeholder='{"key": "value"}'
                        rows="3"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <>
                    <div className="property-group">
                      <label>Condition:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.condition || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                        placeholder="variable > 100"
                      />
                    </div>
                    <div className="property-group">
                      <label>Comparison Type:</label>
                      <select
                        value={selectedNode.data?.comparisonType || 'greater'}
                        onChange={(e) => updateNodeData(selectedNode.id, { comparisonType: e.target.value })}
                      >
                        <option value="greater">Greater than</option>
                        <option value="less">Less than</option>
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedNode.type === 'delay' && (
                  <div className="property-group">
                    <label>Duration:</label>
                    <input
                      type="text"
                      value={selectedNode.data?.duration || '5s'}
                      onChange={(e) => updateNodeData(selectedNode.id, { duration: e.target.value })}
                      placeholder="5s, 2m, 1h"
                    />
                  </div>
                )}

                {selectedNode.type === 'setVariable' && (
                  <>
                    <div className="property-group">
                      <label>Variable Name:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.variable || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { variable: e.target.value })}
                        placeholder="variableName"
                      />
                    </div>
                    <div className="property-group">
                      <label>Value:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.value || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                        placeholder="Variable value"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'log' && (
                  <div className="property-group">
                    <label>Message:</label>
                    <textarea
                      value={selectedNode.data?.message || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                      placeholder="Log message or variable"
                      rows="3"
                    />
                  </div>
                )}

                {selectedNode.type === 'loop' && (
                  <>
                    <div className="property-group">
                      <label>Items (Array/Variable):</label>
                      <input
                        type="text"
                        value={selectedNode.data?.items || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { items: e.target.value })}
                        placeholder="arrayVariable or [1,2,3]"
                      />
                    </div>
                    <div className="property-group">
                      <label>Item Variable Name:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.itemVariable || 'item'}
                        onChange={(e) => updateNodeData(selectedNode.id, { itemVariable: e.target.value })}
                        placeholder="item"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'webhook' && (
                  <>
                    <div className="property-group">
                      <label>Webhook URL:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.webhookUrl || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { webhookUrl: e.target.value })}
                        placeholder="https://webhook.example.com/trigger"
                      />
                    </div>
                    <div className="property-group">
                      <label>Timeout (seconds):</label>
                      <input
                        type="number"
                        value={selectedNode.data?.timeout || 30}
                        onChange={(e) => updateNodeData(selectedNode.id, { timeout: parseInt(e.target.value) })}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'code' && (
                  <div className="property-group">
                    <label>Code:</label>
                    <textarea
                      value={selectedNode.data?.code || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { code: e.target.value })}
                      placeholder="Write your code here"
                      rows="6"
                    />
                  </div>
                )}

                {selectedNode.type === 'switch' && (
                  <div className="property-group">
                    <label>Switch Field:</label>
                    <input
                      type="text"
                      value={selectedNode.data?.switchField || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { switchField: e.target.value })}
                      placeholder="fieldName"
                    />
                  </div>
                )}

                {selectedNode.type === 'merge' && (
                  <div className="property-group">
                    <label>Merge Type:</label>
                    <select
                      value={selectedNode.data?.mergeType || 'simple'}
                      onChange={(e) => updateNodeData(selectedNode.id, { mergeType: e.target.value })}
                    >
                      <option value="simple">Simple</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                )}

                {selectedNode.type === 'set' && (
                  <div className="property-group">
                    <label>Fields:</label>
                    <input
                      type="text"
                      value={selectedNode.data?.fields || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { fields: e.target.value })}
                      placeholder="field1,field2,field3"
                    />
                  </div>
                )}

                {selectedNode.type === 'email' && (
                  <>
                    <div className="property-group">
                      <label>To:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.to || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { to: e.target.value })}
                        placeholder="recipient@example.com"
                      />
                    </div>
                    <div className="property-group">
                      <label>Subject:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.subject || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { subject: e.target.value })}
                        placeholder="Email subject"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'slack' && (
                  <>
                    <div className="property-group">
                      <label>Channel:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.channel || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { channel: e.target.value })}
                        placeholder="#channel-name"
                      />
                    </div>
                    <div className="property-group">
                      <label>Message:</label>
                      <textarea
                        value={selectedNode.data?.message || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                        placeholder="Message text"
                        rows="3"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'database' && (
                  <>
                    <div className="property-group">
                      <label>Database Type:</label>
                      <select
                        value={selectedNode.data?.db_type || 'mongodb'}
                        onChange={(e) => updateNodeData(selectedNode.id, { db_type: e.target.value })}
                      >
                        <option value="mongodb">MongoDB</option>
                        <option value="mysql">MySQL</option>
                        <option value="postgresql">PostgreSQL</option>
                        <option value="sqlite">SQLite</option>
                      </select>
                    </div>
                    <div className="property-group">
                      <label>Query:</label>
                      <textarea
                        value={selectedNode.data?.query || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { query: e.target.value })}
                        placeholder="SELECT * FROM table WHERE condition"
                        rows="3"
                      />
                    </div>
                    {selectedNode.data?.db_type === 'mongodb' && (
                      <div className="property-group">
                        <label>Collection:</label>
                        <input
                          type="text"
                          value={selectedNode.data?.collection || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, { collection: e.target.value })}
                          placeholder="collection_name"
                        />
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === 'ai' && (
                  <>
                    <div className="property-group">
                      <label>Prompt:</label>
                      <textarea
                        value={selectedNode.data?.prompt || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                        placeholder="Describe the AI task"
                        rows="3"
                      />
                    </div>
                    <div className="property-group">
                      <label>Model:</label>
                      <select
                        value={selectedNode.data?.model || 'gpt-3.5-turbo'}
                        onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
                      >
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      </select>
                    </div>
                    <div className="property-group">
                      <label>Max Tokens:</label>
                      <input
                        type="number"
                        value={selectedNode.data?.max_tokens || 150}
                        onChange={(e) => updateNodeData(selectedNode.id, { max_tokens: parseInt(e.target.value) })}
                        min="1"
                        max="4000"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'math' && (
                  <>
                    <div className="property-group">
                      <label>Expression:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.expression || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { expression: e.target.value })}
                        placeholder="1 + 1, sqrt(16), {{variable}} * 2"
                      />
                    </div>
                    <div className="property-group">
                      <label>Operation:</label>
                      <select
                        value={selectedNode.data?.operation || 'eval'}
                        onChange={(e) => updateNodeData(selectedNode.id, { operation: e.target.value })}
                      >
                        <option value="eval">Evaluate Expression</option>
                        <option value="sum">Sum Array</option>
                        <option value="average">Average</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedNode.type === 'file' && (
                  <>
                    <div className="property-group">
                      <label>Operation:</label>
                      <select
                        value={selectedNode.data?.operation || 'read'}
                        onChange={(e) => updateNodeData(selectedNode.id, { operation: e.target.value })}
                      >
                        <option value="read">Read File</option>
                        <option value="write">Write File</option>
                        <option value="append">Append to File</option>
                      </select>
                    </div>
                    <div className="property-group">
                      <label>File Path:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.path || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { path: e.target.value })}
                        placeholder="/path/to/file.txt"
                      />
                    </div>
                    {(selectedNode.data?.operation === 'write' || selectedNode.data?.operation === 'append') && (
                      <div className="property-group">
                        <label>Content:</label>
                        <textarea
                          value={selectedNode.data?.content || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                          placeholder="Content to write to file"
                          rows="4"
                        />
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === 'timer' && (
                  <>
                    <div className="property-group">
                      <label>Action:</label>
                      <select
                        value={selectedNode.data?.action || 'wait'}
                        onChange={(e) => updateNodeData(selectedNode.id, { action: e.target.value })}
                      >
                        <option value="wait">Wait/Delay</option>
                        <option value="schedule">Schedule Task</option>
                      </select>
                    </div>
                    <div className="property-group">
                      <label>Duration:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.duration || '5s'}
                        onChange={(e) => updateNodeData(selectedNode.id, { duration: e.target.value })}
                        placeholder="5s, 2m, 1h"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'notification' && (
                  <>
                    <div className="property-group">
                      <label>Title:</label>
                      <input
                        type="text"
                        value={selectedNode.data?.title || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { title: e.target.value })}
                        placeholder="Notification Title"
                      />
                    </div>
                    <div className="property-group">
                      <label>Message:</label>
                      <textarea
                        value={selectedNode.data?.message || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                        placeholder="Notification message"
                        rows="3"
                      />
                    </div>
                    <div className="property-group">
                      <label>Type:</label>
                      <select
                        value={selectedNode.data?.type || 'info'}
                        onChange={(e) => updateNodeData(selectedNode.id, { type: e.target.value })}
                      >
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="node-actions">
                  <button onClick={duplicateNode} className="action-btn node-action-btn">
                    Duplicate
                  </button>
                  <button onClick={deleteNode} className="action-btn node-action-btn delete-btn">
                    Delete
                  </button>
                </div>
              </>
            )}

            {selectedEdge && (
              <>
                <h3>🔗 Connection Properties</h3>
                <div className="property-group">
                  <label>Label:</label>
                  <input
                    type="text"
                    value={selectedEdge.label || ''}
                    onChange={(e) => {
                      setEdges((eds) =>
                        eds.map((edge) =>
                          edge.id === selectedEdge.id
                            ? { ...edge, label: e.target.value }
                            : edge
                        )
                      );
                    }}
                    placeholder="Connection label"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="templates-modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="templates-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📋 Workflow Templates</h3>
            
            <div className="templates-section">
              <h4>📄 Built-in Templates</h4>
              {workflowTemplates.map((template, index) => (
                <div key={index} className="template-item">
                  <div className="template-info">
                    <h5>{template.name}</h5>
                    <p>{template.description}</p>
                  </div>
                  <button
                    onClick={() => loadTemplate(template)}
                    className="template-load-btn"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>

            {savedWorkflows.length > 0 && (
              <div className="templates-section">
                <h4>💾 Saved Workflows</h4>
                {savedWorkflows.map((workflow) => (
                  <div key={workflow.id} className="template-item">
                    <div className="template-info">
                      <h5>{workflow.name}</h5>
                      <p>Created: {new Date(workflow.created).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => loadWorkflow(workflow)}
                      className="template-load-btn"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowTemplates(false)}
              className="modal-close-btn"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={closeContextMenu}
        >
          {contextMenu.type === 'node' && (
            <>
              <button onClick={() => { duplicateNode(); closeContextMenu(); }}>
                📋 Duplicate
              </button>
              <button onClick={() => { deleteNode(); closeContextMenu(); }}>
                🗑️ Delete
              </button>
            </>
          )}
          
          {contextMenu.type === 'pane' && (
            <>
              <div className="context-menu-section">Add Node:</div>
              {nodeTypesList.slice(0, 5).map((nodeType) => (
                <button
                  key={nodeType.type}
                  onClick={() => {
                    const newNode = {
                      id: `${nodeType.type}-${Date.now()}`,
                      type: nodeType.type,
                      position: contextMenu.position,
                      data: { label: nodeType.label }
                    };
                    setNodes((nds) => [...nds, newNode]);
                    closeContextMenu();
                  }}
                >
                  {nodeType.icon} {nodeType.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Main component wrapped with ReactFlowProvider
const WorkflowCanvasWrapper = () => (
  <ReactFlowProvider>
    <WorkflowCanvas />
  </ReactFlowProvider>
);

export default WorkflowCanvasWrapper;
