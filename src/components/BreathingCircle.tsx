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
    zIndex: 10,
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    color: theme.colours.background,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  breathTotal: {
    fontSize: 24,
    opacity: 0.6,
    color: theme.colours.background,
  },
});
