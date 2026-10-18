# L2 · version 컴포넌트

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **version**
> 사용 화면: [versions](../../app/(main)/projects/[projectId]/versions/AGENTS.md). 같은 화면의 마일스톤 컴포넌트는 [카탈로그 §5](../AGENTS.md)에 있습니다.

### VersionCard — `@/components/version/VersionCard`
```ts
{ version: VersionResponse; onEdit: (v: VersionResponse) => void; onDelete: (id: string) => void;
  onRelease: (id: string) => void; onArchive: (id: string) => void; isActioning?: boolean }
```
- 버전 상태(미릴리즈 / `RELEASED` / `ARCHIVED`)에 따라 배지와 버튼이 달라집니다. 미릴리즈 상태에서는 릴리즈 버튼이, `RELEASED` 상태에서는 릴리즈 노트·보관 버튼이 보입니다.
- 릴리즈된 버전은 카드 안에서 `ReleaseNotesModal`을 엽니다.
- 액션은 모두 콜백으로 부모에 위임하고, 부모가 mutation을 호출합니다.

### VersionModal — `@/components/version/VersionModal`
```ts
{ projectId: string; editTarget?: VersionResponse | null; onClose: () => void; onSuccess?: () => void }
```
- 생성과 편집을 함께 처리하는 모달입니다. `editTarget` 유무로 모드가 정해집니다.

### ReleaseNotesModal — `@/components/version/ReleaseNotesModal` (VersionCard 내부)
```ts
{ versionId: string; versionName: string; onClose: () => void }
```
- `useReleaseNotes(versionId)`로 릴리즈 노트를 조회해 보여 주는 읽기 전용 모달입니다.
