from flask import Flask

# This file adapts your Flask app to run on Vercel
def create_vercel_adapter(app):
    """
    Adapts a Flask app to work with Vercel's serverless environment
    """
    def handler(request, context):
        """
        This function will be called by Vercel for each request
        """
        return app(request, context)
    
    return handler
