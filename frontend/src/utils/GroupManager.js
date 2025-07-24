// GroupManager.js - Handles grouping/ungrouping logic while preserving connections
export class GroupManager {
  constructor(nodes, edges, setNodes, setEdges) {
    this.nodes = nodes;
    this.edges = edges;
    this.setNodes = setNodes;
    this.setEdges = setEdges;
  }

  // Create a group from selected nodes
  createGroup(selectedNodeIds, groupConfig = {}) {
    const groupId = `group-${Date.now()}`;
    const selectedNodes = this.nodes.filter(node => selectedNodeIds.includes(node.id));
    
    if (selectedNodes.length === 0) return null;

    // Calculate group bounds
    const bounds = this.calculateBounds(selectedNodes);
    
    // IMPORTANT: Store external connections before grouping
    const externalConnections = this.getExternalConnectionsForNodes(selectedNodeIds);
    console.log('External connections before grouping:', externalConnections);
    
    // Create the group node
    const groupNode = {
      id: groupId,
      type: 'group',
      position: { x: bounds.x - 20, y: bounds.y - 20 },
      data: {
        label: groupConfig.name || 'New Group',
        color: groupConfig.color || '#8B5CF6',
        nodeCount: selectedNodes.length,
        expanded: true,
        description: groupConfig.description || '',
        config: groupConfig,
        onEdit: groupConfig.onEdit,
        onToggleExpanded: groupConfig.onToggleExpanded,
        containedNodes: selectedNodeIds,
        // Store external connections metadata
        externalConnections: externalConnections
      },
      style: {
        width: bounds.width + 40,
        height: bounds.height + 60,
        zIndex: -1
      }
    };

    // Update contained nodes to be children of the group
    const updatedNodes = this.nodes.map(node => {
      if (selectedNodeIds.includes(node.id)) {
        return {
          ...node,
          parentNode: groupId,
          extent: 'parent',
          hidden: false, // Ensure nodes remain visible when grouped
          position: {
            x: node.position.x - bounds.x + 20,
            y: node.position.y - bounds.y + 40
          }
        };
      }
      return node;
    });

    // Add the group node
    updatedNodes.push(groupNode);

    this.setNodes(updatedNodes);
    
    // CRITICAL: Ensure all edges remain unchanged and visible
    // React Flow will automatically handle rendering connections to grouped nodes
    console.log('Edges after grouping (unchanged):', this.edges.length);
    
    return groupId;
  }

  // Ungroup nodes while preserving all connections
  ungroupNodes(groupId) {
    const groupNode = this.nodes.find(node => node.id === groupId);
    if (!groupNode || groupNode.type !== 'group') return;

    const containedNodeIds = groupNode.data.containedNodes || [];
    
    // Calculate group's absolute position
    const groupPosition = groupNode.position;

    console.log('🔄 Starting ungrouping process...');
    console.log('📦 Ungrouping nodes:', containedNodeIds);
    console.log('🔗 Current edges count:', this.edges.length);
    
    // CRITICAL: Capture ALL edges BEFORE ungrouping
    const allCurrentEdges = [...this.edges];
    
    // Identify external connections (must be preserved)
    const externalConnections = allCurrentEdges.filter(edge => {
      const isIncoming = containedNodeIds.includes(edge.target) && !containedNodeIds.includes(edge.source);
      const isOutgoing = containedNodeIds.includes(edge.source) && !containedNodeIds.includes(edge.target);
      return isIncoming || isOutgoing;
    });
    
    console.log('🔗 External connections to preserve:', externalConnections.length, externalConnections);

    // Create updated nodes with absolute positions, removing group reference
    const updatedNodes = this.nodes.map(node => {
      if (containedNodeIds.includes(node.id)) {
        const absolutePosition = {
          x: groupPosition.x + node.position.x,
          y: groupPosition.y + node.position.y
        };
        
        console.log(`📍 Moving node ${node.id} from relative ${node.position.x},${node.position.y} to absolute ${absolutePosition.x},${absolutePosition.y}`);
        
        return {
          ...node,
          parentNode: undefined,
          extent: undefined,
          hidden: false,
          position: absolutePosition,
          // Ensure the node is fully independent
          draggable: true,
          selected: false
        };
      }
      return node;
    }).filter(node => node.id !== groupId); // Remove the group node itself

    // Update nodes in one atomic operation
    console.log('🔄 Updating nodes and preserving all edges...');
    this.setNodes(updatedNodes);
    
    // Force edge re-evaluation to ensure connections persist
    setTimeout(() => {
      // Re-apply all edges to force React Flow to validate connections
      this.setEdges([...allCurrentEdges]);
      
      // Verify connections after update
      setTimeout(() => {
        const currentEdges = this.edges;
        const preservedExternalConnections = currentEdges.filter(edge => {
          const isIncoming = containedNodeIds.includes(edge.target) && !containedNodeIds.includes(edge.source);
          const isOutgoing = containedNodeIds.includes(edge.source) && !containedNodeIds.includes(edge.target);
          return isIncoming || isOutgoing;
        });
        
        console.log('✅ Final verification:', {
          originalExternalConnections: externalConnections.length,
          preservedExternalConnections: preservedExternalConnections.length,
          totalEdgesAfter: currentEdges.length,
          success: preservedExternalConnections.length >= externalConnections.length
        });
        
        if (preservedExternalConnections.length < externalConnections.length) {
          console.error('❌ Some external connections were lost during ungrouping!');
          
          // Try to restore missing connections
          const missingConnections = externalConnections.filter(orig => 
            !preservedExternalConnections.some(pres => 
              pres.id === orig.id || 
              (pres.source === orig.source && pres.target === orig.target && pres.sourceHandle === orig.sourceHandle && pres.targetHandle === orig.targetHandle)
            )
          );
          
          if (missingConnections.length > 0) {
            console.log('🔧 Attempting to restore missing connections:', missingConnections);
            const restoredEdges = [...currentEdges, ...missingConnections];
            this.setEdges(restoredEdges);
          }
        } else {
          console.log('✅ All external connections preserved successfully!');
        }
      }, 150);
    }, 100);
  }

