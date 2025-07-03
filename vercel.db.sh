#!/bin/bash
set -e

echo "=== PostgreSQL Database Setup for Vercel ==="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI is not installed. Please install it with:"
  echo "npm install -g vercel"
  exit 1
fi

# Login to Vercel if needed
vercel whoami &>/dev/null || vercel login

# Get project info
echo "Getting project information..."
PROJECT_NAME=$(vercel project ls --json | jq -r '.[0].name // ""')
if [ -z "$PROJECT_NAME" ]; then
  echo "Please select a Vercel project:"
  vercel project ls
  read -p "Enter project name: " PROJECT_NAME
fi

echo "Setting up database for project: $PROJECT_NAME"

# Instructions for PostgreSQL setup
echo ""
echo "To use PostgreSQL with Vercel, you need a cloud PostgreSQL database."
echo "Recommended options:"
echo "1. Neon (https://neon.tech) - Serverless Postgres"
echo "2. Supabase (https://supabase.com) - Postgres backend"
echo "3. Railway (https://railway.app) - Easy deployment"
echo ""
echo "After creating your database, you'll need the connection string in the format:"
echo "postgresql://username:password@hostname:port/database"
echo ""

# Get database URL
read -p "Enter your PostgreSQL connection string: " DB_URL

# Validate the connection string
if [[ ! "$DB_URL" =~ ^postgres(ql)?:// ]]; then
  echo "Invalid connection string. It should start with postgres:// or postgresql://"
  exit 1
fi

# Add the database URL to Vercel
echo "Adding DATABASE_URL to Vercel environment variables..."
vercel env add DATABASE_URL production <<< "$DB_URL"

# Get current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Ask if the user wants to migrate data
read -p "Do you want to migrate your existing SQLite data to PostgreSQL? (y/n): " MIGRATE_DATA
if [[ "$MIGRATE_DATA" =~ ^[Yy]$ ]]; then
  # Set environment variable for migration script
  export TARGET_DATABASE_URL="$DB_URL"
  
  # Run migration script
  echo "Running migration script..."
  cd backend
  python migrate_sqlite_to_postgres.py
  cd ..
fi

echo ""
echo "=== Database setup complete ==="
echo "Your PostgreSQL database is now configured with Vercel."
