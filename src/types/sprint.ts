export type SprintStatus = "CREATED" | "ACTIVE" | "COMPLETED";

export interface SprintResponse {
    id: string;
    projectId: string;
    sprintNm: string;
    goal?: string;
    status: SprintStatus;
    startDt?: string;
    endDt?: string;
    issueCount?: number;
    createdAt: string;
    modifiedAt: string;
}

export interface CreateSprintRequest {
    sprintNm: string;
    goal?: string;
    startDt?: string;
    endDt?: string;
}

export interface UpdateSprintRequest {
    sprintNm?: string;
    goal?: string;
    startDt?: string;
    endDt?: string;
}

export type CompleteSprintIncompleteAction = "BACKLOG" | "NEXT_SPRINT";

export interface CompleteSprintRequest {
    incompleteIssueAction: CompleteSprintIncompleteAction;
    nextSprintId?: string;
}
