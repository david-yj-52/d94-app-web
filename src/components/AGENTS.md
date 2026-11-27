# L2 · 컴포넌트 카탈로그 (`src/components/`)

> 계층: [L1 프로젝트](../../AGENTS.md) › **L2 components**
> 화면을 만들기 전에 **이 카탈로그부터 확인**하세요. 카드(props·사용 예)는 각 폴더의 `AGENTS.md`에 있습니다.

## 1. 계층 모델

| 계층 | 폴더 | 정의 | import 가능 대상 |
|---|---|---|---|
| **Primitive** | `ui/` | 도메인 지식이 없고 props로만 동작 | 외부 라이브러리만 |
| **Layout** | `layout/` | 앱 골격 (헤더, 전역 알림) | ui, hooks, lib |
| **Domain** | `{domain}/` | 특정 도메인 데이터·훅에 의존하는 조립품 | ui, hooks, 같은 도메인 |
| **Screen** | `src/app/**/page.tsx` | 위 계층을 조립만 함 | 전부 |

- **CIRA 모듈 계층:** `cira/ui`(CIRA 전용 primitive)와 `cira/shell`(CIRA 셸)은 CIRA 화면·도메인 컴포넌트만 씁니다. 다른 모듈은 import 하지 않습니다 → [ADR 0006](../../docs/decisions/0006-cira-design-layer.md)
- **루트에 흩어진 파일**(`Providers`, `TshLogo`, todo/데모 컴포넌트)은 이 모델 밖의 기존 파일입니다. 새 컴포넌트는 루트에 두지 마세요.

## 2. 재사용 판단 순서

1. 아래 표에서 이름과 용도로 찾습니다. 필요하면 폴더 카드를 엽니다.
2. 있으면 그대로 사용합니다. 비슷하면 props나 variant를 추가합니다. 복사는 금지입니다.
3. 없을 때:
   - 한 화면 전용이면 → `{domain}/`에 만듭니다.
   - 두 곳 이상에서 쓰면 → `ui/`로 승격합니다.
   - 도메인 지식이 섞여 있으면 → 도메인 부분을 props로 빼낸 뒤 승격합니다.
4. 이 표와 카드를 갱신합니다.

## 3. 현재 상태 요약 (2026-10-15 기준)

- 파일은 53개입니다. 그중 여러 화면에서 재사용되는 것은 **Toast(15곳)·Skeleton(9곳)** 뿐입니다.
- (2026-11-26 갱신) `ui/Dialog`·`ui/Button`·`ui/Input` 이 생겼습니다. 새 코드는 이것을 쓰고, 아래는 그 전 상태 기록입니다.
- **Modal, Button, Input 같은 primitive가 아직 없습니다.**
  - 모달 overlay(`fixed inset-0`)는 21개 파일에서 각자 구현합니다.
  - `<button>` 171개와 `<input|select|textarea>` 94개를 Tailwind 클래스로 직접 작성합니다.
  - 새 모달이나 버튼을 만들 때는 [ui/AGENTS.md](ui/AGENTS.md) §3의 **표준 마크업**을 복사해서 씁니다.
  - primitive가 추가되면 그 primitive로 교체합니다(승격 계획은 같은 문서에 있음).

## 4. 전체 목록

상태: ✅ 사용 중 · 🔁 재사용됨(2곳 이상) · 🧪 실험 모듈 전용 · ⛔ 미사용 · ⬆ 승격 후보

