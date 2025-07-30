==========
API Usage
==========

The Genius Project provides a comprehensive REST API for integrating with external applications and services. This guide covers authentication, available endpoints, and usage examples.

Base URL
========

**Local Development**: ``http://localhost:5002``

**Production**: ``https://your-domain.com``

All API endpoints are prefixed with ``/api`` unless otherwise specified.

Authentication
==============

JWT Token Authentication
------------------------

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

.. code-block:: bash

   Authorization: Bearer <your-jwt-token>

**Login to get token**:

.. code-block:: bash

   curl -X POST http://localhost:5002/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@genius.com",
       "password": "admin123"
     }'

**Response**:

.. code-block:: json

   {
     "status": "success",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": "507f1f77bcf86cd799439011",
       "email": "admin@genius.com",
       "name": "Admin User",
       "role": "admin"
     }
   }

API Key Authentication
----------------------

For server-to-server integration, use API keys:

.. code-block:: bash

   X-API-Key: your-api-key-here

Core API Endpoints
==================

Authentication & Users
-----------------------

**Login**

.. code-block:: bash

   POST /api/auth/login
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "password123"
   }

**Register**

.. code-block:: bash

   POST /api/auth/register
   Content-Type: application/json

   {
     "email": "newuser@example.com",
     "password": "password123",
     "name": "New User"
   }

**Get User Profile**

.. code-block:: bash

   GET /api/user/profile
   Authorization: Bearer <token>

**Update User Profile**

.. code-block:: bash

   PUT /api/user/profile
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "name": "Updated Name",
     "preferences": {
       "theme": "dark",
       "notifications": true
     }
   }

Brain Management
----------------

**List Brains**

.. code-block:: bash

   GET /api/brains
   Authorization: Bearer <token>

**Create Brain**

.. code-block:: bash

   POST /api/brains
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "name": "Marketing Brain",
     "description": "AI assistant for marketing content",
     "model": "llama3",
     "system_prompt": "You are a marketing expert...",
     "knowledge_base": ["marketing_docs", "brand_guidelines"]
   }

**Get Brain Details**

.. code-block:: bash

   GET /api/brains/{brain_id}
   Authorization: Bearer <token>

**Update Brain**

.. code-block:: bash

   PUT /api/brains/{brain_id}
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "name": "Updated Brain Name",
     "system_prompt": "New system prompt..."
   }

**Chat with Brain**

.. code-block:: bash

   POST /api/brains/{brain_id}/chat
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "message": "Generate a social media post about AI",
     "context": {
       "platform": "instagram",
       "tone": "professional"
     }
   }

Workflow Management
-------------------

**List Workflows**

.. code-block:: bash

   GET /api/workflows
   Authorization: Bearer <token>

**Create Workflow**

.. code-block:: bash

   POST /api/workflows
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "name": "Content Pipeline",
     "description": "Automated content generation and posting",
     "nodes": [
       {
         "id": "trigger_1",
         "type": "schedule_trigger",
         "config": {"schedule": "0 9 * * *"}
       },
       {
         "id": "ai_1",
         "type": "content_generator",
         "config": {"model": "llama3", "prompt": "Generate post about {topic}"}
       }
     ],
     "connections": [
       {"from": "trigger_1", "to": "ai_1"}
     ]
   }

**Execute Workflow**

.. code-block:: bash

   POST /api/workflows/{workflow_id}/execute
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "input_data": {
       "topic": "artificial intelligence",
       "target_audience": "tech professionals"
     }
   }

**Get Workflow Execution Status**

.. code-block:: bash

   GET /api/workflows/{workflow_id}/executions/{execution_id}
   Authorization: Bearer <token>

Document & RAG Management
-------------------------

**Upload Document**

.. code-block:: bash

   POST /api/documents/upload
   Authorization: Bearer <token>
   Content-Type: multipart/form-data

   Form data:
   - file: <document_file>
   - category: "technical_docs"
   - metadata: {"author": "John Doe", "version": "1.0"}

**List Documents**

.. code-block:: bash

   GET /api/documents
   Authorization: Bearer <token>

**Query RAG System**

.. code-block:: bash

   POST /api/rag/query
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "question": "What are the installation requirements?",
     "collection": "technical_docs",
     "max_results": 5
   }

