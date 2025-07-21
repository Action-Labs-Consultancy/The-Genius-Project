# 🤖 Local RAG Chatbot System

A fully local Retrieval-Augmented Generation (RAG) chatbot that runs entirely on your macOS machine using Ollama, ChromaDB, and LangChain. No API keys or internet connection required for inference!

## 🌟 Features

- **Fully Local**: Everything runs on your machine - no external API calls
- **Privacy-First**: Your documents never leave your computer
- **Multi-Format Support**: PDF and TXT files
- **Fast Retrieval**: ChromaDB for efficient vector similarity search
- **Beautiful CLI**: Rich terminal interface with progress bars and formatting
- **Extensible**: Easy to add web UI or additional features

## 🏗️ Architecture

```
📁 rag-app/
├── data/              # Put your documents here (.pdf, .txt)
├── db/                # ChromaDB vector database (auto-created)
├── static/            # Web interface assets
│   └── index.html     # Beautiful chat interface
├── ingest.py          # Document processing and ingestion
├── main.py            # CLI chatbot
├── web_app.py         # FastAPI web server
├── start_web.sh       # Web server startup script
├── requirements.txt   # Python dependencies
└── README.md          # This file
```

## 🚀 Quick Start

### 1. Prerequisites

Make sure you have Python 3.8+ installed:
```bash
python3 --version
```

### 2. Install Ollama

Download and install Ollama from [ollama.ai](https://ollama.ai) or use Homebrew:
```bash
brew install ollama
```

### 3. Pull the Mistral Model

```bash
ollama pull mistral
```

### 4. Install Python Dependencies

```bash
cd rag-app
pip install -r requirements.txt
```

Or if you prefer using a virtual environment:
```bash
cd rag-app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 5. Add Your Documents

Place your documents in the `data/` folder:
```bash
# Example documents
cp ~/Documents/my-manual.pdf data/
cp ~/Documents/notes.txt data/
```

Supported formats:
- `.txt` - Plain text files
- `.pdf` - PDF documents

### 6. Ingest Documents

Process your documents and create the vector database:
```bash
python ingest.py
```

This will:
- Load all documents from `data/`
- Split them into chunks
- Create embeddings using a local HuggingFace model
- Store everything in ChromaDB

### 7. Start Ollama Server

In a separate terminal:
```bash
ollama serve
```

### 8. Run the Chatbot

**Option 1: Command Line Interface**
```bash
python main.py
```

**Option 2: Web Interface**
```bash
python web_app.py
```

Or use the convenient startup script:
```bash
./start_web.sh
```

Then open your browser and go to: **http://localhost:8000**

## 🌐 Web Interface Features

The web interface provides a beautiful, modern chat experience with:

- **Real-time chat** with WebSocket connections
- **LLaMA-style interface** with smooth animations
- **Source attribution** showing which documents were used
- **Typing indicators** while the AI is thinking
- **Mobile responsive** design
- **Auto-scroll** to latest messages
- **Connection status** indicator

### API Endpoints

The web server also provides REST API endpoints:

- `GET /` - Web chat interface
- `GET /health` - Health check
- `GET /status` - System status and document count
- `POST /chat` - Send a chat message (JSON API)
- `GET /docs` - Interactive API documentation
- `WebSocket /ws` - Real-time chat connection

## 💬 Using the Chatbot

Once running, you can:
- Ask questions about your documents
- Type `clear` to clear the screen
- Type `exit`, `quit`, or `q` to quit
- Use Ctrl+C to exit at any time

Example conversation:
```
🤖 Local RAG Chatbot
Model: mistral | Vector Store: ChromaDB

You: What is the main topic of the documents?

🔍 Searching knowledge base...
```

## 📚 Example Usage

Here are some example commands and interactions with the chatbot:

1. **Basic Question-Answering**

   ```
   You: What is the purpose of this document?
   ```

   The chatbot will search the ingested documents and provide an answer based on the content.

2. **Navigating Documents**

   ```
   You: Show me the table of contents.
   ```

   If the document is structured with a table of contents, the chatbot will extract and display it.

3. **Searching for Keywords**

   ```
   You: Find mentions of 'safety precautions'.
   ```

   The chatbot will locate and highlight sections in the documents that mention safety precautions.

4. **Summarization**

   ```
   You: Summarize the key points of the first chapter.
   ```

   The chatbot will provide a summary of the specified chapter or section.

## 🛠️ Troubleshooting

- **Ollama Server Issues**: If the Ollama server doesn't start, ensure that the Ollama installation was successful and that your system meets the requirements.
- **Model Download Problems**: If `ollama pull mistral` fails, check your internet connection and try again. Ensure that Ollama is properly installed.
- **Python Errors**: Make sure you are using Python 3.8 or higher. If you encounter module not found errors, double-check that you have installed the required Python packages.

## 🚧 Future Enhancements

- **Web Interface**: Adding a web-based UI for easier interaction.
- **Multi-Language Support**: Enabling the chatbot to understand and respond in multiple languages.
- **Advanced Document Editing**: Allowing users to make changes to documents through the chatbot.
- **Integration with Cloud Services**: Option to back up documents and data to cloud storage for accessibility and safety.

## 🤝 Contributing

We welcome contributions! Please open an issue or submit a pull request for any enhancements, bug fixes, or new features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Enjoy your private, local RAG chatbot! For more information and updates, visit our [GitHub repository](https://github.com/your-repo/rag-chatbot).
