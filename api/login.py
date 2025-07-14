from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pymongo
from werkzeug.security import check_password_hash, generate_password_hash
import traceback

app = Flask(__name__)
CORS(app, origins=["https://action-labs.ai", "https://www.action-labs.ai", "http://localhost:3000"])

# MongoDB connection
def get_db():
    try:
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            return None
        
        client = pymongo.MongoClient(mongodb_uri)
        db = client.get_default_database()
        return db
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def login_handler(request):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Connect to database
        db = get_db()
        if not db:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Find user
        users_collection = db.users
        user = users_collection.find_one({'email': email})
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check password
        if check_password_hash(user.get('password', ''), password):
            # Return user data (excluding password)
            user_data = {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', ''),
                'role': user.get('role', 'user')
            }
            return jsonify({
                'message': 'Login successful',
                'user': user_data,
                'token': 'temp_token_' + str(user['_id'])
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"Login error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

# Vercel handler
def handler(request):
    if request.method == 'POST':
        return login_handler(request)
    elif request.method == 'GET':
        return jsonify({'message': 'Login endpoint is working'}), 200
    else:
        return jsonify({'error': 'Method not allowed'}), 405
