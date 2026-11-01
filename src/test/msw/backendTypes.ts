/**
 * d94-query 응답 DTO 를 JSON 으로 옮긴 타입. **web 타입(`@/types/*`)을 쓰지 않는다** — 둘이 다른 곳을 테스트가 잡아야 하기 때문.
 * 원본: d94-query `apService/cira/dto/*.java`, `tsh.d94.lib.core.apService.auth.dto.UserResponse`, `ApiResponse`.
 * Jackson 기본값 기준: LocalDateTime → "2026-10-31T09:00:00", LocalDate → "2026-10-31", BigDecimal·Short → number, null 필드는 null.
 */

/** lib-core `ApiResponse` (`@JsonInclude(NON_NULL)` → data 가 null 이면 키가 빠진다) */
export interface BackendApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data?: T;
}

/** lib-core `UserResponse` — 사용자 objId 가 없다 */
export interface BackendUser {
    email: string;
    name: string;
    avatarUrl: string | null;
}

/** Spring Data `PageImpl` 직접 직렬화 (d94-query 에 `@EnableSpringDataWebSupport(VIA_DTO)` 없음) */
export interface BackendPage<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {empty: boolean; sorted: boolean; unsorted: boolean};
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: {empty: boolean; sorted: boolean; unsorted: boolean};
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export interface BackendIssue {
    id: string;
    issueKey: string;
    title: string;
    content: string | null;
    issueTypeId: string | null;
    issueTypeNm: string | null;
    statusId: string | null;
    statusNm: string | null;
    priority: string | null;
    storyPnt: number | null;
    assignee: BackendUser | null;
    reporter: BackendUser | null;
    projectId: string;
    sprintId: string | null;
    dueDt: string | null;
    createdAt: string;
    modifiedAt: string;
}

export interface BackendIssueStatus {
    id: string;
    statusNm: string;
    category: string;
    colorCd: string | null;
    sortOrd: number;
}

export interface BackendProject {
    id: string;
    key: string;
    name: string;
    description: string | null;
    projectType: string;
    ownerId: string;
    issueSequence: number;
}

export interface BackendBoard {
    id: string;
    projectId: string;
    boardNm: string;
    boardType: string;
    columnCount: number;
    createdAt: string;
    modifiedAt: string;
}

export interface BackendBoardIssue {
    id: string;
    issueKey: string;
    title: string;
    priority: string | null;
    issueTypeId: string | null;
    issueTypeNm: string | null;
    statusId: string | null;
    statusNm: string | null;
    assignee: BackendUser | null;
    rankStr: string | null;
}

export interface BackendBoardColumn {
    id: string;
    boardId: string;
    statusId: string | null;
    statusNm: string | null;
    statusCategory: string | null;
    colorCd: string | null;
    columnNm: string;
    wipLimit: number | null;
    sortOrd: number;
    issues: BackendBoardIssue[];
}

export interface BackendBoardDetail {
    id: string;
    projectId: string;
    boardNm: string;
    boardType: string;
    columns: BackendBoardColumn[];
    createdAt: string;
    modifiedAt: string;
}

/** d94-query `SprintService` STAT_PLANNED / STAT_ACTIVE / STAT_COMPLETED */
export type BackendSprintStat = "Planned" | "Active" | "Completed";

/**
 * 상태 필드 이름이 `sprintStat`, 값은 "Planned"|"Active"|"Completed" 이다
 * (web 은 `status` 에 "CREATED"|"ACTIVE"|"COMPLETED"). `issueCount` 없음
 */
export interface BackendSprint {
    id: string;
    projectId: string;
    sprintNm: string;
    goal: string | null;
    startDt: string | null;
    endDt: string | null;
    sprintStat: BackendSprintStat;
    createdAt: string;
    modifiedAt: string;
}

/** 반응 이름이 `reactionType` 이다 (web 은 `emoji`) */
export interface BackendCommentReaction {
    reactionType: string;
    count: number;
    reacted: boolean;
}

export interface BackendComment {
    id: string;
    issueId: string;
    parentId: string | null;
    content: string;
    author: BackendUser | null;
    replies: BackendComment[];
    reactions: BackendCommentReaction[];
    createdAt: string;
    modifiedAt: string;
}

export interface BackendNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string | null;
    resourceType: string | null;
    resourceId: string | null;
    issueKey: string | null;
    read: boolean;
    createdAt: string;
}

/** `/v1/users/search` → `UserSearchResponse` (여기에는 id 가 있다) */
export interface BackendUserSearch {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
}

/** `ProjectMemberResponse` — 이름은 `userNm`, role 은 ADMIN | DEVELOPER | REPORTER | VIEWER */
export interface BackendProjectMember {
    userId: string;
    email: string;
    userNm: string;
    avatarUrl: string | null;
    role: string;
}

/** `WorkflowStatusResponse` */
export interface BackendWorkflowStatus {
    id: string;
    statusNm: string;
    category: string;
    colorCd: string | null;
    sortOrd: number;
}
