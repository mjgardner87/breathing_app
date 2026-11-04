import SoundPlayer from 'react-native-sound-player';
import {Platform} from 'react-native';
import {AUDIO_CLIPS, AudioClip} from '../constants/audio';

type AudioKind = 'voice' | 'sound';

class AudioServiceClass {
  private available = false;
  private finish: ((success: boolean) => void) | null = null;
  private activeKind: AudioKind | null = null;
  private paused = false;
  lastError: string | null = null;

  async initialize(): Promise<boolean> {
    this.available = typeof SoundPlayer?.playAsset === 'function';
    this.lastError = this.available ? null : 'Audio is unavailable. Follow the on-screen instructions.';
    return this.available;
  }

  play(name: AudioClip, kind: AudioKind = 'voice', volume = 0.85): Promise<boolean> {
    if (kind === 'sound' && this.activeKind === 'voice') {
      return Promise.resolve(false);
    }
    this.stop();
    if (!this.available || volume <= 0) {
      return Promise.resolve(false);
    }

    const clip = AUDIO_CLIPS[name];
    return new Promise(resolve => {
      this.activeKind = kind;
      this.paused = false;
      let remaining = clip.durationMs + 1500;
      let previous = performance.now();
      const subscriptions: Array<{remove: () => void}> = [];
      let watchdog: ReturnType<typeof setInterval> | undefined;
      const finish = (success: boolean) => {
        if (this.finish !== finish) {
          return;
        }
        this.finish = null;
        this.activeKind = null;
        subscriptions.forEach(subscription => subscription.remove());
        if (watchdog) {
          clearInterval(watchdog);
        }
        resolve(success);
      };
      this.finish = finish;
      try {
        subscriptions.push(
          SoundPlayer.addEventListener('FinishedPlaying', ({success}) => {
            if (success === false) {
              this.lastError = 'Audio could not play. Follow the on-screen instructions.';
            }
            finish(success !== false);
          }),
          SoundPlayer.addEventListener('OnSetupError', () => {
            this.lastError = 'Audio could not load. Follow the on-screen instructions.';
            this.stop();
          }),
        );
        SoundPlayer.setVolume(Math.max(0, Math.min(1, volume)));
        if (Platform.OS === 'android') {
          SoundPlayer.playSoundFile(name, 'wav');
        } else {
          SoundPlayer.playAsset(clip.asset);
        }
        watchdog = setInterval(() => {
          const now = performance.now();
          if (!this.paused) {
            remaining -= now - previous;
          }
          previous = now;
          if (remaining <= 0) {
            this.lastError = 'Audio was interrupted. Follow the on-screen instructions.';
            this.stop();
          }
        }, 100);
      } catch {
        this.lastError = 'Audio could not start. Follow the on-screen instructions.';
        this.stop();
      }
    });
  }

  pause(): void {
    this.paused = true;
    if (this.finish) {
      try { SoundPlayer.pause(); } catch { this.stop(); }
    }
  }

  resume(): void {
    this.paused = false;
    if (this.finish) {
      try { SoundPlayer.resume(); } catch { this.stop(); }
    }
  }

  stop(): void {
    const finish = this.finish;
    // Remove the old listener before a replacement clip can emit an event.
    finish?.(false);
    if (this.available) {
      try { SoundPlayer.stop(); } catch { /* Already stopped. */ }
    }
    this.paused = false;
  }

  release(): void {
    this.stop();
    this.available = false;
  }
}

export const AudioService = new AudioServiceClass();
