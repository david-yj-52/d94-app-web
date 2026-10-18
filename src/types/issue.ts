export type Priority = "HIGHEST" | "HIGH" | "MEDIUM" | "LOW" | "LOWEST";

export interface UserSummary {
    email: string;
    name: string;
    avatarUrl?: string;
}

export interface IssueResponse {
    id: string;
    issueKey: string;
    title: string;
    content?: string;
    issueTypeId?: string;
    issueTypeNm?: string;
    statusId?: string;
    statusNm?: string;
    priority?: Priority;
    storyPnt?: number;
    assignee?: UserSummary;
    reporter?: UserSummary;
    projectId: string;
    sprintId?: string;
    dueDt?: string;
    createdAt: string;
    modifiedAt: string;
}

export interface IssueStatusResponse {
    id: string;
    statusNm: string;
    category: string;
    colorCd?: string;
    sortOrd: number;
}

export interface CreateIssueRequest {
    title: string;
    content?: string;
    issueTypeId?: string;
    statusId?: string;
    priority?: Priority;
    storyPnt?: number;
    assigneeId?: string;
    sprintId?: string;
    dueDt?: string;
}

export interface UpdateIssueRequest {
    title?: string;
    content?: string;
    statusId?: string;
    priority?: Priority;
    storyPnt?: number;
    assigneeId?: string;
    sprintId?: string;
    dueDt?: string;
}

export interface IssueFilterParams {
    status?: string[];
    priority?: string;
    assigneeId?: string;
    issueType?: string;
    sprintId?: string;
    keyword?: string;
    page?: number;
    size?: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
