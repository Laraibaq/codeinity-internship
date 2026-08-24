# Rishta — Unified App (Mobile + Web)

One Expo codebase for **iOS, Android, and web**. All former phases (onboarding, feed, tabs/chat, settings) live in a single `package.json`.

```
rishta-app/
├── app/                 Expo Router screens (hub, onboarding, tabs, discover, settings, chat)
├── src/components/      RN + NativeWind UI (onboarding, feed, social, settings)
├── src/data/            Shared mock data
├── src/context/         App state (social + settings)
├── shared/tokens.ts     Brand colors, fonts, screen enums
└── package.json         Single dependency tree
```

| Area | Route | Covers |
|------|-------|--------|
| Hub | `/` | Jump into any section |
| Onboarding | `/onboarding` | 15-screen signup flow |
| Main app | `/(tabs)/*` | Explore, Requests, Matches, Inbox, Profile |
| Discover | `/discover` | Feed grid + card explore |
| Own profile | `/own-profile` | Profile view + editor |
| Chat | `/chat/[id]` | Conversation |
| Settings | `/settings` | Subscription, boost, privacy, safety, … |

## Setup

Requires **Node 18+**.

```bash
cd rishta-app
npm install
```

## Run

```bash
npm start          # Expo — press `w` for web, scan QR for Expo Go
npm run web        # Web directly
npm run android    # Android
npm run ios        # iOS (macOS)
```

**Windows:** double-click `run-mobile.bat` or `run-web.bat`.

## Design tokens

Brand colors and fonts live in `shared/tokens.ts` and are mirrored in `tailwind.config.js` for NativeWind.

## Env

Copy `.env.example` → `.env` and set `EXPO_PUBLIC_API_URL` when wiring the NestJS backend.

## License

Private / internal to Creative Chaos.
