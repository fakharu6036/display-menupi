#!/bin/bash
# Quick deploy script - triggers Vercel auto-deploy via GitHub

echo "🚀 Triggering Vercel auto-deploy..."

# Add trigger file
echo "# Deploy trigger $(date)" >> .vercel-trigger

# Commit and push
git add .vercel-trigger
git commit -m "Trigger Vercel auto-deploy - $(date +%Y-%m-%d\ %H:%M:%S)" --no-verify
git push origin main

echo "✅ Pushed to GitHub - Vercel will auto-deploy in 1-3 minutes"
echo "📊 Check status: https://vercel.com/fakharu6036s-projects/menupi-signage"
