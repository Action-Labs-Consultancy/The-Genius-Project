import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import './DataImport.css';
import { API_ENDPOINTS } from '../config/api';

const DataImport = ({ onDataImported, isImporting, setIsImporting, user }) => {
  const [importedData, setImportedData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Validate required columns
          const requiredColumns = [
            'reportDate', 'registeredOnboarded', 'uniqueNationalityNonBahraini', 
            'linkedAccounts', 'totalAdvanceApplications', 'totalAdvanceApplicants',
            'totalAdvanceDisbursed', 'totalAdvanceApproved', 'totalAdvanceExpired',
            'advanceCaseLocked', 'totalAdvanceNotEligible', 'totalAdvanceRejection',
            'totalAdvanceCancelByCustomer', 'viewedOfferAS', 'rejectionReasonAS',
            'totalMicroFinancingApplications', 'totalMicroFinancingApplicants',
            'totalMicroDisbursed', 'totalMicroFinancingApproved', 'totalMicroExpired',
            'microCaseLocked', 'totalMicroNotEligible', 'totalMicroRejection',
            'totalMicroCancelByCustomer', 'rejectionReasonIF', 'totalCreditCardApplication',
            'totalCreditCardApplicants', 'totalCreditCardDisbursed', 'totalCreditCardApproved',
            'totalCreditCardExpired', 'creditCardCaseLocked', 'totalCreditCardNotEligible',
            'totalCreditCardRejection', 'totalCreditCardCancelByCustomer', 'rejectionReasonCC',
            'totalPersonalFinanceApplication', 'totalPersonalFinanceApplicants',
            'totalPersonalFinanceDisbursed', 'totalPersonalFinanceApproved',
            'totalPersonalFinanceExpired', 'PersonalFinanceCaseLocked',
            'totalPersonalFinanceNotEligible', 'totalPersonalFinanceRejection',
            'totalPersonalFinanceCancelByCustomer', 'rejectionReasonPf'
          ];
          
          if (jsonData.length > 0) {
            const fileColumns = Object.keys(jsonData[0]);
            const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));
            
            if (missingColumns.length > 0) {
              setImportMessage(`Missing required columns: ${missingColumns.join(', ')}`);
              return;
            }
          }
          
          // Process and format data
          const processedData = jsonData.map(row => ({
            ...row,
            reportDate: formatDate(row.reportDate),
            // Ensure numeric fields are numbers
            registeredOnboarded: Number(row.registeredOnboarded) || 0,
            uniqueNationalityNonBahraini: Number(row.uniqueNationalityNonBahraini) || 0,
            linkedAccounts: Number(row.linkedAccounts) || 0,
            totalAdvanceApplications: Number(row.totalAdvanceApplications) || 0,
            totalAdvanceApplicants: Number(row.totalAdvanceApplicants) || 0,
            totalAdvanceDisbursed: Number(row.totalAdvanceDisbursed) || 0,
            totalAdvanceApproved: Number(row.totalAdvanceApproved) || 0,
            totalAdvanceExpired: Number(row.totalAdvanceExpired) || 0,
            advanceCaseLocked: Number(row.advanceCaseLocked) || 0,
            totalAdvanceNotEligible: Number(row.totalAdvanceNotEligible) || 0,
            totalAdvanceRejection: Number(row.totalAdvanceRejection) || 0,
            totalAdvanceCancelByCustomer: Number(row.totalAdvanceCancelByCustomer) || 0,
            viewedOfferAS: Number(row.viewedOfferAS) || 0,
            totalMicroFinancingApplications: Number(row.totalMicroFinancingApplications) || 0,
            totalMicroFinancingApplicants: Number(row.totalMicroFinancingApplicants) || 0,
            totalMicroDisbursed: Number(row.totalMicroDisbursed) || 0,
            totalMicroFinancingApproved: Number(row.totalMicroFinancingApproved) || 0,
            totalMicroExpired: Number(row.totalMicroExpired) || 0,
            microCaseLocked: Number(row.microCaseLocked) || 0,
            totalMicroNotEligible: Number(row.totalMicroNotEligible) || 0,
            totalMicroRejection: Number(row.totalMicroRejection) || 0,
            totalMicroCancelByCustomer: Number(row.totalMicroCancelByCustomer) || 0,
            totalCreditCardApplication: Number(row.totalCreditCardApplication) || 0,
            totalCreditCardApplicants: Number(row.totalCreditCardApplicants) || 0,
            totalCreditCardDisbursed: Number(row.totalCreditCardDisbursed) || 0,
            totalCreditCardApproved: Number(row.totalCreditCardApproved) || 0,
            totalCreditCardExpired: Number(row.totalCreditCardExpired) || 0,
            creditCardCaseLocked: Number(row.creditCardCaseLocked) || 0,
            totalCreditCardNotEligible: Number(row.totalCreditCardNotEligible) || 0,
            totalCreditCardRejection: Number(row.totalCreditCardRejection) || 0,
            totalCreditCardCancelByCustomer: Number(row.totalCreditCardCancelByCustomer) || 0,
            totalPersonalFinanceApplication: Number(row.totalPersonalFinanceApplication) || 0,
            totalPersonalFinanceApplicants: Number(row.totalPersonalFinanceApplicants) || 0,
            totalPersonalFinanceDisbursed: Number(row.totalPersonalFinanceDisbursed) || 0,
            totalPersonalFinanceApproved: Number(row.totalPersonalFinanceApproved) || 0,
            totalPersonalFinanceExpired: Number(row.totalPersonalFinanceExpired) || 0,
            PersonalFinanceCaseLocked: Number(row.PersonalFinanceCaseLocked) || 0,
            totalPersonalFinanceNotEligible: Number(row.totalPersonalFinanceNotEligible) || 0,
            totalPersonalFinanceRejection: Number(row.totalPersonalFinanceRejection) || 0,
            totalPersonalFinanceCancelByCustomer: Number(row.totalPersonalFinanceCancelByCustomer) || 0
          }));
          
          setImportedData(processedData);
          setPreview(processedData.slice(0, 5)); // Show first 5 rows for preview
          setShowPreview(true);
          setImportMessage(`Successfully parsed ${processedData.length} rows from Excel file`);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          setImportMessage('Error parsing Excel file. Please check the format.');
        }
      };
      reader.readAsBinaryString(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    
    // Handle Excel date serial numbers
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Handle date strings
    const date = new Date(dateValue);
    return date.toISOString().split('T')[0];
  };

  const handleImport = async () => {
    if (importedData.length === 0) {
      setImportMessage('No data to import');
      return;
    }

    setIsImporting(true);
    setImportMessage('Importing data...');

    try {
      const response = await fetch(API_ENDPOINTS.IMPORT_DAILY_DATA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: importedData,
          userId: user?.id || 'default_user'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setImportMessage(`Successfully imported ${result.imported} rows, updated ${result.updated} existing rows`);
        setShowPreview(false);
        setImportedData([]);
        if (onDataImported) onDataImported(importedData);
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setImportMessage('Error importing data. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    setImportedData([]);
    setPreview([]);
    setShowPreview(false);
    setImportMessage('');
  };

  return (
    <div className="data-import">
      <div className="import-section">
        <h3>Import Daily Report</h3>
        <p className="import-description">
          Upload an Excel file with daily report data. Data will be appended to existing records, 
          with newer entries overwriting duplicates for the same date.
        </p>
        
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the Excel file here...</p>
          ) : (
            <div>
              <p>Drag & drop an Excel file here, or click to select</p>
              <p className="file-types">Supported formats: .xlsx, .xls</p>
            </div>
          )}
        </div>

        {importMessage && (
          <div className={`import-message ${importMessage.includes('Error') ? 'error' : 'success'}`}>
            {importMessage}
          </div>
        )}

        {showPreview && (
          <div className="preview-section">
            <h4>Data Preview (First 5 rows)</h4>
            <div className="preview-table">
              <table>
                <thead>
                  <tr>
                    <th>Report Date</th>
                    <th>Registered Onboarded</th>
                    <th>Non-Bahraini Users</th>
                    <th>Linked Accounts</th>
                    <th>Advance Applications</th>
                    <th>Advance Disbursed</th>
                    <th>Micro Applications</th>
                    <th>Micro Disbursed</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      <td>{row.reportDate}</td>
                      <td>{row.registeredOnboarded}</td>
                      <td>{row.uniqueNationalityNonBahraini}</td>
                      <td>{row.linkedAccounts}</td>
                      <td>{row.totalAdvanceApplications}</td>
                      <td>{row.totalAdvanceDisbursed}</td>
                      <td>{row.totalMicroFinancingApplications}</td>
                      <td>{row.totalMicroDisbursed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="preview-actions">
              <button 
                onClick={handleImport} 
                disabled={isImporting}
                className="import-btn"
              >
                {isImporting ? 'Importing...' : `Import ${importedData.length} rows`}
              </button>
              <button onClick={cancelImport} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataImport;
