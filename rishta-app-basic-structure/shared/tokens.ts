/**
 * Shared design tokens — the single source of truth for Rishta's brand.
 * Used by the Expo app on iOS, Android, and web (NativeWind + TS imports).
 * When you tweak a color or a font, change it here.
 */

export const colors = {
  primary: '#003527',           // dark brand green (buttons, primary text)
  primaryContainer: '#064e3b',  // slightly lighter green (containers, chips)
  primaryFixed: '#b0f0d6',
  onPrimary: '#ffffff',

  verificationGold: '#B45309',
  goldAccent: '#B45309',

  background: '#fbf9f5',        // warm off-white app background
  surface: '#ffffff',
  surfaceContainerLow: '#f5f3ef',
  surfaceContainer: '#efeeea',
  surfaceContainerHigh: '#eae8e4',

  onSurface: '#1b1c1a',
  onSurfaceVariant: '#404944',
  outline: '#707974',
  outlineVariant: '#bfc9c3',
  borderSubtle: '#E5E2DA',

  textRichGreen: '#043125',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
} as const;

export const fonts = {
  display: 'Playfair Display', // headlines, brand marks
  body: 'Inter',               // everything else
} as const;

/* -------------------------------------------------------------------------- */
/*  Cross-phase screen / nav enums                                            */
/* -------------------------------------------------------------------------- */

/** Bottom-nav tabs shared across all phases. */
export type BottomNavTab = 'explore' | 'requests' | 'matches' | 'inbox' | 'profile';

/** Phase 2 (feed / own profile) screens. */
export type Phase2Screen = 'discover' | 'explore' | 'own_profile' | 'edit_personal';

/** Phase 3 (tabs shell) screens. */
export type Phase3Screen = BottomNavTab | 'chat';

/** Phase 4 (settings / account) screens. */
export type Phase4Screen =
  | 'settings'
  | 'ownership'
  | 'subscription'
  | 'safety'
  | 'boost'
  | 'privacy'
  | 'notifications'
  | 'discovery'
  | 'notification-preferences';

export const BRAND_NAME = 'Rishta';
