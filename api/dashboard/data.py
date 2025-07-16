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
social_media_data = db['social_media_data']

def handler(request):
    """
    Main dashboard data endpoint - aggregates all real data for the dashboard
    """
    try:
        # Get query parameters
        user_id = request.args.get('user_id', 'default')
        date_from = request.args.get('startDate', (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
        date_to = request.args.get('endDate', datetime.now().strftime('%Y-%m-%d'))
        
        # Convert dates to datetime objects
        try:
            from_date = datetime.strptime(date_from, '%Y-%m-%d')
            to_date = datetime.strptime(date_to, '%Y-%m-%d')
        except ValueError:
            # Fallback to default dates if parsing fails
            from_date = datetime.now() - timedelta(days=30)
            to_date = datetime.now()
        
        # Fetch real data from MongoDB
        dashboard_data = get_dashboard_data(user_id, from_date, to_date)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(dashboard_data)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Error fetching dashboard data'
            })
        }

def get_dashboard_data(user_id, from_date, to_date):
    """
    Fetch and aggregate dashboard data from imported daily reports within date range
    """
    try:
        # Get KPI data within the date range
        kpi_records = list(kpi_history.find({
            'userId': user_id,
            'date': {
                '$gte': from_date.strftime('%Y-%m-%d'),
                '$lte': to_date.strftime('%Y-%m-%d')
            }
        }).sort('date', -1))
        
        if not kpi_records:
            # Return empty data structure if no data exists
            return {
                'data': {
                    'kpis': {
                        'premisesDisbursed': 0,
                        'achievementRatio': 0,
                        'cac': 0,
                        'cpa': 0,
                        'spendAmount': 0,
                        'tvSpend': 0,
                        'tvReach': 0
                    },
                    'funnel': {
                        'storeVisits': 0,
                        'installs': 0,
                        'onboard': 0,
                        'linked': 0,
                        'disbursed': 0
                    },
                    'lastMonth': {
                        'achievementRatio': 0,
                        'financeBehavior': 0,
                        'gc': 0,
                        'cac': 0,
                        'growth': 0,
                        'engagementRate': 0
                    },
                    'budget': {
                        'monthly': 0,
                        'balance': 0,
                        'allocation': []
                    },
                    'topAds': [],
                    'chartData': [],
                    'recentUploads': []
                },
                'insights': [],
                'lastUploadDate': None
            }
        
        # Get the latest KPI record for main metrics
        latest_kpi = kpi_records[0]
        kpi_data = latest_kpi.get('kpis', {})
        breakdown = latest_kpi.get('breakdown', {})
        
        # Calculate aggregated metrics from the date range
        aggregated_metrics = calculate_aggregated_metrics(kpi_records)
        
        # Build dashboard data structure
        dashboard_data = {
            'data': {
                'kpis': {
                    'premisesDisbursed': aggregated_metrics.get('totalDisbursed', 0),
                    'achievementRatio': aggregated_metrics.get('achievementRatio', 0),
                    'cac': aggregated_metrics.get('cac', 0),
                    'cpa': aggregated_metrics.get('cpa', 0),
                    'spendAmount': aggregated_metrics.get('totalDisbursed', 0),
                    'tvSpend': 0,  # Not available in current data
                    'tvReach': 0   # Not available in current data
                },
                'funnel': {
                    'storeVisits': aggregated_metrics.get('totalApplications', 0),
                    'installs': aggregated_metrics.get('totalApproved', 0),
                    'onboard': aggregated_metrics.get('registeredOnboarded', 0),
                    'linked': aggregated_metrics.get('linkedAccounts', 0),
                    'disbursed': aggregated_metrics.get('totalDisbursed', 0)
                },
                'lastMonth': {
                    'achievementRatio': aggregated_metrics.get('achievementRatio', 0),
                    'financeBehavior': aggregated_metrics.get('totalApplications', 0),
                    'gc': aggregated_metrics.get('totalDisbursed', 0),
                    'cac': aggregated_metrics.get('cac', 0),
                    'growth': calculate_growth_from_records(kpi_records),
                    'engagementRate': aggregated_metrics.get('approvalRatio', 0)
                },
                'budget': {
                    'monthly': aggregated_metrics.get('totalDisbursed', 0) * 1.2,  # Estimate
                    'balance': aggregated_metrics.get('totalDisbursed', 0) * 0.2,  # Estimate
                    'allocation': build_allocation(breakdown)
                },
                'topAds': [],  # Will be populated from social media data
                'chartData': build_chart_data_from_records(kpi_records),
                'recentUploads': get_recent_uploads(user_id, from_date, to_date)
            },
            'insights': generate_insights(aggregated_metrics, breakdown),
            'lastUploadDate': get_last_upload_date(user_id)
        }
        
        return dashboard_data
        
    except Exception as e:
        print(f"Error getting dashboard data: {e}")
        return {
            'data': {
                'kpis': {},
                'funnel': {},
                'lastMonth': {},
                'budget': {},
                'topAds': [],
                'chartData': [],
                'recentUploads': []
            },
            'insights': [],
            'lastUploadDate': None
        }

