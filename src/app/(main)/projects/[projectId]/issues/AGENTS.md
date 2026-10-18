# L3 · 화면: 이슈 (CIRA)

> 계층: [L1](../../../../../../AGENTS.md) › [L2 app](../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 issues**
> 컴포넌트 카드: [issue](../../../../../components/issue/AGENTS.md)

## 개요
| URL | 파일 | 설명 |
|---|---|---|
| `/projects/:projectId/issues` | `page.tsx` (135줄) | 이슈 목록·필터·생성 |
| `/projects/:projectId/issues/:issueId` | `[issueId]/page.tsx` (398줄) | 이슈 상세·인라인 편집·댓글·첨부·삭제 |

- 진입: ProjectCard 클릭(프로젝트의 기본 탭), ProjectNav "이슈", 칸반 카드 클릭

## 화면 구성
```
issues/page.tsx
├── ProjectNav                                   → project 카드
├── 브레드크럼 + "이슈 목록" + [+ 이슈 생성]
├── IssueFilter (filters 상태는 페이지가 보유)       → issue 카드
├── 로딩: SkeletonRow × n / 결과: IssueTable        → ui · issue 카드
└── {showCreate && <CreateIssueModal/>} + {ToastComponent}

issues/[issueId]/page.tsx
├── 브레드크럼 (프로젝트 / 이슈 목록 / {issueKey}) + ··· 더보기 메뉴(삭제)
├── 좌측 본문
│   ├── 제목·설명: InlineText (페이지 내부 컴포넌트)
│   ├── AttachmentSection issueId                → issue 카드
│   └── CommentSection issueId                   → issue 카드
├── 우측 사이드바: 상태 전이 버튼 · 우선순위 select · 담당자/보고자 · 스토리 포인트 · 마감일 · 생성/수정 시각
└── 삭제 확인 다이얼로그 (표준 삭제 다이얼로그의 원본)
```

## 데이터
| 훅 | API | queryKey |
|---|---|---|
| `useIssues(projectId, filters)` | `GET /v1/projects/:id/issues` | `["issues", projectId, filters]` |
| `useIssue(issueId)` | `GET /v1/issues/:id` | `["issue", issueId]` |
| `useAvailableTransitions(issueId)` | 전이 가능한 상태 목록 | `["issue-transitions", issueId]` |
| `useCreateIssue` / `useUpdateIssue` / `useUpdateIssueStatus` / `useDeleteIssue` | 생성·수정·상태 변경·삭제 | 위 키 무효화 |

## 기능 (L4)
### 목록 필터링
- `IssueFilter`가 `filters`를 바꾸면 queryKey가 바뀌어 다시 조회합니다(필터 상태는 페이지가 갖는 controlled 패턴).
### 이슈 생성
- CreateIssueModal에서 생성에 성공하면 "이슈가 생성되었습니다." 토스트를 띄웁니다.
### 인라인 편집 (상세)
- 제목, 설명, 스토리 포인트는 `InlineText`로 편집합니다. 클릭하면 편집 모드가 되고, blur나 Enter로 저장합니다(`update({field})`).
- 우선순위는 select를 바꾸면 바로 저장되고, 마감일은 date input에서 blur할 때 저장됩니다. 결과는 "저장되었습니다." 또는 "저장에 실패했습니다." 토스트로 알립니다.
### 상태 전이 (워크플로우)
- `useAvailableTransitions`로 **현재 상태에서 갈 수 있는 상태**만 버튼으로 보여 줍니다. 전이 규칙은 [settings/workflow](../settings/AGENTS.md)에서 정의합니다.
### 삭제
- 더보기(···) → 삭제 → 확인 다이얼로그 → 삭제 성공 시 목록으로 이동합니다.
### 댓글 · 첨부
- 섹션 컴포넌트가 각자 처리합니다(멘션, 이모지 반응, 답글, DnD 업로드 50MB). → [issue 카드](../../../../../components/issue/AGENTS.md)

## 주의·예외
- `InlineText`가 상세 페이지 안에 정의되어 있습니다. 다른 곳에서도 인라인 편집이 필요하면 `ui/InlineEditable`로 승격하세요.
- 상세 로딩 스켈레톤을 `Skeleton` 컴포넌트 없이 직접 마크업했습니다.
- 담당자는 표시만 되고 변경 UI가 없습니다.
