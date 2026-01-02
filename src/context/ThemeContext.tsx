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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    // Don't update theme until loaded to prevent flash
    if (isLoading) {
      return;
    }
    const isDark =
      themeType === 'dark' || (themeType === 'system' && systemScheme === 'dark');
    setActiveTheme(isDark ? darkTheme : lightTheme);
  }, [themeType, systemScheme, isLoading]);

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('@breathingapp:theme_preference');
      const resolvedType = (storedTheme as ThemeType) || 'system';
      setThemeType(resolvedType);

      // Apply theme immediately based on loaded preference
      const isDark =
        resolvedType === 'dark' ||
        (resolvedType === 'system' && systemScheme === 'dark');
      setActiveTheme(isDark ? darkTheme : lightTheme);
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
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

  // Return null while loading to prevent theme flash
  if (isLoading) {
    return null;
  }

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















