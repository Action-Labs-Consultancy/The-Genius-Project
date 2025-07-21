import React, { useState, useCallback } from 'react';
import ReactFlow, { addEdge, MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 50 } }
];
const initialEdges = [];

const nodeTypesList = [
  { type: 'httpRequest', label: 'HTTP Request', color: '#3b82f6' },
  { type: 'logMessage', label: 'Log Message', color: '#10b981' },
  { type: 'ifCondition', label: 'If Condition', color: '#f59e0b' },
  { type: 'delay', label: 'Delay', color: '#8b5cf6' }
];

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onNodeClick = useCallback((event, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // Add node to canvas
  const addNode = (type) => {
    setNodes((nds) => nds.concat({
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { label: nodeTypesList.find(n => n.type === type).label }
    }));
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', background: '#f3f4f6' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: '#222' }}>Nodes</h3>
        {nodeTypesList.map((n) => (
          <button
            key={n.type}
            style={{
              background: n.color,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 0',
              marginBottom: 6,
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0001',
              transition: 'background 0.2s',
            }}
            onClick={() => addNode(n.type)}
          >
            {n.label}
          </button>
        ))}
      </div>
      {/* Canvas */}
      <div style={{ flex: 1, background: '#1a1a1a', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          style={{ background: '#1a1a1a', minHeight: '100%' }}
        >
          <MiniMap />
          <Controls />
          <Background color="#ffffff" gap={20} size={1} />
        </ReactFlow>
      </div>
      {/* Properties panel */}
      <div style={{ width: 320, background: '#f9fafb', borderLeft: '1px solid #e5e7eb', padding: 20, display: selectedNode ? 'block' : 'none' }}>
        {selectedNode && (
          <>
            <h3 style={{ marginTop: 0 }}>Node Properties</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 500 }}>Label:</label>
              <input
                value={selectedNode.data.label}
                onChange={e => setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb', marginTop: 4 }}
              />
            </div>
            <div style={{ color: '#888', fontSize: 13 }}>Node ID: {selectedNode.id}</div>
          </>
        )}
      </div>
    </div>
  );
}
