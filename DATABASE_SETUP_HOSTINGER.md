# Hostinger Database Setup

## Current Configuration
Your `.env` file is now configured to use the Hostinger database from `.env.local`:
- Database: `u859590789_disys`
- User: `u859590789_disys`
- Host: `localhost` (may need to change if remote)

## Connection Issue: ECONNREFUSED

The connection is being refused. This could mean:

### Option 1: Remote Database (Most Likely)
Hostinger databases are usually remote. You may need to:

1. **Get the actual database host** from Hostinger control panel
   - Usually something like: `mysql.hostinger.com` or `185.xxx.xxx.xxx`
   
2. **Update .env file**:
   ```env
   DB_HOST=your-actual-hostinger-host.com
   DB_PORT=3306
   DB_USER=u859590789_disys
   DB_PASSWORD=hF~awOpY=0y
   DB_NAME=u859590789_disys
   ```

3. **Check Hostinger firewall** - Make sure your IP is whitelisted

### Option 2: SSH Tunnel (If using localhost)
If you have an SSH tunnel set up:
```bash
# Make sure SSH tunnel is running
ssh -L 3306:localhost:3306 user@hostinger-server.com
```

### Option 3: Local MySQL (If database is local)
If the database should be on your local machine:

1. **Start MySQL**:
   ```bash
   brew services start mysql
   # or
   mysql.server start
   ```

2. **Verify database exists**:
   ```bash
   mysql -u u859590789_disys -p'hF~awOpY=0y' -e "SHOW DATABASES;"
   ```

## Test Connection

Run the test script:
```bash
node test-db-connection.js
```

This will show you exactly what's wrong with the connection.

## Apply Schema (Once Connected)

Once the connection works, apply the schema:
```bash
mysql -h [HOST] -u u859590789_disys -p'hF~awOpY=0y' u859590789_disys < database/schema.sql
```

Or if using the Node.js connection:
```bash
# The schema will be applied automatically on first use, or you can use a migration tool
```

## Quick Fix: Check Hostinger Panel

1. Log into Hostinger control panel
2. Go to Databases → MySQL Databases
3. Find your database `u859590789_disys`
4. Check the **Host** field - it might not be `localhost`
5. Update `.env` with the correct host

## Alternative: Use Local Database for Development

If you want to use a local database for development:

1. **Create local database**:
   ```bash
   mysql -u root -e "CREATE DATABASE menupi_db;"
   mysql -u root menupi_db < database/schema.sql
   ```

2. **Update .env**:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=menupi_db
   ```

3. **Restart backend**:
   ```bash
   pkill -f "node server.js"
   node server.js
   ```

