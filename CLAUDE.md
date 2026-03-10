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
├── widgets/     # Widgets layer: self-contained UI blocks
├── features/    # User interactions / business actions
├── entities/    # Business domain objects
└── shared/
    ├── api/     # Supabase client instance (shared/api/supabase.ts)
    └── lib/     # Utilities: deviceId, memberToken, crypto, uploadImage
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
- **UI Framework**: Mantine v7

## State & Data Fetching

- **Client state**: Zustand — store files go in the relevant `features/` or `entities/` slice
- **Server state**: TanStack Query v5 — `QueryClient` is instantiated in `src/app/providers/index.tsx`; `ReactQueryDevtools` is included in dev
- **Backend**: Supabase — client singleton at `src/shared/api/supabase.ts`, imported via `@/shared/api`
- **Env vars**: Copy `.env.example` → `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase Dashboard → Project Settings → API → "publishable key", formerly "anon key"). Never use the secret key in frontend code.
- **Deployment**: AWS static web hosting (Vite SPA build → `dist/`)

## Current Routes

| Path                     | Component      |
| ------------------------ | -------------- |
| `/`                      | `HomePage`     |
| `/trip/:id`              | `TripPage`     |
| `/trip/:id/post/:postId` | `PostPage`     |
| `*`                      | `NotFoundPage` |

## Anonymous Auth System

No login — users are identified by `device_id` (UUID in localStorage) and per-trip `member_token`.

### DB Schema (Supabase)

```
trips
  id uuid PK
  name text
  destination text (nullable)   ← null = 투표 중, non-null = 확정된 목적지
  start_date date
  end_date date
  invite_code text UNIQUE        ← generated server-side (DB function)
  created_at timestamptz

trip_members
  id uuid PK
  trip_id uuid FK → trips.id
  device_id text                 ← links member to device
  nickname text
  role text                      ← 'host' | 'member'
  member_token_hash text         ← SHA-256 of member_token (never store plain)
  recovery_code_hash text        ← SHA-256 of recovery_code
  created_at timestamptz

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
  UNIQUE (trip_id, member_id)    ← 멤버당 1표

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
  depth smallint                 ← 0~2 (최대 3단계)
  created_at timestamptz
