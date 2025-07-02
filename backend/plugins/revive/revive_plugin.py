import mysql.connector
import os

def get_revive_stats():
    try:
        conn = mysql.connector.connect(
            host=os.environ.get('REVIVE_DB_HOST', 'localhost'),
            user=os.environ.get('REVIVE_DB_USER', 'reviveuser'),
            password=os.environ.get('REVIVE_DB_PASSWORD', 'yourpassword'),
            database=os.environ.get('REVIVE_DB_NAME', 'revive')
        )
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT 
                b.bannerid,
                c.campaignname,
                COALESCE(SUM(d.impressions), 0) as impressions,
                COALESCE(SUM(d.clicks), 0) as clicks
            FROM rv_banners b
            LEFT JOIN rv_campaigns c ON b.campaignid = c.campaignid
            LEFT JOIN rv_data_bkt_m d ON b.bannerid = d.bannerid 
                AND d.day >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY b.bannerid, c.campaignname
            ORDER BY impressions DESC
        ''')
        stats = cursor.fetchall()
        cursor.close()
        conn.close()
        return stats
    except Exception as e:
        print(f"Error fetching Revive stats: {e}")
        return []

def create_campaign(name, clientid, start_date, end_date):
    try:
        conn = mysql.connector.connect(
            host=os.environ.get('REVIVE_DB_HOST', 'localhost'),
            user=os.environ.get('REVIVE_DB_USER', 'reviveuser'),
            password=os.environ.get('REVIVE_DB_PASSWORD', 'yourpassword'),
            database=os.environ.get('REVIVE_DB_NAME', 'revive')
        )
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO rv_campaigns (clientid, campaignname, views, clicks, status, activate_time, expire_time)
            VALUES (%s, %s, 0, 0, 1, %s, %s)
        ''', (clientid, name, start_date, end_date))
        conn.commit()
        campaign_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return campaign_id
    except Exception as e:
        print(f"Error creating campaign: {e}")
        raise

def create_banner(campaignid, image_url, width, height, alt_text):
    conn = mysql.connector.connect(
        host=os.environ.get('REVIVE_DB_HOST', 'localhost'),
        user=os.environ.get('REVIVE_DB_USER', 'reviveuser'),
        password=os.environ.get('REVIVE_DB_PASSWORD', 'yourpassword'),
        database=os.environ.get('REVIVE_DB_NAME', 'revive')
    )
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO rv_banners (campaignid, contenttype, width, height, alt, url)
        VALUES (%s, 'web', %s, %s, %s, %s)
    ''', (campaignid, width, height, alt_text, image_url))
    conn.commit()
    banner_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return banner_id
