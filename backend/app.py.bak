# This file is the main backend adapter and API entry point.
# All reusable business logic should be in /core/business_logic.py or /core/models.py.
# All plugin logic should be in /backend/plugins.

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import os
import openai
import smtplib
from email.mime.text import MIMEText
import traceback
import secrets
from itsdangerous import URLSafeTimedSerializer
from flask import url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime
import socket
import uuid
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

# MongoDB imports
from mongo_db import mongo, MongoUser, MongoClientModel, MongoProject, MongoTask, MongoChannel, MongoMessage, MongoMeeting, MongoContentCalendar

from plugins.openai.openai_plugin import OpenAIPlugin
# from plugins.pinecone.pinecone_plugin import initialize_pinecone
# from plugins.revive.revive_plugin import get_revive_stats, create_campaign, create_banner

# ─── Load env & set keys ───────────────────────────────────────────────────────
load_dotenv()  # must come before os.getenv
openai.api_key = os.getenv("OPENAI_API_KEY")

# MongoDB setup
mongodb_uri = os.getenv('MONGODB_URI')
use_mongodb = True  # Force MongoDB usage

if mongodb_uri:
    try:
        mongo.connect(mongodb_uri)
        print("[DATABASE] Using MongoDB as primary database")
    except Exception as e:
        print(f"[DATABASE] MongoDB connection failed: {e}")
        exit(1)  # Exit if MongoDB connection fails
else:
    print("[DATABASE] MONGODB_URI not found in environment variables")
    exit(1)

# ─── Embedding helper ──────────────────────────────────────────────────────────
def get_embedding(text: str) -> list[float]:
    """Call OpenAI to turn `text` into a 1536-dim vector."""
    response = openai.Embedding.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response['data'][0]['embedding']

def find_available_port(start_port=5000, max_port=9000):
    """Find an available port starting from start_port."""
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"No available ports found between {start_port} and {max_port}")

# ─── Flask setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# File upload configuration
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {
    'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi', 'webp', 'svg',
    'mkv', 'webm', 'flv', 'txt', 'csv', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'tar', 'gz'
}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ─── Pinecone setup ────────────────────────────────────────────────────────────
# try:
#     pinecone_index = initialize_pinecone()
# except Exception as e:
#     print(f"Pinecone initialization failed: {e}")
#     exit(1)

# Generate a secure random key if not set in environment
if not os.environ.get('SECRET_KEY'):
    print("[WARNING] Using auto-generated SECRET_KEY. For production, set SECRET_KEY in environment variables.")
    os.environ['SECRET_KEY'] = secrets.token_hex(32)  # 256-bit random key

SECRET_KEY = os.environ.get('SECRET_KEY')
serializer = URLSafeTimedSerializer(SECRET_KEY)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ─── Socket Event Handlers ─────────────────────────────────────────────────

