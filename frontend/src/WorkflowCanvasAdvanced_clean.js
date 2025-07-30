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
import GroupNode from './components/GroupNode';
import IfNode from './components/IfNode';

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
  notification: '🔔'
};

const CustomNode = ({ data, type, id, selected }) => {
  const icon = nodeIconMap[type] || '⚪';
  const statusIcon = data.status === 'success' ? '✅' : data.status === 'error' ? '❌' : '';
  
  return (
    <div className={`custom-node ${type} ${selected ? 'selected' : ''} ${data.status || ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', width: 8, height: 8 }}
      />
      <div className="node-content">
        <div className="node-header">
          <span className="node-icon">{icon}</span>
          <span className="node-label">{data.label || type}</span>
          {statusIcon && <span className="node-status">{statusIcon}</span>}
        </div>
        {data.params && Object.keys(data.params).length > 0 && (
          <div className="node-params">
            {Object.entries(data.params).map(([key, value]) => (
              <div key={key} className="param">
                <span className="param-key">{key}:</span>
                <span className="param-value">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', width: 8, height: 8 }}
      />
    </div>
  );
};

const nodeTypesList = [
  { type: 'start', label: 'Start', category: 'Flow' },
  { type: 'httpRequest', label: 'HTTP Request', category: 'Network' },
  { type: 'setVariable', label: 'Set Variable', category: 'Data' },
  { type: 'condition', label: 'Condition', category: 'Logic' },
  { type: 'ifCondition', label: 'IF', category: 'Logic' },
  { type: 'delay', label: 'Delay', category: 'Flow' },
  { type: 'loop', label: 'Loop', category: 'Flow' },
  { type: 'log', label: 'Log', category: 'Debug' },
  { type: 'webhook', label: 'Webhook', category: 'Network' },
  { type: 'end', label: 'End', category: 'Flow' },
  { type: 'code', label: 'Code', category: 'Logic' },
  { type: 'switch', label: 'Switch', category: 'Logic' },
  { type: 'merge', label: 'Merge', category: 'Flow' },
  { type: 'set', label: 'Set', category: 'Data' },
  { type: 'email', label: 'Email', category: 'Communication' },
  { type: 'slack', label: 'Slack', category: 'Communication' },
  { type: 'database', label: 'Database', category: 'Data' },
  { type: 'ai', label: 'AI', category: 'AI' },
  { type: 'math', label: 'Math', category: 'Data' },
  { type: 'file', label: 'File', category: 'Data' },
  { type: 'timer', label: 'Timer', category: 'Flow' },
  { type: 'notification', label: 'Notification', category: 'Communication' }
];

const workflowTemplates = [
  {
    name: 'HTTP to Database',
    description: 'Fetch data from an API and store in database',
    nodes: [
      { id: '1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
      { id: '2', type: 'httpRequest', position: { x: 100, y: 200 }, data: { label: 'Fetch Data', params: { url: 'https://api.example.com/data', method: 'GET' } } },
      { id: '3', type: 'database', position: { x: 100, y: 300 }, data: { label: 'Save to DB', params: { operation: 'insert', table: 'data' } } },
      { id: '4', type: 'end', position: { x: 100, y: 400 }, data: { label: 'End' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' }
    ]
  },
  {
    name: 'Data Processing Pipeline',
    description: 'Process data with conditions and loops',
    nodes: [
      { id: '1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
      { id: '2', type: 'setVariable', position: { x: 100, y: 200 }, data: { label: 'Set Counter', params: { variable: 'counter', value: '0' } } },
      { id: '3', type: 'loop', position: { x: 100, y: 300 }, data: { label: 'Process Loop', params: { iterations: '10' } } },
      { id: '4', type: 'condition', position: { x: 300, y: 300 }, data: { label: 'Check Value', params: { condition: 'counter > 5' } } },
      { id: '5', type: 'log', position: { x: 500, y: 300 }, data: { label: 'Log Result' } },
      { id: '6', type: 'end', position: { x: 100, y: 500 }, data: { label: 'End' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
      { id: 'e3-6', source: '3', target: '6' }
    ]
  },
  {
    name: 'Notification System',
    description: 'Send notifications via multiple channels',
    nodes: [
      { id: '1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
      { id: '2', type: 'webhook', position: { x: 100, y: 200 }, data: { label: 'Receive Event' } },
      { id: '3', type: 'switch', position: { x: 100, y: 300 }, data: { label: 'Route Message', params: { field: 'type' } } },
      { id: '4', type: 'email', position: { x: 50, y: 450 }, data: { label: 'Send Email' } },
      { id: '5', type: 'slack', position: { x: 150, y: 450 }, data: { label: 'Send Slack' } },
      { id: '6', type: 'end', position: { x: 100, y: 600 }, data: { label: 'End' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e3-5', source: '3', target: '5' },
      { id: 'e4-6', source: '4', target: '6' },
      { id: 'e5-6', source: '5', target: '6' }
    ]
  }
];

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
  const [nodeSearch, setNodeSearch] = useState("");
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  // Refs and ReactFlow instance
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002';

  // Initialize saved workflows from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedWorkflows');
    if (saved) {
      setSavedWorkflows(JSON.parse(saved));
    }
  }, []);

  // Helper function to create a new node
  const createNode = useCallback((type, position) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { 
        label: nodeTypesList.find(n => n.type === type)?.label || type,
        params: {}
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
    }
    setSelectedEdge(null);
  }, [isShiftPressed]);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setSelectedNodes([]);
    setContextMenu(null);
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

  // Execute workflow function (SINGLE DECLARATION)
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
        edges,
        groups
      };
      
      // Execute on backend using the new temporary execution endpoint
      const response = await fetch(`${API_BASE_URL}/api/workflows/execute`, {
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
        
        // Update node status based on execution results
        if (result.execution_log) {
          const updatedNodes = nodes.map(node => {
            const logEntry = result.execution_log.find(entry => entry.node_id === node.id);
            if (logEntry) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: logEntry.status // 'success' or 'error'
                }
              };
            }
            return node;
          });
          setNodes(updatedNodes);
          
          result.execution_log.forEach(entry => {
            const statusIcon = entry.status === 'success' ? '✅' : '❌';
            log.push(`${statusIcon} ${entry.node_type || entry.type || 'Unknown'}: ${entry.output?.message || JSON.stringify(entry.output || entry)}`);
          });
        }
        
        log.push(`✅ Workflow execution ${result.status}`);
        setExecutionLog(log);
      } else {
        const errorData = await response.text();
        setExecutionLog([`❌ Failed to execute workflow: ${errorData}`]);
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      setExecutionLog(['❌ Workflow execution failed: ' + error.message]);
    }
    
    setIsExecuting(false);
  }, [nodes, edges, groups, workflowName, API_BASE_URL]);

  // Save workflow function (SINGLE DECLARATION)
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

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type) {
      return;
    }

    const position = reactFlowInstance.project({
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
  }, [selectedNodes, createGroup]);

  // Node types mapping with access to handleUngroup
  const nodeTypes = {
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
    group: (props) => <GroupNode {...props} data={{...props.data, onUngroup: handleUngroup}} />,
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
        <div className="node-palette">
          <h3>Nodes</h3>
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

        <div className="canvas-area">
          <ReactFlowProvider>
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
              onSelectionChange={onSelectionChange}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <MiniMap 
                style={{
                  height: 120,
                  backgroundColor: '#1e293b',
                }}
                nodeStrokeColor={(n) => {
                  if (n.type === 'input') return '#0041d0';
                  if (n.type === 'output') return '#ff0072';
                  if (n.type === 'default') return '#1a192b';
                  return '#eee';
                }}
                nodeColor={(n) => {
                  if (n.type === 'input') return '#0041d0';
                  if (n.type === 'output') return '#ff0072';
                  if (n.type === 'default') return '#1a192b';
                  return '#fff';
                }}
                nodeBorderRadius={2}
              />
              <Controls 
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #374151',
                }}
              />
              <Background color="#374151" gap={16} />
              
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
                    border: '2px dashed #60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    borderRadius: '8px',
                    pointerEvents: 'none',
                    zIndex: -1
                  }}
                >
                  <div className="group-label" style={{
                    position: 'absolute',
                    top: '-25px',
                    left: '5px',
                    background: '#60a5fa',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
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

        <div className="side-panel">
          {selectedNode && (
            <div className="node-properties">
              <h3>Node Properties</h3>
              <div className="property">
                <label>Type:</label>
                <span>{selectedNode.type}</span>
              </div>
              <div className="property">
                <label>ID:</label>
                <span>{selectedNode.id}</span>
              </div>
              <div className="property">
                <label>Label:</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: { ...selectedNode.data, label: e.target.value }
                    };
                    setNodes(nodes.map(node => node.id === selectedNode.id ? updatedNode : node));
                    setSelectedNode(updatedNode);
                  }}
                />
              </div>
              {selectedNode.data.params && Object.entries(selectedNode.data.params).map(([key, value]) => (
                <div key={key} className="property">
                  <label>{key}:</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: {
                          ...selectedNode.data,
                          params: { ...selectedNode.data.params, [key]: e.target.value }
                        }
                      };
                      setNodes(nodes.map(node => node.id === selectedNode.id ? updatedNode : node));
                      setSelectedNode(updatedNode);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {executionLog.length > 0 && (
            <div className="execution-log">
              <h3>Execution Log</h3>
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
                {workflowTemplates.map((template, index) => (
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
    </div>
  );
}

export default WorkflowCanvas;
