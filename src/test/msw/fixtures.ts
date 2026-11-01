/**
 * d94-query 가 실제로 돌려주는 모양의 샘플 데이터 (타입: ./backendTypes).
 * 값은 아무거나 괜찮지만 **키와 형태는 Java DTO 와 같아야 한다**. DTO 가 바뀌면 여기도 바꾼다.
 */
import type {
    BackendApiResponse,
    BackendBoard,
    BackendBoardDetail,
    BackendComment,
    BackendIssue,
    BackendIssueStatus,
    BackendNotification,
    BackendPage,
    BackendProject,
    BackendProjectMember,
    BackendSprint,
    BackendUser,
    BackendUserSearch,
    BackendWorkflowStatus,
} from "./backendTypes";

export const ok = <T>(data: T): BackendApiResponse<T> => ({success: true, code: "200", message: "OK", data});
/** `ApiResponse.noContent()` — HTTP 200 에 data 키 없음 */
export const noContent = (): BackendApiResponse<never> => ({success: true, code: "204", message: "No Content"});
export const error = (code: string, message: string): BackendApiResponse<never> => ({success: false, code, message});

/** Spring `PageImpl` 직렬화 */
export function page<T>(all: T[], pageNumber = 0, pageSize = 20): BackendPage<T> {
    const content = all.slice(pageNumber * pageSize, pageNumber * pageSize + pageSize);
    const totalPages = Math.ceil(all.length / pageSize);
    const sort = {empty: true, sorted: false, unsorted: true};
    return {
        content,
        pageable: {pageNumber, pageSize, sort, offset: pageNumber * pageSize, paged: true, unpaged: false},
        last: pageNumber >= totalPages - 1,
        totalElements: all.length,
        totalPages,
        size: pageSize,
        number: pageNumber,
        sort,
        first: pageNumber === 0,
        numberOfElements: content.length,
        empty: content.length === 0,
    };
}

export const userKim: BackendUser = {email: "kim@d94.dev", name: "김개발", avatarUrl: null};
export const userLee: BackendUser = {email: "lee@d94.dev", name: "이기획", avatarUrl: null};

export const userSearch: BackendUserSearch[] = [
    {id: "USR-0001", name: "김개발", email: "kim@d94.dev", avatarUrl: null},
];

export const project: BackendProject = {
    id: "PRJ-1",
    key: "CIRA",
    name: "CIRA 프로젝트",
    description: null,
    projectType: "KANBAN",
    ownerId: "USR-0001",
    issueSequence: 2,
};

export const issue1: BackendIssue = {
    id: "ISS-1",
    issueKey: "CIRA-1",
    title: "로그인 버그",
    content: null,
    issueTypeId: "TYPE-BUG",
    issueTypeNm: "Bug",
    statusId: "ST-TODO",
    statusNm: "To Do",
    priority: "HIGH",
    storyPnt: 3,
    assignee: userKim,
    reporter: userLee,
    projectId: "PRJ-1",
    sprintId: null,
    dueDt: "2026-11-15",
    createdAt: "2026-10-30T09:00:00",
    modifiedAt: "2026-10-30T09:00:00",
};

export const issue2: BackendIssue = {
    ...issue1,
    id: "ISS-2",
    issueKey: "CIRA-2",
    title: "보드 정렬",
    assignee: null,
    storyPnt: null,
    dueDt: null,
};

export const transitions: BackendIssueStatus[] = [
    {id: "ST-PROG", statusNm: "In Progress", category: "IN_PROGRESS", colorCd: "#3b82f6", sortOrd: 2},
];

export const board: BackendBoard = {
    id: "BRD-1",
    projectId: "PRJ-1",
    boardNm: "메인 보드",
    boardType: "KANBAN",
    columnCount: 2,
    createdAt: "2026-10-01T09:00:00",
    modifiedAt: "2026-10-01T09:00:00",
};

const boardIssue = (id: string, key: string, statusId: string, rankStr: string) => ({
    id,
    issueKey: key,
    title: `이슈 ${key}`,
    priority: "MEDIUM",
    issueTypeId: "TYPE-TASK",
    issueTypeNm: "Task",
    statusId,
    statusNm: statusId === "ST-TODO" ? "To Do" : "Done",
    assignee: null,
    rankStr,
});

