#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from mongo_db import mongo
from bson import ObjectId
from datetime import datetime

def fix_admin_role():
    """Fix the admin user to have head_of_marketing role"""
    try:
        # Connect to MongoDB
        mongodb_uri = os.getenv('MONGODB_URI')
        mongo.connect(mongodb_uri)
        collection = mongo.get_collection('users')
        
        # Find the admin user by email
        admin_user = collection.find_one({'email': 'admin@example.com'})
        
        if admin_user:
            print(f"Found admin user: {admin_user.get('name')} ({admin_user.get('email')})")
            print(f"Current role: {admin_user.get('role', 'None')}")
            print(f"Current user_type: {admin_user.get('user_type', 'None')}")
            print(f"Current is_admin: {admin_user.get('is_admin', 'None')}")
            
            # Update the user to have head_of_marketing role
            result = collection.update_one(
                {'_id': admin_user['_id']},
                {
                    '$set': {
                        'role': 'head_of_marketing',
                        'user_type': 'head_of_marketing',
                        'marketing_role': 'head_of_marketing',
                        'is_admin': True,
                        'department': 'Marketing',
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"✅ Successfully updated admin user to Head of Marketing role!")
                
                # Verify the update
                updated_user = collection.find_one({'_id': admin_user['_id']})
                print(f"Updated role: {updated_user.get('role')}")
                print(f"Updated user_type: {updated_user.get('user_type')}")
                print(f"Updated marketing_role: {updated_user.get('marketing_role')}")
                print(f"Updated department: {updated_user.get('department')}")
            else:
                print("❌ Failed to update user")
        else:
            print("❌ Admin user not found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_admin_role()
