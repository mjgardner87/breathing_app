export const palette = {
  // Shared Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Dark Theme Colors (Linear/Rayscape inspired)
  dark: {
    background: '#0B0C0E',        // Deep matte black/gray
    backgroundElevated: '#16181C', // Subtle elevation
    backgroundHover: '#1E2024',    // Hover state
    border: '#2E3035',             // Subtle border
    borderSubtle: '#1E2024',       // Very subtle border
    text: '#F2F2F3',               // High contrast white
    textSecondary: '#8A8F98',      // Muted gray
    textTertiary: '#5F6369',       // Deep gray
    primary: '#F2F2F3',            // White primary (Monochrome/Linear style)
    primaryHover: '#FFFFFF',       // Brighter white
    accent: '#5E6AD2',             // Rayscape blurple/indigo for subtle accents
    success: '#4CC38A',            // Muted green
    warning: '#E8B05E',            // Muted orange
    danger: '#E25555',             // Muted red
    breathingCircleStart: '#2E3035', // Dark gray start
    breathingCircleEnd: '#F2F2F3',   // White end (high contrast pulse)
  },

  // Light Theme Colors (Notion inspired)
  light: {
    background: '#FFFFFF',         // Pure white
    backgroundElevated: '#F7F7F5', // Notion-like subtle gray
    backgroundHover: '#F0F0EF',    // Hover
    border: '#E0E0E0',             // Crisp light border
    borderSubtle: '#F0F0F0',       // Subtle border
    text: '#37352F',               // Notion dark gray
    textSecondary: '#787774',      // Notion medium gray
    textTertiary: '#9B9A97',       // Notion light gray
    primary: '#37352F',            // Dark gray primary
    primaryHover: '#111111',       // Black
    accent: '#2EAADC',             // Notion blue
    success: '#448361',            // Notion green
    warning: '#D9730D',            // Notion orange
    danger: '#D44C47',             // Notion red
    breathingCircleStart: '#E0E0E0', // Light gray start
    breathingCircleEnd: '#37352F',   // Dark gray end
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

const borderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12, // Slightly tighter radii for that sleek feel
};

const typography = {
  display: {
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  timer: {
    fontSize: 72,
    fontWeight: '300' as const,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'] as any[],
  },
};

// Minimalist shadows
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const darkTheme = {
  colours: palette.dark,
  spacing,
  borderRadius,
  typography,
  shadows,
  isDark: true,
};

export const lightTheme = {
  colours: palette.light,
  spacing,
  borderRadius,
  typography,
  shadows,
  isDark: false,
};

export const theme = darkTheme;
export type Theme = typeof darkTheme;
