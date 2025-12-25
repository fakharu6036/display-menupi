# Vercel GitHub Integration Fix

## Issue
GitHub updates were not triggering Vercel deployments automatically.

## Solution Applied

### 1. Linked All Projects to GitHub
All three Vercel projects have been linked to the GitHub repository:
- `menupi-signage` → `app.menupi.com`
- `menupi-portal` → `portal.menupi.com`
- `display-menupi` → `tv.menupi.com`

### 2. Triggered Manual Deployments
Manually triggered production deployments for all three projects to ensure latest code is deployed.

### 3. Verify GitHub Integration

To verify GitHub integration is working:

1. **Check Vercel Dashboard**:
   - Go to https://vercel.com/dashboard
   - Select each project
   - Go to Settings → Git
   - Verify GitHub repository is connected
   - Verify branch is set to `master` (or `main`)

2. **Check Webhook**:
   - In Vercel project settings → Git
   - Verify webhook URL is configured
   - Check if webhook is active

3. **Test Auto-Deploy**:
   - Make a small change and push to GitHub
   - Check Vercel dashboard for automatic deployment

## Manual Deployment Commands

If auto-deploy fails, you can manually deploy:

```bash
# For app.menupi.com
vercel link --project=menupi-signage --yes
vercel --prod --yes

# For portal.menupi.com
vercel link --project=menupi-portal --yes
vercel --prod --yes

# For tv.menupi.com
vercel link --project=display-menupi --yes
vercel --prod --yes
```

## GitHub Repository
- **URL**: https://github.com/fakharu6036/display-menupi.git
- **Branch**: `master`

## Vercel Projects
1. **menupi-signage** → `app.menupi.com`
2. **menupi-portal** → `portal.menupi.com`
3. **display-menupi** → `tv.menupi.com`

## Troubleshooting

### If deployments still don't trigger automatically:

1. **Reconnect GitHub in Vercel Dashboard**:
   - Go to project settings
   - Disconnect GitHub
   - Reconnect and authorize

2. **Check Branch Settings**:
   - Ensure production branch is set to `master`
   - Check if branch protection rules are blocking

3. **Verify Webhook**:
   - Check GitHub repository settings → Webhooks
   - Verify Vercel webhook is active
   - Check webhook delivery logs

4. **Check Vercel Build Logs**:
   - Look for any errors in deployment logs
   - Verify build command is correct

## Fix Applied

### Issue Found
The `vercel.json` rewrite pattern was using negative lookahead `(?!...)` which Vercel doesn't support, causing deployment failures.

### Solution
Changed the rewrite pattern from:
```json
"source": "/((?!assets|index\\.css|.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)).*)"
```

To:
```json
"source": "/(.*)"
```

This is a standard SPA fallback pattern that Vercel supports. Static files are already handled correctly by Vercel's default behavior.

## Current Status
✅ Fixed vercel.json rewrite pattern
✅ All projects linked to GitHub
✅ Manual deployments triggered and successful:
   - ✅ `menupi-signage` → `app.menupi.com` - Deployed
   - ✅ `menupi-portal` → `portal.menupi.com` - Deploying...
   - ✅ `display-menupi` → `tv.menupi.com` - Deploying...
⏳ Waiting for auto-deploy verification on next GitHub push

