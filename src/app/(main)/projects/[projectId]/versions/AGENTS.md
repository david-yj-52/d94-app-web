# L3 · 화면: 버전 · 마일스톤 (CIRA)

> 계층: [L1](../../../../../../AGENTS.md) › [L2 app](../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 versions**
> 컴포넌트 카드: [version](../../../../../components/version/AGENTS.md) · [milestone (카탈로그 §5)](../../../../../components/AGENTS.md)

## 개요
- **URL:** `/projects/:projectId/versions` · **파일:** `layout.tsx`(ProjectNav), `page.tsx` (252줄)
- **목적:** 릴리즈 단위(버전)와 목표 단위(마일스톤)를 탭 두 개로 관리합니다.

## 화면 구성
```
versions/layout.tsx → ProjectNav + {children}
versions/page.tsx
├── 탭: [버전] [마일스톤]   (activeTab 상태)
├── 버전 탭
│   ├── [+ 버전 생성] · 빈 상태 "버전이 없습니다."
│   ├── VersionCard × n  (onEdit / onDelete / onRelease / onArchive, isActioning)   → version 카드
│   │   └── (RELEASED) ReleaseNotesModal
│   └── {showCreateVersion || editVersion} && <VersionModal editTarget/>
└── 마일스톤 탭
    ├── [+ 마일스톤 생성] · 빈 상태 "마일스톤이 없습니다."
    ├── MilestoneCard × n  (진행률 바)                                            → 카탈로그 §5
    └── {showCreateMilestone || editMilestone} && <MilestoneModal editTarget/>
```
**카드 + 겸용 모달(create/edit) + 액션 콜백** 조합의 기준 예시입니다. 새 CRUD 목록 화면은 이 구성을 따르세요.

## 데이터
- 버전: `useVersions(projectId)` `["versions", projectId]`, `useRelease/Archive/DeleteVersion`, (모달) `useCreate/UpdateVersion`, (노트) `useReleaseNotes`
- 마일스톤: `useMilestones(projectId)` `["milestones", projectId]`, `useDeleteMilestone`, (카드) `useMilestoneProgress`, (모달) `useCreate/UpdateMilestone`

## 기능 (L4)
### 버전 수명주기
- 미릴리즈 → **릴리즈**(`RELEASED`, 릴리즈 노트 열람 가능) → **아카이브**(`ARCHIVED`)
- 처리 중인 카드는 `actionVersionId`로 표시하고 버튼을 막습니다(`isActioning`).
### 마일스톤 진행률
- 카드마다 `useMilestoneProgress`로 완료 비율을 조회해 진행률 바로 표시합니다.
### 생성·수정·삭제
- 모든 결과는 토스트로 알립니다("버전이 릴리즈되었습니다." 등). 삭제할 때는 `confirm()`으로 확인합니다.

## 주의·예외
- 삭제 확인에 브라우저 `confirm()`을 씁니다.
- 마일스톤은 이 화면에서만 쓰지만 `components/milestone/` 폴더가 따로 있습니다(도메인 분리).
