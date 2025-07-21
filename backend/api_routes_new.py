from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from models_new import Base, User, Client, Project, Task, TaskComment, ProjectMember, TaskStatus, TaskPriority, UserRole
from sqlalchemy import create_database, and_, or_
from datetime import datetime, timedelta
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///project_management.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)

db = SQLAlchemy()
db.init_app(app)

# Initialize database
with app.app_context():
    Base.metadata.create_all(db.engine)

def serialize_user(user):
    return {
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role.value,
        'avatar_url': user.avatar_url,
        'department': user.department
    }

def serialize_client(client):
    return {
        'id': client.id,
        'name': client.name,
        'company': client.company,
        'email': client.email,
        'phone': client.phone,
        'website': client.website,
        'logo_url': client.logo_url,
        'status': client.status,
        'projects_count': len(client.projects) if client.projects else 0
    }

def serialize_project(project):
    return {
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'client_id': project.client_id,
        'client_name': project.client.name if project.client else None,
        'status': project.status,
        'start_date': project.start_date.isoformat() if project.start_date else None,
        'due_date': project.due_date.isoformat() if project.due_date else None,
        'tasks_count': len(project.tasks) if project.tasks else 0,
        'team_members': [serialize_user(member.user) for member in project.members] if project.members else []
    }

def serialize_task(task):
    return {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'project_id': task.project_id,
        'project_name': task.project.name if task.project else None,
        'client_name': task.project.client.name if task.project and task.project.client else None,
        'assigned_to_id': task.assigned_to_id,
        'assignee': serialize_user(task.assignee) if task.assignee else None,
        'created_by_id': task.created_by_id,
        'creator': serialize_user(task.creator) if task.creator else None,
        'status': task.status.value,
        'priority': task.priority.value,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'estimated_hours': task.estimated_hours,
        'actual_hours': task.actual_hours,
        'position': task.position,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat(),
        'comments_count': len(task.comments) if task.comments else 0
    }

# ===== AUTH & USERS =====
@app.route('/api/users/current', methods=['GET'])
def get_current_user():
    # Mock current user - replace with actual auth
    user = db.session.query(User).first()
    if not user:
        # Create default user if none exists
        user = User(
            email='admin@example.com',
            full_name='Admin User',
            role=UserRole.ADMIN,
            department='Management'
        )
        db.session.add(user)
        db.session.commit()
    
    return jsonify(serialize_user(user))

@app.route('/api/users', methods=['GET'])
def get_users():
    users = db.session.query(User).filter(User.is_active == True).all()
    return jsonify([serialize_user(user) for user in users])

# ===== CLIENTS =====
@app.route('/api/clients', methods=['GET'])
def get_clients():
    clients = db.session.query(Client).all()
    return jsonify([serialize_client(client) for client in clients])

@app.route('/api/clients/<int:client_id>', methods=['GET'])
def get_client(client_id):
    client = db.session.query(Client).get_or_404(client_id)
    data = serialize_client(client)
    data['projects'] = [serialize_project(project) for project in client.projects]
    return jsonify(data)

@app.route('/api/clients', methods=['POST'])
def create_client():
    data = request.get_json()
    client = Client(
        name=data['name'],
        company=data.get('company'),
        email=data.get('email'),
        phone=data.get('phone'),
        website=data.get('website')
    )
    db.session.add(client)
    db.session.commit()
    return jsonify(serialize_client(client)), 201

# ===== PROJECTS =====
@app.route('/api/projects', methods=['GET'])
def get_projects():
    client_id = request.args.get('client_id')
    query = db.session.query(Project)
    
    if client_id:
        query = query.filter(Project.client_id == client_id)
    
    projects = query.all()
    return jsonify([serialize_project(project) for project in projects])

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    project = db.session.query(Project).get_or_404(project_id)
    data = serialize_project(project)
    data['tasks'] = [serialize_task(task) for task in project.tasks]
    return jsonify(data)

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    project = Project(
        name=data['name'],
        description=data.get('description'),
        client_id=data['client_id'],
        start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None
    )
    db.session.add(project)
    db.session.commit()
    
    # Add team members
    if data.get('team_members'):
        for user_id in data['team_members']:
            member = ProjectMember(project_id=project.id, user_id=user_id)
            db.session.add(member)
    
    db.session.commit()
    return jsonify(serialize_project(project)), 201

# ===== TASKS =====
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    project_id = request.args.get('project_id')
    user_id = request.args.get('user_id')
    status = request.args.get('status')
    
    query = db.session.query(Task)
    
    if project_id:
        query = query.filter(Task.project_id == project_id)
    
    if user_id:
        query = query.filter(Task.assigned_to_id == user_id)
    
    if status:
        query = query.filter(Task.status == TaskStatus(status))
    
    tasks = query.order_by(Task.position, Task.created_at).all()
    return jsonify([serialize_task(task) for task in tasks])

@app.route('/api/tasks/my-tasks', methods=['GET'])
def get_my_tasks():
    # Get current user (mock for now)
    current_user = db.session.query(User).first()
    if not current_user:
        return jsonify([])
    
    tasks = db.session.query(Task).filter(
        Task.assigned_to_id == current_user.id
    ).order_by(Task.due_date.asc().nullslast(), Task.priority.desc()).all()
    
    return jsonify([serialize_task(task) for task in tasks])

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    
    # Get current user as creator
    current_user = db.session.query(User).first()
    
    task = Task(
        title=data['title'],
        description=data.get('description'),
        project_id=data['project_id'],
        assigned_to_id=data.get('assigned_to_id'),
        created_by_id=current_user.id if current_user else 1,
        status=TaskStatus(data.get('status', 'todo')),
        priority=TaskPriority(data.get('priority', 'medium')),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        estimated_hours=data.get('estimated_hours')
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(serialize_task(task)), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = db.session.query(Task).get_or_404(task_id)
    data = request.get_json()
    
    # Update allowed fields
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'assigned_to_id' in data:
        task.assigned_to_id = data['assigned_to_id']
    if 'status' in data:
        task.status = TaskStatus(data['status'])
    if 'priority' in data:
        task.priority = TaskPriority(data['priority'])
    if 'due_date' in data:
        task.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
    if 'position' in data:
        task.position = data['position']
    
    task.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(serialize_task(task))

@app.route('/api/tasks/<int:task_id>/move', methods=['PUT'])
def move_task(task_id):
    task = db.session.query(Task).get_or_404(task_id)
    data = request.get_json()
    
    new_status = data.get('status')
    new_position = data.get('position', 0)
    
    if new_status:
        task.status = TaskStatus(new_status)
    
    task.position = new_position
    task.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(serialize_task(task))

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = db.session.query(Task).get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return '', 204

# ===== TASK COMMENTS =====
@app.route('/api/tasks/<int:task_id>/comments', methods=['GET'])
def get_task_comments(task_id):
    comments = db.session.query(TaskComment).filter(
        TaskComment.task_id == task_id
    ).order_by(TaskComment.created_at.desc()).all()
    
    return jsonify([{
        'id': comment.id,
        'task_id': comment.task_id,
        'user': serialize_user(comment.user),
        'comment': comment.comment,
        'created_at': comment.created_at.isoformat()
    } for comment in comments])

@app.route('/api/tasks/<int:task_id>/comments', methods=['POST'])
def add_task_comment(task_id):
    data = request.get_json()
    current_user = db.session.query(User).first()
    
    comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id if current_user else 1,
        comment=data['comment']
    )
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({
        'id': comment.id,
        'task_id': comment.task_id,
        'user': serialize_user(comment.user),
        'comment': comment.comment,
        'created_at': comment.created_at.isoformat()
    }), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)
