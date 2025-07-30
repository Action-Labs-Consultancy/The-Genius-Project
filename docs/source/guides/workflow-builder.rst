==================
Workflow Builder
==================

The Workflow Builder is a visual, drag-and-drop interface for creating automated workflows within The Genius Project. It allows users to chain together different operations, AI services, and integrations to automate complex business processes.

Overview
========

The Workflow Builder provides:

* **Visual Editor**: Drag-and-drop interface similar to n8n or Zapier
* **Node-Based Architecture**: Modular components that can be connected
* **AI Integration**: Built-in AI nodes for content generation and analysis
* **External Integrations**: Connect to social media, databases, and APIs
* **Real-time Execution**: Run workflows manually or on schedules
* **Version Control**: Save and manage workflow versions

Core Concepts
=============

Workflows
---------

A workflow is a series of connected nodes that process data and perform actions. Each workflow has:

* **Start Node**: Entry point (trigger, manual start, schedule)
* **Processing Nodes**: Transform, analyze, or manipulate data
* **Action Nodes**: Perform operations (send email, post to social media)
* **End Node**: Final output or storage

Nodes
-----

Nodes are the building blocks of workflows:

* **Input Nodes**: Receive data from triggers or user input
* **Logic Nodes**: Conditional logic, loops, and data transformation
* **AI Nodes**: Leverage AI services for content generation and analysis
* **Integration Nodes**: Connect to external services and APIs
* **Output Nodes**: Send results to destinations or storage

Connections
-----------

Connections link nodes together, passing data between them:

* **Data Flow**: Information flows from output to input
* **Branching**: Split workflows based on conditions
* **Merging**: Combine data from multiple sources
* **Error Handling**: Alternative paths for error scenarios

Available Node Types
====================

Trigger Nodes
-------------

**Manual Trigger**
   Start workflow on-demand from the interface

**Schedule Trigger**
   Run workflow at specified times (hourly, daily, weekly)

**Webhook Trigger**
   Start workflow from external HTTP requests

**File Upload Trigger**
   Activate when files are uploaded to monitored directories

Data Nodes
-----------

**Data Input**
   Accept manual data entry or file uploads

**Data Transform**
   Modify, filter, or restructure data

**Data Validation**
   Check data quality and format

**Data Storage**
   Save data to databases or files

AI Nodes
--------

**Content Generator**
   Generate text content using AI models

**Text Analyzer**
   Analyze sentiment, extract entities, summarize text

**Image Generator**
   Create images using AI image generation

**Chat Completion**
   Interactive chat with AI models

Integration Nodes
-----------------

**Social Media**
   * Post to TikTok, Instagram, Facebook
   * Fetch analytics and engagement data
   * Schedule social media content

**Database**
   * Read from/write to MongoDB
   * Execute database queries
   * Sync data between systems

**Email**
   * Send notifications and reports
   * Process incoming emails
   * Email template rendering

**File Operations**
   * Read/write files
   * File format conversion
   * Cloud storage integration

Logic Nodes
-----------

**Conditional**
   Branch workflow based on conditions

**Loop**
   Repeat operations over datasets

**Merge**
   Combine data from multiple sources

**Delay**
   Add timing delays between operations

Creating Workflows
==================

Step 1: Access the Workflow Builder
------------------------------------

Navigate to the Workflow Builder in the application:

.. code-block:: text

   Dashboard → Workflows → Create New Workflow

Step 2: Design Your Workflow
-----------------------------

1. **Start with a Trigger**: Drag a trigger node onto the canvas
2. **Add Processing Nodes**: Connect nodes to build your logic
3. **Configure Each Node**: Set parameters and options
4. **Test Connections**: Verify data flows correctly
5. **Add Error Handling**: Include alternative paths for failures

Step 3: Configure Nodes
------------------------

Each node has configurable parameters:

**Example: Content Generator Node**

.. code-block:: javascript

   {
     "model": "llama3",
     "prompt": "Generate a social media post about {topic}",
     "temperature": 0.7,
     "max_tokens": 280,
     "output_format": "text"
   }

