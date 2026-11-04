import {Share} from 'react-native';
import {format, parseISO} from 'date-fns';
import {SessionData} from '../types';
import {formatTime} from './statsCalculator';
import {version} from '../../package.json';

export type ExportFormat = 'json' | 'csv';

interface ExportOptions {
  format: ExportFormat;
  sessions: SessionData[];
}

/**
 * Export service for session data.
 * Supports JSON and CSV formats with system share sheet integration.
 */
export class ExportService {
  /**
   * Export sessions in the specified format.
   */
  static async export(options: ExportOptions): Promise<boolean> {
    const {format: exportFormat, sessions} = options;

    if (sessions.length === 0) {
      throw new Error('No sessions to export');
    }

    const content =
      exportFormat === 'json'
        ? this.toJSON(sessions)
        : this.toCSV(sessions);

    const filename = this.generateFilename(exportFormat);

    return this.share(content, filename);
  }

  /**
   * Convert sessions to JSON format.
   */
  private static toJSON(sessions: SessionData[]): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      appVersion: version,
      totalSessions: sessions.length,
      sessions: sessions.map(session => ({
        id: session.id,
        date: session.date,
        completedRounds: session.completedRounds,
        mode: session.mode ?? 'retention',
        durationSeconds: session.durationSeconds,
        holdTimes: session.holdTimes,
        holdTimesFormatted: session.holdTimes.map(formatTime),
        averageHoldTime: this.calculateAverage(session.holdTimes),
        averageHoldTimeFormatted: formatTime(this.calculateAverage(session.holdTimes)),
        bestHoldTime: session.holdTimes.length ? Math.max(...session.holdTimes) : 0,
        bestHoldTimeFormatted: formatTime(session.holdTimes.length ? Math.max(...session.holdTimes) : 0),
        settings: session.settings,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Convert sessions to CSV format.
   */
  private static toCSV(sessions: SessionData[]): string {
    const headers = [
      'Date',
      'Time',
      'Rounds',
      'Best Hold (m:ss)',
      'Average Hold (m:ss)',
      'Hold Times',
      'Breaths/Round',
      'Breathing Pace (s)',
      'Practice',
      'Duration (m:ss)',
    ];

    const rows = sessions.map(session => {
      const date = parseISO(session.date);
      const best = session.holdTimes.length ? Math.max(...session.holdTimes) : 0;
      const avg = this.calculateAverage(session.holdTimes);
      const holdTimesStr = session.holdTimes
        .map(formatTime)
        .join('; ');

      return [
        format(date, 'yyyy-MM-dd'),
        format(date, 'HH:mm:ss'),
        session.completedRounds,
        formatTime(best),
        formatTime(avg),
        `"${holdTimesStr}"`,
        session.settings.breathsPerRound,
        session.settings.breathingSpeed,
        session.mode ?? 'retention',
        formatTime(session.durationSeconds ?? 0),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Share content via system share sheet.
   */
  private static async share(
    content: string,
    filename: string,
  ): Promise<boolean> {
    try {
      const result = await Share.share(
        {
          message: content,
          title: filename,
        },
        {
          subject: `Innerfire Session Export - ${filename}`,
          dialogTitle: 'Export Sessions',
        },
      );

      if (result.action === Share.sharedAction) {
        return true;
      } else if (result.action === Share.dismissedAction) {
        // iOS only - user dismissed
        return false;
      }

      return true;
    } catch (error) {
      console.error('[ExportService] Share failed:', error);
      throw error;
    }
  }

  /**
   * Generate a filename with timestamp.
   */
  private static generateFilename(exportFormat: ExportFormat): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    return `innerfire_sessions_${timestamp}.${exportFormat}`;
  }

  /**
   * Calculate average of hold times.
   */
  private static calculateAverage(holdTimes: number[]): number {
    if (holdTimes.length === 0) return 0;
    return holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;
  }

  /**
   * Get a summary of sessions for preview.
   */
  static getSummary(sessions: SessionData[]): {
    totalSessions: number;
    totalRounds: number;
    bestHold: number;
    averageHold: number;
    dateRange: string;
  } {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalRounds: 0,
        bestHold: 0,
        averageHold: 0,
        dateRange: 'No sessions',
      };
    }

    const allHoldTimes = sessions.flatMap(s => s.holdTimes);
    const totalRounds = sessions.reduce(
      (acc, s) => acc + s.completedRounds,
      0,
    );

    const oldest = parseISO(sessions[sessions.length - 1].date);
    const newest = parseISO(sessions[0].date);

    const dateRange =
      sessions.length === 1
        ? format(newest, 'd MMM yyyy')
        : `${format(oldest, 'd MMM')} - ${format(newest, 'd MMM yyyy')}`;

    return {
      totalSessions: sessions.length,
      totalRounds,
      bestHold: allHoldTimes.length ? Math.max(...allHoldTimes) : 0,
      averageHold: this.calculateAverage(allHoldTimes),
      dateRange,
    };
  }
}
