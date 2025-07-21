# Docker Setup for The Genius Project

This document provides instructions for running The Genius Project using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Action-Labs-Consultancy/The-Genius-Project.git
   cd The-Genius-Project
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your actual credentials:
   ```bash
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/genius_db
   
   # Flask Secret Key
   SECRET_KEY=your-secret-key-here
   
   # OpenAI API Key (for AI nodes)
   OPENAI_API_KEY=your-openai-api-key
   
   # Slack Bot Token (for Slack nodes)
   SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
   
   # SMTP Configuration (for Email nodes)
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

3. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5002

## Services

### Backend (genius-backend)
- **Port:** 5002
- **Technology:** Python Flask with SocketIO
- **Features:**
  - RESTful API endpoints
  - Workflow execution engine
  - MongoDB integration
  - Real-time communication via WebSockets
  - Authentication support for external services

### Frontend (genius-frontend)
- **Port:** 3000
- **Technology:** React.js
- **Features:**
  - Modern workflow canvas with drag-and-drop
  - Real-time workflow execution
  - Comprehensive node types
  - Black & yellow themed UI

## Workflow Node Types

The application supports various node types for building workflows:

### Core Nodes
- **Start/Trigger**: Entry point for workflows
- **End**: Workflow termination
- **Condition**: Conditional branching
- **Loop**: Iteration over arrays/data
- **Switch**: Multi-path routing

### Data Processing
- **Set Variable**: Store and manipulate data
- **Math**: Mathematical calculations
- **Code**: Execute Python/JavaScript code
- **File**: Read/write file operations

### External Integrations
- **HTTP Request**: Make API calls
- **Email**: Send emails via SMTP
- **Slack**: Send Slack messages
- **AI**: OpenAI GPT integration
- **Database**: MongoDB queries
- **Webhook**: External webhook triggers

### Utilities
- **Log/Debug**: Output debugging information
- **Timer**: Delays and scheduling
- **Notification**: System notifications
- **Merge**: Combine data streams

## Development Mode

For development with hot reloading:

```bash
# Backend only
cd backend
python app.py

# Frontend only
cd frontend
npm start
```

## Production Deployment

For production deployment:

1. **Update environment variables** in `.env` with production values
2. **Use production Docker Compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Ensure ports 3000 and 5002 are available
   - Modify ports in `docker-compose.yml` if needed

2. **MongoDB connection:**
   - Ensure MongoDB is running and accessible
   - Check MONGODB_URI in `.env` file

3. **Missing environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in all required values

4. **Docker build failures:**
   - Ensure Docker daemon is running
   - Try rebuilding with `--no-cache` flag

### Logs

View application logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f genius-backend
docker-compose logs -f genius-frontend
```

## Authentication Setup

### OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env` file as `OPENAI_API_KEY`

### Slack Bot Token
1. Create a Slack app at https://api.slack.com/apps
2. Add bot permissions: `chat:write`, `channels:read`
3. Install to workspace and copy Bot User OAuth Token
4. Add to `.env` file as `SLACK_BOT_TOKEN`

### SMTP Configuration
For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use App Password in `SMTP_PASSWORD`

## API Endpoints

Key backend endpoints:
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create new workflow
- `POST /api/workflows/{id}/execute` - Execute workflow
- `GET /api/workflow-templates` - Get workflow templates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test with Docker
4. Submit a pull request

## License

This project is licensed under the MIT License.
