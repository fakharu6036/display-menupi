# 🚀 Manual Deployment Instructions

## Current Status

✅ **Code fixed and pushed to GitHub**
- `index.css` file created
- Vite plugin copies it to `dist/` during build
- `vercel.json` simplified

## Deploy All 3 Projects

Run these commands in your terminal:

### 1. Deploy app.menupi.com (menupi-signage)

```bash
cd /Users/mdfakharuddin/Desktop/menupi---digital-signage
vercel link --project=menupi-signage --yes
vercel --prod
```

### 2. Deploy tv.menupi.com (display-menupi)

```bash
vercel link --project=display-menupi --yes
vercel --prod
```

### 3. Deploy portal.menupi.com (menupi-portal)

```bash
vercel link --project=menupi-portal --yes
vercel --prod
```

## What's Fixed

1. ✅ **index.css file exists** - Created empty CSS file
2. ✅ **Vite copies to dist** - Plugin copies `index.css` → `dist/index.css` during build
3. ✅ **vercel.json simplified** - Uses standard SPA rewrite pattern
4. ✅ **Static files served correctly** - Vercel automatically serves files in `dist/` before applying SPA rewrite

## Verification

After deployment, test:

```bash
# Test CSS file
curl -I https://portal.menupi.com/index.css
# Should return: Content-Type: text/css

# Test app
curl -I https://app.menupi.com
curl -I https://tv.menupi.com
curl -I https://portal.menupi.com
```

## Expected Results

- ✅ No more MIME type errors
- ✅ `/index.css` returns CSS (not HTML)
- ✅ All styles working correctly
- ✅ All 3 subdomains deployed

---

**Status**: ✅ **Ready to Deploy**  
**Action**: Run deployment commands above

