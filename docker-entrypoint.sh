#!/bin/sh

# Set proper file permissions
if [ -d /root/.n8n ]; then
    find /root/.n8n -type d -exec chmod 755 {} \;
    find /root/.n8n -type f -exec chmod 644 {} \;
fi

# Set default environment variables if not provided
export N8N_HOST=${N8N_HOST:-0.0.0.0}
export N8N_PORT=${N8N_PORT:-5678}
export N8N_PROTOCOL=${N8N_PROTOCOL:-http}
export NODE_ENV=${NODE_ENV:-production}
export WEBHOOK_URL=${WEBHOOK_URL:-http://localhost:5678}

# Database settings for persistence
export DB_TYPE=${DB_TYPE:-sqlite}
export DB_SQLITE_DATABASE=${DB_SQLITE_DATABASE:-/data/database.sqlite}

# Security settings
export N8N_BASIC_AUTH_ACTIVE=${N8N_BASIC_AUTH_ACTIVE:-true}
export N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER:-admin}
export N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD:-admin}

# AI and integration settings
export N8N_AI_ENABLED=${N8N_AI_ENABLED:-true}
export N8N_COMMUNITY_PACKAGES_ENABLED=${N8N_COMMUNITY_PACKAGES_ENABLED:-true}

# Custom nodes path
export N8N_CUSTOM_EXTENSIONS=${N8N_CUSTOM_EXTENSIONS:-/root/.n8n/custom}

# Debugging
export N8N_LOG_LEVEL=${N8N_LOG_LEVEL:-info}
export N8N_LOG_OUTPUT=${N8N_LOG_OUTPUT:-console}

# Create necessary directories
mkdir -p /data
mkdir -p /root/.n8n/custom

# Set proper ownership
chown -R root:root /data
chown -R root:root /root/.n8n

echo "Starting n8n with the following configuration:"
echo "Host: $N8N_HOST"
echo "Port: $N8N_PORT"
echo "Protocol: $N8N_PROTOCOL"
echo "Database: $DB_TYPE"
echo "Custom extensions: $N8N_CUSTOM_EXTENSIONS"
echo "Log level: $N8N_LOG_LEVEL"

# Start n8n
exec su-exec root n8n start
