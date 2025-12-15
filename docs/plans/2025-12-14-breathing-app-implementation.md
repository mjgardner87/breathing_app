# Wim Hof Breathing App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React Native Android app that guides users through Wim Hof breathing exercises with automated visual/audio cues and session tracking.

**Architecture:** React Navigation for screens, AsyncStorage for local persistence, Reanimated for breathing animation, session state machine for phase transitions, audio cues synced with visual timing.

**Tech Stack:** React Native 0.73+, TypeScript, React Navigation 6, AsyncStorage, React Native Reanimated 3, React Native Sound, React Native Keep Awake, Jest, React Native Testing Library.

---

## Prerequisites

- Node.js 18+ installed
- Android Studio with Android SDK
- Samsung S24 connected via USB with developer mode enabled
- `npx` available globally

---

## Task 1: Initialize React Native Project

**Files:**
- Create: Project root at `~/Documents/BreathingApp/`
- Create: `package.json`, `tsconfig.json`, `app.json`, etc. (via CLI)

**Step 1: Initialize React Native project with TypeScript**

```bash
cd ~/Documents/BreathingApp
npx react-native@latest init BreathingApp --template react-native-template-typescript --directory .
```

Expected: Project scaffolded with TypeScript template, dependencies installed

**Step 2: Verify project structure**

```bash
ls -la
```

Expected: See `android/`, `ios/`, `src/`, `App.tsx`, `package.json`, etc.

**Step 3: Test initial build on device**

```bash
npx react-native run-android
```

Expected: App launches on Samsung S24 showing "Welcome to React Native" screen

**Step 4: Initial git commit**

```bash
git init
git add .
git commit -m "chore: initialize React Native project with TypeScript"
```

---

## Task 2: Install Core Dependencies

**Files:**
- Modify: `package.json` (dependencies added via npm)

**Step 1: Install navigation dependencies**

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
```

**Step 2: Install data persistence**

```bash
npm install @react-native-async-storage/async-storage
```

**Step 3: Install animation and media**

```bash
npm install react-native-reanimated react-native-gesture-handler
npm install react-native-sound
npm install react-native-keep-awake
```

**Step 4: Install utilities**

```bash
npm install uuid date-fns
npm install --save-dev @types/uuid
```

**Step 5: Install testing dependencies**

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

**Step 6: Configure Reanimated in babel.config.js**

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

**Step 7: Rebuild and verify**

```bash
npx react-native run-android
```

Expected: App still launches successfully

**Step 8: Commit dependencies**

```bash
git add package.json package-lock.json babel.config.js
git commit -m "chore: add core dependencies for navigation, storage, animation"
```

---

## Task 3: Setup Project Structure

**Files:**
- Create: `src/screens/Dashboard.tsx`
- Create: `src/screens/Settings.tsx`
- Create: `src/screens/Session.tsx`
- Create: `src/services/StorageService.ts`
- Create: `src/services/AudioService.ts`
- Create: `src/types/index.ts`
- Create: `src/constants/theme.ts`
- Create: `src/navigation/AppNavigator.tsx`

**Step 1: Create type definitions**

File: `src/types/index.ts`

```typescript
export interface UserPreferences {
  breathsPerRound: number;
  numberOfRounds: number;
  recoveryDuration: number;
}

export interface SessionData {
  id: string;
  date: string;
  completedRounds: number;
  holdTimes: number[];
  settings: UserPreferences;
}

export type SessionPhase =
  | 'breathing'
  | 'holding'
  | 'recovery'
  | 'complete';

export interface SessionState {
  currentRound: number;
  currentPhase: SessionPhase;
  breathCount: number;
  holdStartTime: number | null;
  holdTimes: number[];
}
```

**Step 2: Create theme constants**

File: `src/constants/theme.ts`

```typescript
export const theme = {
  colours: {
    background: '#1a1f36',
    breathingCircleStart: '#4facfe',
    breathingCircleEnd: '#00f2fe',
    text: '#ffffff',
    accent: '#8b5cf6',
    success: '#6dd5a4',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    header: {
      fontSize: 28,
      fontWeight: 'bold' as const,
    },
    timer: {
      fontSize: 56,
      fontFamily: 'monospace',
    },
    body: {
      fontSize: 17,
      fontWeight: '500' as const,
    },
  },
};
```

**Step 3: Create placeholder screens**

File: `src/screens/Dashboard.tsx`

```typescript
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {theme} from '../constants/theme';

export const Dashboard: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colours.text,
    fontSize: 24,
  },
});
```

File: `src/screens/Settings.tsx`

```typescript
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {theme} from '../constants/theme';

export const Settings: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colours.text,
    fontSize: 24,
  },
});
```

File: `src/screens/Session.tsx`

```typescript
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {theme} from '../constants/theme';

