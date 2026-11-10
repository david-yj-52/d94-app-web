# CIRA Jira Cloud식 레이아웃·화면 재디자인 설계

- 작성일: 2026-11-09
- 대상: `app/d94-web` (Next.js 16 App Router)
- 상태: 리뷰 대기

## 1. 목표와 범위

### 1.1 목표

CIRA를 팀의 JIRA 대용으로 쓰기 위해, **현재 개발된 CIRA 기능**의 화면을 Jira Cloud의 레이아웃·정보 구조·조작 흐름에 맞춰 재디자인한다.

성공 기준:

1. JIRA에 익숙한 팀원이 백로그 정리 → 스프린트 시작 → 보드에서 이동 → 이슈 상세 수정 → 검색을 Jira Cloud와 같은 위치·순서로 할 수 있다.
2. Home(`/home`)에서 CIRA로 들어가면 기존과 분리된 CIRA 전용 레이아웃이 나오고, 로그인 상태는 그대로 유지된다.
3. 기존 Home과 실험 모듈(todo, mpms, solace, interface-test) 화면은 바뀌지 않는다.
4. 모바일 브라우저(375px)·태블릿(768px)·데스크톱(1280px)에서 모든 CIRA 화면을 쓸 수 있다.

### 1.2 범위

- 포함: CIRA 라우트 분리, CIRA 전용 셸(통합 사이드바 + 상단 바), 디자인 토큰, CIRA 전용 공통 UI 컴포넌트, 현재 CIRA 화면 전체의 재배치·재스타일, 반응형 웹.
- 기능은 지금 있는 것만 쓴다. 예외는 두 가지다.
  - 상단 바 `+ 만들기`를 프로젝트 밖에서 누르면 프로젝트를 고르는 드롭다운이 필요하다.
  - 백로그 화면에서 이미 있는 `GET /api/v1/projects/{projectId}/backlog` API를 처음으로 연결한다.
- 시각 정체성은 CIRA 자체 디자인(인디고 계열)이다. Atlassian 로고·아이콘·브랜드 자산은 쓰지 않는다.

### 1.3 범위 밖

- 새 백엔드 API나 필드: 담당자 변경 UI, 하위작업, 이슈 링크, 변경 이력, 에픽, 라벨, 최근 항목, 즐겨찾기 등.
- 마일스톤 화면 신설 (컴포넌트만 있고 페이지는 없는 현재 상태 유지).
- 다크 모드.
- 네이티브 앱(`app/d94-app-mobile`).
- 만료 토큰에 403이 와서 로그인 화면으로 가지 않는 문제(`docs/known-issues.md`). 후속 과제로 남긴다.

## 2. 라우트·레이아웃·인증 구조

### 2.1 레이아웃 계층

```
src/app/layout.tsx              <html>, <body>, Providers(SessionProvider + QueryClientProvider)만
├─ (auth)/layout.tsx            로그인·가입 (변경 없음)
├─ (main)/layout.tsx            신규: ApHeader + NotificationMount + <main className="py-6">
│    home, todo, mpms, solace, interface-test, page.tsx(/ → /home)
└─ (cira)/cira/layout.tsx       신규: <div className="cira-root"> + CiraShell + 알림 토스트
     projects/**, dashboard, search, search/advanced, notifications
```

- 현재 루트 레이아웃이 렌더링하는 `ApHeader`, `NotificationMount`, `<main className="py-6">`, `bg-gray-50`는 `(main)/layout.tsx`로 옮긴다. 기존 화면의 겉모습은 그대로다.
- `ApHeader`에 넘기는 `session.user`는 지금처럼 서버에서 `auth()`로 얻는다. `(main)`과 `(cira)` 레이아웃이 각자 `auth()`를 호출한다.
- CIRA 화면 파일은 `git mv`로 옮긴다. 화면 안의 데이터 계층(`src/hooks/*`, `src/lib/api/*`, `src/lib/mock/*`, `src/types/*`)은 경로·코드 모두 바꾸지 않는다.

