/**
 * Simple Feature Request Form - User Page
 * Black and Yellow Theme - No Session Dependencies
 */

import React, { useState } from 'react';

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
      // Direct fetch without session - just submit the request
      const response = await fetch('http://192.168.100.63:10000/api/feature-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_id: user?.id || 'user_' + Date.now(),
          user_name: user?.name || 'User',
          user_email: user?.email || 'user@example.com',
          status: 'Pending'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
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
      } else {
        setMessage('❌ Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setMessage('❌ Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#FFD700',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          color: '#FFD700', 
          marginBottom: '30px',
          textAlign: 'center',
          fontSize: '32px',
          fontWeight: '700'
        }}>
          Submit Feature Request
        </h1>
        
        {message && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.includes('✅') ? '#1a4d1a' : '#4d1a1a',
            color: message.includes('✅') ? '#90EE90' : '#FFB6C1',
            border: `2px solid ${message.includes('✅') ? '#32CD32' : '#FF4500'}`,
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '40px', 
          borderRadius: '12px',
          border: '2px solid #FFD700',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
        }}>
          
          {/* Title */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: '600', 
              color: '#FFD700',
              fontSize: '16px'
            }}>
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
                padding: '15px',
                border: '2px solid #333',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#2a2a2a',
                color: '#FFD700',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FFD700'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: '600', 
              color: '#FFD700',
              fontSize: '16px'
            }}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #333',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#2a2a2a',
                color: '#FFD700',
                outline: 'none'
              }}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat} style={{ backgroundColor: '#2a2a2a', color: '#FFD700' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: '600', 
              color: '#FFD700',
              fontSize: '16px'
            }}>
              Priority *
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #333',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#2a2a2a',
                color: '#FFD700',
                outline: 'none'
              }}
            >
              {priorities.map(priority => (
                <option key={priority} value={priority} style={{ backgroundColor: '#2a2a2a', color: '#FFD700' }}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: '600', 
              color: '#FFD700',
              fontSize: '16px'
            }}>
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
                padding: '15px',
                border: '2px solid #333',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#2a2a2a',
                color: '#FFD700',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'Inter, sans-serif'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FFD700'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </div>

          {/* Use Case */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: '600', 
              color: '#FFD700',
              fontSize: '16px'
            }}>
              Use Case
            </label>
            <textarea
              name="use_case"
              value={formData.use_case}
              onChange={handleInputChange}
              rows="4"
              placeholder="How will this feature be used? What problem does it solve?"
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #333',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#2a2a2a',
                color: '#FFD700',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'Inter, sans-serif'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FFD700'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </div>

          {/* Expected Outcome */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: '600', 
              color: '#FFD700',
              fontSize: '16px'
            }}>
              Expected Outcome
            </label>
            <textarea
              name="expected_outcome"
              value={formData.expected_outcome}
              onChange={handleInputChange}
              rows="4"
              placeholder="What should happen when this feature is implemented?"
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #333',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#2a2a2a',
                color: '#FFD700',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'Inter, sans-serif'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FFD700'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: '35px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: '600', 
              color: '#FFD700',
              fontSize: '16px'
            }}>
              Attachments (Optional)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.txt"
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #333',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#2a2a2a',
                color: '#FFD700',
                outline: 'none'
              }}
            />
            <small style={{ 
              color: '#FFD700', 
              marginTop: '8px', 
              display: 'block',
              opacity: '0.8'
            }}>
              Supported formats: Images, PDFs, Word documents, Text files
            </small>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? '#666' : '#FFD700',
              color: '#000000',
              padding: '18px 40px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'all 0.3s ease',
              boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(255, 215, 0, 0.4)',
              transform: isSubmitting ? 'none' : 'translateY(-2px)'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.backgroundColor = '#FFF700';
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.target.style.backgroundColor = '#FFD700';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
              }
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserRequestPage;
