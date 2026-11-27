# L3 · 화면: Docs 계보

> 계층: [L1](../../../../../../AGENTS.md) › [L2 app](../../../../AGENTS.md) › [L3 docs](../../AGENTS.md) › **L3 docs/[noteId]/lineage**

## 개요
- **URL:** `/docs/[noteId]/lineage` · **파일:** `page.tsx` (클라이언트) · **layout:** Docs layout(왼쪽 폴더 트리) 안
- **목적:** 노트가 속한 계보를 루트 아이디어부터 stream(트랙)별 열로 봅니다(CIRA DOCS-21).
- **진입:** 노트 화면 제목 옆 [계보 보기] 아이콘

## 화면 구성
```
docs/[noteId]/lineage/page.tsx
├── 헤더: ← 노트로 · "{루트 제목} 계보" · 노트 수·트랙 수
└── stream 별 열(가로 스크롤, 트랙 없음 = null) → 카드: 제목·종류·세대(루트/N세대)·← origin, 지금 노트는 강조
```
컴포넌트 카드: [docs](../../../../../components/docs/AGENTS.md) (전용 컴포넌트 없음, `groupByStream` 은 `lib/docs/markdown.ts`)

## 데이터
| 훅 | 엔드포인트 | mock |
|---|---|---|
| `useLineage(noteId)` | `GET /v1/docs/notes/{id}/lineage` (루트부터 내려간 같은 vault 노드 목록) | ✅ |

## 기능 (L4)
### 열 나누기
- `groupByStream`: 응답 첫 등장 순으로 stream 열, 열 안은 세대(origin 을 따라 올라간 횟수, 상한 50) → 제목 순. 테스트 `lib/docs/markdown.test.ts`.
### 이동
- 카드 클릭 → `/docs/{id}`.

## 주의·예외
- 계보는 vault 안에서만 이어집니다(크로스 vault origin 은 끊김).
