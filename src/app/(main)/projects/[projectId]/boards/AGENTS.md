# L3 · 화면: 보드 (CIRA)

> 계층: [L1](../../../../../../AGENTS.md) › [L2 app](../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 boards**
> 컴포넌트 카드: [board](../../../../../components/board/AGENTS.md)

## 개요
| URL | 파일 | 설명 |
|---|---|---|
| `/projects/:projectId/boards` | `page.tsx` | 보드가 있으면 첫 보드로 `router.replace`, 없으면 빈 상태 + 생성 |
| `/projects/:projectId/boards/:boardId` | `[boardId]/page.tsx` | 보드 선택 + 칸반 보드 |

## 화면 구성
```
boards/page.tsx
├── ProjectNav
├── 빈 상태 "보드가 없습니다." + [+ 보드 생성]
└── {showCreate && <CreateBoardModal onSuccess={(id) => router.push(…/boards/id)}/>}

boards/[boardId]/page.tsx
├── ProjectNav
├── 브레드크럼 + 보드 선택 <select> (useBoards 목록) + [+ 보드 생성]
├── KanbanBoard boardId projectId          → board 카드 (Column · Card · AddColumnModal 포함)
└── {showCreate && <CreateBoardModal/>}
```

## 데이터
- `useBoards(projectId)` → `["boards", projectId]`, `useBoardDetail(boardId)` → `["board", boardId]`
- 쓰기: `useMoveIssue`, `useAdd/Update/DeleteColumn`, `useCreate/DeleteBoard`

## 기능 (L4)
### 이슈 드래그 앤 드롭
- 카드를 다른 컬럼이나 다른 위치로 끌어 놓으면 `useMoveIssue`가 호출됩니다. 컬럼 이동은 곧 상태 변경을 뜻합니다.
- 드래그 중에는 컬럼 하이라이트(`isDragOver`)와 삽입 위치선(`showDropBefore`)을 표시합니다.
### 컬럼 관리
- 컬럼 추가와 이름 편집은 AddColumnModal로, 삭제는 컬럼 메뉴에서 합니다.
### 보드 전환·생성
- select로 다른 보드를 고르면 URL이 바뀝니다. 새 보드를 만들면 생성된 보드로 이동합니다.

## 주의·예외
- DnD를 라이브러리 없이 HTML5 API로 구현했습니다. 학습 목적에 맞는 선택이며, 모바일 터치는 지원하지 않습니다.
