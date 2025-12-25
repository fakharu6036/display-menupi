# Database Setup Guide

## Quick Setup

### Option 1: Using the Setup Script (Recommended)

1. Make sure MySQL is installed and running:
   ```bash
   # Install MySQL (if not installed)
   brew install mysql
   
   # Start MySQL service
   brew services start mysql
   ```

2. Run the setup script:
   ```bash
   ./setup-database.sh
   ```

   Or with custom credentials:
   ```bash
   DB_USER=root DB_PASSWORD=yourpassword ./setup-database.sh
   ```

### Option 2: Manual Setup

1. Connect to MySQL:
   ```bash
   mysql -u root -p
   ```

2. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS u859590789_disys;
   USE u859590789_disys;
   ```

3. Import the schema:
   ```bash
   mysql -u root -p u859590789_disys < database.sql
   ```

   Or from MySQL prompt:
   ```sql
   source database.sql;
   ```

## Environment Variables

Create a `.env` file in the project root (or update existing one):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=u859590789_disys
JWT_SECRET=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_optional
```

## Verify Setup

After setup, you can verify the tables were created:

```bash
mysql -u root -p u859590789_disys -e "SHOW TABLES;"
```

You should see:
- restaurants
- users
- media
- screens
- screen_media
- schedules

## Troubleshooting

### MySQL not found
- Install MySQL: `brew install mysql`
- Or download from: https://dev.mysql.com/downloads/mysql/

### Connection refused
- Make sure MySQL server is running: `brew services start mysql`
- Check if MySQL is running: `brew services list`

### Access denied
- Check your MySQL root password
- You may need to reset MySQL root password or create a new user

### Database already exists
- The script will skip creation if database exists
- Tables will be created if they don't exist (using CREATE TABLE IF NOT EXISTS)

