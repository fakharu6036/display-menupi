# 🔗 ngrok Setup Guide

## What is ngrok?

ngrok creates a secure tunnel from the internet to your local server. This allows Vercel (or any external service) to access your local backend running on `localhost:3002`.

## Step 1: Install ngrok

### macOS (using Homebrew - Recommended)

```bash
brew install ngrok
```

### Manual Installation

1. Go to: https://ngrok.com/download
2. Download for macOS
3. Extract and move to `/usr/local/bin/`:
   ```bash
   sudo mv ngrok /usr/local/bin/
   ```

### Windows

1. Download from: https://ngrok.com/download
2. Extract to a folder
3. Add to PATH or use full path

## Step 2: Sign Up (Free Account)

1. Go to: https://dashboard.ngrok.com/signup
2. Create a free account
3. Verify your email

## Step 3: Get Your Authtoken

1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken

## Step 4: Configure ngrok

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

Replace `YOUR_AUTHTOKEN_HERE` with the token from step 3.

## Step 5: Start ngrok Tunnel

Make sure your backend server is running first:

```bash
# Terminal 1: Start backend (if not already running)
npm run server:api

# Terminal 2: Start ngrok
ngrok http 3002
```

**Expected output:**
```
ngrok

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3002

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

## Step 6: Copy Your ngrok URL

From the ngrok output, copy the **HTTPS URL**:

```
Forwarding    https://abc123.ngrok.io -> http://localhost:3002
                              ^^^^^^^^^^^^^^^^^^^^
                              This is your URL!
```

**Example:** `https://abc123.ngrok.io`

## Step 7: Test Your ngrok URL

Open a new terminal and test:

```bash
# Test root endpoint
curl https://abc123.ngrok.io/

# Test health endpoint
curl https://abc123.ngrok.io/api/health
```

Both should return JSON responses (same as localhost:3002).

## Step 8: Use in Vercel

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Add New:**
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://abc123.ngrok.io` (your ngrok URL)
   - **Environment**: Select all (Production, Preview, Development)
3. **Save**
4. **Redeploy** your project

## Important Notes

### ⚠️ Free ngrok URLs Change on Restart

**Problem:** Free ngrok URLs change every time you restart ngrok.

**Solution:**
1. **Update Vercel** environment variable with new URL
2. **Redeploy** Vercel project
3. Or use **ngrok paid plan** for static domain

### 🔒 Keep ngrok Running

- ngrok must be running for Vercel to access your backend
- If you close ngrok, Vercel will get connection errors
- Keep the ngrok terminal open while developing

### 📊 ngrok Web Interface

ngrok provides a web interface to monitor requests:

```
Web Interface    http://127.0.0.1:4040
```

Open in browser to see:
- All incoming requests
- Request/response details
- Replay requests
- Inspect traffic

### 🚀 For Production (Static Domain)

If you need a permanent URL:

1. **Upgrade to ngrok paid plan** ($8/month)
2. **Reserve a domain:**
   ```bash
   ngrok config add-domain your-domain.ngrok-free.app
   ```
3. **Use static domain:**
   ```bash
   ngrok http 3002 --domain=your-domain.ngrok-free.app
   ```

### 🔄 Alternative: Cloudflare Tunnel (Free, Static Domain)

If you want a free, static domain:

1. **Install cloudflared:**
   ```bash
   brew install cloudflared
   ```

2. **Login:**
   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnel:**
   ```bash
   cloudflared tunnel create menupi-backend
   ```

4. **Run tunnel:**
   ```bash
   cloudflared tunnel run menupi-backend
   ```

5. **Configure DNS:**
   - Add CNAME: `api.menupi.com` → `<tunnel-id>.cfargotunnel.com`

See `LOCAL_BACKEND_SETUP.md` for detailed Cloudflare Tunnel setup.

## Quick Reference

```bash
# Install ngrok
brew install ngrok

# Configure authtoken
ngrok config add-authtoken YOUR_TOKEN

# Start tunnel (backend must be running on port 3002)
ngrok http 3002

# Copy HTTPS URL from output
# Use in Vercel: VITE_API_BASE_URL=https://abc123.ngrok.io
```

## Troubleshooting

### "ngrok: command not found"

**Solution:**
```bash
# Install via Homebrew
brew install ngrok

# Or add to PATH if installed manually
export PATH=$PATH:/path/to/ngrok
```

### "ERR_NGROK_108" (Invalid authtoken)

**Solution:**
1. Get new authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
2. Run: `ngrok config add-authtoken YOUR_NEW_TOKEN`

### "Port 3002 already in use"

**Solution:**
```bash
# Find process using port 3002
lsof -i :3002

# Kill process
kill -9 <PID>

# Or use different port
ngrok http 3003
# Then update backend to use port 3003
```

### Vercel can't connect to ngrok URL

**Solution:**
1. ✅ Verify ngrok is running
2. ✅ Test URL in browser: `https://abc123.ngrok.io/api/health`
3. ✅ Check Vercel environment variable is set correctly
4. ✅ Redeploy Vercel project after updating env var

---

**Status**: 📋 **Setup Guide Ready**  
**Next**: Install ngrok and start tunnel

