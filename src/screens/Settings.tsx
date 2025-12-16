import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import {StorageService} from '../services/StorageService';
import {UserPreferences} from '../types';
import {theme} from '../constants/theme';

export const Settings: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<UserPreferences>({
    breathsPerRound: 30,
    numberOfRounds: 3,
    recoveryDuration: 15,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await StorageService.getPreferences();
      setPrefs(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <ActivityIndicator size="large" color={theme.colours.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Breaths Per Round */}
      <View style={styles.settingSection}>
        <Text style={styles.settingValue}>{prefs.breathsPerRound} breaths</Text>
        <Text style={styles.settingLabel}>Breaths Per Round</Text>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={50}
          step={1}
          value={prefs.breathsPerRound}
          onValueChange={val => updatePreference('breathsPerRound', val)}
          minimumTrackTintColor={theme.colours.accent}
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor={theme.colours.accent}
        />
        <Text style={styles.helpText}>Standard Wim Hof protocol uses 30-40 breaths</Text>
      </View>

      {/* Number of Rounds */}
      <View style={styles.settingSection}>
        <Text style={styles.settingValue}>{prefs.numberOfRounds} rounds</Text>
        <Text style={styles.settingLabel}>Number of Rounds</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={prefs.numberOfRounds}
          onValueChange={val => updatePreference('numberOfRounds', val)}
          minimumTrackTintColor={theme.colours.accent}
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor={theme.colours.accent}
        />
        <Text style={styles.helpText}>Most practitioners do 3-4 rounds per session</Text>
      </View>

      {/* Recovery Duration */}
      <View style={styles.settingSection}>
        <Text style={styles.settingValue}>{prefs.recoveryDuration} seconds</Text>
        <Text style={styles.settingLabel}>Recovery Breath Hold</Text>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={30}
          step={1}
          value={prefs.recoveryDuration}
          onValueChange={val => updatePreference('recoveryDuration', val)}
          minimumTrackTintColor={theme.colours.accent}
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor={theme.colours.accent}
        />
        <Text style={styles.helpText}>Hold your recovery breath for this duration</Text>
      </View>

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
        <Text style={styles.resetButtonText}>Reset to Default</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    marginTop: theme.spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colours.textSecondary,
    fontSize: 36,
    opacity: 0.5,
    fontWeight: '200',
  },
  title: {
    color: theme.colours.text,
    ...theme.typography.display,
  },
  placeholder: {
    width: 40,
  },
  settingSection: {
    backgroundColor: theme.colours.backgroundElevated,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
  },
  settingValue: {
    color: theme.colours.text,
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: theme.spacing.xs,
  },
  settingLabel: {
    color: theme.colours.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  helpText: {
    color: theme.colours.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colours.borderSubtle,
  },
  resetButtonText: {
    color: theme.colours.textSecondary,
    ...theme.typography.bodyMedium,
  },
});
