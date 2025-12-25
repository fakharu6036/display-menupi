# Quick Fix for .env.local Format

## 🚀 One-Command Fix

Run this to automatically format your `.env.local`:

```bash
./fix-env-format.sh
```

## 📋 What It Does

The script will:
1. ✅ Create a backup of your `.env.local`
2. ✅ Add `VITE_` prefix to frontend variables
3. ✅ Remove `VITE_` prefix from backend variables
4. ✅ Convert all keys to uppercase
5. ✅ Preserve your values

## 📝 Correct Format

### Frontend Variables (Must have `VITE_` prefix)

```env
VITE_API_BASE_URL=https://api.menupi.com
VITE_GEMINI_API_KEY=your-key-here
VITE_PORT=3000
```

### Backend Variables (No prefix)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u859590789_disys
JWT_SECRET=your-secret-key
API_URL=https://api.menupi.com
PROTOCOL=https
DOMAIN=api.menupi.com
PORT=3002
GEMINI_API_KEY=your-key-here
NODE_ENV=production
```

## 🔍 Current Issue

I see you have:
```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

This needs to be:
- **For frontend**: `VITE_GEMINI_API_KEY=PLACEHOLDER_API_KEY`
- **For backend**: `GEMINI_API_KEY=PLACEHOLDER_API_KEY` (keep as-is)

If you use Gemini in both frontend and backend, add both:
```env
VITE_GEMINI_API_KEY=PLACEHOLDER_API_KEY
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

## ✅ After Running the Script

1. Review the formatted `.env.local`
2. Add any missing variables (see `.env.local.example`)
3. Replace placeholder values with real credentials
4. Test locally:
   ```bash
   npm run dev:dashboard  # Frontend
   npm run server:api     # Backend
   ```

## 📚 Full Guide

See `ENV_FORMAT_GUIDE.md` for complete documentation.

---

**Run**: `./fix-env-format.sh` to format your file now!

