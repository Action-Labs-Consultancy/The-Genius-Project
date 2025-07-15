import os
import sys
from flask import Flask, Response, jsonify
from flask_cors import CORS

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create a simple Flask app for testing
app = Flask(__name__)
CORS(app)

# Set environment for production
os.environ.setdefault('FLASK_ENV', 'production')

# Set a SECRET_KEY if not provided
if not os.environ.get('SECRET_KEY'):
    os.environ['SECRET_KEY'] = 'vercel-production-secret-key-change-me'

@app.route('/api/hello')
def hello():
    return jsonify({"message": "Backend is working!"})

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "service": "genius-project-api"})

@app.route('/api/test')
def test():
    return jsonify({"message": "API test endpoint working!"})

try:
    # Try to import the main backend app for additional routes
    from backend.app import app as backend_app
    
    # Copy routes from backend app to our Vercel app
    for rule in backend_app.url_map.iter_rules():
        if rule.endpoint != 'static':
            app.add_url_rule(rule.rule, rule.endpoint, backend_app.view_functions[rule.endpoint], methods=rule.methods)
    
    print("[VERCEL] Backend app routes imported successfully")
    
except ImportError as e:
    print(f"[VERCEL] Could not import backend app: {str(e)}")
    print("[VERCEL] Using basic API endpoints only")

except Exception as e:
    print(f"[VERCEL] Error importing backend app: {str(e)}")
    print("[VERCEL] Using basic API endpoints only")

# Export the app for Vercel (this is what Vercel will call)
application = app
