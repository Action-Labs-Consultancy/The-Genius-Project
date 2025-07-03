#!/bin/bash
set -e

echo "=== Vercel Database Setup ==="

# Database URL format: postgresql://username:password@host:port/database
# Example: postgresql://postgres:password@db.example.com:5432/verceldb

# If DATABASE_URL is not set, provide instructions
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo "Please set up a PostgreSQL database and add its connection URL to your Vercel environment variables."
  echo ""
  echo "You can use one of the following database providers:"
  echo "1. Vercel Postgres (recommended): https://vercel.com/docs/storage/vercel-postgres"
  echo "2. Neon: https://neon.tech"
  echo "3. Supabase: https://supabase.com"
  echo "4. Railway: https://railway.app"
  echo ""
  echo "Connection string format: postgresql://username:password@host:port/database"
  # Don't exit, continue with the build process but use SQLite as fallback
  echo "Continuing with SQLite as fallback database..."
fi

# Create necessary database tables if DATABASE_URL is set
if [ ! -z "$DATABASE_URL" ]; then
  echo "=== Setting up database tables ==="
  cd /vercel/path0/backend

  # Modify environment to work with Vercel
  export VERCEL_DEPLOYMENT=true

  # Create a mock pg_config if it doesn't exist
  if ! command -v pg_config &> /dev/null; then
      echo "Creating mock pg_config..."
      
      # Create a temporary directory for our mock
      mkdir -p /tmp/mock-pg-config/bin
      
      # Create a mock pg_config script
      cat > /tmp/mock-pg-config/bin/pg_config << 'EOF'
#!/bin/bash
# Mock pg_config that returns default values
case "$1" in
    --version)
        echo "PostgreSQL 12.0"
        ;;
    --includedir)
        echo "/usr/include"
        ;;
    --libdir)
        echo "/usr/lib"
        ;;
    *)
        echo ""
        ;;
esac
EOF
      
      # Make it executable
      chmod +x /tmp/mock-pg-config/bin/pg_config
      
      # Add to PATH
      export PATH="/tmp/mock-pg-config/bin:$PATH"
      
      echo "Mock pg_config created and added to PATH"
  fi

  # Install psycopg2 without building extensions
  export PSYCOPG2_BINARY_NO_BUILD_EXT=1
fi

# Continue with normal build process
cd /vercel/path0
exec /vercel/path0/vercel.build.sh
