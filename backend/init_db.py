# Only database initialization logic should be here.
# All reusable business logic should be in /core/business_logic.py or /core/models.py.

from core.models import User

def initialize_database(app, db, bcrypt):
    with app.app_context():
        db.create_all()
        admin_email = 'r.hasan@action-labs.co'
        admin_password = 'GlassDoor2025!'
        if not User.query.filter_by(email=admin_email).first():
            pw_hash = bcrypt.generate_password_hash(admin_password).decode('utf-8')
            admin = User(email=admin_email, password_hash=pw_hash, is_admin=True)
            db.session.add(admin)
            db.session.commit()
            return "Admin created"
        return "Admin exists"