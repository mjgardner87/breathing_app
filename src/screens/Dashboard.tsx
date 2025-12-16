import React, {useState, useEffect} from 'react';
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
import {theme} from '../constants/theme';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export const Dashboard: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);

  useEffect(() => {
    loadSessions();
    checkFirstLaunch();
  }, []);

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
        <Text style={styles.title}>Breathe</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
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
                <Text style={styles.modalTextBold}>IMPORTANT DISCLAIMER:</Text>
                {'\n\n'}
                This app is NOT affiliated with Wim Hof or the official Wim Hof Method. This is a free, personal tool created for educational purposes.
                {'\n\n'}
                For the official Wim Hof Method training, resources, and guidance, please visit:
                {'\n'}
                <Text style={styles.modalTextHighlight}>wimhofmethod.com</Text>
                {'\n\n'}
                If you have any medical conditions, consult a healthcare professional before starting any breathing practice.
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    marginTop: theme.spacing.lg,
  },
  title: {
    color: theme.colours.text,
    ...theme.typography.display,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
    opacity: 0.6,
    color: theme.colours.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xs,
  },
  statItem: {
    flex: 1,
    backgroundColor: theme.colours.backgroundElevated,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
    marginHorizontal: theme.spacing.xs,
  },
  statValue: {
    color: theme.colours.text,
    ...theme.typography.title,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colours.textSecondary,
    ...theme.typography.caption,
  },
  startButton: {
    backgroundColor: theme.colours.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    ...theme.shadows.sm,
  },
  startButtonText: {
    color: '#ffffff',
    ...theme.typography.heading,
  },
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    color: theme.colours.text,
    ...theme.typography.heading,
    marginBottom: theme.spacing.lg,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: theme.colours.backgroundElevated,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
  },
  historyDate: {
    color: theme.colours.text,
    ...theme.typography.bodyMedium,
    marginBottom: theme.spacing.xs,
  },
  historyDetails: {
    color: theme.colours.textSecondary,
    ...theme.typography.caption,
  },
  emptyText: {
    color: theme.colours.textTertiary,
    ...theme.typography.body,
    textAlign: 'center',
    marginTop: theme.spacing.xxxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colours.backgroundElevated,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalTitle: {
    color: theme.colours.text,
    ...theme.typography.display,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalText: {
    color: theme.colours.textSecondary,
    ...theme.typography.body,
    textAlign: 'left',
  },
  modalTextBold: {
    color: theme.colours.primary,
    ...theme.typography.bodyMedium,
  },
  modalTextHighlight: {
    color: theme.colours.success,
    ...theme.typography.bodyMedium,
  },
  modalButton: {
    backgroundColor: theme.colours.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  modalButtonText: {
    color: '#ffffff',
    ...theme.typography.heading,
  },
});
