# L3 · 화면: 프로젝트 설정 (CIRA)

> 계층: [L1](../../../../../../../AGENTS.md) › [L2 app](../../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 settings**
> 컴포넌트 카드: [project (settings, automation)](../../../../../../components/project/AGENTS.md)

## 개요
| URL | 파일 | 설명 |
|---|---|---|
| `/cira/projects/:id/settings` | `page.tsx` | 기본 정보 (이름·설명·프로젝트 타입 수정, 키는 변경 불가) |
| `…/settings/fields` | `fields/page.tsx` | 타입에서 물려받은 필드(잠김) · 이 프로젝트에 추가한 필드(순서·제거·출처) · 프로젝트 필드 생성·라이브러리 가져오기·수정·삭제 |
| `…/settings/members` | `members/page.tsx` | 멤버 목록·추가·역할 변경·제거 |
| `…/settings/workflow` | `workflow/page.tsx` (335줄) | 상태 추가·삭제, 상태 전이 매트릭스 |
| `…/settings/git` | `git/page.tsx` (329줄) | Git 저장소 연동·Webhook 정보·최근 활동 |
| `…/settings/automation` | `automation/page.tsx` | 자동화 규칙 목록·생성·편집 |

- 진입: 셸 사이드바의 "프로젝트 설정". **ADMIN 멤버에게만 탭이 보입니다.** 다만 URL로 직접 들어오는 것은 막지 않습니다.

## 화면 구성
```
settings/layout.tsx
├── PageHeader (프로젝트 / {이름} · "프로젝트 설정")
├── (설정 메뉴는 CIRA 셸 사이드바: 기본 정보 / 필드 / 멤버 / 워크플로우 / Git 연동 / 자동화)
└── {children}
    ├── (기본)     폼: 이름·설명·타입 select + [저장]  (react-hook-form)
    ├── fields     물려받은 필드 칩 · 추가 필드 목록 · [+ 제공 필드 추가] select(기본 필드만) · [+ 라이브러리에서 가져오기] → issue/FieldLibraryDialog · [+ 새 필드 만들기] → settings/CustomFieldModal · 삭제 Dialog
    ├── members    MemberTable + {showAdd && <AddMemberModal/>}           → project 카드
    ├── workflow   AddStatusForm · 상태 목록 · TransitionMatrix (페이지 내부 컴포넌트)
    ├── git        저장소 목록 · 등록 폼 · WebhookModal · CopyButton · 최근 활동 (페이지 내부 컴포넌트)
    └── automation AutomationRuleCard × n + {modalOpen && <AutomationRuleModal/>}  → project 카드
```
**layout에 사이드 내비를 두는 패턴**입니다(reports는 상단 서브탭, settings는 좌측 사이드).

## 데이터
| 화면 | 훅 | queryKey |
|---|---|---|
| 기본 | `useProject`, `useUpdateProject`, `useProjectTypes` | `["projects", projectId]`, `["project-types"]` |
| fields | `useProjectFields`, `useFieldCatalog`, `useReplaceProjectFields`, `useSave/DeleteProjectField`, `useFieldLibrary`, `useImportToProject` | `["project-fields", projectId]`, `["field-catalog"]`, `["field-library", projectId]` |
| members | `useProjectMembers`, `useAdd/UpdateRole/RemoveProjectMember` | `["projects", projectId, "members"]` |
| workflow | `useWorkflowStatuses`, `useCreate/DeleteWorkflowStatus`, `useWorkflowTransitions`, `useUpdateWorkflowTransitions` | `[…, "workflow", "statuses" \| "transitions"]` |
| git | `useGitRepos`, `useRegister/DeleteGitRepo`, `useGitActivity` | `["git-repos", projectId]`, `["git-activity", projectId]` |
| automation | `useAutomationRules`, `useCreate/UpdateAutomationRule`, (카드) `useDeleteAutomationRule`, `useRuleExecutions` | `["automation-rules", projectId]` |

## 기능 (L4)
### 기본 정보
- 이름(필수)·설명·프로젝트 타입(`projectTypeId`)을 수정합니다. 프로젝트 키는 읽기 전용입니다. 타입을 바꾸면 물려받는 필드 세트가 통째로 바뀌고, 빠진 필드의 값은 보관됩니다. 저장 결과는 토스트로 알립니다.
### 필드
- 타입이 물려준 필드(고정 4개 포함)는 끌 수 없습니다 — 바꾸려면 기준정보 › CIRA. 목록에서 숨기는 것은 각자 Task 목록의 [컬럼]입니다.
- 추가 필드: 기본 필드를 고르거나(`replaceProjectFields`, 전체 교체), 라이브러리(전역 + 이 타입의 필드)에서 가져오거나(복사본 생성), 프로젝트 필드를 새로 만듭니다(만들면 바로 추가 필드). 위/아래로 순서, 기본 필드는 [제거], 사용자 정의 필드는 `canEdit`(만든 사람·프로젝트 ADMIN)일 때만 [수정]·[삭제] — 모든 Task 의 값도 삭제, 확인 다이얼로그. 가져온 필드는 "'원본'에서 가져옴"(원본이 지워졌으면 "원본 삭제됨"). 서버 오류 메시지는 토스트로.
### 멤버
- 현재 사용자가 ADMIN일 때만 역할 변경과 제거를 할 수 있습니다(`isAdmin` prop). MemberTable은 결과 메시지를 `onSuccess`/`onError`로 페이지에 넘기고, 페이지가 토스트를 띄웁니다.
### 워크플로우
- **상태:** 이름과 카테고리로 추가하고, `confirm()`으로 확인한 뒤 삭제합니다.
- **전이 매트릭스:** from 상태 × to 상태 체크박스로 허용할 전이를 정하고 한 번에 저장합니다(`enabledPairs`). 여기서 정한 규칙이 [이슈 상세](../issues/AGENTS.md)의 상태 버튼을 결정합니다.
- ADMIN만 편집할 수 있습니다.
### Git 연동
- 저장소를 등록합니다. 입력은 provider(GITHUB/GITLAB), 저장소 이름, URL, access token입니다.
- 등록한 저장소의 Webhook URL과 secret을 모달로 보여 주고, 복사 버튼을 제공합니다. 최근 커밋과 PR 활동 목록도 보여 줍니다.
### 자동화
- 규칙은 트리거와 액션으로 이루어집니다(`TRIGGER_LABEL`, `ACTION_LABEL`). 카드에서 편집, 삭제, 실행 이력을 확인할 수 있습니다.
- 생성과 편집은 같은 모달에서 하며, mutation은 페이지가 `onSubmit`으로 처리합니다.

## 주의·예외
- automation과 git 페이지는 `lib/api`를 직접 import합니다(타입·상수 목적 포함).
- 삭제 확인에 브라우저 `confirm()`을 씁니다(git, workflow, MemberTable, AutomationRuleCard).
- git과 workflow 페이지는 300줄이 넘고 내부 컴포넌트를 여러 개 가지고 있습니다. 분리 대상입니다.
