# Installation Guide - Innerfire

This guide provides instructions for installing the Innerfire app on your Android device or setting up a development environment.

---

## Method 1: Download Pre-Built APK (Recommended for Users)

The easiest way to use the app is to install the pre-built APK file.

### Steps
1. **Download**: Go to the [Releases page](https://github.com/mjgardner87/breathing_app/releases) and download the latest `innerfire-release.apk`.
2. **Transfer**: Move the file to your Android phone (via USB, Drive, etc.).
3. **Install**: Tap the APK file on your phone.
   - You may need to enable "Install from Unknown Sources" in your settings (Settings → Apps → Special access → Install unknown apps).
4. **Run**: Open "Innerfire" from your app drawer.

**Note on Audio**: All necessary audio files (breath textures, voice cues, and bells) are now **bundled** with the application. You do not need to manually download or configure audio files.

---

## Method 2: Build from Source (For Developers)

Follow these steps if you want to contribute to the code or build the app yourself.

### Prerequisites

- **Node.js 20+**
- **Java JDK 17** (Required for React Native 0.83+)
- **Android SDK** (Command line tools or via Android Studio)
- **Git**

### Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/mjgardner87/breathing_app.git
   cd breathing_app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Android Environment**
   Ensure your `ANDROID_HOME` and `JAVA_HOME` environment variables are set correctly.

   *Example (~/.bashrc):*
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
   ```

4. **Start the Metro Bundler**
   ```bash
   npm start
   ```

5. **Run on Emulator or Device**
   Open a new terminal window:
   ```bash
   npm run android
   ```

---

## Replacing Default Audio (Optional - Developers Only)

The app ships with airy inhale/exhale textures plus calm voice cues. If you wish to build a custom version with your own sounds, you can replace the bundled files or re-run the generator script.

### File Location
Audio files are located in: `android/app/src/main/res/raw/`

### Required Files
Ensure your custom files match these filenames exactly (must be lowercase, `.wav` or `.mp3` supported, though `.wav` is currently used):

- `breathe_in.wav`
- `breathe_out.wav`
- `hold_breath.wav`
- `recovery_breath.wav`
- `release.wav`
- `round_complete.wav`
- `minute_marker.wav`

You can recreate the stock pack anytime by running:
```bash
./generate-audio.sh
```

After replacing files, you must rebuild the app:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

---

## Troubleshooting

### "Unsupported Java Version"
React Native 0.83 requires Java 17. Java 20+ or versions older than 17 may cause build failures.
Check your version: `java -version`

### Audio not playing
If building locally, ensure the audio files exist in `android/app/src/main/res/raw/`.
Check logs: `adb logcat -s "AudioService" "RNSoundPlayer"`
