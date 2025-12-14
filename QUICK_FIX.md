# Quick Fix: "Failed to fetch" / Can't Register

## Problem
Registration fails with "Failed to fetch" or empty error because MySQL database is not running.

## Solution

### Step 1: Install MySQL (if not installed)

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Or download from:** https://dev.mysql.com/downloads/mysql/

### Step 2: Create Database

```bash
# Connect to MySQL (no password if fresh install)
mysql -u root

# In MySQL prompt:
CREATE DATABASE menupi_db;
EXIT;
```

### Step 3: Apply Database Schema

```bash
mysql -u root menupi_db < database/schema.sql
```

### Step 4: Update .env File

Make sure `.env` has:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=menupi_db
```

(Leave password empty if you didn't set one)

### Step 5: Restart Backend

```bash
# Kill current server
pkill -f "node server.js"

# Start again
node server.js
```

### Step 6: Test Registration

Go to http://localhost:3000/register and try again!

---

## Alternative: Use Docker MySQL

If you have Docker:

```bash
docker run --name menupi-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=menupi_db \
  -p 3306:3306 \
  -d mysql:8.0

# Wait 10 seconds for MySQL to start, then:
mysql -h 127.0.0.1 -u root -proot menupi_db < database/schema.sql

# Update .env:
# DB_PASSWORD=root
```

Then restart the backend server.

