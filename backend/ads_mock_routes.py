"""
Simple ads API with mock data for development
This provides the same endpoints but with in-memory data instead of MongoDB
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

ads_mock_bp = Blueprint('ads_mock', __name__)

# Mock data storage
mock_incoming_requests = [
    {
        "id": "1",
        "brand": "Nike",
        "campaign": "Air Max 2025 Launch",
        "budget": "$50K",
        "urgency": "high",
        "client_id": "1",
        "description": "Launch campaign for new Air Max shoes targeting young adults",
        "contact_email": "marketing@nike.com",
        "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
        "status": "pending",
        "created_at": (datetime.now() - timedelta(days=1)).isoformat()
    },
    {
        "id": "2",
        "brand": "Apple",
        "campaign": "iPhone 17 Pro",
        "budget": "$100K",
        "urgency": "medium",
        "client_id": "2",
        "description": "Pre-launch buzz for iPhone 17 Pro with focus on camera features",
        "contact_email": "campaigns@apple.com",
        "deadline": (datetime.now() + timedelta(days=14)).isoformat(),
        "status": "pending",
        "created_at": (datetime.now() - timedelta(days=2)).isoformat()
    },
    {
        "id": "3",
        "brand": "Tesla",
        "campaign": "Model Y Summer Campaign",
        "budget": "$75K",
        "urgency": "low",
        "client_id": "1",
        "description": "Summer road trip campaign for Model Y",
        "contact_email": "social@tesla.com",
        "deadline": (datetime.now() + timedelta(days=21)).isoformat(),
        "status": "pending",
        "created_at": (datetime.now() - timedelta(days=3)).isoformat()
    }
]

mock_sponsorship_history = [
    {
        "id": "1",
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
        "created_at": (datetime.now() - timedelta(days=35)).isoformat()
    },
    {
        "id": "2",
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
        "created_at": (datetime.now() - timedelta(days=30)).isoformat()
    },
    {
        "id": "3",
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
        "created_at": (datetime.now() - timedelta(days=20)).isoformat()
    }
]

mock_timeline_data = {
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
    "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
    "updated_at": datetime.now().isoformat()
}

@ads_mock_bp.route('/api/ads/incoming-requests', methods=['GET'])
def get_incoming_requests():
    """Get incoming sponsorship requests"""
    try:
        client_id = request.args.get('client_id')
        
        if client_id and client_id != 'all':
            filtered_requests = [req for req in mock_incoming_requests if req.get('client_id') == client_id]
            return jsonify(filtered_requests)
        
        return jsonify(mock_incoming_requests)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ads_mock_bp.route('/api/ads/incoming-requests', methods=['POST'])
def create_incoming_request():
    """Create a new incoming sponsorship request"""
    try:
        data = request.get_json()
        
        new_request = {
            "id": str(max([int(req["id"]) for req in mock_incoming_requests], default=0) + 1),
            "brand": data.get("brand"),
            "campaign": data.get("campaign"),
            "budget": data.get("budget"),
            "urgency": data.get("urgency", "medium"),
            "client_id": data.get("client_id"),
            "description": data.get("description", ""),
            "contact_email": data.get("contact_email", ""),
            "deadline": data.get("deadline"),
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        
        mock_incoming_requests.append(new_request)
        return jsonify(new_request), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ads_mock_bp.route('/api/ads/incoming-requests/<request_id>', methods=['DELETE'])
def delete_incoming_request(request_id):
    """Delete an incoming request (when scheduled to timeline)"""
    try:
        global mock_incoming_requests
        mock_incoming_requests = [req for req in mock_incoming_requests if req["id"] != request_id]
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ads_mock_bp.route('/api/ads/sponsorship-history', methods=['GET'])
def get_sponsorship_history():
    """Get sponsorship history"""
    try:
        client_id = request.args.get('client_id')
        
        if client_id and client_id != 'all':
            filtered_history = [item for item in mock_sponsorship_history if item.get('client_id') == client_id]
            return jsonify(filtered_history)
        
        return jsonify(mock_sponsorship_history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ads_mock_bp.route('/api/ads/timeline', methods=['GET'])
def get_timeline():
    """Get weekly timeline data"""
    try:
        return jsonify([mock_timeline_data])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ads_mock_bp.route('/api/ads/timeline', methods=['POST'])
def save_timeline():
    """Save timeline data"""
    try:
        data = request.get_json()
        
        # Update mock timeline data
        global mock_timeline_data
        mock_timeline_data.update(data)
        mock_timeline_data["updated_at"] = datetime.now().isoformat()
        
        return jsonify({"success": True, "message": "Timeline saved successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
