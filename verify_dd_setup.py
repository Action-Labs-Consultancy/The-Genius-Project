#!/usr/bin/env python3
"""
Due Diligence Workflow Verification Script
Checks all components needed for the DD automation workflow
"""

import json
import os
import subprocess
import sys
import requests
from datetime import datetime

def check_file_exists(file_path, description):
    """Check if a required file exists"""
    if os.path.exists(file_path):
        print(f"✅ {description}: Found at {file_path}")
        return True
    else:
        print(f"❌ {description}: Missing at {file_path}")
        return False

def check_postgresql_connection():
    """Check PostgreSQL database connection"""
    try:
        result = subprocess.run([
            'docker', 'exec', 'dd_postgres', 'psql', 
            '-U', 'postgres', '-d', 'due_diligence_db',
            '-c', 'SELECT COUNT(*) FROM due_diligence_reports;'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ PostgreSQL: Database accessible and table exists")
            return True
        else:
            print(f"❌ PostgreSQL: Connection failed - {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ PostgreSQL: Error checking connection - {str(e)}")
        return False

def check_ollama_service():
    """Check if Ollama service is running"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            mistral_models = [m for m in models if 'mistral' in m.get('name', '').lower()]
            if mistral_models:
                print(f"✅ Ollama: Service running with Mistral models: {[m['name'] for m in mistral_models]}")
                return True
            else:
                print("⚠️  Ollama: Service running but no Mistral models found")
                return False
        else:
            print(f"❌ Ollama: Service not responding (status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Ollama: Service not accessible - {str(e)}")
        return False

def check_kanboard_config():
    """Check if Kanboard configuration exists"""
    # This is a placeholder - would need actual Kanboard URL and credentials
    print("⚠️  Kanboard: Manual verification required")
    print("   - Ensure Kanboard is accessible")
    print("   - Verify API token is valid")
    print("   - Test API access with: GET /jsonrpc.php")
    return None

def check_workflow_files():
    """Check if all workflow files exist"""
    base_path = os.path.dirname(os.path.abspath(__file__))
    files_to_check = [
        ('DD_Kanboard_Complete_Workflow.json', 'Complete DD Workflow'),
        ('DD_Kanboard_Core_Workflow.json', 'Core DD Workflow'),
        ('Workflow_Transformation_Analysis.md', 'Transformation Analysis'),
        ('DD_Implementation_Guide.md', 'Implementation Guide')
    ]
    
    all_exist = True
    for file_name, description in files_to_check:
        file_path = os.path.join(base_path, file_name)
        if not check_file_exists(file_path, description):
            all_exist = False
    
    return all_exist

def check_n8n_service():
    """Check if n8n service is accessible"""
    try:
        # Try common n8n ports
        for port in [5678, 8080, 3000]:
            try:
                response = requests.get(f'http://localhost:{port}', timeout=3)
                if response.status_code in [200, 401]:  # 401 is fine, means service is running
                    print(f"✅ n8n: Service detected on port {port}")
                    return True
            except:
                continue
        
        print("❌ n8n: Service not detected on common ports (5678, 8080, 3000)")
        return False
    except Exception as e:
        print(f"❌ n8n: Error checking service - {str(e)}")
        return False

def main():
    """Main verification function"""
    print("🔍 Due Diligence Workflow Verification")
    print("=" * 50)
    print(f"Verification Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    checks = []
    
    # Check workflow files
    print("📁 Checking Workflow Files:")
    checks.append(("Workflow Files", check_workflow_files()))
    print()
    
    # Check PostgreSQL
    print("🐘 Checking PostgreSQL Database:")
    checks.append(("PostgreSQL", check_postgresql_connection()))
    print()
    
    # Check Ollama
    print("🤖 Checking Ollama AI Service:")
    checks.append(("Ollama", check_ollama_service()))
    print()
    
    # Check n8n
    print("⚡ Checking n8n Service:")
    checks.append(("n8n", check_n8n_service()))
    print()
    
    # Check Kanboard (manual)
    print("📋 Checking Kanboard Integration:")
    check_kanboard_config()
    print()
    
    # Summary
    print("📊 Verification Summary:")
    print("=" * 30)
    
    passed = 0
    total = 0
    
    for name, result in checks:
        if result is not None:
            total += 1
            if result:
                passed += 1
                print(f"✅ {name}: PASS")
            else:
                print(f"❌ {name}: FAIL")
    
    print(f"\nTotal: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 All automated checks passed! Ready for workflow import.")
        print("\n📋 Next Steps:")
        print("1. Import DD_Kanboard_Complete_Workflow.json into n8n")
        print("2. Configure Kanboard API credentials")
        print("3. Test with a sample 'Due Diligence: Company' task")
    else:
        print(f"\n⚠️  {total - passed} checks failed. Please resolve issues before proceeding.")
        
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