  // Toggle group expansion while preserving connections
  toggleGroupExpansion(groupId) {
    const groupNode = this.nodes.find(n => n.id === groupId);
    if (!groupNode || groupNode.type !== 'group') return;
    
    const expanded = !groupNode.data.expanded;
    
    const updatedNodes = this.nodes.map(node => {
      if (node.id === groupId && node.type === 'group') {
        return {
          ...node,
          data: { ...node.data, expanded },
          style: {
            ...node.style,
            height: expanded ? (node.style.height || 300) : 80
          }
        };
      }
      
      // Hide/show contained nodes based on group expansion
      // Nodes remain editable even when group is collapsed
      if (node.parentNode === groupId) {
        return {
          ...node,
          hidden: !expanded
        };
      }
      
      return node;
    });

    this.setNodes(updatedNodes);
  }

  // Get external connections for a group (connections to nodes outside the group)
  getExternalConnections(groupId) {
    const groupNode = this.nodes.find(node => node.id === groupId);
    if (!groupNode) return { incoming: [], outgoing: [] };

    const containedNodeIds = groupNode.data.containedNodes || [];
    
    const incoming = this.edges.filter(edge => 
      containedNodeIds.includes(edge.target) && 
      !containedNodeIds.includes(edge.source)
    );
    
    const outgoing = this.edges.filter(edge => 
      containedNodeIds.includes(edge.source) && 
      !containedNodeIds.includes(edge.target)
    );

    return { incoming, outgoing };
  }

  // Get external connections for specific nodes (before/after grouping)
  getExternalConnectionsForNodes(nodeIds) {
    const incoming = this.edges.filter(edge => 
      nodeIds.includes(edge.target) && 
      !nodeIds.includes(edge.source)
    );
    
    const outgoing = this.edges.filter(edge => 
      nodeIds.includes(edge.source) && 
      !nodeIds.includes(edge.target)
    );

    return { incoming, outgoing, total: incoming.length + outgoing.length };
  }

  // Calculate bounds of a set of nodes
  calculateBounds(nodes) {
    if (nodes.length === 0) return { x: 0, y: 0, width: 200, height: 100 };

    const positions = nodes.map(node => ({
      x: node.position.x,
      y: node.position.y,
      width: node.width || 200,
      height: node.height || 100
    }));

    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  // Check if a node is inside a group
  isNodeInGroup(nodeId, groupId) {
    const groupNode = this.nodes.find(node => node.id === groupId);
    return groupNode?.data.containedNodes?.includes(nodeId) || false;
  }

  // Move nodes into an existing group
  addNodesToGroup(nodeIds, groupId) {
    const groupNode = this.nodes.find(node => node.id === groupId);
    if (!groupNode || groupNode.type !== 'group') return;

    const groupPosition = groupNode.position;
    const containedNodes = groupNode.data.containedNodes || [];
    const newContainedNodes = [...containedNodes, ...nodeIds];

    const updatedNodes = this.nodes.map(node => {
      if (node.id === groupId) {
        return {
          ...node,
          data: {
            ...node.data,
            containedNodes: newContainedNodes,
            nodeCount: newContainedNodes.length
          }
        };
      }
      
      if (nodeIds.includes(node.id)) {
        return {
          ...node,
          parentNode: groupId,
          extent: 'parent',
          position: {
            x: node.position.x - groupPosition.x,
            y: node.position.y - groupPosition.y
          }
        };
      }
      
      return node;
    });

    this.setNodes(updatedNodes);
  }

  // Remove nodes from a group
  removeNodesFromGroup(nodeIds, groupId) {
    const groupNode = this.nodes.find(node => node.id === groupId);
    if (!groupNode || groupNode.type !== 'group') return;

    const groupPosition = groupNode.position;
    const containedNodes = groupNode.data.containedNodes || [];
    const newContainedNodes = containedNodes.filter(id => !nodeIds.includes(id));

    const updatedNodes = this.nodes.map(node => {
      if (node.id === groupId) {
        return {
          ...node,
          data: {
            ...node.data,
            containedNodes: newContainedNodes,
            nodeCount: newContainedNodes.length
          }
        };
      }
      
      if (nodeIds.includes(node.id) && node.parentNode === groupId) {
        return {
          ...node,
          parentNode: undefined,
          extent: undefined,
          position: {
            x: groupPosition.x + node.position.x,
            y: groupPosition.y + node.position.y
          }
        };
      }
      
      return node;
    });

    this.setNodes(updatedNodes);
  }
}
