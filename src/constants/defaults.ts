import {UserPreferences} from '../types';

/**
 * Default user preferences for breathing sessions.
 * Single source of truth - do not duplicate elsewhere.
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  breathsPerRound: 30,
  numberOfRounds: 3,
  recoveryDuration: 15,
  breathingSpeed: 2.0,
};

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
      recoveryDuration: 20,
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
