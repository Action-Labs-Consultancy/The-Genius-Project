# Example: Business logic for access requests

def get_access_requests_logic():
    from core.models import AccessRequest
    requests = AccessRequest.query.order_by(AccessRequest.requested_at.desc()).all()
    return [
        {
            'id': r.id,
            'email': r.email,
            'name': r.name,
            'requested_at': r.requested_at,
            'status': r.status,
            'user_type': r.user_type,
            'notes': r.notes
        } for r in requests
    ]

def update_user_logic(user_id, data, bcrypt, db, User):
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user_type = data.get('userType', user.user_type)
    department = data.get('department', user.department)
    user.user_type = user_type
    user.department = department
    user.role = department if user_type == 'employee' and department else user_type
    user.is_admin = data.get('is_admin', user.is_admin)
    if data.get('password'):
        user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    db.session.commit()
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'user_type': user.user_type,
        'department': user.department,
        'is_admin': user.is_admin
    }

def delete_user_logic(user_id, db, User):
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404
    db.session.delete(user)
    db.session.commit()
    return {'message': 'User deleted'}

def get_accessible_clients_logic(user_id, User, Client):
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404
    user_role = (user.role or '').lower()
    if user_role != 'client':
        clients = Client.query.order_by(Client.created_at.desc()).all()
        client_list = [
            {
                'id': c.id,
                'name': c.name,
                'industry': c.industry,
                'status': c.status,
                'created_at': c.created_at.isoformat()
            } for c in clients
        ]
        return client_list
    # ...add client-specific logic as needed...
    return []

def approve_access_request_logic(req_id, data, bcrypt, db, User, AccessRequest, serializer, os, smtplib, MIMEText):
    user_type = data.get('user_type', 'employee')
    req = AccessRequest.query.get_or_404(req_id)
    if req.status != 'pending':
        return {'error': 'Request already processed'}, 400
    password_hash = bcrypt.generate_password_hash('changeme').decode('utf-8')
    user_name = req.name or data.get('name') or req.email.split('@')[0]
    user = User(
        name=user_name,
        email=req.email,
        password_hash=password_hash,
        role=user_type,
        is_admin=(user_type == 'admin')
    )
    db.session.add(user)
    req.status = 'approved'
    req.user_type = user_type
    db.session.commit()
    token = serializer.dumps(user.email, salt='set-password')
    link = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/set-password?token={token}"
    try:
        msg = MIMEText(f"Hi {user.name},\n\nYour access has been approved! Set your password here: {link}\n\nIf you did not request this, ignore this email.")
        msg['Subject'] = 'Set your Action Labs password'
        msg['From'] = os.environ.get('MAIL_FROM', 'no-reply@action-labs.co')
        msg['To'] = user.email
        with smtplib.SMTP(os.environ.get('SMTP_HOST', 'localhost'), int(os.environ.get('SMTP_PORT', 25))) as server:
            if os.environ.get('SMTP_USER'):
                server.login(os.environ['SMTP_USER'], os.environ['SMTP_PASS'])
            server.sendmail(msg['From'], [msg['To']], msg.as_string())
    except Exception as e:
        print(f"[ERROR] Failed to send password email: {e}")
    return {'message': 'User approved, email sent', 'user_id': user.id}

def set_password_logic(token, password, serializer, db, User, bcrypt):
    if not token or not password:
        return {'error': 'Missing token or password'}, 400
        
    # Password strength validation
    if len(password) < 10:
        return {'error': 'Password must be at least 10 characters long'}, 400
    
    # Check for common password patterns
    if password.lower() in ['password123', 'admin123', '12345678910', 'qwerty123']:
        return {'error': 'Password is too common or weak'}, 400
        
    try:
        email = serializer.loads(token, salt='set-password', max_age=60*60*24)
    except Exception:
        return {'error': 'Invalid or expired token'}, 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return {'error': 'User not found'}, 404
        
    # Hash with higher work factor for added security
    user.password_hash = bcrypt.generate_password_hash(password, 12).decode('utf-8')
    db.session.commit()
    
    return {'message': 'Password set successfully'}

def request_access_logic(data, db, AccessRequest):
    email = data.get('email')
    name = data.get('name')
    notes = data.get('notes')
    if not email:
        return {'error': 'Email required'}, 400
    existing = AccessRequest.query.filter_by(email=email, status='pending').first()
    if existing:
        return {'error': 'Request already submitted'}, 400
    req = AccessRequest(email=email, name=name, notes=notes, status='pending')
    db.session.add(req)
    db.session.commit()
    return {'message': 'Access request submitted'}

def forgot_password_logic(data, db, User, bcrypt, smtplib, MIMEText, os):
    user_email = data.get('email')
    if not user_email:
        return {'error': 'Email is required'}, 400
        
    # Don't reveal if user exists or not to prevent enumeration attacks
    user = User.query.filter_by(email=user_email).first()
    if not user:
        # Return success message even if user doesn't exist for security
        return {'message': 'If your email is registered, you will receive a password reset link'}, 200
    
    # Generate a secure random token using os.urandom
    # Use secrets module instead of bcrypt for token generation
    import secrets
    token = secrets.token_urlsafe(32)  # 32 bytes of randomness, urlsafe encoded
    
    # Get email settings from environment variables
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    # Check if SMTP credentials are configured
    if not smtp_user or not smtp_password:
        print("[ERROR] SMTP credentials not configured")
        return {'error': 'Email service not configured'}, 500
    
    # Get the base URL from environment or use a default for local development
    base_url = os.environ.get('BASE_URL', 'http://localhost:3000')
    reset_link = f"{base_url}/reset-password?token={token}"
    
    # Improved email content with better formatting
    email_body = f"""
    Hello,
    
    Someone requested a password reset for your account. If this was you, please click the link below to reset your password:
    
    {reset_link}
    
    This link will expire in 24 hours.
    
    If you did not request a password reset, please ignore this email.
    
    Regards,
    The Genius Project Team
    """
    
    msg = MIMEText(email_body)
    msg['Subject'] = 'Password Reset Request'
    msg['From'] = smtp_user
    msg['To'] = user_email
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(msg['From'], [msg['To']], msg.as_string())
        server.quit()
        return {'message': 'If your email is registered, you will receive a password reset link'}, 200
    except Exception as e:
        print(f"[ERROR] Failed to send password reset email: {str(e)}")
        return {'error': 'Failed to send email'}, 500

def get_players_logic(Player):
    players = Player.query.all()
    return [{'id': p.id, 'name': p.name, 'dream': p.dream} for p in players]

def add_user_logic(data, db, User, bcrypt):
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('userType', 'employee')
    department = data.get('department', None)
    is_admin = data.get('is_admin', False)
    if not name or not email or not password:
        return {'error': 'Name, email, and password are required'}, 400
    if User.query.filter_by(email=email).first():
        return {'error': 'Email already exists'}, 400
    pw_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(
        name=name,
        email=email,
        password_hash=pw_hash,
        role=department if user_type == 'employee' and department else user_type,
        user_type=user_type,
        department=department,
        is_admin=is_admin
    )
    db.session.add(user)
    db.session.commit()
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'user_type': user.user_type,
        'department': user.department,
        'is_admin': user.is_admin
    }, 201
