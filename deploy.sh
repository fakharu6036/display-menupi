#!/bin/bash

# MENUPI Digital Signage - Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "========================================="
echo "MENUPI Digital Signage - Deployment"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root for certain operations
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Configuration
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR"
FRONTEND_DIR="$PROJECT_DIR"
BUILD_DIR="$PROJECT_DIR/dist"
DEPLOY_DIR="/var/www/menupi"
NODE_ENV="production"

echo -e "${GREEN}Step 1: Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi
echo "✓ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi
echo "✓ npm $(npm -v)"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing...${NC}"
    npm install -g pm2
fi
echo "✓ PM2 installed"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}MySQL client not found. Please install MySQL.${NC}"
fi

echo -e "${GREEN}Step 2: Installing dependencies...${NC}"
cd "$BACKEND_DIR"
npm install

cd "$FRONTEND_DIR"
npm install

echo -e "${GREEN}Step 3: Checking environment files...${NC}"

# Check backend .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}Backend .env not found. Copying from env.example...${NC}"
    cp "$BACKEND_DIR/env.example" "$BACKEND_DIR/.env"
    echo -e "${RED}Please edit $BACKEND_DIR/.env with your production values${NC}"
    exit 1
fi
echo "✓ Backend .env exists"

# Check frontend .env
if [ ! -f "$FRONTEND_DIR/.env" ]; then
    echo -e "${YELLOW}Frontend .env not found. Creating...${NC}"
    cat > "$FRONTEND_DIR/.env" << EOF
VITE_API_URL=https://yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
EOF
    echo -e "${RED}Please edit $FRONTEND_DIR/.env with your production values${NC}"
    exit 1
fi
echo "✓ Frontend .env exists"

echo -e "${GREEN}Step 4: Building frontend...${NC}"
cd "$FRONTEND_DIR"
npm run build

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Build failed - dist directory not found${NC}"
    exit 1
fi
echo "✓ Frontend built successfully"

echo -e "${GREEN}Step 5: Creating uploads directory...${NC}"
mkdir -p "$BACKEND_DIR/uploads"
chmod 755 "$BACKEND_DIR/uploads"
echo "✓ Uploads directory ready"

echo -e "${GREEN}Step 6: Creating logs directory...${NC}"
mkdir -p "$BACKEND_DIR/logs"
echo "✓ Logs directory ready"

echo -e "${GREEN}Step 7: Deploying frontend...${NC}"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "Creating deployment directory..."
    sudo mkdir -p "$DEPLOY_DIR"
fi

sudo cp -r "$BUILD_DIR"/* "$DEPLOY_DIR/"
sudo chown -R www-data:www-data "$DEPLOY_DIR"
echo "✓ Frontend deployed to $DEPLOY_DIR"

echo -e "${GREEN}Step 8: Starting/restarting backend with PM2...${NC}"
cd "$BACKEND_DIR"

# Stop existing instance if running
pm2 stop menupi-api 2>/dev/null || true
pm2 delete menupi-api 2>/dev/null || true

# Start with ecosystem config if it exists
if [ -f "$BACKEND_DIR/ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start server.js --name menupi-api --env production
fi

pm2 save
echo "✓ Backend started with PM2"

echo -e "${GREEN}Step 9: Verifying deployment...${NC}"
sleep 2

# Check PM2 status
if pm2 list | grep -q "menupi-api.*online"; then
    echo "✓ Backend is running"
else
    echo -e "${RED}Backend is not running. Check logs: pm2 logs menupi-api${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================="
echo "Deployment Complete!"
echo "=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Nginx (see DEPLOYMENT.md)"
echo "2. Set up SSL certificate with Let's Encrypt"
echo "3. Verify database connection"
echo "4. Test all features (see verification checklist)"
echo ""
echo "Useful commands:"
echo "  pm2 logs menupi-api          # View backend logs"
echo "  pm2 status                   # Check PM2 status"
echo "  pm2 restart menupi-api       # Restart backend"
echo "  sudo systemctl reload nginx   # Reload Nginx"
echo ""

