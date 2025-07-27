import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  Search, 
  Users, 
  Bot, 
  Settings, 
  ArrowRight,
  Database,
  MessageCircle,
  Activity,
  FileText,
  Zap
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
      if (!newBrain.name.trim()) {
        alert('Brain name is required');
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
          purpose: newBrain.purpose,
          user_id: user?.id
        }),
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
    if (!window.confirm('Are you sure you want to delete this brain? This will also delete all agents and documents within it.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:10000/api/brains/${brainId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBrains(brains.filter(brain => brain._id !== brainId));
        alert('Brain deleted successfully');
      } else {
        const result = await response.json();
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

  const handleBackToOverview = () => {
    setSelectedBrain(null);
    setViewMode('overview');
    loadBrains(); // Refresh the list
  };

  const filteredBrains = brains.filter(brain =>
    brain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brain.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brain.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If viewing a specific brain detail
  if (viewMode === 'detail' && selectedBrain) {
    return (
      <BrainDetailView 
        brain={selectedBrain}
        user={user}
        onBack={handleBackToOverview}
      />
    );
  }

  // Main brains overview
  return (
    <div className="brains-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <Brain className="header-icon" />
            <div>
              <h1>AI Brains System</h1>
              <p className="header-subtitle">Manage AI brains and their specialized agents</p>
            </div>
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

        <div className="search-section">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search brains by name, description, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
            <h3>No brains found</h3>
            <p>
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first AI brain to get started!'}
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
          filteredBrains.map((brain) => (
            <div key={brain._id} className="brain-card">
              <div className="brain-header">
                <div className="brain-title">
                  <Brain size={24} className="brain-icon" />
                  <div>
                    <h3>{brain.name}</h3>
                    <p className="brain-purpose">{brain.purpose || 'General purpose brain'}</p>
                  </div>
                </div>
                <div className="brain-actions">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleBrainSelect(brain)}
                    title="View brain details"
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => deleteBrain(brain._id)}
                    title="Delete brain"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="brain-description">
                <p>{brain.description || 'No description provided'}</p>
              </div>

              <div className="brain-stats">
                <div className="stat-item">
                  <Users size={16} />
                  <span>{brain.agent_count || 0} agents</span>
                </div>
                <div className="stat-item">
                  <Activity size={16} />
                  <span>Active</span>
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
          ))
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
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label>Brain Name *</label>
                <input
                  type="text"
                  value={newBrain.name}
                  onChange={(e) => setNewBrain({...newBrain, name: e.target.value})}
                  placeholder="e.g., Marketing Team, Research Assistant, Customer Support"
                />
              </div>

              <div className="form-group">
                <label>Purpose</label>
                <input
                  type="text"
                  value={newBrain.purpose}
                  onChange={(e) => setNewBrain({...newBrain, purpose: e.target.value})}
                  placeholder="e.g., Content creation and marketing campaigns"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newBrain.description}
                  onChange={(e) => setNewBrain({...newBrain, description: e.target.value})}
                  placeholder="Describe what this brain will be used for..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Initial System Prompt</label>
                <textarea
                  value={newBrain.initial_prompt}
                  onChange={(e) => setNewBrain({...newBrain, initial_prompt: e.target.value})}
                  placeholder="Define the brain's overall behavior and objectives..."
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="create-btn"
                onClick={createBrain}
              >
                <Brain size={16} />
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
