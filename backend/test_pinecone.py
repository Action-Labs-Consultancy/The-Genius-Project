#!/usr/bin/env python3
"""
Test Pinecone connection and functionality
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=== Pinecone Connection Test ===")
print(f"PINECONE_API_KEY: {'✓' if os.environ.get('PINECONE_API_KEY') else '✗'}")
print(f"PINECONE_INDEX_NAME: {os.environ.get('PINECONE_INDEX_NAME', 'Not set')}")
print(f"OPENAI_API_KEY: {'✓' if os.environ.get('OPENAI_API_KEY') else '✗'}")

try:
    from pinecone import Pinecone
    print("✓ Pinecone client imported successfully")
    
    # Initialize Pinecone
    pc = Pinecone(api_key=os.environ.get('PINECONE_API_KEY'))
    print("✓ Pinecone client initialized")
    
    # Get index
    index_name = os.environ.get('PINECONE_INDEX_NAME')
    index = pc.Index(index_name)
    print(f"✓ Connected to index: {index_name}")
    
    # Get index stats
    stats = index.describe_index_stats()
    print(f"✓ Index stats: {stats}")
    
    # Test embeddings
    from langchain_openai import OpenAIEmbeddings
    embeddings = OpenAIEmbeddings()
    test_embedding = embeddings.embed_query("test query")
    print(f"✓ OpenAI embeddings working - dimension: {len(test_embedding)}")
    
    # Test vector store
    from langchain_pinecone import PineconeVectorStore
    vector_store = PineconeVectorStore(
        index_name=index_name,
        embedding=embeddings
    )
    print("✓ PineconeVectorStore initialized successfully")
    
    print("\n=== TEST PASSED ===")
    print("Pinecone is fully connected and functional!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    print("\n=== TEST FAILED ===")
    sys.exit(1)
