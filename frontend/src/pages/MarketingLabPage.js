import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Download, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Bot,
  Zap,
  FileText,
  Target,
  MessageSquare,
  Users,
  Settings
} from 'lucide-react';
import { useNotification } from '../components/ModernNotification';
import './MarketingLabPage.css';

const MarketingLabPage = ({ user }) => {
  const { notification, showNotification, NotificationComponent } = useNotification();
  
  const [taskData, setTaskData] = useState({
    campaign_name: '',
    description: '',
    target_audience: '',
    tone: 'professional',
    platform: 'LinkedIn'
  });
  
  const [execution, setExecution] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDebugSidebar, setShowDebugSidebar] = useState(false);
  const [expandedOutputs, setExpandedOutputs] = useState({});
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [labBrain, setLabBrain] = useState(null);
  const [labAgents, setLabAgents] = useState([]);

  const TONES = {
    'professional': 'Professional & Business',
    'casual': 'Casual & Friendly',
    'creative': 'Creative & Inspiring',
    'urgent': 'Urgent & Action-Oriented',
    'informative': 'Informative & Educational'
  };

  const PLATFORMS = {
    'LinkedIn': 'LinkedIn (Professional)',
    'Instagram': 'Instagram (Visual)',
    'Twitter': 'Twitter/X (Concise)',
    'Facebook': 'Facebook (Community)',
    'TikTok': 'TikTok (Creative)',
    'Email': 'Email Campaign'
  };

  useEffect(() => {
    fetchLabData();
    fetchRecentExecutions();
  }, []);

  const fetchLabData = async () => {
    try {
      const [brainsResponse, agentsResponse] = await Promise.all([
        fetch('/api/marketing-lab/brains'),
        fetch('/api/marketing-lab/agents')
      ]);
      
      if (brainsResponse.ok) {
        const brainsResult = await brainsResponse.json();
        if (brainsResult.success && brainsResult.data.length > 0) {
          setLabBrain(brainsResult.data[0]);
        }
      }
      
      if (agentsResponse.ok) {
        const agentsResult = await agentsResponse.json();
        if (agentsResult.success) {
          setLabAgents(agentsResult.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch lab data:', error);
    }
  };

  const fetchRecentExecutions = async () => {
    try {
      const response = await fetch('/api/marketing-lab/executions');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRecentExecutions(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent executions:', error);
    }
  };

  const executeTask = async () => {
    if (!taskData.campaign_name || !taskData.description || !taskData.target_audience) {
      showNotification({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all required fields: Campaign Name, Description, and Target Audience.',
        autoClose: true
      });
      return;
    }

    setIsExecuting(true);
    setExecution(null);
    setExpandedOutputs({});

    try {
      const response = await fetch('http://localhost:10000/api/marketing-lab/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      const result = await response.json();
      
      if (result.success) {
        setExecution(result.data);
        fetchRecentExecutions(); // Refresh recent executions
        showNotification({
          type: 'success',
          title: 'Task Completed!',
          message: `Successfully generated marketing content for "${taskData.campaign_name}" using our AI agent team.`,
          autoClose: true
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Execution Failed',
          message: result.error || 'Failed to execute task. Please try again.',
          autoClose: true
        });
      }
    } catch (error) {
      console.error('Failed to execute task:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to execute task: ' + error.message,
        autoClose: true
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification({
      type: 'success',
      title: 'Copied!',
      message: 'Content has been copied to your clipboard.',
      autoClose: true,
      autoCloseDelay: 2000
    });
  };

  // Function to separate content from performance optimization
  const parseContent = (finalOutput) => {
    if (!finalOutput) return { content: '', performance: '' };
    
    const performanceMarker = '📈 PERFORMANCE OPTIMIZATION:';
    const index = finalOutput.indexOf(performanceMarker);
    
    if (index === -1) {
      return { content: finalOutput.trim(), performance: '' };
    }
    
    return {
      content: finalOutput.substring(0, index).trim(),
      performance: finalOutput.substring(index).trim()
    };
  };

  const downloadAsText = (text, filename = 'marketing_content.txt') => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toggleOutputExpansion = (agentName) => {
    setExpandedOutputs(prev => ({
      ...prev,
      [agentName]: !prev[agentName]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon success" size={20} />;
      case 'error':
        return <XCircle className="status-icon error" size={20} />;
      case 'started':
        return <Clock className="status-icon running" size={20} />;
      default:
        return <Clock className="status-icon pending" size={20} />;
    }
  };

  const rerunExecution = () => {
    executeTask();
  };

  return (
    <div className="marketing-lab-page">
      <div className="lab-header">
        <div className="header-content">
          <div className="header-title">
            <Zap className="header-icon" size={32} />
            <div>
              <h1>Marketing AI Tasks Lab</h1>
              <p>Multi-agent marketing automation demonstration</p>
            </div>
          </div>
          <button 
            className="debug-toggle"
            onClick={() => setShowDebugSidebar(!showDebugSidebar)}
          >
            <Settings size={20} />
            {showDebugSidebar ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      </div>

      <div className={`lab-content ${showDebugSidebar ? 'with-sidebar' : ''}`}>
        <div className="main-content">
          {/* Task Input Section */}
          <div className="task-input-section">
            <div className="section-header">
              <Target size={24} />
              <div>
                <h2>Generate a Marketing Asset</h2>
                <p>Start by entering basic campaign info. The agents will handle the rest.</p>
              </div>
            </div>

            <form className="task-form" onSubmit={(e) => { e.preventDefault(); executeTask(); }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Product or Campaign Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={taskData.campaign_name}
                    onChange={(e) => setTaskData({...taskData, campaign_name: e.target.value})}
                    placeholder="e.g., LaunchPad Pro Software"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Target Audience *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={taskData.target_audience}
                    onChange={(e) => setTaskData({...taskData, target_audience: e.target.value})}
                    placeholder="e.g., Small business owners, Tech startups"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Description or Features *
                </label>
                <textarea
                  className="form-textarea"
                  value={taskData.description}
                  onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                  placeholder="Describe your product, service, or campaign features..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Tone of Voice
                  </label>
                  <select
                    className="form-select"
                    value={taskData.tone}
                    onChange={(e) => setTaskData({...taskData, tone: e.target.value})}
                  >
                    {Object.entries(TONES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Platform
                  </label>
                  <select
                    className="form-select"
                    value={taskData.platform}
                    onChange={(e) => setTaskData({...taskData, platform: e.target.value})}
                  >
                    {Object.entries(PLATFORMS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="execute-btn"
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="spinning" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Create Post with AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Execution Panel */}
          {(execution || isExecuting) && (
            <div className="execution-panel">
              <div className="section-header">
                <Bot size={24} />
                <div>
                  <h2>Agent Execution</h2>
                  <p>Real-time processing by LaunchCampaignBrain agents</p>
                </div>
              </div>

              {/* Agent Progress */}
              <div className="agents-progress">
                {labAgents.map((agent, index) => {
                  const agentLog = execution?.agents?.find(a => a.agent_name === agent.agent_name);
                  const status = agentLog?.status || (isExecuting && index === 0 ? 'started' : 'pending');
                  
                  return (
                    <div key={agent.agent_name} className={`agent-card ${status}`}>
                      <div className="agent-header">
                        <div className="agent-info">
                          {getStatusIcon(status)}
                          <div>
                            <h3>{agent.agent_name}</h3>
                            <p>{agent.role_description}</p>
                          </div>
                        </div>
                        {agentLog?.output && (
                          <button
                            className="expand-btn"
                            onClick={() => toggleOutputExpansion(agent.agent_name)}
                          >
                            {expandedOutputs[agent.agent_name] ? <EyeOff size={16} /> : <Eye size={16} />}
                            {expandedOutputs[agent.agent_name] ? 'Collapse' : 'View Output'}
                          </button>
                        )}
                      </div>
                      
                      {agentLog?.output && (
                        <div className={`agent-output ${expandedOutputs[agent.agent_name] ? 'expanded' : ''}`}>
                          <pre className="output-text">
                            {expandedOutputs[agent.agent_name] 
                              ? agentLog.output 
                              : agentLog.output_preview || agentLog.output.substring(0, 150) + '...'
                            }
                          </pre>
                        </div>
                      )}
                      
                      {agentLog?.error && (
                        <div className="agent-error">
                          <p>Error: {agentLog.error}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Final Output */}
              {execution?.final_output && (
                <div className="final-output-card">
                  <div className="final-header">
                    <FileText size={24} />
                    <div>
                      <h2>Final Marketing Asset</h2>
                      <p>Quality-verified content ready for {taskData.platform}</p>
                    </div>
                  </div>
                  
                  <div className="final-content">
                    <pre className="final-text">{parseContent(execution.final_output).content}</pre>
                  </div>

                  {/* Performance Optimization Box */}
                  {parseContent(execution.final_output).performance && (
                    <div className="performance-optimization">
                      <div className="performance-title">
                        📈 Performance Optimization
                      </div>
                      <pre className="performance-content">{parseContent(execution.final_output).performance.replace('📈 PERFORMANCE OPTIMIZATION:', '').trim()}</pre>
                    </div>
                  )}
                  
                  <div className="final-actions">
                    <button 
                      className="action-btn primary"
                      onClick={() => copyToClipboard(parseContent(execution.final_output).content)}
                    >
                      <Copy size={16} />
                      Copy Content
                    </button>
                    <button 
                      className="action-btn secondary"
                      onClick={() => downloadAsText(execution.final_output, `${taskData.campaign_name.replace(/\s+/g, '_')}_content.txt`)}
                    >
                      <Download size={16} />
                      Download Full
                    </button>
                    <button 
                      className="action-btn secondary"
                      onClick={rerunExecution}
                      disabled={isExecuting}
                    >
                      <RefreshCw size={16} />
                      Re-run with same inputs
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debug Sidebar */}
        {showDebugSidebar && (
          <div className="debug-sidebar">
            <div className="debug-section">
              <h3>🧠 Brain Info</h3>
              {labBrain ? (
                <div className="debug-info">
                  <p><strong>Name:</strong> {labBrain.name}</p>
                  <p><strong>Description:</strong> {labBrain.description}</p>
                  <p><strong>Agents:</strong> {labAgents.length}</p>
                </div>
              ) : (
                <p>Loading brain info...</p>
              )}
            </div>

            <div className="debug-section">
              <h3>🤖 Agent Details</h3>
              <div className="agents-list">
                {labAgents.map((agent, index) => (
                  <div key={agent.agent_name} className="agent-debug-card">
                    <h4>{index + 1}. {agent.agent_name}</h4>
                    <p className="agent-role">{agent.role_description}</p>
                    <details className="agent-prompt">
                      <summary>View System Prompt</summary>
                      <p>{agent.system_prompt}</p>
                    </details>
                  </div>
                ))}
              </div>
            </div>

            <div className="debug-section">
              <h3>📊 Recent Executions</h3>
              <div className="recent-executions">
                {recentExecutions.slice(0, 5).map((exec) => (
                  <div key={exec.execution_id} className="execution-summary">
                    <p><strong>{exec.task_data?.campaign_name || 'Unknown Campaign'}</strong></p>
                    <p className="exec-date">{new Date(exec.started_at).toLocaleString()}</p>
                    <span className={`exec-status ${exec.status}`}>{exec.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Notification Component */}
      {NotificationComponent}
    </div>
  );
};

export default MarketingLabPage;
