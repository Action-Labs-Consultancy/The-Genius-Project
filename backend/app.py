# This file is the main backend adapter and API entry point.
# All reusable business logic should be in /core/business_logic.py or /core/models.py.
# All plugin logic should be in /backend/plugins.

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
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
from sqlalchemy import or_, and_
from flask_migrate import Migrate

from core.models import (
    db, User, Player, Project, Task, Client, Card, AccessRequest, Channel, ChannelMember,
    Message, ChannelRead, Meeting, StandupTask, ClientAccess, ContentCalendar, ContentFile, ContentFeedback
)
from core.business_logic import (
    get_access_requests_logic,
    approve_access_request_logic,
    set_password_logic,
    request_access_logic,
    forgot_password_logic,
    get_players_logic,
    add_user_logic,
    update_user_logic,
    delete_user_logic,
    get_accessible_clients_logic,
    # ...other business logic functions...
)
from plugins.openai.openai_plugin import OpenAIPlugin
from plugins.pinecone.pinecone_plugin import initialize_pinecone
from plugins.revive.revive_plugin import get_revive_stats, create_campaign, create_banner

# ─── Load env & set keys ───────────────────────────────────────────────────────
load_dotenv()  # must come before os.getenv
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client
client = openai.OpenAI(api_key=openai.api_key)

# ─── Embedding helper ──────────────────────────────────────────────────────────
def get_embedding(text: str) -> list[float]:
    """Call OpenAI to turn `text` into a 1536-dim vector."""
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

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

# Use DATABASE_URL for PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db.init_app(app)
migrate = Migrate(app, db)

# Print the database URI for debugging (mask password)
db_uri = os.environ.get('DATABASE_URL') or app.config.get('SQLALCHEMY_DATABASE_URI')
if db_uri:
    if db_uri.startswith('sqlite:///'):
        safe_db_uri = db_uri
    elif '://' in db_uri:
        try:
            safe_db_uri = db_uri.replace(db_uri.split(':')[2].split('@')[0], '***')
        except Exception:
            safe_db_uri = db_uri
    else:
        safe_db_uri = db_uri
    print(f"[DEBUG] SQLAlchemy connecting to: {safe_db_uri}")

# ─── Pinecone setup ────────────────────────────────────────────────────────────
try:
    pinecone_index = initialize_pinecone()
except Exception as e:
    print(f"Pinecone initialization failed: {e}")
    exit(1)

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret')
serializer = URLSafeTimedSerializer(SECRET_KEY)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# ─── Background Tasks ──────────────────────────────────────────────────────────
import threading
import time

def emit_revive_stats_periodically():
    last_stats = None
    while True:
        try:
            stats = get_revive_stats()
            if stats != last_stats:
                socketio.emit('revive_stats', stats)  # Removed broadcast=True
                last_stats = stats
        except Exception as e:
            print(f"[Revive Integration] Error fetching or emitting stats: {e}")
        time.sleep(5)  # Check every 5 seconds

# Start background thread after app and socketio are ready
threading.Thread(target=emit_revive_stats_periodically, daemon=True).start()

# --- MANUAL DB PATCH: Ensure StandupTask table has all required columns ---
# This is a fallback for environments where Alembic is not available.
# It will attempt to add missing columns at runtime (for dev only).
from sqlalchemy import text
with app.app_context():
    try:
        # Add columns if they do not exist, one at a time, rolling back on error
        with db.engine.begin() as conn:
            for col, coltype in [
                ("user_id", "INTEGER"),
                ("client", "VARCHAR(128)"),
                ("day", "VARCHAR(32)"),
                ("start_time", "VARCHAR(8)"),
                ("end_time", "VARCHAR(8)"),
                ("task", "VARCHAR(256)"),
                ("status", "VARCHAR(32)"),
                ("notes", "TEXT"),
                ("blocker", "BOOLEAN"),
                ("color", "VARCHAR(16)")
            ]:
                try:
                    conn.execute(text(f'ALTER TABLE standup_task ADD COLUMN IF NOT EXISTS {col} {coltype}'))
                except Exception as e:
                    if 'duplicate column' in str(e) or 'already exists' in str(e):
                        pass  # Already exists
                    else:
                        print(f"[DB PATCH] Could not add column {col}: {e}")
    except Exception as e:
        print(f"[DB PATCH] StandupTask patch failed: {e}")

