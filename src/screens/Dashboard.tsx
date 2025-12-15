import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {StorageService} from '../services/StorageService';
import {SessionData} from '../types';
import {calculateStats, formatTime} from '../utils/statsCalculator';
import {theme} from '../constants/theme';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export const Dashboard: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

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
        <Text style={styles.title}>Breathe</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colours.accent} />
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.averageHold)}</Text>
              <Text style={styles.statLabel}>Average Hold</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.bestHold)}</Text>
              <Text style={styles.statLabel}>Best Hold</Text>
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
            <Text style={styles.historyTitle}>Recent Sessions</Text>
            <ScrollView style={styles.historyList}>
              {sessions.length === 0 ? (
                <Text style={styles.emptyText}>
                  No sessions yet - start your first practice!
                </Text>
              ) : (
                sessions.slice(0, 20).map(session => (
                  <View key={session.id} style={styles.historyItem}>
                    <Text style={styles.historyDate}>
                      {new Date(session.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyDetails}>
                      {session.completedRounds} rounds • Best: {formatTime(Math.max(...session.holdTimes))}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colours.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: theme.spacing.sm,
  },
  settingsIcon: {
    fontSize: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: theme.colours.success,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: theme.colours.text,
    fontSize: 12,
    opacity: 0.7,
    marginTop: theme.spacing.xs,
  },
  startButton: {
    backgroundColor: theme.colours.accent,
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  startButtonText: {
    color: theme.colours.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    color: theme.colours.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  historyDate: {
    color: theme.colours.text,
    fontSize: 16,
    fontWeight: '600',
  },
  historyDetails: {
    color: theme.colours.text,
    fontSize: 14,
    opacity: 0.7,
    marginTop: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colours.text,
    fontSize: 16,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
