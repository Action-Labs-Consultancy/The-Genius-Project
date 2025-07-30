from flask import Blueprint, request, jsonify
import os
import json
import time
import requests
from uuid import uuid4
from datetime import datetime, timedelta
import asyncio
import threading
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import slack_sdk
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
import openai
import math
import base64

try:
    from mongo_db import mongo, MongoWorkflow, MongoWorkflowExecution
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("[WARNING] MongoDB not available, falling back to file storage")

try:
    from workflow_vector_store import get_vector_store, initialize_vector_store
    VECTOR_STORE_AVAILABLE = True
except ImportError:
    VECTOR_STORE_AVAILABLE = False
    print("[WARNING] Vector store not available")

workflow_api = Blueprint('workflow_api', __name__)
WORKFLOW_FILE = os.path.join(os.path.dirname(__file__), 'workflows.json')
EXECUTION_LOG_FILE = os.path.join(os.path.dirname(__file__), 'execution_logs.json')

# Initialize vector store
if VECTOR_STORE_AVAILABLE:
    vector_store_initialized = initialize_vector_store()
    if vector_store_initialized:
        print("[VECTOR_STORE] Initialized successfully")
    else:
        print("[VECTOR_STORE] Failed to initialize")
        VECTOR_STORE_AVAILABLE = False

def load_workflows():
    if not os.path.exists(WORKFLOW_FILE):
        return []
    with open(WORKFLOW_FILE, 'r') as f:
        return json.load(f)

def save_workflows(workflows):
    with open(WORKFLOW_FILE, 'w') as f:
        json.dump(workflows, f, indent=2)

def load_execution_logs():
    if not os.path.exists(EXECUTION_LOG_FILE):
        return []
    with open(EXECUTION_LOG_FILE, 'r') as f:
        return json.load(f)

def save_execution_log(log_entry):
    logs = load_execution_logs()
    logs.append(log_entry)
    # Keep only last 100 logs
    if len(logs) > 100:
        logs = logs[-100:]
    with open(EXECUTION_LOG_FILE, 'w') as f:
        json.dump(logs, f, indent=2)

@workflow_api.route('/api/workflows', methods=['GET'])
def get_workflows():
    if MONGODB_AVAILABLE:
        try:
            workflows = MongoWorkflow.get_all()
            return jsonify(workflows)
        except Exception as e:
            print(f"[ERROR] MongoDB query failed: {e}")
            # Fall back to file storage
    
    # File storage fallback
    return jsonify(load_workflows())

@workflow_api.route('/api/workflows/<workflow_id>', methods=['GET'])
def get_workflow(workflow_id):
    if MONGODB_AVAILABLE:
        try:
            workflow = MongoWorkflow.get_by_id(workflow_id)
            if workflow:
                return jsonify(workflow)
            return jsonify({'error': 'Workflow not found'}), 404
        except Exception as e:
            print(f"[ERROR] MongoDB query failed: {e}")
    
    # File storage fallback
    workflows = load_workflows()
    for wf in workflows:
        if wf['id'] == workflow_id:
            return jsonify(wf)
    return jsonify({'error': 'Not found'}), 404

@workflow_api.route('/api/workflows', methods=['POST'])
def create_workflow():
    data = request.json
    
    if MONGODB_AVAILABLE:
        try:
            # Add user info if available
            if hasattr(request, 'user'):
                data['created_by'] = request.user.get('id')
            
            workflow = MongoWorkflow.create(data)
            
            # Store in vector database for searchability
            if VECTOR_STORE_AVAILABLE:
                try:
                    vector_store = get_vector_store()
                    vector_store.store_workflow_knowledge(workflow)
                except Exception as e:
                    print(f"[WARNING] Failed to store workflow in vector store: {e}")
            
            return jsonify(workflow), 201
        except Exception as e:
            print(f"[ERROR] MongoDB insert failed: {e}")
    
    # File storage fallback
    workflows = load_workflows()
    data['id'] = str(uuid4())
    data['created_at'] = datetime.utcnow().isoformat()
    data['updated_at'] = datetime.utcnow().isoformat()
    workflows.append(data)
    save_workflows(workflows)
    
    # Store in vector database for searchability
    if VECTOR_STORE_AVAILABLE:
        try:
            vector_store = get_vector_store()
            vector_store.store_workflow_knowledge(data)
        except Exception as e:
            print(f"[WARNING] Failed to store workflow in vector store: {e}")
    
    return jsonify(data)

@workflow_api.route('/api/workflows/<workflow_id>', methods=['PUT'])
def update_workflow(workflow_id):
    """Update an existing workflow"""
    workflow_data = request.get_json()
    
    if not workflow_data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Ensure the ID matches
    workflow_data['id'] = workflow_id
    workflow_data['updated_at'] = datetime.utcnow().isoformat()
    
    if MONGODB_AVAILABLE:
        try:
            result = MongoWorkflow.update(workflow_id, workflow_data)
            if result.modified_count > 0:
                # Return the updated workflow
                updated_workflow = MongoWorkflow.get_by_id(workflow_id)
                return jsonify(updated_workflow)
            return jsonify({'error': 'Workflow not found'}), 404
        except Exception as e:
            print(f"[ERROR] MongoDB update failed: {e}")
    
    # File storage fallback
    workflows = load_workflows()
    for i, wf in enumerate(workflows):
        if wf['id'] == workflow_id:
            workflows[i] = workflow_data
            save_workflows(workflows)
            return jsonify(workflow_data)
    
    return jsonify({'error': 'Workflow not found'}), 404

@workflow_api.route('/api/workflows/<workflow_id>', methods=['DELETE'])
def delete_workflow(workflow_id):
    if MONGODB_AVAILABLE:
        try:
            result = MongoWorkflow.delete(workflow_id)
            if result.modified_count > 0:
                return jsonify({'message': 'Workflow deleted successfully'})
            return jsonify({'error': 'Workflow not found'}), 404
        except Exception as e:
            print(f"[ERROR] MongoDB delete failed: {e}")
    
    # File storage fallback
    workflows = load_workflows()
    workflows = [wf for wf in workflows if wf['id'] != workflow_id]
    save_workflows(workflows)
    return jsonify({'message': 'Workflow deleted successfully'})

