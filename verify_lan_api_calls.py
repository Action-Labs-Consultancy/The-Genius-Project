#!/usr/bin/env python3
"""
LAN API Verification Script for The Genius Project
==================================================

This script verifies that the frontend is correctly configured to make API calls
to the LAN backend IP (192.168.100.63:10000) and not localhost.

It provides comprehensive testing and verification instructions.
"""

import requests
import json
import time
import subprocess
import os
from datetime import datetime

# Configuration
BACKEND_IP = "192.168.100.63"
BACKEND_PORT = 10000
FRONTEND_PORT = 3000
API_BASE_URL = f"http://{BACKEND_IP}:{BACKEND_PORT}"
FRONTEND_URL = f"http://{BACKEND_IP}:{FRONTEND_PORT}"

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a formatted step"""
    print(f"\n📋 Step {step}: {description}")
    print("-" * 50)

def check_backend_status():
    """Check if backend is running and accessible"""
    print_header("Backend Status Check")
    
    try:
        # Test basic connectivity
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        print(f"✅ Backend health check: {response.status_code}")
        
        # Test brains API
        response = requests.get(f"{API_BASE_URL}/api/brains", timeout=5)
        if response.status_code == 200:
            data = response.json()
            brain_count = len(data.get('data', []))
            print(f"✅ Brains API accessible: {brain_count} brains found")
            
            # Show sample brain data
            if brain_count > 0:
                sample_brain = data['data'][0]
                print(f"📄 Sample brain: {sample_brain.get('name', 'Unknown')} ({sample_brain.get('_id', 'No ID')})")
        else:
            print(f"❌ Brains API error: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend connection failed: {e}")
        return False
    
    return True

def check_frontend_config():
    """Check frontend configuration files"""
    print_header("Frontend Configuration Check")
    
    # Check .env.local
    env_local_path = "/Users/rabab/the-genius-project/frontend/.env.local"
    if os.path.exists(env_local_path):
        print("✅ .env.local exists")
        with open(env_local_path, 'r') as f:
            content = f.read()
            if BACKEND_IP in content:
                print(f"✅ .env.local contains correct IP: {BACKEND_IP}")
            else:
                print(f"❌ .env.local missing correct IP: {BACKEND_IP}")
        print(f"📄 .env.local content:\n{content}")
    else:
        print("❌ .env.local not found")
    
    # Check api.js config
    api_config_path = "/Users/rabab/the-genius-project/frontend/src/config/api.js"
    if os.path.exists(api_config_path):
        print("✅ api.js config file exists")
        with open(api_config_path, 'r') as f:
            content = f.read()
            if "getApiBaseUrl" in content and "REACT_APP_API_BASE_URL" in content:
                print("✅ api.js has dynamic URL configuration")
            else:
                print("❌ api.js missing dynamic configuration")
    else:
        print("❌ api.js config file not found")

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    print_header("Frontend Accessibility Check")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print(f"✅ Frontend accessible at {FRONTEND_URL}")
            
            # Check if the response contains React app indicators
            if "react" in response.text.lower() or "root" in response.text:
                print("✅ React app detected in response")
            else:
                print("⚠️ Response doesn't look like React app")
                
        else:
            print(f"❌ Frontend error: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend connection failed: {e}")
        return False
    
    return True

def generate_verification_instructions():
    """Generate step-by-step verification instructions"""
    print_header("Manual Verification Instructions")
    
    instructions = f"""
🔍 BROWSER VERIFICATION STEPS:
=============================

1. 🌐 Open Browser on Another PC
   - Open any web browser on a different computer on the same LAN
   - Navigate to: {FRONTEND_URL}
   - The app should load normally

2. 🛠️ Open Developer Tools
   - Press F12 or right-click → "Inspect Element"
   - Go to the "Network" tab
   - Refresh the page (F5 or Ctrl+R)

3. 📡 Verify API Calls
   - Look for requests in the Network tab
   - Filter by "XHR" or "Fetch" to see API calls
   - Verify ALL API calls go to: {API_BASE_URL}
   - NO calls should go to localhost or 127.0.0.1

