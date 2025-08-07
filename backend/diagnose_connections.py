"""
Diagnostic script to test all connections and configurations
"""
import os
import sys
import time
from dotenv import load_dotenv
import pymongo
import pinecone
import requests
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_mongodb_connection():
    """Test MongoDB connection and operations"""
    logger.info("Testing MongoDB connection...")
    try:
        start_time = time.time()
        client = pymongo.MongoClient(
            os.getenv('MONGODB_URI'),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        
        # Test the connection
        client.admin.command('ping')
        logger.info("✓ MongoDB connection successful")
        
        # Test database access
        db = client.genius_db
        collections = db.list_collection_names()
        logger.info(f"✓ Found collections: {collections}")
        
        # Test query performance
        test_query_start = time.time()
        db.users.find_one({})
        query_time = time.time() - test_query_start
        logger.info(f"✓ Query response time: {query_time:.2f}s")
        
        total_time = time.time() - start_time
        logger.info(f"✓ Total MongoDB test time: {total_time:.2f}s")
        return True
        
    except pymongo.errors.ServerSelectionTimeoutError as e:
        logger.error(f"MongoDB connection timeout: {str(e)}")
        logger.error("Check if MongoDB URI is correct and the server is accessible")
        return False
    except pymongo.errors.OperationFailure as e:
        logger.error(f"MongoDB authentication failed: {str(e)}")
        logger.error("Check your database username and password")
        return False
    except Exception as e:
        logger.error(f"MongoDB error: {str(e)}")
        return False

def test_pinecone_connection():
    """Test Pinecone connection and operations"""
    logger.info("Testing Pinecone connection...")
    try:
        start_time = time.time()
        
        # Initialize Pinecone
        pc = pinecone.Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        logger.info("✓ Pinecone initialization successful")
        
        # List indexes
        indexes = pc.list_indexes()
        logger.info(f"✓ Available indexes: {indexes}")
        
        # Connect to index
        index_name = os.getenv('PINECONE_INDEX_NAME')
        if index_name not in indexes.names():
            logger.error(f"Index '{index_name}' not found!")
            return False
            
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        logger.info(f"✓ Connected to index: {index_name}")
        logger.info(f"✓ Index stats: {stats}")
        
        total_time = time.time() - start_time
        logger.info(f"✓ Total Pinecone test time: {total_time:.2f}s")
        return True
        
    except Exception as e:
        logger.error(f"Pinecone error: {str(e)}")
        logger.error("Check your API key and environment settings")
        return False

def test_cors_configuration():
    """Test CORS configuration"""
    logger.info("Testing CORS configuration...")
    try:
        cors_origins = os.getenv('CORS_ORIGINS', '').split(',')
        frontend_url = os.getenv('FRONTEND_URL')
        
        if not frontend_url:
            logger.error("FRONTEND_URL not set")
            return False
            
        if frontend_url not in cors_origins:
            logger.error(f"Frontend URL {frontend_url} not in CORS origins!")
            return False
            
        logger.info(f"✓ CORS origins configured: {cors_origins}")
        return True
        
    except Exception as e:
        logger.error(f"CORS configuration error: {str(e)}")
        return False

def test_environment_variables():
    """Test environment variables"""
    logger.info("Testing environment variables...")
    required_vars = [
        'MONGODB_URI',
        'PINECONE_API_KEY',
        'PINECONE_ENVIRONMENT',
        'PINECONE_INDEX_NAME',
        'SECRET_KEY',
        'JWT_SECRET_KEY',
        'FRONTEND_URL',
        'CORS_ORIGINS'
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
            logger.error(f"Missing required environment variable: {var}")
    
    if missing:
        return False
    
    logger.info("✓ All required environment variables are set")
    return True

def main():
    """Run all diagnostic tests"""
    logger.info("Starting diagnostic tests...")
    load_dotenv()
    
    # Test environment variables first
    env_ok = test_environment_variables()
    if not env_ok:
        logger.error("Environment configuration incomplete")
        return False
    
    # Test connections
    mongo_ok = test_mongodb_connection()
    pinecone_ok = test_pinecone_connection()
    cors_ok = test_cors_configuration()
    
    # Summary
    logger.info("\n=== Diagnostic Summary ===")
    logger.info(f"Environment Variables: {'✓' if env_ok else '✗'}")
    logger.info(f"MongoDB Connection: {'✓' if mongo_ok else '✗'}")
    logger.info(f"Pinecone Connection: {'✓' if pinecone_ok else '✗'}")
    logger.info(f"CORS Configuration: {'✓' if cors_ok else '✗'}")
    
    if not all([env_ok, mongo_ok, pinecone_ok, cors_ok]):
        logger.error("\n⚠️ Some checks failed! Review the output above.")
        return False
    
    logger.info("\n✅ All checks passed!")
    return True

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
