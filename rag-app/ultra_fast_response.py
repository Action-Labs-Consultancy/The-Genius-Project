#!/usr/bin/env python3
"""
Ultra-fast response system with intelligent caching and optimization
"""

import time
import hashlib
import pickle
import gc
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from ultra_fast_config import (
    RESPONSE_CACHE_CONFIG, 
    PERFORMANCE_CONFIG, 
    MEMORY_CONFIG,
    ULTRA_FAST_PROMPTS
)

@dataclass
class CachedResponse:
    response: str
    timestamp: datetime
    question_hash: str
    context_hash: str
    usage_count: int = 0

class UltraFastResponseSystem:
    """Ultra-fast response system with smart caching and optimization"""
    
    def __init__(self):
        self.response_cache: Dict[str, CachedResponse] = {}
        self.response_times: List[float] = []
        self.total_requests = 0
        self.cache_hits = 0
        
    def _hash_text(self, text: str) -> str:
        """Create hash for text"""
        return hashlib.md5(text.lower().strip().encode()).hexdigest()[:16]
    
    def _is_cache_valid(self, cached: CachedResponse) -> bool:
        """Check if cached response is still valid"""
        if not RESPONSE_CACHE_CONFIG["enabled"]:
            return False
            
        age = datetime.now() - cached.timestamp
        return age.total_seconds() < RESPONSE_CACHE_CONFIG["ttl_seconds"]
    
    def _find_similar_cached_response(self, question: str) -> Optional[CachedResponse]:
        """Find similar cached response using simple text similarity"""
        question_words = set(question.lower().split())
        
        for cache_key, cached in self.response_cache.items():
            # Extract original question from cache key
            cached_words = set(cache_key.split('_')[0].split())
            
            # Simple Jaccard similarity
            intersection = question_words & cached_words
            union = question_words | cached_words
            
            if len(union) > 0:
                similarity = len(intersection) / len(union)
                if similarity >= RESPONSE_CACHE_CONFIG["similarity_threshold"]:
                    if self._is_cache_valid(cached):
                        return cached
        
        return None
    
    def get_cached_response(self, question: str, context: str = "") -> Optional[str]:
        """Get cached response if available"""
        if not RESPONSE_CACHE_CONFIG["enabled"]:
            return None
            
        # Try exact match first
        question_hash = self._hash_text(question)
        context_hash = self._hash_text(context)
        cache_key = f"{question_hash}_{context_hash}"
        
        if cache_key in self.response_cache:
            cached = self.response_cache[cache_key]
            if self._is_cache_valid(cached):
                cached.usage_count += 1
                self.cache_hits += 1
                return cached.response
            else:
                # Remove expired cache
                del self.response_cache[cache_key]
        
        # Try similar question
        similar_cached = self._find_similar_cached_response(question)
        if similar_cached:
            similar_cached.usage_count += 1
            self.cache_hits += 1
            return similar_cached.response
        
        return None
    
    def cache_response(self, question: str, context: str, response: str):
        """Cache a response"""
        if not RESPONSE_CACHE_CONFIG["enabled"]:
            return
            
        question_hash = self._hash_text(question)
        context_hash = self._hash_text(context)
        cache_key = f"{question_hash}_{context_hash}"
        
        cached_response = CachedResponse(
            response=response,
            timestamp=datetime.now(),
            question_hash=question_hash,
            context_hash=context_hash
        )
        
        self.response_cache[cache_key] = cached_response
        
        # Clean up cache if too large
        if len(self.response_cache) > RESPONSE_CACHE_CONFIG["max_entries"]:
            self._cleanup_cache()
    
    def _cleanup_cache(self):
        """Clean up old cache entries"""
        # Remove expired entries first
        current_time = datetime.now()
        expired_keys = []
        
        for key, cached in self.response_cache.items():
            age = current_time - cached.timestamp
            if age.total_seconds() > RESPONSE_CACHE_CONFIG["ttl_seconds"]:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.response_cache[key]
        
        # If still too many, remove least used entries
        if len(self.response_cache) > RESPONSE_CACHE_CONFIG["max_entries"]:
            sorted_cache = sorted(
                self.response_cache.items(),
                key=lambda x: (x[1].usage_count, x[1].timestamp)
            )
            
            # Keep only the most recent and most used entries
            entries_to_keep = RESPONSE_CACHE_CONFIG["max_entries"] // 2
            self.response_cache = dict(sorted_cache[-entries_to_keep:])
    
    def log_response_time(self, response_time: float):
        """Log response time for monitoring"""
        self.total_requests += 1
        self.response_times.append(response_time)
        
        # Keep only recent response times
        if len(self.response_times) > 100:
            self.response_times = self.response_times[-50:]
        
        # Auto-optimize if responses are too slow
        if (PERFORMANCE_CONFIG["auto_optimize"] and 
            len(self.response_times) >= 5 and
            sum(self.response_times[-5:]) / 5 > PERFORMANCE_CONFIG["target_response_time"]):
            self._auto_optimize()
    
    def _auto_optimize(self):
        """Automatically optimize settings if responses are too slow"""
        print("🔧 Auto-optimizing for faster responses...")
        
        # Increase cache similarity threshold for more cache hits
        RESPONSE_CACHE_CONFIG["similarity_threshold"] = max(0.7, 
            RESPONSE_CACHE_CONFIG["similarity_threshold"] - 0.05)
        
        # Trigger garbage collection
        gc.collect()
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        if not self.response_times:
            return {"status": "No data yet"}
        
        avg_response_time = sum(self.response_times) / len(self.response_times)
        cache_hit_rate = self.cache_hits / max(1, self.total_requests) * 100
        
        return {
            "total_requests": self.total_requests,
            "cache_hits": self.cache_hits,
            "cache_hit_rate": f"{cache_hit_rate:.1f}%",
            "avg_response_time": f"{avg_response_time:.2f}s",
            "last_response_time": f"{self.response_times[-1]:.2f}s" if self.response_times else "N/A",
            "cache_size": len(self.response_cache),
            "target_time": f"{PERFORMANCE_CONFIG['target_response_time']}s"
        }
    
    def get_quick_response(self, question: str) -> Optional[str]:
        """Get a quick response for common patterns"""
        question_lower = question.lower()
        
        # Quick responses for greetings
        if any(word in question_lower for word in ['hello', 'hi', 'hey']):
            return "Hi! I'm your fast RAG assistant. How can I help you today?"
        
        if any(word in question_lower for word in ['thanks', 'thank you']):
            return "You're welcome! Is there anything else I can help you with?"
        
        if any(word in question_lower for word in ['bye', 'goodbye']):
            return "Goodbye! Feel free to ask if you need help again."
        
        # Quick responses for help
        if any(word in question_lower for word in ['help', 'what can you do']):
            return "I can quickly answer questions about your documents and provide general assistance. Just ask me anything!"
        
        return None

# Global instance
ultra_fast_system = UltraFastResponseSystem()
