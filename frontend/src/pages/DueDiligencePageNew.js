import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './DueDiligencePage.css';

const API_BASE = 'http://localhost:10001/api';

const DueDiligencePage = () => {
  const [sections, setSections] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState(null);
  const [progressInfo, setProgressInfo] = useState('');
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [viewMode, setViewMode] = useState('sections'); // 'sections', 'consolidated', or 'upload'
  const [consolidatedReport, setConsolidatedReport] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  // New upload-related state
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    industry: 'Technology'
  });
  const [uploadStage, setUploadStage] = useState('info'); // 'info', 'files', 'processing'
  
  const reportRef = useRef(null);
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
      // Allow PDF, DOC, DOCX, TXT files
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return allowedTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only PDF, DOC, DOCX, and TXT files are allowed.');
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
      alert('Company name is required');
      return false;
    }
    if (uploadFiles.length === 0) {
      alert('Please upload at least one file');
      return false;
    }
    return true;
  };

  const uploadToN8n = async () => {
    if (!validateCompanyInfo()) return;

    setIsUploading(true);
    setUploadStage('processing');
    setProgressInfo('🔄 Preparing files for upload...');

    try {
      // Convert files to base64
      const filePromises = uploadFiles.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              size: file.size,
              type: file.type,
              content: reader.result, // Base64 data URL
              uploadPath: `/uploads/${companyInfo.companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}/${file.name}`
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      setProgressInfo('📄 Converting files to base64...');
      const processedFiles = await Promise.all(filePromises);

      setProgressInfo('🚀 Triggering n8n workflow...');

      // Prepare webhook data
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

      console.log('Sending webhook data to n8n:', webhookData);

      // Send to n8n webhook (assuming it's running on localhost:5678)
      const n8nResponse = await axios.post('http://localhost:5678/webhook/due-diligence-upload', webhookData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      });

      setProgressInfo('✅ Successfully triggered due diligence generation!');
      console.log('n8n Response:', n8nResponse.data);

      // Reset upload state and switch to viewing mode
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
        setViewMode('sections');
        setProgressInfo('');
        loadCompanies(); // Refresh companies list
      }, 3000);

    } catch (error) {
      console.error('Error uploading to n8n:', error);
      setProgressInfo(`❌ Error: ${error.response?.data?.message || error.message}`);
      
      // Show detailed error information
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Rest of the existing functions...
  const exportToPDF = async () => {
    setIsExportingPDF(true);
    setProgressInfo('🔄 Preparing report data for PDF export...');

    try {
      let reportData = null;
      let companyData = null;
      
      if (selectedCompanyId) {
        const sectionsResponse = await axios.get(`${API_BASE}/sections/${selectedCompanyId}`);
        if (sectionsResponse.data.success) {
          reportData = sectionsResponse.data.sections;
          companyData = sectionsResponse.data.company;
        }
      } else {
        const sectionsResponse = await axios.get(`${API_BASE}/sections`);
        if (sectionsResponse.data.success) {
          reportData = sectionsResponse.data.sections;
          companyData = sectionsResponse.data.company;
        }
      }

      if (!reportData || reportData.length === 0) {
        alert('No report data available to export. Please generate some sections first.');
        return;
      }

      setProgressInfo('📄 Generating PDF report...');

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '20mm';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '12px';
      tempContainer.style.lineHeight = '1.6';
      tempContainer.style.color = '#333333';

      let pdfContent = `
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #007bff; padding-bottom: 20px;">
          <h1 style="font-size: 28px; color: #007bff; margin: 0 0 10px 0; font-weight: bold;">
            Commercial Due Diligence Report
          </h1>
          ${companyData ? `<h2 style="font-size: 20px; color: #495057; margin: 0 0 10px 0;">${companyData.name}</h2>` : ''}
          <p style="color: #6c757d; margin: 0;">Generated: ${new Date().toLocaleDateString()}</p>
        </div>
      `;

      reportData.forEach((section, index) => {
        if (section.content && section.content.trim()) {
          pdfContent += `
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
              <h2 style="font-size: 18px; color: #007bff; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e9ecef;">
                ${section.title}
              </h2>
              <div style="font-size: 12px; line-height: 1.8; color: #333333;">
                ${section.content.replace(/\n/g, '<br>')}
              </div>
            </div>
          `;
        }
      });

      tempContainer.innerHTML = pdfContent;
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempContainer);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = companyData ? 
        `Due_Diligence_Report_${companyData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf` :
        `Due_Diligence_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      pdf.save(filename);
      setProgressInfo('✅ PDF exported successfully!');

    } catch (error) {
      console.error('PDF export error:', error);
      setProgressInfo('❌ Error exporting PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
      setTimeout(() => setProgressInfo(''), 3000);
    }
  };

  const renderUploadInterface = () => {
    return (
      <div className="upload-interface">
        <div className="upload-header">
          <h2>🚀 Generate Due Diligence Report</h2>
          <p>Upload company documents and information to generate a comprehensive due diligence report</p>
        </div>

        {uploadStage === 'info' && (
          <div className="company-info-section">
            <h3>1. Company Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="companyName">Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  value={companyInfo.companyName}
                  onChange={(e) => handleCompanyInfoChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="industry">Industry</label>
                <select
                  id="industry"
                  value={companyInfo.industry}
                  onChange={(e) => handleCompanyInfoChange('industry', e.target.value)}
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

              <div className="form-group">
                <label htmlFor="description">Company Description</label>
                <textarea
                  id="description"
                  value={companyInfo.description}
                  onChange={(e) => handleCompanyInfoChange('description', e.target.value)}
                  placeholder="Brief description of the company's business"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactEmail">Contact Email</label>
                <input
                  type="email"
                  id="contactEmail"
                  value={companyInfo.contactEmail}
                  onChange={(e) => handleCompanyInfoChange('contactEmail', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactPhone">Contact Phone</label>
                <input
                  type="tel"
                  id="contactPhone"
                  value={companyInfo.contactPhone}
                  onChange={(e) => handleCompanyInfoChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="websiteUrl">Website URL</label>
                <input
                  type="url"
                  id="websiteUrl"
                  value={companyInfo.websiteUrl}
                  onChange={(e) => handleCompanyInfoChange('websiteUrl', e.target.value)}
                  placeholder="https://www.company.com"
                />
              </div>
            </div>

            <div className="stage-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setUploadStage('files')}
                disabled={!companyInfo.companyName.trim()}
              >
                Next: Upload Files →
              </button>
            </div>
          </div>
        )}

        {uploadStage === 'files' && (
          <div className="files-upload-section">
            <h3>2. Upload Documents</h3>
            <p>Upload company documents (PDF, DOC, DOCX, TXT files)</p>

            <div className="file-upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
              />
              
              <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📁</div>
                <p>Click to select files or drag and drop</p>
                <p className="upload-hint">Supported: PDF, DOC, DOCX, TXT</p>
              </div>
            </div>

            {uploadFiles.length > 0 && (
              <div className="uploaded-files">
                <h4>Selected Files ({uploadFiles.length})</h4>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="stage-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setUploadStage('info')}
              >
                ← Back
              </button>
              <button 
                className="btn btn-success"
                onClick={uploadToN8n}
                disabled={uploadFiles.length === 0 || isUploading}
              >
                {isUploading ? '🔄 Processing...' : '🚀 Generate Report'}
              </button>
            </div>
          </div>
        )}

        {uploadStage === 'processing' && (
          <div className="processing-section">
            <h3>3. Processing</h3>
            <div className="progress-display">
              <div className="spinner"></div>
              <p>{progressInfo}</p>
            </div>
            
            <div className="processing-info">
              <h4>What's happening:</h4>
              <ul>
                <li>📄 Converting and processing uploaded files</li>
                <li>🧠 Extracting content using AI</li>
                <li>📊 Generating due diligence sections</li>
                <li>✅ Consolidating final report</li>
              </ul>
              <p><em>This process may take several minutes depending on file size and complexity.</em></p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Continue with the rest of the existing component...
  return (
    <div className="due-diligence-page">
      <div className="page-header">
        <h1>Due Diligence Generator</h1>
        <div className="view-controls">
          <button
            className={`btn ${viewMode === 'upload' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('upload')}
          >
            🚀 New Report
          </button>
          <button
            className={`btn ${viewMode === 'sections' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('sections')}
          >
            📋 View Reports
          </button>
          <button
            className={`btn ${viewMode === 'consolidated' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('consolidated')}
          >
            📄 Consolidated View
          </button>
        </div>
      </div>

      {progressInfo && (
        <div className="progress-bar">
          <div className="progress-info">{progressInfo}</div>
        </div>
      )}

      {viewMode === 'upload' && renderUploadInterface()}
      
      {viewMode === 'sections' && (
        <div className="sections-view">
          {/* Existing sections view code would go here */}
          <p>Sections view - existing functionality</p>
        </div>
      )}

      {viewMode === 'consolidated' && (
        <div className="consolidated-view">
          {/* Existing consolidated view code would go here */}
          <p>Consolidated view - existing functionality</p>
        </div>
      )}
    </div>
  );
};

export default DueDiligencePage;
