# All model classes have been moved to core/models.py for architecture consistency.
# SQLAlchemy models are disabled - using MongoDB instead

# from core.models import *

# class Channel(db.Model):
#     __tablename__ = 'channel'
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String, nullable=True)
#     created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

# class ChannelMember(db.Model):
#     __tablename__ = 'channel_member'
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)