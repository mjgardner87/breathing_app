import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';
import {AudioService} from '../services/AudioService';
import {HapticService} from '../services/HapticService';
import {AUDIO_CLIPS, AudioClip} from '../constants/audio';
import prompts from '../content/voice-prompts.json';
import {ResolvedPreferences, SessionMode} from '../types';

type VoiceClip = keyof typeof prompts;
export type GuidedPhase = 'ready' | 'preparing' | 'breathing' | 'holding' |
  'recovery-inhale' | 'recovery' | 'settling' | 'interrupted' | 'complete';
interface Snapshot {
  phase: GuidedPhase;
  round: number;
  breathCount: number;
  direction: 'inhale' | 'exhale';
  phaseDurationMs: number;
  cycleId: number;
  seconds: number;
  caption: string;
  paused: boolean;
  audioError: string | null;
}
interface Run {
  cancelled: boolean;
  paused: boolean;
  skipIntro: boolean;
  skipGeneration: number;
  endHold: boolean;
  holdEndedAt?: number;
  releaseRecovery: boolean;
  cancelWait?: () => void;
}

export function useGuidedSession(prefs: ResolvedPreferences, mode: SessionMode) {
  const [state, setState] = useState<Snapshot>({
    phase: 'ready', round: 1, breathCount: 0, direction: 'inhale',
    phaseDurationMs: 0, cycleId: 0, seconds: 0, caption: '', paused: false,
    audioError: null,
  });
  const [holdTimes, setHoldTimes] = useState<number[]>([]);
  const runRef = useRef<Run | null>(null);
  const holdsRef = useRef<number[]>([]);
  const gentleMs = useRef(0);
  const activeMs = useRef(0);
  const startedAt = useRef<string | null>(null);

  const cancel = useCallback(() => {
    const run = runRef.current;
    if (run) {
      run.cancelled = true;
      run.cancelWait?.();
    }
    AudioService.stop();
  }, []);

  useEffect(() => {
    const listener = AppState.addEventListener('change', next => {
      if (next !== 'active' && runRef.current && !runRef.current.cancelled) {
        cancel();
        setState(previous => ({
          ...previous, phase: 'interrupted', paused: false,
          caption: 'Return to normal breathing. Restart this round when you are ready.',
        }));
      }
    });
    return () => { listener.remove(); cancel(); AudioService.release(); };
  }, [cancel]);

  const start = useCallback(() => {
    cancel();
    const run: Run = {
      cancelled: false, paused: false, skipIntro: false, skipGeneration: 0,
      endHold: false, releaseRecovery: false,
    };
    runRef.current = run;
    startedAt.current ??= new Date().toISOString();
    setState(previous => ({
      ...previous, phase: 'preparing', paused: false, audioError: null,
      caption: 'Get comfortable. You can skip the introduction when ready.',
    }));
    const update = (patch: Partial<Snapshot>) => {
      if (!run.cancelled) {
        setState(previous => ({...previous, ...patch}));
      }
    };
    const wait = (duration: number, tick?: (elapsed: number) => void) =>
      new Promise<boolean>(resolve => {
        if (run.cancelled) { resolve(false); return; }
        if (duration <= 0 && !run.paused) { resolve(true); return; }
        let remaining = duration;
        let previous = performance.now();
        const timer = setInterval(() => {
          const now = performance.now();
          if (!run.paused) {
            const delta = Math.min(remaining, now - previous);
            remaining -= delta;
            activeMs.current += delta;
            tick?.(duration - remaining);
          }
          previous = now;
          if (remaining <= 0 && !run.paused) {
            clearInterval(timer);
            run.cancelWait = undefined;
            resolve(true);
          }
        }, 40);
        run.cancelWait = () => { clearInterval(timer); resolve(false); };
      });
    const play = (clip: AudioClip, kind: 'voice' | 'sound') => {
      const result = AudioService.play(
        clip, kind, kind === 'voice' ? prefs.voiceVolume : prefs.soundVolume,
      );
      result.then(() => {
        if (!run.cancelled && AudioService.lastError) {
          update({audioError: AudioService.lastError});
        }
      });
      return result;
    };
    const say = async (clip: VoiceClip) => {
      await wait(0);
      if (run.cancelled) { return; }
      update({caption: prompts[clip]});
      const skipGeneration = run.skipGeneration;
      if (prefs.voiceVolume > 0) {
        const success = await play(clip, 'voice');
        if (!success && !run.cancelled && run.skipGeneration === skipGeneration && AudioService.lastError) {
          await wait(Math.min(AUDIO_CLIPS[clip].durationMs, 15000));
        }
      } else {
        await wait(Math.min(AUDIO_CLIPS[clip].durationMs, 15000));
      }
    };
    const breathPart = async (
      direction: 'inhale' | 'exhale', duration: number, clip: AudioClip,
      onTick?: (elapsed: number) => void,
    ) => {
      await wait(0);
      if (run.cancelled) { return; }
      setState(previous => ({
        ...previous, direction, phaseDurationMs: duration,
        cycleId: previous.cycleId + 1,
      }));
      play(clip, 'sound');
      await wait(duration, onTick);
    };

    const execute = async () => {
      await AudioService.initialize();
      await say('prepare');
      if (run.cancelled) { return; }
      if (!run.skipIntro && mode === 'gentle') {
        await say('gentle_intro');
      } else if (!run.skipIntro && prefs.guidance === 'learn') {
        await say('learn_breathing');
        if (!run.skipIntro) { await say('learn_retention'); }
      }
      if (run.cancelled) { return; }

      if (mode === 'gentle') {
        let count = Math.floor(gentleMs.current / 10000);
        update({phase: 'breathing', caption: 'Light, comfortable breaths. No holds.'});
        while (gentleMs.current < 300000 && !run.cancelled) {
          update({breathCount: ++count});
          for (const direction of ['inhale', 'exhale'] as const) {
            const base = gentleMs.current;
            const duration = Math.min(
              direction === 'inhale' ? 4000 : 6000, 300000 - base,
            );
            await breathPart(direction, duration, direction === 'inhale'
              ? 'gentle_inhale' : 'gentle_exhale', elapsed => {
                gentleMs.current = base + elapsed;
                update({seconds: Math.ceil((300000 - gentleMs.current) / 1000)});
              });
            if (run.cancelled) { return; }
          }
          if (count === 6 || count === 18) {
            update({caption: prompts.gentle_reminder});
            if (prefs.guidance !== 'minimal') { play('gentle_reminder', 'voice'); }
          }
        }
      } else {
        for (let round = holdsRef.current.length + 1; round <= prefs.numberOfRounds; round++) {
          if (run.cancelled) { return; }
          update({phase: 'preparing', round, breathCount: 0});
          if (round === 1 || prefs.guidance !== 'minimal') {
            await say(round === 1 ? 'round_start' : 'next_round');
          }
          if (run.cancelled) { return; }
          update({phase: 'breathing', caption: 'Full breath in. Let it out without force.'});
          const pace = prefs.breathingSpeed;
          const warningAt = Math.max(
            1, prefs.breathsPerRound -
            Math.ceil(AUDIO_CLIPS.last_breaths.durationMs / (pace * 1000)) - 1,
          );
          for (let breath = 1; breath <= prefs.breathsPerRound; breath++) {
            update({breathCount: breath});
            if (breath === warningAt) {
              update({caption: prompts.last_breaths});
              play('last_breaths', 'voice');
            }
            await breathPart('inhale', pace * 550, ('inhale_' + pace * 10) as AudioClip);
            if (run.cancelled) { return; }
            await breathPart('exhale', pace * 450, ('exhale_' + pace * 10) as AudioClip);
            if (run.cancelled) { return; }
          }
          AudioService.stop();
          const holdStarted = performance.now();
          run.endHold = false;
          update({phase: 'holding', seconds: 0, caption: prompts.hold_breath});
          HapticService.trigger('medium');
          play('hold_breath', 'voice');
          let firstCue = false;
          let secondCue = false;
          let minute = 0;
          while (!run.endHold && !run.cancelled) {
            const elapsed = (performance.now() - holdStarted) / 1000;
            update({seconds: Math.floor(elapsed)});
            if (prefs.retentionGuidance && prefs.guidance !== 'minimal') {
              if (elapsed >= 12 && !firstCue) {
                firstCue = true;
                const cue = round % 2 === 1 ? 'retention_relax' : 'retention_notice';
                update({caption: prompts[cue]});
                play(cue, 'voice');
              }
              if (elapsed >= 40 && !secondCue && prefs.guidance === 'learn') {
                secondCue = true;
                update({caption: prompts.retention_notice});
                play('retention_notice', 'voice');
              }
            }
            if (prefs.minuteMarkers && Math.floor(elapsed / 60) > minute) {
              minute = Math.floor(elapsed / 60);
              play('minute_marker', 'sound');
            }
            await wait(80);
          }
          if (run.cancelled) { return; }
          const heldSeconds = Math.max(0, Math.round(((run.holdEndedAt ?? performance.now()) - holdStarted) / 1000));
          run.holdEndedAt = undefined;
          AudioService.stop();
          update({phase: 'recovery-inhale', caption: prompts.recovery_breath});
          await say('recovery_breath');
          if (run.cancelled) { return; }
          run.releaseRecovery = false;
          update({phase: 'recovery', seconds: prefs.recoveryDuration, caption: prompts.recovery_hold});
          play('recovery_hold', 'voice');
          let countdownStarted = false;
          await wait(prefs.recoveryDuration * 1000, elapsed => {
            update({seconds: Math.max(0, Math.ceil(prefs.recoveryDuration - elapsed / 1000))});
            if (!countdownStarted &&
                prefs.recoveryDuration * 1000 - elapsed <= AUDIO_CLIPS.recovery_countdown.durationMs + 200) {
              countdownStarted = true;
              play('recovery_countdown', 'voice');
            }
          });
          if (run.cancelled) { return; }
          AudioService.stop();
          holdsRef.current = [...holdsRef.current, heldSeconds];
          setHoldTimes(holdsRef.current);
          update({phase: 'settling', caption: prompts.release});
          await say('release');
          if (run.cancelled) { return; }
          HapticService.trigger('light');
          await say('round_complete');
          await wait(5000);
        }
      }
      if (run.cancelled) { return; }
      update({phase: 'settling'});
      await say('session_complete');
      if (run.cancelled) { return; }
      run.cancelled = true;
      setState(previous => ({...previous, phase: 'complete', paused: false}));
      HapticService.trigger('success');
    };
    execute().catch(() => {
      if (!run.cancelled) {
        cancel();
        setState(previous => ({
          ...previous, phase: 'interrupted', paused: false,
          caption: 'Return to normal breathing. Restart when you are comfortable.',
        }));
      }
    });
  }, [cancel, mode, prefs]);

  const togglePause = useCallback(() => {
    const run = runRef.current;
    if (!run || run.cancelled) { return; }
    run.paused = !run.paused;
    if (run.paused) { AudioService.pause(); } else { AudioService.resume(); }
    setState(previous => ({...previous, paused: run.paused}));
  }, []);

  const endHold = useCallback(() => {
    if (runRef.current && !runRef.current.endHold) {
      runRef.current.endHold = true;
      runRef.current.holdEndedAt = performance.now();
      runRef.current.cancelWait?.();
      AudioService.stop();
    }
  }, []);
  const releaseRecovery = useCallback(() => {
    if (runRef.current) {
      runRef.current.releaseRecovery = true;
      runRef.current.cancelWait?.();
      AudioService.stop();
    }
  }, []);
  const skipIntro = useCallback(() => {
    if (runRef.current && !runRef.current.paused) {
      runRef.current.skipIntro = true;
      runRef.current.skipGeneration++;
      runRef.current.cancelWait?.();
      AudioService.stop();
    }
  }, []);
  const finishEarly = useCallback(() => {
    cancel();
    setState(previous => ({
      ...previous, phase: 'complete', paused: false,
      caption: 'Session ended. Breathe naturally and take your time.',
    }));
  }, [cancel]);

  return {
    state, holdTimes, start, togglePause, endHold, releaseRecovery, skipIntro, finishEarly,
    startedAt, durationSeconds: Math.round(
      mode === 'gentle' ? gentleMs.current / 1000 : activeMs.current / 1000,
    ),
  };
}
