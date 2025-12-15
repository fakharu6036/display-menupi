# 🚀 Deploy to Vercel - Complete Guide

## ✅ Pre-Deployment Checklist

- [x] All code committed to GitHub
- [x] `vercel.json` configured
- [x] Build configuration verified
- [x] Routing configured for both URL formats

---

## 📋 Step 1: Connect Repository to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/new
2. **Import Git Repository:**
   - Select your GitHub repository: `fakharu6036/display-menupi`
   - Click **Import**

3. **Configure Project:**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Click Deploy** (don't add environment variables yet - we'll do that after)

---

## ⚙️ Step 2: Configure Environment Variables

**After first deployment, go to:**
**Settings → Environment Variables**

### Add These Variables:

#### For Production:
```
VITE_API_URL = https://api.menupi.com/api
```

#### For Preview (optional):
```
VITE_API_URL = https://api.menupi.com/api
```

#### For Development (optional):
```
VITE_API_URL = http://localhost:3001/api
```

**Important:**
- ✅ Select **Production**, **Preview**, and **Development** for each variable
- ✅ Click **Save**
- ✅ **Redeploy** after adding variables (Vercel will prompt you)

---

## 🌐 Step 3: Configure Custom Domains

### 3.1 Add Main Domain (app.menupi.com)

1. **Go to:** Project → **Settings** → **Domains**
2. **Add Domain:** `app.menupi.com`
3. **Follow DNS Instructions:**
   - Vercel will show you DNS records to add
   - Add the CNAME or A record to your DNS provider
   - Wait for DNS propagation (5-30 minutes)

### 3.2 Add TV Subdomain (tv.menupi.com)

1. **In same Domains section**
2. **Add Domain:** `tv.menupi.com`
3. **Follow DNS Instructions:**
   - Add CNAME record: `tv` → `cname.vercel-dns.com`
   - Or use Vercel's provided DNS records
   - Wait for DNS propagation

### 3.3 Optional: Add Root Domain (menupi.com)

1. **Add Domain:** `menupi.com`
2. **Follow DNS Instructions:**
   - Add A record or CNAME as instructed
   - This allows `menupi.com/tv/[code]` to work

---

## 🔄 Step 4: Redeploy After DNS

Once DNS is configured:

1. **Go to:** Project → **Deployments**
2. **Click** the three dots on latest deployment
3. **Click "Redeploy"**
4. **Wait for build to complete**

---

## ✅ Step 5: Verify Deployment

### Test Main Domain:
- [ ] `https://app.menupi.com` → Dashboard loads
- [ ] `https://app.menupi.com/login` → Login page works
- [ ] `https://app.menupi.com/dashboard` → Dashboard works

### Test TV Routes:
- [ ] `https://app.menupi.com/tv/[CODE]` → TV player loads
- [ ] `https://tv.menupi.com/[CODE]` → TV player loads (cleaner URL)
- [ ] `https://menupi.com/tv/[CODE]` → TV player loads (if root domain added)

### Test API Connection:
- [ ] Open browser console on dashboard
- [ ] Check network tab - API calls go to `https://api.menupi.com/api`
- [ ] No CORS errors
- [ ] No localhost references

---

## 🐛 Troubleshooting

### Build Fails

**Error: Module not found**
- Check `package.json` has all dependencies
- Run `npm install` locally to verify
- Check Node.js version (Vercel uses Node 18+ by default)

**Error: Build command failed**
- Check `vite.config.ts` is correct
- Verify `vercel.json` buildCommand matches `package.json` scripts

### Domain Not Working

**DNS not propagated:**
- Wait 5-30 minutes
- Check DNS with: `nslookup app.menupi.com`
- Verify DNS records match Vercel instructions

**SSL Certificate:**
- Vercel automatically provisions SSL
- Wait 1-5 minutes after DNS propagation
- Check SSL status in Vercel dashboard

### Routing Issues

**404 on refresh:**
- Verify `vercel.json` has rewrite rule: `"source": "/(.*)", "destination": "/index.html"`
- This is already configured ✅

**TV subdomain not working:**
- Verify `tv.menupi.com` is added in Vercel domains
- Check DNS records are correct
- Verify `TvSubdomainRoute` component is working

### API Connection Issues

**CORS errors:**
- Verify `VITE_API_URL` is set correctly
- Check API server allows `app.menupi.com` and `tv.menupi.com`
- Verify API is running on `https://api.menupi.com`

**API calls fail:**
- Check `VITE_API_URL` environment variable
- Verify API server is accessible
- Check browser console for errors

---

## 📝 Environment Variables Reference

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://api.menupi.com/api` | ✅ Yes |

**Note:** All `VITE_*` variables are exposed to the browser. Never put secrets here.

---

## 🔐 Security Headers

Already configured in `vercel.json`:
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`

---

## 📊 Deployment Status

After deployment, check:
- ✅ Build logs show no errors
- ✅ All routes accessible
- ✅ Environment variables loaded
- ✅ Custom domains active
- ✅ SSL certificates active

---

## 🎯 Quick Deploy Commands

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or link project and deploy
vercel link
vercel deploy --prod
```

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html#vercel
- **Custom Domains:** https://vercel.com/docs/concepts/projects/domains

---

## ✅ Deployment Complete!

Once all steps are done:
- ✅ Frontend deployed to Vercel
- ✅ Custom domains configured
- ✅ Environment variables set
- ✅ Both URL formats working:
  - `app.menupi.com/tv/[code]`
  - `tv.menupi.com/[code]`

**Your app is live! 🎉**

---

**Last Updated:** After commit `9f3a2d0`
**Status:** Ready for deployment

