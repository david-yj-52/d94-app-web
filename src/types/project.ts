export interface ProjectResponse {
    id: string;
    key: string;
    name: string;
    description: string;
    /** 타입 이름 (= projectTypeNm, 옛 클라이언트용) */
    projectType: string;
    projectTypeId?: string | null;
    projectTypeNm?: string | null;
    ownerId: string;
    issueSequence: number;
}

export interface CreateProjectRequest {
    key: string;
    name: string;
    description?: string;
    /** 기본 작업 공간의 스타터 프리셋 (기준정보 프로젝트 타입 id, GET /v1/cira/project-types). 없으면 첫 타입 */
    projectTypeId?: string;
    /** 기본 작업 공간 이름 (없으면 General) */
    defaultSpaceName?: string;
}

export interface UpdateProjectRequest {
    name: string;
    description?: string;
    /** 기준정보 프로젝트 타입 id (GET /v1/cira/project-types) */
    projectTypeId: string;
}
