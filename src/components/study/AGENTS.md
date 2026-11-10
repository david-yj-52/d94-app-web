# L2 · study 컴포넌트 🧪

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **study**
> 사용 화면: [study](../../app/(main)/study/AGENTS.md), [viewer](../../app/(main)/study/[documentId]/AGENTS.md), [notes](../../app/(main)/study/notes/AGENTS.md). 이 모듈 밖에서 import 하지 않습니다.

규칙: **블록 요소 안에는 본문 글자 외의 텍스트 노드를 넣지 않습니다.** `rangeToAnchor`가 `Range.toString()` 길이로 오프셋을 재기 때문입니다. 단어 툴팁은 CSS `::after { content: attr(data-tip) }`, 노트 아이콘은 텍스트 없는 버튼입니다.

### UploadDropzone — `@/components/study/UploadDropzone`
`{ onUploaded: (doc: StudyDocument) => void; onError: (message: string) => void }` — 클릭·끌어놓기, `useUploadStudyDocument` 진행률 막대.

### DocumentList — `@/components/study/DocumentList`
`{ documents: StudyDocument[]; onDelete: (doc: StudyDocument) => void }` — 상태 배지(분석 중·준비됨·실패+사유), READY 만 뷰어 링크.

### TocTree — `@/components/study/TocTree`
`{ nodes: TocNode[]; activePageSectionId: string | null; onSelect: (node: TocNode) => void }` — native `<details>`로 접기, 활성 페이지 강조.

### PageView — `@/components/study/PageView`
`{ page: StudyPage; documentId: string; containerRef: Ref<HTMLDivElement>; onNavigate: (s: SectionRef) => void; onAnnotationClick: (id: string) => void; onSelectionEnd: () => void }`
- HEADING→h1~h4, PARAGRAPH→p, 연속 LIST_ITEM→ul, TABLE→table(첫 행 th, 셀마다 `data-block-key`, 컨테이너 `data-block-type="TABLE"`), FIGURE→img(`/api/proxy/v1/study/documents/{id}/figures/{key}`)+figcaption. 모든 블록에 `id`=블록 키.
- 같은 파일의 `PageOutline({items, onSelect})` — 오른쪽 "이 페이지 내용".

### SelectionToolbar — `@/components/study/SelectionToolbar`
`{ rect; onMark: (color, note?) => void; onAddTerm: () => void; onClose: () => void }` — 4색 마킹 / 노트 입력 후 마킹 / 단어장. 같은 파일의 `ColorPicker`.

### AnnotationPopover — `@/components/study/AnnotationPopover`
`{ annotationId; documentId; onClose; onError }` — 노트 편집·색 변경·삭제 (노트 본문은 `useStudyAnnotations(documentId)`).

### TermEditModal — `@/components/study/TermEditModal`
`{ initialTerm; documentId; onClose; onError; onSaved }` — 뜻 입력, 범위(모든 문서 / 이 문서에서만). 409 → 서버 메시지 토스트.

### TermsPanel — `@/components/study/TermsPanel`
`{ documentId; onError }` — 전역+이 문서 단어 목록, 인라인 수정·삭제.

### NoteList — `@/components/study/NoteList`
`{ items: AnnotationListItem[]; onOpen: (location: NoteLocation) => void }` — 문서별 묶음, 색 점·섹션·quote·노트·날짜.