def calculate_cac(kpi_data):
    """Calculate Customer Acquisition Cost"""
    total_disbursed = kpi_data.get('totalDisbursed', 0)
    registered_onboarded = kpi_data.get('registeredOnboarded', 0)
    
    if registered_onboarded > 0:
        return total_disbursed / registered_onboarded
    return 0

def calculate_cpa(kpi_data):
    """Calculate Cost Per Application"""
    total_disbursed = kpi_data.get('totalDisbursed', 0)
    total_applications = kpi_data.get('totalApplications', 0)
    
    if total_applications > 0:
        return total_disbursed / total_applications
    return 0

def calculate_growth(user_id):
    """Calculate growth rate"""
    # Get last two KPI records for comparison
    records = list(kpi_history.find({'userId': user_id}).sort('calculatedAt', -1).limit(2))
    
    if len(records) < 2:
        return 0
    
    current = records[0].get('kpis', {}).get('totalDisbursed', 0)
    previous = records[1].get('kpis', {}).get('totalDisbursed', 0)
    
    if previous > 0:
        return ((current - previous) / previous) * 100
    return 0

def build_allocation(breakdown):
    """Build budget allocation data"""
    allocation = []
    
    for category, data in breakdown.items():
        if data.get('disbursed', 0) > 0:
            allocation.append({
                'category': category.replace('_', ' ').title(),
                'amount': data.get('disbursed', 0),
                'percentage': 0  # Will be calculated in frontend
            })
    
    return allocation

def build_chart_data(user_id, from_date, to_date):
    """Build chart data for timeline"""
    records = list(kpi_history.find({
        'userId': user_id,
        'date': {
            '$gte': from_date.strftime('%Y-%m-%d'),
            '$lte': to_date.strftime('%Y-%m-%d')
        }
    }).sort('date', 1))
    
    chart_data = []
    for record in records:
        kpis = record.get('kpis', {})
        chart_data.append({
            'date': record.get('date'),
            'disbursed': kpis.get('totalDisbursed', 0),
            'applications': kpis.get('totalApplications', 0),
            'approved': kpis.get('totalApproved', 0)
        })
    
    return chart_data

def get_recent_uploads(user_id, from_date=None, to_date=None):
    """Get recent uploads within date range"""
    query = {'userId': user_id}
    
    if from_date and to_date:
        query['importedAt'] = {
            '$gte': from_date,
            '$lte': to_date
        }
    
    uploads = list(daily_reports.find(query).sort('importedAt', -1).limit(10))
    
    return [{
        'date': upload.get('reportDate'),
        'importedAt': upload.get('importedAt', '').strftime('%Y-%m-%d %H:%M:%S') if upload.get('importedAt') else '',
        'recordCount': 1
    } for upload in uploads]

def generate_insights(kpi_data, breakdown):
    """Generate AI insights based on data"""
    insights = []
    
    # Check achievement ratio
    achievement_ratio = kpi_data.get('achievementRatio', 0)
    if achievement_ratio > 80:
        insights.append({
            'type': 'success',
            'title': 'Excellent Performance',
            'message': f'Achievement ratio of {achievement_ratio:.1f}% is excellent. Keep up the good work!'
        })
    elif achievement_ratio < 50:
        insights.append({
            'type': 'warning',
            'title': 'Performance Alert',
            'message': f'Achievement ratio of {achievement_ratio:.1f}% is below target. Consider reviewing processes.'
        })
    
    # Check disbursement distribution
    total_disbursed = kpi_data.get('totalDisbursed', 0)
    if total_disbursed > 0:
        # Find the highest performing category
        max_category = max(breakdown.items(), key=lambda x: x[1].get('disbursed', 0))
        insights.append({
            'type': 'info',
            'title': 'Top Performing Category',
            'message': f'{max_category[0].replace("_", " ").title()} is your highest disbursing category with {max_category[1].get("disbursed", 0)} disbursed.'
        })
    
    return insights

