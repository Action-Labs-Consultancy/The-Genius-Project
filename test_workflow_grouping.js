// Test script to verify workflow grouping functionality
console.log('Testing workflow canvas grouping functionality...');

// Test data for grouping
const testNodes = [
  { id: 'start-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start Node' } },
  { id: 'http-1', type: 'httpRequest', position: { x: 100, y: 200 }, data: { label: 'API Call' } },
  { id: 'log-1', type: 'log', position: { x: 100, y: 300 }, data: { label: 'Log Result' } }
];

const testGroup = {
  id: 'group-test-1',
  title: 'API Group',
  description: 'Handles API calls and logging',
  nodeIds: ['start-1', 'http-1', 'log-1'],
  position: { x: 80, y: 80 },
  size: { width: 140, height: 260 },
  color: '#e0e7ff',
  borderColor: '#6366f1'
};

console.log('Test nodes:', testNodes);
console.log('Test group:', testGroup);

// Instructions for manual testing:
console.log(`
MANUAL TESTING INSTRUCTIONS:
1. Navigate to the workflow canvas page
2. Add at least 2 nodes to the canvas
3. Select multiple nodes (using Ctrl/Cmd + click or drag selection)
4. Click the "Group" button in the toolbar
5. Fill in group title and description
6. Click "Create Group"
7. Verify that:
   - Group container appears around selected nodes
   - Group can be dragged and moves all contained nodes
   - Group metadata is saved when saving the workflow
   - Group can be deleted using the X button
   - Nodes can still connect to other nodes outside the group
`);
