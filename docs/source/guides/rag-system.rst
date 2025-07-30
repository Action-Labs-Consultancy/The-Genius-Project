====================
RAG System Guide
====================

The Retrieval-Augmented Generation (RAG) system is one of the core features of The Genius Project. It allows you to create a chatbot that can answer questions based on your own documents, running entirely locally without requiring API keys or internet connectivity for inference.

Overview
========

The RAG system combines:

* **Document Processing**: Automatic chunking and vectorization of your documents
* **Vector Database**: ChromaDB for efficient similarity search
* **Language Models**: Local models via Ollama (Llama3, Mistral, etc.)
* **Web Interface**: Beautiful, modern chat interface
* **CLI Interface**: Command-line chat for quick interactions
* **Conversation Memory**: Persistent chat history and context

Supported Document Types
=========================

Currently supported formats:

* **PDF Files** (``.pdf``): Automatically extracts text content
* **Text Files** (``.txt``): Plain text documents
* **Markdown Files** (``.md``): Markdown formatted text (if added)

Architecture
============

.. code-block::

   rag-app/
   ├── data/              # Your source documents
   ├── db/                # ChromaDB vector database (auto-created)
   ├── static/            # Web interface assets
   │   ├── index.html     # Chat interface
   │   └── style.css      # Styling
   ├── chats/             # Saved conversations (auto-created)
   ├── ingest.py          # Document processing
   ├── main.py            # CLI chatbot
   ├── web_app.py         # Web server
   ├── chat_storage.py    # Conversation management
   └── requirements.txt   # Dependencies

Setting Up Your Documents
=========================

Step 1: Prepare Your Documents
-------------------------------