### Primitive · Layout · 기타
| 컴포넌트 | 경로 | 용도 | 사용처 | 상태 |
|---|---|---|---|---|
| Toast / `useToast` | `ui/Toast` | 하단 알림 메시지 | 15개 화면·컴포넌트 | 🔁 |
| Skeleton / SkeletonCard / SkeletonRow | `ui/Skeleton` | 로딩 자리표시 | 9개 화면 | 🔁 |
| ApHeader | `layout/ApHeader` | 상단 헤더 (설정 로고·검색·알림·기준정보·사용자) | `(main)/layout.tsx` | ✅ |
| logoFonts | `ui/logoFonts` | 로고 폰트 목록·className (`next/font`) | ApHeader, GeneralSettingsPanel | 🔁 |
| GlobalSearch | `layout/GlobalSearch` | 헤더 빠른 이슈 검색 | ApHeader, CiraShell | ✅ |
| NotificationBell | `layout/NotificationBell` | 헤더 알림 드롭다운 | ApHeader, CiraShell | ✅ |
| NotificationMount | `layout/NotificationMount` | 알림 폴링 마운트 | `(main)`·`(cira)` layout | ✅ |
| Providers | `Providers` | QueryClient + SessionProvider(`refetchOnWindowFocus={false}`) + SessionActivity + ReauthModal | `app/layout.tsx` | ✅ |
| TshLogo | `TshLogo` | 브랜드 로고 | (auth) layout, ApHeader, `app/page.tsx` | 🔁 |
| AddTodoForm / TodoItem | `AddTodoForm`, `TodoItem` | todo 입력·항목 | `/todo` | 🧪 |
| AuthCheck / LoginButton | `AuthCheck`, `LoginButton` | 초기 인증 데모 | — | ⛔ |
| StatusLozenge, IssueTypeIcon, PriorityIcon, Avatar | `cira/ui/Badges` | CIRA 상태 배지·유형·우선순위 아이콘·아바타 | CIRA 셸·화면 | ✅ |
| PageHeader | `cira/ui/PageHeader` | CIRA 화면 머리(경로·제목·버튼) | CIRA 화면 | ✅ |
| Button | `ui/Button` | 공통 버튼 (primary·secondary·ghost·danger·link·unstyled, md·sm·icon) — 앱의 모든 버튼 | 앱 전체(약 120개 파일) | 🔁 |
| Input / Select / Textarea | `ui/Input` | 공통 입력 필드 (react-hook-form register 그대로) | 모달·폼 | 🔁 |
| FormField | `ui/FormField` | 라벨+입력 1개+오류 묶음 (`<label>` 로 연결) | 12개 파일(모달·폼) | 🔁 |
| Badge | `ui/Badge` | 상태·종류 알약 배지 (색은 className) | CIRA 스프린트·대시보드·설정·카드, ayaan, docs, study 등 | 🔁 |
| EmptyState | `ui/EmptyState` | "~이 없습니다" 빈 상태 (md·sm, action) | Docs·Study·Wiki·Life Metric·Ayaan·설정 패널 등 | 🔁 |
| ConfirmDialog / `useConfirm` | `ui/ConfirmDialog` | 브라우저 confirm() 대체 확인 창 (Promise<boolean>) | CIRA sprints·versions·wiki·settings, study, ayaan, settings 패널 | 🔁 |
| Dialog | `ui/Dialog` | Radix 모달 (모바일 전체 화면·왼쪽 서랍) | ApHeader, CIRA 셸·화면·issue·settings | 🔁 |
| DropdownMenu | `ui/DropdownMenu` | Radix ··· 더보기 메뉴 (키보드·바깥 클릭) | CIRA 셸·Task 상세·스프린트·KanbanCard·KanbanBoard·DocsSidebar | 🔁 |
| CiraShell › CiraSidebar, CreateIssueButton | `cira/shell/*` | CIRA 셸 (상단 바·통합 사이드바(작업 공간 전환)·모바일 서랍·이슈 만들기) | `(cira)/cira/layout.tsx` | ✅ |