4. ✅ Test Brains Functionality
   - Navigate to the brains section of the app
   - Check Network tab for GET requests to: {API_BASE_URL}/api/brains
   - Try creating a new brain (if possible)
   - Check for POST requests to: {API_BASE_URL}/api/brains
   - Verify response status codes are 200/201

5. 🔍 Console Check
   - Go to "Console" tab in DevTools
   - Look for API configuration logs starting with "⚙️ API Configuration:"
   - Verify baseUrl shows: {API_BASE_URL}
   - Check for any error messages

6. 📱 Test Different Actions
   - Try different features in the app
   - Monitor Network tab for all API calls
   - Ensure consistent use of {BACKEND_IP}:{BACKEND_PORT}

🚨 RED FLAGS TO WATCH FOR:
- Any API calls to localhost, 127.0.0.1, or other IPs
- Failed API calls (red status codes in Network tab)
- CORS errors in Console
- "Network Error" messages

✅ SUCCESS INDICATORS:
- All API calls use {API_BASE_URL}
- Status codes are 200/201/204 for successful operations
- Brains load and display correctly
- No CORS or network errors in Console

🔧 TESTING ENDPOINTS:
- GET  {API_BASE_URL}/api/brains (should return brain list)
- POST {API_BASE_URL}/api/brains (when creating new brain)
- GET  {API_BASE_URL}/health (health check)
"""
    
    print(instructions)

def create_test_html():
    """Create a simple HTML test page to verify API calls"""
    print_header("Creating Browser Test Page")
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LAN API Test - The Genius Project</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .status {{
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }}
        .success {{ background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }}
        .error {{ background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }}
        .info {{ background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }}
        button {{
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }}
        button:hover {{ background: #0056b3; }}
        pre {{
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            border: 1px solid #e9ecef;
        }}
        .highlight {{ color: #007bff; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 LAN API Verification Test</h1>
        <p>This page tests API connectivity to <span class="highlight">{API_BASE_URL}</span></p>
        
        <div class="status info">
            <strong>Instructions:</strong>
            <ol>
                <li>Open DevTools (F12) and go to Network tab</li>
                <li>Click the test buttons below</li>
                <li>Verify all API calls go to <code>{BACKEND_IP}:{BACKEND_PORT}</code></li>
                <li>Check for successful responses (green status codes)</li>
            </ol>
        </div>

        <h2>API Tests</h2>
        <button onclick="testHealth()">Test Health Check</button>
        <button onclick="testBrains()">Test Brains API</button>
        <button onclick="testCreateBrain()">Test Create Brain</button>
        <button onclick="clearResults()">Clear Results</button>

        <h2>Results</h2>
        <div id="results"></div>

        <h2>API Configuration</h2>
        <pre id="config"></pre>
    </div>

    <script>
        const API_BASE_URL = '{API_BASE_URL}';
        const resultsDiv = document.getElementById('results');
        const configDiv = document.getElementById('config');

        // Display configuration
        configDiv.textContent = `API Base URL: ${{API_BASE_URL}}
Current Host: ${{window.location.hostname}}
Current Port: ${{window.location.port}}
Full URL: ${{window.location.href}}`;

        function addResult(message, type = 'info') {{
            const div = document.createElement('div');
            div.className = `status ${{type}}`;
            div.innerHTML = `<strong>${{new Date().toLocaleTimeString()}}</strong>: ${{message}}`;
            resultsDiv.appendChild(div);
            resultsDiv.scrollTop = resultsDiv.scrollHeight;
        }}

        function clearResults() {{
            resultsDiv.innerHTML = '';
        }}

        async function testHealth() {{
            addResult('Testing health endpoint...', 'info');
            try {{
                const response = await fetch(`${{API_BASE_URL}}/health`);
                if (response.ok) {{
                    const data = await response.text();
                    addResult(`✅ Health check successful: ${{response.status}} - ${{data}}`, 'success');
                }} else {{
                    addResult(`❌ Health check failed: ${{response.status}}`, 'error');
                }}
            }} catch (error) {{
                addResult(`❌ Health check error: ${{error.message}}`, 'error');
            }}
        }}

        async function testBrains() {{
            addResult('Testing brains endpoint...', 'info');
            try {{
                const response = await fetch(`${{API_BASE_URL}}/api/brains`);
                if (response.ok) {{
                    const data = await response.json();
                    const count = data.data ? data.data.length : 0;
                    addResult(`✅ Brains API successful: ${{response.status}} - Found ${{count}} brains`, 'success');
                    if (count > 0) {{
                        const sampleBrain = data.data[0];
                        addResult(`📄 Sample brain: ${{sampleBrain.name || 'Unknown'}}`, 'info');
                    }}
                }} else {{
                    addResult(`❌ Brains API failed: ${{response.status}}`, 'error');
                }}
            }} catch (error) {{
                addResult(`❌ Brains API error: ${{error.message}}`, 'error');
            }}
        }}

        async function testCreateBrain() {{
            addResult('Testing create brain endpoint...', 'info');
            const testBrain = {{
                name: `Test Brain ${{Date.now()}}`,
                description: 'Test brain created from LAN verification',
                type: 'test',
                created_at: new Date().toISOString()
            }};

            try {{
                const response = await fetch(`${{API_BASE_URL}}/api/brains`, {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                    }},
                    body: JSON.stringify(testBrain)
                }});

                if (response.ok) {{
                    const data = await response.json();
                    addResult(`✅ Create brain successful: ${{response.status}} - Created brain with ID: ${{data._id || 'Unknown'}}`, 'success');
                }} else {{
                    const errorText = await response.text();
                    addResult(`❌ Create brain failed: ${{response.status}} - ${{errorText}}`, 'error');
                }}
            }} catch (error) {{
                addResult(`❌ Create brain error: ${{error.message}}`, 'error');
            }}
        }}

        // Auto-run health check on page load
        window.addEventListener('load', () => {{
            addResult('Page loaded, running initial health check...', 'info');
            testHealth();
        }});
    </script>
</body>
</html>"""

    test_file_path = "/Users/rabab/the-genius-project/lan_api_test.html"
    with open(test_file_path, 'w') as f:
        f.write(html_content)
    
    print(f"✅ Created test page: {test_file_path}")
    print(f"🌐 Access it at: http://{BACKEND_IP}:8000/lan_api_test.html")
    print("   (Serve with: python3 -m http.server 8000)")

