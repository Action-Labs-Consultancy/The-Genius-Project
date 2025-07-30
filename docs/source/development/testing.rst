=======
Testing
=======

The Genius Project implements comprehensive testing strategies to ensure code quality, reliability, and maintainability. This guide covers testing methodologies, tools, and best practices used throughout the project.

Testing Philosophy
==================

The project follows a multi-layered testing approach:

**Test Pyramid**:
- **Unit Tests (70%)**: Fast, isolated tests for individual components
- **Integration Tests (20%)**: Test component interactions and APIs
- **End-to-End Tests (10%)**: Test complete user workflows

**Testing Principles**:
- **Test-Driven Development (TDD)**: Write tests before implementation
- **Continuous Testing**: Automated testing in CI/CD pipeline
- **Coverage Goals**: Maintain >85% code coverage
- **Quality Gates**: Tests must pass before merging

Test Structure
==============

Directory Organization
----------------------

.. code-block:: text

   tests/
   ├── unit/                    # Unit tests
   │   ├── backend/
   │   │   ├── test_auth.py
   │   │   ├── test_models.py
   │   │   ├── test_brain_routes.py
   │   │   └── test_workflow_api.py
   │   ├── rag_app/
   │   │   ├── test_ingest.py
   │   │   ├── test_chat_storage.py
   │   │   └── test_web_app.py
   │   └── api/
   │       ├── test_dashboard.py
   │       └── test_social_media.py
   ├── integration/             # Integration tests
   │   ├── test_api_endpoints.py
   │   ├── test_database_ops.py
   │   ├── test_ai_workflows.py
   │   └── test_external_apis.py
   ├── e2e/                     # End-to-end tests
   │   ├── test_user_journey.py
   │   ├── test_rag_system.py
   │   └── test_workflow_execution.py
   ├── performance/             # Performance tests
   │   ├── test_load.py
   │   ├── test_stress.py
   │   └── test_scalability.py
   ├── fixtures/                # Test data and mocks
   │   ├── sample_documents/
   │   ├── mock_responses/
   │   └── test_data.json
   └── conftest.py             # Pytest configuration

Testing Tools and Frameworks
=============================

Python Testing Stack
---------------------

**Primary Framework**: pytest
- Flexible test discovery and execution
- Rich fixture system
- Parametrized testing
- Plugin ecosystem

**Additional Tools**:
- **pytest-cov**: Code coverage reporting
- **pytest-mock**: Mocking and patching
- **pytest-asyncio**: Async test support
- **pytest-xdist**: Parallel test execution
- **factory-boy**: Test data generation
- **faker**: Fake data generation

**Example pytest configuration** (``pytest.ini``):

.. code-block:: ini

   [tool:pytest]
   testpaths = tests
   python_files = test_*.py
   python_classes = Test*
   python_functions = test_*
   addopts = 
       --strict-markers
       --cov=backend
       --cov=rag-app
       --cov=api
       --cov-report=html
       --cov-report=term-missing
       --cov-fail-under=85

JavaScript/Frontend Testing
---------------------------

**Testing Framework**: Jest + React Testing Library
- Component testing
- User interaction simulation
- Accessibility testing

**Tools**:
- **Jest**: Test runner and assertion library
- **React Testing Library**: DOM testing utilities
- **MSW**: API mocking
- **Cypress**: E2E testing

Unit Testing
============

Backend Unit Tests
------------------

**Authentication Testing**:

.. code-block:: python

   # tests/unit/backend/test_auth.py
   import pytest
   from backend.auth import authenticate_user, generate_token
   from backend.models.user import User

   class TestAuthentication:
       
       def test_successful_authentication(self, sample_user):
           """Test successful user authentication."""
           result = authenticate_user(
               email=sample_user.email,
               password="correct_password"
           )
           assert result is not None
           assert result.email == sample_user.email

       def test_failed_authentication_wrong_password(self, sample_user):
           """Test authentication failure with wrong password."""
           result = authenticate_user(
               email=sample_user.email,
               password="wrong_password"
           )
           assert result is None

       def test_token_generation(self, sample_user):
           """Test JWT token generation."""
           token = generate_token(sample_user)
           assert token is not None
           assert len(token.split('.')) == 3  # JWT has 3 parts

       @pytest.mark.parametrize("invalid_email", [
           "invalid-email",
           "",
           None,
           "test@",
           "@example.com"
       ])
       def test_invalid_email_formats(self, invalid_email):
           """Test authentication with invalid email formats."""
           result = authenticate_user(
               email=invalid_email,
               password="password123"
           )
           assert result is None

