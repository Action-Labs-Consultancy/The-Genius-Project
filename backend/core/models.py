from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize SQLAlchemy
# This db instance should be used by all models
# and initialized in your Flask app

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'  # <-- fix: plural
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(64))
    user_type = db.Column(db.String(64))
    department = db.Column(db.String(64))
    is_admin = db.Column(db.Boolean)
    client_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime)
    # ...other fields as needed...

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ...fields...

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ...fields...

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ...fields...

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    industry = db.Column(db.String(128))
    contact = db.Column(db.String(128))
    email = db.Column(db.String(128))
    phone = db.Column(db.String(32))
    website = db.Column(db.String(256))
    description = db.Column(db.Text)
    status = db.Column(db.String(64))
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)
    # ...add any other fields as needed...

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(64), nullable=False)
    title = db.Column(db.String(128), nullable=False)
    subtitle = db.Column(db.String(256))
    icon = db.Column(db.String(32))
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    # ...add any other fields as needed...

class AccessRequest(db.Model):
    __tablename__ = 'access_requests'  # <-- fix: plural
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(120), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(32), nullable=False, default='pending')
    user_type = db.Column(db.String(32), nullable=True)
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Add any other fields as needed

class Channel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=True)
    is_dm = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    members = db.relationship('ChannelMember', backref='channel', lazy='dynamic')
    # ...fields...

class ChannelMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    channel_id = db.Column(db.Integer, db.ForeignKey('channel.id'), nullable=False)
    # ...fields...

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    channel_id = db.Column(db.Integer, db.ForeignKey('channel.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    parent_message_id = db.Column(db.Integer, db.ForeignKey('message.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # ...other fields as needed...

class ChannelRead(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ...fields...

class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ...fields...

class StandupTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    client = db.Column(db.String(128))
    day = db.Column(db.String(32))
    start_time = db.Column(db.String(8))  # e.g. '09:00'
    end_time = db.Column(db.String(8))    # e.g. '09:30'
    task = db.Column(db.String(256))
    status = db.Column(db.String(32), default='Not Started')
    notes = db.Column(db.Text)
    blocker = db.Column(db.Boolean, default=False)
    color = db.Column(db.String(16), default='#FFD600')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'client': self.client,
            'day': self.day,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'task': self.task,
            'status': self.status,
            'notes': self.notes,
            'blocker': self.blocker,
            'color': self.color
        }

class ClientAccess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ...fields...

class ContentCalendar(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    title = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text)
    content_type = db.Column(db.String(64))
    platform = db.Column(db.String(64))
    scheduled_date = db.Column(db.Date)
    status = db.Column(db.String(32), default='draft')
    text_copy = db.Column(db.Text)
    hashtags = db.Column(db.String(512))
    created_by = db.Column(db.Integer)
    client_feedback = db.Column(db.Text)
    approval_status = db.Column(db.String(32), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    files = db.relationship('ContentFile', backref='content', lazy='dynamic')
    # Add any other fields as needed...

class ContentFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content_id = db.Column(db.Integer, db.ForeignKey('content_calendar.id'), nullable=False)
    filename = db.Column(db.String(256), nullable=False)
    original_filename = db.Column(db.String(256))
    file_path = db.Column(db.String(512))
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(128))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Add any other fields as needed...

class ContentFeedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ...fields...
