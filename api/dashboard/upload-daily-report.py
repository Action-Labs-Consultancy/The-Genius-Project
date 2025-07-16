from datetime import datetime, timedelta
import json
import os
from pymongo import MongoClient
from bson import ObjectId
import pandas as pd

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['the_genius_project']
daily_reports = db['daily_reports']
kpi_history = db['kpi_history']

def calculate_kpis(data):
    """Calculate KPIs from the merged data"""
    # Calculate CAC (Customer Acquisition Cost)
    cac = data.get('adSpend', 0) / max(data.get('applications', 1), 1)
    
    # Calculate CPA (Cost per Application)
    cpa = data.get('adSpend', 0) / max(data.get('applications', 1), 1)
    
    # Calculate conversion rates
    store_to_install = (data.get('installs', 0) / max(data.get('storeVisits', 1), 1)) * 100
    install_to_onboard = (data.get('onboarded', 0) / max(data.get('installs', 1), 1)) * 100
    onboard_to_application = (data.get('applications', 0) / max(data.get('onboarded', 1), 1)) * 100
    application_to_disbursed = (data.get('disbursedFinances', 0) / max(data.get('applications', 1), 1)) * 100
    
    return {
        'cac': round(cac, 2),
        'cpa': round(cpa, 2),
        'conversionRates': {
            'storeToInstall': round(store_to_install, 2),
            'installToOnboard': round(install_to_onboard, 2),
            'onboardToApplication': round(onboard_to_application, 2),
            'applicationToDisbursed': round(application_to_disbursed, 2)
        },
        'totalConversionRate': round((data.get('disbursedFinances', 0) / max(data.get('storeVisits', 1), 1)) * 100, 2)
    }

def merge_with_existing_data(new_data):
    """Merge new data with existing data, prioritizing latest information"""
    
    # Get existing data for the same date
    existing_data = daily_reports.find_one({
        'date': new_data['date']
    })
    
    if existing_data:
        # Update existing record with new data
        merged_data = {**existing_data, **new_data}
        merged_data['lastUpdated'] = datetime.now()
        merged_data['version'] = existing_data.get('version', 1) + 1
        
        # Update the record
        daily_reports.update_one(
            {'_id': existing_data['_id']},
            {'$set': merged_data}
        )
    else:
        # Create new record
        merged_data = {
            **new_data,
            'createdAt': datetime.now(),
            'lastUpdated': datetime.now(),
            'version': 1
        }
        
        # Insert new record
        result = daily_reports.insert_one(merged_data)
        merged_data['_id'] = result.inserted_id
    
    return merged_data

def get_historical_data(days=30):
    """Get historical data for trend analysis"""
    
    start_date = datetime.now() - timedelta(days=days)
    
    historical_data = list(daily_reports.find({
        'date': {'$gte': start_date.strftime('%Y-%m-%d')}
    }).sort('date', 1))
    
    return historical_data

def handler(event, context):
    try:
        # Parse the request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        uploaded_data = body.get('data', {})
        upload_date = body.get('uploadDate')
        file_name = body.get('fileName', 'unknown.xlsx')
        
        if not uploaded_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'error': 'No data provided',
                    'message': 'Please provide valid data to upload'
                })
            }
        
        # Add metadata to the uploaded data
        processed_data = {
            **uploaded_data,
            'uploadDate': upload_date,
            'fileName': file_name,
            'date': uploaded_data.get('date', datetime.now().strftime('%Y-%m-%d'))
        }
        
        # Merge with existing data
        merged_data = merge_with_existing_data(processed_data)
        
        # Calculate KPIs
        kpis = calculate_kpis(merged_data)
        merged_data['kpis'] = kpis
        
        # Update the record with calculated KPIs
        daily_reports.update_one(
            {'_id': merged_data['_id']},
            {'$set': {'kpis': kpis}}
        )
        
        # Store KPI history for trend analysis
        kpi_history.insert_one({
            'date': merged_data['date'],
            'kpis': kpis,
            'timestamp': datetime.now(),
            'reportId': merged_data['_id']
        })
        
        # Get historical data for context
        historical_data = get_historical_data(30)
        
        # Calculate trends
        trends = calculate_trends(historical_data)
        
        # Prepare response
        response_data = {
            'success': True,
            'message': 'Data uploaded and processed successfully',
            'mergedData': {
                'current': {
                    'date': merged_data['date'],
                    'storeVisits': merged_data.get('storeVisits', 0),
                    'installs': merged_data.get('installs', 0),
                    'onboarded': merged_data.get('onboarded', 0),
                    'applications': merged_data.get('applications', 0),
                    'disbursedFinances': merged_data.get('disbursedFinances', 0),
                    'adSpend': merged_data.get('adSpend', 0),
                    'kpis': kpis
                },
                'historical': historical_data[-7:] if len(historical_data) > 7 else historical_data,
                'trends': trends
            },
            'uploadInfo': {
                'fileName': file_name,
                'uploadDate': upload_date,
                'version': merged_data.get('version', 1),
                'recordsUpdated': 1
            }
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps(response_data, default=str)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'An error occurred while processing the upload'
            })
        }

def calculate_trends(historical_data):
    """Calculate trends from historical data"""
    if len(historical_data) < 2:
        return {
            'cac': 'stable',
            'cpa': 'stable',
            'conversionRate': 'stable',
            'adSpend': 'stable'
        }
    
    # Get last two data points
    current = historical_data[-1]
    previous = historical_data[-2]
    
    current_kpis = current.get('kpis', {})
    previous_kpis = previous.get('kpis', {})
    
    def get_trend(current_val, previous_val):
        if current_val > previous_val * 1.05:
            return 'increasing'
        elif current_val < previous_val * 0.95:
            return 'decreasing'
        else:
            return 'stable'
    
    return {
        'cac': get_trend(current_kpis.get('cac', 0), previous_kpis.get('cac', 0)),
        'cpa': get_trend(current_kpis.get('cpa', 0), previous_kpis.get('cpa', 0)),
        'conversionRate': get_trend(current_kpis.get('totalConversionRate', 0), previous_kpis.get('totalConversionRate', 0)),
        'adSpend': get_trend(current.get('adSpend', 0), previous.get('adSpend', 0))
    }
