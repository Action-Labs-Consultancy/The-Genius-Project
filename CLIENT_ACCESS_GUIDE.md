# 🔐 Client Access Management Guide

## How to Assign Clients to Client Users

### Step 1: Go to Client Detail Page
1. Login as an **employee** (not a client user)
2. Go to the **Clients** page
3. Click on any client to open their detail page

### Step 2: Use Client Access Manager
On the client detail page, you'll see a new section called **"🔐 Client Access Management"**

This section will show:
- **Current users** who have access to this client
- **Permissions** for each user (View, Comment, Approve)
- **Add User Access** button to assign new users

### Step 3: Add User Access
1. Click **"+ Add User Access"** button
2. Select a client user from the dropdown
3. Click **"Add Access"**

The user will automatically get:
- ✅ **View**: Can see this client's content
- ✅ **Comment**: Can add feedback to content
- ✅ **Approve**: Can approve/disapprove content

### Step 4: Manage Permissions
For each user, you can:
- **Toggle permissions** (View, Comment, Approve)
- **Remove access** completely

## Available Client Test Accounts

| Email | Password | Linked Client | Status |
|-------|----------|---------------|--------|
| `client1@one.com` | `clientpassword123` | one | ✅ Active |
| `client2@rabab.com` | `clientpassword123` | Rabab | ✅ Active |
| `client3@debugclient.com` | `clientpassword123` | Debug Client | ✅ Active |

## How Client Users Experience the System

### When a Client User Logs In:
1. **Clients Page**: Only shows clients they have access to
2. **No Admin Features**: Cannot add/edit/delete clients
3. **Content Calendar**: Only their assigned client's content
4. **View-Only Content**: Cannot create/edit/delete content
5. **Feedback Interface**: Can comment and approve/disapprove

### Content Calendar Features for Clients:
- ✅ View all content for their client
- ✅ Click on content to see details
- ✅ Add comments/feedback
- ✅ Approve or Disapprove content
- ❌ Cannot create new content
- ❌ Cannot edit existing content
- ❌ Cannot delete content

## Testing the System

### Test as Employee:
1. Login with your normal employee account
2. Go to any client detail page
3. Use the Client Access Manager to assign users
4. Create content calendar entries

### Test as Client:
1. Login with `client1@one.com` / `clientpassword123`
2. Verify you only see the "one" client
3. Open content calendar
4. Try clicking on content - should see feedback form
5. Test approve/disapprove buttons

## API Endpoints Created

- `GET /api/clients/{id}/access` - Get access list
- `POST /api/clients/{id}/access` - Add user access
- `PUT /api/clients/{id}/access/{access_id}` - Update permissions
- `DELETE /api/clients/{id}/access/{access_id}` - Remove access
- `GET /api/users?role=client` - Get all client users

## Troubleshooting

### If Client Access Manager doesn't appear:
- Make sure you're logged in as an **employee** (not client)
- Check that you're on a client detail page
- Refresh the page

### If no users appear in dropdown:
- Make sure you have client users created
- Users should have `role='client'` in the database

### If client user can't see content:
- Check they have access permission in Client Access Manager
- Verify the client has content calendar entries
- Check the user is linked to the correct client

## Next Steps

1. **Create more client users** as needed
2. **Assign appropriate permissions** to each client user
3. **Create content calendar entries** for clients to review
4. **Train client users** on the feedback interface

The system is now fully functional for multi-client access control! 🎉
