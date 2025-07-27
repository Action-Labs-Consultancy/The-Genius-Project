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
    
    input_data = request.json or {}
    start_time = datetime.utcnow()
    
    # Create execution record in MongoDB
    execution_id = None
    if MONGODB_AVAILABLE:
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
    templates = [
        {
            'id': 'api-monitor',
            'name': 'API Monitoring',
            'description': 'Monitor an API endpoint and log responses',
            'nodes': [
                {'id': 'start-1', 'type': 'start', 'position': {'x': 100, 'y': 100}, 'data': {'label': 'Start'}},
                {'id': 'http-1', 'type': 'httpRequest', 'position': {'x': 300, 'y': 100}, 'data': {'label': 'Check API', 'config': {'url': 'https://api.example.com/health', 'method': 'GET'}}},
                {'id': 'condition-1', 'type': 'ifCondition', 'position': {'x': 500, 'y': 100}, 'data': {'label': 'Check Status', 'config': {'leftOperand': '{{last_http_response.status_code}}', 'operator': '==', 'rightOperand': '200'}}},
                {'id': 'log-success', 'type': 'log', 'position': {'x': 700, 'y': 50}, 'data': {'label': 'Log Success', 'config': {'message': 'API is healthy: {{last_http_response.status_code}}'}}},
                {'id': 'log-error', 'type': 'log', 'position': {'x': 700, 'y': 150}, 'data': {'label': 'Log Error', 'config': {'message': 'API error: {{last_http_response.status_code}}'}}},
                {'id': 'end-1', 'type': 'end', 'position': {'x': 900, 'y': 100}, 'data': {'label': 'End'}}
            ],
            'edges': [
                {'id': 'e1', 'source': 'start-1', 'target': 'http-1'},
                {'id': 'e2', 'source': 'http-1', 'target': 'condition-1'},
                {'id': 'e3', 'source': 'condition-1', 'target': 'log-success', 'label': 'true'},
                {'id': 'e4', 'source': 'condition-1', 'target': 'log-error', 'label': 'false'},
                {'id': 'e5', 'source': 'log-success', 'target': 'end-1'},
                {'id': 'e6', 'source': 'log-error', 'target': 'end-1'}
            ]
        },
        {
            'id': 'data-processor',
            'name': 'Data Processing Pipeline',
            'description': 'Process data with variables and conditions',
            'nodes': [
                {'id': 'start-1', 'type': 'start', 'position': {'x': 100, 'y': 100}, 'data': {'label': 'Start'}},
                {'id': 'var-1', 'type': 'setVariable', 'position': {'x': 300, 'y': 100}, 'data': {'label': 'Set Count', 'config': {'name': 'count', 'value': '10'}}},
                {'id': 'condition-1', 'type': 'ifCondition', 'position': {'x': 500, 'y': 100}, 'data': {'label': 'Check Count', 'config': {'leftOperand': '{{count}}', 'operator': '>', 'rightOperand': '5'}}},
                {'id': 'log-1', 'type': 'log', 'position': {'x': 700, 'y': 100}, 'data': {'label': 'Log Result', 'config': {'message': 'Count is: {{count}}'}}},
                {'id': 'end-1', 'type': 'end', 'position': {'x': 900, 'y': 100}, 'data': {'label': 'End'}}
            ],
            'edges': [
                {'id': 'e1', 'source': 'start-1', 'target': 'var-1'},
                {'id': 'e2', 'source': 'var-1', 'target': 'condition-1'},
                {'id': 'e3', 'source': 'condition-1', 'target': 'log-1', 'label': 'true'},
                {'id': 'e4', 'source': 'log-1', 'target': 'end-1'}
            ]
        }
    ]
    return jsonify(templates)

