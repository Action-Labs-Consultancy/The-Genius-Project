# Flask app adapter for the backend
# All Flask-specific setup and route registration should be here

from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_migrate import Migrate
import os
from dotenv import load_dotenv

from core.models import db

# --- App Factory ---
def create_app():
    load_dotenv()
    app = Flask(__name__)
    CORS(app)
    bcrypt = Bcrypt(app)
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    
    # Handle different environments for Vercel deployment
    if os.environ.get('VERCEL_REGION'):
        # Use SQLite for Vercel
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/vercel.db'
        app.config['ENV'] = 'production'
        app.config['DEBUG'] = False
        app.config['TESTING'] = False
    else:
        # Use regular database for local development
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    
    db.init_app(app)
    migrate = Migrate(app, db)
    socketio = SocketIO(app, cors_allowed_origins="*")
    return app, socketio, bcrypt

# --- Route registration ---
def register_routes(app, socketio, bcrypt):
    # Import all route functions from the main app.py (to be moved here)
    # For now, this is a placeholder to show where to register routes
    pass
