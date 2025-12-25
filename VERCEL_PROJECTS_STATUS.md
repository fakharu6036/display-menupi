# 📊 Vercel Projects Status

## Current Status

### ✅ menupi-portal (portal.menupi.com)
- **Status**: ✅ Connected to Git
- **Branch**: `master`
- **Last Deploy**: 32 minutes ago
- **Action**: ✅ Up to date

### ⚠️ display-menupi (tv.menupi.com)
- **Status**: ⚠️ Connected but on wrong branch
- **Branch**: `main` (should be `master`)
- **Last Deploy**: Dec 22 (old)
- **Action**: ⚠️ Needs to switch to `master` branch

### ❌ menupi-signage (app.menupi.com)
- **Status**: ❌ Not connected to Git
- **Branch**: N/A
- **Action**: ❌ Needs Git connection

## Fix Steps

### 1. Connect menupi-signage to Git

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/dashboard
2. Open project: **menupi-signage**
3. Go to **Settings** → **Git**
4. Click **Connect Git Repository**
5. Select: `fakharu6036/display-menupi`
6. Select branch: `master`
7. Root Directory: `./` (leave empty)
8. Click **Save**

**Option B: Via CLI**
```bash
cd /Users/mdfakharuddin/Desktop/menupi---digital-signage
vercel link --project=menupi-signage --yes
# Follow prompts to connect Git
```

### 2. Fix display-menupi Branch

**Via Vercel Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Open project: **display-menupi**
3. Go to **Settings** → **Git**
4. Change **Production Branch** from `main` to `master`
5. Click **Save**
6. Go to **Deployments** → Click **Redeploy** on latest

**Via CLI:**
```bash
vercel link --project=display-menupi --yes
# This will use the current branch (master)
```

### 3. Redeploy All Projects

After fixing Git connections:

```bash
# All projects will auto-deploy when you push to master
git push origin master

# Or manually redeploy each:
vercel link --project=menupi-signage --yes && vercel --prod
vercel link --project=display-menupi --yes && vercel --prod
vercel link --project=menupi-portal --yes && vercel --prod
```

## Expected Result

After fixes:
- ✅ All 3 projects connected to `fakharu6036/display-menupi`
- ✅ All 3 projects using `master` branch
- ✅ All 3 projects auto-deploy on push
- ✅ All 3 projects have latest code with CSS fix

## Verification

Check each project:
1. **Settings** → **Git** → Should show: `fakharu6036/display-menupi`
2. **Settings** → **Git** → **Production Branch** → Should be: `master`
3. **Deployments** → Latest should be recent (with CSS fix)

---

**Status**: ⚠️ **Action Required**  
**Next**: Connect menupi-signage and fix display-menupi branch

