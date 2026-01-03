import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  index?: number;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const TOAST_MARGIN = 16;
const TOAST_WIDTH = SCREEN_WIDTH - TOAST_MARGIN * 2;

export function Toast({
  message,
  type,
  visible,
  onDismiss,
  action,
  index = 0,
}: ToastProps): React.JSX.Element | null {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {damping: 15, stiffness: 150});
      opacity.value = withTiming(1, {duration: 200});

      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      translateY.value = withTiming(100, {duration: 200});
      opacity.value = withTiming(0, {duration: 200}, finished => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      });
    }
  }, [visible, message, translateY, opacity, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colours.success,
          iconText: '\u2713', // Checkmark
        };
      case 'error':
        return {
          backgroundColor: theme.colours.danger,
          iconText: '\u2717', // X mark
        };
      case 'warning':
        return {
          backgroundColor: theme.colours.warning,
          iconText: '\u26A0', // Warning triangle
        };
      case 'info':
      default:
        return {
          backgroundColor: theme.colours.accent,
          iconText: '\u2139', // Info
        };
    }
  };

  const typeStyles = getTypeStyles();
  const bottomOffset = 100 + index * 70; // Stack multiple toasts

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {backgroundColor: typeStyles.backgroundColor, bottom: bottomOffset},
        animatedStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <View style={styles.content}>
        <Text style={styles.icon}>{typeStyles.iconText}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>

      {action && (
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            action.onPress();
            onDismiss();
          }}
          accessibilityRole="button"
          accessibilityLabel={action.label}>
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.dismissButton}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification">
        <Text style={styles.dismissText}>{'\u2715'}</Text>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: TOAST_MARGIN,
      width: TOAST_WIDTH,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
      paddingRight: theme.spacing.xs,
      borderRadius: theme.borderRadius.lg,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 9999,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      fontSize: 18,
      color: '#FFFFFF',
      marginRight: theme.spacing.sm,
    },
    message: {
      flex: 1,
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    actionButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      marginRight: theme.spacing.xs,
    },
    actionText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
    dismissButton: {
      padding: theme.spacing.sm,
    },
    dismissText: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
    },
  });
