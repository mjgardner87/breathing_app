import {differenceInCalendarDays, format, startOfDay} from 'date-fns';
import {SessionData} from '../types';

export interface Stats {
  totalSessions: number;
  averageHold: number;
  bestHold: number;
  lastSessionDate: string | null;
}

export interface TrendPoint {
  sessionId: string;
  date: string;
  label: string;
  maxHold: number;
}

export interface TrendSummary {
  rollingAverage: number;
  weeklyChange: number;
  streak: number;
  series: TrendPoint[];
}

const roundToTwo = (value: number): number =>
  Math.round(value * 100) / 100;

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
  const averageHold = allHoldTimes.length ? roundToTwo(totalHoldTime / allHoldTimes.length) : 0;
  const bestHold = allHoldTimes.length ? Math.max(...allHoldTimes) : 0;

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

const calculateWindowAverage = (windowSessions: SessionData[]): number => {
  if (windowSessions.length === 0) {
    return 0;
  }

  const holdEntries = windowSessions.flatMap(session => session.holdTimes);
  if (holdEntries.length === 0) {
    return 0;
  }

  const total = holdEntries.reduce((sum, hold) => sum + hold, 0);
  return roundToTwo(total / holdEntries.length);
};

const calculateDailyStreak = (sessions: SessionData[]): number => {
  if (sessions.length === 0) {
    return 0;
  }

  let streak = 0;
  let previousDate: Date | null = null;

  for (const session of sessions) {
    const sessionDate = startOfDay(new Date(session.date));

    if (!previousDate) {
      streak = 1;
      previousDate = sessionDate;
      continue;
    }

    const diff = differenceInCalendarDays(previousDate, sessionDate);

    if (diff === 0) {
      continue; // Multiple sessions on the same day
    }

    if (diff === 1) {
      streak += 1;
      previousDate = sessionDate;
      continue;
    }

    break;
  }

  return streak;
};

export function buildTrendSummary(
  sessions: SessionData[],
  windowSize = 7
): TrendSummary {
  if (windowSize <= 0) {
    throw new Error('windowSize must be greater than zero');
  }

  const cleanedSessions = sessions.filter(session => session.holdTimes.length > 0);

  if (cleanedSessions.length === 0) {
    return {
      rollingAverage: 0,
      weeklyChange: 0,
      streak: 0,
      series: [],
    };
  }

  const currentWindow = cleanedSessions.slice(0, windowSize);
  const previousWindow = cleanedSessions.slice(windowSize, windowSize * 2);

  const rollingAverage = calculateWindowAverage(currentWindow);
  const previousAverage = calculateWindowAverage(previousWindow);
  const weeklyChange = roundToTwo(rollingAverage - previousAverage);

  const series: TrendPoint[] = currentWindow
    .map(session => ({
      sessionId: session.id,
      date: session.date,
      label: format(new Date(session.date), 'EEE'),
      maxHold: Math.max(...session.holdTimes),
    }))
    .reverse();

  return {
    rollingAverage,
    weeklyChange,
    streak: calculateDailyStreak(cleanedSessions),
    series,
  };
}
