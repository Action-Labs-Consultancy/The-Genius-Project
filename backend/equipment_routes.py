from datetime import datetime, timedelta
from bson import ObjectId
from flask import request, jsonify, send_from_directory
from flask_cors import cross_origin
import os
from werkzeug.utils import secure_filename
import uuid

def register_equipment_routes(app, mongo):
    """Register all equipment management routes"""

    # File upload configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'equipment')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    # Ensure upload directory exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    def save_equipment_image(file):
        """Save uploaded equipment image and return filename"""
        if file and allowed_file(file.filename):
            # Generate unique filename
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > MAX_FILE_SIZE:
                return None, "File size exceeds 5MB limit"
            
            file.save(filepath)
            return unique_filename, None
        return None, "Invalid file type"

    @app.route('/api/equipment', methods=['GET', 'POST', 'OPTIONS'])
    @cross_origin()
    def equipment():
        """Handle equipment listing and creation"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            equipment_collection = mongo.get_collection('equipment')

            if request.method == 'GET':
                equipment = list(equipment_collection.find().sort('created_at', -1))
                for item in equipment:
                    item['_id'] = str(item['_id'])
                    # Add image URL if image exists
                    if item.get('item_image'):
                        item['image_url'] = f"/api/equipment/images/{item['item_image']}"
                return jsonify(equipment)

            elif request.method == 'POST':
                data = request.get_json()
                
                required_fields = ['item_name', 'category', 'quantity_total']
                for field in required_fields:
                    if not data.get(field):
                        return jsonify({'error': f'Missing required field: {field}'}), 400

                equipment_item = {
                    'unique_id': f"{data['category'][:3].upper()}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                    'item_name': data['item_name'],
                    'category': data['category'],
                    'quantity_total': int(data['quantity_total']),
                    'quantity_available': int(data.get('quantity_available', data['quantity_total'])),
                    'item_status': data.get('item_status', 'Available'),
                    'location': data.get('location', ''),
                    'condition': data.get('condition', 'Good'),
                    'purchase_date': data.get('purchase_date', ''),
                    'purchase_price': float(data.get('purchase_price', 0)),
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }

                result = equipment_collection.insert_one(equipment_item)
                equipment_item['_id'] = str(result.inserted_id)
                
                return jsonify(equipment_item), 201

        except Exception as e:
            print(f"Error handling equipment: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/equipment/projects', methods=['GET', 'POST', 'OPTIONS'])
    @cross_origin()
    def projects():
        """Handle project listing and creation"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            projects_collection = mongo.get_collection('projects')

            if request.method == 'GET':
                projects = list(projects_collection.find().sort('created_at', -1))
                for project in projects:
                    project['_id'] = str(project['_id'])
                return jsonify(projects)

            elif request.method == 'POST':
                data = request.get_json()
                
                required_fields = ['project_name', 'client_name']
                for field in required_fields:
                    if not data.get(field):
                        return jsonify({'error': f'Missing required field: {field}'}), 400

                project = {
                    'project_name': data['project_name'],
                    'client_name': data['client_name'],
                    'description': data.get('description', ''),
                    'status': data.get('status', 'Active'),
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }

                result = projects_collection.insert_one(project)
                project['_id'] = str(result.inserted_id)
                
                return jsonify(project), 201

        except Exception as e:
            print(f"Error handling projects: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/equipment/checkout', methods=['GET', 'POST', 'OPTIONS'])
    @cross_origin()
    def equipment_checkout():
        """Handle equipment checkout requests"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            checkout_collection = mongo.get_collection('equipment_checkouts')

            if request.method == 'GET':
                checkouts = list(checkout_collection.find().sort('created_at', -1))
                projects_collection = mongo.get_collection('projects')
                for checkout in checkouts:
                    checkout['_id'] = str(checkout['_id'])
                    
                    if checkout.get('project_id'):
                        project = projects_collection.find_one({'_id': ObjectId(checkout['project_id'])})
                        if project:
                            checkout['project_name'] = project['project_name']
                            checkout['client_name'] = project['client_name']
                
                return jsonify(checkouts)

            elif request.method == 'POST':
                data = request.get_json()
                
                required_fields = ['requester_name', 'project_id', 'pickup_time', 'expected_return_time', 'equipment_items'
]
                for field in required_fields:
                    if not data.get(field):
                        return jsonify({'error': f'Missing required field: {field}'}), 400

                projects_collection = mongo.get_collection('projects')
                project = projects_collection.find_one({'_id': ObjectId(data['project_id'])})
                if not project:
                    return jsonify({'error': 'Project not found'}), 404

                checkout_request = {
                    'requester_name': data['requester_name'],
                    'project_id': data['project_id'],
                    'project_name': project['project_name'],
                    'client_name': project['client_name'],
                    'equipment_items': data['equipment_items'],
                    'pickup_time': data['pickup_time'],
                    'expected_return_time': data['expected_return_time'],
                    'notes': data.get('notes', ''),
                    'status': 'Pending Approval',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }

                result = checkout_collection.insert_one(checkout_request)
                checkout_request['_id'] = str(result.inserted_id)
                
                return jsonify(checkout_request), 201

        except Exception as e:
            print(f"Error handling checkout: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/equipment/checkout/<checkout_id>/approve', methods=['POST', 'OPTIONS'])
    @cross_origin()
    def approve_checkout(checkout_id):
        """Approve equipment checkout request"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            data = request.get_json()
            approver_name = data.get('approver_name', 'Unknown')

            checkout_collection = mongo.get_collection('equipment_checkouts')
            checkout = checkout_collection.find_one({'_id': ObjectId(checkout_id)})
            if not checkout:
                return jsonify({'error': 'Checkout request not found'}), 404

            checkout_collection.update_one(
                {'_id': ObjectId(checkout_id)},
                {
                    '$set': {
                        'status': 'Approved',
                        'approved_by': approver_name,
                        'approval_date': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    }
                }
            )

            return jsonify({'message': 'Checkout request approved successfully'})

        except Exception as e:
            print(f"Error approving checkout: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/equipment/checkout/<checkout_id>/reject', methods=['POST', 'OPTIONS'])
    @cross_origin()
    def reject_checkout(checkout_id):
        """Reject equipment checkout request"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            data = request.get_json()
            rejection_reason = data.get('rejection_reason', 'No reason provided')
            approver_name = data.get('approver_name', 'Unknown')

            checkout_collection = mongo.get_collection('equipment_checkouts')
            checkout = checkout_collection.find_one({'_id': ObjectId(checkout_id)})
            if not checkout:
                return jsonify({'error': 'Checkout request not found'}), 404

            checkout_collection.update_one(
                {'_id': ObjectId(checkout_id)},
                {
                    '$set': {
                        'status': 'Rejected',
                        'rejection_reason': rejection_reason,
                        'approved_by': approver_name,
                        'approval_date': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    }
                }
            )

            return jsonify({'message': 'Checkout request rejected successfully'})

        except Exception as e:
            print(f"Error rejecting checkout: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/notifications/<user_name>', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_user_notifications(user_name):
        """Get notifications for a user"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            notifications_collection = mongo.get_collection('notifications')
            
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            notifications = list(notifications_collection.find({
                'user_name': user_name,
                'created_at': {'$gte': cutoff_date}
            }).sort('created_at', -1).limit(50))

            for notification in notifications:
                notification['_id'] = str(notification['_id'])

            return jsonify(notifications)

        except Exception as e:
            print(f"Error getting notifications: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/equipment/images/<filename>', methods=['GET'])
    @cross_origin()
    def serve_equipment_image(filename):
        """Serve uploaded equipment images"""
        try:
            return send_from_directory(UPLOAD_FOLDER, filename)
        except Exception as e:
            print(f"Error serving image: {str(e)}")
            return jsonify({'error': 'Image not found'}), 404

    @app.route('/api/equipment/upload', methods=['POST', 'OPTIONS'])
    @cross_origin()
    def create_equipment_with_upload():
        """Handle equipment creation with file upload"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            equipment_collection = mongo.get_collection('equipment')

            # Get form data
            data = request.form.to_dict()
            
            # Validate required fields
            required_fields = ['item_name', 'category', 'quantity_total']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'Missing required field: {field}'}), 400

            # Handle image upload
            image_filename = None
            if 'item_image' in request.files:
                file = request.files['item_image']
                if file.filename != '':
                    filename, error = save_equipment_image(file)
                    if error:
                        return jsonify({'error': error}), 400
                    image_filename = filename

            equipment_item = {
                'unique_id': f"{data['category'][:3].upper()}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                'item_name': data['item_name'],
                'category': data['category'],
                'quantity_total': int(data['quantity_total']),
                'quantity_available': int(data.get('quantity_available', data['quantity_total'])),
                'item_status': data.get('item_status', 'Available'),
                'location': data.get('location', ''),
                'condition': data.get('condition', 'Good'),
                'purchase_date': data.get('purchase_date', ''),
                'purchase_price': float(data.get('purchase_price', 0)),
                'serial_number': data.get('serial_number', ''),
                'manufacturer': data.get('manufacturer', ''),
                'model': data.get('model', ''),
                'special_instructions': data.get('special_instructions', ''),
                'item_image': image_filename,  # Store filename, not URL
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            result = equipment_collection.insert_one(equipment_item)
            equipment_item['_id'] = str(result.inserted_id)
            
            # Add image URL for frontend
            if image_filename:
                equipment_item['image_url'] = f"/api/equipment/images/{image_filename}"
            
            return jsonify(equipment_item), 201

        except Exception as e:
            print(f"Error creating equipment with upload: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    # Equipment Categories
    EQUIPMENT_CATEGORIES = [
        'Camera', 'Lens', 'Tripod', 'Lighting', 'Audio', 'Computer', 
        'Monitor', 'Accessory', 'Storage', 'Other'
    ]

    @app.route('/api/equipment/categories', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_equipment_categories():
        """Get equipment categories"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            return jsonify({'categories': EQUIPMENT_CATEGORIES})

        except Exception as e:
            print(f"Error getting categories: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    print("Equipment routes registered successfully!")
