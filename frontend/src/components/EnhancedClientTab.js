import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, FileText, CheckCircle, AlertCircle, Brain, User, ChevronRight, Trash2, Download } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import './EnhancedClientTab.css';

// AI Agent avatars/icons
const AgentIcons = {
  ProjectCoordinator: () => <div className="agent-avatar coordinator">👨‍💼</div>,
  ProjectManager: () => <div className="agent-avatar manager">👩‍💻</div>,
  AccountManager: () => <div className="agent-avatar account">👨‍💼</div>
};

const EnhancedClientTab = ({ user, onNavigate }) => {
  // Main state
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeClient, setActiveClient] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Client Form
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({
    client_name: '',
    project_type: 'Marketing',
    contract_type: '',
    contract_specify: ''
  });
  
  // Step 2: Project Coordinator 
  const [scopeMethod, setScopeMethod] = useState(''); // 'upload' or 'text'
  const [scopeText, setScopeText] = useState('');
  const [scopeFiles, setScopeFiles] = useState([]);
  
  // Step 3: Project Manager
  const [hasBrandbook, setHasBrandbook] = useState(null);
  const [brandbookFiles, setBrandbookFiles] = useState([]);
  
  // Step 4: Account Manager
  const [competitorFiles, setCompetitorFiles] = useState([]);
  const [swotFiles, setSwotFiles] = useState([]);
  
  // Knowledge Base
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  
  // Agent states
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentMessages, setAgentMessages] = useState([]);

  // File upload ref
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/clients`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Handle client form submission
  const handleClientFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const clientData = {
        name: clientForm.client_name,
        project_type: clientForm.project_type,
        contract_type: clientForm.contract_type,
        contract_specify: clientForm.contract_specify,
        created_by: user?.id
      };

      const response = await fetch(`${API_BASE_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });

      if (response.ok) {
        const newClient = await response.json();
        setClients(prev => [...prev, newClient]);
        setActiveClient(newClient);
        setShowClientForm(false);
        
        // Initialize knowledge base
        await initializeKnowledgeBase(newClient.id);
        
        // Move to Step 2 and activate Project Coordinator
        setCurrentStep(2);
        setActiveAgent('ProjectCoordinator');
        addAgentMessage('ProjectCoordinator', `Hi ${user?.name || 'there'}, tell me your client's scope to help you manage the project.`);
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error creating client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeKnowledgeBase = async (clientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/knowledge-base`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ initialized: true })
      });
      
      if (response.ok) {
        const kb = await response.json();
        setKnowledgeBase([kb]);
      }
    } catch (error) {
      console.error('Error initializing knowledge base:', error);
    }
  };

  // Step 2: Handle scope submission
  const handleScopeSubmit = async () => {
    if (!scopeText && scopeFiles.length === 0) {
      alert('Please provide scope information either by text or file upload.');
      return;
    }

    try {
      setProcessingFiles(true);
      
      // Process scope with AI
      const scopeData = {
        client_id: activeClient.id,
        method: scopeMethod,
        text_content: scopeText,
        files: scopeFiles
      };

      const response = await fetch(`${API_BASE_URL}/api/ai/process-scope`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scopeData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update knowledge base
        updateKnowledgeBase('scope_analysis', result.analysis);
        
        // Move to Step 3
        setCurrentStep(3);
        setActiveAgent('ProjectManager');
        addAgentMessage('ProjectManager', `Hi ${user?.name || 'there'}, I'm your Project Manager and I'll help you onboard ${activeClient.name}. Does your client have a brandbook?`);
      }
    } catch (error) {
      console.error('Error processing scope:', error);
      alert('Error processing scope. Please try again.');
    } finally {
      setProcessingFiles(false);
    }
  };

  // Step 3: Handle brandbook submission
  const handleBrandbookSubmit = async (hasBrand) => {
    setHasBrandbook(hasBrand);
    
    if (hasBrand && brandbookFiles.length === 0) {
      return; // Wait for file upload
    }

    try {
      setProcessingFiles(true);
      
      const brandbookData = {
        client_id: activeClient.id,
        has_brandbook: hasBrand,
        files: hasBrand ? brandbookFiles : []
      };

      const response = await fetch(`${API_BASE_URL}/api/ai/process-brandbook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(brandbookData)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (hasBrand) {
          updateKnowledgeBase('brandbook_analysis', result.analysis);
        } else {
          updateKnowledgeBase('brandbook_status', 'No brandbook provided');
        }
        
        // Move to Step 4
        setCurrentStep(4);
        setActiveAgent('AccountManager');
        addAgentMessage('AccountManager', `Hi ${user?.name || 'there'}, I'm your Account Manager. I'll support you in this project. Can you upload the Competitor Analysis and SWOT Analysis documents?`);
      }
    } catch (error) {
      console.error('Error processing brandbook:', error);
      alert('Error processing brandbook. Please try again.');
    } finally {
      setProcessingFiles(false);
    }
  };

  // Step 4: Handle strategic documents submission
  const handleStrategicDocsSubmit = async () => {
    if (competitorFiles.length === 0 && swotFiles.length === 0) {
      alert('Please upload at least one strategic document.');
      return;
    }

    try {
      setProcessingFiles(true);
      
      const strategicData = {
        client_id: activeClient.id,
        competitor_files: competitorFiles,
        swot_files: swotFiles
      };

      const response = await fetch(`${API_BASE_URL}/api/ai/process-strategic-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(strategicData)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.competitor_analysis) {
          updateKnowledgeBase('competitor_analysis', result.competitor_analysis);
        }
        
        if (result.swot_analysis) {
          updateKnowledgeBase('swot_analysis', result.swot_analysis);
        }
        
        // Complete the workflow
        setCurrentStep(5);
        setActiveAgent(null);
        addAgentMessage('system', 'Client onboarding complete! All information has been processed and added to the Knowledge Base.');
      }
    } catch (error) {
      console.error('Error processing strategic documents:', error);
      alert('Error processing documents. Please try again.');
    } finally {
      setProcessingFiles(false);
    }
  };

  const updateKnowledgeBase = (type, content) => {
    const newEntry = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date().toISOString(),
      client_id: activeClient.id
    };
    
    setKnowledgeBase(prev => [...prev, newEntry]);
  };

  const addAgentMessage = (agent, message) => {
    const newMessage = {
      id: Date.now(),
      agent,
      message,
      timestamp: new Date().toISOString()
    };
    
    setAgentMessages(prev => [...prev, newMessage]);
  };

  // File handling utilities
  const handleFileUpload = async (files, type) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('type', type);
    formData.append('client_id', activeClient.id);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/client-documents`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return result.files;
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
    return [];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, type) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const uploadedFiles = await handleFileUpload(files, type);
    
    switch (type) {
      case 'scope':
        setScopeFiles(prev => [...prev, ...uploadedFiles]);
        break;
      case 'brandbook':
        setBrandbookFiles(prev => [...prev, ...uploadedFiles]);
        break;
      case 'competitor':
        setCompetitorFiles(prev => [...prev, ...uploadedFiles]);
        break;
      case 'swot':
        setSwotFiles(prev => [...prev, ...uploadedFiles]);
        break;
    }
  };

  return (
    <div className="enhanced-client-tab">
      <div className="client-header">
        <h1>Client Management</h1>
        <button 
          className="add-client-btn"
          onClick={() => setShowClientForm(true)}
        >
          <Plus size={20} />
          Add New Client
        </button>
      </div>

      {/* Client List */}
      {!activeClient && (
        <div className="clients-grid">
          {clients.map(client => (
            <div 
              key={client.id} 
              className="client-card"
              onClick={() => setActiveClient(client)}
            >
              <div className="client-info">
                <h3>{client.name}</h3>
                <p className="project-type">{client.project_type}</p>
                <p className="contract-type">{client.contract_type}</p>
              </div>
              <ChevronRight size={20} />
            </div>
          ))}
        </div>
      )}

      {/* Client Form Modal */}
      {showClientForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Client</h2>
              <button onClick={() => setShowClientForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleClientFormSubmit} className="client-form">
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  value={clientForm.client_name}
                  onChange={(e) => setClientForm({...clientForm, client_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Project Type *</label>
                <select
                  value={clientForm.project_type}
                  onChange={(e) => setClientForm({...clientForm, project_type: e.target.value})}
                  required
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Development">Development</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Design">Design</option>
                </select>
              </div>
              
              {clientForm.project_type === 'Marketing' && (
                <div className="form-group">
                  <label>Contract Type *</label>
                  <select
                    value={clientForm.contract_type}
                    onChange={(e) => setClientForm({...clientForm, contract_type: e.target.value})}
                    required
                  >
                    <option value="">Select Contract Type</option>
                    <option value="Retainer">Retainer</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Video/Photoshoot">Video/Photoshoot</option>
                    <option value="Branding">Branding</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}
              
              {clientForm.contract_type === 'Others' && (
                <div className="form-group">
                  <label>Specify Contract Type *</label>
                  <input
                    type="text"
                    value={clientForm.contract_specify}
                    onChange={(e) => setClientForm({...clientForm, contract_specify: e.target.value})}
                    placeholder="Please specify the contract type"
                    required
                  />
                </div>
              )}
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowClientForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Client Workflow */}
      {activeClient && (
        <div className="client-workflow">
          <div className="workflow-header">
            <button onClick={() => setActiveClient(null)}>← Back to Clients</button>
            <h2>{activeClient.name} - Onboarding Workflow</h2>
          </div>
          
          {/* Progress Indicator */}
          <div className="progress-steps">
            {[1, 2, 3, 4, 5].map(step => (
              <div key={step} className={`step ${currentStep >= step ? 'completed' : ''}`}>
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Client Created'}
                  {step === 2 && 'Scope Definition'}
                  {step === 3 && 'Brandbook Review'}
                  {step === 4 && 'Strategic Analysis'}
                  {step === 5 && 'Complete'}
                </div>
              </div>
            ))}
          </div>

          {/* Agent Messages */}
          <div className="agent-messages">
            {agentMessages.map(msg => (
              <div key={msg.id} className={`agent-message ${msg.agent}`}>
                {msg.agent !== 'system' && (
                  <div className="agent-header">
                    {msg.agent === 'ProjectCoordinator' && <AgentIcons.ProjectCoordinator />}
                    {msg.agent === 'ProjectManager' && <AgentIcons.ProjectManager />}
                    {msg.agent === 'AccountManager' && <AgentIcons.AccountManager />}
                    <span className="agent-name">{msg.agent.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                )}
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
          </div>

          {/* Step 2: Project Coordinator */}
          {currentStep === 2 && activeAgent === 'ProjectCoordinator' && (
            <div className="workflow-step scope-step">
              <h3>Define Project Scope</h3>
              
              <div className="scope-options">
                <button 
                  className={`option-btn ${scopeMethod === 'upload' ? 'active' : ''}`}
                  onClick={() => setScopeMethod('upload')}
                >
                  <Upload size={20} />
                  Upload Document
                </button>
                <button 
                  className={`option-btn ${scopeMethod === 'text' ? 'active' : ''}`}
                  onClick={() => setScopeMethod('text')}
                >
                  <FileText size={20} />
                  Write Scope
                </button>
              </div>

              {scopeMethod === 'upload' && (
                <div 
                  className="drop-zone"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'scope')}
                >
                  <Upload size={40} />
                  <p>Drag & drop scope documents here or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFileUpload(e.target.files, 'scope')}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <button onClick={() => fileInputRef.current?.click()}>
                    Browse Files
                  </button>
                </div>
              )}

              {scopeMethod === 'text' && (
                <div className="text-input-area">
                  <textarea
                    value={scopeText}
                    onChange={(e) => setScopeText(e.target.value)}
                    placeholder="Describe the project scope, objectives, deliverables, timeline, and any specific requirements..."
                    rows={8}
                  />
                </div>
              )}

              {scopeFiles.length > 0 && (
                <div className="uploaded-files">
                  <h4>Uploaded Files:</h4>
                  {scopeFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <FileText size={16} />
                      <span>{file.name}</span>
                      <button onClick={() => setScopeFiles(prev => prev.filter((_, i) => i !== index))}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                className="continue-btn"
                onClick={handleScopeSubmit}
                disabled={processingFiles || (!scopeText && scopeFiles.length === 0)}
              >
                {processingFiles ? 'Processing...' : 'Continue to Brandbook Review'}
              </button>
            </div>
          )}

          {/* Step 3: Project Manager */}
          {currentStep === 3 && activeAgent === 'ProjectManager' && (
            <div className="workflow-step brandbook-step">
              <h3>Brandbook Assessment</h3>
              
              <div className="brandbook-options">
                <button 
                  className={`option-btn ${hasBrandbook === true ? 'active' : ''}`}
                  onClick={() => handleBrandbookSubmit(true)}
                >
                  <CheckCircle size={20} />
                  Yes, we have a brandbook
                </button>
                <button 
                  className={`option-btn ${hasBrandbook === false ? 'active' : ''}`}
                  onClick={() => handleBrandbookSubmit(false)}
                >
                  <AlertCircle size={20} />
                  No brandbook available
                </button>
              </div>

              {hasBrandbook === true && (
                <div 
                  className="drop-zone"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'brandbook')}
                >
                  <Upload size={40} />
                  <p>Upload brandbook documents</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e.target.files, 'brandbook')}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <button onClick={() => fileInputRef.current?.click()}>
                    Browse Files
                  </button>
                </div>
              )}

              {brandbookFiles.length > 0 && (
                <button 
                  className="continue-btn"
                  onClick={() => handleBrandbookSubmit(true)}
                  disabled={processingFiles}
                >
                  {processingFiles ? 'Processing...' : 'Continue to Strategic Analysis'}
                </button>
              )}
            </div>
          )}

          {/* Step 4: Account Manager */}
          {currentStep === 4 && activeAgent === 'AccountManager' && (
            <div className="workflow-step strategic-step">
              <h3>Strategic Documents Upload</h3>
              
              <div className="upload-sections">
                <div className="upload-section">
                  <h4>Competitor Analysis</h4>
                  <div 
                    className="drop-zone"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'competitor')}
                  >
                    <Upload size={30} />
                    <p>Upload competitor analysis documents</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                      onChange={(e) => handleFileUpload(e.target.files, 'competitor')}
                      style={{ display: 'none' }}
                    />
                    <button onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </button>
                  </div>
                </div>

                <div className="upload-section">
                  <h4>SWOT Analysis</h4>
                  <div 
                    className="drop-zone"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'swot')}
                  >
                    <Upload size={30} />
                    <p>Upload SWOT analysis documents</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.xls"
                      onChange={(e) => handleFileUpload(e.target.files, 'swot')}
                      style={{ display: 'none' }}
                    />
                    <button onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </button>
                  </div>
                </div>
              </div>

              <button 
                className="continue-btn"
                onClick={handleStrategicDocsSubmit}
                disabled={processingFiles || (competitorFiles.length === 0 && swotFiles.length === 0)}
              >
                {processingFiles ? 'Processing...' : 'Complete Onboarding'}
              </button>
            </div>
          )}

          {/* Knowledge Base */}
          {knowledgeBase.length > 0 && (
            <div className="knowledge-base">
              <h3>
                <Brain size={20} />
                Client Knowledge Base
              </h3>
              
              <div className="knowledge-entries">
                {knowledgeBase.map(entry => (
                  <div key={entry.id} className="knowledge-entry">
                    <div className="entry-header">
                      <span className="entry-type">{entry.type.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="entry-timestamp">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="entry-content">
                      {typeof entry.content === 'object' ? 
                        JSON.stringify(entry.content, null, 2) : 
                        entry.content
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedClientTab;
