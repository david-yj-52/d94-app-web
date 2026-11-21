# L2 · docs 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **docs**
> 사용 화면: [docs](../../app/(main)/docs/AGENTS.md). 이 모듈 밖에서 import 하지 않습니다.

### DocsSidebar — `@/components/docs/DocsSidebar`
`{ folders: DocsFolder[]; notes: NoteSummary[]; selectedNoteId: string | null; onNewNote: (folderId | null) => void; onNewFolder: (parentId | null) => void; onRenameFolder; onDeleteFolder; onMoveFolder: (folder: DocsFolder) => void }`
- `parentId` 로 폴더 트리, 폴더마다 그 폴더의 노트(제목순). 접힘은 로컬 상태. 폴더 `···` 메뉴(hover 시 표시). 들여쓰기만 인라인 style.

### NoteMarkdown — `@/components/docs/NoteMarkdown`
`{ content: string; existing: Set<string>; onOpenTitle: (title: string) => void }`
- frontmatter 를 뺀 본문을 `react-markdown` 으로 렌더링, `[[링크]]` 는 버튼(없는 노트 회색). typography 플러그인 없이 요소별 Tailwind 클래스. 기본 `urlTransform` 유지(`javascript:` 차단).

### NoteEditor — `@/components/docs/NoteEditor`
`{ initialTitle: string; initialContent: string; saving?: boolean; onSave: (title, content) => void; onCancel: () => void }` — 제목 + textarea, ⌘/Ctrl+S, 미리보기 토글.

### NoteSidePanel — `@/components/docs/NoteSidePanel`
`{ note: Note; backlinks: NoteSummary[]; derived: NoteSummary[]; onOpenTitle; onShowVersions: () => void }` — 속성(종류·트랙·원본·버전)·태그·백링크·파생 노트.

### NoteVersionHistory — `@/components/docs/NoteVersionHistory`
`{ versions: NoteVersion[]; isLoading: boolean; selected: number | null; onPreview: (v) => void; onClose: () => void }` — 최신 먼저.

### QuickSwitcher — `@/components/docs/QuickSwitcher`
`{ onOpenTitle: (title: string) => void; onClose: () => void }` — 내부에서 `useNoteTitles(prefix)`. ↑↓·Enter·Esc, 없으면 "만들기" 항목.

### FolderPickerModal — `@/components/docs/FolderPickerModal`
`{ title: string; folders: DocsFolder[]; disabledIds?: Set<string>; initial: string | null; onPick: (folderId | null) => void; onClose: () => void }` — 들여쓴 폴더 목록 + 최상위.

### DocsDialog — `@/components/docs/DocsDialog`
`{ spec: DocsDialogSpec; onClose }`, `DocsDialogSpec = { title; message?; input?: {initial?, placeholder?}; confirmLabel; danger?; onConfirm: (value) => void }` — 이름 입력·삭제 확인 겸용(브라우저 `prompt`·`confirm` 대신, 표준 모달 마크업). ⬆ `ConfirmDialog` primitive 가 생기면 교체.

### useOpenNote — `@/components/docs/useOpenNote`
`() => (title: string, folderId?: string | null) => Promise<void>` — 제목으로 찾아 이동, 없으면 만들고 `?edit=1` 로 이동. 목록은 `useNotes()` 캐시(서버 최대 500건).
