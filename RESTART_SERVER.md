# Server Restart Required

## Issue
The admin endpoints are returning 404 errors because the server was started before the admin routes were added.

## Solution
Restart the API server to load the new admin endpoints:

### Option 1: Restart via npm script
```bash
# Stop the current server (Ctrl+C if running in terminal)
# Then restart:
npm run server:api
```

### Option 2: Restart all services
```bash
# Stop all services (Ctrl+C)
# Then restart:
npm run start:all
```

### Option 3: Manual restart
```bash
# Find and kill the server process
pkill -f "node server.js"

# Then start it again
npm run server:api
```

## Admin Endpoints Added
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/plan-requests` - Plan requests
- `POST /api/admin/plan-requests/:id/approve` - Approve plan request
- `POST /api/admin/plan-requests/:id/deny` - Deny plan request

## Fixed Issues
1. ✅ Infinite loop in PhysicalTVs.tsx - Fixed by using useCallback and separating effects
2. ✅ Admin endpoints 404 - Will be fixed after server restart

