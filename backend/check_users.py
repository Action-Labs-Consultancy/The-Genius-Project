from app import mongo
from bson import ObjectId

def check_users():
    collection = mongo.get_collection('users')
    users = list(collection.find({}, {'_id': 1, 'name': 1, 'email': 1, 'id': 1}))
    
    print(f"Total users found: {len(users)}")
    for i, user in enumerate(users[:10]):
        print(f"User {i+1}:")
        print(f"  _id: {user.get('_id')}")
        print(f"  id: {user.get('id')}")
        print(f"  name: {user.get('name')}")
        print(f"  email: {user.get('email')}")
        print()

if __name__ == "__main__":
    check_users()
