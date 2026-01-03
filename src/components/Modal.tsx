import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {Theme} from '../constants/theme';

interface ModalButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttons: ModalButton[];
  children?: React.ReactNode;
}

export function Modal({
  visible,
  onClose,
  title,
  message,
  buttons,
  children,
}: ModalProps): React.JSX.Element {
  const {theme} = useTheme();
  const styles = createStyles(theme);

  const getButtonStyle = (variant: ModalButton['variant'] = 'primary') => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondary;
      case 'danger':
        return styles.buttonDanger;
      default:
        return styles.buttonPrimary;
    }
  };

  const getButtonTextStyle = (variant: ModalButton['variant'] = 'primary') => {
    switch (variant) {
      case 'secondary':
        return styles.buttonTextSecondary;
      case 'danger':
        return styles.buttonTextDanger;
      default:
        return styles.buttonTextPrimary;
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>

          {message && <Text style={styles.message}>{message}</Text>}

          {children}

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.button, getButtonStyle(button.variant)]}
                onPress={button.onPress}
                accessibilityRole="button"
                accessibilityLabel={button.label}>
                <Text style={[styles.buttonText, getButtonTextStyle(button.variant)]}>
                  {button.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    content: {
      backgroundColor: theme.colours.backgroundElevated,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xxl,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      ...theme.shadows.lg,
    },
    title: {
      color: theme.colours.text,
      ...theme.typography.title,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    message: {
      color: theme.colours.textSecondary,
      ...theme.typography.body,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: theme.colours.primary,
    },
    buttonSecondary: {
      backgroundColor: theme.colours.background,
      borderWidth: 1,
      borderColor: theme.colours.border,
    },
    buttonDanger: {
      backgroundColor: theme.colours.danger,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    buttonTextPrimary: {
      color: theme.isDark
        ? theme.colours.background
        : theme.colours.backgroundElevated,
    },
    buttonTextSecondary: {
      color: theme.colours.text,
    },
    buttonTextDanger: {
      color: '#FFFFFF',
    },
  });
