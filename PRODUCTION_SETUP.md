# Production Deployment Guide

This application is configured to run on multiple subdomains:

- **Dashboard**: `app.menupi.com`
- **TV Player**: `tv.menupi.com/[code]`
- **Admin Portal**: `portal.menupi.com`
- **API Server**: `api.menupi.com` (or same domain as dashboard)

## Environment Configuration

### Frontend (Vite)

Create a `.env` file in the root directory:

```env
# API Configuration
# Set to your API server URL (e.g., https://api.menupi.com)
# Leave empty to auto-detect based on domain
VITE_API_URL=https://api.menupi.com
```

### Backend (Node.js/Express)

Create a `.env` file in the root directory:

```env
# API Server Configuration
API_URL=https://api.menupi.com
PROTOCOL=https
DOMAIN=api.menupi.com

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u859590789_disys

# JWT Secret (generate a strong random string)
JWT_SECRET=your-strong-random-secret-key-here

# Node Environment
NODE_ENV=production
```

## Domain Detection

The application automatically detects the domain and configures URLs accordingly:

### Production (menupi.com subdomains)
- **API Base**: Automatically uses `https://api.menupi.com`
- **TV Player Links**: Automatically use `https://tv.menupi.com/[code]`
- **Dashboard Links**: Automatically use `https://app.menupi.com`
- **Admin Links**: Automatically use `https://portal.menupi.com`

### Development (localhost)
- **API Base**: Uses `http://localhost:3001`
- **TV Player Links**: Uses `http://localhost:3000/tv/[code]`
- **Dashboard Links**: Uses `http://localhost:3000`
- **Admin Links**: Uses `http://localhost:3000/admin`

## CORS Configuration

The server is configured to allow requests from:
- All `menupi.com` subdomains (production)
- `localhost` and `127.0.0.1` (development)

## File Serving

Uploaded files are served from the API server. The base URL is automatically configured:
- **Production**: `https://api.menupi.com/uploads/...`
- **Development**: `http://localhost:3001/uploads/...`

## Deployment Steps

1. **Set up environment variables** for both frontend and backend
2. **Build the frontend**:
   ```bash
   npm run build
   ```
3. **Deploy frontend** to your hosting service (e.g., Vercel, Netlify, or your own server)
   - Configure routing to serve `index.html` for all routes (SPA routing)
4. **Deploy backend** to your API server
   - Ensure Node.js and MySQL are running
   - Set up PM2 or similar process manager
5. **Configure DNS**:
   - Point `app.menupi.com` to dashboard frontend
   - Point `tv.menupi.com` to TV player frontend (can be same as dashboard)
   - Point `portal.menupi.com` to admin frontend (can be same as dashboard)
   - Point `api.menupi.com` to API backend server
6. **Set up SSL certificates** for all subdomains (HTTPS required in production)

## Notes

- The TV player (`tv.menupi.com`) can be deployed separately or as part of the main app
- All subdomains can share the same frontend build if using path-based routing
- The API server must be accessible from all frontend subdomains
- Ensure CORS is properly configured for cross-subdomain requests

