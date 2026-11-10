# L3 · 화면: PDF 학습 뷰어 🧪

> 계층: [L1](../../../../../AGENTS.md) › [L2 app](../../../AGENTS.md) › [L3 study](../AGENTS.md) › **viewer**

## 개요
- **URL:** `/study/[documentId]?section={pageSectionId}#{blockKey}` · **파일:** `page.tsx` (클라이언트, `useSearchParams` 때문에 `Suspense`)
- **목적:** MS Docs 식 3단 뷰어. 페이지 = 목차 깊이 2 섹션(자식 없는 깊이 1은 그 자체). 어느 페이지를 열지는 백엔드가 `pageSectionId`로 알려 줍니다.
- `section`이 없으면 목차 첫 노드의 `pageSectionId`로 `router.replace`.

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
└── {ToastComponent}
```

## 데이터
| 훅 | 엔드포인트 |
|---|---|
| `useStudyDocument` | `GET /v1/study/documents/{id}` |
| `useStudyToc` (READY 일 때) | `GET /v1/study/documents/{id}/toc` |
| `useStudyPage` | `GET /v1/study/documents/{id}/pages/{pageSectionId}` — 블록·셀·개요·`termHits`·`terms`·마킹 |
| `useCreateStudyAnnotation` | `POST /v1/study/annotations` |
| `useCreateStudyTerm` 외 | `/v1/study/terms` |

## 기능
- **이동:** 목차·개요 클릭 → 같은 페이지면 `history.replaceState` + 스크롤, 다른 페이지면 `router.push(?section=…#key)`. 페이지 데이터가 도착한 뒤(`section.id` 변경 시)에만 해시 블록으로 스크롤하고 1.5초 강조.
- **마킹·노트:** 본문 `mouseup`/`keyup` → `rangeToAnchor` → 툴바. 마킹 클릭 → `AnnotationPopover`.
- **단어장:** 툴바 "단어장" → `TermEditModal`(선택 글자 채움). 등록되면 페이지 쿼리 무효화로 밑줄이 바로 생깁니다.
- 단어 매칭·오프셋 검증·quote 생성은 백엔드가 합니다. 웹은 `buildSegments`로 받은 구간을 그릴 뿐입니다.
