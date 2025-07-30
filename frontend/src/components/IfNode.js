import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import './IfNode.css';

const DATA_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' }
];

const CONDITIONS = {
  string: [
    { value: 'equals', label: 'equals', symbol: '=' },
    { value: 'notEquals', label: 'not equals', symbol: '≠' },
    { value: 'contains', label: 'contains', symbol: '⊃' },
    { value: 'notContains', label: 'does not contain', symbol: '⊅' },
    { value: 'startsWith', label: 'starts with', symbol: '⤴' },
    { value: 'endsWith', label: 'ends with', symbol: '⤵' },
    { value: 'regex', label: 'regex match', symbol: '/.*/' },
    { value: 'isEmpty', label: 'is empty', symbol: '∅' },
    { value: 'isNotEmpty', label: 'is not empty', symbol: '≠∅' }
  ],
  number: [
    { value: 'equals', label: 'equals', symbol: '=' },
    { value: 'notEquals', label: 'not equals', symbol: '≠' },
    { value: 'greater', label: 'greater than', symbol: '>' },
    { value: 'greaterEqual', label: 'greater or equal', symbol: '≥' },
    { value: 'less', label: 'less than', symbol: '<' },
    { value: 'lessEqual', label: 'less or equal', symbol: '≤' },
    { value: 'between', label: 'between', symbol: '⊆' },
    { value: 'notBetween', label: 'not between', symbol: '⊄' }
  ],
  boolean: [
    { value: 'equals', label: 'equals', symbol: '=' },
    { value: 'notEquals', label: 'not equals', symbol: '≠' },
    { value: 'isTrue', label: 'is true', symbol: '✓' },
    { value: 'isFalse', label: 'is false', symbol: '✗' }
  ],
  date: [
    { value: 'equals', label: 'equals', symbol: '=' },
    { value: 'notEquals', label: 'not equals', symbol: '≠' },
    { value: 'before', label: 'before', symbol: '<' },
    { value: 'after', label: 'after', symbol: '>' },
    { value: 'between', label: 'between', symbol: '⊆' },
    { value: 'isToday', label: 'is today', symbol: '📅' },
    { value: 'isYesterday', label: 'is yesterday', symbol: '⬅' },
    { value: 'isTomorrow', label: 'is tomorrow', symbol: '➡' }
  ],
  object: [
    { value: 'hasProperty', label: 'has property', symbol: '⚬' },
    { value: 'notHasProperty', label: 'does not have property', symbol: '⚬̸' },
    { value: 'isEmpty', label: 'is empty', symbol: '{}' },
    { value: 'isNotEmpty', label: 'is not empty', symbol: '≠{}' }
  ],
  array: [
    { value: 'contains', label: 'contains', symbol: '∋' },
    { value: 'notContains', label: 'does not contain', symbol: '∌' },
    { value: 'isEmpty', label: 'is empty', symbol: '[]' },
    { value: 'isNotEmpty', label: 'is not empty', symbol: '≠[]' },
    { value: 'lengthEquals', label: 'length equals', symbol: '|…|=' },
    { value: 'lengthGreater', label: 'length greater than', symbol: '|…|>' },
    { value: 'lengthLess', label: 'length less than', symbol: '|…|<' }
  ]
};

const LOGIC_OPERATORS = [
  { value: 'AND', label: 'AND', symbol: '∧' },
  { value: 'OR', label: 'OR', symbol: '∨' }
];

const VALUE_SOURCES = [
  { value: 'static', label: 'Static Value' },
  { value: 'expression', label: 'Expression' },
  { value: 'previousNode', label: 'Previous Node Output' },
  { value: 'variable', label: 'Variable' }
];

