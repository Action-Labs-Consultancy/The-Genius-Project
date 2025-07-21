#!/usr/bin/env python3
"""
Lightning-fast configuration for maximum speed at the cost of some detail
"""

# Lightning-fast Ollama settings for maximum speed
LIGHTNING_FAST_OLLAMA_OPTIONS = {
    "temperature": 0.1,         # Very low for deterministic, fast responses
    "top_p": 0.5,              # Very focused
    "top_k": 10,               # Minimal vocabulary for speed
    "num_predict": 100,         # Very short responses
    "num_ctx": 512,            # Minimal context window
    "num_batch": 2048,         # Large batch size
    "num_gpu": 1,              # Use GPU
    "num_thread": -1,          # Use all CPU threads
    "repeat_penalty": 1.2,      # Prevent repetition
    "tfs_z": 1.0,              # Tail free sampling
    "typical_p": 1.0,          # Typical sampling
    "mirostat": 0,             # Disable mirostat for speed
    "penalize_newline": False,  # Don't penalize newlines
    "stop": ["\n", ".", "!", "?", "###"],  # Stop early for speed
}

# Ultra-minimal retrieval for speed
LIGHTNING_FAST_RETRIEVAL = {
    "k": 1,                    # Single document only
    "score_threshold": 0.9,    # Only extremely relevant docs
    "max_tokens_per_doc": 150, # Very short document chunks
}

# One-sentence prompts for speed
LIGHTNING_FAST_PROMPTS = {
    "system": "Answer in 1 sentence.",
    
    "rag_template": "Based on: {context}\nQ: {question}\nA:",
    
    "no_context_template": "Q: {question}\nA:",
    
    "quick_answers": {
        "what": "This is a fast RAG system.",
        "how": "Ask me specific questions.",
        "why": "I provide quick answers using AI.",
        "who": "I'm your AI assistant.",
        "when": "I'm available 24/7.",
        "where": "I'm running locally.",
    }
}
