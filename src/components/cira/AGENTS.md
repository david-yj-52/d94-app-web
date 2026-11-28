# L2 · CIRA 전용 컴포넌트 (`src/components/cira/`)

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **cira**
> CIRA 화면(`src/app/(cira)/cira/**`)만 씁니다. 다른 모듈은 import 하지 않습니다 → [ADR 0006](../../../docs/decisions/0006-cira-design-layer.md)

## 1. 디자인 토큰

`.cira-root`(셸 최상위, Radix Portal 내용에도 붙임) 안에서만 값이 있는 CSS 변수입니다. 정의: `src/app/globals.css`, Tailwind 이름: `tailwind.config.js`의 `cira.*`.

| Tailwind | 값 | 용도 |
|---|---|---|
| `cira-brand` / `cira-brand-soft` | #4F46E5 / #EEF2FF | 주요 버튼·로고 / 선택된 메뉴 배경 |
| `cira-bg` / `cira-surface` / `cira-sidebar` | #F4F5F7 / #FFFFFF / #FAFAFA | 페이지 / 본문 / 사이드바 |
| `cira-border` | #E5E7EB | 테두리 |
| `cira-text` / `cira-muted` | #1F2937 / #6B7280 | 본문 / 보조 글자 |

- 상태 분류(할 일·진행 중·완료), 이슈 유형(스토리·버그·작업), 우선순위 색은 `ui/tones.ts`가 정합니다(`tones.test.ts`).
- 반응형: 모바일 `< md(768px)`, 태블릿 `md`(사이드바 아이콘만), 데스크톱 `lg(1024px)` 이상. 터치 대상은 최소 40px(`h-10`)입니다.

## 2. `ui/` — CIRA primitive (hooks·lib/api import 금지)

### StatusLozenge / IssueTypeIcon / PriorityIcon / Avatar — `@/components/cira/ui/Badges`
```ts
StatusLozenge({label?: string | null; category?: string | null})   // category: "TODO" | "IN_PROGRESS" | "DONE", 없으면 할 일 색
IssueTypeIcon({typeName?: string | null})                         // 버그/Bug 빨강, 스토리/Story 초록, 그 외 작업(파랑)
PriorityIcon({priority?: string | null})                          // 모르는 값이면 렌더링 안 함
Avatar({name?: string | null; size?: "sm" | "md"})                // 이름 첫 글자, 없으면 "?"
CommonFeatureBadge({feature: {issueKey: string; title: string}})  // "공통 · KEY" — ui/Badge + d94-brand-soft, 공통 Feature 에 연결된 Task (설계 3.2)
```

### PageHeader — `@/components/cira/ui/PageHeader`
```ts
{ breadcrumbs?: {label: string; href?: string}[]; title: string; actions?: ReactNode }
```

### Dialog — `ui/Dialog` 로 승격됨 (2026-11-26)
- ApHeader 모바일 서랍에서도 쓰게 되어 `@/components/ui/Dialog` 로 옮겼습니다. 카드는 [ui](../ui/AGENTS.md) §2.

### Menu — `ui/DropdownMenu` 로 승격됨 (2026-11-26)
- KanbanBoard 보드 메뉴·Docs 폴더 메뉴에서도 쓰게 되어 `@/components/ui/DropdownMenu` 로 옮겼습니다. 카드는 [ui](../ui/AGENTS.md) §2.

## 3. `shell/` — CIRA 셸

### CiraShell — `@/components/cira/shell/CiraShell`
```ts
{ user?: {name?: string | null; email?: string | null}; initialCollapsed: boolean; children: ReactNode }
```
- 사용처: `src/app/(cira)/cira/layout.tsx` 하나. layout 이 `auth()` 와 쿠키 `SIDEBAR_COOKIE`(`cira_sidebar_collapsed`, `1` = 접힘)를 읽어 넘깁니다.
- 상단 바(48px): 모바일 ☰ · 로고(→ `/cira/projects`) · `GlobalSearch`(md 이상, 모바일은 🔍 → `/cira/search`) · `CreateIssueButton` · `NotificationBell` · 프로필 `Menu`(이메일, "D94 Home으로 돌아가기", 로그아웃).
- 사이드바: 데스크톱 240px / 접힘 56px(쿠키 저장), 태블릿은 항상 56px, 모바일은 ☰ → `Dialog side="left"` 서랍(경로가 바뀌거나 서랍 안 링크를 누르면 닫힘 — `CiraSidebar onNavigate`, 쿼리만 바뀌는 팀 이동 때문).

