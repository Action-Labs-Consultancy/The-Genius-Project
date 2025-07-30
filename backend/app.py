from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import os
import smtplib
from email.mime.text import MIMEText
import traceback
import secrets
from itsdangerous import URLSafeTimedSerializer
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime
import socket
import uuid
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
import logging

# Security middleware imports
from security_middleware import (
    require_auth, require_admin, require_client_access, rate_limit,
    validate_file_upload, security_headers, sanitize_input,
    SecurityValidator, log_security_event, generate_csrf_token
)

# MongoDB imports
try:
    from mongo_db import mongo, MongoUser, MongoClientModel, MongoProject, MongoTask, MongoChannel, MongoMessage, MongoMeeting, MongoContentCalendar, MongoChatConversation
    print("[IMPORT] MongoDB modules imported successfully")
except ImportError as e:
    print(f"[IMPORT ERROR] Failed to import MongoDB modules: {e}")
    # Create a mock mongo object to prevent crashes
    class MockMongo:
        def __init__(self):
            self.db = None
        def connect(self, uri):
            return False
        def get_collection(self, name):
            return None
    mongo = MockMongo()
    MongoUser = None

from plugins.openai.openai_plugin import OpenAIPlugin
# from plugins.pinecone.pinecone_plugin import initialize_pinecone
# from plugins.revive.revive_plugin import get_revive_stats, create_campaign, create_banner

# ─── Load env & set keys ───────────────────────────────────────────────────────
load_dotenv()  # must come before os.getenv

# MongoDB setup - Enhanced connection with retry
mongodb_uri = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI')
use_mongodb = True  # Force MongoDB usage

def ensure_mongodb_connection():
    """Ensure MongoDB connection is established"""
    global mongo
    if mongodb_uri and (mongo.db is None or not mongo.client):
        try:
            result = mongo.connect(mongodb_uri)
            if result:
                print(f"[DATABASE] MongoDB connected successfully to {mongodb_uri.split('@')[1].split('/')[0] if '@' in mongodb_uri else 'database'}")
                return True
            else:
                print("[DATABASE] MongoDB connection failed")
                return False
        except Exception as e:
            print(f"[DATABASE] MongoDB connection error: {e}")
            return False
    return mongo.db is not None

# Initial connection attempt
if mongodb_uri:
    if ensure_mongodb_connection():
        print("[DATABASE] Using MongoDB as primary database")
    else:
        print("[DATABASE] MongoDB connection failed - will retry on requests")
else:
    print("[DATABASE] MONGODB_URI not found in environment variables")
    print("[DATABASE] Please set MONGODB_URI for cross-LAN brain visibility")

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
                s.bind(('0.0.0.0', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"No available ports found between {start_port} and {max_port}")

# ─── Flask setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)

# CORS configuration for LAN access - NUCLEAR WAR MODE
CORS(app, 
     origins="*",  # Allow ALL origins
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
     allow_headers="*",  # Allow ALL headers
     expose_headers="*",  # Expose ALL headers
     supports_credentials=True,
     vary_header=False
)

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
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Register dashboard routes
from dashboard_routes import register_dashboard_routes
register_dashboard_routes(app)

# Register leave management routes
from leave_routes import register_leave_routes
from equipment_routes import register_equipment_routes
from project_routes import project_routes
register_leave_routes(app)
register_equipment_routes(app, mongo)

# Register project routes
app.register_blueprint(project_routes)
from workflow_api import workflow_api
app.register_blueprint(workflow_api)

# Register enhanced client AI routes
from client_ai_routes import client_ai_bp
app.register_blueprint(client_ai_bp)

# Register logs API for system activity logs
from logs_api import logs_api
app.register_blueprint(logs_api)

# Register brain management routes
try:
    from brain_management import brain_api
    app.register_blueprint(brain_api)
except ImportError as e:
    print(f"Warning: Could not import brain_management: {e}")
    print("Brain management features will be unavailable")

# Register agent management routes
try:
    from agent_routes import agent_routes
    app.register_blueprint(agent_routes)
    print("[AGENT ROUTES] Agent management routes registered successfully")
except ImportError as e:
    print(f"Warning: Could not import agent_routes: {e}")
    print("Agent management features will be unavailable")

# Register marketing lab routes
try:
    from marketing_lab_routes import marketing_lab_routes
    app.register_blueprint(marketing_lab_routes, url_prefix='/api/marketing-lab')
    print(f"[MARKETING LAB] Routes registered at /api/marketing-lab with {len(marketing_lab_routes.deferred_functions)} endpoints")
except ImportError as e:
    print(f"Warning: Could not import marketing_lab_routes: {e}")
    print("Marketing Lab features will be unavailable")
except Exception as e:
    print(f"Error registering marketing lab routes: {e}")
    import traceback
    traceback.print_exc()
except ImportError as e:
    print(f"Warning: Could not import marketing_lab_routes: {e}")
    print("Marketing Lab features will be unavailable")

# Register brain routes
try:
    from brain_routes import brain_routes
    app.register_blueprint(brain_routes)
    print("[BRAIN ROUTES] Basic brain routes registered successfully")
except ImportError as e:
    print(f"Warning: Could not import brain_routes: {e}")
    print("Basic brain features will be unavailable")

# Register enhanced brain routes with full Pinecone/MongoDB integration
try:
    from enhanced_brain_routes import enhanced_brain_routes
    app.register_blueprint(enhanced_brain_routes)
    print("[ENHANCED BRAIN] Enhanced brain routes with full integration registered successfully")
except ImportError as e:
    print(f"Warning: Could not import enhanced_brain_routes: {e}")
    print("Enhanced brain features will be unavailable")

# Register feature request routes
try:
    from feature_request_routes import feature_request_routes
    app.register_blueprint(feature_request_routes)
    print("[FEATURE REQUESTS] Feature request management routes registered successfully")
except ImportError as e:
    print(f"Warning: Could not import feature_request_routes: {e}")
    print("Feature request management features will be unavailable")

# Generate a secure random key if not set in environment
if not os.environ.get('SECRET_KEY'):
    print("[WARNING] Using auto-generated SECRET_KEY. For production, set SECRET_KEY in environment variables.")
    os.environ['SECRET_KEY'] = secrets.token_hex(32)  # 256-bit random key

SECRET_KEY = os.environ.get('SECRET_KEY')
app.config['SECRET_KEY'] = SECRET_KEY

# Session configuration for better cookie handling
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # For cross-origin requests
app.config['SESSION_COOKIE_NAME'] = 'genius_session'
app.config['SESSION_COOKIE_DOMAIN'] = None  # Allow any domain (important for IP addresses)

serializer = URLSafeTimedSerializer(SECRET_KEY)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# Apply security middleware
@app.before_request
def before_request():
    """Apply security measures before each request."""
    app.logger.info(f"Incoming request: {request.method} {request.path} from {request.remote_addr}")
    rate_limit()
    # Removed: security_headers() (it's a decorator, not a function)
    # CSRF protection (optional, only for unsafe methods)
    if request.method in ['POST', 'PUT', 'DELETE']:
        token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
        # Only check CSRF if token is expected
        # if not token or token != generate_csrf_token():
        #     return jsonify({'error': 'Invalid or missing CSRF token'}), 403

@app.after_request
def after_request(response):
    """Apply security measures after each request."""
    # Don't log file content, only metadata
    if response.content_type and response.content_type.startswith('image/'):
        app.logger.info(f"Response: {response.status} [IMAGE FILE]")
    else:
        try:
            app.logger.info(f"Response: {response.status} {response.get_data(as_text=True)}")
        except:
            app.logger.info(f"Response: {response.status} [BINARY DATA]")
    
    # Only sanitize JSON responses
    if response.is_json:
        data = response.get_json()
        sanitized_data = sanitize_input(data)
        import json
        response.set_data(json.dumps(sanitized_data))
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    """Handle exceptions globally with better error information."""
    # Log the error with more context
    error_msg = str(e)
    app.logger.error(f"Error: {error_msg}")
    
    # Log request context for debugging
    try:
        app.logger.error(f"Request URL: {request.url}")
        app.logger.error(f"Request method: {request.method}")
    except:
        pass
    
    traceback.print_exc()
    
    # Provide more specific error responses for common issues
    if "405 Method Not Allowed" in error_msg:
        return jsonify({
            'error': 'Method not allowed for this endpoint',
            'message': 'Check the HTTP method and URL path',
            'details': error_msg
        }), 405
    
    if "400 Bad Request" in error_msg:
        return jsonify({
            'error': 'Bad request format',
            'message': 'Please check your request format and try again',
            'details': error_msg
        }), 400
    
    # Return a generic error response for other cases
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred',
        'details': error_msg if app.debug else 'Error details hidden in production'
    }), 500

