import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserPreferences, SessionData} from '../types';

const PREFERENCES_KEY = '@breathingapp:preferences';
const SESSIONS_KEY = '@breathingapp:sessions';

const DEFAULT_PREFERENCES: UserPreferences = {
  breathsPerRound: 30,
  numberOfRounds: 3,
  recoveryDuration: 15,
  breathingSpeed: 2.0,
};

export class StorageService {
  static async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (!data) {
        return DEFAULT_PREFERENCES;
      }
      const parsed = JSON.parse(data);
      return {...DEFAULT_PREFERENCES, ...parsed};
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

  /**
   * Validates and normalises a session to ensure data integrity.
   * Ensures completedRounds matches holdTimes.length.
   */
  private static validateSession(session: SessionData): SessionData | null {
    // Filter out sessions with no hold times (invalid)
    if (!session.holdTimes || session.holdTimes.length === 0) {
      return null;
    }

    return {
      ...session,
      // Ensure completedRounds matches holdTimes length
      completedRounds: session.holdTimes.length,
    };
  }

  static async getSessions(): Promise<SessionData[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      if (!data) {
        return [];
      }
      const sessions: SessionData[] = JSON.parse(data);

      // Validate and filter sessions
      return sessions
        .map(s => this.validateSession(s))
        .filter((s): s is SessionData => s !== null);
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

  static async clearSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSIONS_KEY);
    }
    catch (error) {
      console.error('Failed to clear sessions:', error);
      throw error;
    }
  }
}
