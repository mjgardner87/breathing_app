# Breathing App

A React Native mobile app for guided breathing exercises inspired by the Wim Hof Method, with session tracking and customisation.

## ⚠️ Important Disclaimer

**This is NOT an official Wim Hof Method app and is NOT affiliated with, endorsed by, or connected to Wim Hof or his organisation in any way.**

This is a personal project built as a free tool for practicing breathing exercises inspired by the Wim Hof Method. It is made available to others at no cost for educational and personal use. The developer has had no engagement with Wim Hof, his team, or any official Wim Hof Method organisation.

If you want the official Wim Hof Method experience, please visit [wimhofmethod.com](https://www.wimhofmethod.com) or download the official Wim Hof Method app.

## Features

- **Guided Breathing Sessions** - Automated visual animations and audio cues for the complete Wim Hof breathing cycle
- **Session History** - Local storage of all completed sessions with breath hold times
- **Customisable Protocols** - Adjustable breaths per round, number of rounds, and recovery breath duration
- **Minute Markers** - Audio notification every minute during breath holds to track progress
- **Always-On Display** - Screen stays awake during active sessions
- **Privacy-First** - All data stored locally on device, no account required

## The Wim Hof Method

The Wim Hof Method breathing technique consists of:

1. **Active Breathing Phase** - 30 deep breaths (inhale fully through nose/mouth, exhale without force)
2. **Breath Hold Phase** - After the last exhale, hold breath as long as comfortable
3. **Recovery Breath** - One deep inhale, hold for 15 seconds, then release
4. **Repeat** - Complete 3-4 rounds total

## Prerequisites

- Node.js 18+ installed
- Android Studio with Android SDK
- Samsung S24 (or any Android device) with developer mode enabled
- `npx` available globally

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/mjgardner87/breathing_app.git
cd breathing_app

# Install dependencies
npm install

# Start Metro bundler
npm start
```

### Running on Android

```bash
# Make sure your device is connected via USB with USB debugging enabled
# Or start an Android emulator

# Build and run
npx react-native run-android
```

## Development

### Project Structure

```
BreathingApp/
├── src/
│   ├── screens/          # Dashboard, Settings, Session screens
│   ├── components/       # Reusable components (BreathingCircle, etc.)
│   ├── hooks/            # Custom React hooks (useSessionState)
│   ├── services/         # StorageService, AudioService
│   ├── navigation/       # React Navigation setup
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # Theme and constants
│   └── utils/            # Utility functions (statsCalculator, etc.)
├── android/              # Android native code
├── assets/               # Audio files and other assets
├── docs/                 # Documentation and implementation plans
└── App.tsx               # App entry point
```

### Tech Stack

- **React Native 0.83+** - Mobile framework
- **TypeScript** - Type safety
- **React Navigation 6** - Navigation
- **AsyncStorage** - Local data persistence
- **React Native Reanimated 3** - Smooth animations
- **React Native Sound** - Audio playback
- **React Native Keep Awake** - Screen wake lock
- **Jest** - Testing framework

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- StorageService.test.ts
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npx prettier --write "src/**/*.{ts,tsx}"

# Type check
npx tsc --noEmit
```

## Building for Release

### Generate Keystore

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore breathing-app-release.keystore -alias breathing-app -keyalg RSA -keysize 2048 -validity 10000
```

### Build APK

```bash
# Build release APK
npx react-native build-android --mode=release

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Audio Setup

Audio files need to be placed in `android/app/src/main/res/raw/`:

- `breathe_in.mp3` - "Breathe in" (~1 second)
- `breathe_out.mp3` - "Breathe out" (~1 second)
- `hold_breath.mp3` - "Hold your breath" (~2 seconds)
- `minute_marker.mp3` - Bell or voice notification for minute markers (~1 second)
- `recovery_breath.mp3` - "Take a deep breath in and hold" (~3 seconds)
- `release.mp3` - "Release" (~1 second)
- `round_complete.mp3` - "Round complete" (~2 seconds)

You can record these yourself or use text-to-speech tools to generate them.

## Safety

⚠️ **Always practice breathing exercises while seated or lying down.**

Never practice while driving, in water, or in any situation where loss of consciousness could be dangerous.

## Customisation

The app allows you to customise:

- **Breaths per round**: 10-50 breaths (default: 30)
- **Number of rounds**: 1-10 rounds (default: 3)
- **Recovery breath hold**: 10-30 seconds (default: 15)

## Architecture

The app follows a clean architecture pattern:

- **Screens** - UI components for Dashboard, Settings, and Session
- **Hooks** - React hooks for state management (session state machine)
- **Services** - Business logic layer (storage, audio)
- **Components** - Reusable UI components
- **Utils** - Pure utility functions

## License

This project is provided **free of charge** for personal, educational, and non-commercial use. It is a community-driven, open-source tool built for personal practice and shared freely with others.

**No affiliation**: This app is not affiliated with, endorsed by, or connected to Wim Hof or any official Wim Hof Method organisation.

See implementation plan in `docs/plans/` for detailed architecture and design decisions.

## Resources

- [Wim Hof Method Official Website](https://www.wimhofmethod.com/breathing-exercises)
- [React Native Documentation](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## Version

Current Version: 1.0.0

Built with ❄️ and 🫁
