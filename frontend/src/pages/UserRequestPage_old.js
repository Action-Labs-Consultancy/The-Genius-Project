/**
 * Simple Feature Request Form - User Page
 * Users can submit feature requests here with all required fields
 */

import React, { useState } from 'react';
import { featureRequestApi } from '../api/featureRequestApi';

const UserRequestPage = ({ user }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'Medium',
    description: '',
    use_case: '',
    expected_outcome: '',
    files: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const categories = [
    'Frontend Enhancement',
    'Backend Feature',
    'UI/UX Improvement',
    'Performance Optimization',
    'Bug Fix',
    'Integration',
    'Security',
    'Documentation',
    'Other'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      files: Array.from(e.target.files)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.description) {
      setMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Submit the request with user info automatically attached
      const requestData = {
        ...formData,
        user_id: user?.id,
        user_name: user?.name,
        user_email: user?.email,
        status: 'Pending'
      };

      const response = await featureRequestApi.submitFeatureRequest(requestData);
      
      if (response.success) {
        setMessage('✅ Request submitted successfully!');
        // Reset form
        setFormData({
          title: '',
          category: '',
          priority: 'Medium',
          description: '',
          use_case: '',
          expected_outcome: '',
          files: []
        });
        // Clear file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setMessage('❌ Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>Submit Feature Request</h1>
      
      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '12px',
        border: '1px solid #e9ecef'
      }}>
        
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Brief description of your request"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
            Priority *
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows="5"
            placeholder="Detailed description of what you need"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Use Case */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
            Use Case
          </label>
          <textarea
            name="use_case"
            value={formData.use_case}
            onChange={handleInputChange}
            rows="3"
            placeholder="How will this feature be used? What problem does it solve?"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Expected Outcome */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
            Expected Outcome
          </label>
          <textarea
            name="expected_outcome"
            value={formData.expected_outcome}
            onChange={handleInputChange}
            rows="3"
            placeholder="What should happen when this feature is implemented?"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* File Upload */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
            Attachments (Optional)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.txt"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
          <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
            Supported formats: Images, PDFs, Word documents, Text files
          </small>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default UserRequestPage;
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Please log in to submit a request</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '20px auto', 
      padding: '20px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      color: '#fff'
    }}>
      <h1 style={{ color: '#FFD700', marginBottom: '20px' }}>💡 Submit Feature Request</h1>
      
      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.includes('✅') ? '#0f5132' : '#842029',
          border: message.includes('✅') ? '1px solid #badbcc' : '1px solid #f5c2c7'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#FFD700' }}>
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #444',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              fontSize: '16px'
            }}
            placeholder="Brief title for your request"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#FFD700' }}>
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            rows="5"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #444',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="Detailed description of your request"
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#FFD700' }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                fontSize: '16px'
              }}
            >
              <option value="enhancement">Enhancement</option>
              <option value="bug_fix">Bug Fix</option>
              <option value="new_feature">New Feature</option>
              <option value="ui_ux">UI/UX</option>
              <option value="performance">Performance</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#FFD700' }}>
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #444',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                fontSize: '16px'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: loading ? '#666' : '#FFD700',
            color: '#000',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default UserRequestPage;
