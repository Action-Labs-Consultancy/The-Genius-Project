from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def health():
    return jsonify({'status': 'OK', 'endpoint': 'health'})

# For Vercel
application = app