**Chat with RAG**

.. code-block:: bash

   POST /api/rag/chat
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "message": "Explain the deployment process",
     "conversation_id": "conv_123",
     "include_sources": true
   }

Analytics & Dashboard
---------------------

**Get Dashboard Data**

.. code-block:: bash

   GET /api/dashboard/overview
   Authorization: Bearer <token>

**Get Social Media Analytics**

.. code-block:: bash

   GET /api/analytics/social-media
   Authorization: Bearer <token>
   
   Query parameters:
   - platform: tiktok|instagram|facebook
   - date_range: last_7_days|last_30_days|custom
   - start_date: 2024-01-01
   - end_date: 2024-01-31

**Get Content Performance**

.. code-block:: bash

   GET /api/analytics/content
   Authorization: Bearer <token>

**Export Analytics Data**

.. code-block:: bash

   GET /api/analytics/export
   Authorization: Bearer <token>
   
   Query parameters:
   - format: json|csv|xlsx
   - date_range: last_30_days

Social Media Integration
------------------------

**Connect Social Platform**

.. code-block:: bash

   POST /api/social/connect/{platform}
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "access_token": "platform_access_token",
     "account_id": "platform_account_id",
     "permissions": ["read", "write"]
   }

**Post Content**

.. code-block:: bash

   POST /api/social/post
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "platforms": ["tiktok", "instagram"],
     "content": {
       "text": "Check out our new AI features!",
       "media": ["image_url_1", "video_url_1"],
       "hashtags": ["#AI", "#Innovation"]
     },
     "schedule": "2024-12-01T15:00:00Z"
   }

**Get Social Analytics**

.. code-block:: bash

   GET /api/social/analytics/{platform}
   Authorization: Bearer <token>

Streaming APIs
==============

Server-Sent Events (SSE)
-------------------------

For real-time updates, use SSE endpoints:

**Workflow Execution Updates**

.. code-block:: bash

   GET /api/workflows/{workflow_id}/stream
   Authorization: Bearer <token>
   Accept: text/event-stream

**Chat Streaming**

.. code-block:: bash

   POST /api/brains/{brain_id}/chat/stream
   Authorization: Bearer <token>
   Content-Type: application/json
   Accept: text/event-stream

   {
     "message": "Generate a long article about AI trends"
   }

WebSocket Integration
---------------------

Connect to WebSocket for real-time bidirectional communication:

.. code-block:: javascript

   const socket = io('http://localhost:5002', {
     auth: {
       token: 'your-jwt-token'
     }
   });

   // Listen for workflow updates
   socket.on('workflow_progress', (data) => {
     console.log('Progress:', data.progress);
   });

   // Send workflow execution command
   socket.emit('execute_workflow', {
     workflow_id: 'workflow_123',
     input_data: {...}
   });

Error Handling
==============

Standard Error Format
----------------------

All API errors follow a consistent format:

.. code-block:: json

   {
     "status": "error",
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid input parameters",
       "details": {
         "field": "email",
         "reason": "Invalid email format"
       }
     },
     "timestamp": "2024-12-01T12:00:00Z",
     "request_id": "req_123456"
   }

HTTP Status Codes
------------------

* **200 OK**: Successful GET, PUT, PATCH
* **201 Created**: Successful POST
* **204 No Content**: Successful DELETE
* **400 Bad Request**: Invalid request data
* **401 Unauthorized**: Missing or invalid authentication
* **403 Forbidden**: Insufficient permissions
* **404 Not Found**: Resource not found
* **429 Too Many Requests**: Rate limit exceeded
* **500 Internal Server Error**: Server error

Rate Limiting
=============

API requests are rate limited:

* **Authenticated users**: 1000 requests per hour
* **Anonymous users**: 100 requests per hour
* **Workflow executions**: 50 per hour per user

Rate limit headers:

.. code-block:: bash

   X-RateLimit-Limit: 1000
   X-RateLimit-Remaining: 999
   X-RateLimit-Reset: 1609459200

SDKs and Libraries
==================

Python SDK
-----------

