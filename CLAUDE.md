# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Type-check + production build (tsc -b && vite build)
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
pnpm write        # Run oxfmt (format files)
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

| Path        | Component      |
| ----------- | -------------- |
| `/`         | `HomePage`     |
| `/trip/:id` | `TripPage`     |
| `*`         | `NotFoundPage` |

## Anonymous Auth System

No login — users are identified by `device_id` (UUID in localStorage) and per-trip `member_token`.

### DB Schema (Supabase)

```
trips
  id uuid PK
  name text
  destination text
  start_date date
  end_date date
  invite_code text UNIQUE   ← generated server-side (DB function)
  created_at timestamptz

trip_members
  id uuid PK
  trip_id uuid FK → trips.id
  device_id text             ← links member to device
  nickname text
  role text                  ← 'host' | 'member'
  member_token_hash text     ← SHA-256 of member_token (never store plain)
  recovery_code_hash text    ← SHA-256 of recovery_code
  created_at timestamptz
```

### 6-Feature Roadmap

**(1) device_id — `shared/lib/deviceId.ts`** ✅

- `getDeviceId()`: get-or-create UUID via `crypto.randomUUID()`, stored in `localStorage` as `trip-thread:device-id`
- Sent with every mutation that creates/joins a trip

**(2) Trip Create — `features/create-trip`**

- `invite_code` generated server-side (Supabase DB function, not client-side `Math.random`)
- Insert `trip_members` row with `role: 'host'`, `device_id`, `member_token_hash`, `recovery_code_hash`
- Server returns plain `member_token` + `recovery_code` (one-time); only hashes stored in DB
- Client stores `member_token` in localStorage as `trip-thread:token:{trip_id}`

**(3) Trip Join — `features/join-trip`**

- Find trip by `invite_code`
- Prompt for nickname
- Server inserts `trip_members` row with `role: 'member'`, issues `member_token` + `recovery_code`
- Client stores token in localStorage

**(4) Recovery Code Flow — `features/recover-membership`**

- Shown once on create/join with a "복사" button
- User enters recovery code → server finds member, rotates `member_token` (new hash saved), returns new token
- Client stores new token in localStorage

**(5) Recent Trips List — `entities/trip`**

- Local-first: read trip IDs from localStorage → render immediately
- Then fetch server-side: `trip_members` WHERE `device_id = ?` → join `trips` → sync/correct local list

**(6) Permission Check (middleware pattern)** ✅

- On Trip page load and any write action: read `member_token` from localStorage for current `trip_id`
- Send as `Authorization: Bearer <token>` header (or request body field)
- Supabase RLS or Edge Function verifies: `SHA-256(token) == member_token_hash` AND `trip_members.trip_id == requested trip_id`
- 구현: `entities/trip/model/useTripAccess.ts` — status: `loading | authorized | unauthorized | not-found`

---

## Trip Thread 기능 로드맵

6-Feature 이후 실제 여행 스레드 기능. Trip 페이지 진입 후의 컨텐츠.

### DB Schema 추가

```
destination_proposals
  id uuid PK
  trip_id uuid FK → trips.id
  proposed_by uuid FK → trip_members.id
  name text
  created_at timestamptz

destination_votes
  id uuid PK
  proposal_id uuid FK → destination_proposals.id
  member_id uuid FK → trip_members.id
  trip_id uuid FK → trips.id
  created_at timestamptz
  UNIQUE (trip_id, member_id)   ← 멤버당 1표

posts
  id uuid PK
  trip_id uuid FK → trips.id
  author_id uuid FK → trip_members.id
  content text
  image_url text (nullable)
  created_at timestamptz

comments
  id uuid PK
  post_id uuid FK → posts.id
  parent_id uuid FK → comments.id (nullable)
  author_id uuid FK → trip_members.id
  content text
  depth smallint   ← 0~2 (최대 3단계)
  created_at timestamptz
```

`trips.destination` → nullable로 변경. `null` = 투표 중, non-null = 확정된 목적지.

### (7) 여행지 투표 — `widgets/destination-vote` ✅

- Trip 페이지에서 `trip.destination === null`이면 투표 위젯 표시
- 모든 멤버가 여행지 제안 가능 (`features/propose-destination`)
- 1인 1표 (`features/vote-destination`)
- **자동 확정**: 투표 후 어떤 제안이 현재 투표자 기준 과반수(>50%) 달성 시 즉시 `trips.destination` 업데이트
- **호스트 수동 마감** (`features/confirm-destination`): 과반수 없을 때 호스트가 "투표 마감" → 최다 득표 제안 확정, 동률이면 먼저 제안한 것
- 여행지 확정 후 Trip 페이지는 게시판으로 전환

### (8) 게시판 — `widgets/trip-thread` ⬜

- `trip.destination !== null`이어야 게시글 작성 가능
- 게시글: 텍스트 + 사진(image_url, 후순위)
- 피드 형식으로 최신순 표시

### (9) 댓글 — `features/create-comment` ⬜

- 각 게시글에 댓글 작성 가능
- 최대 3단계 중첩 (depth 0→1→2)
- `parent_id`로 트리 구조 관리

### (10) 사진 업로드 — Supabase Storage ⬜

- 게시글에 이미지 첨부
- Supabase Storage bucket에 업로드 → `posts.image_url` 저장

### localStorage Keys

| Key                           | Value                              |
| ----------------------------- | ---------------------------------- |
| `trip-thread:device-id`       | UUID (device identifier)           |
| `trip-thread:trip-ids`        | `string[]` (local trip list cache) |
| `trip-thread:token:{trip_id}` | member_token (plain, per trip)     |
