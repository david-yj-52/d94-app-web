# L2 · study 컴포넌트 🧪

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **study**
> 사용 화면: [study](../../app/(main)/study/AGENTS.md), [viewer](../../app/(main)/study/[documentId]/AGENTS.md), [notes](../../app/(main)/study/notes/AGENTS.md). 이 모듈 밖에서 import 하지 않습니다.

규칙: **블록 요소 안에는 본문 글자 외의 텍스트 노드를 넣지 않습니다.** `rangeToAnchor`가 `Range.toString()` 길이로 오프셋을 재기 때문입니다. 단어 툴팁은 CSS `::after { content: attr(data-tip) }`, 노트 아이콘은 텍스트 없는 버튼입니다.

### UploadDropzone — `@/components/study/UploadDropzone`
`{ onUploaded: (doc: StudyDocument) => void; onError: (message: string) => void }` — 클릭·끌어놓기, `useUploadStudyDocument` 진행률 막대.

### DocumentList — `@/components/study/DocumentList`
`{ documents: StudyDocument[]; onDelete: (doc: StudyDocument) => void; onReparse: (doc: StudyDocument) => void }` — 상태 배지(분석 중·준비됨·실패+사유), READY 만 뷰어 링크, 원본 PDF 재분석.

### TocTree — `@/components/study/TocTree`
`{ nodes: TocNode[]; activePageSectionId: string | null; onSelect: (node: TocNode) => void }` — native `<details>`로 접기, 활성 페이지 강조.

### PageView — `@/components/study/PageView`
`{ page: StudyPage; documentId: string; containerRef: Ref<HTMLDivElement>; onNavigate: (s: SectionRef) => void; onAnnotationClick: (id: string) => void; onSelectionEnd: () => void; syntax?: SyntaxSpan[] }`
- HEADING→h1~h4, PARAGRAPH→p, 연속 LIST_ITEM→ul, TABLE→table(첫 행 th, 셀마다 `data-block-key`, 컨테이너 `data-block-type="TABLE"`), FIGURE→img(`/api/proxy/v1/study/documents/{id}/figures/{key}`)+figcaption. 모든 블록에 `id`=블록 키.
- `syntax` 역할은 본문 텍스트 주변 span의 클래스와 CSS 의사 요소로 표현해 Range 오프셋을 보존합니다.
- 같은 파일의 `PageOutline({items, onSelect})` — 오른쪽 "이 페이지 내용".

### SelectionToolbar — `@/components/study/SelectionToolbar`
`{ rect; onMark: (color, note?) => void; onAddTerm: () => void; onClose: () => void }` — 4색 마킹 / 노트 입력 후 마킹 / 단어장. 같은 파일의 `ColorPicker`.

### AnnotationPopover — `@/components/study/AnnotationPopover`
`{ annotationId; documentId; onClose; onError }` — 노트 편집·색 변경·삭제 (노트 본문은 `useStudyAnnotations(documentId)`).

### TermEditModal — `@/components/study/TermEditModal`
`{ initialTerm; initialDefinition?; documentId; onClose; onError; onSaved }` — 뜻 입력(사전에서 저장하면 정의도 채움), 범위(모든 문서 / 이 문서에서만). 409 → 서버 메시지 토스트.

### DictionaryPopover / DictionaryKeyModal — `@/components/study/DictionaryPopover`, `DictionaryKeyModal`
- 팝오버는 `document.body` 포털로 표시하며 Merriam-Webster 결과를 최대 3개 뜻까지 보여 줍니다. 사전 키가 없거나 유효하지 않으면 등록 동작을 제공합니다.
- 키 모달은 password 입력으로 계정 API 키를 등록·삭제합니다. 키 원문을 화면 상태나 API 응답에 표시하지 않습니다.

### `useWordHover` — `@/components/study/useWordHover`
- 커서 위치 텍스트 노드에서 단어를 뽑고, 단어장 tooltip·드래그·터치 장치를 건너뜁니다. 렌더 DOM 텍스트는 수정하지 않습니다.

### TermsPanel — `@/components/study/TermsPanel`
`{ documentId; onError }` — 전역+이 문서 단어 목록, 인라인 수정·삭제.

### NoteList — `@/components/study/NoteList`
`{ items: AnnotationListItem[]; onOpen: (location: NoteLocation) => void }` — 문서별 묶음, 색 점·섹션·quote·노트·날짜.

### AutoScroll — `@/components/study/AutoScroll`
`{ pageId: string | undefined; next: SectionRef | null; onNext: (next: SectionRef) => void }` — 오른쪽 아래 고정 조절기(▶/⏸ · 속도 `LEVELS` 0.1·0.5·1~10, 1 = 초당 15px, 쿠키 `study_autoscroll_speed` Path `/study`).
- `requestAnimationFrame` 으로 `window.scrollBy` (소수점 누적, 한 프레임 최대 100ms). 새 페이지면 맨 위에서 1초 쉬고 출발, 같은 페이지 재개는 바로.
- 멈춤: `wheel`·`touchstart`·`STOP_KEYS`(↑↓·PageUp/Down·Home/End·Space)·조절기 밖 `mousedown`(글자 선택). 멈춤·재개: Enter 토글 (입력칸·버튼·링크·`[role=dialog]` 안의 Enter 는 무시).
- 페이지 끝: `next` 가 있으면 "다음: 제목" 을 2초 보여 주고 `onNext`, 없으면(마지막 페이지) 멈춤. `pageId` 가 undefined(다음 페이지 로딩 중)면 움직이지 않는다 — 그래서 부모는 로딩 중에도 떼지 않는다.
- 켜짐 상태는 기억하지 않는다(열 때마다 꺼짐). 테스트 `AutoScroll.test.tsx`.
