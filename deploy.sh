#!/bin/bash
echo "===================================="
echo " EBD Farm System - Quick Deploy"
echo " نظام إدارة عزبة النخيل"
echo "===================================="
echo ""

# Step 1: Install dependencies
echo "[1/4] Installing dependencies..."
cd app
npm install || { echo "ERROR: npm install failed!"; exit 1; }
echo "Done!"
echo ""

# Step 2: Test local build
echo "[2/4] Testing build..."
npx next build || { echo "ERROR: Build failed!"; exit 1; }
echo "Build successful!"
echo ""

# Step 3: Push to GitHub
cd ..
echo "[3/4] Pushing to GitHub..."
if command -v gh &> /dev/null; then
    git init
    git checkout -b main
    git add -A
    git commit -m "Initial commit - EBD Farm System"
    gh repo create ebd-farm-system --public --source=. --push
    echo "GitHub push complete!"
else
    echo "GitHub CLI not found. Install from: https://cli.github.com"
    echo "Or manually:"
    echo "  git init && git checkout -b main && git add -A"
    echo "  git commit -m 'Initial commit - EBD Farm System'"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/ebd-farm-system.git"
    echo "  git push -u origin main"
fi
echo ""

# Step 4: Deploy to Vercel
echo "[4/4] Deploying to Vercel..."
cd app
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi
vercel --yes
vercel --prod
echo ""
echo "===================================="
echo " Deployment Complete! تم النشر بنجاح!"
echo "===================================="
