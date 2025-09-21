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
  RefreshCwIcon,
  DollarSignIcon,
  UsersIcon,
  MousePointerClickIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  StarIcon
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
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl shadow-lg" style={{ 
                background: 'linear-gradient(135deg, #FFD600 0%, #FFA500 100%)',
                boxShadow: '0 8px 32px rgba(255, 214, 0, 0.3)'
              }}>
                <TrendingUpIcon className="h-8 w-8 text-black" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Growth Analytics Hub</h1>
                <p className="text-gray-400 text-lg">Advanced Marketing Funnel Intelligence for FinTech</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-all duration-200 hover:scale-105" 
                style={{ 
                  backgroundColor: 'rgba(42, 42, 42, 0.8)', 
                  border: '1px solid #444',
                  backdropFilter: 'blur(10px)'
                }}>
                <RefreshCwIcon className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Enhanced Quick Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active Campaigns', value: filteredData.length, icon: '🚀', color: '#FFD600', trend: '+12%' },
              { label: 'Platforms', value: new Set(filteredData.flatMap(r => r.platforms)).size, icon: '📱', color: '#00D4FF', trend: '+3' },
              { label: 'Products', value: new Set(filteredData.flatMap(r => r.products)).size, icon: '💼', color: '#00FF88', trend: '+2' },
              { label: 'Avg. Conversion', value: '12.4%', icon: '📈', color: '#FF6B6B', trend: '+2.1%' }
            ].map((stat, idx) => (
              <div key={idx} className="rounded-xl p-5 border backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-pointer group" 
                style={{ 
                  backgroundColor: 'rgba(42, 42, 42, 0.8)', 
                  borderColor: '#333',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full" style={{ 
                    backgroundColor: 'rgba(0, 255, 136, 0.2)', 
                    color: '#00FF88' 
                  }}>
                    {stat.trend}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Search & Filters Section */}
        <div className="mb-6">
          <div className="rounded-xl border backdrop-blur-sm p-6" 
            style={{ 
              backgroundColor: 'rgba(42, 42, 42, 0.8)', 
              borderColor: '#333',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
            <div className="flex items-center gap-2 mb-4">
              <SearchIcon className="h-5 w-5" style={{ color: '#FFD600' }} />
              <span className="font-medium text-white">Search & Filters</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Bar */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns, platforms, products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                    border: '1px solid #444',
                    focusRingColor: '#FFD600'
                  }}
                />
              </div>

              {/* Funnel Stage Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Funnel Stage</label>
                <select
                  value={funnelFilter}
                  onChange={(e) => setFunnelFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                    border: '1px solid #444',
                    focusRingColor: '#FFD600'
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

              {/* Product Type Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Focus</label>
                <div className="flex flex-wrap gap-2">
                  {['Advance Salary', 'Micro-Financing', 'Personal Finance'].map(product => (
                    <button
                      key={product}
                      onClick={() => toggleProductFilter(product)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                        productFilters.has(product)
                          ? 'shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: productFilters.has(product) ? '#FFD600' : 'rgba(0, 0, 0, 0.4)',
                        color: productFilters.has(product) ? '#000' : '#ccc',
                        border: `1px solid ${productFilters.has(product) ? '#FFD600' : '#444'}`
                      }}
                      title={`${productFilters.has(product) ? 'Remove' : 'Add'} ${product} filter`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Upload Section */}
        <div className="rounded-xl border backdrop-blur-sm p-6 mb-6" 
          style={{ 
            backgroundColor: 'rgba(42, 42, 42, 0.8)', 
            borderColor: '#333',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
          <div className="flex items-center gap-2 mb-4">
            <UploadIcon className="h-5 w-5" style={{ color: '#FFD600' }} />
            <span className="font-medium text-white">Performance Data Upload</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Upload CSV/Excel File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:text-black file:cursor-pointer
                    file:transition-all file:duration-200
                    file:hover:scale-105 file:shadow-lg"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid #444',
                    fileBackgroundColor: '#FFD600',
                    fileHoverBackgroundColor: '#FFA500'
                  }}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Required columns: Date, Registrations, LinkedAccounts, SalaryAdvanceApps, MicroFinanceApps, PersonalFinanceApps
                </p>
              </div>
            </div>
            
            <div className="flex flex-col justify-center space-y-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                style={{ 
                  backgroundColor: '#FFD600', 
                  color: '#000',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(255, 214, 0, 0.3)'
                }}
              >
                <DownloadIcon className="h-4 w-4" />
                Download Template
              </button>
              
              {uploadStatus && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${uploadStatus.includes('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  <CheckCircleIcon className="h-4 w-4" />
                  {uploadStatus}
                </div>
              )}
              
              {uploadedData.length > 0 && (
                <div className="text-sm text-gray-300 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                  <strong>Data loaded:</strong> {uploadedData.length} rows from {uploadedData[0]?.Date} to {uploadedData[uploadedData.length - 1]?.Date}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Main Table */}
        <div className="rounded-xl border backdrop-blur-sm overflow-hidden mb-6" 
          style={{ 
            backgroundColor: 'rgba(42, 42, 42, 0.8)', 
            borderColor: '#333',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white w-4"></th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Campaign</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Growth Stage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Platforms</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Products</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Performance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Impact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-black/20 transition-all duration-200 group" 
                      style={{backgroundColor: index % 2 === 1 ? 'rgba(0, 0, 0, 0.2)' : 'transparent'}}>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleRowExpansion(row.id)}
                          className="text-gray-400 hover:text-yellow-400 transition-all duration-200 p-2 rounded-lg hover:bg-black/30"
                          title={expandedRows.has(row.id) ? "Collapse details" : "Expand details"}
                        >
                          {expandedRows.has(row.id) ? (
                            <ChevronDownIcon className="h-5 w-5" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 214, 0, 0.2)' }}>
                            <span className="text-lg">{getCampaignIcon(row.campaignType)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-yellow-400 transition-colors">
                              {row.marketingFunnelStage}
                            </div>
                            <div className="text-xs text-gray-400">{row.campaignType}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStageColor(row.reforgeGrowthStage)}`}>
                          {row.reforgeGrowthStage}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {row.platforms.slice(0, 3).map((platform, i) => (
                            <button 
                              key={i} 
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
                              style={{
                                backgroundColor: '#FFD600',
                                color: '#000',
                                border: 'none'
                              }}
                              onClick={() => alert(`Platform details: ${platform}`)}
                              title={`Click for ${platform} performance`}
                            >
                              {platform}
                            </button>
                          ))}
                          {row.platforms.length > 3 && (
                            <span className="text-xs text-gray-400 px-2 py-1">+{row.platforms.length - 3}</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {row.products.slice(0, 2).map((product, i) => (
                            <button 
                              key={i} 
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
                              style={{
                                backgroundColor: 'rgba(255, 214, 0, 0.2)',
                                color: '#FFD600',
                                border: '1px solid #FFD600'
                              }}
                              onClick={() => alert(`Product details: ${product}`)}
                              title={`Click for ${product} performance`}
                            >
                              {product}
                            </button>
                          ))}
                          {row.products.length > 2 && (
                            <span className="text-xs text-gray-400 px-2 py-1">+{row.products.length - 2}</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-white font-medium">CTR: {row.expectedPerformance.ctr}</div>
                          <div className="text-xs text-gray-400">Conv: {row.expectedPerformance.conversionRate}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {(() => {
                          const impact = calculateImpact(row);
                          const statusColors = {
                            positive: '#4ade80',
                            negative: '#f87171',
                            neutral: '#9ca3af'
                          };
                          
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{impact.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium" style={{ color: statusColors[impact.status] || '#FFD600' }}>
                                  {typeof impact === 'string' ? impact : impact.text}
                                </span>
                                {impact.subtext && (
                                  <span className="text-xs text-gray-500">
                                    {impact.subtext}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {row.status === 'active' ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                              <span className="text-sm text-green-400 font-medium">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                              <span className="text-sm text-yellow-400 font-medium">Paused</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Enhanced Expanded Details */}
                    {expandedRows.has(row.id) && (
                      <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                        <td colSpan="8" className="px-6 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Performance Metrics */}
                            <div className="rounded-lg border p-5" style={{ backgroundColor: 'rgba(42, 42, 42, 0.8)', borderColor: '#444' }}>
                              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <BarChart2Icon className="h-5 w-5" style={{ color: '#FFD600' }} />
                                Performance Metrics
                              </h3>
                              {uploadedData.length > 0 ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                                      <div className="text-sm font-medium text-gray-400 mb-1">Registrations</div>
                                      <div className="text-2xl font-bold text-white">
                                        {(uploadedData.reduce((sum, item) => sum + Number(item.Registrations || 0), 0)).toLocaleString()}
                                      </div>
                                      <div className="text-sm text-green-400">+12% vs last period</div>
                                    </div>
                                    
                                    <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
                                      <div className="text-sm font-medium text-gray-400 mb-1">Linked Accounts</div>
                                      <div className="text-2xl font-bold text-white">
                                        {(uploadedData.reduce((sum, item) => sum + Number(item.LinkedAccounts || 0), 0)).toLocaleString()}
                                      </div>
                                      <div className="text-sm text-green-400">+8% vs last period</div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="text-4xl mb-2">📊</div>
                                  <div className="text-gray-400">Upload data to see performance metrics</div>
                                </div>
                              )}
                            </div>

                            {/* Campaign Details */}
                            <div className="rounded-lg border p-5" style={{ backgroundColor: 'rgba(42, 42, 42, 0.8)', borderColor: '#444' }}>
                              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TargetIcon className="h-5 w-5" style={{ color: '#FFD600' }} />
                                Campaign Strategy
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium text-white mb-2">Execution</h4>
                                  <p className="text-sm text-gray-300 leading-relaxed">{row.whatYouDid}</p>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-white mb-2">Key Metrics</h4>
                                  <div className="space-y-2">
                                    {row.microMetrics.map((metric, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFD600' }}></div>
                                        <span className="text-gray-300">{metric}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="pt-3 border-t" style={{ borderColor: '#444' }}>
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>{row.dateRange}</span>
                                  </div>
                                </div>
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

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              title: 'Active Campaigns', 
              value: filteredData.length, 
              icon: '🚀', 
              description: 'Currently running',
              change: '+3 this week'
            },
            { 
              title: 'Positive Impact', 
              value: filteredData.filter(c => calculateImpact(c).status === 'positive').length, 
              icon: '📈', 
              description: 'Campaigns improving',
              change: '+2 optimized'
            },
            { 
              title: 'Active Platforms', 
              value: new Set(filteredData.flatMap(r => r.platforms)).size, 
              icon: '📱', 
              description: 'Channels utilized',
              change: '+1 new channel'
            },
            { 
              title: 'Product Lines', 
              value: new Set(filteredData.flatMap(r => r.products)).size, 
              icon: '💼', 
              description: 'Products marketed',
              change: 'All active'
            }
          ].map((card, idx) => (
            <div key={idx} 
              className="rounded-xl border p-6 hover:scale-105 transition-all duration-300 cursor-pointer group" 
              style={{ 
                backgroundColor: 'rgba(42, 42, 42, 0.8)', 
                borderColor: '#333',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 214, 0, 0.2)' }}>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <div className="text-xs px-2 py-1 rounded-full" style={{ 
                  backgroundColor: 'rgba(0, 255, 136, 0.2)', 
                  color: '#00FF88' 
                }}>
                  {card.change}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors mb-1">
                  {card.value}
                </div>
                <div className="text-sm font-medium text-gray-300 mb-1">{card.title}</div>
                <div className="text-xs text-gray-500">{card.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReforgeGrowthDashboard;
