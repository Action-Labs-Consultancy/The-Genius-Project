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
  Settings,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useNotification } from '../components/ModernNotification';
import { API_BASE_URL } from '../config/api';
import './MarketingLabPage.css';

const MarketingLabPage = ({ user }) => {
  const { notification, showNotification, NotificationComponent } = useNotification();
  
  // Tab state for switching between features
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' or 'funnel'
  
  const [taskData, setTaskData] = useState({
    campaign_name: '',
    description: '',
    target_audience: '',
    tone: 'professional',
    platform: 'LinkedIn',
    funnel_stage: 'Awareness',
    content_type: 'Social Media Post',
    time_option: '1 Month'
  });

  // New state for funnel content generator
  const [funnelData, setFunnelData] = useState({
    product_name: '',
    target_audience: '',
    description: '',
    tone: 'professional',
    platform: 'LinkedIn',
    funnel_stage: 'Awareness',
    content_type: 'Social Media Post',
    time_option: '1 Month'
  });
  
  const [funnelResult, setFunnelResult] = useState(null);
  const [generatingFunnel, setGeneratingFunnel] = useState(false);
  
  const [execution, setExecution] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDebugSidebar, setShowDebugSidebar] = useState(false);
  const [expandedOutputs, setExpandedOutputs] = useState({});
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [labBrain, setLabBrain] = useState(null);
  const [labAgents, setLabAgents] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);

  // New state for agent chat feature
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [currentGeneratedContent, setCurrentGeneratedContent] = useState(null);

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

  // Funnel-specific options
  const FUNNEL_STAGES = {
    'Awareness': {
      label: 'Awareness',
      description: 'People become aware of a problem they want to solve.'
    },
    'Consideration': {
      label: 'Consideration', 
      description: 'Prospects start looking into different products or services that can solve their problems.'
    },
    'Conversion': {
      label: 'Conversion',
      description: 'Prospects find a solution they like and become paying customers.'
    },
    'Loyalty': {
      label: 'Loyalty',
      description: 'Customers continue to use the solution and recommend that product or service to other people.'
    }
  };

  const CONTENT_TYPES = {
    'Blog Post': 'Blog Post',
    'Social Media Post': 'Social Media Post', 
    'Email': 'Email',
    'Video': 'Video',
    'Infographic': 'Infographic'
  };

  const TIME_OPTIONS = {
    '2 Weeks': '2 Weeks',
    '1 Month': '1 Month'
  };

  useEffect(() => {
    fetchLabData();
    fetchRecentExecutions();
    checkSystemHealth();
  }, []);

  const fetchLabData = async () => {
    try {
      const [brainsResponse, agentsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/marketing-lab/brains`),
        fetch(`${API_BASE_URL}/api/marketing-lab/agents`)
      ]);
      
      if (brainsResponse.ok) {
        const brainsResult = await brainsResponse.json();
        if (brainsResult.success && brainsResult.data && brainsResult.data.length > 0) {
          setLabBrain(brainsResult.data[0]);
        }
      }
      
      if (agentsResponse.ok) {
        const agentsResult = await agentsResponse.json();
        if (agentsResult.success && agentsResult.data && Array.isArray(agentsResult.data)) {
          setLabAgents(agentsResult.data);
        } else {
          console.warn('Invalid agents data received:', agentsResult);
          setLabAgents([]); // Ensure it's always an array
        }
      } else {
        console.warn('Agents API call failed, setting empty array');
        setLabAgents([]); // Ensure it's always an array
      }
    } catch (error) {
      console.error('Failed to fetch lab data:', error);
      setLabAgents([]); // Ensure it's always an array even on error
    }
  };

  const fetchRecentExecutions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/marketing-lab/executions`);
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

  const fetchRecommendations = async () => {
    if (!taskData.platform || !taskData.target_audience) return;
    
    setLoadingRecommendations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/marketing-lab/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: taskData.platform,
          target_audience: taskData.target_audience,
          campaign_name: taskData.campaign_name,
          description: taskData.description,
          tone: taskData.tone,
          funnel_stage: taskData.funnel_stage,
          content_type: taskData.content_type
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRecommendations(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Fetch recommendations when key data changes
  useEffect(() => {
    if (taskData.platform && taskData.target_audience && taskData.campaign_name) {
      fetchRecommendations();
    }
  }, [taskData.platform, taskData.target_audience, taskData.campaign_name, taskData.description]);

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
      const response = await fetch(`${API_BASE_URL}/api/marketing-lab/execute-quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      const result = await response.json();
      
      if (result.success) {
        setExecution(result.data);
        setCurrentGeneratedContent(result.data.final_output); // Store for chat feature
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

  // New function for funnel content generation
  const generateFunnelContent = async () => {
    if (!funnelData.product_name.trim() || !funnelData.description.trim() || !funnelData.target_audience.trim()) {
      showNotification({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all required fields.',
        autoClose: true
      });
      return;
    }

    setGeneratingFunnel(true);
    setFunnelResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds to accommodate backend + network

      const response = await fetch(`${API_BASE_URL}/api/marketing-lab/funnel-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(funnelData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.stage) {
          setFunnelResult({
            stage: result.data.funnel_stage,
            contentType: result.data.content_type,
            timeOption: result.data.time_option,
            platform: result.data.platform,
            tone: 'Professional & Business',
            productName: funnelData.product_name,
            targetAudience: funnelData.target_audience,
            contentIdea: result.data.generated_content,
            stageObjective: result.data.stage_objective,
            executionId: result.data.execution_id,
            generatedAt: new Date().toLocaleString()
          });
          setCurrentGeneratedContent(result.data.generated_content); // Store for chat feature
          showNotification({
            type: 'success',
            title: 'Success!',
            message: `${result.data.funnel_stage} stage content strategy generated successfully!`,
            autoClose: true
          });
        } else {
          showNotification({
            type: 'error',
            title: 'Generation Failed',
            message: result.error || result.message || 'Failed to generate funnel content',
            autoClose: true
          });
        }
      } else {
        showNotification({
          type: 'error',
          title: 'Generation Failed',
          message: result.error || result.message || 'Failed to generate funnel content',
          autoClose: true
        });
      }
    } catch (error) {
      console.error('Funnel generation error:', error);
      if (error.name === 'AbortError') {
        showNotification({
          type: 'warning',
          title: 'Generation Timeout',
          message: 'Content generation is taking longer than expected. Try again with simpler inputs.',
          autoClose: true
        });
      } else if (error.message.includes('Failed to fetch')) {
        showNotification({
          type: 'error',
          title: 'Connection Error',
          message: 'Unable to connect to AI service. Please check if the backend is running.',
          autoClose: true
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Network Error',
          message: 'An error occurred during content generation. Please try again.',
          autoClose: true
        });
      }
    } finally {
      setGeneratingFunnel(false);
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

  // Agent Chat Functions
  const openAgentChat = () => {
    if (!currentGeneratedContent) {
      showNotification({
        type: 'warning',
        title: 'No Content Available',
        message: 'Please generate content first before using the agent chat.',
        autoClose: true
      });
      return;
    }
    setShowAgentChat(true);
    // Initialize chat with welcome message if no messages exist
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: 1,
        type: 'agent',
        message: `Hi! I'm your Marketing Agent assistant. I can help you modify and improve the content I just generated for "${taskData.campaign_name || funnelData.product_name}". What changes would you like me to make?`,
        timestamp: new Date().toLocaleString()
      }]);
    }
  };

  const closeAgentChat = () => {
    setShowAgentChat(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatInput.trim(),
      timestamp: new Date().toLocaleString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatProcessing(true);

    try {
      // Prepare content context for the agent
      const contentContext = {
        campaign_name: taskData.campaign_name || funnelData.product_name,
        target_audience: taskData.target_audience || funnelData.target_audience,
        platform: taskData.platform || funnelData.platform,
        tone: taskData.tone || funnelData.tone,
        description: taskData.description || funnelData.description,
        generated_content: execution?.outputs?.find(output => output.type === 'content')?.data?.content || 
                          funnelResult?.content || 
                          currentGeneratedContent,
        recommendations: recommendations
      };

      const response = await fetch(`${API_BASE_URL}/api/marketing-lab/agent-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.message,
          content_context: contentContext,
          chat_history: chatMessages.slice(-10), // Last 10 messages for context
          session_id: `marketing-lab-${Date.now()}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const agentMessage = {
            id: Date.now() + 1,
            type: 'agent',
            message: result.response,
            timestamp: new Date().toLocaleString(),
            agent: result.agent || 'Marketing Assistant'
          };
          setChatMessages(prev => [...prev, agentMessage]);
          
          showNotification(
            '✨ Agent Response',
            'The marketing assistant has provided helpful guidance!',
            'success'
          );
        } else {
          throw new Error(result.error || 'Failed to get agent response');
        }
      } else {
        throw new Error('Agent chat service unavailable');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'agent',
        message: `Sorry, I'm having trouble responding right now: ${error.message}. Please try again.`,
        timestamp: new Date().toLocaleString(),
        agent: 'System'
      };
      setChatMessages(prev => [...prev, errorMessage]);
      
      showNotification({
        type: 'error',
        title: 'Chat Error',
        message: 'Failed to process your request. Please try again.',
        autoClose: true
      });
    } finally {
      setIsChatProcessing(false);
    }
  };



  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const applyChatModification = (modifiedContent) => {
    setCurrentGeneratedContent(modifiedContent);
    
    // Update the appropriate state
    if (execution) {
      setExecution(prev => ({
        ...prev,
        final_output: modifiedContent
      }));
    }
    if (funnelResult) {
      setFunnelResult(prev => ({
        ...prev,
        contentIdea: modifiedContent
      }));
    }

    showNotification({
      type: 'success',
      title: 'Content Applied!',
      message: 'The modified content has been applied to your results.',
      autoClose: true
    });
  };

  const checkSystemHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/marketing-lab/health`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSystemHealth(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to check system health:', error);
    }
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
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              <Bot size={20} />
              AI Content Generator
            </button>
            <button 
              className={`tab-btn ${activeTab === 'funnel' ? 'active' : ''}`}
              onClick={() => setActiveTab('funnel')}
            >
              <TrendingUp size={20} />
              Marketing Funnel Generator
            </button>
          </div>

          {/* Content Generator Tab */}
          {activeTab === 'generator' && (
            <>
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

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Funnel Stage
                      </label>
                      <select
                        className="form-select"
                        value={taskData.funnel_stage}
                        onChange={(e) => setTaskData({...taskData, funnel_stage: e.target.value})}
                      >
                        {Object.entries(FUNNEL_STAGES).map(([key, stage]) => (
                          <option key={key} value={key}>{stage.label}</option>
                        ))}
                      </select>
                      <small className="form-help">
                        {FUNNEL_STAGES[taskData.funnel_stage]?.description}
                      </small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Content Type
                      </label>
                      <select
                        className="form-select"
                        value={taskData.content_type}
                        onChange={(e) => setTaskData({...taskData, content_type: e.target.value})}
                      >
                        {Object.entries(CONTENT_TYPES).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Timeline
                      </label>
                      <select
                        className="form-select"
                        value={taskData.time_option}
                        onChange={(e) => setTaskData({...taskData, time_option: e.target.value})}
                      >
                        {Object.entries(TIME_OPTIONS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      {/* Empty div for spacing */}
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
            </>
          )}

          {/* Marketing Funnel Generator Tab */}
          {activeTab === 'funnel' && (
            <div className="funnel-generator-section">
              <div className="section-header">
                <TrendingUp size={24} />
                <div>
                  <h2>Marketing Funnel Content Generator</h2>
                  <p>Create AI-powered, stage-specific content ideas tailored to your audience and platform. Perfect for building comprehensive marketing funnels.</p>
                </div>
              </div>

              <form className="funnel-form" onSubmit={(e) => { e.preventDefault(); generateFunnelContent(); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Product or Campaign Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={funnelData.product_name}
                      onChange={(e) => setFunnelData({...funnelData, product_name: e.target.value})}
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
                      value={funnelData.target_audience}
                      onChange={(e) => setFunnelData({...funnelData, target_audience: e.target.value})}
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
                    value={funnelData.description}
                    onChange={(e) => setFunnelData({...funnelData, description: e.target.value})}
                    placeholder="Describe your product, service, or campaign features..."
                    rows={3}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Tone of Voice *
                    </label>
                    <select
                      className="form-select"
                      value={funnelData.tone}
                      onChange={(e) => setFunnelData({...funnelData, tone: e.target.value})}
                    >
                      {Object.entries(TONES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Platform *
                    </label>
                    <select
                      className="form-select"
                      value={funnelData.platform}
                      onChange={(e) => setFunnelData({...funnelData, platform: e.target.value})}
                    >
                      {Object.entries(PLATFORMS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Funnel Stage *
                    </label>
                    <select
                      className="form-select"
                      value={funnelData.funnel_stage}
                      onChange={(e) => setFunnelData({...funnelData, funnel_stage: e.target.value})}
                    >
                      {Object.entries(FUNNEL_STAGES).map(([key, stage]) => (
                        <option key={key} value={key}>{stage.label}</option>
                      ))}
                    </select>
                    <div className="form-help-text">
                      <strong>{funnelData.funnel_stage}:</strong> {FUNNEL_STAGES[funnelData.funnel_stage].description}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Content Type *
                    </label>
                    <select
                      className="form-select"
                      value={funnelData.content_type}
                      onChange={(e) => setFunnelData({...funnelData, content_type: e.target.value})}
                    >
                      {Object.entries(CONTENT_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <div className="form-help-text">
                      Generate ideas for {funnelData.content_type.toLowerCase()} content optimized for the {funnelData.funnel_stage.toLowerCase()} stage.
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Time Option *
                  </label>
                  <select
                    className="form-select time-select"
                    value={funnelData.time_option}
                    onChange={(e) => setFunnelData({...funnelData, time_option: e.target.value})}
                  >
                    {Object.entries(TIME_OPTIONS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <div className="form-help-text">
                    {funnelData.time_option === '2 Weeks' 
                      ? 'Quick implementation tactics and immediate actions for rapid results.'
                      : 'Comprehensive strategy with detailed planning and long-term execution steps.'
                    }
                  </div>
                </div>

                <button 
                  type="submit"
                  className="execute-btn funnel-btn"
                  disabled={generatingFunnel}
                >
                  {generatingFunnel ? (
                    <>
                      <RefreshCw className="spinning" size={20} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} />
                      Generate Funnel Content Idea
                    </>
                  )}
                </button>
              </form>

              {/* Funnel Result */}
              {funnelResult && (
                <div className="funnel-result-section">
                  <div className="section-header">
                    <FileText size={24} />
                    <div>
                      <h2>Generated Content Idea</h2>
                      <p>Tailored content strategy for your funnel stage</p>
                    </div>
                  </div>

                  <div className="funnel-result-card">
                    <div className="result-summary">
                      <div className="summary-item">
                        <span className="label">Stage:</span>
                        <span className="value">{funnelResult.stage}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Content Type:</span>
                        <span className="value">{funnelResult.contentType}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Timeline:</span>
                        <span className="value">{funnelResult.timeOption}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Platform:</span>
                        <span className="value">{funnelResult.platform}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Tone:</span>
                        <span className="value">{funnelResult.tone}</span>
                      </div>
                    </div>

                    {funnelResult.stageObjective && (
                      <div className="stage-objective">
                        <h4>🎯 Stage Objective</h4>
                        <p>{funnelResult.stageObjective}</p>
                      </div>
                    )}

                    <div className="result-content">
                      <h3>Content Strategy:</h3>
                      <div className="content-idea">
                        <pre className="funnel-content-text">{funnelResult.contentIdea}</pre>
                      </div>
                    </div>

                    <div className="result-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => copyToClipboard(funnelResult.contentIdea)}
                      >
                        <Copy size={16} />
                        Copy Content Idea
                      </button>
                      <button 
                        className="action-btn secondary"
                        onClick={() => downloadAsText(
                          `${funnelResult.stage}: ${funnelResult.contentType} (${funnelResult.timeOption})\n\nProduct: ${funnelResult.productName}\nAudience: ${funnelResult.targetAudience}\nPlatform: ${funnelResult.platform}\nTone: ${funnelResult.tone}\n\nStage Objective:\n${funnelResult.stageObjective || 'N/A'}\n\nContent Strategy:\n${funnelResult.contentIdea}`,
                          `${funnelResult.productName.replace(/\s+/g, '_')}_${funnelResult.stage.toLowerCase()}_funnel_content.txt`
                        )}
                      >
                        <Download size={16} />
                        Download Strategy
                      </button>
                      <button 
                        className="action-btn chat-btn"
                        onClick={openAgentChat}
                      >
                        <MessageSquare size={16} />
                        Chat with Agent
                      </button>
                      <button 
                        className="action-btn secondary"
                        onClick={generateFunnelContent}
                        disabled={generatingFunnel}
                      >
                        <RefreshCw size={16} />
                        Generate New Idea
                      </button>
                    </div>

                    <div className="result-meta">
                      <small>Generated on {funnelResult.generatedAt}</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
                {Array.isArray(labAgents) && labAgents.map((agent, index) => {
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
                      className="action-btn chat-btn"
                      onClick={openAgentChat}
                    >
                      <MessageSquare size={16} />
                      Chat with Agent
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

              {/* Recommendations Section */}
              {(execution?.final_output || (taskData.platform && taskData.target_audience)) && (
                <div className="recommendations-section">
                  <div className="section-header">
                    <TrendingUp className="section-icon" />
                    <h3>Posting Recommendations</h3>
                    {loadingRecommendations && <div className="loading-spinner"></div>}
                  </div>
                  
                  {recommendations && (
                    <div className="recommendations-content">
                      <div className="rec-summary">
                        <div className="rec-card optimal-timing">
                          <div className="rec-header">
                            <Calendar size={20} />
                            <h4>Optimal Timing</h4>
                          </div>
                          <div className="rec-body">
                            <div className="timing-item">
                              <span className="label">Best Days:</span>
                              {recommendations && recommendations.optimal_posting && Array.isArray(recommendations.optimal_posting.best_days) ? (
                                <span className="value">{recommendations.optimal_posting.best_days.join(', ')}</span>
                              ) : (
                                <span className="value">N/A</span>
                              )}
                            </div>
                            <div className="timing-item">
                              <span className="label">Best Times:</span>
                              {recommendations && recommendations.optimal_posting && Array.isArray(recommendations.optimal_posting.best_times) ? (
                                <span className="value">{recommendations.optimal_posting.best_times.join(' or ')}</span>
                              ) : (
                                <span className="value">N/A</span>
                              )}
                            </div>
                            <div className="timing-item">
                              <span className="label">Frequency:</span>
                              {recommendations && recommendations.optimal_posting && recommendations.optimal_posting.frequency ? (
                                <span className="value">{recommendations.optimal_posting.frequency}</span>
                              ) : (
                                <span className="value">N/A</span>
                              )}
                            </div>
                            <div className="timing-item highlight">
                              <span className="label">Peak Engagement:</span>
                              {recommendations && recommendations.optimal_posting && recommendations.optimal_posting.engagement_peak ? (
                                <span className="value">{recommendations.optimal_posting.engagement_peak}</span>
                              ) : (
                                <span className="value">N/A</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="rec-card performance-metrics">
                          <div className="rec-header">
                            <BarChart3 size={20} />
                            <h4>Performance Insights</h4>
                          </div>
                          <div className="rec-body">
                            <div className="metric-item">
                              <span className="label">Expected Reach:</span>
                              <span className="value">
                                {recommendations && recommendations.performance_insights && typeof recommendations.performance_insights.expected_reach === 'number'
                                  ? recommendations.performance_insights.expected_reach.toLocaleString()
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="metric-item">
                              <span className="label">Engagement Rate:</span>
                              <span className="value">
                                {recommendations && recommendations.performance_insights && recommendations.performance_insights.engagement_rate
                                  ? recommendations.performance_insights.engagement_rate
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="metric-item">
                              <span className="label">Content Types:</span>
                              <div className="content-types">
                                {recommendations && recommendations.performance_insights && Array.isArray(recommendations.performance_insights.best_content_types)
                                  ? recommendations.performance_insights.best_content_types.map((type, index) => (
                                      <span key={index} className="content-type-tag">{type}</span>
                                    ))
                                  : <span className="content-type-tag">N/A</span>
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rec-rationale">
                        <h4>Why These Times?</h4>
                        <p>{recommendations && recommendations.optimal_posting && recommendations.optimal_posting.rationale 
                            ? recommendations.optimal_posting.rationale 
                            : 'No rationale available'}</p>
                      </div>

                      <div className="rec-strategy">
                        <h4>Growth Strategy</h4>
                        <p>{recommendations && recommendations.performance_insights && recommendations.performance_insights.growth_strategy 
                            ? recommendations.performance_insights.growth_strategy 
                            : 'No strategy available'}</p>
                      </div>

                      <div className="rec-confidence">
                        <div className="confidence-score">
                          <span>Confidence Score: </span>
                          <div className="confidence-bar">
                            <div 
                              className="confidence-fill" 
                              style={{ width: `${recommendations && typeof recommendations.confidence_score === 'number' 
                                ? recommendations.confidence_score 
                                : 0}%` }}
                            ></div>
                          </div>
                          <span>{recommendations && typeof recommendations.confidence_score === 'number' 
                            ? recommendations.confidence_score 
                            : 0}%</span>
                        </div>
                        {recommendations && recommendations.confidence_explanation && (
                          <div className="confidence-explanation">
                            <p className="explanation-text">{recommendations.confidence_explanation}</p>
                          </div>
                        )}
                      </div>

                      {recommendations && recommendations.performance_insights && recommendations.performance_insights.caveats && (
                        <div className="rec-caveats">
                          <h4>⚠️ Important Notes</h4>
                          <p className="caveats-text">{recommendations.performance_insights.caveats}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!recommendations && !loadingRecommendations && taskData.platform && taskData.target_audience && (
                    <div className="rec-placeholder">
                      <p>Select platform and target audience to see posting recommendations</p>
                    </div>
                  )}
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
                  <p><strong>Agents:</strong> {Array.isArray(labAgents) ? labAgents.length : 0}</p>
                </div>
              ) : (
                <p>Loading brain info...</p>
              )}
            </div>

            <div className="debug-section">
              <h3>🤖 Agent Details</h3>
              <div className="agents-list">
                {Array.isArray(labAgents) && labAgents.map((agent, index) => (
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

      {/* Agent Chat Modal */}
      {showAgentChat && (
        <div className="agent-chat-overlay">
          <div className="agent-chat-modal">
            <div className="chat-header">
              <div className="chat-title">
                <Bot size={24} />
                <div>
                  <h3>Marketing Agent Assistant</h3>
                  <p>Chat about your generated content</p>
                </div>
              </div>
              <button className="chat-close-btn" onClick={closeAgentChat}>
                <XCircle size={20} />
              </button>
            </div>

            <div className="chat-content">
              <div className="chat-messages">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`chat-message ${message.type}`}>
                    <div className="message-header">
                      <div className="message-avatar">
                        {message.type === 'agent' ? <Bot size={16} /> : <Users size={16} />}
                      </div>
                      <div className="message-info">
                        <span className="message-sender">
                          {message.type === 'agent' ? 'Marketing Agent' : 'You'}
                        </span>
                        <span className="message-time">{message.timestamp}</span>
                      </div>
                    </div>
                    <div className="message-content">
                      <p>{message.message}</p>
                      {message.modifiedContent && (
                        <div className="modified-content-preview">
                          <h5>📝 Modified Content:</h5>
                          <div className="content-preview">
                            <pre>{message.modifiedContent.substring(0, 200)}...</pre>
                            <div className="preview-actions">
                              <button 
                                className="apply-btn"
                                onClick={() => applyChatModification(message.modifiedContent)}
                              >
                                Apply Changes
                              </button>
                              <button 
                                className="copy-btn"
                                onClick={() => copyToClipboard(message.modifiedContent)}
                              >
                                Copy Modified
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isChatProcessing && (
                  <div className="chat-message agent processing">
                    <div className="message-header">
                      <div className="message-avatar">
                        <Bot size={16} />
                      </div>
                      <div className="message-info">
                        <span className="message-sender">Marketing Agent</span>
                        <span className="message-time">Processing...</span>
                      </div>
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <p>Analyzing your request and modifying content...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-input-area">
                <div className="chat-suggestions">
                  <button 
                    className="suggestion-btn"
                    onClick={() => setChatInput("Make it more engaging and add emojis")}
                  >
                    Make it more engaging
                  </button>
                  <button 
                    className="suggestion-btn"
                    onClick={() => setChatInput("Shorten this content to be more concise")}
                  >
                    Make it shorter
                  </button>
                  <button 
                    className="suggestion-btn"
                    onClick={() => setChatInput("Add a stronger call-to-action")}
                  >
                    Stronger CTA
                  </button>
                  <button 
                    className="suggestion-btn"
                    onClick={() => setChatInput("Make the tone more professional")}
                  >
                    More professional
                  </button>
                </div>

                <div className="chat-input-wrapper">
                  <textarea
                    className="chat-input"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Ask me to modify the content... (e.g., 'Make it more casual', 'Add more bullet points', 'Change the tone')"
                    rows={3}
                    disabled={isChatProcessing}
                  />
                  <button 
                    className="chat-send-btn"
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isChatProcessing}
                  >
                    {isChatProcessing ? <RefreshCw className="spinning" size={16} /> : <MessageSquare size={16} />}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      {(execution || funnelResult) && !showAgentChat && (
        <div className="floating-chat-button" onClick={openAgentChat}>
          <Bot size={24} />
          <div className="chat-tooltip">
            <span>Chat with AI Assistant</span>
            <small>Get help with your content</small>
          </div>
        </div>
      )}

      {/* Modern Notification Component */}
      {NotificationComponent}
    </div>
  );
};

export default MarketingLabPage;
