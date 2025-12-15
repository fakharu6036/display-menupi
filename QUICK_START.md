# 🚀 Quick Start - Fix Mixed Content Errors

## ✅ All Code Changes Complete!

Everything has been fixed and pushed to GitHub. You just need to:

## 1️⃣ Restart Backend Server (REQUIRED)

```bash
# If using PM2
pm2 restart menupi-api

# Or restart your Node.js server
```

## 2️⃣ Set Environment Variable (If Not Set)

Add to your `.env` file or server environment:

```bash
API_URL=https://api.menupi.com
# OR
NODE_ENV=production
```

## 3️⃣ Wait for Vercel (2-5 minutes)

Vercel will auto-deploy. Check: https://vercel.com → Your Project → Deployments

## 4️⃣ Clear Browser Cache

Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

---

## ✅ That's It!

After these steps:
- ✅ All uploads go to Hostinger server
- ✅ All URLs use `https://api.menupi.com/uploads/...`
- ✅ No more mixed content errors
- ✅ Images load correctly

---

**Need help?** See `DEPLOYMENT_CHECKLIST.md` for detailed troubleshooting.

