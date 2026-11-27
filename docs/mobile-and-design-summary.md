# D94 Web 모바일 대응 및 공통 디자인 기준 정리

## 0. 적용 내역 총정리 (2026-11-26)

| 차수 | 커밋 | 범위 | 내용 |
|---|---|---|---|
| 1 | `830d669` feat | 모바일 레이아웃 | ApHeader 햄버거 메뉴 패널·검색/알림 드롭다운 화면 폭 맞춤 · Docs 폴더 트리 토글·노트 우측 패널 하단 · Wiki 높이(인라인 style 제거)·버전 오버레이·터치 액션 · MPMS/Ayaan 테이블 가로 스크롤 · Ayaan 상단 바 wrap · 루트 `viewport` · `d94-*` 토큰(ADR 0008) · 로그인/가입 브랜드 색 |
| 2 | `8ed48f4` style | 색·배경 통일 | CIRA 전용·테스트 제외 84개 파일 363곳 `blue-600` 계열 → `d94-brand` 계열 · `(main)`/`(auth)` 배경 → `bg-d94-bg` · 375px 25개 화면 넘침 점검 |
| 3 | `ef48e9b` feat | 테이블 카드화 | MPMS 플랫폼·제품(`MobileRowCards`)·Ayaan 작업 목록을 모바일 카드 목록으로 · MPMS 모바일 `min-h-[460px]` 제거 · MPMS 검정 버튼 → `d94-brand` |

| 4 | `32f917a` feat | 모바일 메뉴 서랍 | `cira/ui/Dialog` → `ui/Dialog` 승격(ADR 0006 갱신, import 9곳) · ApHeader 모바일 메뉴를 펼침 패널 → 왼쪽 서랍(`Dialog side="left"`, 바깥 클릭·Esc·✕ 닫힘) |

| 5 | `c15611f` feat | Docs 트리 서랍 | Docs 폴더 트리 토글 → `ui/Dialog side="left"` 서랍(트리 JSX 한 벌을 데스크톱 aside·서랍이 함께 씀), 화면 이동·다른 창 열림 시 자동 닫힘 |

| 6 | `e4fc61d` fix | 모바일 사용성 | iOS 입력 확대 방지(모바일 입력 16px, `globals.css`) · 손 모달 20개 `max-h-[calc(100dvh-2rem)] overflow-y-auto`(낮은 화면에서 버튼까지 스크롤) · Toast safe-area·폭 제한·닫기 aria-label · 아이콘 버튼 aria-label 2곳 · 선택 강조(Docs·Wiki 트리, 빠른 전환, 버전 이력, CQL 자동완성, CIRA 설정, 인터페이스 테스트, Life Metric 템플릿) `blue-50/700` → `d94-brand-soft/brand` |

| 7 | `2e7f65f` feat | 공통 Button·Input | `ui/Button`(primary·secondary·ghost·danger, md·sm, tailwind-merge) · `ui/Input`(Input·Select·Textarea) 추가, 표준형 버튼 39개·입력 31개(25개 파일) 교체 |

| 8 | `3321b95` feat | ConfirmDialog | `ui/ConfirmDialog` `useConfirm()` → `Promise<boolean>` (`Dialog compact` 카드, danger 빨간 버튼) · 브라우저 `confirm()` 15곳(12개 파일) 교체 |

| 9 | `5de3515` refactor | Task·댓글 삭제 확인 | CIRA Task 상세 삭제·댓글 삭제의 손 마크업 다이얼로그 → `useConfirm`(중복 삭제 방지 유지) |

| 10 | `bd1e6b4` refactor | 보드·지표 삭제 확인 | KanbanBoard 컬럼·보드 삭제, Life Metric 지표 삭제의 손 마크업 다이얼로그 → `useConfirm` (손 마크업 삭제 모달 0개 — 프로젝트 설정의 인라인 2단계 삭제·CIRA 타입 삭제 Dialog 는 의도된 형태로 유지) |