| 현재 | 이동 후 |
|---|---|
| `src/app/(main)/projects/**` | `src/app/(cira)/cira/projects/**` |
| `src/app/(main)/dashboard/` | `src/app/(cira)/cira/dashboard/` |
| `src/app/(main)/search/**` | `src/app/(cira)/cira/search/**` |
| `src/app/(main)/notifications/` | `src/app/(cira)/cira/notifications/` |

`src/app/(auth)/cira/register/page.tsx`(URL `/cira/register`, `/register`로 redirect)는 그대로 둔다. `(cira)/cira/register`를 만들지 않으므로 경로 충돌은 없다.

### 2.2 로그인 정보 유지

`SessionProvider`와 NextAuth 세션 쿠키가 앱 전체에서 하나이므로 레이아웃을 나눠도 같은 세션을 공유한다. 별도 작업은 필요 없다.

### 2.3 URL 이동

- `next.config.mjs`의 `redirects()`에 영구 redirect를 추가한다.

| source | destination |
|---|---|
| `/projects` | `/cira/projects` |
| `/projects/:path*` | `/cira/projects/:path*` |
| `/dashboard` | `/cira/dashboard` |
| `/search` | `/cira/search` |
| `/search/:path*` | `/cira/search/:path*` |
| `/notifications` | `/cira/notifications` |

  쿼리 문자열은 Next.js redirect가 자동으로 넘긴다.
- 앱 내부의 하드코딩 링크(`href`, `router.push`, 약 20곳)를 `/cira/...`로 바꾼다. 대상에는 `src/components/layout/NotificationBell.tsx`의 `/search?q=`와 `/notifications`도 포함된다.
- 백엔드 `app/d94-query/.../apService/cira/WikiService.java`가 만드는 이슈 링크 `/issues/{key}`는 원래 존재하지 않는 경로다. 이것을 `/cira/search?q={key}`로 바꾼다(d94-query 한 줄 수정).

### 2.4 미들웨어 (`src/middleware.ts`)

- `PROTECTED_PREFIXES`에 `/cira`를 추가한다. 옛 CIRA 경로(`/projects`, `/dashboard`, `/search`, `/notifications`)는 redirect가 미들웨어보다 먼저 처리되므로 목록에서 지운다. `/issues`, `/board`는 해당 라우트가 없으므로 함께 정리한다.
- `/cira/register`는 보호 대상에서 **제외**한다. 비로그인 사용자도 `/register`로 redirect되어야 한다.
- 로그인 사용자의 `/login`·`/register` 접근 시 `/home`으로 보내는 기존 동작은 유지한다.

### 2.5 Home 연결

- `src/app/(main)/home/page.tsx`의 `FEATURE_GROUPS` CIRA 카드 링크를 `/cira/projects`, `/cira/dashboard`, `/cira/search`, `/cira/notifications`로 바꾼다.
- `src/components/layout/ApHeader.tsx`의 `NAV_ITEMS` 중 `{href: "/projects", label: "프로젝트"}`를 `/cira/projects`로 바꾼다.
- CIRA 쪽에서는 프로필 메뉴의 "D94 Home으로 돌아가기"(`/home`)로 돌아간다.

## 3. CIRA 셸과 디자인 토큰

### 3.1 셸 구성 (`src/components/cira/shell/`)

레이아웃 방식은 Jira Cloud 최신식 **통합 사이드바**다(상단 바는 얇게, 전역 메뉴와 프로젝트 트리는 사이드바).

**`CiraShell`**: 상단 바 + 사이드바 + 본문 영역의 배치와 반응형 전환을 맡는다.

**`CiraTopBar`** (높이 48px)
- 로고 → `/cira/projects`
- 검색창: Enter를 누르면 `/cira/search?q=`로 이동한다(현재 `GlobalSearch` 동작 그대로).
- `+ 만들기`: 기존 `CreateIssueModal`을 연다.
  - 경로에 `projectId`가 있으면 현재 프로젝트로 고정한다.
  - 없으면 `useProjects` 목록으로 만든 프로젝트 선택 드롭다운을 모달 맨 위에 보여 준다.
