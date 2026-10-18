export type WorkflowCategory = "TODO" | "IN_PROGRESS" | "DONE";

export interface WorkflowStatusResponse {
    id: string;
    statusNm: string;
    category: WorkflowCategory;
    colorCd?: string;
    sortOrd: number;
}

export interface CreateWorkflowStatusRequest {
    statusNm: string;
    category: WorkflowCategory;
    colorCd?: string;
    sortOrd?: number;
}

export interface WorkflowTransitionResponse {
    fromStatusId: string;
    toStatusId: string;
}

export interface UpdateWorkflowTransitionsRequest {
    transitions: WorkflowTransitionResponse[];
}
