#!/usr/bin/env python3
"""
Ultra-fast RAG configuration for maximum speed and intelligence
"""

# Ultra-fast Ollama settings
ULTRA_FAST_OLLAMA_OPTIONS = {
    "temperature": 0.3,         # Lower for faster, more deterministic responses
    "top_p": 0.7,              # More focused
    "top_k": 15,               # Smaller vocabulary for speed
    "num_predict": 256,         # Shorter responses for speed
    "num_ctx": 1024,           # Smaller context for ultra-fast processing
    "num_batch": 1024,         # Larger batch size
    "num_gpu": 1,              # Use GPU
    "num_thread": -1,          # Use all CPU threads
    "repeat_penalty": 1.1,      # Prevent repetition
    "tfs_z": 1.0,              # Tail free sampling
    "typical_p": 1.0,          # Typical sampling
    "mirostat": 2,             # Better quality control
    "mirostat_tau": 5.0,       # Target entropy
    "mirostat_eta": 0.1,       # Learning rate
    "penalize_newline": False,  # Don't penalize newlines
    "stop": ["\n\n", "###", "User:", "Human:"],  # Stop sequences for conciseness
}

# Ultra-fast retrieval settings
ULTRA_FAST_RETRIEVAL = {
    "k": 1,                    # Only get the single most relevant document
    "score_threshold": 0.85,   # Very high threshold - only highly relevant docs
    "max_tokens_per_doc": 300, # Shorter document chunks
}

# Smart response caching
RESPONSE_CACHE_CONFIG = {
    "enabled": True,
    "max_entries": 1000,       # Cache up to 1000 responses
    "ttl_seconds": 1800,       # 30 minutes cache lifetime
    "similarity_threshold": 0.9, # Cache similar questions
}

# Ultra-concise prompt templates
ULTRA_FAST_PROMPTS = {
    "system": """You are a fast, intelligent assistant. Give precise, helpful answers in 1-3 sentences max.""",
    
    "rag_template": """Context: {context}

Question: {question}

Answer briefly and accurately:""",
    
    "no_context_template": """Question: {question}

Brief, helpful answer:""",
    
    "fallback_responses": [
        "I can help with that! Could you be more specific?",
        "I understand your question. Let me provide a quick answer based on what I know.",
        "That's a great question! Here's what I can tell you:",
    ]
}

# Performance monitoring
PERFORMANCE_CONFIG = {
    "log_response_times": True,
    "target_response_time": 2.0,  # 2 seconds max
    "auto_optimize": True,        # Automatically adjust settings if too slow
    "alert_on_slow_response": True,
}

# Memory optimization
MEMORY_CONFIG = {
    "clear_cache_interval": 3600,  # Clear cache every hour
    "max_conversation_length": 20,  # Keep only last 20 messages
    "gc_frequency": 10,            # Garbage collect every 10 requests
}
