"""User routes for the application"""
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime
from models.user import User, AccessRequest
import bcrypt
import jwt
import os

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/api/users', methods=['GET'])
def get_users():
    """Get all users"""
    try:
        users = User.get_all()
        return jsonify({'users': users})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400

        # Hash password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User.create(
            email=data['email'],
            password=hashed_password,
            name=data.get('name', ''),
            role=data.get('role', 'user')
        )

        # Remove password from response
        del user['password']
        return jsonify(user), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get a specific user"""
    try:
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove password from response
        del user['password']
        return jsonify(user)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update a user"""
    try:
        data = request.get_json()
        
        # If updating password, hash it
        if 'password' in data:
            data['password'] = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User.update(user_id, data)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove password from response
        del user['password']
        return jsonify(user)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user"""
    try:
        if User.delete(user_id):
            return jsonify({'message': 'User deleted successfully'})
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/access-requests', methods=['GET'])
def get_access_requests():
    """Get all access requests"""
    try:
        requests = AccessRequest.get_all()
        return jsonify({'requests': requests})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/access-requests', methods=['POST'])
def create_access_request():
    """Create a new access request"""
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400

        access_request = AccessRequest.create(
            email=data['email'],
            name=data.get('name', ''),
            user_type=data.get('user_type', 'employee'),
            department=data.get('department', '')
        )
        
        return jsonify(access_request), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/access-requests/<request_id>/approve', methods=['POST'])
def approve_access_request(request_id):
    """Approve an access request"""
    try:
        if AccessRequest.approve(request_id):
            return jsonify({'message': 'Access request approved successfully'})
        return jsonify({'error': 'Access request not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/access-requests/<request_id>/reject', methods=['POST'])
def reject_access_request(request_id):
    """Reject an access request"""
    try:
        if AccessRequest.reject(request_id):
            return jsonify({'message': 'Access request rejected successfully'})
        return jsonify({'error': 'Access request not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/users/current', methods=['GET'])
def get_current_user():
    """Get current user - for now returns first user from database"""
    try:
        # For demo purposes, return the first user
        # In a real app, you'd get this from the session/JWT token
        users = User.get_all()
        if users and len(users) > 0:
            user = users[0]  # Get first user
            # Remove password from response
            if 'password' in user:
                del user['password']
            return jsonify(user)
        else:
            # Return a default user if none exist
            return jsonify({
                '_id': '1',
                'id': '1',
                'email': 'admin@genius.com',
                'name': 'Admin User',
                'role': 'admin',
                'created_at': datetime.now().isoformat(),
                'is_active': True
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/user/accessible-clients', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_accessible_clients():
    """Get accessible clients for a user with OPTIONS support"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response
        
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id parameter required'}), 400
            
        # For now, return employee type for all users to ensure cards can be created
        return jsonify({
            'user_type': 'employee',
            'accessible_clients': [],
            'permissions': ['read', 'write', 'create', 'delete']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/api/login', methods=['POST'])
@cross_origin()
def login():
    """Login endpoint"""
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400

        email = data['email']
        password = data['password']

        # Get user by email
        user = User.get_by_email(email)
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401

        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Generate JWT token
        token_payload = {
            'user_id': str(user['_id']),
            'email': user['email'],
            'role': user.get('role', 'user'),
            'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
        }
        
        token = jwt.encode(
            token_payload, 
            os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-here'), 
            algorithm='HS256'
        )

        # Remove password from user data
        user_data = {k: v for k, v in user.items() if k != 'password'}

        return jsonify({
            'token': token,
            'user': user_data,
            'message': 'Login successful'
        })

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@user_routes.route('/api/register', methods=['POST'])
@cross_origin()
def register():
    """Register new user endpoint"""
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400

        email = data['email']
        password = data['password']
        name = data.get('name', '')

        # Check if user already exists
        existing_user = User.get_by_email(email)
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        user = User.create(
            email=email,
            password=hashed_password,
            name=name,
            role=data.get('role', 'user')
        )

        # Generate JWT token
        token_payload = {
            'user_id': str(user['_id']),
            'email': user['email'],
            'role': user.get('role', 'user'),
            'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
        }
        
        token = jwt.encode(
            token_payload, 
            os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-here'), 
            algorithm='HS256'
        )

        # Remove password from response
        user_data = {k: v for k, v in user.items() if k != 'password'}

        return jsonify({
            'token': token,
            'user': user_data,
            'message': 'Registration successful'
        }), 201

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500