export const Session: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Session</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colours.text,
    fontSize: 24,
  },
});
```

**Step 4: Create navigation**

File: `src/navigation/AppNavigator.tsx`

```typescript
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Dashboard} from '../screens/Dashboard';
import {Settings} from '../screens/Settings';
import {Session} from '../screens/Session';

export type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  Session: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Session" component={Session} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

**Step 5: Update App.tsx to use navigation**

File: `App.tsx`

```typescript
import React from 'react';
import {AppNavigator} from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return <AppNavigator />;
}

export default App;
```

**Step 6: Test navigation setup**

```bash
npx react-native run-android
```

Expected: Dashboard screen displays "Dashboard" text

**Step 7: Commit project structure**

```bash
git add src/ App.tsx
git commit -m "feat: add project structure with navigation and placeholder screens"
```

---

## Task 4: Implement Storage Service with Tests

**Files:**
- Create: `src/services/__tests__/StorageService.test.ts`
- Create: `src/services/StorageService.ts`

**Step 1: Write failing test for default preferences**

File: `src/services/__tests__/StorageService.test.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StorageService} from '../StorageService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('returns default preferences when nothing stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const prefs = await StorageService.getPreferences();

      expect(prefs).toEqual({
        breathsPerRound: 30,
        numberOfRounds: 3,
        recoveryDuration: 15,
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- StorageService.test.ts
```

Expected: FAIL - StorageService module not found

**Step 3: Implement StorageService with getPreferences**

File: `src/services/StorageService.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserPreferences, SessionData} from '../types';

const PREFERENCES_KEY = '@breathingapp:preferences';
const SESSIONS_KEY = '@breathingapp:sessions';

const DEFAULT_PREFERENCES: UserPreferences = {
  breathsPerRound: 30,
  numberOfRounds: 3,
  recoveryDuration: 15,
};

export class StorageService {
  static async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (!data) {
        return DEFAULT_PREFERENCES;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  static async savePreferences(prefs: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }

  static async getSessions(): Promise<SessionData[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  static async saveSession(session: SessionData): Promise<void> {
    try {
      const sessions = await this.getSessions();
      sessions.unshift(session); // Add to beginning
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- StorageService.test.ts
```

Expected: PASS

**Step 5: Add more tests for save and load**

Add to `src/services/__tests__/StorageService.test.ts`:

```typescript
  describe('savePreferences', () => {
    it('saves preferences to AsyncStorage', async () => {
      const prefs = {breathsPerRound: 40, numberOfRounds: 4, recoveryDuration: 20};

      await StorageService.savePreferences(prefs);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@breathingapp:preferences',
        JSON.stringify(prefs)
      );
    });
  });

  describe('getSessions', () => {
    it('returns empty array when no sessions stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const sessions = await StorageService.getSessions();

      expect(sessions).toEqual([]);
    });

    it('returns parsed sessions when data exists', async () => {
      const mockSessions = [
        {
          id: '123',
          date: '2025-12-14T10:00:00Z',
          completedRounds: 3,
          holdTimes: [90, 120, 150],
          settings: {breathsPerRound: 30, numberOfRounds: 3, recoveryDuration: 15},
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSessions));

      const sessions = await StorageService.getSessions();

      expect(sessions).toEqual(mockSessions);
    });
  });

  describe('saveSession', () => {
    it('adds new session to beginning of array', async () => {
      const existingSessions = [
        {
          id: '123',
          date: '2025-12-14T10:00:00Z',
          completedRounds: 3,
          holdTimes: [90],
          settings: {breathsPerRound: 30, numberOfRounds: 3, recoveryDuration: 15},
        },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingSessions));

      const newSession = {
        id: '456',
        date: '2025-12-14T11:00:00Z',
        completedRounds: 3,
        holdTimes: [100],
        settings: {breathsPerRound: 30, numberOfRounds: 3, recoveryDuration: 15},
      };

      await StorageService.saveSession(newSession);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@breathingapp:sessions',
        JSON.stringify([newSession, ...existingSessions])
      );
    });
  });
```

**Step 6: Run all tests**

```bash
npm test -- StorageService.test.ts
```

Expected: All tests PASS

**Step 7: Commit StorageService**

```bash
git add src/services/
git commit -m "feat: add StorageService with AsyncStorage integration and tests"
```

---

## Task 5: Build Dashboard Screen with Stats

**Files:**
- Create: `src/screens/__tests__/Dashboard.test.tsx`
- Modify: `src/screens/Dashboard.tsx`
- Create: `src/components/SessionHistoryItem.tsx`
- Create: `src/utils/statsCalculator.ts`

**Step 1: Write test for stats calculation utility**

File: `src/utils/__tests__/statsCalculator.test.ts`

