import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  FileText, 
  Search, 
  Database,
  Zap,
  User,
  Bot,
  Star,
  Clock
} from 'lucide-react';
import './AIBrainsPage.css';

const AIBrainsPage = () => {
  const [brains, setBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [brainFiles, setBrainFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [newBrain, setNewBrain] = useState({
    name: '',
    system_prompt: '',
    personality: 'assistant',
    description: '',
    uploadFiles: null
  });

  const PERSONALITIES = {
    'assistant': {
      label: 'Professional Assistant',
      description: 'Helpful, professional, and efficient',
      icon: User,
      color: '#059669'
    },
    'creative': {
      label: 'Creative Helper',
      description: 'Imaginative, artistic, and innovative',
      icon: Star,
      color: '#7C3AED'
    },
    'analytical': {
      label: 'Data Analyst',
      description: 'Logical, precise, and detail-oriented',
      icon: Database,
      color: '#2563EB'
    },
    'friendly': {
      label: 'Friendly Companion',
      description: 'Warm, empathetic, and supportive',
      icon: Bot,
      color: '#DC2626'
    },
    'expert': {
      label: 'Domain Expert',
      description: 'Knowledgeable, authoritative, and focused',
      icon: Brain,
      color: '#EF4444'
    },
    'coach': {
      label: 'Mentor/Coach',
      description: 'Supportive, motivational, and guiding',
      icon: Zap,
      color: '#06B6D4'
    }
  };

  useEffect(() => {
    loadBrains();
  }, []);

  const loadBrains = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:10000/api/brains');
      if (response.ok) {
        const result = await response.json();
        // Handle new API response format
        const brainsData = result.success ? result.data : result;
        setBrains(Array.isArray(brainsData) ? brainsData : []);
      } else {
        console.error('Failed to fetch brains');
        setBrains([]);
      }
    } catch (error) {
      console.error('Failed to load brains:', error);
      setBrains([]);
    } finally {
      setLoading(false);
    }
  };

  const createBrain = async () => {
    try {
      if (!newBrain.name.trim()) {
        alert('Brain name is required');
        return;
      }
      
      if (!newBrain.system_prompt.trim()) {
        alert('Brain system prompt is required');
        return;
      }

      // First create the brain
      const response = await fetch('http://localhost:10000/api/brains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBrain.name,
          description: newBrain.description,
          personality: newBrain.personality,
          system_prompt: newBrain.system_prompt
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        const createdBrain = result.data;
        
        // Upload files if any were selected
        if (newBrain.uploadFiles && newBrain.uploadFiles.length > 0) {
          const uploadPromises = Array.from(newBrain.uploadFiles).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            
            try {
              const uploadResponse = await fetch(`http://localhost:10000/api/brains/${createdBrain._id}/upload`, {
                method: 'POST',
                body: formData,
              });
              
              const uploadResult = await uploadResponse.json();
              if (!uploadResponse.ok || !uploadResult.success) {
                console.error(`Failed to upload ${file.name}:`, uploadResult.error);
                return { file: file.name, success: false, error: uploadResult.error };
              }
              return { file: file.name, success: true, chunks: uploadResult.data.chunks_created };
            } catch (error) {
              console.error(`Error uploading ${file.name}:`, error);
              return { file: file.name, success: false, error: error.message };
            }
          });
          
          const uploadResults = await Promise.all(uploadPromises);
          const successfulUploads = uploadResults.filter(r => r.success);
          const failedUploads = uploadResults.filter(r => !r.success);
          
          if (successfulUploads.length > 0) {
            const totalChunks = successfulUploads.reduce((sum, r) => sum + (r.chunks || 0), 0);
            alert(`Brain created successfully!\n${successfulUploads.length} documents uploaded and processed (${totalChunks} text chunks created).${failedUploads.length > 0 ? `\n${failedUploads.length} files failed to upload.` : ''}`);
          } else if (failedUploads.length > 0) {
            alert(`Brain created successfully, but ${failedUploads.length} documents failed to upload. You can upload them later.`);
          }
        } else {
          alert('Brain created successfully!');
        }
        
        setBrains([...brains, createdBrain]);
        setShowCreateModal(false);
        setNewBrain({ name: '', system_prompt: '', personality: 'assistant', description: '', uploadFiles: null });
        loadBrains(); // Reload to get updated document counts
      } else {
        alert(result.error || 'Failed to create brain');
      }
    } catch (error) {
      console.error('Failed to create brain:', error);
      alert('Failed to create brain: ' + error.message);
    }
  };

  const updateBrain = async () => {
    try {
      const response = await fetch(`http://localhost:10000/api/brains/${selectedBrain._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedBrain.name,
          description: selectedBrain.description,
          personality: selectedBrain.personality,
          system_prompt: selectedBrain.system_prompt
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        loadBrains(); // Reload to get updated data
        setShowEditModal(false);
        setSelectedBrain(null);
        alert('Brain updated successfully!');
      } else {
        alert(result.error || 'Failed to update brain');
      }
    } catch (error) {
      console.error('Failed to update brain:', error);
      alert('Failed to update brain: ' + error.message);
    }
  };

  const deleteBrain = async (brainId) => {
    if (!window.confirm('Are you sure you want to delete this brain? This will also delete all associated documents and cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:10000/api/brains/${brainId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setBrains(brains.filter(brain => brain._id !== brainId));
        alert('Brain deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete brain');
      }
    } catch (error) {
      console.error('Failed to delete brain:', error);
      alert('Failed to delete brain: ' + error.message);
    }
  };

  const uploadDocument = async () => {
    if (!uploadFile || !selectedBrain) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      const response = await fetch(`http://localhost:10000/api/brains/${selectedBrain._id}/upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result.success) {
        loadBrainFiles(selectedBrain._id); // Refresh file list
        loadBrains(); // Reload to get updated document count
        setShowUploadModal(false);
        setUploadFile(null);
        if (result.data.warning) {
          alert(`Document uploaded with warning: ${result.data.warning}`);
        } else {
          alert(`Document uploaded successfully! Created ${result.data.chunks_created} text chunks for embeddings.`);
        }
      } else {
        alert(result.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const loadBrainFiles = async (brainId) => {
    try {
      const response = await fetch(`http://localhost:10000/api/brains/${brainId}/documents`);
      const result = await response.json();
      if (response.ok && result.success) {
        setBrainFiles(Array.isArray(result.data.documents) ? result.data.documents : []);
      } else {
        console.error('Failed to load brain files:', result.error);
        setBrainFiles([]);
      }
    } catch (error) {
      console.error('Failed to load brain files:', error);
      setBrainFiles([]);
    }
  };

  const deleteFile = async (brainId, fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`http://localhost:10000/api/brains/${brainId}/documents/${fileId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        loadBrainFiles(brainId); // Reload files
        loadBrains(); // Reload brains to update document count
        alert('File deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file: ' + error.message);
    }
  };

  const openFilesModal = (brain) => {
    setSelectedBrain(brain);
    setShowFilesModal(true);
    loadBrainFiles(brain._id);
  };

  const getPersonalityInfo = (personality) => {
    return PERSONALITIES[personality] || PERSONALITIES['assistant'];
  };

  const filteredBrains = brains.filter(brain => {
    const matchesSearch = brain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brain.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPersonality = !selectedPersonality || brain.personality === selectedPersonality;
    return matchesSearch && matchesPersonality;
  });

  return (
    <div className="ai-brains-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Brain className="header-icon" />
            <h1>AI Brains System</h1>
            <span className="brain-count">{brains.length} brains</span>
          </div>
          <button 
            className="create-brain-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Create New Brain
          </button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search brains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="personality-filter"
            value={selectedPersonality}
            onChange={(e) => setSelectedPersonality(e.target.value)}
          >
            <option value="">All Personalities</option>
            {Object.entries(PERSONALITIES).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="brains-grid">
        {loading ? (
          <div className="loading-state">
            <Brain className="loading-icon" />
            <p>Loading brains...</p>
          </div>
        ) : filteredBrains.length === 0 ? (
          <div className="empty-state">
            <Brain className="empty-icon" />
            <p>No brains found. Create your first AI brain to get started!</p>
          </div>
        ) : (
          filteredBrains.map((brain) => {
            const personalityInfo = getPersonalityInfo(brain.personality);
            const PersonalityIcon = personalityInfo.icon;
            
            return (
              <div key={brain._id} className="brain-card">
                <div className="brain-header">
                  <div className="brain-personality">
                    <PersonalityIcon size={20} />
                    <span>{personalityInfo.label}</span>
                  </div>
                  
                  <div className="brain-actions">
                    <button 
                      className="brain-action-btn"
                      onClick={() => {
                        setSelectedBrain(brain);
                        setShowEditModal(true);
                      }}
                      title="Edit Brain"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="brain-action-btn delete"
                      onClick={() => deleteBrain(brain._id)}
                      title="Delete Brain"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="brain-content">
                  <h3 className="brain-name">{brain.name}</h3>
                  {brain.description && (
                    <p className="brain-description">{brain.description}</p>
                  )}
                  
                  <div className="brain-stats">
                    <div className="stat-item">
                      <Database size={14} />
                      <span>{brain.usage_stats?.total_conversations || 0} conversations</span>
                    </div>
                    <div className="stat-item">
                      <FileText size={14} />
                      <span>{brain.knowledge_base?.length || 0} files</span>
                    </div>
                    {brain.usage_stats?.last_used && (
                      <div className="stat-item">
                        <Clock size={14} />
                        <span>Used {new Date(brain.usage_stats.last_used).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="brain-actions-row">
                    <button 
                      className="brain-btn primary"
                      onClick={() => openFilesModal(brain)}
                    >
                      <FileText size={16} />
                      View Files
                    </button>
                    <button 
                      className="brain-btn secondary"
                      onClick={() => {
                        setSelectedBrain(brain);
                        setShowUploadModal(true);
                      }}
                    >
                      <Upload size={16} />
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Brain Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-brain-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New AI Brain</h2>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="brain-name">Brain Name *</label>
                <input
                  id="brain-name"
                  type="text"
                  placeholder="Enter a name for your AI brain (e.g., 'Customer Support Assistant')"
                  value={newBrain.name}
                  onChange={(e) => setNewBrain({...newBrain, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="brain-description">Description</label>
                <textarea
                  id="brain-description"
                  placeholder="Describe what this brain is designed to help with (optional)"
                  value={newBrain.description}
                  onChange={(e) => setNewBrain({...newBrain, description: e.target.value})}
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="brain-personality">Personality Type</label>
                <select
                  id="brain-personality"
                  value={newBrain.personality}
                  onChange={(e) => setNewBrain({...newBrain, personality: e.target.value})}
                >
                  {Object.entries(PERSONALITIES).map(([key, info]) => (
                    <option key={key} value={key}>{info.label} - {info.description}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="brain-prompt">Brain Prompt (System Instructions) *</label>
                <textarea
                  id="brain-prompt"
                  placeholder="Define how this brain should behave. This is the system prompt that guides the AI's responses. Example: 'You are a helpful customer support assistant. Always be polite, helpful, and provide clear solutions to customer problems.'"
                  value={newBrain.system_prompt}
                  onChange={(e) => setNewBrain({...newBrain, system_prompt: e.target.value})}
                  rows="6"
                  required
                />
                <small className="form-hint">
                  This prompt defines your brain's personality and behavior. It will be used for all AI responses.
                </small>
              </div>
              
              <div className="upload-section">
                <h4>Upload Documents (Optional)</h4>
                <p className="upload-note">
                  You can upload documents now or later. Supported formats: PDF, DOC, DOCX, TXT, MD
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  multiple
                  onChange={(e) => setNewBrain({...newBrain, uploadFiles: e.target.files})}
                />
                {newBrain.uploadFiles && newBrain.uploadFiles.length > 0 && (
                  <div className="selected-files">
                    <p>Selected files:</p>
                    <ul>
                      {Array.from(newBrain.uploadFiles).map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={createBrain} 
                disabled={!newBrain.name || !newBrain.system_prompt}
                className="btn-primary"
              >
                Create Brain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Brain Modal */}
      {showEditModal && selectedBrain && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit AI Brain</h2>
              <button onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Brain Name"
                value={selectedBrain.name}
                onChange={(e) => setSelectedBrain({...selectedBrain, name: e.target.value})}
              />
              <textarea
                placeholder="Description"
                value={selectedBrain.description || ''}
                onChange={(e) => setSelectedBrain({...selectedBrain, description: e.target.value})}
              />
              <select
                value={selectedBrain.personality}
                onChange={(e) => setSelectedBrain({...selectedBrain, personality: e.target.value})}
              >
                {Object.entries(PERSONALITIES).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
              <textarea
                placeholder="System Prompt"
                value={selectedBrain.system_prompt}
                onChange={(e) => setSelectedBrain({...selectedBrain, system_prompt: e.target.value})}
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
              <button onClick={updateBrain}>Update Brain</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {/* Files Modal */}
      {showFilesModal && selectedBrain && (
        <div className="modal-overlay" onClick={() => setShowFilesModal(false)}>
          <div className="modal-content files-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Files in {selectedBrain.name}</h2>
              <button onClick={() => setShowFilesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {(Array.isArray(brainFiles) && brainFiles.length === 0) ? (
                <p className="no-files">No files uploaded yet.</p>
              ) : (
                <div className="files-list">
                  {(Array.isArray(brainFiles) ? brainFiles : []).map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <FileText size={20} />
                        <div className="file-details">
                          <div className="file-name">{file.filename}</div>
                          <div className="file-meta">
                            {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'} • 
                            {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : 'Unknown date'}
                          </div>
                        </div>
                      </div>
                      <button 
                        className="delete-file-btn"
                        onClick={() => deleteFile(selectedBrain._id, file.id || index)}
                        title="Delete file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowFilesModal(false);
                  setShowUploadModal(true);
                }}
                className="btn-primary"
              >
                <Upload size={16} />
                Upload New File
              </button>
              <button onClick={() => setShowFilesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedBrain && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document to {selectedBrain.name}</h2>
              <button onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files[0])}
                accept=".pdf,.txt,.doc,.docx,.md"
                disabled={uploading}
              />
              {uploadFile && (
                <p>Selected: {uploadFile.name}</p>
              )}
              {uploading && <p>Uploading...</p>}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowUploadModal(false)} disabled={uploading}>Cancel</button>
              <button onClick={uploadDocument} disabled={!uploadFile || uploading}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBrainsPage;
