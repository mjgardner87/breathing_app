/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@thehale/react-native-keep-awake', () => ({
  activate: jest.fn(),
  deactivate: jest.fn(),
}));

jest.mock('react-native-sound-player', () => ({
  playSoundFile: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-session-id'),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const AnimatedView = ({children}: {children: React.ReactNode}) =>
    React.createElement(React.Fragment, null, children);
  return {
    default: {
      View: AnimatedView,
      call: () => {},
    },
    useSharedValue: (value: number) => ({value}),
    useAnimatedStyle: () => ({}),
    withTiming: (value: unknown) => value,
    withRepeat: (value: unknown) => value,
    Easing: {
      inOut: () => () => undefined,
      ease: () => undefined,
    },
  };
});

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}: {children: React.ReactNode}) => <>{children}</>,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
    const cleanup = callback?.();
    if (typeof cleanup === 'function') {
      cleanup();
    }
  }),
  DefaultTheme: {},
  DarkTheme: {},
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({children}: {children: React.ReactNode}) => <>{children}</>,
    Screen: ({children}: {children: React.ReactNode}) => <>{children}</>,
  }),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