def execute_node(node, context, workflow_id):
    """Execute a single node based on its type"""
    result = {
        'node_id': node['id'],
        'node_type': node['type'],
        'status': 'success',
        'output': None,
        'error': None,
        'timestamp': datetime.now().isoformat()
    }
    
    try:
        if node['type'] == 'start':
            result['output'] = {'message': 'Workflow started', 'data': context}
            
        elif node['type'] == 'httpRequest':
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
            
        elif node['type'] == 'setVariable':
            config = node['data'].get('config', {})
            var_name = config.get('name', '')
            var_value = config.get('value', '')
            
            # Simple variable substitution from context
            if isinstance(var_value, str) and '{{' in var_value:
                for key, value in context.items():
                    var_value = var_value.replace(f'{{{{{key}}}}}', str(value))
            
            context[var_name] = var_value
            result['output'] = {f'{var_name}': var_value}
            
        elif node['type'] == 'ifCondition':
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
            
        elif node['type'] == 'delay':
            config = node['data'].get('config', {})
            seconds = float(config.get('seconds', 1))
            time.sleep(seconds)
            result['output'] = {'delayed_seconds': seconds}
            
        elif node['type'] == 'log':
            config = node['data'].get('config', {})
            message = config.get('message', 'Log message')
            
            # Variable substitution
            if isinstance(message, str) and '{{' in message:
                for key, value in context.items():
                    message = message.replace(f'{{{{{key}}}}}', str(value))
            
            result['output'] = {'message': message}
            print(f"[WORKFLOW LOG] {message}")
            
        elif node['type'] == 'email':
            config = node['data'].get('config', {})
            to_email = config.get('to', config.get('recipient', ''))
            subject = config.get('subject', 'Workflow Notification')
            message = config.get('message', config.get('body', 'Message from workflow'))
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
                
        elif node['type'] == 'slack':
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
                
        elif node['type'] == 'ai':
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
                
        elif node['type'] == 'math':
            config = node['data'].get('config', {})
            expression = config.get('expression', '1 + 1')
            operation = config.get('operation', 'eval')
            
            # Variable substitution
            if isinstance(expression, str) and '{{' in expression:
                for key, value in context.items():
                    if isinstance(value, (int, float)):
                        expression = expression.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                if operation == 'eval':
                    # Safe math evaluation (basic operations only)
                    allowed_names = {
                        'abs': abs, 'round': round, 'min': min, 'max': max,
                        'sum': sum, 'pow': pow, 'sqrt': math.sqrt,
                        'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
                        'log': math.log, 'exp': math.exp, 'pi': math.pi,
                        'e': math.e
                    }
                    result_value = eval(expression, {"__builtins__": {}}, allowed_names)
                    result['output'] = {'expression': expression, 'result': result_value}
                    context['math_result'] = result_value
                else:
                    result['status'] = 'error'
                    result['error'] = f'Unknown math operation: {operation}'
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Math calculation failed: {str(e)}'
                
        elif node['type'] == 'file':
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
                
        elif node['type'] == 'timer':
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
                
        elif node['type'] == 'notification':
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
                
        elif node['type'] == 'database':
            config = node['data'].get('config', {})
            query = config.get('query', 'SELECT 1')
            db_type = config.get('db_type', 'mongodb')
            
            # Variable substitution
            if isinstance(query, str) and '{{' in query:
                for key, value in context.items():
                    query = query.replace(f'{{{{{key}}}}}', str(value))
            
            try:
                if db_type == 'mongodb':
                    # Use the existing mongo connection
                    from mongo_db import mongo
                    if mongo and mongo.db:
                        # Simple MongoDB query execution (be careful with eval in production)
                        collection_name = config.get('collection', 'test')
                        if query.startswith('find'):
                            collection = mongo.db[collection_name]
                            # Parse simple find queries
                            if 'find({})' in query or 'find()' in query:
                                docs = list(collection.find().limit(10))
                            else:
                                docs = list(collection.find().limit(10))  # Safe fallback
                            result['output'] = {'documents': docs, 'count': len(docs)}
                        else:
                            result['output'] = {'message': 'MongoDB query executed (simulated)', 'query': query}
                    else:
                        result['output'] = {'message': 'MongoDB query simulated', 'query': query}
                        print(f"[DB SIMULATION] Query: {query}")
                else:
                    result['output'] = {'message': f'{db_type} query simulated', 'query': query}
                    print(f"[DB SIMULATION] {db_type}: {query}")
            except Exception as e:
                result['status'] = 'error'
                result['error'] = f'Database query failed: {str(e)}'
                
        elif node['type'] == 'code':
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
            
        elif node['type'] == 'email':
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
                
        elif node['type'] == 'slack':
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
                
        elif node['type'] == 'openai':
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
                
        elif node['type'] == 'math':
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
                
        elif node['type'] == 'base64':
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
                
        elif node['type'] == 'end':
            result['output'] = {'message': 'Workflow completed', 'final_context': context}
            
        else:
            result['status'] = 'error'
            result['error'] = f"Unknown node type: {node['type']}"
            
    except Exception as e:
        result['status'] = 'error'
        result['error'] = str(e)
        
    return result, context

