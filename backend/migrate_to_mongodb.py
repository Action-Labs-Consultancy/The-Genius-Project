#!/usr/bin/env python3
"""
Migration script to transfer data from PostgreSQL to MongoDB
Run this script to migrate existing data before switching to MongoDB-only mode.
"""

import os
import sys
from datetime import datetime
import psycopg2
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_postgres():
    """Connect to PostgreSQL database"""
    try:
        # Try to get PostgreSQL connection from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("No PostgreSQL DATABASE_URL found. Skipping migration.")
            return None
            
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}")
        return None

def connect_to_mongodb():
    """Connect to MongoDB"""
    try:
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MONGODB_URI not found")
            
        client = MongoClient(mongodb_uri)
        db_name = 'genius_db'
        db = client[db_name]
        
        # Test connection
        client.admin.command('ping')
        print(f"Connected to MongoDB: {db_name}")
        return db
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return None

def migrate_users(pg_conn, mongo_db):
    """Migrate users from PostgreSQL to MongoDB"""
    try:
        cursor = pg_conn.cursor()
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Convert to MongoDB documents
        user_docs = []
        for user in users:
            user_dict = dict(zip(columns, user))
            # Convert datetime objects to ISO format
            for key, value in user_dict.items():
                if isinstance(value, datetime):
                    user_dict[key] = value
            user_docs.append(user_dict)
        
        if user_docs:
            mongo_db.users.insert_many(user_docs)
            print(f"Migrated {len(user_docs)} users")
        
        cursor.close()
    except Exception as e:
        print(f"User migration error: {e}")

def migrate_clients(pg_conn, mongo_db):
    """Migrate clients from PostgreSQL to MongoDB"""
    try:
        cursor = pg_conn.cursor()
        cursor.execute("SELECT * FROM client")
        clients = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Convert to MongoDB documents
        client_docs = []
        for client in clients:
            client_dict = dict(zip(columns, client))
            # Convert datetime objects to ISO format
            for key, value in client_dict.items():
                if isinstance(value, datetime):
                    client_dict[key] = value
            client_docs.append(client_dict)
        
        if client_docs:
            mongo_db.clients.insert_many(client_docs)
            print(f"Migrated {len(client_docs)} clients")
        
        cursor.close()
    except Exception as e:
        print(f"Client migration error: {e}")

def migrate_projects(pg_conn, mongo_db):
    """Migrate projects from PostgreSQL to MongoDB"""
    try:
        cursor = pg_conn.cursor()
        cursor.execute("SELECT * FROM project")
        projects = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Convert to MongoDB documents
        project_docs = []
        for project in projects:
            project_dict = dict(zip(columns, project))
            # Convert datetime objects to ISO format
            for key, value in project_dict.items():
                if isinstance(value, datetime):
                    project_dict[key] = value
            project_docs.append(project_dict)
        
        if project_docs:
            mongo_db.projects.insert_many(project_docs)
            print(f"Migrated {len(project_docs)} projects")
        
        cursor.close()
    except Exception as e:
        print(f"Project migration error: {e}")

def migrate_tasks(pg_conn, mongo_db):
    """Migrate tasks from PostgreSQL to MongoDB"""
    try:
        cursor = pg_conn.cursor()
        cursor.execute("SELECT * FROM task")
        tasks = cursor.fetchall()
        
        # Get column names
        columns = [desc[0] for desc in cursor.description]
        
        # Convert to MongoDB documents
        task_docs = []
        for task in tasks:
            task_dict = dict(zip(columns, task))
            # Convert datetime objects to ISO format
            for key, value in task_dict.items():
                if isinstance(value, datetime):
                    task_dict[key] = value
            task_docs.append(task_dict)
        
        if task_docs:
            mongo_db.tasks.insert_many(task_docs)
            print(f"Migrated {len(task_docs)} tasks")
        
        cursor.close()
    except Exception as e:
        print(f"Task migration error: {e}")

def main():
    """Main migration function"""
    print("Starting PostgreSQL to MongoDB migration...")
    
    # Connect to both databases
    pg_conn = connect_to_postgres()
    mongo_db = connect_to_mongodb()
    
    if not mongo_db:
        print("MongoDB connection failed. Aborting migration.")
        sys.exit(1)
    
    if not pg_conn:
        print("No PostgreSQL connection. Creating sample data in MongoDB only.")
        # Just ensure sample data in MongoDB
        from mongo_db import mongo, MongoUser, MongoClientModel
        mongo.connect()
        MongoUser.ensure_sample_users()
        MongoClientModel.create_sample_data()
        print("Sample data created in MongoDB.")
        return
    
    try:
        # Migrate data
        migrate_users(pg_conn, mongo_db)
        migrate_clients(pg_conn, mongo_db)
        migrate_projects(pg_conn, mongo_db)
        migrate_tasks(pg_conn, mongo_db)
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if pg_conn:
            pg_conn.close()

if __name__ == "__main__":
    main()
