# MENUPI API Endpoints Reference

## 🌐 Root Endpoints

### `GET /`
**Purpose**: API information and service status

**Response**:
```json
{
  "service": "MENUPI API",
  "version": "1.0.0",
  "status": "online",
  "endpoints": {
    "auth": "/api/login, /api/register, /api/auth/google",
    "media": "/api/media",
    "screens": "/api/screens",
    "schedules": "/api/schedules",
    "tvs": "/api/tvs",
    "admin": "/api/admin/*",
    "health": "/api/health"
  },
  "documentation": "https://github.com/fakharu6036/display-menupi"
}
```

**Usage**: Visit `https://api.menupi.com/` to see API information

---

### `GET /api/health`
**Purpose**: Health check endpoint for monitoring

**Response** (Healthy):
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-25T15:00:00.000Z",
  "service": "MENUPI API"
}
```

**Response** (Unhealthy):
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Connection error message",
  "timestamp": "2025-12-25T15:00:00.000Z",
  "service": "MENUPI API"
}
```

**Status Codes**:
- `200` - Healthy (database connected)
- `503` - Unhealthy (database disconnected)

**Usage**: 
- Monitoring tools
- Railway health checks
- Load balancer health checks

---

## 🔐 Authentication Endpoints

### `POST /api/login`
Authenticate user with email/password

### `POST /api/register`
Register new user and restaurant

### `POST /api/auth/google`
Authenticate with Google OAuth

---

## 📁 Media Endpoints

### `GET /api/media`
Get all media for authenticated user's restaurant

### `POST /api/media`
Upload new media file

### `DELETE /api/media/:id`
Delete media file

---

## 📺 Screen Endpoints

### `GET /api/screens`
Get all screens for authenticated user's restaurant

### `POST /api/screens`
Create new screen

### `PUT /api/screens/:id`
Update screen

### `DELETE /api/screens/:id`
Delete screen

### `GET /api/screens/public/:screenCode`
Public endpoint to get screen data (no auth)

---

## 📅 Schedule Endpoints

### `GET /api/schedules`
Get all schedules for authenticated user's restaurant

### `POST /api/schedules`
Create new schedule

### `DELETE /api/schedules/:id`
Delete schedule

---

## 📺 TV Management Endpoints

### `GET /api/tvs`
Get all TVs for authenticated user (requires auth)

### `POST /api/tvs/register`
Register new TV device (public, no auth)

### `POST /api/tvs/heartbeat`
TV heartbeat update (public, no auth)

### `GET /api/tvs/public/:deviceId`
Get TV pairing status (public, no auth)

### `POST /api/tvs/manual-add`
Manually add Android TV (requires auth)

### `POST /api/tvs/:deviceId/assign`
Assign screen to TV (requires auth)

### `DELETE /api/tvs/:deviceId`
Remove TV from management (requires auth)

---

## 👥 Admin Endpoints

### `GET /api/admin/stats`
Get system statistics (requires SUPER_ADMIN)

### `GET /api/admin/users`
Get all users (requires SUPER_ADMIN)

### `GET /api/admin/plan-requests`
Get all plan requests (requires SUPER_ADMIN)

### `POST /api/admin/plan-requests/:id/approve`
Approve plan request (requires SUPER_ADMIN)

### `POST /api/admin/plan-requests/:id/deny`
Deny plan request (requires SUPER_ADMIN)

---

## 📝 Plan Request Endpoints

### `POST /api/plan-request`
Create plan upgrade request (requires auth)

---

## 🔗 Quick Links

- **API Root**: `https://api.menupi.com/`
- **Health Check**: `https://api.menupi.com/api/health`
- **Documentation**: `https://github.com/fakharu6036/display-menupi`

---

**Last Updated**: $(date)

