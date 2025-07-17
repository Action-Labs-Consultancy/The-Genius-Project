import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import EquipmentCheckout from '../components/EquipmentCheckout';
import './EquipmentManagement.css';

// Icons (you can replace with actual icon library)
const Icons = {
  Plus: () => <span>➕</span>,
  Edit: () => <span>✏️</span>,
  Delete: () => <span>🗑️</span>,
  Check: () => <span>✅</span>,
  X: () => <span>❌</span>,
  Package: () => <span>📦</span>,
  Calendar: () => <span>📅</span>,
  User: () => <span>👤</span>,
  Search: () => <span>🔍</span>,
  Filter: () => <span>🔽</span>,
  Camera: () => <span>📷</span>,
  Monitor: () => <span>🖥️</span>,
  Audio: () => <span>🎵</span>,
  Light: () => <span>💡</span>,
  Clipboard: () => <span>📋</span>
};

const EquipmentManagement = ({ user }) => {
  const [activeTab, setActiveTab] = useState('equipment');
  const [showCheckout, setShowCheckout] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'equipment', 'project', 'checkout'
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form states
  const [equipmentForm, setEquipmentForm] = useState({
    item_name: '',
    category: '',
    quantity_total: 1,
    quantity_available: 1,
    item_status: 'Available',
    location: '',
    condition: 'Good',
    purchase_date: '',
    purchase_price: 0,
    serial_number: '',
    manufacturer: '',
    model: '',
    special_instructions: '',
    item_image: null  // File object
  });

  const [projectForm, setProjectForm] = useState({
    project_name: '',
    client_name: '',
    description: '',
    status: 'Active'
  });

  const [checkoutForm, setCheckoutForm] = useState({
    requester_name: '',
    project_id: '',
    pickup_time: '',
    expected_return_time: '',
    equipment_items: [],
    notes: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEquipment(),
        loadProjects(),
        loadCheckouts(),
        loadCategories(),
        loadStatusOptions()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadCheckouts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/checkout`);
      if (response.ok) {
        const data = await response.json();
        setCheckouts(data);
      }
    } catch (error) {
      console.error('Error loading checkouts:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStatusOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/status-options`);
      if (response.ok) {
        const data = await response.json();
        setStatusOptions(data);
      }
    } catch (error) {
      console.error('Error loading status options:', error);
    }
  };

  // Equipment CRUD operations
  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(equipmentForm).forEach(key => {
        if (key === 'item_image' && equipmentForm[key]) {
          formData.append(key, equipmentForm[key]);
        } else if (key !== 'item_image') {
          formData.append(key, equipmentForm[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/equipment/upload`, {
        method: 'POST',
        body: formData, // Don't set Content-Type header for FormData
      });

      if (response.ok) {
        await loadEquipment();
        setShowModal(false);
        resetEquipmentForm();
        alert('Equipment created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating equipment:', error);
      alert('Error creating equipment');
    }
  };

  const handleUpdateEquipment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipmentForm),
      });

      if (response.ok) {
        await loadEquipment();
        setShowModal(false);
        setEditingItem(null);
        resetEquipmentForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating equipment:', error);
      alert('Error updating equipment');
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/${equipmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadEquipment();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Error deleting equipment');
    }
  };

  // Project operations
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectForm),
      });

      if (response.ok) {
        await loadProjects();
        setShowModal(false);
        resetProjectForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  // Equipment Request Approval/Rejection
  const handleApproveRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this request?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/checkout/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_name: user?.name || 'Admin'
        }),
      });

      if (response.ok) {
        alert('Request approved successfully!');
        await loadCheckouts();
        await loadEquipment(); // Refresh equipment to update availability
      } else {
        const error = await response.json();
        alert(`Error approving request: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const rejectionReason = prompt('Please provide a reason for rejection (optional):') || 'No reason provided';
    
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/checkout/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approver_name: user?.name || 'Admin',
          rejection_reason: rejectionReason
        }),
      });

      if (response.ok) {
        alert('Request rejected successfully!');
        await loadCheckouts();
      } else {
        const error = await response.json();
        alert(`Error rejecting request: ${error.error}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  // Reset forms
  const resetEquipmentForm = () => {
    setEquipmentForm({
      item_name: '',
      category: '',
      quantity_total: 1,
      quantity_available: 1,
      item_status: 'Available',
      location: '',
      condition: 'Good',
      purchase_date: '',
      purchase_price: 0,
      serial_number: '',
      manufacturer: '',
      model: '',
      special_instructions: '',
      item_image: null  // File object
    });
  };

  const resetProjectForm = () => {
    setProjectForm({
      project_name: '',
      client_name: '',
      description: '',
      status: 'Active'
    });
  };

  // Modal handlers
  const openEquipmentModal = (item = null) => {
    setModalType('equipment');
    setEditingItem(item);
    if (item) {
      setEquipmentForm({ ...item });
    } else {
      resetEquipmentForm();
    }
    setShowModal(true);
  };

  const openProjectModal = () => {
    setModalType('project');
    resetProjectForm();
    setShowModal(true);
  };

  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.unique_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || item.item_status === filterStatus;
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Camera': return <Icons.Camera />;
      case 'Monitor': return <Icons.Monitor />;
      case 'Audio': return <Icons.Audio />;
      case 'Lighting': return <Icons.Light />;
      default: return <Icons.Package />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#4CAF50';
      case 'In Use': return '#FF9800';
      case 'Out of Stock': return '#F44336';
      case 'Needs Repair': return '#9C27B0';
      case 'Missing': return '#795548';
      case 'Scrapped': return '#607D8B';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div className="equipment-loading">
        <div className="loading-spinner"></div>
        <p>Loading Equipment Management...</p>
      </div>
    );
  }

  if (showCheckout) {
    return <EquipmentCheckout user={user} onBack={() => setShowCheckout(false)} />;
  }

  return (
    <div className="equipment-management">
      <div className="equipment-header">
        <h1>Equipment Management</h1>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowCheckout(true)}
          >
            <Icons.Calendar /> Request Equipment
          </button>
          <button 
            className="btn-primary"
            onClick={() => openEquipmentModal()}
          >
            <Icons.Plus /> Add Equipment
          </button>
          <button 
            className="btn-secondary"
            onClick={openProjectModal}
          >
            <Icons.Plus /> Add Project
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="equipment-tabs">
        <button 
          className={`tab ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          <Icons.Package /> Equipment
        </button>
        <button 
          className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <Icons.Clipboard /> Projects
        </button>
        <button 
          className={`tab ${activeTab === 'checkouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkouts')}
        >
          <Icons.Calendar /> Requests
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <Icons.Clipboard /> Reports
        </button>
      </div>

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div className="equipment-content">
          {/* Filters */}
          <div className="equipment-filters">
            <div className="search-box">
              <Icons.Search />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Equipment Grid */}
          <div className="equipment-grid">
            {filteredEquipment.map(item => (
              <div key={item.id} className="equipment-card">
                <div className="equipment-card-header">
                  <div className="equipment-icon" style={{ position: 'relative' }}>
                    {getCategoryIcon(item.category)}
                    {item.image_url && (
                      <span className="equipment-image-badge">
                        <img 
                          src={`${API_BASE_URL}${item.image_url}`}
                          alt={item.item_name}
                          style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', border: '2px solid #FFD600', position: 'absolute', right: -10, top: -10, background: '#222' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      </span>
                    )}
                  </div>
                  <div className="equipment-actions">
                    <button onClick={() => openEquipmentModal(item)}>
                      <Icons.Edit />
                    </button>
                    <button onClick={() => handleDeleteEquipment(item.id)}>
                      <Icons.Delete />
                    </button>
                  </div>
                </div>
                <div className="equipment-info">
                  <h3>{item.item_name}</h3>
                  <p className="equipment-id">ID: {item.unique_id}</p>
                  <p className="equipment-category">{item.category}</p>
                  <div className="equipment-quantity">
                    <span>Available: {item.quantity_available}</span>
                    <span>Total: {item.quantity_total || item.quantity_available}</span>
                  </div>
                  <div 
                    className="equipment-status"
                    style={{ backgroundColor: getStatusColor(item.item_status) }}
                  >
                    {item.item_status}
                  </div>
                  {item.special_instructions && (
                    <p className="equipment-instructions">{item.special_instructions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="projects-content">
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <h3>{project.project_name}</h3>
                <p><strong>Client:</strong> {project.client_name}</p>
                <p>{project.description}</p>
                <div className="project-status">{project.status}</div>
                <div className="project-date">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkouts Tab */}
      {activeTab === 'checkouts' && (
        <div className="checkouts-content">
          <div className="checkouts-list">
            {checkouts.map(checkout => (
              <div key={checkout.id} className="checkout-card">
                <div className="checkout-header">
                  <h3>Request #{checkout.id.slice(-6)}</h3>
                  <div className={`checkout-status status-${checkout.status.toLowerCase().replace(' ', '-')}`}>
                    {checkout.status}
                  </div>
                </div>
                <div className="checkout-info">
                  <p><strong>Requester:</strong> {checkout.requester_name}</p>
                  <p><strong>Project:</strong> {checkout.project_id}</p>
                  <p><strong>Pickup:</strong> {new Date(checkout.pickup_time).toLocaleString()}</p>
                  <p><strong>Return:</strong> {new Date(checkout.expected_return_time).toLocaleString()}</p>
                  <p><strong>Items:</strong> {checkout.equipment_items.length} item(s)</p>
                  {checkout.notes && <p><strong>Notes:</strong> {checkout.notes}</p>}
                  {checkout.rejection_reason && (
                    <p><strong>Rejection Reason:</strong> {checkout.rejection_reason}</p>
                  )}
                  {checkout.approved_by && (
                    <p><strong>Approved By:</strong> {checkout.approved_by}</p>
                  )}
                </div>
                {checkout.status === 'Pending Approval' && user?.is_admin && (
                  <div className="checkout-actions">
                    <button 
                      className="btn-approve"
                      onClick={() => handleApproveRequest(checkout.id)}
                    >
                      ✓ Approve
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleRejectRequest(checkout.id)}
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="reports-content">
          <div className="reports-grid">
            <div className="report-card">
              <h3>Equipment Status Overview</h3>
              <div className="status-summary">
                {statusOptions.map(status => {
                  const count = equipment.filter(item => item.item_status === status).length;
                  return (
                    <div key={status} className="status-item">
                      <span 
                        className="status-dot"
                        style={{ backgroundColor: getStatusColor(status) }}
                      ></span>
                      <span>{status}: {count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="report-card">
              <h3>Category Distribution</h3>
              <div className="category-summary">
                {categories.map(category => {
                  const count = equipment.filter(item => item.category === category).length;
                  return (
                    <div key={category} className="category-item">
                      {getCategoryIcon(category)}
                      <span>{category}: {count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="report-card">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {checkouts.slice(0, 5).map(checkout => (
                  <div key={checkout.id} className="activity-item">
                    <span>{checkout.requester_name}</span>
                    <span>{checkout.status}</span>
                    <span>{new Date(checkout.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'equipment' && (editingItem ? 'Edit Equipment' : 'Add Equipment')}
                {modalType === 'project' && 'Add Project'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <Icons.X />
              </button>
            </div>

            {modalType === 'equipment' && (
              <form onSubmit={editingItem ? handleUpdateEquipment : handleCreateEquipment}>
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={equipmentForm.item_name}
                    onChange={(e) => setEquipmentForm({...equipmentForm, item_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={equipmentForm.category}
                    onChange={(e) => setEquipmentForm({...equipmentForm, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unique ID/Barcode *</label>
                  <input
                    type="text"
                    value={equipmentForm.unique_id}
                    onChange={(e) => setEquipmentForm({...equipmentForm, unique_id: e.target.value})}
                    required
                    disabled={editingItem} // Don't allow editing unique ID
                  />
                </div>
                <div className="form-group">
                  <label>Quantity Available *</label>
                  <input
                    type="number"
                    min="0"
                    value={equipmentForm.quantity_available}
                    onChange={(e) => setEquipmentForm({...equipmentForm, quantity_available: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={equipmentForm.item_status}
                    onChange={(e) => setEquipmentForm({...equipmentForm, item_status: e.target.value})}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Equipment Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEquipmentForm({...equipmentForm, item_image: e.target.files[0]})}
                  />
                  {equipmentForm.item_image && (
                    <p className="file-selected">Selected: {equipmentForm.item_image.name}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Special Instructions</label>
                  <textarea
                    value={equipmentForm.special_instructions}
                    onChange={(e) => setEquipmentForm({...equipmentForm, special_instructions: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">
                    {editingItem ? 'Update' : 'Create'} Equipment
                  </button>
                </div>
              </form>
            )}

            {modalType === 'project' && (
              <form onSubmit={handleCreateProject}>
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    value={projectForm.project_name}
                    onChange={(e) => setProjectForm({...projectForm, project_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    value={projectForm.client_name}
                    onChange={(e) => setProjectForm({...projectForm, client_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create Project</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;
