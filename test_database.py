#!/usr/bin/env python3
"""
Test script to verify database connection and setup.
Run this to test if the database is properly configured.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_database_connection():
    try:
        # Import database components
        from backend.app import app, db
        from core.models import User
        
        with app.app_context():
            # Test database connection
            print("Testing database connection...")
            db.session.execute('SELECT 1')
            print("✓ Database connection successful")
            
            # Test if tables exist
            print("\nChecking database tables...")
            try:
                user_count = User.query.count()
                print(f"✓ User table exists with {user_count} users")
            except Exception as e:
                print(f"✗ User table issue: {e}")
                print("Creating database tables...")
                db.create_all()
                print("✓ Database tables created")
            
            # Test creating a test user
            print("\nTesting user creation...")
            test_email = "test@example.com"
            existing_user = User.query.filter_by(email=test_email).first()
            if not existing_user:
                from flask_bcrypt import Bcrypt
                bcrypt = Bcrypt()
                test_user = User(
                    name="Test User",
                    email=test_email,
                    password_hash=bcrypt.generate_password_hash("testpassword").decode('utf-8'),
                    role="admin",
                    is_admin=True
                )
                db.session.add(test_user)
                db.session.commit()
                print("✓ Test user created successfully")
            else:
                print("✓ Test user already exists")
                
            print("\n✅ All database tests passed!")
            
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    print("=== Database Connection Test ===")
    
    # Check environment variables
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        print(f"Database URL found: {database_url[:50]}...")
    else:
        print("No DATABASE_URL environment variable found")
    
    # Run the test
    success = test_database_connection()
    
    if success:
        print("\n🎉 Database is properly configured!")
    else:
        print("\n💥 Database configuration needs fixing!")
        sys.exit(1)
