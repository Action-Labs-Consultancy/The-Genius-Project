import React, { useState } from 'react';
import { X, Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { useClientsStore } from '../stores/authStore';
import './ClientModal.css';

const ClientModal = ({ client = null, onClose, onSave }) => {
  const { createClient, updateClient } = useClientsStore();
  const isEditing = !!client;

  const [formData, setFormData] = useState({
    name: client?.name || '',
    description: client?.description || '',
    website: client?.website || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    industry: client?.industry || '',
    contact_person: client?.contact_person || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      if (!formData.website.startsWith('http://') && !formData.website.startsWith('https://')) {
        setFormData(prev => ({ ...prev, website: `https://${formData.website}` }));
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      let savedClient;
      if (isEditing) {
        savedClient = await updateClient(client.id, formData);
      } else {
        savedClient = await createClient(formData);
      }
      
      onSave?.(savedClient);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="client-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Building2 className="modal-icon" />
            <h2>{isEditing ? 'Edit Client' : 'Add New Client'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="name">
                Client Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter client name"
                required
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the client"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Technology, Healthcare"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_person">Contact Person</label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Primary contact name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail className="field-icon" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="client@company.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <Phone className="field-icon" />
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">
                <Globe className="field-icon" />
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://company.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">
                <MapPin className="field-icon" />
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, City, State"
              />
            </div>
          </div>

          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Client' : 'Create Client')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
