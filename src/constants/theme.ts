export const theme = {
  colours: {
    // Ice & Breath theme - Cool, calming, crystalline
    background: '#0a0e14',        // Deep frozen night
    backgroundElevated: '#0f1419', // Frosted surface
    backgroundHover: '#141b22',    // Ice hover
    border: '#1a2632',             // Frost border
    borderSubtle: '#141b22',       // Subtle ice

    // Text - Icy whites and cool grays
    text: '#e3f2fd',               // Icy white
    textSecondary: '#90caf9',      // Cool blue-gray
    textTertiary: '#546e7a',       // Muted ice

    // Accent colors - Breath and ice
    primary: '#42a5f5',            // Crisp ice blue
    primaryHover: '#64b5f6',       // Lighter ice
    accent: '#42a5f5',

    // Status colors
    success: '#4dd0e1',            // Cyan ice
    warning: '#ffa726',            // Warm breath
    danger: '#ef5350',             // Alert

    // Breathing circle - Cold air to warm breath
    breathingCircleStart: '#29b6f6', // Cold inhale
    breathingCircleEnd: '#4dd0e1',   // Crisp exhale
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    // Linear-style typography
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
      fontSize: 18,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodyMedium: {
      fontSize: 15,
      fontWeight: '500' as const,
      lineHeight: 22,
    },
    caption: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    timer: {
      fontSize: 64,
      fontWeight: '300' as const,
      letterSpacing: -2,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};
