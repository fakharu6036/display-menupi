# Vercel Environment Variable Check

## Issue
Frontend is receiving HTML instead of JSON from API, causing `SyntaxError: Unexpected token '<'`.

## Root Cause
The `VITE_API_BASE_URL` environment variable might be:
1. Set to the wrong value (e.g., `https://api.menupi.com` instead of ngrok URL)
2. Not being picked up by the Vercel build
3. The ngrok URL has changed

## Current Status
✅ `VITE_API_BASE_URL` is set in Vercel for `menupi-signage` project
⚠️ Need to verify the actual value

## How to Check and Fix

### 1. Check Current Value
```bash
# Link to the project
vercel link --project=menupi-signage

# List environment variables (will show as "Encrypted")
vercel env ls

# Pull environment variables to see actual values (in .env.local)
vercel env pull
cat .env.local | grep VITE_API_BASE_URL
```

### 2. Update if Needed
```bash
# Set the correct ngrok URL
vercel env add VITE_API_BASE_URL production
# Enter: https://tingliest-patience-tragic.ngrok-free.dev

vercel env add VITE_API_BASE_URL preview
# Enter: https://tingliest-patience-tragic.ngrok-free.dev

vercel env add VITE_API_BASE_URL development
# Enter: https://tingliest-patience-tragic.ngrok-free.dev
```

### 3. Redeploy
After updating environment variables, trigger a new deployment:
```bash
vercel --prod
```

Or push a new commit to trigger auto-deploy.

## Current ngrok URL
```
https://tingliest-patience-tragic.ngrok-free.dev
```

## Debugging
The frontend now logs:
- The API URL being used
- Warnings if `VITE_API_BASE_URL` is not set
- Detailed error messages if HTML is received instead of JSON

Check browser console for these messages.

