import {ResolvedPreferences, UserPreferences} from '../types';

/**
 * Default user preferences for breathing sessions.
 * Single source of truth - do not duplicate elsewhere.
 */
export const DEFAULT_PREFERENCES: ResolvedPreferences = {
  breathsPerRound: 30,
  numberOfRounds: 3,
  recoveryDuration: 15,
  breathingSpeed: 2.0,
  guidance: 'guided',
  voiceVolume: 0.85,
  soundVolume: 0.4,
  retentionGuidance: true,
  minuteMarkers: false,
};

export function resolvePreferences(prefs: UserPreferences): ResolvedPreferences {
  const volume = (value: number | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.min(1, value))
      : fallback;
  const bounded = (value: number, min: number, max: number, fallback: number) =>
    Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  return {
    breathsPerRound: Math.round(bounded(prefs.breathsPerRound, 10, 50, 30)),
    numberOfRounds: Math.round(bounded(prefs.numberOfRounds, 1, 10, 3)),
    recoveryDuration: Math.round(bounded(prefs.recoveryDuration, 10, 30, 15)),
    breathingSpeed: Math.round(bounded(prefs.breathingSpeed, 1, 4, 2) * 2) / 2,
    guidance: prefs.guidance === 'learn' || prefs.guidance === 'minimal'
      ? prefs.guidance : 'guided',
    voiceVolume: volume(prefs.voiceVolume, DEFAULT_PREFERENCES.voiceVolume),
    soundVolume: volume(prefs.soundVolume, DEFAULT_PREFERENCES.soundVolume),
    retentionGuidance: prefs.retentionGuidance ?? true,
    minuteMarkers: prefs.minuteMarkers ?? false,
  };
}

/**
 * AsyncStorage keys used throughout the app.
 * Centralised to prevent typos and ensure consistency.
 */
export const STORAGE_KEYS = {
  preferences: '@breathingapp:preferences',
  sessions: '@breathingapp:sessions',
  sessionsBackup: '@breathingapp:sessions_backup',
  themePreference: '@breathingapp:theme_preference',
  safetyWarningSeen: '@breathingapp:safety_warning_seen',
} as const;

/**
 * Session presets for quick configuration.
 */
export const SESSION_PRESETS = {
  beginner: {
    name: 'Beginner',
    description: 'Gentle introduction with fewer breaths and slower pace',
    settings: {
      breathsPerRound: 20,
      numberOfRounds: 2,
      recoveryDuration: 15,
      breathingSpeed: 2.5,
    } as UserPreferences,
  },
  standard: {
    name: 'Standard',
    description: 'Classic Wim Hof protocol',
    settings: {
      breathsPerRound: 30,
      numberOfRounds: 3,
      recoveryDuration: 15,
      breathingSpeed: 2.0,
    } as UserPreferences,
  },
  advanced: {
    name: 'Advanced',
    description: 'Intensive session for experienced practitioners',
    settings: {
      breathsPerRound: 40,
      numberOfRounds: 4,
      recoveryDuration: 15,
      breathingSpeed: 1.5,
    } as UserPreferences,
  },
} as const;

export type PresetKey = keyof typeof SESSION_PRESETS;
