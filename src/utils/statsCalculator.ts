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
