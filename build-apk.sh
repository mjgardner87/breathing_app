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

# Check Android SDK (support both modern and legacy env vars)
SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
if [ -z "$SDK_ROOT" ]; then
    echo "❌ Android SDK path not set"
    echo "   Set one of these in your shell profile:"
    echo "     export ANDROID_SDK_ROOT=\$HOME/Android/Sdk"
    echo "     export ANDROID_HOME=\$HOME/Android/Sdk"
    echo "   See INSTALL.md for full setup instructions"
    exit 1
fi
if [ ! -d "$SDK_ROOT" ]; then
    echo "❌ Android SDK directory does not exist: $SDK_ROOT"
    exit 1
fi
echo "✅ Android SDK: $SDK_ROOT"

# Ensure Gradle can locate the SDK even if the environment isn't inherited.
# (This file is normally gitignored; it's safe to generate locally.)
LOCAL_PROPERTIES_PATH="android/local.properties"
if [ ! -f "$LOCAL_PROPERTIES_PATH" ]; then
    echo "Creating $LOCAL_PROPERTIES_PATH with sdk.dir..."
    printf "sdk.dir=%s\n" "$SDK_ROOT" > "$LOCAL_PROPERTIES_PATH"
fi

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
