# ✅ Use Production Domain Instead

## 🎯 Solution

**Don't use the preview URL!** Use your production domain instead:

- ❌ `https://menupi-signage-1mecq0knk-fakharu6036s-projects.vercel.app/login` (has protection)
- ✅ `https://app.menupi.com/login` (production domain, no protection)

---

## ✅ Your Production Domains

From Vercel configuration:
- ✅ **Dashboard/App:** `https://app.menupi.com`
- ✅ **TV Player:** `https://tv.menupi.com`

---

## 🚀 Use These URLs

### For Dashboard/Login:
- ✅ `https://app.menupi.com/login`
- ✅ `https://app.menupi.com/dashboard`
- ✅ `https://app.menupi.com/media`
- ✅ `https://app.menupi.com/screens`

### For TV Player:
- ✅ `https://tv.menupi.com/[CODE]` (clean URL)
- ✅ `https://app.menupi.com/tv/[CODE]` (with prefix)

---

## 🔍 Why Preview URL Doesn't Work

The preview URL (`menupi-signage-1mecq0knk...vercel.app`) has:
- ⚠️ Vercel Deployment Protection enabled
- ⚠️ Requires authentication to access
- ⚠️ Not meant for public use

**Solution:** Use `app.menupi.com` instead - it's your production domain!

---

## ✅ Test Production Domain

```bash
# Test login page
curl -I https://app.menupi.com/login

# Should return 200 (not 401)
```

---

**Use `https://app.menupi.com/login` - it should work without authentication!**

