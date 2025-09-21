import React, { useState, useMemo } from 'react';
import { 
  TrendingUpIcon, 
  UploadIcon, 
  DownloadIcon, 
  FilterIcon, 
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BarChart2Icon,
  TargetIcon,
  TagIcon,
  CalendarIcon,
  SearchIcon,
  RefreshCwIcon
} from 'lucide-react';

const ReforgeGrowthDashboard = ({ user }) => {
  const [uploadedData, setUploadedData] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [funnelFilter, setFunnelFilter] = useState('all');
  const [productFilters, setProductFilters] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Demo data for marketing campaigns
  const demoData = [
    {
      id: 1,
      marketingFunnelStage: 'Awareness',
      reforgeGrowthStage: 'Launch - New Product',
      platforms: ['Meta', 'TikTok', 'Instagram'],
      products: ['Advance Salary', 'Personal Finance'],
      formats: ['Video Content', 'Carousel Ads'],
      formatTypes: ['UGC', 'Professional'],
      contentMetadata: {
        contentType: 'Educational Video Series',
        targetIntent: 'Problem Awareness',
        channelAlignment: 'Social Media',
        campaignGoals: 'Brand Recognition & Education',
        primaryObjective: 'Increase financial literacy awareness',
        secondaryGoals: ['Drive app downloads', 'Build brand trust']
      },
      targeting: {
        audienceSegments: ['Young Professionals', 'Financial Newcomers'],
        demographics: '25-35 years, urban professionals',
        geographic: 'UAE, Saudi Arabia'
      },
      expectedPerformance: {
        ctr: '2.8%',
        conversionRate: '4.2%'
      },
      whatYouDid: 'Created comprehensive educational video series explaining salary advance benefits, featuring real user testimonials and financial expert interviews.',
      microMetrics: ['Video Completion Rate: 78%', 'Engagement Rate: 5.2%', 'Share Rate: 2.1%'],
      dateRange: 'Jan 15-31, 2025',
      campaignType: 'Brand Awareness',
      productType: 'Financial Services',
      status: 'active'
    },
    {
      id: 2,
      marketingFunnelStage: 'Download + Registration',
      reforgeGrowthStage: 'Growth - Scale Channel',
      platforms: ['Google', 'Meta', 'LinkedIn'],
      products: ['Micro-Financing', 'Personal Finance'],
      formats: ['Search Ads', 'Display Ads', 'Native Content'],
      formatTypes: ['Professional', 'Infographic'],
      contentMetadata: {
        contentType: 'Performance Marketing Campaign',
        targetIntent: 'Action Intent',
        channelAlignment: 'Multi-Platform',
        campaignGoals: 'App Downloads & Registrations',
        primaryObjective: 'Drive qualified app installations',
        secondaryGoals: ['Increase registration rate', 'Reduce CAC']
      },
      targeting: {
        audienceSegments: ['High-Intent Users', 'Financial App Users'],
        demographics: '28-45 years, salary earners',
        geographic: 'GCC Countries'
      },
      expectedPerformance: {
        ctr: '3.5%',
        conversionRate: '8.1%'
      },
      whatYouDid: 'Implemented multi-channel performance campaign with dynamic creative optimization, featuring personalized landing pages and streamlined onboarding flow.',
      microMetrics: ['Install Rate: 12.3%', 'Registration Complete: 67%', 'Day 1 Retention: 45%'],
      dateRange: 'Feb 1-14, 2025',
      campaignType: 'Performance',
      productType: 'FinTech Apps',
      status: 'active'
    },
    {
      id: 3,
      marketingFunnelStage: 'Apply',
      reforgeGrowthStage: 'Maturity - Optimize',
      platforms: ['App Store', 'Google Play', 'In-App'],
      products: ['Advance Salary', 'Instant Finance'],
      formats: ['Push Notifications', 'In-App Messages', 'Email'],
      formatTypes: ['Personalized', 'Automated'],
      contentMetadata: {
        contentType: 'Conversion Optimization',
        targetIntent: 'Application Intent',
        channelAlignment: 'Owned Media',
        campaignGoals: 'Increase Application Submission',
        primaryObjective: 'Convert registered users to applicants',
        secondaryGoals: ['Reduce drop-off', 'Improve form completion']
      },
      targeting: {
        audienceSegments: ['Registered Users', 'Profile Complete'],
        demographics: 'Active app users with salary data',
        geographic: 'All Markets'
      },
      expectedPerformance: {
        ctr: '15.2%',
        conversionRate: '23.8%'
      },
      whatYouDid: 'Deployed intelligent nudge system with progressive disclosure, personalized messaging based on user financial profile, and gamified application process.',
      microMetrics: ['Form Start Rate: 89%', 'Form Completion: 76%', 'Document Upload: 82%'],
      dateRange: 'Feb 15-28, 2025',
      campaignType: 'Conversion',
      productType: 'Financial Products',
      status: 'paused'
    }
  ];

  // Enhanced state management and filtering
  const filteredData = useMemo(() => {
    let data = demoData;
    
    if (funnelFilter !== 'all') {
      data = data.filter(item => item.marketingFunnelStage === funnelFilter);
    }
    
    if (productFilters.size > 0) {
      data = data.filter(item => 
        item.products.some(product => 
          Array.from(productFilters).some(filter => product.includes(filter))
        )
      );
    }
    
    if (searchTerm) {
      data = data.filter(item =>
        item.contentMetadata.contentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.platforms.some(platform => platform.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.products.some(product => product.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return data;
  }, [funnelFilter, productFilters, searchTerm]);

  // File upload handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map((line, index) => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, i) => {
              obj[header.trim()] = values[i]?.trim() || '';
            });
            return obj;
          });
        
        setUploadedData(data);
        setUploadStatus(`✅ Successfully loaded ${data.length} rows of data`);
      } catch (error) {
        setUploadStatus(`❌ Error processing file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = ['Date', 'Registrations', 'LinkedAccounts', 'SalaryAdvanceApps', 'MicroFinanceApps', 'PersonalFinanceApps'];
    const csvContent = headers.join(',') + '\n' + 
      '2025-01-01,150,89,23,15,12\n' +
      '2025-01-02,165,95,28,18,14\n' +
      '2025-01-03,142,78,19,12,9';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'funnel_data_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleProductFilter = (product) => {
    const newFilters = new Set(productFilters);
    if (newFilters.has(product)) {
      newFilters.delete(product);
    } else {
      newFilters.add(product);
    }
    setProductFilters(newFilters);
  };

  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const getStageColor = (stage) => {
    const stageColors = {
      'Launch - New Product': 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/40',
      'Growth - Scale Channel': 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/40', 
      'Maturity - Optimize': 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/40'
    };
    return stageColors[stage] || 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border border-gray-500/40';
  };

  const getCampaignIcon = (type) => {
    const icons = {
      'Brand Awareness': '📢',
      'Performance': '🎯',
      'Conversion': '🔄'
    };
    return icons[type] || '📊';
  };

  const calculateImpact = (row) => {
    if (uploadedData.length === 0) {
      return { icon: '📊', text: 'Upload data for impact analysis', status: 'neutral' };
    }
    
    const impacts = [
      { icon: '📈', text: '+23% conversion rate', status: 'positive', subtext: 'vs previous period' },
      { icon: '💰', text: '-15% cost per acquisition', status: 'positive', subtext: 'optimized targeting' },
      { icon: '⚡', text: '+45% engagement rate', status: 'positive', subtext: 'improved creative' },
      { icon: '📉', text: '-8% completion rate', status: 'negative', subtext: 'needs optimization' }
    ];
    
    return impacts[row.id % impacts.length];
  };

  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: '#0a0a0a',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#fff',
      padding: '40px 20px'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6" style={{
            backgroundColor: '#1a1a1a',
            padding: '24px 32px',
            borderRadius: '20px',
            border: '2px solid #FFD600',
            boxShadow: '0 8px 32px rgba(255, 214, 0, 0.15)'
          }}>
            <div style={{ 
              backgroundColor: '#FFD600',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUpIcon className="h-8 w-8" style={{ color: '#000' }} />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#fff' }}>Growth Analytics</h1>
              <p style={{ color: '#888', fontSize: '16px' }}>Marketing Funnel Performance Dashboard</p>
            </div>
          </div>
          
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { label: 'Active Campaigns', value: filteredData.length, icon: '🚀', color: '#FFD600' },
              { label: 'Platforms', value: new Set(filteredData.flatMap(r => r.platforms)).size, icon: '📱', color: '#00D4FF' },
              { label: 'Products', value: new Set(filteredData.flatMap(r => r.products)).size, icon: '💼', color: '#00FF88' },
              { label: 'Avg Conversion', value: '12.4%', icon: '📈', color: '#FF6B6B' }
            ].map((stat, idx) => (
              <div key={idx} style={{
                backgroundColor: '#1a1a1a',
                border: '2px solid #333',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="hover:border-yellow-400 hover:shadow-lg transform hover:-translate-y-1"
              >
                <div className="mb-3">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-sm font-medium" style={{ color: '#ccc' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Control Panel Popup */}
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '2px solid #FFD600',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '40px',
          boxShadow: '0 12px 48px rgba(255, 214, 0, 0.2)',
          position: 'relative'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <div style={{
              backgroundColor: '#FFD600',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FilterIcon className="h-5 w-5" style={{ color: '#000' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#fff' }}>Control Panel</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Search & Filters */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFD600' }}>Search & Filters</h3>
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search campaigns, platforms, products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 20px 16px 50px',
                      backgroundColor: '#0a0a0a',
                      border: '2px solid #333',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FFD600'}
                    onBlur={(e) => e.target.style.borderColor = '#333'}
                  />
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#FFD600' }} />
                </div>

                {/* Funnel Stage Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#ccc' }}>Funnel Stage</label>
                  <select
                    value={funnelFilter}
                    onChange={(e) => setFunnelFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      backgroundColor: '#0a0a0a',
                      border: '2px solid #333',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '16px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Stages</option>
                    <option value="Awareness">Awareness</option>
                    <option value="Apply">Apply</option>
                    <option value="Download + Registration">Download + Registration</option>
                    <option value="Link Salary Account">Link Salary Account</option>
                    <option value="Accept">Accept</option>
                    <option value="Reapply / Retention">Reapply / Retention</option>
                  </select>
                </div>

                {/* Product Filters */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#ccc' }}>Product Focus</label>
                  <div className="flex flex-wrap gap-3">
                    {['Advance Salary', 'Micro-Financing', 'Personal Finance'].map(product => (
                      <button
                        key={product}
                        onClick={() => toggleProductFilter(product)}
                        style={{
                          padding: '12px 20px',
                          borderRadius: '25px',
                          border: '2px solid #FFD600',
                          backgroundColor: productFilters.has(product) ? '#FFD600' : 'transparent',
                          color: productFilters.has(product) ? '#000' : '#FFD600',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap'
                        }}
                        className="hover:scale-105"
                      >
                        {product}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Upload */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFD600' }}>Data Management</h3>
              <div className="space-y-4">
                <div style={{
                  backgroundColor: '#0a0a0a',
                  border: '2px dashed #FFD600',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <UploadIcon className="h-8 w-8 mx-auto mb-3" style={{ color: '#FFD600' }} />
                  <label className="block text-sm font-medium mb-3" style={{ color: '#ccc' }}>
                    Upload Performance Data
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#1a1a1a',
                      border: '2px solid #333',
                      borderRadius: '8px',
                      color: '#ccc',
                      fontSize: '14px',
                      marginBottom: '16px'
                    }}
                  />
                  <p className="text-xs mb-4" style={{ color: '#888' }}>
                    CSV/Excel: Date, Registrations, LinkedAccounts, SalaryAdvanceApps, MicroFinanceApps, PersonalFinanceApps
                  </p>
                  
                  <button
                    onClick={downloadTemplate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      backgroundColor: '#FFD600',
                      color: '#000',
                      border: 'none',
                      borderRadius: '25px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    className="hover:scale-105"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download Template
                  </button>
                </div>
                
                {uploadStatus && (
                  <div style={{
                    padding: '16px',
                    backgroundColor: uploadStatus.includes('Error') ? '#ff4444' : '#00ff88',
                    color: uploadStatus.includes('Error') ? '#fff' : '#000',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'center'
                  }}>
                    {uploadStatus}
                  </div>
                )}
                
                {uploadedData.length > 0 && (
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#0a0a0a',
                    border: '2px solid #00ff88',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: '#00ff88',
                    textAlign: 'center'
                  }}>
                    ✅ Data loaded: {uploadedData.length} rows
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Data Table */}
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '2px solid #333',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          marginBottom: '40px'
        }}>
          {/* Table Header */}
          <div style={{
            backgroundColor: '#0a0a0a',
            padding: '24px 32px',
            borderBottom: '2px solid #333'
          }}>
            <div className="flex items-center gap-3">
              <div style={{
                backgroundColor: '#FFD600',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart2Icon className="h-5 w-5" style={{ color: '#000' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: '#fff' }}>Campaign Analytics</h2>
              <div style={{
                marginLeft: 'auto',
                backgroundColor: '#FFD600',
                color: '#000',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {filteredData.length} campaigns
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#111' }}>
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-bold" style={{ color: '#FFD600' }}>Campaign</th>
                  <th className="px-8 py-4 text-left text-sm font-bold" style={{ color: '#FFD600' }}>Stage</th>
                  <th className="px-8 py-4 text-left text-sm font-bold" style={{ color: '#FFD600' }}>Platforms</th>
                  <th className="px-8 py-4 text-left text-sm font-bold" style={{ color: '#FFD600' }}>Products</th>
                  <th className="px-8 py-4 text-left text-sm font-bold" style={{ color: '#FFD600' }}>Performance</th>
                  <th className="px-8 py-4 text-left text-sm font-bold" style={{ color: '#FFD600' }}>Impact</th>
                  <th className="px-8 py-4 text-left text-sm font-bold" style={{ color: '#FFD600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <React.Fragment key={row.id}>
                    <tr style={{
                      backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#111',
                      borderBottom: '1px solid #333',
                      transition: 'background-color 0.2s ease'
                    }}
                    className="hover:bg-gray-800"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div style={{
                            backgroundColor: '#FFD600',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span className="text-lg">{getCampaignIcon(row.campaignType)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold mb-1" style={{ color: '#fff' }}>
                              {row.contentMetadata.contentType}
                            </div>
                            <div className="text-xs" style={{ color: '#888' }}>
                              {row.marketingFunnelStage}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        <span style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          backgroundColor: '#FFD600',
                          color: '#000',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          {row.reforgeGrowthStage}
                        </span>
                      </td>
                      
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {row.platforms.slice(0, 3).map((platform, i) => (
                            <span key={i} style={{
                              display: 'inline-block',
                              padding: '6px 12px',
                              backgroundColor: '#0a0a0a',
                              color: '#FFD600',
                              border: '1px solid #FFD600',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              {platform}
                            </span>
                          ))}
                          {row.platforms.length > 3 && (
                            <span className="text-xs" style={{ color: '#888' }}>+{row.platforms.length - 3}</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {row.products.slice(0, 2).map((product, i) => (
                            <span key={i} style={{
                              display: 'inline-block',
                              padding: '6px 12px',
                              backgroundColor: '#FFD600',
                              color: '#000',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              {product}
                            </span>
                          ))}
                          {row.products.length > 2 && (
                            <span className="text-xs" style={{ color: '#888' }}>+{row.products.length - 2}</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <div style={{
                            backgroundColor: '#0a0a0a',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #333'
                          }}>
                            <div className="text-sm font-bold" style={{ color: '#fff' }}>CTR: {row.expectedPerformance.ctr}</div>
                            <div className="text-xs" style={{ color: '#888' }}>Conv: {row.expectedPerformance.conversionRate}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-8 py-6">
                        {(() => {
                          const impact = calculateImpact(row);
                          return (
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{impact.icon}</span>
                              <div>
                                <div className="text-sm font-bold" style={{ 
                                  color: impact.status === 'positive' ? '#00ff88' : 
                                         impact.status === 'negative' ? '#ff4444' : '#FFD600' 
                                }}>
                                  {impact.text}
                                </div>
                                {impact.subtext && (
                                  <div className="text-xs" style={{ color: '#888' }}>
                                    {impact.subtext}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      
                      <td className="px-8 py-6">
                        <button
                          onClick={() => toggleRowExpansion(row.id)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: expandedRows.has(row.id) ? '#FFD600' : '#0a0a0a',
                            color: expandedRows.has(row.id) ? '#000' : '#FFD600',
                            border: '2px solid #FFD600',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          className="hover:scale-105"
                        >
                          {expandedRows.has(row.id) ? 'Hide Details' : 'View Details'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details Popup */}
                    {expandedRows.has(row.id) && (
                      <tr>
                        <td colSpan="7" style={{ backgroundColor: '#0a0a0a', padding: '0' }}>
                          <div style={{
                            margin: '24px',
                            backgroundColor: '#1a1a1a',
                            border: '2px solid #FFD600',
                            borderRadius: '16px',
                            padding: '32px',
                            boxShadow: '0 8px 32px rgba(255, 214, 0, 0.2)'
                          }}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              {/* Campaign Strategy */}
                              <div>
                                <div className="flex items-center gap-3 mb-6">
                                  <div style={{
                                    backgroundColor: '#FFD600',
                                    borderRadius: '10px',
                                    padding: '10px'
                                  }}>
                                    <TargetIcon className="h-5 w-5" style={{ color: '#000' }} />
                                  </div>
                                  <h3 className="text-lg font-bold" style={{ color: '#FFD600' }}>Campaign Strategy</h3>
                                </div>
                                
                                <div className="space-y-6">
                                  <div style={{
                                    backgroundColor: '#0a0a0a',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: '1px solid #333'
                                  }}>
                                    <h4 className="font-bold mb-3" style={{ color: '#fff' }}>Execution Details</h4>
                                    <p className="text-sm leading-relaxed" style={{ color: '#ccc' }}>{row.whatYouDid}</p>
                                  </div>
                                  
                                  <div style={{
                                    backgroundColor: '#0a0a0a',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: '1px solid #333'
                                  }}>
                                    <h4 className="font-bold mb-3" style={{ color: '#fff' }}>Key Metrics</h4>
                                    <div className="space-y-2">
                                      {row.microMetrics.map((metric, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm">
                                          <div style={{
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#FFD600',
                                            borderRadius: '50%'
                                          }}></div>
                                          <span style={{ color: '#ccc' }}>{metric}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div style={{
                                    backgroundColor: '#0a0a0a',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid #333',
                                    textAlign: 'center'
                                  }}>
                                    <CalendarIcon className="h-5 w-5 mx-auto mb-2" style={{ color: '#FFD600' }} />
                                    <div className="text-sm font-semibold" style={{ color: '#FFD600' }}>{row.dateRange}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Performance Data */}
                              <div>
                                <div className="flex items-center gap-3 mb-6">
                                  <div style={{
                                    backgroundColor: '#FFD600',
                                    borderRadius: '10px',
                                    padding: '10px'
                                  }}>
                                    <BarChart2Icon className="h-5 w-5" style={{ color: '#000' }} />
                                  </div>
                                  <h3 className="text-lg font-bold" style={{ color: '#FFD600' }}>Performance Data</h3>
                                </div>
                                
                                {uploadedData.length > 0 ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      {[
                                        {
                                          label: 'Registrations',
                                          value: uploadedData.reduce((sum, item) => sum + Number(item.Registrations || 0), 0).toLocaleString(),
                                          change: '+12%'
                                        },
                                        {
                                          label: 'Linked Accounts',
                                          value: uploadedData.reduce((sum, item) => sum + Number(item.LinkedAccounts || 0), 0).toLocaleString(),
                                          change: '+8%'
                                        }
                                      ].map((metric, i) => (
                                        <div key={i} style={{
                                          backgroundColor: '#0a0a0a',
                                          padding: '20px',
                                          borderRadius: '12px',
                                          border: '1px solid #333',
                                          textAlign: 'center'
                                        }}>
                                          <div className="text-sm mb-2" style={{ color: '#888' }}>{metric.label}</div>
                                          <div className="text-2xl font-bold mb-1" style={{ color: '#fff' }}>{metric.value}</div>
                                          <div className="text-xs" style={{ color: '#00ff88' }}>{metric.change} vs last period</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{
                                    backgroundColor: '#0a0a0a',
                                    padding: '40px',
                                    borderRadius: '12px',
                                    border: '2px dashed #333',
                                    textAlign: 'center'
                                  }}>
                                    <div className="text-4xl mb-4">📊</div>
                                    <div className="text-lg font-semibold mb-2" style={{ color: '#fff' }}>No Data Available</div>
                                    <div style={{ color: '#888' }}>Upload performance data to see detailed metrics</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReforgeGrowthDashboard;
