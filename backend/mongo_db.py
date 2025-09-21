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
    
    def is_connected(self):
        """Check if connected to MongoDB"""
        return self.db is not None
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()

# Global MongoDB instance
mongo = MongoDB()

class MongoUser:
    """MongoDB User model"""
    
    @staticmethod
    def create_user(name, email, password, role='user', is_admin=False, **additional_fields):
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
            'department': additional_fields.get('department', 'Administration' if is_admin else 'General'),
            'marketing_role': additional_fields.get('marketing_role', ''),
            'is_admin': is_admin,
            'client_id': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            # New employee fields
            'responsibilities': additional_fields.get('responsibilities', ''),
            'skills': additional_fields.get('skills', ''),
            'hours': additional_fields.get('hours', ''),
            'office_location': additional_fields.get('office_location', ''),
            'is_ai_user': additional_fields.get('is_ai_user', False),
            'start_date': additional_fields.get('start_date')
        }
        result = collection.insert_one(user_doc)
        user_doc['_id'] = result.inserted_id
        return user_doc

    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        print(f"[DEBUG] Looking for user with email: {email}")
        collection = mongo.get_collection('users')
        user = collection.find_one({'email': email})
        if user:
            print(f"[DEBUG] Found user: {user.get('name', 'NO_NAME')} with email {email}")
            print(f"[DEBUG] User has password_hash: {bool(user.get('password_hash'))}")
        else:
            print(f"[DEBUG] No user found with email: {email}")
        return user
    
    @staticmethod
    def find_all():
        """Get all users"""
        collection = mongo.get_collection('users')
        return list(collection.find({}))
    
    @staticmethod
    def verify_password(user_doc, password):
        """Verify user password"""
        email = user_doc.get('email', 'UNKNOWN') if user_doc else 'NO_USER'
        print(f"[DEBUG] Password verification for: {email}")
        
        if not user_doc:
            print(f"[DEBUG] No user document provided")
            return False
            
        if not user_doc.get('password_hash'):
            print(f"[DEBUG] User {email} has no password_hash field")
            return False
            
        hash_val = user_doc['password_hash']
        print(f"[DEBUG] User {email} hash type: {type(hash_val)}, length: {len(str(hash_val))}")
        
        if isinstance(hash_val, str):
            hash_val = hash_val.encode('utf-8')
            
        try:
            result = bcrypt.checkpw(password.encode('utf-8'), hash_val)
            print(f"[DEBUG] Password check result for {email}: {result}")
            return result
        except Exception as e:
            print(f"[ERROR] Password verification failed for {email}: {str(e)}")
            return False

    @staticmethod
    def ensure_sample_users():
        """Force recreate a default admin and test user for login"""
        try:
            collection = mongo.get_collection('users')
            # Always delete and recreate to ensure login works
            collection.delete_many({'email': {'$in': ['admin@example.com', 'testuser@example.com']}})
            print("[MongoDB] Creating sample users...")
            MongoUser.create_user('Admin', 'admin@example.com', 'admin123', role='admin', is_admin=True, department='Marketing', marketing_role='Head of Marketing')
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
            MongoUser.create_user('Admin', 'admin@example.com', 'admin123', role='admin', is_admin=True, department='Marketing', marketing_role='Head of Marketing')
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


