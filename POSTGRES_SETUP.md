# PostgreSQL Setup for Vercel Deployment

This guide explains how to set up a PostgreSQL database for your Vercel deployment.

## Step 1: Choose a PostgreSQL Provider

For Vercel deployments, you need a cloud-hosted PostgreSQL database. Here are recommended options:

- **[Neon](https://neon.tech)** - Serverless Postgres (Recommended)
- **[Supabase](https://supabase.com)** - PostgreSQL with backend features
- **[Railway](https://railway.app)** - Easy PostgreSQL deployments

## Step 2: Set Up Your Database

### Using Neon (Recommended)

1. Go to [Neon](https://neon.tech) and sign up or log in
2. Create a new project
3. Once created, go to the "Connection Details" section
4. Copy the connection string (starts with `postgres://`)

### Using Supabase

1. Go to [Supabase](https://supabase.com) and sign up or log in
2. Create a new project
3. Go to Project Settings → Database
4. Find the "Connection string" or "URI" section and copy it

## Step 3: Add the Database URL to Vercel

1. Go to your Vercel project
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string
4. Save the changes

## Step 4: Migrate Your Data (Optional)

If you want to move your existing SQLite data to PostgreSQL:

1. Make sure you have your PostgreSQL connection string
2. Run the migration script:

```bash
# Set your database URL as an environment variable
export TARGET_DATABASE_URL="your_postgres_connection_string"

# Run the migration script
cd backend
python migrate_sqlite_to_postgres.py
```

## Step 5: Deploy to Vercel

When you deploy to Vercel, your application will automatically use the PostgreSQL database instead of SQLite.

## Notes for PostgreSQL Usage

- **SSL Mode**: Most cloud PostgreSQL providers require SSL. Your app.py is already configured to handle this.
- **Connection Pooling**: For production use, consider enabling connection pooling in your database provider settings.
- **Database Maintenance**: Regularly back up your database and manage indexes for optimal performance.

## Troubleshooting

- **Connection Issues**: Ensure your connection string is correct and that your database provider's IP is allowed in your firewall settings.
- **Migration Errors**: If you encounter errors during migration, you may need to manually adjust schemas or data types.
- **Performance Issues**: If your application slows down, consider adding indexes to frequently queried columns.

For more help, refer to your database provider's documentation or contact their support.