```typescript
import {calculateStats} from '../statsCalculator';
import {SessionData} from '../../types';

describe('statsCalculator', () => {
  it('returns zero stats for empty sessions', () => {
    const stats = calculateStats([]);

    expect(stats).toEqual({
      totalSessions: 0,
      averageHold: 0,
      bestHold: 0,
      lastSessionDate: null,
    });
  });

  it('calculates correct stats from multiple sessions', () => {
    const sessions: SessionData[] = [
      {
        id: '1',
        date: '2025-12-14T10:00:00Z',
        completedRounds: 3,
        holdTimes: [90, 120, 150],
        settings: {breathsPerRound: 30, numberOfRounds: 3, recoveryDuration: 15},
      },
      {
        id: '2',
        date: '2025-12-13T10:00:00Z',
        completedRounds: 3,
        holdTimes: [80, 100, 130],
        settings: {breathsPerRound: 30, numberOfRounds: 3, recoveryDuration: 15},
      },
    ];

    const stats = calculateStats(sessions);

    expect(stats.totalSessions).toBe(2);
    expect(stats.averageHold).toBe(111.67); // (90+120+150+80+100+130)/6 = 111.67
    expect(stats.bestHold).toBe(150);
    expect(stats.lastSessionDate).toBe('2025-12-14T10:00:00Z');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- statsCalculator.test.ts
```

Expected: FAIL - module not found

**Step 3: Implement stats calculator**

File: `src/utils/statsCalculator.ts`

```typescript
import {SessionData} from '../types';

export interface Stats {
  totalSessions: number;
  averageHold: number;
  bestHold: number;
  lastSessionDate: string | null;
}

export function calculateStats(sessions: SessionData[]): Stats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageHold: 0,
      bestHold: 0,
      lastSessionDate: null,
    };
  }

  const allHoldTimes = sessions.flatMap(s => s.holdTimes);
  const totalHoldTime = allHoldTimes.reduce((sum, time) => sum + time, 0);
  const averageHold = Math.round((totalHoldTime / allHoldTimes.length) * 100) / 100;
  const bestHold = Math.max(...allHoldTimes);

  return {
    totalSessions: sessions.length,
    averageHold,
    bestHold,
    lastSessionDate: sessions[0].date, // First item is newest
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- statsCalculator.test.ts
```

Expected: PASS

**Step 5: Implement Dashboard screen with stats**

File: `src/screens/Dashboard.tsx`

```typescript
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {StorageService} from '../services/StorageService';
import {SessionData} from '../types';
import {calculateStats, formatTime} from '../utils/statsCalculator';
import {theme} from '../constants/theme';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export const Dashboard: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await StorageService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateStats(sessions);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Breathe</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colours.accent} />
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.averageHold)}</Text>
              <Text style={styles.statLabel}>Average Hold</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.bestHold)}</Text>
              <Text style={styles.statLabel}>Best Hold</Text>
            </View>
          </View>

          {/* Start Session Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Session')}>
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>

          {/* Session History */}
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Sessions</Text>
            <ScrollView style={styles.historyList}>
              {sessions.length === 0 ? (
                <Text style={styles.emptyText}>
                  No sessions yet - start your first practice!
                </Text>
              ) : (
                sessions.slice(0, 20).map(session => (
                  <View key={session.id} style={styles.historyItem}>
                    <Text style={styles.historyDate}>
                      {new Date(session.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyDetails}>
                      {session.completedRounds} rounds • Best: {formatTime(Math.max(...session.holdTimes))}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colours.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: theme.spacing.sm,
  },
  settingsIcon: {
    fontSize: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: theme.colours.success,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: theme.colours.text,
    fontSize: 12,
    opacity: 0.7,
    marginTop: theme.spacing.xs,
  },
  startButton: {
    backgroundColor: theme.colours.accent,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  startButtonText: {
    color: theme.colours.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    color: theme.colours.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  historyDate: {
    color: theme.colours.text,
    fontSize: 16,
    fontWeight: '600',
  },
  historyDetails: {
    color: theme.colours.text,
    fontSize: 14,
    opacity: 0.7,
    marginTop: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colours.text,
    fontSize: 16,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
```

**Step 6: Test on device**

```bash
npx react-native run-android
```

Expected: Dashboard displays with stats (zeros), Start Session button, empty history

**Step 7: Commit Dashboard implementation**

```bash
git add src/screens/Dashboard.tsx src/utils/
git commit -m "feat: implement Dashboard screen with stats and session history"
```

---

## Task 6: Build Settings Screen with Sliders

**Files:**
- Modify: `src/screens/Settings.tsx`

**Step 1: Implement Settings screen**

File: `src/screens/Settings.tsx`

