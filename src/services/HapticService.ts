import {Vibration} from 'react-native';

/**
 * Haptic feedback service using React Native's built-in Vibration API.
 * Provides consistent haptic patterns for different app events.
 */
export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

// Vibration patterns (duration in ms)
const PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [0, 20, 60, 30], // pause, vibrate, pause, vibrate
  warning: [0, 30, 50, 30],
  error: [0, 50, 50, 50, 50, 50],
  selection: 5,
};

class HapticServiceClass {
  private enabled: boolean = true;

  /**
   * Trigger haptic feedback of the specified type.
   */
  trigger(type: HapticType = 'light'): void {
    if (!this.enabled) {
      return;
    }

    try {
      const pattern = PATTERNS[type];

      if (Array.isArray(pattern)) {
        // Pattern vibration (wait, vibrate, wait, vibrate...)
        Vibration.vibrate(pattern);
      } else {
        // Single vibration
        Vibration.vibrate(pattern);
      }
    } catch (error) {
      // Silently fail - haptics are not critical
      console.warn('[HapticService] Vibration failed:', error);
    }
  }

  /**
   * Enable haptic feedback.
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable haptic feedback.
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if haptic feedback is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Cancel any ongoing vibration.
   */
  cancel(): void {
    Vibration.cancel();
  }
}

export const HapticService = new HapticServiceClass();
