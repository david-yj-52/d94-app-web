# L2 · sprint 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **sprint**
> 사용 화면: [sprints](../../app/(main)/projects/[projectId]/sprints/AGENTS.md)

모두 모달입니다. 부모가 `{target && <XxxModal …/>}`로 조건부 렌더링하고, 각 모달이 내부에서 `useSprints` 계열의 mutation을 호출합니다.

### CreateSprintModal — `@/components/sprint/CreateSprintModal`
```ts
{ projectId: string; onClose: () => void; onSuccess?: () => void }
```
- 필드는 이름(필수), 목표, 시작일, 종료일입니다. react-hook-form + zod를 쓰고, `isSuccess`가 되면 `onSuccess`와 `onClose`를 호출합니다.
- **새 생성 모달을 만들 때 참고할 기준 구현**입니다. 마크업은 [ui/AGENTS.md](../ui/AGENTS.md) §3에 옮겨 두었습니다.

### EditSprintModal — `@/components/sprint/EditSprintModal`
```ts
{ projectId: string; sprint: SprintResponse; onClose: () => void; onSuccess?: () => void }
```

### AssignIssueModal — `@/components/sprint/AssignIssueModal`
```ts
{ projectId: string; sprint: SprintResponse; onClose: () => void; onSuccess?: () => void }
```
- 프로젝트 이슈 중 이 스프린트에 없는 이슈를 골라 추가합니다(`useAddIssueToSprint`).

### CompleteSprintModal — `@/components/sprint/CompleteSprintModal`
```ts
{ projectId: string; sprint: SprintResponse; onClose: () => void; onSuccess: () => void }   // onSuccess 필수
```
- 미완료 이슈를 `BACKLOG`(백로그로 이동)로 보낼지 `NEXT_SPRINT`(다음 스프린트 선택)로 보낼지 고른 뒤 완료합니다(`useCompleteSprint`).

**재사용 메모:** Create와 Edit의 폼 필드가 같습니다. 새 도메인에서는 처음부터 `editTarget?` 겸용 모달 한 개로 만드세요(예: [version/VersionModal](../version/AGENTS.md)).