**Model Testing**:

.. code-block:: python

   # tests/unit/backend/test_models.py
   import pytest
   from backend.models.user import User
   from backend.models.brain import Brain

   class TestUserModel:
       
       def test_user_creation(self, db_session):
           """Test user model creation."""
           user_data = {
               "email": "test@example.com",
               "name": "Test User",
               "password": "hashed_password"
           }
           user = User.create(user_data)
           
           assert user.id is not None
           assert user.email == "test@example.com"
           assert user.name == "Test User"
           assert user.created_at is not None

       def test_user_validation(self):
           """Test user data validation."""
           with pytest.raises(ValueError, match="Invalid email"):
               User.create({
                   "email": "invalid-email",
                   "name": "Test User",
                   "password": "password123"
               })

       def test_password_hashing(self):
           """Test password is properly hashed."""
           user = User.create({
               "email": "test@example.com",
               "name": "Test User",
               "password": "plain_password"
           })
           assert user.password != "plain_password"
           assert user.check_password("plain_password") is True

**API Route Testing**:

.. code-block:: python

   # tests/unit/backend/test_brain_routes.py
   import pytest
   from flask import json

   class TestBrainRoutes:
       
       def test_create_brain(self, client, auth_headers):
           """Test brain creation endpoint."""
           brain_data = {
               "name": "Test Brain",
               "description": "A test brain",
               "model": "llama3",
               "system_prompt": "You are a helpful assistant"
           }
           
           response = client.post(
               '/api/brains',
               data=json.dumps(brain_data),
               headers=auth_headers,
               content_type='application/json'
           )
           
           assert response.status_code == 201
           data = json.loads(response.data)
           assert data['name'] == "Test Brain"
           assert data['model'] == "llama3"

       def test_get_brain_list(self, client, auth_headers, sample_brains):
           """Test brain listing endpoint."""
           response = client.get('/api/brains', headers=auth_headers)
           
           assert response.status_code == 200
           data = json.loads(response.data)
           assert len(data['brains']) == len(sample_brains)

       def test_brain_chat(self, client, auth_headers, sample_brain):
           """Test brain chat endpoint."""
           chat_data = {
               "message": "Hello, how are you?",
               "context": {}
           }
           
           response = client.post(
               f'/api/brains/{sample_brain.id}/chat',
               data=json.dumps(chat_data),
               headers=auth_headers,
               content_type='application/json'
           )
           
           assert response.status_code == 200
           data = json.loads(response.data)
           assert 'response' in data
           assert 'conversation_id' in data

RAG System Unit Tests
---------------------

**Document Processing**:

.. code-block:: python

   # tests/unit/rag_app/test_ingest.py
   import pytest
   from rag_app.ingest import DocumentProcessor, TextSplitter

   class TestDocumentProcessor:
       
       def test_pdf_processing(self, sample_pdf_path):
           """Test PDF document processing."""
           processor = DocumentProcessor()
           documents = processor.load_documents([sample_pdf_path])
           
           assert len(documents) > 0
           assert documents[0].page_content
           assert documents[0].metadata['source'] == sample_pdf_path

       def test_text_splitting(self, sample_text):
           """Test text splitting functionality."""
           splitter = TextSplitter(
               chunk_size=100,
               chunk_overlap=20
           )
           chunks = splitter.split_text(sample_text)
           
           assert len(chunks) > 1
           assert all(len(chunk) <= 120 for chunk in chunks)  # Including overlap

       def test_embedding_generation(self, sample_documents):
           """Test embedding generation for documents."""
           processor = DocumentProcessor()
           embeddings = processor.generate_embeddings(sample_documents)
           
           assert len(embeddings) == len(sample_documents)
           assert all(len(emb) == 1536 for emb in embeddings)  # OpenAI embedding size

**Chat Storage**:

