# L2 · Query 훅 (`src/hooks/`)

> 계층: [L1 프로젝트](../../AGENTS.md) › **L2 hooks**
> 컴포넌트와 API 함수 사이의 계층입니다. 컴포넌트는 `lib/api`를 직접 부르지 않고 이 훅을 씁니다.

## 1. 규칙

- 파일 하나가 도메인 하나를 맡습니다: `use{Domain}.ts`. 첫 줄은 `"use client"`입니다.
- 이름: 조회는 `useX` / `useXs`, 변경은 `useCreateX` / `useUpdateX` / `useDeleteX` / `use{동사}X`.
- queryKey는 `[도메인, id, ...필터]`입니다. id가 없을 수 있으면 `enabled: !!id`를 둡니다.
- mutation `onSuccess`에서 영향받는 queryKey를 **모두** `invalidateQueries` 합니다. 예: 스프린트에 이슈를 추가하면 `["sprints", projectId]`와 `["issues", projectId]`를 함께 무효화합니다.
- 토스트(UI)는 훅에 넣지 않습니다. 컴포넌트가 `mutate(data, {onSuccess, onError})`로 처리합니다.

```ts
export function useCreateMilestone(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMilestoneRequest) => createMilestone(projectId, data),
        onSuccess: () => queryClient.invalidateQueries({queryKey: ["milestones", projectId]}),
    });
}
```

## 2. 훅 · queryKey 목록

새 키를 만들기 전에 이 표에서 기존 키를 먼저 확인하세요.

| 파일 | export | queryKey |
|---|---|---|
| useProjects | useProjects, useProject, useCreateProject, useUpdateProject | `["projects"]`, `["projects", projectId]` |
| useProjectSettings | useProjectMembers, useAdd/UpdateRole/RemoveProjectMember, useWorkflowStatuses, useCreate/DeleteWorkflowStatus, useWorkflowTransitions, useUpdateWorkflowTransitions | `["projects", projectId, "members"]`, `[…, "workflow", "statuses"]`, `[…, "workflow", "transitions"]` |
| useIssues | useIssues, useIssue, useAvailableTransitions, useCreate/Update/DeleteIssue, useUpdateIssueStatus | `["issues", projectId, filters]`, `["issue", issueId]`, `["issue-transitions", issueId]` |
| useComments | useComments, useCreate/Update/DeleteComment, useAdd/RemoveReaction | `["comments", issueId]` |
| useAttachments | useAttachments, useUpload/DeleteAttachment | `["attachments", issueId]` |
| useBoards | useBoards, useBoardDetail, useCreate/Update/DeleteBoard, useAdd/Update/DeleteColumn, useMoveIssue | `["boards", projectId]`, `["board", boardId]` |
| useSprints | useSprints, useSprint, useCreate/Update/Delete/Start/CompleteSprint, useAdd/RemoveIssueFrom(To)Sprint | `["sprints", projectId]`, `["sprint", sprintId]` |
| useVersions | useVersions, useCreate/Update/Delete/Release/ArchiveVersion, useReleaseNotes | `["versions", projectId]`, `["releaseNotes", versionId]` |
| useMilestones | useMilestones, useCreate/Update/DeleteMilestone, useMilestoneProgress | `["milestones", projectId]`, `["milestoneProgress", milestoneId]` |
| useReports | useBurndown, useVelocity, useCfd, useDashboard | `["burndown", sprintId]`, `["velocity", projectId, lastN]`, `["cfd", projectId, start, end]`, `["dashboard"]` |
| useSearch | useSearchIssues, useSavedFilters, useSave/DeleteFilter | `["search-issues", params]`, `["saved-filters"]` |
| useCqlSearch | useCqlSearch, useCqlValidate, useCqlAutocomplete | `["cql-search", cql, page, size]`, `["cql-validate", …]`, `["cql-autocomplete", …]` |
| useWiki | useWikiTree, useWikiPage, useWikiVersions, useCreate/Update/DeleteWikiPage | `["wiki-tree", projectId]`, `["wiki-page", pageId]`, `["wiki-versions", pageId]` |
| useAutomation | useAutomationRules, useCreate/Update/DeleteAutomationRule, useRuleExecutions | `["automation-rules", projectId]`, `["rule-executions", ruleId]` |
| useGitIntegration | useGitRepos, useRegister/DeleteGitRepo, useGitActivity | `["git-repos", projectId]`, `["git-activity", projectId]` |
| useNotifications | useNotifications (SSE 구독, Query 아님) | — |

**키 이름 표기:** 기존 키는 camelCase(`milestoneProgress`)와 kebab-case(`wiki-tree`)가 섞여 있습니다. 새 키는 **kebab-case**로 씁니다.

**훅이 없는 쿼리** (컴포넌트에서 직접 `useQuery`): NotificationBell(`["notifications-unread-count"]`, `["notifications", "recent"]`), notifications 페이지. 새로 작업할 때는 `useNotificationList` 같은 훅으로 옮기는 것이 좋습니다.

## 3. 특수 훅

- **useNotifications**: `EventSource`로 `${NEXT_PUBLIC_BACKEND_URL}/api/v1/notifications/subscribe?token=…`을 구독합니다. 연결이 끊기면 다시 연결하고, 알림이 오면 토스트를 띄웁니다. `layout/NotificationMount`에서 한 번만 사용합니다.
- **useCqlValidate**: 입력값을 500ms debounce한 뒤 검증 API를 호출합니다.
- useNotifications는 SSE 이벤트를 토스트로 바로 보여 주기 위해 예외적으로 훅 안에서 `useToast`를 씁니다. 일반 훅에서는 따라 하지 마세요.
