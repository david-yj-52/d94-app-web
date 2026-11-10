# L3 · 화면: 노트 모아보기 🧪

> 계층: [L1](../../../../../AGENTS.md) › [L2 app](../../../AGENTS.md) › [L3 study](../AGENTS.md) › **notes**

## 개요
- **URL:** `/study/notes?documentId=` · **파일:** `page.tsx` (클라이언트, `Suspense`)
- **목적:** 모든 문서(또는 선택한 문서)의 마킹·노트를 한곳에서 보고, 누르면 해당 문장으로 이동합니다.
- ponytail: 검색·페이지네이션 없음(혼자 쓰는 앱). 노트가 많아지면 추가.

## 화면 구성
```
notes/page.tsx
├── ← PDF 학습 · 제목 · 문서 필터 <select> (useStudyDocuments)
└── NoteList  (문서별 묶음) → router.push(/study/{documentId}?section={pageSectionId}#{blockKey})
```

## 데이터
| 훅 | 엔드포인트 |
|---|---|
| `useStudyAnnotations(documentId?)` | `GET /v1/study/annotations?documentId=` — 항목마다 `location{documentId,pageSectionId,blockKey}` |
