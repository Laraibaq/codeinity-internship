/**
 * Design tokens shared with tailwind.config.js.
 * Use for programmatic access (Animated colors, ColorValue, etc.).
 */
export const colors = {
  primary: "#003527",
  primaryContainer: "#064e3b",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#80bea6",
  primaryFixed: "#b0f0d6",
  primaryFixedDim: "#95d3ba",

  surface: "#fbf9f5",
  surfaceBright: "#fbf9f5",
  surfaceDim: "#dbdad6",
  surfaceWhite: "#ffffff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f5f3ef",
  surfaceContainer: "#efeeea",
  surfaceContainerHigh: "#eae8e4",
  surfaceContainerHighest: "#e4e2de",
  surfaceVariant: "#e4e2de",
  surfaceTint: "#2b6954",

  background: "#fbf9f5",
  onBackground: "#1b1c1a",
  onSurface: "#1b1c1a",
  onSurfaceVariant: "#404944",

  borderSubtle: "#E5E2DA",
  outline: "#707974",
  outlineVariant: "#bfc9c3",

  gold: "#B45309",
  richGreen: "#043125",

  secondary: "#9b4500",
  secondaryContainer: "#fd8a42",
  secondaryFixed: "#ffdbca",
  secondaryFixedDim: "#ffb68e",

  error: "#ba1a1a",
  errorContainer: "#ffdad6",
} as const;

export const fonts = {
  display: "PlayfairDisplay_700Bold",
  displayItalic: "PlayfairDisplay_400Regular_Italic",
  headline: "PlayfairDisplay_700Bold",
  title: "PlayfairDisplay_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
} as const;
