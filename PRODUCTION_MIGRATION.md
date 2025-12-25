# Production Migration Summary

## Overview
MENUPI has been updated to meet all production requirements. All localhost references have been removed, and the system is configured for production deployment on Vercel (frontend) and Railway (backend).

## Changes Made

### 1. Configuration Updates (`services/config.ts`)
- **Removed localhost fallbacks** - Now requires `VITE_API_BASE_URL` environment variable or uses production detection
- **Updated `getApiBase()`** - Falls back to `https://api.menupi.com` instead of localhost
- **Updated `isTvPlayerContext()`** - Removed port-based detection, uses domain only
- **Updated `getTvPlayerUrl()`** - Removed localhost fallback, uses `https://tv.menupi.com`
- **Updated `getAdminUrl()`** - Removed localhost fallback, uses `https://portal.menupi.com`

### 2. Server Updates (`server.js`)
- **Removed localhost CORS** - Only allows `menupi.com` subdomains
- **Updated `getBaseUrl()`** - Removed localhost fallback, uses environment variables or production defaults
- **Updated startup message** - Shows production API URL instead of localhost

### 3. Domain References
- **Fixed TvLogin.tsx** - Changed `dashboard.menupi.com` to `app.menupi.com` (correct dashboard domain)

### 4. Verification
- ✅ **TV Player** - No login functionality (device-identified only)
- ✅ **Material Design 3** - Properly implemented with MD3 color tokens
- ✅ **No Demo Data** - No sample users, menus, or placeholder content found

## Domain Architecture

### Frontend (Vercel - 3 separate projects)
- `tv.menupi.com` → Public Player (TV runtime)
- `app.menupi.com` → User Dashboard  
- `portal.menupi.com` → Admin Panel

### Backend (Railway)
- `api.menupi.com` → API Server

## Required Environment Variables

### Frontend (Vercel)
```env
VITE_API_BASE_URL=https://api.menupi.com
```

### Backend (Railway)
```env
# API Configuration
API_URL=https://api.menupi.com
PROTOCOL=https
DOMAIN=api.menupi.com
PORT=3002

# Database
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name

# Security
JWT_SECRET=your-strong-random-secret-key-here

# Environment
NODE_ENV=production
```

## Deployment Order

1. **Railway Backend** - Deploy API server first
2. **tv.menupi.com** - Deploy public player
3. **app.menupi.com** - Deploy dashboard
4. **portal.menupi.com** - Deploy admin portal

## Testing Checklist

After deployment, verify:
- [ ] API server responds at `https://api.menupi.com`
- [ ] TV player loads at `https://tv.menupi.com`
- [ ] Dashboard loads at `https://app.menupi.com`
- [ ] Admin portal loads at `https://portal.menupi.com`
- [ ] CORS allows all menupi.com subdomains
- [ ] TV registration works
- [ ] Screen assignment works
- [ ] Media upload and playback works

## Notes

- Development documentation (DEV_PORTS.md) still contains localhost references for local development - this is intentional
- Database connection in `server.js` still uses `localhost` as a fallback for the database host - this is for the database connection itself, not the API URL
- All production code now uses production URLs only

