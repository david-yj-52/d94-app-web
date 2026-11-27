# L3 · 화면: Task (CIRA)

> 계층: [L1](../../../../../../../AGENTS.md) › [L2 app](../../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 issues**
> 컴포넌트 카드: [issue](../../../../../../components/issue/AGENTS.md)

## 개요
| URL | 파일 | 설명 |
|---|---|---|
| `/cira/projects/:projectId/issues` | `page.tsx` (135줄) | Task 목록·필터·생성·컬럼 |
| `/cira/projects/:projectId/issues/:issueId` | `[issueId]/page.tsx` (398줄) | Task 상세·인라인 편집·사용자 정의 필드·첨부·연결 문서(Docs)·댓글·삭제 |

- 진입: ProjectCard 클릭(프로젝트의 기본 탭), 셸 사이드바 "Task", 칸반 카드 클릭

## 화면 구성
```
issues/page.tsx
├── PageHeader (프로젝트 / {이름} · "Task" · [+ Task 생성])  → cira 카드
├── IssueFilter (filters 상태는 페이지가 보유) + ColumnPicker(md 이상)  → issue 카드
├── 로딩: SkeletonRow × n / 결과: IssueTable fields·columns·names·sort  → ui · issue 카드
├── {showCreate && <CreateIssueModal/>} + {ToastComponent}
└── 컬럼 만들기·수정 settings/CustomFieldModal · {showLibrary && <FieldLibraryDialog/>} · 컬럼 삭제 Dialog

issues/[issueId]/page.tsx
├── PageHeader (프로젝트 / 이슈 › 제목 = issueKey) + ··· 더보기 Menu(삭제)
├── 좌측 본문
│   ├── 제목: InlineText · 설명: IssueDescription (페이지 내부 — 보기 docs/NoteMarkdown, [편집] 텍스트 영역)
│   ├── AttachmentSection issueId                → issue 카드
│   ├── IssueDocsSection projectId issueId       → issue 카드 (연결 문서 & 계보)
│   └── CommentSection issueId                   → issue 카드
├── 우측 사이드바 (모바일은 본문 위): 상태 드롭다운(Menu, 모바일 sticky) · <details> "세부 정보"(우선순위 select · 담당자/보고자 · 스토리 포인트 · 마감일 · 사용자 정의 필드(CustomFieldInput) · 생성/수정 시각)
└── 삭제 확인: 더보기 [삭제] → `useConfirm`("Task 삭제", 빨간 [삭제]) → 성공 시 목록으로
```

## 데이터
| 훅 | API | queryKey |
|---|---|---|
| `useIssues(projectId, filters)` | `GET /v1/projects/:id/issues` | `["issues", projectId, filters]` |
| `useIssue(issueId)` | `GET /v1/issues/:id` | `["issue", issueId]` |
| `useAvailableTransitions(issueId)` | 전이 가능한 상태 목록 | `["issue-transitions", issueId]` |
| `useCreateIssue` / `useUpdateIssue` / `useUpdateIssueStatus` / `useDeleteIssue` | 생성·수정·상태 변경·삭제 | 위 키 무효화 |
| `useProjectFields(projectId)` | `GET /v1/projects/:id/fields` (유효 필드) | `["project-fields", projectId]` |
| `useColumnPref` / `useSaveColumnPref` | `GET·PUT·DELETE /v1/projects/:id/column-pref` | `["column-pref", projectId]` |
| `useProjectMembers`, `useSprints` | 사용자·스프린트 이름(`names`) | `["projects", projectId, "members"]`, `["sprints", projectId]` |
| `useSaveProjectField`·`useDeleteProjectField`·`useFieldLibrary`·`useImportToProject` | 컬럼 만들기·수정·삭제·라이브러리 가져오기 | `["project-fields", projectId]`, `["field-library", projectId]` |

## 기능 (L4)
### 목록 필터링
- `IssueFilter`가 `filters`를 바꾸면 queryKey가 바뀌어 다시 조회합니다(필터 상태는 페이지가 갖는 controlled 패턴).
### 컬럼 · 정렬
- 표시 컬럼은 사람별(`column-pref`, 서버 저장)입니다. 저장한 적 없으면 타입 세트의 기본 표시 필드, 저장 후에도 관리자가 타입 세트에 새로 넣은 기본 표시 필드는 뒤에 붙습니다(서버 계산). [컬럼] → ColumnPicker, 바꿀 때마다 저장, [기본값으로] = DELETE. 실패하면 오류 토스트.
- `sys:` 헤더를 누르면 `filters.sort = "sys:<key>,asc|desc"` 로 다시 조회합니다(첫 페이지로). 사용자 정의 필드는 정렬하지 않습니다(3단계).
### 컬럼 만들기 · 가져오기 (프로젝트 멤버 누구나)
- [컬럼] → [+ 새 컬럼 만들기] → `CustomFieldModal` → 프로젝트 필드 생성, 성공하면 내 컬럼 끝에 바로 추가.
- [+ 라이브러리에서 가져오기] → `FieldLibraryDialog`(전역 + 이 타입의 필드) → 복사본 생성, 내 컬럼 끝에 추가. 같은 이름이 있으면 서버 400 메시지 토스트.
- 내가 만든(또는 ADMIN 이면 모든) 프로젝트 필드는 [수정]·[삭제] — 삭제는 확인 창, 모든 Task 값도 삭제.
### 작업 공간 · Feature (V650)
- 목록·필드·컬럼은 지금 작업 공간(`?space=`) 기준: `useIssues(projectId, {...filters, spaceId})`, `useProjectFields`·`useColumnPref`·`useSaveColumnPref`·`useSaveProjectField`·`useImportToProject` 에 `spaceId`. Task 생성 모달에도 지금 공간을 넘깁니다.
- 상세 상단에 `공통 Feature › 단위 Feature` 경로(`useFeatures` 트리에서 `featureId` 를 찾음, 각 항목은 그 Feature 상세로 링크).
### Task 생성
- CreateIssueModal에서 생성에 성공하면 "Task가 생성되었습니다." 토스트를 띄웁니다. 필수 사용자 정의 필드는 여기서 받습니다.
### 연결 문서 & 계보 (상세)
- Task 를 만들면 서버가 프로젝트 Team vault `task/{프로젝트키}/{Task키}` 에 메인 Docs 노트를 만들고, 상태·담당자 변경을 그 노트의 `## 진행 경과` 에 한 줄씩 남깁니다. 섹션은 메인 노트 링크, 기준정보 슬롯 버튼(`+ draft` 등, [설정 › 문서 관리](../settings/AGENTS.md))·`+ 자유 문서`(폴더 이름 선택 입력), 계보 트리(`useIssueDocs` → `GET /v1/projects/{id}/issues/{issueId}/docs`)를 보여 줍니다.
- 메인 노트가 없는(배포 전) Task 는 [Docs 문서 생성] → `POST …/docs`. 파생 → `POST …/docs/derive` 후 Docs 캐시 무효화. mock 은 "메인 문서 없음"만.

### 사용자 정의 필드 (상세)
- 세부 정보의 사용자 정의 필드는 blur·선택 즉시 `update({customFields: {[key]: 값}})` 로 저장합니다(빈 값 = 삭제). 타입이 바뀌어 유효 필드에서 빠진 필드는 보이지 않지만 값은 서버에 보관됩니다.
### 인라인 편집 (상세)
- **설명 = Docs 메인 노트 본문**(V650 단일 원본): `GET /issues/{id}` 가 메인 노트의 frontmatter·진행 경과를 뺀 본문을 `content` 로, `mainNoteId` 와 함께 줍니다(옛 CONTENT 만 있던 Task 는 이때 노트로 옮겨짐). 여기서 고치면 백엔드가 메인 노트 본문만 바꿉니다. 라벨 옆 "Docs 에서 열기"(`/docs/{mainNoteId}`) → 버전·링크·파생. 보기는 Docs 와 같은 `NoteMarkdown`(`[[링크]]` → `useOpenNote` 로 메인 노트 vault 안에서 이동, 없는 노트는 흐리게 — `useNote(mainNoteId).links`), 마우스를 올리면 [편집] → 텍스트 영역·[저장][취소].
- 제목, 스토리 포인트는 `InlineText`로 편집합니다. 클릭하면 편집 모드가 되고, blur나 Enter로 저장합니다(`update({field})`).
- 우선순위는 select를 바꾸면 바로 저장되고, 마감일은 date input에서 blur할 때 저장됩니다. 결과는 "저장되었습니다." 또는 "저장에 실패했습니다." 토스트로 알립니다.
### 상태 전이 (워크플로우)
- `useAvailableTransitions`로 **현재 상태에서 갈 수 있는 상태**만 상태 드롭다운 항목으로 보여 줍니다. 버튼 색은 현재 상태의 `category`(`cira/ui/tones`)입니다. 전이 규칙은 [settings/workflow](../settings/AGENTS.md)에서 정의합니다.
### 삭제
- 더보기(···) → 삭제 → 확인 다이얼로그 → 삭제 성공 시 목록으로 이동합니다.
### 댓글 · 첨부
- 섹션 컴포넌트가 각자 처리합니다(멘션, 이모지 반응, 답글, DnD 업로드 50MB(조각 업로드, 초과 시 안내 창), 첨부 파일명 클릭 시 새 탭에서 보기). → [issue 카드](../../../../../../components/issue/AGENTS.md)

## 주의·예외
- `InlineText`가 상세 페이지 안에 정의되어 있습니다. 다른 곳에서도 인라인 편집이 필요하면 `ui/InlineEditable`로 승격하세요.
- 상세 로딩 스켈레톤을 `Skeleton` 컴포넌트 없이 직접 마크업했습니다.
- 담당자는 표시만 되고 변경 UI가 없습니다.
- URL·코드 이름은 `issues`·`IssueXxx` 그대로이고 화면 글자만 'Task' 입니다.
