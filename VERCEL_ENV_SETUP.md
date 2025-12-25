# ⚙️ Vercel Environment Variables Setup

This guide explains how to configure Vercel environment variables to connect your frontend to your local backend.

## Required Environment Variables

### For Local Backend Setup

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-ngrok-url.ngrok.io` | Your local backend URL (via ngrok/Cloudflare) |
| `VITE_API_URL` | `https://your-ngrok-url.ngrok.io` | Alternative name (same as above) |

### Example Values

**Using ngrok:**
```
VITE_API_BASE_URL=https://abc123.ngrok.io
```

**Using Cloudflare Tunnel:**
```
VITE_API_BASE_URL=https://api.menupi.com
```

**Using Public IP:**
```
VITE_API_BASE_URL=http://your-public-ip:3002
```

## Setting Environment Variables

### Method 1: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your backend URL (e.g., `https://abc123.ngrok.io`)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your project (or wait for auto-deploy)

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variable
vercel env add VITE_API_BASE_URL

# Enter value when prompted
# https://abc123.ngrok.io

# Redeploy
vercel --prod
```

### Method 3: vercel.json (Not Recommended)

You can't set environment variables in `vercel.json`, but you can configure build settings.

## Environment-Specific Variables

You can set different values for different environments:

- **Production**: `app.menupi.com`
- **Preview**: `your-project-abc123.vercel.app`
- **Development**: `localhost:3000`

### Example Setup

1. **Production:**
   ```
   VITE_API_BASE_URL=https://api.menupi.com
   ```

2. **Preview:**
   ```
   VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io
   ```

3. **Development:**
   ```
   VITE_API_BASE_URL=http://localhost:3002
   ```

## Verifying Environment Variables

### Check in Vercel Dashboard

1. Go to **Settings** → **Environment Variables**
2. Verify variables are listed
3. Check **Environment** column (should include Production, Preview, Development)

### Check in Build Logs

1. Go to **Deployments** → **Latest Deployment** → **Build Logs**
2. Look for:
   ```
   VITE_API_BASE_URL=https://...
   ```

### Check in Browser Console

1. Open your Vercel deployment
2. Open browser DevTools → Console
3. Run:
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL)
   ```
4. Should show your backend URL

## Updating Environment Variables

### When ngrok URL Changes

1. **Get new ngrok URL:**
   ```bash
   ngrok http 3002
   # Copy new URL
   ```

2. **Update Vercel:**
   - Dashboard → Environment Variables
   - Edit `VITE_API_BASE_URL`
   - Enter new URL
   - Save

3. **Redeploy:**
   - Go to Deployments
   - Click "Redeploy" on latest deployment
   - Or push new commit to trigger auto-deploy

### When Switching to Cloudflare Tunnel

1. **Setup Cloudflare Tunnel** (see LOCAL_BACKEND_SETUP.md)
2. **Update Vercel:**
   - Change `VITE_API_BASE_URL` to `https://api.menupi.com`
3. **Redeploy**

## Troubleshooting

### Variable Not Found

**Problem:** `import.meta.env.VITE_API_BASE_URL` is `undefined`

**Solutions:**
1. ✅ Variable name must start with `VITE_`
2. ✅ Redeploy after adding variable
3. ✅ Check environment (Production vs Preview)
4. ✅ Clear browser cache

### Wrong URL in Frontend

**Problem:** Frontend still using old URL

**Solutions:**
1. ✅ Redeploy Vercel project
2. ✅ Clear browser cache
3. ✅ Check build logs for correct value
4. ✅ Verify variable is set for correct environment

### CORS Errors

**Problem:** CORS errors when calling backend

**Solutions:**
1. ✅ Check backend CORS allows Vercel domain
2. ✅ Verify `FRONTEND_URL` in backend `.env`
3. ✅ Check ngrok/Cloudflare URL is correct

## Best Practices

1. **Use HTTPS** (ngrok and Cloudflare provide this)
2. **Don't commit** `.env.local` to git
3. **Use different URLs** for different environments
4. **Document** your setup in team docs
5. **Monitor** backend uptime (ngrok URLs can change)

## Quick Reference

```bash
# Get ngrok URL
ngrok http 3002

# Update Vercel env var (via CLI)
vercel env add VITE_API_BASE_URL

# Redeploy
vercel --prod

# Or via Dashboard:
# Settings → Environment Variables → Edit → Save → Redeploy
```

---

**Status**: ✅ **Ready for Vercel Configuration**  
**Next**: Add `VITE_API_BASE_URL` in Vercel Dashboard

