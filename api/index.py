import os
import sys
import json
from flask import Flask, Response, jsonify
from flask_cors import CORS

# Create a simple Flask app for Vercel
app = Flask(__name__)
CORS(app)

# Set basic configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'vercel-secret-key')

@app.route('/api/hello', methods=['GET'])
def hello():
    """Simple hello endpoint for testing"""
    return jsonify({"message": "Backend is working!", "status": "success"})

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "service": "genius-project-api",
        "environment": "vercel-serverless"
    })

@app.route('/api/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({
        "message": "API test endpoint working!",
        "python_version": sys.version,
        "environment": dict(os.environ)
    })

@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        "message": "The Genius Project API",
        "endpoints": ["/api/hello", "/health", "/api/test"]
    })

# Export the app for Vercel
application = app

# For local testing
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)
