from flask import Blueprint, request, jsonify
from datetime import datetime
import json

project_routes = Blueprint('project_routes', __name__)

# Sample projects data (replace with database integration)
sample_projects = [
    {
        "id": "BR-2025-07",
        "code": "BR-2025-07",
        "name": "Brand Identity Refresh",
        "status": "In Planning",
        "priority": "HIGH",
        "client": "Acme Corp",
        "description": "Complete brand identity refresh including logo, color palette, typography, and brand guidelines for modern market positioning.",
        "start_date": "2025-07-01",
        "due_date": "2025-08-15",
        "progress": 35,
        "budget": {"total": 50000, "used": 23000},
        "tasks_completed": 4,
        "total_tasks": 12,
        "tags": ["Campaign", "Design", "Brand"],
        "team": [
            {"name": "Jane Doe", "role": "Project Manager", "avatar": None},
            {"name": "Alex Smith", "role": "Designer", "avatar": None},
            {"name": "Sam Wilson", "role": "Developer", "avatar": None}
        ],
        "created_at": "2025-07-01T09:00:00Z",
        "updated_at": "2025-07-20T14:30:00Z"
    },
    {
        "id": "WD-2025-03",
        "code": "WD-2025-03", 
        "name": "Website Redesign",
        "status": "In Production",
        "priority": "MEDIUM",
        "client": "TechStart Inc",
        "description": "Complete website redesign with modern UI/UX, mobile responsiveness, and improved performance.",
        "start_date": "2025-06-15",
        "due_date": "2025-09-01",
        "progress": 65,
        "budget": {"total": 35000, "used": 18000},
        "tasks_completed": 8,
        "total_tasks": 15,
        "tags": ["Development", "Design", "Web"],
        "team": [
            {"name": "Mike Johnson", "role": "Lead Dev", "avatar": None},
            {"name": "Sarah Chen", "role": "UX Designer", "avatar": None}
        ],
        "created_at": "2025-06-15T09:00:00Z",
        "updated_at": "2025-07-20T11:15:00Z"
    },
    {
        "id": "AD-2025-11",
        "code": "AD-2025-11",
        "name": "Summer Campaign",
        "status": "In Review", 
        "priority": "HIGH",
        "client": "Fashion Co",
        "description": "Multi-channel summer marketing campaign including social media, print, and digital advertising.",
        "start_date": "2025-06-01",
        "due_date": "2025-07-30",
        "progress": 90,
        "budget": {"total": 75000, "used": 68000},
        "tasks_completed": 18,
        "total_tasks": 20,
        "tags": ["Campaign", "Marketing", "Social"],
        "team": [
            {"name": "Lisa Park", "role": "Creative Director", "avatar": None},
            {"name": "Tom Brown", "role": "Copywriter", "avatar": None},
            {"name": "Emma Davis", "role": "Designer", "avatar": None}
        ],
        "created_at": "2025-06-01T09:00:00Z",
        "updated_at": "2025-07-20T16:45:00Z"
    }
]

