import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {StorageService} from '../services/StorageService';
import {SessionData} from '../types';
import {calculateStats, formatTime} from '../utils/statsCalculator';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';
import {Logo} from '../components/Logo';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export const Dashboard: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const {theme} = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);

  useEffect(() => {
    loadSessions();
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSessions();
    });
    return unsubscribe;
  }, [navigation]);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenWarning = await AsyncStorage.getItem('@breathingapp:safety_warning_seen');
      if (!hasSeenWarning) {
        setShowSafetyWarning(true);
      }
    } catch (error) {
      console.error('Failed to check first launch:', error);
    }
  };

  const dismissSafetyWarning = async () => {
    try {
      await AsyncStorage.setItem('@breathingapp:safety_warning_seen', 'true');
      setShowSafetyWarning(false);
    } catch (error) {
      console.error('Failed to save safety warning preference:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await StorageService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateStats(sessions);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Logo />
            {/* Keeping the subtitle but with adjusted spacing if needed, though Logo has text now.
                Actually, the Logo component I wrote includes the text "Innerfire".
                I'll render the subtitle below it.
             */}
            <Text style={styles.subtitle}>Ignite your potential</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colours.text} />
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.averageHold)}</Text>
              <Text style={styles.statLabel}>Avg Hold</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.bestHold)}</Text>
              <Text style={styles.statLabel}>Best</Text>
            </View>
          </View>

          {/* Start Session Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Session')}>
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>

          {/* Session History */}
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Activity</Text>
            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No sessions recorded.
                  </Text>
                  <Text style={styles.emptySubText}>
                    Begin your journey today.
                  </Text>
                </View>
              ) : (
                sessions.slice(0, 20).map(session => (
                  <View key={session.id} style={styles.historyItem}>
                    <View>
                      <Text style={styles.historyDate}>
                        {new Date(session.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.historyTime}>
                        {new Date(session.date).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.historyStats}>
                      <View style={styles.historyStatTag}>
                         <Text style={styles.historyStatValue}>{session.completedRounds}</Text>
                         <Text style={styles.historyStatLabel}>rds</Text>
                      </View>
                      <View style={styles.historyStatTag}>
                         <Text style={styles.historyStatValue}>{formatTime(Math.max(...session.holdTimes))}</Text>
                         <Text style={styles.historyStatLabel}>max</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* Safety Warning Modal */}
      <Modal
        visible={showSafetyWarning}
        transparent
        animationType="fade"
        onRequestClose={dismissSafetyWarning}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Safety First</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                Always practice breathing exercises while seated or lying down.
                {'\n\n'}
                Never practice while driving, in water, or in any situation where loss of consciousness could be dangerous.
                {'\n\n'}
                <Text style={styles.modalTextBold}>IMPORTANT:</Text>
                {'\n\n'}
                This tool is for educational purposes only and is not affiliated with the Wim Hof Method.
                {'\n\n'}
                Consult a healthcare professional before starting any breathing practice.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalButton} onPress={dismissSafetyWarning}>
              <Text style={styles.modalButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
    marginTop: theme.spacing.lg,
  },
  title: {
    color: theme.colours.text,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.8,
    fontFamily: 'System',
  },
  subtitle: {
    color: theme.colours.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
    marginLeft: 44, // Align with text of Logo (approx 32+12)
    letterSpacing: -0.2,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colours.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colours.border,
  },
  settingsIcon: {
    fontSize: 18,
    color: theme.colours.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    flex: 1,
    backgroundColor: theme.colours.backgroundElevated,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
    alignItems: 'center',
  },
  statValue: {
    color: theme.colours.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: theme.colours.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: theme.colours.text, // High contrast button
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    ...theme.shadows.sm,
  },
  startButtonText: {
    color: theme.colours.background, // Inverted text color
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    color: theme.colours.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colours.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    color: theme.colours.text,
    fontSize: 15,
    fontWeight: '500',
  },
  historyTime: {
    color: theme.colours.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  historyStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  historyStatTag: {
    alignItems: 'flex-end',
  },
  historyStatValue: {
    color: theme.colours.text,
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  historyStatLabel: {
    color: theme.colours.textTertiary,
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyText: {
    color: theme.colours.textSecondary,
    fontSize: 15,
    marginBottom: theme.spacing.xs,
  },
  emptySubText: {
    color: theme.colours.textTertiary,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colours.backgroundElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.colours.border,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalTitle: {
    color: theme.colours.text,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalText: {
    color: theme.colours.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  modalTextBold: {
    color: theme.colours.text,
    fontWeight: '600',
  },
  modalTextHighlight: {
    color: theme.colours.accent,
  },
  modalButton: {
    backgroundColor: theme.colours.text,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  modalButtonText: {
    color: theme.colours.background,
    fontWeight: '600',
    fontSize: 15,
  },
});
