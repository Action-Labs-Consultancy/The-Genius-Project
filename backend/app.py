from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from pinecone_setup import initialize_pinecone
import smtplib
from email.mime.text import MIMEText
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///project.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize DB
db = SQLAlchemy(app)

# Pinecone setup
try:
    pinecone_index = initialize_pinecone()
except Exception as e:
    print(f"Pinecone initialization failed: {str(e)}")
    exit(1)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    dream = db.Column(db.String(255), nullable=False)

# Routes
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({
                'message': 'Login successful',
                'is_admin': user.is_admin
            })
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/create-admin')
def create_admin():
    try:
        ADMIN_EMAIL = 'r.hasan@action-labs.co'
        ADMIN_PASSWORD = 'GlassDoor2025!'
        if not User.query.filter_by(email=ADMIN_EMAIL).first():
            pw_hash = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode('utf-8')
            db.session.add(User(email=ADMIN_EMAIL, password_hash=pw_hash, is_admin=True))
            db.session.commit()
            return f"✅ Admin {ADMIN_EMAIL} created."
        return "ℹ️ Admin already exists."
    except Exception as e:
        print(f"Create admin error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/request-access', methods=['POST'])
def request_access():
    try:
        data = request.get_json()
        user_email = data.get('email')
        if not user_email:
            return jsonify({'error': 'Email is required'}), 400

        msg = MIMEText(f"A new access request has been received.\n\nEmail: {user_email}")
        msg['Subject'] = 'New Access Request'
        msg['From'] = 'rababeez@gmail.com'
        msg['To'] = 'rababeez@gmail.com'

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login('rababeez@gmail.com', 'oych tglt bqap rmwi')
        server.sendmail(msg['From'], [msg['To']], msg.as_string())
        server.quit()

        return jsonify({'message': 'Access request sent successfully'})
    except Exception as e:
        print(f"Email error: {e}")
        return jsonify({'error': 'Failed to send request'}), 500

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        user_email = data.get('email')
        if not user_email:
            return jsonify({'error': 'Email is required'}), 400

        user = User.query.filter_by(email=user_email).first()
        if not user:
            return jsonify({'error': 'Email not found'}), 404

        reset_token = bcrypt.generate_password_hash(user_email + str(os.urandom(8))).decode('utf-8')[:32]
        reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        msg = MIMEText(f"Click this link to reset your password: {reset_link}")
        msg['Subject'] = 'Password Reset Request'
        msg['From'] = 'rababeez@gmail.com'
        msg['To'] = user_email

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login('rababeez@gmail.com', 'oych tglt bqap rmwi')
        server.sendmail(msg['From'], [msg['To']], msg.as_string())
        server.quit()

        return jsonify({'message': 'Password reset link sent to your email'})
    except Exception as e:
        print(f"Email error: {e}")
        return jsonify({'error': 'Failed to send reset email'}), 500

@app.route('/players', methods=['GET'])
def get_players():
    try:
        players = Player.query.all()
        return jsonify([{'id': p.id, 'name': p.name, 'dream': p.dream} for p in players])
    except Exception as e:
        print(f"Get players error: {e}")
        return jsonify({'error': 'Failed to fetch players'}), 500

@app.route("/search", methods=["POST"])
def search():
    try:
        data = request.json
        query_text = data.get("query")
        if not query_text:
            return jsonify({"error": "Missing query text"}), 400

        # Placeholder: replace this with your actual embedding logic
        query_vector = [0.1] * 1536
        results = pinecone_index.query(vector=query_vector, top_k=5)
        return jsonify({"results": results["matches"]})
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({"error": "Failed to search"}), 500

# Initialize DB and run
if __name__ == '__main__':
    try:
        with app.app_context():
            print("Attempting to create database tables...")
            db.create_all()
            print("Database tables created successfully.")

            ADMIN_EMAIL = 'r.hasan@action-labs.co'
            ADMIN_PASSWORD = 'GlassDoor2025!'
            if not User.query.filter_by(email=ADMIN_EMAIL).first():
                pw_hash = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode('utf-8')
                db.session.add(User(email=ADMIN_EMAIL, password_hash=pw_hash, is_admin=True))
                db.session.commit()
                print("✅ Admin user created.")
            else:
                print("ℹ️ Admin user already exists.")
    except Exception as e:
        print(f"Database initialization error: {e}")

    app.run(debug=True, host='127.0.0.1', port=5001)
