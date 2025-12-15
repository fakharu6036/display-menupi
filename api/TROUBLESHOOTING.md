# Database Connection Troubleshooting

## Error: "Database connection failed"

### Step 1: Verify .env file exists
- Check that `.env` file exists in `/api/` folder
- File should be named exactly `.env` (not `.env.example`)

### Step 2: Check .env file contents
Your `.env` file should have:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=u859590789_your_actual_user
DB_PASSWORD=your_actual_password
DB_NAME=u859590789_your_actual_database
```

### Step 3: Get correct credentials from Hostinger
1. Login to Hostinger hPanel
2. Go to: **Databases** → **MySQL Databases**
3. Find your database
4. Copy the EXACT values:
   - **Database name** (usually starts with `u859590789_`)
   - **Username** (usually same as database name)
   - **Password** (the one you set)
   - **Host** (usually `localhost`)

### Step 4: Common Hostinger issues

#### Issue: Database name format
Hostinger databases usually have format: `u859590789_databasename`
- Make sure you use the FULL name including the `u859590789_` prefix

#### Issue: Host might not be localhost
- Try: `DB_HOST=localhost`
- If that fails, check Hostinger MySQL settings for the actual host
- Some Hostinger setups use: `127.0.0.1` or a remote host

#### Issue: Port might be different
- Default is `3306`
- If connection fails, check Hostinger MySQL settings for port

### Step 5: Test connection manually
Create a test file `test-db.php` in `/api/`:
```php
<?php
require_once __DIR__ . '/config/config.php';

$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: '';
$username = getenv('DB_USER') ?: '';
$password = getenv('DB_PASSWORD') ?: '';
$port = getenv('DB_PORT') ?: '3306';

echo "Attempting connection...\n";
echo "Host: {$host}\n";
echo "Port: {$port}\n";
echo "Database: {$dbname}\n";
echo "User: {$username}\n";
echo "Password: " . (empty($password) ? 'EMPTY' : 'SET') . "\n\n";

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password);
    echo "✅ Connection successful!\n";
} catch (PDOException $e) {
    echo "❌ Connection failed: " . $e->getMessage() . "\n";
}
```

Access: `https://api.menupi.com/test-db.php`
**DELETE this file after testing!**

### Step 6: Verify database exists
1. Go to Hostinger hPanel → **phpMyAdmin**
2. Check if your database appears in the list
3. If not, create it first

### Step 7: Check file permissions
- `.env` file should be readable (644 permissions)
- Make sure file is not corrupted during upload

### Common Solutions

**Solution 1: Use full database name**
```bash
DB_NAME=u859590789_menupi_db
DB_USER=u859590789_menupi_db
```

**Solution 2: Try different host**
```bash
DB_HOST=127.0.0.1
```

**Solution 3: Check for typos**
- No extra spaces in `.env` file
- No quotes around values
- Values on same line as key

**Solution 4: Verify .env is loaded**
Add to `index.php` temporarily:
```php
error_log("DB_HOST: " . getenv('DB_HOST'));
error_log("DB_NAME: " . getenv('DB_NAME'));
error_log("DB_USER: " . getenv('DB_USER'));
```
Check Hostinger error logs to see if values are loaded.