### Domain
| 폴더 | 컴포넌트 | 용도 | 사용처 | 카드 |
|---|---|---|---|---|
| auth | LoginForm, RegisterForm | 로그인·회원가입 폼 (react-hook-form + zod) | `/login`, `/register`, ReauthModal | §5 |
| auth | ReauthModal, SessionActivity | 세션 만료 시 그 자리 재로그인 모달 · 사용자 입력 시 세션 활동 신호 | `Providers` | §5 |
| board | KanbanBoard › KanbanColumn › KanbanCard | 칸반 보드 (HTML5 DnD) | `boards/[boardId]` | [board](board/AGENTS.md) |
| board | CreateBoardModal, AddColumnModal | 보드 생성, 컬럼 추가·편집 | `boards`, KanbanBoard | [board](board/AGENTS.md) |
| issue | IssueTable, IssueFilter, CreateIssueModal | Task 목록(프로젝트 필드 기준 동적 컬럼·정렬)·필터·생성(필수 사용자 정의 필드) | `issues` | [issue](issue/AGENTS.md) |
| issue | ColumnPicker, FieldLibraryDialog, FieldValue, CustomFieldInput | 사람별 컬럼 선택·순서·만들기·가져오기 · 라이브러리 가져오기 창 · 필드 값 표시 · 사용자 정의 필드 입력 | `issues`, `issues/[issueId]`, `settings/fields` | [issue](issue/AGENTS.md) |
| issue | CommentSection, AttachmentSection | 댓글(멘션·이모지·답글)·첨부(DnD 업로드) | `issues/[issueId]` | [issue](issue/AGENTS.md) |
| issue | IssueDocsSection | Task 연결 Docs(메인 노트·슬롯 파생·계보) | `issues/[issueId]` | [issue](issue/AGENTS.md) |
| issue | FeatureTree | 2단계 Feature 트리 (공통 배지·공간 배지·Task 수) | `features` | [issue](issue/AGENTS.md) |
| interfaceTest | InterfaceRequestPanel, InterfaceCallLog, InterfaceItemTable, MethodBadge, PumpControlPanel | REST 메서드별 통신 확인 + Admin 전용 PUMP1 MQTT 제어 | `/interface-test` 🧪 | [interfaceTest](interfaceTest/AGENTS.md) |
| lifeMetric | MetricCard, MetricCreateModal, FormulaEditor, BaselineForm, LogPanel | 삶의 수치화 지표 카드·생성(템플릿/수식 빌더)·기준값·기록 | `/life-metric` 🧪 | [lifeMetric](lifeMetric/AGENTS.md) |
| infra | NodeCard, UsageBar, NodeFormModal, ServiceFormModal, MetricChart, ProcessTable, format | 인프라 노드 카드·사용률 막대·노드/서비스 등록·추이 차트·프로세스 Top-N | `/infra/**` 🧪 | [infra](infra/AGENTS.md) |
| study | DocumentList, UploadDropzone, TocTree, PageView, SelectionToolbar, AnnotationPopover, TermEditModal, TermsPanel, NoteList, AutoScroll, DictionaryPopover, DictionaryKeyModal | PDF 학습 뷰어 (업로드·목차·본문 렌더링·마킹·단어장·노트·자동 스크롤) | `/study/**` 🧪 | [study](study/AGENTS.md) |
| docs | DocsSidebar, NoteMarkdown, CodeBlock, MermaidDiagram, NoteEditor, livePreview, useNoteAutosave, NoteSidePanel, DeriveModal, PromoteToCiraModal, TaskBoard, NoteVersionHistory, QuickSwitcher, FolderPickerModal, DocsDialog, useOpenNote | Docs 다중 vault (vault 섹션별 폴더 트리·[[링크]] 렌더링·편집·백링크·버전·Cmd+K) | `/docs/**` | [docs](docs/AGENTS.md) |
| milestone | MilestoneCard, MilestoneModal | 마일스톤 카드·생성/편집 | `versions` | §5 |
| mpns | PlatformTable, ProductTable, MobileRowCards, DetailPanel, PlatformAddPopup, ProductAddPopup | MPMS 마스터-디테일 (모바일 카드 목록) | `/mpms` 🧪 | [mpns](mpns/AGENTS.md) |
| project | ProjectCard, CreateProjectModal | 프로젝트 카드·생성(첫 작업 공간 이름·프리셋) | `/cira/projects` | [project](project/AGENTS.md) |
| project | CreateSpaceModal | 작업 공간 추가(이름·프리셋/빈 공간·공간 관리자) | CiraSidebar | [project](project/AGENTS.md) |
| project/settings | MemberTable, AddMemberModal | 멤버 관리 | `settings/*` | [project](project/AGENTS.md) |
| project/settings/automation | AutomationRuleCard, AutomationRuleModal | 자동화 규칙 | `settings/automation` | [project](project/AGENTS.md) |
| search | CqlEditor, CqlSyntaxGuide | CQL 입력기(자동완성·검증)·문법 가이드 | `search/advanced` | §5 |
| settings | SettingsNav, GeneralSettingsPanel, CiraSettingsPanel, AyaanSettingsPanel, ApiTokenSettingsPanel, EmptyGroupPanel | 기준정보 그룹 목록·General 로고·CIRA 작업 공간 프리셋/필드/공통 산출물 규칙·Ayaan·API 토큰·빈 그룹 | `/settings` | [settings](settings/AGENTS.md) |
| settings | CustomFieldModal | 사용자 정의 필드 생성·수정 폼 (전역·프로젝트 공용, 저장은 부모) | `/settings` CIRA, `settings/fields` | [settings](settings/AGENTS.md) |
| sprint | CreateSprintModal, EditSprintModal, AssignIssueModal, CompleteSprintModal | 스프린트 생성·편집·이슈 할당·완료 | `sprints` | [sprint](sprint/AGENTS.md) |
| version | VersionCard › ReleaseNotesModal, VersionModal | 버전 카드·릴리즈 노트·생성/편집 | `versions` | [version](version/AGENTS.md) |
| wiki | WikiTree, WikiViewer, WikiEditor, WikiVersionHistory | 위키 트리·보기·Tiptap 편집·이력 | `wiki` | [wiki](wiki/AGENTS.md) |

## 5. 작은 폴더 카드 (auth · milestone · search)

