#!/bin/bash
# Local development setup script

echo "Setting up local development environment..."

# Create backend .env if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=menupi_db
JWT_SECRET=local_dev_secret_key_change_in_production_min_32_chars
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=100878362406702614118
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
ENVEOF
    echo "✓ Created backend .env file"
else
    echo "✓ Backend .env already exists"
fi

# Create frontend .env if it doesn't exist
if [ ! -f .env.local ]; then
    cat > .env.local << 'ENVEOF'
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=100878362406702614118
ENVEOF
    echo "✓ Created frontend .env.local file"
else
    echo "✓ Frontend .env.local already exists"
fi

# Create directories
mkdir -p uploads logs
echo "✓ Created uploads and logs directories"

echo ""
echo "Setup complete! Next steps:"
echo "1. Make sure MySQL is running"
echo "2. Create database: mysql -u root -e 'CREATE DATABASE IF NOT EXISTS menupi_db;'"
echo "3. Apply schema: mysql -u root menupi_db < database/schema.sql"
echo "4. Start backend: node server.js"
echo "5. Start frontend: npm run dev"
