const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/genius_project';
  }

  async init() {
    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      
      // Extract database name from URI or use default
      const dbName = this.uri.split('/').pop() || 'genius_project';
      this.db = this.client.db(dbName);
      
      console.log('✅ Connected to MongoDB:', dbName);
      
      // Create collections and default data
      await this.createCollections();
      await this.insertDefaultData();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async createCollections() {
    const collections = ['users', 'access_requests', 'feature_requests', 'notifications', 'clients'];
    
    for (const collectionName of collections) {
      try {
        await this.db.createCollection(collectionName);
        console.log(`✅ Collection created: ${collectionName}`);
      } catch (error) {
        // Collection might already exist
        if (error.code !== 48) {
          console.log(`📝 Collection exists: ${collectionName}`);
        }
      }
    }
  }

  async insertDefaultData() {
    // Check if users already exist
    const usersCount = await this.db.collection('users').countDocuments();
    
    if (usersCount === 0) {
      const defaultUsers = [
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123', // In production, this should be hashed
          role: 'admin',
          user_type: 'employee',
          department: 'IT',
          is_admin: true,
          start_date: null,
          created_at: new Date()
        },
        {
          name: 'Demo User',
          email: 'demo@example.com',
          password: 'demo123', // In production, this should be hashed
          role: 'employee',
          user_type: 'employee',
          department: 'General',
          is_admin: false,
          start_date: null,
          created_at: new Date()
        }
      ];

      await this.db.collection('users').insertMany(defaultUsers);
      console.log('✅ Default users created');

      // Insert sample notification
      await this.db.collection('notifications').insertOne({
        title: 'Welcome!',
        message: 'Welcome to The Genius Project. All systems are ready.',
        type: 'success',
        read: false,
        user_id: null,
        created_at: new Date()
      });
      console.log('✅ Default notification created');
    }
  }

  // Generic MongoDB operations
  async findOne(collection, query) {
    return await this.db.collection(collection).findOne(query);
  }

  async find(collection, query = {}, options = {}) {
    return await this.db.collection(collection).find(query, options).toArray();
  }

  async insertOne(collection, document) {
    document.created_at = new Date();
    return await this.db.collection(collection).insertOne(document);
  }

  async insertMany(collection, documents) {
    documents.forEach(doc => {
      doc.created_at = new Date();
    });
    return await this.db.collection(collection).insertMany(documents);
  }

  async updateOne(collection, query, update) {
    update.$set = update.$set || {};
    update.$set.updated_at = new Date();
    return await this.db.collection(collection).updateOne(query, update);
  }

  async deleteOne(collection, query) {
    return await this.db.collection(collection).deleteOne(query);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('✅ MongoDB connection closed');
    }
  }

  // Legacy methods for compatibility with existing SQLite-style code
  async get(query, params) {
    try {
      // Parse SQLite-style queries for MongoDB
      if (query.includes('SELECT') && query.includes('FROM users')) {
        if (query.includes('WHERE email = ?') && params && params[0]) {
          return await this.findOne('users', { email: params[0] });
        } else if (query.includes('COUNT(*)')) {
          const count = await this.db.collection('users').countDocuments();
          return { count };
        } else {
          const users = await this.find('users');
          return users[0] || null;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Database get error:', error);
      throw error;
    }
  }

  async all(query, params = []) {
    try {
      // Parse SQLite-style queries for MongoDB
      if (query.includes('FROM users')) {
        return await this.find('users', {}, { sort: { created_at: -1 } });
      } else if (query.includes('FROM access_requests')) {
        return await this.find('access_requests', {}, { sort: { created_at: -1 } });
      } else if (query.includes('FROM notifications')) {
        return await this.find('notifications', {}, { sort: { created_at: -1 } });
      }
      return [];
    } catch (error) {
      console.error('❌ Database all error:', error);
      throw error;
    }
  }

  async run(query, params = []) {
    try {
      // Parse SQLite-style queries for MongoDB operations
      if (query.includes('INSERT INTO users')) {
        const [name, email, password, role, user_type, department, is_admin, start_date] = params;
        const result = await this.insertOne('users', {
          name, email, password, role, user_type, department, 
          is_admin: Boolean(is_admin), start_date
        });
        return { id: result.insertedId, changes: 1 };
      } 
      else if (query.includes('INSERT INTO access_requests')) {
        const [name, email, requested_role, department, message, status] = params;
        const result = await this.insertOne('access_requests', {
          name, email, requested_role, department, message, status
        });
        return { id: result.insertedId, changes: 1 };
      } 
      else if (query.includes('UPDATE access_requests')) {
        const [status, id] = params;
        const result = await this.updateOne('access_requests', 
          { _id: new ObjectId(id) }, 
          { $set: { status } }
        );
        return { changes: result.modifiedCount };
      } 
      else if (query.includes('DELETE FROM users')) {
        const [id] = params;
        const result = await this.deleteOne('users', { _id: new ObjectId(id) });
        return { changes: result.deletedCount };
      }
      else if (query.includes('CREATE TABLE')) {
        // MongoDB doesn't need table creation, just return success
        return { changes: 0 };
      }
      return { changes: 0 };
    } catch (error) {
      console.error('❌ Database run error:', error);
      throw error;
    }
  }
}

module.exports = new Database();
