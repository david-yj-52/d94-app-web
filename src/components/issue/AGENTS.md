# L2 · issue 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **issue**
> 사용 화면: [issues](../../app/(cira)/cira/projects/[projectId]/issues/AGENTS.md)

### IssueTable — `@/components/issue/IssueTable`
```ts
{ issues: IssueResponse[]; projectId?: string; emptyText?: string;
  fields?: FieldDef[]; columns?: string[]; names?: Record<string, string>; sort?: string; onSort?: (sort: string) => void;
  spaceNames?: Record<string, string> }
```
- `spaceNames`(spaceId → 이름)가 있으면 고정 컬럼에서 키 다음에 "공간" 열, 모바일 카드에는 "공간: 이름" 줄(모르는 공간·없음은 `-`). 동적 컬럼 모드에서는 무시. 사용처: 프로젝트 통합 Task 목록.
- `fields`·`columns` 가 있으면 `columns` 순서대로 컬럼을 그립니다(유효 필드에 없는 키는 건너뜀, 값은 `FieldValue`). 없으면 고정 컬럼(유형·키·요약·상태 배지·우선순위·담당자·수정일) — 검색 결과처럼 여러 프로젝트가 섞인 곳.
- `onSort` 가 있으면 `sortable`(sys:) 헤더가 버튼입니다. 누르면 `"sys:<key>,asc"`, 같은 헤더를 다시 누르면 `desc`. `names` = userId·sprintId → 이름. 공통 Feature 에 연결된 Task 는 요약 앞에 `CommonFeatureBadge`, `sort` 가 없으면 이 페이지 안에서 먼저(설계 3.2, `useCommonFeatures` — 그래서 QueryClient 필요). 테스트 `IssueTable.test.tsx`.
- `md` 이상은 표, 모바일은 카드 목록(표시 컬럼 중 앞의 사용자 정의 필드 두 개를 한 줄로 추가). 행을 누르면 `/cira/projects/{projectId ?? issue.projectId}/issues/{id}`로 이동합니다. `projectId` 를 생략하면 이슈마다 자기 프로젝트로 갑니다(검색 결과). 표현 컴포넌트이며 데이터 조회는 하지 않습니다.
- 사용처: 프로젝트 이슈 목록, `/cira/search`, `/cira/search/advanced`

### IssueFilter — `@/components/issue/IssueFilter`
```ts
{ filters: IssueFilterParams; onChange: (filters: IssueFilterParams) => void }
```
- 제어(controlled) 컴포넌트입니다. 필터 상태는 부모가 갖고, 이 컴포넌트는 변경만 알립니다.

### CreateIssueModal — `@/components/issue/CreateIssueModal`
```ts
{ projectId: string; spaceId?: string; onClose: () => void; onSuccess?: () => void }
```
- react-hook-form + zod 폼이며, 내부에서 `useCreateIssue`를 호출합니다.
- V650: 작업 공간(`useSpaces`, 기본 = `spaceId` prop 또는 기본 공간)·유형(`useIssueTypes`, 비우면 Issue)·Feature. 유형이 `Feature` 면 [공통 Feature] 체크(→ `featureScope: "COMMON"`, 공간 선택 잠김), 아니면 `UNIT`. Feature 선택지(`useFeatures`): Task = 공통 + 같은 공간 단위, 단위 Feature = 공통만, 공통 Feature = 없음. 상태·필수 필드는 고른 공간 기준(공통 Feature 는 기본 공간 워크플로). 설명은 Team Docs 메인 문서의 첫 본문이 됩니다.
- 프로젝트 유효 필드(`useProjectFields`) 중 **필수 사용자 정의 필드만** `CustomFieldInput` 으로 받아 `customFields` 로 보냅니다. 비어 있으면 "{이름} 값을 입력해주세요." 를 보이고 요청하지 않습니다. 나머지 필드는 상세에서 입력합니다.
- 담당자는 `useProjectMembers` 목록에서 고르고 `userId` 를 `assigneeId` 로 보냅니다. `statusId` 는 `useWorkflowStatuses` 의 sortOrd 최솟값입니다. 우선순위·스토리 포인트는 비우면 보내지 않습니다.
- ⚠️ 남은 결함(`it.fails`): `issueTypeId` 를 보내지 않아 실제 d94-query 에서는 **여전히 500** 입니다(백엔드에 이슈 유형 목록 API 가 없음). 설명(content)이 255자를 넘으면 백엔드 저장이 실패합니다(varchar(255)) → [test-report](../../../docs/test-report.md)
```tsx
{showCreate && <CreateIssueModal projectId={projectId} onClose={() => setShowCreate(false)} onSuccess={() => show("이슈가 생성되었습니다.")}/>}
```

### FeatureTree — `@/components/issue/FeatureTree`
```ts
{ projectId: string; nodes: FeatureNode[]; spaces: Space[] }
```
- 2단계 Feature 트리(서버 순서 그대로 — 공통이 먼저). 행 = 배지(공통 / 공간 이름)·키·제목·`Task {taskCount}`·상태, 공통 아래 단위 Feature 는 들여쓴 하위 목록. 행 → Task 상세. 표현 컴포넌트. 사용처: `features` 화면.

