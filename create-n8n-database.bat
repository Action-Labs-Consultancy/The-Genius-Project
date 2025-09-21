@echo off
REM Step 2: Create Database and User for n8n
REM Run this script as Administrator

echo Creating n8n database and user...

REM Connect to PostgreSQL and create database
psql -U postgres -c "CREATE DATABASE n8n_db;"

REM Create n8n user with password
psql -U postgres -c "CREATE USER n8n_user WITH ENCRYPTED PASSWORD 'n8n_secure_password_2024';"

REM Grant privileges to n8n user
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE n8n_db TO n8n_user;"
psql -U postgres -c "ALTER USER n8n_user CREATEDB;"

REM Connect to n8n database and grant schema privileges
psql -U postgres -d n8n_db -c "GRANT ALL ON SCHEMA public TO n8n_user;"
psql -U postgres -d n8n_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n_user;"
psql -U postgres -d n8n_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n_user;"

echo Database setup complete!
echo Database: n8n_db
echo User: n8n_user
echo Password: n8n_secure_password_2024

pause
