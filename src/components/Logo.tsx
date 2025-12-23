import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {Theme} from '../constants/theme';
import {useTheme} from '../context/ThemeContext';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({size = 32, showText = true}) => {
  const {theme} = useTheme();

  // Calculate dimensions based on size (default 32)
  const barWidth = Math.round(size * 0.125); // 4px at 32
  const spacing = Math.round(size * 0.09);   // 3px at 32
  const borderRadius = Math.round(barWidth / 2);

  const barStyle = {
    width: barWidth,
    borderRadius: borderRadius,
    backgroundColor: theme.colours.primary,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, {height: size, width: size}]}>
        <View style={[barStyle, {height: size * 0.4, opacity: 0.6}]} />
        <View style={[barStyle, {height: size * 0.7, marginHorizontal: spacing, opacity: 0.8}]} />
        <View style={[barStyle, {height: size * 1.0}]} />
        <View style={[barStyle, {height: size * 0.7, marginHorizontal: spacing, opacity: 0.8}]} />
        <View style={[barStyle, {height: size * 0.4, opacity: 0.6}]} />
      </View>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.title, {color: theme.colours.text}]}>Innerfire</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: 'System',
  },
});