def execute_workflow_nodes(workflow, input_data=None, execution_id=None):
    """Execute all nodes in a workflow with real-time status updates"""
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
    start_node = next((node for node in nodes if node['type'] == 'start'), None)
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
            
            # Update execution record if available
            if MONGODB_AVAILABLE and execution_id:
                try:
                    MongoWorkflowExecution.update_node_status(
                        execution_id, 
                        current_node_id, 
                        'running',
                        started_at=datetime.utcnow()
                    )
                except Exception as e:
                    print(f"[ERROR] Failed to update node status: {e}")
            
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
            
            # Update execution record
            if MONGODB_AVAILABLE and execution_id:
                try:
                    MongoWorkflowExecution.update_node_status(
                        execution_id,
                        current_node_id,
                        node_status,
                        completed_at=datetime.utcnow(),
                        output=node_result.get('output'),
                        error=node_result.get('error') if node_result['status'] == 'error' else None
                    )
                    
                    # Add log entry
                    MongoWorkflowExecution.add_log_entry(execution_id, node_result)
                except Exception as e:
                    print(f"[ERROR] Failed to update execution: {e}")
            
            if node_result['status'] == 'error':
                # Mark remaining nodes as cancelled
                for node in nodes:
                    if node['id'] not in visited_nodes:
                        node_statuses[node['id']] = {
                            'status': 'cancelled',
                            'cancelled_at': datetime.utcnow().isoformat()
                        }
                break
                
            # Find next node
            current_node_id = None
            
            # For if conditions, choose path based on result
            if current_node['type'] == 'ifCondition':
                condition_result = context.get('last_condition_result', False)
                
                # Find true/false edges
                true_edge = next((edge for edge in edges 
                                if edge['source'] == current_node['id'] and 
                                edge.get('sourceHandle', '').lower() in ['true', '1', 'yes']), None)
                false_edge = next((edge for edge in edges 
                                 if edge['source'] == current_node['id'] and 
                                 edge.get('sourceHandle', '').lower() in ['false', '0', 'no']), None)
                
                if condition_result and true_edge:
                    current_node_id = true_edge['target']
                elif not condition_result and false_edge:
                    current_node_id = false_edge['target']
                else:
                    # If no labeled edges, just use first outgoing edge
                    next_edge = next((edge for edge in edges if edge['source'] == current_node['id']), None)
                    if next_edge:
                        current_node_id = next_edge['target']
            else:
                # For other nodes, follow first outgoing edge
                next_edge = next((edge for edge in edges if edge['source'] == current_node['id']), None)
                if next_edge:
                    current_node_id = next_edge['target']
    
    except Exception as e:
        # Handle execution errors
        execution_log.append({
            'node_id': current_node_id,
            'status': 'error',
            'error': f'Workflow execution failed: {str(e)}',
            'timestamp': datetime.utcnow().isoformat()
        })
        
        if current_node_id:
            node_statuses[current_node_id] = {
                'status': 'error',
                'error': str(e),
                'failed_at': datetime.utcnow().isoformat()
            }
    
    # Determine overall status
    has_errors = any(log['status'] == 'error' for log in execution_log)
    overall_status = 'error' if has_errors else 'completed'
    
    return {
        'status': overall_status,
        'execution_log': execution_log,
        'node_statuses': node_statuses,
        'final_context': context,
        'iterations': iterations,
        'output_data': context
    }

# ─── Execution History and Statistics ──────────────────────────────────────

@workflow_api.route('/api/workflows/<workflow_id>/executions', methods=['GET'])
def get_workflow_executions(workflow_id):
    """Get execution history for a workflow"""
    limit = request.args.get('limit', 50, type=int)
    
    if MONGODB_AVAILABLE:
        try:
            executions = MongoWorkflowExecution.get_by_workflow(workflow_id, limit)
            return jsonify({
                'executions': executions,
                'count': len(executions)
            })
        except Exception as e:
            print(f"[ERROR] Failed to fetch executions: {e}")
    
    # Fallback to file storage
    logs = load_execution_logs()
    workflow_logs = [log for log in logs if log.get('workflow_id') == workflow_id]
    workflow_logs = sorted(workflow_logs, key=lambda x: x.get('execution_time', ''), reverse=True)
    
    return jsonify({
        'executions': workflow_logs[:limit],
        'count': len(workflow_logs)
    })

