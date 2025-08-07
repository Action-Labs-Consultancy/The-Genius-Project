# Social Media Integration Setup Guide

## Overview
This guide will help you configure OAuth2 social media integration for automated content publishing in The Genius Project.

## Features
- ✅ OAuth2 authentication for Facebook, Instagram, LinkedIn
- ✅ Automated content publishing when approved and scheduled
- ✅ Background job processing every minute
- ✅ Token refresh and error handling
- ✅ Publishing queue management
- ✅ Real-time status updates in UI

## Step 1: Environment Configuration

1. Copy the social media environment template:
   ```bash
   cp .env.social .env
   ```

2. Or add these variables to your existing `.env` file:
   ```
   FACEBOOK_CLIENT_ID=your_facebook_app_id
   FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
   FACEBOOK_REDIRECT_URI=http://localhost:5000/api/social/callback/facebook
   
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   LINKEDIN_REDIRECT_URI=http://localhost:5000/api/social/callback/linkedin
   
   OAUTH_STATE_SECRET=your_secure_random_string
   TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key
   ```

## Step 2: Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Add "Facebook Login" product
4. Configure OAuth settings:
   - Valid OAuth Redirect URIs: `http://localhost:5000/api/social/callback/facebook`
   - Scopes needed: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
5. Copy App ID and App Secret to your `.env` file

### Facebook Page Access
- Your app needs to be approved for `pages_manage_posts` permission for production
- For development, you can test with your own pages

### Instagram Business Account
- Connect your Instagram Business account to your Facebook Page
- Ensure your Facebook Page is connected to an Instagram Business account

## Step 3: LinkedIn App Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add "Sign In with LinkedIn" product
4. Configure OAuth settings:
   - Authorized redirect URLs: `http://localhost:5000/api/social/callback/linkedin`
   - Scopes needed: `r_liteprofile`, `w_member_social`
5. Copy Client ID and Client Secret to your `.env` file

### LinkedIn Company Page Access
- For posting to company pages, you need `w_organization_social` scope
- Company page posting requires additional verification from LinkedIn

## Step 4: Security Configuration

1. Generate a secure state secret:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

2. Generate a 32-character encryption key:
   ```python
   import secrets
   print(secrets.token_urlsafe(24))  # Will be 32 chars when base64 encoded
   ```

## Step 5: Start the Application

1. Ensure your backend server is running with the new routes:
   ```bash
   cd backend
   python app.py
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm start
   ```

## Step 6: Connect Social Media Accounts

1. Open your content calendar
2. Click the "🔗 Social Media Accounts" button in the header
3. Click "Connect" for each platform you want to integrate
4. Complete the OAuth flow in the popup window
5. Verify the account appears as "Connected" with a green status

## Step 7: Test Automated Publishing

1. Create new content in your calendar
2. Set the status to "Approved"
3. Set a scheduled date/time (can be immediate for testing)
4. The background scheduler will automatically publish when the time arrives
5. Check the publishing status in the content detail view

## API Endpoints

### Authentication
- `GET /api/social/auth/<platform>` - Start OAuth flow
- `GET /api/social/callback/<platform>` - OAuth callback handler

### Account Management
- `GET /api/social/accounts` - List connected accounts
- `DELETE /api/social/accounts/<account_id>` - Disconnect account

### Publishing
- `POST /api/social/schedule` - Schedule content for publishing
- `GET /api/social/queue` - View publishing queue
- `POST /api/social/publish/<queue_id>` - Manually trigger publish

## Troubleshooting

### OAuth Issues
- Ensure redirect URIs match exactly in platform settings
- Check that your app has the required scopes/permissions
- Verify environment variables are loaded correctly

### Publishing Issues
- Check that accounts are still connected and tokens are valid
- Review the publishing queue for error messages
- Ensure content meets platform requirements (text length, image formats)

### Token Refresh
- Tokens are automatically refreshed when they expire
- If refresh fails, the account will need to be reconnected

## Security Notes

- All OAuth tokens are encrypted before storage
- State parameters prevent CSRF attacks
- Tokens are automatically refreshed to maintain access
- Failed authentication attempts are logged

## Platform-Specific Notes

### Facebook/Instagram
- Posts to Facebook Pages, not personal profiles
- Instagram posts require connected Business account
- Images must be publicly accessible URLs
- Character limits: Facebook (63,206), Instagram (2,200)

### LinkedIn
- Posts to personal profile or company pages
- Supports text, images, and links
- Character limit: 3,000 for posts
- Company page posting requires additional permissions

## Production Deployment

1. Update redirect URIs in platform settings to your production domain
2. Update environment variables with production URLs
3. Ensure your server has HTTPS enabled
4. Consider using a proper secret management system
5. Monitor token refresh rates and API usage limits

## Support

For issues or questions:
1. Check the application logs for error messages
2. Verify your OAuth app configurations
3. Test with a simple manual publish first
4. Review platform-specific API documentation
