import React, { useState, useEffect } from 'react';

const campaigns = ['Campaign A', 'Campaign B'];
const platforms = ['TikTok', 'Meta'];
const markets = ['KSA', 'Bahrain', 'UAE'];

const calculatorTypes = [
  'Ad Performance KPIs',
  'Budget Pacing',
  'Weekly Variance',
  'Funnel Analysis',
  'Budget Lookup'
];

// Pro-tip defaults and validation
const DEFAULT_FX_RATE = '0.377'; // Latest BHD rate
const DEFAULT_BUDGET_MULTIPLIER = '2.5';
const MIN_DATE = new Date().toISOString().split('T')[0]; // Today

export default function SpendTracker() {
  // Calculator selector
  const [selectedCalculator, setSelectedCalculator] = useState('Ad Performance KPIs');
  
  // Bulk import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Last week comparison data (mock for demo)
  const [lastWeekData] = useState({
    spend: 1200,
    impressions: 50000,
    clicks: 750,
    conversions: 25
  });
  
  // Ad Performance inputs
  const [spend, setSpend] = useState('');
  const [impressions, setImpressions] = useState('');
  const [clicks, setClicks] = useState('');
  const [conversions, setConversions] = useState('');
  
  // Budget Pacing inputs
  const [totalBudget, setTotalBudget] = useState('');
  const [budgetMultiplier, setBudgetMultiplier] = useState(DEFAULT_BUDGET_MULTIPLIER);
  const [spendToDate, setSpendToDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [carryoverSpend, setCarryoverSpend] = useState('');
  
  // Weekly Variance inputs
  const [plannedSpend, setPlannedSpend] = useState('');
  const [plannedImpr, setPlannedImpr] = useState('');
  
  // Funnel inputs
  const [storeVisits, setStoreVisits] = useState('');
  const [installs, setInstalls] = useState('');
  const [onboards, setOnboards] = useState('');
  const [wakala, setWakala] = useState('');
  
  // Budget Lookup inputs
  const [usdAmount, setUsdAmount] = useState('');
  const [fxRate, setFxRate] = useState(DEFAULT_FX_RATE);

  // Validation functions
  const validateInput = (field, value, relatedValue = null) => {
    const errors = {};
    const numValue = parseFloat(value);
    const relatedNum = parseFloat(relatedValue);

    switch(field) {
      case 'clicks':
        if (relatedValue && numValue > relatedNum) {
          errors.clicks = 'Clicks cannot exceed impressions';
        }
        break;
      case 'conversions':
        if (relatedValue && numValue > relatedNum) {
          errors.conversions = 'Conversions cannot exceed clicks';
        }
        break;
      case 'endDate':
        if (value && new Date(value) < new Date()) {
          errors.endDate = 'End date cannot be in the past';
        }
        break;
      case 'installs':
        if (relatedValue && numValue > relatedNum) {
          errors.installs = 'Installs cannot exceed store visits';
        }
        break;
      case 'onboards':
        if (relatedValue && numValue > relatedNum) {
          errors.onboards = 'Onboards cannot exceed installs';
        }
        break;
      case 'wakala':
        if (relatedValue && numValue > relatedNum) {
          errors.wakala = 'WAKALA cannot exceed onboards';
        }
        break;
    }
    return errors;
  };

  // Update validation on input changes
  useEffect(() => {
    const newErrors = {
      ...validateInput('clicks', clicks, impressions),
      ...validateInput('conversions', conversions, clicks),
      ...validateInput('endDate', endDate),
      ...validateInput('installs', installs, storeVisits),
      ...validateInput('onboards', onboards, installs),
      ...validateInput('wakala', wakala, onboards)
    };
    setErrors(newErrors);
  }, [clicks, impressions, conversions, endDate, installs, storeVisits, onboards, wakala]);

  // Bulk import handler
  const handleBulkImport = () => {
    try {
      // Expected format: "spend,impressions,clicks,conversions" per line
      const lines = bulkData.trim().split('\n');
      const firstRow = lines[0].split(',');
      
      if (firstRow.length >= 4) {
        setSpend(firstRow[0].trim());
        setImpressions(firstRow[1].trim());
        setClicks(firstRow[2].trim());
        setConversions(firstRow[3].trim());
        setShowBulkImport(false);
        setBulkData('');
      } else {
        alert('Invalid format. Use: spend,impressions,clicks,conversions per line');
      }
    } catch (e) {
      alert('Error parsing bulk data. Please check format.');
    }
  };

  // Week-over-week comparison
  const getWeekOverWeekChange = (current, previous) => {
    if (!current || !previous) return null;
    const change = ((parseFloat(current) - previous) / previous * 100).toFixed(1);
    return change;
  };

  // Calculations
  const calc = {
    // Ad Performance KPIs
    cpc: (spend && clicks) ? (parseFloat(spend) / parseFloat(clicks)).toFixed(2) : '',
    cpm: (spend && impressions) ? (parseFloat(spend) / (parseFloat(impressions) / 1000)).toFixed(2) : '',
    ctr: (clicks && impressions) ? (parseFloat(clicks) / parseFloat(impressions) * 100).toFixed(2) : '',
    costPerConv: (spend && conversions) ? (parseFloat(spend) / parseFloat(conversions)).toFixed(2) : '',
    cvr: (conversions && impressions) ? (parseFloat(conversions) / parseFloat(impressions) * 100).toFixed(4) : '',
    
    // Budget Pacing
    remainingBudget: (totalBudget && budgetMultiplier && spendToDate) ? 
      (parseFloat(totalBudget) * parseFloat(budgetMultiplier) - parseFloat(spendToDate)).toFixed(2) : '',
    daysLeft: endDate ? Math.max(0, Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))) : '',
    get dailyTarget() {
      return (this.remainingBudget && this.daysLeft > 0) ? 
        (parseFloat(this.remainingBudget) / this.daysLeft).toFixed(2) : '';
    },
    get todaysAllowance() {
      return (this.dailyTarget && carryoverSpend) ? 
        (parseFloat(this.dailyTarget) - parseFloat(carryoverSpend)).toFixed(2) : this.dailyTarget;
    },
    
    // Weekly Variance
    deliveredCPM: (spend && impressions) ? (parseFloat(spend) / (parseFloat(impressions) / 1000)).toFixed(2) : '',
    plannedCPM: (plannedSpend && plannedImpr) ? (parseFloat(plannedSpend) / (parseFloat(plannedImpr) / 1000)).toFixed(2) : '',
    get cpmVariance() {
      return (this.deliveredCPM && this.plannedCPM) ? 
        (((parseFloat(this.deliveredCPM) - parseFloat(this.plannedCPM)) / parseFloat(this.plannedCPM)) * 100).toFixed(1) : '';
    },
    
    // Funnel Analysis
    installRate: (installs && storeVisits) ? (parseFloat(installs) / parseFloat(storeVisits) * 100).toFixed(2) : '',
    onboardRate: (onboards && installs) ? (parseFloat(onboards) / parseFloat(installs) * 100).toFixed(2) : '',
    wakalaRate: (wakala && onboards) ? (parseFloat(wakala) / parseFloat(onboards) * 100).toFixed(2) : '',
    cacAtWakala: (spend && wakala) ? (parseFloat(spend) / parseFloat(wakala)).toFixed(2) : '',
    
    // Budget Lookup
    bhdAmount: (usdAmount && fxRate) ? (parseFloat(usdAmount) * parseFloat(fxRate)).toFixed(2) : ''
  };

  // Warning badges for unusual variances
  const getWarningBadge = (variance, threshold = 20) => {
    const absVariance = Math.abs(parseFloat(variance));
    if (absVariance > threshold) {
      return (
        <span style={{ 
          background: '#ff6b6b', 
          color: '#fff', 
          padding: '2px 6px', 
          borderRadius: 4, 
          fontSize: 12, 
          fontWeight: 700, 
          marginLeft: 8 
        }}>
          ⚠️ HIGH
        </span>
      );
    }
    return null;
  };

  // Pro-tip component
  const ProTip = ({ children }) => (
    <div style={{ 
      background: '#2d5a87', 
      border: '1px solid #4a90e2', 
      borderRadius: 6, 
      padding: 8, 
      fontSize: 12, 
      color: '#b3d9ff', 
      marginTop: 8 
    }}>
      💡 <strong>Pro Tip:</strong> {children}
    </div>
  );

  // Input component with validation
  const ValidatedInput = ({ label, value, onChange, error, type = "number", placeholder, proTip }) => (
    <div>
      <label style={{ color: '#fff', fontWeight: 600 }}>
        {label}<br />
        <input 
          type={type} 
          value={value} 
          onChange={onChange} 
          style={{ 
            width: '100%', 
            padding: 8, 
            borderRadius: 6, 
            border: error ? '2px solid #ff6b6b' : 'none',
            backgroundColor: error ? '#ffe6e6' : '#fff'
          }} 
          placeholder={placeholder}
          min={type === 'date' ? MIN_DATE : undefined}
        />
      </label>
      {error && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>⚠️ {error}</div>}
      {proTip && <ProTip>{proTip}</ProTip>}
    </div>
  );

  const renderCalculator = () => {
    switch(selectedCalculator) {
      case 'Ad Performance KPIs':
        return (
          <div>
            {/* Week-over-week summary */}
            {spend && (
              <div style={{ background: '#2d4a87', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <h4 style={{ color: '#FFD600', marginBottom: 8 }}>📊 What's Changed Since Last Week</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#bbb' }}>Spend</div>
                    <div style={{ fontWeight: 700 }}>
                      {getWeekOverWeekChange(spend, lastWeekData.spend) ? 
                        `${getWeekOverWeekChange(spend, lastWeekData.spend) > 0 ? '+' : ''}${getWeekOverWeekChange(spend, lastWeekData.spend)}%` : 
                        'New'
                      }
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#bbb' }}>CTR</div>
                    <div style={{ fontWeight: 700 }}>
                      {calc.ctr ? `${calc.ctr}%` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Enter Your Data:</h3>
            
            {/* Bulk import button */}
            <div style={{ marginBottom: 16 }}>
              <button 
                onClick={() => setShowBulkImport(!showBulkImport)}
                style={{ 
                  background: '#4a90e2', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '8px 16px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                📋 Bulk Import Data
              </button>
            </div>

            {/* Bulk import modal */}
            {showBulkImport && (
              <div style={{ background: '#333', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ color: '#FFD600', marginBottom: 8 }}>Bulk Import</h4>
                <div style={{ fontSize: 12, color: '#bbb', marginBottom: 8 }}>
                  Format: spend,impressions,clicks,conversions (one row per line)
                </div>
                <textarea
                  value={bulkData}
                  onChange={e => setBulkData(e.target.value)}
                  style={{ width: '100%', height: 80, padding: 8, borderRadius: 4, border: 'none' }}
                  placeholder="1200,45000,650,22"
                />
                <div style={{ marginTop: 8 }}>
                  <button onClick={handleBulkImport} style={{ background: '#51cf66', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', marginRight: 8 }}>
                    Import
                  </button>
                  <button onClick={() => setShowBulkImport(false)} style={{ background: '#666', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <ValidatedInput
                label="Spend"
                value={spend}
                onChange={e => setSpend(e.target.value)}
                placeholder="0.00"
                proTip="Higher spend = better reach, but watch your efficiency metrics"
              />
              <ValidatedInput
                label="Impressions"
                value={impressions}
                onChange={e => setImpressions(e.target.value)}
                placeholder="0"
                proTip="Should be much higher than clicks (typical CTR: 0.5-2%)"
              />
              <ValidatedInput
                label="Clicks"
                value={clicks}
                onChange={e => setClicks(e.target.value)}
                error={errors.clicks}
                placeholder="0"
                proTip="Must be ≤ impressions. Good CTR = 1%+"
              />
              <ValidatedInput
                label="Conversions"
                value={conversions}
                onChange={e => setConversions(e.target.value)}
                error={errors.conversions}
                placeholder="0"
                proTip="Must be ≤ clicks. Good CVR = 2-5%"
              />
            </div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Calculated KPIs:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>CPC</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.cpc || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>CPM</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.cpm || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>CTR (%)</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.ctr || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Cost/Conv</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.costPerConv || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>CVR (%)</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.cvr || '—'}</div>
              </div>
            </div>
          </div>
        );
      
      case 'Budget Pacing':
        return (
          <div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Budget Inputs:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <ValidatedInput
                label="Total Budget (BHD)"
                value={totalBudget}
                onChange={e => setTotalBudget(e.target.value)}
                placeholder="0.00"
                proTip="Monthly campaign budget in Bahraini Dinars"
              />
              <ValidatedInput
                label="Budget Multiplier"
                value={budgetMultiplier}
                onChange={e => setBudgetMultiplier(e.target.value)}
                placeholder="2.5"
                proTip="Standard: 2.5x for safety buffer. Aggressive: 1.5x"
              />
              <ValidatedInput
                label="Spend to Date (BHD)"
                value={spendToDate}
                onChange={e => setSpendToDate(e.target.value)}
                placeholder="0.00"
                proTip="Total spent so far this period"
              />
              <ValidatedInput
                label="End Date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                error={errors.endDate}
                proTip="Campaign end date - must be in future"
              />
              <ValidatedInput
                label="Carry-over Spend"
                value={carryoverSpend}
                onChange={e => setCarryoverSpend(e.target.value)}
                placeholder="0.00"
                proTip="Yesterday's unspent budget to add to today"
              />
            </div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Budget Calculations:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Remaining Budget</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.remainingBudget || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Days Left</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.daysLeft || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Daily Target</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.dailyTarget || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Today's Allowance</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: calc.todaysAllowance > calc.dailyTarget ? '#51cf66' : '#fff' }}>
                  {calc.todaysAllowance || '—'}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'Weekly Variance':
        return (
          <div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Weekly Data:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <ValidatedInput
                label="Delivered Spend"
                value={spend}
                onChange={e => setSpend(e.target.value)}
                placeholder="0.00"
                proTip="Actual spend for the week"
              />
              <ValidatedInput
                label="Delivered Impressions"
                value={impressions}
                onChange={e => setImpressions(e.target.value)}
                placeholder="0"
                proTip="Actual impressions delivered"
              />
              <ValidatedInput
                label="Planned Spend"
                value={plannedSpend}
                onChange={e => setPlannedSpend(e.target.value)}
                placeholder="0.00"
                proTip="What you planned to spend this week"
              />
              <ValidatedInput
                label="Planned Impressions"
                value={plannedImpr}
                onChange={e => setPlannedImpr(e.target.value)}
                placeholder="0"
                proTip="Impressions you planned to deliver"
              />
            </div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Variance Analysis:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Delivered CPM</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.deliveredCPM || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Planned CPM</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.plannedCPM || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>CPM Variance (%)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: calc.cpmVariance > 0 ? '#ff6b6b' : '#51cf66' }}>
                  {calc.cpmVariance ? (calc.cpmVariance > 0 ? '+' : '') + calc.cpmVariance + '%' : '—'}
                  {calc.cpmVariance && getWarningBadge(calc.cpmVariance)}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'Funnel Analysis':
        return (
          <div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Funnel Steps:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <ValidatedInput
                label="Store Visits"
                value={storeVisits}
                onChange={e => setStoreVisits(e.target.value)}
                placeholder="0"
                proTip="Top of funnel - all app store visits"
              />
              <ValidatedInput
                label="Installs"
                value={installs}
                onChange={e => setInstalls(e.target.value)}
                error={errors.installs}
                placeholder="0"
                proTip="Must be ≤ store visits. Good rate: 15-25%"
              />
              <ValidatedInput
                label="Onboards"
                value={onboards}
                onChange={e => setOnboards(e.target.value)}
                error={errors.onboards}
                placeholder="0"
                proTip="Must be ≤ installs. Good rate: 60-80%"
              />
              <ValidatedInput
                label="WAKALA"
                value={wakala}
                onChange={e => setWakala(e.target.value)}
                error={errors.wakala}
                placeholder="0"
                proTip="Must be ≤ onboards. Final conversion goal"
              />
              <ValidatedInput
                label="Total Spend"
                value={spend}
                onChange={e => setSpend(e.target.value)}
                placeholder="0.00"
                proTip="Used to calculate CAC at each funnel step"
              />
            </div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Conversion Rates:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Install Rate (%)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: calc.installRate > 20 ? '#51cf66' : calc.installRate > 10 ? '#FFD600' : '#ff6b6b' }}>
                  {calc.installRate || '—'}
                </div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>Onboard Rate (%)</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: calc.onboardRate > 70 ? '#51cf66' : calc.onboardRate > 50 ? '#FFD600' : '#ff6b6b' }}>
                  {calc.onboardRate || '—'}
                </div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>WAKALA Rate (%)</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.wakalaRate || '—'}</div>
              </div>
              <div style={{ background: '#333', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#FFD600', fontWeight: 700 }}>CAC at WAKALA</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{calc.cacAtWakala || '—'}</div>
              </div>
            </div>
          </div>
        );
      
      case 'Budget Lookup':
        return (
          <div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Currency Converter:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <ValidatedInput
                label="USD Amount"
                value={usdAmount}
                onChange={e => setUsdAmount(e.target.value)}
                placeholder="0.00"
                proTip="Enter amount in US Dollars"
              />
              <ValidatedInput
                label="FX Rate (USD to BHD)"
                value={fxRate}
                onChange={e => setFxRate(e.target.value)}
                placeholder="0.377"
                proTip={`Current rate: ${DEFAULT_FX_RATE} (updates daily)`}
              />
            </div>
            <h3 style={{ color: '#FFD600', marginBottom: 16 }}>Converted Amount:</h3>
            <div style={{ background: '#333', padding: 24, borderRadius: 8, textAlign: 'center', maxWidth: 300 }}>
              <div style={{ color: '#FFD600', fontWeight: 700, marginBottom: 8 }}>BHD Amount</div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{calc.bhdAmount || '—'}</div>
              {calc.bhdAmount && (
                <div style={{ fontSize: 12, color: '#bbb', marginTop: 8 }}>
                  Rate: 1 USD = {fxRate} BHD
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return <div>Select a calculator above</div>;
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', color: '#fff' }}>
      <h1 style={{ color: '#FFD600', fontWeight: 900, marginBottom: 24 }}>Spend Tracker</h1>
      
      {/* Calculator Selector */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ fontWeight: 700, fontSize: 18, color: '#FFD600' }}>Choose Calculator:<br />
          <select 
            value={selectedCalculator} 
            onChange={e => setSelectedCalculator(e.target.value)} 
            style={{ width: 300, padding: 12, borderRadius: 8, fontSize: 16, fontWeight: 600, marginTop: 8 }}
          >
            {calculatorTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>

      {/* Calculator Content */}
      <div style={{ background: '#232323', borderRadius: 12, padding: 32 }}>
        {renderCalculator()}
      </div>
    </div>
  );
}
