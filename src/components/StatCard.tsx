import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  variant?: 'default' | 'highlight' | 'compact';
}

export function StatCard({
  label,
  value,
  subtitle,
  variant = 'default',
}: StatCardProps): React.JSX.Element {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const containerStyle = [
    styles.container,
    variant === 'highlight' && styles.containerHighlight,
    variant === 'compact' && styles.containerCompact,
  ];

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          variant === 'compact' && styles.valueCompact,
        ]}>
        {value}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colours.backgroundElevated,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 80,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
    },
    containerHighlight: {
      backgroundColor: theme.colours.primary,
      borderColor: theme.colours.primaryHover,
    },
    containerCompact: {
      minHeight: 60,
      padding: theme.spacing.md,
    },
    label: {
      color: theme.colours.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.xs,
    },
    value: {
      color: theme.colours.text,
      fontSize: 22,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    valueCompact: {
      fontSize: 18,
    },
    subtitle: {
      color: theme.colours.textTertiary,
      fontSize: 12,
      marginTop: theme.spacing.xs,
    },
  });
