#!/usr/bin/env python3
"""
Create Pinecone index for RAG system
"""

from pinecone import Pinecone
import sys

def create_rag_index():
    # Your Pinecone API key
    api_key = 'pcsk_5L9iWh_EkLBaUUGc8jF24pSLtjP3Y3qxDYT2Y4TjjJhF29z4VgSRNBTtHtxJ9CnqzGNZqX'
    
    try:
        print("🚀 Connecting to Pinecone...")
        pc = Pinecone(api_key=api_key)
        
        print("📊 Checking existing indexes...")
        indexes = pc.list_indexes()
        
        print("Available indexes:")
        for index in indexes:
            index_name = index.get('name', 'Unknown')
            try:
                # Try to get dimensions from different possible locations
                dimensions = None
                if 'spec' in index:
                    if 'pod' in index['spec']:
                        dimensions = index['spec']['pod'].get('dimensions')
                    elif 'serverless' in index['spec']:
                        dimensions = index['spec']['serverless'].get('dimensions')
                
                metric = index.get('metric', 'Unknown')
                print(f"  - {index_name} (dimensions: {dimensions}, metric: {metric})")
            except Exception as e:
                print(f"  - {index_name} (details unavailable: {e})")
        
        # Check if rag-documents exists
        existing_names = [idx.get('name') for idx in indexes]
        
        if 'rag-documents' not in existing_names:
            print("\n🔨 Creating rag-documents index...")
            pc.create_index(
                name='rag-documents',
                dimension=768,  # nomic-embed-text dimensions
                metric='cosine',
                spec={
                    'pod': {
                        'environment': 'gcp-starter', 
                        'pods': 1, 
                        'pod_type': 'starter'
                    }
                }
            )
            print("✅ Index 'rag-documents' created successfully!")
            print("   - Dimensions: 768 (compatible with nomic-embed-text)")
            print("   - Metric: cosine")
            print("   - Environment: gcp-starter")
        else:
            print("\n✅ Index 'rag-documents' already exists!")
            
        print("\n🎉 Pinecone setup complete!")
        print("You can now use the RAG workflow in n8n")
        
    except Exception as e:
        print(f"❌ Error setting up Pinecone: {e}")
        print("\nTroubleshooting:")
        print("1. Check your API key is correct")
        print("2. Ensure you have Pinecone credits/quota available")
        print("3. Try using a different index name if needed")
        return False
    
    return True

if __name__ == "__main__":
    success = create_rag_index()
    sys.exit(0 if success else 1)
