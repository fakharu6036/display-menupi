# Fix "Server Error" - Database Connection Issue

## The Problem
You're seeing "Server error" because the backend can't connect to MySQL database.

**Error:** `ECONNREFUSED` on port 3306

## Quick Solutions

### Option 1: Start Local MySQL (If you have it installed)

**macOS:**
```bash
brew services start mysql
# or
mysql.server start
```

**Linux:**
```bash
sudo systemctl start mysql
# or
sudo service mysql start
```

### Option 2: Use Hostinger Remote Database

If you're using the Hostinger database from `.env.local`, you may need to:

1. **Get the actual database host** from Hostinger control panel
2. **Update `.env` file**:
   ```env
   DB_HOST=your-actual-hostinger-host.com
   # Not localhost if it's remote
   ```

3. **Check if you need SSH tunnel**:
   ```bash
   ssh -L 3306:localhost:3306 user@hostinger-server
   ```

### Option 3: Install MySQL

**macOS with Homebrew:**
```bash
brew install mysql
brew services start mysql
```

**Then create database:**
```bash
mysql -u root -e "CREATE DATABASE u859590789_disys;"
mysql -u root u859590789_disys < database/schema.sql
```

### Option 4: Use Docker MySQL

```bash
docker run --name menupi-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=u859590789_disys \
  -p 3306:3306 \
  -d mysql:8.0

# Wait 10 seconds, then apply schema
mysql -h 127.0.0.1 -u root -proot u859590789_disys < database/schema.sql
```

## Test Database Connection

Run the test script:
```bash
node test-db-connection.js
```

This will show you exactly what's wrong.

## After Fixing Database

1. **Restart backend:**
   ```bash
   pkill -f "node server.js"
   node server.js
   ```

2. **Test registration:**
   - Go to http://localhost:3000/register
   - Should work now!

## Current Configuration

Your `.env` file is set to:
- Host: `localhost`
- Database: `u859590789_disys`
- User: `u859590789_disys`

If this is a remote Hostinger database, the host might need to be different.

## Check MySQL Status

**macOS:**
```bash
brew services list | grep mysql
```

**Linux:**
```bash
sudo systemctl status mysql
```

**Check if port 3306 is listening:**
```bash
lsof -i :3306
```

