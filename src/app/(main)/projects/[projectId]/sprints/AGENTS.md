# L3 · 화면: 스프린트 (CIRA)

> 계층: [L1](../../../../../../AGENTS.md) › [L2 app](../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 sprints**
> 컴포넌트 카드: [sprint](../../../../../components/sprint/AGENTS.md)

## 개요
- **URL:** `/projects/:projectId/sprints` · **파일:** `page.tsx` (355줄)
- **목적:** 스프린트를 계획(생성·이슈 할당)하고, 시작하고, 완료합니다.

## 화면 구성
```
sprints/page.tsx
├── ProjectNav
├── 헤더 "스프린트" + [+ 스프린트 생성]
├── 로딩 Skeleton / 빈 상태 "스프린트가 없습니다."
├── SprintCard × n  (페이지 내부 컴포넌트)
│   ├── 상태 배지 (CREATED=대기 / ACTIVE=진행 중 / COMPLETED=완료)
│   ├── 액션 버튼 (상태별, 아래 표)
│   └── "이슈 n개 ▼" 펼치기 → 스프린트 이슈 테이블 (키·제목·상태·담당자) + 이슈 제거
├── {showCreate && <CreateSprintModal/>}
├── {editTarget && <EditSprintModal/>}
├── {assignTarget && <AssignIssueModal/>}
└── {completeTarget && <CompleteSprintModal/>}
```
**모달 4개를 `target` 상태 하나씩으로 여닫는 패턴**입니다. 같은 화면에 모달이 여러 개 필요할 때 참고하세요.

## 데이터
- `useSprints(projectId)` → `["sprints", projectId]`
- SprintCard 안: `useIssues(projectId, {sprintId, size: 100})`, `useRemoveIssueFromSprint`
- `useStartSprint`, `useDeleteSprint` (페이지), 나머지 mutation은 각 모달이 호출합니다.

## 기능 (L4)
### 상태별 액션
| 상태 | 가능한 액션 |
|---|---|
| CREATED (대기) | 시작, 이슈 할당, 수정, 삭제 |
| ACTIVE (진행 중) | 완료(CompleteSprintModal), 이슈 할당 |
| COMPLETED (완료) | 수정 |

이슈 제거 버튼은 COMPLETED가 아닐 때만 보입니다.
### 스프린트 완료
- 미완료 이슈를 `BACKLOG`나 `NEXT_SPRINT`(대상 스프린트 선택)로 옮긴 뒤 완료합니다.
### 이슈 할당·제거
- AssignIssueModal로 스프린트 밖의 이슈를 추가합니다. 펼친 목록에서 개별 이슈를 제거할 수 있습니다.
- 모든 액션은 성공하거나 실패하면 토스트를 띄웁니다("스프린트가 시작되었습니다." 등).

## 주의·예외
- 삭제 확인에 브라우저 `confirm()`을 씁니다. 새 코드는 표준 삭제 다이얼로그를 쓰세요.
- `SprintCard`가 페이지 안에 정의되어 있습니다. 재사용할 경우 `components/sprint/SprintCard.tsx`로 분리하세요.
