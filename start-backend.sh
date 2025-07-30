#!/bin/bash
cd "$(dirname "$0")/backend"
echo "Starting Flask backend on port 10000..."
python3 app.py
