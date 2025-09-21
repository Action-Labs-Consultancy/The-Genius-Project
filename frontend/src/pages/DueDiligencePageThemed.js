import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './DueDiligencePageThemed.css';

const API_BASE = 'http://localhost:10002/api';

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
    <div className="hero-section-themed">
      <div className="hero-content-themed">
        <div className="hero-icon-themed">🧠</div>
        <h1>AI Due Diligence Generator</h1>
        <p>Powered by advanced AI to analyze your business documents and generate comprehensive due diligence reports in minutes.</p>
        <div className="hero-features-themed">
          <div className="feature-themed">
            <span className="feature-icon-themed">⚡</span>
            <span>Lightning Fast</span>
          </div>
          <div className="feature-themed">
            <span className="feature-icon-themed">🤖</span>
            <span>AI-Powered</span>
          </div>
          <div className="feature-themed">
            <span className="feature-icon-themed">📊</span>
            <span>Professional Reports</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUploadInterface = () => (
    <div className="upload-container-themed">
      {uploadStage === 'info' && (
        <div className="step-container-themed">
          <div className="step-header-themed">
            <div className="step-number-themed">1</div>
            <div className="step-info-themed">
              <h3>Company Information</h3>
              <p>Provide company details for accurate analysis</p>
            </div>
          </div>

          <div className="form-section-themed">
            <div className="input-group-themed">
              <label>Company Name *</label>
              <input
                type="text"
                value={companyInfo.companyName}
                onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
                placeholder="Enter company name"
                className="themed-input"
              />
            </div>

            <div className="input-row-themed">
              <div className="input-group-themed">
                <label>Industry</label>
                <select
                  value={companyInfo.industry}
                  onChange={(e) => handleCompanyInfoChange('industry', e.target.value)}
                  className="themed-select"
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

              <div className="input-group-themed">
                <label>Website</label>
                <input
                  type="url"
                  value={companyInfo.websiteUrl}
                  onChange={(e) => handleCompanyInfoChange('websiteUrl', e.target.value)}
                  placeholder="https://company.com"
                  className="themed-input"
                />
              </div>
            </div>

            <div className="input-group-themed">
              <label>Company Description</label>
              <textarea
                value={companyInfo.description}
                onChange={(e) => handleCompanyInfoChange('description', e.target.value)}
                placeholder="Brief description of the company's business model and operations"
                className="themed-textarea"
                rows={3}
              />
            </div>

            <div className="input-row-themed">
              <div className="input-group-themed">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={companyInfo.contactEmail}
                  onChange={(e) => handleCompanyInfoChange('contactEmail', e.target.value)}
                  placeholder="contact@company.com"
                  className="themed-input"
                />
              </div>

              <div className="input-group-themed">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  value={companyInfo.contactPhone}
                  onChange={(e) => handleCompanyInfoChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="themed-input"
                />
              </div>
            </div>

            <div className="step-actions-themed">
              <button 
                className="btn-next-themed"
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
        <div className="step-container-themed">
          <div className="step-header-themed">
            <div className="step-number-themed">2</div>
            <div className="step-info-themed">
              <h3>Upload Documents</h3>
              <p>Upload company documents for AI analysis</p>
            </div>
          </div>

          <div className="upload-section-themed">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
            />
            
            <div className="upload-zone-themed" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-zone-content-themed">
                <div className="upload-icon-themed">📁</div>
                <h4>Drop files here or click to browse</h4>
                <p>Supports PDF, DOC, DOCX, and TXT files</p>
                <div className="upload-button-themed">Choose Files</div>
              </div>
            </div>

            {uploadFiles.length > 0 && (
              <div className="files-list-themed">
                <h4>Selected Files ({uploadFiles.length})</h4>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="file-card-themed">
                    <div className="file-info-themed">
                      <div className="file-name-themed">{file.name}</div>
                      <div className="file-details-themed">
                        <span className="file-size-themed">{formatFileSize(file.size)}</span>
                        <span className="file-type-themed">{file.type.split('/')[1].toUpperCase()}</span>
                      </div>
                    </div>
                    <button 
                      className="remove-btn-themed"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="step-actions-themed">
              <button 
                className="btn-back-themed"
                onClick={() => setUploadStage('info')}
              >
                ← Back
              </button>
              <button 
                className="btn-generate-themed"
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
        <div className="processing-container-themed">
          <div className="processing-animation-themed">
            <div className="spinner-large-themed"></div>
          </div>
          <h3>AI is analyzing your documents...</h3>
          <p className="processing-status-themed">{progressInfo}</p>
          <div className="processing-steps-themed">
            <div className="process-step-themed active">
              <span>📄</span> Document Analysis
            </div>
            <div className="process-step-themed active">
              <span>🧠</span> AI Processing
            </div>
            <div className="process-step-themed">
              <span>📊</span> Report Building
            </div>
            <div className="process-step-themed">
              <span>✅</span> Complete
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="results-container-themed">
      <div className="results-header-themed">
        <h3>📊 Report Dashboard</h3>
        <button className="btn-refresh-themed" onClick={refreshReport}>
          🔄 Refresh Status
        </button>
      </div>

      {generatedReport && (
        <div className="report-card-themed">
          <div className="report-header-themed">
            <div className="company-info-themed">
              <h4>{generatedReport.companyName}</h4>
              <span className={`status-badge-themed ${generatedReport.status}`}>
                {generatedReport.status === 'processing' ? '🔄 Processing' : '✅ Complete'}
              </span>
            </div>
            <div className="report-meta-themed">
              <span>Files: {generatedReport.filesCount}</span>
              <span>Started: {new Date(generatedReport.startedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          {generatedReport.sections && (
            <div className="sections-preview-themed">
              <h5>Generated Sections:</h5>
              <div className="sections-grid-themed">
                {generatedReport.sections.map((section, index) => (
                  <div key={index} className="section-card-themed">
                    <div className="section-title-themed">{section.title}</div>
                    <div className="section-status-themed">
                      {section.content ? '✅ Complete' : '⏳ Pending'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="companies-list-themed">
        <h4>Recent Reports</h4>
        {companies.length > 0 ? (
          companies.map((company, index) => (
            <div key={index} className="company-card-themed">
              <div className="company-details-themed">
                <h5>{company.name}</h5>
                <p>{company.industry} • {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'Unknown date'}</p>
              </div>
              <button 
                className="btn-view-themed"
                onClick={() => setSelectedCompanyId(company.id)}
              >
                View Report
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state-themed">
            <p>No reports generated yet. Create your first report!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="due-diligence-themed">
      {renderHero()}
      
      <div className="main-content-themed">
        <div className="nav-tabs-themed">
          <button 
            className={`tab-themed ${viewMode === 'upload' ? 'active' : ''}`}
            onClick={() => setViewMode('upload')}
          >
            🚀 Create Report
          </button>
          <button 
            className={`tab-themed ${viewMode === 'results' ? 'active' : ''}`}
            onClick={() => setViewMode('results')}
          >
            📊 View Reports
          </button>
        </div>

        {progressInfo && (
          <div className={`progress-alert-themed ${progressInfo.includes('❌') ? 'error' : progressInfo.includes('✅') ? 'success' : 'info'}`}>
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
