import json

def handler(request):
    """Simple Vercel serverless function handler"""
    
    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Return success response
    response_body = {
        "message": "Backend is working!",
        "status": "success",
        "endpoint": "/api/hello",
        "method": request.method,
        "path": request.path
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_body)
    }
