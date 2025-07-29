"""Backend configuration"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    # Server settings
    HOST = '0.0.0.0'
    PORT = 10000
    DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'

    # MongoDB settings - connect to genius_db where the users actually are
    MONGO_URI = os.getenv('MONGO_URI') or os.getenv('MONGODB_URI') or 'mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0'
    
    # Security settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'genius-project-secret-key-2025')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'genius-project-jwt-secret-2025')
    
    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    
    # File upload settings
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB max file size
    
    # Pinecone settings
    PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
    PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NAME', 'genius-brain-embeddings')
    
    # AI settings (OpenAI removed)
    USE_MOCK_AI = os.getenv('USE_MOCK_AI', 'true').lower() == 'true'
    LLAMA_API_URL = os.getenv('LLAMA_API_URL', 'http://localhost:8080')
