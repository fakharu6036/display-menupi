#!/bin/bash

# Railway Database Setup Script
# This script runs all necessary database migrations for Railway deployment
# Run this after connecting to your Railway MySQL database

echo "🚀 MENUPI Railway Database Setup"
echo "================================"
echo ""

# Check if MySQL client is available
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL client not found."
    echo "Please install MySQL client or use Railway's MySQL service directly."
    exit 1
fi

# Get database credentials from environment or prompt
DB_HOST="${DB_HOST:-}"
DB_USER="${DB_USER:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-}"

if [ -z "$DB_HOST" ]; then
    read -p "Database Host: " DB_HOST
fi

if [ -z "$DB_USER" ]; then
    read -p "Database User: " DB_USER
fi

if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Database Password: " DB_PASSWORD
    echo ""
fi

if [ -z "$DB_NAME" ]; then
    read -p "Database Name: " DB_NAME
fi

echo ""
echo "📦 Running migrations..."
echo ""

# Function to run SQL file
run_migration() {
    local file=$1
    local name=$2
    
    echo "  → $name..."
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file" 2>/dev/null || {
        echo "    ⚠️  Warning: Migration may have already been applied or failed"
    }
}

# Run base schema
echo "1. Base schema..."
run_migration "database.sql" "Base schema"

# Run migrations in order
echo "2. Hardware TVs migration..."
run_migration "migrate-hardware-tvs.sql" "Hardware TVs"

echo "3. IP tracking migration..."
run_migration "migrate-add-ip-tracking.sql" "IP tracking"

echo "4. Plan requests migration..."
run_migration "migrate-plan-requests.sql" "Plan requests"

echo "5. Manual Android TVs migration..."
run_migration "migrate-manual-android-tvs.sql" "Manual Android TVs"

echo "6. TV deduplication migration..."
run_migration "migrate-tv-deduplication.sql" "TV deduplication"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set environment variables in Railway:"
echo "      - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
echo "      - JWT_SECRET (generate a strong random string)"
echo "      - API_URL=https://api.menupi.com"
echo "      - PROTOCOL=https"
echo "      - DOMAIN=api.menupi.com"
echo "      - NODE_ENV=production"
echo "   2. Deploy your service to Railway"
echo "   3. Configure custom domain: api.menupi.com"
echo ""

