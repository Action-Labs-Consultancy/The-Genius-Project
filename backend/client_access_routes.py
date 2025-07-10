"""
Client Access Control Routes
Handles permissions, feedback, and client-specific views
"""

from flask import Blueprint, request, jsonify, session
from backend.core.models import db, Client, ClientAccess, ClientFeedback, ContentItem, Card, User
from datetime import datetime
import functools

client_access_bp = Blueprint('client_access', __name__)

def require_auth(f):
    """Decorator to require authentication"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_employee(f):
    """Decorator to require employee access"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or user.user_type == 'client':
            return jsonify({'error': 'Employee access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Get current user from session"""
    if 'user_id' not in session:
        return None
    return User.query.get(session['user_id'])

def can_client_access_resource(client_id, resource_type, resource_id):
    """Check if a client can access a specific resource"""
    access = ClientAccess.query.filter_by(
        client_id=client_id,
        resource_type=resource_type,
        resource_id=resource_id,
        can_view=True
    ).first()
    
    if not access:
        return False
        
    # Check if access has expired
    if access.expires_at and access.expires_at < datetime.utcnow():
        return False
        
    return True

@client_access_bp.route('/api/client/dashboard')
@require_auth
def client_dashboard():
    """Get dashboard data for client users"""
    user = get_current_user()
    if not user or not user.client_id:
        return jsonify({'error': 'Client access required'}), 403
    
    client = Client.query.get(user.client_id)
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    # Get accessible cards
    accessible_cards = []
    card_accesses = ClientAccess.query.filter_by(
        client_id=client.id,
        resource_type='card',
        can_view=True
    ).all()
    
    for access in card_accesses:
        if not access.expires_at or access.expires_at > datetime.utcnow():
            card = Card.query.get(access.resource_id)
            if card:
                accessible_cards.append({
                    'id': card.id,
                    'type': card.type,
                    'title': card.title,
                    'subtitle': card.subtitle,
                    'icon': card.icon,
                    'content': card.content,
                    'can_comment': access.can_comment,
                    'created_at': card.created_at.isoformat() if card.created_at else None
                })
    
    # Get accessible content items
    accessible_content = []
    content_accesses = ClientAccess.query.filter_by(
        client_id=client.id,
        resource_type='content',
        can_view=True
    ).all()
    
    for access in content_accesses:
        if not access.expires_at or access.expires_at > datetime.utcnow():
            content = ContentItem.query.get(access.resource_id)
            if content:
                accessible_content.append({
                    'id': content.id,
                    'title': content.title,
                    'description': content.description,
                    'content_type': content.content_type,
                    'platform': content.platform,
                    'scheduled_date': content.scheduled_date.isoformat() if content.scheduled_date else None,
                    'status': content.status,
                    'requires_approval': content.requires_approval,
                    'approved_by_client': content.approved_by_client,
                    'can_comment': access.can_comment,
                    'created_at': content.created_at.isoformat()
                })
    
    return jsonify({
        'client': {
            'id': client.id,
            'name': client.name,
            'industry': client.industry,
            'access_level': client.access_level,
            'can_comment': client.can_comment,
            'can_approve': client.can_approve
        },
        'accessible_cards': accessible_cards,
        'accessible_content': accessible_content
    })

@client_access_bp.route('/api/client/feedback', methods=['POST'])
@require_auth
def submit_feedback():
    """Submit feedback or approval for content"""
    user = get_current_user()
    if not user or not user.client_id:
        return jsonify({'error': 'Client access required'}), 403
    
    data = request.get_json()
    resource_type = data.get('resource_type')
    resource_id = data.get('resource_id')
    comment = data.get('comment', '')
    status = data.get('status')  # 'approved', 'disapproved', or None for just comment
    feedback_type = data.get('feedback_type', 'comment')
    
    # Verify client has access to this resource
    if not can_client_access_resource(user.client_id, resource_type, resource_id):
        return jsonify({'error': 'Access denied'}), 403
    
    # Create feedback entry
    feedback = ClientFeedback(
        client_id=user.client_id,
        user_id=user.id,
        resource_type=resource_type,
        resource_id=resource_id,
        comment=comment,
        status=status,
        feedback_type=feedback_type
    )
    
    db.session.add(feedback)
    
    # If it's approval feedback, update the content item
    if feedback_type == 'approval' and resource_type == 'content':
        content = ContentItem.query.get(resource_id)
        if content:
            if status == 'approved':
                content.approved_by_client = True
                content.approved_at = datetime.utcnow()
                content.status = 'approved'
            elif status == 'disapproved':
                content.approved_by_client = False
                content.status = 'rejected'
    
    db.session.commit()
    
    return jsonify({'message': 'Feedback submitted successfully'})

@client_access_bp.route('/api/admin/client-access', methods=['POST'])
@require_employee
def grant_client_access():
    """Grant access to a client for specific resources"""
    data = request.get_json()
    client_id = data.get('client_id')
    resource_type = data.get('resource_type')
    resource_ids = data.get('resource_ids', [])
    can_view = data.get('can_view', True)
    can_comment = data.get('can_comment', False)
    expires_at = data.get('expires_at')
    
    user = get_current_user()
    
    # Parse expiration date if provided
    expires_at_dt = None
    if expires_at:
        try:
            expires_at_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid expiration date format'}), 400
    
    # Grant access for each resource
    for resource_id in resource_ids:
        # Check if access already exists
        existing_access = ClientAccess.query.filter_by(
            client_id=client_id,
            resource_type=resource_type,
            resource_id=resource_id
        ).first()
        
        if existing_access:
            # Update existing access
            existing_access.can_view = can_view
            existing_access.can_comment = can_comment
            existing_access.expires_at = expires_at_dt
            existing_access.granted_by = user.id
            existing_access.granted_at = datetime.utcnow()
        else:
            # Create new access
            access = ClientAccess(
                client_id=client_id,
                resource_type=resource_type,
                resource_id=resource_id,
                can_view=can_view,
                can_comment=can_comment,
                granted_by=user.id,
                expires_at=expires_at_dt
            )
            db.session.add(access)
    
    db.session.commit()
    return jsonify({'message': 'Access granted successfully'})

@client_access_bp.route('/api/admin/client-access/<int:client_id>')
@require_employee
def get_client_access(client_id):
    """Get all access permissions for a client"""
    accesses = ClientAccess.query.filter_by(client_id=client_id).all()
    
    access_list = []
    for access in accesses:
        # Get resource details
        resource_details = {}
        if access.resource_type == 'card':
            card = Card.query.get(access.resource_id)
            if card:
                resource_details = {'title': card.title, 'type': card.type}
        elif access.resource_type == 'content':
            content = ContentItem.query.get(access.resource_id)
            if content:
                resource_details = {'title': content.title, 'content_type': content.content_type}
        
        access_list.append({
            'id': access.id,
            'resource_type': access.resource_type,
            'resource_id': access.resource_id,
            'resource_details': resource_details,
            'can_view': access.can_view,
            'can_comment': access.can_comment,
            'granted_at': access.granted_at.isoformat(),
            'expires_at': access.expires_at.isoformat() if access.expires_at else None,
            'is_expired': access.expires_at and access.expires_at < datetime.utcnow()
        })
    
    return jsonify({'accesses': access_list})

@client_access_bp.route('/api/admin/client-feedback')
@require_employee
def get_client_feedback():
    """Get all client feedback for employees to review"""
    feedbacks = ClientFeedback.query.order_by(ClientFeedback.created_at.desc()).all()
    
    feedback_list = []
    for feedback in feedbacks:
        # Get resource details
        resource_details = {}
        if feedback.resource_type == 'card':
            card = Card.query.get(feedback.resource_id)
            if card:
                resource_details = {'title': card.title, 'type': card.type}
        elif feedback.resource_type == 'content':
            content = ContentItem.query.get(feedback.resource_id)
            if content:
                resource_details = {'title': content.title, 'content_type': content.content_type}
        
        feedback_list.append({
            'id': feedback.id,
            'client_name': feedback.client.name,
            'user_name': feedback.user.name,
            'resource_type': feedback.resource_type,
            'resource_id': feedback.resource_id,
            'resource_details': resource_details,
            'comment': feedback.comment,
            'status': feedback.status,
            'feedback_type': feedback.feedback_type,
            'created_at': feedback.created_at.isoformat(),
            'updated_at': feedback.updated_at.isoformat()
        })
    
    return jsonify({'feedback': feedback_list})

@client_access_bp.route('/api/admin/revoke-access', methods=['POST'])
@require_employee
def revoke_client_access():
    """Revoke client access to specific resources"""
    data = request.get_json()
    access_ids = data.get('access_ids', [])
    
    for access_id in access_ids:
        access = ClientAccess.query.get(access_id)
        if access:
            db.session.delete(access)
    
    db.session.commit()
    return jsonify({'message': 'Access revoked successfully'})
