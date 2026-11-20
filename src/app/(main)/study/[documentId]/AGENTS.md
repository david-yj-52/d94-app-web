# L3 · 화면: PDF 학습 뷰어 🧪

> 계층: [L1](../../../../../AGENTS.md) › [L2 app](../../../AGENTS.md) › [L3 study](../AGENTS.md) › **viewer**

## 개요
- **URL:** `/study/[documentId]?section={pageSectionId}#{blockKey}` · **파일:** `page.tsx` (클라이언트, `useSearchParams` 때문에 `Suspense`)
- **목적:** MS Docs 식 3단 뷰어. 페이지 = 목차 깊이 2 섹션(자식 없는 깊이 1은 그 자체). 어느 페이지를 열지는 백엔드가 `pageSectionId`로 알려 줍니다.
- `section`이 없으면 마지막 읽던 위치(문서의 `lastSectionId`·`lastBlockKey`), 없으면 목차 첫 노드의 `pageSectionId`로 `router.replace`.

## 화면 구성
```
[documentId]/page.tsx
├── 상단: ← 목록 · 문서 제목 · 탭(본문 / 단어장) · 노트 링크(/study/notes?documentId=)
├── (lg 미만) <details> 목차
├── 3열 (lg: 260px · 본문 · 220px)
│   ├── TocTree                 sticky
│   ├── PageView | TermsPanel
│   └── PageOutline             "이 페이지 내용"
├── SelectionToolbar           (선택 시)
├── TermEditModal / AnnotationPopover
├── AutoScroll                 본문 탭에서 항상 (오른쪽 아래)
└── {ToastComponent}
```

## 데이터
| 훅 | 엔드포인트 |
|---|---|
| `useStudyDocument` | `GET /v1/study/documents/{id}` |
| `useStudyToc` (READY 일 때) | `GET /v1/study/documents/{id}/toc` |
| `useStudyPage` | `GET /v1/study/documents/{id}/pages/{pageSectionId}` — 블록·셀·개요·`termHits`·`terms`·마킹 |
| `useSaveStudyPosition` | `PUT /v1/study/documents/{id}/position` `{sectionId, blockKey}` — 성공하면 `["studyDocument", id]` 캐시만 고침 |
| `useCreateStudyAnnotation` | `POST /v1/study/annotations` |
| `useCreateStudyTerm` 외 | `/v1/study/terms` |

## 기능
- **이동:** 목차·개요 클릭 → 같은 페이지면 `history.replaceState` + 스크롤, 다른 페이지면 `router.push(?section=…#key)`. 페이지 데이터가 도착한 뒤(`section.id` 변경 시)에만 해시 블록으로 스크롤하고 1.5초 강조.
- **마지막 위치(기기 간 이어 읽기):** 스크롤이 멈추고 0.5초 뒤(페이지를 연 뒤엔 1초 뒤) 화면 맨 위 블록을 `useSaveStudyPosition` 으로 백엔드(`SN_STUDY_DOCUMENT.LAST_SECTION_ID`·`LAST_BLOCK_KEY`)에 남깁니다. 주소의 `#블록`도 `history.replaceState` 로 지금 위치로 바꿉니다(목차로 들어오면 `#챕터 제목`이 남아 새로고침 때 그리로 돌아가던 문제). 직전에 보낸 위치와 같으면 보내지 않고, 본문이 없으면(단어장 탭) 남기지 않습니다. 해시 없이 열리면(새로고침·재로그인 복귀·다른 기기) 같은 페이지일 때 그 블록으로 바로(smooth 아님) 스크롤합니다. 스크롤 효과는 문서가 READY 로 그려진 뒤에만 돕니다. 복원 뒤 위쪽 그림이 늦게 로드돼 본문이 밀리면(Safari 는 스크롤 앵커링 없음) `ResizeObserver` 로 그 블록을 다시 맞춥니다. 사용자가 스크롤·클릭·키를 누르거나 5초가 지나면 멈추고, 그동안은 위치를 저장하지 않습니다(밀린 위치로 덮지 않게).
- **자동 스크롤:** `AutoScroll` 이 설정 속도로 내려가고, 휠·터치·방향키·본문 누름이면 멈추고 Enter 로 다시 갑니다. 페이지 끝이면 2초 뒤 `goTo(next.id)` 로 다음 페이지 맨 위부터 이어 가고, 마지막 페이지 끝에서 멈춥니다. 자동 스크롤 중엔 스크롤이 멈추지 않아 위치 저장(0.5초 디바운스)도 멈춘 뒤에 됩니다.
- **마킹·노트:** 본문 `mouseup`/`keyup` → `rangeToAnchor` → 툴바. 마킹 클릭 → `AnnotationPopover`.
- **단어장:** 툴바 "단어장" → `TermEditModal`(선택 글자 채움). 등록되면 페이지 쿼리 무효화로 밑줄이 바로 생깁니다.
- 단어 매칭·오프셋 검증·quote 생성은 백엔드가 합니다. 웹은 `buildSegments`로 받은 구간을 그릴 뿐입니다.
