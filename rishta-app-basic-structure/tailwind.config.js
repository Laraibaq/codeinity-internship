/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand primary (deep green)
        primary: {
          DEFAULT: "#003527",
          container: "#064e3b",
          on: "#ffffff",
          "on-container": "#80bea6",
          fixed: "#b0f0d6",
          "fixed-dim": "#95d3ba",
        },
        // Surface & background
        surface: {
          DEFAULT: "#fbf9f5",
          bright: "#fbf9f5",
          dim: "#dbdad6",
          white: "#ffffff",
          "container-lowest": "#ffffff",
          "container-low": "#f5f3ef",
          container: "#efeeea",
          "container-high": "#eae8e4",
          "container-highest": "#e4e2de",
          variant: "#e4e2de",
          tint: "#2b6954",
        },
        background: "#fbf9f5",
        "on-background": "#1b1c1a",
        "on-surface": "#1b1c1a",
        "on-surface-variant": "#404944",
        border: {
          subtle: "#E5E2DA",
        },
        outline: {
          DEFAULT: "#707974",
          variant: "#bfc9c3",
        },
        // Accents
        gold: "#B45309",
        "rich-green": "#043125",
        secondary: {
          DEFAULT: "#9b4500",
          container: "#fd8a42",
          fixed: "#ffdbca",
          "fixed-dim": "#ffb68e",
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        headline: ["Playfair Display", "serif"],
        title: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
