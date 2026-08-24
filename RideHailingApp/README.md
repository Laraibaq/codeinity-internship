# RideHailingApp

Monorepo for the ride-hailing app.

## Structure

```
RideHailingApp/
├── apps/
│   ├── backend/   # NestJS API server (Prisma + PostgreSQL/PostGIS)
│   └── mobile/    # Expo + Expo Router mobile app
├── docs/          # Planning docs
├── docker-compose.yml   # Local PostgreSQL with PostGIS
└── README.md
```

`apps/backend` (NestJS + Prisma) and `apps/mobile` (Expo + Expo Router) are both scaffolded.
No screens or API routes have been built yet — this is just project setup.

## Local database

`docker-compose.yml` runs a PostGIS-enabled PostgreSQL instance for local development:

```
docker compose up -d
```

This starts Postgres on `localhost:5433` (5432 is avoided to not collide with a locally
installed Postgres). `apps/backend/.env` already points `DATABASE_URL` at it.

## Backend

```
cd apps/backend
npm install
npx prisma migrate dev   # apply schema.prisma to the local database
npm run start:dev
```

The Prisma schema (`apps/backend/prisma/schema.prisma`) implements the MVP1 entities from
`docs/Dependencies.docx` §5: Users, Drivers, Vehicles, Rides, RideOffers, Ratings.

## Mobile

```
cd apps/mobile
npm install
npm run start
```

Expo + Expo Router (TypeScript), with NativeWind for styling, Zustand for client state,
TanStack Query + Axios for server data, and `expo-secure-store` for token storage. App code
lives in `apps/mobile/src`; routes live in `apps/mobile/src/app`.

## Planning docs

See [`/docs`](./docs) for project planning material:

- [`docs/Dependencies.docx`](./docs/Dependencies.docx) — project dependencies overview
- [`docs/Features_and_MVP.docx`](./docs/Features_and_MVP.docx) — feature list and MVP scope
- [`docs/Third_Party_Dependencies.docx`](./docs/Third_Party_Dependencies.docx) — third-party services and packages

## Apps

### `apps/backend`

NestJS API server with Prisma. Scaffolded; see [Backend](#backend) above.

### `apps/mobile`

Expo + Expo Router mobile app. Scaffolded; see [Mobile](#mobile) above.
