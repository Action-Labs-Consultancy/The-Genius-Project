import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, FileText, Brain, User, Target, TrendingUp } from 'lucide-react';
import { api } from '../config/api';
import './EnhancedClientDetailPage.css';

// AI Agent Components
const ProjectCoordinatorAgent = ({ clientName, userName, onScopeSubmit }) => {
  const [scope, setScope] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (files) => {
    const file = files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleSubmit = () => {
    if (scope.trim() || uploadedFile) {
      onScopeSubmit({
        text: scope,
        file: uploadedFile,
        type: 'scope'
      });
    }
  };

  return (
    <div className="agent-card project-coordinator">
      <div className="agent-header">
        <div className="agent-avatar">
          <User size={24} />
        </div>
        <div className="agent-info">
          <h3>Project Coordinator</h3>
          <p className="agent-message">
            Hi {userName}, tell me your client's scope to help you manage the project.
          </p>
        </div>
      </div>
      
      <div className="agent-input">
        <textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="Describe the project scope in detail..."
          rows={4}
          className="scope-input"
        />
        
        <div 
          className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={32} />
          <p>Drop files here or click to upload</p>
          <input
            type="file"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="file-input"
            accept=".pdf,.doc,.docx,.txt"
          />
          {uploadedFile && (
            <div className="uploaded-file">
              <FileText size={16} />
              <span>{uploadedFile.name}</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={!scope.trim() && !uploadedFile}
          className="submit-btn"
        >
          Submit Scope
        </button>
      </div>
    </div>
  );
};

const ProjectManagerAgent = ({ clientName, userName, onBrandbookSubmit }) => {
  const [hasBrandbook, setHasBrandbook] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = (files) => {
    const file = files[0];
    if (file) {
      setUploadedFile(file);
      onBrandbookSubmit({
        file: file,
        type: 'brandbook'
      });
    }
  };

  const handleNoBrandbook = () => {
    onBrandbookSubmit({
      file: null,
      type: 'brandbook',
      note: 'No brandbook provided'
    });
  };

  return (
    <div className="agent-card project-manager">
      <div className="agent-header">
        <div className="agent-avatar">
          <Brain size={24} />
        </div>
        <div className="agent-info">
          <h3>Project Manager</h3>
          <p className="agent-message">
            Hi {userName}, I'm your Project Manager and I'll help you onboard {clientName}. 
            Does your client have a brandbook?
          </p>
        </div>
      </div>
      
      <div className="agent-input">
        {hasBrandbook === null && (
          <div className="choice-buttons">
            <button 
              onClick={() => setHasBrandbook(true)}
              className="choice-btn yes"
            >
              Yes, they have a brandbook
            </button>
            <button 
              onClick={() => {
                setHasBrandbook(false);
                handleNoBrandbook();
              }}
              className="choice-btn no"
            >
              No brandbook available
            </button>
          </div>
        )}
        
        {hasBrandbook === true && (
          <div className="file-upload-section">
            <label className="file-upload-label">
              <Upload size={20} />
              Upload Brandbook
              <input
                type="file"
                onChange={(e) => handleFileUpload(e.target.files)}
                accept=".pdf,.zip,.rar"
                style={{ display: 'none' }}
              />
            </label>
            {uploadedFile && (
              <div className="uploaded-file">
                <FileText size={16} />
                <span>{uploadedFile.name}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AccountManagerAgent = ({ userName, onAnalysisSubmit }) => {
  const [competitorFile, setCompetitorFile] = useState(null);
  const [swotFile, setSwotFile] = useState(null);

  const handleFileUpload = (type, files) => {
    const file = files[0];
    if (file) {
      if (type === 'competitor') {
        setCompetitorFile(file);
      } else {
        setSwotFile(file);
      }
    }
  };

  const handleSubmit = () => {
    if (competitorFile && swotFile) {
      onAnalysisSubmit({
        competitorAnalysis: competitorFile,
        swotAnalysis: swotFile,
        type: 'strategic_analysis'
      });
    }
  };

  return (
    <div className="agent-card account-manager">
      <div className="agent-header">
        <div className="agent-avatar">
          <Target size={24} />
        </div>
        <div className="agent-info">
          <h3>Account Manager</h3>
          <p className="agent-message">
            Hi {userName}, I'm your Account Manager. I'll support you in this project. 
            Can you upload the Competitor Analysis and SWOT Analysis documents?
          </p>
        </div>
      </div>
      
      <div className="agent-input">
        <div className="analysis-uploads">
          <div className="upload-group">
            <label className="file-upload-label">
              <TrendingUp size={20} />
              Competitor Analysis
              <input
                type="file"
                onChange={(e) => handleFileUpload('competitor', e.target.files)}
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                style={{ display: 'none' }}
              />
            </label>
            {competitorFile && (
              <div className="uploaded-file">
                <FileText size={16} />
                <span>{competitorFile.name}</span>
              </div>
            )}
          </div>
          
          <div className="upload-group">
            <label className="file-upload-label">
              <Target size={20} />
              SWOT Analysis
              <input
                type="file"
                onChange={(e) => handleFileUpload('swot', e.target.files)}
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                style={{ display: 'none' }}
              />
            </label>
            {swotFile && (
              <div className="uploaded-file">
                <FileText size={16} />
                <span>{swotFile.name}</span>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={!competitorFile || !swotFile}
          className="submit-btn"
        >
          Submit Analysis Documents
        </button>
      </div>
    </div>
  );
};

// Knowledge Base Component
const ClientKnowledgeBase = ({ knowledgeBase }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatAnalysisData = (data) => {
    if (typeof data === 'string') {
      return data;
    }
    if (data && typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return 'Analysis pending...';
  };

  return (
    <div className="knowledge-base">
      <div className="knowledge-header">
        <h3>📚 Client Knowledge Base</h3>
        <p>Dynamic repository of all client information and insights</p>
      </div>
      
      <div className="knowledge-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'scope' ? 'active' : ''}`}
          onClick={() => setActiveTab('scope')}
        >
          Project Scope
        </button>
        <button 
          className={`tab ${activeTab === 'brandbook' ? 'active' : ''}`}
          onClick={() => setActiveTab('brandbook')}
        >
          Brand Guidelines
        </button>
        <button 
          className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Strategic Analysis
        </button>
      </div>
      
      <div className="knowledge-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="kb-stats">
              <div className="kb-stat">
                <span className="stat-label">Project Type</span>
                <span className="stat-value">{knowledgeBase.projectType || 'Not specified'}</span>
              </div>
              <div className="kb-stat">
                <span className="stat-label">Contract Type</span>
                <span className="stat-value">{knowledgeBase.contractType || 'Not specified'}</span>
              </div>
              <div className="kb-stat">
                <span className="stat-label">Documents</span>
                <span className="stat-value">{knowledgeBase.documentCount || 0}</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'scope' && (
          <div className="scope-section">
            <h4>Project Scope</h4>
            <div className="scope-content">
              {knowledgeBase.scope ? (
                <div>
                  <p>{knowledgeBase.scope.text}</p>
                  {knowledgeBase.scope.file && (
                    <div className="attached-file">
                      <FileText size={16} />
                      <span>Attached: {knowledgeBase.scope.file.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="placeholder">Project scope will appear here once provided by the Project Coordinator.</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'brandbook' && (
          <div className="brandbook-section">
            <h4>Brand Guidelines</h4>
            <div className="brandbook-content">
              {knowledgeBase.brandbook ? (
                <div>
                  {knowledgeBase.brandbook.file ? (
                    <div className="brandbook-analysis">
                      <div className="attached-file">
                        <FileText size={16} />
                        <span>Brandbook: {knowledgeBase.brandbook.file.name}</span>
                      </div>
                      <div className="ai-analysis">
                        <h5>AI Analysis:</h5>
                        <p>{formatAnalysisData(knowledgeBase.brandbook.analysis)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="no-brandbook">No brandbook provided for this client.</p>
                  )}
                </div>
              ) : (
                <p className="placeholder">Brand guidelines will appear here once processed by the Project Manager.</p>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <h4>Strategic Analysis</h4>
            <div className="analysis-content">
              {knowledgeBase.strategicAnalysis ? (
                <div className="analysis-grid">
                  <div className="analysis-item">
                    <h5>Competitor Analysis</h5>
                    <div className="analysis-data">
                      <div className="attached-file">
                        <FileText size={16} />
                        <span>{knowledgeBase.strategicAnalysis.competitorAnalysis?.name}</span>
                      </div>
                      <div className="ai-insights">
                        <p>{formatAnalysisData(knowledgeBase.strategicAnalysis.competitorInsights)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="analysis-item">
                    <h5>SWOT Analysis</h5>
                    <div className="analysis-data">
                      <div className="attached-file">
                        <FileText size={16} />
                        <span>{knowledgeBase.strategicAnalysis.swotAnalysis?.name}</span>
                      </div>
                      <div className="ai-insights">
                        <p>{formatAnalysisData(knowledgeBase.strategicAnalysis.swotInsights)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="placeholder">Strategic analysis will appear here once processed by the Account Manager.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EnhancedClientDetailPage = ({ user }) => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  // State for client data
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Workflow state
  const [workflowStep, setWorkflowStep] = useState(1);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    projectType: 'Marketing',
    contractType: '',
    contractTypeOther: ''
  });
  
  // Knowledge base state
  const [knowledgeBase, setKnowledgeBase] = useState({
    scope: null,
    brandbook: null,
    strategicAnalysis: null,
    projectType: '',
    contractType: '',
    documentCount: 0
  });

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      const response = await fetch(`${api.BASE_URL}/api/clients/${clientId}`);
      if (response.ok) {
        const clientData = await response.json();
        setClient(clientData);
        
        // Load existing knowledge base if available
        await loadKnowledgeBase();
      }
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const response = await fetch(`${api.BASE_URL}/api/clients/${clientId}/knowledge-base`);
      if (response.ok) {
        const kb = await response.json();
        setKnowledgeBase(kb);
      }
    } catch (error) {
      console.log('No existing knowledge base found');
    }
  };

  const handleClientFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const clientData = {
        ...clientForm,
        contractType: clientForm.contractType === 'Others' ? clientForm.contractTypeOther : clientForm.contractType
      };
      
      const response = await fetch(`${api.BASE_URL}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      
      if (response.ok) {
        const newClient = await response.json();
        setClient(newClient);
        setKnowledgeBase(prev => ({
          ...prev,
          projectType: clientData.projectType,
          contractType: clientData.contractType
        }));
        setShowAddClientForm(false);
        setWorkflowStep(2); // Move to Project Coordinator step
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleScopeSubmit = async (scopeData) => {
    try {
      // Simulate AI processing of scope
      const aiAnalysis = await processWithAI(scopeData, 'scope');
      
      setKnowledgeBase(prev => ({
        ...prev,
        scope: {
          ...scopeData,
          analysis: aiAnalysis
        },
        documentCount: prev.documentCount + (scopeData.file ? 1 : 0)
      }));
      
      setWorkflowStep(3); // Move to Project Manager step
    } catch (error) {
      console.error('Error processing scope:', error);
    }
  };

  const handleBrandbookSubmit = async (brandbookData) => {
    try {
      // Simulate AI processing of brandbook
      const aiAnalysis = brandbookData.file ? await processWithAI(brandbookData, 'brandbook') : null;
      
      setKnowledgeBase(prev => ({
        ...prev,
        brandbook: {
          ...brandbookData,
          analysis: aiAnalysis
        },
        documentCount: prev.documentCount + (brandbookData.file ? 1 : 0)
      }));
      
      setWorkflowStep(4); // Move to Account Manager step
    } catch (error) {
      console.error('Error processing brandbook:', error);
    }
  };

  const handleAnalysisSubmit = async (analysisData) => {
    try {
      // Simulate AI processing of strategic documents
      const competitorInsights = await processWithAI(analysisData.competitorAnalysis, 'competitor');
      const swotInsights = await processWithAI(analysisData.swotAnalysis, 'swot');
      
      setKnowledgeBase(prev => ({
        ...prev,
        strategicAnalysis: {
          ...analysisData,
          competitorInsights,
          swotInsights
        },
        documentCount: prev.documentCount + 2
      }));
      
      setWorkflowStep(5); // Complete workflow
    } catch (error) {
      console.error('Error processing analysis:', error);
    }
  };

  // Simulated AI processing function
  const processWithAI = async (data, type) => {
    // Simulate API call to AI service (would integrate with your Llama/RAG setup)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (type) {
      case 'scope':
        return "AI has analyzed the project scope and identified key deliverables, timeline requirements, and resource needs. The project appears to be well-defined with clear objectives.";
      case 'brandbook':
        return "Brand analysis complete: Modern, minimalist design approach with strong emphasis on sustainability. Primary colors: Blue (#1E40AF), Green (#10B981). Typography: Sans-serif, clean lines. Target audience: Millennials and Gen-Z.";
      case 'competitor':
        return "Competitive landscape analysis reveals 3 major competitors with similar positioning. Key differentiators identified: pricing strategy, customer service, and digital presence. Opportunities for market penetration identified.";
      case 'swot':
        return "SWOT analysis processed: Strengths in brand recognition and customer loyalty. Weaknesses in digital marketing presence. Opportunities in emerging markets. Threats from new market entrants.";
      default:
        return "Analysis complete.";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading client details...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-client-detail-page">
      {/* Header */}
      <div className="page-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/clients')}
        >
          <ArrowLeft size={20} />
          Back to Clients
        </button>
        
        <div className="header-content">
          <div className="client-title">
            <h1>{client ? client.name : 'New Client'}</h1>
            {!client && (
              <button 
                className="add-client-btn"
                onClick={() => setShowAddClientForm(true)}
              >
                <Plus size={20} />
                Add New Client
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Client Form Modal */}
      {showAddClientForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Client</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddClientForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleClientFormSubmit} className="client-form">
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Project Type</label>
                <select
                  value={clientForm.projectType}
                  onChange={(e) => setClientForm(prev => ({ ...prev, projectType: e.target.value }))}
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Development">Development</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Design">Design</option>
                </select>
              </div>
              
              {clientForm.projectType === 'Marketing' && (
                <div className="form-group">
                  <label>Contract Type</label>
                  <select
                    value={clientForm.contractType}
                    onChange={(e) => setClientForm(prev => ({ ...prev, contractType: e.target.value }))}
                  >
                    <option value="">Select Contract Type</option>
                    <option value="Retainer">Retainer</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Video/Photoshoot">Video/Photoshoot</option>
                    <option value="Branding">Branding</option>
                    <option value="Others">Others</option>
                  </select>
                  
                  {clientForm.contractType === 'Others' && (
                    <input
                      type="text"
                      placeholder="Specify contract type"
                      value={clientForm.contractTypeOther}
                      onChange={(e) => setClientForm(prev => ({ ...prev, contractTypeOther: e.target.value }))}
                      required
                    />
                  )}
                </div>
              )}
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddClientForm(false)}>
                  Cancel
                </button>
                <button type="submit">
                  Create Client & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Steps */}
      {client && (
        <div className="workflow-container">
          <div className="workflow-progress">
            <div className={`step ${workflowStep >= 2 ? 'completed' : workflowStep === 2 ? 'active' : ''}`}>
              <span>1</span> Project Coordinator
            </div>
            <div className={`step ${workflowStep >= 3 ? 'completed' : workflowStep === 3 ? 'active' : ''}`}>
              <span>2</span> Project Manager
            </div>
            <div className={`step ${workflowStep >= 4 ? 'completed' : workflowStep === 4 ? 'active' : ''}`}>
              <span>3</span> Account Manager
            </div>
            <div className={`step ${workflowStep >= 5 ? 'completed' : ''}`}>
              <span>4</span> Knowledge Base
            </div>
          </div>
          
          <div className="workflow-content">
            {workflowStep === 2 && (
              <ProjectCoordinatorAgent
                clientName={client.name}
                userName={user.full_name || 'User'}
                onScopeSubmit={handleScopeSubmit}
              />
            )}
            
            {workflowStep === 3 && (
              <ProjectManagerAgent
                clientName={client.name}
                userName={user.full_name || 'User'}
                onBrandbookSubmit={handleBrandbookSubmit}
              />
            )}
            
            {workflowStep === 4 && (
              <AccountManagerAgent
                userName={user.full_name || 'User'}
                onAnalysisSubmit={handleAnalysisSubmit}
              />
            )}
          </div>
        </div>
      )}

      {/* Knowledge Base */}
      {client && workflowStep >= 2 && (
        <ClientKnowledgeBase knowledgeBase={knowledgeBase} />
      )}
    </div>
  );
};

export default EnhancedClientDetailPage;
