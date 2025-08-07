# Social Media Integration Testing Guide

## 🧪 Testing Checklist

### ✅ Frontend Testing (http://localhost:3001)

#### 1. Social Media Button Test
- [ ] Navigate to Content Calendar
- [ ] Look for "🔗 Social Media Accounts" button in the header
- [ ] Button should be yellow with no connected accounts initially
- [ ] Click the button to open the Social Media Connector modal

#### 2. Social Media Connector Modal Test
- [ ] Modal should open with title "🔗 Social Media Account Management"
- [ ] Should show explanation text about connecting accounts
- [ ] Should display three platform options: Facebook, Instagram, LinkedIn
- [ ] Each platform should have a "Connect" button
- [ ] Should have a "Done" button at the bottom

#### 3. Content Detail View Test
- [ ] Create or click on existing content in the calendar
- [ ] View content details modal
- [ ] Look for "Social Media Integration Section"
- [ ] Should see Publishing Status component
- [ ] Should see Publishing Scheduler (for approved content)
- [ ] Should see Social Media Connector component

### ⚙️ Backend Testing (Requires OAuth Setup)

#### 1. API Endpoints Test
```bash
# Test social media accounts endpoint
curl http://localhost:5000/api/social/accounts

# Test OAuth flow (requires setup)
curl http://localhost:5000/api/social/auth/facebook

# Test publishing queue
curl http://localhost:5000/api/social/queue
```

#### 2. Database Integration Test
- [ ] Check MongoDB for social_media_accounts collection
- [ ] Check MongoDB for publishing_queue collection
- [ ] Verify encrypted token storage

### 🔧 Environment Setup Test

#### 1. Environment Variables Check
```bash
# Check if these variables are set in .env
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
OAUTH_STATE_SECRET=your_secret
TOKEN_ENCRYPTION_KEY=your_key
```

#### 2. OAuth App Configuration Test
- [ ] Facebook app configured with correct redirect URI
- [ ] LinkedIn app configured with correct redirect URI
- [ ] Apps have required permissions

### 🚀 End-to-End Testing (Full OAuth Setup Required)

#### 1. Account Connection Flow
1. Click "🔗 Social Media Accounts" button
2. Click "Connect" for Facebook
3. OAuth popup should open
4. Complete Facebook authorization
5. Popup should close
6. Account should appear as "Connected" with green status
7. Button counter should update to show "1 connected"

#### 2. Content Publishing Flow
1. Create new content in calendar
2. Set status to "Approved"
3. Set scheduled date/time
4. Content should enter publishing queue
5. Background scheduler should process queue
6. Content should be published to connected platforms
7. Status should update to "Published"

#### 3. Error Handling Test
1. Disconnect internet temporarily
2. Try to publish content
3. Should see error message and retry option
4. Reconnect internet
5. Retry should work successfully

### 🐛 Troubleshooting Common Issues

#### Issue: Social Media Button Does Nothing
**Solution**: Check browser console for React errors. The modal component should now be properly implemented.

#### Issue: OAuth Popup Blocked
**Solution**: Ensure popup blockers are disabled for the testing domain.

#### Issue: "Failed to Connect Account"
**Solution**: Verify OAuth app configuration and environment variables.

#### Issue: Content Not Publishing
**Solution**: Check that:
- Content status is "Approved"
- Scheduled time has passed
- Social media accounts are connected
- Backend scheduler is running

#### Issue: Token Expired Errors
**Solution**: The system should automatically refresh tokens. If this fails, reconnect the account.

### 📊 Success Criteria

✅ **Basic Functionality**
- Social media button opens modal
- Modal displays correctly with all components
- Account connection status updates
- No JavaScript console errors

✅ **OAuth Integration** (Requires Setup)
- OAuth flows complete successfully
- Tokens are stored encrypted
- Account status shows as "Connected"
- Token refresh works automatically

✅ **Publishing System** (Requires Setup)
- Content enters queue when approved
- Background scheduler processes queue
- Content publishes to platforms
- Status updates in real-time

✅ **Error Handling**
- Network errors handled gracefully
- OAuth errors show helpful messages
- Failed publishes can be retried
- Token refresh failures trigger reconnection

### 🎯 Current Test Status

**Frontend Components**: ✅ IMPLEMENTED
- Social Media Connector Modal: ✅
- Publishing Status Component: ✅
- Publishing Scheduler Component: ✅
- Content Calendar Integration: ✅

**Backend Services**: ✅ IMPLEMENTED
- OAuth Service: ✅
- Publishing Service: ✅
- Background Scheduler: ✅
- API Routes: ✅

**Configuration**: ✅ IMPLEMENTED
- Environment Templates: ✅
- Setup Documentation: ✅
- Error Handling: ✅

### 📝 Next Steps for Full Testing

1. **Set up OAuth credentials** using the provided environment template
2. **Configure Facebook and LinkedIn developer apps** 
3. **Test account connection flow** with real OAuth
4. **Test automated publishing** with scheduled content
5. **Verify error handling** and token refresh

The integration is **fully implemented** and ready for testing with proper OAuth configuration! 🚀