const IfNode = ({ data, id, selected }) => {
  const [conditions, setConditions] = useState(data.conditions || [
    { 
      field: '', 
      dataType: 'string', 
      condition: 'equals', 
      value: '', 
      valueSource: 'static',
      secondValue: '', // For between conditions
      logic: 'AND' 
    }
  ]);
  const [isExpanded, setIsExpanded] = useState(data.expanded !== false);
  const [operatorMode, setOperatorMode] = useState(data.operatorMode || 'AND');

  useEffect(() => {
    if (data.onConditionsChange) {
      data.onConditionsChange(conditions);
    }
    if (data.onOperatorChange) {
      data.onOperatorChange(operatorMode);
    }
  }, [conditions, operatorMode, data]);

  const updateCondition = (idx, field, value) => {
    const newConditions = [...conditions];
    newConditions[idx] = { ...newConditions[idx], [field]: value };
    
    // Reset condition when data type changes
    if (field === 'dataType') {
      newConditions[idx].condition = CONDITIONS[value][0].value;
    }
    
    setConditions(newConditions);
  };

  const addCondition = () => {
    setConditions([...conditions, { 
      field: '', 
      dataType: 'string', 
      condition: 'equals', 
      value: '', 
      valueSource: 'static',
      secondValue: '',
      logic: 'AND' 
    }]);
  };

  const removeCondition = (idx) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== idx));
    }
  };

  const duplicateCondition = (idx) => {
    const newCondition = { ...conditions[idx] };
    const newConditions = [...conditions];
    newConditions.splice(idx + 1, 0, newCondition);
    setConditions(newConditions);
  };

  const renderValueInput = (condition, idx) => {
    const conditionConfig = CONDITIONS[condition.dataType]?.find(c => c.value === condition.condition);
    const needsValue = !['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse', 'isToday', 'isYesterday', 'isTomorrow'].includes(condition.condition);
    const needsSecondValue = ['between', 'notBetween'].includes(condition.condition);

    if (!needsValue) return null;

    return (
      <div className="value-inputs">
        <div className="value-input-group">
          <select 
            value={condition.valueSource} 
            onChange={e => updateCondition(idx, 'valueSource', e.target.value)}
            className="value-source-select"
          >
            {VALUE_SOURCES.map(source => (
              <option key={source.value} value={source.value}>{source.label}</option>
            ))}
          </select>
          
          {condition.valueSource === 'static' && (
            <>
              {condition.dataType === 'boolean' ? (
                <select 
                  value={condition.value} 
                  onChange={e => updateCondition(idx, 'value', e.target.value)}
                  className="condition-value-input"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : condition.dataType === 'number' ? (
                <input 
                  type="number" 
                  value={condition.value} 
                  onChange={e => updateCondition(idx, 'value', e.target.value)}
                  className="condition-value-input"
                  placeholder="Enter number"
                />
              ) : condition.dataType === 'date' ? (
                <input 
                  type="datetime-local" 
                  value={condition.value} 
                  onChange={e => updateCondition(idx, 'value', e.target.value)}
                  className="condition-value-input"
                />
              ) : (
                <input 
                  type="text" 
                  value={condition.value} 
                  onChange={e => updateCondition(idx, 'value', e.target.value)}
                  className="condition-value-input"
                  placeholder={`Enter ${condition.dataType} value`}
                />
              )}
            </>
          )}
          
          {condition.valueSource === 'expression' && (
            <input 
              type="text" 
              value={condition.value} 
              onChange={e => updateCondition(idx, 'value', e.target.value)}
              className="condition-value-input expression"
              placeholder="{{ expression }}"
            />
          )}
          
          {condition.valueSource === 'variable' && (
            <input 
              type="text" 
              value={condition.value} 
              onChange={e => updateCondition(idx, 'value', e.target.value)}
              className="condition-value-input variable"
              placeholder="variableName"
            />
          )}
          
          {condition.valueSource === 'previousNode' && (
            <input 
              type="text" 
              value={condition.value} 
              onChange={e => updateCondition(idx, 'value', e.target.value)}
              className="condition-value-input node-output"
              placeholder="$.data.field"
            />
          )}
        </div>
        
        {needsSecondValue && (
          <div className="second-value-group">
            <span className="and-label">AND</span>
            <input 
              type={condition.dataType === 'number' ? 'number' : condition.dataType === 'date' ? 'datetime-local' : 'text'}
              value={condition.secondValue} 
              onChange={e => updateCondition(idx, 'secondValue', e.target.value)}
              className="condition-value-input"
              placeholder={`Second ${condition.dataType} value`}
            />
          </div>
        )}
      </div>
    );
  };

  const getConditionSummary = () => {
    if (conditions.length === 1) {
      const cond = conditions[0];
      const condConfig = CONDITIONS[cond.dataType]?.find(c => c.value === cond.condition);
      return `${cond.field || 'field'} ${condConfig?.symbol || '='} ${cond.value || 'value'}`;
    }
    return `${conditions.length} conditions (${operatorMode})`;
  };

  return (
    <div className={`if-node ${selected ? 'selected' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ background: '#FFD600', width: 8, height: 8 }}
      />
      
      <div className="if-node-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="node-title">
          <span className="node-icon">?</span>
          <span className="node-label">IF</span>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        <div className="condition-summary">
          {getConditionSummary()}
        </div>
      </div>

      {isExpanded && (
        <div className="if-node-content">
          <div className="global-operator">
            <label>Global Operator:</label>
            <select 
              value={operatorMode} 
              onChange={e => setOperatorMode(e.target.value)}
              className="operator-select"
            >
              {LOGIC_OPERATORS.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label} {op.symbol}
                </option>
              ))}
            </select>
          </div>

          <div className="conditions-list">
            {conditions.map((condition, idx) => (
              <div key={idx} className="condition-row">
                <div className="condition-header">
                  <span className="condition-number">#{idx + 1}</span>
                  <div className="condition-actions">
                    <button 
                      className="duplicate-btn" 
                      onClick={() => duplicateCondition(idx)}
                      title="Duplicate condition"
                    >
                      ⧉
                    </button>
                    <button 
                      className="remove-btn" 
                      onClick={() => removeCondition(idx)}
                      disabled={conditions.length === 1}
                      title="Remove condition"
                    >
                      ✖
                    </button>
                  </div>
                </div>

                <div className="condition-fields">
                  <div className="field-row">
                    <input 
                      type="text" 
                      value={condition.field} 
                      onChange={e => updateCondition(idx, 'field', e.target.value)}
                      className="field-input"
                      placeholder="Field name (e.g., data.name)"
                    />
                  </div>

                  <div className="type-condition-row">
                    <select 
                      value={condition.dataType} 
                      onChange={e => updateCondition(idx, 'dataType', e.target.value)}
                      className="data-type-select"
                    >
                      {DATA_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>

                    <select 
                      value={condition.condition} 
                      onChange={e => updateCondition(idx, 'condition', e.target.value)}
                      className="condition-select"
                    >
                      {CONDITIONS[condition.dataType]?.map(cond => (
                        <option key={cond.value} value={cond.value}>
                          {cond.symbol} {cond.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {renderValueInput(condition, idx)}
                </div>

                {idx < conditions.length - 1 && (
                  <div className="logic-operator">
                    <select 
                      value={condition.logic} 
                      onChange={e => updateCondition(idx, 'logic', e.target.value)}
                      className="logic-select"
                    >
                      {LOGIC_OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="add-condition-btn" onClick={addCondition}>
            + Add Condition
          </button>
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true" 
        style={{ background: '#10b981', left: '25%', width: 10, height: 10 }}
      />
      <div className="output-label true-label">TRUE</div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false" 
        style={{ background: '#ef4444', left: '75%', width: 10, height: 10 }}
      />
      <div className="output-label false-label">FALSE</div>
    </div>
  );
};

export default IfNode;
