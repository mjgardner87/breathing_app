import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserPreferences, SessionData} from '../types';
import {DEFAULT_PREFERENCES, STORAGE_KEYS} from '../constants/defaults';

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
      return {...DEFAULT_PREFERENCES, ...parsed};
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
    session: SessionData,
  ): SessionData | null {
    if (!session.holdTimes || session.holdTimes.length === 0) {
      console.warn(
        '[StorageService] Filtering invalid session for display:',
        session.id,
      );
      return null;
    }

    return {
      ...session,
      completedRounds: session.holdTimes.length,
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
        return [];
      }
      const sessions: SessionData[] = JSON.parse(data);

      // Validate and filter sessions for display
      return sessions
        .map(s => this.validateSessionForDisplay(s))
        .filter((s): s is SessionData => s !== null);
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
      const data = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('[StorageService] Failed to load raw sessions:', error);
      return [];
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
    if (!session.holdTimes || session.holdTimes.length === 0) {
      console.error(
        '[StorageService] Cannot save session with empty holdTimes:',
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
      const existingIndex = sessions.findIndex(s => s.id === session.id);
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
      const found = savedSessions.find(s => s.id === session.id);

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
        .filter((s): s is SessionData => s !== null);
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
