from mongo_db import mongo

mongo.connect('mongodb://localhost:27017/genius_db')
users_collection = mongo.get_collection('users')

hr_users = list(users_collection.find({'email': {'$in': ['hr@example.com', 'testhr@example.com']}}))
print('HR Users details:')
for user in hr_users:
    print(f'Name: {user.get("name", "No name")}')
    print(f'Email: {user.get("email", "No email")}')
    print(f'Role: {user.get("role", "No role")}')
    print(f'Department: {user.get("department", "No dept")}')
    print(f'ID: {user.get("_id")}')
    print('---')

# Check all users with HR in role or department
all_hr = list(users_collection.find({
    '$or': [
        {'role': {'$regex': 'hr', '$options': 'i'}},
        {'department': {'$regex': 'hr', '$options': 'i'}},
        {'email': {'$regex': 'hr', '$options': 'i'}}
    ]
}))

print(f'\nAll HR-related users ({len(all_hr)}):')
for user in all_hr:
    print(f'- {user.get("name")} ({user.get("email")}) - Role: {user.get("role")} - Dept: {user.get("department")}')
