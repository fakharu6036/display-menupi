#!/bin/bash

# MENUPI GitHub Deployment Script
# This script helps you push code to GitHub and trigger Railway deployment

set -e

echo "🚀 MENUPI GitHub Deployment"
echo "=========================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -M main
fi

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/fakharu6036/display-menupi.git
    echo "✅ Remote added: https://github.com/fakharu6036/display-menupi.git"
else
    echo "✅ Remote already configured"
    git remote -v | grep origin
fi

echo ""
echo "📝 Checking for changes..."

# Add all files
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Add TV management features, Railway config, and production setup

- Add TV deduplication system (device_uid, installation_id, tv_id)
- Add manual Android TV management (/tvs page)
- Configure Railway deployment (railway.json, Procfile)
- Add Vercel configuration for multi-project deployment
- Remove TypeScript syntax from server.js (fix Node.js compatibility)
- Add backward compatibility verification
- Add production environment configuration
- Add comprehensive deployment documentation"
    
    echo ""
    echo "📤 Pushing to GitHub..."
    echo "   (This will trigger Railway auto-deployment)"
    echo ""
    
    # Push to GitHub
    git push -u origin main || {
        echo ""
        echo "⚠️  Push failed. You may need to:"
        echo "   1. Pull existing changes first: git pull origin main --allow-unrelated-histories"
        echo "   2. Or force push (if you're sure): git push -u origin main --force"
        echo ""
        exit 1
    }
    
    echo ""
    echo "✅ Code pushed to GitHub!"
    echo ""
    echo "🔄 Railway will auto-deploy in a few moments"
    echo "   Check Railway dashboard for deployment status"
    echo ""
fi

echo ""
echo "📋 Next Steps:"
echo "   1. Configure Railway environment variables (see RAILWAY_DEPLOYMENT.md)"
echo "   2. Run database migrations in Railway MySQL"
echo "   3. Create Vercel projects (see GITHUB_DEPLOYMENT.md)"
echo "   4. Configure custom domains"
echo ""
echo "✅ Done!"