@socketio.on('connect')
def handle_connect():
    print(f"🔌 DEBUG: Client connected - Session ID: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"🔌 DEBUG: Client disconnected - Session ID: {request.sid}")

@socketio.on('join')
def handle_join(data):
    print(f"🏠 DEBUG: Received join event with data: {data}")
    channel_id = data.get('channel_id')
    if channel_id:
        join_room(f'channel_{channel_id}')
        print(f"🏠 DEBUG: User joined room channel_{channel_id}")
    else:
        print(f"❌ DEBUG: No channel_id provided in join event")

@socketio.on('leave')
def handle_leave(data):
    print(f"🚪 DEBUG: Received leave event with data: {data}")
    channel_id = data.get('channel_id')
    if channel_id:
        leave_room(f'channel_{channel_id}')
        print(f"🚪 DEBUG: User left room channel_{channel_id}")
    else:
        print(f"❌ DEBUG: No channel_id provided in leave event")

@socketio.on('send_message')
def handle_send_message(data):
    print(f"📨 DEBUG: Received send_message event with data: {data}")
    channel_id = data.get('channel_id')
    user_id = data.get('user_id')
    content = data.get('content')
    parent_message_id = data.get('parent_message_id')
    name = data.get('name')
    
    print(f"📨 DEBUG: Parsed - channel_id: {channel_id}, user_id: {user_id}, content: {content}")
    
    if not channel_id or not user_id or not content:
        print(f"❌ DEBUG: Missing required fields - channel_id: {channel_id}, user_id: {user_id}, content: {content}")
        return
    
    try:
        # Save message to MongoDB
        print(f"💾 DEBUG: Saving message to MongoDB...")
        msg = MongoMessage.create_message(channel_id, user_id, content, parent_message_id, name)
        print(f"💾 DEBUG: Message saved with ID: {msg['_id']}")
        
        # Prepare message dict for broadcast
        msg_dict = {
            'id': str(msg['_id']),
            'channel_id': channel_id,
            'user_id': user_id,
            'content': content,
            'parent_message_id': parent_message_id,
            'created_at': msg['created_at'].isoformat() if hasattr(msg['created_at'], 'isoformat') else str(msg['created_at']),
            'name': name
        }
        
        print(f"📤 DEBUG: Broadcasting message to room channel_{channel_id}: {msg_dict}")
        # Broadcast to channel
        emit('receive_message', msg_dict, room=f'channel_{channel_id}')
        print(f"✅ DEBUG: Message broadcasted successfully")
        
    except Exception as e:
        print(f"❌ DEBUG: Error in handle_send_message: {e}")
        import traceback
        traceback.print_exc()

# ─── Database Helper Functions ─────────────────────────────────────────────────
def get_all_users():
    """Get all users from MongoDB"""
    users = MongoUser.find_all()
    return [
        {
            'id': str(user['_id']),
            'name': user.get('name', ''),
            'email': user.get('email', ''),
            'role': user.get('role', 'user'),
            'user_type': user.get('user_type', 'user'),
            'department': user.get('department', 'General'),
            'is_admin': user.get('is_admin', False),
            'client_id': user.get('client_id'),
            'created_at': user.get('created_at', datetime.utcnow()).isoformat() if user.get('created_at') else None,
            'updated_at': user.get('updated_at', datetime.utcnow()).isoformat() if user.get('updated_at') else None
        } for user in users
    ]

def get_all_clients():
    """Get all clients from MongoDB"""
    clients = MongoClientModel.find_all()
    return [
        {
            'id': str(client['_id']),
            'name': client.get('name', ''),
            'email': client.get('email', ''),
            'phone': client.get('phone', ''),
            'website': client.get('website', ''),
            'industry': client.get('industry', ''),
            'contact': client.get('contact'),
            'description': client.get('description'),
            'status': client.get('status', 'active'),
            'created_at': client.get('created_at', datetime.utcnow()).isoformat() if client.get('created_at') else None,
            'updated_at': client.get('updated_at', datetime.utcnow()).isoformat() if client.get('updated_at') else None
        } for client in clients
    ]

def get_all_projects():
    """Get all projects from MongoDB"""
    projects = MongoProject.find_all()
    return [
        {
            'id': str(project['_id']),
            'name': project.get('name', ''),
            'description': project.get('description', ''),
            'client_id': project.get('client_id'),
            'user_id': project.get('user_id'),
            'status': project.get('status', 'active'),
            'created_at': project.get('created_at', datetime.utcnow()).isoformat() if project.get('created_at') else None,
            'updated_at': project.get('updated_at', datetime.utcnow()).isoformat() if project.get('updated_at') else None
        } for project in projects
    ]

def get_all_tasks():
    """Get all tasks from MongoDB"""
    tasks = MongoTask.find_all()
    return [
        {
            'id': str(task['_id']),
            'title': task.get('title', ''),
            'description': task.get('description', ''),
            'project_id': task.get('project_id'),
            'user_id': task.get('user_id'),
            'priority': task.get('priority', 'medium'),
            'status': task.get('status', 'pending'),
            'created_at': task.get('created_at', datetime.utcnow()).isoformat() if task.get('created_at') else None,
            'updated_at': task.get('updated_at', datetime.utcnow()).isoformat() if task.get('updated_at') else None
        } for task in tasks
    ]

def authenticate_user(email, password):
    """Authenticate user with MongoDB"""
    user = MongoUser.find_by_email(email)
    if user and MongoUser.verify_password(user, password):
        return {
            'id': str(user['_id']),
            'name': user.get('name', ''),
            'email': user.get('email', ''),
            'role': user.get('role', 'user'),
            'user_type': user.get('user_type', 'user'),
            'department': user.get('department', 'General'),
            'is_admin': user.get('is_admin', False),
            'client_id': user.get('client_id')
        }
    return None

def create_admin_user(name, email, password):
    """Create admin user in MongoDB"""
    return MongoUser.create_user(name, email, password, role='admin', is_admin=True)

def ensure_sample_data():
    """Ensure sample data exists in MongoDB"""
    MongoClientModel.create_sample_data()
    MongoUser.ensure_sample_users()
# ─── Background Tasks ──────────────────────────────────────────────────────────
import threading
import time

# def emit_revive_stats_periodically():
#     last_stats = None
#     while True:
#         try:
#             stats = get_revive_stats()
#             if stats != last_stats:
#                 socketio.emit('revive_stats', stats)  # Removed broadcast=True
#                 last_stats = stats
#         except Exception as e:
#             print(f"[Revive Integration] Error fetching or emitting stats: {e}")
#         time.sleep(5)  # Check every 5 seconds

# Start background thread after app and socketio are ready
# threading.Thread(target=emit_revive_stats_periodically, daemon=True).start()

# Initialize database and create sample data
with app.app_context():
    # Create sample data in MongoDB
    try:
        ensure_sample_data()
        print("[DATABASE] Sample data ensured in MongoDB")
    except Exception as e:
        print(f"[DATABASE] Sample data creation failed: {e}")
        
    print(f"[DATABASE] Database initialization complete. Using MongoDB exclusively.")

# ─── Routes ────────────────────────────────────────────────────────────────────
@app.route('/api/access-requests', methods=['GET'])
def get_access_requests():
    """Get access requests - MongoDB implementation"""
    try:
        # For now, return empty list as this feature needs to be rebuilt for MongoDB
        return jsonify([])
    except Exception as e:
        print(f"Get access requests error: {e}")
        return jsonify({'error': 'Failed to fetch access requests'}), 500

@app.route('/api/access-requests/<string:req_id>/approve', methods=['POST'])
def approve_access_request(req_id):
    """Approve access request - MongoDB implementation"""
    try:
        # This feature needs to be rebuilt for MongoDB
        return jsonify({'message': 'Access request approval not yet implemented for MongoDB'}), 501
    except Exception as e:
        print(f"Approve access request error: {e}")
        return jsonify({'error': 'Failed to approve access request'}), 500

@app.route('/set-password', methods=['POST'])
def set_password():
    """Set password - MongoDB implementation"""
    try:
        # This feature needs to be rebuilt for MongoDB
        return jsonify({'message': 'Password setting not yet implemented for MongoDB'}), 501
    except Exception as e:
        print(f"Set password error: {e}")
        return jsonify({'error': 'Failed to set password'}), 500

@app.route('/request-access', methods=['POST'])
def request_access():
    """Request access - MongoDB implementation"""
    try:
        # This feature needs to be rebuilt for MongoDB
        return jsonify({'message': 'Access request not yet implemented for MongoDB'}), 501
    except Exception as e:
        print("Error in /request-access:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Forgot password - MongoDB implementation"""
    try:
        # This feature needs to be rebuilt for MongoDB
        return jsonify({'message': 'Forgot password not yet implemented for MongoDB'}), 501
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({'error': 'Failed to process forgot password'}), 500

@app.route('/players', methods=['GET'])
def get_players():
    """Get players - MongoDB implementation"""
    try:
        # This feature needs to be rebuilt for MongoDB or may not be needed
        return jsonify([])
    except Exception as e:
        print(f"Get players error: {e}")
        return jsonify({'error': 'Failed to fetch players'}), 500

@app.route('/api/users', methods=['POST'])
def add_user():
    """Add user - MongoDB implementation"""
    try:
        data = request.get_json() or {}
        # Accept either 'role' or 'user_type'
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role') or data.get('user_type') or 'user'
        if not all([name, email, password]):
            return jsonify({'error': 'Name, email, and password are required'}), 400
        # Create user using MongoDB
        user_doc = MongoUser.create_user(name, email, password, role, role == 'admin')
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': str(user_doc['_id']),
                'name': user_doc['name'],
                'email': user_doc['email'],
                'role': user_doc['role']
            }
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Add user error: {e}")
        return jsonify({'error': 'Failed to create user'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users from MongoDB"""
    try:
        role = request.args.get('role')
        
        users = MongoUser.find_all()
        if role:
            users = [user for user in users if user.get('role') == role]
        
        return jsonify([
            {
                'id': str(user['_id']),
                'name': user.get('name', ''),
                'email': user.get('email', ''),
                'role': user.get('role', 'employee'),
                'user_type': 'employee' if user.get('user_type', 'employee') == 'user' else user.get('user_type', 'employee'),
                'department': user.get('department', 'General'),
                'client_id': user.get('client_id'),
                'is_admin': user.get('is_admin', False),
                'created_at': user.get('created_at', datetime.utcnow()).isoformat() if user.get('created_at') else None
            }
            for user in users
        ])
        
    except Exception as e:
        print(f"Get users error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects from MongoDB"""
    try:
        projects = get_all_projects()
        return jsonify(projects)
    except Exception as e:
        print(f"Get projects error: {e}")
        return jsonify({'error': 'Failed to fetch projects'}), 500

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks from MongoDB"""
    try:
        tasks = get_all_tasks()
        return jsonify(tasks)
    except Exception as e:
        print(f"Get tasks error: {e}")
        return jsonify({'error': 'Failed to fetch tasks'}), 500

@app.route('/api/users/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user - MongoDB implementation"""
    try:
        data = request.get_json() or {}
        collection = mongo.get_collection('users')
        
        # Find user by ID
        from bson import ObjectId
        user = collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update fields
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'email' in data:
            update_data['email'] = data['email']
        
        # Handle user_type and role normalization
        user_type = data.get('user_type') or data.get('role', 'employee')
        if user_type == 'user':
            user_type = 'employee'
        
        if 'user_type' in data or 'role' in data:
            update_data['user_type'] = user_type
            update_data['role'] = user_type
            update_data['is_admin'] = data.get('is_admin', False)
        
        if 'department' in data:
            update_data['department'] = data['department']
        if 'is_admin' in data:
            update_data['is_admin'] = data['is_admin']
        
        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            collection.update_one({'_id': ObjectId(user_id)}, {'$set': update_data})
        
        return jsonify({'message': 'User updated successfully'})
        
    except Exception as e:
        print(f"Update user error: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

@app.route('/api/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user - MongoDB implementation"""
    try:
        collection = mongo.get_collection('users')
        
        # Find and delete user by ID
        from bson import ObjectId
        result = collection.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'message': 'User deleted successfully'})
        
    except Exception as e:
        print(f"Delete user error: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500

@app.route('/api/user/accessible-clients', methods=['GET'])
def get_accessible_clients():
    """Get accessible clients - MongoDB implementation"""
    try:
        # For now, return all clients as this feature needs to be rebuilt for MongoDB
        clients = get_all_clients()
        return jsonify(clients)
    except Exception as e:
        print(f"Get accessible clients error: {e}")
        return jsonify({'error': 'Failed to fetch accessible clients'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')

        print(f"[DEBUG] Login attempt for email: {email}")

        # Validate input
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        # Authenticate user using MongoDB
        user = MongoUser.find_by_email(email)
        if user and MongoUser.verify_password(user, password):
            print(f"[INFO] Successful login for user: {email}")
            return jsonify({
                'message': 'Login successful',
                'is_admin': user.get('is_admin', False),
                'user': {
                    'id': str(user['_id']),
                    'name': user.get('name', ''),
                    'email': user.get('email', ''),
                    'userType': user.get('role', 'employee'),
                    'department': user.get('department', ''),
                    'is_admin': user.get('is_admin', False)
                }
            })
        print(f"[WARNING] Failed login attempt for: {email}")
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] Login error: {str(e)}")
        print(f"[ERROR] Full traceback: {error_details}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/create-admin')
def create_admin():
    try:
        # Get admin credentials from environment variables
        ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')
        ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
        
        # Validate that the environment variables are set
        if not ADMIN_EMAIL or not ADMIN_PASSWORD:
            return jsonify({'error': 'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set'}), 400
            
        # Check if admin already exists
        if use_mongodb:
            if MongoUser.find_by_email(ADMIN_EMAIL):
                return "ℹ️ Admin already exists."
        else:
            if User.query.filter_by(email=ADMIN_EMAIL).first():
                return "ℹ️ Admin already exists."
        
        # Create admin user
        create_admin_user('Admin', ADMIN_EMAIL, ADMIN_PASSWORD)
        return "✅ Admin created successfully."
    except Exception as e:
        print(f"Create admin error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/clients', methods=['GET'])
def get_clients():
    try:
        clients = get_all_clients()
        return jsonify(clients)
    except Exception as e:
        print(f"Get clients error: {e}")
        return jsonify({'error': 'Failed to fetch clients'}), 500

@app.route('/api/clients', methods=['POST'])
def add_client():
    """Add client - MongoDB implementation"""
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        name = data.get('name')
        if not name:
            return jsonify({'error': 'Client name is required'}), 400

        # Create client document
        collection = mongo.get_collection('clients')
        client_doc = {
            'name': name,
            'industry': data.get('industry', ''),
            'contact': data.get('contact', ''),
            'email': data.get('email', ''),
            'phone': data.get('phone', ''),
            'website': data.get('website', ''),
            'description': data.get('description', ''),
            'status': data.get('status', 'active'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = collection.insert_one(client_doc)
        client_doc['_id'] = result.inserted_id

        # Return the client object
        return jsonify({
            'id': str(client_doc['_id']),
            'name': client_doc['name'],
            'industry': client_doc['industry'],
            'contact': client_doc['contact'],
            'email': client_doc['email'],
            'phone': client_doc['phone'],
            'website': client_doc['website'],
            'description': client_doc['description'],
            'status': client_doc['status'],
            'created_at': client_doc['created_at'].isoformat(),
            'updated_at': client_doc['updated_at'].isoformat()
        }), 201
        
    except Exception as e:
        print(f"Add client error: {str(e)}")
        return jsonify({'error': 'Failed to create client'}), 500

@app.route('/api/clients/<string:client_id>/cards', methods=['GET'])
def get_cards(client_id):
    """Get all cards for a client - MongoDB implementation"""
    try:
        collection = mongo.get_collection('cards')
        
        # Find cards for this client
        cards = list(collection.find({'client_id': client_id}).sort('created_at', -1))
        
        return jsonify([
            {
                'id': str(card['_id']),
                'type': card.get('type', ''),
                'title': card.get('title', ''),
                'subtitle': card.get('subtitle', ''),
                'icon': card.get('icon', ''),
                'created_at': card.get('created_at', datetime.utcnow()).isoformat() if card.get('created_at') else None
            }
            for card in cards
        ])
    except Exception as e:
        print(f"Get cards error: {e}")
        return jsonify({'error': 'Failed to fetch cards'}), 500

@app.route('/api/clients/<string:client_id>/cards', methods=['POST'])
def add_card(client_id):
    """Add card for a client - MongoDB implementation"""
    try:
        data = request.get_json() or {}
        if not data.get('type'):
            return jsonify({'error': 'Card type is required'}), 400

        # Verify client exists
        clients_collection = mongo.get_collection('clients')
        from bson import ObjectId
        client = clients_collection.find_one({'_id': ObjectId(client_id)})
        if not client:
            return jsonify({'error': 'Client not found'}), 404

        # Create card document
        cards_collection = mongo.get_collection('cards')
        card_doc = {
            'client_id': client_id,
            'type': data.get('type'),
            'title': data.get('title', data.get('type', '').capitalize()),
            'subtitle': data.get('subtitle', ''),
            'icon': data.get('icon', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = cards_collection.insert_one(card_doc)
        card_doc['_id'] = result.inserted_id

        return jsonify({
            'id': str(card_doc['_id']),
            'type': card_doc['type'],
            'title': card_doc['title'],
            'subtitle': card_doc['subtitle'],
            'icon': card_doc['icon'],
            'created_at': card_doc['created_at'].isoformat(),
            'client_id': card_doc['client_id']
        }), 201

    except Exception as e:
        print(f"Add card error: {e}")
        return jsonify({'error': 'Failed to create card'}), 500

@app.route('/api/cards/<string:card_id>', methods=['DELETE'])
def delete_card(card_id):
    """Delete card - MongoDB implementation"""
    try:
        collection = mongo.get_collection('cards')
        from bson import ObjectId
        
        result = collection.delete_one({'_id': ObjectId(card_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Card not found'}), 404
        
        return jsonify({'message': 'Card deleted successfully'})
    except Exception as e:
        print(f"Delete card error: {e}")
        return jsonify({'error': 'Failed to delete card'}), 500

# ─── Client Access Control Endpoints ───────────────────────────────────────────

@app.route('/api/clients/<int:client_id>/access', methods=['GET'])
def get_client_access(client_id):
    """Get who can access this client's content"""
    try:
        access_perms = ClientAccess.query.filter_by(client_id=client_id).all()
        return jsonify([
            {
                'id': perm.id,
                'client_id': perm.client_id,
                'viewer_user_id': perm.viewer_user_id,
                'viewer_name': perm.viewer.name,
                'viewer_email': perm.viewer.email,
                'can_view': perm.can_view,
                'can_comment': perm.can_comment,
                'can_approve': perm.can_approve,
                'created_at': perm.created_at
            }
            for perm in access_perms
        ])
    except Exception as e:
        print(f"Get client access error: {e}")
        return jsonify({'error': 'Failed to fetch client access permissions'}), 500

@app.route('/api/clients/<int:client_id>/access', methods=['POST'])
def add_client_access(client_id):
    """Add access permission for a user to view this client's content"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
            
        # Check if client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'error': 'Client not found'}), 404
            
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Check if access already exists
        existing = ClientAccess.query.filter_by(client_id=client_id, viewer_user_id=user_id).first()
        if existing:
            return jsonify({'error': 'Access permission already exists'}), 400
            
        # Create new access permission
        access = ClientAccess(
            client_id=client_id,
            viewer_user_id=user_id,
            can_view=data.get('can_view', True),
            can_comment=data.get('can_comment', True),
            can_approve=data.get('can_approve', False)
        )
        db.session.add(access)
        db.session.commit()
        
        return jsonify({
            'id': access.id,
            'client_id': access.client_id,
            'viewer_user_id': access.viewer_user_id,
            'can_view': access.can_view,
            'can_comment': access.can_comment,
            'can_approve': access.can_approve,
            'created_at': access.created_at
        }), 201
        
    except Exception as e:
        print(f"Add client access error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add client access permission'}), 500

@app.route('/api/clients/<int:client_id>/access/<int:access_id>', methods=['PUT'])
def update_client_access(client_id, access_id):
    """Update access permission for a user"""
    try:
        data = request.get_json() or {}
        
        access = ClientAccess.query.get(access_id)
        if not access or access.client_id != client_id:
            return jsonify({'error': 'Access permission not found'}), 404
            
        # Update permissions
        if 'can_view' in data:
            access.can_view = data['can_view']
        if 'can_comment' in data:
            access.can_comment = data['can_comment']
        if 'can_approve' in data:
            access.can_approve = data['can_approve']
            
        db.session.commit()
        
        return jsonify({
            'id': access.id,
            'client_id': access.client_id,
            'viewer_user_id': access.viewer_user_id,
            'can_view': access.can_view,
            'can_comment': access.can_comment,
            'can_approve': access.can_approve
        })
        
    except Exception as e:
        print(f"Update client access error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update client access permission'}), 500

@app.route('/api/clients/<int:client_id>/access/<int:access_id>', methods=['DELETE'])
def delete_client_access(client_id, access_id):
    """Remove access permission for a user"""
    try:
        access = ClientAccess.query.get(access_id)
        if not access or access.client_id != client_id:
            return jsonify({'error': 'Access permission not found'}), 404
            
        db.session.delete(access)
        db.session.commit()
        
        return jsonify({'message': 'Client access permission removed successfully'})
        
    except Exception as e:
        print(f"Delete client access error: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to remove client access permission'}), 500

# ─── Content Calendar Endpoints ────────────────────────────────────────────────

@app.route('/api/clients/<client_id>/content-calendar', methods=['GET'])
def get_content_calendar(client_id):
    try:
        entries = MongoContentCalendar.find_by_client(client_id)
        result = []
        for entry in entries:
            result.append({
                'id': str(entry['_id']),
                'title': entry.get('title'),
                'description': entry.get('description'),
                'content_type': entry.get('content_type'),
                'contentType': entry.get('content_type'),
                'platform': entry.get('platform'),
                'channel': entry.get('platform'),
                'date': entry.get('date'),
                'status': entry.get('status'),
                'text_copy': entry.get('text_copy'),
                'textCopy': entry.get('text_copy'),
                'artwork_copy': entry.get('description'),
                'artworkCopy': entry.get('description'),
                'hashtags': entry.get('hashtags'),
                'tags': entry.get('hashtags', '').split(',') if entry.get('hashtags') else [],
                'created_by': entry.get('created_by'),
                'approval_status': entry.get('approval_status'),
                'approvalStatus': entry.get('approval_status'),
                'created_at': entry.get('created_at').isoformat() if hasattr(entry.get('created_at'), 'isoformat') else str(entry.get('created_at')),
                'updated_at': entry.get('updated_at').isoformat() if hasattr(entry.get('updated_at'), 'isoformat') else str(entry.get('updated_at')),
                'files': entry.get('files', [])
            })
        return jsonify(result)
    except Exception as e:
        print(f"Get content calendar error: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': 'Failed to fetch content calendar'}), 500

@app.route('/api/clients/<client_id>/content-calendar', methods=['POST'])
def create_content_calendar_entry(client_id):
    try:
        data = request.get_json(force=True, silent=False) or {}
        if not data.get('date'):
            return jsonify({'error': 'Date is required'}), 400
        entry = MongoContentCalendar.create_entry(
            client_id=client_id,
            title=data.get('title', data.get('contentType', 'Untitled')),
            description=data.get('artworkCopy', ''),
            content_type=data.get('contentType', ''),
            platform=data.get('channel', ''),
            date=data.get('date'),
            status=data.get('status', 'draft').lower(),
            text_copy=data.get('textCopy', ''),
            hashtags=','.join(data.get('tags', [])) if data.get('tags') else '',
            created_by=data.get('user_id', 1),
            client_feedback=data.get('clientFeedback', ''),
            approval_status=data.get('approvalStatus', 'pending'),
            files=data.get('files', [])
        )
        return jsonify({'id': str(entry['_id']), 'message': 'Content calendar entry created successfully'}), 201
    except Exception as e:
        print(f"[ERROR] Failed to create content calendar entry: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': f'Failed to create content calendar entry: {str(e)}'}), 500

@app.route('/api/content-calendar/<entry_id>', methods=['PUT'])
def update_content_calendar_entry(entry_id):
    try:
        data = request.get_json() or {}
        update_data = {}
        if 'title' in data or 'contentType' in data:
            update_data['title'] = data.get('title', data.get('contentType'))
        if 'artworkCopy' in data:
            update_data['description'] = data['artworkCopy']
        if 'contentType' in data:
            update_data['content_type'] = data['contentType']
        if 'channel' in data:
            update_data['platform'] = data['channel']
        if 'date' in data:
            update_data['date'] = data['date']
        if 'status' in data:
            update_data['status'] = data['status'].lower()
        if 'textCopy' in data:
            update_data['text_copy'] = data['textCopy']
        if 'tags' in data:
            update_data['hashtags'] = ','.join(data['tags']) if data['tags'] else ''
        if 'clientFeedback' in data:
            update_data['client_feedback'] = data['clientFeedback']
        if 'approvalStatus' in data:
            update_data['approval_status'] = data['approvalStatus']
        if 'files' in data:
            update_data['files'] = data['files']
        update_data['updated_at'] = datetime.utcnow()
        MongoContentCalendar.update_entry(entry_id, update_data)
        return jsonify({'message': 'Content calendar entry updated successfully'})
    except Exception as e:
        print(f"Update content calendar error: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': 'Failed to update content calendar entry'}), 500

@app.route('/api/content-calendar/<entry_id>', methods=['DELETE'])
def delete_content_calendar_entry(entry_id):
    try:
        MongoContentCalendar.delete_entry(entry_id)
        return jsonify({'message': 'Content calendar entry deleted successfully'})
    except Exception as e:
        print(f"Delete content calendar error: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': 'Failed to delete content calendar entry'}), 500

@app.route('/api/ai/generate-content', methods=['POST'])
def generate_content():
    data = request.json
    answers = data.get('answers', [])
    # Improved prompt for GPT-4
    prompt = (
        "You are a world-class social media strategist. Based on the following brand information, generate a detailed 30-day social media content calendar. "
        "For each day, suggest a post idea, recommended platform, and a short caption or theme.\n"
    )
    questions = [
        "Is this for a New Client or Existing Client?",
        "What does this brand want to be known for? What’s their core identity?",
        "What products or services need the most awareness this month?",
        "Who is the ideal customer? Tell me about their demographics, interests, and pain points:",
        "What specific pain points does this brand solve for customers?",
        "Are there any seasonal events, product launches, or trending topics we should capitalize on this month?",
        "What tone best fits the brand personality?",
        "Who are the key competitors we should be aware of? (This helps us differentiate the content)",
        "Which platforms should we focus on?",
        "How many posts per week feels right for this brand?",
        "Would you like me to include trending content suggestions specific to your industry?",
        "Would you like me to suggest optimal posting times based on your audience, or use standard recommendations?"
    ]
    for idx, answer in enumerate(answers):
        prompt += f"{questions[idx]}\n{answer}\n"
    prompt += (
        "\nReturn the plan as a numbered list, one for each day, with platform and post idea. "
        "Be creative, relevant, and concise."
    )

    openai.api_key = os.getenv('OPENAI_API_KEY')
    try:
        print(f"=== AI Content Generation Debug ===")
        print(f"API Key present: {bool(openai.api_key)}")
        print(f"Received {len(answers)} answers")
        
        # Use the newer OpenAI client syntax
        from openai import OpenAI
        client = OpenAI(api_key=openai.api_key)
        
        print("Making OpenAI API call...")
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            max_tokens=2000,
            temperature=0.7
        )
        content_plan = response.choices[0].message.content
        print(f"Generated content plan successfully!")
        return jsonify({"content_plan": content_plan})
    except Exception as e:
        print(f"[FULL ERROR] {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Generation failed: {str(e)}"}), 500

@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    """Upload a file and return file info"""
    try:
        if 'file' not in request.files:
            print('No file part in request.files')
            print('Request.files:', request.files)
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            print('No file selected')
            return jsonify({'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            print(f"File type not allowed: {file.filename}")
            return jsonify({'error': f'File type not allowed: {file.filename}'}), 400
        # Ensure upload directory exists and is writable
        upload_dir = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_dir):
            try:
                os.makedirs(upload_dir, exist_ok=True)
                print(f"Created upload directory: {upload_dir}")
            except Exception as e:
                print(f"Failed to create upload directory: {e}")
                return jsonify({'error': 'Failed to create upload directory'}), 500
        if not os.access(upload_dir, os.W_OK):
            print(f"Upload directory not writable: {upload_dir}")
            return jsonify({'error': 'Upload directory not writable'}), 500
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        print(f"Saving file to: {file_path}")
        try:
            file.save(file_path)
        except Exception as e:
            print(f"File save error: {e}")
            import traceback; traceback.print_exc()
            return jsonify({'error': f'File save error: {str(e)}'}), 500
        print(f"File saved: {file_path}")
        return jsonify({
            'filename': unique_filename,
            'original_filename': file.filename,
            'file_path': file_path,
            'file_size': os.path.getsize(file_path),
            'mime_type': file.content_type
        }), 200
    except Exception as e:
        print(f"File upload error: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500

@app.route('/api/files/<filename>')
def serve_file(filename):
    """Serve uploaded files"""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        print(f"File serve error: {e}")
        return jsonify({'error': 'File not found'}), 404

@app.route('/api/channels', methods=['GET'])
def get_channels():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    channels = MongoChannel.find_by_user(user_id)
    result = []
    for c in channels:
        last_msg = MongoMessage.find_by_channel(str(c['_id']))
        last_message_time = last_msg[-1]['created_at'].isoformat() if last_msg else None
        result.append({
            'id': str(c['_id']),
            'name': c.get('name'),
            'is_dm': c.get('is_dm', False),
            'unread_count': 0,
            'last_message': last_message_time
        })
    return jsonify(result)

@app.route('/api/channels', methods=['POST'])
def create_or_get_channel():
    data = request.get_json() or {}
    name = data.get('name')
    is_dm = data.get('is_dm', False)
    member_ids = sorted([str(uid) for uid in data.get('member_ids', [])])
    created_by = str(data.get('created_by'))
    if not name or not member_ids or not created_by:
        return jsonify({'error': 'Missing required fields'}), 400
    # For DMs, try to find existing channel with same name and exact members
    if is_dm:
        existing = MongoChannel.find_by_members(name, is_dm, member_ids)
        if existing:
            return jsonify({'id': str(existing['_id']), 'name': existing['name'], 'is_dm': True}), 200
    # Create new channel
    channel = MongoChannel.create_channel(name, is_dm, member_ids, created_by)
    return jsonify({'id': str(channel['_id']), 'name': channel['name'], 'is_dm': channel['is_dm']}), 201

@app.route('/api/channels/<channel_id>/messages', methods=['GET'])
def get_channel_messages(channel_id):
    messages = MongoMessage.find_by_channel(channel_id)
    result = []
    for m in messages:
        result.append({
            'id': str(m['_id']),
            'channel_id': m['channel_id'],
            'user_id': m['user_id'],
            'content': m['content'],
            'parent_message_id': m.get('parent_message_id'),
            'created_at': m['created_at'].isoformat() if hasattr(m['created_at'], 'isoformat') else str(m['created_at']),
            'name': m.get('name', 'Unknown')
        })
    return jsonify(result)

@app.route('/api/channels/<string:channel_id>/members', methods=['GET'])
def get_channel_members(channel_id):
    """Return members of a channel (for chat UI)"""
    try:
        collection = mongo.get_collection('channels')
        channel = collection.find_one({'_id': channel_id})
        if not channel:
            return jsonify({'error': 'Channel not found'}), 404
        members = channel.get('members', [])
        # If members are user IDs, fetch user info
        user_collection = mongo.get_collection('users')
        member_objs = []
        for m in members:
            user = user_collection.find_one({'_id': m}) if isinstance(m, str) else user_collection.find_one({'_id': str(m)})
            if user:
                member_objs.append({
                    'id': str(user['_id']),
                    'name': user.get('name', ''),
                    'email': user.get('email', ''),
                    'user_type': user.get('user_type', 'employee'),
                    'department': user.get('department', ''),
                })
        return jsonify(member_objs)
    except Exception as e:
        print(f"Error in get_channel_members: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': 'Failed to fetch channel members'}), 500

@app.route('/api/meetings', methods=['GET', 'POST'])
def handle_meetings():
    """Handle fetching and scheduling meetings."""
    try:
        if request.method == 'GET':
            # Fetch all meetings from MongoDB
            meetings = MongoMeeting.find_all()
            print(f"Meetings fetched: {meetings}")
            return jsonify([
                {
                    'id': str(meeting['_id']),
                    'title': meeting.get('title', ''),
                    'description': meeting.get('description', ''),
                    'start_time': meeting.get('start_time') if isinstance(meeting.get('start_time'), str) else meeting.get('start_time').isoformat(),
                    'end_time': meeting.get('end_time') if isinstance(meeting.get('end_time'), str) else meeting.get('end_time').isoformat(),
                    'participants': meeting.get('participants', []),
                    'created_at': meeting.get('created_at').isoformat() if meeting.get('created_at') else None
                } for meeting in meetings
            ])
        elif request.method == 'POST':
            # Schedule a new meeting
            data = request.get_json() or {}
            title = data.get('title')
            description = data.get('description')
            start_time = data.get('start_time')
            end_time = data.get('end_time')
            participants = data.get('participants', [])

            if not all([title, start_time, end_time]):
                return jsonify({'error': 'Title, start_time, and end_time are required'}), 400

            meeting_doc = MongoMeeting.create_meeting(title, description, start_time, end_time, participants)
            return jsonify({
                'message': 'Meeting scheduled successfully',
                'meeting': {
                    'id': str(meeting_doc['_id']),
                    'title': meeting_doc['title'],
                    'description': meeting_doc['description'],
                    'start_time': meeting_doc['start_time'].isoformat(),
                    'end_time': meeting_doc['end_time'].isoformat(),
                    'participants': meeting_doc['participants']
                }
            }), 201
    except Exception as e:
        print(f"Meeting error: {e}")
        return jsonify({'error': 'Failed to handle meetings'}), 500

# Move business logic to core/business_logic.py and keep only Flask app/adapters here.
# Example import:
# from core.business_logic import get_access_requests_logic, approve_access_request_logic, ...
if __name__ == "__main__":
    import sys
    port = 5002  # Default to 5002 to avoid conflicts
    use_ssl = False  # Default to no SSL for development
    
    for arg in sys.argv:
        if arg.startswith("--port="):
            try:
                port = int(arg.split("=", 1)[1])
            except Exception:
                pass
        elif arg == "--no-ssl":
            use_ssl = False
    
    if use_ssl:
        cert_path = os.path.join(os.path.dirname(__file__), '../certs/cert.pem')
        key_path = os.path.join(os.path.dirname(__file__), '../certs/key.pem')
        
        # Check if SSL certificates exist
        if os.path.exists(cert_path) and os.path.exists(key_path):
            print(f"[SERVER] Starting with SSL on https://localhost:{port}")
            socketio.run(
                app,
                host="0.0.0.0",
                port=port,
                debug=True,
                ssl_context=(cert_path, key_path)
            )
        else:
            print(f"[SERVER] SSL certificates not found, starting without SSL on http://localhost:{port}")
            socketio.run(
                app,
                host="0.0.0.0",
                port=port,
                debug=True
            )
    else:
        print(f"[SERVER] Starting without SSL on http://localhost:{port}")
        socketio.run(
            app,
            host="0.0.0.0",
            port=port,
            debug=True
        )