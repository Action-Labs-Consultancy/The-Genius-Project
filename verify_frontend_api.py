#!/usr/bin/env python3
"""
Frontend API Call Verification Script
Verify that the frontend is making correct API calls to the LAN backend
"""

import json
import requests
import time
from datetime import datetime

def check_backend_status():
    """Check if backend is running and responding"""
    print("🔍 Checking Backend Status...")
    
    backend_url = "http://192.168.100.63:10000"
    
    try:
        # Test health endpoint
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend health check passed")
        else:
            print(f"⚠️  Backend health check returned: {response.status_code}")
        
        # Test brains API
        response = requests.get(f"{backend_url}/api/brains", timeout=5)
        if response.status_code == 200:
            data = response.json()
            brain_count = len(data.get('brains', data if isinstance(data, list) else []))
            print(f"✅ Brains API working - found {brain_count} brains")
            return True
        else:
            print(f"❌ Brains API failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to backend at {backend_url}")
        return False
    except Exception as e:
        print(f"❌ Backend check failed: {e}")
        return False

def check_frontend_status():
    """Check if frontend is running"""
    print("\n🌐 Checking Frontend Status...")
    
    frontend_url = "http://192.168.100.63:3000"
    
    try:
        response = requests.get(frontend_url, timeout=10)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"⚠️  Frontend returned: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to frontend at {frontend_url}")
        return False
    except Exception as e:
        print(f"❌ Frontend check failed: {e}")
        return False

def create_frontend_env_file():
    """Create a proper .env file for the frontend"""
    print("\n📝 Creating Frontend Environment File...")
    
    env_content = """# Frontend Environment Configuration for LAN Access
REACT_APP_API_BASE_URL=http://192.168.100.63:10000
REACT_APP_API_URL=http://192.168.100.63:10000
GENERATE_SOURCEMAP=false
"""
    
    env_path = "/Users/rabab/the-genius-project/frontend/.env"
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        print(f"✅ Created .env file at {env_path}")
        
        # Also create .env.local for priority
        env_local_path = "/Users/rabab/the-genius-project/frontend/.env.local"
        with open(env_local_path, 'w') as f:
            f.write(env_content)
        print(f"✅ Created .env.local file at {env_local_path}")
        
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")

def create_api_verification_component():
    """Create a React component to verify API calls in DevTools"""
    print("\n🔧 Creating API Verification Component...")
    
    component_content = """import React, { useState, useEffect } from 'react';
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
"""
    
    component_path = "/Users/rabab/the-genius-project/frontend/src/components/ApiVerification.js"
    
    try:
        with open(component_path, 'w') as f:
            f.write(component_content)
        print(f"✅ Created API verification component at {component_path}")
        
        # Instructions for using the component
        print("\n📋 To use the API verification component:")
        print("1. Add this to your App.js or any page:")
        print("   import ApiVerification from './components/ApiVerification';")
        print("2. Add <ApiVerification /> to your JSX")
        print("3. Open DevTools Network tab and test the API calls")
        
    except Exception as e:
        print(f"❌ Failed to create component: {e}")

