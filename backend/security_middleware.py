"""
Security middleware for The Genius Project
Implements authentication, authorization, rate limiting, and other security measures
"""

from functools import wraps
from flask import request, jsonify, g
from datetime import datetime, timedelta
import jwt
import os
import re
import bleach
import time
from collections import defaultdict
import secrets

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)

# CSRF tokens storage (in production, use Redis)
csrf_tokens = {}

def sanitize_input(data):
    """Sanitize user input to prevent XSS and injection attacks"""
    if isinstance(data, str):
        # Remove HTML tags and sanitize
        return bleach.clean(data, tags=[], strip=True)
    elif isinstance(data, dict):
        return {key: sanitize_input(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    return data

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, "Password is strong"

def rate_limit(max_requests=10, window_minutes=1):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            current_time = time.time()
            window_start = current_time - (window_minutes * 60)
            
            # Clean old requests
            rate_limit_storage[client_ip] = [
                req_time for req_time in rate_limit_storage[client_ip] 
                if req_time > window_start
            ]
            
            # Check rate limit
            if len(rate_limit_storage[client_ip]) >= max_requests:
                return jsonify({
                    'error': 'Too many requests. Please try again later.',
                    'retry_after': window_minutes * 60
                }), 429
            
            # Add current request
            rate_limit_storage[client_ip].append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def generate_csrf_token():
    """Generate CSRF token"""
    token = secrets.token_urlsafe(32)
    csrf_tokens[token] = datetime.utcnow() + timedelta(hours=1)
    return token

def validate_csrf_token(token):
    """Validate CSRF token"""
    if token not in csrf_tokens:
        return False
    if datetime.utcnow() > csrf_tokens[token]:
        del csrf_tokens[token]
        return False
    return True

def require_auth(f):
    """Authentication required decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
            
            # Check token expiration
            if 'exp' in payload and datetime.utcnow().timestamp() > payload['exp']:
                return jsonify({'error': 'Token expired'}), 401
            
            g.current_user = payload
            return f(*args, **kwargs)
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated_function

def require_admin(f):
    """Admin access required decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'current_user') or not g.current_user.get('is_admin'):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def require_client_access(f):
    """Client access validation decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_id = kwargs.get('client_id') or request.json.get('client_id')
        if not client_id:
            return jsonify({'error': 'Client ID required'}), 400
        
        # Check if user has access to this client
        if not g.current_user.get('is_admin'):
            user_client_id = g.current_user.get('client_id')
            if user_client_id != client_id:
                return jsonify({'error': 'Access denied to this client'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def validate_file_upload(f):
    """File upload validation decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file size (16MB max)
        if len(file.read()) > 16 * 1024 * 1024:
            return jsonify({'error': 'File too large (max 16MB)'}), 400
        
        file.seek(0)  # Reset file pointer
        
        # Check file extension
        allowed_extensions = {
            'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'mov', 
            'avi', 'webp', 'svg', 'mkv', 'webm', 'flv', 'txt', 'csv', 'xls', 
            'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'tar', 'gz'
        }
        
        if '.' not in file.filename:
            return jsonify({'error': 'File must have an extension'}), 400
        
        ext = file.filename.rsplit('.', 1)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({'error': 'File type not allowed'}), 400
        
        return f(*args, **kwargs)
    return decorated_function

def security_headers(f):
    """Add security headers to response"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = f(*args, **kwargs)
        
        # Add security headers
        if hasattr(response, 'headers'):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
        
        return response
    return decorated_function

def log_security_event(event_type, details, user_id=None):
    """Log security events"""
    import logging
    
    security_logger = logging.getLogger('security')
    security_logger.info({
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'details': details,
        'user_id': user_id,
        'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
        'user_agent': request.headers.get('User-Agent', 'Unknown')
    })

class SecurityValidator:
    """Input validation and sanitization class"""
    
    @staticmethod
    def validate_user_data(data):
        """Validate user registration/update data"""
        errors = []
        
        if 'email' in data:
            if not validate_email(data['email']):
                errors.append('Invalid email format')
        
        if 'password' in data:
            is_strong, message = validate_password_strength(data['password'])
            if not is_strong:
                errors.append(message)
        
        if 'name' in data:
            if len(data['name']) < 2:
                errors.append('Name must be at least 2 characters')
            if len(data['name']) > 100:
                errors.append('Name must be less than 100 characters')
        
        return errors
    
    @staticmethod
    def sanitize_user_output(user_data):
        """Remove sensitive data from user output"""
        sensitive_fields = ['password', 'password_hash', 'reset_token', 'verification_token']
        
        if isinstance(user_data, dict):
            return {k: v for k, v in user_data.items() if k not in sensitive_fields}
        elif isinstance(user_data, list):
            return [SecurityValidator.sanitize_user_output(user) for user in user_data]
        
        return user_data
