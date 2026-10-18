# L2 · project 컴포넌트 (+ settings, settings/automation)

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **project**
> 사용 화면: [projects](../../app/(main)/projects/AGENTS.md), [settings](../../app/(main)/projects/[projectId]/settings/AGENTS.md)

## 공유 컴포넌트

### ProjectNav 🔁 — `@/components/project/ProjectNav`
```ts
{ projectId: string }
```
- 프로젝트 하위 탭 네비게이션입니다. 탭은 이슈, 보드, 스프린트, 버전, 리포트, Wiki, 설정이고, **설정 탭은 ADMIN 멤버에게만** 보입니다.
- 현재 경로(`usePathname`)로 활성 탭을 표시합니다. 멤버 권한은 `useProjectMembers`로 조회합니다.
- 사용처:
  - 페이지에서 직접: issues, boards, boards/[boardId], sprints
  - layout에서: reports, settings, versions, wiki
- **새 프로젝트 하위 탭을 추가하면 이 파일의 `tabs` 배열에 항목을 추가하세요.**
```tsx
<ProjectNav projectId={projectId}/>
```

## 프로젝트 목록

### ProjectCard — `@/components/project/ProjectCard`
```ts
{ project: ProjectResponse }
```
- 프로젝트 카드입니다. 클릭하면 `/projects/{id}/issues`로 이동합니다.

### CreateProjectModal — `@/components/project/CreateProjectModal`
```ts
{ onClose: () => void; onSuccess?: () => void }
```

## settings/

### SettingsSideNav — `@/components/project/settings/SettingsSideNav`
```ts
{ projectId: string }
```
- 설정 좌측 메뉴입니다(기본 정보, 멤버, 워크플로우, Git 연동, 자동화). `settings/layout.tsx`에서 사용합니다.

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
