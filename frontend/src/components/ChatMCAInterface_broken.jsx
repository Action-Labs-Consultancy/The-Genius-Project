// ChatMCAInterface.jsx - Main chat component for MCA workflow
import React, { useState, useEffect, useRef } from 'react';
import './ChatMCAInterface.css';

const ChatMCAInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableBrains, setAvailableBrains] = useState([]);
  const messagesEndRef = useRef(null);

  // API Configuration
  const API_BASE = 'http://localhost:10000';

  // Load available brains on component mount
  useEffect(() => {
    fetchAvailableBrains();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAvailableBrains = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/brains`);
      const data = await response.json();
      if (data.success) {
        setAvailableBrains(data.data);
        // Auto-select first brain if available
        if (data.data.length > 0) {
          setSelectedBrain(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch brains:', error);
      addMessage('System', '❌ Failed to load available brains', { type: 'error' });
    }
  };

  const addMessage = (sender, content, metadata = {}) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      sender,
      content,
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    if (!selectedBrain) {
      addMessage('System', '⚠️ Please select a brain first', { type: 'warning' });
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    addMessage('User', userMessage);
    
    // Start MCA workflow
    await processMCAWorkflow(userMessage);
  };

  const processMCAWorkflow = async (userRequest) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Test MCA system
      addMessage('System', `🔄 Testing MCA system for ${selectedBrain.name}...`);
      
      const testResponse = await fetch(`${API_BASE}/api/brains/${selectedBrain._id}/mca/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!testResponse.ok) {
        throw new Error(`MCA test failed: ${testResponse.status}`);
      }

      const testResult = await testResponse.json();
      addMessage('System', '✅ MCA system ready. Processing your request...');

      // Step 2: Process the actual request
      const processResponse = await fetch(`${API_BASE}/api/brains/${selectedBrain._id}/mca/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: userRequest,
          user_requirements: { 
            quality_threshold: 0.8,
            max_iterations: 3,
            content_type: 'marketing'
          }
        })
      });

      if (!processResponse.ok) {
        throw new Error(`MCA processing failed: ${processResponse.status}`);
      }

      const result = await processResponse.json();
      
      if (result.success && result.data) {
        // Display the MCA workflow steps
        if (result.data.workflow_steps) {
          for (const step of result.data.workflow_steps) {
            await new Promise(resolve => setTimeout(resolve, 1200)); // Realistic delay
            
            const stepType = step.role || step.agent_type || 'system';
            const icon = getStepIcon(stepType);
            
            addMessage(
              `${icon} ${stepType.charAt(0).toUpperCase() + stepType.slice(1)}`,
              step.content || step.output || step.message,
              {
                type: stepType.toLowerCase(),
                step: step.step_name || step.action,
                qualityScore: step.quality_score,
                metadata: step.metadata || {},
                iteration: step.iteration || 1
              }
            );
          }
        }

        // Display final approved content
        if (result.data.final_content) {
          addMessage('🎉 Final Result', result.data.final_content, {
            type: 'final',
            qualityScore: result.data.final_quality_score,
            approved: result.data.approved,
            totalIterations: result.data.total_iterations
          });
        }

        // Show analytics if available
        if (result.data.analytics) {
          addMessage('📊 Analytics', `Quality Score: ${result.data.analytics.final_score}\nTotal Time: ${result.data.analytics.processing_time}ms`, {
            type: 'analytics',
            data: result.data.analytics
          });
        }

      } else {
        throw new Error(result.message || 'MCA processing failed');
      }

    } catch (error) {
      console.error('MCA workflow error:', error);
      addMessage('System', `❌ API Error: ${error.message}`, { type: 'error' });
      
      // Fallback to simulation
      addMessage('System', '🔄 Falling back to demo mode...');
      await fallbackMCASimulation(userRequest);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (stepType) => {
    const icons = {
      maker: '🎨',
      checker: '🔍', 
      approver: '✅',
      system: '⚙️',
      agent: '🤖',
      final: '🎉'
    };
    return icons[stepType.toLowerCase()] || '📝';
  };

  const fallbackMCASimulation = async (userRequest) => {
    // Original simulation as fallback when API is unavailable
    const bestAgent = selectedAgent || await selectBestAgent(userRequest);
    if (bestAgent) {
      addMessage('System', `🎯 Demo Agent: ${bestAgent.name}`);
    }
    await simulateMCASteps(userRequest, bestAgent);
  };
  };

  const selectBestAgent = async (request) => {
    // In real implementation, this would call your agent selection API
    // For now, simulate based on keywords
    const mockAgents = [
      { id: '1', name: 'Landing Page Specialist', keywords: ['landing', 'page', 'website'] },
      { id: '2', name: 'Email Marketing Expert', keywords: ['email', 'subject', 'newsletter'] },
      { id: '3', name: 'Social Media Strategist', keywords: ['social', 'post', 'twitter', 'linkedin'] }
    ];

    const lowerRequest = request.toLowerCase();
    const matchedAgent = mockAgents.find(agent => 
      agent.keywords.some(keyword => lowerRequest.includes(keyword))
    );

    return matchedAgent || mockAgents[0];
  };

  const simulateMCASteps = async (request, agent) => {
    // Maker Step
    await new Promise(resolve => setTimeout(resolve, 2000));
    const makerContent = generateMakerContent(request);
    addMessage('Maker', `I've created your initial content:\n\n${makerContent}`, {
      type: 'maker',
      step: 'generation',
      qualityScore: 0.75
    });

    // Checker Step
    await new Promise(resolve => setTimeout(resolve, 1500));
    const checkerFeedback = "Quality review complete. Strong foundation but could improve headline impact and add social proof.";
    addMessage('Checker', checkerFeedback, {
      type: 'checker', 
      step: 'review',
      qualityScore: 0.85,
      suggestions: ['headline', 'social_proof', 'cta']
    });

    // Maker Revision
    await new Promise(resolve => setTimeout(resolve, 2000));
    const revisedContent = generateRevisedContent(makerContent);
    addMessage('Maker', `I've revised the content based on feedback:\n\n${revisedContent}`, {
      type: 'maker',
      step: 'revision', 
      qualityScore: 0.92
    });

    // Approver Decision
    await new Promise(resolve => setTimeout(resolve, 1000));
    addMessage('Approver', '✅ Content approved! Quality meets standards and brand guidelines.', {
      type: 'approver',
      step: 'approval',
      decision: 'approved',
      finalQuality: 0.92
    });

    // Final Result
    addMessage('Final Result', revisedContent, {
      type: 'final',
      step: 'complete',
      iterations: 2,
      finalScore: 0.92
    });

    // Next actions
    await new Promise(resolve => setTimeout(resolve, 500));
    addMessage('System', '✨ Content ready! Would you like to request revisions, try a different agent, or create another piece?', {
      type: 'system',
      actions: ['revise', 'switch_agent', 'new_content', 'export']
    });
  };

  const generateMakerContent = (request) => {
    if (request.toLowerCase().includes('landing')) {
      return `🚀 Transform Your Business with AI Automation

Stop wasting time on repetitive tasks. Our AI solutions automate processes and boost efficiency.

✅ 50% reduction in manual work
✅ 24/7 automated support
✅ Data-driven insights
✅ Scalable solutions

[Get Started Today]`;
    }
    return `Generated content for: ${request}\n\nCompelling marketing copy tailored to your needs...`;
  };

  const generateRevisedContent = (original) => {
    return `🚀 Join 200+ Companies Transforming Business with AI

Stop wasting time on repetitive tasks that drain productivity. Our proven AI solutions automate processes and boost efficiency.

✅ 50% reduction in manual work (avg. client result)
✅ 24/7 automated customer support  
✅ Data-driven insights for better decisions
✅ Scalable solutions that grow with you

"We saved 15 hours weekly and increased efficiency 60%" - Sarah M., CEO

[Start Free 30-Day Trial] [Book Strategy Call]`;
  };

  const MessageComponent = ({ message }) => {
    const getMessageStyle = () => {
      switch (message.sender) {
        case 'User': return 'user-message';
        case 'Maker': return 'maker-message';
        case 'Checker': return 'checker-message'; 
        case 'Approver': return 'approver-message';
        case 'Final Result': return 'final-message';
        default: return 'system-message';
      }
    };

    const getIcon = () => {
      switch (message.sender) {
        case 'User': return '👤';
        case 'Maker': return '✍️';
        case 'Checker': return '🔍'; 
        case 'Approver': return '✅';
        case 'Final Result': return '🎯';
        default: return '🤖';
      }
    };

    return (
      <div className={`message ${getMessageStyle()}`}>
        <div className="message-header">
          <span className="message-icon">{getIcon()}</span>
          <span className="message-sender">{message.sender}</span>
          <span className="message-time">{message.timestamp}</span>
        </div>
        <div className="message-content">
          {message.content}
        </div>
        {message.metadata.qualityScore && (
          <div className="message-metadata">
            📊 Quality Score: {message.metadata.qualityScore}
          </div>
        )}
        {message.metadata.actions && (
          <div className="message-actions">
            {message.metadata.actions.map(action => (
              <button key={action} className="action-button">
                {action.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-mca-interface">
      <div className="chat-header">
        <h2>🧠 AI Marketing Content Assistant</h2>
        <div className="brain-selector">
          <select 
            value={selectedBrain?._id || ''} 
            onChange={(e) => {
              const brain = availableBrains.find(b => b._id === e.target.value);
              setSelectedBrain(brain);
            }}
          >
            <option value="">Select Brain...</option>
            {availableBrains.map(brain => (
              <option key={brain._id} value={brain._id}>
                {brain.name} ({brain.agent_count} agents)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>👋 Welcome to MCA Content Creation!</h3>
            <p>Send a content request and watch the Maker-Checker-Approver workflow in action.</p>
            <div className="example-requests">
              <p>Try these examples:</p>
              <button onClick={() => setInputValue("Write me a landing page intro for our AI service")}>
                Landing page intro
              </button>
              <button onClick={() => setInputValue("Create an email subject line for our automation tool")}>
                Email subject line  
              </button>
              <button onClick={() => setInputValue("Write a LinkedIn post about AI benefits")}>
                LinkedIn post
              </button>
            </div>
          </div>
        )}
        
        {messages.map(message => (
          <MessageComponent key={message.id} message={message} />
        ))}
        
        {isProcessing && (
          <div className="processing-indicator">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            Processing MCA workflow...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Describe the content you need (e.g., 'Write a landing page for our AI service')..."
          disabled={isProcessing || !selectedBrain}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isProcessing || !selectedBrain || !inputValue.trim()}
        >
          {isProcessing ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
};

export default ChatMCAInterface;
