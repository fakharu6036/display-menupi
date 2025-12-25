# ✅ Vercel Projects Setup Complete!

## Projects Configured

### 1. ✅ menupi-signage (app.menupi.com)
- **Status**: Updated with ngrok URL
- **Environment Variable**: `VITE_API_BASE_URL=https://tingliest-patience-tragic.ngrok-free.dev`
- **Domains**: app.menupi.com
- **Action**: Ready to deploy

### 2. ✅ display-menupi (tv.menupi.com)
- **Status**: Updated with ngrok URL
- **Environment Variable**: `VITE_API_BASE_URL=https://tingliest-patience-tragic.ngrok-free.dev`
- **Domains**: tv.menupi.com
- **Action**: Ready to deploy

### 3. ✅ menupi-portal (portal.menupi.com)
- **Status**: Created and configured
- **Environment Variable**: `VITE_API_BASE_URL=https://tingliest-patience-tragic.ngrok-free.dev`
- **Domains**: Needs to be added (portal.menupi.com)
- **Action**: Add domain in Vercel Dashboard

## Next Steps

### Deploy All Projects

```bash
# Deploy app.menupi.com
cd /Users/mdfakharuddin/Desktop/menupi---digital-signage
vercel link --project=menupi-signage --yes
vercel --prod

# Deploy tv.menupi.com
vercel link --project=display-menupi --yes
vercel --prod

# Deploy portal.menupi.com
vercel link --project=menupi-portal --yes
vercel --prod
```

### Add Domain for Portal

1. Go to: https://vercel.com/dashboard
2. Open project: **menupi-portal**
3. **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `portal.menupi.com`
6. Follow DNS setup instructions

## Environment Variables Summary

All three projects now have:
```
VITE_API_BASE_URL=https://tingliest-patience-tragic.ngrok-free.dev
```

Set for:
- ✅ Production
- ✅ Preview
- ✅ Development

## Verify Setup

### Check Environment Variables

```bash
# For each project
vercel link --project=menupi-signage --yes
vercel env ls

vercel link --project=display-menupi --yes
vercel env ls

vercel link --project=menupi-portal --yes
vercel env ls
```

### Test Deployments

After deploying, test each subdomain:

```bash
# Test app.menupi.com
curl -I https://app.menupi.com

# Test tv.menupi.com
curl -I https://tv.menupi.com

# Test portal.menupi.com (after adding domain)
curl -I https://portal.menupi.com
```

## Important Notes

### Keep ngrok Running

- ngrok must stay running for Vercel to access your backend
- Current ngrok URL: `https://tingliest-patience-tragic.ngrok-free.dev`
- If ngrok restarts, you'll get a new URL and need to update all projects

### Auto-Deploy

All projects are connected to GitHub repo: `fakharu6036/display-menupi`

- ✅ Pushing to `master` will auto-deploy all projects
- ✅ Each project deploys independently
- ✅ Environment variables are preserved

## Project URLs

| Project | Domain | Status |
|---------|--------|--------|
| menupi-signage | app.menupi.com | ✅ Configured |
| display-menupi | tv.menupi.com | ✅ Configured |
| menupi-portal | portal.menupi.com | ✅ Configured (add domain) |

---

**Status**: ✅ **All Projects Configured**  
**Next**: Deploy projects and add portal.menupi.com domain

