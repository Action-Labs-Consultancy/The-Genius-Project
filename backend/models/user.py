"""User model for MongoDB"""
from datetime import datetime
from bson import ObjectId
from config.mongodb import get_mongo

class User:
    """User model class"""
    
    @staticmethod
    def create(email, password, name="", role="user", department="", user_type="employee", is_admin=False, start_date=None):
        """Create a new user"""
        mongo = get_mongo()
        user_data = {
            'email': email,
            'password': password,
            'name': name,
            'role': role,
            'department': department,
            'user_type': user_type,
            'is_admin': is_admin,
            'start_date': start_date or datetime.now().isoformat(),
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        result = mongo.db.users.insert_one(user_data)
        user_data['_id'] = str(result.inserted_id)
        return user_data
    
    @staticmethod
    def get_all():
        """Get all users"""
        try:
            mongo = get_mongo()
            users = list(mongo.db.users.find())
            for user in users:
                if '_id' in user:
                    user['_id'] = str(user['_id'])
                # Remove password and password_hash from response
                if 'password' in user:
                    del user['password']
                if 'password_hash' in user:
                    del user['password_hash']
                # Handle any datetime objects
                for key, value in user.items():
                    if hasattr(value, 'isoformat'):  # datetime object
                        user[key] = value.isoformat()
                    elif isinstance(value, bytes):  # bytes object
                        user[key] = str(value)
            return users
        except Exception as e:
            print(f"Error in get_all users: {e}")
            return []
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        try:
            mongo = get_mongo()
            user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
                # Remove password from response
                if 'password' in user:
                    del user['password']
            return user
        except:
            return None
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        mongo = get_mongo()
        user = mongo.db.users.find_one({'email': email})
        if user:
            user['_id'] = str(user['_id'])
        return user
    
    @staticmethod
    def update(user_id, data):
        """Update user"""
        try:
            mongo = get_mongo()
            data['updated_at'] = datetime.now()
            result = mongo.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': data}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def delete(user_id):
        """Delete user"""
        try:
            mongo = get_mongo()
            result = mongo.db.users.delete_one({'_id': ObjectId(user_id)})
            return result.deleted_count > 0
        except:
            return False

class AccessRequest:
    """Access Request model class"""
    
    @staticmethod
    def create(email, name="", user_type="employee", department=""):
        """Create a new access request"""
        mongo = get_mongo()
        request_data = {
            'email': email,
            'name': name,
            'user_type': user_type,
            'department': department,
            'status': 'pending',
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        result = mongo.db.access_requests.insert_one(request_data)
        request_data['_id'] = str(result.inserted_id)
        return request_data
    
    @staticmethod
    def get_all():
        """Get all access requests"""
        mongo = get_mongo()
        requests = list(mongo.db.access_requests.find())
        for req in requests:
            req['_id'] = str(req['_id'])
        return requests
    
    @staticmethod
    def get_by_id(request_id):
        """Get access request by ID"""
        try:
            mongo = get_mongo()
            req = mongo.db.access_requests.find_one({'_id': ObjectId(request_id)})
            if req:
                req['_id'] = str(req['_id'])
            return req
        except:
            return None
    
    @staticmethod
    def approve(request_id):
        """Approve access request"""
        try:
            mongo = get_mongo()
            result = mongo.db.access_requests.update_one(
                {'_id': ObjectId(request_id)},
                {'$set': {'status': 'approved', 'updated_at': datetime.now()}}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def reject(request_id):
        """Reject access request"""
        try:
            mongo = get_mongo()
            result = mongo.db.access_requests.update_one(
                {'_id': ObjectId(request_id)},
                {'$set': {'status': 'rejected', 'updated_at': datetime.now()}}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def delete(request_id):
        """Delete access request"""
        try:
            mongo = get_mongo()
            result = mongo.db.access_requests.delete_one({'_id': ObjectId(request_id)})
            return result.deleted_count > 0
        except:
            return False
