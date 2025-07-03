#!/bin/bash
set -e

echo "Running Vercel PostgreSQL adapter..."

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

# Continue with the normal build process
cd /vercel/path0
exec /vercel/path0/vercel.build.sh
