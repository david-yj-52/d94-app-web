/** d94-query SprintService STAT_PLANNED / STAT_ACTIVE / STAT_COMPLETED 값 그대로 */
export type SprintStatus = "Planned" | "Active" | "Completed";

export interface SprintResponse {
    id: string;
    projectId: string;
    sprintNm: string;
    goal?: string;
    sprintStat: SprintStatus;
    startDt?: string;
    endDt?: string;
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
