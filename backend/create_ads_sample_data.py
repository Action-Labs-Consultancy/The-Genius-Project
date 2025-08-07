"""
Script to populate sample ads data in MongoDB
Run this to set up initial data for the ads system
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from mongo_db import mongo
from datetime import datetime, timedelta

def create_sample_ads_data():
    """Create sample data for the ads system"""
    
    # Connect to MongoDB
    try:
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/genius_db')
        mongo.connect(mongo_uri)
        print(f"✅ Connected to MongoDB: {mongo_uri}")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        print("Using fallback in-memory data...")
        return
    
    # Sample incoming requests
    incoming_requests = [
        {
            "brand": "Nike",
            "campaign": "Air Max 2025 Launch",
            "budget": "$50K",
            "urgency": "high",
            "client_id": "1",
            "description": "Launch campaign for new Air Max shoes targeting young adults",
            "contact_email": "marketing@nike.com",
            "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
            "status": "pending",
            "created_at": datetime.now() - timedelta(days=1)
        },
        {
            "brand": "Apple",
            "campaign": "iPhone 17 Pro",
            "budget": "$100K",
            "urgency": "medium",
            "client_id": "2",
            "description": "Pre-launch buzz for iPhone 17 Pro with focus on camera features",
            "contact_email": "campaigns@apple.com",
            "deadline": (datetime.now() + timedelta(days=14)).isoformat(),
            "status": "pending",
            "created_at": datetime.now() - timedelta(days=2)
        },
        {
            "brand": "Tesla",
            "campaign": "Model Y Summer Campaign",
            "budget": "$75K",
            "urgency": "low",
            "client_id": "1",
            "description": "Summer road trip campaign for Model Y",
            "contact_email": "social@tesla.com",
            "deadline": (datetime.now() + timedelta(days=21)).isoformat(),
            "status": "pending",
            "created_at": datetime.now() - timedelta(days=3)
        }
    ]
    
    # Sample sponsorship history
    sponsorship_history = [
        {
            "campaign": "Summer Fashion Week",
            "brand": "Zara",
            "client_id": "1",
            "totalSponsorships": 15,
            "engagement": "high",
            "recentRuns": ["July 15", "July 22", "July 29"],
            "performance": [85, 92, 78, 88, 95],
            "aiTip": "Best performing day: Thursday",
            "status": "completed",
            "total_spent": "$45K",
            "roi": "342%",
            "start_date": (datetime.now() - timedelta(days=30)).isoformat(),
            "end_date": (datetime.now() - timedelta(days=7)).isoformat(),
            "metrics": {
                "clicks": 125000,
                "impressions": 2500000,
                "conversions": 3420,
                "ctr": "5.0%",
                "conversion_rate": "2.74%"
            },
            "created_at": datetime.now() - timedelta(days=35)
        },
        {
            "campaign": "Tech Innovation",
            "brand": "Samsung",
            "client_id": "2",
            "totalSponsorships": 8,
            "engagement": "medium",
            "recentRuns": ["July 10", "July 17", "July 24"],
            "performance": [65, 70, 68, 72, 75],
            "aiTip": "Try more Friday runs for higher engagement",
            "status": "completed",
            "total_spent": "$28K",
            "roi": "156%",
            "start_date": (datetime.now() - timedelta(days=25)).isoformat(),
            "end_date": (datetime.now() - timedelta(days=3)).isoformat(),
            "metrics": {
                "clicks": 68000,
                "impressions": 1400000,
                "conversions": 1560,
                "ctr": "4.9%",
                "conversion_rate": "2.29%"
            },
            "created_at": datetime.now() - timedelta(days=30)
        },
        {
            "campaign": "AI Revolution 2025",
            "brand": "OpenAI",
            "client_id": "1",
            "totalSponsorships": 22,
            "engagement": "high",
            "recentRuns": ["Aug 1", "Aug 3", "Aug 5"],
            "performance": [95, 88, 92, 90, 98],
            "aiTip": "Peak engagement on weekdays",
            "status": "active",
            "total_spent": "$120K",
            "roi": "425%",
            "start_date": (datetime.now() - timedelta(days=14)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=14)).isoformat(),
            "metrics": {
                "clicks": 245000,
                "impressions": 4200000,
                "conversions": 8750,
                "ctr": "5.8%",
                "conversion_rate": "3.57%"
            },
            "created_at": datetime.now() - timedelta(days=20)
        }
    ]
    
    # Sample timeline data
    timeline_data = {
        "week_start": "2025-08-04",
        "week_range": "August 4–10, 2025",
        "client_id": "all",
        "days": [
            {
                "id": "mon",
                "name": "Monday",
                "date": "Aug 4",
                "active": True,
                "campaigns": [
                    {
                        "id": 101,
                        "brand": "Nike",
                        "campaign": "Air Max Flash Sale",
                        "budget": "$25K",
                        "client_id": "1"
                    }
                ]
            },
            {
                "id": "tue",
                "name": "Tuesday",
                "date": "Aug 5",
                "active": True,
                "campaigns": []
            },
            {
                "id": "wed",
                "name": "Wednesday",
                "date": "Aug 6",
                "active": False,
                "campaigns": []
            },
            {
                "id": "thu",
                "name": "Thursday",
                "date": "Aug 7",
                "active": True,
                "campaigns": [
                    {
                        "id": 102,
                        "brand": "Samsung",
                        "campaign": "Galaxy S25 Preview",
                        "budget": "$40K",
                        "client_id": "2"
                    }
                ]
            },
            {
                "id": "fri",
                "name": "Friday",
                "date": "Aug 8",
                "active": True,
                "campaigns": []
            },
            {
                "id": "sat",
                "name": "Saturday",
                "date": "Aug 9",
                "active": False,
                "campaigns": []
            },
            {
                "id": "sun",
                "name": "Sunday",
                "date": "Aug 10",
                "active": True,
                "campaigns": []
            }
        ],
        "created_at": datetime.now() - timedelta(days=1),
        "updated_at": datetime.now()
    }
    
    try:
        # Insert incoming requests
        requests_collection = mongo.get_collection('ads_incoming_requests')
        # Clear existing data
        requests_collection.delete_many({})
        # Insert new data
        requests_collection.insert_many(incoming_requests)
        print(f"✅ Inserted {len(incoming_requests)} incoming requests")
        
        # Insert sponsorship history
        history_collection = mongo.get_collection('ads_sponsorship_history')
        # Clear existing data
        history_collection.delete_many({})
        # Insert new data
        history_collection.insert_many(sponsorship_history)
        print(f"✅ Inserted {len(sponsorship_history)} sponsorship history items")
        
        # Insert timeline data
        timeline_collection = mongo.get_collection('ads_timeline')
        # Clear existing data
        timeline_collection.delete_many({})
        # Insert new data
        timeline_collection.insert_one(timeline_data)
        print(f"✅ Inserted timeline data")
        
        print("🎉 Sample ads data created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Creating sample ads data...")
    create_sample_ads_data()
