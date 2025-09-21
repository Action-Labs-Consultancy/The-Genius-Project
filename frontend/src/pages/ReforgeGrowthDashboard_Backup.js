import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon, FilterIcon, TrendingUpIcon, CalendarIcon, TagIcon, UploadIcon, DownloadIcon, CheckCircleIcon } from 'lucide-react';

const ReforgeGrowthDashboard = ({ user }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [funnelFilter, setFunnelFilter] = useState('all');
  const [productFilters, setProductFilters] = useState(new Set());
  const [uploadedData, setUploadedData] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  // Enhanced dashboard data with separated platforms and formats
  const dashboardData = [
    {
      id: 1,
      marketingFunnelStage: "Awareness",
      reforgeGrowthStage: "FIND",
      platforms: ["Meta", "TikTok", "LinkedIn"],
      formats: ["Influencer collab", "Testimonial (real user)", "Urgency CTA"],
      formatTypes: ["Short Video", "Interview Video"],
      products: ["Advance Salary", "Personal Finance"],
      contentMetadata: {
        contentType: "Testimonial video series",
        targetIntent: "Drive salary advance awareness and trust building",
        channelAlignment: "TikTok native testimonials, Meta story format, LinkedIn professional success stories",
        campaignGoals: "Increase brand awareness and application intent"
      },
      whatYouDid: "Launched comprehensive testimonial series featuring real users sharing salary advance success stories. Created urgency-based creatives with 'Get paid today' messaging and educational reels about financial wellness. Partnered with micro-influencers for authentic storytelling.",
      impactOfGrowth: "Auto-calculated from uploaded data",
      dateRange: "June 14–16, 2024",
      spikeDay: "2024-06-15",
      microMetrics: ["+1,200 applications", "+800 salary advance links", "+15% CTR"],
      campaignType: "video",
      productType: "Advance Salary"
    },
    {
      id: 2,
      marketingFunnelStage: "Apply",
      reforgeGrowthStage: "LAUNCH",
      platforms: ["Google", "Meta"],
      formats: ["Animated explainer", "Benefit how-to guide"],
      formatTypes: ["Animation Video", "Carousel Post"],
      products: ["Instant Finance", "Advance Salary"],
      contentMetadata: {
        contentType: "Onboarding optimization sequence",
        targetIntent: "Reduce application abandonment and increase completion rates",
        channelAlignment: "Google Search ads with explainer videos, Meta retargeting with step-by-step guides",
        campaignGoals: "Improve conversion funnel performance"
      },
      whatYouDid: "Implemented abandoned application recovery sequence with simplified 3-step onboarding. A/B tested loan amount selectors and added real-time approval indicators to reduce drop-off. Created animated explainers for complex processes.",
      impactOfGrowth: "Auto-calculated from uploaded data",
      dateRange: "July 1–7, 2024",
      spikeDay: "2024-07-03",
      microMetrics: ["+340 completed applications", "+180 approved loans", "+22% conversion"],
      campaignType: "optimization",
      productType: "Micro-Financing"
    },
    {
      id: 3,
      marketingFunnelStage: "Awareness",
      reforgeGrowthStage: "FIND",
      platforms: ["TikTok", "Instagram", "Snapchat"],
      formats: ["AI assistant video", "Lifestyle content", "Influencer collab"],
      formatTypes: ["Short Video", "Static Post"],
      products: ["Personal Finance", "Budgeting", "Marketplace"],
      contentMetadata: {
        contentType: "Lifestyle-focused native content",
        targetIntent: "Build brand affinity and normalize micro-loan usage",
        channelAlignment: "TikTok AI series, Instagram lifestyle posts, Snapchat young professional content",
        campaignGoals: "Expand reach among target demographic"
      },
      whatYouDid: "Created lifestyle-focused content showing young professionals using micro-loans for emergencies. Partnered with finance micro-influencers for authentic storytelling and budget management tips. Developed AI assistant video series explaining financial concepts.",
      impactOfGrowth: "Auto-calculated from uploaded data",
      dateRange: "June 20–25, 2024",
      spikeDay: "2024-06-22",
      microMetrics: ["+2,100 video views", "+450 profile visits", "+12% engagement rate"],
      campaignType: "influencer",
      productType: "Personal Finance"
    },
    {
      id: 4,
      marketingFunnelStage: "Accept",
      reforgeGrowthStage: "SCALE",
      platforms: ["Meta", "Google"],
      formats: ["Testimonial (real user)", "Urgency CTA"],
      formatTypes: ["Interview Video", "Static Post"],
      products: ["Instant Finance", "Sukuk"],
      contentMetadata: {
        contentType: "Conversion optimization campaign",
        targetIntent: "Increase loan approval rates and customer satisfaction",
        channelAlignment: "Meta conversion ads with social proof, Google Performance Max with urgency messaging",
        campaignGoals: "Maximize conversion rate and customer lifetime value"
      },
      whatYouDid: "Optimized loan approval flow with instant pre-qualification checks. Added social proof widgets showing recent approvals and implemented progressive disclosure for terms and conditions. Created urgency-driven CTAs.",
      impactOfGrowth: "Auto-calculated from uploaded data",
      dateRange: "July 8–15, 2024",
      spikeDay: "2024-07-10",
      microMetrics: ["+510 approved loans", "+1,800 applications", "+25% approval speed"],
      campaignType: "conversion",
      productType: "Micro-Financing"
    },
    {
      id: 5,
      marketingFunnelStage: "Reapply / Retention",
      reforgeGrowthStage: "SCALE",
      platforms: ["In-app", "SMS", "Email"],
      formats: ["Educational content", "Personalized recommendations", "Referral incentives"],
      formatTypes: ["Carousel Post", "Static Post"],
      products: ["Personal Finance", "Budgeting", "Marketplace"],
      contentMetadata: {
        contentType: "Financial wellness program",
        targetIntent: "Increase user retention and repeat usage",
        channelAlignment: "In-app educational content, SMS personalized tips, Email weekly insights",
        campaignGoals: "Build long-term customer relationships and increase lifetime value"
      },
      whatYouDid: "Launched financial wellness program with weekly money tips, spending insights, and personalized loan recommendations. Created referral program with cash incentives. Developed educational content series.",
      impactOfGrowth: "Auto-calculated from uploaded data",
      dateRange: "June 28–July 20, 2024",
      spikeDay: "2024-07-01",
      microMetrics: ["+890 referrals", "+1,200 return users", "+38% retention"],
      campaignType: "retention",
      productType: "Personal Finance"
    },
    {
      id: 6,
      marketingFunnelStage: "Apply",
      reforgeGrowthStage: "LAUNCH",
      platforms: ["Facebook", "Google"],
      formats: ["Benefit how-to guide", "Trust-building content"],
      formatTypes: ["Animation Video", "Carousel Post"],
      products: ["Advance Salary", "Sukuk"],
      contentMetadata: {
        contentType: "Trust-building application flow",
        targetIntent: "Reduce application friction and build user confidence",
        channelAlignment: "Facebook lead gen with trust badges, Google form ads with security messaging",
        campaignGoals: "Improve application start and completion rates"
      },
      whatYouDid: "Streamlined salary verification process using bank API integrations. Created trust-building elements with security badges, testimonials, and transparent fee structure display. Developed benefit-focused how-to guides.",
      impactOfGrowth: "Auto-calculated from uploaded data",
      dateRange: "July 12–18, 2024",
      spikeDay: "2024-07-14",
      microMetrics: ["+680 started applications", "+420 verified salaries", "+18% completion"],
      campaignType: "form",
      productType: "Advance Salary"
    }
  ];

  // Enhanced CSV template data with more comprehensive metrics
  const csvTemplateData = [
    { Date: '2024-06-12', Registrations: 380, LinkedAccounts: 240, SalaryAdvanceApps: 85, MicroFinanceApps: 65, PersonalFinanceApps: 75 },
    { Date: '2024-06-13', Registrations: 420, LinkedAccounts: 260, SalaryAdvanceApps: 95, MicroFinanceApps: 70, PersonalFinanceApps: 80 },
    { Date: '2024-06-14', Registrations: 450, LinkedAccounts: 280, SalaryAdvanceApps: 120, MicroFinanceApps: 85, PersonalFinanceApps: 95 },
    { Date: '2024-06-15', Registrations: 630, LinkedAccounts: 420, SalaryAdvanceApps: 180, MicroFinanceApps: 110, PersonalFinanceApps: 125 },
    { Date: '2024-06-16', Registrations: 520, LinkedAccounts: 350, SalaryAdvanceApps: 150, MicroFinanceApps: 95, PersonalFinanceApps: 105 },
    { Date: '2024-06-17', Registrations: 490, LinkedAccounts: 320, SalaryAdvanceApps: 140, MicroFinanceApps: 90, PersonalFinanceApps: 100 },
    { Date: '2024-07-01', Registrations: 400, LinkedAccounts: 250, SalaryAdvanceApps: 90, MicroFinanceApps: 75, PersonalFinanceApps: 85 },
    { Date: '2024-07-02', Registrations: 420, LinkedAccounts: 270, SalaryAdvanceApps: 95, MicroFinanceApps: 80, PersonalFinanceApps: 90 },
    { Date: '2024-07-03', Registrations: 380, LinkedAccounts: 230, SalaryAdvanceApps: 85, MicroFinanceApps: 65, PersonalFinanceApps: 75 },
    { Date: '2024-07-04', Registrations: 520, LinkedAccounts: 340, SalaryAdvanceApps: 125, MicroFinanceApps: 95, PersonalFinanceApps: 110 },
    { Date: '2024-07-05', Registrations: 480, LinkedAccounts: 310, SalaryAdvanceApps: 115, MicroFinanceApps: 85, PersonalFinanceApps: 100 },
    { Date: '2024-07-06', Registrations: 460, LinkedAccounts: 290, SalaryAdvanceApps: 105, MicroFinanceApps: 80, PersonalFinanceApps: 95 }
  ];

  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
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

  // Automated impact calculation system for all campaigns
  const calculateImpact = useCallback((campaign) => {
    // Show realistic demo results for all campaigns when no CSV uploaded
    if (uploadedData.length === 0) {
      const demoImpacts = {
        1: { text: '+45% Applications 📈', status: 'positive', icon: '📈', percentage: 45, metric: 'applications' },
        2: { text: '+28% Conversions 🎯', status: 'positive', icon: '🎯', percentage: 28, metric: 'conversions' },
        3: { text: '+35% Engagement 💫', status: 'positive', icon: '💫', percentage: 35, metric: 'engagement' },
        4: { text: '+52% Approvals ⭐', status: 'positive', icon: '⭐', percentage: 52, metric: 'approvals' },
        5: { text: '+38% Retention 🔄', status: 'positive', icon: '🔄', percentage: 38, metric: 'retention' },
        6: { text: '+18% Completion ✅', status: 'positive', icon: '✅', percentage: 18, metric: 'completion' }
      };
      return demoImpacts[campaign.id] || { text: 'Demo Data Available', status: 'neutral', icon: '📊', percentage: 0, metric: 'demo' };
    }

    const campaignDate = new Date(campaign.spikeDay);
    
    // Define date ranges: 2 days before and 2-3 days after
    const preStartDate = new Date(campaignDate);
    preStartDate.setDate(preStartDate.getDate() - 2);
    const preEndDate = new Date(campaignDate);
    preEndDate.setDate(preEndDate.getDate() - 1);
    
    const postStartDate = new Date(campaignDate);
    postStartDate.setDate(postStartDate.getDate() + 1);
    const postEndDate = new Date(campaignDate);
    postEndDate.setDate(postEndDate.getDate() + 3);

    // Filter data for pre and post periods
    const preData = uploadedData.filter(d => {
      const date = new Date(d.Date);
      return date >= preStartDate && date <= preEndDate;
    });

    const postData = uploadedData.filter(d => {
      const date = new Date(d.Date);
      return date >= postStartDate && date <= postEndDate;
    });

    if (preData.length === 0 || postData.length === 0) {
      return { text: 'Insufficient data', status: 'neutral', icon: '❓', percentage: 0, metric: 'data' };
    }

    // Smart metric detection based on campaign funnel stage and products
    let targetMetric = 'Registrations'; // default fallback
    let metricName = 'registrations';
    
    // Auto-detect primary product focus for targeted metrics
    const primaryProduct = campaign.products[0] || 'General';
    
    // Map funnel stages to appropriate metrics
    switch (campaign.marketingFunnelStage) {
      case 'Awareness':
        targetMetric = 'Registrations';
        metricName = 'registrations';
        break;
      case 'Apply':
        if (primaryProduct.includes('Salary')) {
          targetMetric = 'SalaryAdvanceApps';
          metricName = 'salary advance applications';
        } else if (primaryProduct.includes('Finance')) {
          targetMetric = 'PersonalFinanceApps';
          metricName = 'personal finance applications';
        } else {
          targetMetric = 'MicroFinanceApps';
          metricName = 'micro finance applications';
        }
        break;
      case 'Accept':
        targetMetric = 'LinkedAccounts';
        metricName = 'linked accounts';
        break;
      case 'Reapply / Retention':
        targetMetric = 'Registrations';
        metricName = 'returning users';
        break;
      default:
        targetMetric = 'Registrations';
        metricName = 'registrations';
    }

    // Calculate averages for pre and post periods
    const preAvg = preData.reduce((sum, d) => sum + (parseInt(d[targetMetric]) || 0), 0) / preData.length;
    const postAvg = postData.reduce((sum, d) => sum + (parseInt(d[targetMetric]) || 0), 0) / postData.length;

    if (preAvg === 0) {
      return { text: 'No baseline data', status: 'neutral', icon: '❓', percentage: 0, metric: metricName };
    }

    // Calculate spike day impact (day of campaign vs pre-average)
    const spikeDayData = uploadedData.find(d => {
      const date = new Date(d.Date);
      return date.toDateString() === campaignDate.toDateString();
    });
    
    const spikeDayValue = spikeDayData ? (parseInt(spikeDayData[targetMetric]) || 0) : postAvg;
    
    // Calculate percentage lift using spike day vs pre-average
    const spikeImpact = preAvg > 0 ? Math.round(((spikeDayValue - preAvg) / preAvg) * 100) : 0;
    const postImpact = preAvg > 0 ? Math.round(((postAvg - preAvg) / preAvg) * 100) : 0;
    
    // Use the more significant impact (spike day vs sustained post impact)
    const primaryImpact = Math.abs(spikeImpact) > Math.abs(postImpact) ? spikeImpact : postImpact;
    const usingSpikeDay = Math.abs(spikeImpact) > Math.abs(postImpact);
    
    // Determine status and formatting based on impact thresholds
    let status, icon, text;
    
    if (primaryImpact > 10) {
      status = 'positive';
      icon = '📈';
      text = `+${primaryImpact}% ${metricName}`;
    } else if (primaryImpact < -10) {
      status = 'negative';
      icon = '📉';
      text = `${primaryImpact}% ${metricName}`;
    } else {
      status = 'neutral';
      icon = '➖';
      text = `${primaryImpact >= 0 ? '+' : ''}${primaryImpact}% ${metricName}`;
    }

    // Add platform context for significant impacts
    const primaryPlatform = campaign.platforms[0];
    if (Math.abs(primaryImpact) >= 15 && primaryPlatform && status !== 'neutral') {
      text += ` (${primaryPlatform})`;
    }

    return {
      text,
      status,
      icon,
      percentage: primaryImpact,
      metric: metricName,
      preAvg: Math.round(preAvg),
      postAvg: Math.round(postAvg),
      spikeDayValue: Math.round(spikeDayValue),
      impactType: usingSpikeDay ? 'spike' : 'sustained',
      campaignDate: campaignDate.toLocaleDateString()
    };
  }, [uploadedData]);

  // Handle CSV file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',');
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || '';
            });
            return row;
          });

        setUploadedData(data);
        setUploadStatus(`✅ Uploaded ${data.length} rows successfully`);
        
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (error) {
        setUploadStatus('❌ Error parsing CSV file');
        console.error('CSV parse error:', error);
      }
    };
    reader.readAsText(file);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = Object.keys(csvTemplateData[0]);
    const csvContent = [
      headers.join(','),
      ...csvTemplateData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monthly_funnel_data_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Sort order configuration for funnel and growth stages
  const funnelOrder = {
    "Awareness": 1,
    "Download + Registration": 2,
    "Link Salary Account": 3,
    "Apply": 4,
    "Accept": 5,
    "Reapply / Retention": 6,
    "Retain": 6 // Alias for Reapply / Retention
  };

  const growthOrder = {
    "FIND": 1,
    "CONVINCE": 2,
    "BUILD": 3,
    "LAUNCH": 4,
    "GROW": 5,
    "SCALE": 6
  };

  const filteredData = useMemo(() => {
    return dashboardData
      .filter(row => {
        const funnelMatch = funnelFilter === 'all' || row.marketingFunnelStage === funnelFilter;
        const productMatch = productFilters.size === 0 || 
          row.products.some(product => {
            const mappedProduct = product === 'Instant Finance' ? 'Micro-Financing' : 
                                product === 'Budgeting' ? 'Personal Finance' :
                                product === 'Marketplace' ? 'Personal Finance' :
                                product === 'Sukuk' ? 'Micro-Financing' : product;
            return productFilters.has(mappedProduct);
          });
        return funnelMatch && productMatch;
      })
      .sort((a, b) => {
        const aFunnelOrder = funnelOrder[a.marketingFunnelStage] || 999;
        const bFunnelOrder = funnelOrder[b.marketingFunnelStage] || 999;
        if (aFunnelOrder !== bFunnelOrder) return aFunnelOrder - bFunnelOrder;
        
        const aGrowthOrder = growthOrder[a.reforgeGrowthStage] || 999;
        const bGrowthOrder = growthOrder[b.reforgeGrowthStage] || 999;
        return aGrowthOrder - bGrowthOrder;
      });
  }, [funnelFilter, productFilters]);

  const getCampaignIcon = (type) => {
    switch (type) {
      case 'video': return '📹';
      case 'optimization': return '⚙️';
      case 'influencer': return '👥';
      case 'conversion': return '🎯';
      case 'retention': return '🔄';
      case 'form': return '📝';
      default: return '📊';
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'FIND': return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case 'CONVINCE': return 'bg-purple-400/20 text-purple-300 border-purple-400/30';
      case 'BUILD': return 'bg-green-400/20 text-green-300 border-green-400/30';
      case 'LAUNCH': return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30';
      case 'GROW': return 'bg-orange-400/20 text-orange-300 border-orange-400/30';
      case 'SCALE': return 'bg-red-400/20 text-red-300 border-red-400/30';
      default: return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUpIcon className="h-8 w-8 text-yellow-400" style={{ color: '#FFD600' }} />
            <h1 className="text-3xl font-bold text-white">Reforge Growth Dashboard</h1>
          </div>
          <p className="text-gray-300">Marketing Funnel Performance for Fintech App</p>
        </div>

        {/* Data Upload Section */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 mb-6" style={{ borderColor: '#333', backgroundColor: '#111' }}>
          <div className="flex items-center gap-2 mb-4">
            <UploadIcon className="h-5 w-5" style={{ color: '#FFD600' }} />
            <span className="font-medium text-white">Monthly Funnel Data Upload</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload CSV/Excel File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-yellow-400 file:text-black
                  hover:file:bg-yellow-300 file:cursor-pointer"
                style={{ 
                  backgroundColor: '#222',
                  border: '1px solid #444'
                }}
              />
              <p className="text-xs text-gray-400 mt-1">
                Required columns: Date, Registrations, LinkedAccounts, SalaryAdvanceApps, MicroFinanceApps, PersonalFinanceApps
              </p>
            </div>
            
            <div className="flex flex-col justify-center">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-yellow-300 transition-colors mb-2 font-medium"
                style={{ 
                  backgroundColor: '#FFD600', 
                  color: '#000',
                  border: 'none'
                }}
              >
                <DownloadIcon className="h-4 w-4" />
                Download Template
              </button>
              {uploadStatus && (
                <div className={`flex items-center gap-2 text-sm ${uploadStatus.includes('Error') ? 'text-red-400' : 'text-yellow-400'}`} style={{ color: uploadStatus.includes('Error') ? '#ff6b6b' : '#FFD600' }}>
                  <CheckCircleIcon className="h-4 w-4" />
                  {uploadStatus}
                </div>
              )}
              {uploadedData.length > 0 && (
                <div className="text-sm text-gray-300">
                  Data loaded: {uploadedData.length} rows from {uploadedData[0]?.Date} to {uploadedData[uploadedData.length - 1]?.Date}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-6" style={{ borderColor: '#333', backgroundColor: '#111' }}>
          <div className="flex items-center gap-2 mb-3">
            <FilterIcon className="h-5 w-5" style={{ color: '#FFD600' }} />
            <span className="font-medium text-white">Filters</span>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {/* Funnel Stage Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Funnel Stage</label>
              <select
                value={funnelFilter}
                onChange={(e) => setFunnelFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 text-white hover:bg-gray-700 transition-colors cursor-pointer"
                style={{ 
                  backgroundColor: '#222',
                  borderColor: '#444',
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Product Type</label>
              <div className="flex gap-2">
                {['Advance Salary', 'Micro-Financing', 'Personal Finance'].map(product => (
                  <button
                    key={product}
                    onClick={() => toggleProductFilter(product)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                      productFilters.has(product)
                        ? 'shadow-md'
                        : 'border hover:border-yellow-400'
                    }`}
                    style={{
                      backgroundColor: productFilters.has(product) ? '#FFD600' : '#222',
                      color: productFilters.has(product) ? '#000' : '#ccc',
                      borderColor: productFilters.has(product) ? '#FFD600' : '#444'
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

        {/* Main Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden" style={{ borderColor: '#333', backgroundColor: '#111' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: '#222', borderBottomColor: '#444' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white w-4"></th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Funnel Stage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Growth Stage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Platforms</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Products</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">What You Did</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Impact of Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: '#333' }}>
                {filteredData.map((row, index) => (
                  <React.Fragment key={row.id}>
                    <tr className={`hover:bg-gray-800 transition-colors`} style={{backgroundColor: index % 2 === 1 ? '#181818' : '#111'}}>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleRowExpansion(row.id)}
                          className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 p-1 rounded hover:bg-gray-800"
                          style={{ 
                            ':hover': { color: '#FFD600' }
                          }}
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{row.marketingFunnelStage}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(row.reforgeGrowthStage)}`}>
                          {row.reforgeGrowthStage}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {row.platforms.slice(0, 3).map((platform, i) => (
                            <button 
                              key={i} 
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
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
                            <span className="text-xs text-gray-400">+{row.platforms.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {row.products.slice(0, 2).map((product, i) => (
                            <button 
                              key={i} 
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                              style={{
                                backgroundColor: '#333',
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
                            <span className="text-xs text-gray-400">+{row.products.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <p className="text-sm text-white font-bold">{row.contentMetadata.contentType}</p>
                          <div className="text-xs text-gray-300 space-y-1">
                            <div>• <span className="font-medium">Content:</span> {row.formats.join(', ')}</div>
                            <div>• <span className="font-medium">Format:</span> {row.formatTypes.join(', ')}</div>
                            <div>• <span className="font-medium">Goal:</span> {row.contentMetadata.targetIntent}</div>
                          </div>
                          <button
                            onClick={() => toggleRowExpansion(row.id)}
                            className="text-xs hover:text-yellow-300 cursor-pointer"
                            style={{ color: '#FFD600' }}
                          >
                            {expandedRows.has(row.id) ? 'Show less' : 'Show more'}
                          </button>
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
                                <span className={`text-sm font-medium`} style={{ color: statusColors[impact.status] || '#FFD600' }}>
                                  {typeof impact === 'string' ? impact : impact.text}
                                </span>
                                {impact.subtext && (
                                  <span className="text-xs text-gray-500">
                                    {impact.subtext}
                                  </span>
                                )}
                                {impact.preAvg && impact.postAvg && !impact.subtext && (
                                  <span className="text-xs text-gray-500">
                                    Pre: {impact.preAvg}/day → {impact.impactType === 'spike' ? `Spike: ${impact.spikeDayValue}` : `Post: ${impact.postAvg}/day`}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRows.has(row.id) && (
                      <tr className="border-l-4" style={{ backgroundColor: '#1a1a1a', borderLeftColor: '#FFD600' }}>
                        <td colSpan="7" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Full Content Strategy */}
                            <div className="rounded-lg border p-4 lg:col-span-2" style={{ backgroundColor: '#222', borderColor: '#444' }}>
                              <div className="flex items-center gap-2 mb-3">
                                <TagIcon className="h-4 w-4" style={{ color: '#FFD600' }} />
                                <span className="text-sm font-medium text-white">Full Content Strategy</span>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs font-medium text-gray-400">Content Type:</span>
                                  <p className="text-sm text-gray-300">{row.contentMetadata.contentType}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-400">Target Intent:</span>
                                  <p className="text-sm text-gray-300">{row.contentMetadata.targetIntent}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-400">Channel Alignment:</span>
                                  <p className="text-sm text-gray-300">{row.contentMetadata.channelAlignment}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-400">Campaign Goals:</span>
                                  <p className="text-sm text-gray-300">{row.contentMetadata.campaignGoals}</p>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: '#FFD600' }}>
                                  <CalendarIcon className="h-4 w-4" style={{ color: '#FFD600' }} />
                                  <span className="text-sm text-gray-300">{row.dateRange}</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-300">
                                    {getCampaignIcon(row.campaignType)} {row.campaignType}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* All Platforms & Products */}
                            <div className="rounded-lg border p-4" style={{ backgroundColor: '#222', borderColor: '#444' }}>
                              <span className="text-sm font-medium text-white mb-3 block">All Platforms & Products</span>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-xs font-medium text-gray-400 block mb-1">Platforms:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {row.platforms.map((platform, i) => (
                                      <button 
                                        key={i} 
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                                        style={{
                                          backgroundColor: '#FFD600',
                                          color: '#000',
                                          border: 'none'
                                        }}
                                        onClick={() => alert(`Platform Performance:\n\nPlatform: ${platform}\nCampaign: ${row.marketingFunnelStage}\nStage: ${row.reforgeGrowthStage}\nDate: ${row.dateRange}`)}
                                        title={`Click for ${platform} performance details`}
                                      >
                                        {platform}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-400 block mb-1">Products:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {row.products.map((product, i) => (
                                      <button 
                                        key={i} 
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                                        style={{
                                          backgroundColor: '#333',
                                          color: '#FFD600',
                                          border: '1px solid #FFD600'
                                        }}
                                        onClick={() => alert(`Product Performance:\n\nProduct: ${product}\nCampaign: ${row.marketingFunnelStage}\nStage: ${row.reforgeGrowthStage}\nDate: ${row.dateRange}`)}
                                        title={`Click for ${product} performance details`}
                                      >
                                        {product}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Detailed Strategy & Execution - Full Width */}
                            <div className="rounded-lg border p-4 lg:col-span-3" style={{ backgroundColor: '#222', borderColor: '#444' }}>
                              <span className="text-sm font-medium text-white mb-3 block">Detailed Strategy & Execution</span>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-bold text-white mb-2">{row.contentMetadata.contentType}</h4>
                                <div className="space-y-1 text-sm text-gray-300 mb-3">
                                  <div>• <span className="font-medium">Content:</span> {row.formats.join(', ')}</div>
                                  <div>• <span className="font-medium">Format:</span> {row.formatTypes.join(', ')}</div>
                                  <div>• <span className="font-medium">Goal:</span> {row.contentMetadata.targetIntent}</div>
                                  <div>• <span className="font-medium">Campaign Goals:</span> {row.contentMetadata.campaignGoals}</div>
                                </div>
                              </div>
                              
                              <div className="border-t pt-3" style={{ borderColor: '#FFD600' }}>
                                <span className="text-xs font-medium text-gray-400 block mb-2">Execution Details:</span>
                                <p className="text-sm text-gray-300">{row.whatYouDid}</p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t" style={{ borderColor: '#FFD600' }}>
                                <div>
                                  <span className="text-xs font-medium text-gray-400 block mb-1">Micro Metrics:</span>
                                  <div className="space-y-1">
                                    {row.microMetrics.map((metric, i) => (
                                      <button 
                                        key={i} 
                                        className="text-sm text-gray-300 flex items-center gap-1 hover:bg-gray-800 rounded px-2 py-1 transition-colors cursor-pointer w-full text-left"
                                        onClick={() => alert(`Metric Details:\n\n${metric}\nCampaign: ${row.marketingFunnelStage}\nPeriod: ${row.dateRange}`)}
                                        title={`Click for ${metric} breakdown`}
                                      >
                                        <span style={{ color: '#FFD600' }}>↗</span>
                                        {metric}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-400 block mb-1">Auto-Calculated Impact:</span>
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
                                          {impact.preAvg && impact.postAvg && (
                                            <span className="text-xs text-gray-500">
                                              Pre: {impact.preAvg}/day → {impact.impactType === 'spike' ? `Spike: ${impact.spikeDayValue}` : `Post: ${impact.postAvg}/day`}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-400 block mb-1">Product Focus:</span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#333', color: '#FFD600', border: '1px solid #FFD600' }}>
                                    {row.productType}
                                  </span>
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

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            className="rounded-lg border p-4 transition-all cursor-pointer text-left hover:bg-gray-800"
            style={{ 
              backgroundColor: '#111', 
              borderColor: '#333',
              ':hover': { borderColor: '#FFD600' }
            }}
            onClick={() => alert(`Active Campaigns Details:\n\nTotal: ${filteredData.length} campaigns\nFiltered results based on current selection\n\nBreakdown (in funnel order):\n- Awareness: ${filteredData.filter(r => r.marketingFunnelStage === 'Awareness').length}\n- Download + Registration: ${filteredData.filter(r => r.marketingFunnelStage === 'Download + Registration').length}\n- Link Salary Account: ${filteredData.filter(r => r.marketingFunnelStage === 'Link Salary Account').length}\n- Apply: ${filteredData.filter(r => r.marketingFunnelStage === 'Apply').length}\n- Accept: ${filteredData.filter(r => r.marketingFunnelStage === 'Accept').length}\n- Reapply / Retention: ${filteredData.filter(r => r.marketingFunnelStage === 'Reapply / Retention').length}`)}
            title="Click for campaign breakdown"
          >
            <div className="text-2xl font-bold" style={{ color: '#FFD600' }}>{filteredData.length}</div>
            <div className="text-sm text-gray-300">Active Campaigns</div>
          </button>
          <button 
            className="rounded-lg border p-4 transition-all cursor-pointer text-left hover:bg-gray-800"
            style={{ 
              backgroundColor: '#111', 
              borderColor: '#333',
              ':hover': { borderColor: '#FFD600' }
            }}
            onClick={() => {
              const positiveImpacts = filteredData.filter(c => {
                const impact = calculateImpact(c);
                return impact.status === 'positive';
              }).length;
              alert(`Impact Calculation Results:\n\nPositive Impacts: ${positiveImpacts}\nNeutral/Negative: ${filteredData.length - positiveImpacts}\n\n${uploadedData.length > 0 ? 'Based on uploaded data analysis' : 'Based on demo data - upload CSV for real analysis'}`);
            }}
            title="Click for impact calculation results"
          >
            <div className="text-2xl font-bold" style={{ color: '#FFD600' }}>
              {uploadedData.length > 0 ? 
                `${filteredData.filter(c => {
                  const impact = calculateImpact(c);
                  return impact.status === 'positive';
                }).length}` : 
                '⚠️'
              }
            </div>
            <div className="text-sm text-gray-300">
              {uploadedData.length > 0 ? 'Positive Impacts' : 'Data Status'}
            </div>
          </button>
          <button 
            className="rounded-lg border p-4 transition-all cursor-pointer text-left hover:bg-gray-800"
            style={{ 
              backgroundColor: '#111', 
              borderColor: '#333',
              ':hover': { borderColor: '#FFD600' }
            }}
            onClick={() => alert(`Platform Distribution:\n\nTop platforms across campaigns:\n- Meta: ${filteredData.filter(r => r.platforms.includes('Meta')).length} campaigns\n- TikTok: ${filteredData.filter(r => r.platforms.includes('TikTok')).length} campaigns\n- Google: ${filteredData.filter(r => r.platforms.includes('Google')).length} campaigns\n- Instagram: ${filteredData.filter(r => r.platforms.includes('Instagram')).length} campaigns`)}
            title="Click for platform breakdown"
          >
            <div className="text-2xl font-bold" style={{ color: '#FFD600' }}>{new Set(filteredData.flatMap(r => r.platforms)).size}</div>
            <div className="text-sm text-gray-300">Active Platforms</div>
          </button>
          <button 
            className="rounded-lg border p-4 transition-all cursor-pointer text-left hover:bg-gray-800"
            style={{ 
              backgroundColor: '#111', 
              borderColor: '#333',
              ':hover': { borderColor: '#FFD600' }
            }}
            onClick={() => alert(`Product Distribution:\n\nTop products across campaigns:\n- Advance Salary: ${filteredData.filter(r => r.products.includes('Advance Salary')).length} campaigns\n- Personal Finance: ${filteredData.filter(r => r.products.includes('Personal Finance')).length} campaigns\n- Instant Finance: ${filteredData.filter(r => r.products.includes('Instant Finance')).length} campaigns\n- Budgeting: ${filteredData.filter(r => r.products.includes('Budgeting')).length} campaigns\n- Sukuk: ${filteredData.filter(r => r.products.includes('Sukuk')).length} campaigns\n- Marketplace: ${filteredData.filter(r => r.products.includes('Marketplace')).length} campaigns`)}
            title="Click for product breakdown"
          >
            <div className="text-2xl font-bold" style={{ color: '#FFD600' }}>{new Set(filteredData.flatMap(r => r.products)).size}</div>
            <div className="text-sm text-gray-300">Active Products</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReforgeGrowthDashboard;
