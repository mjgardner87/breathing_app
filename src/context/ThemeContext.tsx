import React, {createContext, useContext, useState, useEffect} from 'react';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme as defaultTheme, lightTheme, darkTheme, Theme} from '../constants/theme';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  themeType: 'system',
  setThemeType: () => {},
  isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const systemScheme = useColorScheme();
  const [themeType, setThemeType] = useState<ThemeType>('system');
  const [activeTheme, setActiveTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    const isDark =
      themeType === 'dark' || (themeType === 'system' && systemScheme === 'dark');
    setActiveTheme(isDark ? darkTheme : lightTheme);
  }, [themeType, systemScheme]);

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('@breathingapp:theme_preference');
      if (storedTheme) {
        setThemeType(storedTheme as ThemeType);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const updateThemeType = async (type: ThemeType) => {
    setThemeType(type);
    try {
      await AsyncStorage.setItem('@breathingapp:theme_preference', type);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        themeType,
        setThemeType: updateThemeType,
        isDark: activeTheme.isDark,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};













