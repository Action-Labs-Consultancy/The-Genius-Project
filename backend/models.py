# All model classes have been moved to core/models.py for architecture consistency.

from core.models import *

class Channel(db.Model):
    __tablename__ = 'channel'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=True)  # Add this line
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    # ...existing code...

class ChannelMember(db.Model):
    __tablename__ = 'channel_member'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Add this line
    # ...existing code...