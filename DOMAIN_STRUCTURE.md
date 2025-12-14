# MENUPI Domain Structure (LOCKED)

## 🔹 Production Domains

### app.menupi.com
- **Purpose:** Authenticated dashboard
- **Technology:** React + TypeScript (Vite)
- **Features:**
  - User login & authentication
  - Admin panel
  - Screen management
  - Playlist & scheduling
  - Subscription management
  - Media upload
- **Authentication:** JWT tokens (5-hour session)
- **Deployment:** Vercel
- **CORS:** Allowed by API

### tv.menupi.com
- **Purpose:** Public TV player
- **Technology:** Lightweight React (or static build)
- **Features:**
  - Full-screen display
  - No authentication required
  - Polls API every 30-60 seconds
  - Shows archived/disabled states gracefully
- **URL Format:** `tv.menupi.com/{shortcode}`
- **Security:**
  - No cookies
  - No localStorage
  - Read-only API access
- **Deployment:** Vercel (static) or CDN
- **CORS:** Allowed by API

### api.menupi.com
- **Purpose:** Backend API
- **Technology:** Node.js + Express
- **Database:** MySQL
- **Features:**
  - Authentication endpoints
  - Screen CRUD operations
  - Playlist management
  - Media file serving
  - Subscription expiry logic
  - Public player data
- **CORS:** Only allows `app.menupi.com` and `tv.menupi.com`
- **Deployment:** Business Web Hosting (Node.js support)

---

## ❌ Out of Scope

- **menupi.com** - Marketing site (DO NOT TOUCH)
- **menupi.com/tv** - DO NOT CREATE
- WebSockets - Use polling only
- Real-time sync - Use polling only

---

## 🔐 Security Rules

1. **CORS Policy:**
   - ✅ `app.menupi.com` - Allowed
   - ✅ `tv.menupi.com` - Allowed
   - ❌ `menupi.com` - Blocked
   - ❌ All other origins - Blocked

2. **Shortcode Generation:**
   - Base32-like encoding (excludes 0, O, I, 1)
   - 6 characters = ~1.8 billion combinations
   - Cryptographically random
   - Non-guessable

3. **Public Player:**
   - No cookies
   - No localStorage
   - No authentication
   - Read-only API access

4. **Session Management:**
   - JWT tokens expire after 5 hours
   - No auto-refresh on expiry
   - User must re-login

---

## 📡 API Endpoints

### Public Endpoints (No Auth)
- `GET /api/public/screen/:code` - Get screen data for TV player

### Authenticated Endpoints (JWT Required)
- `POST /api/login` - User login
- `GET /api/users/me` - Get current user
- `GET /api/screens` - List screens
- `POST /api/screens` - Create screen
- `PUT /api/screens/:id` - Update screen
- `DELETE /api/screens/:id` - Delete screen
- `GET /api/media` - List media
- `POST /api/media/upload` - Upload media
- And more...

---

## 🔄 Polling Strategy

**NO WebSockets** - All real-time updates use polling:

1. **Public Player:**
   - Polls `/api/public/screen/:code` every 30-60 seconds
   - Caches last valid playlist
   - On API failure, continues showing cached content

2. **Dashboard:**
   - Auto-refreshes every 30 seconds
   - Listens for `menupi-user-updated` events
   - Immediate refresh on admin actions

---

## 📊 Database Tables

Minimum required tables:
- `users` - User accounts
- `restaurants` - Restaurant/account data
- `screens` - Screen configurations
- `screen_media` - Playlist items
- `media` - Media file metadata
- `schedules` - Playback schedules
- `subscriptions` - Subscription tracking
- `screen_status_logs` - Activity tracking

---

## 🚀 Deployment Checklist

- [ ] Backend API running on `api.menupi.com`
- [ ] Dashboard deployed to `app.menupi.com`
- [ ] TV player deployed to `tv.menupi.com`
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Database connected
- [ ] Shortcode generation working
- [ ] Public player polling working
- [ ] No cookies on TV player
- [ ] Session timeout configured (5h)

---

**Last Updated:** 2024
**Status:** Production Ready

