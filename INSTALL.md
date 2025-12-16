# Installation Guide - Breathing App

This guide provides **two methods** to get the Breathing App running on your Samsung S24:

1. **Easy Method**: Download pre-built APK from GitHub Releases (recommended)
2. **Build Method**: Build the APK yourself locally

---

## Method 1: Download Pre-Built APK (Easiest)

### Step 1: Download the APK
1. Go to the [Releases page](https://github.com/mjgardner87/breathing_app/releases)
2. Download the latest `breathing-app-release.apk` file

### Step 2: Install on Your Phone
1. Transfer the APK to your Samsung S24
2. Enable "Install from Unknown Sources" in Settings:
   - Settings → Apps → Special access → Install unknown apps
   - Select your file manager or browser
   - Enable "Allow from this source"
3. Tap the APK file to install
4. Open "Breathing App" from your app drawer

### Step 3: Add Audio Files (Optional but Recommended)

The app works without audio, but for the full experience with voice cues and minute markers:

1. Download or record 7 audio files (see [Audio Files](#audio-files-guide) section below)
2. Use Android File Manager to place them in:
   ```
   Internal Storage/Android/data/com.breathingapp/files/audio/
   ```

**Note**: Audio functionality requires audio files. The app will work silently until you add them.

---

## Method 2: Build APK Yourself

### Prerequisites

You'll need:
- **Node.js 18+**: `node --version`
- **Java JDK 17**: `java -version` (JDK 23 is NOT supported)
- **Android SDK**: With platform-tools and build-tools
- **Git**: To clone the repository

### Step 1: Install Android SDK (If Not Already Installed)

#### On Fedora/RHEL:
```bash
# Install Android Studio (easiest way to get SDK)
sudo dnf install android-studio

# Or install SDK command-line tools only:
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-*.zip -d ~/Android
mkdir -p ~/Android/Sdk/cmdline-tools
mv ~/Android/cmdline-tools ~/Android/Sdk/cmdline-tools/latest

# Install required SDK components
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

#### Configure Environment Variables:
```bash
# Add to ~/.bashrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk

# Reload shell
source ~/.bashrc
```

Verify installation:
```bash
adb --version          # Should show Android Debug Bridge version
which sdkmanager       # Should show path to sdkmanager
echo $ANDROID_HOME     # Should show /home/yourusername/Android/Sdk
```

### Step 2: Install Java JDK 17 (If Needed)

```bash
# Check current Java version
java -version

# If not JDK 17, install it:
sudo dnf install java-17-openjdk java-17-openjdk-devel

# Set as default
sudo alternatives --config java
sudo alternatives --config javac
```

### Step 3: Clone the Repository

```bash
cd ~/Documents
git clone https://github.com/mjgardner87/breathing_app.git
cd breathing_app
```

### Step 4: Install Dependencies

```bash
npm install
```

This will install all required packages (~2-3 minutes).

### Step 5: Generate Signing Keystore (One-Time)

```bash
cd android/app

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore breathing-app-release.keystore \
  -alias breathing-app \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (use same as keystore password)
# - Name, organization, etc. (can use defaults)

cd ../..
```

**IMPORTANT**: Save your keystore password! You'll need it to update the app later.

### Step 6: Configure Gradle Signing

Create `android/gradle.properties` (if it doesn't exist):

```properties
# Add these lines
MYAPP_RELEASE_STORE_FILE=breathing-app-release.keystore
MYAPP_RELEASE_KEY_ALIAS=breathing-app
MYAPP_RELEASE_STORE_PASSWORD=YOUR_KEYSTORE_PASSWORD_HERE
MYAPP_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD_HERE
```

**Security Note**: Never commit `gradle.properties` with passwords to git. It's already in `.gitignore`.

Update `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 7: Build the APK

```bash
# Build release APK
cd android
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

Build time: ~2-5 minutes (first time), ~30 seconds (subsequent builds).

### Step 8: Install on Your Samsung S24

#### Via USB:
```bash
# Connect phone via USB
# Enable Developer Options and USB Debugging on phone
adb devices  # Should show your device

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

#### Via File Transfer:
```bash
# Copy APK to phone
cp android/app/build/outputs/apk/release/app-release.apk ~/Downloads/

# Transfer to phone and install
# (Use USB, Bluetooth, or cloud storage)
```

---

## Audio Files Guide

The app uses 7 audio files for voice cues and minute markers. These need to be MP3 format, 44.1kHz, 128kbps.

### Required Files:

1. **breathe_in.mp3** - Voice saying "Breathe in" (~1 second)
2. **breathe_out.mp3** - Voice saying "Breathe out" (~1 second)
3. **hold_breath.mp3** - Voice saying "Hold your breath" (~2 seconds)
4. **recovery_breath.mp3** - Voice saying "Take a deep breath in and hold" (~3 seconds)
5. **release.mp3** - Voice saying "Release" (~1 second)
6. **round_complete.mp3** - Voice saying "Round complete" (~2 seconds)
7. **minute_marker.mp3** - Bell or gentle chime sound (~1 second)

### How to Create Audio Files:

#### Option 1: Text-to-Speech (Easiest)

**Using Google TTS (Online):**
1. Go to https://cloud.google.com/text-to-speech
2. Enter text (e.g., "Breathe in")
3. Select voice (recommend: en-AU Standard-C or en-AU Standard-D for Australian accent)
4. Download as MP3

**Using macOS:**
```bash
say "Breathe in" -o breathe_in.aiff
ffmpeg -i breathe_in.aiff breathe_in.mp3
```

**Using Linux (espeak):**
```bash
espeak "Breathe in" -w breathe_in.wav
ffmpeg -i breathe_in.wav breathe_in.mp3
```

#### Option 2: Record Your Own Voice

Use any recording app on your phone:
1. Record each phrase clearly and calmly
2. Export as MP3
3. Trim to appropriate length (~1-3 seconds)

#### Option 3: Download from Freesound.org

For **minute_marker.mp3**, search for:
- "meditation bell"
- "singing bowl"
- "zen bell"
- "tibetan bell"

Filter by:
- License: Creative Commons 0 (public domain)
- Format: MP3 or WAV (convert to MP3 if needed)

### Where to Place Audio Files:

**Before building APK:**
```
breathing_app/android/app/src/main/res/raw/
├── breathe_in.mp3
├── breathe_out.mp3
├── hold_breath.mp3
├── minute_marker.mp3
├── recovery_breath.mp3
├── release.mp3
└── round_complete.mp3
```

Then rebuild the APK.

**After installing APK (via file manager on phone):**
```
Internal Storage/Android/data/com.breathingapp/files/audio/
├── breathe_in.mp3
├── breathe_out.mp3
├── hold_breath.mp3
├── minute_marker.mp3
├── recovery_breath.mp3
├── release.mp3
└── round_complete.mp3
```

---

## Troubleshooting

### "Installation Blocked" on Phone
- Enable "Install from Unknown Sources" for your file manager/browser
- Settings → Apps → Special access → Install unknown apps

### "Parsing Error" When Installing
- APK may be corrupted during transfer
- Re-download or re-copy the file
- Ensure APK is the release version (not debug)

### Audio Not Playing
- Check audio files are in correct directory
- Verify files are MP3 format
- Check file names match exactly (lowercase, underscores)
- Volume is up and phone is not on silent

### Build Fails - "SDK Location Not Found"
- Verify `ANDROID_HOME` is set: `echo $ANDROID_HOME`
- Verify SDK is installed: `ls $ANDROID_HOME`
- Reload shell: `source ~/.bashrc`

### Build Fails - "Unsupported Java Version"
- React Native 0.83 requires JDK 17-20 (NOT 23)
- Check version: `java -version`
- Install JDK 17: `sudo dnf install java-17-openjdk`

### "adb: command not found"
- Add to PATH: `export PATH=$PATH:$ANDROID_HOME/platform-tools`
- Reload shell: `source ~/.bashrc`

### App Crashes on Launch
- Check logs: `adb logcat | grep -i "breathing"`
- Ensure you're using the release APK (not debug)
- Clear app data and reinstall

---

## Updating the App

### If Using Pre-Built APK:
1. Download new APK from Releases
2. Install over existing app (will preserve your session data)

### If Building Yourself:
```bash
cd ~/Documents/breathing_app
git pull origin main
npm install
cd android
./gradlew assembleRelease
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

The `-r` flag reinstalls while preserving app data.

---

## Uninstalling

```bash
# Via adb
adb uninstall com.breathingapp

# Or manually on phone
# Settings → Apps → Breathing App → Uninstall
```

---

## Getting Help

- **Issues**: https://github.com/mjgardner87/breathing_app/issues
- **Discussions**: https://github.com/mjgardner87/breathing_app/discussions

---

## Legal

This app is NOT affiliated with Wim Hof or the official Wim Hof Method. It is a free, open-source personal tool created for educational purposes.

For the official Wim Hof Method experience, visit https://www.wimhofmethod.com
