import React, {useState, useEffect, useRef, useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {activate as keepAwakeActivate, deactivate as keepAwakeDeactivate} from '@thehale/react-native-keep-awake';
import {StorageService} from '../services/StorageService';
import {AudioService} from '../services/AudioService';
import {UserPreferences} from '../types';
import {useSessionState} from '../hooks/useSessionState';
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

  useEffect(() => {
    loadPreferences();
    keepAwakeActivate();
    AudioService.initialize();

    return () => {
      keepAwakeDeactivate();
      AudioService.release();
    };
  }, []);

  // Breathing phase auto-increment with audio cues
  useEffect(() => {
    if (state.currentPhase === 'breathing') {
      const breathCycleMs = prefs.breathingSpeed * 1000; // Convert to milliseconds
      const inhaleMs = breathCycleMs * 0.55; // 55% for inhale

      // Play initial breath in sound
      AudioService.play('breathe_in');

      // Schedule breath out sound
      const breathOutTimeout = setTimeout(() => {
        AudioService.play('breathe_out');
      }, inhaleMs);

      // Set up interval for subsequent breaths
      const breathInterval = setInterval(() => {
        incrementBreath();

        // Play breath in sound
        AudioService.play('breathe_in');

        // Schedule breath out sound
        setTimeout(() => {
          AudioService.play('breathe_out');
        }, inhaleMs);
      }, breathCycleMs);

      return () => {
        clearInterval(breathInterval);
        clearTimeout(breathOutTimeout);
      };
    }
  }, [state.currentPhase, incrementBreath, prefs.breathingSpeed]);

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

  // Session complete - save and navigate
  useEffect(() => {
    if (state.currentPhase === 'complete') {
      AudioService.play('round_complete');
      saveSession();
    }
  }, [state.currentPhase]);

  const loadPreferences = async () => {
    const data = await StorageService.getPreferences();
    // Ensure breathingSpeed exists (for backwards compatibility)
    setPrefs({
      ...data,
      breathingSpeed: data.breathingSpeed ?? 2.0,
    });
  };

  const saveSession = async () => {
    const session = {
      id: uuidv4(),
      date: new Date().toISOString(),
      completedRounds: state.currentRound,
      holdTimes: state.holdTimes,
      settings: prefs,
    };

    await StorageService.saveSession(session);
  };

  const handleDoneHolding = () => {
    completeHold(holdTimer);
    setHoldTimer(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    if (state.currentPhase !== 'complete') {
      setShowCancelConfirm(true);
    } else {
      keepAwakeDeactivate();
      navigation.goBack();
    }
  };

  const confirmCancel = () => {
    keepAwakeDeactivate();
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
              isAnimating={true}
              breathingSpeed={prefs.breathingSpeed}
            />
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
                style={styles.finishButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.finishButtonText}>Finish</Text>
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
                <Text style={[styles.modalButtonText, {color: theme.colours.text}]}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={confirmCancel}>
                <Text style={[styles.modalButtonText, {color: '#fff'}]}>End Session</Text>
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
    color: '#ffffff',
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
  finishButtonText: {
    color: '#ffffff',
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
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
