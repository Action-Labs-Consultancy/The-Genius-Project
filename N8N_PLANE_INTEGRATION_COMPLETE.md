# n8n & Plane Integration Guide

## Setup Complete ✅

Both n8n automation and Plane project management have been successfully integrated into The Genius Project dashboard.

### Dashboard Integration

Two new sidebar buttons have been added:

1. **⚡ n8n Automation** - Opens n8n automation platform
2. **📋 Plane Projects** - Opens Plane project management

### Access Information

#### n8n Automation Platform
- **URL**: http://localhost:5678
- **Username**: admin
- **Password**: securepassword
- **Features**: Workflow automation, task scheduling, integrations

#### Plane Project Management
- **URL**: https://app.plane.so
- **Features**: Project management, issue tracking, team collaboration

### How to Use

1. **Start the frontend**: Run `npm start` in the frontend directory
2. **Start n8n**: Run `./start-n8n.ps1` (Windows) or `./start-n8n.sh` (Linux/Mac)
3. **Access via sidebar**: Click the buttons in the dashboard sidebar
4. **Direct links**: Both services open in new tabs for seamless workflow

### Startup Scripts

- `start-n8n.ps1` - PowerShell script for Windows
- `start-n8n.sh` - Bash script for Linux/Mac

Both scripts automatically:
- Set up authentication
- Start n8n with proper configuration
- Display access information

### Technical Details

#### Dashboard.js Changes
- Added n8n and Plane modules to `getModules()` function
- Added click handlers that use `window.open()` for external redirects
- Maintained existing navigation structure for internal pages

#### Authentication
- n8n uses basic authentication (admin/securepassword)
- Plane uses your existing Plane account

### Troubleshooting

If n8n isn't accessible:
1. Run `netstat -an | findstr :5678` to check if it's running
2. Run the startup script: `./start-n8n.ps1`
3. Wait 10-15 seconds for n8n to fully initialize

If the frontend buttons don't work:
1. Check that both modules are in the sidebar
2. Verify the `handleModuleClick` function includes the new cases
3. Ensure your browser allows pop-ups from localhost

### Integration Benefits

- **Seamless Access**: One-click access to automation and project management
- **Unified Workflow**: All tools accessible from main dashboard  
- **External Services**: No need to embed, reduces complexity
- **Performance**: Fast redirects, no iframe overhead

✅ **Status**: Ready to use! Both n8n and Plane are fully integrated and functional.
