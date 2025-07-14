import os
import sys
from flask import Flask, jsonify
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
bcrypt = Bcrypt(app)

@app.route('/')
def create_test_user():
    try:
        mongodb_uri = os.getenv('MONGODB_URI')
        
        if not mongodb_uri:
            return jsonify({'error': 'MONGODB_URI not found'}), 500
            
        client = MongoClient(mongodb_uri)
        db = client.get_default_database()
        users_collection = db.users
        
        # Check if test user already exists
        existing_user = users_collection.find_one({'email': 'test@example.com'})
        
        if existing_user:
            return jsonify({'message': 'Test user already exists', 'user': {'email': 'test@example.com'}}), 200
        
        # Create test user
        password_hash = bcrypt.generate_password_hash('test123').decode('utf-8')
        
        test_user = {
            'email': 'test@example.com',
            'password_hash': password_hash,
            'name': 'Test User',
            'role': 'user'
        }
        
        result = users_collection.insert_one(test_user)
        
        return jsonify({
            'message': 'Test user created successfully',
            'user': {
                'id': str(result.inserted_id),
                'email': 'test@example.com',
                'name': 'Test User',
                'role': 'user'
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Export for Vercel
application = app