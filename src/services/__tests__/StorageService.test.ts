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
});
