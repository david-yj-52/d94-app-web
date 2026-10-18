# L2 · wiki 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **wiki**
> 사용 화면: [wiki](../../app/(main)/projects/[projectId]/wiki/AGENTS.md)

모두 표현 컴포넌트입니다. 데이터와 mutation은 `wiki/page.tsx`가 `useWiki` 계열 훅으로 처리하고 콜백을 내려 줍니다.

### WikiTree — `@/components/wiki/WikiTree`
```ts
{ pages: WikiPageSummary[]; selectedId: string | null; onSelect: (id: string) => void;
  onAddPage: (parentId?: string) => void; onDeletePage: (id: string, title: string) => void }
```
- 평평한 목록(`parentId`)을 `buildTree`로 트리로 바꿔 재귀 렌더링합니다(내부 `TreeNode`). 노드마다 하위 페이지 추가와 삭제 버튼이 있습니다.
- ⚠️ 들여쓰기 깊이에 인라인 style을 씁니다.

### WikiViewer — `@/components/wiki/WikiViewer`
```ts
{ page: WikiPageResponse; onEdit: () => void; onShowVersions: () => void }
```
- 저장된 HTML을 `dangerouslySetInnerHTML`로 렌더링합니다.

### WikiEditor — `@/components/wiki/WikiEditor`
```ts
{ initialTitle: string; initialContent: string; onSave: (title: string, content: string) => void; onCancel: () => void; isSaving?: boolean }
```
- **Tiptap**(`useEditor` + `StarterKit`) 리치 텍스트 편집기입니다. 툴바 버튼은 `editor.chain().focus()…` 명령을 사용합니다. 저장 시 HTML 문자열을 넘깁니다.
- 새 리치 텍스트 입력이 필요하면 이 컴포넌트의 툴바와 에디터 부분을 `ui/RichTextEditor`로 승격하는 것을 검토하세요.

### WikiVersionHistory — `@/components/wiki/WikiVersionHistory`
```ts
{ versions: WikiVersionResponse[]; isLoading: boolean; onClose: () => void; onPreview: (v: WikiVersionResponse) => void }
```
- 버전 이력을 보여 주는 사이드 패널입니다. 항목을 클릭하면 `onPreview`로 해당 버전을 미리 봅니다.
