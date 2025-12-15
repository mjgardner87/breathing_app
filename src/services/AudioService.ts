import Sound from 'react-native-sound';

Sound.setCategory('Playback');

class AudioServiceClass {
  private sounds: Map<string, Sound> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Note: Audio files need to be placed in android/app/src/main/res/raw/
    const audioFiles = [
      'breathe_in',
      'breathe_out',
      'hold_breath',
      'recovery_breath',
      'release',
      'round_complete',
      'minute_marker', // New: minute notification during holds
    ];

    const loadPromises = audioFiles.map(
      file =>
        new Promise<void>((resolve, reject) => {
          const sound = new Sound(`${file}.mp3`, Sound.MAIN_BUNDLE, error => {
            if (error) {
              console.warn(`Failed to load sound: ${file}`, error);
              resolve(); // Don't fail initialization if one file missing
            } else {
              this.sounds.set(file, sound);
              resolve();
            }
          });
        }),
    );

    await Promise.all(loadPromises);
    this.initialized = true;
  }

  play(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.play(success => {
        if (!success) {
          console.warn(`Sound playback failed: ${name}`);
        }
      });
    } else {
      console.warn(`Sound not found: ${name}`);
    }
  }

  release(): void {
    this.sounds.forEach(sound => sound.release());
    this.sounds.clear();
    this.initialized = false;
  }
}

export const AudioService = new AudioServiceClass();