| 11 | `bd11771` feat | FormField | `ui/FormField`(라벨+입력+오류, `<label>` 로 입력 연결 — 라벨 클릭 포커스·스크린리더) 추가, 표준 라벨 필드 36곳(12개 파일) 교체 |

| 12 | (이번) feat | Badge·EmptyState | `ui/Badge`(알약, 색은 className) 23곳 · `ui/EmptyState`(md·sm·action) 21곳 교체 |

**남은 후보(미적용):** 표준형이 아닌 버튼(아이콘·링크형 등)·CIRA 전용 화면 버튼은 그대로.

## 1. 모바일 환경 문제점 분석

| 영역 | 대상 파일 | 원인 | 모바일 화면 증상 |
| :--- | :--- | :--- | :--- |
| **공통 헤더 (`(main)`)** | `src/components/layout/ApHeader.tsx` | 로고 + 메뉴 4개 + `GlobalSearch`(`w-64`) + 알림 + 사용자명 + 기준정보 + 로그아웃이 `flex` 한 줄에 고정 배치 | 헤더 폭이 700px 이상으로 커져 `/home` 등 `(main)` 전체 페이지에 가로 스크롤 발생 |
| **검색·알림 팝오버** | `src/components/layout/GlobalSearch.tsx`<br>`src/components/layout/NotificationBell.tsx` | 드롭다운 폭이 `w-80`(320px) 고정이며 `left-0` / `right-0` 기준 배치 | 좁은 화면에서 드롭다운이 화면 좌·우 밖으로 잘림 |
| **Docs 3단 레이아웃** | `src/app/(main)/docs/layout.tsx`<br>`src/app/(main)/docs/[noteId]/page.tsx` | 좌측 폴더 트리(`w-60 shrink-0`, 240px)가 반응형 숨김 없이 항상 가로 배치, 우측 패널은 `hidden lg:block`으로 숨김 | 본문 폭이 극도로 좁아지거나 상단 툴바가 화면 밖으로 밀림; 모바일에서 백링크·버전 이력·Task 패널 접근 불가 |
| **MPMS 테이블** | `src/components/mpns/PlatformTable.tsx` | `table-fixed` + 컬럼 고정 폭(`w-28`, `w-32`, `w-48`), 바깥 래퍼가 `overflow-hidden` (`overflow-x-auto` 없음) | 컬럼이 겹쳐 찌그러지거나 테이블 내용이 화면 밖에서 잘림 |
| **Ayaan 목록·상단 바** | `src/app/(main)/ayaan/page.tsx`<br>`src/app/(main)/ayaan/tasks/page.tsx` | 상단 액션 바에 `flex-wrap` 누락, 5열 `<table>`에 가로 스크롤 래퍼 또는 카드 변환 없음 | 필터·헤더 버튼이 넘치고 작업 테이블이 화면 폭을 초과 |
| **CIRA Wiki** | `src/app/(cira)/cira/projects/[projectId]/wiki/page.tsx`<br>`src/components/wiki/WikiTree.tsx` | `height: calc(100vh - 140px)` 고정 + 버전 히스토리 패널 가로 병렬 배치, 트리 액션이 `hidden group-hover:flex` | 모바일에서 버전 패널 열면 본문이 좁아져 잘림; 터치 기기에서 하위 페이지 추가/삭제 불가 |
| **루트 Viewport 설정** | `src/app/layout.tsx` | `export const viewport` 미선언 | iOS Safari 등에서 `viewport-fit=cover` 및 초기 배율·오버플로 제어가 명시되지 않음 |

---

## 2. 모바일 대응 해결 방법 (우선순위)

