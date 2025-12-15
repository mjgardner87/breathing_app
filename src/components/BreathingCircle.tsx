import React, {useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import {theme} from '../constants/theme';

interface BreathingCircleProps {
  breathCount: number;
  totalBreaths: number;
  isAnimating: boolean;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  breathCount,
  totalBreaths,
  isAnimating,
}) => {
  const scale = useSharedValue(0.4);

  useEffect(() => {
    if (isAnimating) {
      // Breathing cycle: 3s expand (inhale), 2.5s contract (exhale)
      scale.value = withRepeat(
        withTiming(0.7, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite
        true, // Reverse
      );
    } else {
      scale.value = withTiming(0.4, {duration: 500});
    }
  }, [isAnimating]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, animatedStyle]}>
        <Text style={styles.breathCount}>
          {breathCount} / {totalBreaths}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colours.breathingCircleStart,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colours.breathingCircleEnd,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  breathCount: {
    color: theme.colours.text,
    fontSize: 40,
    fontWeight: 'bold',
  },
});
