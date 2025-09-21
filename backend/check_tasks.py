#!/usr/bin/env python3
"""Quick script to check tasks in database"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mongo_db import TaskManager

def main():
    print("🔍 Checking tasks in database...")
    
    task_manager = TaskManager()
    
    # Get all tasks
    all_tasks = task_manager.get_all_tasks()
    print(f"📊 Total tasks in database: {len(all_tasks)}")
    
    for task in all_tasks:
        print(f"  📋 Task: {task.get('title', 'No title')} (ID: {task.get('_id', 'No ID')})")
        print(f"      Status: {task.get('status', 'No status')}")
        print(f"      Assigned to: {task.get('assigned_to', 'No assignment')}")
        print(f"      Created: {task.get('created_at', 'No date')}")
        print()

if __name__ == "__main__":
    main()
