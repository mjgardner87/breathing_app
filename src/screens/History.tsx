import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StorageService} from '../services/StorageService';
import {SessionData} from '../types';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';
import {buildTrendSummary, calculateStats, formatTime} from '../utils/statsCalculator';

export const History: React.FC = () => {
  const navigation = useNavigation();
  const {theme} = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendSummary, setTrendSummary] = useState(() => buildTrendSummary([]));
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const stats = useMemo(() => calculateStats(sessions), [sessions]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StorageService.getSessions();
      setSessions(data);
      setTrendSummary(buildTrendSummary(data));
    } catch (error) {
      console.error('Failed to load session history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const handleClearHistory = async () => {
    try {
      await StorageService.clearSessions();
      setShowClearConfirm(false);
      await loadSessions();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const renderSessionCard = (session: SessionData) => {
    const date = new Date(session.date);
    return (
      <View key={session.id} style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View>
            <Text style={styles.sessionDate}>
              {date.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.sessionTime}>
              {date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionMetaLabel}>Rounds</Text>
            <Text style={styles.sessionMetaValue}>{session.completedRounds}</Text>
          </View>
        </View>

        <View style={styles.holdChips}>
          {session.holdTimes.map((hold, index) => (
            <View key={`${session.id}-${index}`} style={styles.holdChip}>
              <Text style={styles.holdChipLabel}>Round {index + 1}</Text>
              <Text style={styles.holdChipValue}>{formatTime(hold)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const maxTrendValue =
    trendSummary.series.length > 0
      ? Math.max(...trendSummary.series.map(point => point.maxHold))
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity
          style={[styles.clearButton, !sessions.length && styles.clearButtonDisabled]}
          disabled={!sessions.length}
          onPress={() => setShowClearConfirm(true)}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={theme.colours.text} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Best Hold</Text>
              <Text style={styles.statValue}>{formatTime(stats.bestHold)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Rolling Avg</Text>
              <Text style={styles.statValue}>
                {trendSummary.rollingAverage ? formatTime(Math.round(trendSummary.rollingAverage)) : '0:00'}
              </Text>
            </View>
          </View>

          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <View>
                <Text style={styles.trendTitle}>Hold Trends</Text>
                <Text style={styles.trendSubtitle}>Last {trendSummary.series.length || 0} sessions</Text>
              </View>
              <View style={styles.trendChange}>
                <Text style={styles.trendChangeLabel}>vs. prior</Text>
                <Text
                  style={[
                    styles.trendChangeValue,
                    trendSummary.weeklyChange >= 0
                      ? styles.trendChangePositive
                      : styles.trendChangeNegative,
                  ]}>
                  {trendSummary.weeklyChange >= 0 ? '+' : ''}
                  {trendSummary.weeklyChange.toFixed(2)}s
                </Text>
              </View>
            </View>

            {trendSummary.series.length === 0 ? (
              <Text style={styles.trendEmpty}>Complete a full session to see your trendline.</Text>
            ) : (
              <View style={styles.trendGraph}>
                {trendSummary.series.map(point => {
                  const height = maxTrendValue
                    ? Math.max(6, (point.maxHold / maxTrendValue) * 120)
                    : 0;
                  return (
                    <View key={point.sessionId} style={styles.trendBar}>
                      <View style={styles.trendBarTrack}>
                        <View style={[styles.trendBarFill, {height}]} />
                      </View>
                      <Text style={styles.trendLabel}>{point.label}</Text>
                      <Text style={styles.trendValue}>{formatTime(point.maxHold)}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.trendFooter}>
              <View>
                <Text style={styles.trendFooterLabel}>Daily streak</Text>
                <Text style={styles.trendFooterValue}>{trendSummary.streak} days</Text>
              </View>
              <View>
                <Text style={styles.trendFooterLabel}>Last session</Text>
                <Text style={styles.trendFooterValue}>
                  {stats.lastSessionDate
                    ? new Date(stats.lastSessionDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.historyList}>
            <Text style={styles.listTitle}>All Sessions</Text>
            {sessions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyTitle}>No sessions yet</Text>
                <Text style={styles.emptySubtitle}>Complete a session to start tracking progress.</Text>
              </View>
            ) : (
              sessions.map(renderSessionCard)
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showClearConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Remove all sessions?</Text>
            <Text style={styles.modalText}>
              This will delete every stored session from your device. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowClearConfirm(false)}>
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleClearHistory}>
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colours.background,
      padding: theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      color: theme.colours.text,
      fontSize: 24,
      fontWeight: '300',
    },
    title: {
      color: theme.colours.text,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    clearButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colours.border,
    },
    clearButtonDisabled: {
      opacity: 0.4,
    },
    clearButtonText: {
      color: theme.colours.danger,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    statCard: {
      flex: 1,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      backgroundColor: theme.colours.backgroundElevated,
    },
    statLabel: {
      color: theme.colours.textSecondary,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    statValue: {
      color: theme.colours.text,
      fontSize: 20,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    trendCard: {
      backgroundColor: theme.colours.backgroundElevated,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      marginBottom: theme.spacing.xl,
    },
    trendHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    trendTitle: {
      color: theme.colours.text,
      fontSize: 15,
      fontWeight: '600',
    },
    trendSubtitle: {
      color: theme.colours.textTertiary,
      fontSize: 12,
    },
    trendChange: {
      alignItems: 'flex-end',
    },
    trendChangeLabel: {
      color: theme.colours.textTertiary,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    trendChangeValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    trendChangePositive: {
      color: theme.colours.success,
    },
    trendChangeNegative: {
      color: theme.colours.danger,
    },
    trendGraph: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.md,
      marginVertical: theme.spacing.md,
      minHeight: 150,
    },
    trendBar: {
      flex: 1,
      alignItems: 'center',
    },
    trendBarTrack: {
      width: 20,
      height: 130,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colours.background,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    trendBarFill: {
      width: '100%',
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colours.accent,
    },
    trendLabel: {
      color: theme.colours.textSecondary,
      fontSize: 11,
      marginTop: theme.spacing.xs,
    },
    trendValue: {
      color: theme.colours.text,
      fontSize: 11,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    trendEmpty: {
      color: theme.colours.textSecondary,
      fontSize: 13,
      marginVertical: theme.spacing.md,
    },
    trendFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
    },
    trendFooterLabel: {
      color: theme.colours.textTertiary,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    trendFooterValue: {
      color: theme.colours.text,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 2,
    },
    historyList: {
      marginBottom: theme.spacing.xxxl,
    },
    listTitle: {
      color: theme.colours.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    emptyHistory: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xxxl,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
    },
    emptyTitle: {
      color: theme.colours.text,
      fontSize: 15,
      marginBottom: theme.spacing.xs,
    },
    emptySubtitle: {
      color: theme.colours.textTertiary,
      fontSize: 13,
    },
    sessionCard: {
      backgroundColor: theme.colours.backgroundElevated,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sessionDate: {
      color: theme.colours.text,
      fontSize: 15,
      fontWeight: '600',
    },
    sessionTime: {
      color: theme.colours.textTertiary,
      fontSize: 12,
    },
    sessionMeta: {
      alignItems: 'flex-end',
    },
    sessionMetaLabel: {
      color: theme.colours.textTertiary,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sessionMetaValue: {
      color: theme.colours.text,
      fontSize: 18,
      fontWeight: '600',
      marginTop: 2,
    },
    holdChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    holdChip: {
      flexGrow: 1,
      minWidth: 120,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colours.background,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
    },
    holdChipLabel: {
      color: theme.colours.textTertiary,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    holdChipValue: {
      color: theme.colours.text,
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    modalContent: {
      backgroundColor: theme.colours.backgroundElevated,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xxl,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      width: '100%',
    },
    modalTitle: {
      color: theme.colours.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
    },
    modalText: {
      color: theme.colours.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    modalButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colours.danger,
    },
    modalButtonText: {
      color: theme.isDark ? theme.colours.background : theme.colours.backgroundElevated,
      fontSize: 14,
      fontWeight: '600',
    },
    modalButtonSecondary: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colours.border,
      backgroundColor: theme.colours.background,
    },
    modalButtonSecondaryText: {
      color: theme.colours.text,
      fontSize: 14,
      fontWeight: '600',
    },
  });


