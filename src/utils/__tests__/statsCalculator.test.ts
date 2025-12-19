import {calculateStats, buildTrendSummary} from '../statsCalculator';
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
        settings: {
          breathsPerRound: 30,
          numberOfRounds: 3,
          recoveryDuration: 15,
          breathingSpeed: 2.0,
        },
      },
      {
        id: '2',
        date: '2025-12-13T10:00:00Z',
        completedRounds: 3,
        holdTimes: [80, 100, 130],
        settings: {
          breathsPerRound: 30,
          numberOfRounds: 3,
          recoveryDuration: 15,
          breathingSpeed: 2.0,
        },
      },
    ];

    const stats = calculateStats(sessions);

    expect(stats.totalSessions).toBe(2);
    expect(stats.averageHold).toBe(111.67); // (90+120+150+80+100+130)/6 = 111.67
    expect(stats.bestHold).toBe(150);
    expect(stats.lastSessionDate).toBe('2025-12-14T10:00:00Z');
  });

  describe('buildTrendSummary', () => {
    const prefs = {
      breathsPerRound: 30,
      numberOfRounds: 3,
      recoveryDuration: 15,
      breathingSpeed: 2.0,
    };

    const sessions: SessionData[] = [
      {
        id: 'newest',
        date: '2025-12-15T10:00:00Z',
        completedRounds: 3,
        holdTimes: [120, 150],
        settings: prefs,
      },
      {
        id: 'second',
        date: '2025-12-14T10:00:00Z',
        completedRounds: 3,
        holdTimes: [90],
        settings: prefs,
      },
      {
        id: 'third',
        date: '2025-12-13T10:00:00Z',
        completedRounds: 3,
        holdTimes: [80],
        settings: prefs,
      },
      {
        id: 'older',
        date: '2025-12-11T10:00:00Z',
        completedRounds: 3,
        holdTimes: [60],
        settings: prefs,
      },
    ];

    it('summarises rolling average, change, streak and series', () => {
      const summary = buildTrendSummary(sessions, 3);

      expect(summary.rollingAverage).toBe(110); // (120+150+90+80) / 4
      expect(summary.weeklyChange).toBe(50); // 110 - 60
      expect(summary.streak).toBe(3);
      expect(summary.series).toHaveLength(3);
      expect(summary.series[0].sessionId).toBe('third'); // reversed order
      expect(summary.series[2].sessionId).toBe('newest');
    });

    it('returns zeros when there are no sessions with hold times', () => {
      const summary = buildTrendSummary([], 4);

      expect(summary).toEqual({
        rollingAverage: 0,
        weeklyChange: 0,
        streak: 0,
        series: [],
      });
    });
  });
});