> **적용 완료 (2026-11-26, `feat/mobile-responsive`)** — 1~3단계를 아래처럼 단순화해 반영했습니다.
> - 헤더 모바일 메뉴는 `Dialog` 서랍 대신 헤더 아래 펼침 패널, Docs 폴더 트리는 [폴더 · 노트 열기] 토글 (Radix 를 CIRA 밖으로 끌어오지 않기 위함, ADR 0006).
> - MPMS·Ayaan 테이블은 처음엔 `overflow-x-auto` 만 적용했고, 이후 `IssueTable` 처럼 모바일 카드 목록(`md:hidden`) + 데스크톱 테이블(`hidden md:block`)로 바꿨습니다.
> - Wiki 높이는 인라인 style 을 Tailwind `min-h-[60vh] md:h-[calc(100vh-140px)]` 로 교체.

### 1단계: 공통 레이아웃·헤더 즉시 복구
- **`ApHeader` 반응형 전환 (`src/components/layout/ApHeader.tsx`)**: 모바일(`md` 미만)에서는 햄버거 버튼 + 좌측 드로어(`Dialog`)로 메뉴·사용자 정보·기준정보·로그아웃을 이동하고, 상단 바에는 로고·검색 아이콘·알림·메뉴 버튼만 유지 (`px-3 md:px-6`).
- **팝오버 뷰포트 안전 폭 (`GlobalSearch.tsx`, `NotificationBell.tsx`)**: `w-[calc(100vw-1.5rem)] sm:w-80` 또는 모바일 전용 `fixed inset-x-3 top-14` 적용.
- **루트 Viewport 및 가로 이탈 방어 (`src/app/layout.tsx`, `src/app/globals.css`)**: `viewport` export(`device-width`, `initialScale: 1`, `viewportFit: "cover"`) 및 `html, body { overflow-x: clip; }` 적용.

### 2단계: 사이드바·고정 폭 레이아웃 모바일화
- **Docs 사이드바 드로어화 (`docs/layout.tsx`, `docs/[noteId]/page.tsx`)**: 좌측 `w-60` 트리를 `hidden lg:block`으로 숨기고 모바일 상단 드로어 버튼으로 제공. `[noteId]/page.tsx` 상단 툴바에 `flex-wrap` 적용 및 우측 패널(백링크·버전 이력·Task) 모바일 시트/하단 섹션 노출.
- **Wiki 모바일 패널 및 터치 액션 (`wiki/page.tsx`, `WikiTree.tsx`)**: 고정 높이 `min-h-[60vh] md:h-[calc(100vh-140px)]` 완화, 버전 히스토리 모바일 오버레이화, 트리 액션 `flex md:hidden md:group-hover:flex` 변경.

### 3단계: 데이터 테이블·대시보드 모바일 최적화
- **MPMS · Ayaan 테이블 (`PlatformTable.tsx`, `ProductTable.tsx`, `ayaan/tasks/page.tsx`)**: `overflow-x-auto` 래퍼 적용 및 `IssueTable.tsx`와 동일하게 `hidden md:block`(테이블) + `md:hidden`(카드 리스트) 분기.
- **Ayaan 헤더·필터 (`ayaan/page.tsx`, `ayaan/tasks/page.tsx`)**: `flex-wrap gap-2` 적용.

---

## 3. 서비스 공통 디자인 기준 (CIRA 기준)

### 적용된 공통 설정 파일
- `src/app/globals.css`: `:root` 공통 토큰(`--d94-*`) 정의 및 `.cira-root` 연동, `overflow-x: clip` 적용
- `tailwind.config.js`: `d94.*` 컬러 유틸리티 추가
- `src/app/layout.tsx`: `viewport` 설정 및 `bg-d94-bg text-d94-text antialiased` 적용
- `docs/decisions/0008-service-design-system.md`: 공통 디자인 시스템 ADR 문서

### 컬러 & 포인트 칼라 체계 (`d94.*`)