.. code-block:: python

   # tests/unit/rag_app/test_chat_storage.py
   import pytest
   from rag_app.chat_storage import ChatStorage

   class TestChatStorage:
       
       def test_save_conversation(self, temp_storage_dir):
           """Test conversation saving."""
           storage = ChatStorage(temp_storage_dir)
           messages = [
               {"role": "user", "content": "Hello"},
               {"role": "assistant", "content": "Hi there!"}
           ]
           
           chat_id = storage.save_conversation(messages, "Test Chat")
           assert chat_id is not None

       def test_load_conversation(self, temp_storage_dir, sample_conversation):
           """Test conversation loading."""
           storage = ChatStorage(temp_storage_dir)
           chat_id = storage.save_conversation(
               sample_conversation.messages,
               sample_conversation.title
           )
           
           loaded_messages = storage.load_conversation(chat_id)
           assert loaded_messages == sample_conversation.messages

       def test_list_conversations(self, temp_storage_dir, multiple_conversations):
           """Test conversation listing."""
           storage = ChatStorage(temp_storage_dir)
           conversations = storage.list_conversations()
           
           assert len(conversations) == len(multiple_conversations)
           assert all('id' in conv for conv in conversations)
           assert all('title' in conv for conv in conversations)

Integration Testing
===================

API Integration Tests
---------------------

**Full API Workflow Testing**:

.. code-block:: python

   # tests/integration/test_api_endpoints.py
   import pytest
   import requests

   class TestAPIIntegration:
       
       def test_complete_brain_workflow(self, api_client, test_user):
           """Test complete brain creation and usage workflow."""
           # Login
           auth_response = api_client.post('/api/auth/login', json={
               'email': test_user.email,
               'password': 'test_password'
           })
           token = auth_response.json()['token']
           headers = {'Authorization': f'Bearer {token}'}
           
           # Create brain
           brain_response = api_client.post('/api/brains', 
               headers=headers,
               json={
                   'name': 'Integration Test Brain',
                   'model': 'llama3',
                   'system_prompt': 'You are a test assistant'
               }
           )
           brain_id = brain_response.json()['id']
           
           # Chat with brain
           chat_response = api_client.post(f'/api/brains/{brain_id}/chat',
               headers=headers,
               json={'message': 'Hello, test message'}
           )
           
           assert chat_response.status_code == 200
           assert 'response' in chat_response.json()

**Database Integration**:

.. code-block:: python

   # tests/integration/test_database_ops.py
   import pytest
   from backend.models.user import User
   from backend.models.brain import Brain

   class TestDatabaseIntegration:
       
       def test_user_brain_relationship(self, db_session):
           """Test user-brain relationship in database."""
           # Create user
           user = User.create({
               'email': 'test@example.com',
               'name': 'Test User',
               'password': 'hashed_password'
           })
           
           # Create brain for user
           brain = Brain.create({
               'name': 'User Brain',
               'owner_id': user.id,
               'model': 'llama3'
           })
           
           # Test relationship
           user_brains = Brain.find_by_owner(user.id)
           assert len(user_brains) == 1
           assert user_brains[0].id == brain.id

External Service Integration
----------------------------

**Ollama Integration**:

.. code-block:: python

   # tests/integration/test_ai_workflows.py
   import pytest
   from rag_app.main import RAGChatbot

   class TestAIIntegration:
       
       @pytest.mark.integration
       def test_ollama_connection(self):
           """Test connection to Ollama service."""
           chatbot = RAGChatbot()
           response = chatbot.test_connection()
           assert response is True

       @pytest.mark.integration
       def test_rag_query_flow(self, sample_documents_db):
           """Test complete RAG query flow."""
           chatbot = RAGChatbot()
           response = chatbot.query("What is the installation process?")
           
           assert response is not None
           assert len(response) > 0
           assert 'sources' in response

End-to-End Testing
==================

User Journey Tests
------------------

