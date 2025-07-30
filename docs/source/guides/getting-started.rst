===============
Getting Started
===============

This guide will help you get The Genius Project up and running on your local machine.

System Requirements
===================

Hardware
--------

* **RAM**: Minimum 8GB, recommended 16GB or more
* **Storage**: At least 5GB free space
* **CPU**: Modern multi-core processor (Intel i5/AMD Ryzen 5 or better)
* **Network**: Internet connection for initial setup and model downloads

Software
--------

* **Python**: 3.8 or higher
* **Node.js**: 16.0 or higher (for frontend development)
* **Git**: Latest version
* **MongoDB**: 4.4 or higher (or MongoDB Atlas account)
* **Ollama**: Latest version (for local AI models)

Installation Guide
==================

Step 1: Clone the Repository
-----------------------------

.. code-block:: bash

   git clone <your-repository-url>
   cd the-genius-project

Step 2: Backend Setup
----------------------

1. **Create Python Virtual Environment**:

   .. code-block:: bash

      cd backend
      python -m venv venv
      
      # Activate virtual environment
      # On macOS/Linux:
      source venv/bin/activate
      
      # On Windows:
      # venv\Scripts\activate

2. **Install Python Dependencies**:

   .. code-block:: bash

      pip install -r requirements.txt

3. **Environment Configuration**:

   .. code-block:: bash

      cp .env.example .env

   Edit the ``.env`` file with your configuration:

   .. code-block:: bash

      # Database Configuration
      MONGODB_URI=mongodb://localhost:27017/genius_db
      DATABASE_URL=sqlite:///instance/genius.db
      
      # Security
      SECRET_KEY=your-secret-key-here
      JWT_SECRET_KEY=your-jwt-secret-here
      
      # AI Services
      OPENAI_API_KEY=your-openai-api-key
      PINECONE_API_KEY=your-pinecone-api-key
      PINECONE_ENVIRONMENT=your-pinecone-environment
      
      # Application Settings
      FLASK_ENV=development
      DEBUG=True

Step 3: Database Setup
----------------------

1. **Initialize Database**:

   .. code-block:: bash

      python init_db.py

2. **Create Test Users** (optional):

   .. code-block:: bash

      python test_users.py

Step 4: RAG System Setup
------------------------

1. **Install Ollama**:

   .. code-block:: bash

      # On macOS:
      brew install ollama
      
      # Or download from https://ollama.ai

2. **Pull Required Models**:

   .. code-block:: bash

      ollama pull llama3
      ollama pull mistral

3. **Setup RAG Environment**:

   .. code-block:: bash

      cd ../rag-app
      pip install -r requirements.txt

4. **Prepare Documents**:

   Place your documents in the ``rag-app/data/`` directory:

   .. code-block:: bash

      mkdir -p data
      # Copy your PDF and text files to the data directory

5. **Ingest Documents**:

   .. code-block:: bash

      python ingest.py

Step 5: Frontend Setup (Optional)
----------------------------------

If you plan to work on the frontend:

1. **Install Node.js Dependencies**:

   .. code-block:: bash

      cd ../frontend
      npm install

2. **Start Frontend Development Server**:

   .. code-block:: bash

      npm start

Starting the Application
========================

Backend Server
--------------

.. code-block:: bash

   cd backend
   source venv/bin/activate  # If not already activated
   python app.py

The backend will start on ``http://localhost:5002``

RAG Web Interface
-----------------

.. code-block:: bash

   cd rag-app
   python web_app.py

The RAG chat interface will be available at ``http://localhost:8000``

Ollama Server
-------------

In a separate terminal:

.. code-block:: bash

   ollama serve

Verification
============

Health Checks
-------------

1. **Backend Health**:

   .. code-block:: bash

      curl http://localhost:5002/health

2. **Database Connectivity**:

   .. code-block:: bash

      curl http://localhost:5002/test/simple

3. **RAG System**:

   Visit ``http://localhost:8000`` and try asking a question about your documents.

Test Login
----------

If you created test users, you can log in with:

* **Admin User**: ``admin@genius.com`` / ``admin123``
* **Test User**: ``test@genius.com`` / ``test123``

Common Issues
=============

Port Conflicts
--------------

If ports are already in use, you can change them:

* **Backend**: Modify ``app.py`` to use a different port
* **RAG App**: Use ``--port`` flag: ``python web_app.py --port 8001``
* **Frontend**: React will automatically suggest alternative ports

MongoDB Connection Issues
-------------------------

1. **Check MongoDB Status**:

   .. code-block:: bash

      # On macOS with Homebrew:
      brew services list | grep mongodb
      
      # Start if not running:
      brew services start mongodb-community

2. **Alternative: Use MongoDB Atlas**:

   Update your ``.env`` file with Atlas connection string:

   .. code-block:: bash

      MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/genius_db

Ollama Issues
-------------

1. **Check Ollama Status**:

   .. code-block:: bash

      ollama list

2. **Restart Ollama**:

   .. code-block:: bash

      # Stop any running Ollama processes
      pkill ollama
      
      # Start Ollama server
      ollama serve

Next Steps
==========

Once you have the system running:

1. **Explore the RAG System**: :doc:`rag-system`
2. **Learn the Workflow Builder**: :doc:`workflow-builder`
3. **Understand the API**: :doc:`api-usage`
4. **Check the Architecture**: :doc:`../development/architecture`

Congratulations! You now have The Genius Project running locally. The next guides will help you make the most of its features.
