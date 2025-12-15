# 🚀 Fly.io Deployment Guide for MENUPI API

## Prerequisites
1. Fly.io account: https://fly.io
2. Fly CLI installed: `curl -L https://fly.io/install.sh | sh`
3. Logged in: `fly auth login`

## Quick Deploy

```bash
cd menupi-api
fly launch
```

When prompted:
- **App name:** `display-menupi` (or your preferred name)
- **Region:** Choose closest to your users (e.g., `iad` for US East)
- **Postgres:** No (we're using external MySQL)
- **Redis:** No

## Manual Deploy

```bash
# 1. Navigate to API folder
cd menupi-api

# 2. Create app (if not exists)
fly apps create display-menupi

# 3. Set environment variables
fly secrets set \
  DB_HOST=your_mysql_host \
  DB_USER=your_db_user \
  DB_PASSWORD=your_db_password \
  DB_NAME=your_db_name \
  JWT_SECRET=your_jwt_secret \
  ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com \
  NODE_ENV=production

# 4. Deploy
fly deploy

# 5. Set custom domain
fly certs add api.menupi.com
```

## Environment Variables

Set these in Fly.io dashboard or via CLI:

```bash
fly secrets set DB_HOST=your_mysql_host
fly secrets set DB_USER=your_db_user
fly secrets set DB_PASSWORD=your_db_password
fly secrets set DB_NAME=your_db_name
fly secrets set JWT_SECRET=your_jwt_secret_minimum_32_chars
fly secrets set ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
fly secrets set NODE_ENV=production
```

## Verify Deployment

```bash
# Check status
fly status

# View logs
fly logs

# Test health endpoint
curl https://api.menupi.com/api/health
```

## Custom Domain Setup

1. Add domain in Fly.io dashboard: Settings → Domains
2. Or via CLI: `fly certs add api.menupi.com`
3. Update DNS:
   - Type: `A` or `CNAME`
   - Value: Fly.io provided IP or hostname
   - TTL: 3600

## Troubleshooting

### Check logs
```bash
fly logs
```

### SSH into machine
```bash
fly ssh console
```

### Restart app
```bash
fly apps restart display-menupi
```

### Scale resources
```bash
fly scale vm shared-cpu-1x --memory 1024
```

## Notes

- Fly.io automatically handles HTTPS
- Port is set via `PORT` env var (defaults to 3001)
- Health check endpoint: `/api/health`
- Uploads directory is created automatically
- Database must be accessible from Fly.io IPs

