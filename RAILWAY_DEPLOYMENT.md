# Railway Deployment Guide for MENUPI

This guide walks you through deploying the MENUPI backend API to Railway.

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. GitHub repository connected to Railway
3. Domain configured (api.menupi.com)

## Step 1: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `menupi---digital-signage` repository
5. Railway will auto-detect it's a Node.js project

## Step 2: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will provision a MySQL database
4. Note the connection details (you'll need them for environment variables)

## Step 3: Run Database Migrations

### Option A: Using Railway MySQL Service (Recommended)

1. In Railway, go to your MySQL service
2. Click **"Connect"** → **"MySQL Shell"**
3. Run the migrations in order:

```sql
-- First, run the base schema
SOURCE database.sql;

-- Then run migrations in order
SOURCE migrate-hardware-tvs.sql;
SOURCE migrate-add-ip-tracking.sql;
SOURCE migrate-plan-requests.sql;
SOURCE migrate-manual-android-tvs.sql;
SOURCE migrate-tv-deduplication.sql;
```

### Option B: Using Local MySQL Client

1. Get MySQL connection string from Railway (click "Connect" → "Private Networking")
2. Run the setup script:

```bash
DB_HOST=your-railway-mysql-host \
DB_USER=your-railway-mysql-user \
DB_PASSWORD=your-railway-mysql-password \
DB_NAME=railway \
./railway-setup.sh
```

## Step 4: Configure Environment Variables

In your Railway project, go to **"Variables"** and add:

### Required Variables

```env
# Database (from Railway MySQL service)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}

# API Configuration
API_URL=https://api.menupi.com
PROTOCOL=https
DOMAIN=api.menupi.com
PORT=3002

# Security (GENERATE A STRONG RANDOM STRING)
JWT_SECRET=your-strong-random-secret-key-minimum-32-characters

# Environment
NODE_ENV=production
```

### Optional Variables

```env
# Gemini AI (optional)
GEMINI_API_KEY=your-gemini-api-key
```

**Important:** Generate a strong `JWT_SECRET`:
```bash
# Generate a secure random string
openssl rand -base64 32
```

## Step 5: Configure Build Settings

Railway will auto-detect Node.js, but verify:

1. Go to **"Settings"** → **"Build"**
2. Ensure:
   - **Build Command**: `npm install` (or leave empty for auto-detect)
   - **Start Command**: `npm run server` (or `node server.js`)

## Step 6: Configure Custom Domain

1. In Railway, go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** to get a Railway domain first (for testing)
3. Click **"Custom Domain"** → **"Add Domain"**
4. Enter: `api.menupi.com`
5. Follow DNS instructions to point your domain to Railway

### DNS Configuration

Add a CNAME record:
```
Type: CNAME
Name: api
Value: [your-railway-domain].railway.app
TTL: 3600
```

## Step 7: Deploy

1. Railway will automatically deploy on every push to your main branch
2. Or click **"Deploy"** → **"Redeploy"** to trigger a manual deployment
3. Check **"Deployments"** tab for build logs

## Step 8: Verify Deployment

1. Check Railway logs for:
   ```
   ✅ Database connected successfully
   🚀 API Server running on port 3002
   📡 API Base URL: https://api.menupi.com
   ```

2. Test API endpoint:
   ```bash
   curl https://api.menupi.com/api/health
   ```

3. Verify CORS is working (should allow menupi.com subdomains)

## Step 9: Configure File Storage

Railway provides ephemeral storage. For production, consider:

1. **Railway Volumes** (persistent storage):
   - Go to **"+ New"** → **"Volume"**
   - Mount to `/uploads` directory
   - Files will persist across deployments

2. **Cloud Storage** (recommended for production):
   - Use AWS S3, Google Cloud Storage, or Cloudflare R2
   - Update `server.js` to use cloud storage instead of local filesystem

## Troubleshooting

### Database Connection Issues

- Verify environment variables are set correctly
- Check Railway MySQL service is running
- Ensure `DB_HOST` uses Railway's private networking (if available)

### Build Failures

- Check Node.js version (Railway auto-detects, but you can specify in `package.json`)
- Verify all dependencies are in `package.json`
- Check build logs in Railway dashboard

### CORS Errors

- Verify `api.menupi.com` is set as custom domain
- Check CORS configuration in `server.js` allows `menupi.com` subdomains
- Ensure frontend uses `VITE_API_BASE_URL=https://api.menupi.com`

### Port Issues

- Railway automatically assigns a port via `PORT` environment variable
- Your code should use `process.env.PORT || 3002`
- Railway handles port mapping automatically

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_HOST` | Yes | MySQL host from Railway | `containers-us-west-xxx.railway.app` |
| `DB_USER` | Yes | MySQL user from Railway | `root` |
| `DB_PASSWORD` | Yes | MySQL password from Railway | `[auto-generated]` |
| `DB_NAME` | Yes | MySQL database name | `railway` |
| `JWT_SECRET` | Yes | Secret for JWT tokens | `[generate with openssl]` |
| `API_URL` | Yes | Your API domain | `https://api.menupi.com` |
| `PROTOCOL` | Yes | Protocol for API | `https` |
| `DOMAIN` | Yes | API domain | `api.menupi.com` |
| `NODE_ENV` | Yes | Environment | `production` |
| `PORT` | Auto | Port (Railway sets this) | `3002` |
| `GEMINI_API_KEY` | No | Gemini AI API key | `[optional]` |

## Next Steps

After Railway backend is deployed:

1. ✅ Deploy frontend to Vercel (3 projects):
   - `tv.menupi.com` → Public Player
   - `app.menupi.com` → Dashboard
   - `portal.menupi.com` → Admin Portal

2. ✅ Set `VITE_API_BASE_URL=https://api.menupi.com` in all Vercel projects

3. ✅ Test end-to-end:
   - TV registration
   - Screen assignment
   - Media upload
   - User authentication

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check Railway logs for detailed error messages

