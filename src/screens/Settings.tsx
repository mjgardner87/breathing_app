import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {theme} from '../constants/theme';

export const Settings: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colours.text,
    fontSize: 24,
  },
});