.. code-block:: python

   from genius_project import GeniusClient

   # Initialize client
   client = GeniusClient(
       base_url="http://localhost:5002",
       api_key="your-api-key"
   )

   # Login
   client.login("admin@genius.com", "admin123")

   # Create brain
   brain = client.brains.create(
       name="Marketing Assistant",
       model="llama3",
       system_prompt="You are a marketing expert..."
   )

   # Chat with brain
   response = client.brains.chat(
       brain_id=brain.id,
       message="Generate a social media post"
   )

   # Execute workflow
   execution = client.workflows.execute(
       workflow_id="workflow_123",
       input_data={"topic": "AI trends"}
   )

JavaScript SDK
--------------

.. code-block:: javascript

   import { GeniusClient } from '@genius-project/sdk';

   const client = new GeniusClient({
     baseURL: 'http://localhost:5002',
     apiKey: 'your-api-key'
   });

   // Login
   await client.auth.login('admin@genius.com', 'admin123');

   // Create brain
   const brain = await client.brains.create({
     name: 'Marketing Assistant',
     model: 'llama3',
     systemPrompt: 'You are a marketing expert...'
   });

   // Chat with streaming
   const stream = await client.brains.chatStream(brain.id, {
     message: 'Generate a social media post'
   });

   for await (const chunk of stream) {
     console.log(chunk.content);
   }

Webhook Integration
===================

Setting Up Webhooks
--------------------

Register webhook endpoints to receive real-time notifications:

.. code-block:: bash

   POST /api/webhooks
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "url": "https://your-app.com/webhooks/genius",
     "events": ["workflow.completed", "brain.updated"],
     "secret": "webhook-secret-key"
   }

Webhook Events
--------------

**Workflow Events**:
* ``workflow.started``
* ``workflow.completed``
* ``workflow.failed``
* ``workflow.progress``

**Brain Events**:
* ``brain.created``
* ``brain.updated``
* ``brain.chat_message``

**User Events**:
* ``user.registered``
* ``user.login``
* ``user.updated``

Webhook Payload Example
-----------------------

.. code-block:: json

   {
     "event": "workflow.completed",
     "timestamp": "2024-12-01T12:00:00Z",
     "data": {
       "workflow_id": "workflow_123",
       "execution_id": "exec_456",
       "status": "completed",
       "result": {
         "output": "Generated content...",
         "metadata": {...}
       }
     },
     "signature": "sha256=..."
   }

Best Practices
==============

Authentication
--------------

1. **Store tokens securely**: Use secure storage for JWT tokens
2. **Token refresh**: Implement automatic token refresh
3. **API key rotation**: Regularly rotate API keys
4. **Scope limitations**: Use appropriate permission scopes

Error Handling
--------------

1. **Retry logic**: Implement exponential backoff for retries
2. **Graceful degradation**: Handle API failures gracefully
3. **Logging**: Log all API interactions for debugging
4. **User feedback**: Provide meaningful error messages to users

Performance
-----------

1. **Batch requests**: Combine multiple operations when possible
2. **Caching**: Cache frequently accessed data
3. **Pagination**: Use pagination for large datasets
4. **Compression**: Enable gzip compression for responses

Security
--------

1. **HTTPS only**: Always use HTTPS in production
2. **Input validation**: Validate all input data
3. **Rate limiting**: Respect rate limits
4. **Secret management**: Securely store API credentials

Testing
=======

Unit Testing
------------

.. code-block:: python

   import pytest
   from genius_project import GeniusClient

   @pytest.fixture
   def client():
       return GeniusClient(base_url="http://localhost:5002")

   def test_brain_creation(client):
       brain = client.brains.create(
           name="Test Brain",
           model="llama3"
       )
       assert brain.name == "Test Brain"
       assert brain.model == "llama3"

Integration Testing
-------------------

.. code-block:: bash

   # Test authentication
   curl -X POST http://localhost:5002/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "test123"}'

   # Test workflow execution
   curl -X POST http://localhost:5002/api/workflows/test_workflow/execute \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"input_data": {"test": true}}'

Next Steps
==========

* **Explore Workflow Builder**: :doc:`workflow-builder`
* **Learn RAG Integration**: :doc:`rag-system`
* **Check Development Guide**: :doc:`../development/architecture`
* **Deploy to Production**: :doc:`../development/deployment`

The API provides comprehensive access to all Genius Project features. With proper authentication and error handling, you can build powerful integrations and extend the platform's capabilities.
