import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {activate as keepAwakeActivate, deactivate as keepAwakeDeactivate} from '@thehale/react-native-keep-awake';
import {StorageService} from '../services/StorageService';
import {AudioService} from '../services/AudioService';
import {UserPreferences} from '../types';
import {useSessionState} from '../hooks/useSessionState';
import {BreathingCircle} from '../components/BreathingCircle';
import {theme} from '../constants/theme';
import {v4 as uuidv4} from 'uuid';

export const Session: React.FC = () => {
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState<UserPreferences>({
    breathsPerRound: 30,
    numberOfRounds: 3,
    recoveryDuration: 15,
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
      let breathInPlayed = false;

      const breathInterval = setInterval(() => {
        if (!breathInPlayed) {
          AudioService.play('breathe_in');
          breathInPlayed = true;
          setTimeout(() => {
            AudioService.play('breathe_out');
            breathInPlayed = false;
          }, 3000); // Play "breathe out" after 3 seconds
        }

        incrementBreath();
      }, 5500); // 5.5 seconds per breath cycle

      return () => clearInterval(breathInterval);
    }
  }, [state.currentPhase, incrementBreath]);

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
    setPrefs(data);
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
              Round {state.currentRound} of {prefs.numberOfRounds} - Breathing
            </Text>
            <BreathingCircle
              breathCount={state.breathCount}
              totalBreaths={prefs.breathsPerRound}
              isAnimating={true}
            />
          </>
        );

      case 'holding':
        return (
          <>
            <Text style={styles.phaseText}>Hold your breath</Text>
            <View style={styles.holdContainer}>
              <Text style={styles.holdTimer}>{formatTime(holdTimer)}</Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleDoneHolding}>
                <Text style={styles.doneButtonText}>Done Holding</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'recovery':
        return (
          <>
            <Text style={styles.phaseText}>Recovery Breath</Text>
            <View style={styles.recoveryContainer}>
              <Text style={styles.recoveryText}>
                Hold for {prefs.recoveryDuration} seconds
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
            <Text style={styles.modalTitle}>End Session Early?</Text>
            <Text style={styles.modalText}>Progress won't be saved.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowCancelConfirm(false)}>
                <Text style={styles.modalButtonText}>No, continue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={confirmCancel}>
                <Text style={styles.modalButtonText}>Yes, end it</Text>
              </TouchableOpacity>
            </View>
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
  cancelButton: {
    position: 'absolute',
    top: theme.spacing.xl + theme.spacing.lg,
    right: theme.spacing.xl,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: theme.colours.textTertiary,
    fontSize: 28,
    opacity: 0.4,
    fontWeight: '200',
  },
  phaseText: {
    color: theme.colours.textSecondary,
    ...theme.typography.heading,
    textAlign: 'center',
    marginTop: theme.spacing.xxxl,
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
  },
  doneButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colours.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colours.primaryHover,
    ...theme.shadows.md,
  },
  doneButtonText: {
    color: '#ffffff',
    ...theme.typography.heading,
  },
  recoveryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryText: {
    color: theme.colours.textSecondary,
    ...theme.typography.body,
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
    ...theme.typography.body,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  finishButton: {
    backgroundColor: theme.colours.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xxl * 2,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  finishButtonText: {
    color: '#ffffff',
    ...theme.typography.heading,
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
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
  },
  modalTitle: {
    color: theme.colours.text,
    ...theme.typography.title,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
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
  },
  modalButton: {
    flex: 1,
    backgroundColor: theme.colours.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
    marginRight: theme.spacing.sm,
  },
  modalButtonText: {
    color: theme.colours.text,
    ...theme.typography.bodyMedium,
  },
});
