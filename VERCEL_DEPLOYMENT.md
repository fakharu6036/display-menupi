# Vercel Deployment Guide for MENUPI

## ✅ Pre-Deployment Checklist

- [x] `vercel.json` created with SPA routing
- [x] Environment variables documented
- [x] TV player route configured (`/tv/:screenCode`)
- [x] Layout skips TV player (no navigation)
- [x] No hardcoded localhost URLs (fallbacks only)

## 🚀 Deployment Steps

### 1. Install Vercel CLI (if not installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables
```bash
# Set production API URL
vercel env add VITE_API_URL production
# Enter: https://api.menupi.com/api

# Set TV player URL
vercel env add VITE_TV_PLAYER_URL production
# Enter: https://tv.menupi.com
```

### 4. Deploy to Preview
```bash
vercel
```

### 5. Deploy to Production (when ready)
```bash
vercel --prod
```

## 📋 Vercel Dashboard Configuration

Alternatively, configure via Vercel Dashboard:

1. **Go to Project Settings → Environment Variables**
2. **Add:**
   - `VITE_API_URL` = `https://api.menupi.com/api`
   - `VITE_TV_PLAYER_URL` = `https://tv.menupi.com`

3. **Build Settings:**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

## 🔍 Post-Deployment Validation

After deployment, verify:

1. **Dashboard loads:** `https://[project].vercel.app/dashboard`
2. **Login works:** `https://[project].vercel.app/login`
3. **TV player works:** `https://[project].vercel.app/tv/[test-code]`
4. **SPA routing works:** Refresh any route - no 404
5. **API calls:** Check browser console - should hit `api.menupi.com`
6. **No CORS errors:** All API calls succeed

## 🐛 Troubleshooting

### Build Fails
- Check `package.json` has all dependencies
- Verify Node.js version (Vercel auto-detects)
- Check build logs in Vercel dashboard

### 404 on Refresh
- Verify `vercel.json` has rewrites configured
- Check SPA routing is enabled

### API Connection Issues
- Verify `VITE_API_URL` is set correctly
- Check CORS on backend allows Vercel preview URL
- Test API endpoint directly

### TV Player Not Loading
- Verify route is `/tv/:screenCode`
- Check shortcode is valid
- Verify API endpoint `/api/public/screen/:code` works

## 📝 Notes

- Preview URLs: `https://[project-name]-[hash].vercel.app`
- Production URLs: Configure custom domains later (`app.menupi.com`, `tv.menupi.com`)
- Environment variables are per-environment (production, preview, development)

