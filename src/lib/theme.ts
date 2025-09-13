/**
 * Centralized Theme Configuration
 * Blue and White Theme for Loan Management System
 */

export const theme = {
  colors: {
    // Primary Blue Palette
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main primary
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Secondary Blue-Gray Palette
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Success Green
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Warning Orange
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Error Red
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  
  gradients: {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    primaryLight: 'bg-gradient-to-r from-primary-50 to-primary-100',
    primarySubtle: 'bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent',
    card: 'bg-gradient-to-br from-white to-primary-50/30',
    sidebar: 'bg-gradient-to-b from-primary-50 to-white',
    header: 'bg-gradient-to-r from-white via-primary-50/20 to-white',
  },
  
  shadows: {
    card: 'shadow-sm hover:shadow-lg',
    button: 'shadow-md hover:shadow-lg',
    sidebar: 'shadow-lg',
    header: 'shadow-sm',
  },
  
  animations: {
    hover: 'transition-all duration-200 hover:scale-[1.02]',
    button: 'transition-all duration-200 transform hover:scale-105',
    fade: 'transition-opacity duration-300',
    slide: 'transition-transform duration-300 ease-in-out',
  },
  
  spacing: {
    section: 'space-y-8',
    card: 'p-6',
    cardLarge: 'p-8',
    button: 'px-4 py-2',
    buttonLarge: 'px-6 py-3',
  },
  
  typography: {
    heading1: 'text-3xl font-bold text-foreground',
    heading2: 'text-2xl font-semibold text-foreground',
    heading3: 'text-xl font-semibold text-foreground',
    body: 'text-base text-foreground',
    bodyMuted: 'text-muted-foreground',
    caption: 'text-sm text-muted-foreground',
    label: 'text-sm font-medium text-foreground',
  },
  
  borders: {
    default: 'border border-border',
    primary: 'border border-primary/20',
    card: 'border border-primary/10',
    input: 'border border-input',
  },
  
  backgrounds: {
    page: 'bg-background',
    card: 'bg-card',
    sidebar: 'bg-sidebar',
    header: 'bg-card/80 backdrop-blur-sm',
    input: 'bg-input',
    muted: 'bg-muted',
  },
} as const;

// Helper functions for theme usage
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'success':
      return 'text-green-700 bg-green-100';
    case 'rejected':
    case 'error':
    case 'failed':
      return 'text-red-700 bg-red-100';
    case 'pending':
    case 'under_review':
    case 'processing':
      return 'text-blue-700 bg-blue-100';
    case 'warning':
      return 'text-orange-700 bg-orange-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
};

export const getRoleBadgeColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'text-red-700 bg-red-100';
    case 'dsa':
      return 'text-blue-700 bg-blue-100';
    case 'user':
      return 'text-green-700 bg-green-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 'text-red-700 bg-red-100';
    case 'medium':
      return 'text-orange-700 bg-orange-100';
    case 'low':
      return 'text-green-700 bg-green-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
};

// CSS class combinations for common UI patterns
export const uiPatterns = {
  card: `${theme.backgrounds.card} ${theme.borders.card} rounded-2xl ${theme.shadows.card} ${theme.animations.hover}`,
  button: `${theme.gradients.primary} text-primary-foreground ${theme.shadows.button} ${theme.animations.button} rounded-lg font-medium`,
  input: `${theme.backgrounds.input} ${theme.borders.input} rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary`,
  badge: 'px-3 py-1 rounded-full text-xs font-semibold',
  statCard: `${theme.backgrounds.card} ${theme.borders.primary} rounded-xl ${theme.shadows.card} ${theme.animations.hover} p-6`,
} as const;
