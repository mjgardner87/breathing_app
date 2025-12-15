import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Dashboard} from '../screens/Dashboard';
import {Settings} from '../screens/Settings';
import {Session} from '../screens/Session';

export type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  Session: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Session" component={Session} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
