import time
import json
import requests
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import math
import uuid
import logging
from typing import Dict, Any, List, Optional, Tuple

# Add at the top of the file for SocketIO support
try:
    from flask_socketio import emit
    SOCKETIO_AVAILABLE = True
except ImportError:
    SOCKETIO_AVAILABLE = False

try:
    from mongo_db import mongo, MongoWorkflow
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False

try:
    from workflow_vector_store import get_vector_store
    VECTOR_STORE_AVAILABLE = True
except ImportError:
    VECTOR_STORE_AVAILABLE = False

logger = logging.getLogger(__name__)

class NodeExecutor:
    """Handles execution of individual workflow nodes"""
    
    def __init__(self):
        self.node_handlers = {
            'start': self._execute_start_node,
            'httpRequest': self._execute_http_request_node,
            'setVariable': self._execute_set_variable_node,
            'ifCondition': self._execute_condition_node,
            'condition': self._execute_condition_node,  # Alias for ifCondition
            'delay': self._execute_delay_node,
            'loop': self._execute_loop_node,
            'log': self._execute_log_node,
            'webhook': self._execute_webhook_node,
            'code': self._execute_code_node,
            'database': self._execute_database_node,
            'brain': self._execute_brain_node,
            'agent': self._execute_agent_node,
            'email': self._execute_email_node,
            'slack': self._execute_slack_node,
            'math': self._execute_math_node,
            'notification': self._execute_notification_node,
            'end': self._execute_end_node
        }
        self.workflow_variables = {}
        
    def execute_node(self, node: Dict[str, Any], workflow_context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single node and return result"""
        start_time = datetime.now()
        node_type = node.get('data', {}).get('nodeType')  # Updated to get nodeType from data
        node_id = node.get('id')
        
        logger.info(f"Executing node {node_id} of type {node_type}")
        
        try:
            # Get node handler
            handler = self.node_handlers.get(node_type)
            if not handler:
                raise ValueError(f"Unknown node type: {node_type}")
            
            # Execute node
            result = handler(node, workflow_context)
            
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            return {
                'status': 'success',
                'output': result,
                'execution_time': execution_time,
                'timestamp': end_time.isoformat(),
                'node_id': node_id,
                'node_type': node_type
            }
            
        except Exception as e:
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            logger.error(f"Node {node_id} execution failed: {str(e)}")
            
            return {
                'status': 'error',
                'error': str(e),
                'execution_time': execution_time,
                'timestamp': end_time.isoformat(),
                'node_id': node_id,
                'node_type': node_type
            }
    
    def _execute_start_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute start node"""
        config = node.get('data', {}).get('config', {})
        trigger_data = config.get('triggerData', '{}')
        
        if trigger_data:
            try:
                initial_data = json.loads(trigger_data)
                context['initial_data'] = initial_data
                self.workflow_variables.update(initial_data)
            except json.JSONDecodeError:
                pass
        
        return {
            'message': 'Workflow started',
            'trigger_type': config.get('triggerType', 'manual'),
            'initial_data': context.get('initial_data', {})
        }
    
    def _execute_http_request_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute HTTP request node"""
        config = node.get('data', {}).get('config', {})
        
        url = self._resolve_variables(config.get('url', ''))
        method = config.get('method', 'GET')
        headers = json.loads(config.get('headers', '{}'))
        body = config.get('body', '{}')
        timeout = int(config.get('timeout', 30000)) / 1000  # Convert ms to seconds
        
        if method != 'GET' and body:
            try:
                body = json.loads(self._resolve_variables(body))
            except json.JSONDecodeError:
                body = self._resolve_variables(body)
        else:
            body = None
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=body if isinstance(body, dict) else None,
                data=body if isinstance(body, str) else None,
                timeout=timeout
            )
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            return {
                'status_code': response.status_code,
                'headers': dict(response.headers),
                'data': response_data,
                'url': url,
                'method': method
            }
            
        except requests.RequestException as e:
            raise Exception(f"HTTP request failed: {str(e)}")
    
    def _execute_set_variable_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute set variable node"""
        config = node.get('data', {}).get('config', {})
        
        variable_name = config.get('variableName')
        value = self._resolve_variables(config.get('value', ''))
        value_type = config.get('type', 'string')
        
        # Convert value based on type
        if value_type == 'number':
            try:
                value = float(value)
            except ValueError:
                raise Exception(f"Cannot convert '{value}' to number")
        elif value_type == 'boolean':
            value = value.lower() in ('true', '1', 'yes', 'on')
        elif value_type == 'json':
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise Exception(f"Invalid JSON: {value}")
        
        # Set variable
        self.workflow_variables[variable_name] = value
        
        return {
            'variable_name': variable_name,
            'value': value,
            'type': value_type
        }
    
    def _execute_condition_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute condition node"""
        config = node.get('data', {}).get('config', {})
        
        # Support both condition formats
        if 'condition' in config:
            # Simple condition string
            condition = self._resolve_variables(config.get('condition', ''))
        else:
            # Structured condition with leftOperand, operator, rightOperand
            left = self._resolve_variables(config.get('leftOperand', ''))
            operator = config.get('operator', '==')
            right = self._resolve_variables(config.get('rightOperand', ''))
            
            # Build condition string based on operator
            if operator == '==':
                condition = f"'{left}' == '{right}'"
            elif operator == '!=':
                condition = f"'{left}' != '{right}'"
            elif operator == '>':
                condition = f"float('{left}') > float('{right}')"
            elif operator == '<':
                condition = f"float('{left}') < float('{right}')"
            elif operator == '>=':
                condition = f"float('{left}') >= float('{right}')"
            elif operator == '<=':
                condition = f"float('{left}') <= float('{right}')"
            elif operator == 'contains':
                condition = f"'{right}' in '{left}'"
            elif operator == 'not_contains':
                condition = f"'{right}' not in '{left}'"
            else:
                condition = f"'{left}' == '{right}'"  # Default to equality
        
        try:
            # Simple condition evaluation (extend as needed)
            result = self._evaluate_condition(condition)
            
            # Store result in context for edge routing
            context['last_condition_result'] = result
            
            return {
                'condition': condition,
                'result': result,
                'next_path': 'true' if result else 'false'
            }
        except Exception as e:
            raise Exception(f"Condition evaluation failed: {str(e)}")
    
    def _execute_delay_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute delay node"""
        config = node.get('data', {}).get('config', {})
        duration = float(config.get('duration', 1000))
        unit = config.get('unit', 'milliseconds')
        
        # Convert to seconds
        if unit == 'milliseconds':
            sleep_time = duration / 1000
        elif unit == 'seconds':
            sleep_time = duration
        elif unit == 'minutes':
            sleep_time = duration * 60
        elif unit == 'hours':
            sleep_time = duration * 3600
        else:
            sleep_time = duration / 1000
        
        time.sleep(sleep_time)
        
        return {
            'duration': duration,
            'unit': unit,
            'actual_sleep_time': sleep_time
        }
    
    def _execute_loop_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute loop node"""
        config = node.get('data', {}).get('config', {})
        iteration_type = config.get('iterationType')
        
        if iteration_type == 'array':
            array_data = json.loads(config.get('arrayData', '[]'))
            return {
                'iteration_type': 'array',
                'items': array_data,
                'item_count': len(array_data)
            }
        elif iteration_type == 'count':
            count = int(config.get('count', 1))
            return {
                'iteration_type': 'count',
                'count': count
            }
        elif iteration_type == 'while':
            condition = config.get('whileCondition')
            return {
                'iteration_type': 'while',
                'condition': condition
            }
        
        return {'iteration_type': iteration_type}
    
    def _execute_log_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute log node"""
        config = node.get('data', {}).get('config', {})
        message = self._resolve_variables(config.get('message', ''))
        level = config.get('level', 'info')
        additional_data = config.get('data', '{}')
        
        try:
            additional_data = json.loads(self._resolve_variables(additional_data))
        except json.JSONDecodeError:
            additional_data = {}
        
        log_entry = {
            'level': level,
            'message': message,
            'data': additional_data,
            'timestamp': datetime.now().isoformat()
        }
        
        # Log to appropriate level
        getattr(logger, level)(f"Workflow Log: {message}")
        
        return log_entry
    
    def _execute_webhook_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute webhook node"""
        config = node.get('data', {}).get('config', {})
        
        url = self._resolve_variables(config.get('url', ''))
        method = config.get('method', 'POST')
        payload = json.loads(self._resolve_variables(config.get('payload', '{}')))
        headers = json.loads(config.get('headers', '{"Content-Type": "application/json"}'))
        
        try:
            response = requests.request(
                method=method,
                url=url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            return {
                'status_code': response.status_code,
                'response': response.text,
                'url': url,
                'method': method
            }
        except requests.RequestException as e:
            raise Exception(f"Webhook failed: {str(e)}")
    
    def _execute_code_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute code node (simplified for security)"""
        config = node.get('data', {}).get('config', {})
        code = config.get('code', '')
        timeout = int(config.get('timeout', 10000)) / 1000
        
        # For security, we'll only allow simple mathematical operations
        # In production, use a proper sandbox
        try:
            # Create a safe environment
            safe_globals = {
                '__builtins__': {},
                'math': math,
                'len': len,
                'str': str,
                'int': int,
                'float': float,
                'bool': bool,
                'variables': self.workflow_variables.copy()
            }
            
            # Execute code
            result = eval(code, safe_globals)
            
            return {
                'result': result,
                'code': code,
                'variables_used': list(self.workflow_variables.keys())
            }
        except Exception as e:
            raise Exception(f"Code execution failed: {str(e)}")
    
    def _execute_database_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute database node"""
        if not MONGODB_AVAILABLE:
            raise Exception("MongoDB not available")
        
        config = node.get('data', {}).get('config', {})
        operation = config.get('operation')
        collection = config.get('collection')
        query = json.loads(config.get('query', '{}'))
        data = json.loads(config.get('data', '{}'))
        options = json.loads(config.get('options', '{}'))
        
        try:
            db = mongo.db
            coll = db[collection]
            
            if operation == 'find':
                cursor = coll.find(query, options)
                results = list(cursor)
                return {'operation': 'find', 'results': results, 'count': len(results)}
            
            elif operation == 'findOne':
                result = coll.find_one(query, options)
                return {'operation': 'findOne', 'result': result}
            
            elif operation == 'insert':
                result = coll.insert_one(data)
                return {'operation': 'insert', 'inserted_id': str(result.inserted_id)}
            
            elif operation == 'update':
                result = coll.update_many(query, {'$set': data})
                return {'operation': 'update', 'matched_count': result.matched_count, 'modified_count': result.modified_count}
            
            elif operation == 'delete':
                result = coll.delete_many(query)
                return {'operation': 'delete', 'deleted_count': result.deleted_count}
            
            else:
                raise Exception(f"Unknown database operation: {operation}")
        
        except Exception as e:
            raise Exception(f"Database operation failed: {str(e)}")
    
    def _execute_brain_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute brain node (AI reasoning/processing)"""
        config = node.get('data', {}).get('config', {})
        
        brain_name = config.get('name', 'Default Brain')
        model = config.get('model', 'gpt-3.5-turbo')
        temperature = float(config.get('temperature', 0.7))
        system_prompt = config.get('systemPrompt', 'You are a helpful AI assistant.')
        user_input = self._resolve_variables(config.get('userInput', ''))
        memory_namespace = config.get('memoryNamespace', 'default')
        
        try:
            # This would integrate with your AI brain system
            # For now, simulate a brain response
            response = {
                'brain_name': brain_name,
                'model': model,
                'input': user_input,
                'response': f"Brain {brain_name} processed: {user_input}",
                'metadata': {
                    'temperature': temperature,
                    'memory_namespace': memory_namespace
                }
            }
            
            # Store response in context for other nodes
            context['ai_response'] = response['response']
            context['last_brain_response'] = response
            self.workflow_variables['ai_response'] = response['response']
            
            return response
            
        except Exception as e:
            raise Exception(f"Brain execution failed: {str(e)}")
    
    def _execute_agent_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent node (AI agent with tools)"""
        config = node.get('data', {}).get('config', {})
        
        agent_name = config.get('name', 'Default Agent')
        role = config.get('role', 'assistant')
        model = config.get('model', 'gpt-4')
        temperature = float(config.get('temperature', 0.3))
        task = self._resolve_variables(config.get('task', ''))
        tools = config.get('tools', [])
        memory_namespace = config.get('memoryNamespace', 'agent')
        
        try:
            # This would integrate with your AI agent system
            # For now, simulate an agent response
            response = {
                'agent_name': agent_name,
                'role': role,
                'model': model,
                'task': task,
                'result': f"Agent {agent_name} completed task: {task}",
                'tools_used': tools,
                'metadata': {
                    'temperature': temperature,
                    'memory_namespace': memory_namespace
                }
            }
            
            # Store response in context for other nodes
            context['agent_result'] = response['result']
            context['last_agent_response'] = response
            self.workflow_variables['agent_result'] = response['result']
            
            return response
            
        except Exception as e:
            raise Exception(f"Agent execution failed: {str(e)}")
    
    def _execute_email_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute email node"""
        config = node.get('data', {}).get('config', {})
        
        to_email = config.get('to')
        subject = self._resolve_variables(config.get('subject', ''))
        body = self._resolve_variables(config.get('body', ''))
        from_email = config.get('from', 'noreply@example.com')
        
        # For demo purposes, just log the email
        logger.info(f"EMAIL: To={to_email}, Subject={subject}, Body={body[:100]}...")
        
        return {
            'to': to_email,
            'subject': subject,
            'body_length': len(body),
            'from': from_email,
            'sent_at': datetime.now().isoformat()
        }
    
    def _execute_slack_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute slack message node"""
        config = node.get('data', {}).get('config', {})
        
        channel = self._resolve_variables(config.get('channel', ''))
        message = self._resolve_variables(config.get('message', ''))
        bot_token = config.get('botToken', '')
        username = config.get('username', 'WorkflowBot')
        icon_emoji = config.get('iconEmoji', ':robot_face:')
        
        try:
            # This would integrate with Slack SDK
            # For now, simulate slack message
            response = {
                'channel': channel,
                'message': message,
                'username': username,
                'icon_emoji': icon_emoji,
                'status': 'sent',
                'timestamp': datetime.now().isoformat()
            }
            
            return response
            
        except Exception as e:
            raise Exception(f"Slack message failed: {str(e)}")
    
    def _execute_math_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute math operation node"""
        config = node.get('data', {}).get('config', {})
        
        operation = config.get('operation', 'add')
        left_operand = self._resolve_variables(config.get('leftOperand', '0'))
        right_operand = self._resolve_variables(config.get('rightOperand', '0'))
        result_variable = config.get('resultVariable', 'math_result')
        
        try:
            # Convert to numbers
            left_val = float(left_operand)
            right_val = float(right_operand) if right_operand else 0
            
            # Perform operation
            if operation == 'add':
                result = left_val + right_val
            elif operation == 'subtract':
                result = left_val - right_val
            elif operation == 'multiply':
                result = left_val * right_val
            elif operation == 'divide':
                if right_val == 0:
                    raise Exception("Division by zero")
                result = left_val / right_val
            elif operation == 'power':
                result = left_val ** right_val
            elif operation == 'sqrt':
                result = math.sqrt(left_val)
            elif operation == 'round':
                result = round(left_val)
            elif operation == 'ceil':
                result = math.ceil(left_val)
            elif operation == 'floor':
                result = math.floor(left_val)
            else:
                raise Exception(f"Unknown operation: {operation}")
            
            # Store result in context and variables
            if result_variable:
                self.workflow_variables[result_variable] = result
                context[result_variable] = result
            
            return {
                'operation': operation,
                'left_operand': left_val,
                'right_operand': right_val,
                'result': result,
                'result_variable': result_variable
            }
            
        except Exception as e:
            raise Exception(f"Math operation failed: {str(e)}")
    
    def _execute_notification_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute push notification node"""
        config = node.get('data', {}).get('config', {})
        
        title = self._resolve_variables(config.get('title', ''))
        message = self._resolve_variables(config.get('message', ''))
        device_tokens = config.get('deviceTokens', '[]')
        topic = config.get('topic', '')
        badge = int(config.get('badge', 1))
        sound = config.get('sound', 'default')
        
        try:
            # Parse device tokens if provided
            tokens = []
            if device_tokens:
                tokens = json.loads(device_tokens)
            
            # This would integrate with push notification service (FCM, APNs, etc.)
            # For now, simulate notification
            response = {
                'title': title,
                'message': message,
                'device_tokens': tokens,
                'topic': topic,
                'badge': badge,
                'sound': sound,
                'status': 'sent',
                'timestamp': datetime.now().isoformat()
            }
            
            return response
            
        except Exception as e:
            raise Exception(f"Notification failed: {str(e)}")

    def _execute_end_node(self, node: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute end node"""
        config = node.get('data', {}).get('config', {})
        return_data = json.loads(config.get('returnData', '{}'))
        status = config.get('status', 'success')
        
        return {
            'workflow_status': status,
            'return_data': return_data,
            'final_variables': self.workflow_variables.copy()
        }
    
    def _resolve_variables(self, text: str) -> str:
        """Resolve variables in text using {{variable}} syntax"""
        if not isinstance(text, str):
            return text
        
        import re
        def replace_var(match):
            var_name = match.group(1)
            return str(self.workflow_variables.get(var_name, f"{{{{ {var_name} }}}}"))
        
        return re.sub(r'{{(\w+)}}', replace_var, text)
    
    def _evaluate_condition(self, condition: str) -> bool:
        """Evaluate a simple condition"""
        # Simple condition evaluation - extend as needed
        try:
            # Replace variables
            resolved_condition = self._resolve_variables(condition)
            
            # For safety, only allow basic comparisons
            safe_globals = {
                '__builtins__': {},
                'True': True,
                'False': False,
                **self.workflow_variables
            }
            
            return bool(eval(resolved_condition, safe_globals))
        except:
            return False


class WorkflowExecutor:
    """Handles execution of complete workflows"""
    
    def __init__(self):
        self.node_executor = NodeExecutor()
    
    def execute_workflow(self, workflow: Dict[str, Any], input_data: Dict[str, Any] = None, execution_id: str = None) -> Dict[str, Any]:
        """Execute a complete workflow"""
        start_time = datetime.now()
        execution_log = []
        node_statuses = {}
        
        try:
            nodes = workflow.get('nodes', [])
            edges = workflow.get('edges', [])
            
            if not nodes:
                return {
                    'status': 'error',
                    'error': 'Workflow has no nodes',
                    'execution_log': [],
                    'node_statuses': {},
                    'final_context': input_data or {}
                }
            
            # Find start node
            start_node = next((node for node in nodes if node.get('data', {}).get('nodeType') == 'start'), None)
            if not start_node:
                start_node = nodes[0]  # Use first node if no start node found
            
            # Create node lookup
            nodes_by_id = {node['id']: node for node in nodes}
            
            # Create adjacency list for edges
            outgoing_edges = {}
            for edge in edges:
                source = edge['source']
                if source not in outgoing_edges:
                    outgoing_edges[source] = []
                outgoing_edges[source].append(edge)
            
            # Initialize context with input data and workflow metadata
            context = input_data or {}
            context.update({
                'workflow_id': workflow.get('id'),
                'execution_id': execution_id or str(uuid.uuid4())
            })
            
            # Execute workflow starting from start node
            executed_nodes = set()
            current_node_id = start_node['id']
            max_iterations = 100
            iterations = 0
            
            while current_node_id and iterations < max_iterations:
                if current_node_id in executed_nodes:
                    break  # Prevent infinite loops
                
                iterations += 1
                node = nodes_by_id.get(current_node_id)
                if not node:
                    break
                
                # Update node status to running
                node_statuses[current_node_id] = {
                    'status': 'running',
                    'started_at': datetime.now().isoformat()
                }
                
                # Emit real-time node status update via WebSocket
                if SOCKETIO_AVAILABLE:
                    try:
                        emit('node_status', {
                            'nodeId': current_node_id,
                            'status': 'running',
                            'timestamp': datetime.now().isoformat()
                        })
                    except Exception as e:
                        logger.warning(f"Failed to emit node status: {e}")
                
                # Execute node
                result = self.node_executor.execute_node(node, context)
                executed_nodes.add(current_node_id)
                
                # Update node status
                node_status = 'success' if result['status'] == 'success' else 'error'
                node_statuses[current_node_id].update({
                    'status': node_status,
                    'completed_at': datetime.now().isoformat(),
                    'output': result.get('output'),
                    'error': result.get('error') if result['status'] == 'error' else None
                })
                
                # Add to execution log
                log_entry = {
                    'node_id': current_node_id,
                    'node_name': node.get('data', {}).get('label', node.get('data', {}).get('nodeType', 'Unknown')),
                    'node_type': node.get('data', {}).get('nodeType', 'unknown'),
                    'status': result['status'],
                    'message': 'Node executed successfully' if result['status'] == 'success' else result.get('error', 'Node failed'),
                    'timestamp': result['timestamp'],
                    'output': result.get('output'),
                    'error': result.get('error')
                }
                execution_log.append(log_entry)
                
                # Emit real-time execution log entry via WebSocket
                if SOCKETIO_AVAILABLE:
                    try:
                        emit('execution_log', log_entry)
                        emit('node_status', {
                            'nodeId': current_node_id,
                            'status': node_status,
                            'timestamp': datetime.now().isoformat(),
                            'output': result.get('output'),
                            'error': result.get('error')
                        })
                    except Exception as e:
                        logger.warning(f"Failed to emit execution log: {e}")
                
                # If node failed, stop execution
                if result['status'] == 'error':
                    break
                
                # Find next node to execute
                next_node_id = None
                
                # For conditional nodes, check the condition result
                if node.get('data', {}).get('nodeType') == 'ifCondition':
                    condition_result = context.get('last_condition_result', False)
                    output_handle = 'true' if condition_result else 'false'
                    
                    # Find edge with matching source handle
                    if current_node_id in outgoing_edges:
                        next_edge = next((edge for edge in outgoing_edges[current_node_id] 
                                        if edge.get('sourceHandle') == output_handle), None)
                        if next_edge:
                            next_node_id = next_edge['target']
                else:
                    # Find any outgoing edge
                    if current_node_id in outgoing_edges and outgoing_edges[current_node_id]:
                        next_node_id = outgoing_edges[current_node_id][0]['target']
                
                current_node_id = next_node_id
            
            # Determine final status
            final_status = 'success'
            error_details = None
            
            for log_entry in execution_log:
                if log_entry['status'] == 'error':
                    final_status = 'error'
                    error_details = log_entry.get('error', 'Unknown error')
                    break
            
            end_time = datetime.now()
            total_time = (end_time - start_time).total_seconds()
            
            return {
                'status': final_status,
                'execution_log': execution_log,
                'node_statuses': node_statuses,
                'final_context': context,
                'iterations': iterations,
                'error_details': error_details,
                'duration_seconds': total_time,
                'nodes_executed': len(executed_nodes)
            }
            
        except Exception as e:
            end_time = datetime.now()
            total_time = (end_time - start_time).total_seconds()
            
            return {
                'status': 'error',
                'error': str(e),
                'execution_log': execution_log,
                'node_statuses': node_statuses,
                'final_context': input_data or {},
                'iterations': iterations if 'iterations' in locals() else 0,
                'duration_seconds': total_time,
                'nodes_executed': len(node_statuses)
            }
