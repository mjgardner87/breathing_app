import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {activate as keepAwakeActivate, deactivate as keepAwakeDeactivate} from '@thehale/react-native-keep-awake';
import {StorageService} from '../services/StorageService';
import {AudioService} from '../services/AudioService';
import {UserPreferences} from '../types';
import {useSessionState} from '../hooks/useSessionState';
import {useSessionSaver} from '../hooks/useSessionSaver';
import {BreathingCircle} from '../components/BreathingCircle';
import {v4 as uuidv4} from 'uuid';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';

export const Session: React.FC = () => {
  const navigation = useNavigation();
  const {theme} = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [prefs, setPrefs] = useState<UserPreferences>({
    breathsPerRound: 30,
    numberOfRounds: 3,
    recoveryDuration: 15,
    breathingSpeed: 2.0,
  });
  const {state, incrementBreath, completeHold, completeRecovery} = useSessionState(prefs);
  const [holdTimer, setHoldTimer] = useState(0);
  const lastMinuteMarker = useRef(0); // Track last minute marker played
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const {save: saveSession, waitForSave} = useSessionSaver();
  const sessionIdRef = useRef<string | null>(null); // Track session ID for deduplication
  const isMountedRef = useRef(true); // Track component mount status

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

  // Use useFocusEffect for reliable keep awake - handles all navigation scenarios
  useFocusEffect(
    useCallback(() => {
      keepAwakeActivate();
      return () => {
        keepAwakeDeactivate();
      };
    }, [])
  );

  // Breathing phase auto-increment with audio cues
  useEffect(() => {
    if (state.currentPhase !== 'breathing' || isPaused) {
      return;
    }

    const breathCycleMs = prefs.breathingSpeed * 1000; // Convert to milliseconds
    const inhaleMs = breathCycleMs * 0.55; // 55% for inhale
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
      // Play initial hold breath audio cue
      AudioService.play('hold_breath');
      lastMinuteMarker.current = 0;

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.holdStartTime!) / 1000);
        setHoldTimer(elapsed);

        // Play minute marker sound every 60 seconds
        const currentMinute = Math.floor(elapsed / 60);
        if (currentMinute > lastMinuteMarker.current && currentMinute > 0) {
          AudioService.play('minute_marker');
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

      const timeout = setTimeout(() => {
        AudioService.play('release');
        completeRecovery();
      }, prefs.recoveryDuration * 1000);

      return () => clearTimeout(timeout);
    }
  }, [state.currentPhase, prefs.recoveryDuration, completeRecovery]);

  // Session complete - save session data automatically
  useEffect(() => {
    // Only save once when phase becomes 'complete'
    if (state.currentPhase !== 'complete') {
      return;
    }

    // Already saving or saved
    if (saveStatus === 'saving' || saveStatus === 'saved') {
      return;
    }

    // Only save if we have hold times (valid session)
    if (state.holdTimes.length === 0) {
      console.log('[Session] No hold times recorded, skipping save');
      setSaveStatus('saved'); // Mark as done even though we didn't save
      return;
    }

    AudioService.play('round_complete');
    setSaveStatus('saving');

    // Generate session ID once and store in ref to prevent duplicates
    if (!sessionIdRef.current) {
      sessionIdRef.current = uuidv4();
    }

    const session = {
      id: sessionIdRef.current,
      date: new Date().toISOString(),
      completedRounds: state.holdTimes.length, // Use holdTimes.length as authoritative source
      holdTimes: state.holdTimes,
      settings: prefs,
    };

    saveSession(session).then((success) => {
      if (isMountedRef.current) {
        setSaveStatus(success ? 'saved' : 'error');
      }
    });
  }, [state.currentPhase, state.holdTimes, prefs, saveSession, saveStatus]);

  const handleDoneHolding = () => {
    completeHold(holdTimer);
    setHoldTimer(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    // Wait for any in-progress save to complete before navigating away
    await waitForSave();
    // keepAwakeDeactivate is handled by useFocusEffect cleanup
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
    // keepAwakeDeactivate is handled by useFocusEffect cleanup
    navigation.goBack();
  };

  // Render phase-specific UI
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
            <TouchableOpacity style={styles.pauseButton} onPress={handleTogglePause}>
              <Text style={styles.pauseButtonText}>
                {isPaused ? 'Resume Breathing' : 'Pause Breathing'}
              </Text>
            </TouchableOpacity>
            {isPaused && <Text style={styles.pauseHelperText}>Session Paused</Text>}
          </>
        );

      case 'holding':
        return (
          <>
            <Text style={styles.phaseText}>Hold Breath</Text>
            <View style={styles.holdContainer}>
              <Text style={styles.holdTimer}>{formatTime(holdTimer)}</Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleDoneHolding}>
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

      case 'complete':
        return (
          <>
            <Text style={styles.phaseText}>Session Complete!</Text>
            <View style={styles.summaryContainer}>
              {state.holdTimes.map((time, index) => (
                <Text key={index} style={styles.summaryText}>
                  Round {index + 1}: {formatTime(time)}
                </Text>
              ))}
              <TouchableOpacity
                style={[styles.finishButton, saveStatus === 'saving' && styles.finishButtonDisabled]}
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
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>×</Text>
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
                <Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>
                  Resume
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={confirmCancel}>
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
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

const createStyles = (theme: Theme) => StyleSheet.create({
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
    color: theme.isDark ? theme.colours.background : theme.colours.backgroundElevated,
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
    color: theme.isDark ? theme.colours.background : theme.colours.backgroundElevated,
    ...theme.typography.heading,
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
    color: theme.isDark ? theme.colours.background : theme.colours.backgroundElevated,
  },
  modalButtonSecondaryText: {
    color: theme.colours.text,
  },
});