| 역할 | 토큰 | 색상 값 | 용도 |
| :--- | :--- | :--- | :--- |
| **주 포인트 (Primary)** | `d94-brand` / `d94-brand-hover` | `#4F46E5` / `#4338CA` | 주요 CTA 버튼, 활성 탭·링크, 포커스 링 |
| **보조 강조 (Soft)** | `d94-brand-soft` | `#EEF2FF` | 사이드바 선택 메뉴 배경, 활성 배지 |
| **배경 / 표면 / 사이드바** | `d94-bg` / `d94-surface` / `d94-sidebar` | `#F4F5F7` / `#FFFFFF` / `#FAFAFA` | 캔버스 / 카드·모달·헤더 / 사이드바 |
| **텍스트 / 경계선** | `d94-text` / `d94-muted` / `d94-border` | `#1F2937` / `#6B7280` / `#E5E7EB` | 본문 / 보조 설명 / 카드·입력 테두리 |
| **상태 시맨틱** | `d94-danger` / `d94-success` / `d94-warning` | `#EF4444` / `#22C55E` / `#F59E0B` | 삭제·오류 / 완료 / 주의·대기 |

### 컴포넌트 크기 & 반응형 규격

| 컴포넌트 | 모바일 (`< 768px`) | 태블릿·데스크톱 (`>= 768px`) | 기준 |
| :--- | :--- | :--- | :--- |
| **기본 본문** | `14px` (`text-sm`) | `14px` (`text-sm`) | 루트 기준 통일 |
| **페이지 제목 (`h1`)** | `text-xl font-semibold` (20px) | `text-xl` ~ `text-2xl font-bold` | `PageHeader` 기준 |
| **상단 헤더 높이** | `h-12`~`h-14`, `px-3` | `h-12`~`h-14`, `px-4`~`px-6` | `CiraShell` 기준 |
| **사이드바 너비** | 드로어 (`w-72 max-w-[85vw]`) | 태블릿 `w-14`(56px) / 데스크톱 `w-60`(240px) | `Dialog side="left"` |
| **버튼 · 터치 타겟** | 최소 `h-10` (아이콘 `h-10 w-10`) | `h-9` (36px) ~ `h-10` (40px) | 40px 이상 터치 영역 |
| **입력 · 셀렉트** | `h-10`, `rounded-lg` | `h-9`~`h-10`, `rounded-md`/`rounded-lg` | |
| **카드 · 패널** | `rounded-xl`, `p-4` | `rounded-xl`, `p-5`~`p-6` | `border-d94-border bg-d94-surface` |
| **모달 / 다이얼로그** | 전체 화면 시트 (`inset-0`) | 중앙 모달 (`max-w-lg`) | `ui/Dialog` 패턴 |
| **테이블 / 목록** | 카드 리스트(`md:hidden`) 또는 `overflow-x-auto` | 테이블(`hidden md:block`) | `IssueTable` 패턴 |

### 화면별 정렬 기준
- **`(auth)` 로그인·회원가입 (`LoginForm.tsx`, `RegisterForm.tsx`)**: 기존 `blue-600` 버튼·포커스 링을 `d94-brand`(`#4F46E5`)로 통일, 입력·버튼 `h-11` 유지.
- **`(main)` 홈·Docs·Study·Ayaan·MPMS**: `ApHeader` 모바일 드로어 전환과 함께 활성 탭·주요 버튼 색상을 `d94-brand`, 배경을 `d94-bg`로 통일.

### 적용 현황 (2026-11-26)
- 강조색 일괄 교체: CIRA 전용(`components/cira/`)과 테스트를 뺀 84개 파일에서 `bg-blue-600`·`hover:bg-blue-700`·`text-blue-600`·`hover:text-blue-700/800`·`focus:ring-blue-500`·`focus:border-blue-500`·`border-blue-600`·`ring-blue-500`·`hover:bg-blue-50` → `d94-brand` 계열(363곳). 상태 색(`tones.ts` 등)은 그대로.
- 배경 통일: `(main)/layout.tsx` `bg-gray-50`, `(auth)/layout.tsx` `bg-slate-100` → `bg-d94-bg`.
- 375px 점검: `(main)`·`(cira)` 주요 25개 화면에서 화면 밖으로 넘치는 요소 없음.

