"""
Ads Data Seeder
Creates initial sample data for ads management system
"""

import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(__file__))

from mongo_db import mongo

def seed_ads_data():
    """Create sample ads data in MongoDB collections."""
    try:
        print("[ADS SEEDER] Starting ads data seeding...")
        
        # Sample incoming requests
        requests_collection = mongo.get_collection('ads_incoming_requests')
        
        # Clear existing sample data
        requests_collection.delete_many({'brand': {'$in': ['Nike', 'Apple', 'Tesla', 'Google']}})
        
        sample_requests = [
            {
                'brand': 'Nike',
                'campaign': 'Air Max 2025 Launch',
                'budget': '$50K',
                'urgency': 'high',
                'client_id': '1',  # Action Labs
                'description': 'New Air Max sneaker launch campaign targeting fitness enthusiasts',
                'contact_email': 'marketing@nike.com',
                'deadline': '2025-08-10',
                'status': 'pending',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'brand': 'Apple',
                'campaign': 'iPhone 17 Pro',
                'budget': '$100K',
                'urgency': 'medium',
                'client_id': '1',  # Action Labs
                'description': 'Revolutionary iPhone 17 Pro featuring advanced AI capabilities',
                'contact_email': 'campaigns@apple.com',
                'deadline': '2025-08-15',
                'status': 'pending',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'brand': 'Tesla',
                'campaign': 'Model S Refresh',
                'budget': '$75K',
                'urgency': 'medium',
                'client_id': '2',  # Sample Client
                'description': 'Updated Model S with new interior and enhanced autopilot',
                'contact_email': 'marketing@tesla.com',
                'deadline': '2025-08-20',
                'status': 'pending',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'brand': 'Google',
                'campaign': 'Pixel 9 Pro',
                'budget': '$60K',
                'urgency': 'high',
                'client_id': '2',  # Sample Client
                'description': 'Next-gen Pixel with advanced AI photography features',
                'contact_email': 'ads@google.com',
                'deadline': '2025-08-12',
                'status': 'pending',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        ]
        
        requests_collection.insert_many(sample_requests)
        print(f"[ADS SEEDER] Created {len(sample_requests)} incoming requests")
        
        # Sample sponsorship history
        history_collection = mongo.get_collection('ads_sponsorship_history')
        
        # Clear existing sample data
        history_collection.delete_many({'brand': {'$in': ['Zara', 'Samsung', 'OpenAI', 'Microsoft', 'Adobe']}})
        
        sample_history = [
            {
                'campaign': 'Summer Fashion Week',
                'brand': 'Zara',
                'client_id': '1',  # Action Labs
                'total_sponsorships': 15,
                'engagement': 'high',
                'recent_runs': ['July 15', 'July 22', 'July 29'],
                'performance': [85, 92, 78, 88, 95],
                'ai_tip': 'Best performing day: Thursday',
                'revenue': 45000,
                'roi': 230,
                'created_at': datetime.utcnow() - timedelta(days=30),
                'updated_at': datetime.utcnow()
            },
            {
                'campaign': 'Tech Innovation Summit',
                'brand': 'Samsung',
                'client_id': '2',  # Sample Client
                'total_sponsorships': 8,
                'engagement': 'medium',
                'recent_runs': ['July 10', 'July 17', 'July 24'],
                'performance': [65, 70, 68, 72, 75],
                'ai_tip': 'Try more Friday runs for higher engagement',
                'revenue': 28000,
                'roi': 175,
                'created_at': datetime.utcnow() - timedelta(days=25),
                'updated_at': datetime.utcnow()
            },
            {
                'campaign': 'AI Revolution 2025',
                'brand': 'OpenAI',
                'client_id': '1',  # Action Labs
                'total_sponsorships': 22,
                'engagement': 'high',
                'recent_runs': ['Aug 1', 'Aug 3', 'Aug 5'],
                'performance': [95, 88, 92, 90, 98],
                'ai_tip': 'Peak engagement on weekdays',
                'revenue': 85000,
                'roi': 340,
                'created_at': datetime.utcnow() - timedelta(days=15),
                'updated_at': datetime.utcnow()
            },
            {
                'campaign': 'Cloud Computing Excellence',
                'brand': 'Microsoft',
                'client_id': '1',  # Action Labs
                'total_sponsorships': 12,
                'engagement': 'high',
                'recent_runs': ['July 28', 'Aug 2', 'Aug 6'],
                'performance': [88, 84, 91, 87, 93],
                'ai_tip': 'Tuesday and Wednesday show highest CTR',
                'revenue': 55000,
                'roi': 275,
                'created_at': datetime.utcnow() - timedelta(days=20),
                'updated_at': datetime.utcnow()
            },
            {
                'campaign': 'Creative Cloud Pro',
                'brand': 'Adobe',
                'client_id': '2',  # Sample Client
                'total_sponsorships': 18,
                'engagement': 'medium',
                'recent_runs': ['July 25', 'July 30', 'Aug 4'],
                'performance': [76, 82, 79, 85, 81],
                'ai_tip': 'Design-focused content performs best on weekends',
                'revenue': 42000,
                'roi': 210,
                'created_at': datetime.utcnow() - timedelta(days=12),
                'updated_at': datetime.utcnow()
            }
        ]
        
        history_collection.insert_many(sample_history)
        print(f"[ADS SEEDER] Created {len(sample_history)} sponsorship history records")
        
        # Sample timeline data
        timeline_collection = mongo.get_collection('ads_timeline')
        
        # Clear existing sample data  
        timeline_collection.delete_many({'week_start': '2025-08-04'})
        
        sample_timeline = {
            'week_start': '2025-08-04',
            'week_range': 'August 4–10, 2025',
            'client_id': '1',  # Action Labs
            'days': [
                {
                    'id': 'mon',
                    'name': 'Monday',
                    'date': 'Aug 4',
                    'active': True,
                    'campaigns': [
                        {
                            'id': 'camp1',
                            'title': 'Summer Collection Launch',
                            'brand': 'H&M',
                            'category': 'fashion',
                            'color': '#3B82F6',
                            'icon': '👗'
                        }
                    ]
                },
                {
                    'id': 'tue',
                    'name': 'Tuesday',
                    'date': 'Aug 5',
                    'active': True,
                    'campaigns': [
                        {
                            'id': 'camp2',
                            'title': 'New Smartphone Release',
                            'brand': 'OnePlus',
                            'category': 'tech',
                            'color': '#F97316',
                            'icon': '📱'
                        }
                    ]
                },
                {
                    'id': 'wed',
                    'name': 'Wednesday',
                    'date': 'Aug 6',
                    'active': False,
                    'campaigns': []
                },
                {
                    'id': 'thu',
                    'name': 'Thursday',
                    'date': 'Aug 7',
                    'active': True,
                    'campaigns': [
                        {
                            'id': 'camp3',
                            'title': 'Wellness Challenge',
                            'brand': 'Nike',
                            'category': 'wellness',
                            'color': '#10B981',
                            'icon': '🏃‍♂️'
                        }
                    ]
                },
                {
                    'id': 'fri',
                    'name': 'Friday',
                    'date': 'Aug 8',
                    'active': True,
                    'campaigns': []
                },
                {
                    'id': 'sat',
                    'name': 'Saturday',
                    'date': 'Aug 9',
                    'active': False,
                    'campaigns': []
                },
                {
                    'id': 'sun',
                    'name': 'Sunday',
                    'date': 'Aug 10',
                    'active': True,
                    'campaigns': []
                }
            ],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        timeline_collection.insert_one(sample_timeline)
        print("[ADS SEEDER] Created sample timeline data")
        
        print("[ADS SEEDER] ✅ Ads data seeding completed successfully!")
        
        # Print summary
        print("\n📊 ADS DATA SUMMARY:")
        print(f"📬 Incoming Requests: {requests_collection.count_documents({})}")
        print(f"📈 Sponsorship History: {history_collection.count_documents({})}")
        print(f"📅 Timeline Records: {timeline_collection.count_documents({})}")
        
        return True
        
    except Exception as e:
        print(f"[ADS SEEDER] ❌ Error seeding ads data: {e}")
        return False

if __name__ == "__main__":
    # Connect to MongoDB
    if mongo.connect():
        print("[ADS SEEDER] MongoDB connected successfully")
        seed_ads_data()
    else:
        print("[ADS SEEDER] Failed to connect to MongoDB")
