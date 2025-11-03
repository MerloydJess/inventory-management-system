@echo off
REM Production Build Script for BTS Inventory Management System

echo 🚀 Building BTS Inventory Management System for Production
echo ==========================================================

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build

REM Install dependencies if needed
echo 📦 Installing dependencies...
npm install

REM Build React frontend
echo ⚛️ Building React frontend...
npm run build

REM Build Electron application
echo 🖥️ Building Electron application...
npm run electron-build

echo ✅ Build completed successfully!
echo 📁 Distribution files are in the 'dist/' folder
echo 📖 See network-setup.md for network database configuration
echo.
echo 🌐 For network sharing:
echo 1. Copy .env.production.template to .env.production
echo 2. Configure DB_NETWORK_PATH or NETWORK_DB_PATH
echo 3. Install on all PCs that need access
echo 4. Ensure network folder permissions are set correctly
echo.
pause
