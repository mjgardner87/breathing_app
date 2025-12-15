import {renderHook, act} from '@testing-library/react-native';
import {useSessionState} from '../useSessionState';

describe('useSessionState', () => {
  const mockPrefs = {
    breathsPerRound: 30,
    numberOfRounds: 3,
    recoveryDuration: 15,
  };

  it('initializes in breathing phase', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    expect(result.current.state.currentPhase).toBe('breathing');
    expect(result.current.state.currentRound).toBe(1);
    expect(result.current.state.breathCount).toBe(0);
  });

  it('advances breath count', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    act(() => {
      result.current.incrementBreath();
    });

    expect(result.current.state.breathCount).toBe(1);
  });

  it('transitions to holding phase after final breath', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    // Complete 30 breaths
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.incrementBreath();
      }
    });

    expect(result.current.state.currentPhase).toBe('holding');
  });

  it('transitions to recovery after completing hold', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    // Complete breathing phase
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.incrementBreath();
      }
    });

    // Complete hold
    act(() => {
      result.current.completeHold(120); // 2 minutes
    });

    expect(result.current.state.currentPhase).toBe('recovery');
    expect(result.current.state.holdTimes).toEqual([120]);
  });

  it('advances to next round after recovery', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    // Round 1
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.incrementBreath();
      }
      result.current.completeHold(120);
      result.current.completeRecovery();
    });

    expect(result.current.state.currentRound).toBe(2);
    expect(result.current.state.currentPhase).toBe('breathing');
    expect(result.current.state.breathCount).toBe(0);
  });

  it('transitions to complete after final round', () => {
    const {result} = renderHook(() => useSessionState(mockPrefs));

    // Complete 3 rounds
    for (let round = 0; round < 3; round++) {
      act(() => {
        for (let i = 0; i < 30; i++) {
          result.current.incrementBreath();
        }
        result.current.completeHold(120);
        result.current.completeRecovery();
      });
    }

    expect(result.current.state.currentPhase).toBe('complete');
    expect(result.current.state.holdTimes.length).toBe(3);
  });
});
