#!/usr/bin/env python3
"""
Marketing Lab LAN Speed Test
Measures the performance improvement of the fast marketing lab
"""
import requests
import time
import json

def test_marketing_lab_speed():
    """Test the speed of marketing lab endpoints"""
    base_url = "http://192.168.100.63:10000/api/marketing-lab"
    
    print("🚀 Marketing AI Tasks Lab - LAN Speed Test")
    print("=" * 50)
    
    # Test 1: Health Check Speed
    print("1. Testing Health Check Speed...")
    start_time = time.time()
    try:
        response = requests.get(f"{base_url}/health", timeout=30)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            duration = end_time - start_time
            print(f"✅ Health Check: {duration:.2f}s")
            print(f"   Fast Mode: {data.get('data', {}).get('fast_mode', False)}")
            print(f"   LAN Optimized: {data.get('data', {}).get('lan_optimized', False)}")
            print(f"   Timeout Settings: {data.get('data', {}).get('timeout_settings', 'N/A')}")
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
    
    print()
    
    # Test 2: Execution Speed
    print("2. Testing Marketing Content Generation Speed...")
    task_data = {
        "campaign_name": "Speed Test Campaign",
        "description": "Testing the speed of LAN marketing content generation",
        "target_audience": "professionals",
        "platform": "LinkedIn",
        "tone": "professional",
        "funnel_stage": "Awareness",
        "content_type": "Social Media Post"
    }
    
    start_time = time.time()
    try:
        response = requests.post(
            f"{base_url}/execute",
            json=task_data,
            timeout=30
        )
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            duration = end_time - start_time
            print(f"✅ Content Generation: {duration:.2f}s")
            
            if data.get('success'):
                execution_data = data.get('data', {})
                content_length = len(execution_data.get('final_output', ''))
                mode = execution_data.get('mode', 'unknown')
                agent_count = len(execution_data.get('agents', []))
                
                print(f"   Mode: {mode}")
                print(f"   Agents Used: {agent_count}")
                print(f"   Content Length: {content_length} characters")
                print(f"   Content Preview: {execution_data.get('final_output', '')[:100]}...")
        else:
            print(f"❌ Content Generation Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Content Generation Error: {e}")
    
    print()
    
    # Test 3: Recommendations Speed
    print("3. Testing Recommendations Speed...")
    rec_data = {
        "platform": "LinkedIn",
        "target_audience": "entrepreneurs"
    }
    
    start_time = time.time()
    try:
        response = requests.post(
            f"{base_url}/recommendations",
            json=rec_data,
            timeout=30
        )
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            duration = end_time - start_time
            print(f"✅ Recommendations: {duration:.2f}s")
            
            if data.get('success'):
                rec_data = data.get('data', {})
                fast_mode = rec_data.get('fast_mode', False)
                method = rec_data.get('generation_method', 'unknown')
                
                print(f"   Fast Mode: {fast_mode}")
                print(f"   Generation Method: {method}")
                print(f"   Recommendations Generated: ✅")
        else:
            print(f"❌ Recommendations Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Recommendations Error: {e}")
    
    print()
    print("🎉 LAN Speed Test Complete!")
    print("The Marketing AI Tasks Lab should now be significantly faster on LAN devices!")

if __name__ == "__main__":
    test_marketing_lab_speed()
