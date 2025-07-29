"""
MongoDB connection and utilities for The Genius Project
"""
import os
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import bcrypt

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        
    def connect(self, uri=None):
        """Connect to MongoDB"""
        if not uri:
            uri = os.getenv('MONGODB_URI')
        
        if not uri:
            raise ValueError("MongoDB URI not provided")
            
        try:
            self.client = MongoClient(uri)
            # Extract database name from URI or use default
            if '/' in uri and '/' in uri.split('/')[-1] and uri.split('/')[-1].split('?')[0]:
                db_name = uri.split('/')[-1].split('?')[0]
            else:
                db_name = 'genius_db'
            self.db = self.client[db_name]
            
            # Test connection
            self.client.admin.command('ping')
            print(f"[MongoDB] Connected successfully to {db_name}")
            return True
        except Exception as e:
            print(f"[MongoDB] Connection failed: {e}")
            return False
    
    def get_collection(self, name):
        """Get a collection"""
        if self.db is None:
            raise RuntimeError("Not connected to MongoDB")
        return self.db[name]
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()

# Global MongoDB instance
mongo = MongoDB()

class MongoUser:
    """MongoDB User model"""
    
    @staticmethod
    def create_user(name, email, password, role='user', is_admin=False):
        """Create a new user"""
        collection = mongo.get_collection('users')
        # Check if user exists
        if collection.find_one({'email': email}):
            raise ValueError(f"User with email {email} already exists")
        # Hash password (store as bytes, not string)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user_doc = {
            'name': name,
            'email': email,
            'password_hash': password_hash,  # store as bytes
            'role': role,
            'user_type': role,
            'department': 'Administration' if is_admin else 'General',
            'is_admin': is_admin,
            'client_id': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = collection.insert_one(user_doc)
        user_doc['_id'] = result.inserted_id
        return user_doc

    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        collection = mongo.get_collection('users')
        return collection.find_one({'email': email})
    
    @staticmethod
    def find_all():
        """Get all users"""
        collection = mongo.get_collection('users')
        return list(collection.find({}))
    
    @staticmethod
    def verify_password(user_doc, password):
        """Verify user password"""
        if not user_doc or not user_doc.get('password_hash'):
            return False
        hash_val = user_doc['password_hash']
        if isinstance(hash_val, str):
            hash_val = hash_val.encode('utf-8')
        return bcrypt.checkpw(password.encode('utf-8'), hash_val)

    @staticmethod
    def ensure_sample_users():
        """Force recreate a default admin and test user for login"""
        try:
            collection = mongo.get_collection('users')
            # Always delete and recreate to ensure login works
            collection.delete_many({'email': {'$in': ['admin@example.com', 'testuser@example.com']}})
            print("[MongoDB] Creating sample users...")
            MongoUser.create_user('Admin', 'admin@example.com', 'admin123', role='admin', is_admin=True)
            MongoUser.create_user('Test User', 'testuser@example.com', 'testpass', role='user', is_admin=False)
            print("[MongoDB] Sample users created: admin@example.com / admin123, testuser@example.com / testpass")
        except Exception as e:
            print(f"[MongoDB] Error creating sample users: {e}")

