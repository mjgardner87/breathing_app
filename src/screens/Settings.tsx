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
import {Theme} from '../constants/theme';

export const Settings: React.FC = () => {
  const navigation = useNavigation();
  const {theme, themeType, setThemeType} = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<UserPreferences>({
    breathsPerRound: 30,
    numberOfRounds: 3,
    recoveryDuration: 15,
    breathingSpeed: 2.0,
  });

  const loadPreferences = async () => {
    try {
      const data = await StorageService.getPreferences();
      setPrefs({
        ...data,
        breathingSpeed: data.breathingSpeed ?? 2.0,
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const updatePreference = async (key: keyof UserPreferences, value: number) => {
    const newPrefs = {...prefs, [key]: value};
    setPrefs(newPrefs);
    try {
      await StorageService.savePreferences(newPrefs);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const resetToDefaults = async () => {
    const defaults: UserPreferences = {
      breathsPerRound: 30,
      numberOfRounds: 3,
      recoveryDuration: 15,
      breathingSpeed: 2.0,
    };
    setPrefs(defaults);
    try {
      await StorageService.savePreferences(defaults);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
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
              style={[styles.themeOption, themeType === 'system' && styles.themeOptionActive]}
              onPress={() => setThemeType('system')}>
              <Text style={[styles.themeText, themeType === 'system' && styles.themeTextActive]}>Auto</Text>
            </TouchableOpacity>
            <View style={styles.dividerVertical} />
            <TouchableOpacity
              style={[styles.themeOption, themeType === 'light' && styles.themeOptionActive]}
              onPress={() => setThemeType('light')}>
              <Text style={[styles.themeText, themeType === 'light' && styles.themeTextActive]}>Light</Text>
            </TouchableOpacity>
            <View style={styles.dividerVertical} />
            <TouchableOpacity
              style={[styles.themeOption, themeType === 'dark' && styles.themeOptionActive]}
              onPress={() => setThemeType('dark')}>
              <Text style={[styles.themeText, themeType === 'dark' && styles.themeTextActive]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Breathing Section */}
        <Text style={styles.sectionHeader}>Configuration</Text>

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
          <Text style={styles.helpText}>Standard protocol is 30-40 breaths.</Text>
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
          <Text style={styles.helpText}>3-4 rounds recommended for a full session.</Text>
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
            <Text style={styles.settingValue}>{prefs.breathingSpeed.toFixed(1)}s</Text>
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

const createStyles = (theme: Theme) => StyleSheet.create({
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
    width: 36,
    height: 36,
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
    width: 36,
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
