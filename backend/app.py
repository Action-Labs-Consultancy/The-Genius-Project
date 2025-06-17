from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import smtplib
from email.mime.text import MIMEText
import os

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# ——— Configuration —————————————————————————————————————————————
# This will live next to app.py
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///project.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ——— Models ——————————————————————————————————————————————————————
class Player(db.Model):
    id    = db.Column(db.Integer, primary_key=True)
    name  = db.Column(db.String(100), nullable=False)
    dream = db.Column(db.String(255), nullable=False)

class User(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin      = db.Column(db.Boolean, default=False)

# ——— Routes ——————————————————————————————————————————————————————

@app.route('/players')
def get_players():
    players = Player.query.all()
    return jsonify([{"id": p.id, "name": p.name, "dream": p.dream} for p in players])

@app.route('/add-sample')
def add_sample():
    sample = Player(name="Ali", dream="Play for Real Madrid")
    db.session.add(sample)
    db.session.commit()
    return "Sample player added."

@app.route('/request-access', methods=['POST'])
def request_access():
    data = request.get_json()
    user_email = data.get('email')
    if not user_email:
        return jsonify({'error': 'Email is required'}), 400

    try:
        msg = MIMEText(f"A new access request has been received.\n\nEmail: {user_email}")
        msg['Subject'] = 'New Access Request'
        msg['From']    = 'rababeez@gmail.com'
        msg['To']      = 'rababeez@gmail.com'

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login('rababeez@gmail.com', 'oych tglt bqap rmwi')
        server.sendmail(msg['From'], [msg['To']], msg.as_string())
        server.quit()

        return jsonify({'message': 'Access request sent successfully'})
    except Exception as e:
        print("Email error:", e)
        return jsonify({'error': 'Failed to send request'}), 500

@app.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({
            'message': 'Login successful',
            'is_admin': user.is_admin
        })
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/create-admin')
def create_admin():
    # you can still hit this URL once if you ever need to re-create the admin
    ADMIN_EMAIL    = 'r.hasan@action-labs.co'
    ADMIN_PASSWORD = 'GlassDoor2025!'
    if not User.query.filter_by(email=ADMIN_EMAIL).first():
        pw_hash = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode('utf-8')
        db.session.add(User(email=ADMIN_EMAIL, password_hash=pw_hash, is_admin=True))
        db.session.commit()
        return f"✅ Admin {ADMIN_EMAIL} created."
    return "ℹ️ Admin already exists."

# ——— User Management —————————————————————————————————————————————

@app.route('/users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify([
        {'id': u.id, 'email': u.email, 'is_admin': u.is_admin}
        for u in users
    ])

@app.route('/users', methods=['POST'])
def add_user():
    data      = request.get_json()
    email     = data.get('email')
    password  = data.get('password')
    is_admin  = data.get('is_admin', False)

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 400

    pw_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    db.session.add(User(email=email, password_hash=pw_hash, is_admin=is_admin))
    db.session.commit()
    return jsonify({'message': 'User added'})

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    u = User.query.get(user_id)
    if not u:
        return jsonify({'error': 'User not found'}), 404
    db.session.delete(u)
    db.session.commit()
    return jsonify({'message': 'User deleted'})

@app.route('/users/<int:user_id>/password', methods=['PUT'])
def change_user_password(user_id):
    data         = request.get_json()
    new_password = data.get('password')
    u            = User.query.get(user_id)
    if not u:
        return jsonify({'error': 'User not found'}), 404
    u.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    return jsonify({'message': 'Password updated'})

# ——— App Startup —————————————————————————————————————————————————

if __name__ == '__main__':
    with app.app_context():
        # create project.db + all tables if missing
        db.create_all()

        # ensure admin is present
        ADMIN_EMAIL    = 'r.hasan@action-labs.co'
        ADMIN_PASSWORD = 'GlassDoor2025!'
        if not User.query.filter_by(email=ADMIN_EMAIL).first():
            pw_hash = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode('utf-8')
            db.session.add(User(email=ADMIN_EMAIL, password_hash=pw_hash, is_admin=True))
            db.session.commit()
            print("✅ Admin user created.")

    app.run(debug=True)