- 알림 벨: Radix Popover 패널. 기존 `useNotifications` 데이터를 쓰고, "전체 보기"는 `/cira/notifications`로 간다.
- 프로필 메뉴(Radix DropdownMenu): 이름, 이메일, "D94 Home으로 돌아가기", 로그아웃.

**`CiraSidebar`** (펼침 240px, 접힘 56px)
- 내 작업(→ `/cira/dashboard`), 알림(→ `/cira/notifications`)
- 프로젝트 트리(`useProjects`, Radix Collapsible). 현재 프로젝트는 펼쳐서 아래 메뉴를 보여 준다.
  - 백로그 → `/cira/projects/[id]/sprints`
  - 보드 → `/cira/projects/[id]/boards`
  - 이슈 → `/cira/projects/[id]/issues`
  - 리포트 → `/cira/projects/[id]/reports`
  - 릴리스 → `/cira/projects/[id]/versions`
  - 위키 → `/cira/projects/[id]/wiki`
  - 프로젝트 설정 → `/cira/projects/[id]/settings`
- 필터: 검색(`/cira/search`), 고급 검색(`/cira/search/advanced`)
- 설정 화면(`/settings/**`) 안에서는 프로젝트 하위 메뉴 자리에 설정 하위 메뉴(일반, 멤버, 워크플로, 자동화, Git)를 보여 준다.
- 접힘 상태는 쿠키 `cira_sidebar_collapsed`(`1`/`0`, path `/cira`, 1년)에 저장한다.
  - 프로젝트 규칙상 `localStorage`를 직접 쓸 수 없다(L1 §5 금지).
  - 쿠키를 쓰면 `(cira)/cira/layout.tsx`가 서버에서 `cookies()`로 읽어 첫 렌더부터 올바른 폭을 그리므로, 화면이 깜빡이지 않는다.
  - 쓰기는 `src/lib/cira/sidebarState.ts`의 `parseSidebarCookie`와 `serializeSidebarCookie` 순수 함수로 만들고, 클라이언트에서 `document.cookie`에 반영한다. 값이 없거나 잘못됐으면 기본값(펼침)을 쓴다.

### 3.2 디자인 토큰

`.cira-root` 범위에 CSS 변수를 정의하고, `tailwind.config.js`의 `theme.extend.colors.cira`로 노출한다(예: `bg-cira-brand`). 기존 화면은 `.cira-root` 밖에 있으므로 영향을 받지 않는다.

| 토큰 | 값 |
|---|---|
| `--cira-brand` | #4F46E5 |
| `--cira-brand-soft` (선택 배경) | #EEF2FF |
| `--cira-bg` (페이지) | #F4F5F7 |
| `--cira-surface` (본문) | #FFFFFF |
| `--cira-sidebar` | #FAFAFA |
| `--cira-border` | #E5E7EB |
| `--cira-text` / `--cira-muted` | #1F2937 / #6B7280 |
| 상태 분류: 할 일 / 진행 중 / 완료 | 회색 #6B7280 / 파랑 #2563EB / 초록 #16A34A |
| 이슈 유형: 스토리 / 버그 / 작업 | 초록 #22C55E / 빨강 #EF4444 / 파랑 #3B82F6 |
| 우선순위 | 최고 빨강 → 높음 주황 → 보통 노랑 → 낮음 회색, 화살표 아이콘(lucide) |

밀도: 기본 글자 14px, 표 행 높이 36px, 모서리 6px.

상태 분류 색은 워크플로 상태의 분류 값으로 정한다. 분류 값이 없는 상태는 "할 일" 색을 쓴다.

### 3.3 공통 컴포넌트 (`src/components/cira/ui/`)

CIRA 화면에서만 쓴다.