**Example: Social Media Post Node**

.. code-block:: javascript

   {
     "platform": "tiktok",
     "account": "main_account",
     "content": "{{previous_node_output}}",
     "schedule": "immediate",
     "hashtags": ["#ai", "#automation"]
   }

Step 4: Test Your Workflow
---------------------------

1. **Manual Test**: Run the workflow with sample data
2. **Debug Mode**: Step through each node to verify outputs
3. **Error Testing**: Test with invalid data to check error handling
4. **Performance**: Monitor execution time and resource usage

Step 5: Deploy and Monitor
---------------------------

1. **Save Workflow**: Store the configuration
2. **Set Permissions**: Define who can view/edit/execute
3. **Enable Monitoring**: Track execution history and performance
4. **Schedule**: Set up automatic execution if needed

Example Workflows
=================

Social Media Content Pipeline
------------------------------

**Purpose**: Generate and post AI-created content to social media

**Workflow**:

1. **Schedule Trigger**: Daily at 9 AM
2. **Topic Generator**: AI suggests trending topics
3. **Content Creation**: Generate post content using AI
4. **Image Generation**: Create accompanying visuals
5. **Quality Check**: Validate content meets guidelines
6. **Multi-Platform Post**: Publish to TikTok, Instagram, Facebook
7. **Analytics Tracker**: Record performance metrics

.. code-block:: text

   [Schedule] → [Topic Gen] → [Content AI] → [Image AI] → [Validation] → [Post] → [Analytics]

Document Processing Workflow
-----------------------------

**Purpose**: Process uploaded documents with AI analysis

**Workflow**:

1. **File Upload Trigger**: New document uploaded
2. **Format Detection**: Identify file type and structure
3. **Text Extraction**: Extract content from PDFs/images
4. **AI Analysis**: Summarize and extract key information
5. **Classification**: Categorize document type
6. **Database Storage**: Save processed data
7. **Notification**: Alert relevant users

.. code-block:: text

   [Upload] → [Detect] → [Extract] → [AI Analysis] → [Classify] → [Store] → [Notify]

Customer Support Automation
----------------------------

**Purpose**: Automate initial customer support responses

**Workflow**:

1. **Email Trigger**: New support email received
2. **Content Analysis**: Extract issue type and urgency
3. **Knowledge Base Search**: Find relevant solutions
4. **AI Response**: Generate personalized response
5. **Human Review**: Optional manual approval
6. **Email Reply**: Send response to customer
7. **Ticket Creation**: Create support ticket if needed

.. code-block:: text

   [Email] → [Analyze] → [Search KB] → [AI Response] → [Review] → [Reply] → [Ticket]

Advanced Features
=================

Conditional Logic
-----------------

Create branching workflows based on data conditions:

.. code-block:: javascript

   // Example: Route based on content type
   if (contentType === "urgent") {
     route = "immediate_processing";
   } else if (contentType === "normal") {
     route = "queue_processing";
   } else {
     route = "manual_review";
   }

Data Transformation
-------------------

Transform data between nodes:

.. code-block:: javascript

   // Example: Format social media data
   function transform(inputData) {
     return {
       platform: inputData.source,
       content: inputData.text.substring(0, 280),
       hashtags: inputData.tags.map(tag => `#${tag}`),
       schedule_time: new Date(inputData.publish_date)
     };
   }

Error Handling
--------------

Implement robust error handling:

.. code-block:: javascript

   try {
     // Main workflow path
     result = processContent(input);
   } catch (error) {
     // Fallback path
     result = fallbackProcess(input);
     notifyAdmin(error);
   }

Custom Nodes
============

Creating Custom Nodes
----------------------

Extend the workflow builder with custom nodes:

1. **Define Node Schema**:

   .. code-block:: javascript

      {
        "name": "CustomAnalyzer",
        "category": "AI",
        "inputs": ["text_input"],
        "outputs": ["analysis_result"],
        "parameters": {
          "analysis_type": "string",
          "confidence_threshold": "number"
        }
      }

