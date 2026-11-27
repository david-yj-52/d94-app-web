# L2 · project 컴포넌트 (+ settings, settings/automation)

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **project**
> 사용 화면: [projects](../../app/(cira)/cira/projects/AGENTS.md), [settings](../../app/(cira)/cira/projects/[projectId]/settings/AGENTS.md)

## 프로젝트 목록

### ProjectCard — `@/components/project/ProjectCard`
```ts
{ project: ProjectResponse }
```
- 프로젝트 카드(키·이름·설명)입니다. 프로젝트에는 타입이 없어 타입 배지는 없습니다(V660). 클릭하면 `/cira/projects/{id}/issues`로 이동합니다.

### CreateProjectModal — `@/components/project/CreateProjectModal`
```ts
{ onClose: () => void; onSuccess?: () => void }
```
- 키·이름·설명·첫 작업 공간(이름 `defaultSpaceName`, 비우면 General · 프리셋 `presetTypeId`). 프리셋 목록은 `useProjectTypes`(기준정보 › CIRA 작업 공간 프리셋), 첫 프리셋이 기본값. 프리셋의 상태·필드·보드가 첫 공간에 1회 복사됩니다(V650).

### CreateSpaceModal — `@/components/project/CreateSpaceModal`
```ts
{ projectId: string; onClose: () => void; onCreated?: (space: Space) => void }
```
- `ui/Dialog`. 이름(1~60자)·프리셋(`""` = 빈 공간: To Do → In Progress → Done + 칸반)·공간 관리자(`useProjectMembers`, `""` = 나) → `useCreateSpace`. 실패(같은 이름 409·권한 403)는 창 안 오류 문구. 사용처: `CiraSidebar` [+] (프로젝트 ADMIN 에게만 보임).

## settings/

### MemberTable — `@/components/project/settings/MemberTable`
```ts
{ projectId: string; members: ProjectMemberResponse[]; isAdmin: boolean; currentUserEmail?: string | null;
  onSuccess: (msg: string) => void; onError: (msg: string) => void }
```
- 역할 변경과 멤버 제거를 처리합니다. 결과 메시지는 `onSuccess`/`onError`로 부모에 넘기고, 부모가 토스트를 띄웁니다. 토스트를 부모에 위임하는 좋은 예입니다.

### AddMemberModal — `@/components/project/settings/AddMemberModal`
```ts
{ projectId: string; onClose: () => void; onSuccess?: () => void }
```

## settings/automation/

### AutomationRuleCard — `@/components/project/settings/automation/AutomationRuleCard`
```ts
{ rule: AutomationRule; projectId: string; onEdit: (rule: AutomationRule) => void; onDeleted: () => void }
```
- 같은 파일에서 `TRIGGER_LABEL`, `ACTION_LABEL` 상수도 export합니다.

### AutomationRuleModal — `@/components/project/settings/automation/AutomationRuleModal`
```ts
{ rule?: AutomationRule | null; onSubmit: (data: CreateAutomationRuleRequest) => void; isPending: boolean; onClose: () => void }
```
- **mutation을 부모에 위임하는 모달**입니다(`onSubmit` + `isPending`). 같은 모달로 생성과 편집을 모두 처리합니다. 재사용 가능한 모달을 만들 때 권장하는 형태입니다.
