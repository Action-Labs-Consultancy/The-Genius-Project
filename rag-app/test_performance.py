#!/usr/bin/env python3
"""
Performance Test Script for Ultra-Fast RAG System
Demonstrates the speed improvements across different modes
"""

import requests
import time
import json

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, message, mode_name):
    """Test a specific endpoint and return response time"""
    print(f"\n🧪 Testing {mode_name}...")
    print(f"📝 Question: '{message}'")
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{BASE_URL}{endpoint}",
            headers={"Content-Type": "application/json"},
            json={"message": message, "mode": "auto"},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            total_time = time.time() - start_time
            processing_time = data.get('processing_time', total_time)
            
            print(f"💬 Response: '{data['response'][:100]}{'...' if len(data['response']) > 100 else ''}'")
            print(f"⏱️  Processing Time: {processing_time}s")
            print(f"🌐 Total Time: {total_time:.3f}s")
            
            # Performance rating
            if processing_time < 0.1:
                print("🚀 LIGHTNING FAST! ⚡")
            elif processing_time < 2:
                print("🔥 ULTRA FAST!")
            elif processing_time < 5:
                print("✅ FAST")
            else:
                print("⏳ Normal")
                
            return processing_time
        else:
            print(f"❌ Error: {response.status_code}")
            return None
            
    except requests.exceptions.Timeout:
        print("⏰ Timeout (>15s)")
        return 15
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def main():
    print("🚀 ULTRA-FAST RAG SYSTEM PERFORMANCE TEST")
    print("=" * 50)
    
    # Test different types of questions
    test_questions = [
        ("hello", "Simple greeting"),
        ("what is AI?", "Quick question (pattern match)"),
        ("Tell me about machine learning", "General knowledge"),
        ("What are the hours mentioned in the documents?", "Document-specific question")
    ]
    
    endpoints = [
        ("/chat/lightning", "⚡ Lightning Mode"),
        ("/chat/ultra-fast", "🚀 Ultra-Fast Mode"),
        ("/chat/fast", "🔥 Fast Mode"),
        ("/chat", "⚖️ Balanced Mode")
    ]
    
    results = {}
    
    for question, description in test_questions:
        print(f"\n" + "="*60)
        print(f"📋 TEST: {description}")
        print(f"❓ Question: '{question}'")
        print("-" * 60)
        
        question_results = {}
        
        for endpoint, mode_name in endpoints:
            result = test_endpoint(endpoint, question, mode_name)
            question_results[mode_name] = result
            time.sleep(1)  # Brief pause between tests
        
        results[description] = question_results
    
    # Summary
    print(f"\n" + "="*60)
    print("📊 PERFORMANCE SUMMARY")
    print("="*60)
    
    for test_name, test_results in results.items():
        print(f"\n📋 {test_name}:")
        for mode, time_taken in test_results.items():
            if time_taken is not None:
                if time_taken < 0.1:
                    status = "⚡ INSTANT"
                elif time_taken < 2:
                    status = "🚀 ULTRA-FAST"
                elif time_taken < 5:
                    status = "✅ FAST"
                else:
                    status = "⏳ NORMAL"
                print(f"  {mode}: {time_taken}s {status}")
            else:
                print(f"  {mode}: FAILED ❌")
    
    print(f"\n🎯 RECOMMENDATIONS:")
    print("⚡ Lightning Mode: Use for simple questions, greetings, quick facts")
    print("🚀 Ultra-Fast Mode: Best for general questions with smart caching")
    print("🔥 Fast Mode: Good balance for most use cases")
    print("⚖️ Balanced Mode: Use when you need detailed, comprehensive responses")

if __name__ == "__main__":
    main()