.. code-block:: python

   # tests/e2e/test_user_journey.py
   import pytest
   from selenium import webdriver
   from selenium.webdriver.common.by import By

   class TestUserJourney:
       
       @pytest.mark.e2e
       def test_complete_user_registration_and_usage(self, browser):
           """Test complete user journey from registration to AI usage."""
           # Navigate to registration
           browser.get("http://localhost:3000/register")
           
           # Fill registration form
           browser.find_element(By.NAME, "email").send_keys("test@example.com")
           browser.find_element(By.NAME, "name").send_keys("Test User")
           browser.find_element(By.NAME, "password").send_keys("password123")
           browser.find_element(By.TYPE, "submit").click()
           
           # Verify registration success
           assert "Welcome" in browser.page_source
           
           # Navigate to brain creation
           browser.find_element(By.LINK_TEXT, "Create Brain").click()
           
           # Create brain
           browser.find_element(By.NAME, "name").send_keys("Test Brain")
           browser.find_element(By.NAME, "model").send_keys("llama3")
           browser.find_element(By.TYPE, "submit").click()
           
           # Test brain chat
           browser.find_element(By.NAME, "message").send_keys("Hello")
           browser.find_element(By.TYPE, "submit").click()
           
           # Verify response
           assert "response" in browser.page_source.lower()

Performance Testing
===================

Load Testing
------------

.. code-block:: python

   # tests/performance/test_load.py
   import pytest
   import asyncio
   import aiohttp
   from concurrent.futures import ThreadPoolExecutor

   class TestPerformance:
       
       @pytest.mark.performance
       async def test_api_load(self):
           """Test API under load conditions."""
           async def make_request(session, url):
               async with session.get(url) as response:
                   return response.status
           
           async with aiohttp.ClientSession() as session:
               tasks = [
                   make_request(session, "http://localhost:5002/health")
                   for _ in range(100)
               ]
               responses = await asyncio.gather(*tasks)
           
           success_rate = sum(1 for r in responses if r == 200) / len(responses)
           assert success_rate >= 0.95  # 95% success rate required

       @pytest.mark.performance
       def test_rag_response_time(self, rag_chatbot):
           """Test RAG system response time."""
           import time
           
           start_time = time.time()
           response = rag_chatbot.query("What is the main topic of the documents?")
           end_time = time.time()
           
           response_time = end_time - start_time
           assert response_time < 5.0  # Response within 5 seconds
           assert response is not None

Test Fixtures and Utilities
============================

Pytest Fixtures
----------------

.. code-block:: python

   # tests/conftest.py
   import pytest
   import tempfile
   from flask import Flask
   from backend.app import create_app
   from backend.models.user import User
   from rag_app.chat_storage import ChatStorage

   @pytest.fixture(scope="session")
   def app():
       """Create application for testing."""
       app = create_app(testing=True)
       with app.app_context():
           yield app

   @pytest.fixture
   def client(app):
       """Create test client."""
       return app.test_client()

   @pytest.fixture
   def db_session(app):
       """Create database session for testing."""
       with app.app_context():
           from backend.core.models import db
           db.create_all()
           yield db.session
           db.session.rollback()
           db.drop_all()

   @pytest.fixture
   def sample_user(db_session):
       """Create sample user for testing."""
       user = User.create({
           'email': 'test@example.com',
           'name': 'Test User',
           'password': 'hashed_password'
       })
       return user

   @pytest.fixture
   def auth_headers(sample_user):
       """Create authentication headers."""
       token = generate_token(sample_user)
       return {
           'Authorization': f'Bearer {token}',
           'Content-Type': 'application/json'
       }

   @pytest.fixture
   def temp_storage_dir():
       """Create temporary storage directory."""
       with tempfile.TemporaryDirectory() as temp_dir:
           yield temp_dir

Mock Objects and Data
---------------------

.. code-block:: python

   # tests/fixtures/mock_responses.py
   import json
   from unittest.mock import Mock

   class MockOllamaResponse:
       """Mock Ollama API response."""
       
       def __init__(self, content="Mock response"):
           self.content = content
       
       def json(self):
           return {
               "response": self.content,
               "done": True
           }

   @pytest.fixture
   def mock_ollama(monkeypatch):
       """Mock Ollama API calls."""
       mock_response = Mock()
       mock_response.json.return_value = {
           "response": "This is a mocked response from Ollama",
           "done": True
       }
       
       monkeypatch.setattr("requests.post", Mock(return_value=mock_response))
       return mock_response

Test Data Factories
--------------------

.. code-block:: python

   # tests/fixtures/factories.py
   import factory
   from backend.models.user import User
   from backend.models.brain import Brain

   class UserFactory(factory.Factory):
       class Meta:
           model = User
       
       email = factory.Sequence(lambda n: f"user{n}@example.com")
       name = factory.Faker('name')
       password = 'hashed_password'
       role = 'user'

   class BrainFactory(factory.Factory):
       class Meta:
           model = Brain
       
       name = factory.Faker('sentence', nb_words=2)
       description = factory.Faker('text', max_nb_chars=200)
       model = 'llama3'
       system_prompt = 'You are a helpful assistant'
       owner = factory.SubFactory(UserFactory)