### LoginForm / RegisterForm — `@/components/auth/LoginForm`, `@/components/auth/RegisterForm`
```ts
LoginForm(props: { reason?: string; callbackUrl?: string; onSuccess?: () => void })
// reason = /login?reason=… (LOGIN_NOTICES 키, 예 "expired")
// callbackUrl = 성공 뒤 이동할 내부 경로(호출하는 쪽이 safeCallbackUrl 로 검증, 기본 /home)
// onSuccess = 있으면 이동하지 않고 이것만 호출 (ReauthModal)
RegisterForm()                          // props 없음
```
- react-hook-form + zod로 검증합니다.
- 두 폼 모두 비밀번호를 **암호화한 뒤에만** 전송합니다(ADR 0004). `signIn`을 직접 부르지 말고 `useLogin`을 쓰세요.
- LoginForm은 `useLogin`(`hooks/useAuth`)을 호출합니다. 결과 false → "이메일 또는 비밀번호가 올바르지 않습니다", throw(공개키 조회 실패) → "서버에 연결할 수 없습니다". `reason`이 `LOGIN_NOTICES`에 있으면 폼 위에 안내(amber)를 띄웁니다.
- RegisterForm은 `useRegister`로 가입한 뒤 같은 계정으로 `useLogin` 해서 `/home` 으로 보냅니다. 자동 로그인이 실패하면 `/login`으로 보냅니다. 오류 안내: 400 "이미 가입된 이메일", 401 "서버에서 거절"(UMD public-paths 누락), 502 이상·연결 실패 "일시적으로 연결할 수 없음".
- 사용처: `(auth)/login/page.tsx`, `(auth)/register/page.tsx`, `ReauthModal`

### ReauthModal / SessionActivity — `@/components/auth/ReauthModal`, `@/components/auth/SessionActivity`
```ts
ReauthModal()       // props 없음. Providers 가 {useReauthStore 의 open && <ReauthModal/>} 로 렌더링 (QueryClientProvider 안)
SessionActivity()   // props 없음, 렌더링 없음. Providers 에 한 번
```
- ReauthModal: `apiClient` 가 refresh 로도 401 을 못 넘기면 뜹니다. 안에 `LoginForm(reason="expired", onSuccess)`. 성공 → `settleReauth(true)`(기다리던 요청 재전송), 다른 계정이면 `/home` 으로 새로 엶. 바깥 클릭·✕ → `settleReauth(false)`(요청만 실패, 로그아웃·이동 없음 — 입력을 지키기 위해) → [ADR 0007](../../docs/decisions/0007-cira-session-expiry-and-resume-plan.md)
- SessionActivity: 로그인 상태에서 `pointerdown`·`keydown` 이 있으면 1분에 한 번 `refreshSession(true)` → 유휴 타이머 갱신, accessToken 미리 회전.

### MilestoneCard — `@/components/milestone/MilestoneCard`
```ts
{ milestone: MilestoneResponse; onEdit: (m: MilestoneResponse) => void; onDelete: (id: string) => void; isDeleting?: boolean }
```
- 진행률은 내부에서 `useMilestoneProgress`로 조회합니다. 진행 바 너비에 인라인 style을 씁니다.

### MilestoneModal — `@/components/milestone/MilestoneModal`
```ts
{ projectId: string; editTarget?: MilestoneResponse | null; onClose: () => void; onSuccess?: () => void }
```
- `editTarget`이 있으면 편집 모드, 없으면 생성 모드입니다(생성/편집 겸용 모달 패턴).

### CqlEditor — `@/components/search/CqlEditor`
```ts
{ value: string; onChange: (v: string) => void; onSearch: () => void; placeholder?: string }
```
- 입력 중에 `useCqlValidate`(검증)와 `useCqlAutocomplete`(자동완성)를 호출합니다.
- 자동완성 목록이 열려 있을 때 Tab/Enter를 누르면 항목을 선택하고, **Ctrl+Enter**를 누르면 `onSearch`가 실행됩니다.

### CqlSyntaxGuide — `@/components/search/CqlSyntaxGuide`
```ts
{ onInsert: (query: string) => void }
```
- 예제 쿼리를 클릭하면 `onInsert`로 에디터에 삽입합니다.

## 6. 공통 패턴 (모든 Domain 컴포넌트)

- **모달 props 규약:** `{ ...대상, onClose: () => void; onSuccess?: () => void }`. 열림 상태는 부모가 조건부 렌더링으로 관리합니다. 예외: `mpns`의 popup은 `open` prop을 받습니다.
- **생성/편집 겸용:** `editTarget?: T | null` (VersionModal, MilestoneModal), `rule?: T | null` (AutomationRuleModal)
- **목록 카드 액션:** `onEdit(item)`, `onDelete(id)`, `isDeleting` / `isActioning` 플래그
- **mutation 위치:** 대부분의 모달은 내부에서 mutation 훅을 직접 호출합니다(예: `useCreateSprint`). 예외로 `AutomationRuleModal`은 부모로부터 `onSubmit`과 `isPending`을 받습니다. 재사용성을 높이려면 이 방식이 낫습니다.