2. **Implement Node Logic**:

   .. code-block:: python

      class CustomAnalyzerNode:
          def execute(self, input_data, parameters):
              # Custom analysis logic
              result = perform_analysis(
                  input_data["text_input"],
                  parameters["analysis_type"],
                  parameters["confidence_threshold"]
              )
              return {"analysis_result": result}

3. **Register Node**:

   .. code-block:: python

      workflow_builder.register_node("CustomAnalyzer", CustomAnalyzerNode)

Node Development Best Practices
-------------------------------

1. **Error Handling**: Always include try-catch blocks
2. **Input Validation**: Validate all input parameters
3. **Resource Cleanup**: Properly close connections and files
4. **Logging**: Log important operations and errors
5. **Testing**: Create unit tests for node logic

API Integration
===============

REST API Workflow Management
-----------------------------

**Create Workflow**:

.. code-block:: bash

   curl -X POST http://localhost:5002/api/workflows \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Workflow",
       "description": "Automated content pipeline",
       "nodes": [...],
       "connections": [...]
     }'

**Execute Workflow**:

.. code-block:: bash

   curl -X POST http://localhost:5002/api/workflows/{id}/execute \
     -H "Content-Type: application/json" \
     -d '{"input_data": {...}}'

**Monitor Execution**:

.. code-block:: bash

   curl http://localhost:5002/api/workflows/{id}/executions

WebSocket Real-time Updates
----------------------------

Subscribe to workflow execution updates:

.. code-block:: javascript

   const socket = io('http://localhost:5002');
   
   socket.on('workflow_progress', (data) => {
     console.log(`Workflow ${data.id}: ${data.status}`);
     updateProgressBar(data.progress);
   });
   
   socket.on('workflow_complete', (data) => {
     console.log('Workflow completed:', data.result);
   });

Best Practices
==============

Workflow Design
---------------

1. **Keep It Simple**: Start with basic workflows and add complexity gradually
2. **Modular Design**: Create reusable sub-workflows
3. **Error Handling**: Always include error paths and fallbacks
4. **Documentation**: Add descriptions to nodes and workflows
5. **Testing**: Test workflows with various input scenarios

Performance Optimization
------------------------

1. **Minimize API Calls**: Batch operations when possible
2. **Async Operations**: Use parallel processing for independent tasks
3. **Caching**: Cache frequently used data and results
4. **Resource Management**: Monitor memory and CPU usage
5. **Timeout Handling**: Set appropriate timeouts for external calls

Security Considerations
-----------------------

1. **Input Validation**: Sanitize all user inputs
2. **Access Control**: Implement proper permissions
3. **Secret Management**: Securely store API keys and credentials
4. **Audit Logging**: Track all workflow executions
5. **Rate Limiting**: Prevent abuse of external APIs

Troubleshooting
===============

Common Issues
-------------

**Workflow Won't Start**
   * Check trigger configuration
   * Verify input data format
   * Ensure all required parameters are set

**Node Execution Fails**
   * Review node configuration
   * Check external service availability
   * Verify data format between nodes

**Performance Issues**
   * Monitor resource usage
   * Optimize data transformations
   * Consider parallel processing

**Connection Errors**
   * Verify external service credentials
   * Check network connectivity
   * Review API rate limits

Debugging Tools
---------------

1. **Execution Logs**: Review detailed execution logs
2. **Data Inspector**: Examine data flow between nodes
3. **Performance Monitor**: Track execution times
4. **Error Console**: View error messages and stack traces

Next Steps
==========

* **Learn API Integration**: :doc:`api-usage`
* **Understand Architecture**: :doc:`../development/architecture`
* **Deploy Workflows**: :doc:`../development/deployment`
* **Explore RAG Integration**: :doc:`rag-system`

The Workflow Builder provides a powerful platform for automating complex business processes. With proper design and implementation, workflows can significantly improve efficiency and reduce manual effort in your operations.
