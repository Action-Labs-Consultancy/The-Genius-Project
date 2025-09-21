const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'genius_project.db');

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection and create tables
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ Error opening database:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database:', DB_PATH);
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  // Create necessary tables
  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        user_type TEXT DEFAULT 'employee',
        department TEXT,
        is_admin BOOLEAN DEFAULT 0,
        start_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Access requests table
      `CREATE TABLE IF NOT EXISTS access_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        department TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Feature requests table
      `CREATE TABLE IF NOT EXISTS feature_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read BOOLEAN DEFAULT 0,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Clients table
      `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        company TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      await this.run(tableSQL);
    }

    // Insert default admin user if no users exist
    const userCount = await this.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      await this.insertDefaultUsers();
    }

    console.log('✅ Database tables created/verified');
  }

  // Insert default users for testing
  async insertDefaultUsers() {
    const defaultUsers = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123', // In production, this should be hashed
        role: 'admin',
        user_type: 'employee',
        department: 'IT',
        is_admin: 1
      },
      {
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'demo123',
        role: 'employee',
        user_type: 'employee',
        department: 'General',
        is_admin: 0
      }
    ];

    for (const user of defaultUsers) {
      await this.run(
        'INSERT INTO users (name, email, password, role, user_type, department, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.name, user.email, user.password, user.role, user.user_type, user.department, user.is_admin]
      );
    }

    // Insert sample notifications
    await this.run(
      'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)',
      ['Welcome!', 'Welcome to The Genius Project. All systems are ready.', 'success']
    );

    console.log('✅ Default users and data inserted');
  }

  // Wrapper for database queries
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Database run error:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ Database get error:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get multiple rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Database all error:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
