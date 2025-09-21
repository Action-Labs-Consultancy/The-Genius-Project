import React, { useState } from 'react';
import '../styles/ClientWizard.css';

const ClientCreationWizard = ({ user, onClose, onClientCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState({
    companyName: '',
    scopeOfWork: '',
    pricing: '',
    termsAndConditions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;
  const stepTitles = [
    'Company Information',
    'Scope of Work',
    'Pricing Details',
    'Terms & Conditions'
  ];

  // Allow all users to create clients (remove role restriction)
  // No role checking needed anymore

  // Remove the access denied check - everyone can add clients now

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field, value) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Submit to client-requests endpoint for HR approval
      const response = await fetch('http://localhost:10000/api/client-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: clientData.companyName,
          company: clientData.companyName,
          email: '', // Can be added later
          phone: '', // Can be added later
          status: 'active',
          scopeOfWork: clientData.scopeOfWork,
          pricing: clientData.pricing,
          terms: clientData.termsAndConditions,
          requestedBy: user.name || user.email || 'User',
          description: clientData.scopeOfWork,
          created_by: user.id,
          created_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('✅ Client request submitted successfully! HR will review and approve your request.');
        onClientCreated && onClientCreated();
        onClose();
      } else {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Input not valid')) {
          setError(`Request validation failed: ${errorData.details || 'Please ensure all fields are properly filled.'}`);
        } else {
          setError(errorData.error || 'Failed to submit client request. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error submitting client request:', err);
      setError('Failed to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return clientData.companyName.trim().length > 0;
      case 2:
        return clientData.scopeOfWork.trim().length > 0;
      case 3:
        return clientData.pricing.trim().length > 0;
      case 4:
        return clientData.termsAndConditions.trim().length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>What's the company name?</h3>
            <p>Enter the full legal name of the client company</p>
            <input
              type="text"
              placeholder="e.g., Acme Corporation Ltd."
              value={clientData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="wizard-input"
              autoFocus
            />
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h3>Scope of Work</h3>
            <p>Describe what services we'll be providing to this client</p>
            <textarea
              placeholder="e.g., Digital marketing strategy, social media management, content creation..."
              value={clientData.scopeOfWork}
              onChange={(e) => handleInputChange('scopeOfWork', e.target.value)}
              className="wizard-textarea"
              rows="6"
              autoFocus
            />
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h3>Pricing Details</h3>
            <p>Enter the pricing structure and payment terms</p>
            <textarea
              placeholder="e.g., $5,000/month retainer + $150/hour for additional work"
              value={clientData.pricing}
              onChange={(e) => handleInputChange('pricing', e.target.value)}
              className="wizard-textarea"
              rows="4"
              autoFocus
            />
          </div>
        );
      case 4:
        return (
          <div className="step-content">
            <h3>Terms & Conditions</h3>
            <p>Specify important terms, conditions, and deliverables</p>
            <textarea
              placeholder="e.g., 30-day payment terms, monthly reporting, 3-month minimum commitment..."
              value={clientData.termsAndConditions}
              onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
              className="wizard-textarea"
              rows="6"
              autoFocus
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-container">
        <div className="wizard-header">
          <button onClick={onClose} className="close-btn">×</button>
          <h2>Add New Client</h2>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <span className="progress-text">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>

        <div className="wizard-body">
          <div className="step-indicator">
            {stepTitles.map((title, index) => (
              <div 
                key={index}
                className={`step-item ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
              >
                <div className="step-circle">
                  {index + 1 < currentStep ? '✓' : index + 1}
                </div>
                <span className="step-title">{title}</span>
              </div>
            ))}
          </div>

          <div className="wizard-content">
            {renderStepContent()}
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="wizard-footer">
          <button 
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="btn-secondary"
          >
            Previous
          </button>
          
          {currentStep < totalSteps ? (
            <button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="btn-primary"
            >
              {loading ? 'Submitting Request...' : 'Submit for HR Approval'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientCreationWizard;