# ─── Routes ────────────────────────────────────────────────────────────────────
@app.route('/api/access-requests', methods=['GET'])
def get_access_requests():
    return jsonify(get_access_requests_logic())

@app.route('/api/access-requests/<int:req_id>/approve', methods=['POST'])
def approve_access_request(req_id):
    data = request.get_json() or {}
    result = approve_access_request_logic(req_id, data, bcrypt, db, User, AccessRequest, serializer, os, smtplib, MIMEText)
    return jsonify(result)

@app.route('/set-password', methods=['POST'])
def set_password():
    data = request.get_json() or {}
    token = data.get('token')
    password = data.get('password')
    result = set_password_logic(token, password, serializer, db, User, bcrypt)
    return jsonify(result)

@app.route('/request-access', methods=['POST'])
def request_access():
    try:
        data = request.get_json() or {}
        result = request_access_logic(data, db, AccessRequest)
        return jsonify(result), 200
    except Exception as e:
        print("Error in /request-access:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    result = forgot_password_logic(data, db, User, bcrypt, smtplib, MIMEText, os)
    return jsonify(result)

@app.route('/players', methods=['GET'])
def get_players():
    return jsonify(get_players_logic(Player))

@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.get_json() or {}
    result, status = add_user_logic(data, db, User, bcrypt)
    return jsonify(result), status

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users, optionally filtered by role"""
    try:
        role = request.args.get('role')
        
        if role:
            users = User.query.filter_by(role=role).all()
        else:
            users = User.query.all()
            
        return jsonify([
            {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'user_type': user.user_type,
                'department': user.department,
                'client_id': user.client_id,
                'is_admin': user.is_admin,
                'created_at': user.created_at.isoformat()
            }
            for user in users
        ])
        
    except Exception as e:
        print(f"Get users error: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.get_json() or {}
        from core.models import User
        result = update_user_logic(user_id, data, bcrypt, db, User)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    except Exception as e:
        print(f"Update user error: {e}")
        return jsonify({'error': 'Failed to update user'}), 500

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        from core.models import User
        result = delete_user_logic(user_id, db, User)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    except Exception as e:
        print(f"Delete user error: {e}")
        return jsonify({'error': 'Failed to delete user'}), 500

@app.route('/api/user/accessible-clients', methods=['GET'])
def get_accessible_clients():
    try:
        user_id = request.args.get('user_id')
        from core.models import User, Client
        result = get_accessible_clients_logic(user_id, User, Client)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    except Exception as e:
        print(f"Get accessible clients error: {e}")
        return jsonify({'error': 'Failed to fetch accessible clients'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        user = User.query.filter_by(email=email).first()
        if user and user.password_hash and bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({'message': 'Login successful', 'is_admin': user.is_admin, 'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'userType': user.role,
                'department': user.role if user.role not in ['client'] else None,
                'is_admin': user.is_admin
            }})
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/create-admin')
def create_admin():
    try:
        ADMIN_EMAIL = 'r.hasan@action-labs.co'
        ADMIN_PASSWORD = 'GlassDoor2025!'
        if not User.query.filter_by(email=ADMIN_EMAIL).first():
            pw_hash = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode('utf-8')
            db.session.add(User(email=ADMIN_EMAIL, password_hash=pw_hash, is_admin=True))
            db.session.commit()
            return f"✅ Admin {ADMIN_EMAIL} created."
        return "ℹ️ Admin already exists."
    except Exception as e:
        print(f"Create admin error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/clients', methods=['GET'])
def get_clients():
    try:
        clients = Client.query.order_by(Client.created_at.desc()).all()
        return jsonify([
            {
                'id': c.id,
                'name': c.name,
                'industry': c.industry,
                'contact': c.contact,
                'email': c.email,
                'phone': c.phone,
                'website': c.website,
                'description': c.description,
                'status': c.status,
                'created_at': c.created_at,
                'updated_at': c.updated_at
            }
            for c in clients
        ])
    except Exception as e:
        print(f"Get clients error: {e}")
        return jsonify({'error': 'Failed to fetch clients'}), 500

@app.route('/api/clients', methods=['POST'])
def add_client():
    try:
        data = request.get_json() or {}
        if not data.get('name'):
            return jsonify({'error': 'Client name is required'}), 400

        # Create new client
        client = Client(
            name=data.get('name'),
            industry=data.get('industry') or '',
            contact=data.get('contact') or '',
            email=data.get('email') or '',
            phone=data.get('phone') or '',
            website=data.get('website') or '',
            description=data.get('description') or '',
            status=data.get('status', 'Active')
        )
        db.session.add(client)
        db.session.commit()

        # Return the full client object
        return jsonify({
            'id': client.id,
            'name': client.name,
            'industry': client.industry,
            'contact': client.contact,
            'email': client.email,
            'phone': client.phone,
            'website': client.website,
            'description': client.description,
            'status': client.status,
            'created_at': client.created_at,
            'updated_at': client.updated_at
        }), 201
    except Exception as e:
        print(f"Add client error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add client'}), 500

@app.route('/api/clients/<int:client_id>/cards', methods=['GET'])
def get_cards(client_id):
    try:
        cards = Card.query.filter_by(client_id=client_id).order_by(Card.created_at.desc()).all()
        return jsonify([
            {
                'id': card.id,
                'type': card.type,
                'title': card.title,
                'subtitle': card.subtitle,
                'icon': card.icon,
                'created_at': card.created_at
            }
            for card in cards
        ])
    except Exception as e:
        print(f"Get cards error: {e}")
        return jsonify({'error': 'Failed to fetch cards'}), 500

@app.route('/api/clients/<int:client_id>/cards', methods=['POST'])
def add_card(client_id):
    try:
        data = request.get_json() or {}
        if not data.get('type'):
            return jsonify({'error': 'Card type is required'}), 400

        # Verify client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'error': 'Client not found'}), 404

        # Create new card
        card = Card(
            type=data.get('type'),
            title=data.get('title', data.get('type').capitalize()),
            subtitle=data.get('subtitle', ''),
            icon=data.get('icon', ''),
            client_id=client_id
        )
        db.session.add(card)
        db.session.commit()

        # Return the full card object
        return jsonify({
            'id': card.id,
            'type': card.type,
            'title': card.title,
            'subtitle': card.subtitle,
            'icon': card.icon,
            'created_at': card.created_at,
            'client_id': card.client_id
        }), 201
    except Exception as e:
        print(f"Add card error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to add card'}), 500

@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    try:
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        db.session.delete(card)
        db.session.commit()
        return jsonify({'message': 'Card deleted successfully'})
    except Exception as e:
        print(f"Delete card error: {str(e)}")
        db.session.rollback()
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

@app.route('/api/clients/<int:client_id>/content-calendar', methods=['GET'])
def get_content_calendar(client_id):
    """Get content calendar entries for a client"""
    try:
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        user_id = request.args.get('user_id', type=int)
        print(f"[DEBUG] Fetching content calendar for client_id={client_id}, year={year}, month={month}, user_id={user_id}")
        # Build query
        query = ContentCalendar.query.filter_by(client_id=client_id)
        
        # Filter by date if provided
        if year and month:
            from datetime import date
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1)
            else:
                end_date = date(year, month + 1, 1)
            query = query.filter(ContentCalendar.scheduled_date >= start_date, 
                                ContentCalendar.scheduled_date < end_date)
        
        entries = query.order_by(ContentCalendar.scheduled_date.asc()).all()
        print(f"[DEBUG] Returning {len(entries)} entries for client_id={client_id}, year={year}, month={month}")
        for entry in entries:
            print(f"[DEBUG] Entry: id={entry.id}, title={entry.title}, date={entry.scheduled_date}, status={entry.status}, files={entry.files}")
        result = []
        for entry in entries:
            files = []
            for f in entry.files:
                files.append({
                    'id': f.id,
                    'filename': f.filename,
                    'original_filename': f.original_filename,
                    'file_path': f.file_path,
                    'file_size': f.file_size,
                    'mime_type': f.mime_type,
                    'url': f'/api/files/{f.filename}'
                })
            result.append({
                'id': entry.id,
                'title': entry.title,
                'description': entry.description,
                'content_type': entry.content_type,
                'contentType': entry.content_type,  # Frontend compatibility
                'platform': entry.platform,
                'channel': entry.platform,  # Frontend compatibility
                'date': entry.scheduled_date.isoformat(),
                'status': entry.status,
                'text_copy': entry.text_copy,
                'textCopy': entry.text_copy,  # Frontend compatibility
                'artwork_copy': entry.description,
                'artworkCopy': entry.description,  # Frontend compatibility
                'hashtags': entry.hashtags,
                'tags': entry.hashtags.split(',') if entry.hashtags else [],
                'created_by': entry.created_by,
                'approval_status': entry.approval_status,
                'approvalStatus': entry.approval_status,  # Frontend compatibility
                'created_at': entry.created_at.isoformat(),
                'updated_at': entry.updated_at.isoformat(),
                'files': files
            })
        return jsonify(result)
    except Exception as e:
        print(f"Get content calendar error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch content calendar'}), 500

@app.route('/api/clients/<int:client_id>/content-calendar', methods=['POST'])
def create_content_calendar_entry(client_id):
    """Create a new content calendar entry"""
    try:
        data = request.get_json(force=True, silent=False) or {}
        print(f"[DEBUG] Received data for create: {data}")
        # Validate required fields
        if not data.get('date'):
            print('[ERROR] Date is required')
            return jsonify({'error': 'Date is required'}), 400
        from datetime import datetime
        try:
            scheduled_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except Exception as e:
            print(f'[ERROR] Invalid date format: {e}')
            return jsonify({'error': f'Invalid date format: {e}'}), 400
        try:
            entry = ContentCalendar(
                client_id=client_id,
                title=data.get('title', data.get('contentType', 'Untitled')),
                description=data.get('artworkCopy', ''),
                content_type=data.get('contentType', ''),
                platform=data.get('channel', ''),
                scheduled_date=scheduled_date,
                status=data.get('status', 'draft').lower(),
                text_copy=data.get('textCopy', ''),
                hashtags=','.join(data.get('tags', [])) if data.get('tags') else '',
                created_by=data.get('user_id', 1),
                client_feedback=data.get('clientFeedback', ''),
                approval_status=data.get('approvalStatus', 'pending')
            )
            db.session.add(entry)
            db.session.flush()
            files_data = data.get('files', [])
            print(f"[DEBUG] Files data received: {files_data}")
            if files_data:
                for file_info in files_data:
                    print(f"[DEBUG] Processing file: {file_info}")
                    if isinstance(file_info, dict) and file_info.get('filename'):
                        content_file = ContentFile(
                            content_id=entry.id,
                            filename=file_info.get('filename'),
                            original_filename=file_info.get('original_filename', file_info.get('filename')),
                            file_path=f"uploads/{file_info.get('filename')}",
                            file_size=file_info.get('file_size', 0),
                            mime_type=file_info.get('mime_type', '')
                        )
                        db.session.add(content_file)
                        print(f"[DEBUG] Added ContentFile: {content_file.filename}")
            db.session.commit()
            print(f"[DEBUG] Created content calendar entry with ID: {entry.id}, date: {entry.scheduled_date}, status: {entry.status}")
            return jsonify({
                'id': entry.id,
                'message': 'Content calendar entry created successfully'
            }), 201
        except Exception as e:
            print(f'[ERROR] Failed to create content calendar entry: {e}')
            import traceback; traceback.print_exc()
            db.session.rollback()
            return jsonify({'error': f'Failed to create content calendar entry: {str(e)}'}), 500
    except Exception as e:
        print(f'[ERROR] Unexpected error: {e}')
        import traceback; traceback.print_exc()
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/api/content-calendar/<int:entry_id>', methods=['PUT'])
def update_content_calendar_entry(entry_id):
    """Update a content calendar entry"""
    try:
        entry = ContentCalendar.query.get(entry_id)
        if not entry:
            return jsonify({'error': 'Content calendar entry not found'}), 404
        
        data = request.get_json() or {}
        print(f"DEBUG: Received data for update: {data}")
        
        # Update fields with proper field mapping
        if 'title' in data or 'contentType' in data:
            entry.title = data.get('title', data.get('contentType', entry.title))
        if 'artworkCopy' in data:
            entry.description = data['artworkCopy']  # Frontend sends artworkCopy
        if 'contentType' in data:
            entry.content_type = data['contentType']
        if 'channel' in data:
            entry.platform = data['channel']  # Frontend sends channel
        if 'date' in data:
            from datetime import datetime
            try:
                entry.scheduled_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        if 'status' in data:
            entry.status = data['status'].lower()
        if 'textCopy' in data:
            entry.text_copy = data['textCopy']  # Frontend sends textCopy
        if 'tags' in data:
            entry.hashtags = ','.join(data['tags']) if data['tags'] else ''
        if 'clientFeedback' in data:
            entry.client_feedback = data['clientFeedback']
        if 'approvalStatus' in data:
            entry.approval_status = data['approvalStatus']
        
        # Handle file attachments - update files if provided
        if 'files' in data:
            # Remove existing files for this entry
            ContentFile.query.filter_by(content_id=entry.id).delete()
            
            # Add new files
            files_data = data.get('files', [])
            if files_data:
                for file_info in files_data:
                    if isinstance(file_info, dict) and file_info.get('filename'):
                        content_file = ContentFile(
                            content_id=entry.id,
                            filename=file_info.get('filename'),
                            original_filename=file_info.get('original_filename', file_info.get('filename')),
                            file_path=f"uploads/{file_info.get('filename')}",
                            file_size=file_info.get('file_size', 0),
                            mime_type=file_info.get('mime_type', '')
                        )
                        db.session.add(content_file)
        
        db.session.commit()
        
        print(f"DEBUG: Updated content calendar entry with ID: {entry.id}")
        
        return jsonify({'message': 'Content calendar entry updated successfully'})
        
    except Exception as e:
        print(f"Update content calendar error: {e}")
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to update content calendar entry'}), 500

@app.route('/api/content-calendar/<int:entry_id>', methods=['DELETE'])
def delete_content_calendar_entry(entry_id):
    print(f"[DEBUG] DELETE /api/content-calendar/{entry_id} called")  # Debug log
    try:
        entry = ContentCalendar.query.get(entry_id)
        if not entry:
            print(f"[DEBUG] Content calendar entry not found for id: {entry_id}")
            return jsonify({'error': 'Content calendar entry not found'}), 404
        db.session.delete(entry)
        db.session.commit()
        print(f"[DEBUG] Content calendar entry deleted: {entry_id}")
        return jsonify({'message': 'Content calendar entry deleted successfully'})
    except Exception as e:
        print(f"Delete content calendar error: {e}")
        traceback.print_exc()
        db.session.rollback()
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
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    # Get all channels where user is a member
    channels = Channel.query.join(ChannelMember).filter(ChannelMember.user_id == user_id).all()
    result = []
    for c in channels:
        last_msg = Message.query.filter_by(channel_id=c.id).order_by(Message.created_at.desc()).first()
        result.append({
            'id': c.id,
            'name': c.name,
            'is_dm': c.is_dm,
            'unread_count': 0,  # You can implement unread logic later
            'last_message': last_msg.created_at.isoformat() if last_msg else None
        })
    return jsonify(result)

@app.route('/api/channels', methods=['POST'])
def create_or_get_channel():
    data = request.get_json() or {}
    name = data.get('name')
    is_dm = data.get('is_dm', False)
    member_ids = sorted([int(uid) for uid in data.get('member_ids', [])])
    created_by = data.get('created_by')
    if not name or not member_ids or not created_by:
        return jsonify({'error': 'Missing required fields'}), 400
    # For DMs, try to find existing channel with same name and exact members
    if is_dm:
        existing = Channel.query.filter_by(name=name, is_dm=True).first()
        if existing:
            # Check if members match exactly
            existing_member_ids = sorted([m.user_id for m in existing.members])
            if existing_member_ids == member_ids:
                return jsonify({'id': existing.id, 'name': existing.name, 'is_dm': True}), 200
    # Create new channel
    channel = Channel(name=name, is_dm=is_dm, created_by=created_by)
    db.session.add(channel)
    db.session.commit()
    # Add members
    for uid in member_ids:
        db.session.add(ChannelMember(channel_id=channel.id, user_id=uid))
    db.session.commit()
    return jsonify({'id': channel.id, 'name': channel.name, 'is_dm': channel.is_dm}), 201

@socketio.on('send_message')
def handle_send_message(data):
    channel_id = data.get('channel_id')
    user_id = data.get('user_id')
    content = data.get('content')
    parent_message_id = data.get('parent_message_id')
    name = data.get('name')
    if not channel_id or not user_id or not content:
        return
    # Save message to DB
    msg = Message(channel_id=channel_id, user_id=user_id, content=content, parent_message_id=parent_message_id)
    db.session.add(msg)
    db.session.commit()
    # Prepare message dict for broadcast
    msg_dict = {
        'id': msg.id,
        'channel_id': channel_id,
        'user_id': user_id,
        'content': content,
        'parent_message_id': parent_message_id,
        'created_at': msg.created_at.isoformat(),
        'name': name
    }
    # Broadcast to channel
    socketio.emit('receive_message', msg_dict, room=f'channel_{channel_id}')

@socketio.on('join')
def handle_join(data):
    channel_id = data.get('channel_id')
    if channel_id:
        join_room(f'channel_{channel_id}')
        print(f"🏠 DEBUG: User joined room channel_{channel_id}")

@socketio.on('leave')
def handle_leave(data):
    channel_id = data.get('channel_id')
    if channel_id:
        leave_room(f'channel_{channel_id}')
        print(f"🚪 DEBUG: User left room channel_{channel_id}")

@socketio.on('connect')
def handle_connect():
    print(f"🔌 DEBUG: User connected with session ID: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"🔌 DEBUG: User disconnected with session ID: {request.sid}")

@app.route('/api/channels/<int:channel_id>/messages', methods=['GET'])
def get_channel_messages(channel_id):
    messages = Message.query.filter_by(channel_id=channel_id).order_by(Message.created_at.asc()).all()
    result = []
    for m in messages:
        user = User.query.get(m.user_id)
        result.append({
            'id': m.id,
            'channel_id': m.channel_id,
            'user_id': m.user_id,
            'content': m.content,
            'parent_message_id': m.parent_message_id,
            'created_at': m.created_at.isoformat(),
            'name': user.name if user else 'Unknown'
        })
    return jsonify(result)

@app.route('/api/meetings', methods=['GET'])
def get_meetings():
    user_id = request.args.get('user_id', type=int)
    
    if user_id:
        # Filter meetings where user is organizer or invitee
        # For invitees, we need to check if user_id is in the comma-separated invitee_ids string
        meetings = Meeting.query.filter(
            or_(
                Meeting.organizer_id == user_id,
                Meeting.invitee_ids.like(f'%{user_id}%')
            )
        ).order_by(Meeting.date.asc(), Meeting.start_time.asc()).all()
        
        # Further filter to ensure exact match for invitee_ids (avoid partial matches)
        filtered_meetings = []
        for m in meetings:
            if m.organizer_id == user_id:
                filtered_meetings.append(m)
            elif m.invitee_ids:
                invitee_list = [int(id.strip()) for id in m.invitee_ids.split(',') if id.strip()]
                if user_id in invitee_list:
                    filtered_meetings.append(m)
        
        meetings = filtered_meetings
    else:
        # Return all meetings if no user_id specified (admin view)
        meetings = Meeting.query.order_by(Meeting.date.asc(), Meeting.start_time.asc()).all()
    
    result = []
    for m in meetings:
        result.append({
            'id': m.id,
            'title': m.title,
            'reason': m.reason,
            'date': m.date,
            'start_time': m.start_time,
            'end_time': m.end_time,
            'organizer_id': m.organizer_id,
            'invitee_ids': m.invitee_ids.split(',') if m.invitee_ids else [],
            'created_at': m.created_at.isoformat() if m.created_at else None
        })
    return jsonify(result)

@app.route('/api/meetings', methods=['POST'])
def create_meeting():
    data = request.get_json() or {}
    title = data.get('title')
    reason = data.get('reason')
    date = data.get('date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    organizer_id = data.get('organizer_id')
    invitee_ids = data.get('invitee_ids', [])
    if not (title and date and start_time and end_time and organizer_id):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create the meeting
    meeting = Meeting(
        title=title,
        reason=reason,
        date=date,
        start_time=start_time,
        end_time=end_time,
        organizer_id=organizer_id,
        invitee_ids=','.join(str(i) for i in invitee_ids)
    )
    db.session.add(meeting)
    db.session.commit()
    
    # Get organizer info for the message
    organizer = User.query.get(organizer_id)
    organizer_name = organizer.name if organizer else f"User {organizer_id}"
    
    # Send automatic messages to each invitee
    print(f"🚀 DEBUG: Sending invitations to {len(invitee_ids)} invitees: {invitee_ids}")
    for invitee_id in invitee_ids:
        try:
            invitee_id = int(invitee_id)
            print(f"🔍 DEBUG: Processing invitee {invitee_id}")
            if invitee_id == organizer_id:  # Skip sending message to self
                print(f"⏭️ DEBUG: Skipping organizer {invitee_id}")
                continue
                
            # Get invitee info
            invitee = User.query.get(invitee_id)
            if not invitee:
                print(f"❌ DEBUG: Invitee {invitee_id} not found")
                continue
            
            print(f"👤 DEBUG: Found invitee {invitee.name} (ID: {invitee_id})")
                
            # Create or get DM channel between organizer and invitee
            member_ids = sorted([organizer_id, invitee_id])
            dm_name = f"{organizer_id}-{invitee_id}"  # Use same format as frontend
            
            print(f"💬 DEBUG: Looking for DM channel with members {member_ids}")
            
            # Try to find existing DM channel
            existing_channel = None
            channels = Channel.query.filter_by(is_dm=True).all()
            for channel in channels:
                channel_member_ids = sorted([m.user_id for m in channel.members])
                if channel_member_ids == member_ids:
                    existing_channel = channel
                    break
        except Exception as e:
            print(f"[Revive API] Error: {e}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/revive/campaigns', methods=['POST'])
def api_create_campaign():
    data = request.get_json() or {}
    name = data.get('name')
    clientid = data.get('clientid')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    if not all([name, clientid, start_date, end_date]):
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        campaign_id = create_campaign(name, clientid, start_date, end_date)
        return jsonify({'campaign_id': campaign_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/revive/banners', methods=['POST'])
def api_create_banner():
    data = request.get_json() or {}
    campaignid = data.get('campaignid')
    image_url = data.get('image_url')
    width = data.get('width')
    height = data.get('height')
    alt_text = data.get('alt_text', '')
    if not all([campaignid, image_url, width, height]):
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        banner_id = create_banner(campaignid, image_url, width, height, alt_text)
        return jsonify({'banner_id': banner_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── Standup Tasks Endpoints ────────────────────────────────────────────────

@app.route('/api/standup-tasks', methods=['GET'])
def get_standup_tasks():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    tasks = StandupTask.query.filter_by(user_id=user_id).all()
    # Debug: print tasks to server log
    print(f"[DEBUG] StandupTask GET for user_id={user_id}: {[t.to_dict() for t in tasks]}")
    return jsonify([t.to_dict() for t in tasks])

@app.route('/api/standup-tasks', methods=['POST'])
def create_standup_task():
    data = request.get_json() or {}
    try:
        task = StandupTask(
            user_id=data.get('user_id'),
            client=data.get('client', ''),
            day=data.get('day', ''),
            start_time=data.get('start_time', ''),
            end_time=data.get('end_time', ''),
            task=data.get('task', ''),
            status=data.get('status', 'Not Started'),
            notes=data.get('notes', ''),
            blocker=data.get('blocker', False),
            color=data.get('color', '#FFD600')
        )
        db.session.add(task)
        db.session.commit()
        return jsonify(task.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/standup-tasks/<int:task_id>', methods=['PUT'])
def update_standup_task(task_id):
    data = request.get_json() or {}
    task = StandupTask.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    for field in ['client', 'day', 'start_time', 'end_time', 'task', 'status', 'notes', 'blocker', 'color']:
        if field in data:
            setattr(task, field, data[field])
    db.session.commit()
    return jsonify(task.to_dict())

@app.route('/api/standup-tasks/<int:task_id>', methods=['DELETE'])
def delete_standup_task(task_id):
    task = StandupTask.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'})

@app.route('/api/channels/<int:channel_id>/read', methods=['POST'])
def mark_channel_read(channel_id):
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    # Optionally, update a ChannelRead table or similar
    return jsonify({'message': 'Channel marked as read'}), 200

# Move business logic to core/business_logic.py and keep only Flask app/adapters here.
# Example import:
# from core.business_logic import get_access_requests_logic, approve_access_request_logic, ...
if __name__ == "__main__":
    import sys
    port = 5001  # Default to 5001 to avoid conflicts
    for arg in sys.argv:
        if arg.startswith("--port="):
            try:
                port = int(arg.split("=", 1)[1])
            except Exception:
                pass
    cert_path = os.path.join(os.path.dirname(__file__), '../certs/cert.pem')
    key_path = os.path.join(os.path.dirname(__file__), '../certs/key.pem')
    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=True,
        ssl_context=(cert_path, key_path)
    )