import mysql.connector
import os
from functools import wraps
import logging

# Set up logging
logger = logging.getLogger('revive_plugin')
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

def get_db_connection():
    """Centralized database connection function with error handling"""
    # Check if required environment variables are set
    required_vars = ['REVIVE_DB_HOST', 'REVIVE_DB_USER', 'REVIVE_DB_PASSWORD', 'REVIVE_DB_NAME']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
    try:
        conn = mysql.connector.connect(
            host=os.environ.get('REVIVE_DB_HOST'),
            user=os.environ.get('REVIVE_DB_USER'),
            password=os.environ.get('REVIVE_DB_PASSWORD'),
            database=os.environ.get('REVIVE_DB_NAME')
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise

def get_revive_stats():
    try:
        conn = get_db_connection()
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
        logger.error(f"Error fetching Revive stats: {str(e)}")
        return []

def create_campaign(name, clientid, start_date, end_date):
    try:
        conn = get_db_connection()
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
        logger.error(f"Error creating campaign: {str(e)}")
        raise

def create_banner(campaignid, image_url, width, height, alt_text):
    try:
        conn = get_db_connection()
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
    except Exception as e:
        logger.error(f"Error creating banner: {str(e)}")
        raise
