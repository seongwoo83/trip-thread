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
├── app/         # App layer: entry point, providers, router, global styles, i18n
├── pages/       # Pages layer: route-level components
├── widgets/     # Widgets layer: self-contained UI blocks
├── features/    # User interactions / business actions
├── entities/    # Business domain objects
└── shared/
    ├── api/     # Supabase client instance (shared/api/supabase.ts)
    ├── lib/     # Utilities: deviceId, memberToken, crypto, uploadImage
    └── store/   # Zustand stores (memberSession)
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
- **i18n**: `src/app/i18n/` — Korean (`ko.json`) + English (`en.json`) 지원

## State & Data Fetching

- **Client state**: Zustand — store files go in the relevant `features/` or `entities/` slice
- **Server state**: TanStack Query v5 — `QueryClient` is instantiated in `src/app/providers/index.tsx`; `ReactQueryDevtools` is included in dev
- **Backend**: Supabase — client singleton at `src/shared/api/supabase.ts`, imported via `@/shared/api`
- **Realtime**: Supabase Realtime — `posts`/`comments` 테이블 구독, TanStack Query invalidation으로 UI 자동 갱신
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

### 기반 기능

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

### Trip Thread 기능

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
- 무한 스크롤 (`entities/post/model/useInfinitePosts.ts`, TanStack Query `useInfiniteQuery`)

**(9) 댓글 — `features/create-comment`** ✅

- 각 게시글에 댓글 작성 가능 (`widgets/post-thread`)
- 최대 3단계 중첩 (depth 0→1→2)
- `parent_id`로 플랫 리스트 → 트리 구조 재구성 (`entities/comment/model/useComments.ts`)

**(10) 사진 업로드 — Supabase Storage** ✅

- 게시글 작성 폼에서 이미지 선택 + 미리보기
- `shared/lib/uploadImage.ts`: `trip-photos` bucket에 업로드 → public URL 반환
- 경로: `{tripId}/{uuid}.{ext}`

**(11) 게시글 / 댓글 삭제 — `features/delete-post`, `features/delete-comment`** ✅

- 본인 게시글/댓글만 삭제 가능, 호스트는 모든 게시글/댓글 삭제 가능
- 게시글 삭제 시 Storage 이미지 먼저 삭제 → posts 행 삭제 (댓글은 DB의 `ON DELETE CASCADE`로 자동 삭제)
- 댓글 삭제 시 `["comments", postId]` + `["posts", tripId]` 양쪽 invalidate (피드 댓글 수 동기화)
- UI: 게시글 피드 카드 + 스레드 상세 양쪽에 "삭제" 버튼 표시

**(12) 게시글 / 댓글 수정 — `features/edit-post`, `features/edit-comment`** ✅

- 본인 게시글/댓글만 수정 가능
- 게시글: 인라인 `EditPostForm` (텍스트 + 이미지 교체/삭제), 기존 Storage 파일 삭제 후 새 파일 업로드
- 댓글: 인라인 Textarea → 저장/취소 버튼 전환
- Storage 오류 시 에러 throw로 뮤테이션 실패 처리

**(13) 실시간 업데이트 — Supabase Realtime** ✅

- `entities/post/model/useRealtimePosts.ts`: `posts` 테이블 INSERT/DELETE 구독 → `["posts", tripId]` invalidate
- `entities/comment/model/useRealtimeComments.ts`: `comments` 테이블 INSERT/DELETE 구독 → `["comments", postId]` invalidate
- `widgets/trip-board`, `widgets/post-thread`에서 각각 채널 구독 관리

**(14) 초대 코드 공유 UI** ✅

- Trip 페이지 헤더 우측 "초대 공유" 버튼
- Web Share API 지원 기기(모바일): `navigator.share({ title, text })` → 시스템 공유 시트
- 미지원 기기(데스크톱): `useClipboard` (`@mantine/hooks`) → 초대 코드 복사 + 버튼 2초간 "복사됨 ✓" 표시

**(15) 멤버 목록 — `widgets/trip-members`** ✅

- 데스크톱: Trip 페이지 우측 사이드바에 항상 표시
- 모바일: "멤버 보기" 버튼 → Modal로 표시
- 각 멤버: 이니셜 아바타 + 닉네임 + 호스트 뱃지 + "(나)" 표시
- 구현: `entities/trip-member/model/useTripMembers.ts`, `widgets/trip-members/ui/TripMemberList.tsx`

**(16) 여행 삭제 — `features/delete-trip`** ✅

- 호스트 전용
- 연결된 모든 데이터(posts, comments, members, proposals, votes, Storage 이미지) 삭제
- localStorage 정리

**(17) 다크 모드** ✅

- Mantine color scheme 토글 (`light` / `dark`)
- 설정은 localStorage에 유지

**(18) 다국어 지원 (i18n)** ✅

- `src/app/i18n/locales/ko.json` (한국어), `en.json` (영어)
- 언어 전환 UI 포함

**(공통) 멤버 세션 스토어 — `shared/store/memberSession.ts`** ✅

- 인증된 멤버의 `id`와 `role`을 Zustand로 전역 관리
- `useTripAccess`에서 인증 성공 시 자동 set, 언마운트 시 clear
- 위젯/피처에서 prop drilling 없이 `useMemberSession()` 직접 소비

---

## 현재 슬라이스 전체 목록

### Entities

