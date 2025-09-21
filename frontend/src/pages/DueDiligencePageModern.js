import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './DueDiligencePageModern.css';

const API_BASE = 'http://localhost:10001/api';

const DueDiligencePage = () => {
  const [viewMode, setViewMode] = useState('upload');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progressInfo, setProgressInfo] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    industry: 'Technology'
  });
  const [uploadStage, setUploadStage] = useState('info');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE}/companies`);
      if (response.data.success) {
        setCompanies(response.data.companies);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return allowedTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      setProgressInfo('⚠️ Some files were skipped. Only PDF, DOC, DOCX, and TXT files are allowed.');
      setTimeout(() => setProgressInfo(''), 3000);
    }

    setUploadFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCompanyInfo = () => {
    if (!companyInfo.companyName.trim()) {
      setProgressInfo('❌ Company name is required');
      setTimeout(() => setProgressInfo(''), 3000);
      return false;
    }
    if (uploadFiles.length === 0) {
      setProgressInfo('❌ Please upload at least one file');
      setTimeout(() => setProgressInfo(''), 3000);
      return false;
    }
    return true;
  };

  const uploadToBackend = async () => {
    if (!validateCompanyInfo()) return;

    setIsUploading(true);
    setUploadStage('processing');
    setProgressInfo('🔄 Preparing files for upload...');

    try {
      const filePromises = uploadFiles.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              size: file.size,
              type: file.type,
              content: reader.result,
              uploadPath: `/uploads/${companyInfo.companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}/${file.name}`
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      setProgressInfo('📄 Converting files...');
      const processedFiles = await Promise.all(filePromises);

      setProgressInfo('🚀 Triggering report generation...');

      const webhookData = {
        requestId: `req_${Date.now()}`,
        companyInfo: {
          ...companyInfo,
          company_id: `comp_${Date.now()}_${companyInfo.companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
        },
        uploadedFiles: processedFiles,
        timestamp: new Date().toISOString(),
        source: 'website_upload'
      };

      // Send to backend first (which will forward to n8n)
      const response = await axios.post(`${API_BASE}/webhook/due-diligence-upload`, webhookData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      setProgressInfo('✅ Successfully started report generation!');
      
      // Set the generated report data
      setGeneratedReport({
        companyId: webhookData.companyInfo.company_id,
        companyName: companyInfo.companyName,
        status: 'processing',
        startedAt: new Date().toISOString(),
        filesCount: processedFiles.length
      });

      // Reset form and switch to results view
      setTimeout(() => {
        setUploadFiles([]);
        setCompanyInfo({
          companyName: '',
          description: '',
          contactEmail: '',
          contactPhone: '',
          websiteUrl: '',
          industry: 'Technology'
        });
        setUploadStage('info');
        setViewMode('results');
        setProgressInfo('');
        loadCompanies();
      }, 3000);

    } catch (error) {
      console.error('Error uploading:', error);
      setProgressInfo(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const refreshReport = async () => {
    if (!generatedReport?.companyId) return;
    
    try {
      setProgressInfo('🔄 Checking report status...');
      const response = await axios.get(`${API_BASE}/sections/${generatedReport.companyId}`);
      
      if (response.data.success) {
        setGeneratedReport(prev => ({
          ...prev,
          status: 'completed',
          sections: response.data.sections,
          completedAt: new Date().toISOString()
        }));
        setProgressInfo('✅ Report updated!');
        setTimeout(() => setProgressInfo(''), 2000);
      }
    } catch (error) {
      console.error('Error refreshing report:', error);
      setProgressInfo('❌ Error checking report status');
      setTimeout(() => setProgressInfo(''), 3000);
    }
  };

  const renderHero = () => (
    <div className="hero-section">
      <div className="hero-content">
        <div className="hero-icon">📊</div>
        <h1>AI-Powered Due Diligence Generator</h1>
        <p>Transform your business documents into comprehensive due diligence reports in minutes, not days.</p>
        <div className="hero-features">
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <span>AI-Powered Analysis</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Instant Processing</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📋</span>
            <span>Professional Reports</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUploadInterface = () => (
    <div className="upload-container">
      {uploadStage === 'info' && (
        <div className="step-container">
          <div className="step-header">
            <div className="step-number">1</div>
            <div className="step-info">
              <h3>Company Information</h3>
              <p>Tell us about the company you're analyzing</p>
            </div>
          </div>

          <div className="form-section">
            <div className="input-group">
              <label>Company Name *</label>
              <input
                type="text"
                value={companyInfo.companyName}
                onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
                placeholder="Enter company name"
                className="modern-input"
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Industry</label>
                <select
                  value={companyInfo.industry}
                  onChange={(e) => handleCompanyInfoChange('industry', e.target.value)}
                  className="modern-select"
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Energy">Energy</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="input-group">
                <label>Website</label>
                <input
                  type="url"
                  value={companyInfo.websiteUrl}
                  onChange={(e) => handleCompanyInfoChange('websiteUrl', e.target.value)}
                  placeholder="https://company.com"
                  className="modern-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Company Description</label>
              <textarea
                value={companyInfo.description}
                onChange={(e) => handleCompanyInfoChange('description', e.target.value)}
                placeholder="Brief description of the company's business model and operations"
                className="modern-textarea"
                rows={3}
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={companyInfo.contactEmail}
                  onChange={(e) => handleCompanyInfoChange('contactEmail', e.target.value)}
                  placeholder="contact@company.com"
                  className="modern-input"
                />
              </div>

              <div className="input-group">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={companyInfo.contactPhone}
                  onChange={(e) => handleCompanyInfoChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="modern-input"
                />
              </div>
            </div>

            <div className="step-actions">
              <button 
                className="btn-next"
                onClick={() => setUploadStage('files')}
                disabled={!companyInfo.companyName.trim()}
              >
                Continue to File Upload →
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadStage === 'files' && (
        <div className="step-container">
          <div className="step-header">
            <div className="step-number">2</div>
            <div className="step-info">
              <h3>Upload Documents</h3>
              <p>Upload company documents for analysis</p>
            </div>
          </div>

          <div className="upload-section">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
            />
            
            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-zone-content">
                <div className="upload-icon">📁</div>
                <h4>Drop files here or click to browse</h4>
                <p>Supports PDF, DOC, DOCX, and TXT files</p>
                <div className="upload-button">Choose Files</div>
              </div>
            </div>

            {uploadFiles.length > 0 && (
              <div className="files-list">
                <h4>Selected Files ({uploadFiles.length})</h4>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="file-card">
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-details">
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <span className="file-type">{file.type.split('/')[1].toUpperCase()}</span>
                      </div>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="step-actions">
              <button 
                className="btn-back"
                onClick={() => setUploadStage('info')}
              >
                ← Back
              </button>
              <button 
                className="btn-generate"
                onClick={uploadToBackend}
                disabled={uploadFiles.length === 0 || isUploading}
              >
                {isUploading ? '🔄 Processing...' : '🚀 Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadStage === 'processing' && (
        <div className="processing-container">
          <div className="processing-animation">
            <div className="spinner-large"></div>
          </div>
          <h3>Generating Your Report</h3>
          <p className="processing-status">{progressInfo}</p>
          <div className="processing-steps">
            <div className="process-step active">
              <span>📄</span> Analyzing Documents
            </div>
            <div className="process-step active">
              <span>🧠</span> AI Processing
            </div>
            <div className="process-step">
              <span>📊</span> Building Report
            </div>
            <div className="process-step">
              <span>✅</span> Complete
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="results-container">
      <div className="results-header">
        <h3>📊 Report Dashboard</h3>
        <button className="btn-refresh" onClick={refreshReport}>
          🔄 Refresh Status
        </button>
      </div>

      {generatedReport && (
        <div className="report-card">
          <div className="report-header">
            <div className="company-info">
              <h4>{generatedReport.companyName}</h4>
              <span className={`status-badge ${generatedReport.status}`}>
                {generatedReport.status === 'processing' ? '🔄 Processing' : '✅ Complete'}
              </span>
            </div>
            <div className="report-meta">
              <span>Files: {generatedReport.filesCount}</span>
              <span>Started: {new Date(generatedReport.startedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {generatedReport.sections && (
            <div className="sections-preview">
              <h5>Generated Sections:</h5>
              <div className="sections-grid">
                {generatedReport.sections.map((section, index) => (
                  <div key={index} className="section-card">
                    <div className="section-title">{section.title}</div>
                    <div className="section-status">
                      {section.content ? '✅ Complete' : '⏳ Pending'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="companies-list">
        <h4>Recent Reports</h4>
        {companies.length > 0 ? (
          companies.map((company, index) => (
            <div key={index} className="company-card">
              <div className="company-details">
                <h5>{company.name}</h5>
                <p>{company.industry} • {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'Unknown date'}</p>
              </div>
              <button 
                className="btn-view"
                onClick={() => setSelectedCompanyId(company.id)}
              >
                View Report
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No reports generated yet. Create your first report!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="due-diligence-modern">
      {renderHero()}
      
      <div className="main-content">
        <div className="nav-tabs">
          <button 
            className={`tab ${viewMode === 'upload' ? 'active' : ''}`}
            onClick={() => setViewMode('upload')}
          >
            🚀 Create Report
          </button>
          <button 
            className={`tab ${viewMode === 'results' ? 'active' : ''}`}
            onClick={() => setViewMode('results')}
          >
            📊 View Reports
          </button>
        </div>

        {progressInfo && (
          <div className={`progress-alert ${progressInfo.includes('❌') ? 'error' : progressInfo.includes('✅') ? 'success' : 'info'}`}>
            {progressInfo}
          </div>
        )}

        {viewMode === 'upload' && renderUploadInterface()}
        {viewMode === 'results' && renderResults()}
      </div>
    </div>
  );
};

export default DueDiligencePage;
