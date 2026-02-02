import { useAudio } from '@/contexts/AudioContext';
import { COLORS } from '@/constants/meditation';
import { Play, Square, Timer, Pause, ChevronDown, BatteryWarning } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { requestIgnoreBatteryOptimizations } from '@/utils/BatteryOptimizationHelper';

export default function MeditateScreen() {
  const { recordings, session, nextPlayTime, isPaused, pausedTimeRemaining, sessionEndTime, startSession, pauseSession, resumeSession, stopSession } = useAudio();
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(3);
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<number | null>(null);
  const [timeUntilEnd, setTimeUntilEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!session) {
      setTimeUntilNext(null);
      setTimeUntilEnd(null);
      return;
    }

    if (isPaused && pausedTimeRemaining !== null) {
      setTimeUntilNext(pausedTimeRemaining);
      if (session.durationMinutes) {
        setTimeUntilEnd(session.durationMinutes * 60 * 1000);
      }
      return;
    }

    if (!nextPlayTime) {
      setTimeUntilNext(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, nextPlayTime - Date.now());
      setTimeUntilNext(remaining);

      if (sessionEndTime) {
        const endRemaining = Math.max(0, sessionEndTime - Date.now());
        setTimeUntilEnd(endRemaining);
      } else {
        setTimeUntilEnd(null);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [nextPlayTime, sessionEndTime, session, isPaused, pausedTimeRemaining]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (selectedRecording) {
      if (Platform.OS === 'android') {
        Alert.alert(
          'Background Execution',
          'To ensure the timer runs reliably when your screen is off, we recommend disabling battery optimizations.',
          [
            {
              text: 'Optimization Settings',
              onPress: () => {
                requestIgnoreBatteryOptimizations();
                startSession(selectedRecording, intervalMinutes, sessionDuration);
              },
            },
            {
              text: 'Start Anyway',
              onPress: () => startSession(selectedRecording, intervalMinutes, sessionDuration),
            },
          ]
        );
      } else {
        startSession(selectedRecording, intervalMinutes, sessionDuration);
      }
    }
  };

  const selectedRecordingData = recordings.find((r) => r.id === selectedRecording);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!session ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Begin Your Meditation</Text>
              <Text style={styles.subtitle}>Select a recording and interval</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Recording</Text>
              {recordings.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No recordings available</Text>
                  <Text style={styles.emptySubtext}>Go to Record tab to create one</Text>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={styles.dropdownButton}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {selectedRecordingData ? selectedRecordingData.name : 'Choose a sound...'}
                    </Text>
                    <ChevronDown size={20} color={COLORS.text} />
                  </TouchableOpacity>

                  {isDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {recordings.map((recording) => (
                        <TouchableOpacity
                          key={recording.id}
                          onPress={() => {
                            setSelectedRecording(recording.id);
                            setIsDropdownOpen(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <Text style={styles.dropdownItemText}>{recording.name}</Text>
                          <Text style={styles.dropdownItemDuration}>
                            {recording.isDefault ? 'Default' : formatTime(recording.duration)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {selectedRecordingData?.id !== 'default-meditation' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Repeat Interval</Text>
                <View style={styles.intervalSelector}>
                  {[1, 2, 3, 4, 5].map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      onPress={() => setIntervalMinutes(minutes)}
                      style={[
                        styles.intervalButton,
                        intervalMinutes === minutes && styles.intervalButtonSelected,
                      ]}
                    >
                      <Text style={[
                        styles.intervalText,
                        intervalMinutes === minutes && styles.intervalTextSelected,
                      ]}>
                        {minutes}
                      </Text>
                      <Text style={[
                        styles.intervalLabel,
                        intervalMinutes === minutes && styles.intervalLabelSelected,
                      ]}>
                        min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session Duration (Optional)</Text>
              <Text style={styles.sectionSubtext}>Leave unselected for continuous meditation</Text>
              <View style={styles.durationSelector}>
                {[5, 10, 15, 20, 30, 60].map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    onPress={() => setSessionDuration(sessionDuration === minutes ? null : minutes)}
                    style={[
                      styles.durationButton,
                      sessionDuration === minutes && styles.durationButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.durationText,
                      sessionDuration === minutes && styles.durationTextSelected,
                    ]}>
                      {minutes}
                    </Text>
                    <Text style={[
                      styles.durationLabel,
                      sessionDuration === minutes && styles.durationLabelSelected,
                    ]}>
                      min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleStart}
              disabled={!selectedRecording}
              style={[styles.startButton, !selectedRecording && styles.startButtonDisabled]}
            >
              <Play size={24} color={COLORS.surface} />
              <Text style={styles.startButtonText}>Start Meditation</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.activeSession}>
            <View style={styles.sessionHeader}>
              <Timer size={48} color={COLORS.primary} />
              <Text style={styles.sessionTitle}>Meditation in Progress</Text>
            </View>

            <View style={styles.sessionCard}>
              <Text style={styles.sessionRecording}>{selectedRecordingData?.name}</Text>
              <Text style={styles.sessionInterval}>
                Repeating every {session.intervalMinutes} {session.intervalMinutes === 1 ? 'minute' : 'minutes'}
              </Text>
              {session.durationMinutes && (
                <Text style={styles.sessionDurationText}>
                  Session ends in: {formatTime(timeUntilEnd || 0)}
                </Text>
              )}
            </View>

            {timeUntilNext !== null && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>{isPaused ? 'Timer Paused' : 'Next sound in'}</Text>
                <Text style={styles.timerValue}>{formatTime(timeUntilNext)}</Text>
                <View style={styles.progressRing}>
                  <View style={styles.progressRingInner} />
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={isPaused ? resumeSession : pauseSession}
                style={styles.pauseButton}
              >
                {isPaused ? (
                  <>
                    <Play size={24} color={COLORS.surface} />
                    <Text style={styles.pauseButtonText}>Resume</Text>
                  </>
                ) : (
                  <>
                    <Pause size={24} color={COLORS.surface} />
                    <Text style={styles.pauseButtonText}>Pause</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={stopSession} style={styles.stopButton}>
                <Square size={24} color={COLORS.surface} fill={COLORS.surface} />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    opacity: 0.7,
  },
  recordingCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordingCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  recordingCardContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  recordingNameSelected: {
    color: COLORS.surface,
  },
  recordingDuration: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  selectedIndicator: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
  },
  intervalSelector: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    gap: 8,
  },
  intervalButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  intervalButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  intervalText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  intervalTextSelected: {
    color: COLORS.surface,
  },
  intervalLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  intervalLabelSelected: {
    color: COLORS.surface,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.surface,
  },
  activeSession: {
    alignItems: 'center',
    paddingTop: 40,
  },
  sessionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginTop: 16,
  },
  sessionCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionRecording: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  sessionInterval: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  timerLabel: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.secondary,
    opacity: 0.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  progressRingInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.background,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
  },
  pauseButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.surface,
  },
  stopButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.surface,
  },
  sectionSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  durationSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  durationButton: {
    width: '31%',
    aspectRatio: 1.5,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  durationButtonSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  durationText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  durationTextSelected: {
    color: COLORS.surface,
  },
  durationLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  durationLabelSelected: {
    color: COLORS.surface,
  },
  sessionDurationText: {
    fontSize: 14,
    color: COLORS.accent,
    marginTop: 8,
    fontWeight: '600' as const,
  },
  dropdownButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    padding: 4,
  },
  dropdownItem: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  dropdownItemDuration: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});