def get_last_upload_date(user_id):
    """Get the last upload date for the user"""
    last_record = daily_reports.find_one({
        'userId': user_id
    }, sort=[('importedAt', -1)])
    
    if last_record and last_record.get('importedAt'):
        return last_record['importedAt'].isoformat()
    return None

def calculate_kpis(daily_data, latest_kpis):
    """
    Calculate KPIs from real data
    """
    if not daily_data:
        return {
            'premisesDisbursed': 0,
            'achievementRatio': 0,
            'cac': 0,
            'cpa': 0,
            'spendAmount': 0,
            'tvSpend': 0,
            'tvReach': 0
        }
    
    # Get most recent data
    latest_data = daily_data[0]
    
    # Calculate aggregated metrics
    total_disbursed = sum(item.get('disbursedFinances', 0) for item in daily_data)
    total_applications = sum(item.get('applications', 0) for item in daily_data)
    total_spend = sum(item.get('adSpend', 0) for item in daily_data)
    total_tv_spend = sum(item.get('tvSpend', 0) for item in daily_data)
    total_tv_reach = sum(item.get('tvReach', 0) for item in daily_data)
    
    # Calculate CAC and CPA
    cac = total_spend / max(total_applications, 1)
    cpa = total_spend / max(total_applications, 1)
    
    # Calculate achievement ratio
    goal = latest_data.get('campaignGoal', 1)
    achievement_ratio = (total_disbursed / goal * 100) if goal > 0 else 0
    
    return {
        'premisesDisbursed': total_disbursed,
        'achievementRatio': achievement_ratio,
        'cac': round(cac, 2),
        'cpa': round(cpa, 2),
        'spendAmount': total_spend,
        'tvSpend': total_tv_spend,
        'tvReach': total_tv_reach
    }

def calculate_funnel_data(daily_data):
    """
    Calculate funnel metrics from real data
    """
    if not daily_data:
        return {
            'storeVisits': 0,
            'installs': 0,
            'onboard': 0,
            'linked': 0,
            'disbursed': 0
        }
    
    # Aggregate funnel metrics
    total_store_visits = sum(item.get('storeVisits', 0) for item in daily_data)
    total_installs = sum(item.get('installs', 0) for item in daily_data)
    total_onboard = sum(item.get('onboarded', 0) for item in daily_data)
    total_linked = sum(item.get('linkedAccounts', 0) for item in daily_data)
    total_disbursed = sum(item.get('disbursedFinances', 0) for item in daily_data)
    
    return {
        'storeVisits': total_store_visits,
        'installs': total_installs,
        'onboard': total_onboard,
        'linked': total_linked,
        'disbursed': total_disbursed
    }

def calculate_campaign_data(daily_data):
    """
    Calculate campaign performance from real data
    """
    if not daily_data:
        return {
            'title': 'No Active Campaign',
            'achieved': 0,
            'goal': 1,
            'applicationsByProduct': [],
            'disbursedByProduct': []
        }
    
    latest_data = daily_data[0]
    
    # Get campaign info
    campaign_title = latest_data.get('campaignTitle', 'Current Campaign')
    campaign_goal = latest_data.get('campaignGoal', 1)
    total_achieved = sum(item.get('disbursedFinances', 0) for item in daily_data)
    
    # Calculate product breakdowns (if available)
    applications_by_product = latest_data.get('applicationsByProduct', [])
    disbursed_by_product = latest_data.get('disbursedByProduct', [])
    
    return {
        'title': campaign_title,
        'achieved': total_achieved,
        'goal': campaign_goal,
        'applicationsByProduct': applications_by_product,
        'disbursedByProduct': disbursed_by_product
    }

