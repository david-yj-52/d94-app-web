# L3 · 화면: 프로젝트 목록 + 프로젝트 공통 구조 (CIRA)

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 projects**
> 하위 화면: [issues](./[projectId]/issues/AGENTS.md) · [boards](./[projectId]/boards/AGENTS.md) · [sprints](./[projectId]/sprints/AGENTS.md) · [reports](./[projectId]/reports/AGENTS.md) · [settings](./[projectId]/settings/AGENTS.md) · [versions](./[projectId]/versions/AGENTS.md) · [wiki](./[projectId]/wiki/AGENTS.md)

## 개요
- **URL:** `/projects` · **파일:** `page.tsx` (클라이언트)
- **목적:** CIRA의 진입점입니다. 프로젝트 목록과 생성 기능이 있습니다. 로그인 후 `/`로 들어오면 이 화면으로 redirect됩니다.

## 화면 구성
```
projects/page.tsx
├── 헤더 "프로젝트" + [+ 프로젝트 생성] 버튼
├── 로딩: SkeletonCard × n                          → ui 카드
├── 그리드(1/2/3열): ProjectCard                    → project 카드
├── 빈 상태 "프로젝트가 없습니다."
└── {showCreate && <CreateProjectModal/>}          → project 카드
```

## 프로젝트 하위 공통 구조 (`[projectId]/`)
```
[projectId]/
├── issues/   boards/   sprints/        page에서 직접 <ProjectNav/>
└── reports/  settings/ versions/ wiki/  layout.tsx에서 <ProjectNav/> (+ 제목/서브탭)
```
- `ProjectNav` 탭 순서: 이슈 · 보드 · 스프린트 · 버전 · 리포트 · Wiki · 설정(ADMIN만) → [project 카드](../../../components/project/AGENTS.md)
- 화면 상단에 `프로젝트 / 화면명` 형태의 브레드크럼을 직접 마크업합니다(공통 컴포넌트 없음, `ui/Breadcrumb` 승격 후보).
- `/projects/:id`(index) 페이지는 없습니다. ProjectCard를 클릭하면 `/issues`로 이동합니다.
- **새 하위 탭을 추가할 때:**
  1. `[projectId]/{탭}/` 폴더를 만듭니다.
  2. `ProjectNav`의 `tabs` 배열에 탭을 추가합니다.
  3. 필요하면 `layout.tsx`에서 공통 헤더를 렌더링합니다.
  4. L3 문서를 작성합니다.

## 데이터
- `useProjects()` → `GET /v1/projects` (`["projects"]`), `useCreateProject`
- 하위 화면 공통: `useProject(projectId)` (`["projects", projectId]`)로 프로젝트 이름을 표시합니다.

## 기능 (L4)
### 프로젝트 생성
- CreateProjectModal의 필드는 키, 이름, 설명, 프로젝트 유형입니다. 생성에 성공하면 "프로젝트가 생성되었습니다." 토스트를 띄우고 `["projects"]`를 무효화합니다.
