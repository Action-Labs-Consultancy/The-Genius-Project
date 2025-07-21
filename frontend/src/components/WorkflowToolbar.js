import React from 'react';

const WorkflowToolbar = ({
  currentWorkflow,
  workflows,
  onSave,
  onLoad,
  onNew,
  onExecute,
  isExecuting,
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <div className="workflow-toolbar">
      <div className="toolbar-left">
        <button 
          className="toolbar-btn sidebar-toggle"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          <i className={`fas ${sidebarOpen ? 'fa-angle-left' : 'fa-bars'}`}></i>
        </button>

        <div className="toolbar-separator"></div>

        <button className="toolbar-btn" onClick={onNew} title="New workflow">
          <i className="fas fa-plus"></i>
          New
        </button>

        <button className="toolbar-btn" onClick={onSave} title="Save workflow">
          <i className="fas fa-save"></i>
          Save
        </button>

        <select 
          className="workflow-select"
          onChange={(e) => e.target.value && onLoad(e.target.value)}
          value=""
        >
          <option value="">Load workflow...</option>
          {workflows.map(workflow => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-center">
        <div className="workflow-name">
          {currentWorkflow?.name || 'Untitled Workflow'}
        </div>
      </div>

      <div className="toolbar-right">
        <button 
          className={`toolbar-btn execute-btn ${isExecuting ? 'executing' : ''}`}
          onClick={onExecute}
          disabled={isExecuting || !currentWorkflow}
          title="Execute workflow"
        >
          <i className={`fas ${isExecuting ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
          {isExecuting ? 'Executing...' : 'Execute'}
        </button>
      </div>
    </div>
  );
};

export default WorkflowToolbar;
