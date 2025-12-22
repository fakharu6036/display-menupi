# 🔄 Clear Browser Cache - Critical Step

## ⚠️ IMPORTANT: You Must Clear Browser Cache

The browser is still using the **old cached JavaScript bundle** that has the double `/api/` prefix bug.

### Quick Fix (Choose One):

#### Option 1: Hard Refresh (Easiest)
- **Windows/Linux:** Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** Press `Cmd + Shift + R`
- **Or:** Hold `Shift` and click the refresh button

#### Option 2: Clear Cache via DevTools
1. Open DevTools (`F12` or `Cmd+Option+I`)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

#### Option 3: Clear All Site Data
1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Click **"Clear storage"** or **"Clear site data"**
4. Check all boxes
5. Click **"Clear site data"**
6. Refresh the page

#### Option 4: Incognito/Private Window
- Open a new **Incognito/Private** window
- Navigate to `https://app.menupi.com`
- This bypasses all cache

---

## ✅ After Clearing Cache

You should see:
- ✅ URLs like `https://api.menupi.com/storage/usage` (no double `/api/`)
- ✅ No more 403 errors
- ✅ Login works correctly
- ✅ Dashboard loads properly

---

## 🔍 How to Verify

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Try to login
4. Check the API requests:
   - ✅ Should see: `https://api.menupi.com/login`
   - ✅ Should see: `https://api.menupi.com/screens`
   - ❌ Should NOT see: `https://api.menupi.com/api/screens`

---

## 📝 Why This Happened

- The old JavaScript bundle was cached by your browser
- Even though we fixed the code, the browser kept using the old bundle
- The new deployment has the fix, but you need to clear cache to get it

---

**Status:** ✅ New code deployed - Just need to clear browser cache!

