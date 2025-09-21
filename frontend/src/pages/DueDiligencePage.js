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
  const [viewMode, setViewMode] = useState('sections'); // 'sections' or 'consolidated'
  const [consolidatedReport, setConsolidatedReport] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  const reportRef = useRef(null);

  const exportToPDF = async () => {
    setIsExportingPDF(true);
    setProgressInfo('🔄 Preparing report data for PDF export...');

    try {
      // First, fetch the complete report data including all generated sections
      let reportData = null;
      let companyData = null;
      
      if (selectedCompanyId) {
        // Fetch sections for the selected company
        const sectionsResponse = await axios.get(`${API_BASE}/sections/${selectedCompanyId}`);
        if (sectionsResponse.data.success) {
          reportData = sectionsResponse.data.sections;
          companyData = sectionsResponse.data.company;
        }
      } else {
        // Fetch general sections
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

      // Create a temporary container for PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '20mm';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '12px';
      tempContainer.style.lineHeight = '1.6';
      tempContainer.style.color = '#333333';

      // Build the PDF content HTML
      let pdfContent = `
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #007bff; padding-bottom: 20px;">
          <h1 style="font-size: 28px; color: #007bff; margin: 0 0 10px 0; font-weight: bold;">
            Commercial Due Diligence Report
          </h1>
          ${companyData ? `<h2 style="font-size: 20px; color: #495057; margin: 0 0 10px 0;">${companyData.name}</h2>` : ''}
          <p style="color: #6c757d; margin: 0;">Generated: ${new Date().toLocaleDateString()}</p>
        </div>
      `;

      // Add Table of Contents
      pdfContent += `
        <div style="margin-bottom: 40px;">
          <h3 style="color: #007bff; font-size: 18px; margin-bottom: 20px;">Table of Contents</h3>
          <ol style="margin: 0; padding-left: 20px;">
      `;
      
      reportData.forEach((section, index) => {
        const status = section.content && section.content.trim() ? '✅' : '⭕';
        pdfContent += `
          <li style="margin: 8px 0; line-height: 1.6;">
            <span style="margin-right: 8px;">${status}</span>
            ${section.name}
          </li>
        `;
      });
      
      pdfContent += `
          </ol>
        </div>
      `;

      // Add Executive Summary if we have content
      const completedSections = reportData.filter(s => s.content && s.content.trim());
      if (completedSections.length > 0) {
        pdfContent += `
          <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 40px;">
            <h2 style="color: #007bff; font-size: 20px; margin: 0 0 15px 0;">Executive Summary</h2>
            <p><strong>Report Status:</strong> ${completedSections.length} of ${reportData.length} sections completed</p>
            <p><strong>Company:</strong> ${companyData?.name || 'N/A'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `;
      }

      // Add each section
      reportData.forEach((section, index) => {
        pdfContent += `
          <div style="margin-bottom: 40px; page-break-inside: avoid;">
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
              <h2 style="color: #007bff; font-size: 20px; margin: 0; display: flex; align-items: center;">
                <span style="font-weight: bold; margin-right: 10px;">${section.id}.</span>
                ${section.name}
                <span style="margin-left: auto; font-size: 14px;">
                  ${section.content && section.content.trim() ? '✅' : '⭕'}
                </span>
              </h2>
            </div>
            <div style="min-height: 50px;">
        `;

        if (section.content && section.content.trim()) {
          // Clean and format the content for PDF
          let cleanContent = section.content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
            .replace(/style="[^"]*"/gi, '') // Remove inline styles
            .replace(/<h([1-6])/gi, '<h$1 style="color: #007bff; margin: 15px 0 10px 0;"')
            .replace(/<p>/gi, '<p style="margin: 0 0 12px 0; text-align: justify;">')
            .replace(/<ul>/gi, '<ul style="margin: 0 0 12px 20px;">')
            .replace(/<ol>/gi, '<ol style="margin: 0 0 12px 20px;">')
            .replace(/<li>/gi, '<li style="margin: 5px 0;">')
            .replace(/<table>/gi, '<table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #dee2e6;">')
            .replace(/<th>/gi, '<th style="border: 1px solid #dee2e6; padding: 8px; background: #f8f9fa; color: #007bff; font-weight: bold; text-align: left;">')
            .replace(/<td>/gi, '<td style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">')
            .replace(/<blockquote>/gi, '<blockquote style="border-left: 4px solid #007bff; margin: 15px 0; padding: 10px 15px; background: #f8f9fa; font-style: italic;">');

          pdfContent += cleanContent;
          
          if (section.generated_at) {
            pdfContent += `
              <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e9ecef; text-align: right;">
                <small style="color: #6c757d; font-style: italic;">
                  Generated: ${new Date(section.generated_at).toLocaleString()}
                </small>
              </div>
            `;
          }
        } else {
          pdfContent += `
            <div style="text-align: center; padding: 30px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; color: #6c757d;">
              <p style="margin: 0; font-style: italic;">This section has not been generated yet.</p>
            </div>
          `;
        }

        pdfContent += `
            </div>
          </div>
        `;
      });

      // Add footer
      pdfContent += `
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; text-align: center; margin-top: 40px;">
          <p style="margin: 0; color: #6c757d;">
            <strong>End of Report</strong><br>
            Generated by The Genius Project Due Diligence System<br>
            ${new Date().toLocaleString()}
          </p>
        </div>
      `;

      tempContainer.innerHTML = pdfContent;
      document.body.appendChild(tempContainer);

      setProgressInfo('🎨 Rendering PDF content...');

      // Configure html2canvas options for better PDF quality
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      setProgressInfo('📋 Creating PDF document...');

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scale to fit width with margins
      const margin = 10;
      const availableWidth = pdfWidth - (2 * margin);
      const availableHeight = pdfHeight - (2 * margin);
      
      const widthRatio = availableWidth / (imgWidth / 2); // Divide by 2 because of scale
      const heightRatio = availableHeight / (imgHeight / 2);
      const ratio = Math.min(widthRatio, heightRatio);
      
      const scaledWidth = (imgWidth / 2) * ratio;
      const scaledHeight = (imgHeight / 2) * ratio;
      
      // Center the image
      const x = (pdfWidth - scaledWidth) / 2;
      let y = margin;
      
      // If content is too tall, split into multiple pages
      const pageHeight = availableHeight;
      if (scaledHeight > pageHeight) {
        const totalPages = Math.ceil(scaledHeight / pageHeight);
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }
          
          const yOffset = -(page * pageHeight);
          pdf.addImage(imgData, 'PNG', x, yOffset + margin, scaledWidth, scaledHeight);
        }
      } else {
        // Single page
        pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      }
      
      // Generate filename
      const companyName = (companyData?.name || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Due_Diligence_Report_${companyName}_${dateStr}.pdf`;
      
      setProgressInfo('💾 Saving PDF file...');
      
      // Save PDF
      pdf.save(filename);
      
      setProgressInfo(`✅ PDF exported successfully: ${filename}`);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setProgressInfo('❌ Failed to export PDF');
      alert(`Failed to export PDF: ${error.message}`);
    } finally {
      setIsExportingPDF(false);
      setTimeout(() => setProgressInfo(''), 5000);
    }
  };

  // Load companies on component mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Load sections when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      loadSections(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const loadConsolidatedReport = async () => {
    if (!reportId) return;
    
    try {
      setProgressInfo('Loading consolidated report...');
      const response = await axios.get(`http://localhost:10001/api/reports/1/${reportId}/consolidated`);
      setConsolidatedReport(response.data);
      setProgressInfo('');
    } catch (error) {
      console.error('Error loading consolidated report:', error);
      setProgressInfo('Failed to load consolidated report');
    }
  };

  const regenerateConsolidatedReport = async () => {
    if (!reportId) return;
    
    try {
      setProgressInfo('Regenerating consolidated report...');
      await axios.post(`http://localhost:10001/api/reports/1/${reportId}/regenerate-consolidated`);
      await loadConsolidatedReport();
      setProgressInfo('Consolidated report updated!');
    } catch (error) {
      console.error('Error regenerating consolidated report:', error);
      setProgressInfo('Failed to regenerate consolidated report');
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE}/companies`);
      setCompanies(response.data);
      // Auto-select first company if available
      if (response.data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(response.data[0].id);
        setCompany(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      // Fallback to default sections if no companies
      loadDefaultSections();
    }
  };

  const loadSections = async (companyId) => {
    try {
      setProgressInfo('Loading sections...');
      const response = await axios.get(`${API_BASE}/sections`);
      
      // Create mock sections with status for display
      const sectionsData = response.data.map((section, index) => ({
        id: section.id,
        name: section.title,
        description: section.description,
        status: 'pending',
        content: null,
        generated_at: null
      }));

      setSections(sectionsData);
      
      // Create or get a report for this company
      try {
        const reportResponse = await axios.post(`${API_BASE}/reports`, {
          companyId: companyId,
          title: `Due Diligence Report - ${new Date().toLocaleDateString()}`
        });
        setReportId(reportResponse.data.id);
      } catch (reportError) {
        console.warn('Could not create report, using fallback ID');
        setReportId(Date.now());
      }
      
      setProgressInfo('');
    } catch (error) {
      console.error('Error loading sections:', error);
      loadDefaultSections();
      setProgressInfo('');
    }
  };

  const loadDefaultSections = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sections`);
      
      // Create mock sections with status for display
      const sectionsData = response.data.map((section, index) => ({
        id: section.id,
        name: section.title,
        description: section.description,
        status: 'pending',
        content: null,
        generated_at: null
      }));

      setSections(sectionsData);
      setReportId(Date.now());
      setProgressInfo('Loaded default sections');
    } catch (error) {
      console.error('Error loading default sections:', error);
      
      // Hard fallback
      const defaultSections = [
        { id: 'introduction_engagement_context', name: 'Introduction & Engagement Context', status: 'pending', content: null },
        { id: 'legal_disclaimers_reliance_limitations', name: 'Legal Disclaimers & Reliance Limitations', status: 'pending', content: null },
        { id: 'methodology_source_validation', name: 'Methodology & Source Validation', status: 'pending', content: null },
        { id: 'financial_trajectory_revenue_quality', name: 'Financial Trajectory & Revenue Quality', status: 'pending', content: null },
        { id: 'partnerships_ecosystem_alliances', name: 'Partnerships, Ecosystem & Alliances', status: 'pending', content: null },
        { id: 'intellectual_property_technology', name: 'Intellectual Property & Technology', status: 'pending', content: null },
        { id: 'governance_disclosures_risks', name: 'Governance, Disclosures & Risks', status: 'pending', content: null },
        { id: 'appendix_management_rfi', name: 'Appendix & Management RFI', status: 'pending', content: null }
      ];
      setSections(defaultSections);
      setReportId(Date.now());
      setProgressInfo('Failed to load sections');
    }
  };

  const createCompany = async () => {
    if (!newCompanyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    try {
      setProgressInfo('Creating company...');
      const response = await axios.post(`${API_BASE}/companies`, {
        companyName: newCompanyName,
        folderId: 'manual_entry',
        content: 'Created via frontend interface'
      });

      if (response.data.success) {
        setProgressInfo(`Company "${newCompanyName}" created successfully`);
        setNewCompanyName('');
        setShowCreateCompany(false);
        loadCompanies(); // Reload companies list
        setSelectedCompanyId(response.data.company.id);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      setProgressInfo('Failed to create company');
    }
  };

  const generateSection = async (sectionId) => {
    if (isGenerating) {
      alert('Already generating content. Please wait...');
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratingSection(sectionId);
      
      const section = sections.find(s => s.id === sectionId);
      setProgressInfo(`🤖 Generating "${section.name}" section...`);

      // Update section status immediately for UI feedback
      setSections(prev => prev.map(s => 
        s.id === sectionId 
          ? { ...s, status: 'generating' }
          : s
      ));

      // Get completed sections for context (those with sectionId less than current)
      const previousSections = sections
        .filter(s => s.id < sectionId && s.status === 'completed' && s.content)
        .map(s => ({
          id: s.id,
          name: s.name,
          content: s.content
        }));

      console.log(`📋 Using ${previousSections.length} previous sections as context`);

      // Call the generation API (which will try n8n webhook first, then fallback)
      const response = await axios.post(`${API_BASE}/generate`, {
        sectionId: sectionId,
        companyId: selectedCompanyId || (company ? company.id : null),
        userId: 'frontend_user',
        previousSections: previousSections
      });

      if (response.data.success) {
        if (response.data.workflowTriggered) {
          setProgressInfo(`✅ n8n workflow triggered for "${section.name}". Processing...`);
          
          // Poll for completion (n8n will update via webhook)
          pollForCompletion(sectionId, section.name);
        } else {
          // Content generated locally
          setProgressInfo(`✅ "${section.name}" generated successfully`);
          
          // Update the section with new content
          setSections(prev => prev.map(s => 
            s.id === sectionId 
              ? { 
                  ...s, 
                  content: response.data.section.content,
                  status: 'completed',
                  generated_at: response.data.section.generated_at
                }
              : s
          ));
        }
      } else {
        throw new Error(response.data.message || 'Generation failed');
      }

    } catch (error) {
      console.error('Error generating section:', error);
      setProgressInfo(`❌ Failed to generate section: ${error.response?.data?.message || error.message}`);
      
      // Reset section status on error
      setSections(prev => prev.map(s => 
        s.id === sectionId 
          ? { ...s, status: 'error' }
          : s
      ));
    } finally {
      setIsGenerating(false);
      setGeneratingSection(null);
    }
  };

  const pollForCompletion = async (sectionId, sectionName) => {
    const maxAttempts = 60; // 5 minutes (5 second intervals)
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        if (attempts > maxAttempts) {
          setProgressInfo(`⏰ Timeout waiting for "${sectionName}" completion`);
          return;
        }

        // Check if section was updated
        const companyId = selectedCompanyId || (company ? company.id : null);
        if (companyId) {
          const response = await axios.get(`${API_BASE}/sections/${companyId}/${sectionId}`);
          
          if (response.data.success && response.data.section.content) {
            // Section completed!
            setProgressInfo(`✅ "${sectionName}" completed via n8n workflow`);
            
            // Update sections
            setSections(prev => prev.map(s => 
              s.id === sectionId 
                ? { 
                    ...s, 
                    content: response.data.section.content,
                    status: 'completed',
                    generated_at: response.data.section.generated_at
                  }
                : s
            ));
            return;
          }
        }

        // Continue polling
        setTimeout(poll, 5000); // Poll every 5 seconds
        setProgressInfo(`🔄 Waiting for n8n workflow... (${attempts}/${maxAttempts})`);
        
      } catch (error) {
        console.error('Polling error:', error);
        setTimeout(poll, 5000);
      }
    };

    // Start polling after initial delay
    setTimeout(poll, 3000);
  };

  const generateAllSections = async () => {
    for (let i = 1; i <= sections.length; i++) {
      const section = sections.find(s => s.id === i);
      if (section && section.status !== 'completed') {
        await generateSection(i);
        // Wait a bit between generations
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'generating': return '#ffc107';
      case 'in_progress': return '#17a2b8';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'generating': return '🔄';
      case 'in_progress': return '⏳';
      case 'error': return '❌';
      default: return '⭕';
    }
  };

  const completedSections = sections.filter(s => s.status === 'completed').length;
  const totalSections = sections.length;
  const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  return (
    <div className="due-diligence-page">
      {/* Header */}
      <div className="dd-header">
        <div className="header-content">
          <h1>📄 Due Diligence Report</h1>
          <p>AI-powered commercial due diligence with n8n automation</p>
        </div>
        
        {/* Company Selection */}
        <div className="company-selection">
          <div className="company-controls">
            <select 
              value={selectedCompanyId} 
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              disabled={isGenerating}
            >
              <option value="">Select a company...</option>
              {companies.map(comp => (
                <option key={comp.company_id} value={comp.company_id}>
                  {comp.company_name} ({comp.status})
                </option>
              ))}
            </select>
            
            <button 
              className="btn-create-company"
              onClick={() => setShowCreateCompany(!showCreateCompany)}
              disabled={isGenerating}
            >
              ➕ New Company
            </button>
          </div>
          
          {showCreateCompany && (
            <div className="create-company-form">
              <input
                type="text"
                placeholder="Company name..."
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCompany()}
              />
              <button onClick={createCompany}>Create</button>
              <button onClick={() => setShowCreateCompany(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-info">
            <span className="company-name">
              {company ? `📊 ${company.name}` : '📊 Due Diligence Report'}
            </span>
            <span className="progress-text">
              {completedSections}/{totalSections} sections completed ({Math.round(progressPercentage)}%)
            </span>
            
            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button 
                className={`btn-view-mode ${viewMode === 'sections' ? 'active' : ''}`}
                onClick={() => setViewMode('sections')}
              >
                📋 Sections View
              </button>
              <button 
                className={`btn-view-mode ${viewMode === 'consolidated' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('consolidated');
                  if (!consolidatedReport) loadConsolidatedReport();
                }}
              >
                📄 Consolidated Report
              </button>
            </div>
            
            <button 
              className="btn-generate-all"
              onClick={generateAllSections}
              disabled={isGenerating}
            >
              🚀 Generate All
            </button>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          {progressInfo && (
            <div className="status-info">{progressInfo}</div>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="report-container" ref={reportRef}>
        <div className="report-header">
          <h1>Commercial Due Diligence Report</h1>
          {company && <h2>{company.name}</h2>}
          <p className="report-date">Generated: {new Date().toLocaleDateString()}</p>
          
          <div className="report-actions">
            <button 
              className="btn-export-pdf"
              onClick={exportToPDF}
              disabled={isExportingPDF || isGenerating}
              title="Export report as PDF"
            >
              {isExportingPDF ? '🔄 Generating PDF...' : '📄 Save as PDF'}
            </button>
            
            {viewMode === 'consolidated' && (
              <button 
                className="btn-regenerate-consolidated"
                onClick={regenerateConsolidatedReport}
                disabled={isGenerating}
              >
                🔄 Refresh Consolidated Report
              </button>
            )}
          </div>
        </div>

        {/* Consolidated Report View */}
        {viewMode === 'consolidated' ? (
          <div className="consolidated-report-view">
            {consolidatedReport ? (
              <div>
                <div className="consolidated-meta">
                  <p>
                    <strong>Sections Included:</strong> {consolidatedReport.sections_count} of {consolidatedReport.total_sections}
                  </p>
                  <p>
                    <strong>Last Updated:</strong> {new Date(consolidatedReport.updated_at).toLocaleString()}
                  </p>
                </div>
                <div 
                  className="consolidated-content"
                  dangerouslySetInnerHTML={{ __html: consolidatedReport.consolidated_report }}
                />
              </div>
            ) : (
              <div className="no-consolidated-content">
                <p><em>No consolidated report available yet. Generate some sections first.</em></p>
                <button 
                  className="btn-generate-consolidated"
                  onClick={loadConsolidatedReport}
                  disabled={isGenerating}
                >
                  📄 Generate Consolidated Report
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Sections View */
          <>
            {/* Table of Contents */}
            <div className="table-of-contents">
              <h3>Table of Contents</h3>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#section-${section.id}`} className="toc-link">
                      <span className="toc-status">
                        {getStatusIcon(section.status)}
                      </span>
                      {section.name}
                      {section.status !== 'completed' && (
                        <button 
                          className="btn-generate-inline"
                          onClick={() => generateSection(section.id)}
                          disabled={isGenerating}
                        >
                          Generate
                        </button>
                      )}
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            {/* Report Sections */}
            <div className="report-sections">
              {sections.map((section) => (
                <div key={section.id} id={`section-${section.id}`} className="report-section">
                  <div className="section-header">
                    <h2>
                      <span className="section-number">{section.id}.</span>
                      {section.name}
                      <span className="section-status" style={{ color: getStatusColor(section.status) }}>
                        {getStatusIcon(section.status)}
                      </span>
                    </h2>
                  </div>
                  
                  <div className="section-content">
                    {section.content ? (
                      <div 
                        className="content-html"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    ) : (
                      <div className="no-content">
                        <p><em>This section has not been generated yet.</em></p>
                        <button 
                          className="btn-generate-section"
                          onClick={() => generateSection(section.id)}
                          disabled={isGenerating || section.status === 'generating'}
                        >
                          {section.status === 'generating' ? '🔄 Generating...' : '🤖 Generate Section'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {section.generated_at && (
                    <div className="section-footer">
                      <small>Generated: {new Date(section.generated_at).toLocaleString()}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DueDiligencePage;