```

### localStorage Keys

| Key                           | Value                              |
| ----------------------------- | ---------------------------------- |
| `trip-thread:device-id`       | UUID (device identifier)           |
| `trip-thread:trip-ids`        | `string[]` (local trip list cache) |
| `trip-thread:token:{trip_id}` | member_token (plain, per trip)     |

---

## 구현 완료 현황

### 기반 기능 (6-Feature Roadmap) — 전부 완료 ✅

**(1) device_id — `shared/lib/deviceId.ts`** ✅

- `getDeviceId()`: get-or-create UUID via `crypto.randomUUID()`, stored in `localStorage` as `trip-thread:device-id`

**(2) Trip Create — `features/create-trip`** ✅

- `invite_code` client-side 생성 (충돌 시 재시도), `trip_members` 행 삽입
- `member_token` + `recovery_code` 생성 → SHA-256 해시만 DB 저장
- 클라이언트는 plain token을 localStorage에 저장

**(3) Trip Join — `features/join-trip`** ✅

- `invite_code`로 여행 조회, 중복 참여 체크, `trip_members` 삽입
- 초대 코드 입력 → 닉네임 입력 2-step 폼

**(4) Recovery Code Flow — `features/recover-membership`** ✅

- 생성/참여 시 1회 표시 + "복사" 버튼
- 복구 코드 입력 → `member_token` 교체, 새 토큰 localStorage 저장

**(5) Recent Trips List — `entities/trip/model/useMyTrips.ts`** ✅

- Local-first: localStorage에서 trip ID 즉시 렌더링
- 서버 동기화: `trip_members WHERE device_id = ?` → `trips` JOIN

**(6) Permission Check — `entities/trip/model/useTripAccess.ts`** ✅

- `member_token` → SHA-256 해시 → DB의 `member_token_hash`와 비교
- status: `loading | authorized | unauthorized | not-found`
- Trip 페이지 및 Post 페이지 진입 시 실행

### Trip Thread 기능 — 전부 완료 ✅

**(7) 여행지 투표 — `widgets/destination-vote`** ✅

- `trip.destination === null`이면 투표 위젯 표시
- 여행지 제안 (`features/propose-destination`)
- 1인 1표 (`features/vote-destination`)
- **자동 확정**: 과반수(>50%) 달성 시 즉시 `trips.destination` 업데이트
- **호스트 수동 마감** (`features/confirm-destination`): 최다 득표 제안 확정, 동률이면 먼저 제안한 것

**(8) 게시판 — `widgets/trip-board`** ✅

- `trip.destination !== null`이면 게시판 표시
- 게시글 피드 (최신순), 작성자 닉네임 + 댓글 수 표시
- 이미지 썸네일(h-40, object-cover) 표시
- 게시글 클릭 → `/trip/:id/post/:postId` 이동

**(9) 댓글 — `features/create-comment`** ✅

- 각 게시글에 댓글 작성 가능 (`widgets/post-thread`)
- 최대 3단계 중첩 (depth 0→1→2)
- `parent_id`로 플랫 리스트 → 트리 구조 재구성 (`entities/comment/model/useComments.ts`)

**(10) 사진 업로드 — Supabase Storage** ✅

- 게시글 작성 폼에서 이미지 선택 + 미리보기
- `shared/lib/uploadImage.ts`: `trip-photos` bucket에 업로드 → public URL 반환
- 경로: `{tripId}/{uuid}.{ext}`

---

## 현재 슬라이스 전체 목록

### Entities

| 슬라이스                        | 주요 파일                                              | 설명                                    |
| ------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| `entities/trip`                 | `useTripAccess.ts`, `useMyTrips.ts`, `localStorage.ts` | 여행 접근 권한, 목록 캐시               |
| `entities/post`                 | `usePost.ts`, `usePosts.ts`                            | 게시글 조회 (작성자 JOIN, 댓글 수 집계) |
| `entities/comment`              | `useComments.ts`                                       | 댓글 트리 구조 빌드                     |
| `entities/destination-proposal` | `useDestinationProposals.ts`                           | 제안 목록 + 투표 집계                   |

### Features

| 슬라이스                       | 주요 파일                                               | 설명                      |
| ------------------------------ | ------------------------------------------------------- | ------------------------- |
| `features/create-trip`         | `useCreateTrip.ts`, `CreateTripModal.tsx`               | 여행 생성                 |
| `features/join-trip`           | `useJoinTrip.ts`, `JoinTripForm.tsx`                    | 초대 코드로 참여          |
| `features/recover-membership`  | `useRecoverMembership.ts`, `RecoverMembershipModal.tsx` | 복구 코드 재발급          |
| `features/propose-destination` | `useProposeDestination.ts`                              | 여행지 제안               |
| `features/vote-destination`    | `useVoteDestination.ts`                                 | 여행지 투표 + 자동 확정   |
| `features/confirm-destination` | `useConfirmDestination.ts`                              | 호스트 수동 확정          |
| `features/create-post`         | `useCreatePost.ts`, `CreatePostForm.tsx`                | 게시글 작성 (이미지 포함) |
| `features/create-comment`      | `useCreateComment.ts`, `CreateCommentForm.tsx`          | 댓글 작성 (중첩 지원)     |

### Widgets

| 슬라이스                   | 설명                         |
| -------------------------- | ---------------------------- |
| `widgets/header`           | 앱 헤더                      |
| `widgets/destination-vote` | 여행지 투표 전체 UI          |
| `widgets/trip-board`       | 게시글 피드 (목록 + 작성 폼) |
| `widgets/post-thread`      | 게시글 상세 + 댓글 트리      |

### Shared

| 모듈                        | 설명                                 |
| --------------------------- | ------------------------------------ |
| `shared/api/supabase.ts`    | Supabase 클라이언트 싱글톤           |
| `shared/lib/deviceId.ts`    | device_id get-or-create              |
| `shared/lib/memberToken.ts` | member_token localStorage read/write |
| `shared/lib/crypto.ts`      | SHA-256 해싱, 토큰/코드 생성         |
| `shared/lib/uploadImage.ts` | Supabase Storage 이미지 업로드       |

---

## 앞으로 해야 할 것

### (11) 게시글 / 댓글 삭제 — `features/delete-post`, `features/delete-comment` ⬜

- 본인 게시글/댓글만 삭제 가능 (author_id == 내 member.id 확인)
- 호스트는 모든 게시글/댓글 삭제 가능
- 게시글 삭제 시 연결된 댓글, 이미지(Storage)도 같이 삭제
- UI: 게시글/댓글에 "삭제" 버튼 (본인 + 호스트만 표시)

### (12) 게시글 / 댓글 수정 — `features/edit-post`, `features/edit-comment` ⬜

- 본인 게시글/댓글 내용 수정
- 인라인 편집 UI (수정 버튼 클릭 → textarea로 전환)
- 이미지도 교체 가능 (기존 Storage 파일 삭제 후 새 파일 업로드)

### (13) 실시간 업데이트 — Supabase Realtime ⬜

- `posts`, `comments` 테이블에 Supabase Realtime 구독
- 다른 멤버가 게시글/댓글 작성 시 자동 갱신 (TanStack Query invalidation)
- `widgets/trip-board`, `widgets/post-thread`에서 채널 구독 관리

### (14) 초대 코드 공유 UI ✅

- Trip 페이지 헤더 우측 "초대 공유" 버튼
- Web Share API 지원 기기(모바일): `navigator.share({ title, text })` → 시스템 공유 시트
- 미지원 기기(데스크톱): `useClipboard` (`@mantine/hooks`) → 초대 코드 복사 + 버튼 2초간 "복사됨 ✓" 표시

### (15) 여행 정보 수정 — `features/edit-trip` ⬜

- 호스트 전용: 여행 이름, 날짜 수정
- Trip 페이지 내 설정 버튼 → 모달

### (16) 멤버 목록 / 관리 ⬜

- Trip 페이지 내 멤버 목록 표시 (닉네임, 역할)
- 호스트 전용: 멤버 강퇴 기능
- `entities/trip-member` 슬라이스 추가 필요

### (17) 게시글 피드 페이지네이션 / 무한 스크롤 ⬜

- 현재: 전체 게시글 한 번에 로딩
- TanStack Query `useInfiniteQuery` 적용
- Supabase `range()` 또는 커서 기반 페이지네이션

### (18) 빈 상태 / 에러 상태 UI 개선 ⬜

- 게시글 없을 때 empty state
- 네트워크 오류 시 retry 버튼
- 이미지 로딩 실패 시 fallback

### (19) 여행 삭제 — `features/delete-trip` ⬜

- 호스트 전용
- 연결된 모든 데이터(posts, comments, members, proposals, votes, Storage 이미지) 삭제
- localStorage 정리
