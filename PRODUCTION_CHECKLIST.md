# MENUPI Digital Signage - Production Deployment Checklist

## Quick Reference Checklist

### ✅ Database Setup
- [ ] MySQL database `menupi_db` created
- [ ] Database user `menupi_user` created with proper permissions
- [ ] Schema applied: `mysql -u menupi_user -p menupi_db < database/schema.sql`
- [ ] Foreign keys verified: `SELECT @@foreign_key_checks;` (should return 1)
- [ ] Test connection: `mysql -u menupi_user -p menupi_db`

### ✅ Backend Configuration
- [ ] Backend dependencies installed: `npm install` (in project root)
- [ ] `.env` file created from `env.example`
- [ ] Database credentials configured in `.env`
- [ ] `JWT_SECRET` generated: `openssl rand -base64 32`
- [ ] `FRONTEND_URL` set to production domain
- [ ] `GOOGLE_CLIENT_ID` configured
- [ ] `uploads/` directory created with proper permissions
- [ ] Backend tested: `node server.js` (should start without errors)

### ✅ Frontend Configuration
- [ ] Frontend dependencies installed: `npm install`
- [ ] Frontend `.env` created with:
  - `VITE_API_URL=https://yourdomain.com/api`
  - `VITE_GOOGLE_CLIENT_ID=your_client_id`
- [ ] Production build created: `npm run build`
- [ ] Build output verified in `dist/` directory

### ✅ Google OAuth
- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origins: `https://yourdomain.com`
- [ ] Client ID added to backend `.env`: `GOOGLE_CLIENT_ID`
- [ ] Client ID added to frontend `.env`: `VITE_GOOGLE_CLIENT_ID`

### ✅ PM2 Setup
- [ ] PM2 installed globally: `npm install -g pm2`
- [ ] `logs/` directory created
- [ ] Application started: `pm2 start ecosystem.config.js --env production`
- [ ] PM2 saved: `pm2 save`
- [ ] PM2 startup configured: `pm2 startup` (follow instructions)
- [ ] Status verified: `pm2 status` (should show online)

### ✅ Nginx Configuration
- [ ] Nginx installed: `sudo apt install nginx`
- [ ] Configuration file copied: `sudo cp nginx/menupi.conf /etc/nginx/sites-available/menupi`
- [ ] Configuration updated with:
  - Domain name
  - Frontend build path (`/var/www/menupi`)
  - Uploads directory path
- [ ] Site enabled: `sudo ln -s /etc/nginx/sites-available/menupi /etc/nginx/sites-enabled/`
- [ ] Configuration tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

### ✅ SSL Certificate
- [ ] Certbot installed: `sudo apt install certbot python3-certbot-nginx`
- [ ] Domain DNS points to server
- [ ] Certificate obtained: `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`

### ✅ File Deployment
- [ ] Frontend files copied: `sudo cp -r dist/* /var/www/menupi/`
- [ ] Permissions set: `sudo chown -R www-data:www-data /var/www/menupi`
- [ ] Uploads directory accessible: `chmod 755 uploads`

### ✅ Feature Verification

#### Authentication
- [ ] Email/Password registration works
- [ ] Email/Password login works
- [ ] Google OAuth login works
- [ ] JWT tokens stored in localStorage
- [ ] Protected routes require authentication

#### Media Management
- [ ] Image upload (JPEG, PNG, GIF) works
- [ ] Video upload (MP4) works
- [ ] PDF upload works
- [ ] File size validation (max 50MB) works
- [ ] File type validation works
- [ ] Media deletion works
- [ ] Media URLs accessible via `/uploads/`

#### Screen Management
- [ ] Create new screen generates 6-digit code
- [ ] Screen code is unique
- [ ] Edit screen details works
- [ ] Add media to playlist works
- [ ] Reorder playlist items works
- [ ] Delete screen works (cascades to screen_media)

#### Scheduling
- [ ] Create daily schedule works
- [ ] Create weekly schedule works
- [ ] Create monthly schedule works
- [ ] Create one-time schedule works
- [ ] Delete schedule works

#### TV Player
- [ ] TV login page accessible: `https://yourdomain.com/tv`
- [ ] 6-digit code entry works
- [ ] Public player loads: `https://yourdomain.com/tv/{CODE}`
- [ ] Playlist displays correctly
- [ ] Media plays (images, videos, PDFs)
- [ ] Playlist polls for updates every 60 seconds
- [ ] Screen not found error displays correctly

#### Super Admin
- [ ] Super admin can access `/admin` route
- [ ] Admin dashboard displays
- [ ] System stats visible

### ✅ Security Verification
- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Database user restricted to localhost
- [ ] CORS configured for frontend domain only
- [ ] File upload validation working
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers in Nginx config

### ✅ Performance & Monitoring
- [ ] PM2 logs accessible: `pm2 logs menupi-api`
- [ ] Nginx logs accessible: `/var/log/nginx/`
- [ ] Database backup script created
- [ ] Monitoring setup (optional: PM2 monitoring, uptime checks)

### ✅ Final Steps
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured (if applicable)
- [ ] Backup strategy in place

---

## Quick Commands Reference

```bash
# Database
mysql -u menupi_user -p menupi_db < database/schema.sql

# Backend
pm2 start ecosystem.config.js --env production
pm2 logs menupi-api
pm2 restart menupi-api

# Frontend
npm run build
sudo cp -r dist/* /var/www/menupi/

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot renew --dry-run
```

---

## Troubleshooting Quick Fixes

**Backend won't start:**
- Check `.env` file exists and has correct values
- Verify database connection
- Check PM2 logs: `pm2 logs menupi-api`

**CORS errors:**
- Verify `FRONTEND_URL` in backend `.env` matches domain
- Check Nginx proxy headers

**File upload fails:**
- Check `uploads/` directory permissions
- Verify `MAX_FILE_SIZE` in `.env`
- Check Nginx `client_max_body_size` setting

**TV player not loading:**
- Verify public endpoint: `/api/public/screen/{CODE}`
- Check screen code exists in database
- Verify media URLs are accessible

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Status:** ☐ Ready for Production

