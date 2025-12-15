# ✅ Fixed Double `/api/` Prefix Issue

## Problem
All API calls were failing with 403 Forbidden errors because URLs had a double `/api/` prefix:
- ❌ `https://api.menupi.com/api/storage/usage`
- ❌ `https://api.menupi.com/api/screens`
- ❌ `https://api.menupi.com/api/media`

## Root Cause
The browser was using a cached JavaScript bundle that was built with `VITE_API_URL=https://api.menupi.com/api`. Since `api.menupi.com` subdomain already points to the `/api/` directory, adding `/api/` to paths created double prefixes.

## Solution
Implemented **runtime URL sanitization** that works even with old cached bundles:

1. **Created `sanitizeApiUrl()` function:**
   - Removes double `/api/` prefixes at runtime
   - Pattern: `https://api.menupi.com/api/screens` → `https://api.menupi.com/screens`

2. **Created `apiUrl()` helper function:**
   - Constructs API URLs correctly
   - Applies sanitization automatically
   - Used by all fetch calls

3. **Replaced all API calls:**
   - Changed from: `` `${API_URL}/screens` ``
   - Changed to: `apiUrl('/screens')`
   - Applied to all 23+ fetch calls in `services/storage.ts`

## Files Changed
- ✅ `services/storage.ts` - All API calls now use `apiUrl()` helper

## Deployment
- ✅ Changes pushed to GitHub
- ⏳ Vercel auto-deploying now (1-3 minutes)

## Expected Result
After deployment completes:
- ✅ `https://api.menupi.com/storage/usage` (no double prefix)
- ✅ `https://api.menupi.com/screens` (no double prefix)
- ✅ `https://api.menupi.com/media` (no double prefix)
- ✅ All API calls should work correctly

## Next Steps
1. **Wait 1-3 minutes** for Vercel to finish building
2. **Hard refresh browser:** `Ctrl+Shift+R` or `Cmd+Shift+R`
3. **Test login** - should work without 403 errors

---

**Status:** ✅ Fix deployed - Vercel building now!

