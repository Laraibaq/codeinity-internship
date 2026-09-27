// Wraps app.json so secrets stay out of source control. Set GOOGLE_MAPS_API_KEY in apps/mobile/.env
// (local) or as an EAS secret / CI env var (builds).
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        ...config.android?.config?.googleMaps,
        apiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
      },
    },
  },
});
