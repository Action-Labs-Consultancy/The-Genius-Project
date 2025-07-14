#!/bin/bash
# Start the backend using a local virtual environment
cd backend

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=development
export FLASK_RUN_HOST=0.0.0.0

# Create a local venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating local virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    .venv/bin/pip install bleach  # Add missing dependency
fi

# Function to find available port
find_available_port() {
    local start_port=${1:-5000}
    local max_port=${2:-9000}
    
    for port in $(seq $start_port $max_port); do
        if ! lsof -i :$port > /dev/null 2>&1; then
            echo $port
            return 0
        fi
    done
    
    echo "No available ports found between $start_port and $max_port" >&2
    return 1
}

# Find an available port starting from 5000
PORT=$(find_available_port 5000 9000)
if [ $? -eq 0 ]; then
    echo "Starting backend on port $PORT..."
    export PORT=$PORT
    cd ..
    source backend/.venv/bin/activate && python3 app.py
else
    echo "Failed to find available port"
    exit 1
fi