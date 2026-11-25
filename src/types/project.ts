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
    /** 기준정보 프로젝트 타입 id (GET /v1/cira/project-types) */
    projectTypeId: string;
}

export interface UpdateProjectRequest {
    name: string;
    description?: string;
    /** 기준정보 프로젝트 타입 id (GET /v1/cira/project-types) */
    projectTypeId: string;
}
