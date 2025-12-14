# MENUPI Deployment Guide

## 🔹 Domain Structure (LOCKED)

**DO NOT modify these domains. They are production-ready:**

- **app.menupi.com** - Authenticated dashboard (React + TypeScript)
- **tv.menupi.com** - Public TV player (lightweight, no auth)
- **api.menupi.com** - Backend API (Node.js + Express)

**IMPORTANT:** 
- Do NOT reference or modify `menupi.com`
- Do NOT create or connect anything to `menupi.com/tv`
- Marketing pages are out of scope

---

## 📁 Project Structure

```
menupi-signage/
├── server.js                 # Backend API (api.menupi.com)
├── pages/
│   ├── Dashboard.tsx         # Main dashboard (app.menupi.com)
│   ├── PublicPlayer.tsx      # TV player (tv.menupi.com)
│   └── ...
├── services/
│   └── storage.ts            # API client
├── .env.example              # Backend environment variables
├── .env.frontend.example     # Frontend environment variables
└── DEPLOYMENT.md             # This file
```

---

## 🚀 Deployment Steps

### 1. Backend API (api.menupi.com)

**Hosting:** Business Web Hosting with Node.js support

#### Setup Steps:

1. **Upload backend files:**
   ```bash
   # Upload these files to your hosting:
   - server.js
   - package.json
   - .env (created from .env.example)
   - uploads/ (directory for media files)
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   
   # Edit .env with your values:
   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
   - JWT_SECRET (use a strong random string)
   - NODE_ENV=production
   - PORT=3001 (or your hosting's Node.js port)
   ```

4. **Start the server:**
   ```bash
   # Using PM2 or your hosting's process manager
   pm2 start server.js --name menupi-api
   ```

5. **Configure domain:**
   - Point `api.menupi.com` to your hosting server
   - Ensure port 3001 (or your configured port) is accessible

#### CORS Configuration:
- ✅ Only allows: `app.menupi.com` and `tv.menupi.com`
- ❌ Blocks: `menupi.com` and all other origins
- Configured in `server.js` lines 18-50

---

### 2. Frontend Dashboard (app.menupi.com)

**Hosting:** Vercel

#### Setup Steps:

1. **Connect repository to Vercel:**
   - Import your Git repository
   - Vercel will auto-detect React/Vite

2. **Configure environment variables in Vercel:**
   ```
   VITE_API_URL=https://api.menupi.com/api
   VITE_TV_PLAYER_URL=https://tv.menupi.com
   ```

3. **Build settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Configure custom domain:**
   - Add `app.menupi.com` in Vercel dashboard
   - Follow DNS instructions to point domain

5. **Deploy:**
   - Push to main branch triggers auto-deploy
   - Or manually deploy from Vercel dashboard

---

### 3. Public TV Player (tv.menupi.com)

**Hosting:** Vercel (static build) or CDN

#### Option A: Vercel (Recommended)

1. **Create separate Vercel project** for TV player
2. **Build as static site:**
   - Use same codebase
   - Build only `PublicPlayer.tsx` route
   - Or create minimal standalone build

3. **Configure environment:**
   ```
   VITE_API_URL=https://api.menupi.com/api
   ```

4. **Add custom domain:** `tv.menupi.com`

#### Option B: Static CDN

1. **Build static files:**
   ```bash
   npm run build
   ```

2. **Upload `dist/` to CDN:**
   - Configure routing for `/tv/:code` paths
   - Ensure all routes serve `index.html` (SPA routing)

---

## 🔐 Security Configuration

### Shortcode Generation
- Uses Base32-like encoding (excludes 0, O, I, 1)
- 6-character codes = ~1.8 billion combinations
- Non-guessable, cryptographically random
- Implemented in `server.js` and `services/storage.ts`

### CORS Policy
```javascript
// Only these origins allowed:
- https://app.menupi.com
- https://tv.menupi.com
```

### Session Management
- JWT tokens expire after 5 hours
- No cookies on `tv.menupi.com`
- Public player uses read-only API access

---

## 📊 Database Schema

Required tables (minimum):
- `users` - User accounts
- `restaurants` - Restaurant/account data
- `screens` - Screen configurations
- `screen_media` - Playlist items
- `media` - Media file metadata
- `schedules` - Playback schedules
- `subscriptions` - Subscription tracking (for expiry)
- `screen_status_logs` - Activity tracking

---

## 🔄 Polling Configuration

**NO WebSockets** - Use polling only:

- **Public Player:** Polls `/api/public/screen/:code` every 30-60 seconds
- **Dashboard:** Auto-refreshes every 30 seconds
- **Cache:** Last valid playlist cached on player
- **Fallback:** On API failure, continue showing cached content

---

## 🧪 Testing Checklist

Before going live:

- [ ] API accessible at `api.menupi.com`
- [ ] Dashboard accessible at `app.menupi.com`
- [ ] TV player accessible at `tv.menupi.com/{code}`
- [ ] CORS blocks unauthorized origins
- [ ] Shortcodes are unique and non-guessable
- [ ] Public player shows archived/disabled states
- [ ] Session timeout works (5 hours)
- [ ] No cookies on `tv.menupi.com`
- [ ] Polling works (30-60 second intervals)
- [ ] Media uploads work
- [ ] Screen creation/editing works

---

## 🐛 Troubleshooting

### CORS Errors
- Check `ALLOWED_ORIGINS` in `.env`
- Verify domain matches exactly (https://, no trailing slash)
- Check browser console for blocked origins

### API Connection Issues
- Verify `VITE_API_URL` in frontend `.env`
- Check API server is running
- Verify domain DNS points correctly

### TV Player Not Loading
- Check shortcode is valid
- Verify screen exists in database
- Check API endpoint `/api/public/screen/:code`
- Ensure no CORS blocking

---

## 📝 Environment Variables Reference

### Backend (.env)
```bash
NODE_ENV=production
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your_secret
PORT=3001
FRONTEND_URL=https://app.menupi.com
ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
```

### Frontend (.env.local)
```bash
VITE_API_URL=https://api.menupi.com/api
VITE_TV_PLAYER_URL=https://tv.menupi.com
```

---

## ⚠️ Important Notes

1. **Never add `menupi.com` to CORS** - Only app and tv subdomains
2. **No WebSockets** - Use polling only
3. **No cookies on TV player** - Read-only access
4. **Shortcodes must be unique** - Check before generation
5. **Session timeout is 5 hours** - Configured in JWT

---

## 📞 Support

For deployment issues:
1. Check server logs
2. Verify environment variables
3. Test API endpoints directly
4. Check CORS headers in browser DevTools

---

**Last Updated:** 2024
**Version:** 1.0.0
