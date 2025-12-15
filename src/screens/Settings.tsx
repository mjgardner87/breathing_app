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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
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
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    color: theme.colours.text,
    fontSize: 32,
  },
  title: {
    color: theme.colours.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
  },
  settingSection: {
    marginBottom: theme.spacing.xl,
  },
  settingValue: {
    color: theme.colours.text,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingLabel: {
    color: theme.colours.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  helpText: {
    color: theme.colours.text,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  resetButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  resetButtonText: {
    color: theme.colours.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
