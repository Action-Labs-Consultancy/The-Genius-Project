#!/usr/bin/env python3
"""
Test to verify the marketing lab is returning visible content
"""
import requests
import json

def test_content_visibility():
    url = "http://192.168.100.63:10000/api/marketing-lab/recommendations"
    
    test_data = {
        "audience": "Small business owners",
        "campaign": "Email automation tool", 
        "description": "Automated email marketing platform for small businesses",
        "content_type": "Social Media Post",
        "platform": "LinkedIn",
        "funnel_stage": "Awareness",
        "tone": "Professional",
        "time_option": "2 weeks"
    }
    
    print("🔍 Testing Content Visibility...")
    print("=" * 50)
    
    try:
        response = requests.post(url, json=test_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ API Response received successfully")
            print(f"📊 Response structure:")
            
            # Check what fields are present
            for key in data.keys():
                print(f"  - {key}: {type(data[key])}")
            
            # Check AI analysis content
            ai_analysis = data.get('ai_analysis', '')
            print(f"\n📝 AI Analysis Length: {len(ai_analysis)} characters")
            
            if ai_analysis:
                print("✅ AI Analysis Content Preview:")
                print("-" * 40)
                print(ai_analysis[:200] + "..." if len(ai_analysis) > 200 else ai_analysis)
                print("-" * 40)
            else:
                print("❌ No AI Analysis content found!")
            
            # Check structured data
            structured_data = data.get('data', {})
            print(f"\n📋 Structured Data Fields:")
            for key, value in structured_data.items():
                print(f"  - {key}: {type(value)} - {str(value)[:50]}...")
            
            # Check if there's content in recommendations
            recommendations = data.get('recommendations', {})
            if recommendations:
                content = recommendations.get('content', '')
                print(f"\n📄 Recommendations Content: {len(content)} characters")
                if content:
                    print("✅ Content Preview:")
                    print(content[:300] + "..." if len(content) > 300 else content)
                else:
                    print("❌ No content in recommendations!")
            else:
                print("\n❌ No 'recommendations' field found in response!")
            
            # Show full response structure for debugging
            print(f"\n🔧 Full Response Structure:")
            print(json.dumps(data, indent=2)[:500] + "...")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_content_visibility()
