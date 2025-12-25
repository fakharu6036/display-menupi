# Environment Variables Format Guide

## 📋 Correct Format

### Frontend Variables (Vite)

**MUST start with `VITE_` prefix** to be accessible in the browser:

```env
# ✅ CORRECT
VITE_API_BASE_URL=https://api.menupi.com
VITE_API_URL=https://api.menupi.com
VITE_PORT=3000
VITE_GEMINI_API_KEY=your-key

# ❌ WRONG (won't work in browser)
API_BASE_URL=https://api.menupi.com
API_URL=https://api.menupi.com
PORT=3000
```

### Backend Variables (Node.js)

**NO prefix** - accessed via `process.env.VARIABLE_NAME`:

```env
# ✅ CORRECT
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u859590789_disys
JWT_SECRET=your-secret
API_URL=https://api.menupi.com
PROTOCOL=https
DOMAIN=api.menupi.com
PORT=3002
GEMINI_API_KEY=your-key

# ❌ WRONG (won't work in server.js)
VITE_DB_HOST=localhost
VITE_JWT_SECRET=your-secret
```

## 🔧 Quick Fix

Run the formatter script:

```bash
./format-env.sh
```

This will:
- ✅ Add `VITE_` prefix to frontend variables
- ✅ Keep backend variables without prefix
- ✅ Format all keys to uppercase
- ✅ Create a backup of your original file

## 📝 Complete .env.local Template

```env
# ============================================
# FRONTEND (Vite - must start with VITE_)
# ============================================

VITE_API_BASE_URL=https://api.menupi.com
VITE_PORT=3000

# ============================================
# BACKEND (Node.js - no prefix)
# ============================================

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u859590789_disys
JWT_SECRET=your-secret-key-here
API_URL=https://api.menupi.com
PROTOCOL=https
DOMAIN=api.menupi.com
PORT=3002
GEMINI_API_KEY=your-key-optional
```

## 🎯 Variable Reference

### Frontend Variables (Vite)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | Yes | API server URL | `https://api.menupi.com` |
| `VITE_API_URL` | No | Alternative API URL | `https://api.menupi.com` |
| `VITE_PORT` | No | Vite dev server port | `3000` |
| `VITE_GEMINI_API_KEY` | No | Gemini AI key | `your-key` |

### Backend Variables (Node.js)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_HOST` | Yes | MySQL host | `localhost` |
| `DB_USER` | Yes | MySQL user | `root` |
| `DB_PASSWORD` | Yes | MySQL password | `your_password` |
| `DB_NAME` | Yes | Database name | `u859590789_disys` |
| `JWT_SECRET` | Yes | JWT secret key | `your-secret` |
| `API_URL` | Yes | API base URL | `https://api.menupi.com` |
| `PROTOCOL` | Yes | Protocol | `https` |
| `DOMAIN` | Yes | API domain | `api.menupi.com` |
| `PORT` | No | Server port | `3002` |
| `GEMINI_API_KEY` | No | Gemini AI key | `your-key` |

## ⚠️ Common Mistakes

### ❌ Wrong: Missing VITE_ prefix

```env
API_BASE_URL=https://api.menupi.com  # Won't work in browser!
```

### ✅ Correct: With VITE_ prefix

```env
VITE_API_BASE_URL=https://api.menupi.com  # Works in browser!
```

### ❌ Wrong: Adding VITE_ to backend vars

```env
VITE_DB_HOST=localhost  # Won't work in server.js!
```

### ✅ Correct: No prefix for backend

```env
DB_HOST=localhost  # Works in server.js!
```

## 🔍 How to Check

### Frontend (Browser)

In browser console:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL)  // ✅ Works
console.log(import.meta.env.API_BASE_URL)      // ❌ undefined
```

### Backend (Node.js)

In server.js:
```javascript
console.log(process.env.DB_HOST)      // ✅ Works
console.log(process.env.VITE_DB_HOST) // ❌ undefined
```

## 🚀 Production Deployment

### Railway (Backend)

Set these in Railway Dashboard → Variables (NO VITE_ prefix):
```env
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
JWT_SECRET=...
API_URL=https://api.menupi.com
```

### Vercel (Frontend)

Set these in Vercel Dashboard → Environment Variables (WITH VITE_ prefix):
```env
VITE_API_BASE_URL=https://api.menupi.com
```

---

**Need help?** Run `./format-env.sh` to auto-format your `.env.local` file!

