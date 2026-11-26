# L2 · docs 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **docs**
> 사용 화면: [docs](../../app/(main)/docs/AGENTS.md), [docs/tasks](../../app/(main)/docs/tasks/AGENTS.md). 이 모듈 밖에서 import 하지 않습니다.

### DocsSidebar — `@/components/docs/DocsSidebar`
`{ vaults: DocsVault[]; folders: DocsFolder[]; notes: NoteSummary[]; selectedNoteId: string | null; onNewNote: (folderId | null, vaultId: string) => void; onNewFolder: (parentId | null, vaultId: string) => void; onRenameFolder; onDeleteFolder; onMoveFolder: (folder: DocsFolder) => void }`
- `vaults` 마다 섹션(🔒 Private · 👥 Team 이름, 접기, 섹션별 [새 노트][새 폴더])을 그리고, 그 안에 `vaultId` 가 같은 폴더·노트만. `parentId` 로 폴더 트리, 폴더마다 그 폴더의 노트(제목순). 접힘은 로컬 상태. 폴더 `···` 메뉴(hover 시 표시). 들여쓰기만 인라인 style.

### NoteMarkdown — `@/components/docs/NoteMarkdown`
`{ content: string; existing: Set<string>; onOpenTitle: (title: string) => void }`
- frontmatter 를 뺀 본문을 `react-markdown` + `remark-gfm`(표·취소선·체크박스)으로 렌더링, `[[링크]]` 는 버튼(없는 노트 회색). typography 플러그인 없이 요소별 Tailwind 클래스. 기본 `urlTransform` 유지(`javascript:` 차단).
- ``` 코드 블록은 `CodeBlock`(언어 하이라이트), ```mermaid 는 `MermaidDiagram`. 이미지는 `max-h-[32rem]`·lazy.

### CodeBlock — `@/components/docs/CodeBlock`
`{ code: string; language: string | null }` — `highlight.js/lib/core` 에 bash·css·go·java·javascript·json·kotlin·python·sql·typescript·xml·yaml(+별칭) 만 등록. 모르는 언어는 평문.

### MermaidDiagram — `@/components/docs/MermaidDiagram`
`{ code: string }` — `mermaid` 를 처음 쓸 때 dynamic import, `securityLevel: "strict"` 로 SVG 생성. 문법 오류면 오류 문구 + 원문.

### NoteEditor — `@/components/docs/NoteEditor`
`{ note: Note; fetchTitles: (prefix: string) => Promise<string[]>; uploadImage: (blob: Blob) => Promise<string>; onError: (message: string) => void; onDone: () => void }`
- CodeMirror 6 + `livePreview`(입력 즉시 Markdown 스타일, 커서 밖 줄은 기호 숨김·이미지 표시) + 코드 블록 언어별 하이라이트(`@codemirror/language-data`) + GFM.
- 본문은 `useNoteAutosave` 로 자동 저장, 제목은 입력란을 떠나거나 Enter 때 저장(이름 변경 = 링크 치환이라 입력 중에는 보내지 않음). ⌘/Ctrl+S 바로 저장, "완료" = 남은 입력 저장 후 `onDone`. 저장 상태 표시(`aria-live`).
- IndexedDB 초안이 서버 내용과 다르면 위에 "복원/버리기" 배너.
- 이미지 붙여넣기: `shrinkImage`(1MB 이하) → `uploadImage` → 자리표시(업로드 중…)를 이미지 Markdown(대체 텍스트 "이미지" + 업로드 주소)으로 교체. `[[` 자동완성은 같은 파일의 `wikilinkCompletion`.

### livePreview — `@/components/docs/livePreview`
`markdownStyle`(HighlightStyle: 제목 크기·굵게·기울임·취소선·링크·코드 토큰 색), `livePreview`(ViewPlugin: 선택이 없는 줄의 HeaderMark·EmphasisMark·StrikethroughMark·인라인 CodeMark·링크의 대괄호와 주소 부분 숨김, 이미지 문법(같은 사이트 경로나 https 주소) → 이미지 위젯), `editorTheme`.

