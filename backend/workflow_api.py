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
    templates = [
        {
            'id': 'testing-million',
            'name': 'Testing Million',
            'description': 'Comprehensive test workflow exercising all node types with proper parameters',
            'nodes': [
                # Start Node
                {'id': 'start-1', 'type': 'customNode', 'position': {'x': 100, 'y': 200}, 'data': {'label': 'Start Process', 'nodeType': 'start', 'icon': 'Play', 'color': '#10B981', 'config': {'triggerType': 'manual', 'triggerData': '{"order_id": "million-123", "customer_id": "cust-456"}'}}},
                
                # Variable Setting
                {'id': 'var-order', 'type': 'customNode', 'position': {'x': 300, 'y': 200}, 'data': {'label': 'Load Order Data', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 'config': {'variableName': 'order_total', 'value': '1000000'}}},
                {'id': 'var-customer', 'type': 'customNode', 'position': {'x': 500, 'y': 200}, 'data': {'label': 'Set Customer Email', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 'config': {'variableName': 'customer_email', 'value': 'test@million.com'}}},
                
                # AI Brain Processing
                {'id': 'brain-fraud', 'type': 'customNode', 'position': {'x': 700, 'y': 200}, 'data': {'label': 'AI Fraud Check', 'nodeType': 'brain', 'icon': 'Zap', 'color': '#9D4EDD', 'config': {'brainId': 'fraud-detector-brain-123', 'userInput': 'Analyze order for fraud: total={{order_total}}, email={{customer_email}}', 'systemPrompt': 'You are a fraud detection expert. Analyze the order and respond with SAFE or FRAUD.'}}},
                
                # If/Else Condition 
                {'id': 'condition-fraud', 'type': 'customNode', 'position': {'x': 900, 'y': 200}, 'data': {'label': 'Fraud Detected?', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 'config': {'leftOperand': '{{ai_response}}', 'operator': 'contains', 'rightOperand': 'FRAUD'}}},
                
                # Fraud Alert Path
                {'id': 'var-flag', 'type': 'customNode', 'position': {'x': 1100, 'y': 100}, 'data': {'label': 'Flag Order', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 'config': {'variableName': 'order_status', 'value': 'FLAGGED_FRAUD'}}},
                {'id': 'email-security', 'type': 'customNode', 'position': {'x': 1300, 'y': 100}, 'data': {'label': 'Alert Security Team', 'nodeType': 'email', 'icon': 'Mail', 'color': '#EF4444', 'config': {'to': 'security@company.com', 'subject': 'FRAUD ALERT: Million Dollar Order', 'body': 'Suspicious order detected. Total: ${{order_total}}, Customer: {{customer_email}}, AI Analysis: {{ai_response}}'}}},
                {'id': 'slack-alert', 'type': 'customNode', 'position': {'x': 1500, 'y': 100}, 'data': {'label': 'Slack Alert', 'nodeType': 'slack', 'icon': 'MessageSquare', 'color': '#7C3AED', 'config': {'channel': '#security-alerts', 'message': '🚨 FRAUD ALERT: Million dollar order flagged by AI. Order: ${{order_total}}, Customer: {{customer_email}}'}}},
                
                # Normal Processing Path - Database Check
                {'id': 'db-inventory', 'type': 'customNode', 'position': {'x': 1100, 'y': 300}, 'data': {'label': 'Check Inventory', 'nodeType': 'database', 'icon': 'Database', 'color': '#3B82F6', 'config': {'operation': 'find', 'collection': 'inventory', 'query': '{"product_id": "premium-package", "quantity": {"$gte": 1}}'}}},
                
                # Stock Condition Check
                {'id': 'condition-stock', 'type': 'customNode', 'position': {'x': 1300, 'y': 300}, 'data': {'label': 'In Stock?', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 'config': {'leftOperand': '{{db_result.quantity}}', 'operator': '>', 'rightOperand': '0'}}},
                
                # Out of Stock Path
                {'id': 'email-backorder', 'type': 'customNode', 'position': {'x': 1500, 'y': 200}, 'data': {'label': 'Backorder Email', 'nodeType': 'email', 'icon': 'Mail', 'color': '#F59E0B', 'config': {'to': '{{customer_email}}', 'subject': 'Order Update: Item on Backorder', 'body': 'Thank you for your million dollar order! The premium package is currently on backorder. We will notify you when it becomes available.'}}},
                {'id': 'var-backorder', 'type': 'customNode', 'position': {'x': 1700, 'y': 200}, 'data': {'label': 'Set Backorder', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 'config': {'variableName': 'order_status', 'value': 'BACKORDERED'}}},
                
                # In Stock - Math Processing
                {'id': 'math-pricing', 'type': 'customNode', 'position': {'x': 1500, 'y': 400}, 'data': {'label': 'Calculate Pricing', 'nodeType': 'math', 'icon': 'Calculator', 'color': '#10B981', 'config': {'operation': 'multiply', 'leftOperand': '{{order_total}}', 'rightOperand': '0.95', 'resultVariable': 'discounted_total'}}},
                
                # VIP Customer Check
                {'id': 'condition-vip', 'type': 'customNode', 'position': {'x': 1700, 'y': 400}, 'data': {'label': 'VIP Customer?', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 'config': {'leftOperand': '{{order_total}}', 'operator': '>', 'rightOperand': '500000'}}},
                
                # VIP Discount Path
                {'id': 'math-vip', 'type': 'customNode', 'position': {'x': 1900, 'y': 300}, 'data': {'label': 'Apply VIP Discount', 'nodeType': 'math', 'icon': 'Calculator', 'color': '#10B981', 'config': {'operation': 'multiply', 'leftOperand': '{{discounted_total}}', 'rightOperand': '0.9', 'resultVariable': 'final_price'}}},
                {'id': 'var-vip-price', 'type': 'customNode', 'position': {'x': 2100, 'y': 300}, 'data': {'label': 'Set Final Price', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 'config': {'variableName': 'final_total', 'value': '{{final_price}}'}}},
                
                # Regular Pricing Path
                {'id': 'var-regular-price', 'type': 'customNode', 'position': {'x': 1900, 'y': 500}, 'data': {'label': 'Set Regular Price', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 'config': {'variableName': 'final_total', 'value': '{{discounted_total}}'}}},
                
                # HTTP Request - Payment Processing
                {'id': 'http-payment', 'type': 'customNode', 'position': {'x': 2300, 'y': 400}, 'data': {'label': 'Process Payment', 'nodeType': 'httpRequest', 'icon': 'Globe', 'color': '#3B82F6', 'config': {'url': 'https://api.payment-processor.com/charge', 'method': 'POST', 'headers': '{"Content-Type": "application/json", "Authorization": "Bearer test-key-123"}', 'body': '{"amount": "{{final_total}}", "customer_email": "{{customer_email}}", "order_id": "{{order_id}}"}'}}},
                
                # Payment Success Check
                {'id': 'condition-payment', 'type': 'customNode', 'position': {'x': 2500, 'y': 400}, 'data': {'label': 'Payment Success?', 'nodeType': 'ifCondition', 'icon': 'GitBranch', 'color': '#F59E0B', 'config': {'leftOperand': '{{last_http_response.status_code}}', 'operator': '==', 'rightOperand': '200'}}},
                
                # Payment Failed Path
                {'id': 'email-failed', 'type': 'customNode', 'position': {'x': 2700, 'y': 300}, 'data': {'label': 'Payment Failed Email', 'nodeType': 'email', 'icon': 'Mail', 'color': '#EF4444', 'config': {'to': '{{customer_email}}', 'subject': 'Payment Processing Error', 'body': 'We encountered an issue processing your payment for order total: ${{final_total}}. Please contact support or try again.'}}},
                {'id': 'var-failed', 'type': 'customNode', 'position': {'x': 2900, 'y': 300}, 'data': {'label': 'Set Failed Status', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 'config': {'variableName': 'order_status', 'value': 'PAYMENT_FAILED'}}},
                
                # Payment Success Path
                {'id': 'db-update', 'type': 'customNode', 'position': {'x': 2700, 'y': 500}, 'data': {'label': 'Update Inventory', 'nodeType': 'database', 'icon': 'Database', 'color': '#3B82F6', 'config': {'operation': 'update', 'collection': 'inventory', 'query': '{"product_id": "premium-package"}'}}},
                {'id': 'var-shipped', 'type': 'customNode', 'position': {'x': 2900, 'y': 500}, 'data': {'label': 'Set Shipped Status', 'nodeType': 'setVariable', 'icon': 'Database', 'color': '#8B5CF6', 'config': {'variableName': 'order_status', 'value': 'SHIPPED'}}},
                {'id': 'email-confirm', 'type': 'customNode', 'position': {'x': 3100, 'y': 500}, 'data': {'label': 'Shipping Confirmation', 'nodeType': 'email', 'icon': 'Mail', 'color': '#10B981', 'config': {'to': '{{customer_email}}', 'subject': 'Million Dollar Order Shipped!', 'body': 'Congratulations! Your premium package worth ${{final_total}} has been shipped. Tracking info will follow shortly.'}}},
                {'id': 'push-notify', 'type': 'customNode', 'position': {'x': 3300, 'y': 500}, 'data': {'label': 'Push Notification', 'nodeType': 'notification', 'icon': 'Bell', 'color': '#8B5CF6', 'config': {'title': 'Order Shipped', 'message': 'Your million dollar order is on its way!'}}},
                
                # AI Agent Processing
                {'id': 'agent-process', 'type': 'customNode', 'position': {'x': 3500, 'y': 400}, 'data': {'label': 'Agent Process Order', 'nodeType': 'agent', 'icon': 'User', 'color': '#6366F1', 'config': {'agentId': 'order-processing-agent-789', 'task': 'Process completed order: {{order_id}} with status {{order_status}} and total {{final_total}}'}}},
                
                # Final Database Log
                {'id': 'db-log', 'type': 'customNode', 'position': {'x': 3700, 'y': 400}, 'data': {'label': 'Log Transaction', 'nodeType': 'database', 'icon': 'Database', 'color': '#3B82F6', 'config': {'operation': 'insert', 'collection': 'transaction_logs', 'query': '{"order_id": "{{order_id}}", "total": "{{final_total}}", "status": "{{order_status}}", "timestamp": "2024-01-01T12:00:00Z"}'}}},
                
                # End Node
                {'id': 'end-1', 'type': 'customNode', 'position': {'x': 3900, 'y': 400}, 'data': {'label': 'Process Complete', 'nodeType': 'end', 'icon': 'StopCircle', 'color': '#6B7280', 'config': {'status': 'success', 'returnData': '{"order_id": "{{order_id}}", "final_total": "{{final_total}}", "status": "{{order_status}}"}'}}}
            ],
            'edges': [
                # Main flow
                {'id': 'e1', 'source': 'start-1', 'target': 'var-order', 'type': 'smoothstep', 'animated': True},
                {'id': 'e2', 'source': 'var-order', 'target': 'var-customer', 'type': 'smoothstep', 'animated': True},
                {'id': 'e3', 'source': 'var-customer', 'target': 'brain-fraud', 'type': 'smoothstep', 'animated': True},
                {'id': 'e4', 'source': 'brain-fraud', 'target': 'condition-fraud', 'type': 'smoothstep', 'animated': True},
                
                # Fraud path (true branch)
                {'id': 'e5', 'source': 'condition-fraud', 'target': 'var-flag', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e6', 'source': 'var-flag', 'target': 'email-security', 'type': 'smoothstep', 'animated': True},
                {'id': 'e7', 'source': 'email-security', 'target': 'slack-alert', 'type': 'smoothstep', 'animated': True},
                {'id': 'e8', 'source': 'slack-alert', 'target': 'end-1', 'type': 'smoothstep', 'animated': True},
                
                # Normal path (false branch)
                {'id': 'e9', 'source': 'condition-fraud', 'target': 'db-inventory', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e10', 'source': 'db-inventory', 'target': 'condition-stock', 'type': 'smoothstep', 'animated': True},
                
                # Out of stock (false branch)
                {'id': 'e11', 'source': 'condition-stock', 'target': 'email-backorder', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e12', 'source': 'email-backorder', 'target': 'var-backorder', 'type': 'smoothstep', 'animated': True},
                {'id': 'e13', 'source': 'var-backorder', 'target': 'end-1', 'type': 'smoothstep', 'animated': True},
                
                # In stock (true branch)
                {'id': 'e14', 'source': 'condition-stock', 'target': 'math-pricing', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e15', 'source': 'math-pricing', 'target': 'condition-vip', 'type': 'smoothstep', 'animated': True},
                
                # VIP pricing (true branch)
                {'id': 'e16', 'source': 'condition-vip', 'target': 'math-vip', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e17', 'source': 'math-vip', 'target': 'var-vip-price', 'type': 'smoothstep', 'animated': True},
                {'id': 'e18', 'source': 'var-vip-price', 'target': 'http-payment', 'type': 'smoothstep', 'animated': True},
                
                # Regular pricing (false branch)
                {'id': 'e19', 'source': 'condition-vip', 'target': 'var-regular-price', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e20', 'source': 'var-regular-price', 'target': 'http-payment', 'type': 'smoothstep', 'animated': True},
                
                # Payment processing
                {'id': 'e21', 'source': 'http-payment', 'target': 'condition-payment', 'type': 'smoothstep', 'animated': True},
                
                # Payment failed (false branch)
                {'id': 'e22', 'source': 'condition-payment', 'target': 'email-failed', 'sourceHandle': 'false', 'type': 'smoothstep', 'animated': True},
                {'id': 'e23', 'source': 'email-failed', 'target': 'var-failed', 'type': 'smoothstep', 'animated': True},
                {'id': 'e24', 'source': 'var-failed', 'target': 'db-log', 'type': 'smoothstep', 'animated': True},
                
                # Payment success (true branch)
                {'id': 'e25', 'source': 'condition-payment', 'target': 'db-update', 'sourceHandle': 'true', 'type': 'smoothstep', 'animated': True},
                {'id': 'e26', 'source': 'db-update', 'target': 'var-shipped', 'type': 'smoothstep', 'animated': True},
                {'id': 'e27', 'source': 'var-shipped', 'target': 'email-confirm', 'type': 'smoothstep', 'animated': True},
                {'id': 'e28', 'source': 'email-confirm', 'target': 'push-notify', 'type': 'smoothstep', 'animated': True},
                {'id': 'e29', 'source': 'push-notify', 'target': 'agent-process', 'type': 'smoothstep', 'animated': True},
                {'id': 'e30', 'source': 'agent-process', 'target': 'db-log', 'type': 'smoothstep', 'animated': True},
                
                # Final
                {'id': 'e31', 'source': 'db-log', 'target': 'end-1', 'type': 'smoothstep', 'animated': True}
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
