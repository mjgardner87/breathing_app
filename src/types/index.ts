export interface UserPreferences {
  breathsPerRound: number;
  numberOfRounds: number;
  recoveryDuration: number;
  breathingSpeed: number; // seconds per breath cycle (inhale + exhale)
}

export interface SessionData {
  id: string;
  date: string;
  completedRounds: number;
  holdTimes: number[];
  settings: UserPreferences;
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
