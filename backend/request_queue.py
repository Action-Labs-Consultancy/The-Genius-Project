#!/usr/bin/env python3
"""
Request Queue Manager for Marketing Lab to prevent concurrent request overload
"""
import time
import threading
from queue import Queue
from datetime import datetime, timedelta

class RequestQueueManager:
    def __init__(self, max_concurrent=1, rate_limit_per_minute=6):
        self.request_queue = Queue()
        self.active_requests = 0
        self.max_concurrent = max_concurrent
        self.rate_limit_per_minute = rate_limit_per_minute
        self.request_times = []
        self.lock = threading.Lock()
        self.is_processing = False
        
    def can_process_request(self):
        """Check if we can process a new request based on rate limiting"""
        now = datetime.now()
        # Remove requests older than 1 minute
        self.request_times = [req_time for req_time in self.request_times 
                             if now - req_time < timedelta(minutes=1)]
        
        # Check if under rate limit
        if len(self.request_times) >= self.rate_limit_per_minute:
            return False
            
        # Check if under concurrent limit
        if self.active_requests >= self.max_concurrent:
            return False
            
        return True
    
    def add_request_time(self):
        """Record a new request time"""
        self.request_times.append(datetime.now())
    
    def acquire_slot(self):
        """Try to acquire a processing slot"""
        with self.lock:
            if self.can_process_request():
                self.active_requests += 1
                self.add_request_time()
                return True
            return False
    
    def release_slot(self):
        """Release a processing slot"""
        with self.lock:
            if self.active_requests > 0:
                self.active_requests -= 1

# Global queue manager instance
queue_manager = RequestQueueManager(max_concurrent=2, rate_limit_per_minute=20)

def with_queue_management(func):
    """Decorator to manage request queuing"""
    from functools import wraps
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Try to acquire a slot
        if not queue_manager.acquire_slot():
            from flask import jsonify
            return jsonify({
                'success': False,
                'error': 'Service temporarily busy',
                'message': 'Marketing Lab is processing other requests. Please wait a moment and try again.',
                'retry_after': 10
            }), 429  # Too Many Requests
        
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            queue_manager.release_slot()
    
    return wrapper
