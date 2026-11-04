export interface UserPreferences {
  breathsPerRound: number;
  numberOfRounds: number;
  recoveryDuration: number;
  breathingSpeed: number; // seconds per breath cycle (inhale + exhale)
  guidance?: 'learn' | 'guided' | 'minimal';
  voiceVolume?: number;
  soundVolume?: number;
  retentionGuidance?: boolean;
  minuteMarkers?: boolean;
}

export type SessionMode = 'retention' | 'gentle';
export type ResolvedPreferences = Required<UserPreferences>;

export interface SessionData {
  id: string;
  date: string;
  completedRounds: number;
  holdTimes: number[];
  settings: UserPreferences;
  mode?: SessionMode;
  durationSeconds?: number;
}

export type SessionPhase =
  | 'breathing'
  | 'holding'
  | 'recovery'
  | 'complete';

export interface SessionState {
  currentRound: number;
  currentPhase: SessionPhase;
  breathCount: number;
  holdStartTime: number | null;
  holdTimes: number[];
}