class MongoClientModel:
    """MongoDB Client model"""
    
    @staticmethod
    def find_all():
        """Get all clients"""
        collection = mongo.get_collection('clients')
        return list(collection.find({}))
    
    @staticmethod
    def create_sample_data():
        """Create sample clients if none exist"""
        try:
            collection = mongo.get_collection('clients')
            
            if collection.count_documents({}) == 0:
                sample_clients = [
                    {
                        'name': 'Action Labs',
                        'email': 'contact@action-labs.ai',
                        'phone': '+1-555-0123',
                        'website': 'https://action-labs.ai',
                        'industry': 'Technology',
                        'contact': None,
                        'description': 'AI-powered development agency',
                        'status': 'active',
                        'created_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    },
                    {
                        'name': 'Sample Client',
                        'email': 'client@example.com',
                        'phone': '+1-555-0456',
                        'website': 'https://example.com',
                        'industry': 'Business',
                        'contact': None,
                        'description': 'Sample client for testing',
                        'status': 'active',
                        'created_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    }
                ]
                collection.insert_many(sample_clients)
                print("[MongoDB] Created sample client data")
        except Exception as e:
            print(f"[MongoDB] Error creating sample client data: {e}")

    @staticmethod
    def ensure_sample_users():
        """Force recreate a default admin and test user for login"""
        try:
            collection = mongo.get_collection('users')
            # Always delete and recreate to ensure login works
            collection.delete_many({'email': {'$in': ['admin@example.com', 'testuser@example.com']}})
            print("[MongoDB] Creating sample users...")
            MongoUser.create_user('Admin', 'admin@example.com', 'admin123', role='admin', is_admin=True)
            MongoUser.create_user('Test User', 'testuser@example.com', 'testpass', role='user', is_admin=False)
            print("[MongoDB] Sample users created: admin@example.com / admin123, testuser@example.com / testpass")
        except Exception as e:
            print(f"[MongoDB] Error creating sample users: {e}")

# Additional MongoDB collections for the application
class MongoProject:
    """MongoDB Project model"""
    
    @staticmethod
    def create_project(name, description, client_id=None, user_id=None):
        """Create a new project"""
        collection = mongo.get_collection('projects')
        project_doc = {
            'name': name,
            'description': description,
            'client_id': client_id,
            'user_id': user_id,
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = collection.insert_one(project_doc)
        project_doc['_id'] = result.inserted_id
        return project_doc
    
    @staticmethod
    def find_all():
        """Get all projects"""
        collection = mongo.get_collection('projects')
        return list(collection.find({}))

class MongoTask:
    """MongoDB Task model"""
    
    @staticmethod
    def create_task(title, description, project_id=None, user_id=None, priority='medium'):
        """Create a new task"""
        collection = mongo.get_collection('tasks')
        task_doc = {
            'title': title,
            'description': description,
            'project_id': project_id,
            'user_id': user_id,
            'priority': priority,
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = collection.insert_one(task_doc)
        task_doc['_id'] = result.inserted_id
        return task_doc
    
    @staticmethod
    def find_all():
        """Get all tasks"""
        collection = mongo.get_collection('tasks')
        return list(collection.find({}))

class MongoChannel:
    """MongoDB Channel model"""
    @staticmethod
    def create_channel(name, is_dm, member_ids, created_by):
        collection = mongo.get_collection('channels')
        channel_doc = {
            'name': name,
            'is_dm': is_dm,
            'member_ids': member_ids,  # list of user IDs (as strings)
            'created_by': created_by,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = collection.insert_one(channel_doc)
        channel_doc['_id'] = result.inserted_id
        return channel_doc

    @staticmethod
    def find_by_members(name, is_dm, member_ids):
        collection = mongo.get_collection('channels')
        # Find DM channel with exact same members and name
        return collection.find_one({'name': name, 'is_dm': is_dm, 'member_ids': member_ids})

    @staticmethod
    def find_by_user(user_id):
        collection = mongo.get_collection('channels')
        return list(collection.find({'member_ids': str(user_id)}))

    @staticmethod
    def find_by_id(channel_id):
        collection = mongo.get_collection('channels')
        return collection.find_one({'_id': ObjectId(channel_id)})

class MongoMessage:
    """MongoDB Message model"""
    @staticmethod
    def create_message(channel_id, user_id, content, parent_message_id=None, name=None):
        collection = mongo.get_collection('messages')
        msg_doc = {
            'channel_id': channel_id,
            'user_id': user_id,
            'content': content,
            'parent_message_id': parent_message_id,
            'name': name,
            'created_at': datetime.utcnow()
        }
        result = collection.insert_one(msg_doc)
        msg_doc['_id'] = result.inserted_id
        return msg_doc

    @staticmethod
    def find_by_channel(channel_id):
        collection = mongo.get_collection('messages')
        return list(collection.find({'channel_id': channel_id}).sort('created_at', 1))

class MongoMeeting:
    """MongoDB Meeting model"""
    @staticmethod
    def parse_iso_time(time_str):
        """Parse ISO format time string, handling 'Z' suffix"""
        print(f"DEBUG: parse_iso_time called with: {time_str} (type: {type(time_str)})")
        if isinstance(time_str, str):
            # Replace 'Z' with '+00:00' for proper UTC handling
            if time_str.endswith('Z'):
                time_str = time_str[:-1] + '+00:00'
            try:
                parsed = datetime.fromisoformat(time_str)
                print(f"DEBUG: Successfully parsed time: {parsed}")
                return parsed
            except ValueError as e:
                print(f"DEBUG: Failed to parse time {time_str}: {e}")
                # If it fails, return as string
                return time_str
        print(f"DEBUG: Returning time_str as-is: {time_str}")
        return time_str
    
    @staticmethod
    def create_meeting(title, reason, date, start_time, end_time, organizer_id, invitee_ids):
        collection = mongo.get_collection('meetings')
        
        print(f"DEBUG: create_meeting called with start_time={start_time}, end_time={end_time}")
        
        # Don't parse the times at all - just store them as strings
        # This will avoid the isoformat parsing error
        meeting_doc = {
            'title': title,
            'reason': reason,
            'date': date,
            'start_time': start_time,  # Store as-is
            'end_time': end_time,      # Store as-is
            'organizer_id': organizer_id,
            'invitee_ids': invitee_ids,  # list of user IDs (as strings)
            'created_at': datetime.utcnow()
        }
        result = collection.insert_one(meeting_doc)
        meeting_doc['_id'] = result.inserted_id
        print(f"DEBUG: Meeting created successfully with ID: {result.inserted_id}")
        return meeting_doc

    @staticmethod
    def find_by_user(user_id):
        collection = mongo.get_collection('meetings')
        # Ensure user_id is string for comparison
        user_id_str = str(user_id)
        query = {'$or': [
            {'organizer_id': user_id_str},
            {'invitee_ids': {'$in': [user_id_str]}},
            {'participants': {'$in': [user_id_str]}}
        ]}
        print(f"DEBUG: MongoMeeting.find_by_user query: {query}")
        result = list(collection.find(query))
        print(f"DEBUG: MongoMeeting.find_by_user result count: {len(result)}")
        return result

    @staticmethod
    def find_all():
        collection = mongo.get_collection('meetings')
        return list(collection.find({}))

class MongoContentCalendar:
    """MongoDB Content Calendar model"""
    @staticmethod
    def create_entry(client_id, title, description, content_type, platform, date, status, text_copy, hashtags, created_by, client_feedback, approval_status, files):
        collection = mongo.get_collection('content_calendar')
        entry_doc = {
            'client_id': str(client_id),
            'title': title,
            'description': description,
            'content_type': content_type,
            'platform': platform,
            'date': date,
            'status': status,
            'text_copy': text_copy,
            'hashtags': hashtags,
            'created_by': created_by,
            'client_feedback': client_feedback,
            'approval_status': approval_status,
            'files': files or [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = collection.insert_one(entry_doc)
        entry_doc['_id'] = result.inserted_id
        return entry_doc

    @staticmethod
    def find_by_client(client_id):
        collection = mongo.get_collection('content_calendar')
        return list(collection.find({'client_id': str(client_id)}))

    @staticmethod
    def update_entry(entry_id, update_data):
        collection = mongo.get_collection('content_calendar')
        collection.update_one({'_id': ObjectId(entry_id)}, {'$set': update_data})
        return collection.find_one({'_id': ObjectId(entry_id)})

    @staticmethod
    def delete_entry(entry_id):
        collection = mongo.get_collection('content_calendar')
        return collection.delete_one({'_id': ObjectId(entry_id)})

    @staticmethod
    def find_by_id(entry_id):
        collection = mongo.get_collection('content_calendar')
        return collection.find_one({'_id': ObjectId(entry_id)})


class MongoChatConversation:
    """Handle OpenAI chat conversations"""
    
    @staticmethod
    def create_conversation(user_id, title="New Chat"):
        """Create a new chat conversation"""
        conversation_data = {
            'user_id': str(user_id),
            'title': title,
            'messages': [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        collection = mongo.get_collection('chat_conversations')
        result = collection.insert_one(conversation_data)
        return collection.find_one({'_id': result.inserted_id})
    
    @staticmethod
    def get_conversation(conversation_id):
        """Get a specific conversation"""
        collection = mongo.get_collection('chat_conversations')
        return collection.find_one({'_id': ObjectId(conversation_id)})
    
    @staticmethod
    def get_user_conversations(user_id):
        """Get all conversations for a user"""
        collection = mongo.get_collection('chat_conversations')
        return list(collection.find({'user_id': str(user_id)}).sort('updated_at', -1))
    
    @staticmethod
    def add_message(conversation_id, role, content):
        """Add a message to a conversation"""
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.utcnow()
        }
        collection = mongo.get_collection('chat_conversations')
        collection.update_one(
            {'_id': ObjectId(conversation_id)},
            {
                '$push': {'messages': message},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        return collection.find_one({'_id': ObjectId(conversation_id)})
    
    @staticmethod
    def delete_conversation(conversation_id):
        """Delete a conversation"""
        collection = mongo.get_collection('chat_conversations')
        return collection.delete_one({'_id': ObjectId(conversation_id)})
    
    @staticmethod
    def update_title(conversation_id, title):
        """Update conversation title"""
        collection = mongo.get_collection('chat_conversations')
        collection.update_one(
            {'_id': ObjectId(conversation_id)},
            {'$set': {'title': title, 'updated_at': datetime.utcnow()}}
        )
        return collection.find_one({'_id': ObjectId(conversation_id)})


class MongoChatConversation:
    """Handle OpenAI chat conversations"""
    
    @staticmethod
    def create_conversation(user_id, title="New Chat"):
        """Create a new chat conversation"""
        conversation_data = {
            'user_id': str(user_id),
            'title': title,
            'messages': [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        collection = mongo.get_collection('chat_conversations')
        result = collection.insert_one(conversation_data)
        return collection.find_one({'_id': result.inserted_id})
    
    @staticmethod
    def get_conversation(conversation_id):
        """Get a specific conversation"""
        collection = mongo.get_collection('chat_conversations')
        return collection.find_one({'_id': ObjectId(conversation_id)})
    
    @staticmethod
    def get_user_conversations(user_id):
        """Get all conversations for a user"""
        collection = mongo.get_collection('chat_conversations')
        return list(collection.find({'user_id': str(user_id)}).sort('updated_at', -1))
    
    @staticmethod
    def add_message(conversation_id, role, content):
        """Add a message to a conversation"""
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.utcnow()
        }
        collection = mongo.get_collection('chat_conversations')
        collection.update_one(
            {'_id': ObjectId(conversation_id)},
            {
                '$push': {'messages': message},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        return collection.find_one({'_id': ObjectId(conversation_id)})
    
    @staticmethod
    def delete_conversation(conversation_id):
        """Delete a conversation"""
        collection = mongo.get_collection('chat_conversations')
        return collection.delete_one({'_id': ObjectId(conversation_id)})
    
    @staticmethod
    def update_title(conversation_id, title):
        """Update conversation title"""
        collection = mongo.get_collection('chat_conversations')
        collection.update_one(
            {'_id': ObjectId(conversation_id)},
            {'$set': {'title': title, 'updated_at': datetime.utcnow()}}
        )
        return collection.find_one({'_id': ObjectId(conversation_id)})


# ─── Workflow Models ──────────────────────────────────────────────────────

class MongoWorkflow:
    """MongoDB model for workflows"""
    
    @staticmethod
    def create(workflow_data):
        """Create a new workflow"""
        workflow = {
            'name': workflow_data.get('name', 'Unnamed Workflow'),
            'description': workflow_data.get('description', ''),
            'nodes': workflow_data.get('nodes', []),
            'edges': workflow_data.get('edges', []),
            'groups': workflow_data.get('groups', []),
            'variables': workflow_data.get('variables', {}),
            'settings': workflow_data.get('settings', {}),
            'tags': workflow_data.get('tags', []),
            'version': workflow_data.get('version', '1.0.0'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'created_by': workflow_data.get('created_by'),
            'is_active': True,
            'execution_count': 0,
            'last_executed': None
        }
        collection = mongo.get_collection('workflows')
        result = collection.insert_one(workflow)
        workflow['_id'] = str(result.inserted_id)
        return workflow
    
    @staticmethod
    def get_all():
        """Get all workflows"""
        collection = mongo.get_collection('workflows')
        workflows = list(collection.find({'is_active': True}).sort('updated_at', -1))
        for workflow in workflows:
            workflow['_id'] = str(workflow['_id'])
        return workflows
    
    @staticmethod
    def get_by_id(workflow_id):
        """Get workflow by ID"""
        collection = mongo.get_collection('workflows')
        workflow = collection.find_one({'_id': ObjectId(workflow_id)})
        if workflow:
            workflow['_id'] = str(workflow['_id'])
        return workflow
    
    @staticmethod
    def update(workflow_id, update_data):
        """Update workflow"""
        update_data['updated_at'] = datetime.utcnow()
        collection = mongo.get_collection('workflows')
        result = collection.update_one(
            {'_id': ObjectId(workflow_id)},
            {'$set': update_data}
        )
        if result.modified_count > 0:
            return MongoWorkflow.get_by_id(workflow_id)
        return None
    
    @staticmethod
    def delete(workflow_id):
        """Soft delete workflow"""
        collection = mongo.get_collection('workflows')
        return collection.update_one(
            {'_id': ObjectId(workflow_id)},
            {'$set': {'is_active': False, 'deleted_at': datetime.utcnow()}}
        )
    
    @staticmethod
    def increment_execution_count(workflow_id):
        """Increment execution count"""
        collection = mongo.get_collection('workflows')
        collection.update_one(
            {'_id': ObjectId(workflow_id)},
            {
                '$inc': {'execution_count': 1},
                '$set': {'last_executed': datetime.utcnow()}
            }
        )


class MongoWorkflowExecution:
    """MongoDB model for workflow executions"""
    
    @staticmethod
    def create(execution_data):
        """Create a new workflow execution"""
        execution = {
            'workflow_id': execution_data.get('workflow_id'),
            'workflow_name': execution_data.get('workflow_name'),
            'status': execution_data.get('status', 'running'),  # running, completed, failed, cancelled
            'input_data': execution_data.get('input_data', {}),
            'output_data': execution_data.get('output_data', {}),
            'execution_log': execution_data.get('execution_log', []),
            'node_statuses': execution_data.get('node_statuses', {}),
            'error_details': execution_data.get('error_details'),
            'started_at': datetime.utcnow(),
            'completed_at': execution_data.get('completed_at'),
            'duration_ms': execution_data.get('duration_ms'),
            'triggered_by': execution_data.get('triggered_by'),
            'trigger_source': execution_data.get('trigger_source', 'manual'),
            'execution_context': execution_data.get('execution_context', {}),
            'resource_usage': execution_data.get('resource_usage', {}),
            'is_active': True
        }
        collection = mongo.get_collection('workflow_executions')
        result = collection.insert_one(execution)
        execution['_id'] = str(result.inserted_id)
        return execution
    
    @staticmethod
    def get_by_workflow(workflow_id, limit=50):
        """Get executions for a workflow"""
        collection = mongo.get_collection('workflow_executions')
        executions = list(
            collection.find({'workflow_id': workflow_id})
            .sort('started_at', -1)
            .limit(limit)
        )
        for execution in executions:
            execution['_id'] = str(execution['_id'])
        return executions
    
    @staticmethod
    def get_by_id(execution_id):
        """Get execution by ID"""
        collection = mongo.get_collection('workflow_executions')
        execution = collection.find_one({'_id': ObjectId(execution_id)})
        if execution:
            execution['_id'] = str(execution['_id'])
        return execution
    
    @staticmethod
    def update_status(execution_id, status, **kwargs):
        """Update execution status"""
        update_data = {'status': status, 'updated_at': datetime.utcnow()}
        
        if status in ['completed', 'failed', 'cancelled']:
            update_data['completed_at'] = datetime.utcnow()
        
        # Add any additional fields
        update_data.update(kwargs)
        
        collection = mongo.get_collection('workflow_executions')
        result = collection.update_one(
            {'_id': ObjectId(execution_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def add_log_entry(execution_id, log_entry):
        """Add log entry to execution"""
        collection = mongo.get_collection('workflow_executions')
        collection.update_one(
            {'_id': ObjectId(execution_id)},
            {
                '$push': {'execution_log': log_entry},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
    
    @staticmethod
    def update_node_status(execution_id, node_id, status, **node_data):
        """Update individual node status"""
        update_data = {
            f'node_statuses.{node_id}.status': status,
            f'node_statuses.{node_id}.updated_at': datetime.utcnow()
        }
        
        # Add any additional node data
        for key, value in node_data.items():
            update_data[f'node_statuses.{node_id}.{key}'] = value
        
        collection = mongo.get_collection('workflow_executions')
        collection.update_one(
            {'_id': ObjectId(execution_id)},
            {'$set': update_data}
        )
    
    @staticmethod
    def get_recent_executions(limit=100):
        """Get recent executions across all workflows"""
        collection = mongo.get_collection('workflow_executions')
        executions = list(
            collection.find()
            .sort('started_at', -1)
            .limit(limit)
        )
        for execution in executions:
            execution['_id'] = str(execution['_id'])
        return executions
    
    @staticmethod
    def get_execution_stats():
        """Get execution statistics"""
        collection = mongo.get_collection('workflow_executions')
        pipeline = [
            {
                '$group': {
                    '_id': '$status',
                    'count': {'$sum': 1},
                    'avg_duration': {'$avg': '$duration_ms'}
                }
            }
        ]
        return list(collection.aggregate(pipeline))
