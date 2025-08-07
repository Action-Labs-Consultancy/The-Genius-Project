# 🚀 The Genius Project

A full-stack AI-powered application featuring marketing AI, document processing, and various AI tools.

## 📋 Table of Contents
- [System Requirements](#-system-requirements)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Development](#-development)
- [Production Deployment](#-production-deployment)
- [Features](#-features)
- [Troubleshooting](#-troubleshooting)
- [Security](#-security)
- [Resources](#-resources)

## 💻 System Requirements

### Hardware
- RAM: 16GB minimum (32GB recommended)
- Storage: 50GB+ free space
- CPU: 8+ cores recommended
- GPU: Optional but recommended

### Software
- OS: macOS, Linux, or Windows with WSL2
- Node.js 18+
- Python 3.9+ (3.11 recommended)
- MongoDB Community Edition
- Git
- Ollama (for local AI models)

## 🛠 Installation

### 1. Core Dependencies

```bash
# Node.js & npm
brew install node    # or download from nodejs.org

# Python
brew install python@3.11    # or download from python.org

# Git
brew install git    # or download from git-scm.com

# MongoDB
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ollama
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Project Setup

```bash
# Clone repository
git clone [your-repo-url] the-genius-project
cd the-genius-project

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
```

## 🗂 Project Structure

```
the-genius-project/
├── frontend/                 # React.js application
│   ├── public/
│   │   └── index.html      # Main HTML template
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── pages/         # Page components
│   │   └── components/    # Reusable components
│   └── package.json       # Node.js dependencies
├── backend/                 # Flask API server
│   ├── app.py             # Main application
│   ├── models/            # Database models
│   ├── routes/            # API endpoints
│   └── requirements.txt   # Python dependencies
├── .env                    # Environment variables
└── README.md              # Documentation
```

## ⚙ Configuration

### Backend (.env)

```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/genius_project
DATABASE_NAME=genius_project
OLLAMA_API_URL=http://localhost:11434
PORT=10000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploads
LOG_LEVEL=INFO
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:10000
REACT_APP_BACKEND_URL=http://localhost:10000
PORT=3000
GENERATE_SOURCEMAP=false
BUILD_PATH=build
```

## 🚀 Development

### Start Services

```bash
# Terminal 1: MongoDB
brew services start mongodb-community

# Terminal 2: Ollama
ollama serve

# Terminal 3: Backend
cd backend
source venv/bin/activate
python app.py

# Terminal 4: Frontend
cd frontend
npm start
```

## 📦 Production Deployment

### Backend
```bash
cd backend
source venv/bin/activate
gunicorn --bind 0.0.0.0:10000 app:app
```

### Frontend
```bash
cd frontend
npm run build
# Serve build folder with your preferred web server
```

## 🎯 Features

### Marketing Lab
- AI-powered content generation
- Platform-specific strategies
- Input validation
- Execution history
- Multi-agent system

### Document Lab
- Multi-format support (PDF, DOCX, TXT)
- AI document analysis
- Drag-and-drop upload
- MongoDB GridFS storage

## 🐛 Troubleshooting

### MongoDB Issues
```bash
# Check status
brew services list | grep mongodb

# Restart service
brew services restart mongodb-community

# Check logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### Ollama Issues
```bash
# Check process
ps aux | grep ollama

# Restart service
pkill ollama
ollama serve

# Test API
curl http://localhost:11434/api/tags
```

## 🔐 Security

### Production Checklist
- [ ] Change default secret keys
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up authentication
- [ ] Enable rate limiting
- [ ] Configure logging
- [ ] Secure file uploads
- [ ] Set proper permissions

## 📚 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Ollama Documentation](https://ollama.ai/docs)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.
