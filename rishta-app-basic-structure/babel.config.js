module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Must be last. Required by NativeWind / Reanimated on Expo 51.
    plugins: ["react-native-reanimated/plugin"],
  };
};
