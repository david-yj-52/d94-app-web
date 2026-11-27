export interface ProjectResponse {
    id: string;
    key: string;
    name: string;
    description: string;
    ownerId: string;
    issueSequence: number;
}

export interface CreateProjectRequest {
    key: string;
    name: string;
    description?: string;
    /** 기본 작업 공간의 스타터 프리셋 id (GET /v1/cira/project-types). 없으면 첫 프리셋. 프로젝트에는 남지 않는다 (V660) */
    presetTypeId?: string;
    /** 기본 작업 공간 이름 (없으면 General). spaces 가 있으면 무시 */
    defaultSpaceName?: string;
    /** 처음 만들 작업 공간들 (첫 번째 = 기본 공간, presetTypeId 없음 = 빈 공간, 관리자 = 만든 사람, 최대 10개) */
    spaces?: {name: string; presetTypeId?: string | null}[];
}

export interface UpdateProjectRequest {
    name: string;
    description?: string;
}
