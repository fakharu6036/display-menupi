# 🔧 Fix display-menupi Branch

## Current Status

✅ **menupi-signage** - `master` branch (correct)  
✅ **menupi-portal** - `master` branch (correct)  
⚠️ **display-menupi** - `main` branch (needs to switch to `master`)

## Problem

`display-menupi` is deploying from `main` branch, but your code is on `master` branch. This means it's deploying old code from Dec 22.

## Solution: Switch to master Branch

### Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Open project: **display-menupi**
3. Go to **Settings** → **Git**
4. Find **Production Branch** setting
5. Change from `main` to `master`
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on the latest deployment
9. Wait 2-3 minutes for deployment

### Via CLI (Alternative)

```bash
cd /Users/mdfakharuddin/Desktop/menupi---digital-signage
vercel link --project=display-menupi --yes
# This will use current branch (master)
vercel --prod
```

## After Fix

All 3 projects will:
- ✅ Use `master` branch
- ✅ Auto-deploy on push
- ✅ Have latest code with CSS fix
- ✅ Be in sync

## Verification

After switching branch:

1. **Settings** → **Git** → Should show: `master` (not `main`)
2. **Deployments** → Latest should show recent commit (not Dec 22)
3. **Deployments** → Should show: "Simplify vercel.json rewrite pattern" or newer

## Expected Result

| Project | Branch | Status |
|---------|--------|--------|
| menupi-signage | `master` | ✅ Correct |
| menupi-portal | `master` | ✅ Correct |
| display-menupi | `master` | ✅ After fix |

---

**Status**: ⚠️ **Action Required**  
**Next**: Switch display-menupi to `master` branch in Vercel Dashboard

