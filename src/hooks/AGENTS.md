# L2 · Query 훅 (`src/hooks/`)

> 계층: [L1 프로젝트](../../AGENTS.md) › **L2 hooks**
> 컴포넌트와 API 함수 사이의 계층입니다. 컴포넌트는 `lib/api`를 직접 부르지 않고 이 훅을 씁니다.

## 1. 규칙

- 파일 하나가 도메인 하나를 맡습니다: `use{Domain}.ts`. 첫 줄은 `"use client"`입니다.
- 이름: 조회는 `useX` / `useXs`, 변경은 `useCreateX` / `useUpdateX` / `useDeleteX` / `use{동사}X`.
- queryKey는 `[도메인, id, ...필터]`입니다. id가 없을 수 있으면 `enabled: !!id`를 둡니다.
- mutation `onSuccess`에서 영향받는 queryKey를 **모두** `invalidateQueries` 합니다. 예: 스프린트에 이슈를 추가하면 `["sprints", projectId]`와 `["issues", projectId]`를 함께 무효화합니다.
- 토스트(UI)는 훅에 넣지 않습니다. 컴포넌트가 `mutate(data, {onSuccess, onError})`로 처리합니다.
- 테스트: `useIssues`·`useBoards`·`useSprints`·`useComments`·`useProjects`·`useNotifications` 옆의 `*.test.ts(x)` 가 아래 표의 queryKey 와 mutation 별 invalidate 대상을 그대로 고정합니다. 키를 바꾸면 테스트와 이 표를 함께 고칩니다. `useMoveIssue` 의 칸반 순서 계산(낙관적 갱신·롤백, `beforeIssueId === issueId` 면 제자리)도 `useBoards.test.ts` 에 있습니다 → [docs/testing.md](../../docs/testing.md)

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
| useProjectSettings | useProjectMembers, useAdd/UpdateRole/RemoveProjectMember, useWorkflowStatuses(projectId, spaceId?), useCreate/DeleteWorkflowStatus, useWorkflowTransitions(projectId, spaceId?), useUpdateWorkflowTransitions | `["projects", projectId, "members"]`, `[…, "workflow", "statuses", spaceId]`, `[…, "workflow", "transitions", spaceId]` (spaceId 없음 = `null` = 기본 작업 공간. 무효화는 spaceId 없는 앞부분 키로) |
| useIssues | useIssues, useIssue, useAvailableTransitions, useCreate/Update/DeleteIssue, useUpdateIssueStatus | `["issues", projectId, filters]`, `["issue", issueId]`, `["issue-transitions", issueId]` |
| useFields | useFieldCatalog, useProjectTypes, useCreate/Update/DeleteProjectType, useReplaceProjectTypeFields, useSave/DeleteGlobalField, useSave/DeleteTypeField, useImportToType, useFieldUsage, useProjectFields, useReplaceProjectFields, useSave/DeleteProjectField, useFieldLibrary, useImportToProject, useColumnPref, useSaveColumnPref | `["field-catalog"]`, `["project-types"]`, `["field-usage", id]`, `["project-fields", projectId, spaceId]`, `["field-library", projectId]`, `["column-pref", projectId, spaceId]` (V650: 필드 세트·컬럼은 작업 공간 소유, `useProjectFields`·`useReplaceProjectFields`·`useSaveProjectField`·`useImportToProject`·`useColumnPref`·`useSaveColumnPref` 가 spaceId 를 받는다, 없음 = 기본 공간). 기준정보 변경(타입·세트·전역 필드) → 카탈로그·타입·모든 `project-fields`·`column-pref`·`issues` 무효화(타입 이름 변경은 `projects` 도). 타입 필드·전역 → 타입 가져오기도 기준정보 변경과 같다. 프로젝트 필드 변경·가져오기 → 그 프로젝트의 `project-fields`·`field-library`·`column-pref`·`issues`. 컬럼 저장은 응답으로 `setQueryData` (`null` = 기본값으로) |
| useComments | useComments, useCreate/Update/DeleteComment, useToggleReaction | `["comments", issueId]` |
| useAttachments | useAttachments, useUpload/DeleteAttachment (업로드는 start → 768KB 조각 PUT(1회 재시도) → complete, 진행률 = 조각 비율) | `["attachments", issueId]` |
| useBoards | useBoards(projectId, spaceId?), useBoardDetail, useCreate/Update/DeleteBoard, useAdd/Update/DeleteColumn, useMoveIssue | `["boards", projectId, spaceId]`(없음 = `null` = 기본 공간), `["board", boardId]` |
| useSprints | useSprints, useSprint, useBacklog, useCreate/Update/Delete/Start/CompleteSprint, useAdd/RemoveIssueFrom(To)Sprint | `["sprints", projectId]`, `["sprint", sprintId]`, `["backlog", projectId]` (완료·이슈 추가/제거 시 무효화) |
| useVersions | useVersions, useCreate/Update/Delete/Release/ArchiveVersion, useReleaseNotes | `["versions", projectId]`, `["releaseNotes", versionId]` |
| useMilestones | useMilestones, useCreate/Update/DeleteMilestone, useMilestoneProgress | `["milestones", projectId]`, `["milestoneProgress", milestoneId]` |
| useReports | useBurndown, useVelocity, useCfd, useDashboard | `["burndown", sprintId]`, `["velocity", projectId, lastN]`, `["cfd", projectId, start, end]`, `["dashboard"]` |
| useSearch | useSearchIssues, useSavedFilters, useSave/DeleteFilter | `["search-issues", params]`, `["saved-filters"]` |
| useCqlSearch | useCqlSearch, useCqlValidate, useCqlAutocomplete | `["cql-search", cql, page, size]`, `["cql-validate", …]`, `["cql-autocomplete", …]` |
| useWiki | useWikiTree, useWikiPage, useWikiVersions, useCreate/Update/DeleteWikiPage | `["wiki-tree", projectId]`, `["wiki-page", pageId]`, `["wiki-versions", pageId]` |
| useAutomation | useAutomationRules, useCreate/Update/DeleteAutomationRule, useRuleExecutions | `["automation-rules", projectId]`, `["rule-executions", ruleId]` |
| useGitIntegration | useGitRepos, useRegister/DeleteGitRepo, useGitActivity | `["git-repos", projectId]`, `["git-activity", projectId]` |
| useNotifications | useNotifications (30초 폴링 + 새 알림 토스트) | `["notifications", "recent"]` (NotificationBell 과 공유) |
| useStudy | useStudyDocuments, useStudyDocument, useSaveStudyPosition, useDeleteStudyDocument, useReparseStudyDocument, useUploadStudyDocument, useStudyToc, useStudyPage, useStudyTerms, useCreateStudyTerm, useUpdateStudyTerm, useDeleteStudyTerm, useStudyAnnotations, useCreateStudyAnnotation, useUpdateStudyAnnotation, useDeleteStudyAnnotation | `["studyDocuments"]`(PARSING 있으면 3초 재조회), `["studyDocument", id]`, `["studyToc", id]`, `["studyPage", id, pageSectionId]`, `["studyTerms", documentId ?? "global"]`, `["studyAnnotations", documentId ?? "all"]`. 재분석 시작 → 문서·목차·페이지·노트·문장 분석 캐시 무효화. 단어 변경 → studyTerms·studyPage, 마킹 변경 → studyPage·studyAnnotations 무효화. 위치 저장은 무효화 대신 `["studyDocument", id]` 를 `setQueryData` (스크롤마다 재조회하지 않게) |
| useInterfaceTests | useInterfaceTestItems, useInterfaceCall | `["interface-tests"]` (useInterfaceCall 은 변경 메서드 2xx 시 무효화) |
| useLifeMetric | useMetricTemplates, useMetrics, useMetric, useMetricLogs, useCreateMetric, useUpdateMetric, useDeleteMetric, usePutMetricInputs, useAddMetricLog, useDeleteMetricLog, useFormulaPreview | `["life-metric","templates"]`, `["life-metric","metrics"]`, `["life-metric","metrics",id]`, `["life-metric","metrics",id,"logs"]`, `["life-metric","preview",{formula,inputs}]` (400ms 디바운스). mutation 은 `["life-metric"]` 전체 무효화 (`@code` 참조 때문) |
| useInfra | useInfraNodes, useInfraNode, useInfraMetrics, useSaveInfraNode({node, originalKey?}), useDeleteInfraNode, useSaveInfraService(nodeKey), useDeleteInfraService(nodeKey) | `["infra","nodes"]`, `["infra","nodes",nodeKey]`, `["infra","nodes",nodeKey,"metrics",range]` (모두 60초 `refetchInterval`). mutation 은 `["infra"]` 전체 무효화 |
| useSettings | useSettings, useUpdateSettings, useMe, useIsAdmin | `["settings"]` (저장 성공 시 응답으로 `setQueryData`), `["users", "me"]`. `useIsAdmin` = `roles` 에 `ADMIN` 포함 (화면 표시용, 권한 검사는 백엔드) |
| useApiTokens | useApiTokens, useIssueApiToken, useRevokeApiToken, useApiTokenServices, useSetApiTokenService | `["apiTokens"]` (발급·폐기 성공 시 invalidate, exact), `["apiTokens", "services"]` (토글 성공 시 응답으로 `setQueryData`) |
| useDocs | useDocsVaults, useDocsFolders(vaultId), useCreate/Rename/Move/DeleteDocsFolder, useNotes(filters, enabled?), useNote, useNoteTitles, useNoteTitleFetcher(에디터 자동완성용 fetchQuery, 같은 `docsTitles` 캐시), useNoteVersions, useBacklinks, useCreate/Update/Move/DeleteNote, useAutosaveNote(결과를 `["docsNote", id]` 에만 setQueryData, 무효화 없음), useUploadDocsImage(주소 반환), useInvalidateDocs, useDeriveNote, useChangeNoteKind, useLineage, useDocsTasks, useSetDocsTaskStatus, usePromoteDocsTask | `["docsVaults"]`, `["docsFolders", vaultId]`, `["docsNotes", filters]`, `["docsNote", id]`, `["docsTitles", prefix]`, `["docsNoteVersions", id]`, `["docsBacklinks", id]`, `["docsLineage", id]`, `["docsTasks", filters]`. 폴더 변경 → `docsFolders`. 노트·Task 변경 → `invalidateDocs`("docs" 로 시작하는 키 전부: 이름 변경이 다른 노트의 링크·백링크·Task 를 바꾸므로) |
| useCiraDocs | useIssueTypes, useDocRules, useSaveDocRules, useIssueDocs, useEnsureIssueMainDoc, useDeriveIssueDoc, usePromoteNoteToCira({projectId, noteId, issueTypeId?, title?, spaceId?}) | `["issueTypes"]`, `["docRules", projectId]`, `["docsIssue", projectId, issueId]`(“docs” 로 시작 → `invalidateDocs` 대상). 기준정보 저장 → `docRules`. 메인 생성·파생·승격 → `invalidateDocs`(승격은 `["issues"]` 도) |
| useSpaces | useSpaces, useCurrentSpace(지금 공간 = URL `?space=`, 없으면 기본 공간 · `setSpace`·`withSpace(href)`), useCreate/Update/DeleteSpace, useFeatures(projectId, spaceId?), useCommonFeatures(projectId)(공통 Feature id → Feature Map, 보드·목록 우선 배지), useGlobalDocRules, useSaveGlobalDocRules, useImportDocRules, useSpaceDocRules, useSaveSpaceDocRules | `["spaces", projectId]`, `["features", projectId, spaceId]`, `["global-doc-rules"]`, `["space-doc-rules", spaceId]`. 공간 변경 → `spaces`·`features`. 가져오기 → `docRules`·`space-doc-rules`. 규칙 저장은 응답으로 `setQueryData` |
| useAuth | useRegister, useLogin | — (mutation 만, 캐시 없음. 둘 다 자격 증명을 암호화해 보냄. `useLogin` 결과 boolean = 자격 증명 일치) |

