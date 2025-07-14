#!/bin/bash
# Start the backend using a local virtual environment
cd backend

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=development
export FLASK_RUN_PORT=5000
export FLASK_RUN_HOST=0.0.0.0

# Create a local venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating local virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    .venv/bin/pip install bleach  # Add missing dependency
fi

# Use the venv's Python to run the app directly
.venv/bin/python app.py