export const theme = {
  colors: {
    bg: '#0A0D14',
    bgSecondary: '#0F141F',
    surface: '#141A28',
    surfaceHover: '#1B2337',
    surfaceCard: '#131826',
    border: '#212B40',
    borderLight: '#2C3A56',
    borderHighlight: '#38455C',
    borderActive: '#3B82F6',
    
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    accentGreen: '#10B981',
    accentGreenBg: 'rgba(16, 185, 129, 0.12)',
    accentGreenBorder: 'rgba(16, 185, 129, 0.3)',
    accentGreenGlow: '0 0 15px rgba(16, 185, 129, 0.4)',

    accentRed: '#EF4444',
    accentRedBg: 'rgba(239, 68, 68, 0.12)',
    
    accentYellow: '#F59E0B',
    accentYellowBg: 'rgba(245, 158, 11, 0.12)',

    accentBlue: '#3B82F6',
    accentBlueBg: 'rgba(59, 130, 246, 0.12)',
    accentBlueGlow: '0 0 15px rgba(59, 130, 246, 0.35)',

    accentPurple: '#A855F7',
    accentPurpleBg: 'rgba(168, 85, 247, 0.12)',
  },
  fonts: {
    main: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  shadows: {
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
    glow: '0 0 25px rgba(59, 130, 246, 0.15)',
  },
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },
};

export type Theme = typeof theme;
