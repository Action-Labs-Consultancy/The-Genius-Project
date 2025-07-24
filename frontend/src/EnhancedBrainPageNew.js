import React, { useState, useEffect } from 'react';
import './styles.css';
import { API_BASE_URL } from './config/api';

const EnhancedBrainPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [brains, setBrains] = useState([]);
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Brain creation modal state
  const [showCreateBrain, setShowCreateBrain] = useState(false);
  const [newBrain, setNewBrain] = useState({
    name: '',
    description: '',
    brain_prompt: 'You are a helpful AI assistant. Provide accurate, concise, and helpful responses based on the knowledge base and context provided.'
  });

  // Document upload state
  const [dragOver, setDragOver] = useState(false);
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    brain_prompt: ''
  });

  // Show notification with auto-dismiss
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load brains on component mount
  useEffect(() => {
    loadBrains();
  }, []);

  // Load brain data when selected
  useEffect(() => {
    if (selectedBrain) {
      setActiveTab('knowledge'); // Default to knowledge tab when a brain is selected
      loadDocuments();
      // Initialize settings form with selected brain data
      setSettingsForm({
        name: selectedBrain.name || '',
        description: selectedBrain.description || '',
        brain_prompt: selectedBrain.brain_prompt || ''
      });
    }
  }, [selectedBrain]);

  const loadBrains = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains`);
      if (response.ok) {
        const data = await response.json();
        setBrains(data.brains || []);
        if (data.brains && data.brains.length > 0 && !selectedBrain) {
          setSelectedBrain(data.brains[0]);
        }
      }
    } catch (error) {
      console.error('Error loading brains:', error);
      showNotification('Error connecting to brain system', 'error');
    }
  };

  const loadDocuments = async () => {
    if (!selectedBrain) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains/${selectedBrain.id}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const createBrain = async () => {
    if (!newBrain.name.trim()) {
      showNotification('Brain name is required', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBrain)
      });
      
      if (response.ok) {
        const data = await response.json();
        setBrains([...brains, data.brain]);
        setNewBrain({ 
          name: '', 
          description: '', 
          brain_prompt: 'You are a helpful AI assistant. Provide accurate, concise, and helpful responses based on the knowledge base and context provided.'
        });
        setShowCreateBrain(false);
        showNotification('Brain created successfully!', 'success');
      } else {
        showNotification('Error creating brain', 'error');
      }
    } catch (error) {
      showNotification('Error creating brain: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file) => {
    if (!selectedBrain) {
      showNotification('Please select a brain first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains/${selectedBrain.id}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        loadDocuments(); // Reload documents after upload
        showNotification(`Document "${file.name}" uploaded successfully!`, 'success');
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Error uploading document', 'error');
      }
    } catch (error) {
      showNotification('Error uploading document: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type === 'application/pdf' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'text/plain' ||
          file.type === 'text/markdown' ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.txt')) {
        uploadDocument(file);
      } else {
        showNotification(`File type not supported: ${file.name}`, 'error');
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadDocuments(); // Reload documents after deletion
        showNotification('Document deleted successfully', 'success');
      } else {
        showNotification('Error deleting document', 'error');
      }
    } catch (error) {
      showNotification('Error deleting document: ' + error.message, 'error');
    }
  };

  const deleteBrain = async (brainId) => {
    if (!window.confirm('Are you sure you want to delete this brain? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains/${brainId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setBrains(brains.filter(brain => brain.id !== brainId));
        if (selectedBrain?.id === brainId) {
          setSelectedBrain(null);
          setDocuments([]);
        }
        showNotification('Brain deleted successfully', 'success');
      } else {
        showNotification('Error deleting brain', 'error');
      }
    } catch (error) {
      showNotification('Error deleting brain: ' + error.message, 'error');
    }
  };

  const saveBrainSettings = async (updatedBrain) => {
    if (!selectedBrain) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/brains/${selectedBrain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBrain)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the selected brain and brains list
        setSelectedBrain({ ...selectedBrain, ...updatedBrain });
        setBrains(brains.map(brain => 
          brain.id === selectedBrain.id ? { ...brain, ...updatedBrain } : brain
        ));
        showNotification('Brain settings saved successfully!', 'success');
      } else {
        showNotification('Error saving brain settings', 'error');
      }
    } catch (error) {
      showNotification('Error saving brain settings: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      showNotification('Chat history cleared', 'success');
    }
  };

  const renderDashboard = () => (
    <div className="brain-dashboard-modern">
      <div className="dashboard-header-modern">
        <div className="header-content">
          <h1><i className="fas fa-brain"></i> AI Brains</h1>
          <p>Manage your AI assistants and knowledge bases</p>
        </div>
        <button className="btn-create-brain" onClick={() => setShowCreateBrain(true)}>
          <i className="fas fa-plus"></i>
          <span>New Brain</span>
        </button>
      </div>
      
      <div className="brain-grid-modern">
        {brains && brains.length > 0 ? brains.map((brain, index) => (
          <div 
            key={brain.id || brain._id || index} 
            className={`brain-card-modern ${selectedBrain?.id === brain.id || selectedBrain?._id === brain._id ? 'selected' : ''}`}
            onClick={() => setSelectedBrain(brain)}
          >
            <div className="brain-card-header">
              <div className="brain-icon-modern">
                <i className="fas fa-brain"></i>
              </div>
              <button 
                className="brain-delete-modern" 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBrain(brain.id || brain._id);
                }}
                title="Delete brain"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
            <div className="brain-card-content">
              <h3>{brain.name}</h3>
              <p>{brain.description || 'No description available'}</p>
              <div className="brain-stats">
                <span><i className="fas fa-file-alt"></i> {brain.document_count || 0}</span>
                <span><i className="fas fa-calendar"></i> {new Date(brain.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="no-brains-message">
            <i className="fas fa-brain"></i>
            <h3>No Brains Created</h3>
            <p>Create your first AI brain to get started</p>
          </div>
        )}
        
        <div className="brain-card-modern create-new-modern" onClick={() => setShowCreateBrain(true)}>
          <div className="create-brain-content">
            <div className="create-brain-icon">
              <i className="fas fa-plus"></i>
            </div>
            <h3>Create Brain</h3>
            <p>Build a new AI assistant</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrainInterface = () => (
    <div className="brain-interface-modern">
      {/* Modern Brain Header */}
      <div className="brain-header-modern">
        <button className="back-btn-modern" onClick={() => setSelectedBrain(null)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="brain-info-modern">
          <div className="brain-icon-large">
            <i className="fas fa-brain"></i>
          </div>
          <div>
            <h2>{selectedBrain.name}</h2>
            <p>{selectedBrain.description || 'No description available'}</p>
          </div>
        </div>
        <div className="brain-actions-modern">
          <button className="btn-settings" onClick={() => setActiveTab('settings')}>
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>

      {/* Modern Navigation */}
      <div className="brain-nav-modern">
        {[
          { id: 'knowledge', label: 'Knowledge Base', icon: 'database' },
          { id: 'settings', label: 'Settings', icon: 'cog' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-tab-modern ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fas fa-${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Modern Content */}
      <div className="brain-content-modern">
        {activeTab === 'knowledge' && renderDocuments()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="documents-manager-modern">
      {!selectedBrain ? (
        <div className="no-brain-selected">
          <i className="fas fa-brain"></i>
          <h3>Select a Brain First</h3>
          <p>Choose a brain to manage its knowledge base</p>
        </div>
      ) : (
        <>
          <div className="upload-section-modern">
            <div 
              className={`upload-zone-modern ${dragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="upload-content">
                <i className="fas fa-cloud-upload-alt"></i>
                <h4>Upload Knowledge</h4>
                <p>Drop files or click to upload • PDF, DOCX, TXT, MD</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => Array.from(e.target.files).forEach(uploadDocument)}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="btn-upload">
                  <i className="fas fa-folder-open"></i> Choose Files
                </label>
              </div>
            </div>
          </div>
          
          <div className="documents-section-modern">
            <div className="documents-header-modern">
              <h3><i className="fas fa-database"></i> Knowledge Base</h3>
              <span className="document-count">{documents.length} documents</span>
            </div>
            
            <div className="documents-grid-modern">
              {documents.length === 0 ? (
                <div className="no-documents">
                  <i className="fas fa-file-alt"></i>
                  <h4>No Knowledge Yet</h4>
                  <p>Upload documents to give your brain knowledge</p>
                </div>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="document-card-modern">
                    <div className="doc-icon-modern">
                      <i className={`fas fa-${doc.filename?.endsWith('.pdf') ? 'file-pdf' : 
                                               doc.filename?.endsWith('.docx') ? 'file-word' :
                                               doc.filename?.endsWith('.md') ? 'file-code' : 'file-alt'}`}></i>
                    </div>
                    <div className="doc-content">
                      <h4 title={doc.filename}>{doc.filename || 'Unknown Document'}</h4>
                      <div className="doc-meta">
                        <span><i className="fas fa-weight"></i> {doc.size || 'Unknown'}</span>
                        <span><i className="fas fa-calendar"></i> {new Date(doc.uploaded_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="doc-actions-modern">
                      <button className="btn-view" title="View document">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => deleteDocument(doc.id)}
                        title="Delete document"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderInsights = () => (
    <div className="insights-dashboard">
      <h3><i className="fas fa-chart-line"></i> Brain Analytics</h3>
      <div className="insights-grid">
        <div className="insight-card">
          <h4>Total Brains</h4>
          <div className="insight-value">{brains.length}</div>
        </div>
        <div className="insight-card">
          <h4>Total Documents</h4>
          <div className="insight-value">{documents.length}</div>
        </div>
        <div className="insight-card">
          <h4>Knowledge Vectors</h4>
          <div className="insight-value">0</div>
        </div>
        <div className="insight-card">
          <h4>Active Brain</h4>
          <div className="insight-value" style={{ fontSize: '1.5rem' }}>
            {selectedBrain ? selectedBrain.name : 'None'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="brain-settings-modern">
      {selectedBrain ? (
        <div className="settings-form-modern">
          <div className="form-group-modern">
            <label><i className="fas fa-tag"></i> Brain Name</label>
            <input 
              type="text" 
              value={settingsForm.name}
              onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
              className="form-input-modern" 
              placeholder="Enter brain name"
            />
          </div>
          <div className="form-group-modern">
            <label><i className="fas fa-align-left"></i> Description</label>
            <textarea 
              value={settingsForm.description}
              onChange={(e) => setSettingsForm({...settingsForm, description: e.target.value})}
              className="form-input-modern" 
              rows="3"
              placeholder="Describe what this brain specializes in..."
            />
          </div>
          <div className="form-group-modern">
            <label><i className="fas fa-robot"></i> AI Instructions</label>
            <textarea 
              value={settingsForm.brain_prompt}
              onChange={(e) => setSettingsForm({...settingsForm, brain_prompt: e.target.value})}
              className="form-input-modern prompt-textarea" 
              rows="6"
              placeholder="Define how your AI should behave and respond..."
            />
          </div>
          <div className="settings-actions">
            <button 
              className="btn-save"
              onClick={() => saveBrainSettings(settingsForm)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Save Changes
                </>
              )}
            </button>
            <button 
              className="btn-danger-outline"
              onClick={() => deleteBrain(selectedBrain.id)}
            >
              <i className="fas fa-trash"></i> Delete Brain
            </button>
          </div>
        </div>
      ) : (
        <div className="no-brain-selected">
          <i className="fas fa-cog"></i>
          <h3>Select a Brain</h3>
          <p>Choose a brain to configure its settings</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="app-shell-modern">
      {/* Notification */}
      {notification && (
        <div className={`notification-modern ${notification.type}`}>
          <div className="notification-content">
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 
                           notification.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
            <span>{notification.message}</span>
          </div>
          <button className="notification-close" onClick={() => setNotification(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="app-main-modern">
        <div className="content-wrapper">
          {!selectedBrain ? renderDashboard() : renderBrainInterface()}
        </div>
      </main>

      {/* Modern Create Brain Modal */}
      {showCreateBrain && (
        <div className="modal-overlay-modern">
          <div className="modal-modern">
            <div className="modal-header-modern">
              <div className="modal-title">
                <i className="fas fa-brain"></i>
                <h3>Create New Brain</h3>
              </div>
              <button className="modal-close" onClick={() => setShowCreateBrain(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content-modern">
              <div className="form-section-modern">
                <div className="form-group-modern">
                  <label><i className="fas fa-tag"></i> Brain Name *</label>
                  <input
                    type="text"
                    value={newBrain.name}
                    onChange={(e) => setNewBrain({...newBrain, name: e.target.value})}
                    placeholder="e.g., Marketing Strategy Assistant"
                    className="form-input-modern"
                    required
                  />
                </div>
                
                <div className="form-group-modern">
                  <label><i className="fas fa-align-left"></i> Description</label>
                  <textarea
                    value={newBrain.description}
                    onChange={(e) => setNewBrain({...newBrain, description: e.target.value})}
                    placeholder="Describe what this brain specializes in..."
                    className="form-input-modern"
                    rows="3"
                  />
                </div>
                
                <div className="form-group-modern">
                  <label><i className="fas fa-robot"></i> AI Instructions</label>
                  <textarea
                    value={newBrain.brain_prompt}
                    onChange={(e) => setNewBrain({...newBrain, brain_prompt: e.target.value})}
                    placeholder="Provide specific instructions for how this AI should behave..."
                    className="form-input-modern prompt-textarea"
                    rows="6"
                  />
                  
                  <div className="prompt-templates">
                    <div className="templates-header">
                      <span>Quick Templates:</span>
                    </div>
                    <div className="template-buttons">
                      <button 
                        type="button"
                        className="template-btn"
                        onClick={() => setNewBrain({...newBrain, brain_prompt: "You are a helpful AI assistant. Provide accurate, concise, and helpful responses based on the knowledge base and context provided."})}
                      >
                        <i className="fas fa-robot"></i>
                        General
                      </button>
                      <button 
                        type="button"
                        className="template-btn"
                        onClick={() => setNewBrain({...newBrain, brain_prompt: "You are a strategic marketing advisor with deep expertise in market analysis, competitive positioning, and growth strategies. Provide data-driven insights and actionable recommendations."})}
                      >
                        <i className="fas fa-chart-line"></i>
                        Marketing
                      </button>
                      <button 
                        type="button"
                        className="template-btn"
                        onClick={() => setNewBrain({...newBrain, brain_prompt: "You are a senior software architect and technical consultant. Provide clear, practical solutions focusing on clean code, scalability, and security."})}
                      >
                        <i className="fas fa-code"></i>
                        Tech Advisor
                      </button>
                      <button 
                        type="button"
                        className="template-btn"
                        onClick={() => setNewBrain({...newBrain, brain_prompt: "You are a creative writing coach and content strategist. Help with storytelling, content creation, and brand voice development."})}
                      >
                        <i className="fas fa-pen-fancy"></i>
                        Creative
                      </button>
                      <button 
                        type="button"
                        className="template-btn"
                        onClick={() => setNewBrain({...newBrain, brain_prompt: "You are a customer success specialist focused on providing exceptional support. Be empathetic, solution-oriented, and patient."})}
                      >
                        <i className="fas fa-headset"></i>
                        Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer-modern">
              <button className="btn-cancel" onClick={() => setShowCreateBrain(false)}>
                Cancel
              </button>
              <button className="btn-create" onClick={createBrain} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i> Create Brain
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBrainPage;