1. **Create the data directory** (if it doesn't exist):

   .. code-block:: bash

      cd rag-app
      mkdir -p data

2. **Add your documents**:

   .. code-block:: bash

      # Copy PDFs
      cp ~/Documents/manual.pdf data/
      cp ~/Documents/guide.pdf data/
      
      # Copy text files
      cp ~/Documents/notes.txt data/
      cp ~/Documents/readme.txt data/

3. **Organize by topic** (optional):

   .. code-block:: bash

      mkdir -p data/manuals data/guides data/notes
      # Organize your files into subdirectories

Step 2: Process Documents
-------------------------

Run the ingestion script to process your documents:

.. code-block:: bash

   python ingest.py

This will:

* Load all documents from the ``data/`` directory
* Split them into manageable chunks (default: 1000 characters with 200 character overlap)
* Generate embeddings using a local HuggingFace model
* Store everything in ChromaDB vector database
* Create the ``db/`` directory with your vector database

**Output Example**:

.. code-block:: text

   Loading documents...
   Loaded 15 documents from data/
   Creating embeddings...
   Processing: manual.pdf (45 chunks)
   Processing: guide.pdf (32 chunks)
   Processing: notes.txt (8 chunks)
   Total chunks: 85
   Saving to vector database...
   ✅ Database created successfully!

Using the RAG System
=====================

CLI Interface
-------------

For quick command-line interactions:

.. code-block:: bash

   python main.py

**Features**:

* Interactive chat with your documents
* Conversation memory within the session
* Source citations showing which documents were used
* Streaming responses for real-time feedback

**Example Session**:

.. code-block:: text

   🤖 RAG Chatbot Ready! Type 'quit' to exit.
   
   You: What is the installation process?
   
   🤖 Based on your documentation, the installation process involves:
   
   1. Download the software package
   2. Extract to your desired directory
   3. Run the setup script with admin privileges
   4. Configure the environment variables
   
   📚 Sources: manual.pdf (pages 12-15)
   
   You: What are the system requirements?
   
   🤖 The system requirements are:
   - Operating System: Windows 10+ or macOS 10.15+
   - RAM: Minimum 8GB, recommended 16GB
   - Storage: 2GB free space
   - Network: Internet connection for initial setup
   
   📚 Sources: manual.pdf (page 3), guide.pdf (page 1)

Web Interface
-------------

For a modern, user-friendly experience:

.. code-block:: bash

   python web_app.py

Visit ``http://localhost:8000`` in your browser.

**Features**:

* Beautiful, responsive chat interface
* Real-time streaming responses
* Conversation history
* Save and load chat sessions
* Mobile-friendly design
* Source document references

**Web Interface Usage**:

1. **Start a conversation**: Type your question in the input field
2. **View responses**: Answers stream in real-time with source citations
3. **Save chat**: Use "Save Chat" button to preserve conversations
4. **Load previous chats**: Select from saved conversations
5. **Clear context**: Reset conversation memory when needed

Advanced Configuration
======================

Model Selection
---------------

Edit the model configuration in your scripts:

.. code-block:: python

   # In main.py or web_app.py
   llm = ChatOllama(
       model="llama3",        # Change to: mistral, codellama, etc.
       temperature=0.7,       # Creativity (0.0 = deterministic, 1.0 = creative)
       num_predict=2048,      # Maximum response length
   )

Chunk Size Optimization
-----------------------

Modify ``ingest.py`` for different document types:

.. code-block:: python

   text_splitter = RecursiveCharacterTextSplitter(
       chunk_size=1500,        # Larger chunks for technical docs
       chunk_overlap=300,      # More overlap for better context
   )

Custom Prompts
--------------

Create specialized prompts in ``advanced_prompts.py``:

.. code-block:: python

   TECHNICAL_PROMPT = """You are a technical documentation expert.
   Answer questions based only on the provided context.
   Be precise and include specific steps or code examples when available.
   
   Context: {context}
   Question: {question}
   Answer:"""

Conversation Management
=======================

Saving Conversations
--------------------

**CLI**: Conversations are automatically saved when you exit

**Web**: Use the "Save Chat" button in the interface

**Programmatic**:

.. code-block:: python

   from chat_storage import ChatStorage
   
   storage = ChatStorage()
   chat_id = storage.save_conversation(messages, title="My Chat")

Loading Previous Chats
----------------------

**Web Interface**: Select from the dropdown menu

**Programmatic**:

.. code-block:: python

   # List all chats
   chats = storage.list_conversations()
   
   # Load specific chat
   messages = storage.load_conversation(chat_id)

Performance Optimization
========================

For Large Document Sets
-----------------------

1. **Increase chunk overlap** for better context retrieval:

   .. code-block:: python

      chunk_overlap=400  # Higher overlap for better context

2. **Adjust retrieval parameters**:

   .. code-block:: python

      retriever = vectorstore.as_retriever(
          search_kwargs={"k": 8}  # Retrieve more relevant chunks
      )

3. **Use more powerful models**:

   .. code-block:: bash

      ollama pull llama3:70b  # Larger, more capable model

For Better Response Speed
-------------------------

1. **Use smaller, faster models**:

   .. code-block:: bash

      ollama pull llama3:8b    # Faster than 70b
      ollama pull mistral:7b   # Very fast and efficient

2. **Reduce chunk size** for faster processing:

   .. code-block:: python

      chunk_size=800, chunk_overlap=150

3. **Limit response length**:

   .. code-block:: python

      num_predict=1024  # Shorter responses

Troubleshooting
===============

Common Issues
-------------

**1. "No documents found in data/"**

* Check that documents are in the correct directory
* Ensure file formats are supported (.pdf, .txt)
* Verify file permissions

**2. "Ollama connection failed"**

* Ensure Ollama is running: ``ollama serve``
* Check if model is downloaded: ``ollama list``
* Verify port (default: 11434)

**3. "Vector database creation failed"**

* Check disk space in the ``rag-app/`` directory
* Ensure write permissions
* Try deleting ``db/`` directory and re-running ``ingest.py``

**4. "Poor answer quality"**

* Try different chunk sizes in ``ingest.py``
* Experiment with different models (llama3 vs mistral)
* Add more relevant documents to ``data/``
* Adjust temperature settings

Performance Issues
------------------

**Slow responses**:

* Use smaller models (mistral vs llama3:70b)
* Reduce chunk retrieval count
* Check system resources (RAM/CPU usage)

**High memory usage**:

* Close other applications
* Use quantized models (default in Ollama)
* Reduce batch sizes in processing

Best Practices
==============

Document Preparation
--------------------

1. **Clean your documents**: Remove unnecessary pages, headers, footers
2. **Organize by topic**: Keep related documents together
3. **Use descriptive filenames**: Help with source attribution
4. **Regular updates**: Re-run ``ingest.py`` when adding new documents

Prompt Engineering
------------------

1. **Be specific**: Ask detailed questions rather than vague ones
2. **Provide context**: Mention the document type or topic area
3. **Use follow-ups**: Build on previous questions in the conversation
4. **Check sources**: Review the cited documents for accuracy

System Maintenance
------------------

1. **Regular updates**: Keep Ollama and models updated
2. **Database cleanup**: Periodically recreate the vector database
3. **Monitor disk space**: Vector databases can grow large
4. **Backup conversations**: Save important chat sessions

Next Steps
==========

* **Integrate with workflows**: :doc:`workflow-builder`
* **API integration**: :doc:`api-usage`
* **Custom development**: :doc:`../development/architecture`
* **Deploy to production**: :doc:`../development/deployment`

The RAG system provides a powerful foundation for document-based AI interactions. With proper setup and optimization, it can become an invaluable tool for knowledge management and information retrieval.
