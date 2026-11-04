import React, {useEffect, useMemo} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import Animated, {cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';

interface BreathingCircleProps {
  breathCount: number;
  totalBreaths: number;
  isAnimating: boolean;
  direction?: 'inhale' | 'exhale';
  phaseDurationMs?: number;
  cycleId?: number;
  breathingSpeed?: number;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  breathCount, totalBreaths, isAnimating, direction = 'inhale',
  phaseDurationMs = 1100, cycleId = 0,
}) => {
  const {theme} = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scale = useSharedValue(0.45);

  useEffect(() => {
    cancelAnimation(scale);
    if (!isAnimating) { return; }
    const target = direction === 'inhale' ? 1 : 0.45;
    const remaining = Math.abs(target - scale.value) / 0.55;
    scale.value = withTiming(target, {
      duration: Math.max(0, phaseDurationMs * remaining),
      easing: Easing.linear,
    });
    return () => cancelAnimation(scale);
  }, [direction, phaseDurationMs, cycleId, isAnimating, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  return (
    <View style={styles.container} accessible accessibilityLabel={direction === 'inhale' ? 'Breathe in' : 'Let go'}>
      <View style={styles.referenceRing} />
      <Animated.View style={[styles.circle, animatedStyle]} />
      <Text style={styles.direction}>{direction === 'inhale' ? 'Breathe in' : 'Let go'}</Text>
      <Text style={styles.count}>{breathCount}<Text style={styles.total}> / {totalBreaths}</Text></Text>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {alignItems: 'center', justifyContent: 'center', height: 240, width: '100%'},
  referenceRing: {position: 'absolute', width: 224, height: 224, borderRadius: 112, borderWidth: 1, borderColor: theme.colours.border},
  circle: {position: 'absolute', width: 224, height: 224, borderRadius: 112, backgroundColor: theme.colours.text, opacity: 0.1},
  direction: {fontSize: 26, fontWeight: '500', color: theme.colours.text, marginBottom: 10},
  count: {fontSize: 22, fontVariant: ['tabular-nums'], color: theme.colours.text},
  total: {fontSize: 16, color: theme.colours.textSecondary},
});
