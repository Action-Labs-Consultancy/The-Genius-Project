#!/usr/bin/env python3
"""
Script to initialize the local SQLite database with all required tables.
Run this after commenting out DATABASE_URL in .env
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app, db
from core.models import User, Player, Project, Task, Client, Card, AccessRequest, Channel, ChannelMember, Message, ChannelRead, Meeting, StandupTask, ClientAccess, ContentCalendar, ContentFile, ContentFeedback
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt(app)

def init_database():
    """Initialize the database with all tables."""
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Create admin user
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            
            # Check if admin user already exists
            existing_admin = User.query.filter_by(email=admin_email).first()
            if not existing_admin:
                password_hash = bcrypt.generate_password_hash(admin_password).decode('utf-8')
                admin_user = User(
                    name='Admin User',
                    email=admin_email,
                    password_hash=password_hash,
                    role='admin',
                    is_admin=True
                )
                db.session.add(admin_user)
                db.session.commit()
                print(f"✅ Admin user created: {admin_email}")
            else:
                print(f"ℹ️  Admin user already exists: {admin_email}")
                
        except Exception as e:
            print(f"❌ Error initializing database: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    init_database()