Continuous Integration
======================

GitHub Actions Workflow
------------------------

.. code-block:: yaml

   # .github/workflows/test.yml
   name: Test Suite

   on:
     push:
       branches: [ main, develop ]
     pull_request:
       branches: [ main ]

   jobs:
     test:
       runs-on: ubuntu-latest
       
       services:
         mongodb:
           image: mongo:5.0
           ports:
             - 27017:27017
       
       steps:
       - uses: actions/checkout@v3
       
       - name: Set up Python
         uses: actions/setup-python@v4
         with:
           python-version: '3.9'
       
       - name: Install dependencies
         run: |
           pip install -r backend/requirements.txt
           pip install pytest pytest-cov
       
       - name: Run unit tests
         run: |
           pytest tests/unit/ --cov=backend --cov-report=xml
       
       - name: Run integration tests
         run: |
           pytest tests/integration/
       
       - name: Upload coverage
         uses: codecov/codecov-action@v3
         with:
           file: ./coverage.xml

Quality Gates
-------------

**Pre-commit Hooks**:

.. code-block:: yaml

   # .pre-commit-config.yaml
   repos:
   - repo: https://github.com/psf/black
     rev: 22.3.0
     hooks:
     - id: black

   - repo: https://github.com/pycqa/flake8
     rev: 4.0.1
     hooks:
     - id: flake8

   - repo: local
     hooks:
     - id: pytest-check
       name: pytest-check
       entry: pytest tests/unit/
       language: system
       pass_filenames: false
       always_run: true

Best Practices
==============

Writing Effective Tests
-----------------------

1. **Clear Test Names**: Use descriptive test method names
2. **Single Responsibility**: Each test should verify one thing
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Test Edge Cases**: Include boundary conditions and error cases
5. **Mock External Dependencies**: Isolate units under test

Test Maintenance
----------------

1. **Regular Review**: Review and update tests regularly
2. **Refactor Test Code**: Keep test code clean and DRY
3. **Update Test Data**: Keep test fixtures current
4. **Monitor Coverage**: Maintain high test coverage
5. **Performance Monitoring**: Track test execution time

Common Testing Patterns
-----------------------

**Parameterized Tests**:

.. code-block:: python

   @pytest.mark.parametrize("input,expected", [
       ("valid@email.com", True),
       ("invalid-email", False),
       ("", False),
       (None, False)
   ])
   def test_email_validation(input, expected):
       assert validate_email(input) == expected

**Exception Testing**:

.. code-block:: python

   def test_invalid_brain_creation():
       with pytest.raises(ValueError, match="Invalid model"):
           Brain.create({"name": "Test", "model": "invalid_model"})

**Async Testing**:

.. code-block:: python

   @pytest.mark.asyncio
   async def test_async_function():
       result = await some_async_function()
       assert result is not None

Troubleshooting Tests
=====================

Common Issues
-------------

**Flaky Tests**: Tests that pass/fail inconsistently
- Solution: Identify timing issues, external dependencies

**Slow Tests**: Tests taking too long to execute
- Solution: Mock external calls, optimize database operations

**Test Isolation**: Tests affecting each other
- Solution: Proper cleanup, independent test data

**Environment Issues**: Tests failing in CI but passing locally
- Solution: Environment-specific configuration, dependency management

Debugging Strategies
--------------------

1. **Use pytest --pdb**: Drop into debugger on failure
2. **Verbose Output**: Use -v flag for detailed output
3. **Run Specific Tests**: Test individual methods/classes
4. **Check Logs**: Review application logs during tests
5. **Test Data Inspection**: Verify test fixture data

Next Steps
==========

1. **Set up your testing environment**: Install pytest and dependencies
2. **Write your first tests**: Start with simple unit tests
3. **Add integration tests**: Test API endpoints and database operations
4. **Implement CI/CD**: Set up automated testing pipeline
5. **Monitor test metrics**: Track coverage and performance

Testing is crucial for maintaining code quality and preventing regressions. Start with basic unit tests and gradually build up your test suite to include integration and end-to-end tests.
