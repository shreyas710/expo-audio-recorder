import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import {
  setAudioModeAsync,
  AudioModule,
  useAudioRecorder,
  useAudioPlayer,
  RecordingPresets,
} from 'expo-audio';

export default function App() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(null);

  const [uri, setUri] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();
    return async () => {
      if (recorder.isRecording) await recorder.stop();
      player?.unload?.();
    };
  }, []);

  const startRecording = async () => {
    if (!permissionGranted) {
      const { status } = await AudioModule.getRecordingPermissionsAsync();
      if (status !== 'granted') return;
      setPermissionGranted(true);
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    if (!recorder.isRecording) return;
    await recorder.stop();
    if (recorder.uri) setUri(recorder.uri);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  };

  const play = async () => {
    if (!uri) return;

    if (typeof player.replace === 'function') {
      await player.replace({ uri });
    } else if (typeof player.load === 'function') {
      await player.load({ uri });
    }
    player.seekTo?.(0);
    await player.play();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>expo-audio: Record → Stop → Play</Text>

      <View style={styles.row}>
        <Button title="Record" onPress={startRecording} />
        <View style={styles.spacer} />
        <Button title="Stop" onPress={stopRecording} />
      </View>

      <Text style={styles.status}>
        {recorder.isRecording
          ? `Recording… ${(recorder.durationMillis / 1000).toFixed(1)}s`
          : uri
            ? `Ready: ${Platform.OS === 'android' ? uri.replace(/^.*\//, '') : 'last.m4a'}`
            : 'No recording yet'}
      </Text>

      <View style={styles.row}>
        <Button title="Play" onPress={play} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 18, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  spacer: { width: 16 },
  status: { textAlign: 'center', marginTop: 8 },
});
