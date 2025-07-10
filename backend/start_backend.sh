#!/bin/bash
# Start the backend using python3 -m flask with correct environment variables
export FLASK_APP=app.py
export FLASK_RUN_PORT=5002
export FLASK_RUN_HOST=0.0.0.0
python3 -m flask run --host=0.0.0.0 --port=5002