# ─── Socket Event Handlers ─────────────────────────────────────────────────

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    print(f"🔌 DEBUG: Client connected - Session ID: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    print(f"🔌 DEBUG: Client disconnected - Session ID: {request.sid}")

@socketio.on('join')
def handle_join(data):
    """Handle user joining a channel."""
    print(f"🏠 DEBUG: Received join event with data: {data}")
    channel_id = data.get('channel_id')
    if channel_id:
        join_room(f'channel_{channel_id}')
        print(f"🏠 DEBUG: User joined room channel_{channel_id}")
    else:
        print(f"❌ DEBUG: No channel_id provided in join event")

@socketio.on('leave')
def handle_leave(data):
    """Handle user leaving a channel."""
    print(f"🚪 DEBUG: Received leave event with data: {data}")
    channel_id = data.get('channel_id')
    if channel_id:
        leave_room(f'channel_{channel_id}')
        print(f"🚪 DEBUG: User left room channel_{channel_id}")
    else:
        print(f"❌ DEBUG: No channel_id provided in leave event")

@socketio.on('send_message')
def handle_send_message(data):
    """Handle sending a message to a channel."""
    print(f"� شیوه DEBUG: Received send_message event with data: {data}")
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
        traceback.print_exc()

# ─── Database Helper Functions ─────────────────────────────────────────────────
def get_all_users():
    """Get all users from MongoDB."""
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
    """Get all clients from MongoDB."""
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
    """Get all projects from MongoDB."""
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
    """Get all tasks from MongoDB."""
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
    """Authenticate user with MongoDB."""
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
    """Create admin user in MongoDB."""
    return MongoUser.create_user(name, email, password, role='admin', is_admin=True)

def ensure_sample_data():
    """Ensure sample data exists in MongoDB."""
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
        # ensure_sample_data() # Removed for production
        print("[DATABASE] Sample data creation removed for production")
    except Exception as e:
        print(f"[DATABASE] Sample data creation failed: {e}")
        
    print(f"[DATABASE] Database initialization complete. Using MongoDB exclusively.")

# ─── Routes ────────────────────────────────────────────────────────────────────
@app.route('/api/access-requests', methods=['GET'])
def get_access_requests():
    """Get access requests - MongoDB implementation."""
    try:
        requests = list(mongo.db.access_requests.find())
        # Convert ObjectId to string for JSON serialization
        for req in requests:
            req['id'] = str(req['_id'])
            del req['_id']
            # Convert datetime objects to ISO strings
            if 'created_at' in req:
                req['created_at'] = req['created_at'].isoformat()
            if 'updated_at' in req:
                req['updated_at'] = req['updated_at'].isoformat()
        
        print(f"[ACCESS REQUESTS] Returning {len(requests)} access requests")
        return jsonify(requests)
    except Exception as e:
        print(f"Get access requests error: {e}")
        return jsonify({'error': 'Failed to fetch access requests'}), 500

@app.route('/api/access-requests/<string:req_id>/approve', methods=['POST'])
def approve_access_request(req_id):
    """Approve access request and create user account - MongoDB implementation."""
    try:
        from bson import ObjectId
        
        # Get the request data first
        request_doc = mongo.db.access_requests.find_one({'_id': ObjectId(req_id)})
        if not request_doc:
            return jsonify({'error': 'Access request not found'}), 404
        
        # Get additional data from the request body (department, user_type, etc.)
        data = request.get_json() or {}
        user_type = data.get('user_type', request_doc.get('requested_role', 'employee'))
        department = data.get('department', 'General')
        
        # Check if user already exists
        existing_user = mongo.db.users.find_one({'email': request_doc['email']})
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        # Generate a temporary password (user will need to reset it)
        import string
        import random
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        # Create user account
        import bcrypt
        # Hash password using bcrypt like MongoUser does
        password_hash = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt())
        
        user_doc = {
            'name': request_doc['name'],
            'email': request_doc['email'],
            'password_hash': password_hash,  # Use password_hash instead of password
            'user_type': user_type,
            'role': user_type,
            'department': department if user_type == 'employee' else '',
            'is_admin': user_type == 'admin',
            'created_at': datetime.now(),
            'client_id': None,
            'needs_password_reset': True  # Flag to force password reset on first login
        }
        
        # Insert the user
        user_result = mongo.db.users.insert_one(user_doc)
        user_id = str(user_result.inserted_id)
        
        # Update the request status with user_id reference
        result = mongo.db.access_requests.update_one(
            {'_id': ObjectId(req_id)},
            {
                '$set': {
                    'status': 'approved',
                    'updated_at': datetime.now(),
                    'user_id': user_id,
                    'approved_user_type': user_type,
                    'approved_department': department,
                    'temp_password': temp_password  # Store for potential email sending
                }
            }
        )
        
        print(f"[ACCESS REQUEST] Approved request {req_id} and created user {user_id}")
        print(f"[USER CREATION] User {request_doc['name']} ({request_doc['email']}) created with temp password: {temp_password}")
        
        return jsonify({
            'message': 'Access request approved and user account created successfully',
            'user_id': user_id,
            'temp_password': temp_password,
            'email': request_doc['email'],
            'name': request_doc['name']
        })
        
    except Exception as e:
        print(f"Approve access request error: {e}")
        return jsonify({'error': 'Failed to approve access request'}), 500

