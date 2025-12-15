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
