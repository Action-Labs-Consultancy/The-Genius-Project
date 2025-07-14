import os
import sys
import json
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://www.action-labs.ai",
    "https://action-labs.ai"
], supports_credentials=True)

bcrypt = Bcrypt(app)

# MongoDB connection
try:
    from pymongo import MongoClient
    mongodb_uri = os.getenv('MONGODB_URI')
    if mongodb_uri:
        mongo_client = MongoClient(mongodb_uri)
        db = mongo_client.get_default_database()
        users_collection = db.users
        print("[LOGIN] MongoDB connected successfully")
    else:
        print("[LOGIN] MONGODB_URI not found")
        users_collection = None
except Exception as e:
    print(f"[LOGIN] MongoDB connection failed: {e}")
    users_collection = None

@app.route('/', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email']
        password = data['password']
        
        if not users_collection:
            return jsonify({'error': 'Database not available'}), 500
        
        # Find user by email
        user = users_collection.find_one({'email': email})
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check password
        if bcrypt.check_password_hash(user.get('password_hash', ''), password):
            # Return user info (excluding password hash)
            user_info = {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', ''),
                'role': user.get('role', 'user')
            }
            return jsonify({'user': user_info}), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"[LOGIN] Login error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# For Vercel
application = app