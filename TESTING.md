# Testing the Breathing App Locally

Before deploying to your Samsung S24, test the app in an Android emulator on your Fedora system using the **Android Development Environment**.

## Prerequisites

You need the `AndroidDevEnvironment` framework set up on your machine.

### First Time Setup

If you haven't set up the environment yet:

```bash
cd ~/Documents/AndroidDevEnvironment
./setup.sh  # Run the one-time setup (15-20 mins)
```

**Then log out and back in** (for KVM hardware acceleration).

This creates a reusable Android dev environment for **any** app you want to test.

## Quick Test Workflow

### 1. Start Samsung S24 Emulator

**Option A: Desktop Shortcut (Recommended)**
1. Open your App Menu (Super/Windows key).
2. Type **"Samsung"**.
3. Launch **Samsung S24 Emulator**.

**Option B: Terminal**
```bash
android-s24
```

Wait 2-3 minutes for boot (first time only).

### 2. Deploy the Breathing App

Open your project in the terminal:

```bash
cd ~/Documents/BreathingApp
npm run android
```

The app will build, install, and launch automatically in the running emulator.

### 3. Test All Features

Use your **mouse** to interact (mouse click = finger tap):

**Dashboard:**
- Click "Start Session"
- Accept disclaimer modal

**Session:**
- Watch breathing circle animate
- Listen for "breathe in" / "breathe out" audio
- Verify breath count increments
- After 30 breaths, hold phase starts
- Listen for minute marker bells (1:00, 2:00, etc.)
- Click "Done Holding"
- Recovery breath phase (automatic)
- Next round starts
- Complete all 3 rounds

**Settings:**
- Adjust breaths per round (10-50)
- Adjust number of rounds (1-10)
- Adjust recovery duration (10-30s)
- Verify settings save automatically

**Navigation:**
- Navigate between screens
- Verify back button works
- No crashes

### 4. Check for Errors

If something goes wrong, check the logs:

```bash
# In another terminal
adb logcat | grep -E "BreathingApp|ERROR|FATAL"
```

## If Everything Works

✅ All features working in emulator → Safe to install on your S24
❌ Issues in emulator → Fix before deploying to phone

## Deploying to Your S24

Only after emulator testing passes:

**Option 1: Wait for GitHub Actions**
- Check https://github.com/mjgardner87/breathing_app/releases
- Download the APK
- Transfer to phone and install

**Option 2: Direct USB Install**
1. Enable USB debugging on S24
2. Connect via USB
3. Verify connection: `adb devices`
4. Install: `cd android && ./gradlew installRelease`

## Troubleshooting

### Emulator won't start
```bash
android-status  # Check environment
```
Ensure you logged out/in after initial setup (for KVM).

### App won't install
```bash
adb devices  # Should show emulator-5554
```
If shows "offline", wait longer for boot.

### Build fails
1. Check `local.properties` exists in `android/` folder (should point to `sdk.dir=/home/squigz/Android/Sdk`).
2. Run `npm test` to verify code integrity.
3. Clean build: `cd android && ./gradlew clean`

## Environment Documentation

For full details on the Android environment (S24 specs, updates, uninstalling):

```bash
# Open the documentation
xdg-open ~/Documents/AndroidDevEnvironment/README.md
```