### CiraSidebar — `@/components/cira/shell/CiraSidebar`
```ts
{ collapsed?: boolean; onNavigate?: () => void }   // onNavigate: 메뉴 안 링크를 누르면 호출 (nav onClick 하나)
```
- 메뉴: 내 작업(`/cira/dashboard`) · 알림 / 프로젝트 — 프로젝트 밖은 "모든 프로젝트"(허브) 링크만, 프로젝트 안은 다른 프로젝트 목록 없이 "← 모든 프로젝트" · 현재 프로젝트(`useProject`)만 / 필터: 검색·고급 검색.
- 프로젝트 **통합 메뉴**(모든 팀): Feature (전체 통합)(`/features`) · Task (전체)(`/issues`, `?space=` 없음 — 활성은 `isAll` 일 때만) · 백로그 · 리포트 · 릴리스 · 위키 · 프로젝트 설정(ADMIN만, `useProjectMembers`).
- **작업 공간(팀) 트리**(V650, 드롭다운 대신): 공간마다 접고 펴는 버튼. 기본은 지금 그 팀 화면(`onTeamRoute` — 보드·Task·공간 설정, 통합 화면은 해당 없음)일 때만 펼침, 사용자가 누르면 그 팀은 그 선택을 따름(지금 팀도 접힘, 컴포넌트 상태 `toggled`). 펼치면 `teamLinks(sp.canManage)` = 보드 · Task · 공간 설정(`canManage`, 항목마다 `icon`)이고 링크는 `withSpace(base + suffix, sp.id)` — 기본 공간도 항상 `?space=`. 활성은 `teamActive(...)`(경로 + 지금 공간이 그 팀, `?space=` 없는 Task 목록은 제외). ADMIN 이면 "+ 작업 공간 추가" → `CreateSpaceModal`. 사이드바 접힘(아이콘만)은 팀 이름 앞 두 글자 배지 → 그 팀 보드, 강조도 `onTeamRoute` 기준(`?space=` 없는 옛 보드 링크면 기본 팀). `useSearchParams` 때문에 내부를 `Suspense` 로 감쌉니다.
- 설정 화면 안에서는 프로젝트 하위 메뉴 대신 설정 메뉴 두 묶음: `PROJECT_SETTINGS`(기본 정보·멤버·Git 연동·자동화, ADMIN) · `SPACE_SETTINGS`(공간 정보·워크플로·필드·보드 · 뷰·산출물 규칙, `canManage`, `?space=` 이음) — 묶음 제목 "프로젝트" / "작업 공간 · {이름}". 그 아래 "다른 작업 공간"(공간 2개 이상) = 다른 팀의 같은 설정 화면 링크(`withSpace(pathname, sp.id)`), ADMIN 이면 "+ 작업 공간 추가".
- 현재 위치 판정은 `navContext.ts`의 `getNavContext(pathname)` → `{projectId?, inSettings}`, 팀 메뉴는 `teamLinks(canManage)`·`teamActive(pathname, base, suffix, teamId, currentSpaceId, isAll)`·`onTeamRoute(pathname, base, teamId, currentSpaceId, isAll)` (`navContext.test.ts`, 사이드바 동작은 `CiraSidebar.test.tsx`).
- **새 프로젝트 하위 화면을 추가하면 통합 메뉴는 `projectMenu`, 팀별 화면은 `teamLinks` 에 항목을 추가하세요.**

### CreateIssueButton — `@/components/cira/shell/CreateIssueButton`
```ts
{ projectId?: string }
```
- `projectId`가 있으면 `CreateIssueModal`을 바로 엽니다. 없으면 프로젝트 선택 `Dialog`를 먼저 띄웁니다.
