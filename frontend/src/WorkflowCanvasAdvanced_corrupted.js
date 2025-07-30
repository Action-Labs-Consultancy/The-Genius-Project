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

// Available node types for the sidebar
const nodeTypesList = [
  { type: 'start', label: 'Start/Trigger', icon: '▶', color: '#FFD600' },
  { type: 'httpRequest', label: 'HTTP Request', icon: '🌐', color: '#FFD600' },
  { type: 'setVariable', label: 'Set Variable', icon: '📝', color: '#FFD600' },
  { type: 'condition', label: 'If Condition', icon: '?', color: '#FFD600' },
  { type: 'ifCondition', label: 'IF Logic (Advanced)', icon: '🔀', color: '#10b981' },
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
    name: 'Simple API Workflow',
    description: 'Complete API workflow with logging',
    nodes: [
      { id: '1', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } },
      { id: '2', type: 'httpRequest', position: { x: 250, y: 150 }, data: { 
        label: 'Fetch User Data', 
        method: 'GET', 
        url: 'https://jsonplaceholder.typicode.com/users/1',
        headers: '{"Accept": "application/json"}'
      }},
      { id: '3', type: 'log', position: { x: 250, y: 250 }, data: { 
        label: 'Log API Response', 
        message: 'User data fetched successfully' 
      }},
      { id: '4', type: 'end', position: { x: 250, y: 350 }, data: { label: 'End' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' }
    ],
    groups: [
      {
        id: 'api-group',
        title: 'API Processing',
        description: 'Handles API request and logging',
        nodeIds: ['2', '3'],
        position: { x: 230, y: 130 },
        size: { width: 160, height: 160 },
        color: '#e0e7ff',
        borderColor: '#6366f1'
      }
    ]
  },
  {
    name: 'Conditional Data Processing',
    description: 'Workflow with branching logic and data processing',
    nodes: [
      { id: '1', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } },
      { id: '2', type: 'setVariable', position: { x: 250, y: 150 }, data: { 
        label: 'Set Amount', 
        variable: 'amount', 
        value: '1500' 
      }},
      { id: '3', type: 'condition', position: { x: 250, y: 250 }, data: { 
        label: 'Check Amount > 1000', 
        condition: 'amount > 1000',
        comparisonType: 'greater'
      }},
      { id: '4', type: 'log', position: { x: 150, y: 350 }, data: { 
        label: 'High Value Processing', 
        message: 'Processing high value transaction' 
      }},
      { id: '5', type: 'log', position: { x: 350, y: 350 }, data: { 
        label: 'Standard Processing', 
        message: 'Processing standard transaction' 
      }},
      { id: '6', type: 'email', position: { x: 250, y: 450 }, data: { 
        label: 'Send Notification', 
        to: 'admin@example.com',
        subject: 'Transaction Processed',
        body: 'Transaction has been processed successfully'
      }},
      { id: '7', type: 'end', position: { x: 250, y: 550 }, data: { label: 'End' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true' },
      { id: 'e3-5', source: '3', target: '5', sourceHandle: 'false' },
      { id: 'e4-6', source: '4', target: '6' },
      { id: 'e5-6', source: '5', target: '6' },
      { id: 'e6-7', source: '6', target: '7' }
    ],
    groups: [
      {
        id: 'decision-group',
        title: 'Decision Logic',
        description: 'Conditional processing based on amount',
        nodeIds: ['2', '3'],
        position: { x: 230, y: 130 },
        size: { width: 160, height: 160 },
        color: '#fef3c7',
        borderColor: '#f59e0b'
      },
      {
        id: 'processing-group',
        title: 'Processing Actions',
        description: 'Different processing paths',
        nodeIds: ['4', '5'],
        position: { x: 130, y: 330 },
        size: { width: 240, height: 80 },
        color: '#dcfce7',
        borderColor: '#22c55e'
      }
    ]
  },
  {
    name: 'Data Pipeline with AI',
    description: 'Advanced workflow with AI processing and database operations',
    nodes: [
      { id: '1', type: 'start', position: { x: 100, y: 50 }, data: { label: 'Start Pipeline' } },
      { id: '2', type: 'file', position: { x: 100, y: 150 }, data: { 
        label: 'Load Data File', 
        path: '/data/input.csv',
        format: 'csv'
      }},
      { id: '3', type: 'ai', position: { x: 100, y: 250 }, data: { 
        label: 'AI Text Analysis', 
        model: 'gpt-3.5-turbo',
        prompt: 'Analyze the sentiment of this text and return positive/negative/neutral'
      }},
      { id: '4', type: 'database', position: { x: 100, y: 350 }, data: { 
        label: 'Save Results', 
        operation: 'insert',
        table: 'analysis_results',
        query: 'INSERT INTO analysis_results (text, sentiment, timestamp) VALUES (?, ?, NOW())'
      }},
      { id: '5', type: 'condition', position: { x: 300, y: 250 }, data: { 
        label: 'Check Sentiment', 
        condition: 'sentiment == "positive"',
        comparisonType: 'equals'
      }},
      { id: '6', type: 'slack', position: { x: 400, y: 350 }, data: { 
        label: 'Send Positive Alert', 
        channel: '#alerts',
        message: 'Positive sentiment detected in data pipeline'
      }},
      { id: '7', type: 'log', position: { x: 200, y: 350 }, data: { 
        label: 'Log Negative/Neutral', 
        message: 'Non-positive sentiment logged'
      }},
      { id: '8', type: 'end', position: { x: 300, y: 450 }, data: { label: 'End Pipeline' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e3-5', source: '3', target: '5' },
      { id: 'e5-6', source: '5', target: '6', sourceHandle: 'true' },
      { id: 'e5-7', source: '5', target: '7', sourceHandle: 'false' },
      { id: 'e4-8', source: '4', target: '8' },
      { id: 'e6-8', source: '6', target: '8' },
      { id: 'e7-8', source: '7', target: '8' }
    ],
    groups: [
      {
        id: 'data-processing',
        title: 'Data Processing',
        description: 'Core data processing pipeline',
        nodeIds: ['2', '3', '4'],
        position: { x: 80, y: 130 },
        size: { width: 160, height: 280 },
        color: '#e0f2fe',
        borderColor: '#0891b2'
      },
      {
        id: 'notification-logic',
        title: 'Notification Logic',
        description: 'Conditional notifications based on results',
        nodeIds: ['5', '6', '7'],
        position: { x: 180, y: 230 },
        size: { width: 260, height: 160 },
        color: '#fce7f3',
        borderColor: '#ec4899'
      }
    ]
  }
];

function WorkflowCanvas() {
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
  const { project } = useReactFlow();
  const reactFlowWrapper = useRef(null);

  // Ungroup handler
  const handleUngroup = useCallback((groupId) => {
    setNodes(currentNodes => {
      const groupNode = currentNodes.find(node => node.id === groupId);
      if (!groupNode || !groupNode.data.groupedNodes) return currentNodes;

      const groupedNodes = groupNode.data.groupedNodes;

      return [
        ...currentNodes.filter(node => node.id !== groupId), // Remove group node
        ...groupedNodes.map(node => ({
          ...node,
          hidden: false // Make nodes visible again
        }))
      ];
    });
  }, []);

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
    if (isShiftPressed || event.shiftKey) {
      // Multi-selection mode
      setSelectedNodes(prev => {
        if (prev.includes(node.id)) {
          // Deselect if already selected
          return prev.filter(id => id !== node.id);
        } else {
          // Add to selection
          return [...prev, node.id];
        }
      });
      setSelectedNode(null);
    } else {
      // Single selection mode
      setSelectedNode(node);
      setSelectedNodes([]);
    }
    setSelectedEdge(null);
  }, [isShiftPressed]);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    if (!isShiftPressed) {
      setSelectedNode(null);
      setSelectedEdge(null);
      setSelectedNodes([]);
    }
  }, [isShiftPressed]);

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

  // Save workflow
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
      groups, // Include groups in export
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

  // Group management functions
  const onSelectionChange = useCallback(({ nodes: selectedNodeIds }) => {
    setSelectedNodes(selectedNodeIds.map(node => node.id));
  }, []);

  const createGroup = useCallback(() => {
    if (selectedNodes.length < 2) {
      alert('Please select at least 2 nodes to create a group');
      return;
    }
    setShowGroupModal(true);
  }, [selectedNodes]);

  const confirmCreateGroup = useCallback(() => {
    if (!groupTitle.trim()) {
      alert('Please enter a group title');
      return;
    }

    const selectedNodeObjects = nodes.filter(node => selectedNodes.includes(node.id));
    
    // Calculate group bounds
    const minX = Math.min(...selectedNodeObjects.map(node => node.position.x));
    const minY = Math.min(...selectedNodeObjects.map(node => node.position.y));
    const maxX = Math.max(...selectedNodeObjects.map(node => node.position.x + 200)); // Assuming node width ~200
    const maxY = Math.max(...selectedNodeObjects.map(node => node.position.y + 100)); // Assuming node height ~100

    const newGroup = {
      id: `group-${Date.now()}`,
      title: groupTitle,
      description: groupDescription,
      nodeIds: [...selectedNodes],
      position: { x: minX - 20, y: minY - 50 },
      size: { width: maxX - minX + 40, height: maxY - minY + 70 },
      color: '#e0e7ff',
      borderColor: '#6366f1'
    };

    setGroups(prevGroups => [...prevGroups, newGroup]);
    setShowGroupModal(false);
    setGroupTitle('');
    setGroupDescription('');
    setSelectedNodes([]);
  }, [groupTitle, groupDescription, selectedNodes, nodes]);

  const deleteGroup = useCallback((groupId) => {
    setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
  }, []);

  const updateGroupPosition = useCallback((groupId, newPosition) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, position: newPosition }
          : group
      )
    );
  }, []);

  const onGroupDrag = useCallback((groupId, delta) => {
    // Move all nodes in the group
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setNodes(prevNodes => 
      prevNodes.map(node => 
        group.nodeIds.includes(node.id)
          ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
          : node
      )
    );

    // Update group position
    updateGroupPosition(groupId, {
      x: group.position.x + delta.x,
      y: group.position.y + delta.y
    });
  }, [groups, updateGroupPosition]);

  const handleGroupMouseDown = useCallback((groupId, e) => {
    setDraggingGroup({
      id: groupId,
      startX: e.clientX,
      startY: e.clientY
    });
    e.preventDefault();
  }, []);

  const handleGroupMouseMove = useCallback((e) => {
    if (!draggingGroup) return;
    
    const deltaX = e.clientX - draggingGroup.startX;
    const deltaY = e.clientY - draggingGroup.startY;
    
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      onGroupDrag(draggingGroup.id, { x: deltaX, y: deltaY });
      setDraggingGroup({
        ...draggingGroup,
        startX: e.clientX,
        startY: e.clientY
      });
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
      groups, // Include groups in export
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

  // Group management functions
  const onSelectionChange = useCallback(({ nodes: selectedNodeIds }) => {
    setSelectedNodes(selectedNodeIds.map(node => node.id));
  }, []);

  const createGroup = useCallback(() => {
    if (selectedNodes.length < 2) {
      alert('Please select at least 2 nodes to create a group');
      return;
    }
    setShowGroupModal(true);
  }, [selectedNodes]);

  const confirmCreateGroup = useCallback(() => {
    if (!groupTitle.trim()) {
      alert('Please enter a group title');
      return;
    }

    const selectedNodeObjects = nodes.filter(node => selectedNodes.includes(node.id));
    
    // Calculate group bounds
    const minX = Math.min(...selectedNodeObjects.map(node => node.position.x));
    const minY = Math.min(...selectedNodeObjects.map(node => node.position.y));
    const maxX = Math.max(...selectedNodeObjects.map(node => node.position.x + 200)); // Assuming node width ~200
    const maxY = Math.max(...selectedNodeObjects.map(node => node.position.y + 100)); // Assuming node height ~100

    const newGroup = {
      id: `group-${Date.now()}`,
      title: groupTitle,
      description: groupDescription,
      nodeIds: [...selectedNodes],
      position: { x: minX - 20, y: minY - 50 },
      size: { width: maxX - minX + 40, height: maxY - minY + 70 },
      color: '#e0e7ff',
      borderColor: '#6366f1'
    };

    setGroups(prevGroups => [...prevGroups, newGroup]);
    setShowGroupModal(false);
    setGroupTitle('');
    setGroupDescription('');
    setSelectedNodes([]);
  }, [groupTitle, groupDescription, selectedNodes, nodes]);

  const deleteGroup = useCallback((groupId) => {
    setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
  }, []);

  const updateGroupPosition = useCallback((groupId, newPosition) => {
    setGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === groupId 
          ? { ...group, position: newPosition }
          : group
      )
    );
  }, []);

  const onGroupDrag = useCallback((groupId, delta) => {
    // Move all nodes in the group
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setNodes(prevNodes => 
      prevNodes.map(node => 
        group.nodeIds.includes(node.id)
          ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
          : node
      )
    );

    // Update group position
    updateGroupPosition(groupId, {
      x: group.position.x + delta.x,
      y: group.position.y + delta.y
    });
  }, [groups, updateGroupPosition]);

  const handleGroupMouseDown = useCallback((groupId, e) => {
    setDraggingGroup({
      id: groupId,
      startX: e.clientX,
      startY: e.clientY
    });
    e.preventDefault();
  }, []);

  const handleGroupMouseMove = useCallback((e) => {
    if (!draggingGroup) return;
    
    const deltaX = e.clientX - draggingGroup.startX;
    const deltaY = e.clientY - draggingGroup.startY;
    
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      onGroupDrag(draggingGroup.id, { x: deltaX, y: deltaY });
      setDraggingGroup({
        ...draggingGroup,
        startX: e.clientX,
        startY: e.clientY
      });
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

          {/* Help Panel */}
          <div className="grouping-help">
            <h4>🔗 Node Grouping</h4>
            <p><strong>How to group nodes:</strong></p>
            <ul>
              <li>Hold <kbd>Shift</kbd> and click nodes to select multiple</li>
              <li>Click "Group" button or press <kbd>Ctrl+G</kbd></li>
              <li>Enter title and description</li>
              <li>Groups can be dragged to move all nodes together</li>
            </ul>
            {selectedNodes.length > 0 && (
              <div className="selected-count">
                ✅ {selectedNodes.length} node{selectedNodes.length !== 1 ? 's' : ''} selected
              </div>
            )}
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
        <div className="workflow-canvas" onDrop={onDrop} onDragOver={onDragOver} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes.filter(node => {
              // Hide nodes that are in groups - they'll be shown inside group nodes
              return !groups.some(group => group.nodeIds.includes(node.id));
            }).concat(
              // Add group nodes as actual nodes
              groups.map(group => ({
                id: group.id,
                type: 'group',
                position: group.position,
                data: {
                  label: group.title,
                  description: group.description,
                  nodeIds: group.nodeIds,
                  groupedNodes: nodes.filter(node => group.nodeIds.includes(node.id))
                },
                style: {
                  width: Math.max(group.size.width, 200),
                  height: Math.max(group.size.height, 150),
                  border: `2px solid ${group.borderColor}`,
                  borderRadius: '12px',
                  backgroundColor: `${group.color}40`,
                  padding: '10px'
                }
              }))
            ).map(node => ({
              ...node,
              selected: selectedNodes.includes(node.id),
              style: {
                ...node.style,
                border: selectedNodes.includes(node.id) ? '3px solid #6366f1' : node.style?.border,
                boxShadow: selectedNodes.includes(node.id) ? '0 0 10px rgba(99, 102, 241, 0.5)' : node.style?.boxShadow
              }
            }))}
            edges={edges.filter(edge => {
              // Filter out edges between grouped nodes - they'll be internal
              const sourceInGroup = groups.some(group => group.nodeIds.includes(edge.source));
              const targetInGroup = groups.some(group => group.nodeIds.includes(edge.target));
              const sameGroup = groups.some(group => 
                group.nodeIds.includes(edge.source) && group.nodeIds.includes(edge.target)
              );
              
              // Keep edges that go between groups or to/from ungrouped nodes
              return !sameGroup;
            }).map(edge => {
              // Update edge connections to point to group nodes instead of individual nodes
              let newEdge = { ...edge };
              
              groups.forEach(group => {
                if (group.nodeIds.includes(edge.source)) {
                  newEdge.source = group.id;
                }
                if (group.nodeIds.includes(edge.target)) {
                  newEdge.target = group.id;
                }
              });
              
              return newEdge;
            })}
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

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="group-modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="group-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📦 Create Node Group</h3>
            
            <div className="group-form">
              <div className="form-group">
                <label>Group Title *</label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="Enter group title..."
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description..."
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Selected Nodes ({selectedNodes.length})</label>
                <div className="selected-nodes-list">
                  {selectedNodes.map(nodeId => {
                    const node = nodes.find(n => n.id === nodeId);
                    return (
                      <div key={nodeId} className="selected-node-item">
                        {node?.data.label || nodeId}
                      </div>
                    );
                  })}
                </div>
              </div>
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
      )}
    </div>
   );
}

export default WorkflowCanvas;