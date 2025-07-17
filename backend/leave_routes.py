from flask import request, jsonify
from flask_cors import cross_origin
from bson import ObjectId
from datetime import datetime, timedelta
import json
from mongo_db import mongo

def register_leave_routes(app):
    """Register leave management routes with the Flask app"""
    
    @app.route('/api/leave/balances', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_leave_balances():
        """Get leave balances for a user"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'error': 'User ID is required'}), 400
            
            # Get user's leave balances from database
            leave_balances = mongo.get_collection('leave_balances')
            user_balances = leave_balances.find_one({'user_id': user_id})
            
            if not user_balances:
                # Create default balances if none exist
                default_balances = {
                    'user_id': user_id,
                    'vacation': 20,
                    'sick': 10,
                    'personal': 5,
                    'maternity': 90,
                    'unpaid': 30,
                    'updated_at': datetime.utcnow()
                }
                leave_balances.insert_one(default_balances)
                user_balances = leave_balances.find_one({'user_id': user_id})
            
            # Get user's start date from users collection
            users = mongo.get_collection('users')
            user_doc = users.find_one({'_id': ObjectId(user_id)})
            start_date = user_doc.get('start_date') if user_doc else None
            
            # Calculate workdays since start date
            workdays = 0
            calculated_vacation = 20  # Default fallback
            
            if start_date:
                try:
                    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                    today = datetime.utcnow()
                    current = start_dt
                    while current <= today:
                        # Skip Friday (4) and Saturday (5)
                        if current.weekday() not in [4, 5]:
                            workdays += 1
                        current += timedelta(days=1)
                    
                    # Calculate vacation based on workdays: 0.83333 days per workday
                    calculated_vacation = round(workdays * 0.83333, 2)
                except Exception as e:
                    print(f"Error parsing start_date: {e}")
            else:
                # For users without start_date, assume 1 year of work (approximately 260 workdays)
                workdays = 260
                calculated_vacation = round(260 * 0.83333, 2)  # About 216.67 days
            
            # Add start_date and workdays to response
            compensations_count = len(user_balances.get('compensations', []))
            response_data = {
                'vacation': calculated_vacation,
                'sick': user_balances.get('sick', 10),
                'personal': user_balances.get('personal', 5),
                'maternity': user_balances.get('maternity', 90),
                'unpaid': user_balances.get('unpaid', 30),
                'compensation': compensations_count,
                'start_date': start_date,
                'workdays': workdays
            }
            return jsonify(response_data)
        
        except Exception as e:
            print(f"Error getting leave balances: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/requests', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_leave_requests():
        """Get leave requests for a user (or all if HR)"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'error': 'User ID is required'}), 400
            
            # Get user information
            users = mongo.get_collection('users')
            user = users.find_one({'_id': ObjectId(user_id)})
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            user_department = user.get('department', '').lower()
            is_hr = user_department == 'hr'
            is_admin = user.get('is_admin', False)
            
            # Get leave requests
            leave_requests = mongo.get_collection('leave_requests')
            if is_hr or is_admin:
                # HR and admin can see all requests
                requests = list(leave_requests.find({}).sort('submitted_date', -1))
            else:
                # Regular users can only see their own requests
                requests = list(leave_requests.find({'user_id': user_id}).sort('submitted_date', -1))
            
            # Convert ObjectId to string for JSON serialization
            for req in requests:
                req['_id'] = str(req['_id'])
                req['id'] = str(req['_id'])
            
            return jsonify(requests)
        
        except Exception as e:
            print(f"Error getting leave requests: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/requests/all', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_all_leave_requests():
        """Get all leave requests for HR users"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'error': 'User ID is required'}), 400
            
            # Check if user is in HR department
            users = mongo.get_collection('users')
            user = users.find_one({'_id': ObjectId(user_id)})
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Check if user is in HR department or is admin
            user_department = user.get('department', '').lower()
            is_admin = user.get('is_admin', False)
            
            if user_department != 'hr' and not is_admin:
                return jsonify({'error': 'Only HR department or admin can view all requests'}), 403
            
            # Get all leave requests for HR users
            leave_requests = mongo.get_collection('leave_requests')
            requests = list(leave_requests.find({}).sort('submitted_date', -1))
            
            # Convert ObjectId to string for JSON serialization
            for req in requests:
                req['_id'] = str(req['_id'])
                req['id'] = str(req['_id'])
            
            return jsonify(requests)
        
        except Exception as e:
            print(f"Error getting all leave requests: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/requests', methods=['POST', 'OPTIONS'])
    @cross_origin()
    def submit_leave_request():
        """Submit a new leave request"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request data is required'}), 400
            
            # Calculate duration excluding weekends (Friday and Saturday)
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d')
            
            duration = 0
            current_date = start_date
            while current_date <= end_date:
                # Skip Friday (4) and Saturday (5)
                if current_date.weekday() not in [4, 5]:
                    duration += 1
                current_date += timedelta(days=1)
            
            # Create leave request
            leave_request = {
                'user_id': data['user_id'],
                'employee_name': data['employee_name'],
                'type': data['type'],
                'start_date': data['start_date'],
                'end_date': data['end_date'],
                'reason': data['reason'],
                'status': 'pending',
                'submitted_date': data.get('submitted_date', datetime.utcnow().isoformat()),
                'duration': duration
            }
            
            # Insert into database
            leave_requests = mongo.get_collection('leave_requests')
            result = leave_requests.insert_one(leave_request)
            
            # Add the ID to the response
            leave_request['_id'] = str(result.inserted_id)
            leave_request['id'] = str(result.inserted_id)
            
            return jsonify(leave_request)
        
        except Exception as e:
            print(f"Error submitting leave request: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/requests/<request_id>', methods=['PUT', 'OPTIONS'])
    @cross_origin()
    def update_leave_request(request_id):
        """Update a leave request (approve/reject)"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'PUT, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request data is required'}), 400
            
            user_id = data.get('manager_id')
            if not user_id:
                return jsonify({'error': 'Manager ID is required'}), 400
            
            # Get manager information
            users = mongo.get_collection('users')
            user = users.find_one({'_id': ObjectId(user_id)})
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            user_department = user.get('department', '').lower()
            is_hr = user_department == 'hr'
            is_admin = user.get('is_admin', False)
            
            if not (is_hr or is_admin):
                return jsonify({'error': 'Only HR department or admin can approve/reject leave requests'}), 403
            
            # Update leave request
            leave_requests = mongo.get_collection('leave_requests')
            
            # Get the current leave request before updating
            current_request = leave_requests.find_one({'_id': ObjectId(request_id)})
            if not current_request:
                return jsonify({'error': 'Leave request not found'}), 404
            
            result = leave_requests.update_one(
                {'_id': ObjectId(request_id)},
                {'$set': {
                    'status': data['status'],
                    'manager_comments': data.get('manager_comments', ''),
                    'manager_id': user_id,
                    'action_date': data.get('action_date', datetime.utcnow().isoformat())
                }}
            )
            
            if result.matched_count == 0:
                return jsonify({'error': 'Leave request not found'}), 404
            
            # Update leave balance if request is approved
            if data['status'] == 'approved':
                leave_balances = mongo.get_collection('leave_balances')
                employee_user_id = current_request['user_id']
                leave_type = current_request['type']
                duration = current_request.get('duration', 1)
                
                # Get current balance
                current_balance = leave_balances.find_one({'user_id': employee_user_id})
                if current_balance:
                    # Update the specific leave type balance
                    new_balance = current_balance.get(leave_type, 0) - duration
                    leave_balances.update_one(
                        {'user_id': employee_user_id},
                        {'$set': {
                            leave_type: max(0, new_balance),  # Ensure balance doesn't go negative
                            'updated_at': datetime.utcnow()
                        }}
                    )
                else:
                    # Create new balance record if it doesn't exist
                    default_balances = {
                        'user_id': employee_user_id,
                        'vacation': 20,
                        'sick': 10,
                        'personal': 5,
                        'maternity': 90,
                        'unpaid': 30,
                        'updated_at': datetime.utcnow()
                    }
                    default_balances[leave_type] = max(0, default_balances[leave_type] - duration)
                    leave_balances.insert_one(default_balances)
            
            # Get updated request
            updated_request = leave_requests.find_one({'_id': ObjectId(request_id)})
            updated_request['_id'] = str(updated_request['_id'])
            updated_request['id'] = str(updated_request['_id'])
            
            return jsonify(updated_request)
        
        except Exception as e:
            print(f"Error updating leave request: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/team', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_team_leaves():
        """Get team leaves for calendar view"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200
            
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({'error': 'User ID is required'}), 400
            
            # Get all approved leave requests for calendar view
            leave_requests = mongo.get_collection('leave_requests')
            requests = list(leave_requests.find({'status': 'approved'}).sort('start_date', 1))
            
            # Convert ObjectId to string for JSON serialization
            for req in requests:
                req['_id'] = str(req['_id'])
                req['id'] = str(req['_id'])
            
            return jsonify(requests)
        
        except Exception as e:
            print(f"Error getting team leaves: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/team-members', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_team_members():
        """Get all users for HR to select for compensation days"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            users = mongo.get_collection('users')
            team = list(users.find({}, {'_id': 1, 'name': 1, 'email': 1, 'department': 1, 'start_date': 1}))
            for member in team:
                member['id'] = str(member['_id'])
                member['_id'] = str(member['_id'])
            return jsonify(team)
        except Exception as e:
            print(f"Error getting team members: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/compensation', methods=['POST', 'OPTIONS'])
    @cross_origin()
    def add_compensation_day():
        """HR grants a compensation day to a user for extra workday"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request data is required'}), 400
            user_id = data.get('user_id')
            date = data.get('date')
            reason = data.get('reason')
            comment = data.get('comment')
            added_by = data.get('added_by')
            if not user_id or not date or not reason:
                return jsonify({'error': 'Missing required fields'}), 400

            # Save compensation day to user leave_balances
            leave_balances = mongo.get_collection('leave_balances')
            result = leave_balances.update_one(
                {'user_id': user_id},
                {'$push': {
                    'compensations': {
                        'date': date,
                        'reason': reason,
                        'comment': comment,
                        'added_by': added_by,
                        'added_date': datetime.utcnow().isoformat()
                    }
                }},
                upsert=True
            )
            return jsonify({'success': True}), 200
        except Exception as e:
            print(f"Error adding compensation day: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/users', methods=['POST', 'PUT', 'OPTIONS'])
    @cross_origin()
    def create_or_update_user():
        """Create or update a user, including start_date"""
        try:
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request data is required'}), 400
            
            print(f"Received data: {data}")  # Debug log
            
            user_id = data.get('id')
            user_doc = {
                'name': data.get('name'),
                'user_type': data.get('user_type', 'employee'),
                'department': data.get('department', ''),
                'is_admin': data.get('is_admin', False),
                'email': data.get('email'),
                'password': data.get('password'),
                'start_date': data.get('start_date', None)
            }
            
            print(f"User doc to save: {user_doc}")  # Debug log
            
            users = mongo.get_collection('users')
            if request.method == 'POST':
                result = users.insert_one(user_doc)
                user_doc['_id'] = str(result.inserted_id)
                print(f"Created user with ID: {result.inserted_id}")  # Debug log
                return jsonify(user_doc), 201
            elif request.method == 'PUT':
                if not user_id:
                    return jsonify({'error': 'User ID required for update'}), 400
                    
                print(f"Updating user {user_id} with doc: {user_doc}")  # Debug log
                
                # Filter out None values for update operation
                update_doc = {k: v for k, v in user_doc.items() if v is not None}
                if data.get('start_date') is not None:
                    update_doc['start_date'] = data.get('start_date')
                
                print(f"Final update doc: {update_doc}")  # Debug log
                
                result = users.update_one({'_id': ObjectId(user_id)}, {'$set': update_doc})
                print(f"Update result: matched={result.matched_count}, modified={result.modified_count}")  # Debug log
                
                # Fetch the updated user to return
                updated_user = users.find_one({'_id': ObjectId(user_id)})
                if updated_user:
                    updated_user['_id'] = str(updated_user['_id'])
                    # Remove non-serializable fields
                    if 'password_hash' in updated_user:
                        del updated_user['password_hash']
                    # Convert any datetime objects to strings
                    for key, value in updated_user.items():
                        if isinstance(value, datetime):
                            updated_user[key] = value.isoformat()
                    
                    print(f"Updated user from DB: {updated_user}")  # Debug log
                    return jsonify(updated_user), 200
                else:
                    return jsonify({'error': 'User not found after update'}), 404
                    
        except Exception as e:
            print(f"Error creating/updating user: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/public-holidays', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_public_holidays():
        """Get public holidays for calendar display"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            # Return empty array for now - can be expanded with actual holiday API
            holidays = []
            return jsonify(holidays)
        
        except Exception as e:
            print(f"Error getting public holidays: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/leave/who-is-off-today', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_who_is_off_today():
        """Get who is off today"""
        try:
            # Handle preflight requests
            if request.method == 'OPTIONS':
                response = jsonify({'message': 'OK'})
                response.headers.add('Access-Control-Allow-Origin', '*')
                response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
                response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                return response, 200

            # Return empty array for now - can be expanded with actual leave tracking
            who_is_off = []
            return jsonify(who_is_off)
        
        except Exception as e:
            print(f"Error getting who is off today: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500
