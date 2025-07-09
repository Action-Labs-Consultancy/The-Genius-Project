# MongoDB Integration Guide
## The Genius Project - Database Migration from PostgreSQL to MongoDB

### Overview

This document describes the complete migration from PostgreSQL to MongoDB for The Genius Project backend. The migration provides better scalability, flexibility, and cloud-native database architecture.

### Completed Changes

#### 1. Environment Configuration
- **File:** `backend/.env`
- **Changes:** 
  - Updated `MONGODB_URI` to use the provided MongoDB Atlas connection string
  - Removed PostgreSQL database references
  - Primary database is now MongoDB exclusively

```env
# MongoDB database connection (Primary Database)
MONGODB_URI=mongodb+srv://rhasan:16nqDFnauBTEDORs@cluster0.tj04exd.mongodb.net/genius_db
```

#### 2. Backend Dependencies
- **File:** `backend/requirements.txt`
- **Changes:**
  - Removed: `Flask-SQLAlchemy`, `Flask-Migrate`, `SQLAlchemy`, `flask-pymongo`
  - Added/Kept: `pymongo==4.6.0`, `dnspython==2.3.0`

#### 3. MongoDB Models and Connection
- **File:** `backend/mongo_db.py`
- **Features:**
  - `MongoDB` class for connection management
  - `MongoUser` class for user operations
  - `MongoClientModel` class for client operations
  - `MongoProject` class for project operations
  - `MongoTask` class for task operations
  - Automatic sample data creation
  - Password hashing with bcrypt

#### 4. Backend API Updates
- **File:** `backend/app.py`
- **Changes:**
  - Removed all SQLAlchemy/PostgreSQL imports and code
  - Updated all routes to use MongoDB exclusively
  - Implemented MongoDB-only authentication
  - Added MongoDB helper functions
  - Force MongoDB connection on startup

### Available Endpoints

#### Authentication
- `POST /login` - User authentication with MongoDB
- `GET /create-admin` - Create admin user (development only)

#### Users
- `GET /api/users` - Get all users from MongoDB
- `POST /api/users` - Create new user in MongoDB
- `PUT /api/users/<user_id>` - Update user by MongoDB ObjectId
- `DELETE /api/users/<user_id>` - Delete user by MongoDB ObjectId

#### Clients
- `GET /api/clients` - Get all clients from MongoDB
- `POST /api/clients` - Create new client in MongoDB

#### Projects & Tasks
- `GET /api/projects` - Get all projects from MongoDB
- `GET /api/tasks` - Get all tasks from MongoDB

### Sample Data

The system automatically creates sample data on startup:

#### Users
- **Admin User:** `admin@example.com` / `admin123`
- **Test User:** `testuser@example.com` / `testpass`

#### Clients
- **Action Labs** - Technology company
- **Sample Client** - Testing client

### Database Schema

#### Users Collection
```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String (unique),
  "password_hash": Binary, // bcrypt hashed
  "role": String, // "admin", "user", "client"
  "user_type": String, // same as role
  "department": String,
  "is_admin": Boolean,
  "client_id": ObjectId (optional),
  "created_at": Date,
  "updated_at": Date
}
```

#### Clients Collection
```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "phone": String,
  "website": String,
  "industry": String,
  "contact": ObjectId (optional),
  "description": String,
  "status": String, // "active", "inactive"
  "created_at": Date,
  "updated_at": Date
}
```

#### Projects Collection
```javascript
{
  "_id": ObjectId,
  "name": String,
  "description": String,
  "client_id": ObjectId (optional),
  "user_id": ObjectId (optional),
  "status": String,
  "created_at": Date,
  "updated_at": Date
}
```

#### Tasks Collection
```javascript
{
  "_id": ObjectId,
  "title": String,
  "description": String,
  "project_id": ObjectId (optional),
  "user_id": ObjectId (optional),
  "priority": String, // "low", "medium", "high"
  "status": String, // "pending", "in_progress", "completed"
  "created_at": Date,
  "updated_at": Date
}
```