@project_routes.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects with optional filtering"""
    try:
        status_filter = request.args.get('status')
        priority_filter = request.args.get('priority')
        search = request.args.get('search', '').lower()
        
        filtered_projects = sample_projects.copy()
        
        # Apply filters
        if status_filter:
            filtered_projects = [p for p in filtered_projects if p['status'] == status_filter]
        
        if priority_filter:
            filtered_projects = [p for p in filtered_projects if p['priority'] == priority_filter]
            
        if search:
            filtered_projects = [p for p in filtered_projects 
                               if search in p['name'].lower() 
                               or search in p['code'].lower() 
                               or search in p['client'].lower()]
        
        return jsonify({
            'success': True,
            'projects': filtered_projects,
            'total': len(filtered_projects)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@project_routes.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    """Get a specific project by ID"""
    try:
        project = next((p for p in sample_projects if p['id'] == project_id), None)
        
        if not project:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
            
        return jsonify({
            'success': True,
            'project': project
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@project_routes.route('/api/projects', methods=['POST'])
def create_project():
    """Create a new project"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'client', 'due_date', 'priority']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Generate project code
        project_code = f"PR-{datetime.now().strftime('%Y-%m')}-{len(sample_projects) + 1:02d}"
        
        new_project = {
            'id': project_code,
            'code': project_code,
            'name': data['name'],
            'status': data.get('status', 'In Concept'),
            'priority': data['priority'],
            'client': data['client'],
            'description': data.get('description', ''),
            'start_date': data.get('start_date', datetime.now().strftime('%Y-%m-%d')),
            'due_date': data['due_date'],
            'progress': data.get('progress', 0),
            'budget': data.get('budget', {'total': 0, 'used': 0}),
            'tasks_completed': data.get('tasks_completed', 0),
            'total_tasks': data.get('total_tasks', 0),
            'tags': data.get('tags', []),
            'team': data.get('team', []),
            'created_at': datetime.now().isoformat() + 'Z',
            'updated_at': datetime.now().isoformat() + 'Z'
        }
        
        sample_projects.append(new_project)
        
        return jsonify({
            'success': True,
            'project': new_project,
            'message': 'Project created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@project_routes.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    """Update an existing project"""
    try:
        data = request.get_json()
        
        project_index = next((i for i, p in enumerate(sample_projects) if p['id'] == project_id), None)
        
        if project_index is None:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        # Update project fields
        project = sample_projects[project_index]
        updatable_fields = ['name', 'status', 'priority', 'client', 'description', 
                           'due_date', 'progress', 'budget', 'tasks_completed', 
                           'total_tasks', 'tags', 'team']
        
        for field in updatable_fields:
            if field in data:
                project[field] = data[field]
        
        project['updated_at'] = datetime.now().isoformat() + 'Z'
        
        return jsonify({
            'success': True,
            'project': project,
            'message': 'Project updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@project_routes.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Delete a project"""
    try:
        project_index = next((i for i, p in enumerate(sample_projects) if p['id'] == project_id), None)
        
        if project_index is None:
            return jsonify({'success': False, 'error': 'Project not found'}), 404
        
        deleted_project = sample_projects.pop(project_index)
        
        return jsonify({
            'success': True,
            'message': 'Project deleted successfully',
            'deleted_project': deleted_project
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@project_routes.route('/api/projects/stats', methods=['GET'])
def get_project_stats():
    """Get project statistics for dashboard summary"""
    try:
        total_projects = len(sample_projects)
        active_projects = len([p for p in sample_projects if p['status'] not in ['Completed', 'Cancelled']])
        in_production = len([p for p in sample_projects if p['status'] == 'In Production'])
        in_review = len([p for p in sample_projects if p['status'] == 'In Review'])
        completed = len([p for p in sample_projects if p['status'] == 'Completed'])
        
        # Calculate budget stats
        total_budget = sum(p['budget']['total'] for p in sample_projects)
        used_budget = sum(p['budget']['used'] for p in sample_projects)
        
        stats = {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'in_production': in_production,
            'in_review': in_review,
            'completed_this_quarter': completed,
            'budget_stats': {
                'total_budget': total_budget,
                'used_budget': used_budget,
                'remaining_budget': total_budget - used_budget
            }
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@project_routes.route('/api/projects/<project_id>/equipment-requests', methods=['GET'])
def get_project_equipment_requests(project_id):
    """Get equipment requests for a specific project"""
    try:
        # This would integrate with your equipment system
        # For now, return sample data
        sample_requests = [
            {
                'id': 1,
                'project_id': project_id,
                'item': 'Camera Equipment',
                'details': 'Sony A7R IV + Lenses',
                'status': 'approved',
                'requested_by': 'Jane Doe',
                'requested_date': '2025-07-17',
                'approved_date': '2025-07-18'
            },
            {
                'id': 2,
                'project_id': project_id,
                'item': 'Additional Budget',
                'details': '$5,000 for extended timeline',
                'status': 'pending',
                'requested_by': 'Alex Smith',
                'requested_date': '2025-07-19',
                'approved_date': None
            }
        ]
        
        return jsonify({
            'success': True,
            'requests': sample_requests
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@project_routes.route('/api/projects/<project_id>/tasks', methods=['GET'])
def get_project_tasks(project_id):
    """Get tasks for a specific project"""
    try:
        # Sample task data
        sample_tasks = [
            {
                'id': 1,
                'project_id': project_id,
                'title': 'Initial client consultation',
                'completed': True,
                'assignee': 'Jane Doe',
                'due_date': '2025-07-05',
                'created_date': '2025-07-01'
            },
            {
                'id': 2,
                'project_id': project_id,
                'title': 'Create brand mood board',
                'completed': False,
                'assignee': 'Alex Smith',
                'due_date': '2025-07-25',
                'created_date': '2025-07-10'
            },
            {
                'id': 3,
                'project_id': project_id,
                'title': 'Logo concept designs',
                'completed': False,
                'assignee': 'Sam Wilson',
                'due_date': '2025-08-01',
                'created_date': '2025-07-15'
            }
        ]
        
        return jsonify({
            'success': True,
            'tasks': sample_tasks
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
