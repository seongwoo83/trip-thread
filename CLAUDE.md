# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Type-check + production build (tsc -b && vite build)
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
pnpm write        # Run Prettier (format files)
```

> Package manager is **pnpm**. Do not use npm or yarn.

## Architecture

This project follows **Feature-Sliced Design (FSD)** — a layered architecture where upper layers can only import from lower layers.

```
src/
├── app/         # App layer: entry point, providers, router, global styles
├── pages/       # Pages layer: route-level components
├── widgets/     # Widgets layer: self-contained UI blocks (e.g. Header, TripBoard)
├── features/    # (to be added) User interactions / business actions
├── entities/    # (to be added) Business domain objects
└── shared/
    └── api/     # Supabase client instance (shared/api/supabase.ts)
```

**Layer rules:**
- `app` → can import from all layers
- `pages` → can import from `widgets`, `features`, `entities`, `shared`
- `widgets` → can import from `features`, `entities`, `shared`
- `features` → can import from `entities`, `shared`
- `entities` → can import from `shared` only
- Each slice exposes a **public API** via its `index.ts` — always import from the slice root, not from internal paths

**Public API pattern (each slice):**
```
widgets/header/
├── index.ts          ← public API (re-exports)
└── ui/Header.tsx     ← internal implementation
```

## Key Details

- **Path alias**: `@` → `src/` (configured in `vite.config.ts` and TypeScript)
- **React Compiler**: `babel-plugin-react-compiler` is enabled — do not add manual `useMemo`/`useCallback` optimizations
- **React version**: React 19 with `StrictMode`
- **Router**: React Router DOM v7 — routes defined in `src/app/router/index.tsx`
- **Global styles**: `src/app/styles/reset.css` + `src/app/styles/global.css` (loaded in `main.tsx`)
- **ESLint**: TypeScript + react-hooks rules enforced; `react-hooks/rules-of-hooks` is error, `exhaustive-deps` is warn

## State & Data Fetching

- **Client state**: Zustand — store files go in the relevant `features/` or `entities/` slice
- **Server state**: TanStack Query v5 — `QueryClient` is instantiated in `src/app/providers/index.tsx`; `ReactQueryDevtools` is included in dev
- **Backend**: Supabase — client singleton at `src/shared/api/supabase.ts`, imported via `@/shared/api`
- **Env vars**: Copy `.env.example` → `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase Dashboard → Project Settings → API → "publishable key", formerly "anon key"). Never use the secret key in frontend code.
- **Deployment**: AWS static web hosting (Vite SPA build → `dist/`)

## Current Routes

| Path | Component |
|------|-----------|
| `/` | `HomePage` |
| `/trip` | `TripPage` |
| `*` | `NotFoundPage` |
