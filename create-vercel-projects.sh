#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Creating Vercel Projects for MENUPI${NC}"
echo ""

# Check if logged in
echo "Checking Vercel login status..."
if ! vercel whoami &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please run: vercel login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Vercel${NC}"
echo ""

# ngrok URL
NGROK_URL="https://tingliest-patience-tragic.ngrok-free.dev"

echo "Using ngrok URL: $NGROK_URL"
echo ""

# Step 1: Update existing project (menupi-signage)
echo -e "${GREEN}Step 1: Updating existing project (menupi-signage)${NC}"
echo "Checking if project exists..."

if vercel projects ls | grep -q "menupi-signage"; then
    echo "✅ Project 'menupi-signage' found"
    echo "Linking to project..."
    cd /Users/mdfakharuddin/Desktop/menupi---digital-signage
    vercel link --project=menupi-signage --yes 2>&1 | head -10
    
    echo "Adding environment variable..."
    vercel env add VITE_API_BASE_URL production <<< "$NGROK_URL" 2>&1
    vercel env add VITE_API_BASE_URL preview <<< "$NGROK_URL" 2>&1
    vercel env add VITE_API_BASE_URL development <<< "$NGROK_URL" 2>&1
    
    echo "✅ Updated menupi-signage project"
else
    echo "⚠️  Project 'menupi-signage' not found. Skipping..."
fi

echo ""
echo ""

# Step 2: Create portal project
echo -e "${GREEN}Step 2: Creating portal project (menupi-portal)${NC}"

# Check if project already exists
if vercel projects ls | grep -q "menupi-portal"; then
    echo "⚠️  Project 'menupi-portal' already exists. Linking..."
    vercel link --project=menupi-portal --yes 2>&1 | head -10
else
    echo "Creating new project: menupi-portal"
    vercel --name=menupi-portal --yes 2>&1 | tail -10
fi

echo "Adding environment variable..."
vercel env add VITE_API_BASE_URL production <<< "$NGROK_URL" 2>&1
vercel env add VITE_API_BASE_URL preview <<< "$NGROK_URL" 2>&1
vercel env add VITE_API_BASE_URL development <<< "$NGROK_URL" 2>&1

echo "✅ Created/Updated menupi-portal project"
echo ""
echo ""

# Step 3: Create TV project
echo -e "${GREEN}Step 3: Creating TV project (menupi-tv)${NC}"

# Check if project already exists
if vercel projects ls | grep -q "menupi-tv"; then
    echo "⚠️  Project 'menupi-tv' already exists. Linking..."
    vercel link --project=menupi-tv --yes 2>&1 | head -10
else
    echo "Creating new project: menupi-tv"
    vercel --name=menupi-tv --yes 2>&1 | tail -10
fi

echo "Adding environment variable..."
vercel env add VITE_API_BASE_URL production <<< "$NGROK_URL" 2>&1
vercel env add VITE_API_BASE_URL preview <<< "$NGROK_URL" 2>&1
vercel env add VITE_API_BASE_URL development <<< "$NGROK_URL" 2>&1

echo "✅ Created/Updated menupi-tv project"
echo ""
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Projects created:"
echo "  1. menupi-signage (app.menupi.com)"
echo "  2. menupi-portal (portal.menupi.com)"
echo "  3. menupi-tv (tv.menupi.com)"
echo ""
echo "Next steps:"
echo "  1. Add domains in Vercel Dashboard:"
echo "     - portal.menupi.com → menupi-portal project"
echo "     - tv.menupi.com → menupi-tv project"
echo "  2. Configure DNS records (CNAME)"
echo "  3. Deploy projects:"
echo "     vercel --prod (for each project)"
echo ""

