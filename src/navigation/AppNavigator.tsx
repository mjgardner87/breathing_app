import React from 'react';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Dashboard} from '../screens/Dashboard';
import {Settings} from '../screens/Settings';
import {Session} from '../screens/Session';
import {History} from '../screens/History';
import {useTheme} from '../context/ThemeContext';
import {StatusBar} from 'react-native';

export type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  Session: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const {theme, isDark} = useTheme();

  // Extend the default React Navigation themes to ensure we have all required properties (like fonts)
  const BaseTheme = isDark ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...BaseTheme,
    colors: {
      ...BaseTheme.colors,
      primary: theme.colours.primary,
      background: theme.colours.background,
      card: theme.colours.backgroundElevated,
      text: theme.colours.text,
      border: theme.colours.border,
      notification: theme.colours.accent,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colours.background}
      />
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: theme.colours.background},
        }}>
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Session" component={Session} />
        <Stack.Screen name="History" component={History} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
