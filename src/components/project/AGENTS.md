# L2 · project 컴포넌트 (+ settings, settings/automation)

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **project**
> 사용 화면: [projects](../../app/(cira)/cira/projects/AGENTS.md), [settings](../../app/(cira)/cira/projects/[projectId]/settings/AGENTS.md)

## 프로젝트 목록

### ProjectCard — `@/components/project/ProjectCard`
```ts
{ project: ProjectResponse }
```
- 프로젝트 카드입니다. 클릭하면 `/cira/projects/{id}/issues`로 이동합니다.

### CreateProjectModal — `@/components/project/CreateProjectModal`
```ts
{ onClose: () => void; onSuccess?: () => void }
```

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
