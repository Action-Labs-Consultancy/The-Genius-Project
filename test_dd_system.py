#!/usr/bin/env python3
"""
Test script to verify Pinecone index contents and debug file processing issues
"""

import requests
import json
from datetime import datetime

def test_pinecone_contents():
    """Test what's actually in the Pinecone index"""
    
    print("🔍 PINECONE INDEX DIAGNOSTIC")
    print("=" * 60)
    
    # You'll need to replace these with your actual values
    PINECONE_API_KEY = "your-pinecone-api-key"
    PINECONE_HOST = "your-pinecone-host"
    INDEX_NAME = "n8n"
    
    # Query Pinecone to see what's in the index
    url = f"https://{PINECONE_HOST}/query"
    
    headers = {
        "Api-Key": PINECONE_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Query for all vectors (use a very generic query)
    query_data = {
        "vector": [0.0] * 1024,  # 1024 dimensions for mxbai-embed-large
        "topK": 100,  # Get up to 100 results
        "includeMetadata": True,
        "includeValues": False
    }
    
    try:
        response = requests.post(url, headers=headers, json=query_data)
        response.raise_for_status()
        
        data = response.json()
        matches = data.get("matches", [])
        
        print(f"📊 Total vectors in index: {len(matches)}")
        
        # Group by file_name
        file_counts = {}
        company_counts = {}
        
        for match in matches:
            metadata = match.get("metadata", {})
            file_name = metadata.get("file_name", "unknown")
            company_name = metadata.get("company_name", "unknown")
            
            file_counts[file_name] = file_counts.get(file_name, 0) + 1
            company_counts[company_name] = company_counts.get(company_name, 0) + 1
        
        print("\n📄 FILES IN INDEX:")
        for file_name, count in file_counts.items():
            print(f"  • {file_name}: {count} chunks")
        
        print("\n🏢 COMPANIES IN INDEX:")
        for company_name, count in company_counts.items():
            print(f"  • {company_name}: {count} chunks")
        
        # Show sample metadata
        if matches:
            print("\n🔍 SAMPLE METADATA:")
            sample_metadata = matches[0].get("metadata", {})
            for key, value in sample_metadata.items():
                print(f"  {key}: {value}")
    
    except requests.RequestException as e:
        print(f"❌ Error querying Pinecone: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_ollama_embeddings():
    """Test that Ollama embeddings are working"""
    
    print("\n🤖 OLLAMA EMBEDDINGS TEST")
    print("=" * 60)
    
    try:
        response = requests.post(
            'http://localhost:11434/api/embeddings',
            json={
                'model': 'mxbai-embed-large:latest',
                'prompt': 'This is a test document for due diligence analysis'
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            embedding = data.get('embedding', [])
            print(f"✅ Ollama working: {len(embedding)} dimensions")
            print(f"📊 Sample values: {embedding[:5]}...")
        else:
            print(f"❌ Ollama error: {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"❌ Ollama connection error: {e}")

def test_google_drive_api():
    """Test Google Drive API connection"""
    
    print("\n📁 GOOGLE DRIVE API TEST")
    print("=" * 60)
    
    # This would require your actual OAuth token
    print("ℹ️  To test Google Drive API:")
    print("1. Check your Google Drive credentials in n8n")
    print("2. Verify folder ID: 1hDbczPdamC3FDROskKamg9MdCYV5PY06")
    print("3. Ensure PDFs are in the folder")
    print("4. Check file permissions")

def debug_workflow_issues():
    """Provide debugging checklist"""
    
    print("\n🔧 WORKFLOW DEBUG CHECKLIST")
    print("=" * 60)
    
    checklist = [
        "✓ Verify Google Drive folder contains PDF files",
        "✓ Check Google Drive OAuth2 credentials are valid",
        "✓ Confirm Pinecone API credentials and index name",
        "✓ Test Ollama model 'mxbai-embed-large:latest' is available",
        "✓ Ensure n8n workflow is activated",
        "✓ Check n8n execution logs for errors",
        "✓ Verify webhook endpoints are accessible",
        "✓ Test PostgreSQL database connection (if using)",
        "✓ Monitor n8n memory usage (large files can cause issues)",
        "✓ Check firewall/network settings for API calls"
    ]
    
    for item in checklist:
        print(f"  {item}")
    
    print("\n💡 COMMON ISSUES:")
    print("  • Files not processed: Check Google Drive permissions")
    print("  • Single item in Pinecone: Workflow stopping after first file") 
    print("  • Memory errors: Large PDFs exceeding n8n limits")
    print("  • Authentication errors: Expired OAuth tokens")
    print("  • Network timeouts: Large file processing taking too long")

if __name__ == "__main__":
    print(f"🕐 Started at: {datetime.now()}")
    
    # Run tests
    test_ollama_embeddings()
    test_google_drive_api()
    debug_workflow_issues()
    
    print("\n" + "=" * 60)
    print("📝 NEXT STEPS:")
    print("1. Update PINECONE_API_KEY and PINECONE_HOST in this script")
    print("2. Run: python test_dd_system.py")
    print("3. Check n8n execution logs")
    print("4. Test with a small company folder first")
    print("=" * 60)
