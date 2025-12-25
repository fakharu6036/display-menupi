# MENUPI Production Readiness Checklist

## ✅ Completed Production Requirements

### Domain Architecture
- [x] **Frontend Domains Configured**
  - `tv.menupi.com` → Public Player (TV runtime)
  - `app.menupi.com` → User Dashboard
  - `portal.menupi.com` → Admin Panel
- [x] **Backend Domain Configured**
  - `api.menupi.com` → Railway API Server

### No Localhost References
- [x] Removed all localhost references from production code
- [x] Updated `services/config.ts` to use production URLs only
- [x] Updated `server.js` CORS to allow only menupi.com subdomains
- [x] Removed localhost fallbacks from API base URL configuration

### TV Player (tv.menupi.com)
- [x] **No Login Functionality** - TVs are device-identified only
- [x] Device fingerprinting implemented (`device_uid`, `installation_id`, `tv_id`)
- [x] Waiting screen with QR code and pairing code
- [x] Dashboard controls TV content (TV cannot override)

### Material Design 3
- [x] MD3 color tokens defined in `index.html`
- [x] Components use MD3 design principles
- [x] Clean, professional, calm UI

### No Demo Data
- [x] No sample users
- [x] No sample menus
- [x] No placeholder TVs
- [x] No fake assets

## 📋 Deployment Checklist

### Railway Backend Setup
1. [ ] Deploy backend to Railway
2. [ ] Set environment variables in Railway:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `JWT_SECRET` (generate strong random string)
   - `API_URL=https://api.menupi.com`
   - `PROTOCOL=https`
   - `DOMAIN=api.menupi.com`
3. [ ] Configure Railway custom domain: `api.menupi.com`
4. [ ] Test API endpoints are accessible

### Vercel Frontend Setup

#### Project 1: Public Player (tv.menupi.com)
1. [ ] Create Vercel project: `menupi-public-player`
2. [ ] Set root directory: `apps/public-player` (or current root if single app)
3. [ ] Set environment variable:
   - `VITE_API_BASE_URL=https://api.menupi.com`
4. [ ] Configure custom domain: `tv.menupi.com`
5. [ ] Deploy

#### Project 2: Dashboard (app.menupi.com)
1. [ ] Create Vercel project: `menupi-dashboard`
2. [ ] Set root directory: `apps/dashboard` (or current root if single app)
3. [ ] Set environment variable:
   - `VITE_API_BASE_URL=https://api.menupi.com`
4. [ ] Configure custom domain: `app.menupi.com`
5. [ ] Deploy

#### Project 3: Admin Portal (portal.menupi.com)
1. [ ] Create Vercel project: `menupi-admin`
2. [ ] Set root directory: `apps/admin` (or current root if single app)
3. [ ] Set environment variable:
   - `VITE_API_BASE_URL=https://api.menupi.com`
4. [ ] Configure custom domain: `portal.menupi.com`
5. [ ] Deploy

### Database Setup
1. [ ] Run database migrations on production database
2. [ ] Verify all tables exist:
   - `restaurants`
   - `users`
   - `media`
   - `screens`
   - `screen_media`
   - `schedules`
   - `hardware_tvs`
3. [ ] Create first admin user (SUPER_ADMIN role)

### Security Checklist
1. [ ] Generate strong `JWT_SECRET` (minimum 32 characters)
2. [ ] Verify CORS only allows menupi.com subdomains
3. [ ] Ensure HTTPS is enforced on all domains
4. [ ] Verify API authentication is working
5. [ ] Test admin route protection (SUPER_ADMIN only)

### Testing Checklist
1. [ ] Test TV player loads on `tv.menupi.com`
2. [ ] Test dashboard loads on `app.menupi.com`
3. [ ] Test admin portal loads on `portal.menupi.com`
4. [ ] Test TV registration and pairing
5. [ ] Test screen assignment to TV
6. [ ] Test media upload and playback
7. [ ] Test user authentication
8. [ ] Test admin functions

## 🚨 Critical Production Rules

### NEVER
- ❌ Use localhost in production code
- ❌ Include demo/sample data
- ❌ Allow TV login functionality
- ❌ Hardcode API URLs
- ❌ Use mock APIs

### ALWAYS
- ✅ Use environment variables for configuration
- ✅ Use production domains (menupi.com subdomains)
- ✅ Enforce HTTPS
- ✅ Validate all user inputs
- ✅ Use proper error handling

## 📝 Environment Variables Reference

See `.env.production.example` for required environment variables.

## 🔗 Domain Architecture

```
Frontend (Vercel):
├── tv.menupi.com      → Public Player
├── app.menupi.com     → User Dashboard
└── portal.menupi.com → Admin Panel

Backend (Railway):
└── api.menupi.com     → API Server
```

All frontend apps communicate only with `api.menupi.com`.

