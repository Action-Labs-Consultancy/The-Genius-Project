==================================
The Genius Project Documentation
==================================

Welcome to The Genius Project - a comprehensive AI-powered platform that combines intelligent workflows, document management, social media analytics, and conversational AI capabilities.

.. image:: https://img.shields.io/badge/python-3.8+-blue.svg
   :target: https://www.python.org/downloads/
   :alt: Python Version

.. image:: https://img.shields.io/badge/license-MIT-green.svg
   :target: https://opensource.org/licenses/MIT
   :alt: License

Project Overview
================

The Genius Project is a multi-faceted application built with Python, featuring:

* **AI-Powered Backend**: Flask-based API with intelligent agent services
* **Document RAG System**: Local Retrieval-Augmented Generation chatbot
* **Social Media Analytics**: TikTok and Meta platform integration
* **Workflow Management**: Visual workflow builder with execution capabilities
* **User Management**: Authentication and authorization system
* **Real-time Communication**: WebSocket support for live interactions

Key Features
============

🤖 **AI & Machine Learning**
   - Local RAG (Retrieval-Augmented Generation) chatbot system
   - Integration with Ollama and LangChain
   - Intelligent content generation and analysis
   - Brain-based knowledge management with Pinecone vector database

📊 **Analytics & Insights**
   - Social media performance tracking
   - Real-time data visualization
   - Campaign analysis and optimization
   - KPI monitoring and reporting

🔄 **Workflow Automation**
   - Visual workflow builder
   - Automated task execution
   - Integration with external services
   - Custom node development support

🛡️ **Security & Authentication**
   - JWT-based authentication
   - Role-based access control
   - Secure password management
   - API rate limiting and security middleware

Architecture
============

Backend Services
-----------------

The backend is organized into several key modules:

* **Core Application** (``backend/app.py``): Main Flask application entry point
* **AI Services** (``backend/ai/``): Intelligent agent and brain management
* **Authentication** (``backend/auth.py``): User authentication and authorization
* **Routes** (``backend/*_routes.py``): API endpoint definitions
* **Models** (``backend/models/``): Database models and schemas
* **Configuration** (``backend/config/``): Application configuration management

RAG System
-----------

The Retrieval-Augmented Generation system (``rag-app/``) provides:

* **Document Ingestion** (``rag-app/ingest.py``): Process and vectorize documents
* **Chat Interface** (``rag-app/main.py``): CLI-based chat application
* **Web Interface** (``rag-app/web_app.py``): FastAPI-based web chat
* **Storage Management** (``rag-app/chat_storage.py``): Conversation persistence

API Services
------------

Serverless API functions (``api/``) for Vercel deployment:

* **Authentication**: Login, registration, password reset
* **Dashboard**: Analytics data and visualizations
* **Social Media**: Platform integrations and data fetching
* **Health Checks**: System status monitoring

Quick Start
===========

Prerequisites
-------------

* Python 3.8 or higher
* Node.js 16+ (for frontend)
* MongoDB (for data storage)
* Ollama (for local AI models)

Installation
------------

1. **Clone the repository**:

   .. code-block:: bash

      git clone <repository-url>
      cd the-genius-project

2. **Backend Setup**:

   .. code-block:: bash

      cd backend
      python -m venv venv
      source venv/bin/activate  # On Windows: venv\\Scripts\\activate
      pip install -r requirements.txt

3. **Environment Configuration**:

   Copy ``.env.example`` to ``.env`` and configure your environment variables:

   .. code-block:: bash

      cp backend/.env.example backend/.env
      # Edit .env with your configuration

4. **Database Setup**:

   .. code-block:: bash

      python backend/init_db.py

5. **Start the Backend**:

   .. code-block:: bash

      cd backend
      python app.py

6. **RAG System Setup**:

   .. code-block:: bash

      cd rag-app
      pip install -r requirements.txt
      python ingest.py  # Process your documents
      python web_app.py  # Start web interface

Development
===========

Project Structure
-----------------

.. code-block::

   the-genius-project/
   ├── backend/                 # Flask backend application
   │   ├── adapters/           # External service adapters
   │   ├── ai/                 # AI and ML services
   │   ├── config/             # Configuration management
   │   ├── core/               # Core business logic
   │   ├── models/             # Database models
   │   ├── routes/             # API route definitions
   │   └── app.py              # Main application entry
   ├── frontend/               # React frontend application
   │   └── src/                # React components and pages
   ├── rag-app/                # RAG chatbot system
   │   ├── data/               # Document storage
   │   ├── static/             # Web interface assets
   │   └── *.py                # RAG implementation files
   ├── api/                    # Serverless API functions
   │   ├── dashboard/          # Analytics endpoints
   │   ├── social-media/       # Social platform integrations
   │   └── *.py                # API route handlers
   └── docs/                   # Documentation (this site)

Testing
-------

Run the test suite:

.. code-block:: bash

   # Backend tests
   cd backend
   python -m pytest

   # API tests
   python test_routes.py

   # Database connectivity
   python test_mongodb.py

Contributing
============

1. Fork the repository
2. Create a feature branch: ``git checkout -b feature-name``
3. Make your changes and add tests
4. Commit your changes: ``git commit -am 'Add feature'``
5. Push to the branch: ``git push origin feature-name``
6. Submit a pull request

Documentation
=============

.. toctree::
   :maxdepth: 2
   :caption: API Reference

   api/index

.. toctree::
   :maxdepth: 2
   :caption: User Guides

   guides/getting-started
   guides/rag-system
   guides/workflow-builder
   guides/api-usage

.. toctree::
   :maxdepth: 2
   :caption: Development

   development/architecture
   development/testing
   development/deployment

Support
=======

For questions, issues, or contributions:

* **Documentation**: This site contains comprehensive API documentation
* **Issues**: Please report bugs and feature requests via the project's issue tracker
* **Development**: Follow the contributing guidelines for code contributions

License
=======

This project is licensed under the MIT License. See the LICENSE file for details.

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
