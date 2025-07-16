import React, { useState } from 'react';

const DownloadReport = ({ data, insights, dateRange }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('summary');

  const generateReport = async () => {
    setIsGenerating(true);

    try {
      // Prepare report data
      const reportData = {
        title: 'Campaign Analytics Report',
        dateRange: `${dateRange.from} to ${dateRange.to}`,
        generatedAt: new Date().toISOString(),
        summary: {
          totalSpend: data?.kpis?.spendAmount || 0,
          cac: data?.kpis?.cac || 0,
          cpa: data?.kpis?.cpa || 0,
          achievementRatio: data?.kpis?.achievementRatio || 0,
          totalApplications: data?.funnel?.storeVisits || 0,
          disbursed: data?.funnel?.disbursed || 0
        },
        funnel: data?.funnel || {},
        budget: data?.budget || {},
        insights: insights || [],
        chartData: data?.chartData || [],
        recentUploads: data?.recentUploads || []
      };

      // Generate different report types
      if (reportType === 'detailed') {
        await generateDetailedReport(reportData);
      } else if (reportType === 'executive') {
        await generateExecutiveReport(reportData);
      } else {
        await generateSummaryReport(reportData);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSummaryReport = async (reportData) => {
    const csvContent = generateCSVReport(reportData);
    downloadFile(csvContent, 'campaign-summary-report.csv', 'text/csv');
  };

  const generateDetailedReport = async (reportData) => {
    const jsonContent = JSON.stringify(reportData, null, 2);
    downloadFile(jsonContent, 'campaign-detailed-report.json', 'application/json');
  };

  const generateExecutiveReport = async (reportData) => {
    const executiveContent = generateExecutiveCSV(reportData);
    downloadFile(executiveContent, 'executive-summary-report.csv', 'text/csv');
  };

  const generateCSVReport = (reportData) => {
    const headers = [
      'Metric',
      'Value',
      'Period',
      'Performance'
    ];

    const rows = [
      ['Total Spend', `$${reportData.summary.totalSpend}`, reportData.dateRange, 'Tracking'],
      ['Customer Acquisition Cost', `$${reportData.summary.cac}`, reportData.dateRange, 'Optimizing'],
      ['Cost per Application', `$${reportData.summary.cpa}`, reportData.dateRange, 'Monitoring'],
      ['Achievement Ratio', `${reportData.summary.achievementRatio}%`, reportData.dateRange, 'Target'],
      ['Total Applications', reportData.summary.totalApplications, reportData.dateRange, 'Growing'],
      ['Disbursed', reportData.summary.disbursed, reportData.dateRange, 'Converting'],
      ['Store Visits', reportData.funnel.storeVisits || 0, reportData.dateRange, 'Tracking'],
      ['Installs', reportData.funnel.installs || 0, reportData.dateRange, 'Converting'],
      ['Onboarded', reportData.funnel.onboard || 0, reportData.dateRange, 'Optimizing'],
      ['Linked Accounts', reportData.funnel.linked || 0, reportData.dateRange, 'Engaging'],
      ['Budget Monthly', `$${reportData.budget.monthly || 0}`, reportData.dateRange, 'Allocated'],
      ['Budget Balance', `$${reportData.budget.balance || 0}`, reportData.dateRange, 'Remaining']
    ];

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generateExecutiveCSV = (reportData) => {
    const headers = [
      'Executive Summary',
      'Key Metrics',
      'Performance Insights',
      'Recommendations'
    ];

    const rows = [
      ['Campaign Performance', `$${reportData.summary.totalSpend} spent`, `${reportData.summary.achievementRatio}% achievement`, 'Continue current strategy'],
      ['Customer Acquisition', `$${reportData.summary.cac} CAC`, `${reportData.summary.totalApplications} applications`, 'Focus on conversion optimization'],
      ['Funnel Performance', `${reportData.funnel.storeVisits} visits`, `${reportData.funnel.disbursed} disbursed`, 'Improve mid-funnel conversion'],
      ['Budget Utilization', `$${reportData.budget.monthly} allocated`, `$${reportData.budget.balance} remaining`, 'Optimize spend allocation']
    ];

    // Add insights
    reportData.insights.forEach((insight, index) => {
      rows.push([
        `Insight ${index + 1}`,
        insight.title,
        insight.message,
        insight.type === 'warning' ? 'Action Required' : 'Monitor'
      ]);
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="download-report">
      <h3>Download Campaign Report</h3>
      <p className="report-description">
        Generate comprehensive reports with calculated KPIs, metrics, and insights for client sharing.
      </p>

      <div className="report-options">
        <div className="report-type-selector">
          <label>Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="summary">Summary Report (CSV)</option>
            <option value="detailed">Detailed Report (JSON)</option>
            <option value="executive">Executive Summary (CSV)</option>
          </select>
        </div>

        <div className="report-details">
          {reportType === 'summary' && (
            <div className="report-info">
              <h4>📊 Summary Report</h4>
              <p>Key metrics, KPIs, and performance data in CSV format</p>
              <ul>
                <li>Campaign performance metrics</li>
                <li>Funnel conversion data</li>
                <li>Budget utilization</li>
                <li>Recent uploads summary</li>
              </ul>
            </div>
          )}

          {reportType === 'detailed' && (
            <div className="report-info">
              <h4>📈 Detailed Report</h4>
              <p>Complete dataset with all calculated metrics in JSON format</p>
              <ul>
                <li>Raw and calculated data</li>
                <li>AI insights and recommendations</li>
                <li>Historical trends</li>
                <li>Technical metrics</li>
              </ul>
            </div>
          )}

          {reportType === 'executive' && (
            <div className="report-info">
              <h4>🎯 Executive Summary</h4>
              <p>High-level overview optimized for stakeholder presentation</p>
              <ul>
                <li>Key performance indicators</li>
                <li>Strategic insights</li>
                <li>Recommendations</li>
                <li>Business impact metrics</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="report-preview">
        <h4>Report Preview</h4>
        <div className="preview-content">
          <div className="preview-section">
            <strong>Date Range:</strong> {dateRange.from} to {dateRange.to}
          </div>
          <div className="preview-section">
            <strong>Total Spend:</strong> ${data?.kpis?.spendAmount?.toLocaleString() || 0}
          </div>
          <div className="preview-section">
            <strong>Achievement Ratio:</strong> {data?.kpis?.achievementRatio?.toFixed(1) || 0}%
          </div>
          <div className="preview-section">
            <strong>Insights:</strong> {insights?.length || 0} AI-generated recommendations
          </div>
          <div className="preview-section">
            <strong>Data Points:</strong> {data?.recentUploads?.length || 0} recent uploads
          </div>
        </div>
      </div>

      <button
        className="download-button"
        onClick={generateReport}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <span className="spinner"></span>
            Generating Report...
          </>
        ) : (
          <>
            <span className="download-icon">📥</span>
            Download {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
          </>
        )}
      </button>

      <div className="report-footer">
        <p><strong>Note:</strong> This report contains calculated, merged data ready for client sharing, not raw upload data.</p>
      </div>
    </div>
  );
};

export default DownloadReport;
