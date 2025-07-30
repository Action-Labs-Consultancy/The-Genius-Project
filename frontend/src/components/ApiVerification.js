import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const ApiVerification = () => {
  const [apiStatus, setApiStatus] = useState('checking...');
  const [brains, setBrains] = useState([]);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[API_VERIFICATION] ${message}`);
  };

  useEffect(() => {
    verifyApiConfiguration();
  }, []);

  const verifyApiConfiguration = async () => {
    addLog(`API Base URL: ${API_BASE_URL}`, 'config');
    addLog(`Current hostname: ${window.location.hostname}`, 'config');
    addLog(`Environment: ${process.env.NODE_ENV}`, 'config');
    addLog(`REACT_APP_API_BASE_URL: ${process.env.REACT_APP_API_BASE_URL || 'not set'}`, 'config');
    
    // Test health endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        addLog('✅ Backend health check passed', 'success');
        setApiStatus('connected');
      } else {
        addLog(`❌ Backend health check failed: ${response.status}`, 'error');
        setApiStatus('error');
      }
    } catch (error) {
      addLog(`❌ Backend connection failed: ${error.message}`, 'error');
      setApiStatus('error');
    }
  };

  const testBrainsApi = async () => {
    addLog('🧠 Testing Brains API...', 'info');
    
    try {
      const response = await fetch(API_ENDPOINTS.BRAINS);
      addLog(`📡 Request URL: ${API_ENDPOINTS.BRAINS}`, 'config');
      addLog(`📊 Response Status: ${response.status}`, response.ok ? 'success' : 'error');
      
      if (response.ok) {
        const data = await response.json();
        const brainsList = data.brains || data.data || (Array.isArray(data) ? data : []);
        setBrains(brainsList);
        addLog(`✅ Found ${brainsList.length} brains`, 'success');
      } else {
        addLog(`❌ Brains API failed: ${response.status}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Brains API error: ${error.message}`, 'error');
    }
  };

  const testCreateBrain = async () => {
    addLog('🔨 Testing Create Brain API...', 'info');
    
    const testBrain = {
      name: `Test Brain ${Date.now()}`,
      description: 'API verification test brain',
      system_prompt: 'You are a test AI assistant for API verification.'
    };

    try {
      const response = await fetch(API_ENDPOINTS.BRAINS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBrain)
      });
      
      addLog(`📡 POST Request URL: ${API_ENDPOINTS.BRAINS}`, 'config');
      addLog(`📊 Response Status: ${response.status}`, response.ok ? 'success' : 'error');
      
      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Brain created successfully: ${data.data?.name || 'Success'}`, 'success');
        // Refresh brains list
        testBrainsApi();
      } else {
        const errorData = await response.text();
        addLog(`❌ Create brain failed: ${response.status} - ${errorData}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Create brain error: ${error.message}`, 'error');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔍 API Verification Dashboard</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Configuration Status</h3>
        <p><strong>API Status:</strong> <span style={{ color: apiStatus === 'connected' ? 'green' : 'red' }}>{apiStatus}</span></p>
        <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
        <p><strong>Brains Endpoint:</strong> {API_ENDPOINTS.BRAINS}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Actions</h3>
        <button onClick={testBrainsApi} style={{ marginRight: '10px', padding: '8px 16px' }}>
          🧠 Test GET Brains
        </button>
        <button onClick={testCreateBrain} style={{ marginRight: '10px', padding: '8px 16px' }}>
          🔨 Test CREATE Brain
        </button>
        <button onClick={verifyApiConfiguration} style={{ padding: '8px 16px' }}>
          🔧 Recheck Config
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Current Brains ({brains.length})</h3>
        <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          {brains.map((brain, index) => (
            <div key={brain._id || index} style={{ marginBottom: '5px' }}>
              <strong>{brain.name}</strong> - {brain.description}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>API Logs</h3>
        <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #ccc', padding: '10px', backgroundColor: '#f5f5f5' }}>
          {logs.map((log, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '5px',
                color: log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : log.type === 'config' ? 'blue' : 'black'
              }}
            >
              <span style={{ opacity: 0.7 }}>[{log.timestamp}]</span> {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiVerification;
