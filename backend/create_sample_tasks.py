#!/usr/bin/env python3
"""
Script to create sample tasks in the database
"""
import os
import sys
sys.path.append('.')

from mongo_db import mongo, TaskManager
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    mongodb_uri = os.getenv('MONGODB_URI')
    if not mongodb_uri:
        print("Error: MONGODB_URI not found in environment variables")
        return
    
    if not mongo.connect(mongodb_uri):
        print("Error: Failed to connect to MongoDB")
        return
    
    print("Connected to MongoDB successfully!")
    
    # Create sample tasks
    print("Creating sample tasks...")
    TaskManager.ensure_sample_tasks()
    print("Sample tasks created!")
    
    # Test getting tasks
    test_user_id = "emergency_user_123"
    tasks = TaskManager.get_user_tasks(test_user_id)
    print(f"Found {len(tasks)} tasks for user {test_user_id}")
    
    for task in tasks:
        print(f"- {task['title']} ({task['status']})")

if __name__ == "__main__":
    main()