def calculate_budget_data(daily_data):
    """
    Calculate budget information from real data
    """
    if not daily_data:
        return {
            'monthly': 0,
            'daily': 0,
            'balance': 0,
            'spendOverTime': [],
            'breakdown': []
        }
    
    # Calculate spend over time
    spend_over_time = []
    for item in daily_data:
        spend_over_time.append({
            'date': item.get('date', ''),
            'spend': item.get('adSpend', 0),
            'cac': item.get('cac', 0)
        })
    
    # Calculate budget breakdown
    total_spend = sum(item.get('adSpend', 0) for item in daily_data)
    latest_data = daily_data[0] if daily_data else {}
    
    monthly_budget = latest_data.get('monthlyBudget', 0)
    daily_budget = latest_data.get('dailyBudget', 0)
    remaining_budget = monthly_budget - total_spend
    
    # Budget breakdown by category
    breakdown = latest_data.get('budgetBreakdown', [])
    
    return {
        'monthly': monthly_budget,
        'daily': daily_budget,
        'balance': remaining_budget,
        'spendOverTime': spend_over_time,
        'breakdown': breakdown
    }

def get_top_performing_ads(social_data, daily_data):
    """
    Get top performing ads from social media and daily data
    """
    top_ads = []
    
    # Get ads from social media data
    for social_item in social_data:
        if 'tiktok' in social_item and 'ads' in social_item['tiktok']:
            top_ads.extend(social_item['tiktok']['ads'])
        if 'meta' in social_item and 'ads' in social_item['meta']:
            top_ads.extend(social_item['meta']['ads'])
    
    # Get ads from daily reports
    for daily_item in daily_data:
        if 'topAds' in daily_item:
            top_ads.extend(daily_item['topAds'])
    
    # Sort by CTR and return top 10
    top_ads.sort(key=lambda x: x.get('ctr', 0), reverse=True)
    return top_ads[:10]

def calculate_conversion_rates(daily_data):
    """
    Calculate conversion rates from real data
    """
    if not daily_data:
        return []
    
    conversion_rates = []
    
    # Group by month and calculate conversion rates
    monthly_data = {}
    for item in daily_data:
        date = item.get('date', '')
        if date:
            month = date[:7]  # YYYY-MM format
            if month not in monthly_data:
                monthly_data[month] = {
                    'storeVisits': 0,
                    'installs': 0,
                    'onboarded': 0,
                    'applications': 0,
                    'disbursed': 0
                }
            
            monthly_data[month]['storeVisits'] += item.get('storeVisits', 0)
            monthly_data[month]['installs'] += item.get('installs', 0)
            monthly_data[month]['onboarded'] += item.get('onboarded', 0)
            monthly_data[month]['applications'] += item.get('applications', 0)
            monthly_data[month]['disbursed'] += item.get('disbursedFinances', 0)
    
    # Calculate conversion rates for each step
    for month, data in monthly_data.items():
        store_to_install = (data['installs'] / max(data['storeVisits'], 1)) * 100
        install_to_onboard = (data['onboarded'] / max(data['installs'], 1)) * 100
        onboard_to_application = (data['applications'] / max(data['onboarded'], 1)) * 100
        application_to_disbursed = (data['disbursed'] / max(data['applications'], 1)) * 100
        
        conversion_rates.append({
            'month': month,
            'storeToInstall': round(store_to_install, 2),
            'installToOnboard': round(install_to_onboard, 2),
            'onboardToApplication': round(onboard_to_application, 2),
            'applicationToDisbursed': round(application_to_disbursed, 2)
        })
    
    return conversion_rates

def calculate_funnel_timeline(daily_data):
    """
    Calculate funnel timeline data
    """
    if not daily_data:
        return []
    
    timeline = []
    for item in daily_data:
        timeline.append({
            'date': item.get('date', ''),
            'storeVisits': item.get('storeVisits', 0),
            'installs': item.get('installs', 0),
            'conversions': item.get('disbursedFinances', 0)
        })
    
    return timeline

