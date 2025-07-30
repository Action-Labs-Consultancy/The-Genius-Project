import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  Folder,
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
  Plus,
  X
} from 'lucide-react';
import './WorkflowCanvas.css';
import CustomNode from './CustomNode';
import NodeSettingsPanel from './NodeSettingsPanel';
import ExecutionPanel from './ExecutionPanel';

// Define nodeTypes and edgeTypes outside component to prevent React Flow warnings
const nodeTypes = {
  customNode: CustomNode,
};

const edgeTypes = {};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#FFD600', strokeWidth: 2 }
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
  brain: { label: 'AI Brain', icon: Zap, color: '#9D4EDD', category: 'AI' },
  agent: { label: 'AI Agent', icon: Settings, color: '#F72585', category: 'AI' },
  group: { label: 'Node Group', icon: FolderOpen, color: '#8b5cf6', category: 'Organization' },
  end: { label: 'End', icon: StopCircle, color: '#6B7280', category: 'Flow' }
};

const CATEGORIES = ['All', 'Flow', 'Actions', 'Data', 'Logic', 'Debug', 'Triggers', 'Advanced', 'AI', 'Organization'];

const WorkflowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [nodeExecutionStatus, setNodeExecutionStatus] = useState({});
  const [executionLogs, setExecutionLogs] = useState([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [nodeGroups, setNodeGroups] = useState(new Map());
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [showExecutionPanel, setShowExecutionPanel] = useState(true); // Always show execution panel
  const [lastGroupPositions, setLastGroupPositions] = useState(new Map());
  
  const reactFlowInstance = useRef(null);
  const { setViewport, getViewport, fitView } = useReactFlow();

  // Enhanced node change handler for group dragging
  const handleNodesChange = useCallback((changes) => {
    // Handle group dragging by moving inner nodes
    changes.forEach(change => {
      if (change.type === 'position' && change.dragging) {
        const node = nodes.find(n => n.id === change.id);
        if (node && node.data.isGroup) {
          const group = nodeGroups.get(change.id);
          if (group && change.position) {
            const lastPos = lastGroupPositions.get(change.id) || node.position;
            const deltaX = change.position.x - lastPos.x;
            const deltaY = change.position.y - lastPos.y;
            
            // Move all nodes in the group
            setNodes(prevNodes => 
              prevNodes.map(n => {
                if (group.nodes.includes(n.id)) {
                  return {
                    ...n,
                    position: {
                      x: n.position.x + deltaX,
                      y: n.position.y + deltaY
                    }
                  };
                }
                return n;
              })
            );
            
            // Update last position
            setLastGroupPositions(prev => new Map(prev.set(change.id, change.position)));
          }
        }
      }
    });
    
    onNodesChange(changes);
  }, [nodes, nodeGroups, lastGroupPositions, onNodesChange]);

  // Update group positions when nodes change
  useEffect(() => {
    nodes.forEach(node => {
      if (node.data.isGroup && !lastGroupPositions.has(node.id)) {
        setLastGroupPositions(prev => new Map(prev.set(node.id, node.position)));
      }
    });
  }, [nodes, lastGroupPositions]);

  // Load workflows and templates on mount
  useEffect(() => {
    loadWorkflows();
    loadWorkflowTemplates();
    
    // Listen for group toggle events from CustomNode
    const handleGroupToggle = (event) => {
      const { groupId } = event.detail;
      toggleGroupCollapse(groupId);
    };
    
    window.addEventListener('toggleGroupCollapse', handleGroupToggle);
    
    return () => {
      window.removeEventListener('toggleGroupCollapse', handleGroupToggle);
    };
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
    event.stopPropagation();
    setSelectedNode(node);
    setShowContextMenu(false);
  }, []);

  const onPaneClick = useCallback((event) => {
    setSelectedNode(null);
    setShowContextMenu(false);
    setSelectedNodes(new Set());
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(node);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  }, []);

  // Hide context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };
    
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

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
        return { 
          leftOperand: '', 
          operator: '==', 
          rightOperand: '',
          dataType: 'string'
        };
      case 'delay':
        return { seconds: 1 };
      case 'log':
        return { message: 'Log message' };
      case 'customScript':
        return { code: '', language: 'javascript' };
      case 'loop':
        return { items: [] };
      case 'brain':
        return { 
          name: 'AI Brain',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          memoryNamespace: 'default',
          systemPrompt: 'You are a helpful AI assistant.'
        };
      case 'agent':
        return {
          name: 'AI Agent',
          role: 'assistant',
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          tools: [],
          memoryNamespace: 'agent_default'
        };
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
    if (nodes.length === 0) {
      alert('Please add some nodes to the workflow first');
      return;
    }

    setIsExecuting(true);
    setNodeExecutionStatus({});
    setExecutionLogs([]);
    
    // Add initial log
    setExecutionLogs([{
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Starting workflow execution with ${nodes.filter(n => !n.data.isGroup).length} nodes`,
      node_id: 'System'
    }]);
    
    // Initialize all nodes as pending
    const initialStatus = {};
    nodes.filter(n => !n.data.isGroup).forEach(node => {
      initialStatus[node.id] = { status: 'pending', error: null, output: null };
    });
    setNodeExecutionStatus(initialStatus);
    
    try {
      // If no workflow is saved, create a temporary execution
      let workflowId = currentWorkflow?.id || 'temp';
      
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.filter(n => !n.data.isGroup),
          edges: edges
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setExecutionResult(result);
      
      // Update node statuses from result
      if (result.node_statuses) {
        setNodeExecutionStatus(result.node_statuses);
      }
      
      // Update execution logs
      if (result.execution_log) {
        setExecutionLogs(prev => [...prev, ...result.execution_log]);
      }
      
      // Add completion log
      setExecutionLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: result.status === 'success' ? 'success' : 'error',
        message: `Workflow execution ${result.status}`,
        node_id: 'System'
      }]);
      
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      setExecutionResult({ status: 'error', error: error.message });
      setExecutionLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Workflow execution failed: ${error.message}`,
        node_id: 'System'
      }]);
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

  // Node selection handling
  const onSelectionChange = useCallback((elements) => {
    const nodeIds = elements.nodes.map(node => node.id);
    setSelectedNodes(new Set(nodeIds));
  }, []);

  // Enhanced grouping functionality
  const createNodeGroup = () => {
    if (selectedNodes.size < 2) {
      alert('Please select at least 2 nodes to create a group');
      return;
    }

    const groupId = `group-${Date.now()}`;
    const selectedNodesList = Array.from(selectedNodes);
    
    // Calculate group position and size based on selected nodes
    const groupNodes = nodes.filter(node => selectedNodes.has(node.id));
    const positions = groupNodes.map(n => n.position);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    const groupName = `Group ${nodeGroups.size + 1}`;
    
    const newGroup = {
      id: groupId,
      name: groupName,
      nodes: selectedNodesList,
      collapsed: false,
      position: { x: minX - 20, y: minY - 40 },
      size: { width: Math.max(200, maxX - minX + 240), height: Math.max(100, maxY - minY + 140) },
      originalPositions: groupNodes.reduce((acc, node) => {
        acc[node.id] = { ...node.position };
        return acc;
      }, {})
    };

    // Create group node
    const groupNode = {
      id: groupId,
      type: 'customNode',
      position: newGroup.position,
      data: {
        label: `${groupName} (${selectedNodesList.length} nodes)`,
        nodeType: 'group',
        icon: FolderOpen,
        color: '#8b5cf6',
        config: {},
        isGroup: true,
        groupData: newGroup
      },
      style: {
        width: newGroup.size.width,
        height: newGroup.size.height,
        zIndex: -1 // Behind other nodes
      }
    };

    // Add group node and update state
    setNodes(prevNodes => [...prevNodes, groupNode]);
    setNodeGroups(prev => new Map(prev.set(groupId, newGroup)));
    setSelectedNodes(new Set());
    setShowContextMenu(false);
    
    // Add execution log
    setExecutionLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Created group "${groupName}" with ${selectedNodesList.length} nodes`,
      node_id: 'System'
    }]);
  };

  const toggleGroupCollapse = (groupId) => {
    const group = nodeGroups.get(groupId);
    if (!group) return;

    const isCurrentlyCollapsed = collapsedGroups.has(groupId);
    
    // Update collapsed groups set
    setCollapsedGroups(prev => {
      const newCollapsed = new Set(prev);
      if (isCurrentlyCollapsed) {
        newCollapsed.delete(groupId);
      } else {
        newCollapsed.add(groupId);
      }
      return newCollapsed;
    });

    // Update group node and hide/show inner nodes
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === groupId) {
          // Update group node appearance
          const newCollapsed = !isCurrentlyCollapsed;
          return {
            ...node,
            data: {
              ...node.data,
              icon: newCollapsed ? Folder : FolderOpen,
              label: `${group.name} ${newCollapsed ? '(Collapsed)' : '(Expanded)'} - ${group.nodes.length} nodes`,
              groupData: {
                ...group,
                collapsed: newCollapsed
              }
            }
          };
        } else if (group.nodes.includes(node.id)) {
          // Hide/show inner nodes
          return {
            ...node,
            hidden: !isCurrentlyCollapsed // Will be hidden if we're collapsing
          };
        }
        return node;
      })
    );

    // Update group in nodeGroups map
    setNodeGroups(prev => {
      const newGroups = new Map(prev);
      newGroups.set(groupId, { ...group, collapsed: !isCurrentlyCollapsed });
      return newGroups;
    });

    // Hide/show edges connected to grouped nodes when collapsing
    setEdges(prevEdges =>
      prevEdges.map(edge => {
        // Only hide internal edges (both source and target are in the group)
        const isInternalEdge = group.nodes.includes(edge.source) && group.nodes.includes(edge.target);
        if (isInternalEdge) {
          return {
            ...edge,
            hidden: !isCurrentlyCollapsed // Will be hidden if we're collapsing
          };
        }
        return edge;
      })
    );

    // Add execution log
    setExecutionLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `${isCurrentlyCollapsed ? 'Expanded' : 'Collapsed'} group "${group.name}"`,
      node_id: 'System'
    }]);
  };

  const deleteGroup = (groupId) => {
    const group = nodeGroups.get(groupId);
    if (!group) return;

    // Remove group node
    setNodes(prevNodes => prevNodes.filter(node => node.id !== groupId));
    
    // Remove from groups map
    setNodeGroups(prev => {
      const newGroups = new Map(prev);
      newGroups.delete(groupId);
      return newGroups;
    });

    setCollapsedGroups(prev => {
      const newCollapsed = new Set(prev);
      newCollapsed.delete(groupId);
      return newCollapsed;
    });
  };

  const ungroupNodes = (groupId) => {
    deleteGroup(groupId);
    setShowContextMenu(false);
  };

  const renameGroup = (groupId) => {
    const group = nodeGroups.get(groupId);
    if (!group) return;
    
    const newName = prompt('Enter new group name:', group.name);
    if (newName && newName !== group.name) {
      // Update group data
      const updatedGroup = { ...group, name: newName };
      setNodeGroups(prev => new Map(prev.set(groupId, updatedGroup)));
      
      // Update group node
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === groupId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: `${newName} ${group.collapsed ? '(Collapsed)' : '(Expanded)'} - ${group.nodes.length} nodes`,
                  groupData: updatedGroup
                }
              }
            : node
        )
      );
    }
    setShowContextMenu(false);
  };

  const duplicateGroup = (groupId) => {
    const group = nodeGroups.get(groupId);
    if (!group) return;

    const newGroupId = `group-${Date.now()}`;
    const nodeIdMapping = new Map();
    
    // Duplicate all nodes in the group
    const duplicatedNodes = group.nodes.map(nodeId => {
      const originalNode = nodes.find(n => n.id === nodeId);
      if (!originalNode) return null;
      
      const newNodeId = `${originalNode.data.nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      nodeIdMapping.set(nodeId, newNodeId);
      
      return {
        ...originalNode,
        id: newNodeId,
        position: {
          x: originalNode.position.x + 250, // Offset to the right
          y: originalNode.position.y + 50   // Offset down slightly
        }
      };
    }).filter(Boolean);

    // Duplicate edges between grouped nodes
    const duplicatedEdges = edges.filter(edge => 
      group.nodes.includes(edge.source) && group.nodes.includes(edge.target)
    ).map(edge => ({
      ...edge,
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: nodeIdMapping.get(edge.source),
      target: nodeIdMapping.get(edge.target)
    }));

    // Create new group
    const newGroup = {
      ...group,
      id: newGroupId,
      name: `${group.name} Copy`,
      nodes: duplicatedNodes.map(n => n.id),
      position: {
        x: group.position.x + 250,
        y: group.position.y + 50
      }
    };

    // Create new group node
    const newGroupNode = {
      id: newGroupId,
      type: 'customNode',
      position: newGroup.position,
      data: {
        label: `${newGroup.name} (Expanded) - ${newGroup.nodes.length} nodes`,
        nodeType: 'group',
        icon: FolderOpen,
        color: '#8b5cf6',
        config: {},
        isGroup: true,
        groupData: newGroup
      }
    };

    // Add everything to the canvas
    setNodes(prevNodes => [...prevNodes, ...duplicatedNodes, newGroupNode]);
    setEdges(prevEdges => [...prevEdges, ...duplicatedEdges]);
    setNodeGroups(prev => new Map(prev.set(newGroupId, newGroup)));
    setShowContextMenu(false);
  };

  // Update the old grouping functions
  const groupSelectedNodes = () => {
    if (selectedNode) {
      // Add current node to selection for grouping
      setSelectedNodes(prev => new Set([...prev, selectedNode.id]));
    }
    createNodeGroup();
  };

  const ungroupNode = () => {
    if (selectedNode && selectedNode.data.isGroup) {
      ungroupNodes(selectedNode.id);
    }
  };

  // Auto-layout functionality
  const autoLayout = () => {
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 4) * 250,
        y: Math.floor(index / 4) * 150
      }
    }));
    setNodes(layoutedNodes);
  };

  // Snap to grid toggle
  const toggleSnapToGrid = () => {
    setSnapToGrid(!snapToGrid);
  };

  // Update nodes with execution status
  const nodesWithStatus = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        executionStatus: nodeExecutionStatus[node.id]?.status || 'idle',
        executionError: nodeExecutionStatus[node.id]?.error || null,
        executionOutput: nodeExecutionStatus[node.id]?.output || null
      }
    }));
  }, [nodes, nodeExecutionStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'g':
          case 'G':
            event.preventDefault();
            if (selectedNodes.size > 1) {
              createNodeGroup();
            }
            break;
          case 's':
          case 'S':
            event.preventDefault();
            saveWorkflow();
            break;
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNode) {
          deleteNode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, selectedNode]);

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
        
        <div className="toolbar-section">
          <button onClick={autoLayout} className="toolbar-btn">
            <GitBranch size={16} />
            Auto Layout
          </button>
          <button 
            onClick={toggleSnapToGrid} 
            className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}
          >
            <Plus size={16} />
            Snap to Grid
          </button>
          <button onClick={() => fitView({ duration: 800 })} className="toolbar-btn">
            <Search size={16} />
            Fit View
          </button>
          <button 
            onClick={createNodeGroup} 
            className="toolbar-btn"
            disabled={selectedNodes.size < 2}
            title="Group selected nodes (Ctrl+G)"
          >
            <FolderOpen size={16} />
            Group ({selectedNodes.size})
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

        {/* Main Canvas Area */}
        <div className="workflow-main-container">
          <div className="workflow-main">
            <ReactFlow
              nodes={nodesWithStatus}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodeContextMenu={onNodeContextMenu}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
              ref={reactFlowInstance}
              className="workflow-flow"
              snapToGrid={snapToGrid}
              snapGrid={[20, 20]}
              multiSelectionKeyCode="Control"
              panOnDrag={[1, 2]}
              selectionOnDrag={true}
              deleteKeyCode="Delete"
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
                  Nodes: {nodes.length} | Connections: {edges.length} | Status: {isExecuting ? 'Running' : 'Ready'}
                  {selectedNodes.size > 0 && (
                    <span className="selection-count"> | Selected: {selectedNodes.size}</span>
                  )}
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
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>

          {/* Bottom Execution Panel - Always Visible */}
          <div className="execution-panel-bottom">
            <ExecutionPanel
              isExecuting={isExecuting}
              executionResult={executionResult}
              executionLogs={executionLogs}
              onClose={() => setShowExecutionPanel(false)}
              isBottomPanel={true}
              showExecutionPanel={showExecutionPanel}
              onToggle={() => setShowExecutionPanel(!showExecutionPanel)}
            />
          </div>
        </div>

        {/* Right Sidebar - Always Visible Node Inspector */}
        <div className="workflow-right-sidebar">
          <div className="sidebar-header">
            <h3>
              <Settings size={16} />
              Node Inspector
            </h3>
          </div>
          
          <div className="sidebar-content">
            {selectedNode ? (
              <NodeSettingsPanel
                node={selectedNode}
                onUpdateNode={updateNodeData}
                onClose={() => setSelectedNode(null)}
                embedded={true}
              />
            ) : (
              <div className="no-node-selected">
                <Settings size={48} className="placeholder-icon" />
                <p>Click a node to view and edit its parameters</p>
                <div className="help-text">
                  <h4>Keyboard Shortcuts:</h4>
                  <ul>
                    <li><kbd>Ctrl+G</kbd> - Group selected nodes</li>
                    <li><kbd>Ctrl+S</kbd> - Save workflow</li>
                    <li><kbd>Delete</kbd> - Delete selected node</li>
                    <li><kbd>Ctrl+Click</kbd> - Multi-select nodes</li>
                  </ul>
                </div>
                <div className="grouping-info">
                  <h4>Node Grouping:</h4>
                  <ul>
                    <li>Select multiple nodes (Ctrl+click or drag)</li>
                    <li>Press Ctrl+G or right-click → "Group Selected"</li>
                    <li>Click folder icon to collapse/expand groups</li>
                    <li>Drag groups to move all inner nodes</li>
                    <li>Right-click groups for rename/duplicate/ungroup</li>
                    <li>Groups are visual only - connections work normally</li>
                    <li>Collapsed groups hide inner nodes and edges</li>
                  </ul>
                </div>
                <div className="workflow-tips">
                  <h4>Workflow Tips:</h4>
                  <ul>
                    <li>Use groups to organize complex workflows</li>
                    <li>Collapse groups to reduce visual clutter</li>
                    <li>Duplicate groups to reuse logic patterns</li>
                    <li>Auto-layout button organizes nodes in a grid</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && selectedNode && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '8px',
            zIndex: 1000,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={duplicateNode}>
            <Copy size={14} /> Duplicate
          </div>
          <div className="context-menu-item" onClick={deleteNode}>
            <Trash2 size={14} /> Delete
          </div>
          <div className="context-menu-separator"></div>
          
          {selectedNode.data.isGroup ? (
            <>
              <div className="context-menu-item" onClick={() => toggleGroupCollapse(selectedNode.id)}>
                <FolderOpen size={14} /> 
                {collapsedGroups.has(selectedNode.id) ? 'Expand Group' : 'Collapse Group'}
              </div>
              <div className="context-menu-item" onClick={() => renameGroup(selectedNode.id)}>
                <Settings size={14} /> Rename Group
              </div>
              <div className="context-menu-item" onClick={() => duplicateGroup(selectedNode.id)}>
                <Copy size={14} /> Duplicate Group
              </div>
              <div className="context-menu-item" onClick={ungroupNode}>
                <Folder size={14} /> Ungroup Nodes
              </div>
            </>
          ) : (
            <>
              {selectedNodes.size > 1 ? (
                <div className="context-menu-item" onClick={createNodeGroup}>
                  <FolderOpen size={14} /> Group Selected ({selectedNodes.size} nodes)
                </div>
              ) : (
                <div className="context-menu-item" onClick={groupSelectedNodes}>
                  <FolderOpen size={14} /> Create Group
                </div>
              )}
            </>
          )}
        </div>
      )}

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
    </div>
  );
};

const WorkflowCanvasWrapper = () => (
  <ReactFlowProvider>
    <WorkflowCanvas />
  </ReactFlowProvider>
);

export default WorkflowCanvasWrapper;
