"""
Add client access control models

This migration adds the following tables:
- client_access: Controls which clients can access what content
- client_feedback: Stores client feedback and approval/disapproval
- content_items: Content calendar items for client approval

Run this script to update your database schema.
"""

from backend.core.models import db, ClientAccess, ClientFeedback, ContentItem, Client, Card, User
from backend.app import app

def upgrade_database():
    """Add new access control columns and tables"""
    with app.app_context():
        try:
            # Create new tables
            db.create_all()
            
            # Add new columns to existing tables if they don't exist
            inspector = db.inspect(db.engine)
            
            # Check if new columns exist in Client table
            client_columns = [col['name'] for col in inspector.get_columns('client')]
            if 'access_level' not in client_columns:
                db.engine.execute('ALTER TABLE client ADD COLUMN access_level VARCHAR(32) DEFAULT "restricted"')
            if 'can_comment' not in client_columns:
                db.engine.execute('ALTER TABLE client ADD COLUMN can_comment BOOLEAN DEFAULT TRUE')
            if 'can_approve' not in client_columns:
                db.engine.execute('ALTER TABLE client ADD COLUMN can_approve BOOLEAN DEFAULT TRUE')
            
            # Check if new columns exist in Card table
            card_columns = [col['name'] for col in inspector.get_columns('card')]
            if 'requires_approval' not in card_columns:
                db.engine.execute('ALTER TABLE card ADD COLUMN requires_approval BOOLEAN DEFAULT TRUE')
            if 'is_public' not in card_columns:
                db.engine.execute('ALTER TABLE card ADD COLUMN is_public BOOLEAN DEFAULT FALSE')
            if 'approved_by' not in card_columns:
                db.engine.execute('ALTER TABLE card ADD COLUMN approved_by INTEGER')
            if 'approved_at' not in card_columns:
                db.engine.execute('ALTER TABLE card ADD COLUMN approved_at DATETIME')
            if 'content' not in card_columns:
                db.engine.execute('ALTER TABLE card ADD COLUMN content TEXT')
            
            print("Database migration completed successfully!")
            
        except Exception as e:
            print(f"Migration error: {e}")
            db.session.rollback()

if __name__ == '__main__':
    upgrade_database()
