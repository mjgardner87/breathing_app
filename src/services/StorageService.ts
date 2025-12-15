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
