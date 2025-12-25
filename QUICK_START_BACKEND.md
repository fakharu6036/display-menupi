# 🚀 Quick Start: Local Backend Server

## Current Status

✅ **Dependencies installed**  
✅ **.env file created** (needs your database credentials)  
⏳ **MySQL setup needed**  
⏳ **Database migrations needed**

## Step 1: Configure Database Credentials

Edit `.env` file with your MySQL credentials:

```bash
nano .env
# or
code .env
```

Update these values:
```env
DB_HOST=localhost
DB_USER=root                    # Your MySQL username
DB_PASSWORD=your_password      # Your MySQL password (leave empty if no password)
DB_NAME=menupi_db              # Database name
```

## Step 2: Start MySQL (if not running)

```bash
# Check if MySQL is running
brew services list | grep mysql

# Start MySQL
brew services start mysql

# Or if not using brew:
sudo systemctl start mysql  # Linux
# Windows: Start MySQL from Services
```

## Step 3: Create Database

```bash
# Option 1: With password
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS menupi_db;"

# Option 2: Without password
mysql -u root -e "CREATE DATABASE IF NOT EXISTS menupi_db;"
```

## Step 4: Run Database Migrations

```bash
# With password
mysql -u root -p menupi_db < migrations_all.sql

# Without password
mysql -u root menupi_db < migrations_all.sql
```

## Step 5: Start Backend Server

```bash
npm run server:api
```

**Expected output:**
```
============================================================
🚀 MENUPI API Server
============================================================
📡 Port: 3002
🌐 Base URL: http://localhost:3002
✅ Database connected
✅ Tables ready
============================================================
```

## Step 6: Test Server

Open a new terminal and test:

```bash
# Test root endpoint
curl http://localhost:3002/

# Test health endpoint
curl http://localhost:3002/api/health
```

## Troubleshooting

### "Database configuration missing"

**Solution:** Edit `.env` file with correct MySQL credentials.

### "Access denied for user"

**Solution:** 
- Check MySQL username/password in `.env`
- Try: `mysql -u root -p` to test credentials

### "Unknown database 'menupi_db'"

**Solution:** Create database first (Step 3).

### "Port 3002 already in use"

**Solution:**
```bash
# Find process using port 3002
lsof -i :3002

# Kill process
kill -9 <PID>
```

### MySQL not running

**Solution:**
```bash
# Start MySQL
brew services start mysql

# Check status
brew services list | grep mysql
```

## Next Steps

Once backend is running:

1. **Expose to internet** (for Vercel frontend):
   ```bash
   ngrok http 3002
   ```

2. **Update Vercel environment variable:**
   - `VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io`

3. **Deploy frontend to Vercel**

See `LOCAL_BACKEND_SETUP.md` for detailed instructions.

---

**Status**: ⏳ **Waiting for database setup**  
**Next**: Configure `.env` and run migrations

