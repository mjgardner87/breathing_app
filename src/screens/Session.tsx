import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import KeepAwake from 'react-native-keep-awake';
import {StorageService} from '../services/StorageService';
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

  useEffect(() => {
    loadPreferences();
    KeepAwake.activate();

    return () => {
      KeepAwake.deactivate();
    };
  }, []);

  // Breathing phase auto-increment
  useEffect(() => {
    if (state.currentPhase === 'breathing') {
      const breathInterval = setInterval(() => {
        incrementBreath();
      }, 5500); // 5.5 seconds per breath cycle

      return () => clearInterval(breathInterval);
    }
  }, [state.currentPhase, incrementBreath]);

  // Hold timer
  useEffect(() => {
    if (state.currentPhase === 'holding' && state.holdStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.holdStartTime!) / 1000);
        setHoldTimer(elapsed);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [state.currentPhase, state.holdStartTime]);

  // Recovery countdown
  useEffect(() => {
    if (state.currentPhase === 'recovery') {
      const timeout = setTimeout(() => {
        completeRecovery();
      }, prefs.recoveryDuration * 1000);

      return () => clearTimeout(timeout);
    }
  }, [state.currentPhase, prefs.recoveryDuration, completeRecovery]);

  // Session complete - save and navigate
  useEffect(() => {
    if (state.currentPhase === 'complete') {
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
    KeepAwake.deactivate();
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
        <Text style={styles.cancelText}>✕</Text>
      </TouchableOpacity>

      {renderPhaseContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    padding: theme.spacing.lg,
  },
  cancelButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 10,
    padding: theme.spacing.sm,
  },
  cancelText: {
    color: theme.colours.text,
    fontSize: 32,
    opacity: 0.6,
  },
  phaseText: {
    color: theme.colours.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  holdContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdTimer: {
    color: theme.colours.text,
    fontSize: 64,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xl,
  },
  doneButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colours.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colours.accent,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  doneButtonText: {
    color: theme.colours.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  recoveryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryText: {
    color: theme.colours.text,
    fontSize: 20,
    textAlign: 'center',
  },
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    color: theme.colours.text,
    fontSize: 20,
    marginBottom: theme.spacing.md,
  },
  finishButton: {
    backgroundColor: theme.colours.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl * 2,
    borderRadius: 12,
    marginTop: theme.spacing.xl,
  },
  finishButtonText: {
    color: theme.colours.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
