#!/usr/bin/env python
"""
This script migrates data from SQLite databases to PostgreSQL.
It requires both source SQLite and target PostgreSQL connection strings.

Usage:
python migrate_sqlite_to_postgres.py
"""

import os
import sys
import sqlite3
import psycopg2
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Text, inspect
from sqlalchemy.orm import sessionmaker
import pandas as pd

# Source SQLite database paths
SQLITE_DBS = {
    'genius': 'instance/genius.db',
    'chat': 'instance/chat.db',
    'project': 'instance/project.db'
}

# Target PostgreSQL connection string - from environment or argument
POSTGRES_URL = os.environ.get('TARGET_DATABASE_URL')

def get_sqlite_tables(db_path):
    """Get all tables from a SQLite database"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    conn.close()
    return [table[0] for table in tables]

def get_table_data(db_path, table_name):
    """Get all data from a SQLite table as a DataFrame"""
    conn = sqlite3.connect(db_path)
    query = f"SELECT * FROM {table_name}"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def get_table_schema(db_path, table_name):
    """Get the schema of a SQLite table"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    schema = cursor.fetchall()
    conn.close()
    return schema

def create_postgres_table(engine, table_name, schema):
    """Create a table in PostgreSQL based on SQLite schema"""
    # This is a simplified version, you might need to adjust data types
    meta = MetaData()
    columns = []
    
    for col in schema:
        col_id, col_name, col_type, not_null, default_val, is_pk = col
        if 'INT' in col_type.upper():
            col_obj = Column(col_name, Integer, primary_key=(is_pk == 1))
        elif 'TEXT' in col_type.upper():
            col_obj = Column(col_name, Text, primary_key=(is_pk == 1))
        else:
            col_obj = Column(col_name, String, primary_key=(is_pk == 1))
        columns.append(col_obj)
    
    table = Table(table_name, meta, *columns)
    meta.create_all(engine)
    return table

def insert_data(engine, table_name, df):
    """Insert DataFrame data into PostgreSQL table"""
    df.to_sql(table_name, engine, if_exists='append', index=False)

def main():
    if not POSTGRES_URL:
        print("Error: TARGET_DATABASE_URL environment variable is not set.")
        print("Set it with your PostgreSQL connection string.")
        print("Example: postgresql://username:password@host:port/database")
        sys.exit(1)
    
    # Create SQLAlchemy engine for PostgreSQL
    try:
        postgres_url = POSTGRES_URL
        if postgres_url.startswith('postgres://'):
            postgres_url = postgres_url.replace('postgres://', 'postgresql://', 1)
        
        engine = create_engine(postgres_url)
        print(f"Connected to PostgreSQL at {postgres_url.split('@')[1]}")
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        sys.exit(1)
    
    # Migrate each SQLite database
    for db_name, db_path in SQLITE_DBS.items():
        print(f"\nMigrating {db_name} database from {db_path}")
        
        if not os.path.exists(db_path):
            print(f"  Warning: {db_path} does not exist. Skipping.")
            continue
        
        try:
            tables = get_sqlite_tables(db_path)
            print(f"  Found {len(tables)} tables: {', '.join(tables)}")
            
            for table_name in tables:
                if table_name == 'sqlite_sequence':
                    continue
                    
                print(f"  Migrating table: {table_name}")
                schema = get_table_schema(db_path, table_name)
                
                # Check if table exists in PostgreSQL
                inspector = inspect(engine)
                if table_name in inspector.get_table_names():
                    print(f"    Table {table_name} already exists in PostgreSQL, skipping creation")
                else:
                    print(f"    Creating table {table_name} in PostgreSQL")
                    create_postgres_table(engine, table_name, schema)
                
                # Get and insert data
                df = get_table_data(db_path, table_name)
                print(f"    Migrating {len(df)} records")
                insert_data(engine, table_name, df)
                print(f"    Completed migration of {table_name}")
                
        except Exception as e:
            print(f"  Error migrating {db_name}: {e}")
    
    print("\nMigration completed!")

if __name__ == "__main__":
    main()
