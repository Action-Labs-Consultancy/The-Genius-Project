import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  MiniMap, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  ReactFlowProvider 
} from 'reactflow';
import 'reactflow/dist/style.css';
import './WorkflowBuilder.css';

// Node position validator to fix "Cannot read properties of undefined (reading 'x')" error
const ensureNodePositions = (nodes) => {
  return nodes.map(node => {
    // Check if position exists and has valid x and y values
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      return {
        ...node,
        position: { 
          x: 250 + Math.floor(Math.random() * 300), 
          y: 50 + Math.floor(Math.random() * 300) 
        }
      };
    }
    return node;
  });
};

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 50 } }
];
const initialEdges = [];

const nodeTypesList = [
  { type: 'httpRequest', label: 'HTTP Request', color: '#FFD600' },
  { type: 'logMessage', label: 'Log Message', color: '#FFD600' },
  { type: 'ifCondition', label: 'If Condition', color: '#FFD600' },
  { type: 'delay', label: 'Delay', color: '#FFD600' }
];

function WorkflowBuilder() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState(null);

  // Ensure all nodes have valid positions on initial load
  useEffect(() => {
    try {
      setNodes(prevNodes => ensureNodePositions(prevNodes));
    } catch (err) {
      console.error("Error validating node positions:", err);
      setError("Failed to initialize workflow nodes");
    }
  }, []);

  const onNodesChange = useCallback(
    (changes) => {
      try {
        setNodes((nds) => ensureNodePositions(applyNodeChanges(changes, nds)));
      } catch (err) {
        console.error("Error applying node changes:", err);
      }
    },
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );
  
  const onNodeClick = useCallback((event, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // Add node to canvas with position validation
  const addNode = (type) => {
    try {
      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position: { 
          x: 200 + Math.floor(Math.random() * 200), 
          y: 100 + Math.floor(Math.random() * 200) 
        },
        data: { 
          label: nodeTypesList.find(n => n.type === type)?.label || type 
        }
      };
      
      setNodes((nds) => ensureNodePositions([...nds, newNode]));
    } catch (err) {
      console.error("Error adding node:", err);
      setError(`Failed to add ${type} node`);
    }
  };

  return (
    <div className="workflow-container">
      {/* Header */}
      <div className="workflow-header">
        <div className="workflow-title">Workflow Builder</div>
      </div>
      
      {/* Error message if any */}
      {error && (
        <div className="workflow-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="workflow-content">
        {/* Sidebar */}
        <div className="workflow-sidebar">
          <h3 className="sidebar-title">Nodes</h3>
          {nodeTypesList.map((n) => (
            <button
              key={n.type}
              className="node-button"
              style={{ background: n.color }}
              onClick={() => addNode(n.type)}
            >
              {n.label}
            </button>
          ))}
        </div>
        
        {/* Canvas */}
        <div className="workflow-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            style={{ background: '#1a1a1a', minHeight: '100%' }}
          >
            <MiniMap />
            <Controls />
            <Background color="#FFD600" gap={20} size={1} />
          </ReactFlow>
        </div>
        
        {/* Properties panel */}
        {selectedNode && (
          <div className="properties-panel">
            <h3 className="properties-title">Node Properties</h3>
            <div className="property-field">
              <label className="property-label">Label:</label>
              <input
                className="property-input"
                value={selectedNode.data?.label || ''}
                onChange={e => setNodes(nds => 
                  nds.map(n => n.id === selectedNode.id 
                    ? { ...n, data: { ...n.data, label: e.target.value } } 
                    : n
                  )
                )}
              />
            </div>
            <div className="node-id">Node ID: {selectedNode.id}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap the WorkflowBuilder component with ReactFlowProvider
// This fixes the "StoreUpdater" error
const WorkflowBuilderWithProvider = ({user}) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder user={user} />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilderWithProvider;
