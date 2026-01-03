import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import {StorageService} from '../services/StorageService';
import {UserPreferences} from '../types';
import {useTheme} from '../context/ThemeContext';
import {useNotification} from '../context/NotificationContext';
import {Theme} from '../constants/theme';
import {
  DEFAULT_PREFERENCES,
  SESSION_PRESETS,
  PresetKey,
} from '../constants/defaults';

export const Settings: React.FC = () => {
  const navigation = useNavigation();
  const {theme, themeType, setThemeType} = useTheme();
  const {showNotification} = useNotification();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);

  const loadPreferences = async () => {
    try {
      const data = await StorageService.getPreferences();
      setPrefs({
        ...data,
        breathingSpeed: data.breathingSpeed ?? 2.0,
      });
      // Check if current prefs match any preset
      detectActivePreset(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectActivePreset = (currentPrefs: UserPreferences) => {
    for (const [key, preset] of Object.entries(SESSION_PRESETS)) {
      const settings = preset.settings;
      if (
        currentPrefs.breathsPerRound === settings.breathsPerRound &&
        currentPrefs.numberOfRounds === settings.numberOfRounds &&
        currentPrefs.recoveryDuration === settings.recoveryDuration &&
        currentPrefs.breathingSpeed === settings.breathingSpeed
      ) {
        setActivePreset(key as PresetKey);
        return;
      }
    }
    setActivePreset(null);
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const updatePreference = async (
    key: keyof UserPreferences,
    value: number,
  ) => {
    const newPrefs = {...prefs, [key]: value};
    setPrefs(newPrefs);
    setActivePreset(null); // Clear preset when manually adjusting
    try {
      await StorageService.savePreferences(newPrefs);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const applyPreset = async (presetKey: PresetKey) => {
    const preset = SESSION_PRESETS[presetKey];
    setPrefs(preset.settings);
    setActivePreset(presetKey);
    try {
      await StorageService.savePreferences(preset.settings);
      showNotification(`${preset.name} preset applied`, 'success');
    } catch (error) {
      console.error('Failed to save preset:', error);
      showNotification('Failed to apply preset', 'error');
    }
  };

  const resetToDefaults = async () => {
    setPrefs(DEFAULT_PREFERENCES);
    setActivePreset('standard');
    try {
      await StorageService.savePreferences(DEFAULT_PREFERENCES);
      showNotification('Settings reset to default', 'success');
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      showNotification('Failed to reset settings', 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.colours.text} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Text style={styles.backButtonText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.settingCard}>
          <View style={styles.themeSelector}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeType === 'system' && styles.themeOptionActive,
              ]}
              onPress={() => setThemeType('system')}>
              <Text
                style={[
                  styles.themeText,
                  themeType === 'system' && styles.themeTextActive,
                ]}>
                Auto
              </Text>
            </TouchableOpacity>
            <View style={styles.dividerVertical} />
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeType === 'light' && styles.themeOptionActive,
              ]}
              onPress={() => setThemeType('light')}>
              <Text
                style={[
                  styles.themeText,
                  themeType === 'light' && styles.themeTextActive,
                ]}>
                Light
              </Text>
            </TouchableOpacity>
            <View style={styles.dividerVertical} />
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeType === 'dark' && styles.themeOptionActive,
              ]}
              onPress={() => setThemeType('dark')}>
              <Text
                style={[
                  styles.themeText,
                  themeType === 'dark' && styles.themeTextActive,
                ]}>
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Presets Section */}
        <Text style={styles.sectionHeader}>Quick Presets</Text>
        <View style={styles.presetsContainer}>
          {(Object.keys(SESSION_PRESETS) as PresetKey[]).map(key => {
            const preset = SESSION_PRESETS[key];
            const isActive = activePreset === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.presetCard,
                  isActive && styles.presetCardActive,
                ]}
                onPress={() => applyPreset(key)}
                accessibilityRole="button"
                accessibilityState={{selected: isActive}}
                accessibilityLabel={`${preset.name} preset`}>
                <Text
                  style={[
                    styles.presetName,
                    isActive && styles.presetNameActive,
                  ]}>
                  {preset.name}
                </Text>
                <Text style={styles.presetDescription}>
                  {preset.settings.breathsPerRound} breaths {'\u00B7'}{' '}
                  {preset.settings.numberOfRounds} rounds
                </Text>
                {isActive && <View style={styles.presetActiveIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Configuration Section */}
        <Text style={styles.sectionHeader}>Fine Tuning</Text>

        {/* Breaths Per Round */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingLabel}>Breaths Per Round</Text>
            <Text style={styles.settingValue}>{prefs.breathsPerRound}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={50}
            step={1}
            value={prefs.breathsPerRound}
            onValueChange={val => updatePreference('breathsPerRound', val)}
            minimumTrackTintColor={theme.colours.text}
            maximumTrackTintColor={theme.colours.border}
            thumbTintColor={theme.colours.text}
          />
          <Text style={styles.helpText}>
            Standard protocol is 30-40 breaths.
          </Text>
        </View>

        {/* Number of Rounds */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingLabel}>Number of Rounds</Text>
            <Text style={styles.settingValue}>{prefs.numberOfRounds}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={prefs.numberOfRounds}
            onValueChange={val => updatePreference('numberOfRounds', val)}
            minimumTrackTintColor={theme.colours.text}
            maximumTrackTintColor={theme.colours.border}
            thumbTintColor={theme.colours.text}
          />
          <Text style={styles.helpText}>
            3-4 rounds recommended for a full session.
          </Text>
        </View>

        {/* Recovery Duration */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingLabel}>Recovery Hold</Text>
            <Text style={styles.settingValue}>{prefs.recoveryDuration}s</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={30}
            step={1}
            value={prefs.recoveryDuration}
            onValueChange={val => updatePreference('recoveryDuration', val)}
            minimumTrackTintColor={theme.colours.text}
            maximumTrackTintColor={theme.colours.border}
            thumbTintColor={theme.colours.text}
          />
        </View>

        {/* Breathing Speed */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingLabel}>Breathing Pace</Text>
            <Text style={styles.settingValue}>
              {prefs.breathingSpeed.toFixed(1)}s
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1.0}
            maximumValue={4.0}
            step={0.5}
            value={prefs.breathingSpeed}
            onValueChange={val => updatePreference('breathingSpeed', val)}
            minimumTrackTintColor={theme.colours.text}
            maximumTrackTintColor={theme.colours.border}
            thumbTintColor={theme.colours.text}
          />
          <Text style={styles.helpText}>Lower is faster/more intense.</Text>
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Text style={styles.resetButtonText}>Reset to Default</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colours.background,
      padding: theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      marginTop: theme.spacing.lg,
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonText: {
      color: theme.colours.text,
      fontSize: 24,
      fontWeight: '300',
    },
    title: {
      color: theme.colours.text,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    placeholder: {
      width: 44,
    },
    sectionHeader: {
      color: theme.colours.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
      marginLeft: 2,
    },
    settingCard: {
      backgroundColor: theme.colours.backgroundElevated,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
    },
    settingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    settingLabel: {
      color: theme.colours.text,
      fontSize: 14,
      fontWeight: '500',
    },
    settingValue: {
      color: theme.colours.textSecondary,
      fontSize: 14,
      fontWeight: '400',
      fontVariant: ['tabular-nums'],
    },
    slider: {
      width: '100%',
      height: 40,
      opacity: 0.9,
    },
    helpText: {
      color: theme.colours.textTertiary,
      fontSize: 12,
      marginTop: 4,
    },
    themeSelector: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeOption: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: theme.borderRadius.sm,
    },
    themeOptionActive: {
      backgroundColor: theme.colours.backgroundHover,
    },
    themeText: {
      color: theme.colours.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    themeTextActive: {
      color: theme.colours.text,
      fontWeight: '600',
    },
    dividerVertical: {
      width: 1,
      height: 16,
      backgroundColor: theme.colours.borderSubtle,
      marginHorizontal: 4,
    },
    presetsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    presetCard: {
      flex: 1,
      backgroundColor: theme.colours.backgroundElevated,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colours.borderSubtle,
      alignItems: 'center',
      position: 'relative',
    },
    presetCardActive: {
      borderColor: theme.colours.primary,
      borderWidth: 2,
    },
    presetName: {
      color: theme.colours.text,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 4,
    },
    presetNameActive: {
      color: theme.colours.primary,
    },
    presetDescription: {
      color: theme.colours.textTertiary,
      fontSize: 10,
      textAlign: 'center',
    },
    presetActiveIndicator: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colours.primary,
    },
    resetButton: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colours.border,
      borderRadius: theme.borderRadius.md,
    },
    resetButtonText: {
      color: theme.colours.danger,
      fontSize: 14,
      fontWeight: '500',
    },
  });
