import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './DataExport.css';

const DataExport = ({ dashboardData, dateRange }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const generateExcelReport = () => {
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: KPI Summary
    const kpiData = [
      ['Key Performance Indicators', ''],
      ['Report Date', new Date().toLocaleDateString()],
      ['Date Range', `${dateRange.from} to ${dateRange.to}`],
      [''],
      ['Metric', 'Value'],
      ['Premises Disbursed', dashboardData.kpis?.premisesDisbursed || 0],
      ['Achievement Ratio (%)', dashboardData.kpis?.achievementRatio || 0],
      ['Customer Acquisition Cost (CAC)', dashboardData.kpis?.cac || 0],
      ['Cost per Application (CPA)', dashboardData.kpis?.cpa || 0],
      ['Total Ad Spend', dashboardData.kpis?.spendAmount || 0],
      ['TV Spend', dashboardData.kpis?.tvSpend || 0],
      ['TV Reach', dashboardData.kpis?.tvReach || 0]
    ];
    
    const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPI Summary');
    
    // Sheet 2: Conversion Funnel
    const funnelData = [
      ['Conversion Funnel Analysis', ''],
      [''],
      ['Stage', 'Count', 'Conversion Rate (%)'],
      ['Store Visits', dashboardData.funnel?.storeVisits || 0, '100.00'],
      ['Installs', dashboardData.funnel?.installs || 0, 
       dashboardData.funnel?.storeVisits ? 
       ((dashboardData.funnel.installs / dashboardData.funnel.storeVisits) * 100).toFixed(2) : '0.00'],
      ['Onboarded', dashboardData.funnel?.onboard || 0,
       dashboardData.funnel?.installs ? 
       ((dashboardData.funnel.onboard / dashboardData.funnel.installs) * 100).toFixed(2) : '0.00'],
      ['Linked', dashboardData.funnel?.linked || 0,
       dashboardData.funnel?.onboard ? 
       ((dashboardData.funnel.linked / dashboardData.funnel.onboard) * 100).toFixed(2) : '0.00'],
      ['Disbursed', dashboardData.funnel?.disbursed || 0,
       dashboardData.funnel?.linked ? 
       ((dashboardData.funnel.disbursed / dashboardData.funnel.linked) * 100).toFixed(2) : '0.00']
    ];
    
    const funnelSheet = XLSX.utils.aoa_to_sheet(funnelData);
    XLSX.utils.book_append_sheet(workbook, funnelSheet, 'Conversion Funnel');
    
    // Sheet 3: Budget Analysis
    const budgetData = [
      ['Budget Analysis', ''],
      [''],
      ['Item', 'Amount (USD)'],
      ['Monthly Budget', dashboardData.budget?.monthly || 0],
      ['Daily Budget', dashboardData.budget?.daily || 0],
      ['Current Balance', dashboardData.budget?.balance || 0],
      [''],
      ['Budget Breakdown by Category', ''],
      ['Category', 'Amount', 'Percentage']
    ];
    
    if (dashboardData.budget?.breakdown) {
      dashboardData.budget.breakdown.forEach(item => {
        budgetData.push([item.category, item.amount, `${item.percentage}%`]);
      });
    }
    
    const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
    XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget Analysis');
    
    // Sheet 4: Top Performing Ads
    const adsData = [
      ['Top Performing Ads', ''],
      [''],
      ['Ad ID', 'Caption', 'Views', 'CTR (%)', 'Installs', 'CPI', 'Likes', 'Comments', 'Shares']
    ];
    
    if (dashboardData.topAds) {
      dashboardData.topAds.forEach(ad => {
        adsData.push([
          ad.id || 'N/A',
          ad.caption || 'N/A',
          ad.views || 0,
          ad.ctr || 0,
          ad.installs || 0,
          ad.cpi || 0,
          ad.engagement?.likes || 0,
          ad.engagement?.comments || 0,
          ad.engagement?.shares || 0
        ]);
      });
    }
    
    const adsSheet = XLSX.utils.aoa_to_sheet(adsData);
    XLSX.utils.book_append_sheet(workbook, adsSheet, 'Top Ads');
    
    // Sheet 5: Content Performance
    const contentData = [
      ['Content Performance', ''],
      [''],
      ['Content ID', 'Title', 'Type', 'Views', 'Reach', 'CTR (%)', 'Likes', 'Comments', 'Shares']
    ];
    
    if (dashboardData.topContent) {
      dashboardData.topContent.forEach(content => {
        contentData.push([
          content.id || 'N/A',
          content.title || 'N/A',
          content.type || 'N/A',
          content.views || 0,
          content.reach || 0,
          content.ctr || 0,
          content.engagement?.likes || 0,
          content.engagement?.comments || 0,
          content.engagement?.shares || 0
        ]);
      });
    }
    
    const contentSheet = XLSX.utils.aoa_to_sheet(contentData);
    XLSX.utils.book_append_sheet(workbook, contentSheet, 'Content Performance');
    
    // Sheet 6: Department Performance
    const deptData = [
      ['Department Performance', ''],
      [''],
      ['Department', 'Budget', 'Spent', 'Performance (%)']
    ];
    
    if (dashboardData.departmentData) {
      Object.entries(dashboardData.departmentData).forEach(([dept, data]) => {
        deptData.push([
          dept.charAt(0).toUpperCase() + dept.slice(1),
          data.budget || 0,
          data.spent || 0,
          data.performance || 0
        ]);
      });
    }
    
    const deptSheet = XLSX.utils.aoa_to_sheet(deptData);
    XLSX.utils.book_append_sheet(workbook, deptSheet, 'Department Performance');
    
    // Sheet 7: Conversion Rates Timeline
    const timelineData = [
      ['Monthly Conversion Rates', ''],
      [''],
      ['Conversion Step', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    ];
    
    if (dashboardData.conversionRates) {
      dashboardData.conversionRates.forEach(rate => {
        timelineData.push([
          rate.step || 'N/A',
          `${rate.jan || 0}%`,
          `${rate.feb || 0}%`,
          `${rate.mar || 0}%`,
          `${rate.apr || 0}%`,
          `${rate.may || 0}%`,
          `${rate.jun || 0}%`
        ]);
      });
    }
    
    const timelineSheet = XLSX.utils.aoa_to_sheet(timelineData);
    XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Conversion Timeline');
    
    return workbook;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('Generating Excel report...');
    
    try {
      // Generate the workbook
      const workbook = generateExcelReport();
      
      setExportStatus('Formatting data...');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });
      
      setExportStatus('Preparing download...');
      
      // Create blob and download
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      setExportStatus('Download completed!');
      
      setTimeout(() => {
        setIsExporting(false);
        setExportStatus('');
      }, 2000);
      
    } catch (error) {
      setExportStatus(`Error: ${error.message}`);
      setTimeout(() => {
        setIsExporting(false);
        setExportStatus('');
      }, 3000);
    }
  };

  return (
    <div className="data-export-container">
      <div className="export-header">
        <h3>📊 Download Excel Report</h3>
        <p>Export your dashboard data in Excel format for sharing and analysis</p>
      </div>
      
      <div className="export-content">
        <div className="export-info">
          <h4>📋 Report Contents:</h4>
          <ul>
            <li>📈 KPI Summary with all key metrics</li>
            <li>🔄 Conversion Funnel analysis</li>
            <li>💰 Budget breakdown by category</li>
            <li>🎯 Top performing ads with engagement</li>
            <li>📱 Content performance metrics</li>
            <li>🏢 Department performance overview</li>
            <li>📊 Monthly conversion timeline</li>
          </ul>
        </div>
        
        <div className="export-action">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={`export-button ${isExporting ? 'exporting' : ''}`}
          >
            {isExporting ? (
              <>
                <span className="export-spinner"></span>
                Generating...
              </>
            ) : (
              <>
                📥 Download Report
              </>
            )}
          </button>
          
          {exportStatus && (
            <p className={`export-status ${exportStatus.includes('Error') ? 'error' : 'success'}`}>
              {exportStatus}
            </p>
          )}
        </div>
      </div>
      
      <div className="export-features">
        <div className="feature-item">
          <span className="feature-icon">🔄</span>
          <div className="feature-text">
            <strong>Auto-Formatted</strong>
            <p>Professional Excel layout matching your existing reports</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📊</span>
          <div className="feature-text">
            <strong>Multiple Sheets</strong>
            <p>Organized data across different sheets for easy analysis</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📈</span>
          <div className="feature-text">
            <strong>Ready for Sharing</strong>
            <p>Perfect for client presentations and internal reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
