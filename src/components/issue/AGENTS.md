# L2 · issue 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **issue**
> 사용 화면: [issues](../../app/(main)/projects/[projectId]/issues/AGENTS.md)

### IssueTable — `@/components/issue/IssueTable`
```ts
{ issues: IssueResponse[]; projectId: string }
```
- 이슈 목록 테이블(키, 제목, 상태·우선순위 배지, 담당자, 날짜)입니다. 행을 클릭하면 `/projects/{projectId}/issues/{id}`로 이동합니다. 표현 컴포넌트이며 데이터 조회는 하지 않습니다.

### IssueFilter — `@/components/issue/IssueFilter`
```ts
{ filters: IssueFilterParams; onChange: (filters: IssueFilterParams) => void }
```
- 제어(controlled) 컴포넌트입니다. 필터 상태는 부모가 갖고, 이 컴포넌트는 변경만 알립니다.

### CreateIssueModal — `@/components/issue/CreateIssueModal`
```ts
{ projectId: string; onClose: () => void; onSuccess?: () => void }
```
- react-hook-form + zod 폼이며, 내부에서 `useCreateIssue`를 호출합니다.
```tsx
{showCreate && <CreateIssueModal projectId={projectId} onClose={() => setShowCreate(false)} onSuccess={() => show("이슈가 생성되었습니다.")}/>}
```

### CommentSection — `import {CommentSection} from "@/components/issue/CommentSection"` (named export)
```ts
{ issueId: string }
```
- 자기 완결형(self-contained) 섹션입니다. `issueId`만 넘기면 조회, 작성, 수정, 삭제, 반응까지 모두 처리합니다.
- 기능:
  - 답글
  - `@멘션`: `useMention` + `searchUsers`로 사용자를 자동완성합니다.
  - 이모지 반응: `EmojiPicker`, `useAddReaction` / `useRemoveReaction`
- 파일 안에 내부 하위 컴포넌트가 있습니다: `CommentInput`, `CommentItem`, `EmojiPicker`, `useMention`.
- ⚠️ 625줄로 매우 큽니다. 내부 컴포넌트(특히 `CommentInput`의 멘션 입력)를 재사용하려면 먼저 별도 파일로 분리하세요. 컴포넌트가 `lib/api/users`를 직접 import하는 것도 규칙 예외입니다.

### AttachmentSection — `import {AttachmentSection} from "@/components/issue/AttachmentSection"` (named export)
```ts
{ issueId: string }
```
- 자기 완결형 섹션입니다. 첨부 목록, 드래그 앤 드롭 업로드(진행률 표시), 다운로드, 삭제를 처리합니다.
- 파일당 최대 50MB(`MAX_FILE_SIZE`)입니다. 업로드는 `useUploadAttachment`를 씁니다.
- ⚠️ 진행률 바에 인라인 style을 씁니다. `lib/api/attachments`를 직접 import하는 것도 규칙 예외입니다.

**재사용 메모:** 파일 드롭존과 업로드 진행률 UI는 위키 등 다른 곳에서도 쓸 수 있습니다. `ui/FileDropzone` 승격 후보입니다.
