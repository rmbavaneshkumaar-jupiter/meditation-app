import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const textFade = useRef(new Animated.Value(0)).current;
  const imageFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Text fades in/out over 2.5s
    // 2. Image fades in/out over 4.8s

    Animated.sequence([
      // Stage 1: Welcome Text
      Animated.timing(textFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(textFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      // Stage 2: Remote Image
      Animated.timing(imageFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(3000), // Full 3s delay + 1s fade-in = 4s display
      Animated.timing(imageFade, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [textFade, imageFade, onFinish]);

  return (
    <View style={styles.container}>
      {/* Background layer for Remote Image - Starts loading immediately */}
      <Animated.View style={[styles.imageContainer, { opacity: imageFade, position: 'absolute' }]}>
        <Image
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/m7p1453ho1q306lz6yu00' }}
          style={styles.image}
          contentFit="cover"
        />
      </Animated.View>

      {/* Foreground layer for Welcome Text */}
      <Animated.View style={{ opacity: textFade }}>
        <Text style={styles.welcomeText}>Finding your inner peace...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#E0E7FF',
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  imageContainer: {
    width: width,
    height: height,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