def show_devtools_instructions():
    """Show detailed DevTools verification instructions"""
    print("\n🛠️  DevTools Verification Instructions:")
    print("=" * 60)
    
    print("\n1. 🌐 Open Browser on Another PC:")
    print("   - Navigate to: http://192.168.100.63:3000")
    print("   - Open DevTools (F12)")
    print("   - Go to Network tab")
    print("   - Clear any existing entries")
    
    print("\n2. 🔍 Check API Configuration:")
    print("   - Look at Console tab for API configuration logs")
    print("   - Should see: '🏠 Using default development API URL: http://192.168.100.63:10000'")
    print("   - Or: '📡 LAN access detected, using: http://192.168.100.63:10000'")
    
    print("\n3. 🧠 Test Brain Operations:")
    print("   - Click 'Create Brain' or navigate to Brains page")
    print("   - Watch Network tab for requests")
    print("   - Expected URLs:")
    print("     • GET http://192.168.100.63:10000/api/brains")
    print("     • POST http://192.168.100.63:10000/api/brains")
    print("   - Status should be 200/201")
    
    print("\n4. 🚨 Common Issues to Check:")
    print("   - ❌ URLs contain 'localhost' instead of '192.168.100.63'")
    print("   - ❌ CORS errors (blocked by CORS policy)")
    print("   - ❌ Network errors (ERR_CONNECTION_REFUSED)")
    print("   - ❌ 404 errors (endpoint not found)")
    
    print("\n5. 🔧 If Issues Found:")
    print("   - Check frontend .env file has REACT_APP_API_BASE_URL")
    print("   - Restart frontend with: REACT_APP_API_BASE_URL=http://192.168.100.63:10000 npm start")
    print("   - Verify backend is running on port 10000")
    print("   - Check CORS configuration in backend")

def create_startup_script():
    """Create a script to start services with correct configuration"""
    print("\n🚀 Creating Startup Script...")
    
    script_content = """#!/bin/bash
# Startup script for LAN access with proper API configuration

echo "🚀 Starting The Genius Project for LAN Access"
echo "=============================================="

# Check if backend is running
if ! curl -s http://192.168.100.63:10000/health > /dev/null; then
    echo "⚠️  Backend not running, starting it..."
    cd /Users/rabab/the-genius-project/backend
    nohup python3 app.py > backend.log 2>&1 &
    echo "🔄 Waiting for backend to start..."
    sleep 5
fi

# Check backend again
if curl -s http://192.168.100.63:10000/health > /dev/null; then
    echo "✅ Backend is running on http://192.168.100.63:10000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend with LAN configuration
echo "🌐 Starting frontend with LAN API configuration..."
cd /Users/rabab/the-genius-project/frontend

# Create .env.local with priority
cat > .env.local << EOF
REACT_APP_API_BASE_URL=http://192.168.100.63:10000
REACT_APP_API_URL=http://192.168.100.63:10000
GENERATE_SOURCEMAP=false
EOF

echo "📝 Created .env.local with LAN configuration"

# Start frontend
echo "🚀 Starting frontend on http://192.168.100.63:3000"
REACT_APP_API_BASE_URL=http://192.168.100.63:10000 npm start

echo "✅ Services started! Access from any device on LAN:"
echo "   Frontend: http://192.168.100.63:3000"
echo "   Backend:  http://192.168.100.63:10000"
"""
    
    script_path = "/Users/rabab/the-genius-project/start_lan_access.sh"
    
    try:
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Make executable
        import os
        os.chmod(script_path, 0o755)
        
        print(f"✅ Created startup script at {script_path}")
        print("📋 To use: ./start_lan_access.sh")
        
    except Exception as e:
        print(f"❌ Failed to create startup script: {e}")

def main():
    """Main verification function"""
    print("🔍 Frontend API Call Verification")
    print("=" * 50)
    
    # Check services
    backend_ok = check_backend_status()
    frontend_ok = check_frontend_status()
    
    # Create configuration files
    create_frontend_env_file()
    
    # Create verification tools
    create_api_verification_component()
    create_startup_script()
    
    # Show instructions
    show_devtools_instructions()
    
    print("\n✅ Verification Setup Complete!")
    print("\n📋 Next Steps:")
    print("1. Restart frontend with: ./start_lan_access.sh")
    print("2. Open http://192.168.100.63:3000 on another PC")
    print("3. Open DevTools and check Network tab")
    print("4. Test brain creation and verify API URLs")
    
    if not backend_ok:
        print("\n⚠️  WARNING: Backend is not responding!")
        print("   Start with: cd backend && python3 app.py")
    
    if not frontend_ok:
        print("\n⚠️  WARNING: Frontend is not accessible!")
        print("   Start with the startup script or manually")

if __name__ == "__main__":
    main()
