# Innerfire

A sleek, minimalistic mobile app for guided breathing exercises, designed with a linear, rayscape-inspired aesthetic. Innerfire helps you unlock your potential through controlled breathing, featuring automated guidance, session tracking, and a focus on clean, distraction-free design.

## ⚠️ Important Disclaimer

**This is NOT an official Wim Hof Method app and is NOT affiliated with, endorsed by, or connected to Wim Hof or his organisation in any way.**

This is a personal project built as a free tool for practicing breathing exercises. It is made available to others at no cost for educational and personal use. The developer has had no engagement with Wim Hof, his team, or any official Wim Hof Method organisation.

If you want the official Wim Hof Method experience, please visit [wimhofmethod.com](https://www.wimhofmethod.com) or download the official Wim Hof Method app.

## Features

- **Sleek Linear Aesthetic** - A distraction-free, rayscape-inspired interface designed for focus.
- **Light & Dark Mode** - Automatically syncs with your system settings, or can be manually toggled to your preference (Crisp Air Light or Deep Frozen Night).
- **Guided Breathing Sessions** - Automated visual animations and audio cues for the complete breathing cycle.
- **Pause Control** - Pause paced breathing without losing your place. Interruptions return to normal breathing before restarting a round.
- **Audio Cues** - Subtle inhale/exhale soundscapes plus voice prompts for holds, recovery breaths, and minute markers.
- **Session History & Trends** - Local storage of every session plus a dedicated History screen with rolling averages, streaks, and a full log of hold times.
- **Customisable Protocols** - Adjustable breaths per round, number of rounds, breathing pace, and recovery breath duration.
- **Optional Minute Markers** - Time information is off by default. Breathe in whenever you need to.
- **Always-On Display** - Screen stays awake during active sessions.
- **Privacy-First** - All data stored locally on your device, no account required.

## Tracking Your Progress

- **Where your data lives:** Session preferences and history are stored on-device only using AsyncStorage. Nothing leaves your phone.
- **Quick glance:** The Dashboard shows total sessions, best hold, and the last twenty activities. Tap **View History & Trends** to dive deeper.
- **History screen:** Review every session, see a rolling average of your recent holds, monitor daily streaks, and clear the timeline if you want a fresh start.
- **Trend logic:** Rolling averages look at your last seven sessions and compare them against the previous window to highlight whether you are progressing or need more consistency.

## The Breathing Technique

The breathing technique consists of:

1. **Active Breathing Phase** - 30-40 deep breaths (inhale fully, exhale without force).
2. **Breath Hold Phase** - After the last exhale, pause until you feel the urge to breathe.
3. **Recovery Breath** - One deep inhale, hold for 15 seconds, then release.
4. **Repeat** - Complete 3-4 rounds total.

## 📥 Installation

**Choose your installation method:**

### Option 1: Download Pre-Built APK (Easiest)

1. Go to [Releases](https://github.com/mjgardner87/breathing_app/releases).
2. Download the latest `innerfire-release.apk`.
3. Transfer to your Android phone.
4. Enable "Install from Unknown Sources" in Settings if prompted.
5. Install and run!

**Note:** Audio files are now bundled with the app. You do not need to manually install them.

### Option 2: Build It Yourself

See [INSTALL.md](INSTALL.md) for detailed development environment setup and build instructions.

## 🔊 Guided sessions

Choose Learn, Guided or Minimal narration. Voice and breath-sound volumes are separate, with an audio preview in Settings. All recordings work offline.

The session explains preparation, the final exhale, comfortable retention, recovery and settling. Optional body-awareness prompts invite relaxed hands and noticing support, without seeking sensations. Recovery includes a spoken countdown and an early-release button. The large Breathe in now button ends retention whenever needed.

Gentle breathing offers a separate five-minute practice without holds. Completed rounds and gentle-session durations are saved locally. All displayed hold times use rounded minutes and seconds.

See [audio-files.md](docs/audio-files.md) to edit or regenerate the bundled recordings.

## Development

### Project Structure

```

Innerfire/
├── src/
│   ├── screens/          # Dashboard, Settings, Session screens
│   ├── components/       # Reusable components (BreathingCircle, Logo, etc.)
│   ├── context/          # Theme context and state management
│   ├── hooks/            # Custom React hooks (useSessionState)
│   ├── services/         # StorageService, AudioService
│   ├── navigation/       # React Navigation setup
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # Theme definitions (Dark/Light palettes)
│   └── utils/            # Utility functions
├── android/              # Android native code and bundled assets
├── docs/                 # Documentation and implementation plans
└── App.tsx               # App entry point
```

### Tech Stack

- **React Native 0.83+** - Mobile framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **AsyncStorage** - Local data persistence
- **React Native Reanimated** - Smooth animations
- **React Native Sound Player** - Audio playback
- **React Native Keep Awake** - Screen wake lock
- **Jest** - Testing framework

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## Licence

This project is provided **free of charge** for personal, educational, and non-commercial use. It is a community-driven, open-source tool built for personal practice and shared freely with others.

**No affiliation**: This app is not affiliated with, endorsed by, or connected to Wim Hof or any official Wim Hof Method organisation.

## Version

Current Version: 1.2.0 (Guided Sessions)

Built with ❄️ and 🫁
