# LAN Access Troubleshooting Guide

## Quick Setup

1. **Start the application for LAN access:**
   ```bash
   ./start-lan-access.sh
   ```

2. **Test connectivity:**
   ```bash
   ./test-lan-connectivity.sh
   ```

## Current Configuration

- **Machine IP:** 192.168.100.63
- **Backend:** http://192.168.100.63:10000
- **Frontend:** http://192.168.100.63:3000
- **API Endpoints:** All configured to use dynamic IP detection

## Common Issues & Solutions

### 1. Connection Refused from Other Devices

**Symptoms:** Other devices can't reach http://192.168.100.63:3000 or :10000

**Solutions:**

a) **Check macOS Firewall:**
   ```bash
   # Check firewall status
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
   
   # If enabled, add Node.js and Python to allowed apps
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
   ```

b) **Allow specific ports:**
   ```bash
   # Add firewall rules for the ports
   echo "rdr pass inet proto tcp from any to any port 3000 -> 127.0.0.1 port 3000" | sudo pfctl -ef -
   echo "rdr pass inet proto tcp from any to any port 10000 -> 127.0.0.1 port 10000" | sudo pfctl -ef -
   ```

c) **Check port binding:**
   ```bash
   # Verify services are listening on all interfaces (0.0.0.0)
   netstat -an | grep LISTEN | grep -E "(3000|10000)"
   lsof -i :3000
   lsof -i :10000
   ```

### 2. Frontend Can't Reach Backend

**Symptoms:** Frontend loads but shows API connection errors

**Solutions:**

a) **Check environment variables:**
   ```bash
   echo $REACT_APP_API_BASE_URL
   ```

b) **Restart with correct API URL:**
   ```bash
   export REACT_APP_API_BASE_URL="http://192.168.100.63:10000"
   cd frontend && npm start
   ```

### 3. IP Address Changes

**Symptoms:** Connection works locally but not from other devices after network change

**Solutions:**

a) **Update IP in start script:** The start-lan-access.sh script now auto-detects IP
b) **Manual override:** Set REACT_APP_API_BASE_URL environment variable

### 4. CORS Issues

**Symptoms:** Browser console shows CORS errors

**Solutions:**
- Backend is configured with `origins="*"` for development
- Restart backend if CORS errors persist

## Testing from Another Device

1. **From another device on the same network:**
   ```bash
   # Test backend
   curl http://192.168.100.63:10000/health
   
   # Test marketing lab
   curl http://192.168.100.63:10000/api/marketing-lab/health
   ```

2. **Open in browser on other device:**
   - Frontend: http://192.168.100.63:3000
   - Check browser console for any errors

## Network Debugging

```bash
# Check network interfaces
ifconfig

# Check route to machine
ping 192.168.100.63

# Check if ports are accessible from outside
# (Run from another machine)
telnet 192.168.100.63 3000
telnet 192.168.100.63 10000
```

## Advanced Configuration

### Custom IP Override
```bash
# Set a different IP if auto-detection fails
export MACHINE_IP="192.168.1.100"
export REACT_APP_API_BASE_URL="http://$MACHINE_IP:10000"
./start-lan-access.sh
```

### Production-like Setup
```bash
# Use specific environment file
echo "REACT_APP_API_BASE_URL=http://192.168.100.63:10000" > .env.local
npm start
```

## Status Verification

The test-lan-connectivity.sh script will show:
- ✅ Services are reachable
- ❌ Services are not reachable
- Network interface information
- Exact URLs to use

## Logs

- **Backend logs:** Check terminal running start-lan-access.sh
- **Frontend logs:** Check browser console (F12)
- **Network logs:** Browser Network tab for API call details
