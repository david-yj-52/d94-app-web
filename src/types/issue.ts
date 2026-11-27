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
    /** 작업 공간. null = 공통 레이어 (COMMON Feature) */
    spaceId?: string | null;
    /** Feature 유형만 */
    featureScope?: "COMMON" | "UNIT" | null;
    /** 연결된 Feature (Task → Feature, UNIT Feature → COMMON Feature) */
    featureId?: string | null;
    /** 단건 조회만: 설명의 원본인 Docs 메인 노트 (content = 그 본문) */
    mainNoteId?: string | null;
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
    /** Docs 메인 노트의 첫 본문이 된다 (Task 에 따로 저장하지 않음) */
    content?: string;
    issueTypeId?: string;
    /** 없으면 기본 공간 */
    spaceId?: string;
    featureScope?: "COMMON" | "UNIT";
    featureId?: string;
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
    /** 메인 노트 본문(frontmatter·진행 경과 제외)을 바꾼다 */
    content?: string;
    /** "" = 연결 해제 */
    featureId?: string;
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
    spaceId?: string;
    featureId?: string;
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
