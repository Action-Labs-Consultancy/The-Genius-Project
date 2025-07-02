# Revive Adserver Local Integration

This integration allows your app to fetch ad stats (impressions, clicks) directly from your local Revive Adserver MySQL database.

## Setup

1. **Install MySQL client for Python:**
   ```sh
   pip install mysql-connector-python
   ```

2. **Configure Revive DB credentials:**
   Edit `backend/.env` if needed:
   ```
   REVIVE_DB_HOST=localhost
   REVIVE_DB_USER=reviveuser
   REVIVE_DB_PASSWORD=yourpassword
   REVIVE_DB_NAME=revive
   ```

3. **Run the stats fetcher:**
   ```sh
   python revive_integration/revive_stats.py
   ```

## Customization
- Edit the SQL in `revive_stats.py` to fetch other stats (per campaign, zone, etc.).
- You can import and use `get_revive_stats()` in your Flask app to display stats in your UI.

## Security
- This integration is 100% local. No data leaves your machine.
