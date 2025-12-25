#!/bin/bash

# Database Setup Script for Digital Signage System
# This script creates the database and tables

DB_NAME="${DB_NAME:-u859590789_disys}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"

echo "Setting up database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo ""

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo "MySQL client not found. Please install MySQL:"
    echo "  - macOS: brew install mysql"
    echo "  - Or download from: https://dev.mysql.com/downloads/mysql/"
    echo ""
    echo "After installation, make sure MySQL server is running:"
    echo "  brew services start mysql"
    exit 1
fi

# Create database (will fail if it exists, but that's okay)
echo "Creating database (if it doesn't exist)..."
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || {
    echo "Failed to create database. Trying without password..."
    mysql -h "$DB_HOST" -u "$DB_USER" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || {
        echo "Error: Could not connect to MySQL. Please check:"
        echo "  1. MySQL server is running"
        echo "  2. Database credentials are correct"
        echo "  3. User has proper permissions"
        exit 1
    }
}

# Import schema
echo "Importing database schema..."
mysql -h "$DB_HOST" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" < database.sql 2>/dev/null || {
    echo "Failed with password. Trying without password..."
    mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < database.sql || {
        echo "Error: Could not import schema. Please check database connection."
        exit 1
    }
}

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Database: $DB_NAME"
echo "Tables created:"
echo "  - restaurants"
echo "  - users"
echo "  - media"
echo "  - screens"
echo "  - screen_media"
echo "  - schedules"
echo ""
echo "You can now start the application with: npm start"

