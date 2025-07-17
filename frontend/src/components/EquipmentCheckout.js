import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const EquipmentCheckout = ({ user, onBack }) => {
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [equipmentRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/equipment`),
        fetch(`${API_BASE_URL}/api/equipment/projects`)
      ]);

      if (equipmentRes.ok) {
        const equipmentData = await equipmentRes.json();
        setEquipment(equipmentData.filter(item => item.item_status === 'Available' && item.quantity_available > 0));
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.filter(p => p.status === 'Active'));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addEquipmentItem = (equipmentId) => {
    const equipmentItem = equipment.find(e => e.id === equipmentId);
    if (equipmentItem && !selectedItems.find(item => item.equipment_id === equipmentId)) {
      setSelectedItems([...selectedItems, {
        equipment_id: equipmentId,
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

  const submitCheckoutRequest = async (e) => {
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
        alert('Equipment request submitted successfully! Awaiting approval.');
        onBack();
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

  return (
    <div className="equipment-checkout">
      <div className="checkout-header">
        <button onClick={onBack} className="back-button">← Back</button>
        <h1>Equipment Request</h1>
      </div>

      <form onSubmit={submitCheckoutRequest}>
        <div className="checkout-form">
          <div className="form-section">
            <h3>Request Details</h3>
            
            <div className="form-group">
              <label>Requester Name *</label>
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
                  className="btn-secondary"
                >
                  + New Project
                </button>
              </div>
            </div>

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
              <label>Expected Return Time *</label>
              <input
                type="datetime-local"
                value={formData.expected_return_time}
                onChange={(e) => setFormData({...formData, expected_return_time: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                placeholder="Additional notes or special requirements..."
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Equipment Selection</h3>
            
            <div className="equipment-selector">
              <select onChange={(e) => e.target.value && addEquipmentItem(e.target.value)}>
                <option value="">Select Equipment to Add</option>
                {equipment.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} ({item.category}) - Available: {item.quantity_available}
                  </option>
                ))}
              </select>
            </div>

            <div className="selected-equipment">
              {selectedItems.length === 0 ? (
                <p className="no-items">No equipment selected</p>
              ) : (
                selectedItems.map(item => (
                  <div key={item.equipment_id} className="selected-item">
                    <div className="item-info">
                      <h4>{item.equipment_name}</h4>
                      <p>Available: {item.available_quantity}</p>
                    </div>
                    <div className="item-controls">
                      <div className="quantity-control">
                        <label>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          max={item.available_quantity}
                          value={item.quantity_requested}
                          onChange={(e) => updateSelectedItem(item.equipment_id, 'quantity_requested', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="notes-control">
                        <label>Notes:</label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => updateSelectedItem(item.equipment_id, 'notes', e.target.value)}
                          placeholder="Special handling notes..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedItem(item.equipment_id)}
                        className="remove-item"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onBack}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button onClick={() => setShowNewProject(false)}>×</button>
            </div>
            <div className="modal-body">
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
              <div className="form-actions">
                <button type="button" onClick={() => setShowNewProject(false)}>Cancel</button>
                <button type="button" onClick={createNewProject} className="btn-primary">
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentCheckout;
