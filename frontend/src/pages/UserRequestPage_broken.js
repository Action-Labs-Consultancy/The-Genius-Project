/**
 * Simple Feature Request Form - User Page
 * Users can submit feature requests here with all required fields
 */

import React, { useState, useEffect } from 'react';
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
  const [debugInfo, setDebugInfo] = useState('');

  // Debug function to check cookies
  const checkCookies = () => {
    const cookies = document.cookie;
    const hasGeniusSession = cookies.includes('genius_session');
    console.log('🍪 All cookies:', cookies);
    console.log('🍪 Has genius_session:', hasGeniusSession);
    setDebugInfo(`Cookies: ${cookies.length > 0 ? 'Present' : 'None'} | Session: ${hasGeniusSession ? 'Yes' : 'No'}`);
  };

  // Check cookies when component mounts
  useEffect(() => {
    checkCookies();
  }, []);

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
      // First, verify we have a valid session
      console.log('🔒 Checking session before submitting request...');
      
      const sessionResponse = await fetch('http://192.168.100.63:10000/api/users/current', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!sessionResponse.ok) {
        console.error('🔒 Session check failed:', sessionResponse.status);
        setMessage('❌ Authentication required. Please refresh the page and log in again.');
        setIsSubmitting(false);
        return;
      }
      
      const sessionData = await sessionResponse.json();
      console.log('🔒 Session verified:', sessionData);

      // Submit the request with user info automatically attached
      const requestData = {
        ...formData,
        user_id: user?.id,
        user_name: user?.name,
        user_email: user?.email,
        status: 'Pending'
      };

      console.log('📝 Submitting request:', requestData);
      
      // Use direct fetch instead of featureRequestApi to ensure credentials are sent
      const submitResponse = await fetch('http://192.168.100.63:10000/api/feature-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify(requestData)
      });
      
      const submitData = await submitResponse.json();
      console.log('📝 Submit response:', submitResponse.status, submitData);
      
      if (submitResponse.ok && submitData.success) {
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
      
      {/* Debug Info */}
      {debugInfo && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#1565c0'
        }}>
          Debug: {debugInfo}
          <button 
            onClick={checkCookies}
            style={{
              marginLeft: '10px',
              padding: '2px 8px',
              fontSize: '11px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      )}
      
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
