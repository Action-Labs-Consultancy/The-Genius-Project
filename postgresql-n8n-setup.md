# PostgreSQL Installation and Setup for n8n with PITR
# Complete guide for Windows systems

## Step 1: Download and Install PostgreSQL

# Download PostgreSQL 15 from: https://www.postgresql.org/download/windows/
# Run the installer and follow these settings:
# - Installation Directory: C:\Program Files\PostgreSQL\15
# - Data Directory: C:\Program Files\PostgreSQL\15\data
# - Port: 5432
# - Superuser Password: [Choose a strong password]
# - Locale: Default locale

# Add PostgreSQL to PATH (run as Administrator)
setx /M PATH "%PATH%;C:\Program Files\PostgreSQL\15\bin"

# Verify installation
psql --version
