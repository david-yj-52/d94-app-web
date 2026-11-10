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
| ApHeader | `layout/ApHeader` | 상단 헤더 (로고·검색·알림·사용자) | `(main)/layout.tsx` | ✅ |
| GlobalSearch | `layout/GlobalSearch` | 헤더 빠른 이슈 검색 | ApHeader, CiraShell | ✅ |
| NotificationBell | `layout/NotificationBell` | 헤더 알림 드롭다운 | ApHeader, CiraShell | ✅ |
| NotificationMount | `layout/NotificationMount` | 알림 폴링 마운트 | `(main)`·`(cira)` layout | ✅ |
| Providers | `Providers` | QueryClient + SessionProvider | `app/layout.tsx` | ✅ |
| TshLogo | `TshLogo` | 브랜드 로고 | (auth) layout, ApHeader, `app/page.tsx` | 🔁 |
| AddTodoForm / TodoItem | `AddTodoForm`, `TodoItem` | todo 입력·항목 | `/todo` | 🧪 |
| AuthCheck / LoginButton | `AuthCheck`, `LoginButton` | 초기 인증 데모 | — | ⛔ |
| StatusLozenge, IssueTypeIcon, PriorityIcon, Avatar | `cira/ui/Badges` | CIRA 상태 배지·유형·우선순위 아이콘·아바타 | CIRA 셸·화면 | ✅ |
| PageHeader | `cira/ui/PageHeader` | CIRA 화면 머리(경로·제목·버튼) | CIRA 화면 | ✅ |
| Dialog | `cira/ui/Dialog` | Radix 모달 (모바일 전체 화면·왼쪽 서랍) | CIRA 셸·화면 | ✅ |
| Menu | `cira/ui/Menu` | Radix 드롭다운 메뉴 | CIRA 셸·화면 | ✅ |
| CiraShell › CiraSidebar, CreateIssueButton | `cira/shell/*` | CIRA 셸 (상단 바·통합 사이드바·모바일 서랍·이슈 만들기) | `(cira)/cira/layout.tsx` | ✅ |

### Domain
| 폴더 | 컴포넌트 | 용도 | 사용처 | 카드 |
|---|---|---|---|---|
| auth | LoginForm, RegisterForm | 로그인·회원가입 폼 (react-hook-form + zod) | `/login`, `/register` | §5 |
| board | KanbanBoard › KanbanColumn › KanbanCard | 칸반 보드 (HTML5 DnD) | `boards/[boardId]` | [board](board/AGENTS.md) |
| board | CreateBoardModal, AddColumnModal | 보드 생성, 컬럼 추가·편집 | `boards`, KanbanBoard | [board](board/AGENTS.md) |
| issue | IssueTable, IssueFilter, CreateIssueModal | 이슈 목록·필터·생성 | `issues` | [issue](issue/AGENTS.md) |
| issue | CommentSection, AttachmentSection | 댓글(멘션·이모지·답글)·첨부(DnD 업로드) | `issues/[issueId]` | [issue](issue/AGENTS.md) |
| interfaceTest | InterfaceRequestPanel, InterfaceCallLog, InterfaceItemTable, MethodBadge | REST 메서드별 통신 확인 (요청 폼·호출 기록·DB 목록) | `/interface-test` 🧪 | [interfaceTest](interfaceTest/AGENTS.md) |
| study | DocumentList, UploadDropzone, TocTree, PageView, SelectionToolbar, AnnotationPopover, TermEditModal, TermsPanel, NoteList | PDF 학습 뷰어 (업로드·목차·본문 렌더링·마킹·단어장·노트) | `/study/**` 🧪 | [study](study/AGENTS.md) |
| milestone | MilestoneCard, MilestoneModal | 마일스톤 카드·생성/편집 | `versions` | §5 |
| mpns | PlatformTable, ProductTable, DetailPanel, PlatformAddPopup, ProductAddPopup | MPMS 마스터-디테일 | `/mpms` 🧪 | [mpns](mpns/AGENTS.md) |
| project | ProjectCard, CreateProjectModal | 프로젝트 카드·생성 | `/cira/projects` | [project](project/AGENTS.md) |
| project/settings | MemberTable, AddMemberModal | 멤버 관리 | `settings/*` | [project](project/AGENTS.md) |
| project/settings/automation | AutomationRuleCard, AutomationRuleModal | 자동화 규칙 | `settings/automation` | [project](project/AGENTS.md) |
| search | CqlEditor, CqlSyntaxGuide | CQL 입력기(자동완성·검증)·문법 가이드 | `search/advanced` | §5 |
| sprint | CreateSprintModal, EditSprintModal, AssignIssueModal, CompleteSprintModal | 스프린트 생성·편집·이슈 할당·완료 | `sprints` | [sprint](sprint/AGENTS.md) |
| version | VersionCard › ReleaseNotesModal, VersionModal | 버전 카드·릴리즈 노트·생성/편집 | `versions` | [version](version/AGENTS.md) |
| wiki | WikiTree, WikiViewer, WikiEditor, WikiVersionHistory | 위키 트리·보기·Tiptap 편집·이력 | `wiki` | [wiki](wiki/AGENTS.md) |

## 5. 작은 폴더 카드 (auth · milestone · search)

### LoginForm / RegisterForm — `@/components/auth/LoginForm`, `@/components/auth/RegisterForm`
```ts
LoginForm(props: { reason?: string })   // reason = /login?reason=… (LOGIN_NOTICES 키, 예 "expired")
RegisterForm()                          // props 없음
```
- react-hook-form + zod로 검증합니다.
- 두 폼 모두 비밀번호를 **암호화한 뒤에만** 전송합니다(ADR 0004). `signIn`을 직접 부르지 말고 `useLogin`을 쓰세요.
- LoginForm은 `useLogin`(`hooks/useAuth`)을 호출합니다. 결과 false → "이메일 또는 비밀번호가 올바르지 않습니다", throw(공개키 조회 실패) → "서버에 연결할 수 없습니다". `reason`이 `LOGIN_NOTICES`에 있으면 폼 위에 안내(amber)를 띄웁니다.
- RegisterForm은 `useRegister`로 가입한 뒤 같은 계정으로 `useLogin` 해서 `/home` 으로 보냅니다. 자동 로그인이 실패하면 `/login`으로 보냅니다. 오류 안내: 400 "이미 가입된 이메일", 401 "서버에서 거절"(UMD public-paths 누락), 502 이상·연결 실패 "일시적으로 연결할 수 없음".
- 사용처: `(auth)/login/page.tsx`, `(auth)/register/page.tsx`

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