```typescript
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import {StorageService} from '../services/StorageService';
import {UserPreferences} from '../types';
import {theme} from '../constants/theme';

export const Settings: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<UserPreferences>({
    breathsPerRound: 30,
    numberOfRounds: 3,
    recoveryDuration: 15,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await StorageService.getPreferences();
      setPrefs(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: number) => {
    const newPrefs = {...prefs, [key]: value};
    setPrefs(newPrefs);
    try {
      await StorageService.savePreferences(newPrefs);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const resetToDefaults = async () => {
    const defaults: UserPreferences = {
      breathsPerRound: 30,
      numberOfRounds: 3,
      recoveryDuration: 15,
    };
    setPrefs(defaults);
    try {
      await StorageService.savePreferences(defaults);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colours.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Breaths Per Round */}
      <View style={styles.settingSection}>
        <Text style={styles.settingValue}>{prefs.breathsPerRound} breaths</Text>
        <Text style={styles.settingLabel}>Breaths Per Round</Text>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={50}
          step={1}
          value={prefs.breathsPerRound}
          onValueChange={val => updatePreference('breathsPerRound', val)}
          minimumTrackTintColor={theme.colours.accent}
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor={theme.colours.accent}
        />
        <Text style={styles.helpText}>Standard Wim Hof protocol uses 30-40 breaths</Text>
      </View>

      {/* Number of Rounds */}
      <View style={styles.settingSection}>
        <Text style={styles.settingValue}>{prefs.numberOfRounds} rounds</Text>
        <Text style={styles.settingLabel}>Number of Rounds</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={prefs.numberOfRounds}
          onValueChange={val => updatePreference('numberOfRounds', val)}
          minimumTrackTintColor={theme.colours.accent}
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor={theme.colours.accent}
        />
        <Text style={styles.helpText}>Most practitioners do 3-4 rounds per session</Text>
      </View>

      {/* Recovery Duration */}
      <View style={styles.settingSection}>
        <Text style={styles.settingValue}>{prefs.recoveryDuration} seconds</Text>
        <Text style={styles.settingLabel}>Recovery Breath Hold</Text>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={30}
          step={1}
          value={prefs.recoveryDuration}
          onValueChange={val => updatePreference('recoveryDuration', val)}
          minimumTrackTintColor={theme.colours.accent}
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor={theme.colours.accent}
        />
        <Text style={styles.helpText}>Hold your recovery breath for this duration</Text>
      </View>

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
        <Text style={styles.resetButtonText}>Reset to Default</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    color: theme.colours.text,
    fontSize: 32,
  },
  title: {
    color: theme.colours.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  settingSection: {
    marginBottom: theme.spacing.xl,
  },
  settingValue: {
    color: theme.colours.text,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingLabel: {
    color: theme.colours.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  helpText: {
    color: theme.colours.text,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  resetButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  resetButtonText: {
    color: theme.colours.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Step 2: Install slider dependency**

```bash
npm install @react-native-community/slider
```

**Step 3: Rebuild and test**

```bash
npx react-native run-android
```

Expected: Settings screen shows sliders, values update in real-time, preferences persist

**Step 4: Commit Settings implementation**

```bash
git add src/screens/Settings.tsx package.json package-lock.json
git commit -m "feat: implement Settings screen with slider controls"
```

---

## Task 7: Session State Machine

**Files:**
- Create: `src/hooks/useSessionState.ts`
- Create: `src/hooks/__tests__/useSessionState.test.ts`

**Step 1: Write test for session state hook**

File: `src/hooks/__tests__/useSessionState.test.ts`

```typescript
import {renderHook, act} from '@testing-library/react-native';
import {useSessionState} from '../useSessionState';

