#!/usr/bin/env python3
import os
import sys
import subprocess

# Change to backend directory
os.chdir('/Users/rabab/the-genius-project/backend')

# Activate virtual environment and start the app
try:
    # Kill any existing processes
    subprocess.run(['pkill', '-f', 'python.*app.py'], check=False)
    subprocess.run(['lsof', '-ti:5002'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Start the app
    env = os.environ.copy()
    env['MONGODB_URI'] = 'mongodb://localhost:27017/genius_db'
    
    print("Starting backend server...")
    subprocess.run([
        'bash', '-c', 
        'source venv/bin/activate && python app.py'
    ], env=env)
    
except KeyboardInterrupt:
    print("Server stopped")
except Exception as e:
    print(f"Error: {e}")
