export interface Recording {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: number;
  isDefault?: boolean;
}

export interface MeditationSession {
  recordingId: string;
  intervalMinutes: number;
  isPlaying: boolean;
  startTime: number | null;
  durationMinutes: number | null;
  endTime: number | null;
}
