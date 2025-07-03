import psycopg2

conn = psycopg2.connect(
    dbname="genius_project_db",
    user="rabab",
    host="localhost"
)
cur = conn.cursor()

# Add 'user_id' column to 'channel_member' if it doesn't exist
cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='channel_member' AND column_name='user_id'
    ) THEN
        ALTER TABLE channel_member ADD COLUMN user_id INTEGER;
    END IF;
END$$;
""")

# Add 'channel_id' column to 'channel_member' if it doesn't exist
cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='channel_member' AND column_name='channel_id'
    ) THEN
        ALTER TABLE channel_member ADD COLUMN channel_id INTEGER;
    END IF;
END$$;
""")

# Add 'name' column to 'channel' if it doesn't exist
cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='channel' AND column_name='name'
    ) THEN
        ALTER TABLE channel ADD COLUMN name VARCHAR;
    END IF;
END$$;
""")

# Add 'created_by' column to 'channel' if it doesn't exist
cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='channel' AND column_name='created_by'
    ) THEN
        ALTER TABLE channel ADD COLUMN created_by INTEGER;
    END IF;
END$$;
""")

conn.commit()
cur.close()
conn.close()