def main():
    """Main verification function"""
    print_header(f"LAN API Verification - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print(f"""
🎯 VERIFICATION TARGET:
- Backend: {API_BASE_URL}
- Frontend: {FRONTEND_URL}
- Goal: Ensure frontend makes API calls to {BACKEND_IP}:{BACKEND_PORT} (NOT localhost)
""")
    
    # Run checks
    backend_ok = check_backend_status()
    check_frontend_config()
    frontend_ok = test_frontend_accessibility()
    
    # Create test resources
    create_test_html()
    
    # Generate instructions
    generate_verification_instructions()
    
    # Final summary
    print_header("Verification Summary")
    print(f"Backend Status: {'✅ OK' if backend_ok else '❌ FAILED'}")
    print(f"Frontend Status: {'✅ OK' if frontend_ok else '❌ FAILED'}")
    
    if backend_ok and frontend_ok:
        print(f"""
🎉 READY FOR TESTING!
===================
1. Open browser on another PC
2. Navigate to: {FRONTEND_URL}
3. Open DevTools (F12) → Network tab
4. Verify all API calls use: {API_BASE_URL}
5. Test brains functionality and monitor network calls

📋 Use the created test page for additional verification:
   http://{BACKEND_IP}:8000/lan_api_test.html
""")
    else:
        print(f"""
⚠️ ISSUES DETECTED!
==================
Please resolve the above issues before testing from another PC.
""")

if __name__ == "__main__":
    main()