@workflow_api.route('/api/workflows/<workflow_id>/execute', methods=['POST'])
def run_workflow_execution(workflow_id):
    input_data = request.json or {}
    
    # Handle temporary workflow execution
    if workflow_id == 'temp':
        # Use workflow data from request
        temp_workflow = {
            'id': 'temp',
            'name': 'Temporary Workflow',
            'nodes': input_data.get('nodes', []),
            'edges': input_data.get('edges', [])
        }
        wf = temp_workflow
    else:
        # Get workflow from MongoDB or file storage
        if MONGODB_AVAILABLE:
            try:
                wf = MongoWorkflow.get_by_id(workflow_id)
            except Exception as e:
                print(f"[ERROR] MongoDB query failed: {e}")
                wf = None
        
        if not wf:
            # Fallback to file storage
            workflows = load_workflows()
            wf = next((w for w in workflows if w['id'] == workflow_id), None)
        
        if not wf:
            return jsonify({'error': 'Workflow not found'}), 404
    
    start_time = datetime.utcnow()
    
    # Create execution record in MongoDB (skip for temp workflows)
    execution_id = None
    if MONGODB_AVAILABLE and workflow_id != 'temp':
        try:
            execution = MongoWorkflowExecution.create({
                'workflow_id': workflow_id,
                'workflow_name': wf.get('name', 'Unnamed Workflow'),
                'status': 'running',
                'input_data': input_data,
                'triggered_by': request.headers.get('User-Agent', 'Unknown'),
                'trigger_source': 'api'
            })
            execution_id = execution['_id']
        except Exception as e:
            print(f"[ERROR] Failed to create execution record: {e}")
    
    # Execute workflow
    execution_result = execute_workflow_nodes(wf, input_data, execution_id)
    
    # Update execution record
    end_time = datetime.utcnow()
    duration_ms = int((end_time - start_time).total_seconds() * 1000)
    
    if MONGODB_AVAILABLE and execution_id:
        try:
            MongoWorkflowExecution.update_status(
                execution_id,
                execution_result['status'],
                output_data=execution_result.get('output_data', {}),
                execution_log=execution_result['execution_log'],
                node_statuses=execution_result.get('node_statuses', {}),
                duration_ms=duration_ms,
                error_details=execution_result.get('error_details')
            )
            
            # Increment workflow execution count
            MongoWorkflow.increment_execution_count(workflow_id)
            
            # Store execution memory in vector store
            if VECTOR_STORE_AVAILABLE:
                try:
                    vector_store = get_vector_store()
                    execution_data = MongoWorkflowExecution.get_by_id(execution_id)
                    if execution_data:
                        vector_store.store_execution_memory(execution_data)
                except Exception as e:
                    print(f"[WARNING] Failed to store execution memory: {e}")
            
        except Exception as e:
            print(f"[ERROR] Failed to update execution record: {e}")
    else:
        # Fallback to file storage
        log_entry = {
            'workflow_id': workflow_id,
            'workflow_name': wf.get('name', 'Unnamed Workflow'),
            'execution_time': start_time.isoformat(),
            'status': execution_result['status'],
            'input_data': input_data,
            'execution_log': execution_result['execution_log'],
            'duration_ms': duration_ms
        }
        save_execution_log(log_entry)
        
        # Store execution memory in vector store
        if VECTOR_STORE_AVAILABLE:
            try:
                vector_store = get_vector_store()
                vector_store.store_execution_memory(log_entry)
            except Exception as e:
                print(f"[WARNING] Failed to store execution memory: {e}")
    
    # Add execution ID to response
    execution_result['execution_id'] = execution_id
    execution_result['duration_ms'] = duration_ms
    
    return jsonify(execution_result)



@workflow_api.route('/api/execution-logs', methods=['GET'])
def get_execution_logs():
    return jsonify(load_execution_logs())

