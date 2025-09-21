#!/usr/bin/env python3
"""
PostgreSQL Setup Script - User with password 'admin'
"""
import subprocess
import os
import sys

def main():
    print("🚀 PostgreSQL Setup for n8n (user: n8n_user, password: admin)")
    print("=" * 60)
    psql_path = r"C:\Program Files\PostgreSQL\17\bin\psql.exe"
    sql_file = "setup_admin_password_postgres.sql"
    if not os.path.exists(psql_path):
        print(f"❌ PostgreSQL not found at {psql_path}")
        return False
    if not os.path.exists(sql_file):
        print(f"❌ SQL file not found: {sql_file}")
        return False
    print("🔧 Attempting to run setup as postgres superuser...")
    print("   You'll be prompted for the postgres user password")
    try:
        cmd = [psql_path, "-U", "postgres", "-d", "postgres", "-f", sql_file]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print("✅ Database setup completed successfully!")
            print("\n" + "=" * 60)
            print("🔧 N8N POSTGRESQL CREDENTIALS")
            print("=" * 60)
            print()
            print("   Host: localhost")
            print("   Port: 5432")
            print("   Database: postgres")
            print("   User: n8n_user")
            print("   Password: admin")
            print("   SSL Mode: disable")
            print()
            print("🎯 After creating PostgreSQL credentials in n8n:")
            print("   1. Note the credential ID (e.g., 'abc123')")
            print("   2. Update both workflow files:")
            print("      - DD_Master_Workflow.json")
            print("      - DD_Section_01_Introduction.json")
            print("   3. Replace 'REPLACE_WITH_POSTGRES_CRED_ID' with your ID")
            print()
            print("✅ The error 'relation public.dd_sections does not exist' will be resolved!")
            return True
        else:
            print("❌ Setup failed:")
            print(f"   Exit code: {result.returncode}")
            print(f"   Error: {result.stderr}")
            print(f"   Output: {result.stdout}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Setup timed out - check your PostgreSQL password")
        return False
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n🔧 MANUAL SETUP INSTRUCTIONS:")
        print("-" * 40)
        print("1. Open pgAdmin")
        print("2. Connect to PostgreSQL server")
        print("3. Open Query Tool on 'postgres' database")
        print("4. Copy and paste contents of setup_admin_password_postgres.sql")
        print("5. Execute the script")
        sys.exit(1)
