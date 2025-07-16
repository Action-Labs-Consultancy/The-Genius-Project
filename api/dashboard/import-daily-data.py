from datetime import datetime, timedelta
import json
import os
from pymongo import MongoClient
from bson import ObjectId

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['the_genius_project']
daily_reports = db['daily_reports']
kpi_history = db['kpi_history']

def handler(event, context=None):
    """
    Handle daily data import endpoint for Vercel
    Appends new data to existing records, with newer entries overwriting duplicates for the same date
    """
    
    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        # Parse request body from Vercel event
        body_str = event.get('body', '{}')
        body = json.loads(body_str)
        
        import_data = body.get('data', [])
        user_id = body.get('userId', 'default')
        
        if not import_data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'No data provided'})
            }
        
        imported_count = 0
        updated_count = 0
        
        # Process each row in the import data
        for row in import_data:
            report_date = row.get('reportDate')
            if not report_date:
                continue
                
            # Check if a record with the same date already exists
            existing_record = daily_reports.find_one({
                'reportDate': report_date,
                'userId': user_id
            })
            
            # Prepare the document
            document = {
                'reportDate': report_date,
                'userId': user_id,
                'importedAt': datetime.now(),
                'data': {
                    'registeredOnboarded': row.get('registeredOnboarded', 0),
                    'uniqueNationalityNonBahraini': row.get('uniqueNationalityNonBahraini', 0),
                    'linkedAccounts': row.get('linkedAccounts', 0),
                    'totalAdvanceApplications': row.get('totalAdvanceApplications', 0),
                    'totalAdvanceApplicants': row.get('totalAdvanceApplicants', 0),
                    'totalAdvanceDisbursed': row.get('totalAdvanceDisbursed', 0),
                    'totalAdvanceApproved': row.get('totalAdvanceApproved', 0),
                    'totalAdvanceExpired': row.get('totalAdvanceExpired', 0),
                    'advanceCaseLocked': row.get('advanceCaseLocked', 0),
                    'totalAdvanceNotEligible': row.get('totalAdvanceNotEligible', 0),
                    'totalAdvanceRejection': row.get('totalAdvanceRejection', 0),
                    'totalAdvanceCancelByCustomer': row.get('totalAdvanceCancelByCustomer', 0),
                    'viewedOfferAS': row.get('viewedOfferAS', 0),
                    'rejectionReasonAS': row.get('rejectionReasonAS', ''),
                    'totalMicroFinancingApplications': row.get('totalMicroFinancingApplications', 0),
                    'totalMicroFinancingApplicants': row.get('totalMicroFinancingApplicants', 0),
                    'totalMicroDisbursed': row.get('totalMicroDisbursed', 0),
                    'totalMicroFinancingApproved': row.get('totalMicroFinancingApproved', 0),
                    'totalMicroExpired': row.get('totalMicroExpired', 0),
                    'microCaseLocked': row.get('microCaseLocked', 0),
                    'totalMicroNotEligible': row.get('totalMicroNotEligible', 0),
                    'totalMicroRejection': row.get('totalMicroRejection', 0),
                    'totalMicroCancelByCustomer': row.get('totalMicroCancelByCustomer', 0),
                    'rejectionReasonIF': row.get('rejectionReasonIF', ''),
                    'totalCreditCardApplication': row.get('totalCreditCardApplication', 0),
                    'totalCreditCardApplicants': row.get('totalCreditCardApplicants', 0),
                    'totalCreditCardDisbursed': row.get('totalCreditCardDisbursed', 0),
                    'totalCreditCardApproved': row.get('totalCreditCardApproved', 0),
                    'totalCreditCardExpired': row.get('totalCreditCardExpired', 0),
                    'creditCardCaseLocked': row.get('creditCardCaseLocked', 0),
                    'totalCreditCardNotEligible': row.get('totalCreditCardNotEligible', 0),
                    'totalCreditCardRejection': row.get('totalCreditCardRejection', 0),
                    'totalCreditCardCancelByCustomer': row.get('totalCreditCardCancelByCustomer', 0),
                    'rejectionReasonCC': row.get('rejectionReasonCC', ''),
                    'totalPersonalFinanceApplication': row.get('totalPersonalFinanceApplication', 0),
                    'totalPersonalFinanceApplicants': row.get('totalPersonalFinanceApplicants', 0),
                    'totalPersonalFinanceDisbursed': row.get('totalPersonalFinanceDisbursed', 0),
                    'totalPersonalFinanceApproved': row.get('totalPersonalFinanceApproved', 0),
                    'totalPersonalFinanceExpired': row.get('totalPersonalFinanceExpired', 0),
                    'PersonalFinanceCaseLocked': row.get('PersonalFinanceCaseLocked', 0),
                    'totalPersonalFinanceNotEligible': row.get('totalPersonalFinanceNotEligible', 0),
                    'totalPersonalFinanceRejection': row.get('totalPersonalFinanceRejection', 0),
                    'totalPersonalFinanceCancelByCustomer': row.get('totalPersonalFinanceCancelByCustomer', 0),
                    'rejectionReasonPf': row.get('rejectionReasonPf', '')
                }
            }
            
            if existing_record:
                # Update existing record (newer data overwrites)
                daily_reports.update_one(
                    {'_id': existing_record['_id']},
                    {'$set': document}
                )
                updated_count += 1
            else:
                # Insert new record
                daily_reports.insert_one(document)
                imported_count += 1
        
        # Calculate and update KPIs
        calculate_kpis(user_id)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'Data imported successfully',
                'imported': imported_count,
                'updated': updated_count,
                'total': imported_count + updated_count
            })
        }
        
    except Exception as e:
        print(f"Error importing data: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': str(e),
                'message': 'Error importing data'
            })
        }

