// src/components/animated-icon.web.tsx
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe, Easing, useAnimatedStyle, useSharedValue, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import { useEffect } from 'react';

const DURATION = 300;
const ROTATION_DURATION = 60 * 1000 * 4; // 4 minutes for full rotation

export function AnimatedSplashOverlay() {
  return null; // No splash overlay needed for web
}

// Keyframe animations
const scaleKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 0 }],
  },
  60: {
    transform: [{ scale: 1.2 }],
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(1.2),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
  },
  60: {
    transform: [{ scale: 1.2 }],
    opacity: 0,
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(1.2),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '-180deg' }, { scale: 0.8 }],
    opacity: 0,
  },
  0.3: {
    transform: [{ rotateZ: '0deg' }, { scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

// Hook for continuous rotation animation
const useContinuousRotation = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: ROTATION_DURATION }),
      -1, // Infinite loop
      false // Don't reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  return animatedStyle;
};

export function AnimatedIcon() {
  const rotationStyle = useContinuousRotation();

  return (
    <View style={styles.iconContainer}>
      {/* Rotating Glow */}
      <Animated.View style={[styles.glow, rotationStyle]}>
        <Image 
          style={styles.glow} 
          source={require('@/assets/images/logo-glow.png')}
          contentFit="contain"
        />
      </Animated.View>

      {/* Background Scale Animation */}
      <Animated.View 
        entering={scaleKeyframe.duration(DURATION)} 
        style={styles.background}
      />

      {/* Logo Fade-in Animation */}
      <Animated.View 
        style={styles.imageContainer} 
        entering={logoKeyframe.duration(DURATION)}
      >
        <Image 
          style={styles.image} 
          source={require('@/assets/images/expo-logo.png')}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

// Alternative simpler version without keyframes (more reliable on web)
export function SimpleAnimatedIcon() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(-180);

  useEffect(() => {
    // Entrance animation
    scale.value = withTiming(1, { duration: DURATION });
    opacity.value = withTiming(1, { duration: DURATION });
    rotation.value = withTiming(0, { duration: DURATION });
    
    // Continuous rotation
    const interval = setInterval(() => {
      rotation.value = withTiming(rotation.value + 360, { duration: ROTATION_DURATION });
    }, ROTATION_DURATION);
    
    return () => clearInterval(interval);
  }, []);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.glow, glowStyle]}>
        <Image 
          style={styles.glow} 
          source={require('@/assets/images/logo-glow.png')}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.background, scaleStyle]} />

      <Animated.View style={[styles.imageContainer, logoStyle]}>
        <Image 
          style={styles.image} 
          source={require('@/assets/images/expo-logo.png')}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
    borderRadius: 40,
    backgroundImage: 'linear-gradient(180deg, #3C9FFE, #0274DF)',
  },
});