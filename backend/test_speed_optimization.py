#!/usr/bin/env python3
"""
Quick speed test for marketing lab optimization
"""
import requests
import time
import json

# Test the speed of marketing lab content generation
def test_marketing_lab_speed():
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
    
    print("🚀 Testing Marketing Lab Speed Optimization...")
    print(f"Target: Under 20 seconds (was 5+ minutes)")
    print("=" * 50)
    
    start_time = time.time()
    
    try:
        response = requests.post(url, json=test_data, timeout=30)
        end_time = time.time()
        
        duration = end_time - start_time
        
        print(f"⏱️  Generation Time: {duration:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            content_length = len(data.get('recommendations', {}).get('content', ''))
            print(f"✅ Success! Content length: {content_length} characters")
            print(f"🎯 Speed improvement: {((300 - duration) / 300 * 100):.1f}% faster than 5 minutes")
            
            if duration < 20:
                print("🏆 EXCELLENT: Under 20 seconds!")
            elif duration < 60:
                print("✅ GOOD: Under 1 minute!")
            else:
                print("⚠️  Still slow, needs more optimization")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 seconds")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_marketing_lab_speed()
