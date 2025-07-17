import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import './EquipmentRequest.css';

const EquipmentRequest = ({ user, onNavigate }) => {
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    requester_name: user?.name || '',
    project_id: '',
    pickup_time: '',
    expected_return_time: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    project_name: '',
    client_name: '',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    loadData();
    loadMyRequests();
  }, []);

  const loadData = async () => {
    try {
      const [equipmentRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/equipment`),
        fetch(`${API_BASE_URL}/api/equipment/projects`)
      ]);

      if (equipmentRes.ok) {
        const equipmentData = await equipmentRes.json();
        setEquipment(equipmentData.filter(item => 
          item.item_status === 'Available' && item.quantity_available > 0
        ));
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.filter(p => p.status === 'Active'));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMyRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/checkout`);
      if (response.ok) {
        const data = await response.json();
        // Filter requests by current user
        const userRequests = data.filter(req => 
          req.requester_name === user?.name
        );
        setMyRequests(userRequests);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(equipment.map(item => item.category))];

  const addEquipmentItem = (equipmentItem) => {
    if (!selectedItems.find(item => item.equipment_id === equipmentItem._id)) {
      setSelectedItems([...selectedItems, {
        equipment_id: equipmentItem._id,
        equipment_name: equipmentItem.item_name,
        available_quantity: equipmentItem.quantity_available,
        quantity_requested: 1,
        notes: ''
      }]);
    }
  };

  const updateSelectedItem = (equipmentId, field, value) => {
    setSelectedItems(selectedItems.map(item => 
      item.equipment_id === equipmentId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const removeSelectedItem = (equipmentId) => {
    setSelectedItems(selectedItems.filter(item => item.equipment_id !== equipmentId));
  };

  const createNewProject = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        const project = await response.json();
        setProjects([...projects, project]);
        setFormData({ ...formData, project_id: project.id });
        setShowNewProject(false);
        setNewProject({ project_name: '', client_name: '', description: '' });
      } else {
        const error = await response.json();
        alert(`Error creating project: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      alert('Please select at least one equipment item');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          equipment_items: selectedItems.map(item => ({
            equipment_id: item.equipment_id,
            quantity_requested: item.quantity_requested,
            notes: item.notes
          }))
        }),
      });

      if (response.ok) {
        alert('Equipment request submitted successfully! You will be notified when approved.');
        setSelectedItems([]);
        setFormData({
          requester_name: user?.name || '',
          project_id: '',
          pickup_time: '',
          expected_return_time: '',
          notes: ''
        });
        setActiveTab('my-requests');
        loadMyRequests();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = {
      'Pending Approval': 'status-pending',
      'Pending': 'status-pending',
      'Approved': 'status-approved',
      'Rejected': 'status-rejected',
      'Checked Out': 'status-checked-out',
      'Returned': 'status-returned'
    };

    const className = statusClass[status] || 'status-pending';

    return (
      <span className={`status-badge ${className}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="equipment-request">
      <div className="request-header">
        <button 
          onClick={() => onNavigate('/dashboard')} 
          className="back-button"
        >
          ← Back to Dashboard
        </button>
        <h1>Equipment Request</h1>
        <p>Request equipment for your projects</p>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          📦 Browse Equipment
        </button>
        <button 
          className={`tab ${activeTab === 'my-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-requests')}
        >
          📋 My Requests ({myRequests.length})
        </button>
      </div>

      {activeTab === 'browse' && (
        <div className="browse-section">
          <div className="filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="category-filter">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="equipment-grid">
            {filteredEquipment.map(item => {
              const isUnavailable = item.quantity_available === 0 || item.item_status !== 'Available';
              const isSelected = selectedItems.find(selected => selected.equipment_id === item._id);
              
              return (
                <div key={item._id} className={`equipment-card ${isUnavailable ? 'unavailable' : ''}`}>
                  <div className="equipment-image">
                    {item.image_url ? (
                      <img src={`${API_BASE_URL}${item.image_url}`} alt={item.item_name} />
                    ) : (
                      <div className="placeholder-image">📷</div>
                    )}
                  </div>
                  <div className="equipment-info">
                    <h3>{item.item_name}</h3>
                    <p className="category">{item.category}</p>
                    <p className="unique-id">ID: {item.unique_id}</p>
                    <p className={`availability ${isUnavailable ? 'unavailable' : ''}`}>
                      {isUnavailable ? 'Unavailable' : `Available: ${item.quantity_available} / ${item.quantity_total}`}
                    </p>
                    {item.special_instructions && (
                      <p className="instructions">{item.special_instructions}</p>
                    )}
                  </div>
                  <button 
                    className={`add-button ${isSelected ? 'added' : ''} ${isUnavailable ? 'unavailable' : ''}`}
                    onClick={() => addEquipmentItem(item)}
                    disabled={isSelected || isUnavailable}
                  >
                    {isUnavailable ? 'Unavailable' : isSelected ? '✓ Added' : '+ Add to Request'}
                  </button>
                </div>
              );
            })}
          </div>

          {selectedItems.length > 0 && (
            <div className="selected-items">
              <h3>Selected Equipment ({selectedItems.length})</h3>
              <div className="selected-list">
                {selectedItems.map(item => (
                  <div key={item.equipment_id} className="selected-item">
                    <span className="item-name">{item.equipment_name}</span>
                    <div className="quantity-control">
                      <label>Qty:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.available_quantity}
                        value={item.quantity_requested}
                        onChange={(e) => updateSelectedItem(item.equipment_id, 'quantity_requested', parseInt(e.target.value))}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={item.notes}
                      onChange={(e) => updateSelectedItem(item.equipment_id, 'notes', e.target.value)}
                    />
                    <button 
                      className="remove-button"
                      onClick={() => removeSelectedItem(item.equipment_id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={submitRequest} className="request-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input
                      type="text"
                      value={formData.requester_name}
                      onChange={(e) => setFormData({...formData, requester_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Project *</label>
                    <div className="project-selector">
                      <select
                        value={formData.project_id}
                        onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                        required
                      >
                        <option value="">Select Project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.project_name} - {project.client_name}
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setShowNewProject(true)}
                        className="new-project-btn"
                      >
                        + New
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pickup Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({...formData, pickup_time: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected Return *</label>
                    <input
                      type="datetime-local"
                      value={formData.expected_return_time}
                      onChange={(e) => setFormData({...formData, expected_return_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any special requirements or notes..."
                    rows="3"
                  />
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Submitting Request...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-requests' && (
        <div className="my-requests-section">
          <h3>My Equipment Requests</h3>
          {myRequests.length === 0 ? (
            <div className="no-requests">
              <p>You haven't made any equipment requests yet.</p>
              <button 
                onClick={() => setActiveTab('browse')}
                className="browse-button"
              >
                Browse Equipment
              </button>
            </div>
          ) : (
            <div className="requests-list">
              {myRequests.map(request => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h4>Request #{request.id?.slice(-6) || 'N/A'}</h4>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="request-details">
                    <p><strong>Project:</strong> {request.project_name}</p>
                    <p><strong>Pickup:</strong> {new Date(request.pickup_time).toLocaleDateString()}</p>
                    <p><strong>Return:</strong> {new Date(request.expected_return_time).toLocaleDateString()}</p>
                    <p><strong>Equipment:</strong></p>
                    <ul>
                      {request.equipment_items?.map((item, index) => (
                        <li key={index}>
                          {item.equipment_name} (Qty: {item.quantity_requested})
                        </li>
                      ))}
                    </ul>
                    {request.notes && (
                      <p><strong>Notes:</strong> {request.notes}</p>
                    )}
                    {request.admin_notes && (
                      <p><strong>Admin Notes:</strong> {request.admin_notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showNewProject && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Project</h3>
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                value={newProject.project_name}
                onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                value={newProject.client_name}
                onChange={(e) => setNewProject({...newProject, client_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowNewProject(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={createNewProject}
                className="create-button"
                disabled={!newProject.project_name || !newProject.client_name}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentRequest;