@workflow_api.route('/api/executions/<execution_id>', methods=['GET'])
def get_execution_details(execution_id):
    """Get detailed execution information"""
    if MONGODB_AVAILABLE:
        try:
            execution = MongoWorkflowExecution.get_by_id(execution_id)
            if execution:
                return jsonify(execution)
            return jsonify({'error': 'Execution not found'}), 404
        except Exception as e:
            print(f"[ERROR] Failed to fetch execution: {e}")
    
    return jsonify({'error': 'Execution tracking not available'}), 404

@workflow_api.route('/api/executions/recent', methods=['GET'])
def get_recent_executions():
    """Get recent executions across all workflows"""
    limit = request.args.get('limit', 100, type=int)
    
    if MONGODB_AVAILABLE:
        try:
            executions = MongoWorkflowExecution.get_recent_executions(limit)
            return jsonify({
                'executions': executions,
                'count': len(executions)
            })
        except Exception as e:
            print(f"[ERROR] Failed to fetch recent executions: {e}")
    
    # Fallback to file storage
    logs = load_execution_logs()
    recent_logs = sorted(logs, key=lambda x: x.get('execution_time', ''), reverse=True)
    
    return jsonify({
        'executions': recent_logs[:limit],
        'count': len(recent_logs)
    })

@workflow_api.route('/api/executions/stats', methods=['GET'])
def get_execution_stats():
    """Get execution statistics"""
    if MONGODB_AVAILABLE:
        try:
            stats = MongoWorkflowExecution.get_execution_stats()
            return jsonify({
                'statistics': stats,
                'mongodb_enabled': True
            })
        except Exception as e:
            print(f"[ERROR] Failed to fetch execution stats: {e}")
    
    # Fallback to file storage stats
    logs = load_execution_logs()
    stats = {}
    for log in logs:
        status = log.get('status', 'unknown')
        stats[status] = stats.get(status, 0) + 1
    
    return jsonify({
        'statistics': [{'_id': k, 'count': v} for k, v in stats.items()],
        'mongodb_enabled': False
    })

@workflow_api.route('/api/executions/<execution_id>/cancel', methods=['POST'])
def cancel_execution(execution_id):
    """Cancel a running execution"""
    if MONGODB_AVAILABLE:
        try:
            success = MongoWorkflowExecution.update_status(
                execution_id, 
                'cancelled',
                cancelled_at=datetime.utcnow(),
                cancelled_by=request.headers.get('User-Agent', 'Unknown')
            )
            if success:
                return jsonify({'message': 'Execution cancelled successfully'})
            return jsonify({'error': 'Execution not found or already completed'}), 404
        except Exception as e:
            print(f"[ERROR] Failed to cancel execution: {e}")
    
    return jsonify({'error': 'Execution cancellation not available'}), 404

# ─── Vector Search and AI Insights ──────────────────────────────────────

@workflow_api.route('/api/workflows/search', methods=['POST'])
def search_workflows():
    """Search workflows using vector similarity"""
    data = request.json
    query = data.get('query', '')
    limit = data.get('limit', 10)
    
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    if not VECTOR_STORE_AVAILABLE:
        return jsonify({
            'message': 'Vector search not available',
            'results': []
        })
    
    try:
        vector_store = get_vector_store()
        similar_workflows = vector_store.search_similar_workflows(query, limit)
        
        return jsonify({
            'query': query,
            'results': similar_workflows,
            'count': len(similar_workflows)
        })
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@workflow_api.route('/api/workflows/<workflow_id>/insights', methods=['GET'])
def get_workflow_insights(workflow_id):
    """Get AI-generated insights about a workflow"""
    if not VECTOR_STORE_AVAILABLE:
        return jsonify({
            'message': 'AI insights not available',
            'insights': {}
        })
    
    try:
        vector_store = get_vector_store()
        insights = vector_store.get_workflow_insights(workflow_id)
        
        return jsonify({
            'workflow_id': workflow_id,
            'insights': insights
        })
    except Exception as e:
        return jsonify({'error': f'Failed to generate insights: {str(e)}'}), 500