| 슬라이스                        | 주요 파일                                                                 | 설명                                    |
| ------------------------------- | ------------------------------------------------------------------------- | --------------------------------------- |
| `entities/trip`                 | `useTripAccess.ts`, `useMyTrips.ts`, `localStorage.ts`                    | 여행 접근 권한, 목록 캐시               |
| `entities/trip-member`          | `useTripMembers.ts`                                                       | 멤버 목록 조회                          |
| `entities/post`                 | `usePost.ts`, `usePosts.ts`, `useInfinitePosts.ts`, `useRealtimePosts.ts` | 게시글 조회 (무한 스크롤 + 실시간 구독) |
| `entities/comment`              | `useComments.ts`, `useRealtimeComments.ts`                                | 댓글 트리 구조 빌드 + 실시간 구독       |
| `entities/destination-proposal` | `useDestinationProposals.ts`                                              | 제안 목록 + 투표 집계                   |

### Features

| 슬라이스                       | 주요 파일                                               | 설명                              |
| ------------------------------ | ------------------------------------------------------- | --------------------------------- |
| `features/create-trip`         | `useCreateTrip.ts`, `CreateTripModal.tsx`               | 여행 생성                         |
| `features/join-trip`           | `useJoinTrip.ts`, `JoinTripForm.tsx`                    | 초대 코드로 참여                  |
| `features/recover-membership`  | `useRecoverMembership.ts`, `RecoverMembershipModal.tsx` | 복구 코드 재발급                  |
| `features/propose-destination` | `useProposeDestination.ts`                              | 여행지 제안                       |
| `features/vote-destination`    | `useVoteDestination.ts`                                 | 여행지 투표 + 자동 확정           |
| `features/confirm-destination` | `useConfirmDestination.ts`                              | 호스트 수동 확정                  |
| `features/create-post`         | `useCreatePost.ts`, `CreatePostForm.tsx`                | 게시글 작성 (이미지 포함)         |
| `features/create-comment`      | `useCreateComment.ts`, `CreateCommentForm.tsx`          | 댓글 작성 (중첩 지원)             |
| `features/delete-post`         | `useDeletePost.ts`                                      | 게시글 삭제 (Storage 이미지 포함) |
| `features/delete-comment`      | `useDeleteComment.ts`                                   | 댓글 삭제                         |
| `features/edit-post`           | `useEditPost.ts`, `EditPostForm.tsx`                    | 게시글 수정 (이미지 교체/삭제)    |
| `features/edit-comment`        | `useEditComment.ts`                                     | 댓글 수정                         |
| `features/delete-trip`         | `useDeleteTrip.ts`                                      | 여행 삭제 (호스트 전용)           |

### Widgets

| 슬라이스                   | 설명                                        |
| -------------------------- | ------------------------------------------- |
| `widgets/header`           | 앱 헤더 (다크모드 토글, 언어 전환)          |
| `widgets/destination-vote` | 여행지 투표 전체 UI                         |
| `widgets/trip-board`       | 게시글 피드 (무한 스크롤 + 작성 폼)         |
| `widgets/post-thread`      | 게시글 상세 + 댓글 트리                     |
| `widgets/trip-members`     | 멤버 목록 (데스크톱 사이드바 + 모바일 모달) |

### Shared

| 모듈                            | 설명                                    |
| ------------------------------- | --------------------------------------- |
| `shared/api/supabase.ts`        | Supabase 클라이언트 싱글톤              |
| `shared/lib/deviceId.ts`        | device_id get-or-create                 |
| `shared/lib/memberToken.ts`     | member_token localStorage read/write    |
| `shared/lib/crypto.ts`          | SHA-256 해싱, 토큰/코드 생성            |
| `shared/lib/uploadImage.ts`     | Supabase Storage 이미지 업로드          |
| `shared/store/memberSession.ts` | 인증된 멤버 id/role 전역 Zustand 스토어 |

---

## 앞으로 해야 할 것

### (A) 여행 정보 수정 — `features/edit-trip` ⬜

- 호스트 전용: 여행 이름, 날짜 수정
- Trip 페이지 내 설정 버튼 → 모달

### (B) 멤버 강퇴 — `features/kick-member` ⬜

- 호스트 전용
- `widgets/trip-members` 내 강퇴 버튼 표시
- 강퇴된 멤버는 해당 여행 재접근 불가 (토큰 무효화)

### (C) 빈 상태 / 에러 상태 UI 개선 ⬜

- 게시글 없을 때 empty state (일러스트 + 안내 문구)
- 네트워크 오류 시 retry 버튼
- 이미지 로딩 실패 시 fallback

### (D) 게시글 다중 이미지 ⬜

- 현재: 게시글 당 이미지 1장
- 여러 장 업로드 → Carousel 또는 Grid 표시
- DB: `image_url text[]` 또는 별도 `post_images` 테이블

### (E) 게시글 반응(이모지) — `features/react-post` ⬜

- 게시글에 이모지 리액션 추가 (좋아요, 웃음 등)
- DB: `post_reactions (post_id, member_id, emoji)` UNIQUE (post_id, member_id, emoji)

### (F) 여행 체크리스트 ⬜

- 공유 짐 목록 / 준비물 체크리스트
- 체크 항목 추가/삭제/완료 토글
- DB: `checklist_items (trip_id, content, is_done, created_by)`

### (G) 여행 일정표 (타임라인) ⬜

- 날짜별 일정 등록 및 조회
- Trip 페이지 내 탭 또는 섹션으로 분리
- DB: `schedules (trip_id, date, title, description, order)`

### (H) 알림 — Push Notification ⬜

- 새 게시글/댓글 작성 시 Web Push 알림
- Service Worker + Notification API + Supabase Realtime 연동
- 알림 수신 동의 UI 필요
