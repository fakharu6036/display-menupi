# Database Setup for Local Development

## The Issue
The backend is running but can't connect to MySQL database. Error: `ECONNREFUSED`

## Quick Fix Options

### Option 1: Install and Start MySQL (Recommended)

#### macOS with Homebrew:
```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Or start manually
mysql.server start

# Set root password (optional, press Enter for no password)
mysql_secure_installation
```

#### macOS with MySQL Installer:
1. Download MySQL from https://dev.mysql.com/downloads/mysql/
2. Install the package
3. Start MySQL from System Preferences or:
```bash
sudo /usr/local/mysql/support-files/mysql.server start
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Option 2: Use Docker (Alternative)

```bash
# Run MySQL in Docker
docker run --name menupi-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=menupi_db \
  -p 3306:3306 \
  -d mysql:8.0

# Update .env file:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=rootpassword
```

### Option 3: Use Cloud Database (Remote)
Update `.env` file with remote database credentials:
```env
DB_HOST=your-remote-host.com
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=menupi_db
```

## After MySQL is Running

### 1. Create Database
```bash
mysql -u root -p
# Or if no password:
mysql -u root
```

Then in MySQL:
```sql
CREATE DATABASE IF NOT EXISTS menupi_db;
EXIT;
```

### 2. Apply Schema
```bash
mysql -u root -p menupi_db < database/schema.sql
# Or if no password:
mysql -u root menupi_db < database/schema.sql
```

### 3. Verify Database
```bash
mysql -u root -p menupi_db -e "SHOW TABLES;"
```

You should see:
- restaurants
- users
- media
- screens
- screen_media
- schedules

### 4. Update .env File
Make sure your `.env` file has correct credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=menupi_db
```

### 5. Restart Backend
```bash
# Kill existing server
pkill -f "node server.js"

# Start again
node server.js
```

## Test Registration

After database is set up, try registering again:
1. Go to http://localhost:3000/register
2. Fill in the form
3. Should work now!

## Troubleshooting

### MySQL not found in PATH
```bash
# macOS - Add to PATH
echo 'export PATH="/usr/local/mysql/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Or use full path
/usr/local/mysql/bin/mysql -u root
```

### Port 3306 already in use
```bash
# Check what's using port 3306
lsof -i :3306

# Kill the process or use different port
```

### Connection refused
- Make sure MySQL is running: `brew services list` (macOS)
- Check MySQL is listening: `lsof -i :3306`
- Verify credentials in `.env` file

### Permission denied
```bash
# Grant permissions
mysql -u root -p
GRANT ALL PRIVILEGES ON menupi_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

