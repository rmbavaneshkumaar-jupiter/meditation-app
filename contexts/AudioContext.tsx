import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as KeepAwake from 'expo-keep-awake';
import { Platform } from 'react-native';
import type { Recording, MeditationSession } from '@/types/audio';
import { MAX_RECORDING_DURATION } from '@/constants/meditation';

const STORAGE_KEY = 'meditation_recordings';

export const [AudioProvider, useAudio] = createContextHook(() => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingInstance, setRecordingInstance] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [session, setSession] = useState<MeditationSession | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [nextPlayTime, setNextPlayTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);
  const [keepAliveSound, setKeepAliveSound] = useState<Audio.Sound | null>(null);

  const notificationId = useRef<string | null>(null);
  const timerInterval = useRef<any>(null);

  useEffect(() => {
    loadRecordings();
    setupAudio();
    setupNotifications();
    return () => {
      stopNotificationUpdates();
    };
  }, []);

  const setupNotifications = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('meditation-timer', {
        name: 'Meditation Timer',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    await Notifications.requestPermissionsAsync();
  };

  const updateNotification = async (remainingMs: number | null, isPaused: boolean = false) => {
    const title = isPaused ? 'Meditation Paused' : 'Meditation in Progress';
    let body = 'Finding your inner peace...';

    if (remainingMs !== null) {
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      body = `Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (notificationId.current) {
      await Notifications.dismissNotificationAsync(notificationId.current);
    }

    notificationId.current = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sticky: true,
        autoDismiss: false,
        color: '#6366f1',
      },
      trigger: null,
    });
  };

  const startNotificationUpdates = (endTime: number | null) => {
    stopNotificationUpdates();
    timerInterval.current = setInterval(() => {
      const remaining = endTime ? Math.max(0, endTime - Date.now()) : null;
      updateNotification(remaining, false);
    }, 5000); // Update every 5 seconds to be efficient but informative

    // Immediate update
    const remaining = endTime ? Math.max(0, endTime - Date.now()) : null;
    updateNotification(remaining, false);
  };

  const stopNotificationUpdates = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (notificationId.current) {
      Notifications.dismissNotificationAsync(notificationId.current);
      notificationId.current = null;
    }
  };

  const setupAudio = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  };

  const loadRecordings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let userRecordings: Recording[] = [];
      if (stored) {
        userRecordings = JSON.parse(stored);
      }

      const defaultSounds = [
        {
          id: 'default-meditation',
          name: 'Om Chant Meditation',
          file: require('@/assets/sounds/Om-chant.aac')
        },
        {
          id: 'tibetan-bowl',
          name: 'Tibetan Singing Bowl Meditation',
          file: require('@/assets/sounds/tibetan-bowl.aac')
        }
      ];

      const loadedDefaults: Recording[] = [];

      for (const sound of defaultSounds) {
        const asset = Asset.fromModule(sound.file);
        await asset.downloadAsync();
        loadedDefaults.push({
          id: sound.id,
          name: sound.name,
          uri: asset.uri,
          duration: 0,
          createdAt: 0,
          isDefault: true
        });
      }

      setRecordings([...loadedDefaults, ...userRecordings]);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const saveRecordings = async (newRecordings: Recording[]) => {
    try {
      const userRecordings = newRecordings.filter(r => !r.isDefault);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userRecordings));
      setRecordings(newRecordings);
    } catch (error) {
      console.error('Failed to save recordings:', error);
    }
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.error('Audio permission not granted');
        return;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      setRecordingInstance(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis);
          if (status.durationMillis >= MAX_RECORDING_DURATION) {
            stopRecording();
          }
        }
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recordingInstance) return;

    try {
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      const status = await recordingInstance.getStatusAsync();

      if (uri && status.durationMillis) {
        // Filter out default recordings to count only user recordings
        const userRecordingCount = recordings.filter(r => !r.isDefault).length;

        const newRecording: Recording = {
          id: Date.now().toString(),
          name: `Your Recording ${userRecordingCount + 1}`,
          uri,
          duration: status.durationMillis,
          createdAt: Date.now(),
        };
        await saveRecordings([...recordings, newRecording]);
      }

      setRecordingInstance(null);
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const deleteRecording = async (id: string) => {
    const updated = recordings.filter((r) => r.id !== id);
    await saveRecordings(updated);
  };

  const startSession = async (recordingId: string, intervalMinutes: number, durationMinutes: number | null = null) => {
    const recording = recordings.find((r) => r.id === recordingId);
    if (!recording) return;

    if (sound) {
      await sound.unloadAsync();
    }

    try {
      // Only loop if it's specifically the Om Chant
      const isOmChant = recording.id === 'default-meditation';

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        {
          shouldPlay: true,
          isLooping: false // We handle Om Chant looping manually with 3s delay
        }
      );
      // Universal Keep-Alive: Start for ALL sessions
      try {
        const { sound: silence } = await Audio.Sound.createAsync(
          require('@/assets/sounds/Om-chant.aac'),
          { shouldPlay: true, isLooping: true, volume: 0.01 }
        );
        setKeepAliveSound(silence);
      } catch (e) {
        console.error('Failed to start keep-alive:', e);
      }

      // Playback Status Update for Om Chant Repeater
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          if (isOmChant) {
            // 3-Second Delay Logic
            // When sound finishes, wait 3 seconds, then replay
            const delay = 3000;
            const nextTime = Date.now() + delay;

            // We use the same 'nextPlayTime' state mechanism to trigger the replay
            // But we set it to (Now + 3s)
            setNextPlayTime(nextTime);
          }
        }
      });

      setSound(newSound);

      const startTime = Date.now();
      const endTime = durationMinutes ? startTime + durationMinutes * 60 * 1000 : null;

      setSession({
        recordingId,
        intervalMinutes: isOmChant ? 0 : intervalMinutes, // 0 indicates special handling
        isPlaying: true,
        startTime,
        durationMinutes,
        endTime,
      });

      if (!isOmChant) {
        setNextPlayTime(startTime + intervalMinutes * 60 * 1000);
      } else {
        setNextPlayTime(null); // Om Chant is handled by didJustFinish
      }
      setSessionEndTime(endTime);

      // Background & Screen-Off features
      KeepAwake.activateKeepAwakeAsync();
      startNotificationUpdates(endTime);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const pauseSession = async () => {
    if (!session || isPaused) return;
    setIsPaused(true);
    if (keepAliveSound) {
      await keepAliveSound.pauseAsync();
    }
    if (nextPlayTime) {
      setPausedTimeRemaining(nextPlayTime - Date.now());
    }
    if (sessionEndTime) {
      const remainingTime = sessionEndTime - Date.now();
      setSessionEndTime(null);
      setPausedTimeRemaining(prev => prev !== null ? prev : 0);
      setSession(prev => prev ? { ...prev, endTime: null, durationMinutes: remainingTime / (60 * 1000) } : null);
    }

    updateNotification(pausedTimeRemaining, true);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const resumeSession = async () => {
    if (!session || !isPaused) return;
    setIsPaused(false);
    if (keepAliveSound) {
      await keepAliveSound.playFromPositionAsync(0);
    }
    if (pausedTimeRemaining) {
      setNextPlayTime(Date.now() + pausedTimeRemaining);
    }
    if (session.durationMinutes && session.durationMinutes > 0) {
      const endTime = Date.now() + session.durationMinutes * 60 * 1000;
      setSessionEndTime(endTime);
      setSession(prev => prev ? { ...prev, endTime } : null);
      startNotificationUpdates(endTime);
    }
    setPausedTimeRemaining(null);
  };

  const stopSession = useCallback(async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    if (keepAliveSound) {
      await keepAliveSound.unloadAsync();
      setKeepAliveSound(null);
    }
    setSession(null);
    setNextPlayTime(null);
    setIsPaused(false);
    setPausedTimeRemaining(null);
    setSessionEndTime(null);

    // Cleanup background features
    KeepAwake.deactivateKeepAwake();
    stopNotificationUpdates();
  }, [sound, keepAliveSound]);

  useEffect(() => {
    if (!session || !sound || isPaused) return;

    const interval = setInterval(async () => {
      if (sessionEndTime && Date.now() >= sessionEndTime) {
        console.log('Session duration ended, stopping session');
        await stopSession();
        return;
      }

      if (nextPlayTime && Date.now() >= nextPlayTime) {
        try {
          // Robust Reload Strategy for ALL intervals (including Om Chant's 3s gap)
          await sound.unloadAsync();

          const recording = recordings.find(r => r.id === session.recordingId);
          if (recording) {
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: recording.uri },
              { shouldPlay: true }
            );

            // Re-attach listener for Om Chant to keep the loop going
            if (recording.id === 'default-meditation') {
              newSound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                  // Schedule next play in 3 seconds
                  setNextPlayTime(Date.now() + 3000);
                }
              });
            }

            setSound(newSound);
          }

          // Only auto-schedule next time if it's NOT Om Chant (normal interval)
          // Om Chant schedules itself after finish
          if (session.recordingId !== 'default-meditation') {
            setNextPlayTime(Date.now() + session.intervalMinutes * 60 * 1000);
          } else {
            setNextPlayTime(null); // Wait for finish to schedule
          }
        } catch (error) {
          console.error('Failed to replay sound:', error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, sound, nextPlayTime, isPaused, sessionEndTime, stopSession]);

  return {
    recordings,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    deleteRecording,
    session,
    nextPlayTime,
    isPaused,
    pausedTimeRemaining,
    sessionEndTime,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
  };
});
