import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserPreferences, SessionData} from '../types';
import {DEFAULT_PREFERENCES, resolvePreferences, STORAGE_KEYS} from '../constants/defaults';

/**
 * Storage service for persisting app data.
 * Rev 2: Fixed silent data loss bug, added verification and backup.
 */
export class StorageService {
  // ============================================
  // PREFERENCES
  // ============================================

  static async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.preferences);
      if (!data) {
        return DEFAULT_PREFERENCES;
      }
      const parsed = JSON.parse(data);
      return resolvePreferences({...DEFAULT_PREFERENCES, ...parsed});
    } catch (error) {
      console.error('[StorageService] Failed to load preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  static async savePreferences(prefs: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.preferences,
        JSON.stringify(prefs),
      );
      console.log('[StorageService] Preferences saved successfully');
    } catch (error) {
      console.error('[StorageService] Failed to save preferences:', error);
      throw error;
    }
  }

  // ============================================
  // SESSIONS
  // ============================================

  /**
   * Validates a session for display purposes.
   * Only used when READING sessions for display, NOT during save.
   */
  private static validateSessionForDisplay(
    session: unknown,
  ): SessionData | null {
    if (!session || typeof session !== 'object') {
      return null;
    }

    const candidate = session as Partial<SessionData>;
    if (
      typeof candidate.id !== 'string' ||
      !candidate.id.trim() ||
      typeof candidate.date !== 'string' ||
      !Number.isFinite(Date.parse(candidate.date)) ||
      !Array.isArray(candidate.holdTimes) ||
      (candidate.holdTimes.length === 0 && candidate.mode !== 'gentle') ||
      (candidate.mode === 'gentle' && (
        typeof candidate.durationSeconds !== 'number' ||
        !Number.isFinite(candidate.durationSeconds) || candidate.durationSeconds <= 0
      )) ||
      !candidate.holdTimes.every(
        hold => typeof hold === 'number' && Number.isFinite(hold) && hold >= 0,
      )
    ) {
      console.warn('[StorageService] Skipping invalid session for display');
      return null;
    }

    return {
      ...candidate,
      id: candidate.id,
      date: candidate.date,
      holdTimes: candidate.holdTimes,
      completedRounds: candidate.holdTimes.length,
      settings: {...DEFAULT_PREFERENCES, ...candidate.settings},
    };
  }

  /**
   * Get all sessions from storage.
   * Validates sessions for display, filtering out any corrupted entries.
   */
  static async getSessions(): Promise<SessionData[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
      if (!data) {
        return this.recoverFromBackup();
      }
      const sessions: SessionData[] = JSON.parse(data);

      // Validate and filter sessions for display
      return sessions
        .map(s => this.validateSessionForDisplay(s))
        .filter((s): s is SessionData => s !== null)
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    } catch (error) {
      console.error('[StorageService] Failed to load sessions:', error);
      // Attempt recovery from backup
      return this.recoverFromBackup();
    }
  }

  /**
   * Get raw sessions without validation.
   * Used internally to preserve all data during save operations.
   */
  private static async getRawSessions(): Promise<SessionData[]> {
    try {
      const primary = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
      const data = primary ?? await AsyncStorage.getItem(STORAGE_KEYS.sessionsBackup);
      if (!data) {
        return [];
      }
      const sessions: unknown = JSON.parse(data);
      if (!Array.isArray(sessions)) {
        throw new Error('Stored session history is not an array');
      }
      return sessions;
    } catch (error) {
      console.error('[StorageService] Failed to load raw sessions:', error);
      throw error;
    }
  }

  /**
   * Save a session to storage.
   * Rev 2: Fixed critical bug - now reads raw data without filtering,
   * validates new session before save, and verifies save succeeded.
   *
   * @returns true if save was verified successful, false otherwise
   */
  static async saveSession(session: SessionData): Promise<boolean> {
    // Pre-save validation: reject invalid sessions upfront
    if (!this.validateSessionForDisplay(session)) {
      console.error(
        '[StorageService] Cannot save invalid session:',
        session.id,
      );
      return false;
    }

    if (!session.id) {
      console.error('[StorageService] Cannot save session without ID');
      return false;
    }

    try {
      // Read RAW data - do NOT filter existing sessions
      // This prevents silent data loss from the original bug
      const sessions = await this.getRawSessions();

      // Check for duplicate
      const existingIndex = sessions.findIndex(s => s?.id === session.id);
      if (existingIndex !== -1) {
        console.log(
          '[StorageService] Session already exists, updating:',
          session.id,
        );
        sessions[existingIndex] = session;
      } else {
        // Add new session to beginning
        sessions.unshift(session);
      }

      // Save to primary storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.sessions,
        JSON.stringify(sessions),
      );

      // Verify save succeeded by reading back
      const verifyData = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
      if (!verifyData) {
        console.error('[StorageService] Save verification failed - no data');
        return false;
      }

      const savedSessions: SessionData[] = JSON.parse(verifyData);
      const found = savedSessions.find(s => s?.id === session.id);

      if (!found) {
        console.error(
          '[StorageService] Save verification failed - session not found:',
          session.id,
        );
        return false;
      }

      // Save succeeded - create backup
      await this.createBackup(sessions);

      console.log(
        '[StorageService] Session saved and verified:',
        session.id,
        `(${session.holdTimes.length} rounds)`,
      );
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to save session:', error);
      return false;
    }
  }

  /**
   * Clear all sessions from storage.
   */
  static async clearSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.sessions);
      await AsyncStorage.removeItem(STORAGE_KEYS.sessionsBackup);
      console.log('[StorageService] All sessions cleared');
    } catch (error) {
      console.error('[StorageService] Failed to clear sessions:', error);
      throw error;
    }
  }

  // ============================================
  // BACKUP & RECOVERY
  // ============================================

  /**
   * Create a backup of sessions data.
   * Called automatically after successful save.
   */
  private static async createBackup(sessions: SessionData[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.sessionsBackup,
        JSON.stringify(sessions),
      );
    } catch (error) {
      // Backup failure is non-critical, just log it
      console.warn('[StorageService] Backup creation failed:', error);
    }
  }

  /**
   * Attempt to recover sessions from backup.
   * Used when primary storage read fails.
   */
  private static async recoverFromBackup(): Promise<SessionData[]> {
    try {
      console.log('[StorageService] Attempting recovery from backup...');
      const backupData = await AsyncStorage.getItem(
        STORAGE_KEYS.sessionsBackup,
      );

      if (!backupData) {
        console.log('[StorageService] No backup available');
        return [];
      }

      const sessions: SessionData[] = JSON.parse(backupData);
      if (!Array.isArray(sessions)) {
        throw new Error('Backup session history is not an array');
      }
      console.log(
        '[StorageService] Recovered',
        sessions.length,
        'sessions from backup',
      );

      // Restore to primary storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.sessions,
        JSON.stringify(sessions),
      );

      return sessions
        .map(s => this.validateSessionForDisplay(s))
        .filter((s): s is SessionData => s !== null)
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    } catch (error) {
      console.error('[StorageService] Recovery from backup failed:', error);
      return [];
    }
  }

  /**
   * Get diagnostic information about storage state.
   * Useful for debugging persistence issues.
   */
  static async getDiagnostics(): Promise<{
    primaryCount: number;
    backupCount: number;
    primarySize: number;
    backupSize: number;
    lastSessionId: string | null;
  }> {
    try {
      const primary = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
      const backup = await AsyncStorage.getItem(STORAGE_KEYS.sessionsBackup);

      const primarySessions: SessionData[] = primary ? JSON.parse(primary) : [];
      const backupSessions: SessionData[] = backup ? JSON.parse(backup) : [];

      return {
        primaryCount: primarySessions.length,
        backupCount: backupSessions.length,
        primarySize: primary?.length ?? 0,
        backupSize: backup?.length ?? 0,
        lastSessionId: primarySessions[0]?.id ?? null,
      };
    } catch (error) {
      console.error('[StorageService] Diagnostics failed:', error);
      return {
        primaryCount: 0,
        backupCount: 0,
        primarySize: 0,
        backupSize: 0,
        lastSessionId: null,
      };
    }
  }
}
