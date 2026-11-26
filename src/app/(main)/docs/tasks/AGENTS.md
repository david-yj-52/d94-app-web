# L3 · 화면: Docs Task 모아보기

> 계층: [L1](../../../../../AGENTS.md) › [L2 app](../../../AGENTS.md) › [L3 docs](../AGENTS.md) › **L3 docs/tasks**

## 개요
- **URL:** `/docs/tasks` · **파일:** `page.tsx` (클라이언트) · **layout:** Docs layout(왼쪽 폴더 트리) 안
- **목적:** 모든 노트의 체크박스 줄(`- [ ]`·`- [/]`·`- [x]`)을 상태별로 모아 보고 바꿉니다(Obsidian Tasks 플러그인 대체). Task 의 원천은 노트 본문입니다.
- **진입:** Docs 왼쪽 위 "Task 모아보기"

## 화면 구성
```
docs/tasks/page.tsx
├── 필터: 태그 · 트랙(stream) · 마감(이날까지, <input type="date">)
└── TaskBoard (할 일 · 진행 중 · 완료 3열, 카드 = 내용·원 노트 링크·📅 마감·상태 선택)
```
컴포넌트 카드: [docs](../../../../components/docs/AGENTS.md)

## 데이터
| 훅 | 엔드포인트 | mock |
|---|---|---|
| `useDocsTasks(filters)` | `GET /v1/docs/tasks?tag=&stream=&dueBefore=` (vaultId 생략 = 통합 뷰: 내 Private + 소속 Team vault 의 체크박스. 정렬: 마감 있는 것 먼저 → 노트 제목 → 줄) | ✅ |
| `useSetDocsTaskStatus` | `PUT /v1/docs/tasks/{noteId}/{lineNo}` `{status}` | ✅ |

## 기능 (L4)
### 상태 변경
- 카드의 상태 선택 → 서버가 원 노트의 그 줄 체크 문자만 바꿔 저장(버전 +1). 그 줄이 이미 바뀌었으면 409 토스트 → 새로고침 후 다시.
### 원 노트로
- 노트 제목 링크 → `/docs/{noteId}`.

## 주의·예외
- 칸반 DnD 는 없습니다(상태 선택). 필요해지면 CIRA 보드 DnD 를 이식합니다.
- 서버는 최대 1000건까지 돌려줍니다.
