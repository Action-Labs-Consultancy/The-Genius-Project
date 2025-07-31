#!/usr/bin/env python3
"""
Test to verify the queue management system prevents concurrent request overload
"""
import requests
import json
import threading
import time
from datetime import datetime

def make_request(request_id):
    """Make a single request to the recommendations endpoint"""
    url = "http://192.168.100.63:10000/api/marketing-lab/recommendations"
    
    test_data = {
        "audience": f"Test audience {request_id}",
        "campaign": f"Test campaign {request_id}", 
        "description": "Test marketing campaign for queue management testing",
        "content_type": "Social Media Post",
        "platform": "LinkedIn",
        "funnel_stage": "Awareness",
        "tone": "Professional",
        "time_option": "2 weeks"
    }
    
    start_time = datetime.now()
    try:
        print(f"🚀 Request {request_id} starting at {start_time.strftime('%H:%M:%S.%f')[:-3]}")
        response = requests.post(url, json=test_data, timeout=35)
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        if response.status_code == 200:
            data = response.json()
            content_length = len(data.get('ai_analysis', ''))
            print(f"✅ Request {request_id} SUCCESS in {duration:.1f}s - Content: {content_length} chars")
            return True, duration, content_length
        elif response.status_code == 429:
            print(f"⏳ Request {request_id} QUEUED (429) in {duration:.1f}s - Service busy")
            return False, duration, 0
        else:
            print(f"❌ Request {request_id} FAILED ({response.status_code}) in {duration:.1f}s")
            return False, duration, 0
            
    except requests.exceptions.Timeout:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        print(f"⏰ Request {request_id} TIMEOUT after {duration:.1f}s")
        return False, duration, 0
    except Exception as e:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        print(f"💥 Request {request_id} ERROR in {duration:.1f}s: {e}")
        return False, duration, 0

def test_concurrent_requests():
    """Test multiple concurrent requests to verify queue management"""
    print("🧪 Testing Queue Management with Concurrent Requests")
    print("=" * 60)
    
    num_requests = 5
    threads = []
    results = []
    
    # Create threads for concurrent requests
    for i in range(num_requests):
        thread = threading.Thread(
            target=lambda req_id=i+1: results.append(make_request(req_id))
        )
        threads.append(thread)
    
    # Start all threads at roughly the same time
    print(f"🔄 Starting {num_requests} concurrent requests...")
    start_time = time.time()
    
    for thread in threads:
        thread.start()
        time.sleep(0.1)  # Small delay to simulate near-concurrent requests
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    total_time = time.time() - start_time
    
    print("\n📊 RESULTS SUMMARY:")
    print("=" * 60)
    
    successful_requests = sum(1 for success, _, _ in results if success)
    queued_requests = len(results) - successful_requests
    avg_duration = sum(duration for _, duration, _ in results) / len(results)
    total_content = sum(content_len for _, _, content_len in results)
    
    print(f"✅ Successful requests: {successful_requests}/{num_requests}")
    print(f"⏳ Queued/Failed requests: {queued_requests}/{num_requests}")
    print(f"⏱️  Average response time: {avg_duration:.1f}s")
    print(f"📝 Total content generated: {total_content} characters")
    print(f"🕐 Total test time: {total_time:.1f}s")
    
    if successful_requests > 0 and queued_requests > 0:
        print("\n✅ QUEUE MANAGEMENT WORKING: Some requests succeeded, others were queued")
    elif successful_requests == num_requests:
        print("\n⚠️  ALL REQUESTS SUCCEEDED: Queue may not be limiting properly")
    else:
        print("\n❌ ALL REQUESTS FAILED: There may be an issue with the service")
    
    return successful_requests, queued_requests, avg_duration

if __name__ == "__main__":
    test_concurrent_requests()