**배치와 의존 방향**
- L1 §5의 계층은 Screen → Domain(`components/{domain}`) → Primitive(`components/ui`)다. 하지만 CIRA 전용 디자인은 다른 모듈과 공유하지 않으므로 `components/ui`에 두지 않는다.
- 대신 **CIRA 모듈 전용 primitive 계층** `components/cira/ui`와 셸 `components/cira/shell`을 둔다.
- CIRA 화면의 의존 방향은 Screen → Domain(`board`, `issue`, `sprint` 등 기존 CIRA 도메인) → `cira/ui` → `ui`다.
- `cira/ui`는 hooks와 lib/api를 import하지 않는다. `cira/shell`만 `useProjects`, `useNotifications`를 쓴다.
- CIRA가 아닌 모듈은 `components/cira/**`를 import하지 않는다.
- 이 예외와 CIRA 전용 디자인 토큰은 ADR `docs/decisions/0005-cira-module-design-layer.md`로 기록한다. 그리고 `src/components/AGENTS.md`와 `src/components/ui/AGENTS.md` §1에 "CIRA 화면은 0005를 따른다"는 참조를 단다.

**컴포넌트 목록**
- **Radix 기반**(스타일은 토큰으로 입힘)
  - 컴포넌트: `DropdownMenu`, `Popover`, `Dialog`, `Tooltip`, `Tabs`, `Collapsible`
  - 의존성 추가: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip`, `@radix-ui/react-tabs`, `@radix-ui/react-collapsible`
- **Tailwind만 사용**: `Button`, `IconButton`, `Avatar`, `StatusLozenge`, `IssueTypeIcon`, `PriorityIcon`, `PageHeader`(경로 표시 → 제목 → 오른쪽 버튼)
- 기존 `src/components/ui`(`Skeleton`, `Toast`)는 그대로 재사용한다.
- Radix 컴포넌트를 감싼 파일은 `"use client"`로 둔다.

## 4. 화면별 재디자인

원칙:
- 기능은 지금 있는 것만 쓰고, 배치·정보 구조·조작 방식을 Jira Cloud 패턴에 맞춘다.
- 모든 화면은 `PageHeader` 아래에 본문을 둔다.
- 기존 모달은 `cira/ui/Dialog`로 옮긴다.

### 4.1 핵심 화면

| 화면 | 데스크톱 | 모바일(< 768px) |
|---|---|---|
| **보드** `projects/[id]/boards/[boardId]` | 상단에 보드 검색과 빠른 필터 칩("내 이슈만"은 클라이언트에서 담당자 = 현재 사용자로 필터). 컬럼 헤더에 이름과 건수. 카드는 제목, 하단에 유형 아이콘·키·우선순위·담당자 아바타. 기존 HTML5 DnD 유지 | 컬럼 폭 약 85vw, 가로 스크롤 snap. HTML5 DnD는 터치에서 동작하지 않으므로 카드마다 "이동 ▾" 메뉴(대상 컬럼 목록)를 두고 기존 `PUT /boards/{boardId}/issues/{issueId}/move`를 호출 |
| **백로그** `projects/[id]/sprints` | 스프린트마다 접히는 섹션(이름, 기간, 이슈 수, 시작·완료 버튼). 아래에 백로그 섹션(`/backlog` API. `types`→`lib/api`→`hooks` 순서로 연결하고, 현재 없는 mock 라우트 `GET /v1/projects/:projectId/backlog`를 `src/lib/mock/router.ts`에 추가). 이슈는 36px 행 | 행을 두 줄로(키 + 제목 / 상태·담당자). 스프린트 이동은 행 메뉴 → 기존 `AssignIssueModal` |
| **이슈 상세** `projects/[id]/issues/[issueId]` | 왼쪽에 제목·설명·첨부·댓글. 오른쪽에 상태 드롭다운 버튼(`useAvailableTransitions`), 그 아래 접히는 "세부 정보" 패널(담당자, 보고자, 우선순위, SP, 마감일). 기존 인라인 편집 유지 | 한 열. 상태 버튼은 상단 sticky. 세부 정보는 설명 위의 접이식 섹션 |
| **이슈 목록** `projects/[id]/issues` | 상단 필터 바(키워드, 우선순위). 표 열: 유형, 키, 요약, 상태, 우선순위, 담당자, 수정일 | 카드 목록(유형, 키, 제목, 상태, 담당자) |
| **검색** `search`, **고급 검색** `search/advanced` | 두 화면의 상단에 "기본 ↔ CQL" 토글(서로의 라우트로 이동). 결과는 이슈 목록과 같은 표. 왼쪽에 저장된 필터 목록 | 카드 목록. 저장된 필터는 상단 드롭다운 |

### 4.2 나머지 화면

| 화면 | 데스크톱 | 모바일 |
|---|---|---|
| 프로젝트 목록 `projects` | 표(아이콘, 이름, 키, 리더) + `+ 프로젝트 만들기` | 카드 목록 |
| 대시보드 `dashboard` | 현재 위젯을 2열 카드 그리드로 | 1열 |
| 리포트 `projects/[id]/reports/**` | `reports`는 리포트 카드 목록(번다운, 벨로시티, CFD), 각 리포트는 차트 + 설명. recharts 색을 토큰으로 교체 | 화면 폭에 맞춤. 촘촘한 차트는 가로 스크롤 |
| 릴리스 `projects/[id]/versions` | 표(버전, 상태, 진행률 바, 릴리스 날짜) + 행 메뉴(릴리스, 보관, 릴리스 노트) | 카드 목록 |
| 위키 `projects/[id]/wiki` | 기존 트리·뷰어·에디터 구성 유지, 여백과 색만 셸에 맞춤 | 페이지 트리는 서랍, 본문·에디터는 전체 폭 |
| 설정 `projects/[id]/settings/**` | 폼과 표 스타일 통일 | 폼 한 열, 넓은 표는 가로 스크롤 |
| 알림 `notifications` | 셸 벨 패널이 주 사용처, 페이지는 "전체 보기"용으로 목록 스타일 통일 | 전체 폭 목록 |

## 5. 반응형 규칙

| 구간 | 너비 | 셸 동작 |
|---|---|---|
| 모바일 | < 768px (`md` 미만) | 사이드바 숨김. 상단 바 ☰가 Radix Dialog 서랍으로 연다. 상단 바: ☰, 로고, 🔍(전체 폭 검색 오버레이), `+`(아이콘만), 알림, 아바타 |
| 태블릿 | 768–1023px | 사이드바 기본 접힘(56px, 아이콘) |
| 데스크톱 | ≥ 1024px (`lg`) | 사이드바 펼침(240px), 접기 가능 |

- 모바일에서 모든 Dialog는 전체 화면 시트, 알림 패널과 프로필 메뉴는 전체 폭 패널로 연다.
- 터치 대상은 최소 40px이다.
- hover 전용 동작은 두지 않는다. Tooltip은 보조 정보로만 쓴다.

## 6. 오류·로딩 처리

- `(cira)/cira/error.tsx`: 셸 안에 오류 화면과 "다시 시도" 버튼(`reset()`)을 보여 준다.
- `(cira)/cira/not-found.tsx`: 셸 안에 "찾을 수 없음"과 프로젝트 목록 링크를 보여 준다.
- `(cira)/cira/loading.tsx`: 셸은 바로 보이고 본문만 `Skeleton`으로 채운다.
- API 실패는 기존 화면들의 토스트 방식을 그대로 쓴다.

## 7. 검증

- 모든 단계 공통 게이트: `npx tsc --noEmit`, `npm run build`.
- Vitest를 devDependency로 추가하고 `"test": "vitest run"` 스크립트를 둔다. 단위 테스트는 아래 순수 로직만 대상으로 한다.
  - 옛 URL → 새 URL redirect 표: `next.config.mjs`에서 쓰는 표를 별도 모듈로 분리해 테스트한다.
  - 미들웨어 경로 판정: `/cira/**`는 보호, `/cira/register`는 제외, `/login`·`/register`는 공개 전용. 판정 함수를 분리해 테스트한다.
  - 보드 빠른 필터 "내 이슈만" 필터 함수.
  - 사이드바 쿠키 파싱·직렬화(값 없음, 잘못된 값 포함).
- UI 컴포넌트 테스트와 E2E는 범위 밖이다.
- 화면 확인: `DEV_MOCK_API=true`로 실행하고, 내장 브라우저에서 CIRA 화면 전체를 375 / 768 / 1280px로 열어 확인한다.
  - 기존 Home과 실험 모듈 화면이 이전과 같은지 확인한다.
  - Home ↔ CIRA를 오갈 때 로그인 상태가 유지되는지 확인한다.
  - 옛 URL이 새 URL로 redirect되는지 확인한다.

## 8. 작업 단계

각 단계가 끝나면 앱은 동작하는 상태다.

L1 §10과 [ADR 0003](../../decisions/0003-doc-sync-rule.md)에 따라 **문서 갱신은 각 단계의 같은 커밋에 포함**한다. 단계마다 `npx tsc --noEmit`, `npm run build`, `npm run docs:check`(오류 0개, 경고는 모두 확인)를 통과해야 한다. 커밋 메시지는 L1 §8 형식(`type: 설명`)을 따른다.

1. **기반**
   - 코드: 루트/`(main)` 레이아웃 분리, `(cira)` 그룹 생성과 파일 이동, redirect, 미들웨어, Home·내부 링크, 위키 링크(d94-query).
   - 테스트: Vitest 설정과 redirect·미들웨어 테스트.
   - CIRA 화면은 아직 기존 모습으로 임시 최소 레이아웃 안에 둔다.
   - 문서: L3 `AGENTS.md`/`CLAUDE.md`를 화면과 함께 `(cira)/cira/**`로 이동하고 안의 경로를 고친다. `(main)/layout.tsx`와 `(cira)/cira/layout.tsx`의 L3 문서를 만든다. L1 §0 지도·§1 모듈 표·§3 명령어(테스트), `src/app/AGENTS.md`, `docs/modules.md`, `docs/architecture.md`(라우트 보호·redirect)를 갱신한다.
2. **셸**
   - 코드: Radix 의존성, 디자인 토큰, `cira/ui` 컴포넌트, `CiraShell`(사이드바, 상단 바, 반응형 서랍, `+ 만들기` 프로젝트 선택), `error`/`not-found`/`loading`.
   - 테스트: 사이드바 쿠키 테스트.
   - 문서: ADR 0005, `components/cira/{ui,shell}`의 `AGENTS.md`/`CLAUDE.md`와 컴포넌트 카드, `src/components/AGENTS.md` 카탈로그, `src/components/ui/AGENTS.md` 참조, L1 §2 기술 스택(Radix, Vitest).
3. **핵심 화면**
   - 코드: 보드(모바일 "이동" 메뉴, 빠른 필터 테스트 포함), 백로그(backlog 훅·mock 추가), 이슈 상세, 이슈 목록, 검색·고급 검색.
   - 문서: 해당 L3 "화면 구성"·"데이터", 바뀐 도메인 컴포넌트 카드, `src/hooks/AGENTS.md`, `src/lib/AGENTS.md`.
4. **나머지 화면**
   - 코드: 프로젝트 목록, 대시보드, 리포트, 릴리스, 위키, 설정, 알림.
   - 문서: 해당 L3·컴포넌트 카드.
5. **마무리**
   - 세 가지 너비로 전체 점검.
   - `docs/known-issues.md` 갱신: CIRA 범위의 공통 UI 부재 항목 정리, 403 후속 과제 유지, 위키 링크 항목.
   - `docs/conventions.md` §7 예외 목록 점검.

반응형은 2~4단계에서 화면마다 함께 구현하고, 5단계는 최종 점검만 한다.
