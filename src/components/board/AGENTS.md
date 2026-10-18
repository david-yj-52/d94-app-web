# L2 · board 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **board**
> 사용 화면: [boards](../../app/(main)/projects/[projectId]/boards/AGENTS.md)

구성: `KanbanBoard` → `KanbanColumn` → `KanbanCard`. 드래그 앤 드롭은 라이브러리 없이 **HTML5 Drag and Drop API**로 직접 구현했습니다.

### KanbanBoard — `@/components/board/KanbanBoard`
```ts
{ boardId: string; projectId: string }
```
- 보드 상세를 조회하고(`useBoardDetail`), 이슈 이동(`useMoveIssue`), 컬럼 삭제(`useDeleteColumn`), 보드 삭제(`useDeleteBoard`)를 처리합니다.
- 드래그 상태(드래그 중인 이슈, 드롭 대상 컬럼, 삽입 위치)를 이 컴포넌트가 들고 있다가 하위 컬럼에 props로 내려 줍니다.
- 컬럼 추가·편집 시 `AddColumnModal`을 엽니다.
```tsx
<KanbanBoard boardId={boardId} projectId={projectId}/>
```

### KanbanColumn — `@/components/board/KanbanColumn` (KanbanBoard 내부 전용)
```ts
{ column: BoardColumnResponse; projectId: string; isDragOver: boolean; draggingIssueId: string | null; dropBeforeIssueId: string | null;
  onDrop; onDragOver; onDragLeave; onIssueDragStart; onIssueDragOver;   // (e: React.DragEvent, ...) => void
  onEditColumn?: (column) => void; onDeleteColumn?: (columnId: string) => void }
```
- 표현(presentational) 컴포넌트입니다. 상태가 없고 이벤트만 위로 전달합니다.

### KanbanCard — `@/components/board/KanbanCard` (KanbanColumn 내부 전용)
```ts
{ issue: BoardIssueResponse; projectId: string; isDragging: boolean; showDropBefore: boolean;
  onDragStart: (e) => void; onDragOver: (e, issueId: string) => void }
```
- 이슈 카드입니다. 클릭하면 이슈 상세로 이동합니다. `showDropBefore`가 true면 카드 위에 삽입 위치선이 표시됩니다.

### CreateBoardModal — `@/components/board/CreateBoardModal`
```ts
{ projectId: string; onClose: () => void; onSuccess?: (boardId: string) => void }
```
- 생성에 성공하면 `onSuccess(newBoardId)`를 호출하고, 부모가 새 보드로 이동합니다.
- 사용처: `boards/page.tsx`(보드가 없을 때), `boards/[boardId]/page.tsx`

### AddColumnModal — `@/components/board/AddColumnModal`
```ts
{ boardId: string; editingColumn?: BoardColumnResponse; onClose: () => void; onSuccess?: () => void }
```
- `editingColumn`이 있으면 편집, 없으면 추가합니다(겸용 모달). 사용처는 KanbanBoard입니다.

**재사용 메모:** DnD 로직(드래그 상태와 드롭 위치 계산)이 KanbanBoard에 묶여 있습니다. 다른 화면에서 DnD 정렬이 필요하면 `useDragSort` 같은 훅으로 추출하는 것을 검토하세요.
