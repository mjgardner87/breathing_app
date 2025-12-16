import SoundPlayer from 'react-native-sound-player';

class AudioServiceClass {
  private initialized = false;
  private soundPlayerAvailable = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check if SoundPlayer is available
      if (SoundPlayer && typeof SoundPlayer.playSoundFile === 'function') {
        this.soundPlayerAvailable = true;
        console.log('[AudioService] Initialized with react-native-sound-player');
      } else {
        console.warn('[AudioService] SoundPlayer not available, audio will be disabled');
        this.soundPlayerAvailable = false;
      }
      this.initialized = true;
    } catch (error) {
      console.warn('[AudioService] Failed to initialize:', error);
      this.soundPlayerAvailable = false;
      this.initialized = true;
    }
  }

  play(name: string): void {
    if (!this.soundPlayerAvailable) {
      console.log(`[AudioService] Would play: ${name} (SoundPlayer not available)`);
      return;
    }

    try {
      // Play sound from raw resources
      // File extension is automatically handled
      SoundPlayer.playSoundFile(name, 'wav');
    } catch (error) {
      console.warn(`[AudioService] Playback failed for ${name}:`, error);
    }
  }

  release(): void {
    // No cleanup needed for react-native-sound-player
    this.initialized = false;
    this.soundPlayerAvailable = false;
    console.log('[AudioService] Released audio resources');
  }
}

export const AudioService = new AudioServiceClass();