@app.route('/api/access-requests/<string:req_id>/reject', methods=['POST'])
def reject_access_request(req_id):
    """Reject access request - MongoDB implementation."""
    try:
        from bson import ObjectId
        
        # Update the request status
        result = mongo.db.access_requests.update_one(
            {'_id': ObjectId(req_id)},
            {
                '$set': {
                    'status': 'rejected',
                    'updated_at': datetime.now()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Access request not found'}), 404
        
        print(f"[ACCESS REQUEST] Rejected request {req_id}")
        return jsonify({'message': 'Access request rejected successfully'})
    except Exception as e:
        print(f"Reject access request error: {e}")
        return jsonify({'error': 'Failed to reject access request'}), 500

@app.route('/set-password', methods=['POST'])
def set_password():
    """Set password - MongoDB implementation."""
    try:
        # This feature needs to be rebuilt for MongoDB
        return jsonify({'message': 'Password setting not yet implemented for MongoDB'}), 501
    except Exception as e:
        print(f"Set password error: {e}")
        return jsonify({'error': 'Failed to set password'}), 500

@app.route('/request-access', methods=['POST'])
def request_access():
    """Submit an access request - MongoDB implementation."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('email'):
            return jsonify({'error': 'Name and email are required'}), 400
        
        # Create access request document
        access_request = {
            'name': data['name'],
            'email': data['email'],
            'reason': data.get('reason', ''),
            'requested_role': data.get('requested_role', 'employee'),
            'status': 'pending',
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        # Check if request already exists for this email
        existing_request = mongo.db.access_requests.find_one({'email': data['email']})
        if existing_request:
            return jsonify({'error': 'An access request already exists for this email'}), 400
        
        # Insert the request
        result = mongo.db.access_requests.insert_one(access_request)
        access_request['_id'] = str(result.inserted_id)
        
        print(f"[ACCESS REQUEST] New request from {data['name']} ({data['email']})")
        
        return jsonify({
            'success': True,
            'message': 'Access request submitted successfully',
            'data': access_request
        }), 201
        
    except Exception as e:
        print("Error in /request-access:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Forgot password - MongoDB implementation."""
    try:
        # This feature needs to be rebuilt for MongoDB
        return jsonify({'message': 'Forgot password not yet implemented for MongoDB'}), 501
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({'error': 'Failed to process forgot password'}), 500

@app.route('/players', methods=['GET'])
def get_players():
    """Get players - MongoDB implementation."""
    try:
        # This feature needs to be rebuilt for MongoDB or may not be needed
        return jsonify([])
    except Exception as e:
        print(f"Get players error: {e}")
        return jsonify({'error': 'Failed to fetch players'}), 500

@app.route('/api/users', methods=['POST'])
def add_user():
    """Add user - MongoDB implementation."""
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
    """Get all users from MongoDB."""
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
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects from MongoDB."""
    try:
        projects = get_all_projects()
        return jsonify(projects)
    except Exception as e:
        print(f"Get projects error: {e}")
        return jsonify({'error': 'Failed to fetch projects'}), 500

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks from MongoDB."""
    try:
        tasks = get_all_tasks()
        return jsonify(tasks)
    except Exception as e:
        print(f"Get tasks error: {e}")
        return jsonify({'error': 'Failed to fetch tasks'}), 500

@app.route('/api/users/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user - MongoDB implementation."""
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
    """Delete user - MongoDB implementation."""
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
    """Get accessible clients - MongoDB implementation."""
    try:
        # For now, return all clients as this feature needs to be rebuilt for MongoDB
        clients = get_all_clients()
        return jsonify(clients)
    except Exception as e:
        print(f"Get accessible clients error: {e}")
        return jsonify({'error': 'Failed to fetch accessible clients'}), 500

@app.route('/login', methods=['POST'])
def login():
    """Handle user login."""
    try:
        from flask import session
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')

        print(f"[DEBUG] Login attempt for email: {email}")

        # Validate input
        if not email or not password:
            return jsonify({'error': 'Email and password required', 'error_type': 'validation'}), 400

        # Check if MongoDB is available
        if mongo.db is None:
            print("[ERROR] MongoDB not connected")
            return jsonify({'error': 'Database connection unavailable', 'error_type': 'network'}), 503

        try:
            # Authenticate user using MongoDB
            user = MongoUser.find_by_email(email)
            if user and MongoUser.verify_password(user, password):
                print(f"[INFO] Successful login for user: {email}")
                
                # Check if user needs password reset (newly approved user)
                needs_password_reset = user.get('needs_password_reset', False)
                
                # Create session data
                user_session_data = {
                    'id': str(user['_id']),
                    'name': user.get('name', ''),
                    'email': user.get('email', ''),
                    'userType': user.get('role', 'employee'),
                    'role': user.get('role', 'employee'),
                    'department': user.get('department', ''),
                    'is_admin': user.get('is_admin', False),
                    'needs_password_reset': needs_password_reset
                }
                
                # Store user in session
                session['user'] = user_session_data
                session.permanent = True
                
                print(f"[DEBUG] Session created for user: {email}")
                
                return jsonify({
                    'message': 'Login successful',
                    'is_admin': user.get('is_admin', False),
                    'needs_password_reset': needs_password_reset,
                    'user': user_session_data
                })
            
            print(f"[WARNING] Failed login attempt for: {email}")
            return jsonify({'error': 'Invalid email or password', 'error_type': 'credentials'}), 401
        
        except Exception as db_error:
            print(f"[ERROR] Database error during login: {str(db_error)}")
            return jsonify({'error': 'Database connection issue', 'error_type': 'network'}), 503
            
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"[ERROR] Login error: {str(e)}")
        print(f"[ERROR] Full traceback: {error_details}")
        return jsonify({'error': 'Internal server error', 'error_type': 'server', 'details': str(e)}), 500

@app.route('/create-admin')
def create_admin():
    """Create admin user."""
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
                return jsonify({'message': 'Admin already exists'}), 200
        
        # Create admin user
        create_admin_user('Admin', ADMIN_EMAIL, ADMIN_PASSWORD)
        return jsonify({'message': 'Admin created successfully'}), 201
    except Exception as e:
        print(f"Create admin error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all clients."""
    try:
        clients = get_all_clients()
        return jsonify(clients)
    except Exception as e:
        print(f"Get clients error: {e}")
        return jsonify({'error': 'Failed to fetch clients'}), 500

@app.route('/api/clients', methods=['POST'])
def add_client():
    """Add client - MongoDB implementation."""
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
    """Get all cards for a client - MongoDB implementation."""
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
    """Add card for a client - MongoDB implementation."""
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
    """Delete card - MongoDB implementation."""
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

@app.route('/api/cards/<string:card_id>', methods=['PUT'])
def update_card(card_id):
    """Update card status or other fields - MongoDB implementation."""
    try:
        data = request.get_json() or {}
        collection = mongo.get_collection('cards')
        from bson import ObjectId
        
        # Prepare update data
        update_fields = {}
        if 'status' in data:
            update_fields['status'] = data['status']
        if 'title' in data:
            update_fields['title'] = data['title']
        if 'subtitle' in data:
            update_fields['subtitle'] = data['subtitle']
        if 'priority' in data:
            update_fields['priority'] = data['priority']
        
        update_fields['updated_at'] = datetime.utcnow()
        
        result = collection.update_one(
            {'_id': ObjectId(card_id)}, 
            {'$set': update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Card not found'}), 404
        
        # Get updated card
        updated_card = collection.find_one({'_id': ObjectId(card_id)})
        return jsonify({
            'id': str(updated_card['_id']),
            'type': updated_card.get('type', ''),
            'title': updated_card.get('title', ''),
            'subtitle': updated_card.get('subtitle', ''),
            'status': updated_card.get('status', ''),
            'priority': updated_card.get('priority', ''),
            'icon': updated_card.get('icon', ''),
            'client_id': updated_card.get('client_id', ''),
            'updated_at': updated_card.get('updated_at', datetime.utcnow()).isoformat()
        })
    except Exception as e:
        print(f"Update card error: {e}")
        return jsonify({'error': 'Failed to update card'}), 500

@app.route('/api/cards/<string:card_id>', methods=['GET'])
def get_card(card_id):
    """Get card details - MongoDB implementation."""
    try:
        collection = mongo.get_collection('cards')
        from bson import ObjectId
        
        card = collection.find_one({'_id': ObjectId(card_id)})
        if not card:
            return jsonify({'error': 'Card not found'}), 404
            
        return jsonify({
            'id': str(card['_id']),
            'type': card.get('type', ''),
            'title': card.get('title', ''),
            'subtitle': card.get('subtitle', ''),
            'icon': card.get('icon', ''),
            'status': card.get('status', 'pending'),
            'priority': card.get('priority', 'medium'),
            'client_id': card.get('client_id', ''),
            'created_at': card['created_at'].isoformat() if card.get('created_at') else None,
            'updated_at': card['updated_at'].isoformat() if card.get('updated_at') else None
        })
        
    except Exception as e:
        print(f"Get card error: {e}")
        return jsonify({'error': 'Failed to fetch card'}), 500

@app.route('/api/cards/<string:card_id>', methods=['PATCH'])
def patch_card(card_id):
    """Update card details - MongoDB implementation."""
    try:
        data = request.get_json() or {}
        collection = mongo.get_collection('cards')
        from bson import ObjectId
        
        # Check if card exists
        card = collection.find_one({'_id': ObjectId(card_id)})
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Update fields
        update_data = {}
        if 'type' in data:
            update_data['type'] = data['type']
        if 'title' in data:
            update_data['title'] = data['title']
        if 'subtitle' in data:
            update_data['subtitle'] = data['subtitle']
        if 'icon' in data:
            update_data['icon'] = data['icon']
        if 'status' in data:
            update_data['status'] = data['status']
        if 'priority' in data:
            update_data['priority'] = data['priority']
        
        update_data['updated_at'] = datetime.utcnow()
        
        # Update the card
        collection.update_one({'_id': ObjectId(card_id)}, {'$set': update_data})
        
        # Get updated card
        updated_card = collection.find_one({'_id': ObjectId(card_id)})
        
        return jsonify({
            'id': str(updated_card['_id']),
            'type': updated_card.get('type', ''),
            'title': updated_card.get('title', ''),
            'subtitle': updated_card.get('subtitle', ''),
            'icon': updated_card.get('icon', ''),
            'status': updated_card.get('status', 'pending'),
            'priority': updated_card.get('priority', 'medium'),
            'client_id': updated_card.get('client_id', ''),
            'created_at': updated_card['created_at'].isoformat() if updated_card.get('created_at') else None,
            'updated_at': updated_card['updated_at'].isoformat() if updated_card.get('updated_at') else None
        })
        
    except Exception as e:
        print(f"Update card error: {e}")
        return jsonify({'error': 'Failed to update card'}), 500

# ─── Client Access Control Endpoints ───────────────────────────────────────────

@app.route('/api/clients/<string:client_id>/access', methods=['GET'])
def get_client_access(client_id):
    """Get who can access this client's content - MongoDB implementation."""
    try:
        access_collection = mongo.get_collection('client_access')
        users_collection = mongo.get_collection('users')
        from bson import ObjectId
        
        access_perms = list(access_collection.find({'client_id': client_id}))
        result = []
        
        for perm in access_perms:
            # Get user details
            user = users_collection.find_one({'_id': ObjectId(perm['viewer_user_id'])})
            viewer_name = user['name'] if user else 'Unknown User'
            viewer_email = user['email'] if user else 'unknown@email.com'
            
            result.append({
                'id': str(perm['_id']),
                'client_id': perm['client_id'],
                'viewer_user_id': perm['viewer_user_id'],
                'viewer_name': viewer_name,
                'viewer_email': viewer_email,
                'can_view': perm.get('can_view', True),
                'can_comment': perm.get('can_comment', True),
                'can_approve': perm.get('can_approve', False),
                'created_at': perm['created_at'].isoformat() if perm.get('created_at') else None
            })
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Get client access error: {e}")
        return jsonify({'error': 'Failed to fetch client access permissions'}), 500

@app.route('/api/clients/<string:client_id>/access', methods=['POST'])
def add_client_access(client_id):
    """Add access permission for a user to view this client's content - MongoDB implementation."""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
            
        # Check if client exists
        clients_collection = mongo.get_collection('clients')
        from bson import ObjectId
        client = clients_collection.find_one({'_id': ObjectId(client_id)})
        if not client:
            return jsonify({'error': 'Client not found'}), 404
            
        # Check if user exists
        users_collection = mongo.get_collection('users')
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Check if access already exists
        access_collection = mongo.get_collection('client_access')
        existing = access_collection.find_one({'client_id': client_id, 'viewer_user_id': user_id})
        if existing:
            return jsonify({'error': 'Access already exists for this user and client'}), 400

        access_doc = {
            'client_id': client_id,
            'viewer_user_id': user_id,
            'can_view': data.get('can_view', True),
            'can_comment': data.get('can_comment', True),
            'can_approve': data.get('can_approve', False),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = access_collection.insert_one(access_doc)
        access_doc['_id'] = result.inserted_id
        
        return jsonify({
            'id': str(access_doc['_id']),
            'client_id': access_doc['client_id'],
            'viewer_user_id': access_doc['viewer_user_id'],
            'can_view': access_doc['can_view'],
            'can_comment': access_doc['can_comment'],
            'can_approve': access_doc['can_approve'],
            'created_at': access_doc['created_at'].isoformat(),
            'updated_at': access_doc['updated_at'].isoformat()
        }), 201
        
    except Exception as e:
        print(f"Add client access error: {e}")
        return jsonify({'error': 'Failed to add client access permission'}), 500

@app.route('/api/clients/<string:client_id>/access/<string:access_id>', methods=['PUT'])
def update_client_access(client_id, access_id):
    """Update access permission for a user - MongoDB implementation."""
    try:
        data = request.get_json() or {}
        access_collection = mongo.get_collection('client_access')
        from bson import ObjectId
        
        access = access_collection.find_one({'_id': ObjectId(access_id), 'client_id': client_id})
        if not access:
            return jsonify({'error': 'Access permission not found'}), 404
            
        # Update permissions
        update_data = {}
        if 'can_view' in data:
            update_data['can_view'] = data['can_view']
        if 'can_comment' in data:
            update_data['can_comment'] = data['can_comment']
        if 'can_approve' in data:
            update_data['can_approve'] = data['can_approve']
        
        update_data['updated_at'] = datetime.utcnow()
            
        access_collection.update_one({'_id': ObjectId(access_id)}, {'$set': update_data})
        
        # Get updated access
        updated_access = access_collection.find_one({'_id': ObjectId(access_id)})
        
        return jsonify({
            'id': str(updated_access['_id']),
            'client_id': updated_access['client_id'],
            'viewer_user_id': updated_access['viewer_user_id'],
            'can_view': updated_access.get('can_view', True),
            'can_comment': updated_access.get('can_comment', True),
            'can_approve': updated_access.get('can_approve', False),
            'updated_at': updated_access['updated_at'].isoformat()
        })
        
    except Exception as e:
        print(f"Update client access error: {e}")
        return jsonify({'error': 'Failed to update client access permission'}), 500

@app.route('/api/clients/<string:client_id>/access/<string:access_id>', methods=['DELETE'])
def delete_client_access(client_id, access_id):
    """Remove access permission for a user - MongoDB implementation."""
    try:
        access_collection = mongo.get_collection('client_access')
        from bson import ObjectId
        
        access = access_collection.find_one({'_id': ObjectId(access_id), 'client_id': client_id})
        if not access:
            return jsonify({'error': 'Access permission not found'}), 404
            
        access_collection.delete_one({'_id': ObjectId(access_id)})
        
        return jsonify({'message': 'Client access permission removed successfully'})
        
    except Exception as e:
        print(f"Delete client access error: {e}")
        return jsonify({'error': 'Failed to remove client access permission'}), 500

# ─── Content Calendar Endpoints ────────────────────────────────────────────────

@app.route('/api/clients/<client_id>/content-calendar', methods=['GET'])
def get_content_calendar(client_id):
    """Get content calendar for a client."""
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
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch content calendar'}), 500

@app.route('/api/clients/<client_id>/content-calendar', methods=['POST'])
def create_content_calendar_entry(client_id):
    """Create a new content calendar entry."""
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
            created_by=data.get('user_id', '1'),
            client_feedback=data.get('clientFeedback', ''),
            approval_status=data.get('approvalStatus', 'pending'),
            files=data.get('files', [])
        )
        return jsonify({'id': str(entry['_id']), 'message': 'Content calendar entry created successfully'}), 201
    except Exception as e:
        print(f"[ERROR] Failed to create content calendar entry: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to create content calendar entry: {str(e)}'}), 500

@app.route('/api/content-calendar/<entry_id>', methods=['PUT'])
def update_content_calendar_entry(entry_id):
    """Update a content calendar entry."""
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
        traceback.print_exc()
        return jsonify({'error': 'Failed to update content calendar entry'}), 500

@app.route('/api/content-calendar/<entry_id>', methods=['DELETE'])
def delete_content_calendar_entry(entry_id):
    """Delete a content calendar entry."""
    try:
        MongoContentCalendar.delete_entry(entry_id)
        return jsonify({'message': 'Content calendar entry deleted successfully'})
    except Exception as e:
        print(f"Delete content calendar error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to delete content calendar entry'}), 500

@app.route('/api/ai/generate-content', methods=['POST'])
def generate_content():
    """Generate a 30-day social media content calendar."""
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

    openai_api_key = os.getenv('OPENAI_API_KEY')
    try:
        print(f"=== AI Content Generation Debug ===")
        print(f"API Key present: {bool(openai_api_key)}")
        print(f"Received {len(answers)} answers")
        
        # Use the newer OpenAI client syntax
        from openai import OpenAI
        client = OpenAI(api_key=openai_api_key)
        
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
        traceback.print_exc()
        return jsonify({"error": f"Generation failed: {str(e)}"}), 500

@app.route('/api/generate-content', methods=['POST'])
def generate_content_simple():
    """Generate content based on structured prompt."""
    try:
        data = request.get_json() or {}
        prompt = data.get('prompt', 'Generate engaging social media content')
        content_type = data.get('content_type', 'social_media_posts')
        platform = data.get('platform', 'Instagram')
        tone = data.get('tone', 'professional')
        client_id = data.get('client_id')
        user_id = data.get('user_id')
        
        # Check if OpenAI API key is available
        api_key = os.getenv('OPENAI_API_KEY')
        
        if api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                
                clean_prompt = prompt
                content_goal = ""
                target_audience = ""
                brand_voice = ""
                
                # Extract additional context if provided
                if " | Target audience:" in clean_prompt:
                    parts = clean_prompt.split(" | Target audience:")
                    clean_prompt = parts[0].strip()
                    remaining = parts[1]
                    if " | Goal:" in remaining:
                        target_parts = remaining.split(" | Goal:")
                        target_audience = target_parts[0].strip()
                        remaining = target_parts[1]
                    else:
                        target_audience = remaining.split(" | Brand voice:")[0].strip() if " | Brand voice:" in remaining else remaining.strip()
                
                if " | Goal:" in prompt:
                    goal_part = prompt.split(" | Goal:")[1]
                    content_goal = goal_part.split(" | Brand voice:")[0].strip() if " | Brand voice:" in goal_part else goal_part.strip()
                
                if " | Brand voice:" in prompt:
                    brand_voice = prompt.split(" | Brand voice:")[1].strip()
                
                enhanced_prompt = f"""
                You are a professional social media content creator and copywriter. Create exactly 3 engaging {platform} posts.

                Topic/Brief: {clean_prompt}
                Platform: {platform}  
                Tone: {tone}
                Target Audience: {target_audience}
                Goal: {content_goal}
                Brand Voice: {brand_voice}

                Requirements:
                - Create 3 distinct, high-quality posts that are ready to publish
                - Each post should feel authentic and engaging, not robotic
                - Include relevant hashtags (3-7 per post, mix of popular and niche)
                - Add appropriate emojis sparingly and strategically
                - Keep posts platform-appropriate length ({platform} best practices)
                - Use compelling hooks and clear call-to-actions
                - Make each post unique in approach (different angles/perspectives)
                - Focus on value, engagement, and brand voice
                - Avoid overly promotional language unless specifically requested
                
                Platform-specific guidelines:
                - Instagram: Visual storytelling, lifestyle focus, 2200 char limit
                - Facebook: Community building, longer form acceptable
                - Twitter: Concise, trending topics, 280 char limit
                - LinkedIn: Professional insights, thought leadership
                - TikTok: Trendy, casual, video-focused language
                """
                
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": enhanced_prompt}],
                    max_tokens=1000,
                    temperature=0.7
                )
                
                content = response.choices[0].message.content
                return jsonify({"content": content})
            except Exception as e:
                print(f"OpenAI API error: {e}")
                return jsonify({'error': f'Failed to generate content: {str(e)}'}), 500
        else:
            return jsonify({'error': 'OpenAI API key not configured'}), 500
    except Exception as e:
        print(f"Generate content error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to generate content'}), 500

@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    """Upload a file and return file info."""
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
            traceback.print_exc()
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
        traceback.print_exc()
        return jsonify({'error': f'Failed to upload file: {str(e)}'}), 500

@app.route('/api/files/<filename>')
def serve_file(filename):
    """Serve uploaded files."""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        print(f"[DEBUG] Attempting to serve file: {file_path}")
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        print(f"File serve error: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': f'File not found or error: {str(e)}'}), 500

@app.route('/api/channels', methods=['GET'])
def get_channels():
    """Get channels for a user."""
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
    """Create or get a channel."""
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

@app.route('/api/channels/<string:channel_id>/messages', methods=['GET'])
def get_channel_messages(channel_id):
    """Get messages for a channel."""
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
    """Return members of a channel (for chat UI)."""
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
            # Process member data here if needed
            member_objs.append(m)
        return jsonify(member_objs)
    except Exception as e:
        print(f"Error in get_channel_members: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch channel members'}), 500

@app.route('/api/test-channel-read', methods=['POST', 'GET'])
def test_channel_read():
    """Test route to debug channel read issue."""
    return jsonify({'message': 'Test channel read endpoint works!'})

@app.route('/api/channels/<channel_id>/read', methods=['POST', 'OPTIONS'])
def mark_channel_read(channel_id):
    """Mark a channel as read for the current user."""
    print(f"DEBUG: mark_channel_read called with channel_id={channel_id}")
    if request.method == 'OPTIONS':
        return '', 200
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # For now, just return success since we don't have a read status tracking system
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error in mark_channel_read: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to mark channel as read'}), 500

@app.route('/api/meetings', methods=['GET', 'POST'])
def handle_meetings():
    """Handle fetching and scheduling meetings."""
    print(f"DEBUG: handle_meetings called with method: {request.method}")
    try:
        if request.method == 'GET':
            user_id = request.args.get('user_id')
            print(f"DEBUG: Meetings GET request with user_id={user_id}")
            
            if user_id:
                print(f"DEBUG: Filtering meetings for user_id={user_id}")
                meetings = MongoMeeting.find_by_user(user_id)
            else:
                print(f"DEBUG: Getting all meetings")
                meetings = MongoMeeting.find_all()
            
            # Convert ObjectId to string for JSON serialization
            for meeting in meetings:
                meeting['_id'] = str(meeting['_id'])
                if 'organizer_id' in meeting:
                    meeting['organizer_id'] = str(meeting['organizer_id'])
                if 'invitee_ids' in meeting:
                    meeting['invitee_ids'] = [str(id) for id in meeting['invitee_ids']]
            
            return jsonify(meetings)
        
        elif request.method == 'POST':
            data = request.get_json()
            title = data.get('title')
            reason = data.get('reason') or data.get('description', '')
            date = data.get('date')
            start_time = data.get('start_time')
            end_time = data.get('end_time')
            organizer_id = data.get('organizer_id')
            participants = data.get('participants', [])

            if not all([title, start_time, end_time, organizer_id]):
                print("DEBUG: Missing required fields")
                return jsonify({'error': 'Title, start_time, end_time, and organizer_id are required'}), 400

            from datetime import datetime, date as date_module
            if not date:
                date = date_module.today().isoformat()
            
            print(f"DEBUG: Before time parsing - date={date}, start_time={start_time}, end_time={end_time}")
            
            def format_datetime_string(date_str, time_str):
                """Convert date string and time string to full datetime string."""
                if ':' in time_str and len(time_str) <= 5:
                    return f"{date_str}T{time_str}:00"
                return time_str
            
            formatted_start_time = format_datetime_string(date, start_time)
            formatted_end_time = format_datetime_string(date, end_time)
            
            print(f"DEBUG: After formatting - start_time={formatted_start_time}, end_time={formatted_end_time}")
            
            print(f"DEBUG: About to call MongoMeeting.create_meeting")
            print(f"DEBUG: Meeting creation - title={title}, reason={reason}, date={date}, start_time={formatted_start_time}, end_time={formatted_end_time}, organizer_id={organizer_id}, participants={participants}")

            try:
                meeting_doc = MongoMeeting.create_meeting(
                    title,
                    reason,
                    date,
                    formatted_start_time,
                    formatted_end_time,
                    organizer_id,
                    participants
                )
                print(f"DEBUG: Meeting created successfully")
            except Exception as create_error:
                print(f"DEBUG: Error during meeting creation: {create_error}")
                traceback.print_exc()
                raise create_error
            
            print(f"DEBUG: Meeting created, processing participants")

            for participant in participants:
                if participant == organizer_id:
                    continue
                member_ids = sorted([str(organizer_id), str(participant)])
                dm_name = "DM"
                dm_channel = MongoChannel.find_by_members(dm_name, True, member_ids)
                if not dm_channel:
                    dm_channel = MongoChannel.create_channel(dm_name, True, member_ids, organizer_id)
                
                channel_id = dm_channel.get('_id')
                               # Send notification message about meeting invitation
                MongoMessage.create_message(
                    channel_id=channel_id,
                    user_id='system',
                    content=f'You have been invited to a meeting: "{title}" from {start_time} to {end_time}.',
                    name='System',
                    parent_message_id=None
                )

            return jsonify({
                'message': 'Meeting scheduled successfully',
                'meeting': {
                    'id': str(meeting_doc['_id']),
                    'title': meeting_doc['title'],
                    'description': meeting_doc.get('reason', '') or meeting_doc.get('description', ''),
                    'start_time': str(meeting_doc['start_time']),
                    'end_time': str(meeting_doc['end_time']),
                    'participants': meeting_doc.get('invitee_ids', []) or meeting_doc.get('participants', [])
                }
            }), 201
            
    except Exception as e:
        print(f"Meeting error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to handle meetings'}), 500

@app.route('/api/meetings/delete_all', methods=['POST'])
def delete_all_meetings():
    """Delete all meetings."""
    try:
        deleted = MongoMeeting.delete_all()
        return jsonify({'deleted': deleted, 'message': 'All meetings deleted.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/meetings/list_all', methods=['GET'])
def list_all_meetings():
    """List all meetings."""
    try:
        meetings = MongoMeeting.find_all()
        return jsonify({'meetings': [str(m['_id']) for m in meetings], 'count': len(meetings)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai-assistant', methods=['POST'])
def ai_assistant():
    """Comprehensive AI marketing assistant endpoint."""
    try:
        data = request.get_json() or {}
        message = data.get('message', '')
        user_id = data.get('user_id')
        context = data.get('context', 'general')
        
        if not message.strip():
            return jsonify({'error': 'Message is required'}), 400
        
        api_key = os.getenv('OPENAI_API_KEY')
        
        if api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                
                system_prompt = f"""
                You are an expert AI Marketing Assistant with deep knowledge across all areas of digital marketing, business strategy, content creation, and data analysis. You help users with:

                1. CONTENT CREATION: Social media posts, blog articles, email campaigns, ad copy, video scripts

                2. STRATEGY PLANNING: Marketing strategies, campaign planning, content calendars, growth tactics
                3. DATA ANALYSIS: Campaign performance, customer insights, market trends, ROI optimization
                4. AUTOMATION: Workflow setup, lead nurturing, email sequences, social media scheduling
                5. OPTIMIZATION: Conversion rate optimization, A/B testing, performance improvement
                6. RESEARCH: Competitor analysis, market research, audience targeting, trend identification

                Context: {context}
                User message: {message}

                Provide helpful, actionable, and specific advice. If the user asks for content creation, provide complete, ready-to-use examples. If they ask for strategy, give step-by-step plans. If they ask for analysis, provide detailed insights and recommendations.

                Keep responses conversational, professional, and practical. Always aim to provide immediate value.
                """
                
                print("Making OpenAI API call for AI assistant...")
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    max_tokens=1000,
                    temperature=0.7
                )
                
                ai_response = response.choices[0].message.content
                print(f"Generated AI assistant response successfully!")
                
                suggested_actions = []
                if any(word in message.lower() for word in ['create', 'write', 'generate']):
                    suggested_actions.append({'type': 'content', 'label': 'Create More Content'})
                if any(word in message.lower() for word in ['analyze', 'performance', 'metrics']):
                    suggested_actions.append({'type': 'analysis', 'label': 'Deep Dive Analysis'})
                if any(word in message.lower() for word in ['strategy', 'plan', 'campaign']):
                    suggested_actions.append({'type': 'strategy', 'label': 'Build Strategy'})
                
                return jsonify({
                    "response": ai_response,
                    "suggested_actions": suggested_actions,
                    "success": True
                })
                
            except Exception as openai_error:
                print(f"OpenAI API error: {openai_error}")
                return generate_mock_ai_response(message, context)
        else:
            print("No OpenAI API key found, using mock AI responses")
            return generate_mock_ai_response(message, context)
        
    except Exception as e:
        print(f"[AI ASSISTANT ERROR] {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"AI assistant failed: {str(e)}"}), 500

def generate_mock_ai_response(message, context):
    """Generate helpful mock responses when OpenAI is unavailable."""
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['social', 'post', 'content', 'create', 'write']):
        response = """I would be happy to help you create engaging content! Here are some approaches:

**Social Media Posts:**
- Hook + Value + Call-to-action format
- Use storytelling to connect emotionally
- Include relevant hashtags and emojis
- Keep platform-specific character limits in mind

**Content Ideas:**
- Behind-the-scenes content
- User-generated content campaigns
- Educational tips and tutorials
- Industry insights and trends

**Best Practices:**
- Know your audience deeply
- Maintain consistent brand voice
- Use high-quality visuals
- Post at optimal times for your audience

Would you like me to help you create specific content for a particular platform or topic?"""
        
        suggested_actions = [
            {'type': 'content', 'label': 'Create Specific Content'},
            {'type': 'strategy', 'label': 'Content Strategy'},
            {'type': 'analysis', 'label': 'Content Performance'}
        ]
    
    elif any(word in message_lower for word in ['analytics', 'performance', 'metrics', 'analyze', 'data']):
        response = """I can help you analyze and optimize your marketing performance! Here is what to focus on:

**Key Metrics to Track:**
- Engagement rate (likes, comments, shares)
- Reach and impressions
- Click-through rates (CTR)
- Conversion rates
- Return on ad spend (ROAS)

**Analysis Framework:**
1. Set clear KPIs aligned with business goals
2. Track metrics consistently over time
3. Compare performance across channels
4. Identify top-performing content types
5. Understand audience behavior patterns

**Optimization Tips:**
- A/B test different content formats
- Optimize posting times based on audience activity
- Refine targeting based on performance data
- Double down on what works, eliminate what does not work

What specific metrics or campaigns would you like me to help you analyze?"""
        
        suggested_actions = [
            {'type': 'analysis', 'label': 'Deep Dive Analysis'},
            {'type': 'optimization', 'label': 'Optimization Plan'},
            {'type': 'strategy', 'label': 'Performance Strategy'}
        ]
    
    elif any(word in message_lower for word in ['strategy', 'plan', 'campaign']):
        response = """Let us work on your strategy! Here are some key elements to consider: Strategy Components - Clear, measurable objectives, Target audience definition, Key messages and value propositions, Tactical initiatives and action plans, Budget and resource allocation, Timeline and milestones, KPIs and performance metrics. Which area would you like to focus on first: content creation, strategy planning, or data analysis?"""
        
        suggested_actions = [
            {'type': 'strategy', 'label': 'Strategy Planning'},
            {'type': 'content', 'label': 'Content Creation'},
            {'type': 'analysis', 'label': 'Performance Analysis'}
        ]
    
    else:
        response = """I'm here to help with any marketing-related questions or tasks you have. Whether it's content creation, strategy planning, or data analysis, just let me know what you need assistance with.

        Here are some examples of what I can help with:
        - Creating engaging social media content
        - Developing a comprehensive marketing strategy
        - Analyzing campaign performance data
        - Automating repetitive marketing tasks
        - Optimizing content for SEO
        - Conducting market research and competitor analysis

        Just provide some details on what you're looking to achieve, and I'll guide you through it."""
        suggested_actions = [
            {'type': 'content', 'label': 'Content Ideas'},
            {'type': 'strategy', 'label': 'Marketing Strategy'},
            {'type': 'analysis', 'label': 'Campaign Analysis'}
        ]
    
    return jsonify({
        "response": response,
        "suggested_actions": suggested_actions,
        "success": True
    })

@app.route('/api/tiktok/analyze', methods=['GET'])
def tiktok_analyze():
    """Handle TikTok OAuth callback and provide analysis."""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        
        if not code:
            return jsonify({'error': 'Missing TikTok authorization code'}), 400
        
        analysis = {
            'account': 'Demo TikTok Account',
            'followers': 12345,
            'avg_views': 6789,
 'top_video': 'How to go viral on TikTok',
            'engagement_rate': '5.2%',
            'recent_growth': '+12% last 30 days',
            'connection_status': 'connected',
            'connected_at': datetime.now().isoformat(),
            'raw_code': code,
            'raw_state': state
        }
        
        return jsonify(analysis)
    except Exception as e:

        return jsonify({'error': 'Failed to analyze TikTok data'}), 500

# AI Brains System Endpoints - MOVED TO brain_management.py
# The following endpoints have been moved to a dedicated brain management module
# for better organization and comprehensive functionality
# AI Brains System Endpoints - MOVED TO brain_management.py
# The following endpoints have been moved to a dedicated brain management module
# for better organization and comprehensive functionality

"""
DEPRECATED - Brain endpoints moved to brain_management.py
These endpoints are commented out to avoid conflicts with the new comprehensive brain system.

@app.route('/api/brains', methods=['GET'])
@require_auth
def get_brains():
    # ... (moved to brain_management.py)

@app.route('/api/brains', methods=['POST'])
def create_brain():
    # ... (moved to brain_management.py)

@app.route('/api/brains/<brain_id>', methods=['PUT'])
def update_brain(brain_id):
    # ... (moved to brain_management.py)

@app.route('/api/brains/<brain_id>', methods=['DELETE'])
def delete_brain(brain_id):
    # ... (moved to brain_management.py)

@app.route('/api/brains/<brain_id>/chat', methods=['POST'])
def chat_with_brain(brain_id):
    # ... (moved to brain_management.py)

@app.route('/api/brains/<brain_id>/upload', methods=['POST'])
def upload_brain_document(brain_id):
    # ... (moved to brain_management.py)
"""

# Activity Logs Endpoints
@app.route('/api/logs', methods=['GET'])
def get_activity_logs():
    """Get activity logs."""
    try:
        try:
            if mongo and hasattr(mongo, 'db') and mongo.db is not None:
                logs = list(mongo.db.activity_logs.find().sort('timestamp', -1).limit(1000))
                for log in logs:
                    log['_id'] = str(log['_id'])
                    if 'timestamp' in log:
                        log['timestamp'] = log['timestamp'].isoformat() if hasattr(log['timestamp'], 'isoformat') else str(log['timestamp'])
                return jsonify(logs)
        except Exception as db_error:
            print(f"Database error in logs: {db_error}")
            
        # Return sample logs if no database
        sample_logs = [
            {
                "_id": "log1",
                "user": "Admin",
                "action": "User Login",
                "type": "auth",
                "details": "Successful login from IP 192.168.1.1",
                "timestamp": "2025-07-24T09:30:00.000000"
            },
            {
                "_id": "log2",
                "user": "John Doe",
                "action": "Created AI Brain",
                "type": "user_action",
                "details": "Created new AI brain 'Customer Support Assistant'",
                "timestamp": "2025-07-24T09:25:00.000000"
            },
            {
                "_id": "log3",
                "user": "System",
                "action": "API Call",
                "type": "api",
                "details": "GET /api/brains - 200 OK",
                "timestamp": "2025-07-24T09:20:00.000000"
            },
            {
                "_id": "log4",
                "user": "Jane Smith",
                "action": "Document Upload",
                "type": "user_action",
                "details": "Uploaded document 'product_specs.pdf' to Marketing Assistant brain",
                "timestamp": "2025-07-24T09:15:00.000000"
            },
            {
                "_id": "log5",
                "user": "System",
                "action": "Database Backup",
                "type": "system",
                "details": "Automated database backup completed successfully",
                "timestamp": "2025-07-24T09:00:00.000000"
            }
        ]
        return jsonify(sample_logs)
    except Exception as e:
        print(f"Error getting logs: {e}")
        return jsonify({'error': 'Failed to get logs'}), 500

# Add logs endpoint
@app.route('/api/logs', methods=['GET'])
@require_auth
def get_logs():
    try:
        if use_mongodb and mongo.db:
            logs = mongo.db.logs.find({}).sort('timestamp', -1)
            log_list = list(logs)
            
            # Convert ObjectId to string for JSON serialization
            for log in log_list:
                log['_id'] = str(log['_id'])
            
            return jsonify(log_list)
        else:
            # Return sample data if MongoDB is not available
            sample_logs = [
                {
                    "_id": "1",
                    "type": "auth",
                    "user": "admin@example.com",
                    "action": "User Login",
                    "details": "Successful login from IP 192.168.1.1",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "_id": "2",
                    "type": "api",
                    "user": "admin@example.com",
                    "action": "API Request",
                    "details": "GET /api/brains - 200 OK",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "_id": "3",
                    "type": "user_action",
                    "user": "user@example.com",
                    "action": "Brain Created",
                    "details": "Created new AI brain: General Assistant",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "_id": "4",
                    "type": "system",
                    "user": "system",
                    "action": "System Update",
                    "details": "Database backup completed successfully",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "_id": "5",
                    "type": "error",
                    "user": "system",
                    "action": "Error",
                    "details": "Failed to connect to external service",
                    "timestamp": datetime.now().isoformat()
                }
            ]
            return jsonify(sample_logs)
            
    except Exception as e:
        print(f"Error getting logs: {e}")
        return jsonify({'error': 'Failed to get logs'}), 500

# Add a simple test endpoint for debugging
@app.route('/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint to verify the backend is working."""
    try:
        mongodb_status = "connected" if mongo.db is not None else "not connected"
    except:
        mongodb_status = "connection error"
    
    return jsonify({
        'status': 'success',
        'message': 'Backend is working!',
        'environment': os.environ.get('FLASK_ENV', 'development'),
        'mongodb_status': mongodb_status,
        'has_mongodb_uri': bool(os.getenv('MONGODB_URI'))
    })

# ─── Debug and status endpoints for LAN troubleshooting ────────────────────────
@app.route('/api/debug/status', methods=['GET'])
def debug_status():
    """Debug endpoint to check database connectivity and brain visibility"""
    try:
        # Get local IP
        import socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Check MongoDB connection
        mongo_status = "disconnected"
        brain_count = 0
        sample_brains = []
        
        try:
            if mongo and mongo.db:
                # Test connection with a simple operation
                mongo.db.admin.command('ping')
                mongo_status = "connected"
                
                # Count brains
                brains_collection = mongo.get_collection('brains')
                brain_count = brains_collection.count_documents({})
                
                # Get sample brains
                sample_brains = list(brains_collection.find({}, {'name': 1, '_id': 1}).limit(3))
                for brain in sample_brains:
                    brain['_id'] = str(brain['_id'])
        except Exception as e:
            mongo_status = f"error: {str(e)}"
        
        # Environment info
        env_info = {
            'mongodb_uri_configured': bool(os.getenv('MONGODB_URI')),
            'cors_origins': os.getenv('CORS_ORIGINS', 'not_set'),
            'port': os.getenv('PORT', '5000'),
            'debug_mode': os.getenv('DEBUG', 'false')
        }
        
        return jsonify({
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'server': {
                'hostname': hostname,
                'local_ip': local_ip,
                'port': os.getenv('PORT', '5000')
            },
            'database': {
                'status': mongo_status,
                'brain_count': brain_count,
                'sample_brains': sample_brains
            },
            'environment': env_info,
            'diagnosis': {
                'message': 'If brains are not visible across LAN, ensure all devices use the same MongoDB URI and can access this backend server',
                'access_urls': [
                    f"http://{local_ip}:{os.getenv('PORT', '5000')}/api/brains"
                ]
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Debug endpoint failed'
        }), 500

@app.route('/api/debug/brains', methods=['GET'])
def debug_brains():
    """Debug endpoint specifically for brain visibility"""
    try:
        # Force reconnection if needed
        if not mongo.db:
            mongodb_uri = os.getenv('MONGODB_URI')
            if mongodb_uri:
                mongo.connect(mongodb_uri)
        
        if not mongo.db:
            return jsonify({
                'success': False,
                'error': 'MongoDB not connected',
                'message': 'Database connection required for brain visibility'
            }), 500
        
        # Get all brains with details
        brains_collection = mongo.get_collection('brains')
        brains = list(brains_collection.find({}))
        for brain in brains:
            brain['_id'] = str(brain['_id'])
            
        return jsonify({
            'success': True,
            'brain_count': len(brains),
            'brains': brains,
            'database_info': {
                'connected': True,
                'collection': 'brains'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to fetch brains for debugging'
        }), 500

# ─── LAN Debug Endpoints for Cross-Device Troubleshooting ───────────────────

@app.route('/api/debug/lan-connectivity', methods=['GET'])
def debug_lan_connectivity():
    """Debug endpoint to check LAN connectivity and brain visibility"""
    try:
        import socket
        import subprocess
        
        # Get local IP
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Check MongoDB connection
        mongo_status = "Connected" if mongo.db else "Disconnected"
        mongo_uri = os.getenv('MONGODB_URI', 'Not set')
        
        # Get brain count from database
        brain_count = 0
        brains_sample = []
        if mongo.db:
            try:
                brains_collection = mongo.get_collection('brains')
                brain_count = brains_collection.count_documents({})
                brains_sample = list(brains_collection.find({}, {'name': 1, 'created_at': 1}).limit(3))
                for brain in brains_sample:
                    brain['_id'] = str(brain['_id'])
            except Exception as e:
                brains_sample = [{'error': str(e)}]
        
        # Network info
        network_info = {
            'hostname': hostname,
            'local_ip': local_ip,
            'server_port': os.getenv('PORT', 10000),
            'accessible_urls': [
                f"http://{local_ip}:{os.getenv('PORT', 10000)}"
            ]
        }
        
        return jsonify({
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'network_info': network_info,
            'database_info': {
                'mongodb_connected': bool(mongo.db),
                'brains_sample': brains_sample
            },
            'message': 'LAN connectivity debug information'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'LAN connectivity debug failed'
        }), 500

# Network connectivity test endpoint
@app.route('/network-test', methods=['GET'])
def network_test():
    """Simple network connectivity test for LAN devices"""
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    return jsonify({
        'success': True,
        'message': 'Network test successful - LAN access is working!',
        'server_info': {
            'hostname': hostname,
            'server_ip': local_ip,
            'client_ip': request.remote_addr,
            'timestamp': datetime.now().isoformat(),
            'user_agent': request.headers.get('User-Agent', 'Unknown')
        },
        'test_endpoints': {
            'agents': f'http://192.168.100.63:10000/api/brains/68824a796a891c1979852a61/agents',
            'brains': f'http://192.168.100.63:10000/api/brains',
            'health': f'http://192.168.100.63:10000/health'
        }
    })

# ─── Main Application Entry Point ──────────────────────────────────────────

if __name__ == '__main__':
    print("[FLASK] Starting Genius Project Backend...")
    
    # Get port from environment or use default 10000
    port = int(os.getenv('PORT', 10000))
    print(f"[FLASK] Starting on port {port}")
    print(f"[FLASK] Binding to ALL interfaces (0.0.0.0:{port})")
    print(f"[FLASK] LAN Access URL: http://192.168.100.63:{port}")

# ─── Authentication Routes ──────────────────────────────────────────────────────────
@app.route('/api/users/current', methods=['GET'])
def get_current_user():
    """Get current user from session or return anonymous user for marketing lab."""
    try:
        from flask import session
        user = session.get('user')
        if user:
            return jsonify(user)
        else:
            # Return anonymous user for marketing lab access
            anonymous_user = {
                'id': 'anonymous',
                'name': 'Marketing Lab User',
                'email': 'anonymous@marketing-lab.local',
                'userType': 'guest',
                'role': 'guest',
                'department': 'Marketing Lab',
                'is_admin': False,
                'needs_password_reset': False,
                'is_anonymous': True
            }
            return jsonify(anonymous_user)
    except Exception as e:
        print(f"[ERROR] Get current user error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/logout', methods=['POST'])
def logout():
    """Handle user logout."""
    try:
        from flask import session
        session.clear()
        return jsonify({'message': 'Logout successful'})
    except Exception as e:
        print(f"[ERROR] Logout error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True, use_reloader=False)