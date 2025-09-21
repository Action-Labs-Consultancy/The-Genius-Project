import os
import pinecone
from pinecone import Pinecone, ServerlessSpec

def setup_pinecone_index():
    """
    Set up Pinecone index with correct dimensions for nomic-embed-text model
    """
    
    # Initialize Pinecone (you'll need to set your API key)
    PINECONE_API_KEY = "your-pinecone-api-key-here"  # Replace with your actual API key
    
    if PINECONE_API_KEY == "your-pinecone-api-key-here":
        print("❌ Please set your Pinecone API key in this script")
        print("You can get it from: https://app.pinecone.io/")
        return
    
    try:
        # Initialize Pinecone client
        pc = Pinecone(api_key=PINECONE_API_KEY)
        
        # Index configuration
        index_name = "rag-documents"
        dimension = 768  # nomic-embed-text produces 768-dimensional vectors
        metric = "cosine"
        
        # Check if index already exists
        existing_indexes = pc.list_indexes()
        index_names = [idx['name'] for idx in existing_indexes]
        
        if index_name in index_names:
            print(f"✅ Index '{index_name}' already exists")
            
            # Check if dimensions match
            index_info = pc.describe_index(index_name)
            current_dimension = index_info['dimension']
            
            if current_dimension != dimension:
                print(f"⚠️  WARNING: Index has {current_dimension} dimensions, but we need {dimension}")
                print("You may need to delete and recreate the index, or use a different index name")
            else:
                print(f"✅ Index dimensions are correct ({dimension})")
        else:
            print(f"Creating new index '{index_name}' with {dimension} dimensions...")
            
            # Create the index
            pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(
                    cloud='aws',  # You can change this to 'gcp' if needed
                    region='us-east-1'  # You can change this to your preferred region
                )
            )
            
            print(f"✅ Successfully created index '{index_name}'")
        
        # Test the index
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print(f"📊 Index stats: {stats}")
        
        print("\n🎉 Pinecone setup complete!")
        print("You can now use the RAG workflow with the following settings:")
        print(f"  - Index name: {index_name}")
        print(f"  - Dimensions: {dimension}")
        print(f"  - Embedding model: nomic-embed-text")
        
    except Exception as e:
        print(f"❌ Error setting up Pinecone: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Make sure your Pinecone API key is correct")
        print("2. Check your Pinecone plan limits")
        print("3. Verify your internet connection")

def test_embedding_dimensions():
    """
    Test the nomic-embed-text model to confirm dimensions
    """
    import subprocess
    import json
    
    print("🧪 Testing nomic-embed-text embedding dimensions...")
    
    try:
        # Test with a sample text
        test_text = "This is a test document for checking embedding dimensions."
        
        # Use Ollama API to get embeddings
        result = subprocess.run([
            'curl', '-X', 'POST', 'http://localhost:11434/api/embeddings',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({
                'model': 'nomic-embed-text',
                'prompt': test_text
            })
        ], capture_output=True, text=True, shell=True)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            embedding = response.get('embedding', [])
            dimensions = len(embedding)
            print(f"✅ Embedding dimensions: {dimensions}")
            
            if dimensions == 768:
                print("✅ Perfect! Dimensions match what we expect for Pinecone")
            else:
                print(f"⚠️  Unexpected dimensions. Expected 768, got {dimensions}")
        else:
            print(f"❌ Error testing embeddings: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Error testing embeddings: {str(e)}")

if __name__ == "__main__":
    print("🚀 Setting up RAG System with Pinecone")
    print("=" * 50)
    
    # Test embedding dimensions first
    test_embedding_dimensions()
    print()
    
    # Set up Pinecone index
    setup_pinecone_index()
    
    print("\n" + "=" * 50)
    print("Next steps:")
    print("1. Import the RAG_System_Complete.json workflow into n8n")
    print("2. Configure your Google Drive and Pinecone credentials")
    print("3. Test the workflow by adding a PDF to your 'Due' folder")
    print("4. Use the manual trigger to test RAG queries")