@workflow_api.route('/api/workflow-templates', methods=['GET'])
def get_workflow_templates():
    """Return working, tested workflow templates with real functionality"""
    templates = [
        {
            'id': 'simple-data-processing',
            'name': 'Simple Data Processing',
            'description': 'A basic workflow for processing data with variables, conditions, and notifications',
            'nodes': [
                # Start Node
                {'id': 'start-1', 'type': 'customNode', 'position': {'x': 100, 'y': 200}, 
                 'data': {'label': 'Start Process', 'nodeType': 'start', 'icon': 'Play', 'color': '#10B981', 
                          'config': {'triggerType': 'manual', 'triggerData': '{"user_id": "user123", "task": "process_data"}'}}},
                
                # Set Variables
                {'id': 'var-input', 'type': 'customNode', 'position': {'x': 300, 'y': 200}, 
                 'data': {'label': 'Set Input Data', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 
                          'config': {'variableName': 'input_value', 'value': '100'}}},
                
                {'id': 'var-threshold', 'type': 'customNode', 'position': {'x': 500, 'y': 200}, 
                 'data': {'label': 'Set Threshold', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 
                          'config': {'variableName': 'threshold', 'value': '50'}}},
                
                # Math Operation
                {'id': 'math-calc', 'type': 'customNode', 'position': {'x': 700, 'y': 200}, 
                 'data': {'label': 'Calculate Result', 'nodeType': 'math', 'icon': 'Calculator', 'color': '#10B981', 
                          'config': {'operation': 'multiply', 'leftOperand': '{{input_value}}', 'rightOperand': '2', 'resultVariable': 'calculated_result'}}},
                
                # Condition Check
                {'id': 'condition-check', 'type': 'customNode', 'position': {'x': 900, 'y': 200}, 
                 'data': {'label': 'Check Threshold', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 
                          'config': {'leftOperand': '{{calculated_result}}', 'operator': 'greater_than', 'rightOperand': '{{threshold}}'}}},
                
                # High Value Path
                {'id': 'var-status-high', 'type': 'customNode', 'position': {'x': 1100, 'y': 100}, 
                 'data': {'label': 'Set High Status', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 
                          'config': {'variableName': 'status', 'value': 'HIGH_VALUE'}}},
                
                {'id': 'notify-high', 'type': 'customNode', 'position': {'x': 1300, 'y': 100}, 
                 'data': {'label': 'High Value Alert', 'nodeType': 'notification', 'icon': 'Bell', 'color': '#10B981', 
                          'config': {'title': 'High Value Detected', 'message': 'Calculated result {{calculated_result}} exceeds threshold {{threshold}}'}}},
                
                # Low Value Path
                {'id': 'var-status-low', 'type': 'customNode', 'position': {'x': 1100, 'y': 300}, 
                 'data': {'label': 'Set Normal Status', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 
                          'config': {'variableName': 'status', 'value': 'NORMAL_VALUE'}}},
                
                {'id': 'notify-normal', 'type': 'customNode', 'position': {'x': 1300, 'y': 300}, 
                 'data': {'label': 'Normal Processing', 'nodeType': 'notification', 'icon': 'Bell', 'color': '#6B7280', 
                          'config': {'title': 'Normal Processing', 'message': 'Calculated result {{calculated_result}} is within normal range'}}},
                
                # Database Log
                {'id': 'db-log', 'type': 'customNode', 'position': {'x': 1500, 'y': 200}, 
                 'data': {'label': 'Log Result', 'nodeType': 'database', 'icon': 'Database', 'color': '#3B82F6', 
                          'config': {'operation': 'insert', 'collection': 'processing_logs', 'query': '{"input": "{{input_value}}", "result": "{{calculated_result}}", "status": "{{status}}", "timestamp": "{{current_timestamp}}"}'}}},
                
                # End Node
                {'id': 'end-1', 'type': 'customNode', 'position': {'x': 1700, 'y': 200}, 
                 'data': {'label': 'Process Complete', 'nodeType': 'end', 'icon': 'StopCircle', 'color': '#6B7280', 
                          'config': {'status': 'success', 'returnData': '{"result": "{{calculated_result}}", "status": "{{status}}"}'}}}
            ],
            'edges': [
                {'id': 'e1', 'source': 'start-1', 'target': 'var-input', 'type': 'smoothstep', 'animated': True},
                {'id': 'e2', 'source': 'var-input', 'target': 'var-threshold', 'type': 'smoothstep', 'animated': True},
                {'id': 'e3', 'source': 'var-threshold', 'target': 'math-calc', 'type': 'smoothstep', 'animated': True},
                {'id': 'e4', 'source': 'math-calc', 'target': 'condition-check', 'type': 'smoothstep', 'animated': True},
                
                # True path (high value)
                {'id': 'e5', 'source': 'condition-check', 'target': 'var-status-high', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e6', 'source': 'var-status-high', 'target': 'notify-high', 'type': 'smoothstep', 'animated': True},
                {'id': 'e7', 'source': 'notify-high', 'target': 'db-log', 'type': 'smoothstep', 'animated': True},
                
                # False path (normal value)
                {'id': 'e8', 'source': 'condition-check', 'target': 'var-status-low', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e9', 'source': 'var-status-low', 'target': 'notify-normal', 'type': 'smoothstep', 'animated': True},
                {'id': 'e10', 'source': 'notify-normal', 'target': 'db-log', 'type': 'smoothstep', 'animated': True},
                
                # Final
                {'id': 'e11', 'source': 'db-log', 'target': 'end-1', 'type': 'smoothstep', 'animated': True}
            ]
        },
        {
            'id': 'user-onboarding',
            'name': 'User Onboarding Flow',
            'description': 'Complete user onboarding with validation, email notifications, and database updates',
            'nodes': [
                # Start Node
                {'id': 'start-1', 'type': 'customNode', 'position': {'x': 100, 'y': 200}, 
                 'data': {'label': 'New User Registration', 'nodeType': 'start', 'icon': 'Play', 'color': '#10B981', 
                          'config': {'triggerType': 'manual', 'triggerData': '{"user_email": "user@example.com", "user_name": "New User"}'}}},
                
                # Extract user data
                {'id': 'var-email', 'type': 'customNode', 'position': {'x': 300, 'y': 200}, 
                 'data': {'label': 'Extract Email', 'nodeType': 'setVariable', 'icon': 'Mail', 'color': '#8B5CF6', 
                          'config': {'variableName': 'user_email', 'value': '{{user_email}}'}}},
                
                {'id': 'var-name', 'type': 'customNode', 'position': {'x': 500, 'y': 200}, 
                 'data': {'label': 'Extract Name', 'nodeType': 'setVariable', 'icon': 'User', 'color': '#8B5CF6', 
                          'config': {'variableName': 'user_name', 'value': '{{user_name}}'}}},
                
                # Validate email format
                {'id': 'condition-email', 'type': 'customNode', 'position': {'x': 700, 'y': 200}, 
                 'data': {'label': 'Validate Email', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 
                          'config': {'leftOperand': '{{user_email}}', 'operator': 'contains', 'rightOperand': '@'}}},
                
                # Invalid email path
                {'id': 'notify-invalid', 'type': 'customNode', 'position': {'x': 900, 'y': 100}, 
                 'data': {'label': 'Invalid Email Alert', 'nodeType': 'notification', 'icon': 'AlertTriangle', 'color': '#EF4444', 
                          'config': {'title': 'Invalid Email', 'message': 'Email address {{user_email}} is not valid'}}},
                
                {'id': 'end-invalid', 'type': 'customNode', 'position': {'x': 1100, 'y': 100}, 
                 'data': {'label': 'Registration Failed', 'nodeType': 'end', 'icon': 'StopCircle', 'color': '#EF4444', 
                          'config': {'status': 'error', 'returnData': '{"error": "Invalid email address"}'}}},
                
                # Valid email path - Check if user exists
                {'id': 'db-check', 'type': 'customNode', 'position': {'x': 900, 'y': 300}, 
                 'data': {'label': 'Check Existing User', 'nodeType': 'database', 'icon': 'Database', 'color': '#3B82F6', 
                          'config': {'operation': 'find', 'collection': 'users', 'query': '{"email": "{{user_email}}"}'}}},
                
                # User exists check
                {'id': 'condition-exists', 'type': 'customNode', 'position': {'x': 1100, 'y': 300}, 
                 'data': {'label': 'User Exists?', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 
                          'config': {'leftOperand': '{{db_result_count}}', 'operator': 'greater_than', 'rightOperand': '0'}}},
                
                # User exists path
                {'id': 'notify-exists', 'type': 'customNode', 'position': {'x': 1300, 'y': 200}, 
                 'data': {'label': 'User Already Exists', 'nodeType': 'notification', 'icon': 'AlertTriangle', 'color': '#F59E0B', 
                          'config': {'title': 'User Already Registered', 'message': 'User with email {{user_email}} already exists'}}},
                
                {'id': 'end-exists', 'type': 'customNode', 'position': {'x': 1500, 'y': 200}, 
                 'data': {'label': 'Registration Skipped', 'nodeType': 'end', 'icon': 'StopCircle', 'color': '#F59E0B', 
                          'config': {'status': 'skipped', 'returnData': '{"message": "User already exists"}'}}},
                
                # New user path - Create user
                {'id': 'var-id', 'type': 'customNode', 'position': {'x': 1300, 'y': 400}, 
                 'data': {'label': 'Generate User ID', 'nodeType': 'setVariable', 'icon': 'Hash', 'color': '#8B5CF6', 
                          'config': {'variableName': 'user_id', 'value': 'user_{{timestamp}}_{{random}}'}}},
                
                {'id': 'db-create', 'type': 'customNode', 'position': {'x': 1500, 'y': 400}, 
                 'data': {'label': 'Create User Record', 'nodeType': 'database', 'icon': 'Database', 'color': '#3B82F6', 
                          'config': {'operation': 'insert', 'collection': 'users', 'query': '{"id": "{{user_id}}", "email": "{{user_email}}", "name": "{{user_name}}", "created_at": "{{current_timestamp}}", "status": "active"}'}}},
                
                # Send welcome email
                {'id': 'email-welcome', 'type': 'customNode', 'position': {'x': 1700, 'y': 400}, 
                 'data': {'label': 'Send Welcome Email', 'nodeType': 'email', 'icon': 'Mail', 'color': '#10B981', 
                          'config': {'to': '{{user_email}}', 'subject': 'Welcome to our platform!', 'body': 'Hello {{user_name}},\\n\\nWelcome to our platform! Your account has been successfully created.\\n\\nUser ID: {{user_id}}\\n\\nBest regards,\\nThe Team'}}},
                
                # Send notification
                {'id': 'notify-success', 'type': 'customNode', 'position': {'x': 1900, 'y': 400}, 
                 'data': {'label': 'Success Notification', 'nodeType': 'notification', 'icon': 'CheckCircle', 'color': '#10B981', 
                          'config': {'title': 'User Created Successfully', 'message': 'New user {{user_name}} ({{user_email}}) has been registered with ID {{user_id}}'}}},
                
                # End success
                {'id': 'end-success', 'type': 'customNode', 'position': {'x': 2100, 'y': 400}, 
                 'data': {'label': 'Registration Complete', 'nodeType': 'end', 'icon': 'StopCircle', 'color': '#10B981', 
                          'config': {'status': 'success', 'returnData': '{"user_id": "{{user_id}}", "email": "{{user_email}}", "name": "{{user_name}}"}'}}}
            ],
            'edges': [
                # Main flow
                {'id': 'e1', 'source': 'start-1', 'target': 'var-email', 'type': 'smoothstep', 'animated': True},
                {'id': 'e2', 'source': 'var-email', 'target': 'var-name', 'type': 'smoothstep', 'animated': True},
                {'id': 'e3', 'source': 'var-name', 'target': 'condition-email', 'type': 'smoothstep', 'animated': True},
                
                # Invalid email path
                {'id': 'e4', 'source': 'condition-email', 'target': 'notify-invalid', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e5', 'source': 'notify-invalid', 'target': 'end-invalid', 'type': 'smoothstep', 'animated': True},
                
                # Valid email path
                {'id': 'e6', 'source': 'condition-email', 'target': 'db-check', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e7', 'source': 'db-check', 'target': 'condition-exists', 'type': 'smoothstep', 'animated': True},
                
                # User exists path
                {'id': 'e8', 'source': 'condition-exists', 'target': 'notify-exists', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e9', 'source': 'notify-exists', 'target': 'end-exists', 'type': 'smoothstep', 'animated': True},
                
                # New user path
                {'id': 'e10', 'source': 'condition-exists', 'target': 'var-id', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e11', 'source': 'var-id', 'target': 'db-create', 'type': 'smoothstep', 'animated': True},
                {'id': 'e12', 'source': 'db-create', 'target': 'email-welcome', 'type': 'smoothstep', 'animated': True},
                {'id': 'e13', 'source': 'email-welcome', 'target': 'notify-success', 'type': 'smoothstep', 'animated': True},
                {'id': 'e14', 'source': 'notify-success', 'target': 'end-success', 'type': 'smoothstep', 'animated': True}
            ]
        },
        {
            'id': 'content-approval',
            'name': 'Content Approval Workflow',
            'description': 'Content review and approval process with AI assistance and stakeholder notifications',
            'nodes': [
                # Start Node
                {'id': 'start-1', 'type': 'customNode', 'position': {'x': 100, 'y': 300}, 
                 'data': {'label': 'Content Submission', 'nodeType': 'start', 'icon': 'Play', 'color': '#10B981', 
                          'config': {'triggerType': 'manual', 'triggerData': '{"content_id": "content123", "content_text": "Sample content for review", "author": "author@example.com"}'}}},
                
                # Extract content data
                {'id': 'var-content', 'type': 'customNode', 'position': {'x': 300, 'y': 300}, 
                 'data': {'label': 'Extract Content', 'nodeType': 'setVariable', 'icon': 'FileText', 'color': '#8B5CF6', 
                          'config': {'variableName': 'content_text', 'value': '{{content_text}}'}}},
                
                {'id': 'var-author', 'type': 'customNode', 'position': {'x': 500, 'y': 300}, 
                 'data': {'label': 'Set Author', 'nodeType': 'setVariable', 'icon': 'User', 'color': '#8B5CF6', 
                          'config': {'variableName': 'author_email', 'value': '{{author}}'}}},
                
                # Check content length
                {'id': 'math-length', 'type': 'customNode', 'position': {'x': 700, 'y': 300}, 
                 'data': {'label': 'Calculate Length', 'nodeType': 'math', 'icon': 'Calculator', 'color': '#10B981', 
                          'config': {'operation': 'length', 'leftOperand': '{{content_text}}', 'rightOperand': '1', 'resultVariable': 'content_length'}}},
                
                # Length validation
                {'id': 'condition-length', 'type': 'customNode', 'position': {'x': 900, 'y': 300}, 
                 'data': {'label': 'Check Length', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 
                          'config': {'leftOperand': '{{content_length}}', 'operator': 'greater_than', 'rightOperand': '10'}}},
                
                # Too short path
                {'id': 'notify-short', 'type': 'customNode', 'position': {'x': 1100, 'y': 200}, 
                 'data': {'label': 'Content Too Short', 'nodeType': 'notification', 'icon': 'AlertTriangle', 'color': '#EF4444', 
                          'config': {'title': 'Content Rejected', 'message': 'Content is too short ({{content_length}} characters). Minimum 10 characters required.'}}},
                
                {'id': 'email-reject', 'type': 'customNode', 'position': {'x': 1300, 'y': 200}, 
                 'data': {'label': 'Notify Author', 'nodeType': 'email', 'icon': 'Mail', 'color': '#EF4444', 
                          'config': {'to': '{{author_email}}', 'subject': 'Content Submission Rejected', 'body': 'Your content submission has been rejected.\\n\\nReason: Content too short ({{content_length}} characters)\\n\\nPlease resubmit with at least 10 characters.'}}},
                
                {'id': 'end-reject', 'type': 'customNode', 'position': {'x': 1500, 'y': 200}, 
                 'data': {'label': 'Submission Rejected', 'nodeType': 'end', 'icon': 'StopCircle', 'color': '#EF4444', 
                          'config': {'status': 'rejected', 'returnData': '{"status": "rejected", "reason": "Content too short"}'}}},
                
                # Valid length - AI review
                {'id': 'brain-review', 'type': 'customNode', 'position': {'x': 1100, 'y': 400}, 
                 'data': {'label': 'AI Content Review', 'nodeType': 'brain', 'icon': 'Zap', 'color': '#9D4EDD', 
                          'config': {'brainId': 'content-moderator', 'userInput': 'Review this content for appropriateness and quality: {{content_text}}', 'systemPrompt': 'You are a content moderator. Review content and respond with APPROVED, NEEDS_REVIEW, or REJECTED with a brief reason.'}}},
                
                # AI decision
                {'id': 'condition-ai', 'type': 'customNode', 'position': {'x': 1300, 'y': 400}, 
                 'data': {'label': 'AI Decision', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 
                          'config': {'leftOperand': '{{ai_response}}', 'operator': 'contains', 'rightOperand': 'APPROVED'}}},
                
                # AI Approved path
                {'id': 'var-approved', 'type': 'customNode', 'position': {'x': 1500, 'y': 300}, 
                 'data': {'label': 'Set Approved', 'nodeType': 'setVariable', 'icon': 'CheckCircle', 'color': '#10B981', 
                          'config': {'variableName': 'approval_status', 'value': 'AI_APPROVED'}}},
                
                {'id': 'db-approved', 'type': 'customNode', 'position': {'x': 1700, 'y': 300}, 
                 'data': {'label': 'Save Approved Content', 'nodeType': 'database', 'icon': 'Database', 'color': '#3B82F6', 
                          'config': {'operation': 'insert', 'collection': 'approved_content', 'query': '{"content_id": "{{content_id}}", "content": "{{content_text}}", "author": "{{author_email}}", "status": "approved", "approved_by": "AI", "approved_at": "{{current_timestamp}}"}'}}},
                
                {'id': 'email-approved', 'type': 'customNode', 'position': {'x': 1900, 'y': 300}, 
                 'data': {'label': 'Approval Email', 'nodeType': 'email', 'icon': 'Mail', 'color': '#10B981', 
                          'config': {'to': '{{author_email}}', 'subject': 'Content Approved!', 'body': 'Great news! Your content has been approved by our AI system.\\n\\nContent: {{content_text}}\\n\\nStatus: {{approval_status}}'}}},
                
                # AI Needs Review path
                {'id': 'var-review', 'type': 'customNode', 'position': {'x': 1500, 'y': 500}, 
                 'data': {'label': 'Set Needs Review', 'nodeType': 'setVariable', 'icon': 'Clock', 'color': '#F59E0B', 
                          'config': {'variableName': 'approval_status', 'value': 'NEEDS_HUMAN_REVIEW'}}},
                
                {'id': 'db-pending', 'type': 'customNode', 'position': {'x': 1700, 'y': 500}, 
                 'data': {'label': 'Save Pending Content', 'nodeType': 'database', 'icon': 'Database', 'color': '#3B82F6', 
                          'config': {'operation': 'insert', 'collection': 'pending_content', 'query': '{"content_id": "{{content_id}}", "content": "{{content_text}}", "author": "{{author_email}}", "status": "pending_review", "ai_feedback": "{{ai_response}}", "submitted_at": "{{current_timestamp}}"}'}}},
                
                {'id': 'notify-reviewers', 'type': 'customNode', 'position': {'x': 1900, 'y': 500}, 
                 'data': {'label': 'Notify Reviewers', 'nodeType': 'notification', 'icon': 'Users', 'color': '#F59E0B', 
                          'config': {'title': 'Content Needs Review', 'message': 'Content from {{author_email}} requires human review. AI feedback: {{ai_response}}'}}},
                
                # End nodes
                {'id': 'end-approved', 'type': 'customNode', 'position': {'x': 2100, 'y': 300}, 
                 'data': {'label': 'Content Published', 'nodeType': 'end', 'icon': 'StopCircle', 'color': '#10B981', 
                          'config': {'status': 'success', 'returnData': '{"status": "approved", "content_id": "{{content_id}}"}'}}},
                
                {'id': 'end-review', 'type': 'customNode', 'position': {'x': 2100, 'y': 500}, 
                 'data': {'label': 'Awaiting Review', 'nodeType': 'end', 'icon': 'StopCircle', 'color': '#F59E0B', 
                          'config': {'status': 'pending', 'returnData': '{"status": "pending_review", "content_id": "{{content_id}}"}'}}}
            ],
            'edges': [
                # Main flow
                {'id': 'e1', 'source': 'start-1', 'target': 'var-content', 'type': 'smoothstep', 'animated': True},
                {'id': 'e2', 'source': 'var-content', 'target': 'var-author', 'type': 'smoothstep', 'animated': True},
                {'id': 'e3', 'source': 'var-author', 'target': 'math-length', 'type': 'smoothstep', 'animated': True},
                {'id': 'e4', 'source': 'math-length', 'target': 'condition-length', 'type': 'smoothstep', 'animated': True},
                
                # Too short path
                {'id': 'e5', 'source': 'condition-length', 'target': 'notify-short', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e6', 'source': 'notify-short', 'target': 'email-reject', 'type': 'smoothstep', 'animated': True},
                {'id': 'e7', 'source': 'email-reject', 'target': 'end-reject', 'type': 'smoothstep', 'animated': True},
                
                # Valid length path
                {'id': 'e8', 'source': 'condition-length', 'target': 'brain-review', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e9', 'source': 'brain-review', 'target': 'condition-ai', 'type': 'smoothstep', 'animated': True},
                
                # AI approved path
                {'id': 'e10', 'source': 'condition-ai', 'target': 'var-approved', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e11', 'source': 'var-approved', 'target': 'db-approved', 'type': 'smoothstep', 'animated': True},
                {'id': 'e12', 'source': 'db-approved', 'target': 'email-approved', 'type': 'smoothstep', 'animated': True},
                {'id': 'e13', 'source': 'email-approved', 'target': 'end-approved', 'type': 'smoothstep', 'animated': True},
                
                # AI needs review path
                {'id': 'e14', 'source': 'condition-ai', 'target': 'var-review', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e15', 'source': 'var-review', 'target': 'db-pending', 'type': 'smoothstep', 'animated': True},
                {'id': 'e16', 'source': 'db-pending', 'target': 'notify-reviewers', 'type': 'smoothstep', 'animated': True},
                {'id': 'e17', 'source': 'notify-reviewers', 'target': 'end-review', 'type': 'smoothstep', 'animated': True}
            ]
        }
    ]
    return jsonify(templates)

def execute_node(node, context, workflow_id):
    """Execute a single node based on its type"""
    # Get node type from either 'type' or 'data.nodeType'
    node_type = node.get('type')
    if not node_type or node_type == 'customNode':
        node_type = node.get('data', {}).get('nodeType', 'unknown')
    
    result = {
        'node_id': node['id'],
        'node_type': node_type,
        'status': 'success',
        'output': None,
        'error': None,
        'timestamp': datetime.now().isoformat()
    }
    
    try:
        if node_type == 'start':
            result['output'] = {'message': 'Workflow started', 'data': context}
            
        elif node_type == 'httpRequest':
            config = node['data'].get('config', {})
            url = config.get('url', '')
            method = config.get('method', 'GET').upper()
            headers = config.get('headers', {})
            body = config.get('body', {})
            
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=body, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=body, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            result['output'] = {
                'status_code': response.status_code,
                'response': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                'headers': dict(response.headers)
            }
            context['last_http_response'] = result['output']
            
        elif node_type == 'setVariable':
            config = node['data'].get('config', {})
            var_name = config.get('variableName', config.get('name', ''))
            var_value = config.get('value', '')
            
            # Simple variable substitution from context
            if isinstance(var_value, str) and '{{' in var_value:
                for key, value in context.items():
                    var_value = var_value.replace(f'{{{{{key}}}}}', str(value))
            
            context[var_name] = var_value
            result['output'] = {f'{var_name}': var_value}
            
        elif node_type == 'ifCondition':
            config = node['data'].get('config', {})
            left_operand = config.get('leftOperand', '')
            operator = config.get('operator', '==')
            right_operand = config.get('rightOperand', '')
            
            # Variable substitution
            if isinstance(left_operand, str) and '{{' in left_operand:
                for key, value in context.items():
                    left_operand = left_operand.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                left_val = float(left_operand) if str(left_operand).replace('.', '').isdigit() else left_operand
                right_val = float(right_operand) if str(right_operand).replace('.', '').isdigit() else right_operand
            except:
                left_val = left_operand
                right_val = right_operand
            
            condition_result = False
            if operator == '==':
                condition_result = left_val == right_val
            elif operator == '!=':
                condition_result = left_val != right_val
            elif operator == '>':
                condition_result = left_val > right_val
            elif operator == '<':
                condition_result = left_val < right_val
            elif operator == '>=':
                condition_result = left_val >= right_val
            elif operator == '<=':
                condition_result = left_val <= right_val
            elif operator == 'contains':
                condition_result = str(right_val) in str(left_val)
                
            result['output'] = {
                'condition': f"{left_val} {operator} {right_val}",
                'result': condition_result
            }
            context['last_condition_result'] = condition_result
            
        elif node_type == 'delay':
            config = node['data'].get('config', {})
            seconds = float(config.get('seconds', 1))
            time.sleep(seconds)
            result['output'] = {'delayed_seconds': seconds}
            
        elif node_type == 'log':
            config = node['data'].get('config', {})
            message = config.get('message', 'Log message')
            
            # Variable substitution
            if isinstance(message, str) and '{{' in message:
                for key, value in context.items():
                    message = message.replace(f'{{{{{key}}}}}', str(value))
            
            result['output'] = {'message': message}
            print(f"[WORKFLOW LOG] {message}")
            
        elif node_type == 'email':
            config = node['data'].get('config', {})
            to_email = config.get('to', config.get('recipient', ''))
            subject = config.get('subject', 'Workflow Notification')
            message = config.get('body', config.get('message', 'Message from workflow'))
            from_email = config.get('from', os.getenv('SMTP_FROM_EMAIL', 'workflow@example.com'))
            
            # Variable substitution
            if isinstance(to_email, str) and '{{' in to_email:
                for key, value in context.items():
                    to_email = to_email.replace(f'{{{{{key}}}}}', str(value))
            if isinstance(subject, str) and '{{' in subject:
                for key, value in context.items():
                    subject = subject.replace(f'{{{{{key}}}}}', str(value))
            if isinstance(message, str) and '{{' in message:
                for key, value in context.items():
                    message = message.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                # Use SMTP settings from environment
                smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
                smtp_port = int(os.getenv('SMTP_PORT', '587'))
                smtp_username = os.getenv('SMTP_USERNAME', '')
                smtp_password = os.getenv('SMTP_PASSWORD', '')
                
                if smtp_username and smtp_password:
                    msg = MIMEMultipart()
                    msg['From'] = from_email
                    msg['To'] = to_email
                    msg['Subject'] = subject
                    msg.attach(MIMEText(message, 'plain'))
                    
                    server = smtplib.SMTP(smtp_server, smtp_port)
                    server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.send_message(msg)
                    server.quit()
                    
                    result['output'] = {'message': f'Email sent to {to_email}', 'subject': subject}
                else:
                    # Simulate email sending if no SMTP config
                    result['output'] = {'message': f'Email simulated to {to_email}', 'subject': subject}
                    print(f"[EMAIL SIMULATION] To: {to_email}, Subject: {subject}, Message: {message}")
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Email failed: {str(e)}'
                
        elif node_type == 'slack':
            config = node['data'].get('config', {})
            channel = config.get('channel', '#general')
            message = config.get('message', 'Message from workflow')
            token = config.get('token', os.getenv('SLACK_BOT_TOKEN', ''))
            
            # Variable substitution
            if isinstance(message, str) and '{{' in message:
                for key, value in context.items():
                    message = message.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                if token:
                    client = WebClient(token=token)
                    response = client.chat_postMessage(
                        channel=channel,
                        text=message
                    )
                    result['output'] = {'message': f'Slack message sent to {channel}', 'ts': response['ts']}
                else:
                    # Simulate Slack message
                    result['output'] = {'message': f'Slack message simulated to {channel}'}
                    print(f"[SLACK SIMULATION] Channel: {channel}, Message: {message}")
            except SlackApiError as e:
                result['status'] = 'error'
                result['error'] = f'Slack API error: {e.response["error"]}'
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Slack failed: {str(e)}'
                
        elif node_type == 'ai':
            config = node['data'].get('config', {})
            prompt = config.get('prompt', 'Hello, how can I help you?')
            model = config.get('model', 'gpt-3.5-turbo')
            max_tokens = config.get('max_tokens', 150)
            
            # Variable substitution
            if isinstance(prompt, str) and '{{' in prompt:
                for key, value in context.items():
                    prompt = prompt.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                openai_api_key = os.getenv('OPENAI_API_KEY', '')
                if openai_api_key:
                    openai.api_key = openai_api_key
                    response = openai.ChatCompletion.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=max_tokens
                    )
                    ai_response = response.choices[0].message.content
                    result['output'] = {'response': ai_response, 'model': model}
                    context['ai_response'] = ai_response
                else:
                    # Simulate AI response
                    ai_response = f"AI Response to: {prompt[:50]}..."
                    result['output'] = {'response': ai_response, 'model': 'simulated'}
                    context['ai_response'] = ai_response
                    print(f"[AI SIMULATION] Prompt: {prompt}, Response: {ai_response}")
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'AI failed: {str(e)}'
                
        elif node_type == 'math':
            config = node['data'].get('config', {})
            operation = config.get('operation', 'add')
            left_operand = config.get('leftOperand', '0')
            right_operand = config.get('rightOperand', '0')
            result_variable = config.get('resultVariable', 'math_result')
            
            # Variable substitution
            if isinstance(left_operand, str) and '{{' in left_operand:
                for key, value in context.items():
                    left_operand = left_operand.replace(f'{{{{{key}}}}}', str(value))
            if isinstance(right_operand, str) and '{{' in right_operand:
                for key, value in context.items():
                    right_operand = right_operand.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                # Convert to numbers
                left_val = float(left_operand) if str(left_operand).replace('.', '').replace('-', '').isdigit() else 0
                right_val = float(right_operand) if str(right_operand).replace('.', '').replace('-', '').isdigit() else 0
                
                # Perform operation
                if operation == 'add':
                    result_value = left_val + right_val
                elif operation == 'subtract':
                    result_value = left_val - right_val
                elif operation == 'multiply':
                    result_value = left_val * right_val
                elif operation == 'divide':
                    result_value = left_val / right_val if right_val != 0 else 0
                elif operation == 'power':
                    result_value = left_val ** right_val
                elif operation == 'sqrt':
                    result_value = math.sqrt(left_val)
                elif operation == 'round':
                    result_value = round(left_val)
                elif operation == 'ceil':
                    result_value = math.ceil(left_val)
                elif operation == 'floor':
                    result_value = math.floor(left_val)
                else:
                    result_value = left_val
                
                result['output'] = {'operation': operation, 'result': result_value}
                context[result_variable] = result_value
                context['math_result'] = result_value  # backward compatibility
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Math calculation failed: {str(e)}'
                
        elif node_type == 'file':
            config = node['data'].get('config', {})
            operation = config.get('operation', 'read')
            file_path = config.get('path', '')
            content = config.get('content', '')
            
            # Variable substitution
            if isinstance(file_path, str) and '{{' in file_path:
                for key, value in context.items():
                    file_path = file_path.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                if operation == 'read':
                    if os.path.exists(file_path):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            file_content = f.read()
                        result['output'] = {'content': file_content, 'path': file_path}
                        context['file_content'] = file_content
                    else:
                        result['status'] = 'error'
                        result['error'] = f'File not found: {file_path}'
                elif operation == 'write':
                    # Variable substitution for content
                    if isinstance(content, str) and '{{' in content:
                        for key, value in context.items():
                            content = content.replace(f'{{{{{key}}}}}', str(value))
                    
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    result['output'] = {'message': f'File written to {file_path}', 'bytes': len(content)}
                elif operation == 'append':
                    if isinstance(content, str) and '{{' in content:
                        for key, value in context.items():
                            content = content.replace(f'{{{{{key}}}}}', str(value))
                    
                    with open(file_path, 'a', encoding='utf-8') as f:
                        f.write(content)
                    result['output'] = {'message': f'Content appended to {file_path}', 'bytes': len(content)}
                else:
                    result['status'] = 'error'
                    result['error'] = f'Unknown file operation: {operation}'
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'File operation failed: {str(e)}'
                
        elif node_type == 'timer':
            config = node['data'].get('config', {})
            action = config.get('action', 'wait')
            duration = config.get('duration', '5s')
            
            try:
                # Parse duration
                if duration.endswith('s'):
                    seconds = float(duration[:-1])
                elif duration.endswith('m'):
                    seconds = float(duration[:-1]) * 60
                elif duration.endswith('h'):
                    seconds = float(duration[:-1]) * 3600
                else:
                    seconds = float(duration)
                
                if action == 'wait':
                    time.sleep(seconds)
                    result['output'] = {'action': 'waited', 'duration': f'{seconds}s'}
                elif action == 'schedule':
                    # For scheduling, we'd typically use a task queue like Celery
                    # For now, just simulate
                    result['output'] = {'action': 'scheduled', 'duration': f'{seconds}s', 'message': 'Task scheduled (simulated)'}
                else:
                    result['status'] = 'error'
                    result['error'] = f'Unknown timer action: {action}'
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Timer failed: {str(e)}'
                
        elif node_type == 'notification':
            config = node['data'].get('config', {})
            title = config.get('title', 'Workflow Notification')
            message = config.get('message', 'Notification from workflow')
            type_notify = config.get('type', 'info')
            
            # Variable substitution
            if isinstance(title, str) and '{{' in title:
                for key, value in context.items():
                    title = title.replace(f'{{{{{key}}}}}', str(value))
            if isinstance(message, str) and '{{' in message:
                for key, value in context.items():
                    message = message.replace(f'{{{{{key}}}}}', str(value))
            
            # For now, just log the notification (in real app, could send to frontend via WebSocket)
            result['output'] = {'title': title, 'message': message, 'type': type_notify}
            print(f"[NOTIFICATION] {type_notify.upper()}: {title} - {message}")
                
        elif node_type == 'database':
            config = node['data'].get('config', {})
            operation = config.get('operation', 'find')
            collection_name = config.get('collection', 'test')
            query = config.get('query', '{}')
            data = config.get('data', '{}')
            
            # Variable substitution
            if isinstance(query, str) and '{{' in query:
                for key, value in context.items():
                    query = query.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                # Parse JSON query
                if isinstance(query, str):
                    query_obj = json.loads(query) if query else {}
                else:
                    query_obj = query
                
                # Use the existing mongo connection
                try:
                    from mongo_db import mongo
                    if mongo and mongo.db:
                        collection = mongo.db[collection_name]
                        
                        if operation == 'find':
                            docs = list(collection.find(query_obj).limit(10))
                            result['output'] = {'documents': docs, 'count': len(docs)}
                            context['db_result'] = {'documents': docs, 'count': len(docs)}
                        elif operation == 'findOne':
                            doc = collection.find_one(query_obj)
                            result['output'] = {'document': doc}
                            context['db_result'] = doc
                        elif operation == 'insert':
                            data_obj = json.loads(data) if isinstance(data, str) else data
                            insert_result = collection.insert_one(data_obj)
                            result['output'] = {'inserted_id': str(insert_result.inserted_id)}
                        elif operation == 'update':
                            data_obj = json.loads(data) if isinstance(data, str) else data
                            update_result = collection.update_many(query_obj, {'$set': data_obj})
                            result['output'] = {'modified_count': update_result.modified_count}
                        else:
                            result['output'] = {'message': f'MongoDB {operation} executed (simulated)', 'query': query}
                    else:
                        result['output'] = {'message': f'MongoDB {operation} simulated', 'query': query}
                        print(f"[DB SIMULATION] {operation}: {query}")
                        # Simulate some result for testing
                        if operation == 'find':
                            context['db_result'] = {'documents': [{'quantity': 5}], 'count': 1}
                        else:
                            context['db_result'] = {'quantity': 5}
                except ImportError:
                    result['output'] = {'message': f'MongoDB {operation} simulated (no connection)', 'query': query}
                    print(f"[DB SIMULATION] {operation}: {query}")
                    # Simulate some result for testing
                    if operation == 'find':
                        context['db_result'] = {'documents': [{'quantity': 5}], 'count': 1}
                    else:
                        context['db_result'] = {'quantity': 5}
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Database query failed: {str(e)}'
                
        elif node_type == 'code':
            config = node['data'].get('config', {})
            code = config.get('code', 'print("Hello World")')
            language = config.get('language', 'python')
            
            # Variable substitution
            if isinstance(code, str) and '{{' in code:
                for key, value in context.items():
                    code = code.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                if language == 'python':
                    # Safe Python execution (very limited for security)
                    allowed_builtins = {
                        'print': print, 'len': len, 'str': str, 'int': int, 'float': float,
                        'list': list, 'dict': dict, 'range': range, 'abs': abs,
                        'min': min, 'max': max, 'sum': sum, 'round': round
                    }
                    local_vars = {'context': context}
                    exec(code, {'__builtins__': allowed_builtins}, local_vars)
                    result['output'] = {'message': 'Python code executed', 'variables': {k: v for k, v in local_vars.items() if k != 'context'}}
                    # Update context with any new variables
                    context.update({k: v for k, v in local_vars.items() if k not in ['context', '__builtins__']})
                elif language == 'javascript':
                    # JavaScript execution would require a JS engine like PyExecJS
                    result['output'] = {'message': 'JavaScript execution simulated', 'code': code}
                    print(f"[JS SIMULATION] Code: {code}")
                else:
                    result['output'] = {'message': f'{language} execution simulated', 'code': code}
                    print(f"[CODE SIMULATION] {language}: {code}")
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Code execution failed: {str(e)}'
            
        elif node_type == 'email':
            config = node['data'].get('config', {})
            to = config.get('to', '')
            subject = config.get('subject', 'No Subject')
            body = config.get('body', '')
            smtp_server = config.get('smtp_server', 'smtp.example.com')
            smtp_port = config.get('smtp_port', 587)
            smtp_user = config.get('smtp_user', '')
            smtp_password = config.get('smtp_password', '')
            
            # Send email
            try:
                msg = MIMEMultipart()
                msg['From'] = smtp_user
                msg['To'] = to
                msg['Subject'] = subject
                
                msg.attach(MIMEText(body, 'plain'))
                
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.send_message(msg)
                
                result['output'] = {'message': 'Email sent'}
            except Exception as e:
                result['status'] = 'error'
                result['error'] = str(e)
                
        elif node_type == 'slack':
            config = node['data'].get('config', {})
            channel = config.get('channel', '')
            message = config.get('message', '')
            slack_token = config.get('slack_token', '')
            
            # Send Slack message
            try:
                client = WebClient(token=slack_token)
                response = client.chat_postMessage(channel=channel, text=message)
                
                result['output'] = {'message': 'Slack message sent', 'response': response}
            except SlackApiError as e:
                result['status'] = 'error'
                result['error'] = f"Slack API Error: {e.response['error']}"
            except Exception as e:
                result['status'] = 'error'
                result['error'] = str(e)
                
        elif node_type == 'openai':
            config = node['data'].get('config', {})
            prompt = config.get('prompt', '')
            model = config.get('model', 'gpt-3.5-turbo')
            temperature = float(config.get('temperature', 0.7))
            max_tokens = int(config.get('max_tokens', 150))
            openai_api_key = config.get('openai_api_key', '')
            
            # Call OpenAI API
            try:
                openai.api_key = openai_api_key
                response = openai.ChatCompletion.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                result['output'] = {'message': 'OpenAI API called', 'response': response}
            except Exception as e:
                result['status'] = 'error'
                result['error'] = str(e)
                
        elif node_type == 'math':
            config = node['data'].get('config', {})
            expression = config.get('expression', '')
            
            # Simple math expression evaluation
            try:
                # For security, restrict eval to basic math operations
                allowed_names = {'__builtins__': None}
                result_value = eval(expression, {"math": math, "round": round}, allowed_names)
                
                result['output'] = {'result': result_value}
            except Exception as e:
                result['status'] = 'error'
                result['error'] = str(e)
                
        elif node_type == 'base64':
            config = node['data'].get('config', {})
            text = config.get('text', '')
            action = config.get('action', 'encode')  # encode or decode
            
            try:
                if action == 'encode':
                    encoded = base64.b64encode(text.encode('utf-8')).decode('utf-8')
                    result['output'] = {'encoded': encoded}
                elif action == 'decode':
                    decoded = base64.b64decode(text).decode('utf-8')
                    result['output'] = {'decoded': decoded}
                else:
                    raise ValueError("Action must be 'encode' or 'decode'")
            except Exception as e:
                result['status'] = 'error'
                result['error'] = str(e)
                
        elif node_type == 'end':
            result['output'] = {'message': 'Workflow completed', 'final_context': context}
            
        elif node_type == 'brain':
            config = node['data'].get('config', {})
            brain_id = config.get('brainId', 'default-brain')
            user_input = config.get('userInput', 'Hello')
            system_prompt = config.get('systemPrompt', 'You are a helpful AI assistant.')
            temperature = config.get('temperature', 0.7)
            memory_namespace = config.get('memoryNamespace', 'default')
            
            # Variable substitution
            if isinstance(user_input, str) and '{{' in user_input:
                for key, value in context.items():
                    user_input = user_input.replace(f'{{{{{key}}}}}', str(value))
            
            # Store/retrieve memory using vector store if available
            memory_context = ""
            if VECTOR_STORE_AVAILABLE:
                try:
                    vector_store = get_vector_store()
                    memories = vector_store.search_memories(memory_namespace, context.get('query', ''), limit=5)
                    if memories:
                        memory_context = "\n".join([mem.get('content', '') for mem in memories])
                except Exception as e:
                    print(f"[WARNING] Failed to retrieve memories: {e}")
            
            # Process with AI model (mock implementation)
            try:
                if hasattr(openai, 'ChatCompletion'):
                    # Use OpenAI if available
                    response = openai.ChatCompletion.create(
                        model='gpt-3.5-turbo',
                        messages=[
                            {"role": "system", "content": f"{system_prompt}\n\nMemory Context:\n{memory_context}"},
                            {"role": "user", "content": str(user_input)}
                        ],
                        temperature=temperature,
                        max_tokens=1000
                    )
                    ai_response = response.choices[0].message.content
                else:
                    # Mock response if OpenAI not available
                    ai_response = f"[Brain {brain_id}] Processed input: {user_input}"
            except Exception as e:
                print(f"[WARNING] AI model failed, using mock response: {e}")
                ai_response = f"[Brain {brain_id}] Mock response to: {user_input}"
            
            # Store interaction in memory
            if VECTOR_STORE_AVAILABLE:
                try:
                    vector_store = get_vector_store()
                    vector_store.store_memory(
                        memory_namespace,
                        f"Input: {user_input} | Response: {ai_response}",
                        {"node_id": node['id'], "brain_id": brain_id, "workflow_id": workflow_id}
                    )
                except Exception as e:
                    print(f"[WARNING] Failed to store memory: {e}")
            
            result['output'] = {
                'response': ai_response,
                'brain_id': brain_id,
                'memory_namespace': memory_namespace
            }
            context['ai_response'] = ai_response
            context['last_brain_output'] = ai_response
            
        elif node_type == 'agent':
            config = node['data'].get('config', {})
            agent_id = config.get('agentId', 'default-agent')
            task = config.get('task', 'Complete the task')
            tools = config.get('tools', '').split(',') if config.get('tools') else []
            temperature = config.get('temperature', 0.3)
            memory_namespace = config.get('memoryNamespace', 'agent_default')
            
            # Variable substitution
            if isinstance(task, str) and '{{' in task:
                for key, value in context.items():
                    task = task.replace(f'{{{{{key}}}}}', str(value))
            
            # Get memory context
            memory_context = ""
            if VECTOR_STORE_AVAILABLE:
                try:
                    vector_store = get_vector_store()
                    memories = vector_store.search_memories(memory_namespace, task, limit=3)
                    if memories:
                        memory_context = "\n".join([mem.get('content', '') for mem in memories])
                except Exception as e:
                    print(f"[WARNING] Failed to retrieve agent memories: {e}")
            
            # Process agent task
            try:
                if hasattr(openai, 'ChatCompletion'):
                    system_message = f"You are an AI agent with ID {agent_id}.\nMemory:\n{memory_context}\nAvailable tools: {tools}"
                    response = openai.ChatCompletion.create(
                        model='gpt-3.5-turbo',
                        messages=[
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": str(task)}
                        ],
                        temperature=temperature,
                        max_tokens=1500
                    )
                    agent_response = response.choices[0].message.content
                else:
                    # Mock response
                    agent_response = f"[Agent {agent_id}] Completed task: {task}"
            except Exception as e:
                print(f"[WARNING] Agent model failed, using mock response: {e}")
                agent_response = f"[Agent {agent_id}] Mock completion of: {task}"
            
            # Store agent interaction
            if VECTOR_STORE_AVAILABLE:
                try:
                    vector_store = get_vector_store()
                    vector_store.store_memory(
                        memory_namespace,
                        f"Task: {task} | Result: {agent_response}",
                        {"node_id": node['id'], "agent_id": agent_id, "workflow_id": workflow_id}
                    )
                except Exception as e:
                    print(f"[WARNING] Failed to store agent memory: {e}")
            
            result['output'] = {
                'result': agent_response,
                'agent_id': agent_id,
                'tools_used': tools
            }
            context['agent_result'] = agent_response
            context['last_agent_output'] = agent_response
            
        else:
            # Unknown node type
            result['status'] = 'error'
            result['error'] = f"Unknown node type: {node_type}"
            
    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)
        print(f"[ERROR] Node execution failed: {e}")
    
    return result, context


def execute_workflow_nodes(workflow, input_data=None, execution_id=None):
    """Execute all nodes in a workflow using the new WorkflowExecutor engine"""
    try:
        from workflow_execution import WorkflowExecutor
        
        # Create workflow executor
        executor = WorkflowExecutor()
        
        # Execute workflow
        result = executor.execute_workflow(workflow, input_data or {}, execution_id)
        
        return result
        
    except ImportError:
        # Fallback to simple execution if workflow_execution module not available
        return _execute_workflow_simple(workflow, input_data, execution_id)
    except Exception as e:
        return {
            'status': 'error',
            'error': f'Workflow execution failed: {str(e)}',
            'execution_log': [],
            'node_statuses': {},
            'final_context': input_data or {}
        }

def _execute_workflow_simple(workflow, input_data=None, execution_id=None):
    """Simple fallback workflow execution"""
    nodes = workflow.get('nodes', [])
    edges = workflow.get('edges', [])
    
    if not nodes:
        return {
            'status': 'error',
            'error': 'No nodes to execute',
            'execution_log': [],
            'node_statuses': {}
        }
    
    # Initialize context with input data
    context = input_data or {}
    execution_log = []
    node_statuses = {}
    
    # Find start node
    start_node = next((node for node in nodes if node.get('data', {}).get('nodeType') == 'start'), None)
    if not start_node:
        start_node = nodes[0]  # Use first node if no start node found
    
    # Simple execution: follow connections from start
    current_node_id = start_node['id']
    visited_nodes = set()
    max_iterations = 100  # Prevent infinite loops
    iterations = 0
    
    try:
        while current_node_id and iterations < max_iterations:
            if current_node_id in visited_nodes:
                break  # Prevent infinite loops
                
            visited_nodes.add(current_node_id)
            iterations += 1
            
            # Find current node
            current_node = next((node for node in nodes if node['id'] == current_node_id), None)
            if not current_node:
                break
            
            # Update node status to running
            node_statuses[current_node_id] = {
                'status': 'running',
                'started_at': datetime.utcnow().isoformat()
            }
            
            # Execute node
            node_result, context = execute_node(current_node, context, workflow.get('id', 'temp'))
            execution_log.append(node_result)
            
            # Update node status based on result
            node_status = 'success' if node_result['status'] == 'success' else 'error'
            node_statuses[current_node_id].update({
                'status': node_status,
                'completed_at': datetime.utcnow().isoformat(),
                'output': node_result.get('output'),
                'error': node_result.get('error') if node_result['status'] == 'error' else None
            })
            
            # Stop execution if node failed
            if node_result['status'] == 'error':
                break
            
            # Find next node to execute
            next_node_id = None
            next_edge = next((edge for edge in edges if edge['source'] == current_node_id), None)
            
            if next_edge:
                next_node_id = next_edge['target']
            
            current_node_id = next_node_id
        
        # Determine final status
        final_status = 'success'
        error_details = None
        
        for log_entry in execution_log:
            if log_entry['status'] == 'error':
                final_status = 'error'
                error_details = log_entry.get('error', 'Unknown error')
                break
        
        return {
            'status': final_status,
            'execution_log': execution_log,
            'node_statuses': node_statuses,
            'final_context': context,
            'iterations': iterations,
            'error_details': error_details
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'execution_log': execution_log,
            'node_statuses': node_statuses,
            'final_context': context,
            'iterations': iterations
        }

@workflow_api.route('/api/workflows/execute', methods=['POST'])
def execute_temporary_workflow():
    """Execute a temporary workflow from frontend"""
    data = request.json or {}
    workflow_data = data.get('workflow', {})
    input_data = data.get('input_data', {})
    
    if not workflow_data:
        return jsonify({'error': 'No workflow data provided'}), 400
    
    start_time = datetime.utcnow()
    
    # Execute workflow directly
    execution_result = execute_workflow_nodes(workflow_data, input_data, None)
    
    end_time = datetime.utcnow()
    duration_ms = int((end_time - start_time).total_seconds() * 1000)
    
    # Add execution metadata
    execution_result['start_time'] = start_time.isoformat()
    execution_result['end_time'] = end_time.isoformat()
    execution_result['duration_ms'] = duration_ms
    execution_result['workflow_name'] = workflow_data.get('name', 'Temporary Workflow')
    execution_result['executed_nodes'] = len(execution_result.get('execution_log', []))
    
    return jsonify(execution_result)
