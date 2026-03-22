@echo off
echo ====================================
echo  EBD Farm System - Quick Deploy
echo  نظام إدارة عزبة النخيل
echo ====================================
echo.

REM Step 1: Install dependencies
echo [1/4] Installing dependencies...
cd app
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo Done!
echo.

REM Step 2: Test local build
echo [2/4] Testing build...
call npx next build
if errorlevel 1 (
    echo ERROR: Build failed! Check errors above.
    pause
    exit /b 1
)
echo Build successful!
echo.

REM Step 3: Push to GitHub
cd ..
echo [3/4] Pushing to GitHub...
where gh >nul 2>nul
if errorlevel 1 (
    echo GitHub CLI not found. Install from: https://cli.github.com
    echo Or manually create repo at https://github.com/new
    echo Then run:
    echo   git init
    echo   git add -A
    echo   git commit -m "Initial commit - EBD Farm System"
    echo   git remote add origin https://github.com/YOUR_USERNAME/ebd-farm-system.git
    echo   git push -u origin main
    echo.
    echo After pushing, continue to Step 4.
    pause
) else (
    git init
    git checkout -b main
    git add -A
    git commit -m "Initial commit - EBD Farm System"
    gh repo create ebd-farm-system --public --source=. --push
    echo GitHub push complete!
)
echo.

REM Step 4: Deploy to Vercel
echo [4/4] Deploying to Vercel...
cd app
where vercel >nul 2>nul
if errorlevel 1 (
    echo Installing Vercel CLI...
    call npm install -g vercel
)
call vercel --yes
call vercel --prod
echo.
echo ====================================
echo  Deployment Complete!
echo  تم النشر بنجاح!
echo ====================================
pause