/** 컬럼 A: [A1, A2, A3], 컬럼 B: [B1] */
export function boardDetail(): BackendBoardDetail {
    return {
        id: "BRD-1",
        projectId: "PRJ-1",
        boardNm: "메인 보드",
        boardType: "KANBAN",
        createdAt: "2026-10-01T09:00:00",
        modifiedAt: "2026-10-01T09:00:00",
        columns: [
            {
                id: "COL-A", boardId: "BRD-1", statusId: "ST-TODO", statusNm: "To Do", statusCategory: "TODO",
                colorCd: null, columnNm: "할 일", wipLimit: null, sortOrd: 1,
                issues: [
                    boardIssue("A1", "CIRA-11", "ST-TODO", "0|a"),
                    boardIssue("A2", "CIRA-12", "ST-TODO", "0|b"),
                    boardIssue("A3", "CIRA-13", "ST-TODO", "0|c"),
                ],
            },
            {
                id: "COL-B", boardId: "BRD-1", statusId: "ST-DONE", statusNm: "Done", statusCategory: "DONE",
                colorCd: "#22c55e", columnNm: "완료", wipLimit: 5, sortOrd: 2,
                issues: [boardIssue("B1", "CIRA-21", "ST-DONE", "0|a")],
            },
        ],
    };
}

export const sprint: BackendSprint = {
    id: "SPR-1",
    projectId: "PRJ-1",
    sprintNm: "Sprint 1",
    goal: null,
    startDt: "2026-10-20",
    endDt: "2026-11-03",
    sprintStat: "Active",
    createdAt: "2026-10-19T09:00:00",
    modifiedAt: "2026-10-20T09:00:00",
};

/** 다음 스프린트 후보 (계획 중) */
export const sprintPlanned: BackendSprint = {
    ...sprint,
    id: "SPR-2",
    sprintNm: "Sprint 2",
    startDt: null,
    endDt: null,
    sprintStat: "Planned",
};

/** d94-query 운영 DB 의 varchar(255) 컬럼: 이슈 content, 댓글 content, 알림 msg, 프로젝트 descr */
export const VARCHAR_LIMIT = 255;

export const comment: BackendComment = {
    id: "CMT-1",
    issueId: "ISS-1",
    parentId: null,
    content: "확인했습니다",
    author: userKim,
    replies: [
        {
            id: "CMT-2", issueId: "ISS-1", parentId: "CMT-1", content: "감사합니다", author: userLee,
            replies: [], reactions: [], createdAt: "2026-10-30T10:05:00", modifiedAt: "2026-10-30T10:05:00",
        },
    ],
    reactions: [{reactionType: "👍", count: 2, reacted: true}],
    createdAt: "2026-10-30T10:00:00",
    modifiedAt: "2026-10-30T10:00:00",
};

/** 최신순. 첫 번째는 안 읽음 + ISSUE 리소스, 두 번째는 읽음 + 리소스 없음 */
export function notifications(): BackendNotification[] {
    return [
        {
            id: "NTF-2", userId: "USR-0001", type: "ISSUE_ASSIGNED", title: "CIRA-1 담당자로 지정됨",
            message: "로그인 버그", resourceType: "ISSUE", resourceId: "ISS-1", issueKey: "CIRA-1",
            read: false, createdAt: "2026-10-31T08:59:00",
        },
        {
            id: "NTF-1", userId: "USR-0001", type: "SPRINT_STARTED", title: "Sprint 1 시작",
            message: null, resourceType: null, resourceId: null, issueKey: null,
            read: true, createdAt: "2026-10-30T09:00:00",
        },
    ];
}

export const members: BackendProjectMember[] = [
    {userId: "USR-0001", email: "kim@d94.dev", userNm: "김개발", avatarUrl: null, role: "ADMIN"},
    {userId: "USR-0002", email: "lee@d94.dev", userNm: "이기획", avatarUrl: null, role: "DEVELOPER"},
];

/** 일부러 sortOrd 순서가 아니게 둔다 (첫 상태 = sortOrd 최솟값 "ST-TODO") */
export const workflowStatuses: BackendWorkflowStatus[] = [
    {id: "ST-PROG", statusNm: "In Progress", category: "IN_PROGRESS", colorCd: "#3b82f6", sortOrd: 2},
    {id: "ST-TODO", statusNm: "To Do", category: "TODO", colorCd: null, sortOrd: 1},
    {id: "ST-DONE", statusNm: "Done", category: "DONE", colorCd: "#22c55e", sortOrd: 3},
];
