import {useState, useCallback} from 'react';
import {UserPreferences, SessionState, SessionPhase} from '../types';

interface UseSessionStateReturn {
  state: SessionState;
  incrementBreath: () => void;
  completeHold: (duration: number) => void;
  completeRecovery: () => void;
  reset: () => void;
}

export function useSessionState(prefs: UserPreferences): UseSessionStateReturn {
  const [state, setState] = useState<SessionState>({
    currentRound: 1,
    currentPhase: 'breathing',
    breathCount: 0,
    holdStartTime: null,
    holdTimes: [],
  });

  const incrementBreath = useCallback(() => {
    setState(prev => {
      const newBreathCount = prev.breathCount + 1;

      // Check if we've completed this round's breathing
      if (newBreathCount >= prefs.breathsPerRound) {
        return {
          ...prev,
          breathCount: newBreathCount,
          currentPhase: 'holding',
          holdStartTime: Date.now(),
        };
      }

      return {
        ...prev,
        breathCount: newBreathCount,
      };
    });
  }, [prefs.breathsPerRound]);

  const completeHold = useCallback((duration: number) => {
    setState(prev => ({
      ...prev,
      currentPhase: 'recovery',
      holdTimes: [...prev.holdTimes, duration],
      holdStartTime: null,
    }));
  }, []);

  const completeRecovery = useCallback(() => {
    setState(prev => {
      // Check if we've completed all rounds
      if (prev.currentRound >= prefs.numberOfRounds) {
        return {
          ...prev,
          currentPhase: 'complete',
        };
      }

      // Move to next round
      return {
        ...prev,
        currentRound: prev.currentRound + 1,
        currentPhase: 'breathing',
        breathCount: 0,
      };
    });
  }, [prefs.numberOfRounds]);

  const reset = useCallback(() => {
    setState({
      currentRound: 1,
      currentPhase: 'breathing',
      breathCount: 0,
      holdStartTime: null,
      holdTimes: [],
    });
  }, []);

  return {
    state,
    incrementBreath,
    completeHold,
    completeRecovery,
    reset,
  };
}
