# L3 · 화면: Docs 그래프

> 계층: [L1](../../../../../AGENTS.md) › [L2 app](../../../AGENTS.md) › [L3 docs](../AGENTS.md) › **L3 docs/graph**

## 개요
- **URL:** `/docs/graph` (전체), `/docs/graph?noteId=&depth=1~5` (로컬) · **파일:** `page.tsx` (클라이언트) · **layout:** Docs layout(왼쪽 폴더 트리) 안
- **목적:** Obsidian 형 그래프 뷰 — 노트 = 점(종류 색), `[[링크]]` = 선, 파생 origin = 점선(CIRA DOCS-22).
- **진입:** Docs 왼쪽 "그래프"(전체) · 노트 화면 제목 옆 [주변 그래프] 아이콘(로컬, 1단계)

## 화면 구성
```
docs/graph/page.tsx
├── 헤더: (로컬이면 ← 노트로) · "전체 그래프" | "{제목} 주변" · (로컬이면 단계 select·"전체 그래프" 링크) · 종류 색 범례
└── NoteGraph (react-force-graph-2d, 처음 그릴 때 불러옴) → 점 클릭 = /docs/{id}
```
컴포넌트 카드: [docs](../../../../components/docs/AGENTS.md)

## 데이터
| 훅 | 엔드포인트 | mock |
|---|---|---|
| `useDocsGraph(noteId, depth)` | `GET /v1/docs/graph` (`noteId`·`depth` 있으면 그 노트 vault 안 depth 단계, 링크 방향 무시 / 없으면 접근 가능한 vault 전체). 응답 `{nodes, links}`, 없는 노트 링크·자기 링크 제외 | ✅ |

## 기능 (L4)
### 이동
- 점 클릭 → 노트 화면. 단계 select → `router.replace` 로 `depth` 만 바꿈.
### 표시
- 줌이 작으면(scale < 1.2) 제목은 중심 노트만, 화살표 = 링크 방향.

## 주의·예외
- 서버는 vault 당 노트 5000개까지만 돌려줍니다(ponytail 상한). 범례 색 점만 인라인 style(canvas 색과 같은 동적 값).