### useNoteAutosave — `@/components/docs/useNoteAutosave`
`(note: Note, onError: (message) => void) => { state: SaveState; change: (title, content) => void; flush: () => Promise<boolean> }`
- `SaveState = saved | pending | saving | offline | conflict | error`. 입력이 멈추고 1.5초 뒤 저장(`useAutosaveNote`), 요청은 하나씩·진행 중 입력은 끝난 뒤 이어서, 버전은 응답으로 따라감.
- 409 `DOCS_VERSION_CONFLICT` → conflict(재시도 없음), 그 밖 4xx → error + `onError`, 네트워크·5xx → offline + 10초 뒤 재시도.
- 바뀔 때마다 IndexedDB 초안(300ms 디바운스), 그 내용까지 서버에 저장되면 초안 삭제. 저장 안 된 채 탭을 닫으면 경고, 화면을 떠날 때 남은 입력 전송. 테스트 `useNoteAutosave.test.ts`.

### NoteSidePanel — `@/components/docs/NoteSidePanel`
`{ note: Note; backlinks: NoteSummary[]; derived: NoteSummary[]; onOpenTitle; onShowVersions: () => void; onTaskStatus: (lineNo, status: TaskStatus) => void; onPromoteTask: (lineNo) => void }` — 속성(종류·트랙·원본·버전)·태그·Task(본문 `extractTasks`, 체크박스·hover 시 "노트로 만들기", 이미 `[[링크]]` 인 줄은 버튼 없음)·백링크·파생 노트.

### DeriveModal — `@/components/docs/DeriveModal`
`{ originTitle: string; saving?: boolean; onSubmit: (req: DeriveRequest) => void; onClose: () => void }` — 파생(브로드캐스트·결과 문서) 노트의 제목·트랙(datalist dev·design·knowledge)·종류(기본 문서).

### PromoteToCiraModal — `@/components/docs/PromoteToCiraModal`
`{ noteTitle: string; projects: {id, label}[]; issueTypes: {id, label}[]; saving?: boolean; onSubmit: (req: {projectId, issueTypeId, title}) => void; onClose: () => void }` — 노트 → CIRA Task: 프로젝트·Task 타입·제목(기본 노트 제목). 표현 컴포넌트(목록·저장은 부모). 프로젝트가 없으면 안내만.

### TaskBoard — `@/components/docs/TaskBoard`
`{ tasks: DocsTask[]; onStatus: (task: DocsTask, status: TaskStatus) => void }` — 할 일·진행 중·완료 3열, 카드 = 내용·원 노트 링크·마감·상태 선택. 사용: [docs/tasks](../../app/(main)/docs/tasks/AGENTS.md)

### NoteVersionHistory — `@/components/docs/NoteVersionHistory`
`{ versions: NoteVersion[]; isLoading: boolean; selected: number | null; onPreview: (v) => void; onClose: () => void }` — 최신 먼저.

### QuickSwitcher — `@/components/docs/QuickSwitcher`
`{ onOpenTitle: (title: string) => void; onClose: () => void }` — 내부에서 `useNoteTitles(prefix)`. ↑↓·Enter·Esc, 없으면 "만들기" 항목.

### FolderPickerModal — `@/components/docs/FolderPickerModal`
`{ title: string; folders: DocsFolder[]; disabledIds?: Set<string>; initial: string | null; onPick: (folderId | null) => void; onClose: () => void }` — 들여쓴 폴더 목록 + 최상위.

### DocsDialog — `@/components/docs/DocsDialog`
`{ spec: DocsDialogSpec; onClose }`, `DocsDialogSpec = { title; message?; input?: {initial?, placeholder?}; confirmLabel; danger?; onConfirm: (value) => void }` — 이름 입력·삭제 확인 겸용(브라우저 `prompt`·`confirm` 대신, 표준 모달 마크업). ⬆ `ConfirmDialog` primitive 가 생기면 교체.

### useOpenNote — `@/components/docs/useOpenNote`
`() => (title: string, folderId?: string | null, vaultId?: string) => Promise<void>` — 제목으로 찾아 이동, 없으면 만들고 `?edit=1` 로 이동. `vaultId` 를 주면 그 vault 안에서만 찾고 그 vault 에 만듭니다(링크는 vault 단위). 목록은 `useNotes()` 캐시(통합 뷰, 서버 최대 500건).
