# 404 Error Diagnosis Guide

## Understanding the 404 Error

A `404` error means the server is running, but the requested endpoint doesn't exist or isn't accessible.

## Common Causes

### 1. Wrong URL/Endpoint
- Check if you're accessing the correct URL
- Verify the endpoint path is correct
- Check if authentication is required

### 2. Server Not Running
- Railway service might be down
- Check Railway logs for errors

### 3. Route Not Defined
- The endpoint might not exist in `server.js`
- Check if the route is properly registered

### 4. CORS Issues
- Frontend might be blocked by CORS
- Check browser console for CORS errors

## Available Endpoints

### Public Endpoints (No Auth Required)
- `GET /` - API information
- `GET /api/health` - Health check
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/tvs/register` - TV registration
- `POST /api/tvs/heartbeat` - TV heartbeat
- `GET /api/tvs/public/:deviceId` - Public TV status
- `GET /api/screens/public/:screenCode` - Public screen data

### Protected Endpoints (Auth Required)
- `GET /api/media` - Get media files
- `POST /api/media` - Upload media
- `GET /api/screens` - Get screens
- `POST /api/screens` - Create screen
- `GET /api/tvs` - Get TVs
- `GET /api/admin/*` - Admin endpoints

## How to Diagnose

### Step 1: Check Root Endpoint
```bash
curl https://api.menupi.com/
```
**Expected**: JSON with API information

### Step 2: Check Health Endpoint
```bash
curl https://api.menupi.com/api/health
```
**Expected**: JSON with health status

### Step 3: Check Railway Logs
1. Railway Dashboard → Your Service
2. **Logs** tab
3. Look for:
   - Server startup messages
   - Route registration
   - Error messages

### Step 4: Check Browser Console
- Open browser DevTools (F12)
- Check **Console** tab for errors
- Check **Network** tab for failed requests

## Quick Fixes

### If Root Endpoint Returns 404
- Server might not be running
- Check Railway service status
- Verify deployment completed

### If API Endpoints Return 404
- Check if route is defined in `server.js`
- Verify route path matches request
- Check if authentication is required

### If Frontend Can't Access API
- Check CORS configuration
- Verify API URL in frontend code
- Check if API is accessible from browser

## Testing Endpoints

### Test Root Endpoint
```bash
curl https://api.menupi.com/
```

### Test Health Endpoint
```bash
curl https://api.menupi.com/api/health
```

### Test with Authentication
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.menupi.com/api/media
```

---

**Next Steps**: 
1. Check which endpoint is returning 404
2. Verify the endpoint exists in `server.js`
3. Check Railway logs for errors
4. Test endpoints with curl

