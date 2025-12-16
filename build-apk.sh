#!/bin/bash

# Breathing App - APK Build Script
# This script builds the Android APK for the Breathing App

set -e  # Exit on error

echo "========================================="
echo "Breathing App - APK Build Script"
echo "========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm: $(npm --version)"

# Check Java
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed"
    echo "   Install JDK 17: sudo dnf install java-17-openjdk"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" != "17" ] && [ "$JAVA_VERSION" != "18" ] && [ "$JAVA_VERSION" != "19" ] && [ "$JAVA_VERSION" != "20" ]; then
    echo "❌ Java version $JAVA_VERSION detected. React Native requires JDK 17-20"
    echo "   Install JDK 17: sudo dnf install java-17-openjdk"
    exit 1
fi
echo "✅ Java: $(java -version 2>&1 | head -n 1)"

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME is not set"
    echo "   Set it in ~/.bashrc: export ANDROID_HOME=\$HOME/Android/Sdk"
    echo "   See INSTALL.md for full setup instructions"
    exit 1
fi
if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME points to non-existent directory: $ANDROID_HOME"
    exit 1
fi
echo "✅ ANDROID_HOME: $ANDROID_HOME"

echo ""
echo "All prerequisites met!"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build APK
echo "Building APK..."
echo "This may take 2-5 minutes..."
echo ""

cd android
./gradlew assembleRelease

cd ..

# Check if APK was created
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "========================================="
    echo "✅ BUILD SUCCESSFUL!"
    echo "========================================="
    echo ""
    echo "APK Location: $APK_PATH"
    echo "APK Size: $APK_SIZE"
    echo ""
    echo "To install on your phone:"
    echo "  1. Connect phone via USB"
    echo "  2. Enable USB Debugging"
    echo "  3. Run: adb install $APK_PATH"
    echo ""
    echo "Or copy the APK to your phone and install manually."
    echo ""
else
    echo ""
    echo "========================================="
    echo "❌ BUILD FAILED"
    echo "========================================="
    echo ""
    echo "APK was not created. Check the error messages above."
    echo ""
    exit 1
fi
