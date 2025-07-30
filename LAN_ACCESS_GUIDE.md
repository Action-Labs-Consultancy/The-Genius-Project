# LAN Access Configuration Guide

This guide explains how to access The Genius Project from other devices on your local network.

## Quick Start

### Option 1: Auto-start script (Recommended)
```bash
./start-lan-access.sh
```
This script will:
- Auto-detect your machine's IP address
- Start both backend and frontend servers
- Configure everything for LAN access

### Option 2: Manual startup

#### 1. Start Backend
```bash
cd backend
python app.py
```

#### 2. Start Frontend with environment variable
```bash
# Replace 192.168.100.63 with your machine's IP
REACT_APP_API_BASE_URL=http://192.168.100.63:10000 npm start
```

Or use the script:
```bash
./start-frontend.sh http://192.168.100.63:10000
```

## Finding Your Machine's IP Address

### macOS/Linux:
```bash
# WiFi (most common)
ipconfig getifaddr en0

# Ethernet
ipconfig getifaddr en1

# Alternative
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Windows:
```cmd
ipconfig | findstr "IPv4"
```

## Environment Variables

### Frontend (.env file)
```bash
# API Configuration for LAN access
REACT_APP_API_BASE_URL=http://YOUR_MACHINE_IP:10000

# Example:
REACT_APP_API_BASE_URL=http://192.168.100.63:10000
```

### Runtime Environment Variable
```bash
# Start frontend with custom API URL
REACT_APP_API_BASE_URL=http://192.168.100.63:10000 npm start

# Or export it first
export REACT_APP_API_BASE_URL=http://192.168.100.63:10000
npm start
```

## Accessing from Other Devices

Once both servers are running, access the app from any device on your network:

- **Frontend**: `http://YOUR_MACHINE_IP:3000`
- **Backend API**: `http://YOUR_MACHINE_IP:10000`

Example:
- Frontend: `http://192.168.100.63:3000`
- Backend API: `http://192.168.100.63:10000`

## Troubleshooting

### 1. CORS Errors (Access blocked by CORS policy)
If you see errors like:
```
Access to fetch at 'http://192.168.100.63:10000/login' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check
```

**Solution**: The backend CORS configuration has been updated to allow all origins. Run the CORS test:
```bash
./test-cors.sh
```

All endpoints should return `Access-Control-Allow-Origin: *` headers.

### 2. Can't access from other devices
- Check if your firewall is blocking ports 3000 and 10000
- Verify your machine's IP address is correct
- Make sure both devices are on the same WiFi network

### 3. API calls failing
- Verify the `REACT_APP_API_BASE_URL` is set correctly
- Check browser console for CORS errors
- Test API endpoint directly: `http://YOUR_MACHINE_IP:10000/api/equipment`

### 4. Different IP address
If your machine IP changes:
1. Update the `.env` file in the frontend folder
2. Or use the environment variable when starting
3. Or run `./start-lan-access.sh` (auto-detects IP)

## Network Configuration

### Current CORS Setup
The backend allows requests from:
- `localhost:3000` (local development)
- `192.168.100.63:3000` (LAN access)
- Any origin (`*`) for API endpoints

### Firewall Settings
Make sure these ports are open:
- **3000**: React frontend
- **10000**: Express backend

## Production Considerations

For production deployment:
1. Set specific CORS origins (not `*`)
2. Use environment-specific configuration
3. Consider using reverse proxy (nginx)
4. Enable HTTPS
