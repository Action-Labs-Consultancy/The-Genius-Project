import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import './DataUpload.css';

const DataUpload = ({ onDataUploaded, isUploading, setIsUploading }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [fileName, setFileName] = useState('');

  const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Process each sheet
          const processedData = {};
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            processedData[sheetName] = jsonData;
          });
          
          // Extract key metrics from the data
          const extractedMetrics = extractMetricsFromExcel(processedData);
          resolve(extractedMetrics);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const extractMetricsFromExcel = (data) => {
    // This function extracts key metrics from the Excel data
    // Adapt this based on your actual Excel file structure
    const metrics = {
      date: new Date().toISOString().split('T')[0],
      storeVisits: 0,
      installs: 0,
      onboarded: 0,
      applications: 0,
      disbursedFinances: 0,
      adSpend: 0,
      newInstallations: 0,
      conversions: 0,
      rawData: data
    };

    // Extract data from the first sheet (assuming it's the main data sheet)
    const mainSheet = Object.values(data)[0];
    if (mainSheet && mainSheet.length > 0) {
      // Look for specific metrics in the Excel data
      mainSheet.forEach((row, index) => {
        if (Array.isArray(row) && row.length > 1) {
          const label = String(row[0]).toLowerCase();
          const value = parseFloat(row[1]) || 0;
          
          if (label.includes('store visits') || label.includes('store_visits')) {
            metrics.storeVisits = value;
          } else if (label.includes('installs') || label.includes('installations')) {
            metrics.installs = value;
          } else if (label.includes('onboard') || label.includes('onboarded')) {
            metrics.onboarded = value;
          } else if (label.includes('application') || label.includes('applications')) {
            metrics.applications = value;
          } else if (label.includes('disbursed') || label.includes('finances')) {
            metrics.disbursedFinances = value;
          } else if (label.includes('ad spend') || label.includes('advertising')) {
            metrics.adSpend = value;
          } else if (label.includes('new installation') || label.includes('new_installations')) {
            metrics.newInstallations = value;
          } else if (label.includes('conversion') || label.includes('conversions')) {
            metrics.conversions = value;
          }
        }
      });
    }

    return metrics;
  };

  const uploadToBackend = async (processedData) => {
    try {
      const response = await fetch('/api/dashboard/upload-daily-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: processedData,
          uploadDate: new Date().toISOString(),
          fileName: fileName
        })
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Processing Excel file...');

    try {
      // Step 1: Process Excel file
      setUploadProgress(20);
      const processedData = await processExcelFile(file);
      setPreviewData(processedData);
      
      // Step 2: Upload to backend
      setUploadStatus('Uploading to server...');
      setUploadProgress(40);
      
      const uploadResult = await uploadToBackend(processedData);
      
      // Step 3: Merge with existing data
      setUploadStatus('Merging with existing data...');
      setUploadProgress(60);
      
      // Step 4: Recalculate metrics
      setUploadStatus('Recalculating KPIs...');
      setUploadProgress(80);
      
      // Step 5: Update visualizations
      setUploadStatus('Updating visualizations...');
      setUploadProgress(100);
      
      setUploadStatus('Upload completed successfully!');
      
      // Notify parent component
      if (onDataUploaded) {
        onDataUploaded(uploadResult.mergedData);
      }
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);
      
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 3000);
    }
  }, [fileName, onDataUploaded, setIsUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="data-upload-container">
      <div className="upload-header">
        <h2>📊 Upload Daily Client Report</h2>
        <p>Upload your Excel file to automatically merge data and recalculate KPIs</p>
      </div>

      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="upload-icon">📁</div>
          {isUploading ? (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="upload-status">{uploadStatus}</p>
            </div>
          ) : (
            <>
              <p className="upload-text">
                {isDragActive ? 
                  'Drop your Excel file here...' : 
                  'Drag & drop your Excel file here, or click to browse'
                }
              </p>
              <p className="upload-subtext">
                Supported formats: .xlsx, .xls
              </p>
            </>
          )}
        </div>
      </div>

      {previewData && !isUploading && (
        <div className="data-preview">
          <h3>📋 Data Preview</h3>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Store Visits</span>
              <span className="preview-value">{previewData.storeVisits.toLocaleString()}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Installs</span>
              <span className="preview-value">{previewData.installs.toLocaleString()}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Applications</span>
              <span className="preview-value">{previewData.applications.toLocaleString()}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Disbursed Finances</span>
              <span className="preview-value">${previewData.disbursedFinances.toLocaleString()}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Ad Spend</span>
              <span className="preview-value">${previewData.adSpend.toLocaleString()}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Upload Date</span>
              <span className="preview-value">{previewData.date}</span>
            </div>
          </div>
        </div>
      )}

      <div className="upload-info">
        <h4>ℹ️ How it works:</h4>
        <ul>
          <li>🔄 <strong>Automatic Merging:</strong> New data replaces outdated information</li>
          <li>📊 <strong>KPI Recalculation:</strong> CAC, CPA, and other metrics are updated instantly</li>
          <li>📈 <strong>Real-time Visualizations:</strong> Charts and graphs update automatically</li>
          <li>⏰ <strong>Latest Data Priority:</strong> Most recent uploads take precedence</li>
        </ul>
      </div>
    </div>
  );
};

export default DataUpload;
