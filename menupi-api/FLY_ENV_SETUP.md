# 🔐 Fly.io Environment Variables Setup

## Where to Add .env Variables in Fly.io

Fly.io doesn't use `.env` files. Instead, you set environment variables (secrets) in two ways:

### Option 1: Fly.io Dashboard (Easiest)

1. Go to: https://fly.io/apps/display-menupi
2. Click **Settings** tab
3. Scroll to **Secrets** section
4. Click **Add Secret**
5. Add each variable one by one:

```
DB_HOST = your_mysql_host
DB_USER = your_database_user
DB_PASSWORD = your_database_password
DB_NAME = your_database_name
JWT_SECRET = your_super_secret_jwt_key_minimum_32_characters_long
ALLOWED_ORIGINS = https://app.menupi.com,https://tv.menupi.com
NODE_ENV = production
```

### Option 2: Fly CLI (Command Line)

```bash
# Navigate to API folder
cd menupi-api

# Set all secrets at once
fly secrets set \
  DB_HOST=your_mysql_host \
  DB_USER=your_database_user \
  DB_PASSWORD=your_database_password \
  DB_NAME=your_database_name \
  JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long \
  ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com \
  NODE_ENV=production
```

### Option 3: Set Individually

```bash
fly secrets set DB_HOST=your_mysql_host
fly secrets set DB_USER=your_database_user
fly secrets set DB_PASSWORD=your_database_password
fly secrets set DB_NAME=your_database_name
fly secrets set JWT_SECRET=your_jwt_secret
fly secrets set ALLOWED_ORIGINS=https://app.menupi.com,https://tv.menupi.com
fly secrets set NODE_ENV=production
```

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL hostname | `your-db.hostinger.com` |
| `DB_USER` | Database username | `u859590789_menupi` |
| `DB_PASSWORD` | Database password | `your_password` |
| `DB_NAME` | Database name | `u859590789_menupi` |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | Generate with: `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://app.menupi.com,https://tv.menupi.com` |
| `NODE_ENV` | Environment | `production` |

## Generate JWT Secret

```bash
# Generate a secure JWT secret
openssl rand -hex 32
```

Or use this online tool: https://randomkeygen.com/

## Verify Secrets

```bash
# List all secrets (values are hidden)
fly secrets list
```

## Update Secrets

```bash
# Update a secret
fly secrets set DB_PASSWORD=new_password
```

## Important Notes

- ✅ Secrets are encrypted and secure
- ✅ Never commit `.env` files to GitHub
- ✅ Secrets are available as `process.env.VARIABLE_NAME` in your app
- ✅ Changes take effect after next deployment
- ✅ Secrets are per-app, not per-region

## After Setting Secrets

```bash
# Redeploy to apply changes
fly deploy
```

## Troubleshooting

If your app can't connect to the database:
1. Check database host allows connections from Fly.io IPs
2. Verify all secrets are set: `fly secrets list`
3. Check logs: `fly logs`
4. Test connection: SSH into app and test