def get_last_month_data(daily_data):
    """
    Get last month's data for comparison
    """
    if not daily_data:
        return {
            'achievementRatio': 0,
            'financeBehavior': 0,
            'gc': 0,
            'cac': 0
        }
    
    # Filter last month's data
    last_month = datetime.now() - timedelta(days=30)
    last_month_data = [
        item for item in daily_data 
        if datetime.strptime(item.get('date', ''), '%Y-%m-%d') >= last_month
    ]
    
    if not last_month_data:
        return {
            'achievementRatio': 0,
            'financeBehavior': 0,
            'gc': 0,
            'cac': 0
        }
    
    # Calculate last month metrics
    total_disbursed = sum(item.get('disbursedFinances', 0) for item in last_month_data)
    total_applications = sum(item.get('applications', 0) for item in last_month_data)
    total_spend = sum(item.get('adSpend', 0) for item in last_month_data)
    
    latest_data = last_month_data[0]
    goal = latest_data.get('campaignGoal', 1)
    achievement_ratio = (total_disbursed / goal * 100) if goal > 0 else 0
    cac = total_spend / max(total_applications, 1)
    
    return {
        'achievementRatio': achievement_ratio,
        'financeBehavior': total_disbursed,
        'gc': total_applications,
        'cac': round(cac, 2)
    }

def get_department_data(daily_data, department):
    """
    Get department-specific data
    """
    # This would be implemented based on your department structure
    # For now, return empty data
    return {}

def calculate_aggregated_metrics(kpi_records):
    """Calculate aggregated metrics from multiple KPI records"""
    if not kpi_records:
        return {}
    
    # Sum up all the metrics
    total_applications = sum(record.get('kpis', {}).get('totalApplications', 0) for record in kpi_records)
    total_disbursed = sum(record.get('kpis', {}).get('totalDisbursed', 0) for record in kpi_records)
    total_approved = sum(record.get('kpis', {}).get('totalApproved', 0) for record in kpi_records)
    total_onboarded = sum(record.get('kpis', {}).get('registeredOnboarded', 0) for record in kpi_records)
    total_linked = sum(record.get('kpis', {}).get('linkedAccounts', 0) for record in kpi_records)
    
    # Calculate ratios
    achievement_ratio = (total_disbursed / total_applications * 100) if total_applications > 0 else 0
    approval_ratio = (total_approved / total_applications * 100) if total_applications > 0 else 0
    cac = total_disbursed / total_onboarded if total_onboarded > 0 else 0
    cpa = total_disbursed / total_applications if total_applications > 0 else 0
    
    return {
        'totalApplications': total_applications,
        'totalDisbursed': total_disbursed,
        'totalApproved': total_approved,
        'registeredOnboarded': total_onboarded,
        'linkedAccounts': total_linked,
        'achievementRatio': achievement_ratio,
        'approvalRatio': approval_ratio,
        'cac': cac,
        'cpa': cpa
    }

def calculate_growth_from_records(kpi_records):
    """Calculate growth rate from KPI records"""
    if len(kpi_records) < 2:
        return 0
    
    # Sort by date to get chronological order
    sorted_records = sorted(kpi_records, key=lambda x: x.get('date', ''))
    
    if len(sorted_records) >= 2:
        current = sorted_records[-1].get('kpis', {}).get('totalDisbursed', 0)
        previous = sorted_records[-2].get('kpis', {}).get('totalDisbursed', 0)
        
        if previous > 0:
            return ((current - previous) / previous) * 100
    
    return 0

def build_chart_data_from_records(kpi_records):
    """Build chart data from KPI records"""
    chart_data = []
    
    for record in sorted(kpi_records, key=lambda x: x.get('date', '')):
        kpis = record.get('kpis', {})
        chart_data.append({
            'date': record.get('date'),
            'cac': kpis.get('totalDisbursed', 0) / kpis.get('registeredOnboarded', 1),
            'cpa': kpis.get('totalDisbursed', 0) / kpis.get('totalApplications', 1),
            'spendAmount': kpis.get('totalDisbursed', 0),
            'achievementRatio': kpis.get('achievementRatio', 0),
            'totalApplications': kpis.get('totalApplications', 0),
            'totalDisbursed': kpis.get('totalDisbursed', 0),
            'totalApproved': kpis.get('totalApproved', 0)
        })
    
    return chart_data

def get_recent_uploads(user_id, from_date=None, to_date=None):
    """Get recent uploads within date range"""
    query = {'userId': user_id}
    
    if from_date and to_date:
        query['importedAt'] = {
            '$gte': from_date,
            '$lte': to_date
        }
    
    uploads = list(daily_reports.find(query).sort('importedAt', -1).limit(10))
    
    return [{
        'date': upload.get('reportDate'),
        'importedAt': upload.get('importedAt', '').strftime('%Y-%m-%d %H:%M:%S') if upload.get('importedAt') else '',
        'recordCount': 1
    } for upload in uploads]
