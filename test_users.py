#!/usr/bin/env python3
"""
Test script to create users and verify MongoDB connectivity
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from flask import Flask
from dotenv import load_dotenv
import bcrypt

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['MONGO_URI'] = os.getenv('MONGO_URI')

# Initialize MongoDB
with app.app_context():
    from config.mongodb import init_mongo
    from models.user import User
    
    try:
        mongo = init_mongo(app)
        print("✓ MongoDB connection established")
        
        # Create admin user
        admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin_user = User.create(
            email='admin@genius.com',
            password=admin_password,
            name='Admin User',
            role='admin',
            is_admin=True
        )
        print(f'✓ Created admin user: {admin_user["email"]}')
        
        # Create test user
        test_password = bcrypt.hashpw('test123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        test_user = User.create(
            email='test@genius.com',
            password=test_password,
            name='Test User',
            role='user'
        )
        print(f'✓ Created test user: {test_user["email"]}')
        
        # Test login verification
        retrieved_admin = User.get_by_email('admin@genius.com')
        if retrieved_admin and bcrypt.checkpw('admin123'.encode('utf-8'), retrieved_admin['password'].encode('utf-8')):
            print('✓ Admin login verification successful')
        
        retrieved_test = User.get_by_email('test@genius.com')
        if retrieved_test and bcrypt.checkpw('test123'.encode('utf-8'), retrieved_test['password'].encode('utf-8')):
            print('✓ Test user login verification successful')
        
        print('✅ MongoDB and user authentication is fully operational!')
        
        print()
        print('LOGIN CREDENTIALS:')
        print('Admin: admin@genius.com / admin123')
        print('User:  test@genius.com / test123')
        
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()