### ColumnPicker — `@/components/issue/ColumnPicker`
```ts
{ fields: FieldDef[]; columns: string[]; onChange: (keys: string[] | null) => void;
  onCreate?: () => void; onImport?: () => void; onEdit?: (f: FieldDef) => void; onDelete?: (f: FieldDef) => void }
```
- [컬럼] 버튼 → `ui/Dialog`. 체크로 표시·숨김, 위/아래로 순서. 바꿀 때마다 `onChange(keys)`(부모가 바로 저장), [기본값으로] = `onChange(null)`. `sys:key`·`sys:summary` 는 끌 수 없습니다.
- 아래쪽 [+ 새 컬럼 만들기]·[+ 라이브러리에서 가져오기] 는 창을 닫고 `onCreate`·`onImport`(부모가 창을 엶). `canEdit` 인 프로젝트 필드 행에만 [수정]·[삭제] → `onEdit`·`onDelete`. 테스트 `ColumnPicker.test.tsx`.

### FieldLibraryDialog — `@/components/issue/FieldLibraryDialog`
```ts
{ items: LibraryItem[]; onImport: (sourceFieldId: string) => void; isPending?: boolean; onClose: () => void }
```
- 가져올 수 있는 필드를 "전역 필드"·"이 타입의 필드" 로 나눠 보여 줍니다. [가져오기] → `onImport(원본 id)`, 이미 가져온 항목(`importedAs`)은 "가져옴" 비활성. 사용처: Task 목록, 프로젝트 설정 › 필드.

### FieldValue — `@/components/issue/FieldValue`
```ts
{ field: FieldDef; issue: IssueResponse; names?: Record<string, string> }   // + export isNumeric(field)
```
- 필드 하나의 읽기 전용 값. sys 필드는 `IssueResponse` 속성, cf 는 `issue.customFields[fieldKey]` 를 타입별로(숫자 `ko-KR`, 날짜, 선택 칩, 사용자 이름, URL 새 탭, 체크 ✓).

### CustomFieldInput — `@/components/issue/CustomFieldInput`
```ts
{ field: FieldDef; value: CustomFieldValue | undefined; onChange: (v: CustomFieldValue) => void; members?: ProjectMemberResponse[]; id?: string }
```
- 사용자 정의 필드 타입별 입력. 텍스트·숫자·URL·날짜는 blur 때, 선택·체크는 바로 `onChange`. 빈 값은 `null`(서버에서 값 삭제). 사용처: CreateIssueModal(필수만), Task 상세 세부 정보.

### IssueDocsSection — `import {IssueDocsSection} from "@/components/issue/IssueDocsSection"` (named export)
```ts
{ projectId: string; issueId: string }
```
- 자기 완결형 섹션. `useIssueDocs` 로 메인 Docs 노트·파생 문서·계보·슬롯을 받아, 메인 노트 링크(`/docs/{noteId}`), 슬롯 버튼(`+ {folderName}`)·`+ 자유 문서` → 인라인 폼(제목, 자유면 폴더 이름) → `useDeriveIssueDoc`, 계보(origin 제목으로 이은 들여쓴 트리, 깊이만 인라인 style)를 그립니다. 메인 노트가 없으면 [Docs 문서 생성] 버튼 → `useEnsureIssueMainDoc`. 오류는 토스트(`docsError`).

### CommentSection — `import {CommentSection} from "@/components/issue/CommentSection"` (named export)
```ts
{ issueId: string }
```
- 자기 완결형(self-contained) 섹션입니다. `issueId`만 넘기면 조회, 작성, 수정, 삭제, 반응까지 모두 처리합니다. 댓글 삭제 확인은 `ui/ConfirmDialog` 의 `useConfirm`("댓글 삭제") 이고, 삭제 중에는 [삭제] 가 비활성입니다.
- 기능:
  - 답글
  - `@멘션`: `useMention` + `searchUsers`로 사용자를 자동완성합니다.
  - 이모지 반응: `EmojiPicker`, `useToggleReaction` (같은 POST 로 추가·취소)
- 파일 안에 내부 하위 컴포넌트가 있습니다: `CommentInput`, `CommentItem`, `EmojiPicker`, `useMention`.
- ⚠️ 625줄로 매우 큽니다. 내부 컴포넌트(특히 `CommentInput`의 멘션 입력)를 재사용하려면 먼저 별도 파일로 분리하세요. 컴포넌트가 `lib/api/users`를 직접 import하는 것도 규칙 예외입니다.

### AttachmentSection — `import {AttachmentSection} from "@/components/issue/AttachmentSection"` (named export)
```ts
{ issueId: string }
```
- 자기 완결형 섹션입니다. 첨부 목록, 드래그 앤 드롭 업로드(진행률 표시), 보기·다운로드, 삭제를 처리합니다.
- 파일명을 누르면 새 탭에서 바로 봅니다(`getDownloadUrl` = `/api/attachments/{id}` — Range 로 4MB씩 받아 잇는 라우트, 백엔드가 `Content-Disposition: inline` + UTF-8 파일명으로 내려 줌 — 이미지·PDF·텍스트는 브라우저가 표시, 그 외 형식은 저장). 다운로드 아이콘은 `<a download>`로 항상 저장합니다.
- 파일당 최대 50MB(`MAX_FILE_SIZE`, 백엔드 상한과 같음)입니다. 업로드는 768KB 조각(`useUploadAttachment`), 다운로드는 4MB Range 로 UMD 상한(요청 1MB·응답 5MB)을 넘깁니다. 넘는 파일은 올리지 않고 `ui/Dialog` "파일 크기 제한" 창에 이름·크기를 보여 주며, 나머지 파일은 그대로 올립니다. 테스트 `AttachmentSection.test.tsx`. 업로드는 `useUploadAttachment`를 씁니다.
- ⚠️ 진행률 바에 인라인 style을 씁니다. `lib/api/attachments`를 직접 import하는 것도 규칙 예외입니다.

**재사용 메모:** 파일 드롭존과 업로드 진행률 UI는 위키 등 다른 곳에서도 쓸 수 있습니다. `ui/FileDropzone` 승격 후보입니다.
