import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {format, parseISO} from 'date-fns';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';
import {SessionData} from '../types';

interface SessionCardProps {
  session: SessionData;
  showDetails?: boolean;
}

export function SessionCard({
  session,
  showDetails = true,
}: SessionCardProps): React.JSX.Element {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'EEE, d MMM yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  const formatTimeOfDay = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  const bestHold = Math.max(...session.holdTimes);
  const avgHold = session.holdTimes.reduce((a, b) => a + b, 0) / session.holdTimes.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(session.date)}</Text>
          <Text style={styles.time}>{formatTimeOfDay(session.date)}</Text>
        </View>
        <View style={styles.roundsBadge}>
          <Text style={styles.roundsText}>
            {session.completedRounds} {session.completedRounds === 1 ? 'round' : 'rounds'}
          </Text>
        </View>
      </View>

      {showDetails && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Best</Text>
              <Text style={styles.statValue}>{formatTime(bestHold)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{formatTime(Math.round(avgHold))}</Text>
            </View>
          </View>

          <View style={styles.holdTimesContainer}>
            {session.holdTimes.map((time, index) => (
              <View key={index} style={styles.holdTimeChip}>
                <Text style={styles.holdTimeLabel}>R{index + 1}</Text>
                <Text style={styles.holdTimeValue}>{formatTime(time)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colours.backgroundElevated,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    dateContainer: {
      flex: 1,
    },
    date: {
      color: theme.colours.text,
      fontSize: 16,
      fontWeight: '600',
    },
    time: {
      color: theme.colours.textTertiary,
      fontSize: 13,
      marginTop: 2,
    },
    roundsBadge: {
      backgroundColor: theme.colours.background,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colours.border,
    },
    roundsText: {
      color: theme.colours.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    statsRow: {
      flexDirection: 'row',
      marginTop: theme.spacing.lg,
      gap: theme.spacing.xl,
    },
    statItem: {
      alignItems: 'flex-start',
    },
    statLabel: {
      color: theme.colours.textTertiary,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    statValue: {
      color: theme.colours.text,
      fontSize: 18,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    holdTimesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    holdTimeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colours.background,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.xs,
    },
    holdTimeLabel: {
      color: theme.colours.textTertiary,
      fontSize: 11,
      fontWeight: '500',
    },
    holdTimeValue: {
      color: theme.colours.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
  });
