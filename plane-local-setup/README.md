# Plane PM - Local Self-Hosted Setup

## 🚀 Complete Local Installation Guide

This guide will help you set up Plane PM to run entirely locally on your Windows machine using Docker, with no external dependencies.

### Prerequisites
- Docker Desktop for Windows
- Docker Compose
- Git (if you need to clone the repo)

### Step 1: Create Local Environment Configuration

First, let's create the necessary environment files for local development.

### Step 2: Docker Compose Configuration

We'll create a docker-compose.yml that includes all necessary services:
- PostgreSQL (database)
- Redis (caching)
- RabbitMQ (message queue)
- Plane Frontend
- Plane Backend API
- Plane Worker

### Step 3: Network Configuration

All services will run on the same Docker network for local communication.

### Step 4: Data Persistence

All data will be stored in Docker volumes on your local machine.

### Key Features of This Setup:
✅ **Fully Offline**: No external API calls or cloud dependencies
✅ **Local Database**: PostgreSQL running in Docker
✅ **Local Storage**: All files stored locally
✅ **Custom Port**: Accessible at http://localhost:3001 (to avoid conflict with your existing app)
✅ **Persistent Data**: Data survives container restarts
✅ **Development Mode**: Easy to modify and extend

### Security Notes:
- Uses secure random passwords for local development
- Database is not exposed outside Docker network
- All secrets are contained in .env files

Let's start with the configuration files...
