import { useAudio } from '@/contexts/AudioContext';
import { useUser } from '@/contexts/UserContext';
import { COLORS, MAX_RECORDING_DURATION, MIN_RECORDING_DURATION } from '@/constants/meditation';
import { Mic, Square, Trash2 } from 'lucide-react-native';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter, useNavigation } from 'expo-router';

export default function RecordScreen() {
  const { recordings, isRecording, recordingDuration, startRecording, stopRecording, deleteRecording } = useAudio();
  const { username, isLoading } = useUser();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !username) {
      router.replace('/onboarding');
    }
  }, [isLoading, username]);

  useEffect(() => {
    if (username) {
      navigation.setOptions({ headerTitle: `Welcome ${username}` });
    }
  }, [username]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  if (isLoading || !username) {
    return null; // Or a loading spinner
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canStartRecording = !isRecording;
  const canStopRecording = isRecording && recordingDuration >= MIN_RECORDING_DURATION;

  return (
    <View style={styles.container}>
      <View style={styles.recordSection}>
        <Text style={styles.title}>Meditate Using Sound or Your Own Recording</Text>

        <View style={styles.recordingArea}>
          <Text style={styles.subtitle}>Record Your Sound</Text>
          {isRecording && (
            <>
              <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]} />
              <Animated.View style={[styles.pulseInner, { transform: [{ scale: pulseAnim }] }]} />
            </>
          )}
          <View style={[styles.recordButton, isRecording && styles.recordButtonActive]}>
            {isRecording ? (
              <TouchableOpacity
                onPress={stopRecording}
                disabled={!canStopRecording}
                style={[styles.stopButton, !canStopRecording && styles.buttonDisabled]}
              >
                <Square size={40} color={COLORS.surface} fill={COLORS.surface} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startRecording}
                disabled={!canStartRecording}
                style={[styles.micButton, !canStartRecording && styles.buttonDisabled]}
              >
                <Mic size={48} color={COLORS.surface} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isRecording && (
          <View style={styles.durationContainer}>
            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(recordingDuration / MAX_RECORDING_DURATION) * 100}%` }
                ]}
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <ScrollView style={styles.recordingsList} contentContainerStyle={styles.recordingsContent}>
        <Text style={styles.listTitle}>Your Recordings</Text>
        {recordings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>Tap the microphone to record</Text>
          </View>
        ) : (
          recordings.map((recording) => (
            <View key={recording.id} style={styles.recordingItem}>
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingName}>{recording.name}</Text>
                <Text style={styles.recordingDuration}>
                  {recording.isDefault ? 'Default Sound' : formatDuration(recording.duration)}
                </Text>
              </View>
              {!recording.isDefault && (
                <TouchableOpacity
                  onPress={() => deleteRecording(recording.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={20} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
          ))
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
  recordSection: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  recordingArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    position: 'relative' as const,
  },
  pulseOuter: {
    position: 'absolute' as const,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.secondary,
    opacity: 0.2,
  },
  pulseInner: {
    position: 'absolute' as const,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.secondary,
    opacity: 0.3,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: COLORS.error,
  },
  micButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  durationContainer: {
    marginTop: 32,
    alignItems: 'center',
    width: '100%',
  },
  durationText: {
    fontSize: 32,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.secondary,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.secondary,
    opacity: 0.3,
  },
  recordingsList: {
    flex: 1,
  },
  recordingsContent: {
    padding: 24,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  recordingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  recordingDuration: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  deleteButton: {
    padding: 8,
  },
});
