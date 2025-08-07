import os
from pymongo import MongoClient
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.genius_db

# Pinecone connection
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

# Get all brains
brains = list(db.brains.find())
print(f"\nFound {len(brains)} brains in MongoDB:")
for brain in brains:
    print(f"\n- Brain: {brain['name']}")
    print(f"  ID: {brain['_id']}")
    print(f"  Description: {brain['description']}")
    print(f"  Knowledge base size: {len(brain.get('knowledge_base', []))}")
    print(f"  Created: {brain['created_at']}")
    print(f"  Last updated: {brain['updated_at']}")
    print(f"  Agent count: {brain.get('agent_count', 0)}")
    
# Check Pinecone index stats
print("\nPinecone Index Stats:")
try:
    stats = index.describe_index_stats()
    print(f"Total vectors: {stats.total_vector_count}")
    print(f"Namespaces: {stats.namespaces}")
except Exception as e:
    print(f"Error querying Pinecone: {str(e)}")

# Try to fetch some vectors
try:
    query_response = index.query(
        vector=[0] * 1536,  # dummy vector for metadata query
        top_k=5,
        include_metadata=True
    )
    print("\nLatest vectors in index:")
    for match in query_response.matches:
        print(f"- Score: {match.score}, Metadata: {match.metadata}")
except Exception as e:
    print(f"Error querying vectors: {str(e)}")
