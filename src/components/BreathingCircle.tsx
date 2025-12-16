import React, {useEffect, useMemo} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';

interface BreathingCircleProps {
  breathCount: number;
  totalBreaths: number;
  isAnimating: boolean;
  breathingSpeed?: number; // seconds per breath cycle
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  breathCount,
  totalBreaths,
  isAnimating,
  breathingSpeed = 2.0,
}) => {
  const {theme} = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isAnimating) {
      // Breathing cycle: match user's breathing speed
      const cycleDuration = breathingSpeed * 1000; // Convert to ms
      const inhaleDuration = cycleDuration * 0.55; // 55% for inhale

      scale.value = withRepeat(
        withTiming(1, {
          duration: inhaleDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite
        true, // Reverse
      );

      opacity.value = withRepeat(
        withTiming(1, {
            duration: inhaleDuration,
            easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(0.4, {duration: 500});
      opacity.value = withTiming(0.6, {duration: 500});
    }
  }, [isAnimating, breathingSpeed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Outer subtle ring for reference */}
      <View style={styles.referenceRing} />

      <Animated.View style={[styles.circle, animatedStyle]}>
         {/* Inner content if needed */}
      </Animated.View>

      <Text style={styles.breathCount}>
          {breathCount}
          <Text style={styles.breathTotal}>/{totalBreaths}</Text>
      </Text>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  referenceRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
    opacity: 0.5,
  },
  circle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: theme.colours.text, // High contrast fill
    shadowColor: theme.colours.text,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  breathCount: {
    color: theme.colours.background, // Inverted text since it sits on the circle?
    // Wait, the circle scales up and down. If the text is ON TOP of the circle, it needs to contrast with the circle color.
    // If the circle is 'text' color (white in dark mode), the text should be 'background' color (black).
    // But when the circle is small (scale 0.4), the text might be outside or clipping?
    // Actually, let's put the text in the absolute center, zIndex above the circle.
    // And blend mode? No, just good contrast.
    zIndex: 10,
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    // Use mixBlendMode if possible? React Native doesn't support it easily.
    // Let's make the text color dynamic or use a distinct color.
    // If circle is White, text Black.
    color: theme.isDark ? '#000000' : '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  breathTotal: {
    fontSize: 24,
    opacity: 0.6,
  },
});
