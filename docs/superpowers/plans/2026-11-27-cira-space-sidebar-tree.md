# CIRA 사이드바 팀(작업 공간)별 메뉴 트리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이드바의 작업 공간 드롭다운을 팀별 메뉴 트리로 바꾸고, 프로젝트 최상위 "Task (전체)" 가 모든 팀의 Task 를 보여 주게 한다.

**Architecture:** `?space=` 쿼리를 그대로 쓴다. 팀 링크는 기본 공간도 항상 `?space=<id>` 를 붙이고, Task 목록만 `?space=` 가 없으면 전체로 해석한다. 백엔드 변경 없음(spaceId 없이 조회하면 이미 전체).

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query v5, Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-11-27-cira-space-sidebar-tree-design.md`

## Global Constraints

- 백엔드·URL 구조 변경 없음. `?space=` 가 없는 옛 보드·설정 링크는 지금처럼 기본 공간.
- 통합 보드는 만들지 않는다.
- `localStorage`/`sessionStorage` 금지 — 펼침 상태는 컴포넌트 상태.
- 설정 화면 안 사이드바(`PROJECT_SETTINGS`/`SPACE_SETTINGS` 묶음)는 구조를 바꾸지 않는다.
- 작업 후 `npx tsc --noEmit`, `npm test`, `npm run docs:check`(오류 0) 통과. 문서는 같은 커밋에서(AGENTS.md §10).

## Review Focus

1. 기본 팀의 Task(`/issues?space=<기본 id>`)와 통합 Task(`/issues`)가 서로 다른 목록·다른 활성 표시 — Task 4 테스트.
2. 옛 링크 `/boards`(쿼리 없음)는 기본 팀 보드를 열고 사이드바에서 기본 팀이 펼쳐져 활성 — Task 4 테스트(`teamActive`).
3. 통합 목록의 Task 에 `spaceId` 가 없거나 모르는 공간이면 공간 칸은 `-` — Task 2 테스트.
4. 통합 목록에서 팀을 고르면 그 팀 Task 로, "전체"를 고르면 다시 통합으로 — Task 3 수동 확인.
5. 사이드바 접힘(아이콘만)에서 팀 배지가 그 팀 보드로 이동 — Task 4 수동 확인.

---

### Task 1: `useCurrentSpace` — 항상 `?space=` 붙이기, `isAll` 노출

**Files:**
- Modify: `src/hooks/useSpaces.ts` (`useCurrentSpace`)
- Modify: `src/hooks/AGENTS.md` (useSpaces 행)

**Interfaces:**
- Produces: `useCurrentSpace(projectId?)` → `{space, spaces, spaceId, isAll: boolean, setSpace: (id: string | null) => void, withSpace: (href: string, spaceId?: string) => string}`
  - `isAll` = URL 에 `space` 파라미터가 없음.
  - `withSpace(href, id = space?.id)` → 항상 `href?space=<id>`(href 에 `?` 있으면 `&`). id 없으면 href 그대로.
  - `setSpace(id)` → `space=id` 설정, `null` 이면 파라미터 삭제(통합).
  - `space`/`spaceId` 해석은 그대로(요청한 공간, 없으면 기본).

- [ ] **Step 1:** 위 시그니처대로 구현. 기본 공간 특별 처리(`isDefault` 면 생략·삭제) 제거.
- [ ] **Step 2:** `npx tsc --noEmit` — 기존 호출부(`withSpace(href)`, `setSpace(id)`)가 그대로 컴파일되는지. Expected: 오류 없음.
- [ ] **Step 3:** hooks AGENTS.md 의 useSpaces 행을 새 동작으로 고치고 커밋 `feat(cira): 공간 링크에 기본 공간도 ?space= 를 붙이고 isAll 노출`.

### Task 2: `IssueTable` — 통합 목록용 "공간" 열

**Files:**
- Modify: `src/components/issue/IssueTable.tsx`
- Test: `src/components/issue/IssueTable.test.tsx`
- Modify: `src/components/issue/AGENTS.md` (IssueTable 카드)

**Interfaces:**
- Produces: prop `spaceNames?: Record<string, string>` (spaceId → 이름). 있으면 고정 컬럼 모드에서 `sys:key` 다음에 "공간" 열, 값 `spaceNames[issue.spaceId ?? ""] ?? "-"`. 동적 컬럼 모드에서는 무시.

- [ ] **Step 1: 실패 테스트**
```tsx
it("spaceNames 가 있으면 고정 컬럼에 공간 열", () => {
    // issues: [{...base, id:"a", spaceId:"s1"}, {...base, id:"b", spaceId:null}]
    render(<IssueTable issues={issues} projectId="p1" spaceNames={{s1: "HW팀"}}/>);
    expect(screen.getByRole("columnheader", {name: "공간"})).toBeInTheDocument();
    expect(screen.getByText("HW팀")).toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
});
it("spaceNames 가 없으면 공간 열 없음", () => {
    render(<IssueTable issues={issues} projectId="p1"/>);
    expect(screen.queryByRole("columnheader", {name: "공간"})).toBeNull();
});
```
(이 파일의 기존 render 래퍼·QueryClient 설정을 그대로 쓴다.)
- [ ] **Step 2:** `npx vitest run src/components/issue/IssueTable.test.tsx` → 새 테스트 FAIL.
- [ ] **Step 3:** 구현. `sys:space` 고정 필드(이름 "공간", 너비 `w-28`)를 `sys:key` 뒤에 끼우고 셀은 `FieldValue` 대신 위 값을 직접 그린다.
- [ ] **Step 4:** 같은 명령 → PASS.
- [ ] **Step 5:** 카드에 prop 추가, 커밋 `feat(cira): IssueTable 에 공간 열(spaceNames)`.

### Task 3: Task 목록 — `?space=` 없으면 통합

**Files:**
- Modify: `src/app/(cira)/cira/projects/[projectId]/issues/page.tsx`
- Modify: `src/app/(cira)/cira/projects/[projectId]/issues/AGENTS.md`

**Interfaces:**
- Consumes: Task 1 `isAll`, `spaces`, `setSpace`; Task 2 `spaceNames`.

- [ ] **Step 1:** `isAll` 이면: `useIssues(projectId, {...filters, spaceId: undefined})`, 제목 "Task (전체)", `IssueTable` 에 `fields`/`columns` 대신 `spaceNames={Object.fromEntries(spaces.map(s => [s.id, s.name]))}`, ColumnPicker 숨김, `CreateIssueModal spaceId={undefined}`(모달의 공간 선택 사용). 아니면 지금 그대로.
- [ ] **Step 2:** 필터 줄에 공간 `Select`(`@/components/ui/Input`, aria-label "작업 공간"): 첫 항목 "전체"(value ""), 그다음 공간들. 값 = `isAll ? "" : spaceId`. 바꾸면 `setSpace(value || null)`.
- [ ] **Step 3:** `npx tsc --noEmit` 통과.
- [ ] **Step 4:** L3 issues 문서(화면 구성·데이터·기능)에 통합/팀 모드 기록, 커밋 `feat(cira): Task 목록 — ?space= 없으면 모든 공간 통합`.

### Task 4: 사이드바 팀 트리

**Files:**
- Modify: `src/components/cira/shell/navContext.ts`, `navContext.test.ts`
- Modify: `src/components/cira/shell/CiraSidebar.tsx`
- Modify: `src/components/cira/AGENTS.md` (CiraSidebar 카드), `src/components/AGENTS.md` (셸 행), `src/app/(cira)/cira/projects/AGENTS.md`

**Interfaces:**
- Consumes: Task 1 `withSpace(href, spaceId)`, `isAll`, `space`.
- Produces (navContext.ts, 순수 함수):
  - `teamLinks(base: string, canManage: boolean): {suffix: string; label: string}[]` → `[{"/boards","보드"}, {"/issues","Task"}, ...(canManage ? [{"/settings/space","공간 설정"}] : [])]`
  - `teamActive(pathname: string, base: string, suffix: string, teamId: string, currentSpaceId: string | undefined, isAll: boolean): boolean` → 경로가 `base+suffix` 이거나 그 하위이고, `currentSpaceId === teamId` 이며, `suffix === "/issues" && isAll` 이 아님.

- [ ] **Step 1: 실패 테스트** (`navContext.test.ts`)
```ts
it("teamLinks", () => {
    expect(teamLinks("/cira/projects/p1", false).map((l) => l.label)).toEqual(["보드", "Task"]);
    expect(teamLinks("/cira/projects/p1", true).map((l) => l.label)).toEqual(["보드", "Task", "공간 설정"]);
});
it("teamActive — 기본 팀 Task 와 통합 Task 구분, 옛 /boards 링크는 기본 팀", () => {
    const b = "/cira/projects/p1";
    expect(teamActive(`${b}/issues`, b, "/issues", "def", "def", true)).toBe(false);   // 통합
    expect(teamActive(`${b}/issues`, b, "/issues", "def", "def", false)).toBe(true);   // ?space=def
    expect(teamActive(`${b}/boards`, b, "/boards", "def", "def", true)).toBe(true);    // 옛 링크
    expect(teamActive(`${b}/boards/x`, b, "/boards", "hw", "def", false)).toBe(false);  // 다른 팀
});
```
- [ ] **Step 2:** `npx vitest run src/components/cira/shell` → FAIL.
- [ ] **Step 3:** 두 함수 구현 → 같은 명령 PASS.
- [ ] **Step 4:** `CiraSidebar` 프로젝트 블록(설정 화면 밖):
  - 통합 메뉴: Feature (전체 통합) · Task (전체)(`${base}/issues`, 활성 = 경로 일치 && `isAll`) · 백로그 · 리포트 · 릴리스 · 위키 · 프로젝트 설정(ADMIN). 보드·"공간 설정" 항목은 통합 메뉴에서 뺀다.
  - 공간 select 제거. 공간마다 버튼(팀 이름, `ChevronRight`/`ChevronDown`)으로 펼침 토글. 펼침 = `useState<Set<string>>` ∪ 지금 공간(`space?.id`, 설정 화면이 아닐 때). 펼친 팀 아래 `teamLinks(base, sp.canManage)` 를 `NavItem`(href `withSpace(base+suffix, sp.id)`, active `teamActive(...)`, 더 깊은 들여쓰기 `pl-10`).
  - 팀 목록 끝에 ADMIN 이면 "+ 작업 공간 추가"(기존 `CreateSpaceModal`, 만든 뒤 `setSpace(sp.id)`).
  - 접힘(`collapsed`): 팀마다 이름 앞 두 글자 배지 링크 → `withSpace(base + "/boards", sp.id)`, `title` = 팀 이름.
  - 설정 화면 안(`inSettings`) 블록은 그대로.
- [ ] **Step 5:** `npx tsc --noEmit`, `npm test`, `npm run docs:check` 통과.
- [ ] **Step 6:** 문서 3곳(셸 카드: 드롭다운 → 팀 트리·통합 메뉴, 카탈로그 셸 행, projects L3 하위 메뉴 설명) 갱신, 커밋 `feat(cira): 사이드바 작업 공간 드롭다운 → 팀별 메뉴 트리`.

### Task 5: 브라우저 확인 (mock 모드)

- [ ] `npm run dev`(worktree, mock) → 프로젝트 진입. mock 은 기본 공간 하나뿐이라 "+ 작업 공간 추가"로 팀 하나를 더 만든 뒤 확인(mock Task 는 spaceId 가 없어 공간 칸은 `-`): 통합 메뉴 + 기본 팀 펼침, 팀 Task 와 Task (전체) 활성 표시가 다름, 통합 목록에 공간 열·필터, 필터로 팀 이동/전체 복귀, 사이드바 접힘 배지, 콘솔 오류 없음. 스크린샷 1장.