describe('useSessionState', () => {
  const mockPrefs = {
    breathsPerRound: 30,
    numberOfRounds: 3,
    recoveryDuration: 15,
  };

  it('initializes in breathing phase', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    expect(result.current.state.currentPhase).toBe('breathing');
    expect(result.current.state.currentRound).toBe(1);
    expect(result.current.state.breathCount).toBe(0);
  });

  it('advances breath count', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    act(() => {
      result.current.incrementBreath();
    });

    expect(result.current.state.breathCount).toBe(1);
  });

  it('transitions to holding phase after final breath', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    // Complete 30 breaths
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.incrementBreath();
      }
    });

    expect(result.current.state.currentPhase).toBe('holding');
  });

  it('transitions to recovery after completing hold', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    // Complete breathing phase
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.incrementBreath();
      }
    });

    // Complete hold
    act(() => {
      result.current.completeHold(120); // 2 minutes
    });

    expect(result.current.state.currentPhase).toBe('recovery');
    expect(result.current.state.holdTimes).toEqual([120]);
  });

  it('advances to next round after recovery', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    // Round 1
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.incrementBreath();
      }
      result.current.completeHold(120);
      result.current.completeRecovery();
    });

    expect(result.current.state.currentRound).toBe(2);
    expect(result.current.state.currentPhase).toBe('breathing');
    expect(result.current.state.breathCount).toBe(0);
  });

  it('transitions to complete after final round', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    // Complete 3 rounds
    for (let round = 0; round < 3; round++) {
      act(() => {
        for (let i = 0; i < 30; i++) {
          result.current.incrementBreath();
        }
        result.current.completeHold(120);
        result.current.completeRecovery();
      });
    }

    expect(result.current.state.currentPhase).toBe('complete');
    expect(result.current.state.holdTimes.length).toBe(3);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- useSessionState.test.ts
```

Expected: FAIL - module not found

**Step 3: Implement session state hook**

File: `src/hooks/useSessionState.ts`

```typescript
import {useState, useCallback} from 'react';
import {UserPreferences, SessionState, SessionPhase} from '../types';

interface UseSessionStateReturn {
  state: SessionState;
  incrementBreath: () => void;
  completeHold: (duration: number) => void;
  completeRecovery: () => void;
  reset: () => void;
}

export function useSessionState(prefs: UserPreferences): UseSessionStateReturn {
  const [state, setState] = useState<SessionState>({
    currentRound: 1,
    currentPhase: 'breathing',
    breathCount: 0,
    holdStartTime: null,
    holdTimes: [],
  });

  const incrementBreath = useCallback(() => {
    setState(prev => {
      const newBreathCount = prev.breathCount + 1;

      // Check if we've completed this round's breathing
      if (newBreathCount >= prefs.breathsPerRound) {
        return {
          ...prev,
          breathCount: newBreathCount,
          currentPhase: 'holding',
          holdStartTime: Date.now(),
        };
      }

      return {
        ...prev,
        breathCount: newBreathCount,
      };
    });
  }, [prefs.breathsPerRound]);

  const completeHold = useCallback((duration: number) => {
    setState(prev => ({
      ...prev,
      currentPhase: 'recovery',
      holdTimes: [...prev.holdTimes, duration],
      holdStartTime: null,
    }));
  }, []);

  const completeRecovery = useCallback(() => {
    setState(prev => {
      // Check if we've completed all rounds
      if (prev.currentRound >= prefs.numberOfRounds) {
        return {
          ...prev,
          currentPhase: 'complete',
        };
      }

      // Move to next round
      return {
        ...prev,
        currentRound: prev.currentRound + 1,
        currentPhase: 'breathing',
        breathCount: 0,
      };
    });
  }, [prefs.numberOfRounds]);

  const reset = useCallback(() => {
    setState({
      currentRound: 1,
      currentPhase: 'breathing',
      breathCount: 0,
      holdStartTime: null,
      holdTimes: [],
    });
  }, []);

  return {
    state,
    incrementBreath,
    completeHold,
    completeRecovery,
    reset,
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- useSessionState.test.ts
```

Expected: PASS

**Step 5: Commit session state machine**

```bash
git add src/hooks/
git commit -m "feat: implement session state machine with phase transitions"
```

---

## Task 8: Build Session Screen - Breathing Phase

**Files:**
- Modify: `src/screens/Session.tsx`
- Create: `src/components/BreathingCircle.tsx`

**Step 1: Create breathing animation component**

File: `src/components/BreathingCircle.tsx`

```typescript
import React, {useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import {theme} from '../constants/theme';

interface BreathingCircleProps {
  breathCount: number;
  totalBreaths: number;
  isAnimating: boolean;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  breathCount,
  totalBreaths,
  isAnimating,
}) => {
  const scale = useSharedValue(0.4);

  useEffect(() => {
    if (isAnimating) {
      // Breathing cycle: 3s expand (inhale), 2.5s contract (exhale)
      scale.value = withRepeat(
        withTiming(0.7, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite
        true, // Reverse
      );
    } else {
      scale.value = withTiming(0.4, {duration: 500});
    }
  }, [isAnimating]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, animatedStyle]}>
        <Text style={styles.breathCount}>
          {breathCount} / {totalBreaths}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colours.breathingCircleStart,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colours.breathingCircleEnd,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  breathCount: {
    color: theme.colours.text,
    fontSize: 40,
    fontWeight: 'bold',
  },
});
```

**Step 2: Implement Session screen with breathing phase**

File: `src/screens/Session.tsx`

```typescript
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import KeepAwake from 'react-native-keep-awake';
import {StorageService} from '../services/StorageService';
import {UserPreferences} from '../types';
import {useSessionState} from '../hooks/useSessionState';
import {BreathingCircle} from '../components/BreathingCircle';
import {theme} from '../constants/theme';
import {v4 as uuidv4} from 'uuid';

export const Session: React.FC = () => {
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState<UserPreferences>({
    breathsPerRound: 30,
    numberOfRounds: 3,
    recoveryDuration: 15,
  });
  const {state, incrementBreath, completeHold, completeRecovery} = useSessionState(prefs);
  const [holdTimer, setHoldTimer] = useState(0);

  useEffect(() => {
    loadPreferences();
    KeepAwake.activate();

    return () => {
      KeepAwake.deactivate();
    };
  }, []);

  // Breathing phase auto-increment
  useEffect(() => {
    if (state.currentPhase === 'breathing') {
      const breathInterval = setInterval(() => {
        incrementBreath();
      }, 5500); // 5.5 seconds per breath cycle

      return () => clearInterval(breathInterval);
    }
  }, [state.currentPhase, incrementBreath]);

  // Hold timer
  useEffect(() => {
    if (state.currentPhase === 'holding' && state.holdStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.holdStartTime!) / 1000);
        setHoldTimer(elapsed);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [state.currentPhase, state.holdStartTime]);

  // Recovery countdown
  useEffect(() => {
    if (state.currentPhase === 'recovery') {
      const timeout = setTimeout(() => {
        completeRecovery();
      }, prefs.recoveryDuration * 1000);

      return () => clearTimeout(timeout);
    }
  }, [state.currentPhase, prefs.recoveryDuration, completeRecovery]);

  // Session complete - save and navigate
  useEffect(() => {
    if (state.currentPhase === 'complete') {
      saveSession();
    }
  }, [state.currentPhase]);

  const loadPreferences = async () => {
    const data = await StorageService.getPreferences();
    setPrefs(data);
  };

  const saveSession = async () => {
    const session = {
      id: uuidv4(),
      date: new Date().toISOString(),
      completedRounds: state.currentRound,
      holdTimes: state.holdTimes,
      settings: prefs,
    };

    await StorageService.saveSession(session);
  };

  const handleDoneHolding = () => {
    completeHold(holdTimer);
    setHoldTimer(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    KeepAwake.deactivate();
    navigation.goBack();
  };

  // Render phase-specific UI
  const renderPhaseContent = () => {
    switch (state.currentPhase) {
      case 'breathing':
        return (
          <>
            <Text style={styles.phaseText}>
              Round {state.currentRound} of {prefs.numberOfRounds} - Breathing
            </Text>
            <BreathingCircle
              breathCount={state.breathCount}
              totalBreaths={prefs.breathsPerRound}
              isAnimating={true}
            />
          </>
        );

      case 'holding':
        return (
          <>
            <Text style={styles.phaseText}>Hold your breath</Text>
            <View style={styles.holdContainer}>
              <Text style={styles.holdTimer}>{formatTime(holdTimer)}</Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleDoneHolding}>
                <Text style={styles.doneButtonText}>Done Holding</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'recovery':
        return (
          <>
            <Text style={styles.phaseText}>Recovery Breath</Text>
            <View style={styles.recoveryContainer}>
              <Text style={styles.recoveryText}>
                Hold for {prefs.recoveryDuration} seconds
              </Text>
            </View>
          </>
        );

      case 'complete':
        return (
          <>
            <Text style={styles.phaseText}>Session Complete!</Text>
            <View style={styles.summaryContainer}>
              {state.holdTimes.map((time, index) => (
                <Text key={index} style={styles.summaryText}>
                  Round {index + 1}: {formatTime(time)}
                </Text>
              ))}
              <TouchableOpacity
                style={styles.finishButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.finishButtonText}>Finish</Text>
              </TouchableOpacity>
            </View>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>✕</Text>
      </TouchableOpacity>

      {renderPhaseContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    padding: theme.spacing.lg,
  },
  cancelButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 10,
    padding: theme.spacing.sm,
  },
  cancelText: {
    color: theme.colours.text,
    fontSize: 32,
    opacity: 0.6,
  },
  phaseText: {
    color: theme.colours.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  holdContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdTimer: {
    color: theme.colours.text,
    fontSize: 64,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xl,
  },
  doneButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colours.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colours.accent,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  doneButtonText: {
    color: theme.colours.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  recoveryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryText: {
    color: theme.colours.text,
    fontSize: 20,
    textAlign: 'center',
  },
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    color: theme.colours.text,
    fontSize: 20,
    marginBottom: theme.spacing.md,
  },
  finishButton: {
    backgroundColor: theme.colours.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl * 2,
    borderRadius: 12,
    marginTop: theme.spacing.xl,
  },
  finishButtonText: {
    color: theme.colours.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

**Step 3: Test on device**

```bash
npx react-native run-android
```

Expected: Session starts, breathing animation cycles, auto-progresses through phases

**Step 4: Commit Session screen**

```bash
git add src/screens/Session.tsx src/components/BreathingCircle.tsx
git commit -m "feat: implement Session screen with breathing phase and state transitions"
```

---

## Task 9: Add Audio Integration with Minute Marker Notifications

**Files:**
- Create: `src/services/AudioService.ts`
- Create: `android/app/src/main/res/raw/README.md`
- Modify: `src/screens/Session.tsx`

**Note:** For v1, we'll create the audio service structure but use placeholder audio files. You'll need to record or source actual audio clips separately.

**NEW FEATURE:** Minute marker notifications play a bell or voice sound every 60 seconds during breath holds to help users track their progress.

**Step 1: Create audio service**

File: `src/services/AudioService.ts`

```typescript
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

class AudioServiceClass {
  private sounds: Map<string, Sound> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Note: Audio files need to be placed in android/app/src/main/res/raw/
    const audioFiles = [
      'breathe_in',
      'breathe_out',
      'hold_breath',
      'recovery_breath',
      'release',
      'round_complete',
      'minute_marker', // NEW: Plays every 60 seconds during holds
    ];

    const loadPromises = audioFiles.map(
      file =>
        new Promise<void>((resolve, reject) => {
          const sound = new Sound(`${file}.mp3`, Sound.MAIN_BUNDLE, error => {
            if (error) {
              console.warn(`Failed to load sound: ${file}`, error);
              resolve(); // Don't fail initialization if one file missing
            } else {
              this.sounds.set(file, sound);
              resolve();
            }
          });
        }),
    );

    await Promise.all(loadPromises);
    this.initialized = true;
  }

  play(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.play(success => {
        if (!success) {
          console.warn(`Sound playback failed: ${name}`);
        }
      });
    } else {
      console.warn(`Sound not found: ${name}`);
    }
  }

  release(): void {
    this.sounds.forEach(sound => sound.release());
    this.sounds.clear();
    this.initialized = false;
  }
}

export const AudioService = new AudioServiceClass();
```

**Step 2: Create audio directory structure with minute marker documentation**

```bash
mkdir -p android/app/src/main/res/raw
```

File: `android/app/src/main/res/raw/README.md`

```markdown
# Audio Files

Place the following audio files in this directory (`android/app/src/main/res/raw/`):

## Required Audio Files

- `breathe_in.mp3` - "Breathe in" voice cue (~1 second)
- `breathe_out.mp3` - "Breathe out" voice cue (~1 second)
- `hold_breath.mp3` - "Hold your breath" voice cue (~2 seconds)
- `recovery_breath.mp3` - "Take a deep breath in and hold" voice cue (~3 seconds)
- `release.mp3` - "Release" voice cue (~1 second)
- `round_complete.mp3` - "Round complete" voice cue (~2 seconds)
- `minute_marker.mp3` - **NEW**: Bell or voice notification for minute milestones during breath holds (~1 second)

## Minute Marker Feature

The `minute_marker.mp3` sound plays every 60 seconds during the breath hold phase to help users track their progress. This can be:
- A gentle bell sound
- A voice saying "One minute", "Two minutes", etc. (though just a consistent bell is recommended)
- Any clear but non-jarring sound

You can record these yourself or use text-to-speech tools to generate them.
```

**Step 3: Update Session screen to integrate AudioService with minute markers**

Add to `src/screens/Session.tsx` imports:

```typescript
import {AudioService} from '../services/AudioService';
```

Add state for tracking minute markers:

```typescript
const lastMinuteMarker = useRef(0); // Track last minute marker played
```

Update initialisation to include AudioService:

```typescript
useEffect(() => {
  loadPreferences();
  KeepAwake.activate();
  AudioService.initialize(); // Initialize audio

  return () => {
    KeepAwake.deactivate();
    AudioService.release(); // Clean up audio
  };
}, []);
```

Update breathing phase effect to play audio cues:

```typescript
useEffect(() => {
  if (state.currentPhase === 'breathing') {
    let breathInPlayed = false;

    const breathInterval = setInterval(() => {
      if (!breathInPlayed) {
        AudioService.play('breathe_in');
        breathInPlayed = true;
        setTimeout(() => {
          AudioService.play('breathe_out');
          breathInPlayed = false;
        }, 3000); // Play "breathe out" after 3 seconds
      }

      incrementBreath();
    }, 5500);

    return () => clearInterval(breathInterval);
  }
}, [state.currentPhase, incrementBreath]);
```

**NEW**: Update hold timer effect to include minute marker notifications:

```typescript
// Hold timer with minute marker notifications
useEffect(() => {
  if (state.currentPhase === 'holding' && state.holdStartTime) {
    // Play initial hold breath audio cue
    AudioService.play('hold_breath');
    lastMinuteMarker.current = 0;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.holdStartTime!) / 1000);
      setHoldTimer(elapsed);

      // Play minute marker sound every 60 seconds
      const currentMinute = Math.floor(elapsed / 60);
      if (currentMinute > lastMinuteMarker.current && currentMinute > 0) {
        AudioService.play('minute_marker');
        lastMinuteMarker.current = currentMinute;
      }
    }, 100);

    return () => clearInterval(interval);
  }
}, [state.currentPhase, state.holdStartTime]);
```

Update recovery phase to play audio cues:

```typescript
// Recovery countdown with audio cue
useEffect(() => {
  if (state.currentPhase === 'recovery') {
    AudioService.play('recovery_breath');

    const timeout = setTimeout(() => {
      AudioService.play('release');
      completeRecovery();
    }, prefs.recoveryDuration * 1000);

    return () => clearTimeout(timeout);
  }
}, [state.currentPhase, prefs.recoveryDuration, completeRecovery]);
```

Update session complete to play completion sound:

```typescript
// Session complete - save and navigate
useEffect(() => {
  if (state.currentPhase === 'complete') {
    AudioService.play('round_complete');
    saveSession();
  }
}, [state.currentPhase]);
```

**Step 4: Commit audio service with minute marker feature**

```bash
git add src/services/AudioService.ts android/app/src/main/res/raw/README.md src/screens/Session.tsx docs/
git commit -m "feat: add AudioService with minute marker notifications during breath holds"
```

---

## Task 10: Polish & Testing

**Step 1: Add safety warning on first launch**

File: `src/screens/Dashboard.tsx` - Add safety check:

```typescript
const [showSafetyWarning, setShowSafetyWarning] = useState(false);

useEffect(() => {
  checkFirstLaunch();
}, []);

const checkFirstLaunch = async () => {
  const hasSeenWarning = await AsyncStorage.getItem('@breathingapp:safety_warning_seen');
  if (!hasSeenWarning) {
    setShowSafetyWarning(true);
  }
};

const dismissSafetyWarning = async () => {
  await AsyncStorage.setItem('@breathingapp:safety_warning_seen', 'true');
  setShowSafetyWarning(false);
};

// Add modal component in render
{showSafetyWarning && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Safety First</Text>
      <Text style={styles.modalText}>
        Always practice breathing exercises while seated or lying down.
        {'\n\n'}
        Never practice while driving, in water, or in any situation where loss of consciousness could be dangerous.
      </Text>
      <TouchableOpacity style={styles.modalButton} onPress={dismissSafetyWarning}>
        <Text style={styles.modalButtonText}>I Understand</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
```

**Step 2: Add cancellation confirmation to Session**

Update `handleCancel` in `src/screens/Session.tsx`:

```typescript
const [showCancelConfirm, setShowCancelConfirm] = useState(false);

const handleCancel = () => {
  if (state.currentPhase !== 'complete') {
    setShowCancelConfirm(true);
  } else {
    KeepAwake.deactivate();
    navigation.goBack();
  }
};

const confirmCancel = () => {
  KeepAwake.deactivate();
  navigation.goBack();
};

// Add confirmation modal in render
{showCancelConfirm && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>End Session Early?</Text>
      <Text style={styles.modalText}>Progress won't be saved.</Text>
      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={styles.modalButtonSecondary}
          onPress={() => setShowCancelConfirm(false)}>
          <Text style={styles.modalButtonText}>No, continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalButton} onPress={confirmCancel}>
          <Text style={styles.modalButtonText}>Yes, end it</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}
```

**Step 3: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 4: Manual testing checklist**

On Samsung S24:
- [ ] Complete full 3-round session
- [ ] Verify session appears in Dashboard history
- [ ] Verify stats update correctly
- [ ] Adjust settings and start new session
- [ ] Cancel session mid-way (verify not saved)
- [ ] Background app during session (verify resume works)
- [ ] Screen stays awake during session
- [ ] Verify safety warning shows on first launch only

**Step 5: Commit polish changes**

```bash
git add src/
git commit -m "feat: add safety warning and cancellation confirmation"
```

---

## Task 11: Build APK for Installation

**Step 1: Generate release keystore**

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore breathing-app-release.keystore -alias breathing-app -keyalg RSA -keysize 2048 -validity 10000
```

Enter password when prompted (save this!)

**Step 2: Configure gradle for release**

File: `android/app/build.gradle` - Add signing config:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('breathing-app-release.keystore')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'breathing-app'
            keyPassword 'YOUR_PASSWORD'
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

**Step 3: Build release APK**

```bash
cd ~/Documents/BreathingApp
npx react-native build-android --mode=release
```

**Step 4: Locate and install APK**

```bash
# APK location
ls android/app/build/outputs/apk/release/

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Step 5: Test installed app**

Launch from app drawer, complete full session workflow

**Step 6: Final commit**

```bash
git add android/
git commit -m "chore: configure release build and generate signed APK"
git tag v1.0.0
```

---

## Completion Checklist

- [ ] All core screens implemented (Dashboard, Settings, Session)
- [ ] Session state machine with automatic phase transitions
- [ ] Breathing animation with Reanimated
- [ ] AsyncStorage persistence for sessions and preferences
- [ ] Wake lock keeps screen on during sessions
- [ ] Audio service structure (requires audio files)
- [ ] Safety warning on first launch
- [ ] Cancellation confirmation
- [ ] All unit tests passing
- [ ] Manual testing completed on Samsung S24
- [ ] Release APK built and installed

---

## Next Steps After v1

**Audio Recording:**
1. Record or generate 6 voice cue audio files
2. Place in `android/app/src/main/res/raw/`
3. Test audio playback synchronisation

**Optional Enhancements:**
- Haptic feedback on breath transitions
- Dark/light theme toggle
- Export session history to CSV
- Notification reminders for daily practice

---

**Document Version:** 1.0
**Created:** 14 December 2025
**Target Platform:** React Native 0.73+ / Android
**Estimated Implementation Time:** 20-30 hours