class TaskManager:
    """Task management functions"""
    
    @staticmethod
    def create_task(task_data):
        """Create a new task"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Add metadata
            task_data.update({
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'comments': [],
                'attachments': [],
                'subtasks': task_data.get('subtasks', []),
                'status': task_data.get('status', 'pending'),
                'progress': task_data.get('progress', 0)
            })
            
            result = collection.insert_one(task_data)
            task_data['_id'] = str(result.inserted_id)
            task_data['id'] = str(result.inserted_id)
            
            print(f"[TaskManager] Created task: {task_data.get('title')}")
            return task_data
            
        except Exception as e:
            print(f"[TaskManager] Error creating task: {e}")
            return None
    
    @staticmethod
    def get_user_tasks(user_id, filters=None):
        """Get all tasks assigned to a user"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Build query
            query = {'assigned_to': user_id}
            
            # Apply filters if provided
            if filters:
                if filters.get('status'):
                    query['status'] = filters['status']
                if filters.get('priority'):
                    query['priority'] = filters['priority']
                if filters.get('category'):
                    query['category'] = filters['category']
                if filters.get('due_date_filter'):
                    # Handle date filters
                    pass
            
            tasks = list(collection.find(query).sort('created_at', -1))
            
            # Convert ObjectId to string
            for task in tasks:
                task['_id'] = str(task['_id'])
                task['id'] = str(task['_id'])
                
                # Format dates
                if 'created_at' in task:
                    task['created_at'] = task['created_at'].isoformat() if task['created_at'] else None
                if 'updated_at' in task:
                    task['updated_at'] = task['updated_at'].isoformat() if task['updated_at'] else None
                if 'due_date' in task:
                    if isinstance(task['due_date'], str):
                        task['due_date'] = task['due_date']
                    else:
                        task['due_date'] = task['due_date'].isoformat() if task['due_date'] else None
            
            print(f"[TaskManager] Retrieved {len(tasks)} tasks for user {user_id}")
            return tasks
            
        except Exception as e:
            print(f"[TaskManager] Error getting user tasks: {e}")
            return []
    
    @staticmethod
    def get_task_by_id(task_id):
        """Get a specific task by ID"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Handle both ObjectId and string IDs
            if isinstance(task_id, str) and ObjectId.is_valid(task_id):
                query = {'_id': ObjectId(task_id)}
            else:
                query = {'_id': task_id}
            
            task = collection.find_one(query)
            
            if task:
                task['_id'] = str(task['_id'])
                task['id'] = str(task['_id'])
                
                # Format dates
                if 'created_at' in task:
                    task['created_at'] = task['created_at'].isoformat() if task['created_at'] else None
                if 'updated_at' in task:
                    task['updated_at'] = task['updated_at'].isoformat() if task['updated_at'] else None
                if 'due_date' in task:
                    if isinstance(task['due_date'], str):
                        task['due_date'] = task['due_date']
                    else:
                        task['due_date'] = task['due_date'].isoformat() if task['due_date'] else None
            
            return task
            
        except Exception as e:
            print(f"[TaskManager] Error getting task {task_id}: {e}")
            return None
    
    @staticmethod
    def update_task(task_id, updates):
        """Update a task"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Add updated timestamp
            updates['updated_at'] = datetime.utcnow()
            
            # Handle both ObjectId and string IDs
            if isinstance(task_id, str) and ObjectId.is_valid(task_id):
                query = {'_id': ObjectId(task_id)}
            else:
                query = {'_id': task_id}
            
            result = collection.update_one(query, {'$set': updates})
            
            if result.modified_count > 0:
                print(f"[TaskManager] Updated task {task_id}")
                return TaskManager.get_task_by_id(task_id)
            else:
                print(f"[TaskManager] No task found with ID {task_id}")
                return None
                
        except Exception as e:
            print(f"[TaskManager] Error updating task {task_id}: {e}")
            return None
    
    @staticmethod
    def delete_task(task_id):
        """Delete a task"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Handle both ObjectId and string IDs
            if isinstance(task_id, str) and ObjectId.is_valid(task_id):
                query = {'_id': ObjectId(task_id)}
            else:
                query = {'_id': task_id}
            
            result = collection.delete_one(query)
            
            if result.deleted_count > 0:
                print(f"[TaskManager] Deleted task {task_id}")
                return True
            else:
                print(f"[TaskManager] No task found with ID {task_id}")
                return False
                
        except Exception as e:
            print(f"[TaskManager] Error deleting task {task_id}: {e}")
            return False
    
    @staticmethod
    def add_comment(task_id, comment_data):
        """Add a comment to a task"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Add metadata to comment
            comment_data.update({
                'id': str(ObjectId()),
                'timestamp': datetime.utcnow().isoformat(),
                'created_at': datetime.utcnow()
            })
            
            # Handle both ObjectId and string IDs
            if isinstance(task_id, str) and ObjectId.is_valid(task_id):
                query = {'_id': ObjectId(task_id)}
            else:
                query = {'_id': task_id}
            
            result = collection.update_one(
                query,
                {
                    '$push': {'comments': comment_data},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            
            if result.modified_count > 0:
                print(f"[TaskManager] Added comment to task {task_id}")
                return TaskManager.get_task_by_id(task_id)
            else:
                print(f"[TaskManager] No task found with ID {task_id}")
                return None
                
        except Exception as e:
            print(f"[TaskManager] Error adding comment to task {task_id}: {e}")
            return None
    
    @staticmethod
    def update_subtask(task_id, subtask_id, completed):
        """Update a subtask completion status and recalculate task progress"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Handle both ObjectId and string IDs
            if isinstance(task_id, str) and ObjectId.is_valid(task_id):
                query = {'_id': ObjectId(task_id)}
            else:
                query = {'_id': task_id}
            
            # First, update the subtask
            result = collection.update_one(
                query,
                {
                    '$set': {
                        'subtasks.$[elem].completed': completed,
                        'updated_at': datetime.utcnow()
                    }
                },
                array_filters=[{'elem.id': subtask_id}]
            )
            
            if result.modified_count > 0:
                print(f"[TaskManager] Updated subtask {subtask_id} in task {task_id}")
                
                # Get the updated task to recalculate progress
                updated_task = collection.find_one(query)
                if updated_task and 'subtasks' in updated_task:
                    subtasks = updated_task['subtasks']
                    if len(subtasks) > 0:
                        completed_count = sum(1 for st in subtasks if st.get('completed', False))
                        progress = round((completed_count / len(subtasks)) * 100)
                        
                        # Determine new status
                        new_status = updated_task.get('status', 'pending')
                        if progress == 100:
                            new_status = 'completed'
                        elif progress > 0 and new_status == 'pending':
                            new_status = 'in-progress'
                        
                        # Update progress and status
                        collection.update_one(
                            query,
                            {
                                '$set': {
                                    'progress': progress,
                                    'status': new_status,
                                    'updated_at': datetime.utcnow()
                                }
                            }
                        )
                        
                        print(f"[TaskManager] Updated task progress to {progress}% and status to {new_status}")
                
                return TaskManager.get_task_by_id(task_id)
            else:
                print(f"[TaskManager] No task/subtask found")
                return None
                
        except Exception as e:
            print(f"[TaskManager] Error updating subtask: {e}")
            return None
    
    @staticmethod
    def get_task_stats(user_id=None):
        """Get task statistics"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Build query
            query = {}
            if user_id:
                query['assigned_to'] = user_id
            
            # Get status distribution
            status_pipeline = [
                {'$match': query},
                {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
            ]
            
            # Get priority distribution
            priority_pipeline = [
                {'$match': query},
                {'$group': {'_id': '$priority', 'count': {'$sum': 1}}}
            ]
            
            status_stats = list(collection.aggregate(status_pipeline))
            priority_stats = list(collection.aggregate(priority_pipeline))
            
            return {
                'status': status_stats,
                'priority': priority_stats
            }
            
        except Exception as e:
            print(f"[TaskManager] Error getting task stats: {e}")
            return {'status': [], 'priority': []}
    
    @staticmethod
    def ensure_sample_tasks():
        """Create sample tasks for development"""
        try:
            collection = mongo.get_collection('tasks')
            
            # Check if tasks already exist
            if collection.count_documents({}) > 0:
                print("[TaskManager] Sample tasks already exist")
                return
            
            sample_tasks = [
                {
                    'title': 'Complete UI Design for Dashboard',
                    'description': 'Design and implement the new dashboard layout with improved user experience',
                    'due_date': '2025-09-25',
                    'status': 'in-progress',
                    'priority': 'high',
                    'assigned_by': 'Sarah Johnson',
                    'assigned_to': 'emergency_user_123',
                    'assigned_date': '2025-09-15',
                    'progress': 75,
                    'category': 'Design',
                    'estimated_hours': 8,
                    'subtasks': [
                        {'id': 1, 'title': 'Create wireframes', 'completed': True},
                        {'id': 2, 'title': 'Design mockups', 'completed': True},
                        {'id': 3, 'title': 'Implement responsive layout', 'completed': False}
                    ]
                },
                {
                    'title': 'Review Code Documentation',
                    'description': 'Review and update API documentation for the new features',
                    'due_date': '2025-09-20',
                    'status': 'pending',
                    'priority': 'medium',
                    'assigned_by': 'Mike Chen',
                    'assigned_to': 'emergency_user_123',
                    'assigned_date': '2025-09-10',
                    'progress': 30,
                    'category': 'Development',
                    'estimated_hours': 4,
                    'attachments': [
                        {'id': 1, 'name': 'API_Spec_v2.pdf', 'url': '#'}
                    ]
                },
                {
                    'title': 'Client Meeting Preparation',
                    'description': 'Prepare presentation materials for the quarterly client review meeting',
                    'due_date': '2025-09-19',
                    'status': 'overdue',
                    'priority': 'high',
                    'assigned_by': 'Lisa Anderson',
                    'assigned_to': 'emergency_user_123',
                    'assigned_date': '2025-09-12',
                    'progress': 60,
                    'category': 'Marketing',
                    'estimated_hours': 6,
                    'subtasks': [
                        {'id': 1, 'title': 'Create slide deck', 'completed': True},
                        {'id': 2, 'title': 'Prepare demo', 'completed': False},
                        {'id': 3, 'title': 'Schedule rehearsal', 'completed': False}
                    ]
                }
            ]
            
            for task_data in sample_tasks:
                TaskManager.create_task(task_data)
            
            print(f"[TaskManager] Created {len(sample_tasks)} sample tasks")
            
        except Exception as e:
            print(f"[TaskManager] Error creating sample tasks: {e}")

    @staticmethod
    def delete_all_tasks():
        """Delete all tasks from the database"""
        try:
            collection = mongo.get_collection('tasks')
            result = collection.delete_many({})
            print(f"[TaskManager] Deleted {result.deleted_count} tasks")
            return True
        except Exception as e:
            print(f"[TaskManager] Error deleting tasks: {e}")
            return False
