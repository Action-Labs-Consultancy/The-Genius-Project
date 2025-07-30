/**
 * Feature Request Submission Form
 * Allows users to submit new feature requests with attachments
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { featureRequestApi } from '../api/featureRequestApi';
import './FeatureRequestForm.css';

const FeatureRequestForm = ({ user, onNavigate }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'enhancement',
    priority: 'medium',
    use_case: '',
    expected_outcome: '',
  });
  
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    { value: 'enhancement', label: 'Enhancement' },
    { value: 'bug_fix', label: 'Bug Fix' },
    { value: 'new_feature', label: 'New Feature' },
    { value: 'ui_ux', label: 'UI/UX Improvement' },
    { value: 'performance', label: 'Performance' },
    { value: 'integration', label: 'Integration' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#4ade80' },
    { value: 'medium', label: 'Medium', color: '#fbbf24' },
    { value: 'high', label: 'High', color: '#f87171' },
    { value: 'urgent', label: 'Urgent', color: '#dc2626' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      
      // Check file type
      const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'zip'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        setError(`File type "${fileExtension}" is not allowed.`);
        return false;
      }
      
      return true;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (formData.title.length > 200) {
      setError('Title must be 200 characters or less');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Submit the feature request with proper credentials
      const response = await fetch('http://192.168.100.63:10000/api/feature-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This is crucial for session cookies
        body: JSON.stringify(formData)
      });
      
      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        const requestId = responseData.data.id;
        
        // Upload files if any
        if (files.length > 0) {
          try {
            await featureRequestApi.uploadFiles(files, requestId);
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            // Don't fail the entire submission for file upload errors
            setError('Feature request submitted, but some files failed to upload.');
          }
        }
        
        setSuccess('Feature request submitted successfully!');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'enhancement',
          priority: 'medium',
          use_case: '',
          expected_outcome: '',
        });
        setFiles([]);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit feature request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feature-request-form-container">
      <div className="feature-request-form">
        <div className="form-header">
          <h1>Submit Feature Request</h1>
          <p>Have an idea to improve our platform? Share it with us!</p>
        </div>

        {error && (
          <div className="error-message">
            <i className="error-icon">⚠️</i>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <i className="success-icon">✅</i>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Brief description of your request"
              maxLength={200}
              required
            />
            <div className="char-count">{formData.title.length}/200</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category" className="form-label">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority" className="form-label">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="form-select"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Detailed description of your feature request"
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="use_case" className="form-label">Use Case</label>
            <textarea
              id="use_case"
              name="use_case"
              value={formData.use_case}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Describe how this feature would be used"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="expected_outcome" className="form-label">Expected Outcome</label>
            <textarea
              id="expected_outcome"
              name="expected_outcome"
              value={formData.expected_outcome}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="What results do you expect from this feature?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attachments</label>
            <div className="file-upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.zip"
                className="file-input"
              />
              <div className="file-upload-content">
                <div className="upload-icon">📎</div>
                <p>Click to upload files or drag and drop</p>
                <p className="file-types">
                  Supported: PDF, DOC, DOCX, TXT, PNG, JPG, GIF, ZIP (max 10MB each)
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="file-list">
                <h4>Selected Files:</h4>
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="remove-file-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeatureRequestForm;
