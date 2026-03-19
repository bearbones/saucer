# Saucer - Bluesky Client

A Bluesky client with a React Native mobile app (Android) and a Next.js PWA with Firebase group chat.

Fork of [mozzius/graysky](https://github.com/mozzius/graysky). Package name: `com.scantics.saucer`.

## Quick Commands

```bash
pnpm dev           # Start Expo mobile app
pnpm dev:next      # Start Next.js PWA dev server
pnpm dev:both      # Start Expo + Next.js in parallel
pnpm lint          # Run ESLint across all packages
pnpm format:fix    # Run Prettier formatting
pnpm typecheck     # TypeScript type checking
```

## What We're Building

- **Mobile app** (Expo/React Native) — Android Bluesky client
- **PWA** (Next.js) — Installable web app with Bluesky feeds, search, notifications, profile, and **Firebase group chat**
- Group chat uses Firestore for real-time messaging with Bluesky post embeds

## Project Structure

```
apps/
  expo/          # React Native mobile app (Expo 54, RN 0.81, React 19)
  nextjs/        # Next.js 16 PWA (the web app we're actively developing)

packages/
  api/           # tRPC router (inherited from graysky, not actively used by PWA)
  db/            # Prisma database client (inherited, not used by PWA)

tooling/
  eslint/        # Shared ESLint configs (flat config format)
  prettier/      # Shared Prettier config
  tailwind/      # Shared Tailwind config
  typescript/    # Base TypeScript config
```

## Key Technologies

- **Mobile**: Expo 54, React Native 0.81, Expo Router, NativeWind v2
- **PWA**: Next.js 16, Tailwind CSS 4, @ducanh2912/next-pwa
- **Chat**: Firebase (Firestore + Storage) for group messaging
- **Auth**: Direct Bluesky API auth (localStorage sessions in PWA)
- **Build**: pnpm workspaces, Turbo
- **Bluesky**: @atproto/api for protocol integration

## Environment Variables

The PWA only needs these env vars (see `apps/nextjs/.env.cloudflare`):

- `SKIP_ENV_VALIDATION=1` — bypasses inherited Zod checks for unused vars
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config (6 vars)

Legacy vars from graysky (`DATABASE_URL`, `CK_API_KEY`, `CK_FORM_ID`, `GOOGLE_API_KEY`, etc.) are **not used** by the PWA. Set `SKIP_ENV_VALIDATION=1` to avoid needing them at build time.

## Build & Deploy

- **PWA**: Deployed via Vercel, auto-deploys on push to `main`
- **Mobile**: EAS Build for Android (`eas build`)
- **Domain**: ayylmao.app (Cloudflare DNS)

## Code Conventions

- Strict TypeScript with `noUncheckedIndexedAccess`
- ESLint flat config with typescript-eslint and React Compiler
- Import order: react → next → expo → third-party → @graysky → relative
- Lingui for i18n in mobile app (`pnpm extract` / `pnpm compile`)

## Git Workflow

- Single contributor for now — commit and develop directly on `main`
- Default branch for all development is `main` (no feature branches needed)
- `origin` = `bearbones/saucer` (our repo)
- `upstream` = `mozzius/graysky` (original, never PR here)
