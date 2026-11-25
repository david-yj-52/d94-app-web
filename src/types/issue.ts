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
    startedAt?: string;
    resolvedAt?: string;
    createdAt: string;
    modifiedAt: string;
    /** {"cf:<id>": 값}. 값이 있는 사용자 정의 필드만 */
    customFields?: Record<string, CustomFieldValue>;
}

/** 사용자 정의 필드 값: TEXT·URL·DATE·DATETIME·SELECT·USER → string, NUMBER → number, MULTI_SELECT → string[], CHECKBOX → boolean */
export type CustomFieldValue = string | number | boolean | string[] | null;

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
    /** null·"" = 값 삭제 */
    customFields?: Record<string, CustomFieldValue>;
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
    /** null·"" = 값 삭제 */
    customFields?: Record<string, CustomFieldValue>;
}

export interface IssueFilterParams {
    status?: string[];
    priority?: string;
    assigneeId?: string;
    issueType?: string;
    sprintId?: string;
    keyword?: string;
    /** "sys:dueDate,asc" (sys: 키만) */
    sort?: string;
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
