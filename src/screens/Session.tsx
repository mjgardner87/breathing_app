import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  activate as keepAwakeActivate,
  deactivate as keepAwakeDeactivate,
} from '@thehale/react-native-keep-awake';
import {StorageService} from '../services/StorageService';
import {AudioService} from '../services/AudioService';
import {HapticService} from '../services/HapticService';
import {SessionData, UserPreferences} from '../types';
import {useSessionState} from '../hooks/useSessionState';
import {useSessionSaver, SaveStatus} from '../hooks/useSessionSaver';
import {BreathingCircle} from '../components/BreathingCircle';
import {useNotification} from '../context/NotificationContext';
import {v4 as uuidv4} from 'uuid';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';
import {DEFAULT_PREFERENCES} from '../constants/defaults';

export const Session: React.FC = () => {
  const navigation = useNavigation();
  const {theme} = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {showNotification} = useNotification();

  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const {state, incrementBreath, completeHold, completeRecovery} =
    useSessionState(prefs);
  const [holdTimer, setHoldTimer] = useState(0);
  const lastMinuteMarker = useRef(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const {save: saveSession, retry: retrySave, waitForSave} = useSessionSaver();
  const sessionIdRef = useRef<string | null>(null);
  const sessionDataRef = useRef<SessionData | null>(null);
  const isMountedRef = useRef(true);

  const loadPreferences = async () => {
    try {
      const data = await StorageService.getPreferences();
      setPrefs({
        ...data,
        breathingSpeed: data.breathingSpeed ?? 2.0,
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  useEffect(() => {
    loadPreferences();
    AudioService.initialize();
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      AudioService.release();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      keepAwakeActivate();
      return () => {
        keepAwakeDeactivate();
      };
    }, []),
  );

  // Breathing phase auto-increment with audio cues
  useEffect(() => {
    if (state.currentPhase !== 'breathing' || isPaused) {
      return;
    }

    const breathCycleMs = prefs.breathingSpeed * 1000;
    const inhaleMs = breathCycleMs * 0.55;
    let breathOutTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleBreathOut = () => {
      if (breathOutTimeout) {
        clearTimeout(breathOutTimeout);
      }

      breathOutTimeout = setTimeout(() => {
        AudioService.play('breathe_out');
        breathOutTimeout = null;
      }, inhaleMs);
    };

    AudioService.play('breathe_in');
    scheduleBreathOut();

    const breathInterval = setInterval(() => {
      incrementBreath();
      AudioService.play('breathe_in');
      scheduleBreathOut();
    }, breathCycleMs);

    return () => {
      clearInterval(breathInterval);
      if (breathOutTimeout) {
        clearTimeout(breathOutTimeout);
      }
    };
  }, [state.currentPhase, incrementBreath, prefs.breathingSpeed, isPaused]);

  useEffect(() => {
    if (state.currentPhase !== 'breathing' && isPaused) {
      setIsPaused(false);
    }
  }, [state.currentPhase, isPaused]);

  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Hold timer with minute marker notifications
  useEffect(() => {
    if (state.currentPhase === 'holding' && state.holdStartTime) {
      AudioService.play('hold_breath');
      HapticService.trigger('medium'); // Haptic for hold phase start
      lastMinuteMarker.current = 0;

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.holdStartTime!) / 1000);
        setHoldTimer(elapsed);

        const currentMinute = Math.floor(elapsed / 60);
        if (currentMinute > lastMinuteMarker.current && currentMinute > 0) {
          AudioService.play('minute_marker');
          HapticService.trigger('light'); // Haptic for minute marker
          lastMinuteMarker.current = currentMinute;
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [state.currentPhase, state.holdStartTime]);

  // Recovery countdown with audio cue
  useEffect(() => {
    if (state.currentPhase === 'recovery') {
      AudioService.play('recovery_breath');
      HapticService.trigger('medium'); // Haptic for recovery start

      const timeout = setTimeout(() => {
        AudioService.play('release');
        HapticService.trigger('light'); // Haptic for recovery end
        completeRecovery();
      }, prefs.recoveryDuration * 1000);

      return () => clearTimeout(timeout);
    }
  }, [state.currentPhase, prefs.recoveryDuration, completeRecovery]);

  // Session complete - save session data automatically
  useEffect(() => {
    if (state.currentPhase !== 'complete') {
      return;
    }

    if (saveStatus === 'saving' || saveStatus === 'saved') {
      return;
    }

    if (state.holdTimes.length === 0) {
      console.log('[Session] No hold times recorded, skipping save');
      setSaveStatus('saved');
      return;
    }

    AudioService.play('round_complete');
    HapticService.trigger('success'); // Haptic for session complete
    setSaveStatus('saving');

    if (!sessionIdRef.current) {
      sessionIdRef.current = uuidv4();
    }

    const session: SessionData = {
      id: sessionIdRef.current,
      date: new Date().toISOString(),
      completedRounds: state.holdTimes.length,
      holdTimes: state.holdTimes,
      settings: prefs,
    };

    sessionDataRef.current = session;

    saveSession(session).then(success => {
      if (isMountedRef.current) {
        setSaveStatus(success ? 'saved' : 'error');
        if (!success) {
          HapticService.trigger('error'); // Haptic for save failure
          showNotification('Failed to save session', 'error', {
            duration: 5000,
          });
        }
      }
    });
  }, [
    state.currentPhase,
    state.holdTimes,
    prefs,
    saveSession,
    saveStatus,
    showNotification,
  ]);

  const handleRetry = useCallback(async () => {
    if (!sessionDataRef.current) {
      return;
    }

    setSaveStatus('saving');
    const success = await retrySave(sessionDataRef.current);

    if (isMountedRef.current) {
      setSaveStatus(success ? 'saved' : 'error');
      if (success) {
        showNotification('Session saved successfully', 'success');
      } else {
        showNotification('Save failed. Please try again.', 'error');
      }
    }
  }, [retrySave, showNotification]);

  const handleDoneHolding = () => {
    HapticService.trigger('heavy'); // Haptic for ending hold
    completeHold(holdTimer);
    setHoldTimer(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    await waitForSave();
    navigation.goBack();
  };

  const handleCancel = () => {
    if (state.currentPhase !== 'complete') {
      setShowCancelConfirm(true);
    } else {
      handleFinish();
    }
  };

  const confirmCancel = () => {
    navigation.goBack();
  };

  // Calculate session stats for the summary
  const getSessionStats = () => {
    if (state.holdTimes.length === 0) {
      return null;
    }

    const best = Math.max(...state.holdTimes);
    const average = state.holdTimes.reduce((a, b) => a + b, 0) / state.holdTimes.length;

    return {best, average};
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <View style={styles.saveStatusContainer}>
            <Text style={styles.saveStatusText}>Saving session...</Text>
          </View>
        );
      case 'saved':
        return (
          <View style={[styles.saveStatusContainer, styles.saveStatusSuccess]}>
            <Text style={styles.saveStatusIcon}>{'\u2713'}</Text>
            <Text style={styles.saveStatusText}>Session saved</Text>
          </View>
        );
      case 'error':
        return (
          <View style={[styles.saveStatusContainer, styles.saveStatusError]}>
            <Text style={styles.saveStatusIcon}>{'\u2717'}</Text>
            <Text style={styles.saveStatusText}>Save failed</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const renderPhaseContent = () => {
    switch (state.currentPhase) {
      case 'breathing':
        return (
          <>
            <Text style={styles.phaseText}>
              Round {state.currentRound} of {prefs.numberOfRounds}
            </Text>
            <Text style={styles.phaseSubText}>Breathe Deeply</Text>
            <BreathingCircle
              breathCount={state.breathCount}
              totalBreaths={prefs.breathsPerRound}
              isAnimating={!isPaused}
              breathingSpeed={prefs.breathingSpeed}
            />
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={handleTogglePause}>
              <Text style={styles.pauseButtonText}>
                {isPaused ? 'Resume Breathing' : 'Pause Breathing'}
              </Text>
            </TouchableOpacity>
            {isPaused && (
              <Text style={styles.pauseHelperText}>Session Paused</Text>
            )}
          </>
        );

      case 'holding':
        return (
          <>
            <Text style={styles.phaseText}>Hold Breath</Text>
            <View style={styles.holdContainer}>
              <Text style={styles.holdTimer}>{formatTime(holdTimer)}</Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleDoneHolding}>
                <Text style={styles.doneButtonText}>Breathe In</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'recovery':
        return (
          <>
            <Text style={styles.phaseText}>Recovery</Text>
            <View style={styles.recoveryContainer}>
              <Text style={styles.recoveryText}>
                Hold for {prefs.recoveryDuration}s
              </Text>
            </View>
          </>
        );

      case 'complete': {
        const stats = getSessionStats();
        return (
          <>
            <Text style={styles.phaseText}>Session Complete!</Text>
            <View style={styles.summaryContainer}>
              {/* Hold times per round */}
              {state.holdTimes.map((time, index) => (
                <Text key={index} style={styles.summaryText}>
                  Round {index + 1}: {formatTime(time)}
                </Text>
              ))}

              {/* Session stats */}
              {stats && (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Best</Text>
                    <Text style={styles.statValue}>
                      {formatTime(stats.best)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Average</Text>
                    <Text style={styles.statValue}>
                      {formatTime(Math.round(stats.average))}
                    </Text>
                  </View>
                </View>
              )}

              {/* Save status indicator */}
              {renderSaveStatus()}

              {/* Finish button */}
              <TouchableOpacity
                style={[
                  styles.finishButton,
                  saveStatus === 'saving' && styles.finishButtonDisabled,
                ]}
                onPress={handleFinish}
                disabled={saveStatus === 'saving'}>
                <Text style={styles.finishButtonText}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Finish'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel session">
        <Text style={styles.cancelText}>{'\u00D7'}</Text>
      </TouchableOpacity>

      {renderPhaseContent()}

      {/* Cancellation Confirmation Modal */}
      <Modal
        visible={showCancelConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Session?</Text>
            <Text style={styles.modalText}>Your progress won't be saved.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowCancelConfirm(false)}>
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonSecondaryText,
                  ]}>
                  Resume
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={confirmCancel}>
                <Text
                  style={[
                    styles.modalButtonText,
                    styles.modalButtonPrimaryText,
                  ]}>
                  End Session
                </Text>
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
      justifyContent: 'center',
    },
    cancelButton: {
      position: 'absolute',
      top: theme.spacing.xl + theme.spacing.lg,
      right: theme.spacing.xl,
      zIndex: 10,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colours.backgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    cancelText: {
      color: theme.colours.textSecondary,
      fontSize: 28,
      lineHeight: 30,
      fontWeight: '300',
      marginTop: -2,
    },
    phaseText: {
      color: theme.colours.textSecondary,
      ...theme.typography.heading,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    phaseSubText: {
      color: theme.colours.text,
      fontSize: 24,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    pauseButton: {
      alignSelf: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      backgroundColor: theme.colours.backgroundElevated,
      marginTop: theme.spacing.lg,
    },
    pauseButtonText: {
      color: theme.colours.text,
      fontWeight: '600',
      letterSpacing: 0.4,
    },
    pauseHelperText: {
      marginTop: theme.spacing.xs,
      textAlign: 'center',
      color: theme.colours.textSecondary,
      fontSize: 14,
    },
    holdContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    holdTimer: {
      color: theme.colours.text,
      ...theme.typography.timer,
      marginBottom: theme.spacing.xxxl,
      fontVariant: ['tabular-nums'],
    },
    doneButton: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: theme.colours.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: theme.colours.primaryHover,
      ...theme.shadows.lg,
      shadowColor: theme.colours.primary,
    },
    doneButtonText: {
      color: theme.isDark
        ? theme.colours.background
        : theme.colours.backgroundElevated,
      ...theme.typography.title,
      fontWeight: '700',
    },
    recoveryContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recoveryText: {
      color: theme.colours.text,
      fontSize: 28,
      fontWeight: '300',
      textAlign: 'center',
    },
    summaryContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    summaryText: {
      color: theme.colours.text,
      fontSize: 20,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.xxl,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    statItem: {
      alignItems: 'center',
    },
    statLabel: {
      color: theme.colours.textSecondary,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.xs,
    },
    statValue: {
      color: theme.colours.text,
      fontSize: 18,
      fontWeight: '600',
    },
    saveStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colours.backgroundElevated,
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    saveStatusSuccess: {
      backgroundColor: 'rgba(52, 199, 89, 0.15)',
    },
    saveStatusError: {
      backgroundColor: 'rgba(255, 59, 48, 0.15)',
    },
    saveStatusIcon: {
      fontSize: 16,
      color: theme.colours.text,
    },
    saveStatusText: {
      color: theme.colours.textSecondary,
      fontSize: 14,
    },
    retryButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colours.danger,
      borderRadius: theme.borderRadius.md,
      marginLeft: theme.spacing.sm,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    finishButton: {
      backgroundColor: theme.colours.primary,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xxl * 2,
      borderRadius: theme.borderRadius.xl,
      marginTop: theme.spacing.xxl,
      ...theme.shadows.md,
    },
    finishButtonDisabled: {
      opacity: 0.6,
    },
    finishButtonText: {
      color: theme.isDark
        ? theme.colours.background
        : theme.colours.backgroundElevated,
      ...theme.typography.heading,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    modalContent: {
      backgroundColor: theme.colours.backgroundElevated,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xxl,
      width: '100%',
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      ...theme.shadows.lg,
    },
    modalTitle: {
      color: theme.colours.text,
      ...theme.typography.title,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    modalText: {
      color: theme.colours.textSecondary,
      ...theme.typography.body,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    modalButton: {
      flex: 1,
      backgroundColor: theme.colours.primary,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
    },
    modalButtonSecondary: {
      flex: 1,
      backgroundColor: theme.colours.background,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colours.border,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalButtonPrimaryText: {
      color: theme.isDark
        ? theme.colours.background
        : theme.colours.backgroundElevated,
    },
    modalButtonSecondaryText: {
      color: theme.colours.text,
    },
  });
