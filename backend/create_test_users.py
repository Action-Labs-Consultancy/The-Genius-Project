#!/usr/bin/env python3
"""
Create test users with proper passwords for authentication
"""
import sys
import os
sys.path.append('/Users/rabab/the-genius-project/backend')

from mongo_db import MongoDB
from bson import ObjectId
import bcrypt
from datetime import datetime

def create_test_users():
    """Create test users with proper authentication"""
    
    # Connect to MongoDB
    mongo = MongoDB()
    mongo.connect("mongodb://localhost:27017/genius_db")
    
    users = mongo.get_collection('users')
    
    # Clear existing users
    users.delete_many({})
    
    # Create password hashes
    hr_password = bcrypt.hashpw('hr123'.encode('utf-8'), bcrypt.gensalt())
    employee_password = bcrypt.hashpw('emp123'.encode('utf-8'), bcrypt.gensalt())
    admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
    
    # Create test users with proper structure
    test_users = [
        {
            "_id": ObjectId("67675a43d5b1a2b3c4d5e6f7"),
            "name": "HR Manager",
            "email": "hr@company.com",
            "password_hash": hr_password,
            "department": "hr",
            "role": "hr",
            "is_admin": False,
            "created_at": datetime.utcnow()
        },
        {
            "_id": ObjectId("67675a43d5b1a2b3c4d5e6f8"),
            "name": "John Employee",
            "email": "john@company.com",
            "password_hash": employee_password,
            "department": "engineering",
            "role": "employee",
            "is_admin": False,
            "created_at": datetime.utcnow()
        },
        {
            "_id": ObjectId("67675a43d5b1a2b3c4d5e6f9"),
            "name": "Admin User",
            "email": "admin@company.com",
            "password_hash": admin_password,
            "department": "it",
            "role": "admin",
            "is_admin": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    # Insert users
    users.insert_many(test_users)
    
    print("✅ Test users created successfully!")
    print("\nLogin credentials:")
    print("HR Manager: hr@company.com / hr123")
    print("Employee: john@company.com / emp123")
    print("Admin: admin@company.com / admin123")
    
    # Also create some leave requests for testing
    leave_requests = mongo.get_collection('leave_requests')
    leave_requests.delete_many({})
    
    leave_requests.insert_many([
        {
            "_id": ObjectId(),
            "user_id": "67675a43d5b1a2b3c4d5e6f8",
            "employee_name": "John Employee",
            "type": "vacation",
            "start_date": "2025-07-20",
            "end_date": "2025-07-25",
            "reason": "Family vacation",
            "status": "pending",
            "submitted_date": datetime.utcnow().isoformat(),
            "duration": 5
        },
        {
            "_id": ObjectId(),
            "user_id": "67675a43d5b1a2b3c4d5e6f9",
            "employee_name": "Admin User",
            "type": "sick",
            "start_date": "2025-07-16",
            "end_date": "2025-07-17",
            "reason": "Sick leave",
            "status": "pending",
            "submitted_date": datetime.utcnow().isoformat(),
            "duration": 2
        }
    ])
    
    print(f"\nCreated {leave_requests.count_documents({})} leave requests for testing")

if __name__ == "__main__":
    create_test_users()
