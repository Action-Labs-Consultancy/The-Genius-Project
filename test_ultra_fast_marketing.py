#!/usr/bin/env python3
"""
Test script for ultra-fast marketing lab optimizations
"""
import time
import requests
import json

def test_marketing_speed():
    """Test the speed of optimized marketing lab"""
    
    url = "http://localhost:10000/api/marketing-lab/execute-quick"
    
    test_data = {
        "campaign_name": "Speed Optimization Test",
        "description": "Testing ultra-fast AI generation with optimized prompts",
        "target_audience": "developers and tech professionals",
        "platform": "LinkedIn",
        "tone": "professional"
    }
    
    print("🚀 Testing Ultra-Fast Marketing Lab Optimizations")
    print("=" * 60)
    print(f"Campaign: {test_data['campaign_name']}")
    print(f"Audience: {test_data['target_audience']}")
    print(f"Platform: {test_data['platform']}")
    print("=" * 60)
    
    start_time = time.time()
    
    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json=test_data,
            timeout=30
        )
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        print(f"⏱️  Total Execution Time: {execution_time:.2f} seconds")
        print(f"📡 HTTP Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                print("✅ SUCCESS - Ultra-fast optimization working!")
                
                # Check response structure
                data = result.get('data', {})
                final_output = data.get('final_output', '')
                
                if final_output:
                    print(f"📝 Generated Content Length: {len(final_output)} characters")
                    print("=" * 60)
                    print("Generated Content Preview:")
                    print("=" * 60)
                    print(final_output[:500] + "..." if len(final_output) > 500 else final_output)
                    print("=" * 60)
                    
                    # Performance assessment
                    if execution_time < 10:
                        print("🚀 EXCELLENT - Under 10 seconds (Ultra-fast!)")
                    elif execution_time < 20:
                        print("⚡ GOOD - Under 20 seconds (Fast)")
                    elif execution_time < 30:
                        print("⏰ ACCEPTABLE - Under 30 seconds")
                    else:
                        print("🐌 SLOW - Over 30 seconds (needs more optimization)")
                        
                else:
                    print("❌ FAILED - No content generated (final_output is empty)")
                    print(f"Response data: {json.dumps(data, indent=2)}")
                    
            else:
                print("❌ FAILED - API returned success=false")
                print(f"Error: {result.get('error', 'Unknown error')}")
                
        else:
            print(f"❌ FAILED - HTTP Error {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
    except requests.exceptions.Timeout:
        end_time = time.time()
        execution_time = end_time - start_time
        print(f"⏱️  Timeout after: {execution_time:.2f} seconds")
        print("❌ FAILED - Request timed out (needs optimization)")
        
    except Exception as e:
        end_time = time.time()
        execution_time = end_time - start_time
        print(f"⏱️  Failed after: {execution_time:.2f} seconds")
        print(f"❌ FAILED - Exception: {str(e)}")

if __name__ == "__main__":
    test_marketing_speed()