**키 이름 표기:** 기존 키는 camelCase(`milestoneProgress`)와 kebab-case(`wiki-tree`)가 섞여 있습니다. 새 키는 **kebab-case**로 씁니다.

**훅이 없는 쿼리** (컴포넌트에서 직접 `useQuery`): NotificationBell(`["notifications-unread-count"]`, `["notifications", "recent"]`), notifications 페이지. 새로 작업할 때는 `useNotificationList` 같은 훅으로 옮기는 것이 좋습니다.

## 3. 특수 훅

- **useNotifications**: `getNotifications(0, 10)`을 30초마다 폴링합니다(`refetchInterval`, 화면이 숨겨지면 멈춤). 첫 결과는 기준선으로만 쓰고, 이후 처음 보는 안 읽은 알림만 토스트로 띄우며 `["notifications-unread-count"]`를 무효화합니다. SSE 는 쓰지 않습니다(브라우저에 토큰을 내려야 하고 UMD 가 스트리밍 미지원, [ADR 0005](../../docs/decisions/0005-backend-token-server-only.md)). `layout/NotificationMount`에서 한 번만 사용합니다.
- **useCqlValidate**: 입력값을 500ms debounce한 뒤 검증 API를 호출합니다.
- useNotifications는 새 알림을 토스트로 바로 보여 주기 위해 예외적으로 훅 안에서 `useToast`를 씁니다. 일반 훅에서는 따라 하지 마세요.