def calculate_kpis(user_id):
    """
    Calculate KPIs from the imported data
    """
    try:
        # Get all records for the user
        records = list(daily_reports.find({'userId': user_id}).sort('reportDate', -1))
        
        if not records:
            return
        
        # Get the most recent record
        latest_record = records[0]
        latest_data = latest_record.get('data', {})
        
        # Calculate KPIs
        total_applications = (
            latest_data.get('totalAdvanceApplications', 0) +
            latest_data.get('totalMicroFinancingApplications', 0) +
            latest_data.get('totalCreditCardApplication', 0) +
            latest_data.get('totalPersonalFinanceApplication', 0)
        )
        
        total_disbursed = (
            latest_data.get('totalAdvanceDisbursed', 0) +
            latest_data.get('totalMicroDisbursed', 0) +
            latest_data.get('totalCreditCardDisbursed', 0) +
            latest_data.get('totalPersonalFinanceDisbursed', 0)
        )
        
        total_approved = (
            latest_data.get('totalAdvanceApproved', 0) +
            latest_data.get('totalMicroFinancingApproved', 0) +
            latest_data.get('totalCreditCardApproved', 0) +
            latest_data.get('totalPersonalFinanceApproved', 0)
        )
        
        # Calculate ratios
        achievement_ratio = (total_disbursed / total_applications * 100) if total_applications > 0 else 0
        approval_ratio = (total_approved / total_applications * 100) if total_applications > 0 else 0
        
        # Store KPIs in history
        kpi_record = {
            'userId': user_id,
            'date': latest_record.get('reportDate'),
            'calculatedAt': datetime.now(),
            'kpis': {
                'totalApplications': total_applications,
                'totalDisbursed': total_disbursed,
                'totalApproved': total_approved,
                'achievementRatio': achievement_ratio,
                'approvalRatio': approval_ratio,
                'registeredOnboarded': latest_data.get('registeredOnboarded', 0),
                'linkedAccounts': latest_data.get('linkedAccounts', 0),
                'uniqueNationalityNonBahraini': latest_data.get('uniqueNationalityNonBahraini', 0)
            },
            'breakdown': {
                'advance': {
                    'applications': latest_data.get('totalAdvanceApplications', 0),
                    'disbursed': latest_data.get('totalAdvanceDisbursed', 0),
                    'approved': latest_data.get('totalAdvanceApproved', 0)
                },
                'microFinancing': {
                    'applications': latest_data.get('totalMicroFinancingApplications', 0),
                    'disbursed': latest_data.get('totalMicroDisbursed', 0),
                    'approved': latest_data.get('totalMicroFinancingApproved', 0)
                },
                'creditCard': {
                    'applications': latest_data.get('totalCreditCardApplication', 0),
                    'disbursed': latest_data.get('totalCreditCardDisbursed', 0),
                    'approved': latest_data.get('totalCreditCardApproved', 0)
                },
                'personalFinance': {
                    'applications': latest_data.get('totalPersonalFinanceApplication', 0),
                    'disbursed': latest_data.get('totalPersonalFinanceDisbursed', 0),
                    'approved': latest_data.get('totalPersonalFinanceApproved', 0)
                }
            }
        }
        
        # Update or insert KPI record
        kpi_history.update_one(
            {'userId': user_id, 'date': latest_record.get('reportDate')},
            {'$set': kpi_record},
            upsert=True
        )
        
    except Exception as e:
        print(f"Error calculating KPIs: {e}")

if __name__ == '__main__':
    # For testing
    pass
