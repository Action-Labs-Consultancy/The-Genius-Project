import React from 'react';

export default function NodePropertiesPanel({ node, onUpdateNode }) {
  if (!node) return null;
  const { data, type } = node;

  const handleChange = (field, value) => {
    onUpdateNode(node.id, { ...data, [field]: value });
  };

  return (
    <div className="node-properties-panel">
      <h3>Node Properties</h3>
      <div className="property-group">
        <label>Label</label>
        <input
          value={data.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
        />
      </div>
      {type === 'httpRequest' && (
        <>
          <div className="property-group">
            <label>Method</label>
            <select
              value={data.method || 'GET'}
              onChange={(e) => handleChange('method', e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="property-group">
            <label>URL</label>
            <input
              value={data.url || ''}
              onChange={(e) => handleChange('url', e.target.value)}
            />
          </div>
        </>
      )}
      {type === 'logMessage' && (
        <div className="property-group">
          <label>Message</label>
          <textarea
            value={data.message || ''}
            onChange={(e) => handleChange('message', e.target.value)}
          />
        </div>
      )}
      {type === 'ifCondition' && (
        <div className="property-group">
          <label>Condition</label>
          <input
            value={data.condition || ''}
            onChange={(e) => handleChange('condition', e.target.value)}
          />
        </div>
      )}
      {type === 'delay' && (
        <div className="property-group">
          <label>Duration (ms)</label>
          <input
            type="number"
            value={data.duration || 1000}
            onChange={(e) => handleChange('duration', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
