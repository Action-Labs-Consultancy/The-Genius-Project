import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Search, 
  Users, 
  Bot, 
  ArrowRight,
  Trash2,
  X
} from 'lucide-react';
import BrainDetailView from '../components/BrainDetailView';
import './BrainsPage.css';

const BrainsPage = ({ user }) => {
  const [brains, setBrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBrain, setSelectedBrain] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'detail'

  const [newBrain, setNewBrain] = useState({
    name: '',
    description: '',
    purpose: '',
    initial_prompt: 'You are an intelligent AI assistant. Work collaboratively with other agents in this brain to accomplish complex tasks efficiently.'
  });

  useEffect(() => {
    loadBrains();
  }, []);

  const loadBrains = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:10000/api/brains');
      
      if (response.ok) {
        const result = await response.json();
        const brainsData = result.success ? result.data : result.brains || [];
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
      if (!newBrain.name.trim() || !newBrain.description.trim()) {
        alert('Brain name and description are required');
        return;
      }

      const response = await fetch('http://localhost:10000/api/brains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBrain.name,
          description: newBrain.description,
          system_prompt: newBrain.initial_prompt,
          purpose: newBrain.purpose
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setBrains([...brains, result.data]);
        setShowCreateModal(false);
        setNewBrain({
          name: '',
          description: '',
          purpose: '',
          initial_prompt: 'You are an intelligent AI assistant. Work collaboratively with other agents in this brain to accomplish complex tasks efficiently.'
        });
        alert('Brain created successfully!');
      } else {
        alert(result.error || 'Failed to create brain');
      }
    } catch (error) {
      console.error('Failed to create brain:', error);
      alert('Failed to create brain: ' + error.message);
    }
  };

  const deleteBrain = async (brainId) => {
    if (!confirm('Are you sure you want to delete this brain? All agents and documents within it will be permanently deleted.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:10000/api/brains/${brainId}`, {
        method: 'DELETE'
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

  const handleBrainSelect = (brain) => {
    setSelectedBrain(brain);
    setViewMode('detail');
  };

  const handleBackToBrains = () => {
    setSelectedBrain(null);
    setViewMode('overview');
    loadBrains(); // Refresh the brains list
  };

  const filteredBrains = brains.filter(brain =>
    brain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brain.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewMode === 'detail' && selectedBrain) {
    return (
      <BrainDetailView 
        brain={selectedBrain} 
        user={user} 
        onBack={handleBackToBrains}
      />
    );
  }

  if (loading) {
    return (
      <div className="brains-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Loading brains...
        </div>
      </div>
    );
  }

  return (
    <div className="brains-page">
      {/* Header */}
      <div className="brains-header">
        <div className="header-content">
          <h1 className="page-title">
            <Brain size={32} />
            AI Brains
          </h1>
          <p className="page-subtitle">
            Create and manage AI brain systems with specialized agents
          </p>
        </div>
        <button 
          className="create-brain-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          Create Brain
        </button>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search brains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Brains Grid */}
      <div className="brains-container">
        {filteredBrains.length === 0 ? (
          <div className="empty-state">
            <Brain className="empty-icon" />
            <h3 className="empty-title">
              {searchTerm ? 'No brains found' : 'No brains created yet'}
            </h3>
            <p className="empty-description">
              {searchTerm 
                ? 'Try adjusting your search terms to find the brain you\'re looking for'
                : 'Create your first AI brain to start building intelligent agent systems'
              }
            </p>
            {!searchTerm && (
              <button 
                className="create-first-brain-btn"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create Your First Brain
              </button>
            )}
          </div>
        ) : (
          <div className="brains-grid">
            {filteredBrains.map((brain) => (
              <div key={brain._id} className="brain-card">
                <div className="brain-header">
                  <div className="brain-title">
                    <Brain size={24} className="brain-icon" />
                    <div className="brain-info">
                      <h3 className="brain-name">{brain.name}</h3>
                      <p className="brain-purpose">{brain.purpose || 'General purpose brain'}</p>
                    </div>
                  </div>
                  <div className="brain-actions">
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBrain(brain._id);
                      }}
                      title="Delete brain"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="brain-description">
                  <p>{brain.description}</p>
                </div>

                <div className="brain-stats">
                  <div className="stat-item">
                    <Users size={16} />
                    <span>{brain.agent_count || 0} agents</span>
                  </div>
                  <div className="stat-item">
                    <span className="status-badge active">Active</span>
                  </div>
                </div>

                <div className="brain-footer">
                  <div className="brain-created">
                    Created {new Date(brain.created_at).toLocaleDateString()}
                  </div>
                  <button 
                    className="enter-brain-btn"
                    onClick={() => handleBrainSelect(brain)}
                  >
                    Enter Brain
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Brain Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Brain</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Brain Name *</label>
                <input
                  type="text"
                  value={newBrain.name}
                  onChange={(e) => setNewBrain({...newBrain, name: e.target.value})}
                  placeholder="Enter brain name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purpose</label>
                <input
                  type="text"
                  value={newBrain.purpose}
                  onChange={(e) => setNewBrain({...newBrain, purpose: e.target.value})}
                  placeholder="What is this brain designed for?"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  value={newBrain.description}
                  onChange={(e) => setNewBrain({...newBrain, description: e.target.value})}
                  placeholder="Describe what this brain does and its capabilities"
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial System Prompt</label>
                <textarea
                  value={newBrain.initial_prompt}
                  onChange={(e) => setNewBrain({...newBrain, initial_prompt: e.target.value})}
                  placeholder="Define the overall behavior and purpose of this brain system"
                  className="form-textarea"
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={createBrain}
              >
                <Plus size={16} />
                Create Brain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainsPage;