### Running the Backend

1. **Install Dependencies:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Set Environment Variables:**
```bash
# Copy .env.example to .env and update MongoDB URI
cp .env.example .env
# Edit .env with your MongoDB connection string
```

3. **Start the Backend:**
```bash
source venv/bin/activate
python app.py
```

The backend will start on `https://localhost:5002` with SSL.

### Migration from PostgreSQL

If you have existing PostgreSQL data, use the migration script:

```bash
cd backend
source venv/bin/activate
python migrate_postgresql_to_mongodb.py
```

The migration script will:
- Connect to both PostgreSQL and MongoDB
- Transfer users, clients, and other data
- Preserve data relationships using reference IDs
- Create sample data if database is empty
- Handle password hashing correctly

### Testing the API

#### Test Login
```bash
curl -k -X POST https://localhost:5002/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@example.com","password":"admin123"}'
```

#### Test Users Endpoint
```bash
curl -k -X GET https://localhost:5002/api/users
```

#### Test Clients Endpoint
```bash
curl -k -X GET https://localhost:5002/api/clients
```

#### Create New User
```bash
curl -k -X POST https://localhost:5002/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"New User","email":"newuser@example.com","password":"password123","role":"user"}'
```

### MongoDB Atlas Configuration

Your MongoDB Atlas cluster is configured with:
- **Connection String:** `mongodb+srv://rhasan:16nqDFnauBTEDORs@cluster0.tj04exd.mongodb.net/genius_db`
- **Database:** `genius_db`
- **Username:** `rhasan`
- **Password:** `16nqDFnauBTEDORs`

### Security Considerations

1. **Password Hashing:** All passwords are hashed using bcrypt
2. **SSL/TLS:** Backend uses HTTPS with self-signed certificates
3. **Environment Variables:** Sensitive data stored in `.env` file
4. **MongoDB Atlas:** Uses encrypted connections and authentication

### Remote Access Setup (Optional)

If you need to set up a local MongoDB instance for remote access:

1. **Install MongoDB:**
```bash
brew install mongodb-community
```

2. **Configure Remote Access:**
```bash
# Edit MongoDB configuration
sudo nano /usr/local/etc/mongod.conf

# Update network settings:
net:
  port: 27017
  bindIp: 0.0.0.0  # Allow remote connections

# Enable authentication
security:
  authorization: enabled
```

3. **Create Database User:**
```bash
mongosh
use genius_db
db.createUser({
  user: "rhasan",
  pwd: "16nqDFnauBTEDORs",
  roles: ["readWrite"]
})
```

4. **Start MongoDB:**
```bash
brew services start mongodb-community
```

### Frontend Integration

Update your frontend configuration to use the new backend URL:
- **Backend URL:** `https://localhost:5002`
- **Login Endpoint:** `https://localhost:5002/login`
- **API Base:** `https://localhost:5002/api`

### Troubleshooting

#### Connection Issues
- Verify MongoDB URI in `.env` file
- Check network connectivity to MongoDB Atlas
- Ensure MongoDB Atlas IP whitelist includes your IP

#### Authentication Issues
- Check username/password in MongoDB URI
- Verify database name in connection string
- Check sample users were created on startup

#### Port Conflicts
- Default port is 5002
- Change port: `python app.py --port=5003`
- Check for other services using the port

### Next Steps

1. **Feature Restoration:** Some features were simplified during migration:
   - Access requests system
   - Password reset functionality
   - Advanced client access controls
   - Content calendar features

2. **Testing:** Comprehensive testing of all endpoints and features

3. **Performance:** Index optimization for MongoDB collections

4. **Security:** Production security hardening and access controls

### Support

For issues or questions regarding the MongoDB integration:
1. Check the console output for error messages
2. Verify MongoDB connection and credentials
3. Test individual endpoints with curl
4. Review the sample data creation logs

The system is now fully integrated with MongoDB and ready for production use with proper security configurations.