@workflow_api.route('/api/executions/search', methods=['POST'])
def search_execution_memories():
    """Search execution memories using vector similarity"""
    data = request.json
    query = data.get('query', '')
    workflow_id = data.get('workflow_id')
    limit = data.get('limit', 10)
    
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    if not VECTOR_STORE_AVAILABLE:
        return jsonify({
            'message': 'Vector search not available',
            'results': []
        })
    
    try:
        vector_store = get_vector_store()
        memories = vector_store.search_execution_memories(query, workflow_id, limit)
        
        return jsonify({
            'query': query,
            'workflow_id': workflow_id,
            'results': memories,
            'count': len(memories)
        })
    except Exception as e:
        return jsonify({'error': f'Memory search failed: {str(e)}'}), 500

@workflow_api.route('/api/workflows/recommend', methods=['POST'])
def recommend_workflows():
    """Recommend workflows based on description or requirements"""
    data = request.json
    requirements = data.get('requirements', '')
    limit = data.get('limit', 5)
    
    if not requirements:
        return jsonify({'error': 'Requirements parameter required'}), 400
    
    if not VECTOR_STORE_AVAILABLE:
        return jsonify({
            'message': 'Workflow recommendations not available',
            'recommendations': []
        })
    
    try:
        vector_store = get_vector_store()
        
        # Search for similar workflows
        similar_workflows = vector_store.search_similar_workflows(requirements, limit * 2)
        
        # Filter and rank recommendations
        recommendations = []
        for workflow in similar_workflows:
            if workflow['similarity_score'] > 0.7:  # Only high similarity
                recommendations.append({
                    'workflow_id': workflow['workflow_id'],
                    'workflow_name': workflow['workflow_name'],
                    'description': workflow['description'],
                    'relevance_score': workflow['similarity_score'],
                    'reason': f"Similar workflow with {workflow['similarity_score']:.1%} relevance",
                    'node_count': workflow['node_count'],
                    'tags': workflow.get('tags', [])
                })
        
        # Limit results
        recommendations = recommendations[:limit]
        
        return jsonify({
            'requirements': requirements,
            'recommendations': recommendations,
            'count': len(recommendations)
        })
    except Exception as e:
        return jsonify({'error': f'Recommendation failed: {str(e)}'}), 500

@workflow_api.route('/api/workflows/execute', methods=['POST'])
def execute_workflow_direct():
    """Execute a workflow provided in the request body"""
    try:
        data = request.json or {}
        workflow = data.get('workflow')
        input_data = data.get('input_data', {})
        
        if not workflow:
            return jsonify({'error': 'Workflow data is required'}), 400
        
        # Validate workflow structure
        if not all(key in workflow for key in ['nodes', 'edges']):
            return jsonify({'error': 'Workflow must contain nodes and edges'}), 400
        
        start_time = datetime.utcnow()
        
        # Create a temporary execution ID
        execution_id = str(uuid4())
        
        # Create execution record in MongoDB if available
        if MONGODB_AVAILABLE:
            try:
                execution = MongoWorkflowExecution.create({
                    'workflow_id': workflow.get('id', 'temp'),
                    'workflow_name': workflow.get('name', 'Temporary Workflow'),
                    'status': 'running',
                    'input_data': input_data,
                    'started_at': start_time,
                    'execution_id': execution_id
                })
            except Exception as e:
                print(f"[ERROR] Failed to create MongoDB execution record: {e}")
        
        # Execute the workflow
        execution_result = execute_workflow_nodes(workflow, input_data, execution_id)
        
        # Update execution record if successful
        if MONGODB_AVAILABLE:
            try:
                MongoWorkflowExecution.update_by_execution_id(execution_id, {
                    'status': 'completed' if execution_result.get('success') else 'failed',
                    'completed_at': datetime.utcnow(),
                    'result': execution_result,
                    'error_message': execution_result.get('error') if not execution_result.get('success') else None
                })
            except Exception as e:
                print(f"[ERROR] Failed to update MongoDB execution record: {e}")
        
        return jsonify(execution_result)
        
    except Exception as e:
        print(f"[ERROR] Workflow execution failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
